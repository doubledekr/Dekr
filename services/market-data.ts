import { searchPolygonTickers, getPolygonPriceHistory, getPolygonPopularStocks, getPolygonPopularCrypto, fetchPolygonFinancialNews, searchPolygonNews } from './polygon-service';

export interface PriceHistory {
  prices: number[];
  labels: string[];
}

export interface SearchResult {
  id: string;
  type: 'stock' | 'crypto';
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  previousClose?: number;
  open24h?: number;
  high24h?: number;
  low24h?: number;
  volume?: number;
  marketCap?: number;
  exchange?: string;
  sector?: string;
  dayRange?: string;
  priceHistory?: PriceHistory;
  sentiment?: 'positive' | 'negative' | 'neutral';
  timestamp: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  volatility?: 'Low' | 'Medium' | 'High';
  currentSignal?: 'Buy' | 'Sell' | 'Hold';
  peRatio?: number;
  tickerNews?: NewsArticle[];
  newsSentimentScore?: number;
}

export interface NewsArticle {
  id: string;
  type: 'news';
  headline: string;
  content: string;
  source: string;
  timestamp: number;
  imageUrl?: string;
  url: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tickers: string[];
}

export type MarketDataResponse = (SearchResult | NewsArticle)[];

export async function getRandomMarketData(
  stockCount: number,
  cryptoCount: number,
  newsCount: number
): Promise<MarketDataResponse> {
  try {
    console.log('🚀 Using Polygon API as primary data source');
    
    // 1. Get news from Polygon
    let newsData: NewsArticle[] = [];
    if (newsCount > 0) {
      try {
        console.log('📰 Fetching news from Polygon API...');
        newsData = await fetchPolygonFinancialNews(newsCount);
        console.log('✅ Got', newsData.length, 'news articles from Polygon');
      } catch (error) {
        console.error('❌ Polygon news failed:', error);
      }
    }

    // 2. Get stocks from Polygon
    let stockData: SearchResult[] = [];
    if (stockCount > 0) {
      try {
        console.log('📈 Fetching stocks from Polygon API...');
        stockData = await getPolygonPopularStocks(stockCount);
        console.log('✅ Got', stockData.length, 'stocks from Polygon');
      } catch (error) {
        console.error('❌ Polygon stocks failed:', error);
      }
    }

    // 3. Get crypto from Polygon
    let cryptoData: SearchResult[] = [];
    if (cryptoCount > 0) {
      try {
        console.log('₿ Fetching crypto from Polygon API...');
        cryptoData = await getPolygonPopularCrypto(cryptoCount);
        console.log('✅ Got', cryptoData.length, 'crypto from Polygon');
      } catch (error) {
        console.error('❌ Polygon crypto failed:', error);
      }
    }

    // 4. Combine all data
    const combinedData = [...stockData, ...cryptoData, ...newsData];
    
    console.log('🎯 Final data summary:', {
      totalItems: combinedData.length,
      stocks: stockData.length,
      crypto: cryptoData.length,
      news: newsData.length,
      sources: {
        stocks: stockData.length > 0 ? 'Polygon' : 'None',
        crypto: cryptoData.length > 0 ? 'Polygon' : 'None',
        news: newsData.length > 0 ? 'Polygon' : 'None'
      }
    });

    // 5. Shuffle for randomization
    function shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    
    return shuffleArray(combinedData);
  } catch (error) {
    console.error('💥 Error in getRandomMarketData:', error);
    throw error;
  }
}

// Analyze price movements to determine volatility
function calculateVolatility(prices: number[]): 'Low' | 'Medium' | 'High' {
  if (prices.length < 2) return 'Medium';
  
  // Calculate daily percentage changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyChange = Math.abs((prices[i] - prices[i-1]) / prices[i-1]);
    changes.push(dailyChange);
  }
  
  // Calculate average daily change
  const avgChange = changes.reduce((sum, val) => sum + val, 0) / changes.length;
  
  // Determine volatility based on average change
  if (avgChange < 0.01) return 'Low'; // Less than 1% average change
  if (avgChange < 0.03) return 'Medium'; // Less than 3% average change
  return 'High'; // 3% or more average change
}

// Determine sentiment based on technical indicators
function determineSentiment(rsi?: number, macd?: number, changePercentage?: number): 'positive' | 'negative' | 'neutral' {
  // If we have RSI data
  if (typeof rsi === 'number') {
    if (rsi > 70) return 'negative'; // Overbought
    if (rsi < 30) return 'positive'; // Oversold
  }
  
  // If we have MACD data
  if (typeof macd === 'number') {
    if (macd > 0) return 'positive';
    if (macd < 0) return 'negative';
  }
  
  // Fallback to change percentage
  if (typeof changePercentage === 'number') {
    if (changePercentage > 2) return 'positive';
    if (changePercentage < -2) return 'negative';
  }
  
  return 'neutral';
}

// Analyze technical indicators to provide a trading signal
function determineSignal(rsi?: number, macd?: number, changePercentage?: number): 'Buy' | 'Sell' | 'Hold' {
  // If we have RSI data
  if (typeof rsi === 'number') {
    if (rsi < 30) return 'Buy'; // Oversold
    if (rsi > 70) return 'Sell'; // Overbought
  }
  
  // If we have MACD data
  if (typeof macd === 'number') {
    if (macd > 0.5) return 'Buy';
    if (macd < -0.5) return 'Sell';
  }
  
  // Fallback to change percentage
  if (typeof changePercentage === 'number') {
    if (changePercentage > 3) return 'Buy';
    if (changePercentage < -3) return 'Sell';
  }
  
  return 'Hold';
}

// Determine grade based on multiple factors
function calculateGrade(rsi?: number, changePercentage?: number, volumeChange?: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  let score = 0;
  let factors = 0;
  
  // Change percentage factor
  if (typeof changePercentage === 'number') {
    factors++;
    if (changePercentage > 5) score += 5; // Excellent
    else if (changePercentage > 2) score += 4; // Good
    else if (changePercentage > 0) score += 3; // Average
    else if (changePercentage > -5) score += 2; // Below average
    else score += 1; // Poor
  }
  
  // RSI factor
  if (typeof rsi === 'number') {
    factors++;
    if (rsi > 40 && rsi < 60) score += 5; // Excellent (balanced)
    else if ((rsi > 30 && rsi < 70)) score += 4; // Good
    else if ((rsi > 20 && rsi < 80)) score += 3; // Average
    else if ((rsi > 10 && rsi < 90)) score += 2; // Below average
    else score += 1; // Poor (extreme)
  }
  
  // Volume change factor
  if (typeof volumeChange === 'number') {
    factors++;
    if (volumeChange > 50) score += 5; // Excellent (high interest)
    else if (volumeChange > 20) score += 4; // Good
    else if (volumeChange > 0) score += 3; // Average
    else if (volumeChange > -20) score += 2; // Below average
    else score += 1; // Poor (decreasing interest)
  }
  
  // Calculate average score
  const avgScore = factors > 0 ? score / factors : 3;
  
  // Convert to letter grade
  if (avgScore >= 4.5) return 'A';
  if (avgScore >= 3.5) return 'B';
  if (avgScore >= 2.5) return 'C';
  if (avgScore >= 1.5) return 'D';
  return 'F';
}

// Calculate estimated market cap based on price, volume, and other factors
function estimateMarketCap(price: number, volume: number, isCrypto: boolean): number {
  // For stocks, use a price-to-volume ratio to estimate market cap
  if (!isCrypto) {
    // Typical price-to-volume ratio ranges from 50-500 for most stocks
    const ratio = 200; // Middle of typical range
    return price * volume * ratio;
  } 
  // For crypto, use a different calculation
  else {
    // Crypto market caps tend to be more directly related to price and volume
    const ratio = 50; // Lower ratio for crypto
    return price * volume * ratio;
  }
}

export const searchMarketData = async (query: string): Promise<SearchResult[]> => {
  try {
    // Use Polygon API for all search functionality
    console.log('Searching with Polygon API for:', query);
    const polygonResults = await searchPolygonTickers(query, 15);
    if (polygonResults.length > 0) {
      console.log('Found', polygonResults.length, 'results from Polygon');
      return polygonResults;
    }

    console.log('No results found for query:', query);
    return [];
  } catch (error) {
    console.error('Error searching market data:', error);
    return [];
  }
};
