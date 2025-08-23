import axios from 'axios';
import { NewsCardData } from '../components/MarketCard';

const MEDIASTACK_API_KEY = process.env.EXPO_PUBLIC_MEDIASTACK_API_KEY;
const MEDIASTACK_BASE_URL = 'http://api.mediastack.com/v1';

interface MediaStackResponse {
  data: Array<{
    title: string;
    description: string;
    url: string;
    image: string;
    source: string;
    published_at: string;
    category: string;
  }>;
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
}

export async function fetchFinancialNews(
  keywords?: string,
  limit: number = 10
): Promise<NewsCardData[]> {
  try {
    const response = await axios.get<MediaStackResponse>(`${MEDIASTACK_BASE_URL}/news`, {
      params: {
        access_key: MEDIASTACK_API_KEY,
        categories: 'business',
        languages: 'en',
        limit,
        keywords,
        sort: 'published_desc',
      },
    });

    return response.data.data.map((item): NewsCardData => {
      // Extract tickers from the title and description
      const tickerRegex = /\$([A-Z]{1,5})/g;
      const titleTickers = [...(item.title.match(tickerRegex) || [])];
      const descriptionTickers = [...(item.description.match(tickerRegex) || [])];
      const tickers = [...new Set([...titleTickers, ...descriptionTickers])]
        .map(ticker => ticker.substring(1)); // Remove the $ prefix

      // Simple sentiment analysis based on keywords
      const positiveWords = ['surge', 'gain', 'rise', 'up', 'high', 'growth', 'profit'];
      const negativeWords = ['drop', 'fall', 'down', 'low', 'loss', 'crash', 'decline'];
      
      const text = (item.title + ' ' + item.description).toLowerCase();
      const positiveCount = positiveWords.filter(word => text.includes(word)).length;
      const negativeCount = negativeWords.filter(word => text.includes(word)).length;
      
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      if (positiveCount > negativeCount) sentiment = 'positive';
      if (negativeCount > positiveCount) sentiment = 'negative';

      return {
        type: 'news',
        id: `news-${Date.now()}-${Math.random()}`,
        headline: item.title,
        content: item.description,
        source: item.source,
        timestamp: new Date(item.published_at).getTime(),
        imageUrl: item.image,
        url: item.url,
        sentiment,
        tickers: tickers.length > 0 ? tickers : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return [];
  }
} 