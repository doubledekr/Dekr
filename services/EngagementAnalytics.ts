// Engagement analytics service for basic analytics and insights
import { Platform } from 'react-native';

// Check if we're running in Expo Go (which doesn't support native Firebase modules)
const isExpoGo = typeof global.__expo !== 'undefined' && global.__expo?.modules?.ExpoGo;

// Dummy implementations for Expo Go
const dummyFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: () => Promise.resolve({ id: 'dummy-id' }),
    where: () => ({
      orderBy: () => ({
        limit: () => ({
          get: () => Promise.resolve({ docs: [] })
        }),
        get: () => Promise.resolve({ docs: [] })
      }),
      limit: () => ({
        get: () => Promise.resolve({ docs: [] })
      }),
      get: () => Promise.resolve({ docs: [] })
    }),
    orderBy: () => ({
      limit: () => ({
        get: () => Promise.resolve({ docs: [] })
      }),
      get: () => Promise.resolve({ docs: [] })
    }),
    limit: () => ({
      get: () => Promise.resolve({ docs: [] })
    }),
    get: () => Promise.resolve({ docs: [] })
  }),
  FieldValue: {
    serverTimestamp: () => ({ _type: 'serverTimestamp' }),
    increment: (value: number) => ({ _type: 'increment', value }),
    arrayUnion: (item: any) => ({ _type: 'arrayUnion', value: item }),
    arrayRemove: (item: any) => ({ _type: 'arrayRemove', value: item })
  }
};

// Export appropriate Firebase services based on platform
export let firestore: any;

if (Platform.OS === 'web' || isExpoGo) {
  // Use dummy implementations for web/Expo Go
  firestore = () => dummyFirestore;
  console.log('🔄 Using dummy Firebase services for EngagementAnalytics (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for EngagementAnalytics');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for EngagementAnalytics, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Import types from other services
import { 
  UserInteraction, 
  UserPreferences, 
  CardType, 
  InteractionAction,
  SessionData 
} from './EngagementTracker';

// Types for analytics
export interface UserEngagementReport {
  userId: string;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalInteractions: number;
    totalSessions: number;
    averageSessionLength: number;
    mostActiveDay: string;
    mostActiveTime: string;
    favoriteContentType: CardType;
    engagementScore: number;
  };
  contentPerformance: {
    contentType: CardType;
    interactions: number;
    completionRate: number;
    averageTimeSpent: number;
    swipeRightRate: number;
  }[];
  trends: {
    dailyInteractions: { date: string; count: number }[];
    weeklySessions: { week: string; count: number; averageLength: number }[];
    contentTypeTrends: { type: CardType; trend: 'increasing' | 'decreasing' | 'stable' }[];
  };
  recommendations: string[];
}

export interface ContentPerformance {
  cardId: string;
  cardType: CardType;
  totalViews: number;
  totalInteractions: number;
  swipeRightRate: number;
  swipeLeftRate: number;
  saveRate: number;
  shareRate: number;
  averageTimeSpent: number;
  completionRate: number;
  performanceScore: number;
}

export interface EngagementMetrics {
  sessionLength: {
    average: number;
    median: number;
    distribution: { range: string; count: number }[];
  };
  swipeRates: {
    right: number;
    left: number;
    byContentType: Record<CardType, { right: number; left: number }>;
  };
  completionRates: {
    overall: number;
    byContentType: Record<CardType, number>;
    byDifficulty: Record<string, number>;
  };
  engagementTrends: {
    dailyActiveUsers: number;
    weeklyRetention: number;
    monthlyRetention: number;
    averageInteractionsPerUser: number;
  };
}

export interface EngagementTrend {
  period: string;
  metric: string;
  value: number;
  change: number; // Percentage change from previous period
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ContentRecommendation {
  cardId: string;
  cardType: CardType;
  title: string;
  reason: string;
  confidence: number;
  basedOn: string[];
}

// Engagement Analytics Service
export class EngagementAnalytics {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Generate comprehensive user engagement report
  async generateUserEngagementReport(userId: string, daysBack: number = 30): Promise<UserEngagementReport> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [interactions, sessions, preferences] = await Promise.all([
        this.getUserInteractions(userId, startDate, endDate),
        this.getUserSessions(userId, startDate, endDate),
        this.getUserPreferences(userId)
      ]);

      // Calculate summary metrics
      const totalInteractions = interactions.length;
      const totalSessions = sessions.length;
      const averageSessionLength = this.calculateAverageSessionLength(sessions);
      const mostActiveDay = this.findMostActiveDay(interactions);
      const mostActiveTime = this.findMostActiveTime(interactions);
      const favoriteContentType = this.findFavoriteContentType(interactions);
      const engagementScore = this.calculateEngagementScore(interactions, sessions);

      // Analyze content performance
      const contentPerformance = this.analyzeContentPerformance(interactions);

      // Analyze trends
      const trends = this.analyzeTrends(interactions, sessions);

      // Generate recommendations
      const recommendations = this.generateRecommendations(interactions, preferences);

      const report: UserEngagementReport = {
        userId,
        period: { start: startDate, end: endDate },
        summary: {
          totalInteractions,
          totalSessions,
          averageSessionLength,
          mostActiveDay,
          mostActiveTime,
          favoriteContentType,
          engagementScore
        },
        contentPerformance,
        trends,
        recommendations
      };

      console.log('📊 Generated engagement report for user:', userId);
      return report;
    } catch (error) {
      console.error('Error generating user engagement report:', error);
      throw error;
    }
  }

  // Track content performance across users
  async trackContentPerformance(cardId: string): Promise<ContentPerformance> {
    try {
      // Get all interactions for this card
      const interactions = await this.getCardInteractions(cardId);
      
      if (interactions.length === 0) {
        return this.createEmptyContentPerformance(cardId);
      }

      const totalViews = interactions.filter(i => i.action === 'view').length;
      const totalInteractions = interactions.length;
      const swipeRightCount = interactions.filter(i => i.action === 'swipe_right').length;
      const swipeLeftCount = interactions.filter(i => i.action === 'swipe_left').length;
      const saveCount = interactions.filter(i => i.action === 'save').length;
      const shareCount = interactions.filter(i => i.action === 'share').length;
      const completeCount = interactions.filter(i => i.action === 'complete').length;

      const swipeRightRate = totalViews > 0 ? swipeRightCount / totalViews : 0;
      const swipeLeftRate = totalViews > 0 ? swipeLeftCount / totalViews : 0;
      const saveRate = totalViews > 0 ? saveCount / totalViews : 0;
      const shareRate = totalViews > 0 ? shareCount / totalViews : 0;
      const completionRate = totalViews > 0 ? completeCount / totalViews : 0;

      const averageTimeSpent = this.calculateAverageTimeSpent(interactions);
      const performanceScore = this.calculatePerformanceScore({
        swipeRightRate,
        saveRate,
        shareRate,
        completionRate,
        averageTimeSpent
      });

      const performance: ContentPerformance = {
        cardId,
        cardType: interactions[0]?.cardType || 'lesson',
        totalViews,
        totalInteractions,
        swipeRightRate,
        swipeLeftRate,
        saveRate,
        shareRate,
        averageTimeSpent,
        completionRate,
        performanceScore
      };

      // Store performance data
      await this.db
        .collection('content_performance')
        .doc(cardId)
        .set({
          ...performance,
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });

      return performance;
    } catch (error) {
      console.error('Error tracking content performance:', error);
      return this.createEmptyContentPerformance(cardId);
    }
  }

  // Calculate key engagement metrics
  async calculateEngagementMetrics(daysBack: number = 30): Promise<EngagementMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [allInteractions, allSessions] = await Promise.all([
        this.getAllInteractions(startDate, endDate),
        this.getAllSessions(startDate, endDate)
      ]);

      // Session length analysis
      const sessionLengths = allSessions
        .filter(s => s.duration)
        .map(s => s.duration!);
      
      const sessionLength = {
        average: this.calculateAverage(sessionLengths),
        median: this.calculateMedian(sessionLengths),
        distribution: this.calculateSessionLengthDistribution(sessionLengths)
      };

      // Swipe rate analysis
      const swipeRates = this.calculateSwipeRates(allInteractions);

      // Completion rate analysis
      const completionRates = this.calculateCompletionRates(allInteractions);

      // Engagement trends
      const engagementTrends = this.calculateEngagementTrends(allInteractions, allSessions);

      return {
        sessionLength,
        swipeRates,
        completionRates,
        engagementTrends
      };
    } catch (error) {
      console.error('Error calculating engagement metrics:', error);
      throw error;
    }
  }

  // Identify engagement trends over time
  async identifyEngagementTrends(daysBack: number = 90): Promise<EngagementTrend[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const [interactions, sessions] = await Promise.all([
        this.getAllInteractions(startDate, endDate),
        this.getAllSessions(startDate, endDate)
      ]);

      const trends: EngagementTrend[] = [];

      // Daily active users trend
      const dailyUsers = this.calculateDailyActiveUsers(interactions);
      const dauTrend = this.calculateTrend(dailyUsers, 'daily_active_users');
      trends.push(dauTrend);

      // Session length trend
      const sessionLengths = sessions
        .filter(s => s.duration)
        .map(s => s.duration!);
      const sessionLengthTrend = this.calculateTrend(sessionLengths, 'average_session_length');
      trends.push(sessionLengthTrend);

      // Interaction count trend
      const interactionCounts = this.calculateDailyInteractionCounts(interactions);
      const interactionTrend = this.calculateTrend(interactionCounts, 'daily_interactions');
      trends.push(interactionTrend);

      return trends;
    } catch (error) {
      console.error('Error identifying engagement trends:', error);
      return [];
    }
  }

  // Generate content recommendations for user
  async generateContentRecommendations(userId: string, limit: number = 10): Promise<ContentRecommendation[]> {
    try {
      const [preferences, interactions] = await Promise.all([
        this.getUserPreferences(userId),
        this.getUserInteractions(userId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())
      ]);

      if (!preferences || interactions.length < 5) {
        return this.getDefaultRecommendations(limit);
      }

      const recommendations: ContentRecommendation[] = [];

      // Recommend based on favorite content types
      for (const contentType of preferences.favoriteContentTypes) {
        const similarContent = await this.findSimilarContent(contentType, interactions);
        recommendations.push(...similarContent);
      }

      // Recommend based on preferred sectors
      for (const sector of preferences.preferredSectors) {
        const sectorContent = await this.findSectorContent(sector, interactions);
        recommendations.push(...sectorContent);
      }

      // Recommend based on engagement patterns
      const timeBasedRecommendations = await this.findTimeBasedRecommendations(preferences, interactions);
      recommendations.push(...timeBasedRecommendations);

      // Sort by confidence and remove duplicates
      const uniqueRecommendations = this.deduplicateRecommendations(recommendations);
      return uniqueRecommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);
    } catch (error) {
      console.error('Error generating content recommendations:', error);
      return this.getDefaultRecommendations(limit);
    }
  }

  // Export data for further analysis
  async exportUserData(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const [interactions, sessions, preferences] = await Promise.all([
        this.getUserInteractions(userId, new Date(0), new Date()),
        this.getUserSessions(userId, new Date(0), new Date()),
        this.getUserPreferences(userId)
      ]);

      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        interactions,
        sessions,
        preferences
      };

      if (format === 'csv') {
        return this.convertToCSV(exportData);
      }

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Real-time engagement monitoring
  async getRealTimeEngagementMetrics(): Promise<{
    activeUsers: number;
    currentSessions: number;
    interactionsLastHour: number;
    topPerformingContent: ContentPerformance[];
  }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const now = new Date();

      const [recentInteractions, activeSessions] = await Promise.all([
        this.getAllInteractions(oneHourAgo, now),
        this.getActiveSessions()
      ]);

      const activeUsers = new Set(recentInteractions.map(i => i.sessionId)).size;
      const currentSessions = activeSessions.length;
      const interactionsLastHour = recentInteractions.length;

      // Get top performing content from recent interactions
      const contentPerformance = await this.getTopPerformingContent(recentInteractions);

      return {
        activeUsers,
        currentSessions,
        interactionsLastHour,
        topPerformingContent: contentPerformance.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting real-time engagement metrics:', error);
      return {
        activeUsers: 0,
        currentSessions: 0,
        interactionsLastHour: 0,
        topPerformingContent: []
      };
    }
  }

  // Helper methods
  private async getUserInteractions(userId: string, startDate: Date, endDate: Date): Promise<UserInteraction[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting user interactions:', error);
      return [];
    }
  }

  private async getUserSessions(userId: string, startDate: Date, endDate: Date): Promise<SessionData[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .where('startTime', '>=', startDate)
        .where('startTime', '<=', endDate)
        .orderBy('startTime', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate()
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  private async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const doc = await this.db
        .collection('users')
        .doc(userId)
        .collection('preferences')
        .doc('main')
        .get();

      if (doc.exists) {
        return {
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  private async getCardInteractions(cardId: string): Promise<UserInteraction[]> {
    try {
      const snapshot = await this.db
        .collectionGroup('interactions')
        .where('cardId', '==', cardId)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting card interactions:', error);
      return [];
    }
  }

  private async getAllInteractions(startDate: Date, endDate: Date): Promise<UserInteraction[]> {
    try {
      const snapshot = await this.db
        .collectionGroup('interactions')
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting all interactions:', error);
      return [];
    }
  }

  private async getAllSessions(startDate: Date, endDate: Date): Promise<SessionData[]> {
    try {
      const snapshot = await this.db
        .collectionGroup('sessions')
        .where('startTime', '>=', startDate)
        .where('startTime', '<=', endDate)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate()
      }));
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  }

  private async getActiveSessions(): Promise<SessionData[]> {
    try {
      const snapshot = await this.db
        .collectionGroup('sessions')
        .where('isActive', '==', true)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate()
      }));
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  // Calculation helper methods
  private calculateAverageSessionLength(sessions: SessionData[]): number {
    const validSessions = sessions.filter(s => s.duration);
    if (validSessions.length === 0) return 0;
    
    const totalDuration = validSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    return totalDuration / validSessions.length;
  }

  private findMostActiveDay(interactions: UserInteraction[]): string {
    const dayCounts = new Map<string, number>();
    
    interactions.forEach(interaction => {
      const day = interaction.context.dayOfWeek;
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    });

    let mostActiveDay = 'monday';
    let maxCount = 0;
    
    dayCounts.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    });

    return mostActiveDay;
  }

  private findMostActiveTime(interactions: UserInteraction[]): string {
    const timeCounts = new Map<string, number>();
    
    interactions.forEach(interaction => {
      const time = interaction.context.timeOfDay;
      timeCounts.set(time, (timeCounts.get(time) || 0) + 1);
    });

    let mostActiveTime = 'morning';
    let maxCount = 0;
    
    timeCounts.forEach((count, time) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveTime = time;
      }
    });

    return mostActiveTime;
  }

  private findFavoriteContentType(interactions: UserInteraction[]): CardType {
    const typeCounts = new Map<CardType, number>();
    
    interactions.forEach(interaction => {
      typeCounts.set(interaction.cardType, (typeCounts.get(interaction.cardType) || 0) + 1);
    });

    let favoriteType: CardType = 'lesson';
    let maxCount = 0;
    
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteType = type;
      }
    });

    return favoriteType;
  }

  private calculateEngagementScore(interactions: UserInteraction[], sessions: SessionData[]): number {
    const interactionScore = Math.min(interactions.length / 100, 1) * 0.4; // Max at 100 interactions
    const sessionScore = Math.min(sessions.length / 20, 1) * 0.3; // Max at 20 sessions
    const timeScore = Math.min(this.calculateAverageSessionLength(sessions) / 600000, 1) * 0.3; // Max at 10 minutes
    
    return (interactionScore + sessionScore + timeScore) * 100;
  }

  private analyzeContentPerformance(interactions: UserInteraction[]) {
    const typeStats = new Map<CardType, {
      interactions: number;
      completions: number;
      totalTimeSpent: number;
      swipeRights: number;
      swipeLefts: number;
    }>();

    interactions.forEach(interaction => {
      const current = typeStats.get(interaction.cardType) || {
        interactions: 0,
        completions: 0,
        totalTimeSpent: 0,
        swipeRights: 0,
        swipeLefts: 0
      };

      current.interactions++;
      current.totalTimeSpent += interaction.context.timeSpent || 0;

      if (interaction.action === 'complete') {
        current.completions++;
      } else if (interaction.action === 'swipe_right') {
        current.swipeRights++;
      } else if (interaction.action === 'swipe_left') {
        current.swipeLefts++;
      }

      typeStats.set(interaction.cardType, current);
    });

    const performance = [];
    typeStats.forEach((stats, type) => {
      const completionRate = stats.interactions > 0 ? stats.completions / stats.interactions : 0;
      const averageTimeSpent = stats.interactions > 0 ? stats.totalTimeSpent / stats.interactions : 0;
      const swipeRightRate = (stats.swipeRights + stats.swipeLefts) > 0 ? stats.swipeRights / (stats.swipeRights + stats.swipeLefts) : 0;

      performance.push({
        contentType: type,
        interactions: stats.interactions,
        completionRate,
        averageTimeSpent,
        swipeRightRate
      });
    });

    return performance;
  }

  private analyzeTrends(interactions: UserInteraction[], sessions: SessionData[]) {
    // Daily interactions
    const dailyInteractions = this.calculateDailyInteractionCounts(interactions);
    
    // Weekly sessions
    const weeklySessions = this.calculateWeeklySessionCounts(sessions);
    
    // Content type trends
    const contentTypeTrends = this.calculateContentTypeTrends(interactions);

    return {
      dailyInteractions,
      weeklySessions,
      contentTypeTrends
    };
  }

  private generateRecommendations(interactions: UserInteraction[], preferences: UserPreferences | null): string[] {
    const recommendations: string[] = [];

    if (!preferences) {
      return ['Complete your profile to get personalized recommendations'];
    }

    if (preferences.favoriteContentTypes.length === 0) {
      recommendations.push('Try different content types to discover your preferences');
    }

    if (preferences.preferredSectors.length === 0) {
      recommendations.push('Explore different market sectors to find your interests');
    }

    if (preferences.optimalSessionLength < 5) {
      recommendations.push('Try longer sessions to get more value from the content');
    }

    if (preferences.confidence < 0.5) {
      recommendations.push('Engage more with content to improve recommendation accuracy');
    }

    return recommendations;
  }

  // Additional helper methods for calculations
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private calculateMedian(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateSessionLengthDistribution(sessionLengths: number[]) {
    const ranges = [
      { range: '0-2 min', min: 0, max: 120000 },
      { range: '2-5 min', min: 120000, max: 300000 },
      { range: '5-10 min', min: 300000, max: 600000 },
      { range: '10+ min', min: 600000, max: Infinity }
    ];

    return ranges.map(range => ({
      range: range.range,
      count: sessionLengths.filter(length => length >= range.min && length < range.max).length
    }));
  }

  private calculateSwipeRates(interactions: UserInteraction[]) {
    const totalSwipes = interactions.filter(i => i.action === 'swipe_right' || i.action === 'swipe_left');
    const rightSwipes = interactions.filter(i => i.action === 'swipe_right');
    const leftSwipes = interactions.filter(i => i.action === 'swipe_left');

    const overallRight = totalSwipes.length > 0 ? rightSwipes.length / totalSwipes.length : 0;
    const overallLeft = totalSwipes.length > 0 ? leftSwipes.length / totalSwipes.length : 0;

    // Calculate by content type
    const byContentType: Record<CardType, { right: number; left: number }> = {} as any;
    const contentTypes: CardType[] = ['lesson', 'podcast', 'news', 'stock', 'crypto', 'challenge'];
    
    contentTypes.forEach(type => {
      const typeSwipes = totalSwipes.filter(i => i.cardType === type);
      const typeRight = typeSwipes.filter(i => i.action === 'swipe_right');
      const typeLeft = typeSwipes.filter(i => i.action === 'swipe_left');
      
      byContentType[type] = {
        right: typeSwipes.length > 0 ? typeRight.length / typeSwipes.length : 0,
        left: typeSwipes.length > 0 ? typeLeft.length / typeSwipes.length : 0
      };
    });

    return {
      right: overallRight,
      left: overallLeft,
      byContentType
    };
  }

  private calculateCompletionRates(interactions: UserInteraction()) {
    const completableInteractions = interactions.filter(i => 
      i.cardType === 'lesson' || i.cardType === 'podcast'
    );
    const completions = interactions.filter(i => i.action === 'complete');

    const overall = completableInteractions.length > 0 ? completions.length / completableInteractions.length : 0;

    // Calculate by content type
    const byContentType: Record<CardType, number> = {} as any;
    const contentTypes: CardType[] = ['lesson', 'podcast', 'news', 'stock', 'crypto', 'challenge'];
    
    contentTypes.forEach(type => {
      const typeCompletable = completableInteractions.filter(i => i.cardType === type);
      const typeCompletions = completions.filter(i => i.cardType === type);
      byContentType[type] = typeCompletable.length > 0 ? typeCompletions.length / typeCompletable.length : 0;
    });

    // Calculate by difficulty (placeholder)
    const byDifficulty: Record<string, number> = {
      beginner: 0.8,
      intermediate: 0.6,
      advanced: 0.4
    };

    return {
      overall,
      byContentType,
      byDifficulty
    };
  }

  private calculateEngagementTrends(interactions: UserInteraction[], sessions: SessionData()) {
    const uniqueUsers = new Set(interactions.map(i => i.sessionId));
    
    return {
      dailyActiveUsers: uniqueUsers.size,
      weeklyRetention: 0.7, // Placeholder
      monthlyRetention: 0.5, // Placeholder
      averageInteractionsPerUser: interactions.length / uniqueUsers.size
    };
  }

  // Placeholder methods for content recommendations
  private async findSimilarContent(contentType: CardType, interactions: UserInteraction[]): Promise<ContentRecommendation[]> {
    // Placeholder implementation
    return [];
  }

  private async findSectorContent(sector: string, interactions: UserInteraction[]): Promise<ContentRecommendation[]> {
    // Placeholder implementation
    return [];
  }

  private async findTimeBasedRecommendations(preferences: UserPreferences, interactions: UserInteraction[]): Promise<ContentRecommendation[]> {
    // Placeholder implementation
    return [];
  }

  private getDefaultRecommendations(limit: number): ContentRecommendation[] {
    return [
      {
        cardId: 'default_1',
        cardType: 'lesson',
        title: 'Getting Started with Trading',
        reason: 'Popular beginner content',
        confidence: 0.8,
        basedOn: ['popular_content']
      }
    ].slice(0, limit);
  }

  private deduplicateRecommendations(recommendations: ContentRecommendation[]): ContentRecommendation[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.cardId)) {
        return false;
      }
      seen.add(rec.cardId);
      return true;
    });
  }

  private async getTopPerformingContent(interactions: UserInteraction[]): Promise<ContentPerformance[]> {
    // Placeholder implementation
    return [];
  }

  private createEmptyContentPerformance(cardId: string): ContentPerformance {
    return {
      cardId,
      cardType: 'lesson',
      totalViews: 0,
      totalInteractions: 0,
      swipeRightRate: 0,
      swipeLeftRate: 0,
      saveRate: 0,
      shareRate: 0,
      averageTimeSpent: 0,
      completionRate: 0,
      performanceScore: 0
    };
  }

  private calculateAverageTimeSpent(interactions: UserInteraction[]): number {
    const validInteractions = interactions.filter(i => i.context.timeSpent > 0);
    if (validInteractions.length === 0) return 0;
    
    const totalTime = validInteractions.reduce((sum, i) => sum + i.context.timeSpent, 0);
    return totalTime / validInteractions.length;
  }

  private calculatePerformanceScore(metrics: {
    swipeRightRate: number;
    saveRate: number;
    shareRate: number;
    completionRate: number;
    averageTimeSpent: number;
  }): number {
    const timeScore = Math.min(metrics.averageTimeSpent / 300000, 1); // Max at 5 minutes
    return (metrics.swipeRightRate * 0.3 + metrics.saveRate * 0.2 + metrics.shareRate * 0.2 + metrics.completionRate * 0.2 + timeScore * 0.1) * 100;
  }

  private calculateDailyInteractionCounts(interactions: UserInteraction[]): { date: string; count: number }[] {
    // Placeholder implementation
    return [];
  }

  private calculateWeeklySessionCounts(sessions: SessionData[]): { week: string; count: number; averageLength: number }[] {
    // Placeholder implementation
    return [];
  }

  private calculateContentTypeTrends(interactions: UserInteraction[]): { type: CardType; trend: 'increasing' | 'decreasing' | 'stable' }[] {
    // Placeholder implementation
    return [];
  }

  private calculateTrend(values: number[], metric: string): EngagementTrend {
    // Placeholder implementation
    return {
      period: '30d',
      metric,
      value: 0,
      change: 0,
      trend: 'stable'
    };
  }

  private convertToCSV(data: any): string {
    // Placeholder implementation
    return JSON.stringify(data);
  }
}

// Export singleton instance
export const engagementAnalytics = new EngagementAnalytics();
