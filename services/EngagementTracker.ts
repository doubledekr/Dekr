// Platform-aware Firebase service for engagement tracking
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
  console.log('🔄 Using dummy Firebase services for EngagementTracker (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for EngagementTracker');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for EngagementTracker, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Types for engagement tracking
export type CardType = 'lesson' | 'podcast' | 'news' | 'stock' | 'crypto' | 'challenge';
export type InteractionAction = 'swipe_right' | 'swipe_left' | 'save' | 'share' | 'play' | 'complete' | 'view' | 'bookmark';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface InteractionContext {
  timeOfDay: TimeOfDay;
  dayOfWeek: DayOfWeek;
  position: number; // Card position in feed
  timeSpent: number; // Milliseconds spent viewing card
  sessionId: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model?: string;
  };
}

export interface UserInteraction {
  id: string;
  cardId: string;
  cardType: CardType;
  action: InteractionAction;
  timestamp: any; // Firestore timestamp
  sessionId: string;
  context: InteractionContext;
}

export interface UserPreferences {
  favoriteContentTypes: string[];
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  preferredSectors: string[];
  optimalSessionLength: number; // Average session duration in minutes
  bestEngagementTimes: string[];
  lastUpdated: any; // Firestore timestamp
  interactionCount: number;
  confidence: number; // 0-1 confidence in preferences
}

export interface SessionData {
  id: string;
  userId: string;
  startTime: any; // Firestore timestamp
  endTime?: any; // Firestore timestamp
  duration?: number; // Session duration in milliseconds
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
  };
  interactions: number; // Number of interactions in session
  cardsViewed: string[]; // Array of card IDs viewed
  isActive: boolean;
}

// Offline queue for interactions
class OfflineQueue {
  private queue: UserInteraction[] = [];
  private maxQueueSize = 100;

  add(interaction: UserInteraction) {
    this.queue.push(interaction);
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift(); // Remove oldest interaction
    }
  }

  getAll(): UserInteraction[] {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
  }

  size(): number {
    return this.queue.length;
  }
}

// Engagement Tracker Service
export class EngagementTracker {
  private db: any;
  private offlineQueue: OfflineQueue;
  private currentSessionId: string | null = null;
  private sessionStartTime: number | null = null;
  private cardViewStartTimes: Map<string, number> = new Map();

  constructor() {
    this.db = firestore();
    this.offlineQueue = new OfflineQueue();
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current time of day
  private getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  // Get current day of week
  private getDayOfWeek(): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  }

  // Get device info
  private getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device'
    };
  }

  // Get session context
  getSessionContext(): InteractionContext {
    return {
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: this.getDayOfWeek(),
      position: 0, // Will be set by calling component
      timeSpent: 0, // Will be calculated by component
      sessionId: this.currentSessionId || this.generateSessionId(),
      deviceInfo: this.getDeviceInfo()
    };
  }

  // Track session start
  async trackSessionStart(userId: string): Promise<string> {
    try {
      const sessionId = this.generateSessionId();
      this.currentSessionId = sessionId;
      this.sessionStartTime = Date.now();

      const sessionData: SessionData = {
        id: sessionId,
        userId,
        startTime: this.db.FieldValue.serverTimestamp(),
        deviceInfo: this.getDeviceInfo(),
        interactions: 0,
        cardsViewed: [],
        isActive: true
      };

      await this.db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId)
        .set(sessionData);

      console.log('📊 Session started:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error tracking session start:', error);
      // Generate session ID even if tracking fails
      this.currentSessionId = this.generateSessionId();
      this.sessionStartTime = Date.now();
      return this.currentSessionId;
    }
  }

  // Track session end
  async trackSessionEnd(userId: string, sessionId?: string): Promise<void> {
    try {
      const activeSessionId = sessionId || this.currentSessionId;
      if (!activeSessionId) {
        console.warn('No active session to end');
        return;
      }

      const endTime = Date.now();
      const duration = this.sessionStartTime ? endTime - this.sessionStartTime : 0;

      await this.db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(activeSessionId)
        .update({
          endTime: this.db.FieldValue.serverTimestamp(),
          duration,
          isActive: false
        });

      // Process any queued interactions
      await this.processOfflineQueue(userId);

      console.log('📊 Session ended:', activeSessionId, 'Duration:', Math.round(duration / 1000), 'seconds');
      
      // Reset session tracking
      this.currentSessionId = null;
      this.sessionStartTime = null;
      this.cardViewStartTimes.clear();
    } catch (error) {
      console.error('Error tracking session end:', error);
    }
  }

  // Track card interaction
  async trackCardInteraction(
    userId: string,
    cardId: string,
    cardType: CardType,
    action: InteractionAction,
    context: Partial<InteractionContext> = {}
  ): Promise<void> {
    try {
      const fullContext = {
        ...this.getSessionContext(),
        ...context
      };

      const interaction: UserInteraction = {
        id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cardId,
        cardType,
        action,
        timestamp: this.db.FieldValue.serverTimestamp(),
        sessionId: fullContext.sessionId,
        context: fullContext
      };

      // Try to store interaction immediately
      await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .doc(interaction.id)
        .set(interaction);

      // Update session with interaction count
      await this.updateSessionInteraction(userId, fullContext.sessionId, cardId);

      console.log('📊 Interaction tracked:', action, 'for card:', cardId);
    } catch (error) {
      console.error('Error tracking card interaction:', error);
      // Add to offline queue if network is unavailable
      const interaction: UserInteraction = {
        id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cardId,
        cardType,
        action,
        timestamp: new Date(),
        sessionId: context.sessionId || this.currentSessionId || this.generateSessionId(),
        context: {
          ...this.getSessionContext(),
          ...context
        }
      };
      this.offlineQueue.add(interaction);
      console.log('📊 Interaction queued offline:', action, 'for card:', cardId);
    }
  }

  // Update session interaction count
  private async updateSessionInteraction(userId: string, sessionId: string, cardId: string): Promise<void> {
    try {
      const sessionRef = this.db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .doc(sessionId);

      await sessionRef.update({
        interactions: this.db.FieldValue.increment(1),
        cardsViewed: this.db.FieldValue.arrayUnion(cardId)
      });
    } catch (error) {
      console.error('Error updating session interaction:', error);
    }
  }

  // Process offline queue
  private async processOfflineQueue(userId: string): Promise<void> {
    const queuedInteractions = this.offlineQueue.getAll();
    if (queuedInteractions.length === 0) return;

    console.log(`📊 Processing ${queuedInteractions.length} queued interactions`);

    for (const interaction of queuedInteractions) {
      try {
        await this.db
          .collection('users')
          .doc(userId)
          .collection('interactions')
          .doc(interaction.id)
          .set({
            ...interaction,
            timestamp: this.db.FieldValue.serverTimestamp()
          });
      } catch (error) {
        console.error('Error processing queued interaction:', error);
      }
    }

    this.offlineQueue.clear();
  }

  // Track card view start (for time spent calculation)
  trackCardViewStart(cardId: string): void {
    this.cardViewStartTimes.set(cardId, Date.now());
  }

  // Track card view end and calculate time spent
  trackCardViewEnd(cardId: string): number {
    const startTime = this.cardViewStartTimes.get(cardId);
    if (!startTime) return 0;

    const timeSpent = Date.now() - startTime;
    this.cardViewStartTimes.delete(cardId);
    return timeSpent;
  }

  // Batch track multiple interactions
  async trackBatchInteractions(
    userId: string,
    interactions: Array<{
      cardId: string;
      cardType: CardType;
      action: InteractionAction;
      context?: Partial<InteractionContext>;
    }>
  ): Promise<void> {
    try {
      const batch = this.db.batch();
      const sessionId = this.currentSessionId || this.generateSessionId();

      for (const interactionData of interactions) {
        const fullContext = {
          ...this.getSessionContext(),
          ...interactionData.context
        };

        const interaction: UserInteraction = {
          id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          cardId: interactionData.cardId,
          cardType: interactionData.cardType,
          action: interactionData.action,
          timestamp: this.db.FieldValue.serverTimestamp(),
          sessionId,
          context: fullContext
        };

        const interactionRef = this.db
          .collection('users')
          .doc(userId)
          .collection('interactions')
          .doc(interaction.id);

        batch.set(interactionRef, interaction);
      }

      await batch.commit();
      console.log('📊 Batch interactions tracked:', interactions.length);
    } catch (error) {
      console.error('Error tracking batch interactions:', error);
      // Add to offline queue
      for (const interactionData of interactions) {
        const interaction: UserInteraction = {
          id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          cardId: interactionData.cardId,
          cardType: interactionData.cardType,
          action: interactionData.action,
          timestamp: new Date(),
          sessionId: this.currentSessionId || this.generateSessionId(),
          context: {
            ...this.getSessionContext(),
            ...interactionData.context
          }
        };
        this.offlineQueue.add(interaction);
      }
    }
  }

  // Get user's recent interactions
  async getUserInteractions(userId: string, limit: number = 50): Promise<UserInteraction[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .orderBy('timestamp', 'desc')
        .limit(limit)
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

  // Get user's session data
  async getUserSessions(userId: string, limit: number = 20): Promise<SessionData[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .orderBy('startTime', 'desc')
        .limit(limit)
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

  // Privacy controls - delete user data
  async deleteUserData(userId: string): Promise<void> {
    try {
      // Delete all interactions
      const interactionsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('interactions')
        .get();

      const batch = this.db.batch();
      interactionsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // Delete all sessions
      const sessionsSnapshot = await this.db
        .collection('users')
        .doc(userId)
        .collection('sessions')
        .get();

      sessionsSnapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });

      // Delete user preferences
      batch.delete(this.db.collection('users').doc(userId).collection('preferences').doc('main'));

      await batch.commit();
      console.log('📊 User data deleted for:', userId);
    } catch (error) {
      console.error('Error deleting user data:', error);
    }
  }

  // Get offline queue size
  getOfflineQueueSize(): number {
    return this.offlineQueue.size();
  }

  // Force process offline queue
  async forceProcessOfflineQueue(userId: string): Promise<void> {
    await this.processOfflineQueue(userId);
  }
}

// Export singleton instance
export const engagementTracker = new EngagementTracker();
