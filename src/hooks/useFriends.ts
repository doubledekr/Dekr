import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  or,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, auth, functions } from '../../services/firebase-platform';
import { FriendEdge, UserProfile } from '../types/firestore';

// Types for hook returns
interface UseFriendRequestsResult {
  requests: FriendEdge[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseMyFriendsResult {
  friends: UserProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseSearchUsersResult {
  users: UserProfile[];
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
}

interface UseSendFriendRequestResult {
  sendFriendRequest: (toUserId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseRespondToFriendRequestResult {
  respondToFriendRequest: (requestId: string, response: 'accepted' | 'declined') => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Helper function to convert Firestore data
const convertFirestoreToFriendEdges = (docs: any[]): FriendEdge[] => {
  return docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      requestedAt: data.requestedAt?.toDate() || new Date(),
      respondedAt: data.respondedAt?.toDate() || null,
    } as FriendEdge;
  });
};

const convertFirestoreToUserProfiles = (docs: any[]): UserProfile[] => {
  return docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      ...data,
      joinedAt: data.joinedAt?.toDate() || new Date(),
      lastActiveAt: data.lastActiveAt?.toDate() || new Date(),
    } as UserProfile;
  });
};

// Helper function to get current user info
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return {
    uid: user.uid,
    displayName: user.displayName || 'Anonymous',
    photoURL: user.photoURL || undefined,
  };
};

// Hook to fetch incoming friend requests
export const useFriendRequests = (): UseFriendRequestsResult => {
  const [requests, setRequests] = useState<FriendEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setRequests([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    const friendsRef = collection(firestore, 'friends');
    const q = query(
      friendsRef,
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const requestData = convertFirestoreToFriendEdges(snapshot.docs);
          setRequests(requestData);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing friend requests:', err);
          setError('Failed to load friend requests');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching friend requests:', err);
        setError('Failed to load friend requests');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { requests, loading, error, refetch };
};

// Hook to fetch user's friends
export const useMyFriends = (): UseMyFriendsResult => {
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = getCurrentUser();
      
      // Get accepted friend relationships
      const friendsRef = collection(firestore, 'friends');
      const q = query(
        friendsRef,
        or(
          where('fromUserId', '==', user.uid),
          where('toUserId', '==', user.uid)
        ),
        where('status', '==', 'accepted')
      );

      const snapshot = await getDocs(q);
      const friendEdges = convertFirestoreToFriendEdges(snapshot.docs);
      
      // Extract friend user IDs
      const friendIds = friendEdges.map(edge => 
        edge.fromUserId === user.uid ? edge.toUserId : edge.fromUserId
      );

      if (friendIds.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Get friend profiles
      const usersRef = collection(firestore, 'users');
      const friendProfiles: UserProfile[] = [];
      
      // Batch get friend profiles (Firestore has limit of 10 for 'in' queries)
      const batchSize = 10;
      for (let i = 0; i < friendIds.length; i += batchSize) {
        const batch = friendIds.slice(i, i + batchSize);
        const batchQuery = query(usersRef, where('__name__', 'in', batch));
        const batchSnapshot = await getDocs(batchQuery);
        const batchProfiles = convertFirestoreToUserProfiles(batchSnapshot.docs);
        friendProfiles.push(...batchProfiles);
      }

      setFriends(friendProfiles);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { friends, loading, error, refetch };
};

// Hook to search for users
export const useSearchUsers = (): UseSearchUsersResult => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string): Promise<void> => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const usersRef = collection(firestore, 'users');
      
      // Search by display name (case-insensitive)
      // Note: This is a simple implementation. For production, consider using
      // Algolia or similar service for better full-text search
      const displayNameQuery = query(
        usersRef,
        where('displayName', '>=', query),
        where('displayName', '<=', query + '\uf8ff'),
        where('isPublic', '==', true),
        limit(20)
      );

      // Search by email (exact match for privacy)
      const emailQuery = query(
        usersRef,
        where('email', '==', query.toLowerCase()),
        where('isPublic', '==', true),
        limit(5)
      );

      const [displayNameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(displayNameQuery),
        getDocs(emailQuery)
      ]);

      const displayNameResults = convertFirestoreToUserProfiles(displayNameSnapshot.docs);
      const emailResults = convertFirestoreToUserProfiles(emailSnapshot.docs);

      // Combine and deduplicate results
      const allResults = [...displayNameResults, ...emailResults];
      const uniqueResults = allResults.filter((user, index, self) => 
        index === self.findIndex(u => u.uid === user.uid)
      );

      // Filter out current user
      const filteredResults = uniqueResults.filter(u => u.uid !== user.uid);

      setUsers(filteredResults);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
      setLoading(false);
    }
  }, []);

  return { users, loading, error, search };
};

// Hook to send friend requests
export const useSendFriendRequest = (): UseSendFriendRequestResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendFriendRequest = useCallback(async (toUserId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Use Cloud Function for friend request to ensure proper validation
      const sendFriendRequestFn = httpsCallable(functions, 'sendFriendRequest');
      await sendFriendRequestFn({ toUserId });
    } catch (err: any) {
      console.error('Error sending friend request:', err);
      const errorMessage = err.message || 'Failed to send friend request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendFriendRequest, loading, error };
};

// Hook to respond to friend requests
export const useRespondToFriendRequest = (): UseRespondToFriendRequestResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const respondToFriendRequest = useCallback(async (
    requestId: string, 
    response: 'accepted' | 'declined'
  ): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      if (response === 'accepted') {
        // Use Cloud Function to accept friend request (creates symmetric edges)
        const acceptFriendRequestFn = httpsCallable(functions, 'acceptFriendRequest');
        await acceptFriendRequestFn({ requestId });
      } else {
        // Simply delete the request for decline
        const requestRef = doc(firestore, 'friends', requestId);
        await deleteDoc(requestRef);
      }
    } catch (err: any) {
      console.error('Error responding to friend request:', err);
      const errorMessage = err.message || `Failed to ${response} friend request`;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { respondToFriendRequest, loading, error };
};

// Hook to check friendship status
export const useFriendshipStatus = (userId: string) => {
  const [status, setStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !userId || user.uid === userId) {
      setStatus('none');
      setLoading(false);
      return;
    }

    const friendsRef = collection(firestore, 'friends');
    const q = query(
      friendsRef,
      or(
        where('fromUserId', '==', user.uid),
        where('toUserId', '==', user.uid)
      )
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const edges = convertFirestoreToFriendEdges(snapshot.docs);
      const relevantEdge = edges.find(edge => 
        (edge.fromUserId === user.uid && edge.toUserId === userId) ||
        (edge.fromUserId === userId && edge.toUserId === user.uid)
      );

      if (!relevantEdge) {
        setStatus('none');
      } else if (relevantEdge.status === 'accepted') {
        setStatus('friends');
      } else if (relevantEdge.fromUserId === user.uid) {
        setStatus('pending_sent');
      } else {
        setStatus('pending_received');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  return { status, loading };
};

// Hook to get mutual friends count
export const useMutualFriendsCount = (userId: string) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !userId || user.uid === userId) {
      setCount(0);
      setLoading(false);
      return;
    }

    const calculateMutualFriends = async () => {
      try {
        // This is a simplified implementation
        // In production, you might want to use a Cloud Function for better performance
        const friendsRef = collection(firestore, 'friends');
        
        // Get current user's friends
        const myFriendsQuery = query(
          friendsRef,
          or(
            where('fromUserId', '==', user.uid),
            where('toUserId', '==', user.uid)
          ),
          where('status', '==', 'accepted')
        );
        
        // Get target user's friends
        const theirFriendsQuery = query(
          friendsRef,
          or(
            where('fromUserId', '==', userId),
            where('toUserId', '==', userId)
          ),
          where('status', '==', 'accepted')
        );

        const [myFriendsSnapshot, theirFriendsSnapshot] = await Promise.all([
          getDocs(myFriendsQuery),
          getDocs(theirFriendsQuery)
        ]);

        const myFriends = convertFirestoreToFriendEdges(myFriendsSnapshot.docs);
        const theirFriends = convertFirestoreToFriendEdges(theirFriendsSnapshot.docs);

        const myFriendIds = myFriends.map(edge => 
          edge.fromUserId === user.uid ? edge.toUserId : edge.fromUserId
        );
        
        const theirFriendIds = theirFriends.map(edge => 
          edge.fromUserId === userId ? edge.toUserId : edge.fromUserId
        );

        const mutualCount = myFriendIds.filter(id => theirFriendIds.includes(id)).length;
        setCount(mutualCount);
        setLoading(false);
      } catch (err) {
        console.error('Error calculating mutual friends:', err);
        setCount(0);
        setLoading(false);
      }
    };

    calculateMutualFriends();
  }, [userId]);

  return { count, loading };
};

// Hook to get friend suggestions (simplified)
export const useFriendSuggestions = () => {
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        // Simple implementation: get recent public users
        // In production, you'd use more sophisticated algorithms
        const usersRef = collection(firestore, 'users');
        const q = query(
          usersRef,
          where('isPublic', '==', true),
          orderBy('joinedAt', 'desc'),
          limit(10)
        );

        const snapshot = await getDocs(q);
        const users = convertFirestoreToUserProfiles(snapshot.docs);
        
        // Filter out current user
        const filteredUsers = users.filter(u => u.uid !== user.uid);
        
        setSuggestions(filteredUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching friend suggestions:', err);
        setSuggestions([]);
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  return { suggestions, loading };
};
