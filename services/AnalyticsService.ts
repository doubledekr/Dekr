import { logEvent, AnalyticsEvents } from './analytics';
import { firestore } from './firebase';
import { Platform } from 'react-native';

export interface UserAnalytics {
  userId: string;
  sessionId: string;
  events: AnalyticsEvent[];
  sessionStart: FirebaseFirestoreTypes.Timestamp;
  sessionEnd?: FirebaseFirestoreTypes.Timestamp;
  totalEvents: number;
  lastActivity: FirebaseFirestoreTypes.Timestamp;
}

export interface AnalyticsEvent {
  id: string;
  eventName: string;
  timestamp: FirebaseFirestoreTypes.Timestamp;
  properties: Record<string, any>;
  userId: string;
  sessionId: string;
  platform: 'ios' | 'android' | 'web';
  version: string;
}

export interface AppPerformance {
  userId: string;
  sessionId: string;
  metrics: {
    appLaunchTime: number;
    screenLoadTimes: Record<string, number>;
    apiResponseTimes: Record<string, number>;
    crashCount: number;
    errorCount: number;
    memoryUsage: number;
    batteryLevel?: number;
  };
  timestamp: FirebaseFirestoreTypes.Timestamp;
}

export interface UserJourney {
  userId: string;
  journey: {
    step: string;
    timestamp: FirebaseFirestoreTypes.Timestamp;
    properties: Record<string, any>;
  }[];
  currentStep: string;
  completedSteps: string[];
  startedAt: FirebaseFirestoreTypes.Timestamp;
  lastUpdated: FirebaseFirestoreTypes.Timestamp;
}

export interface FeatureUsage {
  featureName: string;
  userId: string;
  usageCount: number;
  lastUsed: FirebaseFirestoreTypes.Timestamp;
  totalTimeSpent: number; // in seconds
  successRate: number; // percentage
}

export class AnalyticsService {
  private getAnalyticsCollection() {
    return firestore().collection('analytics');
  }

  private getUserAnalyticsCollection() {
    return firestore().collection('user_analytics');
  }

  private getPerformanceCollection() {
    return firestore().collection('app_performance');
  }

  private getJourneyCollection() {
    return firestore().collection('user_journeys');
  }

  private getFeatureUsageCollection() {
    return firestore().collection('feature_usage');
  }

  // Track user session
  async startSession(userId: string, sessionId: string): Promise<void> {
    try {
      const sessionData: UserAnalytics = {
        userId,
        sessionId,
        events: [],
        sessionStart: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        totalEvents: 0,
        lastActivity: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
      };

      await this.getUserAnalyticsCollection().doc(sessionId).set(sessionData);

      logEvent(AnalyticsEvents.START_SESSION, {
        user_id: userId,
        session_id: sessionId,
      });
    } catch (error) {
      console.error('Error starting session:', error);
    }
  }

  // End user session
  async endSession(sessionId: string): Promise<void> {
    try {
      await this.getUserAnalyticsCollection().doc(sessionId).update({
        sessionEnd: firestore.FieldValue.serverTimestamp(),
        lastActivity: firestore.FieldValue.serverTimestamp(),
      });

      logEvent(AnalyticsEvents.END_SESSION, {
        session_id: sessionId,
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  // Track custom event
  async trackEvent(
    eventName: string,
    properties: Record<string, any>,
    userId: string,
    sessionId: string
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        id: firestore().collection('temp').doc().id,
        eventName,
        timestamp: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        properties,
        userId,
        sessionId,
        platform: 'ios', // This would be determined dynamically
        version: '1.0.0', // This would be determined dynamically
      };

      // Add to session events
      await this.getUserAnalyticsCollection().doc(sessionId).update({
        events: firestore.FieldValue.arrayUnion(event),
        totalEvents: firestore.FieldValue.increment(1),
        lastActivity: firestore.FieldValue.serverTimestamp(),
      });

      // Also store in analytics collection for global analysis
      await this.getAnalyticsCollection().add(event);

      logEvent(eventName as any, {
        user_id: userId,
        session_id: sessionId,
        ...properties,
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Track app performance metrics
  async trackPerformance(
    userId: string,
    sessionId: string,
    metrics: AppPerformance['metrics']
  ): Promise<void> {
    try {
      const performanceData: AppPerformance = {
        userId,
        sessionId,
        metrics,
        timestamp: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
      };

      await this.getPerformanceCollection().add(performanceData);

      logEvent(AnalyticsEvents.TRACK_PERFORMANCE, {
        user_id: userId,
        session_id: sessionId,
        metrics,
      });
    } catch (error) {
      console.error('Error tracking performance:', error);
    }
  }

  // Track user journey step
  async trackJourneyStep(
    userId: string,
    step: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    try {
      const journeyStep = {
        step,
        timestamp: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        properties,
      };

      const journeyRef = this.getJourneyCollection().doc(userId);
      const journeyDoc = await journeyRef.get();

      if (journeyDoc.exists) {
        const journey = journeyDoc.data() as UserJourney;
        const updatedJourney = {
          ...journey,
          journey: [...journey.journey, journeyStep],
          currentStep: step,
          completedSteps: journey.completedSteps.includes(step) 
            ? journey.completedSteps 
            : [...journey.completedSteps, step],
          lastUpdated: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        };

        await journeyRef.update(updatedJourney);
      } else {
        const newJourney: UserJourney = {
          userId,
          journey: [journeyStep],
          currentStep: step,
          completedSteps: [step],
          startedAt: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
          lastUpdated: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
        };

        await journeyRef.set(newJourney);
      }

      logEvent(AnalyticsEvents.TRACK_JOURNEY, {
        user_id: userId,
        step,
        properties,
      });
    } catch (error) {
      console.error('Error tracking journey step:', error);
    }
  }

  // Track feature usage
  async trackFeatureUsage(
    featureName: string,
    userId: string,
    timeSpent: number = 0,
    success: boolean = true
  ): Promise<void> {
    try {
      const featureRef = this.getFeatureUsageCollection().doc(`${userId}_${featureName}`);
      const featureDoc = await featureRef.get();

      if (featureDoc.exists) {
        const feature = featureDoc.data() as FeatureUsage;
        const newUsageCount = feature.usageCount + 1;
        const newTotalTime = feature.totalTimeSpent + timeSpent;
        const newSuccessRate = ((feature.successRate * feature.usageCount + (success ? 1 : 0)) / newUsageCount) * 100;

        await featureRef.update({
          usageCount: newUsageCount,
          totalTimeSpent: newTotalTime,
          successRate: newSuccessRate,
          lastUsed: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const newFeature: FeatureUsage = {
          featureName,
          userId,
          usageCount: 1,
          lastUsed: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
          totalTimeSpent: timeSpent,
          successRate: success ? 100 : 0,
        };

        await featureRef.set(newFeature);
      }

      logEvent(AnalyticsEvents.TRACK_FEATURE_USAGE, {
        user_id: userId,
        feature_name: featureName,
        time_spent: timeSpent,
        success,
      });
    } catch (error) {
      console.error('Error tracking feature usage:', error);
    }
  }

  // Track crash/error
  async trackError(
    error: Error,
    userId: string,
    sessionId: string,
    context: string = '',
    additionalData: Record<string, any> = {}
  ): Promise<void> {
    try {
      const errorData = {
        userId,
        sessionId,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        context,
        additionalData,
        timestamp: firestore.FieldValue.serverTimestamp() as FirebaseFirestoreTypes.Timestamp,
      };

      await this.getAnalyticsCollection().add({
        eventName: 'error_occurred',
        ...errorData,
      });

      logEvent(AnalyticsEvents.ERROR_OCCURRED, {
        user_id: userId,
        session_id: sessionId,
        error_name: error.name,
        error_message: error.message,
        context,
        ...additionalData,
      });
    } catch (error) {
      console.error('Error tracking error:', error);
    }
  }

  // Get user analytics
  async getUserAnalytics(userId: string, limit: number = 50): Promise<UserAnalytics[]> {
    try {
      const snapshot = await this.getUserAnalyticsCollection()
        .where('userId', '==', userId)
        .orderBy('sessionStart', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as UserAnalytics));
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  // Get feature usage statistics
  async getFeatureUsageStats(featureName?: string): Promise<FeatureUsage[]> {
    try {
      let query = this.getFeatureUsageCollection().orderBy('usageCount', 'desc');
      
      if (featureName) {
        query = query.where('featureName', '==', featureName);
      }

      const snapshot = await query.limit(100).get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as FeatureUsage));
    } catch (error) {
      console.error('Error getting feature usage stats:', error);
      throw error;
    }
  }

  // Get user journey
  async getUserJourney(userId: string): Promise<UserJourney | null> {
    try {
      const doc = await this.getJourneyCollection().doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as UserJourney;
    } catch (error) {
      console.error('Error getting user journey:', error);
      throw error;
    }
  }

  // Get app performance metrics
  async getPerformanceMetrics(userId?: string, limit: number = 100): Promise<AppPerformance[]> {
    try {
      let query = this.getPerformanceCollection().orderBy('timestamp', 'desc');
      
      if (userId) {
        query = query.where('userId', '==', userId);
      }

      const snapshot = await query.limit(limit).get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as AppPerformance));
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  // Get analytics summary
  async getAnalyticsSummary(): Promise<{
    totalUsers: number;
    totalSessions: number;
    totalEvents: number;
    averageSessionDuration: number;
    topFeatures: FeatureUsage[];
    errorRate: number;
  }> {
    try {
      // This would typically involve multiple queries and aggregations
      // For now, returning a simplified version
      const sessionsSnapshot = await this.getUserAnalyticsCollection().get();
      const featuresSnapshot = await this.getFeatureUsageCollection()
        .orderBy('usageCount', 'desc')
        .limit(10)
        .get();

      const totalSessions = sessionsSnapshot.size;
      const totalEvents = sessionsSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data() as UserAnalytics;
        return sum + data.totalEvents;
      }, 0);

      const topFeatures = featuresSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as FeatureUsage));

      return {
        totalUsers: 0, // Would need separate user count query
        totalSessions,
        totalEvents,
        averageSessionDuration: 0, // Would need to calculate from session data
        topFeatures,
        errorRate: 0, // Would need to calculate from error events
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      throw error;
    }
  }

  // Subscribe to real-time analytics
  subscribeToUserAnalytics(
    userId: string,
    callback: (analytics: UserAnalytics[]) => void
  ): () => void {
    return this.getUserAnalyticsCollection()
      .where('userId', '==', userId)
      .orderBy('sessionStart', 'desc')
      .limit(10)
      .onSnapshot((snapshot: any) => {
        const analytics = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as UserAnalytics));
        callback(analytics);
      });
  }
}

export const analyticsService = new AnalyticsService();
