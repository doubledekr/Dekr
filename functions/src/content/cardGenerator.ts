import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin (should already be initialized in index.ts)
const db = admin.firestore();

// Types for card generation
interface LessonData {
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

interface PodcastData {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  weekNumber: string;
  segments?: any[];
  thumbnailUrl?: string;
  tags?: string[];
}

interface MarketData {
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

interface NewsData {
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

interface UnifiedCard {
  id: string;
  type: 'lesson' | 'podcast' | 'news' | 'stock' | 'crypto' | 'challenge';
  title: string;
  description: string;
  contentUrl?: string;
  imageUrl?: string;
  metadata: {
    symbol?: string;
    stage?: number;
    weekNumber?: string;
    difficulty?: string;
    endDate?: admin.firestore.Timestamp;
    sector?: string;
  };
  createdAt: admin.firestore.Timestamp;
  priority: number;
  tags: string[];
  engagement: {
    views: number;
    saves: number;
    shares: number;
  };
}

// Helper function to check for duplicate cards
async function checkForDuplicateCard(contentId: string, type: string): Promise<boolean> {
  try {
    const snapshot = await db
      .collection('cards')
      .where('id', '==', `${type}_${contentId}`)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking for duplicate card:', error);
    return false;
  }
}

// Helper function to calculate priority
function calculatePriority(type: string, data: any): number {
  switch (type) {
    case 'lesson':
      let lessonPriority = 50;
      if (data.difficulty === 'advanced') lessonPriority += 20;
      else if (data.difficulty === 'intermediate') lessonPriority += 10;
      lessonPriority += data.stage * 2;
      return Math.min(100, lessonPriority);
    
    case 'podcast':
      let podcastPriority = 40;
      const weekNumber = parseInt(data.weekNumber);
      if (!isNaN(weekNumber)) {
        podcastPriority += Math.min(20, weekNumber);
      }
      return Math.min(100, podcastPriority);
    
    case 'stock':
    case 'crypto':
      let marketPriority = 60;
      const absChange = Math.abs(data.changePercentage || 0);
      if (absChange > 10) marketPriority += 20;
      else if (absChange > 5) marketPriority += 10;
      if (data.type === 'stock') marketPriority += 10;
      return Math.min(100, marketPriority);
    
    case 'news':
      let newsPriority = 50;
      if (data.sentiment === 'positive' || data.sentiment === 'negative') {
        newsPriority += 15;
      }
      if (data.tickers && data.tickers.length > 0) {
        newsPriority += 10;
      }
      return Math.min(100, newsPriority);
    
    default:
      return 50;
  }
}

// Generate card from lesson data
function generateLessonCard(lessonData: LessonData): UnifiedCard {
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
    createdAt: admin.firestore.Timestamp.now(),
    priority: calculatePriority('lesson', lessonData),
    tags: lessonData.tags || ['education', 'trading'],
    engagement: {
      views: 0,
      saves: 0,
      shares: 0,
    },
  };
}

// Generate card from podcast data
function generatePodcastCard(podcastData: PodcastData): UnifiedCard {
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
    createdAt: admin.firestore.Timestamp.now(),
    priority: calculatePriority('podcast', podcastData),
    tags: podcastData.tags || ['podcast', 'community'],
    engagement: {
      views: 0,
      saves: 0,
      shares: 0,
    },
  };
}

// Generate card from market data
function generateMarketCard(marketData: MarketData): UnifiedCard {
  return {
    id: `${marketData.type}_${marketData.id}`,
    type: marketData.type,
    title: marketData.name,
    description: `${marketData.symbol} - Current price: $${marketData.price.toFixed(2)} (${marketData.changePercentage >= 0 ? '+' : ''}${marketData.changePercentage.toFixed(2)}%)`,
    metadata: {
      symbol: marketData.symbol,
      sector: marketData.sector,
    },
    createdAt: admin.firestore.Timestamp.now(),
    priority: calculatePriority(marketData.type, marketData),
    tags: marketData.tags || [marketData.type, marketData.sector || 'general'],
    engagement: {
      views: 0,
      saves: 0,
      shares: 0,
    },
  };
}

// Generate card from news data
function generateNewsCard(newsData: NewsData): UnifiedCard {
  return {
    id: `news_${newsData.id}`,
    type: 'news',
    title: newsData.headline,
    description: newsData.content.substring(0, 200) + (newsData.content.length > 200 ? '...' : ''),
    contentUrl: newsData.url,
    imageUrl: newsData.imageUrl,
    metadata: {},
    createdAt: admin.firestore.Timestamp.fromMillis(newsData.timestamp),
    priority: calculatePriority('news', newsData),
    tags: newsData.tags || ['news', 'market', ...(newsData.tickers || [])],
    engagement: {
      views: 0,
      saves: 0,
      shares: 0,
    },
  };
}

// Firestore trigger for education content creation
export const onEducationContentCreate = functions.firestore
  .document('educationContent/{contentId}')
  .onCreate(async (snapshot, context) => {
    try {
      const contentId = context.params.contentId;
      const lessonData = snapshot.data() as LessonData;
      
      // Check for duplicate
      const isDuplicate = await checkForDuplicateCard(contentId, 'lesson');
      if (isDuplicate) {
        console.log(`Lesson card already exists for content ${contentId}`);
        return;
      }
      
      // Generate and save card
      const card = generateLessonCard({ ...lessonData, id: contentId });
      await db.collection('cards').doc(card.id).set(card);
      
      console.log(`Created lesson card for content ${contentId}`);
    } catch (error) {
      console.error('Error creating lesson card:', error);
    }
  });

// Firestore trigger for community podcast creation
export const onCommunityPodcastCreate = functions.firestore
  .document('communityPodcasts/{podcastId}')
  .onCreate(async (snapshot, context) => {
    try {
      const podcastId = context.params.podcastId;
      const podcastData = snapshot.data() as PodcastData;
      
      // Check for duplicate
      const isDuplicate = await checkForDuplicateCard(podcastId, 'podcast');
      if (isDuplicate) {
        console.log(`Podcast card already exists for podcast ${podcastId}`);
        return;
      }
      
      // Generate and save card
      const card = generatePodcastCard({ ...podcastData, id: podcastId });
      await db.collection('cards').doc(card.id).set(card);
      
      console.log(`Created podcast card for podcast ${podcastId}`);
    } catch (error) {
      console.error('Error creating podcast card:', error);
    }
  });

// Scheduled function to generate daily market cards
export const generateDailyMarketCards = functions.pubsub
  .schedule('0 9 * * *') // 9 AM EST daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Starting daily market card generation...');
      
      // Get trending symbols from Polygon API
      const trendingSymbols = await getTrendingSymbols();
      
      for (const symbol of trendingSymbols) {
        try {
          // Get market data for symbol
          const marketData = await getMarketData(symbol);
          
          if (marketData) {
            // Check for duplicate
            const isDuplicate = await checkForDuplicateCard(marketData.id, marketData.type);
            if (!isDuplicate) {
              // Generate and save card
              const card = generateMarketCard(marketData);
              await db.collection('cards').doc(card.id).set(card);
              console.log(`Created market card for ${symbol}`);
            }
          }
        } catch (error) {
          console.error(`Error processing market data for ${symbol}:`, error);
        }
      }
      
      console.log('Daily market card generation completed');
    } catch (error) {
      console.error('Error in daily market card generation:', error);
    }
  });

// Scheduled function to generate daily news cards
export const generateDailyNewsCards = functions.pubsub
  .schedule('0 6 * * *') // 6 AM EST daily
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      console.log('Starting daily news card generation...');
      
      // Get news from various feeds
      const newsItems = await getDailyNews();
      
      for (const newsItem of newsItems) {
        try {
          // Check for duplicate
          const isDuplicate = await checkForDuplicateCard(newsItem.id, 'news');
          if (!isDuplicate) {
            // Generate and save card
            const card = generateNewsCard(newsItem);
            await db.collection('cards').doc(card.id).set(card);
            console.log(`Created news card for ${newsItem.id}`);
          }
        } catch (error) {
          console.error(`Error processing news item ${newsItem.id}:`, error);
        }
      }
      
      console.log('Daily news card generation completed');
    } catch (error) {
      console.error('Error in daily news card generation:', error);
    }
  });

// Helper function to get trending symbols (mock implementation)
async function getTrendingSymbols(): Promise<string[]> {
  // In a real implementation, this would call the Polygon API
  // For now, return a mock list of trending symbols
  return ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META', 'NFLX'];
}

// Helper function to get market data (mock implementation)
async function getMarketData(symbol: string): Promise<MarketData | null> {
  // In a real implementation, this would call the Polygon API
  // For now, return mock data
  const mockData: { [key: string]: MarketData } = {
    'AAPL': {
      id: 'AAPL',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.50,
      changePercentage: 2.5,
      type: 'stock',
      sector: 'Technology',
      marketCap: 2800000000000,
      volume: 50000000,
      tags: ['technology', 'large-cap', 'dividend'],
    },
    'TSLA': {
      id: 'TSLA',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 250.75,
      changePercentage: -1.2,
      type: 'stock',
      sector: 'Automotive',
      marketCap: 800000000000,
      volume: 30000000,
      tags: ['automotive', 'electric-vehicles', 'growth'],
    },
    // Add more mock data as needed
  };
  
  return mockData[symbol] || null;
}

// Helper function to get daily news (mock implementation)
async function getDailyNews(): Promise<NewsData[]> {
  // In a real implementation, this would call news APIs
  // For now, return mock news data
  return [
    {
      id: 'news_1',
      headline: 'Market Opens Higher on Positive Economic Data',
      content: 'The stock market opened higher today following the release of positive economic indicators...',
      source: 'Financial Times',
      url: 'https://example.com/news/1',
      timestamp: Date.now(),
      sentiment: 'positive',
      tickers: ['SPY', 'QQQ'],
      tags: ['market', 'economy', 'positive'],
    },
    {
      id: 'news_2',
      headline: 'Tech Stocks Face Pressure from Regulatory Concerns',
      content: 'Technology stocks are under pressure today as regulatory concerns mount...',
      source: 'Wall Street Journal',
      url: 'https://example.com/news/2',
      timestamp: Date.now(),
      sentiment: 'negative',
      tickers: ['AAPL', 'GOOGL', 'MSFT'],
      tags: ['technology', 'regulation', 'negative'],
    },
  ];
}

// Manual card generation functions (for admin use)
export const generateLessonCardManually = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    const { contentId } = data;
    if (!contentId) {
      throw new functions.https.HttpsError('invalid-argument', 'contentId is required');
    }
    
    // Get lesson data
    const lessonDoc = await db.collection('educationContent').doc(contentId).get();
    if (!lessonDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Lesson not found');
    }
    
    const lessonData = lessonDoc.data() as LessonData;
    
    // Check for duplicate
    const isDuplicate = await checkForDuplicateCard(contentId, 'lesson');
    if (isDuplicate) {
      throw new functions.https.HttpsError('already-exists', 'Card already exists');
    }
    
    // Generate and save card
    const card = generateLessonCard({ ...lessonData, id: contentId });
    await db.collection('cards').doc(card.id).set(card);
    
    return { success: true, cardId: card.id };
  } catch (error) {
    console.error('Error in manual lesson card generation:', error);
    throw error;
  }
});

export const generatePodcastCardManually = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  try {
    const { podcastId } = data;
    if (!podcastId) {
      throw new functions.https.HttpsError('invalid-argument', 'podcastId is required');
    }
    
    // Get podcast data
    const podcastDoc = await db.collection('communityPodcasts').doc(podcastId).get();
    if (!podcastDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Podcast not found');
    }
    
    const podcastData = podcastDoc.data() as PodcastData;
    
    // Check for duplicate
    const isDuplicate = await checkForDuplicateCard(podcastId, 'podcast');
    if (isDuplicate) {
      throw new functions.https.HttpsError('already-exists', 'Card already exists');
    }
    
    // Generate and save card
    const card = generatePodcastCard({ ...podcastData, id: podcastId });
    await db.collection('cards').doc(card.id).set(card);
    
    return { success: true, cardId: card.id };
  } catch (error) {
    console.error('Error in manual podcast card generation:', error);
    throw error;
  }
});
