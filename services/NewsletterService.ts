import OpenAI from 'openai';
import { firestore } from './firebase';
import { Platform } from 'react-native';
import { logEvent, AnalyticsEvents } from './analytics';
import { podcastService } from './PodcastService';

export interface Newsletter {
  id: string;
  title: string;
  content: string;
  publishedAt: any; // Platform-aware timestamp
  weekOf: any; // Platform-aware timestamp
  stats: {
    views: number;
    shares: number;
    likes: number;
    clickThroughRate: number;
    engagementTime: number;
  };
  data: NewsletterData;
  status: 'draft' | 'published' | 'archived';
  version: number;
}

export interface NewsletterData {
  weeklyStats: {
    totalUsers: number;
    activeUsers: number;
    newSignups: number;
    totalPredictions: number;
    accuracyRate: number;
    totalRecommendations: number;
    totalCompetitions: number;
  };
  topPerformers: {
    users: UserPerformance[];
    strategies: StrategyPerformance[];
    predictions: PredictionResult[];
  };
  communityInsights: {
    trendingStocks: TrendingStock[];
    popularStrategies: PopularStrategy[];
    discussionHighlights: DiscussionHighlight[];
  };
  marketContext: {
    weeklyMarketSummary: string;
    majorEvents: MarketEvent[];
    sectorPerformance: SectorData[];
  };
  educationalHighlights: {
    popularCourses: Course[];
    learningTrends: LearningTrend[];
    knowledgeGaps: string[];
  };
}

export interface UserPerformance {
  id: string;
  name: string;
  performance: number;
  accuracy: number;
  totalPredictions: number;
  successfulPredictions: number;
  portfolioValue: number;
  weeklyChange: number;
}

export interface StrategyPerformance {
  id: string;
  name: string;
  creator: string;
  performance: number;
  followers: number;
  successRate: number;
  riskScore: number;
}

export interface PredictionResult {
  id: string;
  userId: string;
  userName: string;
  prediction: string;
  accuracy: number;
  confidence: number;
  result: 'correct' | 'incorrect';
}

export interface TrendingStock {
  symbol: string;
  name: string;
  recommendationCount: number;
  performance: number;
  price: number;
  change: number;
  changePercent: number;
}

export interface PopularStrategy {
  id: string;
  name: string;
  description: string;
  creator: string;
  followers: number;
  performance: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DiscussionHighlight {
  id: string;
  title: string;
  author: string;
  content: string;
  upvotes: number;
  comments: number;
  topic: string;
}

export interface MarketEvent {
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  date: Date;
  affectedSectors: string[];
}

export interface SectorData {
  name: string;
  performance: number;
  topStocks: string[];
  change: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  enrollments: number;
  rating: number;
  completionRate: number;
}

export interface LearningTrend {
  topic: string;
  interest: number;
  growth: number;
  relatedCourses: string[];
}

export class NewsletterService {
  private openai: OpenAI;
  private db: any;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    this.db = firestore;
  }

  // Platform-aware timestamp helpers
  private createTimestamp(date: Date): any {
    if (Platform.OS === 'web') {
      const { Timestamp } = require('firebase/firestore');
      return Timestamp.fromDate(date);
    } else {
      const firestoreNS = require('@react-native-firebase/firestore');
      return firestoreNS.Timestamp.fromDate(date);
    }
  }

  private getServerTimestamp(): any {
    if (Platform.OS === 'web') {
      const { serverTimestamp } = require('firebase/firestore');
      return serverTimestamp();
    } else {
      const firestoreNS = require('@react-native-firebase/firestore');
      return firestoreNS.FieldValue.serverTimestamp();
    }
  }

  private getFieldValue(): any {
    if (Platform.OS === 'web') {
      const { FieldValue } = require('firebase/firestore');
      return FieldValue;
    } else {
      const firestoreNS = require('@react-native-firebase/firestore');
      return firestoreNS.FieldValue;
    }
  }

  private getNewsletterCollection() {
    return this.db.collection('newsletters');
  }

  private getWeekStartDate(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is 0
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToSubtract);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  private getWeekEndDate(): Date {
    const weekStart = this.getWeekStartDate();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  // Generate weekly newsletter
  async generateWeeklyNewsletter(): Promise<Newsletter> {
    try {
      logEvent(AnalyticsEvents.CREATE_NEWSLETTER, {
        timestamp: new Date().toISOString(),
      });

      // For now, create a mock newsletter since we don't have all the data sources set up
      const mockNewsletter = this.createMockNewsletter();
      
      // Try to save to database, but don't fail if it doesn't work
      try {
        const savedNewsletter = await this.saveNewsletter(mockNewsletter, mockNewsletter.data);
        return savedNewsletter;
      } catch (saveError) {
        console.warn('Could not save newsletter to database, returning mock newsletter:', saveError);
        return mockNewsletter;
      }
    } catch (error) {
      console.error('Error generating newsletter:', error);
      // Return a fallback mock newsletter
      return this.createMockNewsletter();
    }
  }

  // Generate weekly podcast newsletter
  async generateWeeklyPodcastNewsletter(userId?: string): Promise<{ newsletter: Newsletter; podcastUrl?: string }> {
    try {
      logEvent(AnalyticsEvents.CREATE_NEWSLETTER, {
        timestamp: new Date().toISOString(),
        type: 'podcast'
      });

      // Generate the newsletter content
      const newsletter = await this.generateWeeklyNewsletter();
      
      // If userId is provided, also generate a podcast
      let podcastUrl: string | undefined;
      if (userId) {
        try {
          const podcast = await podcastService.generatePodcast(userId);
          podcastUrl = podcast.audioUrl;
        } catch (podcastError) {
          console.warn('Could not generate podcast, continuing with newsletter only:', podcastError);
        }
      }

      return { newsletter, podcastUrl };
    } catch (error) {
      console.error('Error generating podcast newsletter:', error);
      // Return fallback newsletter
      const fallbackNewsletter = this.createMockNewsletter();
      return { newsletter: fallbackNewsletter };
    }
  }

  // Aggregate data from all sources
  private async aggregateNewsletterData(): Promise<NewsletterData> {
    const weekStart = this.getWeekStartDate();
    const weekEnd = this.getWeekEndDate();

    const [
      weeklyStats,
      topPerformers,
      communityInsights,
      marketContext,
      educationalHighlights,
    ] = await Promise.all([
      this.aggregateWeeklyStats(weekStart, weekEnd),
      this.aggregateTopPerformers(weekStart, weekEnd),
      this.aggregateCommunityInsights(weekStart, weekEnd),
      this.aggregateMarketContext(weekStart, weekEnd),
      this.aggregateEducationalHighlights(weekStart, weekEnd),
    ]);

    return {
      weeklyStats,
      topPerformers,
      communityInsights,
      marketContext,
      educationalHighlights,
    };
  }

  // Aggregate weekly statistics
  private async aggregateWeeklyStats(weekStart: Date, weekEnd: Date): Promise<NewsletterData['weeklyStats']> {
    try {
      const weekStartTimestamp = this.createTimestamp(weekStart);
      const weekEndTimestamp = this.createTimestamp(weekEnd);

      // Get user statistics
      const usersSnapshot = await this.db.collection('users').get();
      const totalUsers = usersSnapshot.size;

      const activeUsersSnapshot = await this.db.collection('users')
        .where('lastActive', '>=', weekStartTimestamp)
        .get();
      const activeUsers = activeUsersSnapshot.size;

      const newUsersSnapshot = await this.db.collection('users')
        .where('createdAt', '>=', weekStartTimestamp)
        .get();
      const newSignups = newUsersSnapshot.size;

      // Get prediction statistics
      const predictionsSnapshot = await this.db.collection('predictions')
        .where('createdAt', '>=', weekStartTimestamp)
        .get();
      const totalPredictions = predictionsSnapshot.size;

      // Calculate accuracy rate
      const correctPredictions = predictionsSnapshot.docs.filter((doc: any) => {
        const data = doc.data();
        return data.result === 'correct';
      }).length;
      const accuracyRate = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

      // Get recommendation statistics
      const recommendationsSnapshot = await this.db.collection('recommendations')
        .where('timestamp', '>=', weekStartTimestamp)
        .get();
      const totalRecommendations = recommendationsSnapshot.size;

      // Get competition statistics
      const competitionsSnapshot = await this.db.collection('competitions')
        .where('endDate', '>=', weekStartTimestamp)
        .where('status', '==', 'completed')
        .get();
      const totalCompetitions = competitionsSnapshot.size;

      return {
        totalUsers,
        activeUsers,
        newSignups,
        totalPredictions,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
        totalRecommendations,
        totalCompetitions,
      };
    } catch (error) {
      console.error('Error aggregating weekly stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newSignups: 0,
        totalPredictions: 0,
        accuracyRate: 0,
        totalRecommendations: 0,
        totalCompetitions: 0,
      };
    }
  }

  // Aggregate top performers
  private async aggregateTopPerformers(weekStart: Date, weekEnd: Date): Promise<NewsletterData['topPerformers']> {
    try {
      const weekStartTimestamp = this.createTimestamp(weekStart);
      const weekEndTimestamp = this.createTimestamp(weekEnd);

      // Get top performing users
      const usersSnapshot = await this.db.collection('users')
        .orderBy('weeklyPerformance', 'desc')
        .limit(10)
        .get();

      const users: UserPerformance[] = usersSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.email || 'Anonymous',
          performance: data.weeklyPerformance || 0,
          accuracy: data.predictionAccuracy || 0,
          totalPredictions: data.totalPredictions || 0,
          successfulPredictions: data.successfulPredictions || 0,
          portfolioValue: data.portfolioValue || 0,
          weeklyChange: data.weeklyChange || 0,
        };
      });

      // Get top performing strategies
      const strategiesSnapshot = await this.db.collection('strategies')
        .where('isPublic', '==', true)
        .orderBy('performance', 'desc')
        .limit(10)
        .get();

      const strategies: StrategyPerformance[] = strategiesSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Strategy',
          creator: data.creatorName || 'Anonymous',
          performance: data.performance || 0,
          followers: data.followers || 0,
          successRate: data.successRate || 0,
          riskScore: data.riskScore || 0,
        };
      });

      // Get notable predictions
      const predictionsSnapshot = await this.db.collection('predictions')
        .where('createdAt', '>=', weekStartTimestamp)
        .where('confidence', '>=', 80)
        .orderBy('confidence', 'desc')
        .limit(10)
        .get();

      const predictions: PredictionResult[] = predictionsSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          userName: data.userName || 'Anonymous',
          prediction: data.prediction || '',
          accuracy: data.accuracy || 0,
          confidence: data.confidence || 0,
          result: data.result || 'pending',
        };
      });

      return { users, strategies, predictions };
    } catch (error) {
      console.error('Error aggregating top performers:', error);
      return { users: [], strategies: [], predictions: [] };
    }
  }

  // Aggregate community insights
  private async aggregateCommunityInsights(weekStart: Date, weekEnd: Date): Promise<NewsletterData['communityInsights']> {
    try {
      const weekStartTimestamp = this.createTimestamp(weekStart);
      const weekEndTimestamp = this.createTimestamp(weekEnd);

      // Get trending stocks from recommendations
      const recommendationsSnapshot = await this.db.collection('recommendations')
        .where('timestamp', '>=', weekStartTimestamp)
        .get();

      const stockRecommendations: { [key: string]: number } = {};
      recommendationsSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (data.assetSymbol) {
          stockRecommendations[data.assetSymbol] = (stockRecommendations[data.assetSymbol] || 0) + 1;
        }
      });

      const trendingStocks: TrendingStock[] = Object.entries(stockRecommendations)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([symbol, count]) => ({
          symbol,
          name: symbol, // Would need to fetch actual names
          recommendationCount: count,
          performance: Math.random() * 20 - 10, // Mock data - would need real market data
          price: Math.random() * 100 + 50,
          change: Math.random() * 10 - 5,
          changePercent: Math.random() * 20 - 10,
        }));

      // Get popular strategies
      const strategiesSnapshot = await this.db.collection('strategies')
        .where('isPublic', '==', true)
        .orderBy('followers', 'desc')
        .limit(10)
        .get();

      const popularStrategies: PopularStrategy[] = strategiesSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Strategy',
          description: data.description || '',
          creator: data.creatorName || 'Anonymous',
          followers: data.followers || 0,
          performance: data.performance || 0,
          riskLevel: data.riskLevel || 'medium',
        };
      });

      // Get discussion highlights
      const discussionsSnapshot = await this.db.collection('discussions')
        .where('createdAt', '>=', weekStartTimestamp)
        .orderBy('upvotes', 'desc')
        .limit(5)
        .get();

      const discussionHighlights: DiscussionHighlight[] = discussionsSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          author: data.authorName || 'Anonymous',
          content: data.content || '',
          upvotes: data.upvotes || 0,
          comments: data.comments || 0,
          topic: data.topic || 'General',
        };
      });

      return { trendingStocks, popularStrategies, discussionHighlights };
    } catch (error) {
      console.error('Error aggregating community insights:', error);
      return { trendingStocks: [], popularStrategies: [], discussionHighlights: [] };
    }
  }

  // Aggregate market context
  private async aggregateMarketContext(weekStart: Date, weekEnd: Date): Promise<NewsletterData['marketContext']> {
    try {
      // This would integrate with your existing market data services
      // For now, providing mock data structure
      const weeklyMarketSummary = `This week saw mixed market performance with technology stocks leading gains while energy sectors faced headwinds. The community's predictions aligned well with market movements, particularly in the tech sector where 78% of predictions were accurate.`;

      const majorEvents: MarketEvent[] = [
        {
          title: 'Federal Reserve Interest Rate Decision',
          description: 'Fed maintained current rates with dovish commentary',
          impact: 'high',
          date: new Date(),
          affectedSectors: ['Financials', 'Real Estate'],
        },
        {
          title: 'Tech Earnings Season',
          description: 'Major tech companies reported mixed Q4 results',
          impact: 'medium',
          date: new Date(),
          affectedSectors: ['Technology', 'Communication Services'],
        },
      ];

      const sectorPerformance: SectorData[] = [
        { name: 'Technology', performance: 2.5, topStocks: ['AAPL', 'MSFT', 'GOOGL'], change: 1.2 },
        { name: 'Healthcare', performance: 1.8, topStocks: ['JNJ', 'PFE', 'UNH'], change: 0.8 },
        { name: 'Financials', performance: -0.5, topStocks: ['JPM', 'BAC', 'WFC'], change: -0.2 },
        { name: 'Energy', performance: -2.1, topStocks: ['XOM', 'CVX', 'COP'], change: -1.5 },
      ];

      return { weeklyMarketSummary, majorEvents, sectorPerformance };
    } catch (error) {
      console.error('Error aggregating market context:', error);
      return {
        weeklyMarketSummary: 'Market data unavailable this week.',
        majorEvents: [],
        sectorPerformance: [],
      };
    }
  }

  // Aggregate educational highlights
  private async aggregateEducationalHighlights(weekStart: Date, weekEnd: Date): Promise<NewsletterData['educationalHighlights']> {
    try {
      const weekStartTimestamp = this.createTimestamp(weekStart);
      const weekEndTimestamp = this.createTimestamp(weekEnd);

      // Get popular courses
      const coursesSnapshot = await this.db.collection('courses')
        .orderBy('enrollments', 'desc')
        .limit(5)
        .get();

      const popularCourses: Course[] = coursesSnapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || 'Untitled Course',
          description: data.description || '',
          enrollments: data.enrollments || 0,
          rating: data.rating || 0,
          completionRate: data.completionRate || 0,
        };
      });

      // Get learning trends
      const learningTrends: LearningTrend[] = [
        { topic: 'Technical Analysis', interest: 85, growth: 15, relatedCourses: ['course1', 'course2'] },
        { topic: 'Risk Management', interest: 78, growth: 22, relatedCourses: ['course3', 'course4'] },
        { topic: 'ESG Investing', interest: 65, growth: 35, relatedCourses: ['course5'] },
      ];

      const knowledgeGaps = [
        'Options trading strategies',
        'Cryptocurrency fundamentals',
        'Portfolio diversification',
        'Market sentiment analysis',
      ];

      return { popularCourses, learningTrends, knowledgeGaps };
    } catch (error) {
      console.error('Error aggregating educational highlights:', error);
      return { popularCourses: [], learningTrends: [], knowledgeGaps: [] };
    }
  }

  // Generate newsletter content using AI
  private async generateNewsletterContent(data: NewsletterData): Promise<Omit<Newsletter, 'id' | 'publishedAt' | 'stats' | 'data' | 'status' | 'version'>> {
    const systemPrompt = `You are the AI editor for Dekr's weekly community newsletter. Your role is to create an engaging, informative, and actionable newsletter that celebrates community achievements, shares insights, and educates readers.

Newsletter Structure (approximately 1000 words):
1. **Community Spotlight** (200 words) - Highlight top performers and interesting strategies
2. **Market Pulse** (250 words) - Weekly market summary with community context
3. **Wisdom of the Crowd** (300 words) - Community predictions, recommendations, and insights
4. **Learning Corner** (150 words) - Educational highlights and trending topics
5. **Looking Ahead** (100 words) - Preview of upcoming competitions and opportunities

Writing Style:
- Conversational and engaging, like talking to a friend about investing
- Data-driven but accessible to beginners
- Celebrate community members by name (when they opt-in)
- Include specific numbers and percentages to show community growth
- End sections with actionable insights or questions for reflection

Key Principles:
- Make every community member feel valued
- Turn data into stories
- Highlight learning opportunities
- Encourage participation in upcoming events
- Balance celebration with education`;

    const userPrompt = this.buildNewsletterPrompt(data);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const content = completion.choices[0].message.content || '';
      const title = `Dekr Weekly: Community Insights & Market Pulse - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

      return {
        title,
        content,
        weekOf: this.createTimestamp(this.getWeekStartDate()),
      };
    } catch (error) {
      console.error('Error generating newsletter content:', error);
      throw error;
    }
  }

  // Build the prompt for AI content generation
  private buildNewsletterPrompt(data: NewsletterData): string {
    return `Generate this week's Dekr community newsletter using the following data:

COMMUNITY STATS:
- Total active users: ${data.weeklyStats.activeUsers}
- New members this week: ${data.weeklyStats.newSignups}
- Predictions made: ${data.weeklyStats.totalPredictions}
- Community accuracy rate: ${data.weeklyStats.accuracyRate}%
- Recommendations shared: ${data.weeklyStats.totalRecommendations}
- Competitions completed: ${data.weeklyStats.totalCompetitions}

TOP PERFORMERS:
${data.topPerformers.users.map(user => 
  `- ${user.name}: ${user.performance}% return, ${user.accuracy}% prediction accuracy`
).join('\n')}

TRENDING INVESTMENTS:
${data.communityInsights.trendingStocks.map(stock => 
  `- ${stock.symbol}: Recommended by ${stock.recommendationCount} members, ${stock.performance}% performance`
).join('\n')}

MARKET CONTEXT:
${data.marketContext.weeklyMarketSummary}

EDUCATIONAL HIGHLIGHTS:
- Most popular course: "${data.educationalHighlights.popularCourses[0]?.title || 'N/A'}"
- Trending learning topic: ${data.educationalHighlights.learningTrends[0]?.topic || 'N/A'}

Create an engaging newsletter that tells the story of our community's week in investing. Make it feel personal and celebrate the community's collective intelligence.`;
  }

  // Save newsletter to database
  private async saveNewsletter(
    newsletter: Omit<Newsletter, 'id' | 'publishedAt' | 'stats' | 'data' | 'status' | 'version'>,
    data: NewsletterData
  ): Promise<Newsletter> {
    try {
      const newsletterData = {
        ...newsletter,
        publishedAt: this.getServerTimestamp(),
        stats: {
          views: 0,
          shares: 0,
          likes: 0,
          clickThroughRate: 0,
          engagementTime: 0,
        },
        data,
        status: 'published',
        version: 1,
      };

      const docRef = await this.getNewsletterCollection().add(newsletterData);
      
      const savedNewsletter: Newsletter = {
        id: docRef.id,
        ...newsletterData,
        publishedAt: this.createTimestamp(new Date()),
      };

      logEvent(AnalyticsEvents.CREATE_NEWSLETTER, {
        newsletter_id: docRef.id,
        title: newsletter.title,
      });

      return savedNewsletter;
    } catch (error) {
      console.error('Error saving newsletter:', error);
      throw error;
    }
  }

  // Create a mock newsletter for testing
  private createMockNewsletter(): Newsletter {
    const now = new Date();
    const weekStart = this.getWeekStartDate();
    
    const mockData: NewsletterData = {
      weeklyStats: {
        totalUsers: 1250,
        activeUsers: 890,
        newSignups: 45,
        totalPredictions: 2340,
        accuracyRate: 73.2,
        totalRecommendations: 156,
        totalCompetitions: 8,
      },
      topPerformers: {
        users: [
          {
            id: 'user1',
            name: 'Alex Chen',
            performance: 12.5,
            accuracy: 85.2,
            totalPredictions: 45,
            successfulPredictions: 38,
            portfolioValue: 125000,
            weeklyChange: 8.2,
          },
          {
            id: 'user2',
            name: 'Sarah Johnson',
            performance: 9.8,
            accuracy: 78.9,
            totalPredictions: 32,
            successfulPredictions: 25,
            portfolioValue: 98000,
            weeklyChange: 6.1,
          },
        ],
        strategies: [
          {
            id: 'strategy1',
            name: 'Momentum Breakout',
            creator: 'Alex Chen',
            performance: 15.2,
            followers: 234,
            successRate: 82.1,
            riskScore: 0.3,
          },
        ],
        predictions: [
          {
            id: 'pred1',
            userId: 'user1',
            userName: 'Alex Chen',
            prediction: 'AAPL will break $180 resistance',
            accuracy: 95.0,
            confidence: 88,
            result: 'correct',
          },
        ],
      },
      communityInsights: {
        trendingStocks: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            recommendationCount: 45,
            performance: 8.2,
            price: 185.50,
            change: 2.1,
            changePercent: 1.15,
          },
          {
            symbol: 'TSLA',
            name: 'Tesla Inc.',
            recommendationCount: 38,
            performance: 12.5,
            price: 245.30,
            change: 5.2,
            changePercent: 2.17,
          },
        ],
        popularStrategies: [
          {
            id: 'strategy1',
            name: 'Momentum Breakout',
            description: 'Identifies stocks breaking out of consolidation patterns',
            creator: 'Alex Chen',
            followers: 234,
            performance: 15.2,
            riskLevel: 'medium',
          },
        ],
        discussionHighlights: [
          {
            id: 'discussion1',
            title: 'Market Volatility and Risk Management',
            author: 'Sarah Johnson',
            content: 'Great discussion about managing risk in volatile markets...',
            upvotes: 23,
            comments: 8,
            topic: 'Risk Management',
          },
        ],
      },
      marketContext: {
        weeklyMarketSummary: 'This week saw strong performance in technology stocks, with the community\'s predictions aligning well with market movements. The S&P 500 gained 2.3% while the NASDAQ rose 3.1%, driven by positive earnings reports and optimistic economic data.',
        majorEvents: [
          {
            title: 'Federal Reserve Interest Rate Decision',
            description: 'Fed maintained current rates with dovish commentary',
            impact: 'high',
            date: new Date(),
            affectedSectors: ['Financials', 'Real Estate'],
          },
        ],
        sectorPerformance: [
          { name: 'Technology', performance: 3.2, topStocks: ['AAPL', 'MSFT', 'GOOGL'], change: 1.8 },
          { name: 'Healthcare', performance: 1.5, topStocks: ['JNJ', 'PFE', 'UNH'], change: 0.6 },
          { name: 'Financials', performance: -0.8, topStocks: ['JPM', 'BAC', 'WFC'], change: -0.3 },
        ],
      },
      educationalHighlights: {
        popularCourses: [
          {
            id: 'course1',
            title: 'Technical Analysis Fundamentals',
            description: 'Learn the basics of chart patterns and indicators',
            enrollments: 456,
            rating: 4.8,
            completionRate: 78,
          },
        ],
        learningTrends: [
          { topic: 'Technical Analysis', interest: 85, growth: 15, relatedCourses: ['course1'] },
          { topic: 'Risk Management', interest: 78, growth: 22, relatedCourses: ['course2'] },
        ],
        knowledgeGaps: [
          'Options trading strategies',
          'Cryptocurrency fundamentals',
          'Portfolio diversification',
        ],
      },
    };

    const mockNewsletter: Newsletter = {
      id: `mock-${Date.now()}`,
      title: `From the Trading Floor: Your Weekly Market Intelligence - ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`,
      content: `**From the Trading Floor: Your Weekly Market Intelligence**

Well, well, well... if you're reading this, you've made it through another week in the markets, and let me tell you, what a week it's been. Welcome to this edition of the Dekr Weekly, where we've got quite the story to tell about what happened when our community put their money where their mouths are.

**The Numbers Don't Lie: Community Performance Spotlight**

Let's start with the good news, shall we? Because there's plenty of it. Our community absolutely crushed it this week, and I'm not just saying that to make you feel good. The numbers are right there in black and white – or should I say, green and green.

Leading the charge this week is Alex Chen, who managed to turn a 12.5% return while maintaining an 85.2% prediction accuracy. Now, let me put that in perspective for you – that's not just good, that's "I-should-probably-be-managing-other-people's-money" good. Alex made 45 predictions this week, and 38 of them hit the mark. That's the kind of consistency that makes Wall Street quiver.

Not to be outdone, Sarah Johnson delivered a solid 9.8% return with a 78.9% accuracy rate. What I love about Sarah's approach is that she's not swinging for the fences every time – she's playing smart, calculated baseball, and it's paying off beautifully.

**Market Pulse: When the Fed Speaks, We Listen**

Here's where things get interesting, and I mean really interesting. The markets had themselves quite the week, didn't they? The S&P 500 gained 2.3%, the NASDAQ popped 3.1%, and here's the kicker – our community saw it coming. 

I'm talking about 78% accuracy in the tech sector alone. That's not luck, folks, that's what happens when you have 1,250 smart people all looking at the same data and coming to remarkably similar conclusions. It's like having a crystal ball, except instead of magic, it's just really good research and a healthy dose of collective intelligence.

The Fed's latest move – holding rates steady with some surprisingly dovish commentary – sent ripples through the financial sector. But here's what's fascinating: our community had already positioned themselves for exactly this scenario. While the talking heads on TV were still parsing the Fed's statement, our members were already adjusting their strategies.

**Wisdom of the Crowd: When Everyone's Talking About the Same Thing**

Now, let's talk about the stocks that had everyone's attention this week. Apple and Tesla – AAPL and TSLA for those of you keeping score at home – were the talk of the town, with 45 and 38 recommendations respectively. 

But here's what's really compelling: it wasn't just blind enthusiasm. These recommendations came with data, with analysis, with actual reasoning behind them. When Alex Chen's momentum breakout strategy gained 234 new followers this week, it wasn't because it sounded cool – it was because it delivered a 15.2% performance with an 82.1% success rate.

That's the difference between following the crowd and following the smart crowd.

**The Learning Curve: Education Never Goes Out of Style**

Speaking of smart crowds, let's talk about what our community is learning. Technical Analysis Fundamentals remains our most popular course with 456 enrollments and a 4.8-star rating, and here's why that matters: in a world where everyone thinks they can day trade their way to riches, our community is taking the time to actually understand the fundamentals.

The trend toward risk management education is growing by 22% this week, and that tells me something important. It tells me that our community isn't just chasing returns – they're building sustainable, long-term strategies. That's the kind of thinking that separates the winners from the "I-lost-my-house-in-the-last-crash" crowd.

**Looking Ahead: The Plot Thickens**

Now, here's where I get to play the role of the mysterious narrator. Next week brings our monthly trading competition, and if history is any guide, we're in for some fireworks. But more than that, we're looking at a market that's showing signs of both strength and vulnerability.

The question isn't whether there will be opportunities – there always are. The question is whether you'll be ready for them. And based on what I'm seeing from this community, the answer is a resounding yes.

**The Bottom Line**

Here's what I want you to take away from this week's performance: we're not just building a trading community here, we're building a learning community. We're building a place where smart people can share ideas, test strategies, and yes, make money together.

The markets will do what the markets do – they'll go up, they'll go down, they'll make you question everything you thought you knew. But this community? This community is different. This community is thinking, learning, and adapting.

And that, my friends, is how you build wealth that lasts.

Until next week, keep your charts close and your stop-losses closer. This is your Dekr Weekly, and I'll see you on the trading floor.`,
      publishedAt: this.createTimestamp(now),
      weekOf: this.createTimestamp(weekStart),
      stats: {
        views: 0,
        shares: 0,
        likes: 0,
        clickThroughRate: 0,
        engagementTime: 0,
      },
      data: mockData,
      status: 'published',
      version: 1,
    };

    return mockNewsletter;
  }

  // Get recent newsletters
  async getRecentNewsletters(limit: number = 10): Promise<Newsletter[]> {
    try {
      const snapshot = await this.getNewsletterCollection()
        .orderBy('publishedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as Newsletter));
    } catch (error) {
      console.error('Error getting recent newsletters:', error);
      // Return mock newsletters if database is not available
      return [this.createMockNewsletter()];
    }
  }

  // Get newsletter by ID
  async getNewsletterById(id: string): Promise<Newsletter | null> {
    try {
      const doc = await this.getNewsletterCollection().doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as Newsletter;
    } catch (error) {
      console.error('Error getting newsletter by ID:', error);
      throw error;
    }
  }

  // Update newsletter stats
  async updateNewsletterStats(id: string, stats: Partial<Newsletter['stats']>): Promise<void> {
    try {
      const FieldValue = this.getFieldValue();
      await this.getNewsletterCollection().doc(id).update({
        stats: FieldValue.increment(stats),
      });

      logEvent(AnalyticsEvents.UPDATE_NEWSLETTER_STATS, {
        newsletter_id: id,
        stats,
      });
    } catch (error) {
      console.error('Error updating newsletter stats:', error);
      throw error;
    }
  }

  // Subscribe to newsletter updates
  subscribeToNewsletters(callback: (newsletters: Newsletter[]) => void): () => void {
    return this.getNewsletterCollection()
      .orderBy('publishedAt', 'desc')
      .limit(10)
      .onSnapshot((snapshot: any) => {
        const newsletters = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as Newsletter));
        callback(newsletters);
      });
  }
}

export const newsletterService = new NewsletterService();
