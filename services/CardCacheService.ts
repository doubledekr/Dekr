import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnifiedCard } from './CardService';

// Cache configuration
const CACHE_KEYS = {
  CARDS: 'unified_cards_cache',
  IMAGES: 'card_images_cache',
  LAST_SYNC: 'last_card_sync',
};

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_CACHE_SIZE = 1000; // Maximum number of cards to cache
const IMAGE_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days for images

interface CachedCards {
  cards: UnifiedCard[];
  timestamp: number;
  userId?: string;
}

interface CachedImage {
  url: string;
  localPath: string;
  timestamp: number;
}

export class CardCacheService {
  private static instance: CardCacheService;
  private cache: Map<string, CachedCards> = new Map();
  private imageCache: Map<string, CachedImage> = new Map();

  private constructor() {
    this.loadCacheFromStorage();
  }

  public static getInstance(): CardCacheService {
    if (!CardCacheService.instance) {
      CardCacheService.instance = new CardCacheService();
    }
    return CardCacheService.instance;
  }

  // Load cache from AsyncStorage on initialization
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.CARDS);
      if (cachedData) {
        const parsed: CachedCards = JSON.parse(cachedData);
        if (this.isCacheValid(parsed.timestamp)) {
          this.cache.set('default', parsed);
        }
      }

      const imageData = await AsyncStorage.getItem(CACHE_KEYS.IMAGES);
      if (imageData) {
        const parsed: CachedImage[] = JSON.parse(imageData);
        parsed.forEach(img => {
          if (this.isImageCacheValid(img.timestamp)) {
            this.imageCache.set(img.url, img);
          }
        });
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  // Save cache to AsyncStorage
  private async saveCacheToStorage(): Promise<void> {
    try {
      const cacheArray = Array.from(this.cache.entries());
      if (cacheArray.length > 0) {
        const [key, data] = cacheArray[0]; // Save the first cache entry
        await AsyncStorage.setItem(CACHE_KEYS.CARDS, JSON.stringify(data));
      }

      const imageArray = Array.from(this.imageCache.values());
      await AsyncStorage.setItem(CACHE_KEYS.IMAGES, JSON.stringify(imageArray));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  // Check if cache is still valid
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_EXPIRY;
  }

  // Check if image cache is still valid
  private isImageCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < IMAGE_CACHE_EXPIRY;
  }

  // Cache cards for a specific user/feed type
  public async cacheCards(cards: UnifiedCard[], userId?: string, feedType?: string): Promise<void> {
    try {
      const cacheKey = feedType || 'default';
      const cachedData: CachedCards = {
        cards: cards.slice(0, MAX_CACHE_SIZE), // Limit cache size
        timestamp: Date.now(),
        userId,
      };

      this.cache.set(cacheKey, cachedData);
      await this.saveCacheToStorage();
    } catch (error) {
      console.error('Error caching cards:', error);
    }
  }

  // Get cached cards
  public getCachedCards(userId?: string, feedType?: string): UnifiedCard[] | null {
    try {
      const cacheKey = feedType || 'default';
      const cachedData = this.cache.get(cacheKey);

      if (cachedData && this.isCacheValid(cachedData.timestamp)) {
        // Check if user matches (if specified)
        if (userId && cachedData.userId && cachedData.userId !== userId) {
          return null;
        }
        return cachedData.cards;
      }

      return null;
    } catch (error) {
      console.error('Error getting cached cards:', error);
      return null;
    }
  }

  // Preload next batch of cards
  public async preloadNextBatch(
    currentCards: UnifiedCard[],
    loadMoreFunction: () => Promise<UnifiedCard[]>
  ): Promise<void> {
    try {
      // Only preload if we have less than 10 cards remaining
      if (currentCards.length < 10) {
        const newCards = await loadMoreFunction();
        if (newCards.length > 0) {
          // Cache the new cards
          await this.cacheCards(newCards);
        }
      }
    } catch (error) {
      console.error('Error preloading next batch:', error);
    }
  }

  // Cache card image
  public async cacheCardImage(imageUrl: string, localPath: string): Promise<void> {
    try {
      const cachedImage: CachedImage = {
        url: imageUrl,
        localPath,
        timestamp: Date.now(),
      };

      this.imageCache.set(imageUrl, cachedImage);
      await this.saveCacheToStorage();
    } catch (error) {
      console.error('Error caching card image:', error);
    }
  }

  // Get cached image path
  public getCachedImagePath(imageUrl: string): string | null {
    try {
      const cachedImage = this.imageCache.get(imageUrl);
      if (cachedImage && this.isImageCacheValid(cachedImage.timestamp)) {
        return cachedImage.localPath;
      }
      return null;
    } catch (error) {
      console.error('Error getting cached image path:', error);
      return null;
    }
  }

  // Background sync for new cards
  public async backgroundSync(
    syncFunction: () => Promise<UnifiedCard[]>
  ): Promise<UnifiedCard[]> {
    try {
      const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      const lastSyncTime = lastSync ? parseInt(lastSync) : 0;
      const now = Date.now();

      // Only sync if it's been more than 30 minutes since last sync
      if (now - lastSyncTime > 30 * 60 * 1000) {
        const newCards = await syncFunction();
        if (newCards.length > 0) {
          await this.cacheCards(newCards);
          await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, now.toString());
        }
        return newCards;
      }

      return [];
    } catch (error) {
      console.error('Error in background sync:', error);
      return [];
    }
  }

  // Clear expired cache
  public async clearExpiredCache(): Promise<void> {
    try {
      // Clear expired card cache
      for (const [key, data] of this.cache.entries()) {
        if (!this.isCacheValid(data.timestamp)) {
          this.cache.delete(key);
        }
      }

      // Clear expired image cache
      for (const [url, data] of this.imageCache.entries()) {
        if (!this.isImageCacheValid(data.timestamp)) {
          this.imageCache.delete(url);
        }
      }

      await this.saveCacheToStorage();
    } catch (error) {
      console.error('Error clearing expired cache:', error);
    }
  }

  // Clear all cache
  public async clearAllCache(): Promise<void> {
    try {
      this.cache.clear();
      this.imageCache.clear();
      await AsyncStorage.multiRemove([
        CACHE_KEYS.CARDS,
        CACHE_KEYS.IMAGES,
        CACHE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  // Get cache statistics
  public getCacheStats(): {
    cardCacheSize: number;
    imageCacheSize: number;
    totalCacheSize: number;
  } {
    return {
      cardCacheSize: this.cache.size,
      imageCacheSize: this.imageCache.size,
      totalCacheSize: this.cache.size + this.imageCache.size,
    };
  }

  // Handle network connectivity changes
  public async handleNetworkChange(isConnected: boolean): Promise<void> {
    if (!isConnected) {
      // When offline, we can still serve cached content
      console.log('Network disconnected - serving cached content only');
    } else {
      // When back online, trigger background sync
      console.log('Network connected - triggering background sync');
      // This would typically be called with a sync function
    }
  }

  // Performance monitoring
  public async logPerformanceMetrics(
    operation: string,
    startTime: number,
    cardCount?: number
  ): Promise<void> {
    try {
      const duration = Date.now() - startTime;
      const metrics = {
        operation,
        duration,
        cardCount,
        timestamp: Date.now(),
        cacheHit: this.cache.size > 0,
      };

      // In a real app, you might send this to analytics
      console.log('Card Cache Performance:', metrics);
    } catch (error) {
      console.error('Error logging performance metrics:', error);
    }
  }
}

// Export singleton instance
export const cardCacheService = CardCacheService.getInstance();
