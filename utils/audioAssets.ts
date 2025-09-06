import StorageService from '../services/StorageService';

// Audio asset mapping for React Native with Firebase Storage support
export const getAudioAsset = (audioUrl: string) => {
  console.log('🔊 getAudioAsset called with:', audioUrl);
  
  // Check if it's an external URL (http/https/blob) - Firebase Storage URLs
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://') || audioUrl.startsWith('blob:')) {
    console.log('🔊 External URL detected, returning URL directly:', audioUrl);
    return { uri: audioUrl };
  }
  
  // Extract filename from the audioUrl, handling both /audio/filename.mp3 and filename.mp3 formats
  const filename = audioUrl.split('/').pop();
  console.log('🔊 Extracted filename:', filename);
  
  // Map filenames to their require() paths (fallback for local assets)
  const audioAssets: { [key: string]: any } = {
    'lesson_1_1.mp3': require('../assets/audio/lesson_1_1.mp3'),
    'lesson_1_2.mp3': require('../assets/audio/lesson_1_2.mp3'),
    'lesson_1_3.mp3': require('../assets/audio/lesson_1_3.mp3'),
    'lesson_1_4.mp3': require('../assets/audio/lesson_1_4.mp3'),
    'lesson_1_5.mp3': require('../assets/audio/lesson_1_5.mp3'),
    'lesson_1_6.mp3': require('../assets/audio/lesson_1_6.mp3'),
    'lesson_1_7.mp3': require('../assets/audio/lesson_1_7.mp3'),
    'lesson_1_8.mp3': require('../assets/audio/lesson_1_8.mp3'),
    'lesson_2_1.mp3': require('../assets/audio/lesson_2_1.mp3'),
    'lesson_2_2.mp3': require('../assets/audio/lesson_2_2.mp3'),
    'lesson_2_3.mp3': require('../assets/audio/lesson_2_3.mp3'),
    'lesson_2_4.mp3': require('../assets/audio/lesson_2_4.mp3'),
    'lesson_2_5.mp3': require('../assets/audio/lesson_2_5.mp3'),
    'lesson_2_6.mp3': require('../assets/audio/lesson_2_6.mp3'),
    'lesson_2_7.mp3': require('../assets/audio/lesson_2_7.mp3'),
    'lesson_2_8.mp3': require('../assets/audio/lesson_2_8.mp3'),
    'lesson_2_9.mp3': require('../assets/audio/lesson_2_9.mp3'),
    'lesson_2_11.mp3': require('../assets/audio/lesson_2_11.mp3'),
    'lesson_2_12.mp3': require('../assets/audio/lesson_2_12.mp3'),
    'lesson_2_13.mp3': require('../assets/audio/lesson_2_13.mp3'),
    'lesson_2_14.mp3': require('../assets/audio/lesson_2_14.mp3'),
    'lesson_2_15.mp3': require('../assets/audio/lesson_2_15.mp3'),
    'lesson_2_16.mp3': require('../assets/audio/lesson_2_16.mp3'),
    'Fashion Podcast Intro.mp3': require('../assets/audio/Fashion Podcast Intro.mp3'),
    'Podcast Intro.mp3': require('../assets/audio/Podcast Intro.mp3'),
  };
  
  if (filename && audioAssets[filename]) {
    console.log('🔊 Found local audio asset for:', filename);
    console.log('🔊 Audio asset value:', audioAssets[filename]);
    return audioAssets[filename];
  }
  
  // Fallback - return null if no mapping found
  console.warn(`❌ No audio asset found for: ${filename}`);
  console.log('🔊 Available assets:', Object.keys(audioAssets));
  console.log('🔊 Input audioUrl was:', audioUrl);
  return null;
};

/**
 * Audio Asset Manager for Firebase Storage integration
 */
export class AudioAssetManager {
  private static instance: AudioAssetManager;
  private storageService: StorageService;
  private preloadedUrls: Map<string, string> = new Map();

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  public static getInstance(): AudioAssetManager {
    if (!AudioAssetManager.instance) {
      AudioAssetManager.instance = new AudioAssetManager();
    }
    return AudioAssetManager.instance;
  }

  /**
   * Get lesson audio asset with Firebase Storage support
   */
  public async getLessonAudioAsset(stage: number, lessonId: number): Promise<{ uri: string } | any> {
    try {
      // Try to get from Firebase Storage first
      const firebaseUrl = await this.storageService.getLessonAudioUrl(stage, lessonId);
      
      if (firebaseUrl && firebaseUrl.startsWith('http')) {
        console.log(`🔊 Using Firebase Storage URL for lesson ${stage}_${lessonId}`);
        return { uri: firebaseUrl };
      }
      
      // Fallback to local asset
      const localAsset = getAudioAsset(`lesson_${stage}_${lessonId}.mp3`);
      if (localAsset) {
        console.log(`🔊 Using local asset for lesson ${stage}_${lessonId}`);
        return localAsset;
      }
      
      throw new Error(`No audio asset found for lesson ${stage}_${lessonId}`);
      
    } catch (error) {
      console.error(`❌ Error getting lesson audio asset for ${stage}_${lessonId}:`, error);
      
      // Final fallback to local asset
      const localAsset = getAudioAsset(`lesson_${stage}_${lessonId}.mp3`);
      if (localAsset) {
        console.log(`🔊 Using fallback local asset for lesson ${stage}_${lessonId}`);
        return localAsset;
      }
      
      throw error;
    }
  }

  /**
   * Preload lesson sequence for better UX
   */
  public async preloadLessonSequence(stage: number, lessonIds: number[]): Promise<void> {
    console.log(`🔄 Preloading lesson sequence for stage ${stage}:`, lessonIds);
    
    try {
      const urls = await this.storageService.preloadLessonAudio(stage, lessonIds);
      
      // Store preloaded URLs for quick access
      for (const [lessonId, url] of urls) {
        this.preloadedUrls.set(`lesson_${stage}_${lessonId}`, url);
      }
      
      console.log(`✅ Preloaded ${urls.size} lessons for stage ${stage}`);
    } catch (error) {
      console.error(`❌ Error preloading lesson sequence for stage ${stage}:`, error);
    }
  }

  /**
   * Get podcast audio asset
   */
  public async getPodcastAudioAsset(podcastPath: string): Promise<{ uri: string }> {
    try {
      const url = await this.storageService.getPodcastAudioUrl(podcastPath);
      return { uri: url };
    } catch (error) {
      console.error(`❌ Error getting podcast audio asset for ${podcastPath}:`, error);
      throw error;
    }
  }

  /**
   * Get intro stinger audio asset
   */
  public async getIntroStingerAsset(filename: string): Promise<{ uri: string }> {
    try {
      const url = await this.storageService.getIntroStingerUrl(filename);
      return { uri: url };
    } catch (error) {
      console.error(`❌ Error getting intro stinger asset for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Clear cache for specific lesson
   */
  public async clearLessonCache(stage: number, lessonId: number): Promise<void> {
    await this.storageService.clearLessonCache(stage, lessonId);
    this.preloadedUrls.delete(`lesson_${stage}_${lessonId}`);
  }

  /**
   * Clear all cache
   */
  public async clearAllCache(): Promise<void> {
    await this.storageService.clearAllCache();
    this.preloadedUrls.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return {
      storageService: this.storageService.getCacheStats(),
      preloadedUrls: this.preloadedUrls.size
    };
  }

  /**
   * Check if Firebase Storage is available
   */
  public isStorageAvailable(): boolean {
    return this.storageService.isStorageAvailable();
  }
}

// Export singleton instance
export const audioAssetManager = AudioAssetManager.getInstance();
