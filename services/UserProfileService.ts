// User profile service for managing user profiles and preferences
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
  console.log('🔄 Using dummy Firebase services for UserProfileService (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for UserProfileService');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for UserProfileService, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Import types from other services
import { UserPreferences } from './PreferenceAnalyzer';

// Types for user profile
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any; // Firestore timestamp
  lastActiveAt: any; // Firestore timestamp
  onboardingCompleted: boolean;
  preferences: UserPreferences;
  demographics?: {
    age?: number;
    location?: string;
    occupation?: string;
    experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
    investmentGoals?: string[];
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  };
  learningProgress: {
    currentStage: number;
    completedLessons: string[];
    totalTimeSpent: number; // in minutes
    streakDays: number;
    lastLessonDate?: any; // Firestore timestamp
  };
  investmentProfile: {
    portfolioComposition: {
      stocks: number;
      crypto: number;
      bonds: number;
      cash: number;
    };
    savedStocks: string[];
    savedCrypto: string[];
    watchlist: string[];
    totalInvested: number;
    riskScore: number; // 0-100
  };
  engagementMetrics: {
    totalSessions: number;
    averageSessionLength: number; // in minutes
    totalInteractions: number;
    engagementScore: number; // 0-100
    favoriteContentTypes: string[];
    preferredSectors: string[];
    optimalSessionTimes: string[];
  };
  privacySettings: {
    dataSharing: boolean;
    analyticsOptIn: boolean;
    personalizedAds: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  userSegment: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  lastUpdated: any; // Firestore timestamp
}

export interface OnboardingSurvey {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  investmentGoals: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeCommitment: 'low' | 'medium' | 'high';
  interests: string[];
  learningStyle: 'visual' | 'audio' | 'hands-on' | 'mixed';
}

export interface UserSegment {
  segment: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  criteria: {
    minInteractions: number;
    minSessions: number;
    minTimeSpent: number;
    completionRate: number;
  };
  characteristics: string[];
  recommendations: string[];
}

// User Profile Service
export class UserProfileService {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Create or update user profile
  async createOrUpdateProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const profileRef = this.db.collection('users').doc(userId);
      
      const profile: UserProfile = {
        id: userId,
        email: profileData.email || '',
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
        createdAt: profileData.createdAt || this.db.FieldValue.serverTimestamp(),
        lastActiveAt: this.db.FieldValue.serverTimestamp(),
        onboardingCompleted: profileData.onboardingCompleted || false,
        preferences: profileData.preferences || this.getDefaultPreferences(),
        demographics: profileData.demographics,
        learningProgress: profileData.learningProgress || this.getDefaultLearningProgress(),
        investmentProfile: profileData.investmentProfile || this.getDefaultInvestmentProfile(),
        engagementMetrics: profileData.engagementMetrics || this.getDefaultEngagementMetrics(),
        privacySettings: profileData.privacySettings || this.getDefaultPrivacySettings(),
        userSegment: profileData.userSegment || 'beginner',
        lastUpdated: this.db.FieldValue.serverTimestamp()
      };

      await profileRef.set(profile, { merge: true });
      console.log('📊 User profile created/updated:', userId);
      return profile;
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const doc = await this.db.collection('users').doc(userId).get();
      
      if (doc.exists) {
        return {
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          lastActiveAt: doc.data().lastActiveAt?.toDate() || new Date(),
          lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
        } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user preferences
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        preferences,
        lastUpdated: this.db.FieldValue.serverTimestamp()
      });
      console.log('📊 User preferences updated:', userId);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Update learning progress
  async updateLearningProgress(userId: string, progress: Partial<UserProfile['learningProgress']>): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        'learningProgress': this.db.FieldValue.merge(progress),
        lastUpdated: this.db.FieldValue.serverTimestamp()
      });
      console.log('📊 Learning progress updated:', userId);
    } catch (error) {
      console.error('Error updating learning progress:', error);
      throw error;
    }
  }

  // Update investment profile
  async updateInvestmentProfile(userId: string, investment: Partial<UserProfile['investmentProfile']>): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        'investmentProfile': this.db.FieldValue.merge(investment),
        lastUpdated: this.db.FieldValue.serverTimestamp()
      });
      console.log('📊 Investment profile updated:', userId);
    } catch (error) {
      console.error('Error updating investment profile:', error);
      throw error;
    }
  }

  // Update engagement metrics
  async updateEngagementMetrics(userId: string, metrics: Partial<UserProfile['engagementMetrics']>): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        'engagementMetrics': this.db.FieldValue.merge(metrics),
        lastUpdated: this.db.FieldValue.serverTimestamp()
      });
      console.log('📊 Engagement metrics updated:', userId);
    } catch (error) {
      console.error('Error updating engagement metrics:', error);
      throw error;
    }
  }

  // Update privacy settings
  async updatePrivacySettings(userId: string, settings: Partial<UserProfile['privacySettings']>): Promise<void> {
    try {
      await this.db.collection('users').doc(userId).update({
        'privacySettings': this.db.FieldValue.merge(settings),
        lastUpdated: this.db.FieldValue.serverTimestamp()
      });
      console.log('📊 Privacy settings updated:', userId);
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  // Complete onboarding
  async completeOnboarding(userId: string, survey: OnboardingSurvey): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Update profile with onboarding data
      const updatedProfile: Partial<UserProfile> = {
        onboardingCompleted: true,
        demographics: {
          ...profile.demographics,
          experienceLevel: survey.experienceLevel,
          investmentGoals: survey.investmentGoals,
          riskTolerance: survey.riskTolerance
        },
        learningProgress: {
          ...profile.learningProgress,
          currentStage: survey.experienceLevel === 'beginner' ? 1 : 
                       survey.experienceLevel === 'intermediate' ? 3 : 5
        },
        investmentProfile: {
          ...profile.investmentProfile,
          riskScore: this.calculateRiskScore(survey.riskTolerance)
        },
        userSegment: this.determineUserSegment(survey.experienceLevel, survey.timeCommitment)
      };

      await this.createOrUpdateProfile(userId, updatedProfile);
      console.log('📊 Onboarding completed:', userId);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  // Update user segment based on behavior
  async updateUserSegment(userId: string): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return;

      const newSegment = this.calculateUserSegment(profile);
      if (newSegment !== profile.userSegment) {
        await this.db.collection('users').doc(userId).update({
          userSegment: newSegment,
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });
        console.log('📊 User segment updated:', userId, 'from', profile.userSegment, 'to', newSegment);
      }
    } catch (error) {
      console.error('Error updating user segment:', error);
    }
  }

  // Get user segment recommendations
  getSegmentRecommendations(segment: UserProfile['userSegment']): string[] {
    const recommendations: Record<UserProfile['userSegment'], string[]> = {
      beginner: [
        'Start with basic trading concepts',
        'Focus on risk management',
        'Practice with paper trading',
        'Join beginner-friendly communities'
      ],
      intermediate: [
        'Explore advanced strategies',
        'Diversify your portfolio',
        'Learn technical analysis',
        'Consider automated trading'
      ],
      advanced: [
        'Master complex derivatives',
        'Develop custom strategies',
        'Mentor other traders',
        'Explore institutional tools'
      ],
      expert: [
        'Contribute to trading research',
        'Develop proprietary algorithms',
        'Lead trading communities',
        'Share advanced insights'
      ]
    };

    return recommendations[segment] || [];
  }

  // Delete user profile and all associated data
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      // Delete user profile
      await this.db.collection('users').doc(userId).delete();
      
      // Delete user interactions
      const interactionsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .get();
      
      const batch = this.db.batch();
      interactionsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // Delete user sessions
      const sessionsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .get();
      
      sessionsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // Delete user preferences
      const preferencesSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('preferences')
        .get();
      
      preferencesSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log('📊 User profile and data deleted:', userId);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }

  // Helper methods
  private getDefaultPreferences(): UserPreferences {
    return {
      favoriteContentTypes: [],
      preferredDifficulty: 'beginner',
      preferredSectors: [],
      optimalSessionLength: 10,
      bestEngagementTimes: [],
      lastUpdated: new Date(),
      interactionCount: 0,
      confidence: 0
    };
  }

  private getDefaultLearningProgress(): UserProfile['learningProgress'] {
    return {
      currentStage: 1,
      completedLessons: [],
      totalTimeSpent: 0,
      streakDays: 0
    };
  }

  private getDefaultInvestmentProfile(): UserProfile['investmentProfile'] {
    return {
      portfolioComposition: {
        stocks: 0,
        crypto: 0,
        bonds: 0,
        cash: 100
      },
      savedStocks: [],
      savedCrypto: [],
      watchlist: [],
      totalInvested: 0,
      riskScore: 30
    };
  }

  private getDefaultEngagementMetrics(): UserProfile['engagementMetrics'] {
    return {
      totalSessions: 0,
      averageSessionLength: 0,
      totalInteractions: 0,
      engagementScore: 0,
      favoriteContentTypes: [],
      preferredSectors: [],
      optimalSessionTimes: []
    };
  }

  private getDefaultPrivacySettings(): UserProfile['privacySettings'] {
    return {
      dataSharing: true,
      analyticsOptIn: true,
      personalizedAds: true,
      emailNotifications: true,
      pushNotifications: true
    };
  }

  private calculateRiskScore(riskTolerance: string): number {
    switch (riskTolerance) {
      case 'conservative':
        return 20;
      case 'moderate':
        return 50;
      case 'aggressive':
        return 80;
      default:
        return 30;
    }
  }

  private determineUserSegment(experienceLevel: string, timeCommitment: string): UserProfile['userSegment'] {
    if (experienceLevel === 'beginner') return 'beginner';
    if (experienceLevel === 'intermediate' && timeCommitment === 'high') return 'advanced';
    if (experienceLevel === 'advanced') return 'expert';
    return 'intermediate';
  }

  private calculateUserSegment(profile: UserProfile): UserProfile['userSegment'] {
    const { engagementMetrics, learningProgress } = profile;
    
    // Calculate segment based on engagement and progress
    if (engagementMetrics.totalInteractions < 50 || learningProgress.currentStage < 2) {
      return 'beginner';
    }
    
    if (engagementMetrics.totalInteractions < 200 || learningProgress.currentStage < 5) {
      return 'intermediate';
    }
    
    if (engagementMetrics.totalInteractions < 500 || learningProgress.currentStage < 8) {
      return 'advanced';
    }
    
    return 'expert';
  }
}

// Export singleton instance
export const userProfileService = new UserProfileService();
