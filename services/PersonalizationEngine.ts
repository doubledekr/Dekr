// Comprehensive personalization engine for creating tailored content feeds with community intelligence
import { Platform } from 'react-native';
import { UnifiedCard } from './CardService';
import { UserPreferences, UserInteraction, CardType, InteractionAction } from './EngagementTracker';
import { UserProfile } from './UserProfileService';
import { preferenceAnalyzer } from './PreferenceAnalyzer';
import { userProfileService } from './UserProfileService';
import { engagementTracker } from './EngagementTracker';
import { communityIntelligence } from './CommunityIntelligence';
import { patternRecognitionEngine } from './PatternRecognition';
import { contentCurationService } from './ContentCuration';
import { socialProofService } from './SocialProof';

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
  console.log('🔄 Using dummy Firebase services for PersonalizationEngine (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for PersonalizationEngine');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for PersonalizationEngine, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Types for personalization
export interface PersonalizedCard extends UnifiedCard {
  relevanceScore: number;
  personalizationReason: string;
  confidence: number;
  communityContext?: {
    communityScore: number;
    socialProof: string[];
    similarUsers: number;
    trending: boolean;
  };
}

export interface UserProfile {
  preferences: UserPreferences;
  learningProgress: {
    currentStage: number;
    completedLessons: string[];
    totalTimeSpent: number;
    streakDays: number;
  };
  investmentProfile: {
    savedStocks: string[];
    savedCrypto: string[];
    watchlist: string[];
    riskScore: number;
  };
  engagementMetrics: {
    totalSessions: number;
    averageSessionLength: number;
    totalInteractions: number;
    engagementScore: number;
  };
  userSegment: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface LearningPathRecommendation {
  nextLessons: string[];
  knowledgeGaps: string[];
  skillBuildingSuggestions: string[];
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  learningVelocity: number;
}

export interface InvestmentRecommendation {
  similarStocks: string[];
  relevantNews: string[];
  investmentThemes: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  portfolioSuggestions: string[];
}

export interface ContentOrderingStrategy {
  engagementHistory: boolean;
  recencyBoost: boolean;
  discoveryBalance: boolean;
  sessionOptimization: boolean;
  contextualFactors: boolean;
  serendipityFactor: number; // 0-1
}

export interface PersonalizationMetrics {
  totalRecommendations: number;
  successfulRecommendations: number;
  userSatisfactionScore: number;
  contentDiversityScore: number;
  personalizationAccuracy: number;
  communityInfluenceScore: number;
  socialProofEffectiveness: number;
  lastUpdated: Date;
}

// Learning Path Engine
class LearningPathEngine {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Identify next logical lessons based on completed content
  async identifyNextLogicalLessons(userId: string): Promise<string[]> {
    try {
      const profile = await userProfileService.getUserProfile(userId);
      if (!profile) return [];

      const { learningProgress } = profile;
      const completedLessons = learningProgress.completedLessons;
      const currentStage = learningProgress.currentStage;

      // Get available lessons
      const lessonsSnapshot = await this.db
        .collection('cards')
        .where('type', '==', 'lesson')
        .orderBy('metadata.stage', 'asc')
        .get();

      const availableLessons = lessonsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        metadata: doc.data().metadata
      }));

      // Find next lessons based on stage progression
      const nextLessons = availableLessons
        .filter(lesson => {
          const lessonStage = lesson.metadata?.stage || 1;
          const lessonId = lesson.id;
          
          // Skip completed lessons
          if (completedLessons.includes(lessonId)) return false;
          
          // Include lessons at current stage or next stage
          return lessonStage <= currentStage + 1;
        })
        .sort((a, b) => {
          // Prioritize by stage, then by difficulty
          const stageDiff = (a.metadata?.stage || 1) - (b.metadata?.stage || 1);
          if (stageDiff !== 0) return stageDiff;
          
          const difficultyOrder = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
          return difficultyOrder[a.metadata?.difficulty || 'beginner'] - 
                 difficultyOrder[b.metadata?.difficulty || 'beginner'];
        })
        .slice(0, 5)
        .map(lesson => lesson.id);

      return nextLessons;
    } catch (error) {
      console.error('Error identifying next logical lessons:', error);
      return [];
    }
  }

  // Calculate knowledge gaps based on lesson completion patterns
  async calculateKnowledgeGaps(userId: string): Promise<string[]> {
    try {
      const profile = await userProfileService.getUserProfile(userId);
      if (!profile) return [];

      const { learningProgress } = profile;
      const completedLessons = learningProgress.completedLessons;

      // Get all lessons grouped by topic/category
      const lessonsSnapshot = await this.db
        .collection('cards')
        .where('type', '==', 'lesson')
        .get();

      const lessonsByTopic = new Map<string, any[]>();
      lessonsSnapshot.docs.forEach((doc: any) => {
        const lesson = { id: doc.id, ...doc.data() };
        const topic = lesson.tags?.[0] || 'general';
        
        if (!lessonsByTopic.has(topic)) {
          lessonsByTopic.set(topic, []);
        }
        lessonsByTopic.get(topic)!.push(lesson);
      });

      // Identify gaps in each topic
      const knowledgeGaps: string[] = [];
      lessonsByTopic.forEach((lessons, topic) => {
        const completedInTopic = lessons.filter(lesson => 
          completedLessons.includes(lesson.id)
        );
        
        const completionRate = completedInTopic.length / lessons.length;
        
        // If completion rate is below 50%, it's a knowledge gap
        if (completionRate < 0.5) {
          knowledgeGaps.push(topic);
        }
      });

      return knowledgeGaps;
    } catch (error) {
      console.error('Error calculating knowledge gaps:', error);
      return [];
    }
  }

  // Recommend skill building lessons
  async recommendSkillBuilding(userId: string): Promise<string[]> {
    try {
      const knowledgeGaps = await this.calculateKnowledgeGaps(userId);
      const profile = await userProfileService.getUserProfile(userId);
      
      if (!profile || knowledgeGaps.length === 0) return [];

      // Get lessons for identified knowledge gaps
      const skillBuildingLessons: string[] = [];
      
      for (const gap of knowledgeGaps.slice(0, 3)) { // Focus on top 3 gaps
        const lessonsSnapshot = await this.db
          .collection('cards')
          .where('type', '==', 'lesson')
          .where('tags', 'array-contains', gap)
          .orderBy('metadata.difficulty', 'asc')
          .limit(2)
          .get();

        const lessons = lessonsSnapshot.docs.map((doc: any) => doc.id);
        skillBuildingLessons.push(...lessons);
      }

      return skillBuildingLessons;
    } catch (error) {
      console.error('Error recommending skill building lessons:', error);
      return [];
    }
  }

  // Track learning velocity
  async trackLearningVelocity(userId: string): Promise<number> {
    try {
      const profile = await userProfileService.getUserProfile(userId);
      if (!profile) return 0;

      const { learningProgress } = profile;
      const totalTimeSpent = learningProgress.totalTimeSpent; // in minutes
      const completedLessons = learningProgress.completedLessons.length;

      // Calculate velocity as lessons completed per hour
      const velocity = completedLessons > 0 ? (completedLessons / (totalTimeSpent / 60)) : 0;
      
      return Math.min(velocity, 10); // Cap at 10 lessons per hour
    } catch (error) {
      console.error('Error tracking learning velocity:', error);
      return 0;
    }
  }

  // Adapt difficulty level based on user's success rate
  async adaptDifficultyLevel(userId: string): Promise<'beginner' | 'intermediate' | 'advanced'> {
    try {
      const profile = await userProfileService.getUserProfile(userId);
      if (!profile) return 'beginner';

      const { learningProgress } = profile;
      const completedLessons = learningProgress.completedLessons.length;
      const totalTimeSpent = learningProgress.totalTimeSpent;

      // Get recent lesson interactions to calculate success rate
      const recentInteractions = await engagementTracker.getUserInteractions(userId, 50);
      const lessonInteractions = recentInteractions.filter(i => i.cardType === 'lesson');
      
      const completedInteractions = lessonInteractions.filter(i => i.action === 'complete');
      const successRate = lessonInteractions.length > 0 ? 
        completedInteractions.length / lessonInteractions.length : 0;

      // Determine difficulty based on success rate and progress
      if (successRate > 0.8 && completedLessons > 10) {
        return 'advanced';
      } else if (successRate > 0.6 && completedLessons > 5) {
        return 'intermediate';
      } else {
        return 'beginner';
      }
    } catch (error) {
      console.error('Error adapting difficulty level:', error);
      return 'beginner';
    }
  }
}

// Investment Matcher Engine
class InvestmentMatcher {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Analyze portfolio composition
  async analyzePortfolioComposition(userId: string): Promise<{
    stocks: string[];
    crypto: string[];
    sectors: string[];
    riskScore: number;
  }> {
    try {
      const profile = await userProfileService.getUserProfile(userId);
      if (!profile) return { stocks: [], crypto: [], sectors: [], riskScore: 30 };

      const { investmentProfile } = profile;
      const savedStocks = investmentProfile.savedStocks;
      const savedCrypto = investmentProfile.savedCrypto;

      // Get sector information for saved stocks
      const sectors = new Set<string>();
      for (const stockId of savedStocks) {
        try {
          const stockDoc = await this.db.collection('cards').doc(stockId).get();
          if (stockDoc.exists) {
            const sector = stockDoc.data()?.metadata?.sector;
            if (sector) sectors.add(sector);
          }
        } catch (error) {
          console.warn('Error getting stock sector:', error);
        }
      }

      return {
        stocks: savedStocks,
        crypto: savedCrypto,
        sectors: Array.from(sectors),
        riskScore: investmentProfile.riskScore
      };
    } catch (error) {
      console.error('Error analyzing portfolio composition:', error);
      return { stocks: [], crypto: [], sectors: [], riskScore: 30 };
    }
  }

  // Identify investment themes
  async identifyInvestmentThemes(userId: string): Promise<string[]> {
    try {
      const portfolio = await this.analyzePortfolioComposition(userId);
      const themes: string[] = [];

      // Analyze sectors for themes
      if (portfolio.sectors.includes('technology')) themes.push('growth');
      if (portfolio.sectors.includes('utilities')) themes.push('value');
      if (portfolio.sectors.includes('consumer-staples')) themes.push('dividend');
      if (portfolio.crypto.length > 0) themes.push('crypto');
      if (portfolio.riskScore > 70) themes.push('aggressive');
      if (portfolio.riskScore < 40) themes.push('conservative');

      return themes;
    } catch (error) {
      console.error('Error identifying investment themes:', error);
      return [];
    }
  }

  // Recommend similar stocks
  async recommendSimilarStocks(userId: string): Promise<string[]> {
    try {
      const portfolio = await this.analyzePortfolioComposition(userId);
      const themes = await this.identifyInvestmentThemes(userId);
      
      if (portfolio.stocks.length === 0) return [];

      // Get stocks in similar sectors
      const similarStocks: string[] = [];
      for (const sector of portfolio.sectors) {
        const stocksSnapshot = await this.db
          .collection('cards')
          .where('type', '==', 'stock')
          .where('metadata.sector', '==', sector)
          .limit(3)
          .get();

        const stocks = stocksSnapshot.docs
          .map((doc: any) => doc.id)
          .filter(id => !portfolio.stocks.includes(id)); // Exclude already saved stocks

        similarStocks.push(...stocks);
      }

      return similarStocks.slice(0, 5);
    } catch (error) {
      console.error('Error recommending similar stocks:', error);
      return [];
    }
  }

  // Surface relevant news
  async surfaceRelevantNews(userId: string): Promise<string[]> {
    try {
      const portfolio = await this.analyzePortfolioComposition(userId);
      const relevantNews: string[] = [];

      // Get news related to saved stocks
      for (const stockId of portfolio.stocks.slice(0, 3)) { // Limit to top 3 stocks
        try {
          const stockDoc = await this.db.collection('cards').doc(stockId).get();
          if (stockDoc.exists) {
            const symbol = stockDoc.data()?.metadata?.symbol;
            if (symbol) {
              const newsSnapshot = await this.db
                .collection('cards')
                .where('type', '==', 'news')
                .where('tags', 'array-contains', symbol)
                .orderBy('createdAt', 'desc')
                .limit(2)
                .get();

              const news = newsSnapshot.docs.map((doc: any) => doc.id);
              relevantNews.push(...news);
            }
          }
        } catch (error) {
          console.warn('Error getting relevant news:', error);
        }
      }

      // Get news related to sectors
      for (const sector of portfolio.sectors.slice(0, 2)) {
        const newsSnapshot = await this.db
          .collection('cards')
          .where('type', '==', 'news')
          .where('tags', 'array-contains', sector)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        const news = newsSnapshot.docs.map((doc: any) => doc.id);
        relevantNews.push(...news);
      }

      return relevantNews.slice(0, 5);
    } catch (error) {
      console.error('Error surfacing relevant news:', error);
      return [];
    }
  }

  // Track investment behavior
  async trackInvestmentBehavior(userId: string): Promise<{
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    investmentStyle: string;
    sectorDiversification: number;
  }> {
    try {
      const portfolio = await this.analyzePortfolioComposition(userId);
      const themes = await this.identifyInvestmentThemes(userId);

      // Determine risk tolerance
      let riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
      if (portfolio.riskScore > 70) riskTolerance = 'aggressive';
      else if (portfolio.riskScore < 40) riskTolerance = 'conservative';

      // Determine investment style
      let investmentStyle = 'balanced';
      if (themes.includes('growth')) investmentStyle = 'growth';
      else if (themes.includes('value')) investmentStyle = 'value';
      else if (themes.includes('dividend')) investmentStyle = 'income';

      // Calculate sector diversification
      const sectorDiversification = portfolio.sectors.length / 10; // Normalize to 0-1

      return {
        riskTolerance,
        investmentStyle,
        sectorDiversification: Math.min(sectorDiversification, 1)
      };
    } catch (error) {
      console.error('Error tracking investment behavior:', error);
      return {
        riskTolerance: 'moderate',
        investmentStyle: 'balanced',
        sectorDiversification: 0.3
      };
    }
  }
}

// Content Ordering Engine
class ContentOrderingEngine {
  // Prioritize by engagement history
  prioritizeByEngagementHistory(cards: PersonalizedCard[], userId: string): PersonalizedCard[] {
    // This would typically use historical engagement data
    // For now, we'll use a simple scoring system
    return cards.sort((a, b) => {
      // Boost cards that match user's favorite content types
      const scoreA = a.relevanceScore + (a.engagement.views * 0.1);
      const scoreB = b.relevanceScore + (b.engagement.views * 0.1);
      return scoreB - scoreA;
    });
  }

  // Apply recency boost
  applyRecencyBoost(cards: PersonalizedCard[]): PersonalizedCard[] {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    return cards.map(card => {
      const age = now - card.createdAt.getTime();
      const recencyBoost = age < oneDayMs ? 0.2 : age < 7 * oneDayMs ? 0.1 : 0;
      
      return {
        ...card,
        relevanceScore: card.relevanceScore + recencyBoost
      };
    });
  }

  // Balance discovery and relevance
  balanceDiscoveryAndRelevance(cards: PersonalizedCard[], userId: string): PersonalizedCard[] {
    // Sort by relevance but introduce some randomness for discovery
    const sortedCards = cards.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Introduce 20% randomness for discovery
    const discoveryCount = Math.ceil(sortedCards.length * 0.2);
    const discoveryCards = sortedCards.slice(-discoveryCount);
    const mainCards = sortedCards.slice(0, -discoveryCount);
    
    // Shuffle discovery cards and insert them at random positions
    const shuffledDiscovery = this.shuffleArray(discoveryCards);
    const result = [...mainCards];
    
    shuffledDiscovery.forEach((card, index) => {
      const insertPosition = Math.floor(Math.random() * (result.length + 1));
      result.splice(insertPosition, 0, card);
    });
    
    return result;
  }

  // Optimize for session length
  optimizeForSessionLength(cards: PersonalizedCard[], userId: string): PersonalizedCard[] {
    // This would typically use user's average session length
    // For now, we'll prioritize shorter content first
    return cards.sort((a, b) => {
      // Prioritize lessons and news (typically shorter) over podcasts
      const typePriority = { 'lesson': 3, 'news': 2, 'stock': 2, 'crypto': 2, 'podcast': 1, 'challenge': 2 };
      const priorityA = typePriority[a.type] || 1;
      const priorityB = typePriority[b.type] || 1;
      
      if (priorityA !== priorityB) return priorityB - priorityA;
      return b.relevanceScore - a.relevanceScore;
    });
  }

  // Consider contextual factors
  considerContextualFactors(cards: PersonalizedCard[], userId: string): PersonalizedCard[] {
    const currentHour = new Date().getHours();
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    
    return cards.map(card => {
      let contextualBoost = 0;
      
      // Boost podcasts in the morning and evening
      if (card.type === 'podcast' && (currentHour < 9 || currentHour > 18)) {
        contextualBoost += 0.1;
      }
      
      // Boost news during market hours
      if (card.type === 'news' && currentHour >= 9 && currentHour <= 16) {
        contextualBoost += 0.1;
      }
      
      // Boost lessons on weekends
      if (card.type === 'lesson' && isWeekend) {
        contextualBoost += 0.1;
      }
      
      return {
        ...card,
        relevanceScore: card.relevanceScore + contextualBoost
      };
    });
  }

  // Utility method to shuffle array
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Preference Learning Engine
class PreferenceLearningEngine {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Update preferences from interactions
  async updatePreferencesFromInteractions(userId: string): Promise<void> {
    try {
      // Use the existing preference analyzer to update preferences
      await preferenceAnalyzer.updateUserPreferences(userId, 7); // Last 7 days
    } catch (error) {
      console.error('Error updating preferences from interactions:', error);
    }
  }

  // Detect preference changes
  async detectPreferenceChanges(userId: string): Promise<boolean> {
    try {
      const currentPreferences = await preferenceAnalyzer.getUserPreferences(userId);
      if (!currentPreferences) return false;

      // Get recent interactions to detect changes
      const recentInteractions = await engagementTracker.getUserInteractions(userId, 20);
      
      // Analyze recent interaction patterns
      const recentPatterns = this.analyzeInteractionPatterns(recentInteractions);
      const currentPatterns = this.analyzeCurrentPreferences(currentPreferences);
      
      // Compare patterns to detect significant changes
      const hasChanged = this.comparePatterns(recentPatterns, currentPatterns);
      
      return hasChanged;
    } catch (error) {
      console.error('Error detecting preference changes:', error);
      return false;
    }
  }

  // Calculate preference confidence
  async calculatePreferenceConfidence(userId: string): Promise<number> {
    try {
      const preferences = await preferenceAnalyzer.getUserPreferences(userId);
      if (!preferences) return 0;

      // Confidence is based on interaction count and recency
      const daysSinceUpdate = (Date.now() - preferences.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0, 1 - (daysSinceUpdate / 30)); // Decay over 30 days
      
      const interactionFactor = Math.min(preferences.interactionCount / 100, 1); // Max at 100 interactions
      
      return (preferences.confidence * recencyFactor * interactionFactor);
    } catch (error) {
      console.error('Error calculating preference confidence:', error);
      return 0;
    }
  }

  // Handle cold start problem
  async handleColdStartProblem(userId: string): Promise<UserPreferences> {
    try {
      // For new users, provide default preferences based on user segment
      const profile = await userProfileService.getUserProfile(userId);
      const userSegment = profile?.userSegment || 'beginner';
      
      const defaultPreferences: UserPreferences = {
        favoriteContentTypes: this.getDefaultContentTypes(userSegment),
        preferredDifficulty: this.getDefaultDifficulty(userSegment),
        preferredSectors: this.getDefaultSectors(userSegment),
        optimalSessionLength: this.getDefaultSessionLength(userSegment),
        bestEngagementTimes: ['morning', 'evening'],
        lastUpdated: new Date(),
        interactionCount: 0,
        confidence: 0.1 // Low confidence for new users
      };

      return defaultPreferences;
    } catch (error) {
      console.error('Error handling cold start problem:', error);
      return this.getFallbackPreferences();
    }
  }

  // Implement feedback loop
  async implementFeedbackLoop(userId: string, feedback: {
    cardId: string;
    action: InteractionAction;
    rating?: number;
  }): Promise<void> {
    try {
      // Store explicit feedback
      await this.db
        .collection('users')
        .doc(userId)
        .collection('feedback')
        .add({
          ...feedback,
          timestamp: this.db.FieldValue.serverTimestamp()
        });

      // Update preferences based on feedback
      await this.updatePreferencesFromInteractions(userId);
    } catch (error) {
      console.error('Error implementing feedback loop:', error);
    }
  }

  // Helper methods
  private analyzeInteractionPatterns(interactions: UserInteraction[]): Map<string, number> {
    const patterns = new Map<string, number>();
    
    interactions.forEach(interaction => {
      const key = `${interaction.cardType}_${interaction.action}`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    });
    
    return patterns;
  }

  private analyzeCurrentPreferences(preferences: UserPreferences): Map<string, number> {
    const patterns = new Map<string, number>();
    
    preferences.favoriteContentTypes.forEach(type => {
      patterns.set(`${type}_positive`, 1);
    });
    
    return patterns;
  }

  private comparePatterns(recent: Map<string, number>, current: Map<string, number>): boolean {
    // Simple comparison - in a real implementation, you'd use more sophisticated algorithms
    let differences = 0;
    let total = 0;
    
    recent.forEach((value, key) => {
      total++;
      const currentValue = current.get(key) || 0;
      if (Math.abs(value - currentValue) > 0.3) {
        differences++;
      }
    });
    
    return differences / total > 0.3; // 30% threshold for change
  }

  private getDefaultContentTypes(segment: string): string[] {
    const defaults: Record<string, string[]> = {
      beginner: ['lesson', 'news'],
      intermediate: ['lesson', 'stock', 'news'],
      advanced: ['stock', 'news', 'challenge'],
      expert: ['stock', 'crypto', 'challenge']
    };
    return defaults[segment] || ['lesson', 'news'];
  }

  private getDefaultDifficulty(segment: string): 'beginner' | 'intermediate' | 'advanced' {
    const defaults: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
      beginner: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced',
      expert: 'advanced'
    };
    return defaults[segment] || 'beginner';
  }

  private getDefaultSectors(segment: string): string[] {
    const defaults: Record<string, string[]> = {
      beginner: ['technology'],
      intermediate: ['technology', 'finance'],
      advanced: ['technology', 'finance', 'healthcare'],
      expert: ['technology', 'finance', 'healthcare', 'energy']
    };
    return defaults[segment] || ['technology'];
  }

  private getDefaultSessionLength(segment: string): number {
    const defaults: Record<string, number> = {
      beginner: 10,
      intermediate: 15,
      advanced: 20,
      expert: 25
    };
    return defaults[segment] || 10;
  }

  private getFallbackPreferences(): UserPreferences {
    return {
      favoriteContentTypes: ['lesson', 'news'],
      preferredDifficulty: 'beginner',
      preferredSectors: ['technology'],
      optimalSessionLength: 10,
      bestEngagementTimes: ['morning', 'evening'],
      lastUpdated: new Date(),
      interactionCount: 0,
      confidence: 0.1
    };
  }
}

// Community-Enhanced Personalization Engine
export class PersonalizationEngine {
  private db: any;
  private learningPathEngine: LearningPathEngine;
  private investmentMatcher: InvestmentMatcher;
  private contentOrderingEngine: ContentOrderingEngine;
  private preferenceLearningEngine: PreferenceLearningEngine;

  constructor() {
    this.db = firestore();
    this.learningPathEngine = new LearningPathEngine(this.db);
    this.investmentMatcher = new InvestmentMatcher(this.db);
    this.contentOrderingEngine = new ContentOrderingEngine();
    this.preferenceLearningEngine = new PreferenceLearningEngine(this.db);
  }

  // Generate personalized feed with community intelligence
  async generatePersonalizedFeed(userId: string, limit: number = 20): Promise<PersonalizedCard[]> {
    try {
      console.log('🎯 Generating personalized feed with community intelligence for user:', userId);

      // Get user profile and preferences
      const [profile, preferences] = await Promise.all([
        userProfileService.getUserProfile(userId),
        preferenceAnalyzer.getUserPreferences(userId)
      ]);

      if (!profile || !preferences || preferences.confidence < 0.3) {
        console.log('📊 Low confidence preferences, using fallback feed');
        return this.getFallbackFeed(userId, limit);
      }

      // Get base cards
      const baseCards = await this.getBaseCards(limit * 2); // Get more cards for filtering
      
      // Apply personalization logic
      const personalizedCards = await this.applyPersonalizationLogic(
        baseCards, 
        profile, 
        preferences, 
        userId
      );

      // Apply community intelligence
      const communityEnhancedCards = await this.applyCommunityIntelligence(
        personalizedCards,
        userId,
        profile
      );

      // Apply content ordering
      const orderedCards = this.applyContentOrdering(communityEnhancedCards, userId);

      // Balance content types
      const balancedCards = this.balanceContentTypes(orderedCards, preferences);

      console.log('🎯 Generated personalized feed with community intelligence:', balancedCards.length, 'cards');
      return balancedCards.slice(0, limit);
    } catch (error) {
      console.error('Error generating personalized feed:', error);
      return this.getFallbackFeed(userId, limit);
    }
  }

  // Calculate content relevance score
  async calculateContentRelevanceScore(card: UnifiedCard, userProfile: UserProfile): Promise<{
    score: number;
    reason: string;
    confidence: number;
  }> {
    try {
      let score = card.priority / 100; // Base score from card priority
      let reasons: string[] = [];
      let confidence = 0.5;

      // Content type preference
      if (userProfile.preferences.favoriteContentTypes.includes(card.type)) {
        score += 0.3;
        reasons.push(`Matches your favorite content type: ${card.type}`);
        confidence += 0.1;
      }

      // Difficulty preference for lessons
      if (card.type === 'lesson' && card.metadata.difficulty === userProfile.preferences.preferredDifficulty) {
        score += 0.2;
        reasons.push(`Matches your preferred difficulty: ${card.metadata.difficulty}`);
        confidence += 0.1;
      }

      // Sector preference for stocks
      if ((card.type === 'stock' || card.type === 'crypto') && 
          card.metadata.sector && 
          userProfile.preferences.preferredSectors.includes(card.metadata.sector)) {
        score += 0.2;
        reasons.push(`Matches your preferred sector: ${card.metadata.sector}`);
        confidence += 0.1;
      }

      // Learning path logic
      if (card.type === 'lesson') {
        const nextLessons = await this.learningPathEngine.identifyNextLogicalLessons(userProfile.id);
        if (nextLessons.includes(card.id)) {
          score += 0.25;
          reasons.push('Recommended for your learning path');
          confidence += 0.1;
        }
      }

      // Investment matching
      if (card.type === 'stock' || card.type === 'crypto') {
        const portfolio = await this.investmentMatcher.analyzePortfolioComposition(userProfile.id);
        if (portfolio.stocks.includes(card.id) || portfolio.crypto.includes(card.id)) {
          score += 0.3;
          reasons.push('Matches your portfolio');
          confidence += 0.1;
        }
      }

      // Time-based optimization
      const currentHour = new Date().getHours();
      const isOptimalTime = userProfile.preferences.bestEngagementTimes.some(time => {
        const timeMap: Record<string, number[]> = {
          'morning': [6, 7, 8, 9, 10, 11],
          'afternoon': [12, 13, 14, 15, 16],
          'evening': [17, 18, 19, 20, 21],
          'night': [22, 23, 0, 1, 2, 3, 4, 5]
        };
        return timeMap[time]?.includes(currentHour) || false;
      });

      if (isOptimalTime) {
        score += 0.1;
        reasons.push('Optimal engagement time');
        confidence += 0.05;
      }

      // Cap score at 1.0
      score = Math.min(score, 1.0);
      confidence = Math.min(confidence, 1.0);

      return {
        score,
        reason: reasons.join(', ') || 'General recommendation',
        confidence
      };
    } catch (error) {
      console.error('Error calculating content relevance score:', error);
      return {
        score: card.priority / 100,
        reason: 'General recommendation',
        confidence: 0.3
      };
    }
  }

  // Apply learning path logic
  async applyLearningPathLogic(userId: string, cards: UnifiedCard[]): Promise<UnifiedCard[]> {
    try {
      const nextLessons = await this.learningPathEngine.identifyNextLogicalLessons(userId);
      const skillBuildingLessons = await this.learningPathEngine.recommendSkillBuilding(userId);
      
      // Boost priority for recommended lessons
      return cards.map(card => {
        if (card.type === 'lesson') {
          if (nextLessons.includes(card.id)) {
            return { ...card, priority: Math.min(card.priority + 20, 100) };
          }
          if (skillBuildingLessons.includes(card.id)) {
            return { ...card, priority: Math.min(card.priority + 15, 100) };
          }
        }
        return card;
      });
    } catch (error) {
      console.error('Error applying learning path logic:', error);
      return cards;
    }
  }

  // Apply investment matching
  async applyInvestmentMatching(userId: string, cards: UnifiedCard[]): Promise<UnifiedCard[]> {
    try {
      const similarStocks = await this.investmentMatcher.recommendSimilarStocks(userId);
      const relevantNews = await this.investmentMatcher.surfaceRelevantNews(userId);
      
      // Boost priority for investment-related content
      return cards.map(card => {
        if (card.type === 'stock' && similarStocks.includes(card.id)) {
          return { ...card, priority: Math.min(card.priority + 15, 100) };
        }
        if (card.type === 'news' && relevantNews.includes(card.id)) {
          return { ...card, priority: Math.min(card.priority + 10, 100) };
        }
        return card;
      });
    } catch (error) {
      console.error('Error applying investment matching:', error);
      return cards;
    }
  }

  // Apply time-based optimization
  async applyTimeBasedOptimization(userId: string, cards: UnifiedCard[]): Promise<UnifiedCard[]> {
    try {
      const preferences = await preferenceAnalyzer.getUserPreferences(userId);
      if (!preferences) return cards;

      const currentHour = new Date().getHours();
      const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
      
      return cards.map(card => {
        let timeBoost = 0;
        
        // Boost podcasts in morning/evening
        if (card.type === 'podcast' && (currentHour < 9 || currentHour > 18)) {
          timeBoost += 10;
        }
        
        // Boost news during market hours
        if (card.type === 'news' && currentHour >= 9 && currentHour <= 16) {
          timeBoost += 10;
        }
        
        // Boost lessons on weekends
        if (card.type === 'lesson' && isWeekend) {
          timeBoost += 5;
        }
        
        // Boost based on user's optimal times
        const isOptimalTime = preferences.bestEngagementTimes.some(time => {
          const timeMap: Record<string, number[]> = {
            'morning': [6, 7, 8, 9, 10, 11],
            'afternoon': [12, 13, 14, 15, 16],
            'evening': [17, 18, 19, 20, 21],
            'night': [22, 23, 0, 1, 2, 3, 4, 5]
          };
          return timeMap[time]?.includes(currentHour) || false;
        });
        
        if (isOptimalTime) {
          timeBoost += 5;
        }
        
        return { ...card, priority: Math.min(card.priority + timeBoost, 100) };
      });
    } catch (error) {
      console.error('Error applying time-based optimization:', error);
      return cards;
    }
  }

  // Apply community intelligence to personalization
  async applyCommunityIntelligence(
    cards: PersonalizedCard[], 
    userId: string, 
    userProfile: UserProfile
  ): Promise<PersonalizedCard[]> {
    try {
      console.log('🤝 Applying community intelligence to personalization...');
      
      // Get community recommendations
      const communityRecommendations = await communityIntelligence.generateCommunityRecommendations(userId, 10);
      
      // Get pattern-based recommendations
      const patternRecommendations = await patternRecognitionEngine.generatePatternBasedRecommendations(userId, 5);
      
      // Get community favorites
      const communityFavorites = await contentCurationService.surfaceCommunityFavorites(userId, 8);
      
      // Enhance cards with community context
      const enhancedCards = await this.enhanceCardsWithCommunityContext(
        cards,
        communityRecommendations,
        patternRecommendations,
        communityFavorites,
        userId
      );
      
      return enhancedCards;
    } catch (error) {
      console.error('Error applying community intelligence:', error);
      return cards; // Return original cards if community intelligence fails
    }
  }

  // Enhance cards with community context
  private async enhanceCardsWithCommunityContext(
    cards: PersonalizedCard[],
    communityRecommendations: any[],
    patternRecommendations: any[],
    communityFavorites: any[],
    userId: string
  ): Promise<PersonalizedCard[]> {
    const enhancedCards: PersonalizedCard[] = [];
    
    for (const card of cards) {
      let communityScore = 0;
      const socialProof: string[] = [];
      let similarUsers = 0;
      let trending = false;
      
      // Check community recommendations
      const communityRec = communityRecommendations.find(rec => rec.cardId === card.id);
      if (communityRec) {
        communityScore += communityRec.personalizationScore * 0.3;
        socialProof.push(`Popular among similar users (${communityRec.communityContext.similarUsers} users)`);
        similarUsers = communityRec.communityContext.similarUsers;
        trending = communityRec.communityContext.trending;
      }
      
      // Check pattern recommendations
      const patternRec = patternRecommendations.find(rec => rec.cardId === card.id);
      if (patternRec) {
        communityScore += patternRec.confidence * 0.2;
        socialProof.push(`Recommended by learning patterns: ${patternRec.reason}`);
      }
      
      // Check community favorites
      const communityFav = communityFavorites.find(fav => fav.cardId === card.id);
      if (communityFav) {
        communityScore += communityFav.score * 0.2;
        socialProof.push(`Community favorite: ${communityFav.reason}`);
      }
      
      // Get social proof indicators
      const socialProofIndicators = await socialProofService.generateSocialProofIndicators(card.id, userId);
      for (const indicator of socialProofIndicators) {
        communityScore += indicator.value * 0.1;
        socialProof.push(indicator.label);
      }
      
      // Apply community boost to relevance score
      const communityBoost = Math.min(communityScore, 0.3); // Cap at 30% boost
      const enhancedRelevanceScore = Math.min(card.relevanceScore + communityBoost, 1.0);
      
      enhancedCards.push({
        ...card,
        relevanceScore: enhancedRelevanceScore,
        personalizationReason: card.personalizationReason + 
          (socialProof.length > 0 ? ` | Community: ${socialProof.slice(0, 2).join(', ')}` : ''),
        communityContext: {
          communityScore,
          socialProof,
          similarUsers,
          trending
        }
      });
    }
    
    return enhancedCards;
  }

  // Balance personal and community recommendations
  async balancePersonalAndCommunityRecommendations(
    personalCards: PersonalizedCard[],
    communityCards: PersonalizedCard[],
    userPreferences: UserPreferences
  ): Promise<PersonalizedCard[]> {
    const balancedCards: PersonalizedCard[] = [];
    
    // 70% personal recommendations, 30% community recommendations
    const personalCount = Math.ceil(personalCards.length * 0.7);
    const communityCount = Math.ceil(communityCards.length * 0.3);
    
    // Add personal recommendations
    balancedCards.push(...personalCards.slice(0, personalCount));
    
    // Add community recommendations (avoid duplicates)
    const personalCardIds = new Set(personalCards.slice(0, personalCount).map(c => c.id));
    const uniqueCommunityCards = communityCards.filter(c => !personalCardIds.has(c.id));
    balancedCards.push(...uniqueCommunityCards.slice(0, communityCount));
    
    return balancedCards;
  }

  // Provide community context for recommendations
  async provideCommunityContext(cardId: string, userId: string): Promise<{
    communityEndorsements: string[];
    similarUserActivity: string[];
    socialProof: string[];
  }> {
    try {
      // Get community endorsements
      const endorsements = await socialProofService.provideCommunityEndorsements(cardId, userId);
      const communityEndorsements = endorsements.map(e => e.endorsementReason);
      
      // Get similar user activity
      const similarActivity = await socialProofService.showSimilarUserActivity(cardId, userId);
      const similarUserActivity = similarActivity.map(a => 
        `${a.similarUserCount} similar users ${a.activityType} this ${a.timeFrame}`
      );
      
      // Get social proof indicators
      const socialProofIndicators = await socialProofService.generateSocialProofIndicators(cardId, userId);
      const socialProof = socialProofIndicators.map(i => i.label);
      
      return {
        communityEndorsements,
        similarUserActivity,
        socialProof
      };
    } catch (error) {
      console.error('Error providing community context:', error);
      return {
        communityEndorsements: [],
        similarUserActivity: [],
        socialProof: []
      };
    }
  }

  // Allow community discovery
  async allowCommunityDiscovery(userId: string, limit: number = 5): Promise<PersonalizedCard[]> {
    try {
      // Get trending content from community
      const trendingContent = await contentCurationService.rankContentByCommunityEngagement(limit * 2);
      
      // Get user's interaction history to avoid duplicates
      const userInteractions = await engagementTracker.getUserInteractions(userId, 100);
      const userCardIds = new Set(userInteractions.map(i => i.cardId));
      
      // Filter out content user has already seen
      const newTrendingContent = trendingContent.filter(ranking => !userCardIds.has(ranking.cardId));
      
      // Convert to PersonalizedCard format
      const discoveryCards: PersonalizedCard[] = [];
      for (const ranking of newTrendingContent.slice(0, limit)) {
        const card = await this.getCardDetails(ranking.cardId);
        if (card) {
          discoveryCards.push({
            ...card,
            relevanceScore: ranking.score,
            personalizationReason: `Community discovery: ${ranking.reason}`,
            confidence: 0.7,
            communityContext: {
              communityScore: ranking.score,
              socialProof: [ranking.reason],
              similarUsers: 0,
              trending: ranking.trending
            }
          });
        }
      }
      
      return discoveryCards;
    } catch (error) {
      console.error('Error allowing community discovery:', error);
      return [];
    }
  }

  // Include community validation
  async includeCommunityValidation(cardId: string, userId: string): Promise<{
    isValidated: boolean;
    validationSources: string[];
    confidence: number;
  }> {
    try {
      // Get expert validations
      const expertValidations = await socialProofService.includeExpertValidation(cardId);
      
      // Get community quality score
      const qualityScore = await socialProofService.generateCommunityQualityScoring(cardId);
      
      // Get social proof context
      const socialProofContext = await socialProofService.generateSocialProofContext(cardId, userId);
      
      const validationSources: string[] = [];
      let confidence = 0;
      
      if (expertValidations.length > 0) {
        validationSources.push(`${expertValidations.length} expert validation(s)`);
        confidence += 0.4;
      }
      
      if (qualityScore.overallScore > 0.7) {
        validationSources.push(`High community quality score (${Math.round(qualityScore.overallScore * 100)}%)`);
        confidence += 0.3;
      }
      
      if (socialProofContext.trustSignals.length > 0) {
        validationSources.push(...socialProofContext.trustSignals);
        confidence += 0.2;
      }
      
      return {
        isValidated: validationSources.length > 0,
        validationSources,
        confidence: Math.min(confidence, 1)
      };
    } catch (error) {
      console.error('Error including community validation:', error);
      return {
        isValidated: false,
        validationSources: [],
        confidence: 0
      };
    }
  }

  // Handle community vs personal conflicts
  async handleCommunityVsPersonalConflicts(
    personalRecommendations: PersonalizedCard[],
    communityRecommendations: PersonalizedCard[],
    userId: string
  ): Promise<PersonalizedCard[]> {
    try {
      const resolvedCards: PersonalizedCard[] = [];
      const personalCardIds = new Set(personalRecommendations.map(c => c.id));
      
      // Add all personal recommendations first
      resolvedCards.push(...personalRecommendations);
      
      // Add community recommendations that don't conflict
      for (const communityCard of communityRecommendations) {
        if (!personalCardIds.has(communityCard.id)) {
          // Check if community recommendation conflicts with personal preferences
          const userProfile = await userProfileService.getUserProfile(userId);
          if (userProfile) {
            const personalScore = await this.calculateContentRelevanceScore(communityCard, userProfile);
            const communityScore = communityCard.communityContext?.communityScore || 0;
            
            // If community score is significantly higher, include it
            if (communityScore > personalScore.score + 0.2) {
              resolvedCards.push({
                ...communityCard,
                personalizationReason: `Community recommendation overrides personal preference: ${communityCard.personalizationReason}`,
                relevanceScore: Math.max(personalScore.score, communityScore)
              });
            }
          }
        }
      }
      
      return resolvedCards;
    } catch (error) {
      console.error('Error handling community vs personal conflicts:', error);
      return personalRecommendations; // Fallback to personal recommendations
    }
  }

  // Balance content types
  balanceContentTypes(cards: PersonalizedCard[], userPreferences: UserPreferences): PersonalizedCard[] {
    const targetDistribution = this.calculateTargetDistribution(userPreferences, cards.length);
    const currentDistribution = this.calculateCurrentDistribution(cards);
    
    const balancedCards: PersonalizedCard[] = [];
    const cardsByType = this.groupCardsByType(cards);
    
    // Ensure minimum representation of each type
    Object.entries(targetDistribution).forEach(([type, targetCount]) => {
      const availableCards = cardsByType[type] || [];
      const currentCount = currentDistribution[type] || 0;
      
      if (currentCount < targetCount && availableCards.length > 0) {
        const needed = Math.min(targetCount - currentCount, availableCards.length);
        balancedCards.push(...availableCards.slice(0, needed));
      }
    });
    
    // Add remaining cards to fill the feed
    const remainingCards = cards.filter(card => !balancedCards.includes(card));
    balancedCards.push(...remainingCards);
    
    return balancedCards;
  }

  // Helper methods
  private async getBaseCards(limit: number): Promise<UnifiedCard[]> {
    try {
      const snapshot = await this.db
        .collection('cards')
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        metadata: {
          ...doc.data().metadata,
          endDate: doc.data().metadata?.endDate?.toDate(),
        },
      }));
    } catch (error) {
      console.error('Error getting base cards:', error);
      return [];
    }
  }

  private async applyPersonalizationLogic(
    cards: UnifiedCard[], 
    profile: UserProfile, 
    preferences: UserPreferences, 
    userId: string
  ): Promise<PersonalizedCard[]> {
    const personalizedCards: PersonalizedCard[] = [];
    
    for (const card of cards) {
      const relevance = await this.calculateContentRelevanceScore(card, profile);
      
      personalizedCards.push({
        ...card,
        relevanceScore: relevance.score,
        personalizationReason: relevance.reason,
        confidence: relevance.confidence
      });
    }
    
    return personalizedCards.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private applyContentOrdering(cards: PersonalizedCard[], userId: string): PersonalizedCard[] {
    let orderedCards = [...cards];
    
    // Apply various ordering strategies
    orderedCards = this.contentOrderingEngine.prioritizeByEngagementHistory(orderedCards, userId);
    orderedCards = this.contentOrderingEngine.applyRecencyBoost(orderedCards);
    orderedCards = this.contentOrderingEngine.balanceDiscoveryAndRelevance(orderedCards, userId);
    orderedCards = this.contentOrderingEngine.optimizeForSessionLength(orderedCards, userId);
    orderedCards = this.contentOrderingEngine.considerContextualFactors(orderedCards, userId);
    
    return orderedCards;
  }

  private calculateTargetDistribution(preferences: UserPreferences, totalCards: number): Record<string, number> {
    const baseDistribution = {
      lesson: Math.ceil(totalCards * 0.3),
      stock: Math.ceil(totalCards * 0.25),
      news: Math.ceil(totalCards * 0.2),
      podcast: Math.ceil(totalCards * 0.15),
      crypto: Math.ceil(totalCards * 0.05),
      challenge: Math.ceil(totalCards * 0.05)
    };
    
    // Adjust based on preferences
    preferences.favoriteContentTypes.forEach(type => {
      if (baseDistribution[type as keyof typeof baseDistribution]) {
        baseDistribution[type as keyof typeof baseDistribution] = 
          Math.ceil(baseDistribution[type as keyof typeof baseDistribution] * 1.5);
      }
    });
    
    return baseDistribution;
  }

  private calculateCurrentDistribution(cards: PersonalizedCard[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    cards.forEach(card => {
      distribution[card.type] = (distribution[card.type] || 0) + 1;
    });
    return distribution;
  }

  private groupCardsByType(cards: PersonalizedCard[]): Record<string, PersonalizedCard[]> {
    const grouped: Record<string, PersonalizedCard[]> = {};
    cards.forEach(card => {
      if (!grouped[card.type]) {
        grouped[card.type] = [];
      }
      grouped[card.type].push(card);
    });
    return grouped;
  }

  private async getCardDetails(cardId: string): Promise<UnifiedCard | null> {
    try {
      const doc = await this.db.collection('cards').doc(cardId).get();
      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          metadata: {
            ...doc.data().metadata,
            endDate: doc.data().metadata?.endDate?.toDate(),
          },
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting card details:', error);
      return null;
    }
  }

  private async getFallbackFeed(userId: string, limit: number): Promise<PersonalizedCard[]> {
    try {
      const baseCards = await this.getBaseCards(limit);
      return baseCards.map(card => ({
        ...card,
        relevanceScore: card.priority / 100,
        personalizationReason: 'General recommendation',
        confidence: 0.3
      }));
    } catch (error) {
      console.error('Error getting fallback feed:', error);
      return [];
    }
  }
}

// Export singleton instance
export const personalizationEngine = new PersonalizationEngine();
