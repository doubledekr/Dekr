import { logEvent, AnalyticsEvents } from './analytics';
import { firestore } from './firebase-platform';

export interface Recommendation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  toUserName: string;
  type: 'stock' | 'crypto' | 'strategy' | 'education';
  assetSymbol?: string;
  assetName?: string;
  assetPrice?: number;
  assetChange?: number;
  recommendation: 'buy' | 'sell' | 'hold' | 'watch';
  reasoning: string;
  targetPrice?: number;
  timeHorizon?: 'short' | 'medium' | 'long';
  riskLevel?: 'low' | 'medium' | 'high';
  strategyId?: string;
  strategyName?: string;
  educationContentId?: string;
  educationTitle?: string;
  isTimeSensitive: boolean;
  expiresAt?: Timestamp;
  status: 'pending' | 'viewed' | 'acted' | 'dismissed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  performance?: {
    actualPrice?: number;
    actualChange?: number;
    userAction?: 'bought' | 'sold' | 'watched' | 'ignored';
    feedback?: 'helpful' | 'not_helpful';
  };
}

export interface FriendRecommendationStats {
  totalSent: number;
  totalReceived: number;
  helpfulCount: number;
  accuracyRate: number;
  avgPerformance: number;
}

class RecommendationService {
  private getRecommendationsCollection = () => firestore().collection('recommendations');
  private getFriendsCollection = () => firestore().collection('friends');

  // Send a recommendation to a friend
  async sendRecommendation(
    fromUserId: string,
    fromUserName: string,
    fromUserAvatar: string | undefined,
    toUserId: string,
    toUserName: string,
    recommendationData: Omit<Recommendation, 'id' | 'fromUserId' | 'fromUserName' | 'fromUserAvatar' | 'toUserId' | 'toUserName' | 'createdAt' | 'updatedAt' | 'status'>
  ): Promise<string> {
    try {
      const recommendation: Omit<Recommendation, 'id'> = {
        ...recommendationData,
        fromUserId,
        fromUserName,
        fromUserAvatar,
        toUserId,
        toUserName,
        status: 'pending',
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.getRecommendationsCollection().add(recommendation);
      
      // Log analytics event
      logEvent(AnalyticsEvents.SEND_RECOMMENDATION, {
        recommendation_id: docRef.id,
        type: recommendationData.type,
        asset_symbol: recommendationData.assetSymbol,
        is_time_sensitive: recommendationData.isTimeSensitive,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error sending recommendation:', error);
      throw error;
    }
  }

  // Get recommendations sent by a user
  async getSentRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const snapshot = await this.getRecommendationsCollection()
        .where('fromUserId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Recommendation));
    } catch (error) {
      console.error('Error getting sent recommendations:', error);
      throw error;
    }
  }

  // Get recommendations received by a user
  async getReceivedRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const snapshot = await this.getRecommendationsCollection()
        .where('toUserId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Recommendation));
    } catch (error) {
      console.error('Error getting received recommendations:', error);
      throw error;
    }
  }

  // Get pending recommendations (unread)
  async getPendingRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const snapshot = await this.getRecommendationsCollection()
        .where('toUserId', '==', userId)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Recommendation));
    } catch (error) {
      console.error('Error getting pending recommendations:', error);
      throw error;
    }
  }

  // Mark recommendation as viewed
  async markAsViewed(recommendationId: string): Promise<void> {
    try {
      const docRef = this.getRecommendationsCollection().doc(recommendationId);
      await docRef.update({
        status: 'viewed',
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      logEvent(AnalyticsEvents.VIEW_RECOMMENDATION, {
        recommendation_id: recommendationId,
      });
    } catch (error) {
      console.error('Error marking recommendation as viewed:', error);
      throw error;
    }
  }

  // Update recommendation status
  async updateRecommendationStatus(
    recommendationId: string, 
    status: Recommendation['status'],
    performance?: Recommendation['performance']
  ): Promise<void> {
    try {
      const docRef = this.getRecommendationsCollection().doc(recommendationId);
      const updateData: any = {
        status,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (performance) {
        updateData.performance = performance;
      }

      await docRef.update(updateData);

      logEvent(AnalyticsEvents.UPDATE_RECOMMENDATION_STATUS, {
        recommendation_id: recommendationId,
        status,
        has_performance: !!performance,
      });
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      throw error;
    }
  }

  // Get user's recommendation statistics
  async getUserRecommendationStats(userId: string): Promise<FriendRecommendationStats> {
    try {
      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        this.getRecommendationsCollection().where('fromUserId', '==', userId).get(),
        this.getRecommendationsCollection().where('toUserId', '==', userId).get()
      ]);

      const sentRecommendations = sentSnapshot.docs.map(doc => doc.data() as Recommendation);
      const receivedRecommendations = receivedSnapshot.docs.map(doc => doc.data() as Recommendation);

      const helpfulCount = sentRecommendations.filter(
        rec => rec.performance?.feedback === 'helpful'
      ).length;

      const accuracyRate = sentRecommendations.length > 0 
        ? (helpfulCount / sentRecommendations.length) * 100 
        : 0;

      const avgPerformance = sentRecommendations
        .filter(rec => rec.performance?.actualChange !== undefined)
        .reduce((sum, rec) => sum + (rec.performance?.actualChange || 0), 0) / 
        sentRecommendations.filter(rec => rec.performance?.actualChange !== undefined).length || 0;

      return {
        totalSent: sentRecommendations.length,
        totalReceived: receivedRecommendations.length,
        helpfulCount,
        accuracyRate,
        avgPerformance,
      };
    } catch (error) {
      console.error('Error getting user recommendation stats:', error);
      throw error;
    }
  }

  // Subscribe to real-time recommendations
  subscribeToRecommendations(
    userId: string,
    callback: (recommendations: Recommendation[]) => void
  ): () => void {
    return this.getRecommendationsCollection()
      .where('toUserId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot((snapshot) => {
        const recommendations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Recommendation));
        callback(recommendations);
      });
  }

  // Get friends list for recommendations
  async getFriends(userId: string): Promise<Array<{id: string, name: string, avatar?: string}>> {
    try {
      const snapshot = await this.getFriendsCollection()
        .where('userId', '==', userId)
        .get();
      
      const friends = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.friendId,
          name: data.friendName,
          avatar: data.friendAvatar,
        };
      });

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  }

  // Delete a recommendation
  async deleteRecommendation(recommendationId: string): Promise<void> {
    try {
      const docRef = this.getRecommendationsCollection().doc(recommendationId);
      await docRef.delete();

      logEvent(AnalyticsEvents.DELETE_RECOMMENDATION, {
        recommendation_id: recommendationId,
      });
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      throw error;
    }
  }
}

export const recommendationService = new RecommendationService();
