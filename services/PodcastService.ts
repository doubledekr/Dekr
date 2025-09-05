import OpenAI from 'openai';
import { Platform } from 'react-native';
import { firestore } from './firebase';
import { storageService } from './StorageService';
import { logEvent, AnalyticsEvents } from './analytics';

// Platform-aware Firestore imports
let collection: any;
let doc: any;
let getDoc: any;
let getDocs: any;
let setDoc: any;
let updateDoc: any;
let query: any;
let where: any;
let orderBy: any;
let limit: any;
let serverTimestamp: any;

if (Platform.OS === 'web') {
  const { 
    collection: webCollection, 
    doc: webDoc, 
    getDoc: webGetDoc, 
    getDocs: webGetDocs,
    setDoc: webSetDoc,
    updateDoc: webUpdateDoc,
    query: webQuery,
    where: webWhere,
    orderBy: webOrderBy,
    limit: webLimit,
    serverTimestamp: webServerTimestamp
  } = require('firebase/firestore');
  
  collection = webCollection;
  doc = webDoc;
  getDoc = webGetDoc;
  getDocs = webGetDocs;
  setDoc = webSetDoc;
  updateDoc = webUpdateDoc;
  query = webQuery;
  where = webWhere;
  orderBy = webOrderBy;
  limit = webLimit;
  serverTimestamp = webServerTimestamp;
} else {
  try {
    const firestoreModule = require('@react-native-firebase/firestore').default;
    collection = (db: any, collectionName: string) => db.collection(collectionName);
    doc = (db: any, collectionName: string, docId: string) => db.collection(collectionName).doc(docId);
    getDoc = (docRef: any) => docRef.get();
    getDocs = (queryRef: any) => queryRef.get();
    setDoc = (docRef: any, data: any) => docRef.set(data);
    updateDoc = (docRef: any, data: any) => docRef.update(data);
    query = (queryRef: any, ...constraints: any[]) => queryRef;
    where = (field: string, operator: string, value: any) => ({ field, operator, value });
    orderBy = (field: string, direction: string) => ({ field, direction });
    limit = (count: number) => ({ count });
    serverTimestamp = () => firestoreModule.FieldValue.serverTimestamp();
  } catch (error) {
    console.log('⚠️ Firestore not available, using dummy implementation');
    // Dummy implementations
    collection = () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false, data: () => ({}) }) }) });
    doc = () => ({ get: () => Promise.resolve({ exists: false, data: () => ({}) }) });
    getDoc = () => Promise.resolve({ exists: false, data: () => ({}) });
    getDocs = () => Promise.resolve({ docs: [] });
    setDoc = () => Promise.resolve();
    updateDoc = () => Promise.resolve();
    query = () => ({ get: () => Promise.resolve({ docs: [] }) });
    where = () => ({});
    orderBy = () => ({});
    limit = () => ({});
    serverTimestamp = () => ({ _type: 'serverTimestamp' });
  }
}

export interface CommunityPodcast {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  audioUrl: string;
  scriptUrl: string;
  duration: number;
  segments: string[];
  createdAt: any;
  status: 'generating' | 'ready' | 'archived';
}

export interface UserPodcastPreferences {
  uid: string;
  email: string;
  preferredVoiceId: string;
  podcastPreferences: {
    includeMarketAnalysis: boolean;
    includeCommunityHighlights: boolean;
    includeEducationalContent: boolean;
    includePersonalizedInsights: boolean;
    preferredLength: 'short' | 'medium' | 'long';
  };
}

export class PodcastService {
  private static instance: PodcastService;
  private openai: OpenAI;
  private autocontentApiKey: string;
  private autocontentBaseUrl: string = 'https://api.autocontentapi.com';

  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    this.autocontentApiKey = process.env.EXPO_PUBLIC_AUTOCONTENT_API_KEY || '';
  }

  public static getInstance(): PodcastService {
    if (!PodcastService.instance) {
      PodcastService.instance = new PodcastService();
    }
    return PodcastService.instance;
  }

  /**
   * Get community podcasts from the new communityPodcasts collection
   */
  public async getCommunityPodcasts(limitCount: number = 10): Promise<CommunityPodcast[]> {
    try {
      let podcastsQuery;
      
      if (Platform.OS === 'web') {
        const podcastsRef = collection(firestore, 'communityPodcasts');
        podcastsQuery = query(
          podcastsRef,
          where('status', '==', 'ready'),
          orderBy('weekNumber', 'desc'),
          limit(limitCount)
        );
      } else {
        podcastsQuery = firestore()
          .collection('communityPodcasts')
          .where('status', '==', 'ready')
          .orderBy('weekNumber', 'desc')
          .limit(limitCount);
      }

      const snapshot = await getDocs(podcastsQuery);
      const podcasts: CommunityPodcast[] = [];

      if (Platform.OS === 'web') {
        snapshot.forEach((doc: any) => {
          podcasts.push({
            id: doc.id,
            ...doc.data()
          } as CommunityPodcast);
        });
      } else {
        snapshot.forEach((doc: any) => {
          podcasts.push({
            id: doc.id,
            ...doc.data()
          } as CommunityPodcast);
        });
      }

      // Enhance podcasts with audio URLs from StorageService
      for (const podcast of podcasts) {
        try {
          podcast.audioUrl = await storageService.getPodcastAudioUrl(podcast.weekNumber);
        } catch (error) {
          console.warn(`Could not load audio URL for podcast week ${podcast.weekNumber}:`, error);
        }
      }

      return podcasts;
    } catch (error) {
      console.error('❌ Error getting community podcasts:', error);
      throw error;
    }
  }

  /**
   * Get a specific community podcast by week number
   */
  public async getCommunityPodcast(weekNumber: number): Promise<CommunityPodcast | null> {
    try {
      let podcastDoc;
      
      if (Platform.OS === 'web') {
        const podcastRef = doc(firestore, 'communityPodcasts', weekNumber.toString());
        podcastDoc = await getDoc(podcastRef);
      } else {
        podcastDoc = await firestore().collection('communityPodcasts').doc(weekNumber.toString()).get();
      }

      if (!podcastDoc.exists) {
        return null;
      }

      const podcast: CommunityPodcast = {
        id: podcastDoc.id,
        ...podcastDoc.data()
      } as CommunityPodcast;

      // Enhance with audio URL
      try {
        podcast.audioUrl = await storageService.getPodcastAudioUrl(podcast.weekNumber);
      } catch (error) {
        console.warn(`Could not load audio URL for podcast week ${podcast.weekNumber}:`, error);
      }

      return podcast;
    } catch (error) {
      console.error(`❌ Error getting community podcast for week ${weekNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get user's podcast preferences
   */
  public async getUserPodcastPreferences(userId: string): Promise<UserPodcastPreferences | null> {
    try {
      let userDoc;
      
      if (Platform.OS === 'web') {
        const userRef = doc(firestore, 'users', userId);
        userDoc = await getDoc(userRef);
      } else {
        userDoc = await firestore().collection('users').doc(userId).get();
      }

      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return userData.podcastPreferences || null;
    } catch (error) {
      console.error(`❌ Error getting podcast preferences for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user's podcast preferences
   */
  public async updateUserPodcastPreferences(userId: string, preferences: UserPodcastPreferences): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
          podcastPreferences: preferences,
          updatedAt: serverTimestamp()
        });
      } else {
        await firestore()
          .collection('users')
          .doc(userId)
          .update({
            podcastPreferences: preferences,
            updatedAt: firestore.FieldValue.serverTimestamp()
          });
      }

      console.log(`✅ Updated podcast preferences for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error updating podcast preferences for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a personalized podcast script using OpenAI
   */
  public async generatePodcastScript(userId: string, preferences: UserPodcastPreferences): Promise<string> {
    try {
      const prompt = this.buildPodcastPrompt(preferences);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a financial education podcast host with the tone of radio host Kai Rysdall. Create engaging, in-depth content that educates listeners about financial markets, trading strategies, and economic trends."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const script = completion.choices[0]?.message?.content || '';
      
      // Log analytics
      await logEvent(AnalyticsEvents.PODCAST_SCRIPT_GENERATED, {
        userId,
        scriptLength: script.length,
        preferences: preferences.podcastPreferences
      });

      return script;
    } catch (error) {
      console.error('❌ Error generating podcast script:', error);
      throw error;
    }
  }

  /**
   * Get intro stinger URL
   */
  public async getIntroStingerUrl(stingerName: string = 'podcast_intro.mp3'): Promise<string> {
    try {
      return await storageService.getIntroStingerUrl(stingerName);
    } catch (error) {
      console.error(`❌ Error getting intro stinger URL:`, error);
      throw error;
    }
  }

  /**
   * Get lesson completion stinger URL
   */
  public async getLessonCompleteStingerUrl(): Promise<string> {
    try {
      return await storageService.getIntroStingerUrl('lesson_complete.mp3');
    } catch (error) {
      console.error(`❌ Error getting lesson complete stinger URL:`, error);
      throw error;
    }
  }

  /**
   * Get the latest community podcast
   */
  public async getLatestCommunityPodcast(): Promise<CommunityPodcast | null> {
    try {
      let latestQuery;
      
      if (Platform.OS === 'web') {
        const podcastsRef = collection(firestore, 'communityPodcasts');
        latestQuery = query(
          podcastsRef,
          where('status', '==', 'ready'),
          orderBy('weekNumber', 'desc'),
          limit(1)
        );
      } else {
        latestQuery = firestore()
          .collection('communityPodcasts')
          .where('status', '==', 'ready')
          .orderBy('weekNumber', 'desc')
          .limit(1);
      }

      const snapshot = await getDocs(latestQuery);
      
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const podcast: CommunityPodcast = {
        id: doc.id,
        ...doc.data()
      } as CommunityPodcast;

      // Enhance with audio URL
      try {
        podcast.audioUrl = await storageService.getPodcastAudioUrl(podcast.weekNumber);
      } catch (error) {
        console.warn(`Could not load audio URL for latest podcast:`, error);
      }

      return podcast;
    } catch (error) {
      console.error('❌ Error getting latest community podcast:', error);
      throw error;
    }
  }

  /**
   * Get podcast statistics for analytics
   */
  public async getPodcastStats(): Promise<{
    totalPodcasts: number;
    readyPodcasts: number;
    generatingPodcasts: number;
    latestWeekNumber: number;
  }> {
    try {
      let allPodcastsQuery;
      
      if (Platform.OS === 'web') {
        const podcastsRef = collection(firestore, 'communityPodcasts');
        allPodcastsQuery = query(podcastsRef, orderBy('weekNumber', 'desc'));
      } else {
        allPodcastsQuery = firestore()
          .collection('communityPodcasts')
          .orderBy('weekNumber', 'desc');
      }

      const snapshot = await getDocs(allPodcastsQuery);
      
      let totalPodcasts = 0;
      let readyPodcasts = 0;
      let generatingPodcasts = 0;
      let latestWeekNumber = 0;

      if (Platform.OS === 'web') {
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          totalPodcasts++;
          
          if (data.status === 'ready') {
            readyPodcasts++;
          } else if (data.status === 'generating') {
            generatingPodcasts++;
          }
          
          if (data.weekNumber > latestWeekNumber) {
            latestWeekNumber = data.weekNumber;
          }
        });
      } else {
        snapshot.forEach((doc: any) => {
          const data = doc.data();
          totalPodcasts++;
          
          if (data.status === 'ready') {
            readyPodcasts++;
          } else if (data.status === 'generating') {
            generatingPodcasts++;
          }
          
          if (data.weekNumber > latestWeekNumber) {
            latestWeekNumber = data.weekNumber;
          }
        });
      }

      return {
        totalPodcasts,
        readyPodcasts,
        generatingPodcasts,
        latestWeekNumber
      };
    } catch (error) {
      console.error('❌ Error getting podcast stats:', error);
      throw error;
    }
  }

  // Private helper methods

  private buildPodcastPrompt(preferences: UserPodcastPreferences): string {
    const { podcastPreferences } = preferences;
    
    let prompt = `Create a ${podcastPreferences.preferredLength} financial education podcast script with the following requirements:\n\n`;
    
    if (podcastPreferences.includeMarketAnalysis) {
      prompt += "- Include current market analysis and trends\n";
    }
    
    if (podcastPreferences.includeCommunityHighlights) {
      prompt += "- Include community highlights and user success stories\n";
    }
    
    if (podcastPreferences.includeEducationalContent) {
      prompt += "- Include educational content about trading strategies\n";
    }
    
    if (podcastPreferences.includePersonalizedInsights) {
      prompt += "- Include personalized insights and tips\n";
    }
    
    prompt += "\nMake it engaging, informative, and in the style of Kai Rysdall from Marketplace. Focus on practical financial education that listeners can apply to their trading and investment decisions.";
    
    return prompt;
  }
}

// Export singleton instance
export const podcastService = PodcastService.getInstance();
export default podcastService;