// Personalization analytics service for measuring and improving personalization effectiveness
import { Platform } from 'react-native';
import { PersonalizedCard } from './PersonalizationEngine';
import { UserInteraction, InteractionAction } from './EngagementTracker';

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
  console.log('🔄 Using dummy Firebase services for PersonalizationAnalytics (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for PersonalizationAnalytics');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for PersonalizationAnalytics, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Types for personalization analytics
export interface PersonalizationMetrics {
  userId: string;
  totalRecommendations: number;
  successfulRecommendations: number;
  userSatisfactionScore: number;
  contentDiversityScore: number;
  personalizationAccuracy: number;
  engagementRate: number;
  clickThroughRate: number;
  completionRate: number;
  lastUpdated: Date;
  period: 'daily' | 'weekly' | 'monthly';
}

export interface RecommendationAccuracy {
  cardId: string;
  predictedRelevance: number;
  actualEngagement: number;
  accuracy: number;
  feedback: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

export interface ContentDiversityMetrics {
  contentTypeDistribution: Record<string, number>;
  sectorDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  diversityScore: number; // 0-1, higher is more diverse
}

export interface UserSatisfactionMetrics {
  userId: string;
  averageRating: number;
  feedbackCount: number;
  positiveFeedbackRate: number;
  negativeFeedbackRate: number;
  lastSurveyDate?: Date;
}

export interface PersonalizationInsight {
  type: 'accuracy' | 'diversity' | 'engagement' | 'satisfaction' | 'bias';
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
  metrics: Record<string, number>;
  timestamp: Date;
}

export interface A/BTestResult {
  testId: string;
  variant: 'control' | 'treatment';
  userId: string;
  metrics: {
    engagementRate: number;
    satisfactionScore: number;
    completionRate: number;
    diversityScore: number;
  };
  significance: number; // Statistical significance
  winner: 'control' | 'treatment' | 'inconclusive';
}

export interface PersonalizationBias {
  type: 'content_type' | 'sector' | 'difficulty' | 'temporal' | 'demographic';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedUsers: number;
  impact: number; // 0-1
  mitigation: string;
}

// Personalization Analytics Service
export class PersonalizationAnalytics {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Track personalization impact
  async trackPersonalizationImpact(userId: string, recommendations: PersonalizedCard[]): Promise<void> {
    try {
      const timestamp = this.db.FieldValue.serverTimestamp();
      
      // Store recommendation batch
      const batch = this.db.batch();
      
      recommendations.forEach(card => {
        const recRef = this.db
          .collection('users')
          .doc(userId)
          .collection('recommendations')
          .doc();
        
        batch.set(recRef, {
          cardId: card.id,
          cardType: card.type,
          relevanceScore: card.relevanceScore,
          personalizationReason: card.personalizationReason,
          confidence: card.confidence,
          timestamp,
          position: recommendations.indexOf(card),
          sessionId: `session_${Date.now()}`
        });
      });
      
      await batch.commit();
      console.log('📊 Personalization impact tracked for user:', userId);
    } catch (error) {
      console.error('Error tracking personalization impact:', error);
    }
  }

  // Measure recommendation accuracy
  async measureRecommendationAccuracy(userId: string, daysBack: number = 7): Promise<RecommendationAccuracy[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Get recommendations from the period
      const recommendationsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('recommendations')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const recommendations = recommendationsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      // Get user interactions for the same period
      const interactionsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const interactions = interactionsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      // Calculate accuracy for each recommendation
      const accuracyResults: RecommendationAccuracy[] = [];
      
      recommendations.forEach(rec => {
        const cardInteractions = interactions.filter(i => i.cardId === rec.cardId);
        const positiveInteractions = cardInteractions.filter(i => 
          i.action === 'swipe_right' || i.action === 'save' || i.action === 'share' || i.action === 'complete'
        );
        
        const actualEngagement = cardInteractions.length > 0 ? 
          positiveInteractions.length / cardInteractions.length : 0;
        
        const accuracy = 1 - Math.abs(rec.relevanceScore - actualEngagement);
        
        let feedback: 'positive' | 'negative' | 'neutral' = 'neutral';
        if (actualEngagement > 0.7) feedback = 'positive';
        else if (actualEngagement < 0.3) feedback = 'negative';
        
        accuracyResults.push({
          cardId: rec.cardId,
          predictedRelevance: rec.relevanceScore,
          actualEngagement,
          accuracy,
          feedback,
          timestamp: rec.timestamp
        });
      });

      return accuracyResults;
    } catch (error) {
      console.error('Error measuring recommendation accuracy:', error);
      return [];
    }
  }

  // Monitor content diversity
  async monitorContentDiversity(userId: string, daysBack: number = 7): Promise<ContentDiversityMetrics> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Get recent recommendations
      const recommendationsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('recommendations')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const recommendations = recommendationsSnapshot.docs.map((doc: any) => doc.data());

      // Calculate distributions
      const contentTypeDistribution: Record<string, number> = {};
      const sectorDistribution: Record<string, number> = {};
      const difficultyDistribution: Record<string, number> = {};

      recommendations.forEach(rec => {
        // Content type distribution
        contentTypeDistribution[rec.cardType] = (contentTypeDistribution[rec.cardType] || 0) + 1;
        
        // Sector distribution (for stocks/crypto)
        if (rec.cardType === 'stock' || rec.cardType === 'crypto') {
          // This would need to be fetched from card metadata in a real implementation
          const sector = 'technology'; // Placeholder
          sectorDistribution[sector] = (sectorDistribution[sector] || 0) + 1;
        }
        
        // Difficulty distribution (for lessons)
        if (rec.cardType === 'lesson') {
          const difficulty = 'intermediate'; // Placeholder
          difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1;
        }
      });

      // Calculate diversity score using Shannon entropy
      const diversityScore = this.calculateShannonEntropy([
        ...Object.values(contentTypeDistribution),
        ...Object.values(sectorDistribution),
        ...Object.values(difficultyDistribution)
      ]);

      return {
        contentTypeDistribution,
        sectorDistribution,
        difficultyDistribution,
        diversityScore
      };
    } catch (error) {
      console.error('Error monitoring content diversity:', error);
      return {
        contentTypeDistribution: {},
        sectorDistribution: {},
        difficultyDistribution: {},
        diversityScore: 0
      };
    }
  }

  // Analyze personalization trends
  async analyzePersonalizationTrends(daysBack: number = 30): Promise<{
    overallAccuracy: number;
    averageDiversity: number;
    userSatisfaction: number;
    engagementTrend: 'increasing' | 'decreasing' | 'stable';
    insights: PersonalizationInsight[];
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Get all user metrics from the period
      const metricsSnapshot = await this.db
        .collection('personalization_metrics')
        .where('lastUpdated', '>=', cutoffDate)
        .get();

      const metrics = metricsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
      }));

      if (metrics.length === 0) {
        return {
          overallAccuracy: 0,
          averageDiversity: 0,
          userSatisfaction: 0,
          engagementTrend: 'stable',
          insights: []
        };
      }

      // Calculate aggregate metrics
      const overallAccuracy = metrics.reduce((sum, m) => sum + m.personalizationAccuracy, 0) / metrics.length;
      const averageDiversity = metrics.reduce((sum, m) => sum + m.contentDiversityScore, 0) / metrics.length;
      const userSatisfaction = metrics.reduce((sum, m) => sum + m.userSatisfactionScore, 0) / metrics.length;

      // Calculate engagement trend
      const sortedMetrics = metrics.sort((a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime());
      const firstHalf = sortedMetrics.slice(0, Math.floor(sortedMetrics.length / 2));
      const secondHalf = sortedMetrics.slice(Math.floor(sortedMetrics.length / 2));
      
      const firstHalfEngagement = firstHalf.reduce((sum, m) => sum + m.engagementRate, 0) / firstHalf.length;
      const secondHalfEngagement = secondHalf.reduce((sum, m) => sum + m.engagementRate, 0) / secondHalf.length;
      
      let engagementTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (secondHalfEngagement > firstHalfEngagement * 1.1) engagementTrend = 'increasing';
      else if (secondHalfEngagement < firstHalfEngagement * 0.9) engagementTrend = 'decreasing';

      // Generate insights
      const insights = this.generatePersonalizationInsights(metrics);

      return {
        overallAccuracy,
        averageDiversity,
        userSatisfaction,
        engagementTrend,
        insights
      };
    } catch (error) {
      console.error('Error analyzing personalization trends:', error);
      return {
        overallAccuracy: 0,
        averageDiversity: 0,
        userSatisfaction: 0,
        engagementTrend: 'stable',
        insights: []
      };
    }
  }

  // Generate personalization insights
  generatePersonalizationInsights(metrics: PersonalizationMetrics[]): PersonalizationInsight[] {
    const insights: PersonalizationInsight[] = [];

    // Analyze accuracy
    const avgAccuracy = metrics.reduce((sum, m) => sum + m.personalizationAccuracy, 0) / metrics.length;
    if (avgAccuracy < 0.6) {
      insights.push({
        type: 'accuracy',
        severity: avgAccuracy < 0.4 ? 'high' : 'medium',
        message: `Personalization accuracy is below target (${Math.round(avgAccuracy * 100)}%)`,
        recommendation: 'Review recommendation algorithms and user feedback loops',
        metrics: { accuracy: avgAccuracy },
        timestamp: new Date()
      });
    }

    // Analyze diversity
    const avgDiversity = metrics.reduce((sum, m) => sum + m.contentDiversityScore, 0) / metrics.length;
    if (avgDiversity < 0.5) {
      insights.push({
        type: 'diversity',
        severity: avgDiversity < 0.3 ? 'high' : 'medium',
        message: `Content diversity is low (${Math.round(avgDiversity * 100)}%)`,
        recommendation: 'Increase content variety and reduce filter bubble effects',
        metrics: { diversity: avgDiversity },
        timestamp: new Date()
      });
    }

    // Analyze engagement
    const avgEngagement = metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length;
    if (avgEngagement < 0.3) {
      insights.push({
        type: 'engagement',
        severity: avgEngagement < 0.2 ? 'high' : 'medium',
        message: `User engagement is declining (${Math.round(avgEngagement * 100)}%)`,
        recommendation: 'Improve content relevance and user experience',
        metrics: { engagement: avgEngagement },
        timestamp: new Date()
      });
    }

    // Analyze satisfaction
    const avgSatisfaction = metrics.reduce((sum, m) => sum + m.userSatisfactionScore, 0) / metrics.length;
    if (avgSatisfaction < 3.5) {
      insights.push({
        type: 'satisfaction',
        severity: avgSatisfaction < 2.5 ? 'high' : 'medium',
        message: `User satisfaction is below target (${avgSatisfaction.toFixed(1)}/5)`,
        recommendation: 'Gather more user feedback and improve recommendation quality',
        metrics: { satisfaction: avgSatisfaction },
        timestamp: new Date()
      });
    }

    return insights;
  }

  // Detect personalization bias
  async detectPersonalizationBias(userId: string, daysBack: number = 30): Promise<PersonalizationBias[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      // Get user's recommendations
      const recommendationsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('recommendations')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const recommendations = recommendationsSnapshot.docs.map((doc: any) => doc.data());
      
      if (recommendations.length === 0) return [];

      const biases: PersonalizationBias[] = [];

      // Check content type bias
      const contentTypeCounts: Record<string, number> = {};
      recommendations.forEach(rec => {
        contentTypeCounts[rec.cardType] = (contentTypeCounts[rec.cardType] || 0) + 1;
      });

      const totalRecommendations = recommendations.length;
      Object.entries(contentTypeCounts).forEach(([type, count]) => {
        const percentage = count / totalRecommendations;
        if (percentage > 0.7) { // More than 70% of one type
          biases.push({
            type: 'content_type',
            description: `Over-recommending ${type} content (${Math.round(percentage * 100)}%)`,
            severity: percentage > 0.8 ? 'high' : 'medium',
            affectedUsers: 1,
            impact: percentage - 0.5, // Impact above 50% baseline
            mitigation: 'Increase diversity in content type recommendations'
          });
        }
      });

      // Check temporal bias
      const hourCounts: Record<number, number> = {};
      recommendations.forEach(rec => {
        const hour = new Date(rec.timestamp?.toDate() || new Date()).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const peakHours = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour));

      if (peakHours.length > 0) {
        const peakPercentage = peakHours.reduce((sum, hour) => sum + (hourCounts[hour] || 0), 0) / totalRecommendations;
        if (peakPercentage > 0.6) {
          biases.push({
            type: 'temporal',
            description: `Recommendations concentrated in specific hours (${Math.round(peakPercentage * 100)}%)`,
            severity: peakPercentage > 0.8 ? 'high' : 'medium',
            affectedUsers: 1,
            impact: peakPercentage - 0.4,
            mitigation: 'Distribute recommendations more evenly across time periods'
          });
        }
      }

      return biases;
    } catch (error) {
      console.error('Error detecting personalization bias:', error);
      return [];
    }
  }

  // Update user metrics
  async updateUserMetrics(userId: string, metrics: Partial<PersonalizationMetrics>): Promise<void> {
    try {
      const metricsData: PersonalizationMetrics = {
        userId,
        totalRecommendations: metrics.totalRecommendations || 0,
        successfulRecommendations: metrics.successfulRecommendations || 0,
        userSatisfactionScore: metrics.userSatisfactionScore || 0,
        contentDiversityScore: metrics.contentDiversityScore || 0,
        personalizationAccuracy: metrics.personalizationAccuracy || 0,
        engagementRate: metrics.engagementRate || 0,
        clickThroughRate: metrics.clickThroughRate || 0,
        completionRate: metrics.completionRate || 0,
        lastUpdated: new Date(),
        period: metrics.period || 'daily'
      };

      await this.db
        .collection('personalization_metrics')
        .doc(`${userId}_${Date.now()}`)
        .set(metricsData);

      console.log('📊 User metrics updated:', userId);
    } catch (error) {
      console.error('Error updating user metrics:', error);
    }
  }

  // Collect user feedback
  async collectUserFeedback(userId: string, feedback: {
    cardId: string;
    rating: number; // 1-5
    feedback?: string;
    category: 'relevance' | 'quality' | 'diversity' | 'timing';
  }): Promise<void> {
    try {
      await this.db
        .collection('users')
        .doc(userId)
        .collection('feedback')
        .add({
          ...feedback,
          timestamp: this.db.FieldValue.serverTimestamp()
        });

      console.log('📊 User feedback collected:', userId);
    } catch (error) {
      console.error('Error collecting user feedback:', error);
    }
  }

  // Run A/B test
  async runABTest(testId: string, userId: string, variant: 'control' | 'treatment'): Promise<A/BTestResult> {
    try {
      // This is a simplified A/B test implementation
      // In a real system, you'd have more sophisticated statistical analysis
      
      const testResult: A/BTestResult = {
        testId,
        variant,
        userId,
        metrics: {
          engagementRate: Math.random() * 0.5 + 0.3, // Placeholder
          satisfactionScore: Math.random() * 2 + 3, // Placeholder
          completionRate: Math.random() * 0.4 + 0.4, // Placeholder
          diversityScore: Math.random() * 0.5 + 0.3 // Placeholder
        },
        significance: Math.random() * 0.3 + 0.7, // Placeholder
        winner: Math.random() > 0.5 ? 'treatment' : 'control' // Placeholder
      };

      // Store test result
      await this.db
        .collection('ab_test_results')
        .doc(`${testId}_${userId}`)
        .set({
          ...testResult,
          timestamp: this.db.FieldValue.serverTimestamp()
        });

      return testResult;
    } catch (error) {
      console.error('Error running A/B test:', error);
      throw error;
    }
  }

  // Get personalization dashboard data
  async getPersonalizationDashboard(userId: string): Promise<{
    metrics: PersonalizationMetrics;
    accuracy: RecommendationAccuracy[];
    diversity: ContentDiversityMetrics;
    biases: PersonalizationBias[];
    insights: PersonalizationInsight[];
  }> {
    try {
      const [accuracy, diversity, biases, insights] = await Promise.all([
        this.measureRecommendationAccuracy(userId),
        this.monitorContentDiversity(userId),
        this.detectPersonalizationBias(userId),
        this.generatePersonalizationInsights([]) // Would need actual metrics
      ]);

      // Get latest metrics
      const metricsSnapshot = await this.db
        .collection('personalization_metrics')
        .where('userId', '==', userId)
        .orderBy('lastUpdated', 'desc')
        .limit(1)
        .get();

      const metrics = metricsSnapshot.docs[0]?.data() || {
        userId,
        totalRecommendations: 0,
        successfulRecommendations: 0,
        userSatisfactionScore: 0,
        contentDiversityScore: 0,
        personalizationAccuracy: 0,
        engagementRate: 0,
        clickThroughRate: 0,
        completionRate: 0,
        lastUpdated: new Date(),
        period: 'daily' as const
      };

      return {
        metrics,
        accuracy,
        diversity,
        biases,
        insights
      };
    } catch (error) {
      console.error('Error getting personalization dashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateShannonEntropy(values: number[]): number {
    const total = values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return 0;

    let entropy = 0;
    values.forEach(value => {
      if (value > 0) {
        const probability = value / total;
        entropy -= probability * Math.log2(probability);
      }
    });

    return entropy / Math.log2(values.length); // Normalize to 0-1
  }

  // Calculate user satisfaction from feedback
  async calculateUserSatisfaction(userId: string, daysBack: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const feedbackSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('feedback')
        .where('timestamp', '>=', cutoffDate)
        .get();

      const feedback = feedbackSnapshot.docs.map((doc: any) => doc.data());
      
      if (feedback.length === 0) return 0;

      const averageRating = feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
      return averageRating;
    } catch (error) {
      console.error('Error calculating user satisfaction:', error);
      return 0;
    }
  }

  // Calculate engagement rate
  async calculateEngagementRate(userId: string, daysBack: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const [recommendationsSnapshot, interactionsSnapshot] = await Promise.all([
        this.db
          .collection('users')
          .doc(userId)
          .collection('recommendations')
          .where('timestamp', '>=', cutoffDate)
          .get(),
        this.db
          .collection('users')
          .doc(userId)
          .collection('interactions')
          .where('timestamp', '>=', cutoffDate)
          .get()
      ]);

      const recommendations = recommendationsSnapshot.docs.length;
      const interactions = interactionsSnapshot.docs.length;

      return recommendations > 0 ? interactions / recommendations : 0;
    } catch (error) {
      console.error('Error calculating engagement rate:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const personalizationAnalytics = new PersonalizationAnalytics();
