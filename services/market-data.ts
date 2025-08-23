import axios from 'axios';

const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';
const FIREBASE_API_URL = 'https://getrandommarketinfo-u3cp3jehlq-uc.a.run.app';

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
    // Make the API request with the counts
    const response = await axios.get(`${FIREBASE_API_URL}`, {
      params: {
        stockCount,
        cryptoCount,
        newsCount
      }
    });

    if (!response.data || !response.data.data) {
      console.error('Invalid response format:', response);
      return [];
    }

    // Log detailed information about the response
    console.log('API Response Structure:', {
      totalItems: response.data.data.length,
      stockItems: response.data.data.filter((item: any) => item.type === 'stock').length,
      cryptoItems: response.data.data.filter((item: any) => item.type === 'crypto').length,
      newsItems: response.data.data.filter((item: any) => item.type === 'news').length,
    });

    // Log a sample of each type
    const sampleStock = response.data.data.find((item: any) => item.type === 'stock');
    const sampleCrypto = response.data.data.find((item: any) => item.type === 'crypto');
    const sampleNews = response.data.data.find((item: any) => item.type === 'news');

    console.log('Sample Stock:', JSON.stringify(sampleStock, null, 2));
    console.log('Sample Crypto:', JSON.stringify(sampleCrypto, null, 2));
    console.log('Sample News:', JSON.stringify(sampleNews, null, 2));
    
    // Shuffle the results to randomize order
    function shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    
    return shuffleArray(response.data.data);
  } catch (error) {
    console.error('Error in getRandomMarketData:', error);
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
    // Search for all symbols in one call
    const response = await axios.get(`${TWELVE_DATA_BASE_URL}/symbol_search`, {
      params: {
        symbol: query,
        outputsize: 20,
        apikey: process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY
      }
    });

    if (!response.data.data || response.data.data.length === 0) {
      return [];
    }

    // Get quotes for all matching symbols
    const resultsWithQuotes = await Promise.all(
      response.data.data.map(async (item: any) => {
        try {
          // Skip if we can't determine the type properly
          if (!item.symbol || !item.exchange) {
            return null;
          }

          // Determine if it's a crypto by checking if the symbol contains '/'
          const isCrypto = item.symbol.includes('/') || item.instrument_type === 'CRYPTOCURRENCY';
          
          // For crypto, ensure we have the /USD pairing if available
          let symbolToUse = item.symbol;
          
          // If it's a crypto without a pairing, try to use the /USD pair instead
          if (isCrypto && !symbolToUse.includes('/')) {
            // Try to find a USD pairing for this crypto in the results
            const usdPair = response.data.data.find(
              (s: any) => s.symbol.startsWith(symbolToUse + '/') && 
                (s.symbol.endsWith('/USD') || s.symbol.endsWith('/USDT'))
            );
            if (usdPair) {
              symbolToUse = usdPair.symbol;
              console.log(`Using USD pair ${symbolToUse} instead of ${item.symbol}`);
            } else {
              // If no USD pair found, append /USD and see if we can get data
              symbolToUse = symbolToUse + '/USD';
            }
          }
          
          // Get basic quote and timeseries data
          const [quoteResponse, timeSeriesResponse] = await Promise.all([
            axios.get(`${TWELVE_DATA_BASE_URL}/quote`, {
              params: {
                symbol: symbolToUse,
                apikey: process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY
              }
            }),
            axios.get(`${TWELVE_DATA_BASE_URL}/time_series`, {
              params: {
                symbol: symbolToUse,
                interval: '1day',
                outputsize: 180, // Get approximately 6 months of data (180 days)
                apikey: process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY
              }
            })
          ]);

          const quote = quoteResponse.data;
          const timeSeries = timeSeriesResponse.data;

          if (!quote || !timeSeries.values || timeSeries.values.length < 2) return null;

          const previousClose = parseFloat(timeSeries.values[1].close);
          const currentPrice = parseFloat(quote.close);
          const changePercentage = ((currentPrice - previousClose) / previousClose) * 100;

          // Get the base symbol (e.g., "BTC" from "BTC/USD")
          const symbol = isCrypto && symbolToUse.includes('/') 
            ? symbolToUse.split('/')[0] 
            : symbolToUse;
          
          // For display purposes, use the full symbol for crypto pairs
          const displaySymbol = isCrypto ? symbolToUse : symbol;

          // Process time series data for price history
          const priceHistory: PriceHistory = {
            prices: [],
            labels: []
          };

          // Extract price history and format dates
          if (timeSeries.values?.length > 0) {
            // Store all data points for detailed chart
            const allDataPoints: { price: number; date: Date }[] = [];
            
            // Track unique months for labels
            const monthLabels: { [key: string]: { index: number, date: Date } } = {};
            
            // Process all time series data points
            for (const dataPoint of timeSeries.values) {
              const date = new Date(dataPoint.datetime);
              
              // Track each month we encounter
              const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              if (!monthLabels[monthKey]) {
                monthLabels[monthKey] = { 
                  index: Object.keys(monthLabels).length,
                  date: date
                };
              }
              
              allDataPoints.push({
                price: parseFloat(dataPoint.close),
                date: date
              });
            }
            
            // Sort all data points by date (oldest to newest)
            allDataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
            
            // Sort months chronologically
            const sortedMonths = Object.entries(monthLabels)
              .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
              .map(([month, data]) => ({ month, index: data.index }));
            
            // Add all prices
            allDataPoints.forEach(point => {
              priceHistory.prices.push(point.price);
            });
            
            // Initialize all labels as empty strings
            priceHistory.labels = Array(allDataPoints.length).fill('');
            
            // Only add month labels at the appropriate indices
            sortedMonths.forEach(({ month, index }) => {
              // Find the first data point in each month
              const monthIndex = allDataPoints.findIndex(point => {
                const pointMonth = point.date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                return pointMonth === month;
              });
              
              if (monthIndex >= 0) {
                priceHistory.labels[monthIndex] = month;
              }
            });
          }

          // Get additional technical indicators if available
          let technicalIndicators: any = {};
          try {
            // Try to get RSI data
            const rsiResponse = await axios.get(`${TWELVE_DATA_BASE_URL}/rsi`, {
              params: {
                symbol: symbolToUse,
                interval: '1day',
                outputsize: 1,
                apikey: process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY
              }
            });
            
            if (rsiResponse.data && rsiResponse.data.values?.length > 0) {
              technicalIndicators.rsi = parseFloat(rsiResponse.data.values[0].rsi);
            }
            
            // Try to get MACD data
            const macdResponse = await axios.get(`${TWELVE_DATA_BASE_URL}/macd`, {
              params: {
                symbol: symbolToUse,
                interval: '1day',
                outputsize: 1,
                apikey: process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY
              }
            });
            
            if (macdResponse.data && macdResponse.data.values?.length > 0) {
              technicalIndicators.macd = parseFloat(macdResponse.data.values[0].macd);
            }
          } catch (error) {
            console.log(`Error fetching technical indicators for ${symbolToUse}:`, error);
            // Continue without technical indicators
          }

          // Try to get additional profile data from Twelve Data (for stocks)
          let profileData: any = {};
          if (!isCrypto) {
            try {
              const profileResponse = await axios.get(`${TWELVE_DATA_BASE_URL}/profile`, {
                params: {
                  symbol: symbolToUse,
                  apikey: process.env.EXPO_PUBLIC_TWELVE_DATA_API_KEY
                }
              });
              
              if (profileResponse.data) {
                profileData = profileResponse.data;
              }
            } catch (error) {
              console.log(`Error fetching profile data for ${symbolToUse}:`, error);
              // Continue without profile data
            }
          }

          // Calculate volume change compared to average if we have enough data
          let volumeChange: number | undefined;
          if (timeSeries.values.length > 5) {
            const volumes = timeSeries.values.slice(0, 5).map((item: any) => parseFloat(item.volume));
            const avgVolume = volumes.reduce((sum: number, vol: number) => sum + vol, 0) / volumes.length;
            const currentVolume = parseFloat(quote.volume);
            volumeChange = ((currentVolume - avgVolume) / avgVolume) * 100;
          }

          // Calculate additional metrics based on available data
          const volatility = calculateVolatility(
            timeSeries.values.map((item: any) => parseFloat(item.close))
          );
          
          const sentiment = determineSentiment(
            technicalIndicators.rsi,
            technicalIndicators.macd,
            changePercentage
          );
          
          const signal = determineSignal(
            technicalIndicators.rsi,
            technicalIndicators.macd,
            changePercentage
          );
          
          const grade = calculateGrade(
            technicalIndicators.rsi,
            changePercentage,
            volumeChange
          );

          // Parse or estimate market capitalization
          let marketCap: number | undefined;
          if (profileData.market_capitalization) {
            marketCap = parseFloat(profileData.market_capitalization);
          } else if (quote.volume) {
            // Estimate market cap if we have volume data
            marketCap = estimateMarketCap(currentPrice, parseFloat(quote.volume), isCrypto);
          }

          // Prepare the result
          const baseResult = {
            id: isCrypto ? `crypto-${symbol}-${item.exchange}` : `stock-${symbol}-${item.exchange}`,
            symbol: displaySymbol, // Use the display symbol
            name: item.name || symbol,
            exchange: item.exchange,
            price: currentPrice,
            changePercentage,
            volume: quote.volume ? parseFloat(quote.volume) : undefined,
            marketCap: marketCap,
            timestamp: Date.now(),
            previousClose,
            dayRange: `${quote.low}-${quote.high}`,
            type: isCrypto ? ('crypto' as const) : ('stock' as const),
            sector: !isCrypto ? (profileData.sector || item.instrument_type || undefined) : undefined,
            grade,
            volatility,
            currentSignal: signal,
            sentiment,
            priceHistory: priceHistory.prices.length > 0 ? priceHistory : undefined,
            peRatio: profileData.pe ? parseFloat(profileData.pe) : undefined,
            // For crypto, add high and low values for 24h
            ...(isCrypto ? {
              high24h: parseFloat(quote.high),
              low24h: parseFloat(quote.low)
            } : {})
          };

          return baseResult;
        } catch (error) {
          console.error(`Error fetching details for ${item.symbol}:`, error);
          return null;
        }
      })
    );

    return resultsWithQuotes.filter((result): result is SearchResult => result !== null);
  } catch (error) {
    console.error('Error searching market data:', error);
    return [];
  }
};
