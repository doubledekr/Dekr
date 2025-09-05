import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Platform-aware Firebase Storage imports
let storage: any;
let getDownloadURL: any;
let ref: any;
let uploadBytes: any;
let uploadBytesResumable: any;

if (Platform.OS === 'web') {
  const { getStorage, getDownloadURL: webGetDownloadURL, ref: webRef, uploadBytes: webUploadBytes } = require('firebase/storage');
  storage = getStorage();
  getDownloadURL = webGetDownloadURL;
  ref = webRef;
  uploadBytes = webUploadBytes;
} else {
  try {
    const firebaseStorage = require('@react-native-firebase/storage').default;
    storage = firebaseStorage;
    getDownloadURL = (storageRef: any) => storageRef.getDownloadURL();
    ref = (storage: any, path: string) => storage.ref(path);
    uploadBytes = (storageRef: any, file: any) => storageRef.put(file);
  } catch (error) {
    console.log('⚠️ Firebase Storage not available, using dummy implementation');
    storage = {
      ref: () => ({
        getDownloadURL: () => Promise.resolve('dummy-url'),
        put: () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('dummy-url') } })
      })
    };
    getDownloadURL = () => Promise.resolve('dummy-url');
    ref = () => ({ getDownloadURL: () => Promise.resolve('dummy-url') });
    uploadBytes = () => Promise.resolve({ ref: { getDownloadURL: () => Promise.resolve('dummy-url') } });
  }
}

export interface StorageCacheItem {
  url: string;
  expiresAt: number;
}

export class StorageService {
  private static instance: StorageService;
  private cache: Map<string, StorageCacheItem> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_KEY_PREFIX = 'storage_cache_';

  private constructor() {
    this.loadCacheFromStorage();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Get lesson audio URL from organized storage structure
   * Path: dekr-content/audio/lessons/stage_{stage}/lesson_{lessonId}.mp3
   */
  public async getLessonAudioUrl(stage: number, lessonId: string): Promise<string> {
    const cacheKey = `lesson_${stage}_${lessonId}`;
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const path = `dekr-content/audio/lessons/stage_${stage}/lesson_${lessonId}.mp3`;
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, url);
      return url;
    } catch (error) {
      console.error(`❌ Error getting lesson audio URL for stage ${stage}, lesson ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Get podcast audio URL from organized storage structure
   * Path: dekr-content/audio/podcasts/weekly/week_{weekNumber}.mp3
   */
  public async getPodcastAudioUrl(weekNumber: number): Promise<string> {
    const cacheKey = `podcast_week_${weekNumber}`;
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const path = `dekr-content/audio/podcasts/weekly/week_${weekNumber}.mp3`;
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, url);
      return url;
    } catch (error) {
      console.error(`❌ Error getting podcast audio URL for week ${weekNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get community podcast audio URL
   * Path: dekr-content/audio/podcasts/community/podcast_{podcastId}.mp3
   */
  public async getCommunityPodcastAudioUrl(podcastId: string): Promise<string> {
    const cacheKey = `community_podcast_${podcastId}`;
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const path = `dekr-content/audio/podcasts/community/podcast_${podcastId}.mp3`;
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, url);
      return url;
    } catch (error) {
      console.error(`❌ Error getting community podcast audio URL for ${podcastId}:`, error);
      throw error;
    }
  }

  /**
   * Get user avatar URL
   * Path: dekr-content/images/user_avatars/{userId}.jpg
   */
  public async getUserAvatarUrl(userId: string): Promise<string> {
    const cacheKey = `user_avatar_${userId}`;
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const path = `dekr-content/images/user_avatars/${userId}.jpg`;
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, url);
      return url;
    } catch (error) {
      console.error(`❌ Error getting user avatar URL for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get lesson thumbnail URL
   * Path: dekr-content/images/lesson_thumbnails/{lessonId}.jpg
   */
  public async getLessonThumbnailUrl(lessonId: string): Promise<string> {
    const cacheKey = `lesson_thumbnail_${lessonId}`;
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const path = `dekr-content/images/lesson_thumbnails/${lessonId}.jpg`;
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, url);
      return url;
    } catch (error) {
      console.error(`❌ Error getting lesson thumbnail URL for ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Get deck cover URL
   * Path: dekr-content/images/deck_covers/{deckId}.jpg
   */
  public async getDeckCoverUrl(deckId: string): Promise<string> {
    const cacheKey = `deck_cover_${deckId}`;
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const path = `dekr-content/images/deck_covers/${deckId}.jpg`;
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, url);
      return url;
    } catch (error) {
      console.error(`❌ Error getting deck cover URL for ${deckId}:`, error);
      throw error;
    }
  }

  /**
   * Get intro stinger URL
   * Path: dekr-content/audio/intro_stingers/{stingerName}
   */
  public async getIntroStingerUrl(stingerName: string): Promise<string> {
    const cacheKey = `intro_stinger_${stingerName}`;
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) return cachedUrl;

    try {
      const path = `dekr-content/audio/intro_stingers/${stingerName}`;
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, url);
      return url;
    } catch (error) {
      console.error(`❌ Error getting intro stinger URL for ${stingerName}:`, error);
      throw error;
    }
  }

  /**
   * Upload user content (avatar, etc.)
   * Path: dekr-content/images/user_avatars/{userId}.{extension}
   */
  public async uploadUserContent(userId: string, file: any, contentType: 'avatar' | 'deck_cover'): Promise<string> {
    try {
      let path: string;
      let extension = 'jpg'; // Default extension
      
      if (contentType === 'avatar') {
        path = `dekr-content/images/user_avatars/${userId}.${extension}`;
      } else if (contentType === 'deck_cover') {
        path = `dekr-content/images/deck_covers/${userId}.${extension}`;
      } else {
        throw new Error(`Unsupported content type: ${contentType}`);
      }

      const storageRef = ref(storage, path);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      
      // Cache the new URL
      const cacheKey = contentType === 'avatar' ? `user_avatar_${userId}` : `deck_cover_${userId}`;
      await this.cacheUrl(cacheKey, url);
      
      return url;
    } catch (error) {
      console.error(`❌ Error uploading user content for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get signed URL with expiration (for temporary access)
   */
  public async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error(`❌ Error getting signed URL for ${path}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for a specific key
   */
  public async clearCache(key: string): Promise<void> {
    this.cache.delete(key);
    await AsyncStorage.removeItem(`${this.CACHE_KEY_PREFIX}${key}`);
  }

  /**
   * Clear all cached URLs
   */
  public async clearAllCache(): Promise<void> {
    this.cache.clear();
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Private helper methods

  private async getCachedUrl(key: string): Promise<string | null> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }
    
    // Try to load from AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(`${this.CACHE_KEY_PREFIX}${key}`);
      if (stored) {
        const cached: StorageCacheItem = JSON.parse(stored);
        if (cached.expiresAt > Date.now()) {
          this.cache.set(key, cached);
          return cached.url;
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    
    return null;
  }

  private async cacheUrl(key: string, url: string): Promise<void> {
    const cacheItem: StorageCacheItem = {
      url,
      expiresAt: Date.now() + this.CACHE_DURATION
    };
    
    this.cache.set(key, cacheItem);
    
    try {
      await AsyncStorage.setItem(`${this.CACHE_KEY_PREFIX}${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_KEY_PREFIX));
      
      for (const key of cacheKeys) {
        const stored = await AsyncStorage.getItem(key);
        if (stored) {
          const cached: StorageCacheItem = JSON.parse(stored);
          if (cached.expiresAt > Date.now()) {
            const originalKey = key.replace(this.CACHE_KEY_PREFIX, '');
            this.cache.set(originalKey, cached);
          }
        }
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
export default storageService;
