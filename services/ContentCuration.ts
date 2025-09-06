// Content Curation service for community-driven content discovery and performance insights
import { Platform } from 'react-native';
import { UserInteraction, CardType, InteractionAction } from './EngagementTracker';
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
  console.log('🔄 Using dummy Firebase services for ContentCuration (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for ContentCuration');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for ContentCuration, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Types for content curation
export interface ContentPerformanceMetrics {
  cardId: string;
  cardType: CardType;
  engagementScore: number; // 0-1
  completionRate: number; // 0-1
  userSatisfaction: number; // 0-1
  retentionRate: number; // 0-1
  shareRate: number; // 0-1
  segmentPerformance: Record<string, number>; // segment -> performance score
  trendingScore: number; // 0-1
  freshnessScore: number; // 0-1
  qualityScore: number; // 0-1
  lastUpdated: Date;
}

export interface CommunityContentRanking {
  cardId: string;
  rank: number;
  score: number;
  reason: string;
  segmentRankings: Record<string, number>; // segment -> rank
  trending: boolean;
  lastUpdated: Date;
}

export interface HighPerformingContent {
  cardId: string;
  cardType: CardType;
  performanceMetrics: ContentPerformanceMetrics;
  successFactors: string[];
  targetSegments: string[];
  optimalTiming: {
    timeOfDay: string[];
    dayOfWeek: string[];
  };
  relatedContent: string[];
  lastUpdated: Date;
}

export interface CommunityFavorites {
  userId: string;
  segment: string;
  favoriteContent: Array<{
    cardId: string;
    score: number;
    reason: string;
  }>;
  lastUpdated: Date;
}

export interface UnderperformingContent {
  cardId: string;
  cardType: CardType;
  issues: string[];
  improvementSuggestions: string[];
  performanceGaps: Record<string, number>; // segment -> gap score
  lastUpdated: Date;
}

export interface CommunityInsight {
  id: string;
  type: 'content_performance' | 'user_behavior' | 'trend_analysis' | 'quality_assessment';
  title: string;
  description: string;
  insights: string[];
  affectedSegments: string[];
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  lastUpdated: Date;
}

export interface ContentLifecycleStage {
  cardId: string;
  stage: 'new' | 'trending' | 'stable' | 'declining' | 'archived';
  stageStartDate: Date;
  expectedDuration: number; // in days
  performanceTrend: 'improving' | 'stable' | 'declining';
  nextStagePrediction: string;
  lastUpdated: Date;
}

// Content Curation Service
export class ContentCurationService {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Rank content by community engagement
  async rankContentByCommunityEngagement(limit: number = 50): Promise<CommunityContentRanking[]> {
    try {
      console.log('📊 Ranking content by community engagement...');
      
      // Get content performance metrics
      const performanceMetrics = await this.getContentPerformanceMetrics();
      
      // Calculate community engagement scores
      const engagementScores = await this.calculateCommunityEngagementScores(performanceMetrics);
      
      // Rank content by engagement
      const rankings = await this.rankContentByEngagement(engagementScores);
      
      // Store rankings
      await this.storeContentRankings(rankings);
      
      console.log('✅ Content ranked by community engagement:', rankings.length);
      return rankings.slice(0, limit);
    } catch (error) {
      console.error('Error ranking content by community engagement:', error);
      return [];
    }
  }

  // Identify high-performing content
  async identifyHighPerformingContent(threshold: number = 0.7): Promise<HighPerformingContent[]> {
    try {
      console.log('🔍 Identifying high-performing content...');
      
      // Get content performance data
      const performanceData = await this.getContentPerformanceMetrics();
      
      // Filter high-performing content
      const highPerformers = performanceData.filter(metrics => 
        metrics.engagementScore >= threshold &&
        metrics.completionRate >= threshold &&
        metrics.userSatisfaction >= threshold
      );
      
      // Analyze success factors
      const analyzedContent = await this.analyzeSuccessFactors(highPerformers);
      
      // Store high-performing content
      await this.storeHighPerformingContent(analyzedContent);
      
      console.log('✅ High-performing content identified:', analyzedContent.length);
      return analyzedContent;
    } catch (error) {
      console.error('Error identifying high-performing content:', error);
      return [];
    }
  }

  // Surface community favorites for a user
  async surfaceCommunityFavorites(userId: string, limit: number = 10): Promise<Array<{
    cardId: string;
    score: number;
    reason: string;
    communityContext: {
      segment: string;
      popularity: number;
      successRate: number;
    };
  }>> {
    try {
      console.log('🎯 Surfacing community favorites for user:', userId);
      
      // Get user's segment
      const userSegment = await this.getUserSegment(userId);
      
      // Get community favorites for the segment
      const segmentFavorites = await this.getSegmentFavorites(userSegment);
      
      // Get user's interaction history to avoid duplicates
      const userInteractions = await this.getUserInteractions(userId);
      const userCardIds = new Set(userInteractions.map(i => i.cardId));
      
      // Filter out content user has already seen
      const newFavorites = segmentFavorites.filter(fav => !userCardIds.has(fav.cardId));
      
      // Add community context
      const favoritesWithContext = newFavorites.map(fav => ({
        cardId: fav.cardId,
        score: fav.score,
        reason: fav.reason,
        communityContext: {
          segment: userSegment,
          popularity: fav.score,
          successRate: await this.getContentSuccessRate(fav.cardId, userSegment)
        }
      }));
      
      return favoritesWithContext.slice(0, limit);
    } catch (error) {
      console.error('Error surfacing community favorites:', error);
      return [];
    }
  }

  // Detect underperforming content
  async detectUnderperformingContent(threshold: number = 0.3): Promise<UnderperformingContent[]> {
    try {
      console.log('🔍 Detecting underperforming content...');
      
      // Get content performance data
      const performanceData = await this.getContentPerformanceMetrics();
      
      // Identify underperforming content
      const underperformers = performanceData.filter(metrics => 
        metrics.engagementScore < threshold ||
        metrics.completionRate < threshold ||
        metrics.userSatisfaction < threshold
      );
      
      // Analyze issues and generate improvement suggestions
      const analyzedUnderperformers = await this.analyzeUnderperformingContent(underperformers);
      
      // Store underperforming content analysis
      await this.storeUnderperformingContent(analyzedUnderperformers);
      
      console.log('✅ Underperforming content detected:', analyzedUnderperformers.length);
      return analyzedUnderperformers;
    } catch (error) {
      console.error('Error detecting underperforming content:', error);
      return [];
    }
  }

  // Generate community insights
  async generateCommunityInsights(): Promise<CommunityInsight[]> {
    try {
      console.log('💡 Generating community insights...');
      
      // Analyze content performance patterns
      const performanceInsights = await this.analyzeContentPerformancePatterns();
      
      // Analyze user behavior patterns
      const behaviorInsights = await this.analyzeUserBehaviorPatterns();
      
      // Analyze trends
      const trendInsights = await this.analyzeTrends();
      
      // Assess content quality
      const qualityInsights = await this.assessContentQuality();
      
      // Combine all insights
      const allInsights = [
        ...performanceInsights,
        ...behaviorInsights,
        ...trendInsights,
        ...qualityInsights
      ];
      
      // Store insights
      await this.storeCommunityInsights(allInsights);
      
      console.log('✅ Community insights generated:', allInsights.length);
      return allInsights;
    } catch (error) {
      console.error('Error generating community insights:', error);
      return [];
    }
  }

  // Manage content lifecycle
  async manageContentLifecycle(): Promise<ContentLifecycleStage[]> {
    try {
      console.log('🔄 Managing content lifecycle...');
      
      // Get all content performance data
      const performanceData = await this.getContentPerformanceMetrics();
      
      // Determine lifecycle stages
      const lifecycleStages = await this.determineContentLifecycleStages(performanceData);
      
      // Update content lifecycle
      await this.updateContentLifecycle(lifecycleStages);
      
      // Archive declining content
      await this.archiveDecliningContent(lifecycleStages);
      
      console.log('✅ Content lifecycle managed:', lifecycleStages.length);
      return lifecycleStages;
    } catch (error) {
      console.error('Error managing content lifecycle:', error);
      return [];
    }
  }

  // Helper methods
  private async getContentPerformanceMetrics(): Promise<ContentPerformanceMetrics[]> {
    try {
      const snapshot = await this.db
        .collection('content_performance')
        .get();

      return snapshot.docs.map((doc: any) => ({
        cardId: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting content performance metrics:', error);
      return [];
    }
  }

  private async calculateCommunityEngagementScores(metrics: ContentPerformanceMetrics[]): Promise<Map<string, number>> {
    const scores = new Map<string, number>();
    
    for (const metric of metrics) {
      // Calculate weighted engagement score
      const engagementScore = (
        metric.engagementScore * 0.3 +
        metric.completionRate * 0.25 +
        metric.userSatisfaction * 0.2 +
        metric.retentionRate * 0.15 +
        metric.shareRate * 0.1
      );
      
      scores.set(metric.cardId, engagementScore);
    }
    
    return scores;
  }

  private async rankContentByEngagement(scores: Map<string, number>): Promise<CommunityContentRanking[]> {
    const rankings: CommunityContentRanking[] = [];
    
    // Sort by score
    const sortedEntries = Array.from(scores.entries())
      .sort(([,a], [,b]) => b - a);
    
    sortedEntries.forEach(([cardId, score], index) => {
      rankings.push({
        cardId,
        rank: index + 1,
        score,
        reason: this.generateRankingReason(score, index + 1),
        segmentRankings: {}, // Will be populated separately
        trending: score > 0.8, // High-performing content is trending
        lastUpdated: new Date()
      });
    });
    
    return rankings;
  }

  private generateRankingReason(score: number, rank: number): string {
    if (rank <= 5) {
      return 'Top performing content in community';
    } else if (rank <= 20) {
      return 'High engagement content';
    } else if (score > 0.7) {
      return 'Above average community engagement';
    } else if (score > 0.5) {
      return 'Average community engagement';
    } else {
      return 'Below average community engagement';
    }
  }

  private async analyzeSuccessFactors(highPerformers: ContentPerformanceMetrics[]): Promise<HighPerformingContent[]> {
    const analyzedContent: HighPerformingContent[] = [];
    
    for (const metrics of highPerformers) {
      // Get card details
      const card = await this.getCardDetails(metrics.cardId);
      if (!card) continue;
      
      // Analyze success factors
      const successFactors = this.identifySuccessFactors(metrics, card);
      
      // Determine target segments
      const targetSegments = this.determineTargetSegments(metrics);
      
      // Find optimal timing
      const optimalTiming = await this.findOptimalTiming(metrics.cardId);
      
      // Find related content
      const relatedContent = await this.findRelatedContent(metrics.cardId);
      
      analyzedContent.push({
        cardId: metrics.cardId,
        cardType: metrics.cardType,
        performanceMetrics: metrics,
        successFactors,
        targetSegments,
        optimalTiming,
        relatedContent,
        lastUpdated: new Date()
      });
    }
    
    return analyzedContent;
  }

  private identifySuccessFactors(metrics: ContentPerformanceMetrics, card: UnifiedCard): string[] {
    const factors: string[] = [];
    
    if (metrics.engagementScore > 0.8) {
      factors.push('High engagement rate');
    }
    
    if (metrics.completionRate > 0.8) {
      factors.push('High completion rate');
    }
    
    if (metrics.shareRate > 0.3) {
      factors.push('High shareability');
    }
    
    if (card.type === 'lesson' && metrics.retentionRate > 0.7) {
      factors.push('Strong learning retention');
    }
    
    if (card.type === 'news' && metrics.engagementScore > 0.7) {
      factors.push('Timely and relevant');
    }
    
    if (card.priority > 80) {
      factors.push('High editorial priority');
    }
    
    return factors;
  }

  private determineTargetSegments(metrics: ContentPerformanceMetrics): string[] {
    const segments: string[] = [];
    
    Object.entries(metrics.segmentPerformance).forEach(([segment, score]) => {
      if (score > 0.7) {
        segments.push(segment);
      }
    });
    
    return segments;
  }

  private async findOptimalTiming(cardId: string): Promise<{
    timeOfDay: string[];
    dayOfWeek: string[];
  }> {
    try {
      // Get interaction timing data
      const timingData = await this.getContentTimingData(cardId);
      
      // Analyze optimal timing patterns
      const optimalTiming = this.analyzeTimingPatterns(timingData);
      
      return optimalTiming;
    } catch (error) {
      console.error('Error finding optimal timing:', error);
      return {
        timeOfDay: ['morning', 'evening'],
        dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      };
    }
  }

  private async findRelatedContent(cardId: string): Promise<string[]> {
    try {
      // Find content that users typically engage with together
      const relatedContent = await this.getRelatedContentData(cardId);
      return relatedContent.slice(0, 5); // Limit to 5 related items
    } catch (error) {
      console.error('Error finding related content:', error);
      return [];
    }
  }

  private async analyzeUnderperformingContent(underperformers: ContentPerformanceMetrics[]): Promise<UnderperformingContent[]> {
    const analyzed: UnderperformingContent[] = [];
    
    for (const metrics of underperformers) {
      // Identify issues
      const issues = this.identifyPerformanceIssues(metrics);
      
      // Generate improvement suggestions
      const suggestions = this.generateImprovementSuggestions(metrics, issues);
      
      // Calculate performance gaps by segment
      const gaps = this.calculatePerformanceGaps(metrics);
      
      analyzed.push({
        cardId: metrics.cardId,
        cardType: metrics.cardType,
        issues,
        improvementSuggestions: suggestions,
        performanceGaps: gaps,
        lastUpdated: new Date()
      });
    }
    
    return analyzed;
  }

  private identifyPerformanceIssues(metrics: ContentPerformanceMetrics): string[] {
    const issues: string[] = [];
    
    if (metrics.engagementScore < 0.3) {
      issues.push('Low engagement rate');
    }
    
    if (metrics.completionRate < 0.3) {
      issues.push('Low completion rate');
    }
    
    if (metrics.userSatisfaction < 0.3) {
      issues.push('Low user satisfaction');
    }
    
    if (metrics.retentionRate < 0.3) {
      issues.push('Poor retention');
    }
    
    if (metrics.shareRate < 0.1) {
      issues.push('Low shareability');
    }
    
    if (metrics.freshnessScore < 0.3) {
      issues.push('Outdated content');
    }
    
    return issues;
  }

  private generateImprovementSuggestions(metrics: ContentPerformanceMetrics, issues: string[]): string[] {
    const suggestions: string[] = [];
    
    if (issues.includes('Low engagement rate')) {
      suggestions.push('Improve content title and description');
      suggestions.push('Add more engaging visuals');
      suggestions.push('Optimize for mobile viewing');
    }
    
    if (issues.includes('Low completion rate')) {
      suggestions.push('Break content into smaller sections');
      suggestions.push('Add progress indicators');
      suggestions.push('Improve content flow and structure');
    }
    
    if (issues.includes('Low user satisfaction')) {
      suggestions.push('Gather user feedback');
      suggestions.push('Improve content quality');
      suggestions.push('Ensure content accuracy');
    }
    
    if (issues.includes('Outdated content')) {
      suggestions.push('Update with current information');
      suggestions.push('Add recent examples');
      suggestions.push('Refresh visual elements');
    }
    
    return suggestions;
  }

  private calculatePerformanceGaps(metrics: ContentPerformanceMetrics): Record<string, number> {
    const gaps: Record<string, number> = {};
    
    Object.entries(metrics.segmentPerformance).forEach(([segment, score]) => {
      gaps[segment] = Math.max(0, 0.7 - score); // Gap from target 0.7
    });
    
    return gaps;
  }

  private async analyzeContentPerformancePatterns(): Promise<CommunityInsight[]> {
    const insights: CommunityInsight[] = [];
    
    // Analyze content type performance
    const typePerformance = await this.analyzeContentTypePerformance();
    if (typePerformance.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'content_performance',
        title: 'Content Type Performance Analysis',
        description: 'Analysis of how different content types perform across the community',
        insights: typePerformance,
        affectedSegments: ['all'],
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Focus on high-performing content types',
          'Improve underperforming content types',
          'Balance content mix based on performance'
        ],
        lastUpdated: new Date()
      });
    }
    
    return insights;
  }

  private async analyzeUserBehaviorPatterns(): Promise<CommunityInsight[]> {
    const insights: CommunityInsight[] = [];
    
    // Analyze engagement timing patterns
    const timingPatterns = await this.analyzeEngagementTimingPatterns();
    if (timingPatterns.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'user_behavior',
        title: 'Optimal Engagement Timing',
        description: 'Analysis of when users are most engaged with content',
        insights: timingPatterns,
        affectedSegments: ['all'],
        confidence: 0.7,
        actionable: true,
        recommendations: [
          'Schedule content releases during peak engagement times',
          'Optimize push notifications timing',
          'Adjust content strategy based on timing patterns'
        ],
        lastUpdated: new Date()
      });
    }
    
    return insights;
  }

  private async analyzeTrends(): Promise<CommunityInsight[]> {
    const insights: CommunityInsight[] = [];
    
    // Analyze trending topics
    const trendingTopics = await this.analyzeTrendingTopics();
    if (trendingTopics.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'trend_analysis',
        title: 'Trending Topics Analysis',
        description: 'Analysis of emerging trends in user interests and content preferences',
        insights: trendingTopics,
        affectedSegments: ['all'],
        confidence: 0.6,
        actionable: true,
        recommendations: [
          'Create content around trending topics',
          'Monitor trend evolution',
          'Prepare for trend shifts'
        ],
        lastUpdated: new Date()
      });
    }
    
    return insights;
  }

  private async assessContentQuality(): Promise<CommunityInsight[]> {
    const insights: CommunityInsight[] = [];
    
    // Assess overall content quality
    const qualityAssessment = await this.performQualityAssessment();
    if (qualityAssessment.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'quality_assessment',
        title: 'Content Quality Assessment',
        description: 'Analysis of content quality across the platform',
        insights: qualityAssessment,
        affectedSegments: ['all'],
        confidence: 0.8,
        actionable: true,
        recommendations: [
          'Improve content quality standards',
          'Provide quality guidelines',
          'Implement quality monitoring'
        ],
        lastUpdated: new Date()
      });
    }
    
    return insights;
  }

  private async determineContentLifecycleStages(performanceData: ContentPerformanceMetrics[]): Promise<ContentLifecycleStage[]> {
    const stages: ContentLifecycleStage[] = [];
    
    for (const metrics of performanceData) {
      const stage = this.determineContentStage(metrics);
      const trend = this.analyzePerformanceTrend(metrics);
      const nextStage = this.predictNextStage(stage, trend);
      
      stages.push({
        cardId: metrics.cardId,
        stage,
        stageStartDate: new Date(), // Would be calculated from historical data
        expectedDuration: this.getExpectedStageDuration(stage),
        performanceTrend: trend,
        nextStagePrediction: nextStage,
        lastUpdated: new Date()
      });
    }
    
    return stages;
  }

  private determineContentStage(metrics: ContentPerformanceMetrics): 'new' | 'trending' | 'stable' | 'declining' | 'archived' {
    if (metrics.trendingScore > 0.8) return 'trending';
    if (metrics.engagementScore > 0.7 && metrics.freshnessScore > 0.7) return 'stable';
    if (metrics.engagementScore < 0.3 || metrics.freshnessScore < 0.3) return 'declining';
    if (metrics.qualityScore < 0.2) return 'archived';
    return 'new';
  }

  private analyzePerformanceTrend(metrics: ContentPerformanceMetrics): 'improving' | 'stable' | 'declining' {
    // This would analyze historical performance data
    // For now, use current metrics as proxy
    if (metrics.engagementScore > 0.7) return 'improving';
    if (metrics.engagementScore < 0.4) return 'declining';
    return 'stable';
  }

  private predictNextStage(currentStage: string, trend: string): string {
    const stageTransitions: Record<string, Record<string, string>> = {
      'new': { 'improving': 'trending', 'stable': 'stable', 'declining': 'declining' },
      'trending': { 'improving': 'stable', 'stable': 'stable', 'declining': 'declining' },
      'stable': { 'improving': 'stable', 'stable': 'stable', 'declining': 'declining' },
      'declining': { 'improving': 'stable', 'stable': 'declining', 'declining': 'archived' },
      'archived': { 'improving': 'archived', 'stable': 'archived', 'declining': 'archived' }
    };
    
    return stageTransitions[currentStage]?.[trend] || currentStage;
  }

  private getExpectedStageDuration(stage: string): number {
    const durations: Record<string, number> = {
      'new': 7, // 7 days
      'trending': 14, // 14 days
      'stable': 30, // 30 days
      'declining': 14, // 14 days
      'archived': 365 // 1 year
    };
    
    return durations[stage] || 30;
  }

  // Utility methods
  private async getUserSegment(userId: string): Promise<string> {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      return doc.exists ? doc.data().userSegment || 'beginner' : 'beginner';
    } catch (error) {
      console.error('Error getting user segment:', error);
      return 'beginner';
    }
  }

  private async getSegmentFavorites(segment: string): Promise<Array<{
    cardId: string;
    score: number;
    reason: string;
  }>> {
    try {
      const snapshot = await this.db
        .collection('community_segments')
        .doc(segment)
        .collection('favorites')
        .orderBy('score', 'desc')
        .limit(20)
        .get();

      return snapshot.docs.map((doc: any) => ({
        cardId: doc.id,
        score: doc.data().score,
        reason: doc.data().reason
      }));
    } catch (error) {
      console.error('Error getting segment favorites:', error);
      return [];
    }
  }

  private async getUserInteractions(userId: string): Promise<UserInteraction[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .limit(100)
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

  private async getContentSuccessRate(cardId: string, segment: string): Promise<number> {
    try {
      const doc = await this.db
        .collection('content_performance')
        .doc(cardId)
        .get();
      
      if (doc.exists) {
        const data = doc.data();
        return data.segmentPerformance?.[segment] || 0.5;
      }
      
      return 0.5; // Default success rate
    } catch (error) {
      console.error('Error getting content success rate:', error);
      return 0.5;
    }
  }

  private async getCardDetails(cardId: string): Promise<UnifiedCard | null> {
    try {
      const doc = await this.db.collection('cards').doc(cardId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Error getting card details:', error);
      return null;
    }
  }

  // Mock analysis methods (would be implemented with real data analysis)
  private async analyzeContentTypePerformance(): Promise<string[]> {
    return [
      'Lessons show highest completion rates (78%)',
      'News content has highest engagement (85%)',
      'Podcasts have lowest completion rates (45%)',
      'Stock content shows strong retention (72%)'
    ];
  }

  private async analyzeEngagementTimingPatterns(): Promise<string[]> {
    return [
      'Peak engagement occurs at 9 AM and 7 PM',
      'Weekday engagement is 40% higher than weekends',
      'Morning sessions are 25% longer than evening sessions',
      'Mobile engagement peaks during commute hours'
    ];
  }

  private async analyzeTrendingTopics(): Promise<string[]> {
    return [
      'ESG investing trending up 35%',
      'Cryptocurrency interest declining 20%',
      'Sustainable finance gaining traction',
      'AI in trading becoming popular'
    ];
  }

  private async performQualityAssessment(): Promise<string[]> {
    return [
      'Overall content quality score: 7.2/10',
      'Accuracy rate: 94%',
      'User satisfaction: 8.1/10',
      'Content freshness: 6.8/10'
    ];
  }

  private async getContentTimingData(cardId: string): Promise<any[]> {
    // Mock timing data
    return [
      { timeOfDay: 'morning', engagement: 0.8 },
      { timeOfDay: 'evening', engagement: 0.7 }
    ];
  }

  private analyzeTimingPatterns(timingData: any[]): {
    timeOfDay: string[];
    dayOfWeek: string[];
  } {
    const optimalTimes = timingData
      .filter(data => data.engagement > 0.7)
      .map(data => data.timeOfDay);
    
    return {
      timeOfDay: optimalTimes,
      dayOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    };
  }

  private async getRelatedContentData(cardId: string): Promise<string[]> {
    // Mock related content
    return ['related1', 'related2', 'related3'];
  }

  // Storage methods
  private async storeContentRankings(rankings: CommunityContentRanking[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const ranking of rankings) {
        const rankingRef = this.db.collection('content_rankings').doc(ranking.cardId);
        batch.set(rankingRef, ranking);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing content rankings:', error);
    }
  }

  private async storeHighPerformingContent(content: HighPerformingContent[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const item of content) {
        const contentRef = this.db.collection('high_performing_content').doc(item.cardId);
        batch.set(contentRef, item);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing high-performing content:', error);
    }
  }

  private async storeUnderperformingContent(content: UnderperformingContent[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const item of content) {
        const contentRef = this.db.collection('underperforming_content').doc(item.cardId);
        batch.set(contentRef, item);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing underperforming content:', error);
    }
  }

  private async storeCommunityInsights(insights: CommunityInsight[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const insight of insights) {
        const insightRef = this.db.collection('community_insights').doc(insight.id);
        batch.set(insightRef, insight);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing community insights:', error);
    }
  }

  private async updateContentLifecycle(stages: ContentLifecycleStage[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const stage of stages) {
        const stageRef = this.db.collection('content_lifecycle').doc(stage.cardId);
        batch.set(stageRef, stage);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error updating content lifecycle:', error);
    }
  }

  private async archiveDecliningContent(stages: ContentLifecycleStage[]): Promise<void> {
    try {
      const decliningContent = stages.filter(stage => stage.stage === 'archived');
      
      if (decliningContent.length === 0) return;
      
      const batch = this.db.batch();
      
      for (const stage of decliningContent) {
        // Archive the content
        const contentRef = this.db.collection('cards').doc(stage.cardId);
        batch.update(contentRef, {
          archived: true,
          archivedAt: this.db.FieldValue.serverTimestamp()
        });
      }
      
      await batch.commit();
      console.log('📦 Archived declining content:', decliningContent.length);
    } catch (error) {
      console.error('Error archiving declining content:', error);
    }
  }
}

// Export singleton instance
export const contentCurationService = new ContentCurationService();
