// Community Intelligence service for privacy-focused community analysis and collaborative filtering
import { Platform } from 'react-native';
import { UserInteraction, CardType, InteractionAction } from './EngagementTracker';
import { UserProfile } from './UserProfileService';
import { UnifiedCard } from './CardService';

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
  console.log('🔄 Using dummy Firebase services for CommunityIntelligence (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for CommunityIntelligence');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for CommunityIntelligence, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Types for community intelligence
export interface UserSegment {
  id: string;
  name: string;
  characteristics: string[];
  userCount: number;
  averageEngagement: number;
  commonPreferences: {
    contentTypes: string[];
    sectors: string[];
    difficulty: string;
    sessionLength: number;
  };
  successfulPatterns: string[];
  lastUpdated: Date;
}

export interface LearningPath {
  id: string;
  sequence: string[]; // Array of card IDs
  successRate: number;
  averageCompletionTime: number;
  userCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  lastUpdated: Date;
}

export interface ContentPerformance {
  cardId: string;
  cardType: CardType;
  engagementScore: number;
  completionRate: number;
  userSatisfaction: number;
  segmentPerformance: Record<string, number>; // segment -> performance score
  trendingScore: number;
  lastUpdated: Date;
}

export interface CommunityRecommendation {
  cardId: string;
  reason: string;
  confidence: number;
  communityContext: {
    similarUsers: number;
    successRate: number;
    trending: boolean;
    segment: string;
  };
  personalizationScore: number;
}

export interface CommunityTrend {
  id: string;
  type: 'content' | 'behavior' | 'preference';
  description: string;
  strength: number; // 0-1
  affectedSegments: string[];
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface CollaborativeFilterResult {
  userId: string;
  similarUsers: Array<{
    userId: string;
    similarity: number;
    sharedInterests: string[];
  }>;
  recommendedContent: Array<{
    cardId: string;
    score: number;
    reason: string;
  }>;
  confidence: number;
}

// Privacy-focused user behavior aggregation
interface AggregatedUserBehavior {
  segment: string;
  contentTypePreferences: Record<CardType, number>;
  sectorPreferences: Record<string, number>;
  engagementPatterns: {
    averageSessionLength: number;
    preferredTimes: string[];
    completionRates: Record<CardType, number>;
  };
  learningProgress: {
    averageStage: number;
    commonPaths: string[][];
    successFactors: string[];
  };
  userCount: number;
  lastUpdated: Date;
}

// Statistical significance testing
class StatisticalSignificance {
  // Calculate confidence interval for engagement metrics
  static calculateConfidenceInterval(sampleSize: number, successRate: number, confidenceLevel: number = 0.95): {
    lower: number;
    upper: number;
    marginOfError: number;
  } {
    if (sampleSize < 30) {
      return { lower: 0, upper: 1, marginOfError: 1 };
    }

    const z = confidenceLevel === 0.95 ? 1.96 : 1.645; // 95% or 90% confidence
    const marginOfError = z * Math.sqrt((successRate * (1 - successRate)) / sampleSize);
    
    return {
      lower: Math.max(0, successRate - marginOfError),
      upper: Math.min(1, successRate + marginOfError),
      marginOfError
    };
  }

  // Test if difference between two groups is statistically significant
  static isSignificantDifference(
    group1Size: number, 
    group1Rate: number, 
    group2Size: number, 
    group2Rate: number,
    significanceLevel: number = 0.05
  ): boolean {
    if (group1Size < 30 || group2Size < 30) return false;

    const pooledRate = (group1Size * group1Rate + group2Size * group2Rate) / (group1Size + group2Size);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/group1Size + 1/group2Size));
    const zScore = Math.abs(group1Rate - group2Rate) / standardError;
    
    return zScore > 1.96; // 95% confidence level
  }

  // Calculate minimum sample size for reliable insights
  static getMinimumSampleSize(expectedRate: number, marginOfError: number = 0.05): number {
    const z = 1.96; // 95% confidence
    return Math.ceil((z * z * expectedRate * (1 - expectedRate)) / (marginOfError * marginOfError));
  }
}

// Collaborative Filtering Engine
class CollaborativeFilter {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Find users with similar behavior patterns
  async findSimilarUsers(userId: string, limit: number = 50): Promise<Array<{
    userId: string;
    similarity: number;
    sharedInterests: string[];
  }>> {
    try {
      // Get user's interaction patterns
      const userInteractions = await this.getUserInteractionPatterns(userId);
      if (userInteractions.length < 10) {
        return []; // Not enough data for similarity
      }

      // Get anonymized user segments and their patterns
      const segments = await this.getUserSegments();
      const similarUsers: Array<{
        userId: string;
        similarity: number;
        sharedInterests: string[];
      }> = [];

      for (const segment of segments) {
        if (segment.userCount < StatisticalSignificance.getMinimumSampleSize(0.5)) {
          continue; // Skip segments with insufficient data
        }

        // Calculate similarity based on content preferences and engagement patterns
        const similarity = this.calculateUserSimilarity(userInteractions, segment);
        
        if (similarity > 0.3) { // Minimum similarity threshold
          similarUsers.push({
            userId: `segment_${segment.id}`, // Anonymized
            similarity,
            sharedInterests: this.getSharedInterests(userInteractions, segment)
          });
        }
      }

      return similarUsers
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  // Recommend content based on similar users
  async recommendBasedOnSimilarUsers(userId: string, limit: number = 10): Promise<Array<{
    cardId: string;
    score: number;
    reason: string;
  }>> {
    try {
      const similarUsers = await this.findSimilarUsers(userId, 20);
      if (similarUsers.length === 0) {
        return [];
      }

      // Get content that similar users engaged with positively
      const recommendations: Array<{
        cardId: string;
        score: number;
        reason: string;
      }> = [];

      for (const similarUser of similarUsers) {
        const segmentId = similarUser.userId.replace('segment_', '');
        const segmentContent = await this.getSegmentContentPreferences(segmentId);
        
        for (const content of segmentContent) {
          const existingRec = recommendations.find(r => r.cardId === content.cardId);
          if (existingRec) {
            existingRec.score += content.score * similarUser.similarity;
          } else {
            recommendations.push({
              cardId: content.cardId,
              score: content.score * similarUser.similarity,
              reason: `Popular among ${similarUser.sharedInterests.join(', ')} users`
            });
          }
        }
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error recommending based on similar users:', error);
      return [];
    }
  }

  // Identify content similarity
  async identifyContentSimilarity(cardId: string): Promise<Array<{
    cardId: string;
    similarity: number;
    reason: string;
  }>> {
    try {
      const cardInteractions = await this.getCardInteractionPatterns(cardId);
      if (cardInteractions.length < 10) {
        return [];
      }

      // Find other cards that users typically engage with together
      const similarContent: Array<{
        cardId: string;
        similarity: number;
        reason: string;
      }> = [];

      const allCards = await this.getAllCards();
      
      for (const otherCard of allCards) {
        if (otherCard.id === cardId) continue;

        const otherCardInteractions = await this.getCardInteractionPatterns(otherCard.id);
        const similarity = this.calculateContentSimilarity(cardInteractions, otherCardInteractions);
        
        if (similarity > 0.2) {
          similarContent.push({
            cardId: otherCard.id,
            similarity,
            reason: 'Users who liked this also liked that'
          });
        }
      }

      return similarContent
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);
    } catch (error) {
      console.error('Error identifying content similarity:', error);
      return [];
    }
  }

  // Generate collaborative recommendations
  async generateCollaborativeRecommendations(userId: string, limit: number = 15): Promise<CollaborativeFilterResult> {
    try {
      const similarUsers = await this.findSimilarUsers(userId, 30);
      const userBasedRecs = await this.recommendBasedOnSimilarUsers(userId, limit);
      
      // Combine user-based and item-based recommendations
      const combinedRecommendations = await this.combineRecommendationTypes(userId, userBasedRecs);
      
      const confidence = this.calculateRecommendationConfidence(similarUsers, userBasedRecs);

      return {
        userId,
        similarUsers,
        recommendedContent: combinedRecommendations,
        confidence
      };
    } catch (error) {
      console.error('Error generating collaborative recommendations:', error);
      return {
        userId,
        similarUsers: [],
        recommendedContent: [],
        confidence: 0
      };
    }
  }

  // Handle cold start for new users
  async handleColdStartForNewUsers(userId: string): Promise<Array<{
    cardId: string;
    score: number;
    reason: string;
  }>> {
    try {
      // Get popular content across all segments
      const popularContent = await this.getPopularContentAcrossSegments();
      
      // Get content that performs well for beginners
      const beginnerContent = await this.getSegmentContentPreferences('beginner');
      
      // Combine and rank
      const recommendations: Array<{
        cardId: string;
        score: number;
        reason: string;
      }> = [];

      // Add popular content with high scores
      for (const content of popularContent) {
        recommendations.push({
          cardId: content.cardId,
          score: content.score * 0.7, // Slightly lower weight for cold start
          reason: 'Popular among all users'
        });
      }

      // Add beginner-friendly content
      for (const content of beginnerContent) {
        const existing = recommendations.find(r => r.cardId === content.cardId);
        if (existing) {
          existing.score += content.score * 0.3;
          existing.reason += ' and beginner-friendly';
        } else {
          recommendations.push({
            cardId: content.cardId,
            score: content.score * 0.3,
            reason: 'Great for beginners'
          });
        }
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (error) {
      console.error('Error handling cold start:', error);
      return [];
    }
  }

  // Helper methods
  private async getUserInteractionPatterns(userId: string): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();

      return snapshot.docs.map((doc: any) => doc.data());
    } catch (error) {
      console.error('Error getting user interaction patterns:', error);
      return [];
    }
  }

  private async getUserSegments(): Promise<UserSegment[]> {
    try {
      const snapshot = await this.db
        .collection('community_segments')
        .where('userCount', '>=', StatisticalSignificance.getMinimumSampleSize(0.5))
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting user segments:', error);
      return [];
    }
  }

  private calculateUserSimilarity(userInteractions: any[], segment: UserSegment): number {
    // Calculate similarity based on content type preferences, engagement patterns, etc.
    let similarity = 0;
    let factors = 0;

    // Content type similarity
    const userContentTypes = this.extractContentTypePreferences(userInteractions);
    const segmentContentTypes = segment.commonPreferences.contentTypes;
    
    const contentTypeSimilarity = this.calculateSetSimilarity(userContentTypes, segmentContentTypes);
    similarity += contentTypeSimilarity * 0.4;
    factors += 0.4;

    // Engagement pattern similarity
    const userEngagement = this.extractEngagementPatterns(userInteractions);
    const segmentEngagement = segment.averageEngagement;
    
    const engagementSimilarity = 1 - Math.abs(userEngagement - segmentEngagement) / 100;
    similarity += engagementSimilarity * 0.3;
    factors += 0.3;

    // Sector preference similarity
    const userSectors = this.extractSectorPreferences(userInteractions);
    const segmentSectors = segment.commonPreferences.sectors;
    
    const sectorSimilarity = this.calculateSetSimilarity(userSectors, segmentSectors);
    similarity += sectorSimilarity * 0.3;
    factors += 0.3;

    return factors > 0 ? similarity / factors : 0;
  }

  private calculateContentSimilarity(interactions1: any[], interactions2: any[]): number {
    // Calculate Jaccard similarity between two sets of interactions
    const users1 = new Set(interactions1.map(i => i.userId));
    const users2 = new Set(interactions2.map(i => i.userId));
    
    const intersection = new Set([...users1].filter(x => users2.has(x)));
    const union = new Set([...users1, ...users2]);
    
    return intersection.size / union.size;
  }

  private calculateSetSimilarity(set1: string[], set2: string[]): number {
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    
    return intersection.size / union.size;
  }

  private extractContentTypePreferences(interactions: any[]): string[] {
    const typeCounts: Record<string, number> = {};
    interactions.forEach(interaction => {
      typeCounts[interaction.cardType] = (typeCounts[interaction.cardType] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  private extractEngagementPatterns(interactions: any[]): number {
    const positiveActions = ['save', 'share', 'complete', 'bookmark'];
    const positiveCount = interactions.filter(i => positiveActions.includes(i.action)).length;
    return (positiveCount / interactions.length) * 100;
  }

  private extractSectorPreferences(interactions: any[]): string[] {
    // This would need to be enhanced to extract sector info from card metadata
    return ['technology', 'finance']; // Placeholder
  }

  private getSharedInterests(userInteractions: any[], segment: UserSegment): string[] {
    const userContentTypes = this.extractContentTypePreferences(userInteractions);
    return userContentTypes.filter(type => 
      segment.commonPreferences.contentTypes.includes(type)
    );
  }

  private async getSegmentContentPreferences(segmentId: string): Promise<Array<{
    cardId: string;
    score: number;
  }>> {
    try {
      const snapshot = await this.db
        .collection('community_segments')
        .doc(segmentId)
        .collection('content_preferences')
        .orderBy('score', 'desc')
        .limit(20)
        .get();

      return snapshot.docs.map((doc: any) => ({
        cardId: doc.id,
        score: doc.data().score
      }));
    } catch (error) {
      console.error('Error getting segment content preferences:', error);
      return [];
    }
  }

  private async getCardInteractionPatterns(cardId: string): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection('cards')
        .doc(cardId)
        .collection('interactions')
        .limit(100)
        .get();

      return snapshot.docs.map((doc: any) => doc.data());
    } catch (error) {
      console.error('Error getting card interaction patterns:', error);
      return [];
    }
  }

  private async getAllCards(): Promise<UnifiedCard[]> {
    try {
      const snapshot = await this.db
        .collection('cards')
        .limit(100)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all cards:', error);
      return [];
    }
  }

  private async combineRecommendationTypes(
    userId: string, 
    userBasedRecs: Array<{ cardId: string; score: number; reason: string }>
  ): Promise<Array<{ cardId: string; score: number; reason: string }>> {
    // For now, return user-based recommendations
    // In a full implementation, this would combine with item-based recommendations
    return userBasedRecs;
  }

  private calculateRecommendationConfidence(
    similarUsers: Array<{ userId: string; similarity: number; sharedInterests: string[] }>,
    recommendations: Array<{ cardId: string; score: number; reason: string }>
  ): number {
    if (similarUsers.length === 0 || recommendations.length === 0) return 0;
    
    const avgSimilarity = similarUsers.reduce((sum, user) => sum + user.similarity, 0) / similarUsers.length;
    const avgScore = recommendations.reduce((sum, rec) => sum + rec.score, 0) / recommendations.length;
    
    return Math.min(avgSimilarity * avgScore, 1);
  }

  private async getPopularContentAcrossSegments(): Promise<Array<{
    cardId: string;
    score: number;
  }>> {
    try {
      const snapshot = await this.db
        .collection('community_insights')
        .doc('popular_content')
        .collection('items')
        .orderBy('score', 'desc')
        .limit(20)
        .get();

      return snapshot.docs.map((doc: any) => ({
        cardId: doc.id,
        score: doc.data().score
      }));
    } catch (error) {
      console.error('Error getting popular content:', error);
      return [];
    }
  }
}

// Main Community Intelligence Service
export class CommunityIntelligence {
  private db: any;
  private collaborativeFilter: CollaborativeFilter;

  constructor() {
    this.db = firestore();
    this.collaborativeFilter = new CollaborativeFilter(this.db);
  }

  // Analyze user segments based on behavior patterns
  async analyzeUserSegments(): Promise<UserSegment[]> {
    try {
      console.log('🔍 Analyzing user segments...');
      
      // Get aggregated user behavior data
      const aggregatedData = await this.getAggregatedUserBehavior();
      
      // Group users into segments based on behavior patterns
      const segments = await this.createUserSegments(aggregatedData);
      
      // Store segments for future use
      await this.storeUserSegments(segments);
      
      console.log('✅ User segments analyzed:', segments.length);
      return segments;
    } catch (error) {
      console.error('Error analyzing user segments:', error);
      return [];
    }
  }

  // Identify successful learning paths
  async identifySuccessfulLearningPaths(): Promise<LearningPath[]> {
    try {
      console.log('🔍 Identifying successful learning paths...');
      
      // Get user completion sequences
      const completionSequences = await this.getCompletionSequences();
      
      // Analyze patterns in successful sequences
      const learningPaths = await this.analyzeLearningPatterns(completionSequences);
      
      // Validate statistical significance
      const validatedPaths = learningPaths.filter(path => 
        path.userCount >= StatisticalSignificance.getMinimumSampleSize(0.6)
      );
      
      // Store learning paths
      await this.storeLearningPaths(validatedPaths);
      
      console.log('✅ Learning paths identified:', validatedPaths.length);
      return validatedPaths;
    } catch (error) {
      console.error('Error identifying successful learning paths:', error);
      return [];
    }
  }

  // Discover content performance across user segments
  async discoverContentPerformance(): Promise<ContentPerformance[]> {
    try {
      console.log('🔍 Discovering content performance...');
      
      // Get content engagement data across segments
      const contentEngagement = await this.getContentEngagementData();
      
      // Calculate performance metrics
      const performanceData = await this.calculateContentPerformance(contentEngagement);
      
      // Store performance data
      await this.storeContentPerformance(performanceData);
      
      console.log('✅ Content performance discovered:', performanceData.length);
      return performanceData;
    } catch (error) {
      console.error('Error discovering content performance:', error);
      return [];
    }
  }

  // Generate community recommendations for a user
  async generateCommunityRecommendations(userId: string, limit: number = 10): Promise<CommunityRecommendation[]> {
    try {
      console.log('🎯 Generating community recommendations for user:', userId);
      
      // Get collaborative filtering results
      const collaborativeResults = await this.collaborativeFilter.generateCollaborativeRecommendations(userId, limit);
      
      // Get user's current segment
      const userSegment = await this.getUserSegment(userId);
      
      // Get trending content in user's segment
      const trendingContent = await this.getTrendingContent(userSegment);
      
      // Combine recommendations
      const communityRecommendations: CommunityRecommendation[] = [];
      
      // Add collaborative recommendations
      for (const rec of collaborativeResults.recommendedContent) {
        communityRecommendations.push({
          cardId: rec.cardId,
          reason: rec.reason,
          confidence: collaborativeResults.confidence,
          communityContext: {
            similarUsers: collaborativeResults.similarUsers.length,
            successRate: rec.score,
            trending: trendingContent.some(t => t.cardId === rec.cardId),
            segment: userSegment
          },
          personalizationScore: rec.score
        });
      }
      
      // Add trending content if not already included
      for (const trending of trendingContent) {
        if (!communityRecommendations.some(r => r.cardId === trending.cardId)) {
          communityRecommendations.push({
            cardId: trending.cardId,
            reason: 'Trending in your community',
            confidence: 0.7,
            communityContext: {
              similarUsers: 0,
              successRate: trending.score,
              trending: true,
              segment: userSegment
            },
            personalizationScore: trending.score * 0.8
          });
        }
      }
      
      return communityRecommendations
        .sort((a, b) => b.personalizationScore - a.personalizationScore)
        .slice(0, limit);
    } catch (error) {
      console.error('Error generating community recommendations:', error);
      return [];
    }
  }

  // Track community trends
  async trackCommunityTrends(): Promise<CommunityTrend[]> {
    try {
      console.log('📈 Tracking community trends...');
      
      // Analyze recent behavior patterns
      const recentPatterns = await this.analyzeRecentPatterns();
      
      // Identify emerging trends
      const trends = await this.identifyEmergingTrends(recentPatterns);
      
      // Update existing trends
      await this.updateExistingTrends(trends);
      
      console.log('✅ Community trends tracked:', trends.length);
      return trends;
    } catch (error) {
      console.error('Error tracking community trends:', error);
      return [];
    }
  }

  // Helper methods
  private async getAggregatedUserBehavior(): Promise<AggregatedUserBehavior[]> {
    try {
      // This would aggregate user behavior data while preserving privacy
      // For now, return mock data structure
      return [
        {
          segment: 'beginner',
          contentTypePreferences: {
            lesson: 0.6,
            news: 0.3,
            stock: 0.1,
            crypto: 0.0,
            podcast: 0.0,
            challenge: 0.0
          },
          sectorPreferences: {
            technology: 0.4,
            finance: 0.3,
            healthcare: 0.2,
            energy: 0.1
          },
          engagementPatterns: {
            averageSessionLength: 12,
            preferredTimes: ['morning', 'evening'],
            completionRates: {
              lesson: 0.7,
              news: 0.8,
              stock: 0.5,
              crypto: 0.3,
              podcast: 0.6,
              challenge: 0.4
            }
          },
          learningProgress: {
            averageStage: 2.3,
            commonPaths: [['lesson1', 'lesson2', 'lesson3']],
            successFactors: ['completion', 'time_spent', 'engagement']
          },
          userCount: 150,
          lastUpdated: new Date()
        }
      ];
    } catch (error) {
      console.error('Error getting aggregated user behavior:', error);
      return [];
    }
  }

  private async createUserSegments(aggregatedData: AggregatedUserBehavior[]): Promise<UserSegment[]> {
    return aggregatedData.map(data => ({
      id: data.segment,
      name: data.segment.charAt(0).toUpperCase() + data.segment.slice(1),
      characteristics: this.generateSegmentCharacteristics(data),
      userCount: data.userCount,
      averageEngagement: this.calculateAverageEngagement(data),
      commonPreferences: {
        contentTypes: Object.entries(data.contentTypePreferences)
          .filter(([, score]) => score > 0.2)
          .map(([type]) => type),
        sectors: Object.entries(data.sectorPreferences)
          .filter(([, score]) => score > 0.2)
          .map(([sector]) => sector),
        difficulty: data.segment === 'beginner' ? 'beginner' : 
                   data.segment === 'intermediate' ? 'intermediate' : 'advanced',
        sessionLength: data.engagementPatterns.averageSessionLength
      },
      successfulPatterns: data.learningProgress.successFactors,
      lastUpdated: new Date()
    }));
  }

  private generateSegmentCharacteristics(data: AggregatedUserBehavior): string[] {
    const characteristics: string[] = [];
    
    if (data.segment === 'beginner') {
      characteristics.push('Prefers structured learning');
      characteristics.push('High completion rates for lessons');
      characteristics.push('Conservative investment approach');
    } else if (data.segment === 'intermediate') {
      characteristics.push('Balanced content consumption');
      characteristics.push('Active in multiple content types');
      characteristics.push('Moderate risk tolerance');
    } else if (data.segment === 'advanced') {
      characteristics.push('Self-directed learning');
      characteristics.push('High engagement with complex content');
      characteristics.push('Aggressive investment strategies');
    }
    
    return characteristics;
  }

  private calculateAverageEngagement(data: AggregatedUserBehavior): number {
    const completionRates = Object.values(data.engagementPatterns.completionRates);
    return completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length * 100;
  }

  private async storeUserSegments(segments: UserSegment[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const segment of segments) {
        const segmentRef = this.db.collection('community_segments').doc(segment.id);
        batch.set(segmentRef, segment);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing user segments:', error);
    }
  }

  private async getCompletionSequences(): Promise<string[][]> {
    // This would analyze user completion patterns
    // For now, return mock data
    return [
      ['lesson1', 'lesson2', 'lesson3'],
      ['lesson1', 'lesson2', 'challenge1'],
      ['lesson1', 'news1', 'lesson2']
    ];
  }

  private async analyzeLearningPatterns(sequences: string[][]): Promise<LearningPath[]> {
    // Analyze patterns in completion sequences
    const pathMap = new Map<string, { count: number; sequences: string[][] }>();
    
    sequences.forEach(sequence => {
      const key = sequence.join('->');
      const existing = pathMap.get(key);
      if (existing) {
        existing.count++;
        existing.sequences.push(sequence);
      } else {
        pathMap.set(key, { count: 1, sequences: [sequence] });
      }
    });
    
    return Array.from(pathMap.entries())
      .filter(([, data]) => data.count >= 3) // Minimum 3 users
      .map(([path, data]) => ({
        id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sequence: data.sequences[0],
        successRate: data.count / sequences.length,
        averageCompletionTime: 15, // Mock data
        userCount: data.count,
        difficulty: 'beginner' as const,
        tags: ['learning', 'progression'],
        lastUpdated: new Date()
      }));
  }

  private async storeLearningPaths(paths: LearningPath[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const path of paths) {
        const pathRef = this.db.collection('learning_paths').doc(path.id);
        batch.set(pathRef, path);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing learning paths:', error);
    }
  }

  private async getContentEngagementData(): Promise<any[]> {
    // Mock data for content engagement
    return [
      {
        cardId: 'card1',
        cardType: 'lesson',
        segmentEngagement: {
          beginner: 0.8,
          intermediate: 0.6,
          advanced: 0.4
        }
      }
    ];
  }

  private async calculateContentPerformance(engagementData: any[]): Promise<ContentPerformance[]> {
    return engagementData.map(data => ({
      cardId: data.cardId,
      cardType: data.cardType,
      engagementScore: Object.values(data.segmentEngagement).reduce((sum: number, score: number) => sum + score, 0) / Object.keys(data.segmentEngagement).length,
      completionRate: 0.7, // Mock data
      userSatisfaction: 0.8, // Mock data
      segmentPerformance: data.segmentEngagement,
      trendingScore: 0.5, // Mock data
      lastUpdated: new Date()
    }));
  }

  private async storeContentPerformance(performanceData: ContentPerformance[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const performance of performanceData) {
        const perfRef = this.db.collection('content_performance').doc(performance.cardId);
        batch.set(perfRef, performance);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing content performance:', error);
    }
  }

  private async getUserSegment(userId: string): Promise<string> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      return userDoc.exists ? userDoc.data().userSegment || 'beginner' : 'beginner';
    } catch (error) {
      console.error('Error getting user segment:', error);
      return 'beginner';
    }
  }

  private async getTrendingContent(segment: string): Promise<Array<{
    cardId: string;
    score: number;
  }>> {
    try {
      const snapshot = await this.db
        .collection('community_trends')
        .where('affectedSegments', 'array-contains', segment)
        .where('isActive', '==', true)
        .limit(5)
        .get();

      return snapshot.docs.map((doc: any) => ({
        cardId: doc.data().contentId,
        score: doc.data().strength
      }));
    } catch (error) {
      console.error('Error getting trending content:', error);
      return [];
    }
  }

  private async analyzeRecentPatterns(): Promise<any[]> {
    // Mock data for recent patterns
    return [
      {
        type: 'content',
        pattern: 'increased_lesson_engagement',
        strength: 0.7,
        segments: ['beginner', 'intermediate']
      }
    ];
  }

  private async identifyEmergingTrends(patterns: any[]): Promise<CommunityTrend[]> {
    return patterns.map(pattern => ({
      id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: pattern.type,
      description: `Emerging trend: ${pattern.pattern}`,
      strength: pattern.strength,
      affectedSegments: pattern.segments,
      startDate: new Date(),
      isActive: true
    }));
  }

  private async updateExistingTrends(newTrends: CommunityTrend[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const trend of newTrends) {
        const trendRef = this.db.collection('community_trends').doc(trend.id);
        batch.set(trendRef, trend);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating trends:', error);
    }
  }
}

// Export singleton instance
export const communityIntelligence = new CommunityIntelligence();
