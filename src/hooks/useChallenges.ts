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
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, auth, functions } from '../../services/firebase-platform';
import { Challenge, Participant } from '../types/firestore';

// Types for hook returns
interface UseChallengesResult {
  challenges: Challenge[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  leaderboard?: any[];
  currentUserId?: string;
}

interface UseChallengeResult {
  challenge: Challenge | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCreateChallengeResult {
  createChallenge: (challengeData: any) => Promise<{ challengeId: string }>;
  loading: boolean;
  error: string | null;
}

interface UseJoinChallengeResult {
  joinChallenge: (challengeId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseSubmitGuessResult {
  submitGuess: (challengeId: string, guess: any) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseCancelChallengeResult {
  cancelChallenge: (challengeId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Helper function to convert Firestore data
const convertFirestoreToChallenge = (doc: any): Challenge => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    endDate: data.endDate?.toDate() || new Date(),
    participants: data.participants?.map((p: any) => ({
      ...p,
      joinedAt: p.joinedAt?.toDate() || new Date(),
    })) || [],
  } as Challenge;
};

// Helper function to get current user
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// Hook to fetch challenges
export const useChallenges = (type: 'active' | 'joined' | 'completed' | 'leaderboard' = 'active'): UseChallengesResult => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = auth.currentUser;
  const currentUserId = user?.uid;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (type === 'leaderboard') {
        // Fetch leaderboard data
        const leaderboardRef = collection(firestore, 'leaderboard');
        const q = query(
          leaderboardRef,
          orderBy('score', 'desc'),
          limit(50)
        );

        const snapshot = await getDocs(q);
        const leaderboardData = snapshot.docs.map(doc => ({
          userId: doc.id,
          ...doc.data(),
        }));
        
        setLeaderboard(leaderboardData);
        setLoading(false);
        return;
      }

      if (!currentUserId) {
        setChallenges([]);
        setLoading(false);
        setError('User not authenticated');
        return;
      }

      const challengesRef = collection(firestore, 'challenges');
      let q;

      switch (type) {
        case 'active':
          q = query(
            challengesRef,
            where('status', '==', 'active'),
            orderBy('endDate', 'asc'),
            limit(50)
          );
          break;
        case 'joined':
          // Get challenges where user is a participant
          q = query(
            challengesRef,
            where('participants', 'array-contains-any', [{ userId: currentUserId }]),
            orderBy('endDate', 'desc'),
            limit(50)
          );
          break;
        case 'completed':
          q = query(
            challengesRef,
            where('status', 'in', ['completed', 'cancelled']),
            where('creatorId', '==', currentUserId),
            orderBy('endDate', 'desc'),
            limit(50)
          );
          break;
        default:
          q = query(challengesRef, orderBy('endDate', 'desc'), limit(50));
      }

      const snapshot = await getDocs(q);
      const challengeData = snapshot.docs.map(convertFirestoreToChallenge);
      
      // Filter joined challenges properly (since array-contains-any doesn't work as expected)
      if (type === 'joined') {
        const filteredChallenges = challengeData.filter(challenge =>
          challenge.participants.some(p => p.userId === currentUserId)
        );
        setChallenges(filteredChallenges);
      } else {
        setChallenges(challengeData);
      }
      
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching challenges:', err);
      setError(err.message || 'Failed to fetch challenges');
      setLoading(false);
    }
  }, [type, currentUserId]);

  useEffect(() => {
    if (type === 'leaderboard') {
      refetch();
      return;
    }

    if (!currentUserId) {
      setChallenges([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    // Set up real-time listener for active challenges
    if (type === 'active') {
      const challengesRef = collection(firestore, 'challenges');
      const q = query(
        challengesRef,
        where('status', '==', 'active'),
        orderBy('endDate', 'asc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const challengeData = snapshot.docs.map(convertFirestoreToChallenge);
            setChallenges(challengeData);
            setLoading(false);
            setError(null);
          } catch (err: any) {
            console.error('Error processing challenges:', err);
            setError('Failed to load challenges');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error listening to challenges:', err);
          setError('Failed to load challenges');
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      // For other types, use one-time fetch
      refetch();
    }
  }, [type, currentUserId, refetch]);

  return { 
    challenges, 
    leaderboard, 
    loading, 
    error, 
    refetch, 
    currentUserId 
  };
};

// Hook to get single challenge
export const useChallenge = (challengeId: string): UseChallengeResult => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const challengeRef = doc(firestore, 'challenges', challengeId);
      const challengeDoc = await challengeRef.get();
      
      if (!challengeDoc.exists()) {
        setError('Challenge not found');
        setChallenge(null);
      } else {
        const challengeData = convertFirestoreToChallenge(challengeDoc);
        setChallenge(challengeData);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching challenge:', err);
      setError(err.message || 'Failed to fetch challenge');
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId) {
      setChallenge(null);
      setLoading(false);
      return;
    }

    const challengeRef = doc(firestore, 'challenges', challengeId);
    const unsubscribe = onSnapshot(
      challengeRef,
      (doc) => {
        if (doc.exists()) {
          const challengeData = convertFirestoreToChallenge(doc);
          setChallenge(challengeData);
        } else {
          setChallenge(null);
          setError('Challenge not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching challenge:', err);
        setError('Failed to load challenge');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [challengeId]);

  return { challenge, loading, error, refetch };
};

// Hook to create challenge
export const useCreateChallenge = (): UseCreateChallengeResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChallenge = useCallback(async (challengeData: any): Promise<{ challengeId: string }> => {
    setLoading(true);
    setError(null);

    try {
      const createChallengeFn = httpsCallable(functions, 'createChallenge');
      const result = await createChallengeFn(challengeData);
      
      if (result.data.success) {
        return { challengeId: result.data.challengeId };
      } else {
        throw new Error(result.data.message || 'Failed to create challenge');
      }
    } catch (err: any) {
      console.error('Error creating challenge:', err);
      const errorMessage = err.message || 'Failed to create challenge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { createChallenge, loading, error };
};

// Hook to join challenge
export const useJoinChallenge = (): UseJoinChallengeResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinChallenge = useCallback(async (challengeId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const joinChallengeFn = httpsCallable(functions, 'joinChallenge');
      const result = await joinChallengeFn({ challengeId });
      
      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to join challenge');
      }
    } catch (err: any) {
      console.error('Error joining challenge:', err);
      const errorMessage = err.message || 'Failed to join challenge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { joinChallenge, loading, error };
};

// Hook to submit guess
export const useSubmitGuess = (): UseSubmitGuessResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitGuess = useCallback(async (challengeId: string, guess: any): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const submitGuessFn = httpsCallable(functions, 'submitGuess');
      const result = await submitGuessFn({ challengeId, guess });
      
      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to submit guess');
      }
    } catch (err: any) {
      console.error('Error submitting guess:', err);
      const errorMessage = err.message || 'Failed to submit guess';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitGuess, loading, error };
};

// Hook to cancel challenge
export const useCancelChallenge = (): UseCancelChallengeResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelChallenge = useCallback(async (challengeId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const cancelChallengeFn = httpsCallable(functions, 'cancelChallenge');
      const result = await cancelChallengeFn({ challengeId });
      
      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to cancel challenge');
      }
    } catch (err: any) {
      console.error('Error cancelling challenge:', err);
      const errorMessage = err.message || 'Failed to cancel challenge';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { cancelChallenge, loading, error };
};

// Hook to get user's challenge statistics
export const useChallengeStats = (userId?: string) => {
  const [stats, setStats] = useState({
    totalChallenges: 0,
    challengesWon: 0,
    challengesCreated: 0,
    totalPrizeWon: 0,
    winRate: 0,
    averageScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = getCurrentUser();
        const targetUserId = userId || user.uid;
        
        // Get challenges where user participated
        const challengesRef = collection(firestore, 'challenges');
        const participatedQuery = query(
          challengesRef,
          where('participants', 'array-contains-any', [{ userId: targetUserId }])
        );

        const participatedSnapshot = await getDocs(participatedQuery);
        const participatedChallenges = participatedSnapshot.docs.map(convertFirestoreToChallenge);

        // Get challenges created by user
        const createdQuery = query(
          challengesRef,
          where('creatorId', '==', targetUserId)
        );

        const createdSnapshot = await getDocs(createdQuery);
        const createdChallenges = createdSnapshot.docs.map(convertFirestoreToChallenge);

        // Calculate statistics
        const userParticipations = participatedChallenges.map(challenge => {
          const participant = challenge.participants.find(p => p.userId === targetUserId);
          return { challenge, participant };
        }).filter(({ participant }) => participant);

        const wonChallenges = userParticipations.filter(({ participant }) => participant?.isWinner);
        const totalPrizeWon = wonChallenges.reduce((sum, { challenge }) => sum + challenge.prizeAmount, 0);
        const totalScore = userParticipations.reduce((sum, { participant }) => sum + (participant?.score || 0), 0);
        const averageScore = userParticipations.length > 0 ? totalScore / userParticipations.length : 0;

        setStats({
          totalChallenges: userParticipations.length,
          challengesWon: wonChallenges.length,
          challengesCreated: createdChallenges.length,
          totalPrizeWon,
          winRate: userParticipations.length > 0 ? wonChallenges.length / userParticipations.length : 0,
          averageScore,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching challenge stats:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  return { stats, loading };
};

// Hook for real-time challenge updates
export const useChallengeUpdates = (challengeId: string) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!challengeId) return;

    const updatesRef = collection(firestore, 'challenges', challengeId, 'updates');
    const q = query(updatesRef, orderBy('timestamp', 'desc'), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));
      setUpdates(updatesData);
      setLoading(false);
    });

    return unsubscribe;
  }, [challengeId]);

  return { updates, loading };
};

// Utility hook to check if user can perform actions
export const useChallengePermissions = (challenge: Challenge | null, userId?: string) => {
  const user = auth.currentUser;
  const currentUserId = userId || user?.uid;

  if (!challenge || !currentUserId) {
    return {
      canJoin: false,
      canSubmitGuess: false,
      canCancel: false,
      canEdit: false,
      isCreator: false,
      isParticipant: false,
    };
  }

  const isCreator = challenge.creatorId === currentUserId;
  const isParticipant = challenge.participants.some(p => p.userId === currentUserId);
  const userParticipant = challenge.participants.find(p => p.userId === currentUserId);
  const hasSubmittedGuess = userParticipant?.guess !== undefined;

  const now = new Date();
  const challengeEnded = now >= challenge.endDate;
  const challengeActive = challenge.status === 'active';

  return {
    canJoin: challengeActive && 
            !isParticipant && 
            !challengeEnded &&
            (challenge.maxParticipants === undefined || challenge.participants.length < challenge.maxParticipants),
    canSubmitGuess: challengeActive && 
                   isParticipant && 
                   !hasSubmittedGuess && 
                   !challengeEnded,
    canCancel: challengeActive && 
              isCreator && 
              challenge.participants.length <= 1,
    canEdit: isCreator && challengeActive && challenge.participants.length <= 1,
    isCreator,
    isParticipant,
    hasSubmittedGuess,
    challengeEnded,
  };
};
