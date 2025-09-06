// Pattern Recognition engine for identifying successful user journeys and content sequences
import { Platform } from 'react-native';
import { UserInteraction, CardType, InteractionAction } from './EngagementTracker';
import { UserProfile } from './UserProfileService';

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
  console.log('🔄 Using dummy Firebase services for PatternRecognition (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for PatternRecognition');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for PatternRecognition, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Types for pattern recognition
export interface LearningPathPattern {
  id: string;
  name: string;
  sequence: string[]; // Array of card IDs
  successRate: number; // 0-1
  averageCompletionTime: number; // in minutes
  userCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  outcomes: string[];
  tags: string[];
  confidence: number; // Statistical confidence in the pattern
  lastUpdated: Date;
}

export interface InvestmentBehaviorPattern {
  id: string;
  name: string;
  behaviorType: 'portfolio_building' | 'risk_management' | 'sector_rotation' | 'timing';
  sequence: string[]; // Sequence of investment actions
  successRate: number;
  averageReturn: number; // Mock data - would need real portfolio data
  userCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
  marketConditions: string[]; // When this pattern works best
  confidence: number;
  lastUpdated: Date;
}

export interface EngagementPattern {
  id: string;
  name: string;
  patternType: 'timing' | 'sequencing' | 'content_mix' | 'session_optimization';
  description: string;
  optimalTiming: {
    timeOfDay: string[];
    dayOfWeek: string[];
    sessionLength: number;
  };
  contentSequence: string[]; // Optimal content ordering
  engagementBoost: number; // Expected improvement in engagement
  userCount: number;
  confidence: number;
  lastUpdated: Date;
}

export interface EmergingTrend {
  id: string;
  type: 'content_preference' | 'behavior_change' | 'market_shift' | 'learning_evolution';
  description: string;
  strength: number; // 0-1
  growthRate: number; // Rate of change
  affectedSegments: string[];
  indicators: string[]; // What signals this trend
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  confidence: number;
  lastUpdated: Date;
}

export interface PatternValidation {
  patternId: string;
  validationType: 'statistical' | 'temporal' | 'causal' | 'predictive';
  isValid: boolean;
  confidence: number;
  reasons: string[];
  recommendations: string[];
  lastValidated: Date;
}

// Pattern Recognition Engine
export class PatternRecognitionEngine {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Identify learning path patterns
  async identifyLearningPathPatterns(): Promise<LearningPathPattern[]> {
    try {
      console.log('🔍 Identifying learning path patterns...');
      
      // Get user completion sequences
      const completionSequences = await this.getCompletionSequences();
      
      // Analyze patterns in sequences
      const patterns = await this.analyzeLearningSequences(completionSequences);
      
      // Validate pattern significance
      const validatedPatterns = await this.validatePatternSignificance(patterns, 'learning');
      
      // Store patterns
      await this.storeLearningPathPatterns(validatedPatterns);
      
      console.log('✅ Learning path patterns identified:', validatedPatterns.length);
      return validatedPatterns;
    } catch (error) {
      console.error('Error identifying learning path patterns:', error);
      return [];
    }
  }

  // Discover investment behavior patterns
  async discoverInvestmentBehaviorPatterns(): Promise<InvestmentBehaviorPattern[]> {
    try {
      console.log('🔍 Discovering investment behavior patterns...');
      
      // Get user investment sequences
      const investmentSequences = await this.getInvestmentSequences();
      
      // Analyze investment patterns
      const patterns = await this.analyzeInvestmentSequences(investmentSequences);
      
      // Validate pattern significance
      const validatedPatterns = await this.validatePatternSignificance(patterns, 'investment');
      
      // Store patterns
      await this.storeInvestmentBehaviorPatterns(validatedPatterns);
      
      console.log('✅ Investment behavior patterns discovered:', validatedPatterns.length);
      return validatedPatterns;
    } catch (error) {
      console.error('Error discovering investment behavior patterns:', error);
      return [];
    }
  }

  // Analyze engagement patterns
  async analyzeEngagementPatterns(): Promise<EngagementPattern[]> {
    try {
      console.log('🔍 Analyzing engagement patterns...');
      
      // Get user engagement data
      const engagementData = await this.getEngagementData();
      
      // Analyze timing patterns
      const timingPatterns = await this.analyzeTimingPatterns(engagementData);
      
      // Analyze sequencing patterns
      const sequencingPatterns = await this.analyzeSequencingPatterns(engagementData);
      
      // Analyze content mix patterns
      const contentMixPatterns = await this.analyzeContentMixPatterns(engagementData);
      
      // Combine and validate patterns
      const allPatterns = [...timingPatterns, ...sequencingPatterns, ...contentMixPatterns];
      const validatedPatterns = await this.validatePatternSignificance(allPatterns, 'engagement');
      
      // Store patterns
      await this.storeEngagementPatterns(validatedPatterns);
      
      console.log('✅ Engagement patterns analyzed:', validatedPatterns.length);
      return validatedPatterns;
    } catch (error) {
      console.error('Error analyzing engagement patterns:', error);
      return [];
    }
  }

  // Detect emerging trends
  async detectEmergingTrends(): Promise<EmergingTrend[]> {
    try {
      console.log('🔍 Detecting emerging trends...');
      
      // Get recent behavior data
      const recentData = await this.getRecentBehaviorData();
      
      // Compare with historical data
      const historicalData = await this.getHistoricalBehaviorData();
      
      // Identify trend indicators
      const trendIndicators = await this.identifyTrendIndicators(recentData, historicalData);
      
      // Analyze trend strength and growth
      const trends = await this.analyzeTrendStrength(trendIndicators);
      
      // Validate trend significance
      const validatedTrends = await this.validateTrendSignificance(trends);
      
      // Store trends
      await this.storeEmergingTrends(validatedTrends);
      
      console.log('✅ Emerging trends detected:', validatedTrends.length);
      return validatedTrends;
    } catch (error) {
      console.error('Error detecting emerging trends:', error);
      return [];
    }
  }

  // Validate pattern significance
  async validatePatternSignificance(patterns: any[], type: string): Promise<any[]> {
    try {
      const validatedPatterns: any[] = [];
      
      for (const pattern of patterns) {
        const validation = await this.performPatternValidation(pattern, type);
        
        if (validation.isValid && validation.confidence > 0.6) {
          validatedPatterns.push({
            ...pattern,
            confidence: validation.confidence,
            validation: validation
          });
        }
      }
      
      return validatedPatterns;
    } catch (error) {
      console.error('Error validating pattern significance:', error);
      return patterns; // Return original patterns if validation fails
    }
  }

  // Generate pattern-based recommendations
  async generatePatternBasedRecommendations(userId: string, limit: number = 10): Promise<Array<{
    cardId: string;
    reason: string;
    confidence: number;
    pattern: string;
  }>> {
    try {
      console.log('🎯 Generating pattern-based recommendations for user:', userId);
      
      // Get user's current progress and behavior
      const userProfile = await this.getUserProfile(userId);
      const userInteractions = await this.getUserInteractions(userId);
      
      if (!userProfile || userInteractions.length < 5) {
        return []; // Not enough data for pattern-based recommendations
      }
      
      // Get relevant patterns
      const learningPatterns = await this.getRelevantLearningPatterns(userProfile);
      const engagementPatterns = await this.getRelevantEngagementPatterns(userProfile);
      
      // Generate recommendations based on patterns
      const recommendations: Array<{
        cardId: string;
        reason: string;
        confidence: number;
        pattern: string;
      }> = [];
      
      // Add learning path recommendations
      for (const pattern of learningPatterns) {
        const nextCards = this.getNextCardsInPattern(pattern, userProfile);
        for (const cardId of nextCards) {
          recommendations.push({
            cardId,
            reason: `Next in successful learning path: ${pattern.name}`,
            confidence: pattern.confidence,
            pattern: pattern.id
          });
        }
      }
      
      // Add engagement optimization recommendations
      for (const pattern of engagementPatterns) {
        const optimalContent = this.getOptimalContentForPattern(pattern, userProfile);
        for (const cardId of optimalContent) {
          recommendations.push({
            cardId,
            reason: `Optimal for engagement pattern: ${pattern.name}`,
            confidence: pattern.confidence * 0.8, // Slightly lower confidence for engagement patterns
            pattern: pattern.id
          });
        }
      }
      
      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);
    } catch (error) {
      console.error('Error generating pattern-based recommendations:', error);
      return [];
    }
  }

  // Helper methods
  private async getCompletionSequences(): Promise<string[][]> {
    try {
      // Get user completion sequences from interactions
      const snapshot = await this.db
        .collection('users')
        .get();

      const sequences: string[][] = [];
      
      for (const userDoc of snapshot.docs) {
        const interactionsSnapshot = await this.db
          .collection('users')
          .doc(userDoc.id)
          .collection('interactions')
          .where('action', '==', 'complete')
          .orderBy('timestamp', 'asc')
          .get();

        const userSequence = interactionsSnapshot.docs.map((doc: any) => doc.data().cardId);
        if (userSequence.length >= 3) { // Minimum sequence length
          sequences.push(userSequence);
        }
      }
      
      return sequences;
    } catch (error) {
      console.error('Error getting completion sequences:', error);
      return [];
    }
  }

  private async analyzeLearningSequences(sequences: string[][]): Promise<LearningPathPattern[]> {
    const patternMap = new Map<string, {
      count: number;
      sequences: string[][];
      completionTimes: number[];
    }>();
    
    // Group similar sequences
    sequences.forEach(sequence => {
      const key = this.generateSequenceKey(sequence);
      const existing = patternMap.get(key);
      
      if (existing) {
        existing.count++;
        existing.sequences.push(sequence);
        existing.completionTimes.push(sequence.length * 5); // Mock completion time
      } else {
        patternMap.set(key, {
          count: 1,
          sequences: [sequence],
          completionTimes: [sequence.length * 5]
        });
      }
    });
    
    // Convert to patterns
    const patterns: LearningPathPattern[] = [];
    
    patternMap.forEach((data, key) => {
      if (data.count >= 3) { // Minimum user count
        const avgCompletionTime = data.completionTimes.reduce((sum, time) => sum + time, 0) / data.completionTimes.length;
        
        patterns.push({
          id: `learning_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `Learning Path: ${key}`,
          sequence: data.sequences[0],
          successRate: data.count / sequences.length,
          averageCompletionTime: avgCompletionTime,
          userCount: data.count,
          difficulty: this.determineDifficulty(data.sequences[0]),
          prerequisites: this.extractPrerequisites(data.sequences[0]),
          outcomes: this.extractOutcomes(data.sequences[0]),
          tags: this.extractTags(data.sequences[0]),
          confidence: 0.8, // Will be updated by validation
          lastUpdated: new Date()
        });
      }
    });
    
    return patterns;
  }

  private async getInvestmentSequences(): Promise<string[][]> {
    try {
      // Mock investment sequences - in real implementation, this would analyze portfolio changes
      return [
        ['stock1', 'stock2', 'crypto1'],
        ['stock1', 'news1', 'stock2'],
        ['lesson1', 'stock1', 'stock2']
      ];
    } catch (error) {
      console.error('Error getting investment sequences:', error);
      return [];
    }
  }

  private async analyzeInvestmentSequences(sequences: string[][]): Promise<InvestmentBehaviorPattern[]> {
    const patterns: InvestmentBehaviorPattern[] = [];
    
    // Analyze portfolio building patterns
    const portfolioPatterns = this.analyzePortfolioBuildingPatterns(sequences);
    patterns.push(...portfolioPatterns);
    
    // Analyze risk management patterns
    const riskPatterns = this.analyzeRiskManagementPatterns(sequences);
    patterns.push(...riskPatterns);
    
    return patterns;
  }

  private analyzePortfolioBuildingPatterns(sequences: string[][]): InvestmentBehaviorPattern[] {
    const patterns: InvestmentBehaviorPattern[] = [];
    
    // Look for patterns where users start with lessons, then move to stocks
    const lessonToStockPatterns = sequences.filter(seq => 
      seq.some(item => item.startsWith('lesson')) && 
      seq.some(item => item.startsWith('stock'))
    );
    
    if (lessonToStockPatterns.length >= 3) {
      patterns.push({
        id: `investment_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Learn Before Invest',
        behaviorType: 'portfolio_building',
        sequence: ['lesson', 'stock'],
        successRate: lessonToStockPatterns.length / sequences.length,
        averageReturn: 0.12, // Mock data
        userCount: lessonToStockPatterns.length,
        riskLevel: 'medium',
        timeHorizon: 'long',
        marketConditions: ['stable', 'bull'],
        confidence: 0.8,
        lastUpdated: new Date()
      });
    }
    
    return patterns;
  }

  private analyzeRiskManagementPatterns(sequences: string[][]): InvestmentBehaviorPattern[] {
    const patterns: InvestmentBehaviorPattern[] = [];
    
    // Look for patterns where users diversify across sectors
    const diversificationPatterns = sequences.filter(seq => {
      const sectors = new Set(seq.map(item => this.extractSector(item)));
      return sectors.size >= 2;
    });
    
    if (diversificationPatterns.length >= 3) {
      patterns.push({
        id: `risk_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Sector Diversification',
        behaviorType: 'risk_management',
        sequence: ['stock_tech', 'stock_finance', 'stock_healthcare'],
        successRate: diversificationPatterns.length / sequences.length,
        averageReturn: 0.08, // Mock data
        userCount: diversificationPatterns.length,
        riskLevel: 'low',
        timeHorizon: 'long',
        marketConditions: ['volatile', 'uncertain'],
        confidence: 0.7,
        lastUpdated: new Date()
      });
    }
    
    return patterns;
  }

  private async getEngagementData(): Promise<any[]> {
    try {
      // Mock engagement data
      return [
        {
          userId: 'user1',
          timeOfDay: 'morning',
          dayOfWeek: 'monday',
          sessionLength: 15,
          contentSequence: ['lesson1', 'news1', 'stock1'],
          engagementScore: 0.8
        }
      ];
    } catch (error) {
      console.error('Error getting engagement data:', error);
      return [];
    }
  }

  private async analyzeTimingPatterns(engagementData: any[]): Promise<EngagementPattern[]> {
    const patterns: EngagementPattern[] = [];
    
    // Analyze optimal timing patterns
    const timingGroups = this.groupByTiming(engagementData);
    
    for (const [timing, data] of timingGroups.entries()) {
      if (data.length >= 5) { // Minimum data points
        const avgEngagement = data.reduce((sum, item) => sum + item.engagementScore, 0) / data.length;
        
        if (avgEngagement > 0.7) {
          patterns.push({
            id: `timing_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `High Engagement: ${timing}`,
            patternType: 'timing',
            description: `Users show high engagement during ${timing}`,
            optimalTiming: {
              timeOfDay: [timing.split('_')[0]],
              dayOfWeek: [timing.split('_')[1]],
              sessionLength: 15
            },
            contentSequence: [],
            engagementBoost: avgEngagement - 0.5, // Expected improvement
            userCount: data.length,
            confidence: 0.8,
            lastUpdated: new Date()
          });
        }
      }
    }
    
    return patterns;
  }

  private async analyzeSequencingPatterns(engagementData: any[]): Promise<EngagementPattern[]> {
    const patterns: EngagementPattern[] = [];
    
    // Analyze optimal content sequencing
    const sequenceGroups = this.groupBySequence(engagementData);
    
    for (const [sequence, data] of sequenceGroups.entries()) {
      if (data.length >= 3) {
        const avgEngagement = data.reduce((sum, item) => sum + item.engagementScore, 0) / data.length;
        
        if (avgEngagement > 0.75) {
          patterns.push({
            id: `sequence_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `Optimal Sequence: ${sequence}`,
            patternType: 'sequencing',
            description: `High engagement with sequence: ${sequence}`,
            optimalTiming: {
              timeOfDay: [],
              dayOfWeek: [],
              sessionLength: 0
            },
            contentSequence: sequence.split('->'),
            engagementBoost: avgEngagement - 0.5,
            userCount: data.length,
            confidence: 0.8,
            lastUpdated: new Date()
          });
        }
      }
    }
    
    return patterns;
  }

  private async analyzeContentMixPatterns(engagementData: any[]): Promise<EngagementPattern[]> {
    const patterns: EngagementPattern[] = [];
    
    // Analyze optimal content mix
    const mixGroups = this.groupByContentMix(engagementData);
    
    for (const [mix, data] of mixGroups.entries()) {
      if (data.length >= 4) {
        const avgEngagement = data.reduce((sum, item) => sum + item.engagementScore, 0) / data.length;
        
        if (avgEngagement > 0.8) {
          patterns.push({
            id: `mix_pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `Optimal Mix: ${mix}`,
            patternType: 'content_mix',
            description: `High engagement with content mix: ${mix}`,
            optimalTiming: {
              timeOfDay: [],
              dayOfWeek: [],
              sessionLength: 0
            },
            contentSequence: mix.split('+'),
            engagementBoost: avgEngagement - 0.5,
            userCount: data.length,
            confidence: 0.8,
            lastUpdated: new Date()
          });
        }
      }
    }
    
    return patterns;
  }

  private async getRecentBehaviorData(): Promise<any[]> {
    try {
      // Get data from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const snapshot = await this.db
        .collection('users')
        .get();

      const recentData: any[] = [];
      
      for (const userDoc of snapshot.docs) {
        const interactionsSnapshot = await this.db
          .collection('users')
          .doc(userDoc.id)
          .collection('interactions')
          .where('timestamp', '>=', sevenDaysAgo)
          .get();

        const userData = interactionsSnapshot.docs.map((doc: any) => doc.data());
        if (userData.length > 0) {
          recentData.push({
            userId: userDoc.id,
            interactions: userData,
            behavior: this.extractBehaviorMetrics(userData)
          });
        }
      }
      
      return recentData;
    } catch (error) {
      console.error('Error getting recent behavior data:', error);
      return [];
    }
  }

  private async getHistoricalBehaviorData(): Promise<any[]> {
    try {
      // Get data from 30-60 days ago for comparison
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const snapshot = await this.db
        .collection('users')
        .get();

      const historicalData: any[] = [];
      
      for (const userDoc of snapshot.docs) {
        const interactionsSnapshot = await this.db
          .collection('users')
          .doc(userDoc.id)
          .collection('interactions')
          .where('timestamp', '>=', sixtyDaysAgo)
          .where('timestamp', '<', thirtyDaysAgo)
          .get();

        const userData = interactionsSnapshot.docs.map((doc: any) => doc.data());
        if (userData.length > 0) {
          historicalData.push({
            userId: userDoc.id,
            interactions: userData,
            behavior: this.extractBehaviorMetrics(userData)
          });
        }
      }
      
      return historicalData;
    } catch (error) {
      console.error('Error getting historical behavior data:', error);
      return [];
    }
  }

  private async identifyTrendIndicators(recentData: any[], historicalData: any[]): Promise<any[]> {
    const indicators: any[] = [];
    
    // Compare content type preferences
    const recentContentTypes = this.aggregateContentTypes(recentData);
    const historicalContentTypes = this.aggregateContentTypes(historicalData);
    
    for (const [contentType, recentCount] of recentContentTypes.entries()) {
      const historicalCount = historicalContentTypes.get(contentType) || 0;
      const growthRate = historicalCount > 0 ? (recentCount - historicalCount) / historicalCount : 1;
      
      if (Math.abs(growthRate) > 0.2) { // 20% change threshold
        indicators.push({
          type: 'content_preference',
          indicator: contentType,
          growthRate,
          strength: Math.min(Math.abs(growthRate), 1),
          affectedSegments: ['all']
        });
      }
    }
    
    return indicators;
  }

  private async analyzeTrendStrength(indicators: any[]): Promise<EmergingTrend[]> {
    return indicators.map(indicator => ({
      id: `trend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: indicator.type,
      description: `${indicator.indicator} is ${indicator.growthRate > 0 ? 'growing' : 'declining'} by ${Math.abs(indicator.growthRate * 100).toFixed(1)}%`,
      strength: indicator.strength,
      growthRate: indicator.growthRate,
      affectedSegments: indicator.affectedSegments,
      indicators: [indicator.indicator],
      startDate: new Date(),
      isActive: true,
      confidence: 0.8,
      lastUpdated: new Date()
    }));
  }

  private async validateTrendSignificance(trends: EmergingTrend[]): Promise<EmergingTrend[]> {
    return trends.filter(trend => 
      trend.strength > 0.3 && // Minimum strength
      Math.abs(trend.growthRate) > 0.1 && // Minimum growth rate
      trend.confidence > 0.6 // Minimum confidence
    );
  }

  private async performPatternValidation(pattern: any, type: string): Promise<PatternValidation> {
    const validation: PatternValidation = {
      patternId: pattern.id,
      validationType: 'statistical',
      isValid: true,
      confidence: 0.8,
      reasons: [],
      recommendations: [],
      lastValidated: new Date()
    };
    
    // Statistical validation
    if (pattern.userCount < 5) {
      validation.isValid = false;
      validation.reasons.push('Insufficient user count for statistical significance');
      validation.confidence *= 0.5;
    }
    
    // Temporal validation
    if (type === 'learning' && pattern.successRate < 0.6) {
      validation.reasons.push('Low success rate');
      validation.confidence *= 0.8;
    }
    
    // Causal validation
    if (pattern.sequence && pattern.sequence.length < 2) {
      validation.reasons.push('Sequence too short to establish causality');
      validation.confidence *= 0.7;
    }
    
    if (validation.isValid) {
      validation.recommendations.push('Pattern is statistically significant and actionable');
    }
    
    return validation;
  }

  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      return doc.exists ? doc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  private async getUserInteractions(userId: string): Promise<UserInteraction[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .orderBy('timestamp', 'desc')
        .limit(50)
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

  private async getRelevantLearningPatterns(userProfile: UserProfile): Promise<LearningPathPattern[]> {
    try {
      const snapshot = await this.db
        .collection('learning_path_patterns')
        .where('difficulty', '==', userProfile.userSegment)
        .where('confidence', '>=', 0.6)
        .limit(5)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting relevant learning patterns:', error);
      return [];
    }
  }

  private async getRelevantEngagementPatterns(userProfile: UserProfile): Promise<EngagementPattern[]> {
    try {
      const snapshot = await this.db
        .collection('engagement_patterns')
        .where('confidence', '>=', 0.6)
        .limit(3)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting relevant engagement patterns:', error);
      return [];
    }
  }

  private getNextCardsInPattern(pattern: LearningPathPattern, userProfile: UserProfile): string[] {
    // Find the next cards in the pattern that the user hasn't completed
    const completedLessons = userProfile.learningProgress.completedLessons;
    const nextCards: string[] = [];
    
    for (let i = 0; i < pattern.sequence.length; i++) {
      const cardId = pattern.sequence[i];
      if (!completedLessons.includes(cardId)) {
        nextCards.push(cardId);
        if (nextCards.length >= 3) break; // Limit to 3 recommendations
      }
    }
    
    return nextCards;
  }

  private getOptimalContentForPattern(pattern: EngagementPattern, userProfile: UserProfile): string[] {
    // Return content that matches the optimal pattern
    return pattern.contentSequence.slice(0, 2); // Limit to 2 recommendations
  }

  // Utility methods
  private generateSequenceKey(sequence: string[]): string {
    return sequence.slice(0, 3).join('->'); // Use first 3 items as key
  }

  private determineDifficulty(sequence: string[]): 'beginner' | 'intermediate' | 'advanced' {
    // Simple heuristic based on sequence length and content types
    if (sequence.length <= 3) return 'beginner';
    if (sequence.length <= 6) return 'intermediate';
    return 'advanced';
  }

  private extractPrerequisites(sequence: string[]): string[] {
    // Extract prerequisites from sequence
    return sequence.slice(0, -1); // All but last item
  }

  private extractOutcomes(sequence: string[]): string[] {
    // Extract outcomes from sequence
    return sequence.slice(-1); // Last item
  }

  private extractTags(sequence: string[]): string[] {
    // Extract tags based on content types
    const tags = new Set<string>();
    sequence.forEach(item => {
      if (item.startsWith('lesson')) tags.add('learning');
      if (item.startsWith('stock')) tags.add('investment');
      if (item.startsWith('news')) tags.add('market');
    });
    return Array.from(tags);
  }

  private extractSector(item: string): string {
    // Mock sector extraction
    if (item.includes('tech')) return 'technology';
    if (item.includes('finance')) return 'finance';
    if (item.includes('health')) return 'healthcare';
    return 'general';
  }

  private groupByTiming(data: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    data.forEach(item => {
      const key = `${item.timeOfDay}_${item.dayOfWeek}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    return groups;
  }

  private groupBySequence(data: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    data.forEach(item => {
      const key = item.contentSequence.join('->');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    return groups;
  }

  private groupByContentMix(data: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    data.forEach(item => {
      const contentTypes = new Set(item.contentSequence.map((item: string) => item.split('_')[0]));
      const key = Array.from(contentTypes).sort().join('+');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });
    
    return groups;
  }

  private extractBehaviorMetrics(interactions: any[]): any {
    const contentTypes = new Map<string, number>();
    const actions = new Map<string, number>();
    
    interactions.forEach(interaction => {
      contentTypes.set(interaction.cardType, (contentTypes.get(interaction.cardType) || 0) + 1);
      actions.set(interaction.action, (actions.get(interaction.action) || 0) + 1);
    });
    
    return {
      contentTypes: Object.fromEntries(contentTypes),
      actions: Object.fromEntries(actions),
      totalInteractions: interactions.length
    };
  }

  private aggregateContentTypes(data: any[]): Map<string, number> {
    const aggregated = new Map<string, number>();
    
    data.forEach(userData => {
      const behavior = userData.behavior;
      if (behavior && behavior.contentTypes) {
        Object.entries(behavior.contentTypes).forEach(([type, count]) => {
          aggregated.set(type, (aggregated.get(type) || 0) + (count as number));
        });
      }
    });
    
    return aggregated;
  }

  // Storage methods
  private async storeLearningPathPatterns(patterns: LearningPathPattern[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const pattern of patterns) {
        const patternRef = this.db.collection('learning_path_patterns').doc(pattern.id);
        batch.set(patternRef, pattern);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing learning path patterns:', error);
    }
  }

  private async storeInvestmentBehaviorPatterns(patterns: InvestmentBehaviorPattern[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const pattern of patterns) {
        const patternRef = this.db.collection('investment_behavior_patterns').doc(pattern.id);
        batch.set(patternRef, pattern);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing investment behavior patterns:', error);
    }
  }

  private async storeEngagementPatterns(patterns: EngagementPattern[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const pattern of patterns) {
        const patternRef = this.db.collection('engagement_patterns').doc(pattern.id);
        batch.set(patternRef, pattern);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing engagement patterns:', error);
    }
  }

  private async storeEmergingTrends(trends: EmergingTrend[]): Promise<void> {
    try {
      const batch = this.db.batch();
      
      for (const trend of trends) {
        const trendRef = this.db.collection('emerging_trends').doc(trend.id);
        batch.set(trendRef, trend);
      }
      
      await batch.commit();
    } catch (error) {
      console.error('Error storing emerging trends:', error);
    }
  }
}

// Export singleton instance
export const patternRecognitionEngine = new PatternRecognitionEngine();
