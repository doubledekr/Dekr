// Social Proof service for community validation and trust signals
import { Platform } from 'react-native';
import { UserInteraction, CardType, InteractionAction } from './EngagementTracker';

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
  console.log('🔄 Using dummy Firebase services for SocialProof (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for SocialProof');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for SocialProof, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Types for social proof
export interface CommunityEngagementMetrics {
  cardId: string;
  totalUsers: number;
  positiveEngagement: number;
  completionRate: number;
  shareCount: number;
  saveCount: number;
  averageRating: number;
  segmentBreakdown: Record<string, {
    userCount: number;
    engagementRate: number;
  }>;
  lastUpdated: Date;
}

export interface SimilarUserActivity {
  cardId: string;
  similarUserCount: number;
  activityType: 'viewed' | 'completed' | 'saved' | 'shared';
  timeFrame: 'recent' | 'today' | 'this_week' | 'this_month';
  segment: string;
  confidence: number;
  lastUpdated: Date;
}

export interface CommunityEndorsement {
  cardId: string;
  endorsementType: 'expert_recommended' | 'community_favorite' | 'trending' | 'highly_rated';
  endorserCount: number;
  endorserType: 'expert' | 'peer' | 'community';
  endorsementStrength: number; // 0-1
  endorsementReason: string;
  segment: string;
  lastUpdated: Date;
}

export interface SocialProofIndicator {
  cardId: string;
  indicatorType: 'popularity' | 'quality' | 'trending' | 'expert_approved' | 'peer_validated';
  value: number;
  label: string;
  description: string;
  confidence: number;
  segment: string;
  lastUpdated: Date;
}

export interface ExpertValidation {
  cardId: string;
  expertId: string;
  expertType: 'financial_advisor' | 'trading_expert' | 'educator' | 'analyst';
  validationType: 'accuracy' | 'relevance' | 'quality' | 'safety';
  validationScore: number; // 0-1
  validationComment: string;
  validatedAt: Date;
  isActive: boolean;
}

export interface CommunityQualityScore {
  cardId: string;
  overallScore: number; // 0-1
  accuracyScore: number;
  relevanceScore: number;
  engagementScore: number;
  freshnessScore: number;
  userSatisfactionScore: number;
  expertValidationScore: number;
  communityFeedbackScore: number;
  segmentScores: Record<string, number>;
  lastUpdated: Date;
}

export interface SocialProofContext {
  cardId: string;
  userId: string;
  userSegment: string;
  socialProofElements: SocialProofIndicator[];
  communityContext: {
    similarUsersEngaged: number;
    segmentPopularity: number;
    expertEndorsements: number;
    qualityScore: number;
  };
  trustSignals: string[];
  lastUpdated: Date;
}

// Social Proof Service
export class SocialProofService {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Display community engagement metrics
  async displayCommunityEngagementMetrics(cardId: string): Promise<CommunityEngagementMetrics | null> {
    try {
      console.log('📊 Displaying community engagement metrics for card:', cardId);
      
      // Get card interactions
      const interactions = await this.getCardInteractions(cardId);
      
      // Calculate engagement metrics
      const metrics = await this.calculateEngagementMetrics(cardId, interactions);
      
      // Store metrics for future use
      await this.storeEngagementMetrics(metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error displaying community engagement metrics:', error);
      return null;
    }
  }

  // Show similar user activity
  async showSimilarUserActivity(cardId: string, userId: string): Promise<SimilarUserActivity[]> {
    try {
      console.log('👥 Showing similar user activity for card:', cardId);
      
      // Get user's segment
      const userSegment = await this.getUserSegment(userId);
      
      // Get similar users in the same segment
      const similarUsers = await this.getSimilarUsersInSegment(userSegment);
      
      // Get activity data for similar users
      const activities = await this.getSimilarUserActivities(cardId, similarUsers, userSegment);
      
      return activities;
    } catch (error) {
      console.error('Error showing similar user activity:', error);
      return [];
    }
  }

  // Provide community endorsements
  async provideCommunityEndorsements(cardId: string, userId: string): Promise<CommunityEndorsement[]> {
    try {
      console.log('🏆 Providing community endorsements for card:', cardId);
      
      // Get user's segment
      const userSegment = await this.getUserSegment(userId);
      
      // Get various types of endorsements
      const endorsements: CommunityEndorsement[] = [];
      
      // Expert recommendations
      const expertEndorsements = await this.getExpertEndorsements(cardId);
      endorsements.push(...expertEndorsements);
      
      // Community favorites
      const communityFavorites = await this.getCommunityFavorites(cardId, userSegment);
      endorsements.push(...communityFavorites);
      
      // Trending content
      const trendingEndorsements = await this.getTrendingEndorsements(cardId);
      endorsements.push(...trendingEndorsements);
      
      // Highly rated content
      const ratingEndorsements = await this.getRatingEndorsements(cardId);
      endorsements.push(...ratingEndorsements);
      
      return endorsements;
    } catch (error) {
      console.error('Error providing community endorsements:', error);
      return [];
    }
  }

  // Generate social proof indicators
  async generateSocialProofIndicators(cardId: string, userId: string): Promise<SocialProofIndicator[]> {
    try {
      console.log('🎯 Generating social proof indicators for card:', cardId);
      
      // Get user's segment
      const userSegment = await this.getUserSegment(userId);
      
      // Generate various types of indicators
      const indicators: SocialProofIndicator[] = [];
      
      // Popularity indicators
      const popularityIndicators = await this.generatePopularityIndicators(cardId, userSegment);
      indicators.push(...popularityIndicators);
      
      // Quality indicators
      const qualityIndicators = await this.generateQualityIndicators(cardId);
      indicators.push(...qualityIndicators);
      
      // Trending indicators
      const trendingIndicators = await this.generateTrendingIndicators(cardId);
      indicators.push(...trendingIndicators);
      
      // Expert approval indicators
      const expertIndicators = await this.generateExpertApprovalIndicators(cardId);
      indicators.push(...expertIndicators);
      
      // Peer validation indicators
      const peerIndicators = await this.generatePeerValidationIndicators(cardId, userSegment);
      indicators.push(...peerIndicators);
      
      return indicators;
    } catch (error) {
      console.error('Error generating social proof indicators:', error);
      return [];
    }
  }

  // Include expert validation
  async includeExpertValidation(cardId: string): Promise<ExpertValidation[]> {
    try {
      console.log('👨‍💼 Including expert validation for card:', cardId);
      
      // Get expert validations for the card
      const validations = await this.getExpertValidations(cardId);
      
      // Filter active validations
      const activeValidations = validations.filter(v => v.isActive);
      
      return activeValidations;
    } catch (error) {
      console.error('Error including expert validation:', error);
      return [];
    }
  }

  // Generate community-driven quality scoring
  async generateCommunityQualityScoring(cardId: string): Promise<CommunityQualityScore> {
    try {
      console.log('⭐ Generating community quality scoring for card:', cardId);
      
      // Get various quality metrics
      const accuracyScore = await this.calculateAccuracyScore(cardId);
      const relevanceScore = await this.calculateRelevanceScore(cardId);
      const engagementScore = await this.calculateEngagementScore(cardId);
      const freshnessScore = await this.calculateFreshnessScore(cardId);
      const userSatisfactionScore = await this.calculateUserSatisfactionScore(cardId);
      const expertValidationScore = await this.calculateExpertValidationScore(cardId);
      const communityFeedbackScore = await this.calculateCommunityFeedbackScore(cardId);
      
      // Calculate segment-specific scores
      const segmentScores = await this.calculateSegmentScores(cardId);
      
      // Calculate overall score
      const overallScore = (
        accuracyScore * 0.2 +
        relevanceScore * 0.15 +
        engagementScore * 0.15 +
        freshnessScore * 0.1 +
        userSatisfactionScore * 0.2 +
        expertValidationScore * 0.1 +
        communityFeedbackScore * 0.1
      );
      
      const qualityScore: CommunityQualityScore = {
        cardId,
        overallScore,
        accuracyScore,
        relevanceScore,
        engagementScore,
        freshnessScore,
        userSatisfactionScore,
        expertValidationScore,
        communityFeedbackScore,
        segmentScores,
        lastUpdated: new Date()
      };
      
      // Store quality score
      await this.storeQualityScore(qualityScore);
      
      return qualityScore;
    } catch (error) {
      console.error('Error generating community quality scoring:', error);
      return this.getDefaultQualityScore(cardId);
    }
  }

  // Generate social proof context for recommendations
  async generateSocialProofContext(cardId: string, userId: string): Promise<SocialProofContext> {
    try {
      console.log('🎯 Generating social proof context for card:', cardId, 'user:', userId);
      
      // Get user's segment
      const userSegment = await this.getUserSegment(userId);
      
      // Get social proof elements
      const socialProofElements = await this.generateSocialProofIndicators(cardId, userId);
      
      // Get community context
      const communityContext = await this.getCommunityContext(cardId, userSegment);
      
      // Generate trust signals
      const trustSignals = await this.generateTrustSignals(cardId, socialProofElements, communityContext);
      
      const context: SocialProofContext = {
        cardId,
        userId,
        userSegment,
        socialProofElements,
        communityContext,
        trustSignals,
        lastUpdated: new Date()
      };
      
      return context;
    } catch (error) {
      console.error('Error generating social proof context:', error);
      return this.getDefaultSocialProofContext(cardId, userId);
    }
  }

  // Helper methods
  private async getCardInteractions(cardId: string): Promise<UserInteraction[]> {
    try {
      const snapshot = await this.db
        .collection('cards')
        .doc(cardId)
        .collection('interactions')
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

  private async calculateEngagementMetrics(cardId: string, interactions: UserInteraction[]): Promise<CommunityEngagementMetrics> {
    const totalUsers = new Set(interactions.map(i => i.userId)).size;
    const positiveActions = ['save', 'share', 'complete', 'bookmark'];
    const positiveEngagement = interactions.filter(i => positiveActions.includes(i.action)).length;
    const completionRate = interactions.filter(i => i.action === 'complete').length / Math.max(interactions.length, 1);
    const shareCount = interactions.filter(i => i.action === 'share').length;
    const saveCount = interactions.filter(i => i.action === 'save').length;
    
    // Calculate average rating (mock data)
    const averageRating = 4.2;
    
    // Calculate segment breakdown
    const segmentBreakdown = await this.calculateSegmentBreakdown(interactions);
    
    return {
      cardId,
      totalUsers,
      positiveEngagement,
      completionRate,
      shareCount,
      saveCount,
      averageRating,
      segmentBreakdown,
      lastUpdated: new Date()
    };
  }

  private async calculateSegmentBreakdown(interactions: UserInteraction[]): Promise<Record<string, {
    userCount: number;
    engagementRate: number;
  }>> {
    const segmentData: Record<string, { userCount: number; engagementRate: number }> = {};
    
    // Group interactions by user segment
    for (const interaction of interactions) {
      const segment = await this.getUserSegment(interaction.userId);
      if (!segmentData[segment]) {
        segmentData[segment] = { userCount: 0, engagementRate: 0 };
      }
      segmentData[segment].userCount++;
    }
    
    // Calculate engagement rates
    for (const [segment, data] of Object.entries(segmentData)) {
      const segmentInteractions = interactions.filter(i => 
        this.getUserSegment(i.userId).then(s => s === segment)
      );
      const positiveActions = ['save', 'share', 'complete', 'bookmark'];
      const positiveCount = segmentInteractions.filter(i => positiveActions.includes(i.action)).length;
      data.engagementRate = positiveCount / Math.max(segmentInteractions.length, 1);
    }
    
    return segmentData;
  }

  private async getUserSegment(userId: string): Promise<string> {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      return doc.exists ? doc.data().userSegment || 'beginner' : 'beginner';
    } catch (error) {
      console.error('Error getting user segment:', error);
      return 'beginner';
    }
  }

  private async getSimilarUsersInSegment(segment: string): Promise<string[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .where('userSegment', '==', segment)
        .limit(100)
        .get();

      return snapshot.docs.map((doc: any) => doc.id);
    } catch (error) {
      console.error('Error getting similar users in segment:', error);
      return [];
    }
  }

  private async getSimilarUserActivities(
    cardId: string, 
    similarUsers: string[], 
    segment: string
  ): Promise<SimilarUserActivity[]> {
    const activities: SimilarUserActivity[] = [];
    
    // Get recent activity
    const recentActivity = await this.getRecentUserActivity(cardId, similarUsers);
    if (recentActivity > 0) {
      activities.push({
        cardId,
        similarUserCount: recentActivity,
        activityType: 'viewed',
        timeFrame: 'recent',
        segment,
        confidence: 0.8,
        lastUpdated: new Date()
      });
    }
    
    // Get completion activity
    const completionActivity = await this.getCompletionActivity(cardId, similarUsers);
    if (completionActivity > 0) {
      activities.push({
        cardId,
        similarUserCount: completionActivity,
        activityType: 'completed',
        timeFrame: 'this_week',
        segment,
        confidence: 0.9,
        lastUpdated: new Date()
      });
    }
    
    return activities;
  }

  private async getRecentUserActivity(cardId: string, userIds: string[]): Promise<number> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      let activityCount = 0;
      
      for (const userId of userIds.slice(0, 20)) { // Limit to avoid too many queries
        const snapshot = await this.db
          .collection('users')
          .doc(userId)
          .collection('interactions')
          .where('cardId', '==', cardId)
          .where('timestamp', '>=', oneWeekAgo)
          .get();
        
        if (!snapshot.empty) {
          activityCount++;
        }
      }
      
      return activityCount;
    } catch (error) {
      console.error('Error getting recent user activity:', error);
      return 0;
    }
  }

  private async getCompletionActivity(cardId: string, userIds: string[]): Promise<number> {
    try {
      let completionCount = 0;
      
      for (const userId of userIds.slice(0, 20)) { // Limit to avoid too many queries
        const snapshot = await this.db
          .collection('users')
          .doc(userId)
          .collection('interactions')
          .where('cardId', '==', cardId)
          .where('action', '==', 'complete')
          .get();
        
        if (!snapshot.empty) {
          completionCount++;
        }
      }
      
      return completionCount;
    } catch (error) {
      console.error('Error getting completion activity:', error);
      return 0;
    }
  }

  private async getExpertEndorsements(cardId: string): Promise<CommunityEndorsement[]> {
    try {
      const snapshot = await this.db
        .collection('expert_endorsements')
        .where('cardId', '==', cardId)
        .where('isActive', '==', true)
        .get();

      return snapshot.docs.map((doc: any) => ({
        cardId,
        endorsementType: 'expert_recommended',
        endorserCount: 1,
        endorserType: 'expert',
        endorsementStrength: doc.data().validationScore,
        endorsementReason: doc.data().validationComment,
        segment: 'all',
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error getting expert endorsements:', error);
      return [];
    }
  }

  private async getCommunityFavorites(cardId: string, segment: string): Promise<CommunityEndorsement[]> {
    try {
      const snapshot = await this.db
        .collection('community_segments')
        .doc(segment)
        .collection('favorites')
        .where('cardId', '==', cardId)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return [{
          cardId,
          endorsementType: 'community_favorite',
          endorserCount: doc.data().userCount,
          endorserType: 'peer',
          endorsementStrength: doc.data().score,
          endorsementReason: 'Popular among users like you',
          segment,
          lastUpdated: new Date()
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting community favorites:', error);
      return [];
    }
  }

  private async getTrendingEndorsements(cardId: string): Promise<CommunityEndorsement[]> {
    try {
      const snapshot = await this.db
        .collection('trending_content')
        .where('cardId', '==', cardId)
        .where('isActive', '==', true)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return [{
          cardId,
          endorsementType: 'trending',
          endorserCount: doc.data().userCount,
          endorserType: 'community',
          endorsementStrength: doc.data().trendingScore,
          endorsementReason: 'Trending in the community',
          segment: 'all',
          lastUpdated: new Date()
        }];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting trending endorsements:', error);
      return [];
    }
  }

  private async getRatingEndorsements(cardId: string): Promise<CommunityEndorsement[]> {
    try {
      const snapshot = await this.db
        .collection('content_ratings')
        .where('cardId', '==', cardId)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        if (data.averageRating >= 4.0) {
          return [{
            cardId,
            endorsementType: 'highly_rated',
            endorserCount: data.ratingCount,
            endorserType: 'peer',
            endorsementStrength: data.averageRating / 5.0,
            endorsementReason: `Rated ${data.averageRating.toFixed(1)}/5 by ${data.ratingCount} users`,
            segment: 'all',
            lastUpdated: new Date()
          }];
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting rating endorsements:', error);
      return [];
    }
  }

  private async generatePopularityIndicators(cardId: string, segment: string): Promise<SocialProofIndicator[]> {
    const indicators: SocialProofIndicator[] = [];
    
    // Get engagement metrics
    const metrics = await this.displayCommunityEngagementMetrics(cardId);
    if (metrics) {
      if (metrics.totalUsers > 100) {
        indicators.push({
          cardId,
          indicatorType: 'popularity',
          value: metrics.totalUsers,
          label: `${metrics.totalUsers} users engaged`,
          description: 'Popular content in the community',
          confidence: 0.9,
          segment,
          lastUpdated: new Date()
        });
      }
      
      if (metrics.completionRate > 0.7) {
        indicators.push({
          cardId,
          indicatorType: 'popularity',
          value: Math.round(metrics.completionRate * 100),
          label: `${Math.round(metrics.completionRate * 100)}% completion rate`,
          description: 'High completion rate among users',
          confidence: 0.8,
          segment,
          lastUpdated: new Date()
        });
      }
    }
    
    return indicators;
  }

  private async generateQualityIndicators(cardId: string): Promise<SocialProofIndicator[]> {
    const indicators: SocialProofIndicator[] = [];
    
    // Get quality score
    const qualityScore = await this.generateCommunityQualityScoring(cardId);
    
    if (qualityScore.overallScore > 0.8) {
      indicators.push({
        cardId,
        indicatorType: 'quality',
        value: Math.round(qualityScore.overallScore * 100),
        label: `${Math.round(qualityScore.overallScore * 100)}% quality score`,
        description: 'High-quality content verified by community',
        confidence: 0.9,
        segment: 'all',
        lastUpdated: new Date()
      });
    }
    
    return indicators;
  }

  private async generateTrendingIndicators(cardId: string): Promise<SocialProofIndicator[]> {
    const indicators: SocialProofIndicator[] = [];
    
    // Check if content is trending
    const trendingData = await this.getTrendingData(cardId);
    if (trendingData && trendingData.isTrending) {
      indicators.push({
        cardId,
        indicatorType: 'trending',
        value: trendingData.trendingScore,
        label: 'Trending now',
        description: 'Rising in popularity',
        confidence: trendingData.confidence,
        segment: 'all',
        lastUpdated: new Date()
      });
    }
    
    return indicators;
  }

  private async generateExpertApprovalIndicators(cardId: string): Promise<SocialProofIndicator[]> {
    const indicators: SocialProofIndicator[] = [];
    
    // Get expert validations
    const expertValidations = await this.includeExpertValidation(cardId);
    
    if (expertValidations.length > 0) {
      const avgValidationScore = expertValidations.reduce((sum, v) => sum + v.validationScore, 0) / expertValidations.length;
      
      indicators.push({
        cardId,
        indicatorType: 'expert_approved',
        value: Math.round(avgValidationScore * 100),
        label: `Expert approved (${expertValidations.length} experts)`,
        description: 'Validated by financial experts',
        confidence: 0.95,
        segment: 'all',
        lastUpdated: new Date()
      });
    }
    
    return indicators;
  }

  private async generatePeerValidationIndicators(cardId: string, segment: string): Promise<SocialProofIndicator[]> {
    const indicators: SocialProofIndicator[] = [];
    
    // Get similar user activity
    const similarUserActivity = await this.showSimilarUserActivity(cardId, 'current_user');
    
    for (const activity of similarUserActivity) {
      if (activity.similarUserCount > 10) {
        indicators.push({
          cardId,
          indicatorType: 'peer_validated',
          value: activity.similarUserCount,
          label: `${activity.similarUserCount} similar users ${activity.activityType}`,
          description: `Popular among ${segment} users`,
          confidence: activity.confidence,
          segment,
          lastUpdated: new Date()
        });
      }
    }
    
    return indicators;
  }

  private async getExpertValidations(cardId: string): Promise<ExpertValidation[]> {
    try {
      const snapshot = await this.db
        .collection('expert_validations')
        .where('cardId', '==', cardId)
        .get();

      return snapshot.docs.map((doc: any) => ({
        cardId,
        expertId: doc.data().expertId,
        expertType: doc.data().expertType,
        validationType: doc.data().validationType,
        validationScore: doc.data().validationScore,
        validationComment: doc.data().validationComment,
        validatedAt: doc.data().validatedAt?.toDate() || new Date(),
        isActive: doc.data().isActive
      }));
    } catch (error) {
      console.error('Error getting expert validations:', error);
      return [];
    }
  }

  // Quality scoring methods
  private async calculateAccuracyScore(cardId: string): Promise<number> {
    // Mock accuracy calculation
    return 0.85;
  }

  private async calculateRelevanceScore(cardId: string): Promise<number> {
    // Mock relevance calculation
    return 0.78;
  }

  private async calculateEngagementScore(cardId: string): Promise<number> {
    const metrics = await this.displayCommunityEngagementMetrics(cardId);
    return metrics ? metrics.completionRate : 0.5;
  }

  private async calculateFreshnessScore(cardId: string): Promise<number> {
    // Mock freshness calculation
    return 0.72;
  }

  private async calculateUserSatisfactionScore(cardId: string): Promise<number> {
    const metrics = await this.displayCommunityEngagementMetrics(cardId);
    return metrics ? metrics.averageRating / 5.0 : 0.5;
  }

  private async calculateExpertValidationScore(cardId: string): Promise<number> {
    const validations = await this.getExpertValidations(cardId);
    if (validations.length === 0) return 0.5;
    
    return validations.reduce((sum, v) => sum + v.validationScore, 0) / validations.length;
  }

  private async calculateCommunityFeedbackScore(cardId: string): Promise<number> {
    // Mock community feedback calculation
    return 0.68;
  }

  private async calculateSegmentScores(cardId: string): Promise<Record<string, number>> {
    // Mock segment scores
    return {
      beginner: 0.8,
      intermediate: 0.75,
      advanced: 0.7,
      expert: 0.65
    };
  }

  private async getCommunityContext(cardId: string, segment: string): Promise<{
    similarUsersEngaged: number;
    segmentPopularity: number;
    expertEndorsements: number;
    qualityScore: number;
  }> {
    const metrics = await this.displayCommunityEngagementMetrics(cardId);
    const expertValidations = await this.includeExpertValidation(cardId);
    const qualityScore = await this.generateCommunityQualityScoring(cardId);
    
    return {
      similarUsersEngaged: metrics?.totalUsers || 0,
      segmentPopularity: metrics?.segmentBreakdown[segment]?.userCount || 0,
      expertEndorsements: expertValidations.length,
      qualityScore: qualityScore.overallScore
    };
  }

  private async generateTrustSignals(
    cardId: string, 
    indicators: SocialProofIndicator[], 
    communityContext: any
  ): Promise<string[]> {
    const signals: string[] = [];
    
    if (communityContext.similarUsersEngaged > 50) {
      signals.push('High community engagement');
    }
    
    if (communityContext.expertEndorsements > 0) {
      signals.push('Expert validated');
    }
    
    if (communityContext.qualityScore > 0.8) {
      signals.push('High quality content');
    }
    
    const trendingIndicator = indicators.find(i => i.indicatorType === 'trending');
    if (trendingIndicator) {
      signals.push('Trending content');
    }
    
    const expertIndicator = indicators.find(i => i.indicatorType === 'expert_approved');
    if (expertIndicator) {
      signals.push('Expert approved');
    }
    
    return signals;
  }

  private async getTrendingData(cardId: string): Promise<{
    isTrending: boolean;
    trendingScore: number;
    confidence: number;
  } | null> {
    try {
      const doc = await this.db
        .collection('trending_content')
        .doc(cardId)
        .get();
      
      if (doc.exists) {
        const data = doc.data();
        return {
          isTrending: data.isActive,
          trendingScore: data.trendingScore,
          confidence: data.confidence
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting trending data:', error);
      return null;
    }
  }

  // Default/fallback methods
  private getDefaultQualityScore(cardId: string): CommunityQualityScore {
    return {
      cardId,
      overallScore: 0.5,
      accuracyScore: 0.5,
      relevanceScore: 0.5,
      engagementScore: 0.5,
      freshnessScore: 0.5,
      userSatisfactionScore: 0.5,
      expertValidationScore: 0.5,
      communityFeedbackScore: 0.5,
      segmentScores: {
        beginner: 0.5,
        intermediate: 0.5,
        advanced: 0.5,
        expert: 0.5
      },
      lastUpdated: new Date()
    };
  }

  private getDefaultSocialProofContext(cardId: string, userId: string): SocialProofContext {
    return {
      cardId,
      userId,
      userSegment: 'beginner',
      socialProofElements: [],
      communityContext: {
        similarUsersEngaged: 0,
        segmentPopularity: 0,
        expertEndorsements: 0,
        qualityScore: 0.5
      },
      trustSignals: [],
      lastUpdated: new Date()
    };
  }

  // Storage methods
  private async storeEngagementMetrics(metrics: CommunityEngagementMetrics): Promise<void> {
    try {
      await this.db
        .collection('community_engagement_metrics')
        .doc(metrics.cardId)
        .set(metrics);
    } catch (error) {
      console.error('Error storing engagement metrics:', error);
    }
  }

  private async storeQualityScore(qualityScore: CommunityQualityScore): Promise<void> {
    try {
      await this.db
        .collection('community_quality_scores')
        .doc(qualityScore.cardId)
        .set(qualityScore);
    } catch (error) {
      console.error('Error storing quality score:', error);
    }
  }
}

// Export singleton instance
export const socialProofService = new SocialProofService();
