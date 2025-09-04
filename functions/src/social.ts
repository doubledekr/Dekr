import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
// import { getAuth } from 'firebase-admin/auth'; // Unused import
import { logger } from 'firebase-functions';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const db = getFirestore();

// Validation schemas
const sendFriendRequestSchema = z.object({
  toUserId: z.string().min(1, 'Target user ID is required'),
});

const acceptFriendRequestSchema = z.object({
  requestId: z.string().min(1, 'Request ID is required'),
});

const createShareLinkSchema = z.object({
  type: z.enum(['deck', 'card'], { required_error: 'Type must be deck or card' }),
  targetId: z.string().min(1, 'Target ID is required'),
  permission: z.enum(['view', 'edit'], { required_error: 'Permission must be view or edit' }),
  expiresIn: z.number().optional(), // Days until expiration
});

// Helper function to check if user exists and get profile
async function getUserProfile(userId: string): Promise<any> {
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'User not found');
  }
  return { uid: userId, ...userDoc.data() };
}

// Helper function to check if friendship already exists
async function checkExistingFriendship(fromUserId: string, toUserId: string) {
  const friendsRef = db.collection('friends');
  
  // Check both directions
  const [outgoingQuery, incomingQuery] = await Promise.all([
    friendsRef
      .where('fromUserId', '==', fromUserId)
      .where('toUserId', '==', toUserId)
      .get(),
    friendsRef
      .where('fromUserId', '==', toUserId)
      .where('toUserId', '==', fromUserId)
      .get(),
  ]);

  return !outgoingQuery.empty || !incomingQuery.empty;
}

// Cloud Function: Send Friend Request
export const sendFriendRequest = onCall(
  {
    region: 'us-central1',
    enforceAppCheck: false, // Set to true in production
  },
  async (request) => {
    const { auth, data } = request;

    // Check authentication
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    // Validate input
    const { toUserId } = sendFriendRequestSchema.parse(data);
    const fromUserId = auth.uid;

    // Prevent self-friending
    if (fromUserId === toUserId) {
      throw new HttpsError('invalid-argument', 'Cannot send friend request to yourself');
    }

    try {
      // Check if target user exists
      const toUser = await getUserProfile(toUserId);
      const fromUser = await getUserProfile(fromUserId);

      // Check if friendship already exists
      const existingFriendship = await checkExistingFriendship(fromUserId, toUserId);
      if (existingFriendship) {
        throw new HttpsError('already-exists', 'Friend request already exists or users are already friends');
      }

      // Create friend request
      const friendRequest = {
        fromUserId,
        fromUserName: fromUser.displayName || 'Anonymous',
        fromUserPhoto: fromUser.photoURL || null,
        toUserId,
        toUserName: toUser.displayName || 'Anonymous',
        toUserPhoto: toUser.photoURL || null,
        status: 'pending',
        requestedAt: FieldValue.serverTimestamp(),
        mutualFriendsCount: 0, // TODO: Calculate mutual friends
      };

      const docRef = await db.collection('friends').add(friendRequest);

      logger.info(`Friend request sent from ${fromUserId} to ${toUserId}`, {
        requestId: docRef.id,
      });

      return {
        success: true,
        requestId: docRef.id,
        message: 'Friend request sent successfully',
      };
    } catch (error) {
      logger.error('Error sending friend request:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to send friend request');
    }
  }
);

// Cloud Function: Accept Friend Request
export const acceptFriendRequest = onCall(
  {
    region: 'us-central1',
    enforceAppCheck: false,
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { requestId } = acceptFriendRequestSchema.parse(data);
    const currentUserId = auth.uid;

    try {
      // Get the friend request
      const requestDoc = await db.collection('friends').doc(requestId).get();
      if (!requestDoc.exists) {
        throw new HttpsError('not-found', 'Friend request not found');
      }

      const requestData = requestDoc.data()!;
      
      // Verify the current user is the recipient
      if (requestData.toUserId !== currentUserId) {
        throw new HttpsError('permission-denied', 'You can only accept requests sent to you');
      }

      // Verify request is still pending
      if (requestData.status !== 'pending') {
        throw new HttpsError('failed-precondition', 'Friend request is no longer pending');
      }

      // Use batch to ensure atomicity
      const batch = db.batch();

      // Update the original request to accepted
      batch.update(requestDoc.ref, {
        status: 'accepted',
        respondedAt: FieldValue.serverTimestamp(),
      });

      // Create symmetric friendship edge
      const symmetricFriendship = {
        fromUserId: requestData.toUserId,
        fromUserName: requestData.toUserName,
        fromUserPhoto: requestData.toUserPhoto,
        toUserId: requestData.fromUserId,
        toUserName: requestData.fromUserName,
        toUserPhoto: requestData.fromUserPhoto,
        status: 'accepted',
        requestedAt: requestData.requestedAt,
        respondedAt: FieldValue.serverTimestamp(),
        mutualFriendsCount: requestData.mutualFriendsCount || 0,
      };

      const symmetricRef = db.collection('friends').doc();
      batch.set(symmetricRef, symmetricFriendship);

      // Update user profiles to increment friend counts
      const fromUserRef = db.collection('users').doc(requestData.fromUserId);
      const toUserRef = db.collection('users').doc(requestData.toUserId);
      
      batch.update(fromUserRef, {
        followingCount: FieldValue.increment(1),
      });
      
      batch.update(toUserRef, {
        followersCount: FieldValue.increment(1),
      });

      await batch.commit();

      logger.info(`Friend request accepted: ${requestId}`, {
        fromUserId: requestData.fromUserId,
        toUserId: requestData.toUserId,
      });

      return {
        success: true,
        message: 'Friend request accepted successfully',
      };
    } catch (error) {
      logger.error('Error accepting friend request:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to accept friend request');
    }
  }
);

// Cloud Function: Create Share Link
export const createShareLink = onCall(
  {
    region: 'us-central1',
    enforceAppCheck: false,
  },
  async (request) => {
    const { auth, data } = request;

    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { type, targetId, permission, expiresIn } = createShareLinkSchema.parse(data);
    const userId = auth.uid;

    try {
      // Verify user has permission to share the target
      let targetDoc;
      let targetData;

      if (type === 'deck') {
        targetDoc = await db.collection('decks').doc(targetId).get();
        if (!targetDoc.exists) {
          throw new HttpsError('not-found', 'Deck not found');
        }
        targetData = targetDoc.data()!;
        
        // Check if user owns the deck or is a collaborator
        if (targetData.ownerId !== userId && !targetData.collaborators?.includes(userId)) {
          throw new HttpsError('permission-denied', 'You do not have permission to share this deck');
        }
      } else if (type === 'card') {
        // For cards, we'll assume any authenticated user can share
        // You might want to add more specific logic here
      }

      // Generate unique share code
      const linkCode = nanoid(12);
      
      // Calculate expiration date
      let expiresAt = null;
      if (expiresIn && expiresIn > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresIn);
      }

      // Create share document
      const shareData = {
        type,
        targetId,
        itemTitle: type === 'deck' ? targetData?.title : `${targetId} Card`,
        sharedBy: userId,
        sharedByName: auth.token?.name || 'Anonymous',
        permission,
        linkCode,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: expiresAt ? FieldValue.serverTimestamp() : null,
        viewCount: 0,
        isActive: true,
        accessLog: [], // Track who accessed the share
      };

      const shareRef = await db.collection('shares').add(shareData);

      // Generate deep link URL
      const baseUrl = 'https://dekr.app'; // Replace with your actual domain
      const deepLink = `${baseUrl}/share/${linkCode}`;
      
      // For Firebase Dynamic Links (if implemented)
      const dynamicLink = `https://dekr.page.link/?link=${encodeURIComponent(deepLink)}&apn=com.pittsdev.dekr&ibi=com.pittsdev.dekr`;

      logger.info(`Share link created for ${type}:${targetId}`, {
        shareId: shareRef.id,
        linkCode,
        sharedBy: userId,
      });

      return {
        success: true,
        shareId: shareRef.id,
        linkCode,
        deepLink,
        dynamicLink,
        expiresAt: expiresAt?.toISOString() || null,
        message: 'Share link created successfully',
      };
    } catch (error) {
      logger.error('Error creating share link:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to create share link');
    }
  }
);

// Cloud Function: Access Share Link
export const accessShareLink = onCall(
  {
    region: 'us-central1',
    enforceAppCheck: false,
  },
  async (request) => {
    const { auth, data } = request;
    const { linkCode } = z.object({ linkCode: z.string() }).parse(data);

    try {
      // Find share by link code
      const shareQuery = await db
        .collection('shares')
        .where('linkCode', '==', linkCode)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (shareQuery.empty) {
        throw new HttpsError('not-found', 'Share link not found or expired');
      }

      const shareDoc = shareQuery.docs[0];
      const shareData = shareDoc.data();

      // Check if share has expired
      if (shareData.expiresAt && shareData.expiresAt.toDate() < new Date()) {
        // Mark as inactive
        await shareDoc.ref.update({ isActive: false });
        throw new HttpsError('failed-precondition', 'Share link has expired');
      }

      // Log access
      const accessEntry = {
        userId: auth?.uid || 'anonymous',
        timestamp: FieldValue.serverTimestamp(),
        userAgent: request.rawRequest?.headers?.['user-agent'] || 'unknown',
      };

      // Update view count and access log
      await shareDoc.ref.update({
        viewCount: FieldValue.increment(1),
        accessLog: FieldValue.arrayUnion(accessEntry),
      });

      // Get the target item
      let targetData = null;
      if (shareData.type === 'deck') {
        const deckDoc = await db.collection('decks').doc(shareData.targetId).get();
        if (deckDoc.exists) {
          targetData = { id: deckDoc.id, ...deckDoc.data() };
        }
      }

      logger.info(`Share link accessed: ${linkCode}`, {
        shareId: shareDoc.id,
        userId: auth?.uid || 'anonymous',
        type: shareData.type,
        targetId: shareData.targetId,
      });

      return {
        success: true,
        share: {
          id: shareDoc.id,
          type: shareData.type,
          targetId: shareData.targetId,
          itemTitle: shareData.itemTitle,
          permission: shareData.permission,
          sharedBy: shareData.sharedBy,
          sharedByName: shareData.sharedByName,
          createdAt: shareData.createdAt,
        },
        targetData,
        message: 'Share accessed successfully',
      };
    } catch (error) {
      logger.error('Error accessing share link:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to access share link');
    }
  }
);

// Trigger: Update mutual friends count when friendships are created
export const updateMutualFriendsCount = onDocumentCreated(
  'friends/{friendId}',
  async (event) => {
    const friendData = event.data?.data();
    if (!friendData || friendData.status !== 'accepted') {
      return;
    }

    try {
      const { fromUserId, toUserId } = friendData;

      // This is a simplified version - in production you might want to
      // implement a more efficient mutual friends calculation
      logger.info(`Updating mutual friends count for ${fromUserId} and ${toUserId}`);

      // TODO: Implement mutual friends calculation
      // This would involve finding common friends between the two users
      // and updating the mutualFriendsCount field in relevant friend documents

    } catch (error) {
      logger.error('Error updating mutual friends count:', error);
    }
  }
);

// Trigger: Clean up expired shares
export const cleanupExpiredShares = onSchedule(
  {
    schedule: '0 2 * * *', // Run daily at 2 AM
    timeZone: 'UTC',
    region: 'us-central1',
  },
  async (event) => {
    try {
      const now = new Date();
      const expiredSharesQuery = await db
        .collection('shares')
        .where('isActive', '==', true)
        .where('expiresAt', '<', now)
        .get();

      if (expiredSharesQuery.empty) {
        logger.info('No expired shares to clean up');
        return;
      }

      const batch = db.batch();
      expiredSharesQuery.docs.forEach(doc => {
        batch.update(doc.ref, { isActive: false });
      });

      await batch.commit();

      logger.info(`Cleaned up ${expiredSharesQuery.size} expired shares`);
    } catch (error) {
      logger.error('Error cleaning up expired shares:', error);
      // Don't throw in scheduled functions, just log the error
    }
  }
);
