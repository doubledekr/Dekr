import { logEvent, AnalyticsEvents } from './analytics';
import { firestore } from './firebase-platform';
import firestoreNS, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'portfolio' | 'prediction' | 'educational' | 'social' | 'mixed';
  category: 'tech' | 'crypto' | 'esg' | 'earnings' | 'general';
  theme: string; // e.g., "Tech Portfolio", "ESG Investing"
  startDate: FirebaseFirestoreTypes.Timestamp;
  endDate: FirebaseFirestoreTypes.Timestamp;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  maxParticipants?: number;
  entryFee?: number; // Points required to enter
  prizePool: number; // Total points to distribute
  rules: string[];
  requirements: {
    minPredictions?: number;
    portfolioSize?: number;
    educationalModules?: string[];
    socialInteractions?: number;
  };
  educationalContent?: {
    title: string;
    description: string;
    modules: string[];
    resources: string[];
  };
  results?: ChallengeResults;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface ChallengeResults {
  winners: ChallengeWinner[];
  totalParticipants: number;
  averageScore: number;
  distribution: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    participation: number;
  };
  completedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface ChallengeWinner {
  userId: string;
  userName: string;
  userAvatar?: string;
  rank: number;
  score: number;
  pointsAwarded: number;
  achievements: string[];
}

export interface UserChallengeParticipation {
  id: string;
  userId: string;
  challengeId: string;
  challenge: Challenge;
  status: 'registered' | 'active' | 'completed' | 'disqualified';
  score?: number;
  rank?: number;
  pointsAwarded?: number;
  submissions: ChallengeSubmission[];
  progress: {
    predictionsCompleted: number;
    portfolioValue?: number;
    educationalModulesCompleted: number;
    socialInteractions: number;
  };
  joinedAt: FirebaseFirestoreTypes.Timestamp;
  completedAt?: FirebaseFirestoreTypes.Timestamp;
}

export interface ChallengeSubmission {
  id: string;
  type: 'prediction' | 'portfolio' | 'educational' | 'social';
  data: Record<string, any>;
  score?: number;
  submittedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface TeamChallenge {
  id: string;
  challengeId: string;
  name: string;
  description: string;
  members: string[]; // User IDs
  leader: string; // User ID
  maxMembers: number;
  score?: number;
  rank?: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface ChallengeStats {
  totalChallenges: number;
  activeChallenges: number;
  totalParticipants: number;
  averageParticipation: number;
  totalPrizePool: number;
  popularCategories: string[];
}

export class ChallengeService {
  private getChallengesCollection() {
    return firestore().collection('challenges');
  }

  private getUserParticipationsCollection() {
    return firestore().collection('user_challenge_participations');
  }

  private getTeamChallengesCollection() {
    return firestore().collection('team_challenges');
  }

  // Create a new challenge
  async createChallenge(challenge: Omit<Challenge, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const challengeData = {
        ...challenge,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.getChallengesCollection().add(challengeData);
      
      logEvent(AnalyticsEvents.CREATE_CHALLENGE, {
        challenge_id: docRef.id,
        type: challenge.type,
        category: challenge.category,
        theme: challenge.theme,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  // Get active challenges
  async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const snapshot = await this.getChallengesCollection()
        .where('status', '==', 'active')
        .orderBy('endDate', 'asc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Challenge));
    } catch (error) {
      console.error('Error getting active challenges:', error);
      throw error;
    }
  }

  // Get upcoming challenges
  async getUpcomingChallenges(): Promise<Challenge[]> {
    try {
      const snapshot = await this.getChallengesCollection()
        .where('status', '==', 'upcoming')
        .orderBy('startDate', 'asc')
        .limit(5)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Challenge));
    } catch (error) {
      console.error('Error getting upcoming challenges:', error);
      throw error;
    }
  }

  // Get completed challenges
  async getCompletedChallenges(limit: number = 10): Promise<Challenge[]> {
    try {
      const snapshot = await this.getChallengesCollection()
        .where('status', '==', 'completed')
        .orderBy('endDate', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Challenge));
    } catch (error) {
      console.error('Error getting completed challenges:', error);
      throw error;
    }
  }

  // Join a challenge
  async joinChallenge(userId: string, challengeId: string): Promise<string> {
    try {
      // Check if user is already participating
      const existingParticipation = await this.getUserParticipation(userId, challengeId);
      if (existingParticipation) {
        throw new Error('User is already participating in this challenge');
      }

      // Get challenge details
      const challenge = await this.getChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      if (challenge.status !== 'active') {
        throw new Error('Challenge is not active');
      }

      // Check entry fee if applicable
      if (challenge.entryFee && challenge.entryFee > 0) {
        // This would integrate with the reward system
        // const hasEnoughPoints = await rewardSystem.spendPoints(userId, challenge.entryFee, `Entry fee for challenge: ${challenge.title}`, 'challenge');
        // if (!hasEnoughPoints) {
        //   throw new Error('Insufficient points to join challenge');
        // }
      }

      // Create participation record
      const participationData = {
        userId,
        challengeId,
        challenge,
        status: 'registered',
        submissions: [],
        progress: {
          predictionsCompleted: 0,
          educationalModulesCompleted: 0,
          socialInteractions: 0,
        },
        joinedAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.getUserParticipationsCollection().add(participationData);

      logEvent(AnalyticsEvents.JOIN_CHALLENGE, {
        participation_id: docRef.id,
        challenge_id: challengeId,
        user_id: userId,
        type: challenge.type,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  // Submit to a challenge
  async submitToChallenge(
    userId: string,
    challengeId: string,
    submission: Omit<ChallengeSubmission, 'id' | 'submittedAt'>
  ): Promise<string> {
    try {
      const participation = await this.getUserParticipation(userId, challengeId);
      if (!participation) {
        throw new Error('User is not participating in this challenge');
      }

      if (participation.status !== 'active') {
        throw new Error('Participation is not active');
      }

      // Create submission
      const submissionData = {
        ...submission,
        id: firestore().collection('temp').doc().id,
        submittedAt: firestore.FieldValue.serverTimestamp(),
      };

      // Update participation with new submission
      const participationRef = this.getUserParticipationsCollection().doc(participation.id);
      await participationRef.update({
        submissions: firestore.FieldValue.arrayUnion(submissionData),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      logEvent(AnalyticsEvents.SUBMIT_TO_CHALLENGE, {
        participation_id: participation.id,
        challenge_id: challengeId,
        user_id: userId,
        submission_type: submission.type,
      });

      return submissionData.id;
    } catch (error) {
      console.error('Error submitting to challenge:', error);
      throw error;
    }
  }

  // Get user's participation in a challenge
  async getUserParticipation(userId: string, challengeId: string): Promise<UserChallengeParticipation | null> {
    try {
      const snapshot = await this.getUserParticipationsCollection()
        .where('userId', '==', userId)
        .where('challengeId', '==', challengeId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as UserChallengeParticipation;
    } catch (error) {
      console.error('Error getting user participation:', error);
      throw error;
    }
  }

  // Get user's challenge history
  async getUserChallengeHistory(userId: string, limit: number = 20): Promise<UserChallengeParticipation[]> {
    try {
      const snapshot = await this.getUserParticipationsCollection()
        .where('userId', '==', userId)
        .orderBy('joinedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as UserChallengeParticipation));
    } catch (error) {
      console.error('Error getting user challenge history:', error);
      throw error;
    }
  }

  // Get challenge by ID
  async getChallenge(challengeId: string): Promise<Challenge | null> {
    try {
      const doc = await this.getChallengesCollection().doc(challengeId).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as Challenge;
    } catch (error) {
      console.error('Error getting challenge:', error);
      throw error;
    }
  }

  // Get challenge participants
  async getChallengeParticipants(challengeId: string): Promise<UserChallengeParticipation[]> {
    try {
      const snapshot = await this.getUserParticipationsCollection()
        .where('challengeId', '==', challengeId)
        .orderBy('score', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as UserChallengeParticipation));
    } catch (error) {
      console.error('Error getting challenge participants:', error);
      throw error;
    }
  }

  // Calculate challenge scores and determine winners
  async calculateChallengeResults(challengeId: string): Promise<void> {
    try {
      const challenge = await this.getChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const participants = await this.getChallengeParticipants(challengeId);
      
      // Calculate scores based on challenge type
      const scoredParticipants = participants.map(participation => {
        const score = this.calculateChallengeScore(participation, challenge);
        return { ...participation, score };
      });

      // Sort by score (highest first)
      scoredParticipants.sort((a, b) => (b.score || 0) - (a.score || 0));

      // Determine winners and distribute rewards
      const winners: ChallengeWinner[] = [];
      const totalParticipants = scoredParticipants.length;
      const prizePool = challenge.prizePool;
      
      const rewards = {
        firstPlace: Math.floor(prizePool * 0.4),
        secondPlace: Math.floor(prizePool * 0.3),
        thirdPlace: Math.floor(prizePool * 0.2),
        participation: Math.floor(prizePool * 0.1 / Math.max(totalParticipants - 3, 1)),
      };

      // Update participants with scores and rewards
      const batch = firestore().batch();
      
      scoredParticipants.forEach((participant, index) => {
        const participationRef = this.getUserParticipationsCollection().doc(participant.id);
        let pointsAwarded = 0;
        let rank = index + 1;

        if (index === 0) {
          pointsAwarded = rewards.firstPlace;
        } else if (index === 1) {
          pointsAwarded = rewards.secondPlace;
        } else if (index === 2) {
          pointsAwarded = rewards.thirdPlace;
        } else {
          pointsAwarded = rewards.participation;
        }

        batch.update(participationRef, {
          score: participant.score,
          rank,
          pointsAwarded,
          status: 'completed',
          completedAt: firestore.FieldValue.serverTimestamp(),
        });

        // Add to winners if in top 3
        if (index < 3) {
          winners.push({
            userId: participant.userId,
            userName: participant.userId, // Would need to fetch actual name
            rank,
            score: participant.score || 0,
            pointsAwarded,
            achievements: [], // Would be populated based on performance
          });
        }
      });

      await batch.commit();

      // Update challenge with results
      const results: ChallengeResults = {
        winners,
        totalParticipants,
        averageScore: scoredParticipants.reduce((sum, p) => sum + (p.score || 0), 0) / totalParticipants,
        distribution: rewards,
        completedAt: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
      };

      await this.updateChallengeStatus(challengeId, 'completed', results);

      logEvent(AnalyticsEvents.CALCULATE_CHALLENGE_RESULTS, {
        challenge_id: challengeId,
        total_participants: totalParticipants,
        total_prize_pool: prizePool,
      });
    } catch (error) {
      console.error('Error calculating challenge results:', error);
      throw error;
    }
  }

  // Calculate score for a challenge participation
  private calculateChallengeScore(
    participation: UserChallengeParticipation,
    challenge: Challenge
  ): number {
    let score = 0;

    switch (challenge.type) {
      case 'portfolio':
        // Score based on portfolio performance
        score = participation.progress.portfolioValue || 0;
        break;
      
      case 'prediction':
        // Score based on prediction accuracy
        const predictions = participation.submissions.filter(s => s.type === 'prediction');
        const correctPredictions = predictions.filter(p => p.score && p.score > 0).length;
        score = predictions.length > 0 ? (correctPredictions / predictions.length) * 100 : 0;
        break;
      
      case 'educational':
        // Score based on educational module completion
        const totalModules = challenge.requirements.educationalModules?.length || 1;
        score = (participation.progress.educationalModulesCompleted / totalModules) * 100;
        break;
      
      case 'social':
        // Score based on social interactions
        score = participation.progress.socialInteractions;
        break;
      
      case 'mixed':
        // Combined score from all types
        const portfolioScore = participation.progress.portfolioValue || 0;
        const predictionScore = participation.submissions.filter(s => s.type === 'prediction').length * 10;
        const educationalScore = participation.progress.educationalModulesCompleted * 20;
        const socialScore = participation.progress.socialInteractions * 5;
        score = portfolioScore + predictionScore + educationalScore + socialScore;
        break;
    }

    return Math.round(score);
  }

  // Update challenge status
  async updateChallengeStatus(
    challengeId: string,
    status: Challenge['status'],
    results?: ChallengeResults
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (results) {
        updateData.results = results;
      }

      await this.getChallengesCollection().doc(challengeId).update(updateData);

      logEvent(AnalyticsEvents.UPDATE_CHALLENGE_STATUS, {
        challenge_id: challengeId,
        status,
        has_results: !!results,
      });
    } catch (error) {
      console.error('Error updating challenge status:', error);
      throw error;
    }
  }

  // Create team challenge
  async createTeamChallenge(
    challengeId: string,
    teamData: Omit<TeamChallenge, 'id' | 'challengeId' | 'createdAt'>
  ): Promise<string> {
    try {
      const teamChallengeData = {
        ...teamData,
        challengeId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.getTeamChallengesCollection().add(teamChallengeData);
      
      logEvent(AnalyticsEvents.CREATE_TEAM_CHALLENGE, {
        team_id: docRef.id,
        challenge_id: challengeId,
        team_name: teamData.name,
        member_count: teamData.members.length,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating team challenge:', error);
      throw error;
    }
  }

  // Get challenge statistics
  async getChallengeStats(): Promise<ChallengeStats> {
    try {
      const challengesSnapshot = await this.getChallengesCollection().get();
      const participationsSnapshot = await this.getUserParticipationsCollection().get();

      const challenges = challengesSnapshot.docs.map((doc: any) => doc.data() as Challenge);
      const participations = participationsSnapshot.docs.map((doc: any) => doc.data() as UserChallengeParticipation);

      const totalChallenges = challenges.length;
      const activeChallenges = challenges.filter(c => c.status === 'active').length;
      const totalParticipants = new Set(participations.map(p => p.userId)).size;
      const averageParticipation = totalChallenges > 0 ? participations.length / totalChallenges : 0;
      const totalPrizePool = challenges.reduce((sum, c) => sum + c.prizePool, 0);
      
      const categoryCounts = challenges.reduce((counts, c) => {
        counts[c.category] = (counts[c.category] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      const popularCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      return {
        totalChallenges,
        activeChallenges,
        totalParticipants,
        averageParticipation,
        totalPrizePool,
        popularCategories,
      };
    } catch (error) {
      console.error('Error getting challenge stats:', error);
      throw error;
    }
  }

  // Subscribe to active challenges
  subscribeToActiveChallenges(
    callback: (challenges: Challenge[]) => void
  ): () => void {
    return this.getChallengesCollection()
      .where('status', '==', 'active')
      .orderBy('endDate', 'asc')
      .onSnapshot((snapshot: any) => {
        const challenges = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as Challenge));
        callback(challenges);
      });
  }

  // Subscribe to user's challenge participations
  subscribeToUserParticipations(
    userId: string,
    callback: (participations: UserChallengeParticipation[]) => void
  ): () => void {
    return this.getUserParticipationsCollection()
      .where('userId', '==', userId)
      .orderBy('joinedAt', 'desc')
      .limit(20)
      .onSnapshot((snapshot: any) => {
        const participations = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as UserChallengeParticipation));
        callback(participations);
      });
  }
}

export const challengeService = new ChallengeService();
