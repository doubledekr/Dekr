// Platform-aware Firebase service for unified card system
import { Platform } from 'react-native';
import { preferenceAnalyzer, UserPreferences } from './PreferenceAnalyzer';
import { personalizationEngine, PersonalizedCard } from './PersonalizationEngine';
import { personalizationAnalytics } from './PersonalizationAnalytics';

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
  console.log('🔄 Using dummy Firebase services for CardService (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for CardService');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for CardService, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// Unified Card Types
export interface UnifiedCard {
  id: string;
  type: 'lesson' | 'podcast' | 'news' | 'stock' | 'crypto' | 'challenge';
  title: string;
  description: string;
  contentUrl?: string; // for audio/video content
  imageUrl?: string; // for thumbnails
  metadata: {
    symbol?: string; // for stocks/crypto
    stage?: number; // for lessons
    weekNumber?: string; // for podcasts
    difficulty?: string; // for lessons
    endDate?: Date; // for challenges
    sector?: string; // for stocks
  };
  createdAt: Date;
  priority: number; // 0-100 for feed ordering
  tags: string[];
  engagement: {
    views: number;
    saves: number;
    shares: number;
  };
}

// Lesson Data Interface
export interface LessonData {
  id: string;
  title: string;
  description: string;
  audioUrl?: string;
  stage: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  courseId?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

// Podcast Data Interface
export interface PodcastData {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  weekNumber: string;
  segments?: any[];
  thumbnailUrl?: string;
  tags?: string[];
}

// Market Data Interface
export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  type: 'stock' | 'crypto';
  sector?: string;
  marketCap?: number;
  volume?: number;
  tags?: string[];
}

// News Data Interface
export interface NewsData {
  id: string;
  headline: string;
  content: string;
  source: string;
  url: string;
  imageUrl?: string;
  timestamp: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tickers?: string[];
  tags?: string[];
}

// Challenge Data Interface
export interface ChallengeData {
  id: string;
  title: string;
  description: string;
  endDate: Date;
  symbol?: string;
  type: 'direction' | 'price';
  tags?: string[];
}

// Search Filters Interface
export interface SearchFilters {
  type?: string[];
  tags?: string[];
  difficulty?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Card Service Class
export class CardService {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Generate card from lesson data
  generateCardFromLesson(lessonData: LessonData): UnifiedCard {
    return {
      id: `lesson_${lessonData.id}`,
      type: 'lesson',
      title: lessonData.title,
      description: lessonData.description,
      contentUrl: lessonData.audioUrl,
      imageUrl: lessonData.thumbnailUrl,
      metadata: {
        stage: lessonData.stage,
        difficulty: lessonData.difficulty,
      },
      createdAt: new Date(),
      priority: this.calculateLessonPriority(lessonData),
      tags: lessonData.tags || ['education', 'trading'],
      engagement: {
        views: 0,
        saves: 0,
        shares: 0,
      },
    };
  }

  // Generate card from podcast data
  generateCardFromPodcast(podcastData: PodcastData): UnifiedCard {
    return {
      id: `podcast_${podcastData.id}`,
      type: 'podcast',
      title: podcastData.title,
      description: podcastData.description,
      contentUrl: podcastData.audioUrl,
      imageUrl: podcastData.thumbnailUrl,
      metadata: {
        weekNumber: podcastData.weekNumber,
      },
      createdAt: new Date(),
      priority: this.calculatePodcastPriority(podcastData),
      tags: podcastData.tags || ['podcast', 'community'],
      engagement: {
        views: 0,
        saves: 0,
        shares: 0,
      },
    };
  }

  // Generate card from market data
  generateCardFromMarketData(marketData: MarketData): UnifiedCard {
    return {
      id: `${marketData.type}_${marketData.id}`,
      type: marketData.type,
      title: marketData.name,
      description: `${marketData.symbol} - Current price: $${marketData.price.toFixed(2)} (${marketData.changePercentage >= 0 ? '+' : ''}${marketData.changePercentage.toFixed(2)}%)`,
      metadata: {
        symbol: marketData.symbol,
        sector: marketData.sector,
      },
      createdAt: new Date(),
      priority: this.calculateMarketPriority(marketData),
      tags: marketData.tags || [marketData.type, marketData.sector || 'general'],
      engagement: {
        views: 0,
        saves: 0,
        shares: 0,
      },
    };
  }

  // Generate card from news data
  generateCardFromNews(newsData: NewsData): UnifiedCard {
    return {
      id: `news_${newsData.id}`,
      type: 'news',
      title: newsData.headline,
      description: newsData.content.substring(0, 200) + (newsData.content.length > 200 ? '...' : ''),
      contentUrl: newsData.url,
      imageUrl: newsData.imageUrl,
      metadata: {},
      createdAt: new Date(newsData.timestamp),
      priority: this.calculateNewsPriority(newsData),
      tags: newsData.tags || ['news', 'market', ...(newsData.tickers || [])],
      engagement: {
        views: 0,
        saves: 0,
        shares: 0,
      },
    };
  }

  // Generate card from challenge data
  generateCardFromChallenge(challengeData: ChallengeData): UnifiedCard {
    return {
      id: `challenge_${challengeData.id}`,
      type: 'challenge',
      title: challengeData.title,
      description: challengeData.description,
      metadata: {
        symbol: challengeData.symbol,
        endDate: challengeData.endDate,
      },
      createdAt: new Date(),
      priority: this.calculateChallengePriority(challengeData),
      tags: challengeData.tags || ['challenge', 'prediction'],
      engagement: {
        views: 0,
        saves: 0,
        shares: 0,
      },
    };
  }

  // Get basic mixed content feed with user preferences
  async getBasicFeed(userId: string, limit: number = 20): Promise<UnifiedCard[]> {
    try {
      // Get user preferences
      const preferences = await preferenceAnalyzer.getUserPreferences(userId);
      
      if (!preferences || preferences.confidence < 0.3) {
        // Use default distribution for new users or low confidence
        return this.getDefaultFeed(limit);
      }

      // Adjust distribution based on user preferences
      const distribution = this.calculatePreferenceBasedDistribution(preferences, limit);
      
      const [lessonCards, stockCards, newsCards, podcastCards, cryptoCards, challengeCards] = await Promise.all([
        this.getCardsByType('lesson', distribution.lessons),
        this.getCardsByType('stock', distribution.stocks),
        this.getCardsByType('news', distribution.news),
        this.getCardsByType('podcast', distribution.podcasts),
        this.getCardsByType('crypto', distribution.crypto),
        this.getCardsByType('challenge', distribution.challenges),
      ]);

      // Filter and prioritize based on preferences
      const filteredCards = this.filterCardsByPreferences([
        ...lessonCards, 
        ...stockCards, 
        ...newsCards, 
        ...podcastCards,
        ...cryptoCards,
        ...challengeCards
      ], preferences);

      // Sort by preference scores and shuffle
      const sortedCards = this.sortCardsByPreferences(filteredCards, preferences);
      return this.shuffleArray(sortedCards).slice(0, limit);
    } catch (error) {
      console.error('Error getting preference-based feed:', error);
      // Fallback to default feed
      return this.getDefaultFeed(limit);
    }
  }

  // Get personalized feed using PersonalizationEngine
  async getPersonalizedFeed(userId: string, limit: number = 20): Promise<PersonalizedCard[]> {
    try {
      console.log('🎯 Getting personalized feed for user:', userId);
      
      // Generate personalized feed using the PersonalizationEngine
      const personalizedCards = await personalizationEngine.generatePersonalizedFeed(userId, limit);
      
      // Track personalization impact for analytics
      await personalizationAnalytics.trackPersonalizationImpact(userId, personalizedCards);
      
      console.log('🎯 Generated personalized feed with', personalizedCards.length, 'cards');
      return personalizedCards;
    } catch (error) {
      console.error('Error getting personalized feed:', error);
      // Fallback to basic feed
      const basicCards = await this.getBasicFeed(userId, limit);
      return basicCards.map(card => ({
        ...card,
        relevanceScore: card.priority / 100,
        personalizationReason: 'Fallback recommendation',
        confidence: 0.3
      }));
    }
  }

  // Get default feed distribution
  private async getDefaultFeed(limit: number): Promise<UnifiedCard[]> {
    try {
      const cardsRef = this.db.collection('cards');
      
      // Get cards with simple distribution: 40% lessons, 30% stocks, 20% news, 10% podcasts
      const lessonLimit = Math.ceil(limit * 0.4);
      const stockLimit = Math.ceil(limit * 0.3);
      const newsLimit = Math.ceil(limit * 0.2);
      const podcastLimit = Math.ceil(limit * 0.1);

      const [lessonCards, stockCards, newsCards, podcastCards] = await Promise.all([
        this.getCardsByType('lesson', lessonLimit),
        this.getCardsByType('stock', stockLimit),
        this.getCardsByType('news', newsLimit),
        this.getCardsByType('podcast', podcastLimit),
      ]);

      // Combine and shuffle cards
      const allCards = [...lessonCards, ...stockCards, ...newsCards, ...podcastCards];
      return this.shuffleArray(allCards).slice(0, limit);
    } catch (error) {
      console.error('Error getting default feed:', error);
      return [];
    }
  }

  // Get cards by type
  private async getCardsByType(type: string, limit: number): Promise<UnifiedCard[]> {
    try {
      const snapshot = await this.db
        .collection('cards')
        .where('type', '==', type)
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const cards = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        metadata: {
          ...doc.data().metadata,
          endDate: doc.data().metadata?.endDate?.toDate(),
        },
      }));

      // If we're in Expo Go/Web mode and got no cards, return mock data
      if (cards.length === 0 && (Platform.OS === 'web' || isExpoGo)) {
        console.log(`🔄 No ${type} cards found, using mock data for development`);
        return this.getMockCardsByType(type, limit);
      }

      return cards;
    } catch (error) {
      console.error(`Error getting ${type} cards:`, error);
      // Fallback to mock data in development mode
      if (Platform.OS === 'web' || isExpoGo) {
        return this.getMockCardsByType(type, limit);
      }
      return [];
    }
  }

  // Get mock cards for development/testing
  private getMockCardsByType(type: string, limit: number): UnifiedCard[] {
    const mockCards: { [key: string]: UnifiedCard[] } = {
      lesson: [
        {
          id: 'lesson-1',
          type: 'lesson',
          title: 'Introduction to Stock Market Basics',
          description: 'Learn the fundamentals of how the stock market works, including key concepts like stocks, bonds, and market indices.',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400',
          metadata: {
            stage: 1,
            difficulty: 'beginner',
          },
          createdAt: new Date(),
          priority: 90,
          tags: ['stocks', 'beginner', 'education'],
          engagement: { views: 1250, saves: 89, shares: 23 }
        },
        {
          id: 'lesson-2',
          type: 'lesson',
          title: 'Understanding Market Volatility',
          description: 'Explore what causes market volatility and how to navigate uncertain market conditions.',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400',
          metadata: {
            stage: 2,
            difficulty: 'intermediate',
          },
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          priority: 85,
          tags: ['volatility', 'intermediate', 'market-analysis'],
          engagement: { views: 980, saves: 67, shares: 18 }
        },
        {
          id: 'lesson-3',
          type: 'lesson',
          title: 'Technical Analysis Fundamentals',
          description: 'Master the basics of reading charts, identifying trends, and using technical indicators.',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400',
          metadata: {
            stage: 3,
            difficulty: 'intermediate',
          },
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          priority: 80,
          tags: ['technical-analysis', 'charts', 'indicators'],
          engagement: { views: 756, saves: 45, shares: 12 }
        }
      ],
      stock: [
        {
          id: 'stock-1',
          type: 'stock',
          title: 'Apple Inc. (AAPL)',
          description: 'Apple Inc. stock analysis - Current price: $175.43 (+2.3%)',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400',
          metadata: {
            symbol: 'AAPL',
            sector: 'Technology',
          },
          createdAt: new Date(),
          priority: 95,
          tags: ['apple', 'technology', 'large-cap'],
          engagement: { views: 2100, saves: 156, shares: 45 }
        },
        {
          id: 'stock-2',
          type: 'stock',
          title: 'Tesla Inc. (TSLA)',
          description: 'Tesla Inc. stock update - Current price: $248.87 (-1.2%)',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400',
          metadata: {
            symbol: 'TSLA',
            sector: 'Automotive',
          },
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          priority: 88,
          tags: ['tesla', 'electric-vehicles', 'automotive'],
          engagement: { views: 1890, saves: 134, shares: 38 }
        },
        {
          id: 'stock-3',
          type: 'stock',
          title: 'Microsoft Corporation (MSFT)',
          description: 'Microsoft stock performance - Current price: $378.91 (+1.8%)',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400',
          metadata: {
            symbol: 'MSFT',
            sector: 'Technology',
          },
          createdAt: new Date(Date.now() - 7200000), // 2 hours ago
          priority: 82,
          tags: ['microsoft', 'technology', 'cloud'],
          engagement: { views: 1650, saves: 98, shares: 28 }
        }
      ],
      news: [
        {
          id: 'news-1',
          type: 'news',
          title: 'Federal Reserve Hints at Rate Cut Possibility',
          description: 'The Federal Reserve signaled potential interest rate cuts in response to economic indicators showing cooling inflation.',
          contentUrl: 'https://example.com/fed-rate-cut',
          imageUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400',
          metadata: {},
          createdAt: new Date(),
          priority: 92,
          tags: ['federal-reserve', 'interest-rates', 'economy'],
          engagement: { views: 3200, saves: 234, shares: 67 }
        },
        {
          id: 'news-2',
          type: 'news',
          title: 'Tech Stocks Rally on AI Investment News',
          description: 'Major technology companies see stock price increases following announcements of increased AI research spending.',
          contentUrl: 'https://example.com/tech-ai-rally',
          imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400',
          metadata: {},
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
          priority: 87,
          tags: ['technology', 'artificial-intelligence', 'stocks'],
          engagement: { views: 2780, saves: 189, shares: 52 }
        },
        {
          id: 'news-3',
          type: 'news',
          title: 'Energy Sector Shows Strong Q4 Performance',
          description: 'Oil and gas companies report better-than-expected earnings for the fourth quarter.',
          contentUrl: 'https://example.com/energy-q4-earnings',
          imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400',
          metadata: {},
          createdAt: new Date(Date.now() - 5400000), // 1.5 hours ago
          priority: 75,
          tags: ['energy', 'oil', 'earnings'],
          engagement: { views: 1950, saves: 123, shares: 34 }
        }
      ],
      podcast: [
        {
          id: 'podcast-1',
          type: 'podcast',
          title: 'Weekly Market Outlook',
          description: 'This week\'s analysis of market trends, economic indicators, and investment opportunities.',
          contentUrl: 'https://example.com/podcast-weekly-outlook.mp3',
          imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
          metadata: {
            weekNumber: 'Week 45',
          },
          createdAt: new Date(),
          priority: 85,
          tags: ['market-analysis', 'weekly', 'podcast'],
          engagement: { views: 1450, saves: 98, shares: 25 }
        },
        {
          id: 'podcast-2',
          type: 'podcast',
          title: 'Investment Strategies for Beginners',
          description: 'Expert advice on building a solid investment portfolio from the ground up.',
          contentUrl: 'https://example.com/podcast-beginner-strategies.mp3',
          imageUrl: 'https://images.unsplash.com/photo-1559526324-c1f6730c2c44?w=400',
          metadata: {
            weekNumber: 'Week 44',
          },
          createdAt: new Date(Date.now() - 604800000), // 1 week ago
          priority: 78,
          tags: ['investment', 'beginner', 'strategies'],
          engagement: { views: 1230, saves: 87, shares: 19 }
        }
      ],
      crypto: [
        {
          id: 'crypto-1',
          type: 'crypto',
          title: 'Bitcoin (BTC)',
          description: 'Bitcoin price update - Current: $43,250.00 (+3.2%)',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400',
          metadata: {
            symbol: 'BTC',
          },
          createdAt: new Date(),
          priority: 90,
          tags: ['bitcoin', 'cryptocurrency', 'digital-assets'],
          engagement: { views: 2800, saves: 198, shares: 56 }
        },
        {
          id: 'crypto-2',
          type: 'crypto',
          title: 'Ethereum (ETH)',
          description: 'Ethereum market analysis - Current: $2,680.45 (+1.8%)',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400',
          metadata: {
            symbol: 'ETH',
          },
          createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
          priority: 85,
          tags: ['ethereum', 'cryptocurrency', 'smart-contracts'],
          engagement: { views: 2350, saves: 167, shares: 43 }
        }
      ],
      challenge: [
        {
          id: 'challenge-1',
          type: 'challenge',
          title: '30-Day Investment Challenge',
          description: 'Join our month-long challenge to build better investment habits and learn key concepts.',
          contentUrl: undefined,
          imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400',
          metadata: {
            endDate: new Date(Date.now() + 2592000000), // 30 days from now
          },
          createdAt: new Date(),
          priority: 95,
          tags: ['challenge', 'investment', 'education'],
          engagement: { views: 3200, saves: 456, shares: 89 }
        }
      ]
    };

    const cards = mockCards[type] || [];
    return cards.slice(0, limit);
  }

  // Create a new card
  async createCard(cardData: UnifiedCard): Promise<string> {
    try {
      const docRef = await this.db.collection('cards').add({
        ...cardData,
        createdAt: this.db.FieldValue.serverTimestamp(),
        metadata: {
          ...cardData.metadata,
          endDate: cardData.metadata.endDate ? this.db.FieldValue.serverTimestamp() : undefined,
        },
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating card:', error);
      throw error;
    }
  }

  // Update card engagement
  async updateCardEngagement(cardId: string, action: 'view' | 'save' | 'share'): Promise<void> {
    try {
      const cardRef = this.db.collection('cards').doc(cardId);
      await cardRef.update({
        [`engagement.${action}s`]: this.db.FieldValue.increment(1),
      });
    } catch (error) {
      console.error('Error updating card engagement:', error);
      throw error;
    }
  }

  // Delete a card
  async deleteCard(cardId: string): Promise<void> {
    try {
      await this.db.collection('cards').doc(cardId).delete();
    } catch (error) {
      console.error('Error deleting card:', error);
      throw error;
    }
  }

  // Search cards
  async searchCards(query: string, filters?: SearchFilters): Promise<UnifiedCard[]> {
    try {
      let cardsRef = this.db.collection('cards');

      // Apply type filter
      if (filters?.type && filters.type.length > 0) {
        cardsRef = cardsRef.where('type', 'in', filters.type);
      }

      // Apply tags filter
      if (filters?.tags && filters.tags.length > 0) {
        cardsRef = cardsRef.where('tags', 'array-contains-any', filters.tags);
      }

      // Apply difficulty filter for lessons
      if (filters?.difficulty && filters.difficulty.length > 0) {
        cardsRef = cardsRef.where('metadata.difficulty', 'in', filters.difficulty);
      }

      // Apply date range filter
      if (filters?.dateRange) {
        cardsRef = cardsRef
          .where('createdAt', '>=', filters.dateRange.start)
          .where('createdAt', '<=', filters.dateRange.end);
      }

      const snapshot = await cardsRef
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      let cards = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        metadata: {
          ...doc.data().metadata,
          endDate: doc.data().metadata?.endDate?.toDate(),
        },
      }));

      // Apply text search if query provided
      if (query) {
        const searchQuery = query.toLowerCase();
        cards = cards.filter((card: UnifiedCard) =>
          card.title.toLowerCase().includes(searchQuery) ||
          card.description.toLowerCase().includes(searchQuery) ||
          card.tags.some(tag => tag.toLowerCase().includes(searchQuery))
        );
      }

      return cards;
    } catch (error) {
      console.error('Error searching cards:', error);
      return [];
    }
  }

  // Helper methods for priority calculation
  private calculateLessonPriority(lessonData: LessonData): number {
    let priority = 50; // base priority
    
    // Higher priority for advanced lessons
    if (lessonData.difficulty === 'advanced') priority += 20;
    else if (lessonData.difficulty === 'intermediate') priority += 10;
    
    // Higher priority for later stages
    priority += lessonData.stage * 2;
    
    return Math.min(100, priority);
  }

  private calculatePodcastPriority(podcastData: PodcastData): number {
    let priority = 40; // base priority for podcasts
    
    // Higher priority for recent podcasts
    const weekNumber = parseInt(podcastData.weekNumber);
    if (!isNaN(weekNumber)) {
      priority += Math.min(20, weekNumber);
    }
    
    return Math.min(100, priority);
  }

  private calculateMarketPriority(marketData: MarketData): number {
    let priority = 60; // base priority for market data
    
    // Higher priority for significant price movements
    const absChange = Math.abs(marketData.changePercentage);
    if (absChange > 10) priority += 20;
    else if (absChange > 5) priority += 10;
    
    // Higher priority for stocks over crypto
    if (marketData.type === 'stock') priority += 10;
    
    return Math.min(100, priority);
  }

  private calculateNewsPriority(newsData: NewsData): number {
    let priority = 50; // base priority for news
    
    // Higher priority for positive/negative sentiment
    if (newsData.sentiment === 'positive' || newsData.sentiment === 'negative') {
      priority += 15;
    }
    
    // Higher priority for news with tickers
    if (newsData.tickers && newsData.tickers.length > 0) {
      priority += 10;
    }
    
    return Math.min(100, priority);
  }

  private calculateChallengePriority(challengeData: ChallengeData): number {
    let priority = 70; // base priority for challenges
    
    // Higher priority for challenges ending soon
    const daysUntilEnd = Math.ceil((challengeData.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilEnd <= 1) priority += 20;
    else if (daysUntilEnd <= 3) priority += 10;
    
    return Math.min(100, priority);
  }

  // Calculate distribution based on user preferences
  private calculatePreferenceBasedDistribution(preferences: UserPreferences, limit: number) {
    const baseDistribution = {
      lessons: Math.ceil(limit * 0.3),
      stocks: Math.ceil(limit * 0.25),
      news: Math.ceil(limit * 0.2),
      podcasts: Math.ceil(limit * 0.15),
      crypto: Math.ceil(limit * 0.05),
      challenges: Math.ceil(limit * 0.05)
    };

    // Adjust based on favorite content types
    const favoriteTypes = preferences.favoriteContentTypes;
    if (favoriteTypes.length > 0) {
      // Boost favorite types by 50%
      favoriteTypes.forEach(type => {
        switch (type) {
          case 'lesson':
            baseDistribution.lessons = Math.ceil(baseDistribution.lessons * 1.5);
            break;
          case 'stock':
            baseDistribution.stocks = Math.ceil(baseDistribution.stocks * 1.5);
            break;
          case 'news':
            baseDistribution.news = Math.ceil(baseDistribution.news * 1.5);
            break;
          case 'podcast':
            baseDistribution.podcasts = Math.ceil(baseDistribution.podcasts * 1.5);
            break;
          case 'crypto':
            baseDistribution.crypto = Math.ceil(baseDistribution.crypto * 1.5);
            break;
          case 'challenge':
            baseDistribution.challenges = Math.ceil(baseDistribution.challenges * 1.5);
            break;
        }
      });
    }

    // Normalize to ensure we don't exceed limit
    const total = Object.values(baseDistribution).reduce((sum, val) => sum + val, 0);
    if (total > limit) {
      const factor = limit / total;
      Object.keys(baseDistribution).forEach(key => {
        baseDistribution[key as keyof typeof baseDistribution] = Math.ceil(
          baseDistribution[key as keyof typeof baseDistribution] * factor
        );
      });
    }

    return baseDistribution;
  }

  // Filter cards based on user preferences
  private filterCardsByPreferences(cards: UnifiedCard[], preferences: UserPreferences): UnifiedCard[] {
    return cards.filter(card => {
      // Filter by preferred difficulty for lessons
      if (card.type === 'lesson' && card.metadata.difficulty) {
        if (preferences.preferredDifficulty && card.metadata.difficulty !== preferences.preferredDifficulty) {
          // Still include some non-preferred difficulty cards (20% chance)
          return Math.random() < 0.2;
        }
      }

      // Filter by preferred sectors for stocks
      if ((card.type === 'stock' || card.type === 'crypto') && card.metadata.sector) {
        if (preferences.preferredSectors.length > 0 && !preferences.preferredSectors.includes(card.metadata.sector)) {
          // Still include some non-preferred sector cards (30% chance)
          return Math.random() < 0.3;
        }
      }

      return true;
    });
  }

  // Sort cards by preference scores
  private sortCardsByPreferences(cards: UnifiedCard[], preferences: UserPreferences): UnifiedCard[] {
    return cards.sort((a, b) => {
      const scoreA = this.calculateCardPreferenceScore(a, preferences);
      const scoreB = this.calculateCardPreferenceScore(b, preferences);
      return scoreB - scoreA;
    });
  }

  // Calculate preference score for a card
  private calculateCardPreferenceScore(card: UnifiedCard, preferences: UserPreferences): number {
    let score = card.priority; // Base priority

    // Boost score for favorite content types
    if (preferences.favoriteContentTypes.includes(card.type)) {
      score += 20;
    }

    // Boost score for preferred difficulty
    if (card.type === 'lesson' && card.metadata.difficulty === preferences.preferredDifficulty) {
      score += 15;
    }

    // Boost score for preferred sectors
    if (card.metadata.sector && preferences.preferredSectors.includes(card.metadata.sector)) {
      score += 10;
    }

    // Apply confidence factor
    score *= preferences.confidence;

    return score;
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

// Export singleton instance
export const cardService = new CardService();
