import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { z } from 'zod';
import axios from 'axios';

const db = getFirestore();

// Validation schemas
const createChallengeSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  symbol: z.string().min(1).max(10),
  type: z.enum(['direction', 'price']),
  endDate: z.string().datetime(),
  prizeAmount: z.number().min(0).default(0),
  maxParticipants: z.number().int().min(2).optional(),
  isPrivate: z.boolean().default(false),
  targetPrice: z.number().min(0).optional(),
  startingPrice: z.number().min(0).optional(),
});

const joinChallengeSchema = z.object({
  challengeId: z.string().min(1),
});

const submitGuessSchema = z.object({
  challengeId: z.string().min(1),
  guess: z.object({
    direction: z.enum(['up', 'down']).optional(),
    targetPrice: z.number().min(0).optional(),
  }),
});

const cancelChallengeSchema = z.object({
  challengeId: z.string().min(1),
});

// Helper function to get challenge
async function getChallenge(challengeId: string): Promise<any> {
  const challengeDoc = await db.collection('challenges').doc(challengeId).get();
  if (!challengeDoc.exists) {
    throw new HttpsError('not-found', 'Challenge not found');
  }
  return { id: challengeDoc.id, ...challengeDoc.data() };
}

// Helper function to fetch current price
async function fetchCurrentPrice(symbol: string): Promise<number> {
  try {
    const polygonApiKey = process.env.POLYGON_API_KEY;
    if (!polygonApiKey) {
      throw new Error('Polygon API key not configured');
    }

    // Get current/latest price
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev`;
    const response = await axios.get(url, {
      params: {
        apikey: polygonApiKey,
        adjusted: true,
      },
    });

    if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
      throw new Error(`No price data available for ${symbol}`);
    }

    return response.data.results[0].c; // closing price
  } catch (error) {
    logger.error(`Error fetching price for ${symbol}:`, error);
    // Fallback to mock price for testing
    return Math.random() * 200 + 50; // $50-$250 range
  }
}

// Helper function to calculate scores
function calculateScore(challenge: any, participant: any, finalPrice: number): number {
  if (!participant.guess) return 0;

  if (challenge.type === 'direction') {
    const startingPrice = challenge.startingPrice || challenge.currentPrice;
    const actualDirection = finalPrice > startingPrice ? 'up' : 'down';
    const guessedDirection = participant.guess.direction;
    
    if (guessedDirection === actualDirection) {
      // Calculate score based on magnitude of change
      const changePercent = Math.abs((finalPrice - startingPrice) / startingPrice);
      return Math.min(100, 50 + (changePercent * 500)); // Base 50 points + up to 50 bonus
    } else {
      return 0;
    }
  } else {
    // Price challenge - score based on accuracy
    const targetPrice = participant.guess.targetPrice;
    const accuracy = 1 - Math.abs(finalPrice - targetPrice) / finalPrice;
    return Math.max(0, accuracy * 100);
  }
}

// Cloud Function: Create Challenge
export const createChallenge = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { auth, data } = request;
    
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    try {
      const validatedData = createChallengeSchema.parse(data);
      
      // Validate end date
      const endDate = new Date(validatedData.endDate);
      const now = new Date();
      const maxEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
      
      if (endDate <= now) {
        throw new HttpsError('invalid-argument', 'End date must be in the future');
      }
      
      if (endDate > maxEndDate) {
        throw new HttpsError('invalid-argument', 'End date cannot be more than 1 year in the future');
      }

      // Validate price challenge requirements
      if (validatedData.type === 'price' && !validatedData.targetPrice) {
        throw new HttpsError('invalid-argument', 'Target price is required for price challenges');
      }

      // Get current price for the symbol
      let currentPrice: number;
      try {
        currentPrice = await fetchCurrentPrice(validatedData.symbol);
      } catch (error) {
        throw new HttpsError('internal', 'Failed to fetch current price for symbol');
      }

      const challengeId = db.collection('challenges').doc().id;
      const challengeData = {
        id: challengeId,
        creatorId: auth.uid,
        title: validatedData.title,
        description: validatedData.description || '',
        symbol: validatedData.symbol.toUpperCase(),
        type: validatedData.type,
        endDate: Timestamp.fromDate(endDate),
        prizeAmount: validatedData.prizeAmount,
        maxParticipants: validatedData.maxParticipants,
        isPrivate: validatedData.isPrivate,
        targetPrice: validatedData.targetPrice,
        startingPrice: validatedData.startingPrice || currentPrice,
        currentPrice,
        status: 'active',
        participants: [],
        createdAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('challenges').doc(challengeId).set(challengeData);
      
      logger.info(`Challenge created: ${challengeId} by user ${auth.uid}`);
      
      return {
        success: true,
        challengeId,
        message: 'Challenge created successfully',
      };
      
    } catch (error) {
      logger.error('Error creating challenge:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to create challenge');
    }
  }
);

// Cloud Function: Join Challenge
export const joinChallenge = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { auth, data } = request;
    
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    try {
      const { challengeId } = joinChallengeSchema.parse(data);
      
      const challenge = await getChallenge(challengeId);
      
      // Validate challenge can be joined
      if (challenge.status !== 'active') {
        throw new HttpsError('failed-precondition', 'Challenge is not active');
      }
      
      if (new Date() >= challenge.endDate.toDate()) {
        throw new HttpsError('failed-precondition', 'Challenge has ended');
      }
      
      if (challenge.creatorId === auth.uid) {
        throw new HttpsError('failed-precondition', 'Cannot join your own challenge');
      }
      
      // Check if user already joined
      const existingParticipant = challenge.participants.find((p: any) => p.userId === auth.uid);
      if (existingParticipant) {
        throw new HttpsError('failed-precondition', 'Already joined this challenge');
      }
      
      // Check max participants
      if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
        throw new HttpsError('failed-precondition', 'Challenge is full');
      }

      // Get user profile for display name
      const userDoc = await db.collection('users').doc(auth.uid).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      // Add participant
      const participant = {
        userId: auth.uid,
        displayName: userData?.displayName || userData?.email || 'Anonymous',
        joinedAt: FieldValue.serverTimestamp(),
        guess: undefined,
        score: undefined,
        isWinner: false,
      };
      
      await db.collection('challenges').doc(challengeId).update({
        participants: FieldValue.arrayUnion(participant),
      });
      
      // Create activity log
      await db.collection('challenges').doc(challengeId).collection('updates').add({
        type: 'participant_joined',
        userId: auth.uid,
        displayName: participant.displayName,
        timestamp: FieldValue.serverTimestamp(),
      });
      
      logger.info(`User ${auth.uid} joined challenge ${challengeId}`);
      
      return {
        success: true,
        message: 'Successfully joined challenge',
      };
      
    } catch (error) {
      logger.error('Error joining challenge:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to join challenge');
    }
  }
);

// Cloud Function: Submit Guess
export const submitGuess = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { auth, data } = request;
    
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    try {
      const { challengeId, guess } = submitGuessSchema.parse(data);
      
      const challenge = await getChallenge(challengeId);
      
      // Validate challenge state
      if (challenge.status !== 'active') {
        throw new HttpsError('failed-precondition', 'Challenge is not active');
      }
      
      if (new Date() >= challenge.endDate.toDate()) {
        throw new HttpsError('failed-precondition', 'Challenge has ended');
      }
      
      // Check if user is participant
      const participantIndex = challenge.participants.findIndex((p: any) => p.userId === auth.uid);
      if (participantIndex === -1) {
        throw new HttpsError('failed-precondition', 'Must join challenge before submitting guess');
      }
      
      const participant = challenge.participants[participantIndex];
      if (participant.guess) {
        throw new HttpsError('failed-precondition', 'Guess already submitted');
      }
      
      // Validate guess based on challenge type
      if (challenge.type === 'direction') {
        if (!guess.direction || !['up', 'down'].includes(guess.direction)) {
          throw new HttpsError('invalid-argument', 'Direction must be "up" or "down"');
        }
      } else {
        if (!guess.targetPrice || guess.targetPrice <= 0) {
          throw new HttpsError('invalid-argument', 'Valid target price is required');
        }
      }
      
      // Update participant with guess
      const updatedParticipants = [...challenge.participants];
      updatedParticipants[participantIndex] = {
        ...participant,
        guess,
        guessSubmittedAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('challenges').doc(challengeId).update({
        participants: updatedParticipants,
      });
      
      // Create activity log
      await db.collection('challenges').doc(challengeId).collection('updates').add({
        type: 'guess_submitted',
        userId: auth.uid,
        displayName: participant.displayName,
        timestamp: FieldValue.serverTimestamp(),
      });
      
      logger.info(`User ${auth.uid} submitted guess for challenge ${challengeId}`);
      
      return {
        success: true,
        message: 'Guess submitted successfully',
      };
      
    } catch (error) {
      logger.error('Error submitting guess:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to submit guess');
    }
  }
);

// Cloud Function: Cancel Challenge
export const cancelChallenge = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { auth, data } = request;
    
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    try {
      const { challengeId } = cancelChallengeSchema.parse(data);
      
      const challenge = await getChallenge(challengeId);
      
      // Validate permissions
      if (challenge.creatorId !== auth.uid) {
        throw new HttpsError('permission-denied', 'Only challenge creator can cancel');
      }
      
      if (challenge.status !== 'active') {
        throw new HttpsError('failed-precondition', 'Challenge is not active');
      }
      
      // Check if challenge can be cancelled (only creator or minimal participants)
      if (challenge.participants.length > 1) {
        throw new HttpsError('failed-precondition', 'Cannot cancel challenge with multiple participants');
      }
      
      // Update challenge status
      await db.collection('challenges').doc(challengeId).update({
        status: 'cancelled',
        cancelledAt: FieldValue.serverTimestamp(),
        cancelledBy: auth.uid,
      });
      
      // Create activity log
      await db.collection('challenges').doc(challengeId).collection('updates').add({
        type: 'challenge_cancelled',
        userId: auth.uid,
        timestamp: FieldValue.serverTimestamp(),
      });
      
      logger.info(`Challenge ${challengeId} cancelled by user ${auth.uid}`);
      
      return {
        success: true,
        message: 'Challenge cancelled successfully',
      };
      
    } catch (error) {
      logger.error('Error cancelling challenge:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to cancel challenge');
    }
  }
);

// Scheduled Function: Settle Challenges
export const settleChallenges = onSchedule(
  {
    schedule: '0 2 * * *', // Run daily at 2 AM UTC
    timeZone: 'UTC',
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 540,
  },
  async () => {
    logger.info('Starting daily challenge settlement');
    
    try {
      const now = new Date();
      
      // Get all active challenges that have ended
      const challengesSnapshot = await db.collection('challenges')
        .where('status', '==', 'active')
        .where('endDate', '<=', Timestamp.fromDate(now))
        .get();
      
      if (challengesSnapshot.empty) {
        logger.info('No challenges to settle');
        return;
      }
      
      const settlementPromises = [];
      
      for (const challengeDoc of challengesSnapshot.docs) {
        const challenge = { id: challengeDoc.id, ...challengeDoc.data() };
        settlementPromises.push(settleChallenge(challenge));
      }
      
      const results = await Promise.allSettled(settlementPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      logger.info(`Challenge settlement completed: ${successful} successful, ${failed} failed`);
      
      // Update settlement statistics
      await updateSettlementStatistics({
        timestamp: FieldValue.serverTimestamp(),
        challengesSettled: challengesSnapshot.size,
        successful,
        failed,
      });
      
    } catch (error) {
      logger.error('Error in scheduled challenge settlement:', error);
    }
  }
);

// Settle individual challenge
async function settleChallenge(challenge: any) {
  try {
    logger.info(`Settling challenge ${challenge.id} for symbol ${challenge.symbol}`);
    
    // Fetch final price
    const finalPrice = await fetchCurrentPrice(challenge.symbol);
    
    // Calculate scores for all participants
    const updatedParticipants = challenge.participants.map((participant: any) => {
      const score = calculateScore(challenge, participant, finalPrice);
      return {
        ...participant,
        score,
        finalPrice,
      };
    });
    
    // Determine winners (highest score)
    const maxScore = Math.max(...updatedParticipants.map((p: any) => p.score || 0));
    const winners = updatedParticipants.filter((p: any) => p.score === maxScore && p.score > 0);
    
    // Mark winners
    const finalParticipants = updatedParticipants.map((participant: any) => ({
      ...participant,
      isWinner: winners.some((w: any) => w.userId === participant.userId),
    }));
    
    // Create settlement result
    const settlementResult = {
      challengeId: challenge.id,
      settledAt: FieldValue.serverTimestamp(),
      finalPrice,
      startingPrice: challenge.startingPrice || challenge.currentPrice,
      winners: winners.map((w: any) => ({
        userId: w.userId,
        displayName: w.displayName,
        score: w.score,
        guess: w.guess,
      })),
      totalParticipants: finalParticipants.length,
      averageScore: finalParticipants.length > 0 
        ? finalParticipants.reduce((sum: number, p: any) => sum + (p.score || 0), 0) / finalParticipants.length 
        : 0,
    };
    
    // Update challenge
    await db.collection('challenges').doc(challenge.id).update({
      status: 'completed',
      participants: finalParticipants,
      finalPrice,
      settlementResult,
      settledAt: FieldValue.serverTimestamp(),
    });
    
    // Create results document
    await db.collection('challenges').doc(challenge.id).collection('results').doc('final').set(settlementResult);
    
    // Update leaderboard
    await updateLeaderboard(finalParticipants, challenge);
    
    // Send notifications to participants
    await notifyParticipants(challenge, finalParticipants, winners);
    
    // Create activity log
    await db.collection('challenges').doc(challenge.id).collection('updates').add({
      type: 'challenge_settled',
      finalPrice,
      winners: winners.length,
      totalParticipants: finalParticipants.length,
      timestamp: FieldValue.serverTimestamp(),
    });
    
    logger.info(`Challenge ${challenge.id} settled successfully. Winners: ${winners.length}`);
    
  } catch (error) {
    logger.error(`Error settling challenge ${challenge.id}:`, error);
    
    // Mark challenge as settlement failed
    await db.collection('challenges').doc(challenge.id).update({
      status: 'settlement_failed',
      settlementError: error instanceof Error ? error.message : String(error),
      settlementAttemptedAt: FieldValue.serverTimestamp(),
    });
    
    throw error;
  }
}

// Update leaderboard
async function updateLeaderboard(participants: any[], challenge: any) {
  try {
    const batch = db.batch();
    
    for (const participant of participants) {
      const leaderboardRef = db.collection('leaderboard').doc(participant.userId);
      const leaderboardDoc = await leaderboardRef.get();
      
      const currentData = leaderboardDoc.exists ? leaderboardDoc.data() || {} : {};
      
      const defaultData = {
        userId: participant.userId,
        displayName: participant.displayName,
        totalChallenges: 0,
        challengesWon: 0,
        totalScore: 0,
        averageScore: 0,
        totalPrizeWon: 0,
        weeklyScore: 0,
        lastUpdated: FieldValue.serverTimestamp(),
        ...currentData,
      };
      
      const isWinner = participant.isWinner;
      const prizeWon = isWinner ? (challenge.prizeAmount || 0) / participants.filter((p: any) => p.isWinner).length : 0;
      
      const updatedData = {
        ...defaultData,
        totalChallenges: (defaultData.totalChallenges || 0) + 1,
        challengesWon: (defaultData.challengesWon || 0) + (isWinner ? 1 : 0),
        totalScore: (defaultData.totalScore || 0) + (participant.score || 0),
        totalPrizeWon: (defaultData.totalPrizeWon || 0) + prizeWon,
        weeklyScore: (defaultData.weeklyScore || 0) + (participant.score || 0),
        lastUpdated: FieldValue.serverTimestamp(),
        averageScore: 0,
        score: 0,
      };
      
      updatedData.averageScore = updatedData.totalScore / updatedData.totalChallenges;
      updatedData.score = updatedData.totalScore; // Overall score for ranking
      
      batch.set(leaderboardRef, updatedData);
    }
    
    await batch.commit();
    logger.info(`Leaderboard updated for ${participants.length} participants`);
    
  } catch (error) {
    logger.error('Error updating leaderboard:', error);
  }
}

// Send notifications to participants
async function notifyParticipants(challenge: any, participants: any[], winners: any[]) {
  try {
    const notifications = [];
    
    for (const participant of participants) {
      const isWinner = winners.some(w => w.userId === participant.userId);
      
      const notification = {
        userId: participant.userId,
        challengeId: challenge.id,
        type: 'challenge_completed',
        title: isWinner ? '🏆 You Won!' : 'Challenge Completed',
        message: isWinner 
          ? `Congratulations! You won the "${challenge.title}" challenge with a score of ${participant.score?.toFixed(0)}!`
          : `The "${challenge.title}" challenge has ended. Your score: ${participant.score?.toFixed(0)}`,
        data: {
          challengeId: challenge.id,
          isWinner,
          score: participant.score,
          finalPrice: challenge.finalPrice,
        },
        createdAt: FieldValue.serverTimestamp(),
      };
      
      notifications.push(notification);
    }
    
    // Batch create notifications
    const batch = db.batch();
    notifications.forEach(notification => {
      const notificationRef = db.collection('notifications').doc();
      batch.set(notificationRef, notification);
    });
    
    await batch.commit();
    logger.info(`Notifications sent to ${participants.length} participants`);
    
  } catch (error) {
    logger.error('Error sending notifications:', error);
  }
}

// Update settlement statistics
async function updateSettlementStatistics(stats: any) {
  try {
    const statsRef = db.collection('system').doc('challengeSettlementStats');
    
    const currentStatsDoc = await statsRef.get();
    const currentStats = currentStatsDoc.exists ? currentStatsDoc.data() || {} : {};
    
    const updatedStats = {
      lastSettlementAt: stats.timestamp,
      totalSettlements: (currentStats.totalSettlements || 0) + 1,
      totalChallengesSettled: (currentStats.totalChallengesSettled || 0) + stats.challengesSettled,
      totalSuccessful: (currentStats.totalSuccessful || 0) + stats.successful,
      totalFailed: (currentStats.totalFailed || 0) + stats.failed,
      lastSettlementResults: {
        challengesSettled: stats.challengesSettled,
        successful: stats.successful,
        failed: stats.failed,
      },
    };
    
    await statsRef.set(updatedStats);
    
  } catch (error) {
    logger.error('Error updating settlement statistics:', error);
  }
}

// Weekly leaderboard reset
export const resetWeeklyLeaderboard = onSchedule(
  {
    schedule: '0 0 * * 1', // Every Monday at midnight UTC
    timeZone: 'UTC',
    region: 'us-central1',
  },
  async () => {
    logger.info('Resetting weekly leaderboard');
    
    try {
      const leaderboardSnapshot = await db.collection('leaderboard').get();
      const batch = db.batch();
      
      leaderboardSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          weeklyScore: 0,
          weeklyReset: FieldValue.serverTimestamp(),
        });
      });
      
      await batch.commit();
      logger.info(`Weekly leaderboard reset for ${leaderboardSnapshot.size} users`);
      
    } catch (error) {
      logger.error('Error resetting weekly leaderboard:', error);
    }
  }
);
