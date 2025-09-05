import { logEvent, AnalyticsEvents } from './analytics';
import { firestore } from './firebase-platform';
import firestoreNS, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: 'prediction' | 'social' | 'learning' | 'performance' | 'challenge';
  icon: string; // Icon name for MaterialCommunityIcons
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: {
    type: 'streak' | 'total' | 'accuracy' | 'participation' | 'custom';
    value: number;
    description: string;
  };
  pointsReward: number;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: FirebaseFirestoreTypes.Timestamp;
  progress?: number; // For badges with progress tracking
}

export interface UserPoints {
  userId: string;
  totalPoints: number;
  availablePoints: number; // Points that can be spent
  spentPoints: number;
  pointsHistory: PointsTransaction[];
  lastUpdated: FirebaseFirestoreTypes.Timestamp;
}

export interface PointsTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus' | 'penalty';
  amount: number;
  reason: string;
  source: 'competition' | 'prediction' | 'social' | 'learning' | 'challenge' | 'badge' | 'admin';
  metadata?: Record<string, any>;
  timestamp: FirebaseFirestoreTypes.Timestamp;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number;
  rank: number;
  category: 'predictions' | 'social' | 'learning' | 'performance' | 'overall';
  period: 'weekly' | 'monthly' | 'all_time';
  badges: number;
  achievements: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'streak' | 'accuracy' | 'participation' | 'social' | 'learning';
  icon: string;
  pointsReward: number;
  requirements: {
    type: string;
    value: number;
    timeframe?: string;
  };
}

export class RewardSystem {
  private getBadgesCollection() {
    return firestore().collection('badges');
  }

  private getUserBadgesCollection() {
    return firestore().collection('user_badges');
  }

  private getUserPointsCollection() {
    return firestore().collection('user_points');
  }

  private getLeaderboardCollection() {
    return firestore().collection('leaderboards');
  }

  // Award points to a user
  async awardPoints(
    userId: string,
    amount: number,
    reason: string,
    source: PointsTransaction['source'],
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const transactionRef = this.getUserPointsCollection().doc(userId);
      
      await firestore().runTransaction(async (transaction: any) => {
        const userPointsDoc = await transaction.get(transactionRef);
        
        let userPoints: UserPoints;
        if (userPointsDoc.exists) {
          userPoints = userPointsDoc.data() as UserPoints;
        } else {
          userPoints = {
            userId,
            totalPoints: 0,
            availablePoints: 0,
            spentPoints: 0,
            pointsHistory: [],
            lastUpdated: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
          };
        }

        // Create transaction record
        const transactionRecord: PointsTransaction = {
          id: firestore().collection('temp').doc().id,
          type: 'earned',
          amount,
          reason,
          source,
          metadata,
          timestamp: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        };

        // Update user points
        userPoints.totalPoints += amount;
        userPoints.availablePoints += amount;
        userPoints.pointsHistory.push(transactionRecord);
        userPoints.lastUpdated = firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp;

        transaction.set(transactionRef, userPoints);
      });

      logEvent(AnalyticsEvents.AWARD_POINTS, {
        user_id: userId,
        amount,
        reason,
        source,
      });
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  // Spend points
  async spendPoints(
    userId: string,
    amount: number,
    reason: string,
    source: PointsTransaction['source'],
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const transactionRef = this.getUserPointsCollection().doc(userId);
      
      const result = await firestore().runTransaction(async (transaction: any) => {
        const userPointsDoc = await transaction.get(transactionRef);
        
        if (!userPointsDoc.exists) {
          throw new Error('User points not found');
        }

        const userPoints = userPointsDoc.data() as UserPoints;
        
        if (userPoints.availablePoints < amount) {
          return false; // Insufficient points
        }

        // Create transaction record
        const transactionRecord: PointsTransaction = {
          id: firestore().collection('temp').doc().id,
          type: 'spent',
          amount: -amount,
          reason,
          source,
          metadata,
          timestamp: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        };

        // Update user points
        userPoints.availablePoints -= amount;
        userPoints.spentPoints += amount;
        userPoints.pointsHistory.push(transactionRecord);
        userPoints.lastUpdated = firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp;

        transaction.set(transactionRef, userPoints);
        return true;
      });

      if (result) {
        logEvent(AnalyticsEvents.SPEND_POINTS, {
          user_id: userId,
          amount,
          reason,
          source,
        });
      }

      return result;
    } catch (error) {
      console.error('Error spending points:', error);
      throw error;
    }
  }

  // Get user points
  async getUserPoints(userId: string): Promise<UserPoints | null> {
    try {
      const doc = await this.getUserPointsCollection().doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }

      return doc.data() as UserPoints;
    } catch (error) {
      console.error('Error getting user points:', error);
      throw error;
    }
  }

  // Create a new badge
  async createBadge(badge: Omit<Badge, 'id' | 'createdAt'>): Promise<string> {
    try {
      const badgeData = {
        ...badge,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.getBadgesCollection().add(badgeData);
      
      logEvent(AnalyticsEvents.CREATE_BADGE, {
        badge_id: docRef.id,
        category: badge.category,
        rarity: badge.rarity,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating badge:', error);
      throw error;
    }
  }

  // Award badge to user
  async awardBadge(userId: string, badgeId: string, progress?: number): Promise<void> {
    try {
      // Check if user already has this badge
      const existingBadge = await this.getUserBadge(userId, badgeId);
      if (existingBadge) {
        return; // User already has this badge
      }

      // Get badge details
      const badgeDoc = await this.getBadgesCollection().doc(badgeId).get();
      if (!badgeDoc.exists) {
        throw new Error('Badge not found');
      }

      const badge = badgeDoc.data() as Badge;

      // Award the badge
      const userBadge: UserBadge = {
        id: firestore().collection('temp').doc().id,
        userId,
        badgeId,
        badge,
        earnedAt: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        progress,
      };

      await this.getUserBadgesCollection().add(userBadge);

      // Award points for the badge
      await this.awardPoints(
        userId,
        badge.pointsReward,
        `Earned badge: ${badge.name}`,
        'badge',
        { badgeId, badgeName: badge.name }
      );

      logEvent(AnalyticsEvents.AWARD_BADGE, {
        user_id: userId,
        badge_id: badgeId,
        badge_name: badge.name,
        category: badge.category,
        rarity: badge.rarity,
      });
    } catch (error) {
      console.error('Error awarding badge:', error);
      throw error;
    }
  }

  // Get user's badges
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const snapshot = await this.getUserBadgesCollection()
        .where('userId', '==', userId)
        .orderBy('earnedAt', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as UserBadge));
    } catch (error) {
      console.error('Error getting user badges:', error);
      throw error;
    }
  }

  // Get specific user badge
  async getUserBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    try {
      const snapshot = await this.getUserBadgesCollection()
        .where('userId', '==', userId)
        .where('badgeId', '==', badgeId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as UserBadge;
    } catch (error) {
      console.error('Error getting user badge:', error);
      throw error;
    }
  }

  // Check and award badges based on user activity
  async checkAndAwardBadges(userId: string, activity: {
    type: 'prediction' | 'social' | 'learning' | 'performance';
    data: Record<string, any>;
  }): Promise<UserBadge[]> {
    try {
      const awardedBadges: UserBadge[] = [];
      
      // Get all badges for the activity type
      const badgesSnapshot = await this.getBadgesCollection()
        .where('category', '==', activity.type)
        .get();

      const badges = badgesSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Badge));

      // Check each badge
      for (const badge of badges) {
        const shouldAward = await this.checkBadgeRequirements(userId, badge, activity.data);
        
        if (shouldAward) {
          await this.awardBadge(userId, badge.id);
          const userBadge = await this.getUserBadge(userId, badge.id);
          if (userBadge) {
            awardedBadges.push(userBadge);
          }
        }
      }

      return awardedBadges;
    } catch (error) {
      console.error('Error checking and awarding badges:', error);
      throw error;
    }
  }

  // Check if user meets badge requirements
  private async checkBadgeRequirements(
    userId: string,
    badge: Badge,
    activityData: Record<string, any>
  ): Promise<boolean> {
    try {
      switch (badge.requirements.type) {
        case 'streak':
          return await this.checkStreakRequirement(userId, badge, activityData);
        case 'total':
          return await this.checkTotalRequirement(userId, badge, activityData);
        case 'accuracy':
          return await this.checkAccuracyRequirement(userId, badge, activityData);
        case 'participation':
          return await this.checkParticipationRequirement(userId, badge, activityData);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking badge requirements:', error);
      return false;
    }
  }

  // Check streak requirements (e.g., 5 correct predictions in a row)
  private async checkStreakRequirement(
    userId: string,
    badge: Badge,
    activityData: Record<string, any>
  ): Promise<boolean> {
    // Implementation would depend on specific badge requirements
    // This is a simplified version
    return activityData.streak >= badge.requirements.value;
  }

  // Check total requirements (e.g., 100 total predictions)
  private async checkTotalRequirement(
    userId: string,
    badge: Badge,
    activityData: Record<string, any>
  ): Promise<boolean> {
    return activityData.total >= badge.requirements.value;
  }

  // Check accuracy requirements (e.g., 80% accuracy over 20 predictions)
  private async checkAccuracyRequirement(
    userId: string,
    badge: Badge,
    activityData: Record<string, any>
  ): Promise<boolean> {
    return activityData.accuracy >= badge.requirements.value;
  }

  // Check participation requirements (e.g., participated in 10 competitions)
  private async checkParticipationRequirement(
    userId: string,
    badge: Badge,
    activityData: Record<string, any>
  ): Promise<boolean> {
    return activityData.participations >= badge.requirements.value;
  }

  // Get leaderboard
  async getLeaderboard(
    category: LeaderboardEntry['category'],
    period: LeaderboardEntry['period'],
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      const snapshot = await this.getLeaderboardCollection()
        .where('category', '==', category)
        .where('period', '==', period)
        .orderBy('score', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as LeaderboardEntry));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // Update leaderboard entry
  async updateLeaderboardEntry(
    userId: string,
    category: LeaderboardEntry['category'],
    period: LeaderboardEntry['period'],
    score: number,
    additionalData?: Partial<LeaderboardEntry>
  ): Promise<void> {
    try {
      const entryId = `${userId}_${category}_${period}`;
      const entryRef = this.getLeaderboardCollection().doc(entryId);
      
      const entryData: any = {
        userId,
        category,
        period,
        score,
        lastUpdated: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        ...additionalData,
      };

      await entryRef.set(entryData, { merge: true });

      logEvent(AnalyticsEvents.UPDATE_LEADERBOARD, {
        user_id: userId,
        category,
        period,
        score,
      });
    } catch (error) {
      console.error('Error updating leaderboard entry:', error);
      throw error;
    }
  }

  // Get user's rank in leaderboard
  async getUserRank(
    userId: string,
    category: LeaderboardEntry['category'],
    period: LeaderboardEntry['period']
  ): Promise<number> {
    try {
      const leaderboard = await this.getLeaderboard(category, period, 1000);
      const userEntry = leaderboard.find(entry => entry.userId === userId);
      return userEntry ? userEntry.rank : -1;
    } catch (error) {
      console.error('Error getting user rank:', error);
      throw error;
    }
  }

  // Subscribe to user's points
  subscribeToUserPoints(
    userId: string,
    callback: (points: UserPoints | null) => void
  ): () => void {
    return this.getUserPointsCollection()
      .doc(userId)
      .onSnapshot((doc: any) => {
        if (doc.exists) {
          callback(doc.data() as UserPoints);
        } else {
          callback(null);
        }
      });
  }

  // Subscribe to user's badges
  subscribeToUserBadges(
    userId: string,
    callback: (badges: UserBadge[]) => void
  ): () => void {
    return this.getUserBadgesCollection()
      .where('userId', '==', userId)
      .orderBy('earnedAt', 'desc')
      .onSnapshot((snapshot: any) => {
        const badges = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as UserBadge));
        callback(badges);
      });
  }
}

export const rewardSystem = new RewardSystem();
