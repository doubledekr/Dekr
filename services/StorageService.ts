import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Platform-aware Firebase imports
let storage: any;
let getDownloadURL: any;
let ref: any;

if (Platform.OS === 'web') {
  // Use Firebase Web SDK for web platform
  const { getStorage, getDownloadURL: webGetDownloadURL, ref: webRef } = require('firebase/storage');
  const { getApp } = require('firebase/app');
  
  try {
    const app = getApp();
    storage = getStorage(app);
    getDownloadURL = webGetDownloadURL;
    ref = webRef;
  } catch (error) {
    console.warn('⚠️ Firebase Storage not available on web, using fallback');
    storage = null;
  }
} else {
  // Use React Native Firebase for native platforms
  try {
    const firebaseStorage = require('@react-native-firebase/storage').default;
    storage = firebaseStorage();
    getDownloadURL = (ref: any) => ref.getDownloadURL();
    ref = (storage: any, path: string) => storage.ref(path);
  } catch (error) {
    console.warn('⚠️ React Native Firebase Storage not available, using fallback');
    storage = null;
  }
}

interface CacheEntry {
  url: string;
  expiresAt: number;
  metadata?: {
    size?: number;
    contentType?: string;
    lastModified?: string;
  };
}

interface StorageServiceConfig {
  cacheExpirationHours: number;
  maxCacheSize: number;
  enableOfflineMode: boolean;
}

class StorageService {
  private static instance: StorageService;
  private config: StorageServiceConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_PREFIX = 'dekr_storage_cache_';
  private readonly CACHE_INDEX_KEY = 'dekr_storage_cache_index';

  private constructor(config?: Partial<StorageServiceConfig>) {
    this.config = {
      cacheExpirationHours: 24,
      maxCacheSize: 100,
      enableOfflineMode: true,
      ...config
    };
    
    this.loadCacheFromStorage();
  }

  public static getInstance(config?: Partial<StorageServiceConfig>): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService(config);
    }
    return StorageService.instance;
  }

  /**
   * Get lesson audio URL from Firebase Storage
   */
  public async getLessonAudioUrl(stage: number, lessonId: number): Promise<string> {
    const cacheKey = `lesson_${stage}_${lessonId}`;
    
    // Check cache first
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) {
      console.log(`🎵 Using cached URL for lesson ${stage}_${lessonId}`);
      return cachedUrl;
    }

    // If Firebase Storage is not available, fall back to local assets
    if (!storage) {
      console.warn('⚠️ Firebase Storage not available, falling back to local assets');
      return this.getLocalAssetUrl(stage, lessonId);
    }

    try {
      const storagePath = `dekr-content/audio/lessons/stage_${stage}/lesson_${stage}_${lessonId}.mp3`;
      const storageRef = ref(storage, storagePath);
      
      console.log(`🔗 Getting download URL for: ${storagePath}`);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // Cache the URL
      await this.cacheUrl(cacheKey, downloadUrl);
      
      console.log(`✅ Retrieved Firebase Storage URL for lesson ${stage}_${lessonId}`);
      return downloadUrl;
      
    } catch (error) {
      console.error(`❌ Failed to get Firebase Storage URL for lesson ${stage}_${lessonId}:`, error);
      
      // Fall back to local assets
      console.log('🔄 Falling back to local assets');
      return this.getLocalAssetUrl(stage, lessonId);
    }
  }

  /**
   * Get podcast audio URL from Firebase Storage
   */
  public async getPodcastAudioUrl(podcastPath: string): Promise<string> {
    const cacheKey = `podcast_${podcastPath}`;
    
    // Check cache first
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    if (!storage) {
      throw new Error('Firebase Storage not available');
    }

    try {
      const storageRef = ref(storage, `dekr-content/audio/podcasts/${podcastPath}`);
      const downloadUrl = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, downloadUrl);
      return downloadUrl;
      
    } catch (error) {
      console.error(`❌ Failed to get podcast URL for ${podcastPath}:`, error);
      throw error;
    }
  }

  /**
   * Get intro stinger URL from Firebase Storage
   */
  public async getIntroStingerUrl(filename: string): Promise<string> {
    const cacheKey = `intro_${filename}`;
    
    const cachedUrl = await this.getCachedUrl(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    if (!storage) {
      throw new Error('Firebase Storage not available');
    }

    try {
      const storageRef = ref(storage, `dekr-content/audio/intro_stingers/${filename}`);
      const downloadUrl = await getDownloadURL(storageRef);
      
      await this.cacheUrl(cacheKey, downloadUrl);
      return downloadUrl;
      
    } catch (error) {
      console.error(`❌ Failed to get intro stinger URL for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Preload multiple lesson audio URLs
   */
  public async preloadLessonAudio(stage: number, lessonIds: number[]): Promise<Map<number, string>> {
    const results = new Map<number, string>();
    
    console.log(`🔄 Preloading ${lessonIds.length} lessons for stage ${stage}`);
    
    const promises = lessonIds.map(async (lessonId) => {
      try {
        const url = await this.getLessonAudioUrl(stage, lessonId);
        results.set(lessonId, url);
        console.log(`✅ Preloaded lesson ${stage}_${lessonId}`);
      } catch (error) {
        console.error(`❌ Failed to preload lesson ${stage}_${lessonId}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    
    console.log(`🎉 Preloading completed: ${results.size}/${lessonIds.length} successful`);
    return results;
  }

  /**
   * Clear cache for specific lesson
   */
  public async clearLessonCache(stage: number, lessonId: number): Promise<void> {
    const cacheKey = `lesson_${stage}_${lessonId}`;
    await this.removeCachedUrl(cacheKey);
  }

  /**
   * Clear all cached URLs
   */
  public async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
        await AsyncStorage.removeItem(this.CACHE_INDEX_KEY);
      }
      
      this.cache.clear();
      console.log('🧹 Cleared all storage cache');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if Firebase Storage is available
   */
  public isStorageAvailable(): boolean {
    return storage !== null;
  }

  // Private methods

  private async getCachedUrl(cacheKey: string): Promise<string | null> {
    // Check in-memory cache first
    const memoryEntry = this.cache.get(cacheKey);
    if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
      return memoryEntry.url;
    }

    // Check AsyncStorage cache
    try {
      const cachedData = await AsyncStorage.getItem(this.CACHE_PREFIX + cacheKey);
      if (cachedData) {
        const entry: CacheEntry = JSON.parse(cachedData);
        if (entry.expiresAt > Date.now()) {
          // Update in-memory cache
          this.cache.set(cacheKey, entry);
          return entry.url;
        } else {
          // Remove expired entry
          await this.removeCachedUrl(cacheKey);
        }
      }
    } catch (error) {
      console.error('❌ Error reading cache:', error);
    }

    return null;
  }

  private async cacheUrl(cacheKey: string, url: string): Promise<void> {
    const entry: CacheEntry = {
      url,
      expiresAt: Date.now() + (this.config.cacheExpirationHours * 60 * 60 * 1000)
    };

    // Update in-memory cache
    this.cache.set(cacheKey, entry);

    // Update AsyncStorage cache
    try {
      await AsyncStorage.setItem(this.CACHE_PREFIX + cacheKey, JSON.stringify(entry));
      await this.updateCacheIndex(cacheKey);
    } catch (error) {
      console.error('❌ Error caching URL:', error);
    }
  }

  private async removeCachedUrl(cacheKey: string): Promise<void> {
    this.cache.delete(cacheKey);
    
    try {
      await AsyncStorage.removeItem(this.CACHE_PREFIX + cacheKey);
      await this.removeFromCacheIndex(cacheKey);
    } catch (error) {
      console.error('❌ Error removing cached URL:', error);
    }
  }

  private async loadCacheFromStorage(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.CACHE_INDEX_KEY);
      if (indexData) {
        const cacheKeys: string[] = JSON.parse(indexData);
        
        for (const key of cacheKeys) {
          const cachedData = await AsyncStorage.getItem(this.CACHE_PREFIX + key);
          if (cachedData) {
            const entry: CacheEntry = JSON.parse(cachedData);
            if (entry.expiresAt > Date.now()) {
              this.cache.set(key, entry);
            } else {
              // Remove expired entry
              await this.removeCachedUrl(key);
            }
          }
        }
        
        console.log(`📦 Loaded ${this.cache.size} cached URLs from storage`);
      }
    } catch (error) {
      console.error('❌ Error loading cache from storage:', error);
    }
  }

  private async updateCacheIndex(cacheKey: string): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.CACHE_INDEX_KEY);
      const cacheKeys: string[] = indexData ? JSON.parse(indexData) : [];
      
      if (!cacheKeys.includes(cacheKey)) {
        cacheKeys.push(cacheKey);
        await AsyncStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(cacheKeys));
      }
    } catch (error) {
      console.error('❌ Error updating cache index:', error);
    }
  }

  private async removeFromCacheIndex(cacheKey: string): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem(this.CACHE_INDEX_KEY);
      if (indexData) {
        const cacheKeys: string[] = JSON.parse(indexData);
        const updatedKeys = cacheKeys.filter(key => key !== cacheKey);
        await AsyncStorage.setItem(this.CACHE_INDEX_KEY, JSON.stringify(updatedKeys));
      }
    } catch (error) {
      console.error('❌ Error removing from cache index:', error);
    }
  }

  private getLocalAssetUrl(stage: number, lessonId: number): string {
    // Fallback to local asset mapping
    const filename = `lesson_${stage}_${lessonId}.mp3`;
    
    // This would need to be updated to match your local asset structure
    // For now, return a placeholder that the audio player can handle
    return `/audio/${filename}`;
  }
}

export default StorageService;