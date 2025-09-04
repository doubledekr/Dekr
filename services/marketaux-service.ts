/**
 * @deprecated This service is deprecated. Use polygon-service.ts for news functionality instead.
 * All news functionality has been migrated to Polygon API.
 */
import axios from 'axios';
import { NewsCardData } from '../components/MarketCard';

const MARKETAUX_API_KEY = process.env.EXPO_PUBLIC_MARKETAUX_API_KEY;
const MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1';

interface MarketAuxResponse {
  data: Array<{
    uuid: string;
    title: string;
    description: string;
    snippet: string;
    url: string;
    image_url: string;
    language: string;
    published_at: string;
    source: string;
    relevance_score: number;
    entities: Array<{
      symbol: string;
      name: string;
      exchange: string;
      exchange_long: string;
      country: string;
      type: string;
      industry: string;
      match_score: number;
      sentiment_score: number;
      highlights: Array<{
        highlight: string;
        sentiment: number;
        highlighted_in: string;
      }>;
    }>;
    similar: string[];
  }>;
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
}

/**
 * @deprecated Use fetchPolygonFinancialNews from polygon-service.ts instead
 */
export async function fetchFinancialNewsFromMarketAux(
  symbols?: string[],
  limit: number = 10
): Promise<NewsCardData[]> {
  try {
    console.warn('⚠️ fetchFinancialNewsFromMarketAux is deprecated. Use fetchPolygonFinancialNews instead.');
    if (!MARKETAUX_API_KEY) {
      console.warn('MarketAux API key not found');
      return [];
    }

    const params: any = {
      api_token: MARKETAUX_API_KEY,
      language: 'en',
      limit,
      sort: 'published_desc',
    };

    // Add symbols filter if provided
    if (symbols && symbols.length > 0) {
      params.symbols = symbols.join(',');
    }

    const response = await axios.get<MarketAuxResponse>(`${MARKETAUX_BASE_URL}/news/all`, {
      params,
    });

    return response.data.data.map((item): NewsCardData => {
      // Extract tickers from entities
      const tickers = item.entities
        .filter(entity => entity.type === 'equity')
        .map(entity => entity.symbol);

      // Determine sentiment from entities
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (item.entities.length > 0) {
        const avgSentiment = item.entities.reduce((sum, entity) => sum + entity.sentiment_score, 0) / item.entities.length;
        if (avgSentiment > 0.1) sentiment = 'positive';
        else if (avgSentiment < -0.1) sentiment = 'negative';
      }

      return {
        type: 'news',
        id: `marketaux-${item.uuid}`,
        headline: item.title,
        content: item.description || item.snippet,
        source: item.source,
        timestamp: new Date(item.published_at).getTime(),
        imageUrl: item.image_url,
        url: item.url,
        sentiment,
        tickers: tickers.length > 0 ? tickers : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching news from MarketAux:', error);
    return [];
  }
}

/**
 * @deprecated Use searchPolygonNews from polygon-service.ts instead
 */
export async function searchMarketAuxNews(query: string, limit: number = 10): Promise<NewsCardData[]> {
  try {
    console.warn('⚠️ searchMarketAuxNews is deprecated. Use searchPolygonNews instead.');
    if (!MARKETAUX_API_KEY) {
      console.warn('MarketAux API key not found');
      return [];
    }

    const response = await axios.get<MarketAuxResponse>(`${MARKETAUX_BASE_URL}/news/all`, {
      params: {
        api_token: MARKETAUX_API_KEY,
        search: query,
        language: 'en',
        limit,
        sort: 'published_desc',
      },
    });

    return response.data.data.map((item): NewsCardData => {
      const tickers = item.entities
        .filter(entity => entity.type === 'equity')
        .map(entity => entity.symbol);

      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (item.entities.length > 0) {
        const avgSentiment = item.entities.reduce((sum, entity) => sum + entity.sentiment_score, 0) / item.entities.length;
        if (avgSentiment > 0.1) sentiment = 'positive';
        else if (avgSentiment < -0.1) sentiment = 'negative';
      }

      return {
        type: 'news',
        id: `marketaux-${item.uuid}`,
        headline: item.title,
        content: item.description || item.snippet,
        source: item.source,
        timestamp: new Date(item.published_at).getTime(),
        imageUrl: item.image_url,
        url: item.url,
        sentiment,
        tickers: tickers.length > 0 ? tickers : undefined,
      };
    });
  } catch (error) {
    console.error('Error searching MarketAux news:', error);
    return [];
  }
}

/**
 * @deprecated Use fetchPolygonTickerNews from polygon-service.ts instead
 */
export async function fetchTickerSpecificNews(ticker: string, limit: number = 5): Promise<NewsCardData[]> {
  try {
    console.warn('⚠️ fetchTickerSpecificNews is deprecated. Use fetchPolygonTickerNews instead.');
    if (!MARKETAUX_API_KEY) {
      console.warn('MarketAux API key not found');
      return [];
    }

    console.log(`📰 Fetching ticker-specific news for ${ticker}...`);

    const response = await axios.get<MarketAuxResponse>(`${MARKETAUX_BASE_URL}/news/all`, {
      params: {
        api_token: MARKETAUX_API_KEY,
        symbols: ticker,
        limit,
        language: 'en',
        sort: 'published_desc',
      },
    });

    if (!response.data.data || response.data.data.length === 0) {
      console.log(`No ticker-specific news found for ${ticker}`);
      return [];
    }

    const tickerNews = response.data.data.map((item): NewsCardData => {
      const tickers = item.entities
        .filter(entity => entity.type === 'equity')
        .map(entity => entity.symbol);

      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (item.entities.length > 0) {
        const avgSentiment = item.entities.reduce((sum, entity) => sum + entity.sentiment_score, 0) / item.entities.length;
        if (avgSentiment > 0.1) sentiment = 'positive';
        else if (avgSentiment < -0.1) sentiment = 'negative';
      }

      return {
        type: 'news',
        id: `marketaux-ticker-${ticker}-${item.uuid}`,
        headline: item.title,
        content: item.description || item.snippet,
        source: item.source,
        timestamp: new Date(item.published_at).getTime(),
        imageUrl: item.image_url,
        url: item.url,
        sentiment,
        tickers: tickers.length > 0 ? tickers : [ticker],
        sentimentScore: item.entities.length > 0 ? 
          item.entities.reduce((sum, entity) => sum + entity.sentiment_score, 0) / item.entities.length : 0,
      };
    });
    
    console.log(`✅ Found ${tickerNews.length} news articles for ${ticker}`);
    return tickerNews;
  } catch (error) {
    console.error(`Error fetching ticker news for ${ticker}:`, error);
    return [];
  }
}
