// Preference analysis service for processing user interaction data
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
  console.log('🔄 Using dummy Firebase services for PreferenceAnalyzer (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for PreferenceAnalyzer');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for PreferenceAnalyzer, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Import types from EngagementTracker
import { 
  UserInteraction, 
  UserPreferences, 
  CardType, 
  InteractionAction,
  TimeOfDay,
  DayOfWeek 
} from './EngagementTracker';

// Types for preference analysis
export interface ContentTypePreference {
  type: CardType;
  score: number; // 0-1 preference score
  interactions: number;
  positiveInteractions: number;
  negativeInteractions: number;
}

export interface DifficultyPreference {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  score: number;
  completionRate: number;
  averageTimeSpent: number;
}

export interface SectorPreference {
  sector: string;
  score: number;
  interactions: number;
  saves: number;
  shares: number;
}

export interface EngagementPattern {
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  averageSessionLength: number;
  interactionCount: number;
  engagementScore: number;
}

export interface PreferenceAnalysisResult {
  contentTypePreferences: ContentTypePreference[];
  difficultyPreference: DifficultyPreference | null;
  sectorPreferences: SectorPreference[];
  engagementPatterns: EngagementPattern[];
  overallConfidence: number;
  totalInteractions: number;
  analysisDate: Date;
}

// Preference Analyzer Service
export class PreferenceAnalyzer {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Analyze user's favorite content types based on swipe patterns
  async analyzeFavoriteContentTypes(userId: string, daysBack: number = 30): Promise<ContentTypePreference[]> {
    try {
      const interactions = await this.getRecentInteractions(userId, daysBack);
      
      // Group interactions by content type
      const typeStats = new Map<CardType, {
        total: number;
        positive: number;
        negative: number;
      }>();

      interactions.forEach(interaction => {
        const current = typeStats.get(interaction.cardType) || { total: 0, positive: 0, negative: 0 };
        current.total++;
        
        if (interaction.action === 'swipe_right' || interaction.action === 'save' || interaction.action === 'share') {
          current.positive++;
        } else if (interaction.action === 'swipe_left') {
          current.negative++;
        }
        
        typeStats.set(interaction.cardType, current);
      });

      // Calculate preference scores
      const preferences: ContentTypePreference[] = [];
      typeStats.forEach((stats, type) => {
        const score = stats.total > 0 ? stats.positive / stats.total : 0;
        preferences.push({
          type,
          score,
          interactions: stats.total,
          positiveInteractions: stats.positive,
          negativeInteractions: stats.negative
        });
      });

      // Sort by score descending
      return preferences.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error analyzing favorite content types:', error);
      return [];
    }
  }

  // Analyze preferred difficulty based on lesson interactions
  async analyzePreferredDifficulty(userId: string, daysBack: number = 30): Promise<DifficultyPreference | null> {
    try {
      const interactions = await this.getRecentInteractions(userId, daysBack);
      const lessonInteractions = interactions.filter(i => i.cardType === 'lesson');

      if (lessonInteractions.length === 0) {
        return null;
      }

      // Group by difficulty (we'll need to fetch lesson metadata)
      const difficultyStats = new Map<string, {
        total: number;
        completed: number;
        totalTimeSpent: number;
        interactions: number;
      }>();

      for (const interaction of lessonInteractions) {
        // For now, we'll use a simple heuristic based on interaction patterns
        // In a real implementation, you'd fetch the actual lesson difficulty from the card data
        const difficulty = this.inferDifficultyFromInteraction(interaction);
        
        const current = difficultyStats.get(difficulty) || {
          total: 0,
          completed: 0,
          totalTimeSpent: 0,
          interactions: 0
        };

        current.interactions++;
        current.totalTimeSpent += interaction.context.timeSpent || 0;

        if (interaction.action === 'complete') {
          current.completed++;
        }

        difficultyStats.set(difficulty, current);
      }

      // Calculate preference scores
      const preferences: DifficultyPreference[] = [];
      difficultyStats.forEach((stats, difficulty) => {
        const completionRate = stats.interactions > 0 ? stats.completed / stats.interactions : 0;
        const averageTimeSpent = stats.interactions > 0 ? stats.totalTimeSpent / stats.interactions : 0;
        
        // Score based on completion rate and engagement time
        const score = (completionRate * 0.7) + (Math.min(averageTimeSpent / 60000, 1) * 0.3); // 1 minute = max time score

        preferences.push({
          difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
          score,
          completionRate,
          averageTimeSpent
        });
      });

      // Return the highest scoring difficulty
      return preferences.sort((a, b) => b.score - a.score)[0] || null;
    } catch (error) {
      console.error('Error analyzing preferred difficulty:', error);
      return null;
    }
  }

  // Analyze preferred sectors based on stock saves and interactions
  async analyzePreferredSectors(userId: string, daysBack: number = 30): Promise<SectorPreference[]> {
    try {
      const interactions = await this.getRecentInteractions(userId, daysBack);
      const stockInteractions = interactions.filter(i => i.cardType === 'stock' || i.cardType === 'crypto');

      if (stockInteractions.length === 0) {
        return [];
      }

      // Group by sector (we'll need to fetch sector data from cards)
      const sectorStats = new Map<string, {
        interactions: number;
        saves: number;
        shares: number;
        positiveInteractions: number;
      }>();

      for (const interaction of stockInteractions) {
        // For now, we'll use a simple heuristic
        // In a real implementation, you'd fetch the actual sector from the card metadata
        const sector = this.inferSectorFromInteraction(interaction);
        
        const current = sectorStats.get(sector) || {
          interactions: 0,
          saves: 0,
          shares: 0,
          positiveInteractions: 0
        };

        current.interactions++;

        if (interaction.action === 'save') {
          current.saves++;
        } else if (interaction.action === 'share') {
          current.shares++;
        }

        if (interaction.action === 'swipe_right' || interaction.action === 'save' || interaction.action === 'share') {
          current.positiveInteractions++;
        }

        sectorStats.set(sector, current);
      }

      // Calculate preference scores
      const preferences: SectorPreference[] = [];
      sectorStats.forEach((stats, sector) => {
        const score = stats.interactions > 0 ? stats.positiveInteractions / stats.interactions : 0;
        
        preferences.push({
          sector,
          score,
          interactions: stats.interactions,
          saves: stats.saves,
          shares: stats.shares
        });
      });

      // Sort by score descending
      return preferences.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error analyzing preferred sectors:', error);
      return [];
    }
  }

  // Analyze engagement patterns to find optimal times and session lengths
  async analyzeEngagementPatterns(userId: string, daysBack: number = 30): Promise<EngagementPattern[]> {
    try {
      const interactions = await this.getRecentInteractions(userId, daysBack);
      const sessions = await this.getRecentSessions(userId, daysBack);

      // Group by time of day and day of week
      const patternStats = new Map<string, {
        timeOfDay: TimeOfDay;
        dayOfWeek: DayOfWeek;
        interactionCount: number;
        totalSessionLength: number;
        sessionCount: number;
      }>();

      // Analyze interactions
      interactions.forEach(interaction => {
        const key = `${interaction.context.timeOfDay}_${interaction.context.dayOfWeek}`;
        const current = patternStats.get(key) || {
          timeOfDay: interaction.context.timeOfDay,
          dayOfWeek: interaction.context.dayOfWeek,
          interactionCount: 0,
          totalSessionLength: 0,
          sessionCount: 0
        };

        current.interactionCount++;
        patternStats.set(key, current);
      });

      // Analyze sessions
      sessions.forEach(session => {
        if (session.duration) {
          const sessionStart = new Date(session.startTime);
          const timeOfDay = this.getTimeOfDayFromHour(sessionStart.getHours());
          const dayOfWeek = this.getDayOfWeekFromDate(sessionStart);
          const key = `${timeOfDay}_${dayOfWeek}`;
          
          const current = patternStats.get(key) || {
            timeOfDay,
            dayOfWeek,
            interactionCount: 0,
            totalSessionLength: 0,
            sessionCount: 0
          };

          current.totalSessionLength += session.duration;
          current.sessionCount++;
          patternStats.set(key, current);
        }
      });

      // Calculate engagement patterns
      const patterns: EngagementPattern[] = [];
      patternStats.forEach((stats, key) => {
        const averageSessionLength = stats.sessionCount > 0 ? stats.totalSessionLength / stats.sessionCount : 0;
        const engagementScore = (stats.interactionCount * 0.6) + (averageSessionLength / 300000 * 0.4); // 5 minutes = max session score

        patterns.push({
          timeOfDay: stats.timeOfDay,
          dayOfWeek: stats.dayOfWeek,
          averageSessionLength,
          interactionCount: stats.interactionCount,
          engagementScore
        });
      });

      // Sort by engagement score descending
      return patterns.sort((a, b) => b.engagementScore - a.engagementScore);
    } catch (error) {
      console.error('Error analyzing engagement patterns:', error);
      return [];
    }
  }

  // Calculate preference scores for different content categories
  calculatePreferenceScores(analysisResult: PreferenceAnalysisResult): Map<string, number> {
    const scores = new Map<string, number>();

    // Content type scores
    analysisResult.contentTypePreferences.forEach(pref => {
      scores.set(`content_${pref.type}`, pref.score);
    });

    // Difficulty score
    if (analysisResult.difficultyPreference) {
      scores.set('difficulty', analysisResult.difficultyPreference.score);
    }

    // Sector scores
    analysisResult.sectorPreferences.forEach(pref => {
      scores.set(`sector_${pref.sector}`, pref.score);
    });

    // Time-based scores
    analysisResult.engagementPatterns.forEach(pattern => {
      scores.set(`time_${pattern.timeOfDay}`, pattern.engagementScore / 10); // Normalize
      scores.set(`day_${pattern.dayOfWeek}`, pattern.engagementScore / 10); // Normalize
    });

    return scores;
  }

  // Update user preferences based on analysis
  async updateUserPreferences(userId: string, daysBack: number = 30): Promise<UserPreferences> {
    try {
      const contentTypePreferences = await this.analyzeFavoriteContentTypes(userId, daysBack);
      const difficultyPreference = await this.analyzePreferredDifficulty(userId, daysBack);
      const sectorPreferences = await this.analyzePreferredSectors(userId, daysBack);
      const engagementPatterns = await this.analyzeEngagementPatterns(userId, daysBack);

      // Calculate overall confidence based on data volume
      const totalInteractions = contentTypePreferences.reduce((sum, pref) => sum + pref.interactions, 0);
      const confidence = Math.min(totalInteractions / 50, 1); // Max confidence at 50 interactions

      // Extract favorite content types (top 3)
      const favoriteContentTypes = contentTypePreferences
        .slice(0, 3)
        .filter(pref => pref.score > 0.3) // Only include if score > 30%
        .map(pref => pref.type);

      // Extract preferred sectors (top 5)
      const preferredSectors = sectorPreferences
        .slice(0, 5)
        .filter(pref => pref.score > 0.3)
        .map(pref => pref.sector);

      // Calculate optimal session length
      const optimalSessionLength = engagementPatterns.length > 0 
        ? Math.round(engagementPatterns[0].averageSessionLength / 60000) // Convert to minutes
        : 10; // Default 10 minutes

      // Extract best engagement times
      const bestEngagementTimes = engagementPatterns
        .slice(0, 3)
        .map(pattern => `${pattern.timeOfDay}_${pattern.dayOfWeek}`);

      const preferences: UserPreferences = {
        favoriteContentTypes,
        preferredDifficulty: difficultyPreference?.difficulty || 'beginner',
        preferredSectors,
        optimalSessionLength,
        bestEngagementTimes,
        lastUpdated: this.db.FieldValue.serverTimestamp(),
        interactionCount: totalInteractions,
        confidence
      };

      // Save preferences to Firestore
      await this.db
        .collection('users')
        .doc(userId)
        .collection('preferences')
        .doc('main')
        .set(preferences);

      console.log('📊 User preferences updated:', userId, 'Confidence:', Math.round(confidence * 100) + '%');
      return preferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Get user preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
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

  // Helper methods
  private async getRecentInteractions(userId: string, daysBack: number): Promise<UserInteraction[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .where('timestamp', '>=', cutoffDate)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting recent interactions:', error);
      return [];
    }
  }

  private async getRecentSessions(userId: string, daysBack: number): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .where('startTime', '>=', cutoffDate)
        .orderBy('startTime', 'desc')
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().startTime?.toDate() || new Date(),
        endTime: doc.data().endTime?.toDate()
      }));
    } catch (error) {
      console.error('Error getting recent sessions:', error);
      return [];
    }
  }

  private inferDifficultyFromInteraction(interaction: UserInteraction): string {
    // Simple heuristic based on interaction patterns
    // In a real implementation, you'd fetch this from the card metadata
    if (interaction.context.timeSpent > 300000) { // 5 minutes
      return 'advanced';
    } else if (interaction.context.timeSpent > 120000) { // 2 minutes
      return 'intermediate';
    } else {
      return 'beginner';
    }
  }

  private inferSectorFromInteraction(interaction: UserInteraction): string {
    // Simple heuristic - in a real implementation, you'd fetch this from card metadata
    const sectors = ['technology', 'finance', 'healthcare', 'energy', 'consumer', 'industrial'];
    return sectors[Math.floor(Math.random() * sectors.length)]; // Placeholder
  }

  private getTimeOfDayFromHour(hour: number): TimeOfDay {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  private getDayOfWeekFromDate(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  // Apply preference decay over time
  applyPreferenceDecay(preferences: UserPreferences, daysSinceUpdate: number): UserPreferences {
    const decayFactor = Math.max(0.1, 1 - (daysSinceUpdate / 90)); // Decay over 90 days
    
    return {
      ...preferences,
      confidence: preferences.confidence * decayFactor,
      favoriteContentTypes: preferences.favoriteContentTypes.slice(0, Math.max(1, Math.floor(preferences.favoriteContentTypes.length * decayFactor))),
      preferredSectors: preferences.preferredSectors.slice(0, Math.max(1, Math.floor(preferences.preferredSectors.length * decayFactor)))
    };
  }
}

// Export singleton instance
export const preferenceAnalyzer = new PreferenceAnalyzer();
