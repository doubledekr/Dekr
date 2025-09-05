import { logEvent, AnalyticsEvents } from './analytics';
import { firestore } from './firebase-platform';
import firestoreNS, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface Competition {
  id: string;
  title: string;
  description: string;
  type: 'binary' | 'multiple_choice' | 'numeric';
  category: 'stocks' | 'crypto' | 'mixed';
  assets: string[]; // Stock symbols or crypto symbols
  options?: string[]; // For multiple choice competitions
  startDate: FirebaseFirestoreTypes.Timestamp;
  endDate: FirebaseFirestoreTypes.Timestamp;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  maxParticipants?: number;
  entryFee?: number; // Points required to enter
  prizePool: number; // Total points to distribute
  educationalContent?: {
    title: string;
    description: string;
    resources: string[];
  };
  results?: CompetitionResults;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface CompetitionResults {
  winningOption?: string;
  actualValues?: Record<string, number>; // Asset symbol -> actual performance
  distribution: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
    participation: number;
  };
  participants: number;
  completedAt: FirebaseFirestoreTypes.Timestamp;
}

export interface UserPrediction {
  id: string;
  userId: string;
  competitionId: string;
  prediction: string | number; // The actual prediction value
  confidence: number; // 1-100 confidence level
  submittedAt: FirebaseFirestoreTypes.Timestamp;
  pointsAwarded?: number;
  rank?: number;
}

export interface CompetitionStats {
  totalCompetitions: number;
  activeCompetitions: number;
  totalParticipants: number;
  averageParticipation: number;
  totalPrizePool: number;
}

export class CompetitionService {
  private getCompetitionsCollection() {
    return firestore().collection('competitions');
  }

  private getPredictionsCollection() {
    return firestore().collection('predictions');
  }

  // Create a new competition
  async createCompetition(competition: Omit<Competition, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const competitionData = {
        ...competition,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.getCompetitionsCollection().add(competitionData);
      
      logEvent(AnalyticsEvents.CREATE_COMPETITION, {
        competition_id: docRef.id,
        type: competition.type,
        category: competition.category,
        assets_count: competition.assets.length,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating competition:', error);
      throw error;
    }
  }

  // Get active competitions
  async getActiveCompetitions(): Promise<Competition[]> {
    try {
      const snapshot = await this.getCompetitionsCollection()
        .where('status', '==', 'active')
        .orderBy('endDate', 'asc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Competition));
    } catch (error) {
      console.error('Error getting active competitions:', error);
      throw error;
    }
  }

  // Get upcoming competitions
  async getUpcomingCompetitions(): Promise<Competition[]> {
    try {
      const snapshot = await this.getCompetitionsCollection()
        .where('status', '==', 'upcoming')
        .orderBy('startDate', 'asc')
        .limit(5)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Competition));
    } catch (error) {
      console.error('Error getting upcoming competitions:', error);
      throw error;
    }
  }

  // Get completed competitions
  async getCompletedCompetitions(limit: number = 10): Promise<Competition[]> {
    try {
      const snapshot = await this.getCompetitionsCollection()
        .where('status', '==', 'completed')
        .orderBy('endDate', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Competition));
    } catch (error) {
      console.error('Error getting completed competitions:', error);
      throw error;
    }
  }

  // Submit a prediction
  async submitPrediction(
    userId: string,
    competitionId: string,
    prediction: string | number,
    confidence: number
  ): Promise<string> {
    try {
      // Check if user already has a prediction for this competition
      const existingPrediction = await this.getUserPrediction(userId, competitionId);
      if (existingPrediction) {
        throw new Error('User already has a prediction for this competition');
      }

      // Check if competition is still active
      const competition = await this.getCompetition(competitionId);
      if (!competition || competition.status !== 'active') {
        throw new Error('Competition is not active');
      }

      const predictionData = {
        userId,
        competitionId,
        prediction,
        confidence,
        submittedAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.getPredictionsCollection().add(predictionData);

      logEvent(AnalyticsEvents.SUBMIT_PREDICTION, {
        prediction_id: docRef.id,
        competition_id: competitionId,
        type: competition.type,
        confidence,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error submitting prediction:', error);
      throw error;
    }
  }

  // Get user's prediction for a competition
  async getUserPrediction(userId: string, competitionId: string): Promise<UserPrediction | null> {
    try {
      const snapshot = await this.getPredictionsCollection()
        .where('userId', '==', userId)
        .where('competitionId', '==', competitionId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as UserPrediction;
    } catch (error) {
      console.error('Error getting user prediction:', error);
      throw error;
    }
  }

  // Get all predictions for a competition
  async getCompetitionPredictions(competitionId: string): Promise<UserPrediction[]> {
    try {
      const snapshot = await this.getPredictionsCollection()
        .where('competitionId', '==', competitionId)
        .orderBy('submittedAt', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as UserPrediction));
    } catch (error) {
      console.error('Error getting competition predictions:', error);
      throw error;
    }
  }

  // Get competition by ID
  async getCompetition(competitionId: string): Promise<Competition | null> {
    try {
      const doc = await this.getCompetitionsCollection().doc(competitionId).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as Competition;
    } catch (error) {
      console.error('Error getting competition:', error);
      throw error;
    }
  }

  // Update competition status
  async updateCompetitionStatus(
    competitionId: string,
    status: Competition['status'],
    results?: CompetitionResults
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (results) {
        updateData.results = results;
      }

      await this.getCompetitionsCollection().doc(competitionId).update(updateData);

      logEvent(AnalyticsEvents.UPDATE_COMPETITION_STATUS, {
        competition_id: competitionId,
        status,
        has_results: !!results,
      });
    } catch (error) {
      console.error('Error updating competition status:', error);
      throw error;
    }
  }

  // Calculate and distribute rewards
  async calculateRewards(competitionId: string, actualResults: Record<string, number>): Promise<void> {
    try {
      const competition = await this.getCompetition(competitionId);
      if (!competition) {
        throw new Error('Competition not found');
      }

      const predictions = await this.getCompetitionPredictions(competitionId);
      
      // Calculate accuracy for each prediction
      const scoredPredictions = predictions.map(prediction => {
        const accuracy = this.calculatePredictionAccuracy(
          prediction.prediction,
          actualResults,
          competition.type,
          competition.assets
        );
        return { ...prediction, accuracy };
      });

      // Sort by accuracy (highest first)
      scoredPredictions.sort((a, b) => b.accuracy - a.accuracy);

      // Distribute rewards
      const totalParticipants = scoredPredictions.length;
      const prizePool = competition.prizePool;
      
      const rewards = {
        firstPlace: Math.floor(prizePool * 0.4),
        secondPlace: Math.floor(prizePool * 0.3),
        thirdPlace: Math.floor(prizePool * 0.2),
        participation: Math.floor(prizePool * 0.1 / Math.max(totalParticipants - 3, 1)),
      };

      // Update predictions with rewards and ranks
      const batch = firestore().batch();
      
      scoredPredictions.forEach((prediction, index) => {
        const predictionRef = this.getPredictionsCollection().doc(prediction.id);
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

        batch.update(predictionRef, {
          pointsAwarded,
          rank,
          accuracy: prediction.accuracy,
        });
      });

      await batch.commit();

      // Update competition with results
      const results: CompetitionResults = {
        actualValues: actualResults,
        distribution: rewards,
        participants: totalParticipants,
        completedAt: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
      };

      await this.updateCompetitionStatus(competitionId, 'completed', results);

      logEvent(AnalyticsEvents.CALCULATE_REWARDS, {
        competition_id: competitionId,
        total_participants: totalParticipants,
        total_prize_pool: prizePool,
      });
    } catch (error) {
      console.error('Error calculating rewards:', error);
      throw error;
    }
  }

  // Calculate prediction accuracy
  private calculatePredictionAccuracy(
    prediction: string | number,
    actualResults: Record<string, number>,
    type: Competition['type'],
    assets: string[]
  ): number {
    switch (type) {
      case 'binary':
        // For binary predictions, check if the direction was correct
        const asset = assets[0];
        const actualChange = actualResults[asset] || 0;
        const predictedDirection = prediction === 'up' ? 1 : -1;
        const actualDirection = actualChange > 0 ? 1 : -1;
        return predictedDirection === actualDirection ? 100 : 0;

      case 'multiple_choice':
        // For multiple choice, find the best performing asset
        const bestAsset = Object.entries(actualResults)
          .reduce((best, [symbol, change]) => 
            change > (actualResults[best] || -Infinity) ? symbol : best
          );
        return prediction === bestAsset ? 100 : 0;

      case 'numeric':
        // For numeric predictions, calculate how close the prediction was
        const assetForNumeric = assets[0];
        const actualValue = actualResults[assetForNumeric] || 0;
        const predictedValue = typeof prediction === 'number' ? prediction : parseFloat(prediction.toString());
        const difference = Math.abs(actualValue - predictedValue);
        const maxExpectedRange = 20; // Assume max 20% change
        return Math.max(0, 100 - (difference / maxExpectedRange) * 100);

      default:
        return 0;
    }
  }

  // Get user's competition history
  async getUserCompetitionHistory(userId: string, limit: number = 20): Promise<UserPrediction[]> {
    try {
      const snapshot = await this.getPredictionsCollection()
        .where('userId', '==', userId)
        .orderBy('submittedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as UserPrediction));
    } catch (error) {
      console.error('Error getting user competition history:', error);
      throw error;
    }
  }

  // Get competition statistics
  async getCompetitionStats(): Promise<CompetitionStats> {
    try {
      const competitionsSnapshot = await this.getCompetitionsCollection().get();
      const predictionsSnapshot = await this.getPredictionsCollection().get();

      const competitions = competitionsSnapshot.docs.map((doc: any) => doc.data() as Competition);
      const predictions = predictionsSnapshot.docs.map((doc: any) => doc.data() as UserPrediction);

      const totalCompetitions = competitions.length;
      const activeCompetitions = competitions.filter(c => c.status === 'active').length;
      const totalParticipants = new Set(predictions.map(p => p.userId)).size;
      const averageParticipation = totalCompetitions > 0 ? predictions.length / totalCompetitions : 0;
      const totalPrizePool = competitions.reduce((sum, c) => sum + c.prizePool, 0);

      return {
        totalCompetitions,
        activeCompetitions,
        totalParticipants,
        averageParticipation,
        totalPrizePool,
      };
    } catch (error) {
      console.error('Error getting competition stats:', error);
      throw error;
    }
  }

  // Subscribe to active competitions
  subscribeToActiveCompetitions(
    callback: (competitions: Competition[]) => void
  ): () => void {
    return this.getCompetitionsCollection()
      .where('status', '==', 'active')
      .orderBy('endDate', 'asc')
      .onSnapshot((snapshot: any) => {
        const competitions = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as Competition));
        callback(competitions);
      });
  }

  // Subscribe to user's predictions
  subscribeToUserPredictions(
    userId: string,
    callback: (predictions: UserPrediction[]) => void
  ): () => void {
    return this.getPredictionsCollection()
      .where('userId', '==', userId)
      .orderBy('submittedAt', 'desc')
      .limit(20)
      .onSnapshot((snapshot: any) => {
        const predictions = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as UserPrediction));
        callback(predictions);
      });
  }
}

export const competitionService = new CompetitionService();
