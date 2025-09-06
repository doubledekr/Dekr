"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPolygonTickerNews = exports.searchPolygonNews = exports.fetchPolygonFinancialNews = exports.getPolygonPopularCrypto = exports.getPolygonPopularStocks = exports.getPolygonMarketStatus = exports.getPolygonPriceHistory = exports.searchPolygonTickers = void 0;
const axios_1 = __importDefault(require("axios"));
const POLYGON_API_KEY = process.env.EXPO_PUBLIC_POLYGON_API_KEY;
const POLYGON_BASE_URL = 'https://api.polygon.io';
async function searchPolygonTickers(query, limit = 10) {
    try {
        if (!POLYGON_API_KEY) {
            console.warn('Polygon API key not found');
            return [];
        }
        // Search for tickers
        const searchResponse = await axios_1.default.get(`${POLYGON_BASE_URL}/v3/reference/tickers`, {
            params: {
                search: query,
                active: true,
                limit,
                apikey: POLYGON_API_KEY,
            },
        });
        if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
            return [];
        }
        // Get current quotes for the found tickers
        const results = await Promise.all(searchResponse.data.results.slice(0, limit).map(async (ticker) => {
            try {
                // Get previous close data
                const prevCloseResponse = await axios_1.default.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${ticker.ticker}/prev`, {
                    params: {
                        adjusted: true,
                        apikey: POLYGON_API_KEY,
                    },
                });
                if (!prevCloseResponse.data.results || prevCloseResponse.data.results.length === 0) {
                    return null;
                }
                const prevData = prevCloseResponse.data.results[0];
                const currentPrice = prevData.c;
                const previousClose = prevData.o;
                const changePercentage = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
                // Determine market type
                const isStock = ticker.market === 'stocks' || ticker.type === 'CS';
                const isCrypto = ticker.market === 'crypto' || ticker.type === 'CRYPTO';
                // Generate basic sentiment and grade
                const sentiment = changePercentage > 0 ? 'positive' : changePercentage < 0 ? 'negative' : 'neutral';
                const volatility = Math.abs(changePercentage) > 5 ? 'High' : Math.abs(changePercentage) > 2 ? 'Medium' : 'Low';
                const grade = changePercentage > 5 ? 'A' : changePercentage > 2 ? 'B' : changePercentage > -2 ? 'C' : changePercentage > -5 ? 'D' : 'F';
                const signal = changePercentage > 3 ? 'Buy' : changePercentage < -3 ? 'Sell' : 'Hold';
                const result = {
                    id: `polygon-${ticker.ticker}`,
                    symbol: ticker.ticker,
                    name: ticker.name,
                    exchange: ticker.primary_exchange,
                    price: currentPrice,
                    changePercentage,
                    previousClose,
                    volume: prevData.v,
                    dayRange: `${prevData.l}-${prevData.h}`,
                    type: isCrypto ? 'crypto' : 'stock',
                    timestamp: Date.now(),
                    sentiment,
                    grade: grade,
                    volatility: volatility,
                    currentSignal: signal,
                };
                // Add crypto-specific fields
                if (isCrypto) {
                    result.high24h = prevData.h;
                    result.low24h = prevData.l;
                }
                return result;
            }
            catch (error) {
                console.error(`Error fetching data for ${ticker.ticker}:`, error);
                return null;
            }
        }));
        return results.filter((result) => result !== null);
    }
    catch (error) {
        console.error('Error searching Polygon tickers:', error);
        return [];
    }
}
exports.searchPolygonTickers = searchPolygonTickers;
async function getPolygonPriceHistory(symbol, days = 30) {
    try {
        if (!POLYGON_API_KEY) {
            console.warn('Polygon API key not found');
            return { prices: [], labels: [] };
        }
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        const response = await axios_1.default.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/range/1/day/${startDate.toISOString().split('T')[0]}/${endDate.toISOString().split('T')[0]}`, {
            params: {
                adjusted: true,
                sort: 'asc',
                apikey: POLYGON_API_KEY,
            },
        });
        if (!response.data.results || response.data.results.length === 0) {
            return { prices: [], labels: [] };
        }
        const prices = response.data.results.map(item => item.c);
        const labels = response.data.results.map(item => {
            const date = new Date(item.t);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        return { prices, labels };
    }
    catch (error) {
        console.error(`Error fetching price history for ${symbol}:`, error);
        return { prices: [], labels: [] };
    }
}
exports.getPolygonPriceHistory = getPolygonPriceHistory;
async function getPolygonMarketStatus() {
    try {
        if (!POLYGON_API_KEY) {
            throw new Error('Polygon API key not found');
        }
        const response = await axios_1.default.get(`${POLYGON_BASE_URL}/v1/marketstatus/now`, {
            params: {
                apikey: POLYGON_API_KEY,
            },
        });
        return response.data;
    }
    catch (error) {
        console.error('Error fetching market status:', error);
        throw error;
    }
}
exports.getPolygonMarketStatus = getPolygonMarketStatus;
async function getPolygonPopularStocks(stockCount = 10) {
    try {
        if (!POLYGON_API_KEY) {
            console.warn('Polygon API key not found');
            return [];
        }
        // Popular stock symbols to fetch
        const popularSymbols = [
            'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX',
            'AMD', 'BABA', 'UBER', 'COIN', 'PLTR', 'PYPL', 'SHOP', 'SQ',
            'ROKU', 'ZOOM', 'DOCU', 'CRM'
        ];
        // Shuffle and take requested count
        const shuffled = [...popularSymbols].sort(() => 0.5 - Math.random());
        const selectedSymbols = shuffled.slice(0, stockCount);
        console.log('Fetching popular stocks from Polygon:', selectedSymbols);
        const results = await Promise.all(selectedSymbols.map(async (symbol) => {
            try {
                // Get previous close data for each symbol
                const prevCloseResponse = await axios_1.default.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev`, {
                    params: {
                        adjusted: true,
                        apikey: POLYGON_API_KEY,
                    },
                });
                if (!prevCloseResponse.data.results || prevCloseResponse.data.results.length === 0) {
                    console.warn(`No data for ${symbol}`);
                    return null;
                }
                const prevData = prevCloseResponse.data.results[0];
                const currentPrice = prevData.c;
                const previousClose = prevData.o;
                const changePercentage = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
                // Generate basic analysis
                const sentiment = changePercentage > 0 ? 'positive' : changePercentage < 0 ? 'negative' : 'neutral';
                const volatility = Math.abs(changePercentage) > 5 ? 'High' : Math.abs(changePercentage) > 2 ? 'Medium' : 'Low';
                const grade = changePercentage > 5 ? 'A' : changePercentage > 2 ? 'B' : changePercentage > -2 ? 'C' : changePercentage > -5 ? 'D' : 'F';
                const signal = changePercentage > 3 ? 'Buy' : changePercentage < -3 ? 'Sell' : 'Hold';
                // Get company name (simplified mapping)
                const companyNames = {
                    'AAPL': 'Apple Inc.',
                    'GOOGL': 'Alphabet Inc.',
                    'MSFT': 'Microsoft Corporation',
                    'TSLA': 'Tesla, Inc.',
                    'AMZN': 'Amazon.com, Inc.',
                    'META': 'Meta Platforms, Inc.',
                    'NVDA': 'NVIDIA Corporation',
                    'NFLX': 'Netflix, Inc.',
                    'AMD': 'Advanced Micro Devices, Inc.',
                    'BABA': 'Alibaba Group Holding Limited',
                    'UBER': 'Uber Technologies, Inc.',
                    'COIN': 'Coinbase Global, Inc.',
                    'PLTR': 'Palantir Technologies Inc.',
                    'PYPL': 'PayPal Holdings, Inc.',
                    'SHOP': 'Shopify Inc.',
                    'SQ': 'Block, Inc.',
                    'ROKU': 'Roku, Inc.',
                    'ZOOM': 'Zoom Video Communications, Inc.',
                    'DOCU': 'DocuSign, Inc.',
                    'CRM': 'Salesforce, Inc.'
                };
                // Fetch ticker-specific news from Polygon
                let tickerNews = [];
                let newsSentimentScore = 0;
                let finalSentiment = sentiment;
                try {
                    tickerNews = await fetchPolygonTickerNews(symbol, 3);
                    if (tickerNews.length > 0) {
                        // Calculate average sentiment from news
                        const sentimentScores = tickerNews
                            .map(news => {
                            if (news.sentiment === 'positive')
                                return 0.5;
                            if (news.sentiment === 'negative')
                                return -0.5;
                            return 0;
                        })
                            .filter(score => score !== 0);
                        if (sentimentScores.length > 0) {
                            newsSentimentScore = sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
                            // Combine price sentiment with news sentiment (60% price, 40% news)
                            const priceSentimentScore = changePercentage / 10; // Normalize to -1 to 1 range
                            const combinedScore = (priceSentimentScore * 0.6) + (newsSentimentScore * 0.4);
                            if (combinedScore > 0.1)
                                finalSentiment = 'positive';
                            else if (combinedScore < -0.1)
                                finalSentiment = 'negative';
                            else
                                finalSentiment = 'neutral';
                        }
                    }
                }
                catch (error) {
                    console.warn(`Could not fetch news for ${symbol}:`, error);
                }
                const result = {
                    id: `polygon-stock-${symbol}`,
                    symbol: symbol,
                    name: companyNames[symbol] || `${symbol} Corporation`,
                    exchange: 'NASDAQ',
                    price: currentPrice,
                    changePercentage,
                    previousClose,
                    volume: prevData.v,
                    dayRange: `${prevData.l}-${prevData.h}`,
                    type: 'stock',
                    timestamp: Date.now(),
                    sentiment: finalSentiment,
                    grade: grade,
                    volatility: volatility,
                    currentSignal: signal,
                    marketCap: Math.floor(Math.random() * 1000000000000),
                    tickerNews: tickerNews,
                    newsSentimentScore,
                };
                return result;
            }
            catch (error) {
                console.error(`Error fetching data for ${symbol}:`, error);
                return null;
            }
        }));
        const validResults = results.filter((result) => result !== null);
        console.log('Successfully fetched', validResults.length, 'popular stocks from Polygon');
        return validResults;
    }
    catch (error) {
        console.error('Error fetching popular stocks from Polygon:', error);
        return [];
    }
}
exports.getPolygonPopularStocks = getPolygonPopularStocks;
async function getPolygonPopularCrypto(cryptoCount = 5) {
    var _a;
    try {
        if (!POLYGON_API_KEY) {
            console.warn('Polygon API key not found');
            return [];
        }
        // Popular crypto symbols to fetch (in USD pairs)
        const popularCryptoSymbols = [
            'X:BTCUSD', 'X:ETHUSD', 'X:ADAUSD', 'X:SOLUSD', 'X:MATICUSD',
            'X:DOGEUSD', 'X:SHIBUSD', 'X:AVAXUSD', 'X:LINKUSD', 'X:DOTUSD'
        ];
        // Shuffle and take requested count
        // Limit to fewer symbols to avoid rate limiting
        const maxSymbols = Math.min(cryptoCount, 5);
        const shuffled = [...popularCryptoSymbols].sort(() => 0.5 - Math.random());
        const selectedSymbols = shuffled.slice(0, maxSymbols);
        console.log('Fetching popular crypto from Polygon:', selectedSymbols);
        // Rate limit the requests to avoid 429 errors
        const results = [];
        for (let i = 0; i < selectedSymbols.length; i++) {
            const symbol = selectedSymbols[i];
            // Add delay between requests to avoid rate limiting
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
            }
            try {
                // Get previous close data for each crypto symbol
                const prevCloseResponse = await axios_1.default.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev`, {
                    params: {
                        adjusted: true,
                        apikey: POLYGON_API_KEY,
                    },
                });
                if (!prevCloseResponse.data.results || prevCloseResponse.data.results.length === 0) {
                    console.warn(`No data for ${symbol}`);
                    results.push(null);
                    continue;
                }
                const prevData = prevCloseResponse.data.results[0];
                const currentPrice = prevData.c;
                const previousClose = prevData.o;
                const changePercentage = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
                // Generate basic analysis (crypto is more volatile)
                const sentiment = changePercentage > 0 ? 'positive' : changePercentage < 0 ? 'negative' : 'neutral';
                const volatility = Math.abs(changePercentage) > 10 ? 'High' : Math.abs(changePercentage) > 5 ? 'Medium' : 'Low';
                const grade = changePercentage > 10 ? 'A' : changePercentage > 5 ? 'B' : changePercentage > -5 ? 'C' : changePercentage > -10 ? 'D' : 'F';
                const signal = changePercentage > 5 ? 'Buy' : changePercentage < -5 ? 'Sell' : 'Hold';
                // Get crypto name (simplified mapping)
                const cryptoNames = {
                    'X:BTCUSD': 'Bitcoin',
                    'X:ETHUSD': 'Ethereum',
                    'X:ADAUSD': 'Cardano',
                    'X:SOLUSD': 'Solana',
                    'X:MATICUSD': 'Polygon',
                    'X:DOGEUSD': 'Dogecoin',
                    'X:SHIBUSD': 'Shiba Inu',
                    'X:AVAXUSD': 'Avalanche',
                    'X:LINKUSD': 'Chainlink',
                    'X:DOTUSD': 'Polkadot'
                };
                const displaySymbol = symbol.replace('X:', '').replace('USD', '');
                const result = {
                    id: `polygon-crypto-${displaySymbol}`,
                    symbol: displaySymbol,
                    name: cryptoNames[symbol] || displaySymbol,
                    exchange: 'Polygon',
                    price: currentPrice,
                    changePercentage,
                    previousClose,
                    volume: prevData.v,
                    dayRange: `${prevData.l}-${prevData.h}`,
                    type: 'crypto',
                    timestamp: Date.now(),
                    sentiment,
                    grade: grade,
                    volatility: volatility,
                    currentSignal: signal,
                    high24h: prevData.h,
                    low24h: prevData.l,
                    marketCap: Math.floor(Math.random() * 100000000000), // Placeholder
                };
                results.push(result);
            }
            catch (error) {
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429) {
                    console.warn(`Rate limited for ${symbol}, skipping...`);
                }
                else {
                    console.error(`Error fetching data for ${symbol}:`, error);
                }
                results.push(null);
            }
        }
        const validResults = results.filter((result) => result !== null);
        console.log('Successfully fetched', validResults.length, 'popular crypto from Polygon');
        return validResults;
    }
    catch (error) {
        console.error('Error fetching popular crypto from Polygon:', error);
        return [];
    }
}
exports.getPolygonPopularCrypto = getPolygonPopularCrypto;
async function fetchPolygonFinancialNews(limit = 10) {
    try {
        if (!POLYGON_API_KEY) {
            console.warn('Polygon API key not found');
            return [];
        }
        console.log('📰 Fetching financial news from Polygon API...');
        const response = await axios_1.default.get(`${POLYGON_BASE_URL}/v2/reference/news`, {
            params: {
                limit,
                'ticker.gte': '',
                order: 'desc',
                sort: 'published_utc',
                apikey: POLYGON_API_KEY,
            },
        });
        if (!response.data.results || response.data.results.length === 0) {
            console.log('No financial news found');
            return [];
        }
        const newsArticles = response.data.results.map((item) => {
            // Determine sentiment from insights if available
            let sentiment = 'neutral';
            if (item.insights && item.insights.length > 0) {
                const sentiments = item.insights.map(insight => insight.sentiment);
                const positiveCount = sentiments.filter(s => s === 'positive').length;
                const negativeCount = sentiments.filter(s => s === 'negative').length;
                if (positiveCount > negativeCount)
                    sentiment = 'positive';
                else if (negativeCount > positiveCount)
                    sentiment = 'negative';
            }
            return {
                id: `polygon-news-${item.id}`,
                type: 'news',
                headline: item.title,
                content: item.description || item.title,
                source: item.publisher.name,
                timestamp: new Date(item.published_utc).getTime(),
                imageUrl: item.image_url,
                url: item.article_url,
                sentiment,
                tickers: item.tickers,
            };
        });
        console.log(`✅ Found ${newsArticles.length} news articles from Polygon`);
        return newsArticles;
    }
    catch (error) {
        console.error('Error fetching news from Polygon:', error);
        return [];
    }
}
exports.fetchPolygonFinancialNews = fetchPolygonFinancialNews;
async function searchPolygonNews(query, limit = 10) {
    try {
        if (!POLYGON_API_KEY) {
            console.warn('Polygon API key not found');
            return [];
        }
        console.log(`📰 Searching Polygon news for: ${query}`);
        // First try searching by ticker
        let response = await axios_1.default.get(`${POLYGON_BASE_URL}/v2/reference/news`, {
            params: {
                'ticker': query.toUpperCase(),
                limit,
                order: 'desc',
                sort: 'published_utc',
                apikey: POLYGON_API_KEY,
            },
        });
        // If no results, try a broader search
        if (!response.data.results || response.data.results.length === 0) {
            response = await axios_1.default.get(`${POLYGON_BASE_URL}/v2/reference/news`, {
                params: {
                    limit,
                    order: 'desc',
                    sort: 'published_utc',
                    apikey: POLYGON_API_KEY,
                },
            });
            // Filter results locally by query
            if (response.data.results) {
                response.data.results = response.data.results.filter(article => {
                    var _a;
                    return article.title.toLowerCase().includes(query.toLowerCase()) ||
                        ((_a = article.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(query.toLowerCase())) ||
                        article.tickers.some(ticker => ticker.toLowerCase().includes(query.toLowerCase()));
                });
            }
        }
        if (!response.data.results || response.data.results.length === 0) {
            return [];
        }
        const newsArticles = response.data.results.map((item) => {
            let sentiment = 'neutral';
            if (item.insights && item.insights.length > 0) {
                const sentiments = item.insights.map(insight => insight.sentiment);
                const positiveCount = sentiments.filter(s => s === 'positive').length;
                const negativeCount = sentiments.filter(s => s === 'negative').length;
                if (positiveCount > negativeCount)
                    sentiment = 'positive';
                else if (negativeCount > positiveCount)
                    sentiment = 'negative';
            }
            return {
                id: `polygon-news-search-${item.id}`,
                type: 'news',
                headline: item.title,
                content: item.description || item.title,
                source: item.publisher.name,
                timestamp: new Date(item.published_utc).getTime(),
                imageUrl: item.image_url,
                url: item.article_url,
                sentiment,
                tickers: item.tickers,
            };
        });
        console.log(`✅ Found ${newsArticles.length} news articles for query: ${query}`);
        return newsArticles;
    }
    catch (error) {
        console.error(`Error searching Polygon news for ${query}:`, error);
        return [];
    }
}
exports.searchPolygonNews = searchPolygonNews;
async function fetchPolygonTickerNews(ticker, limit = 5) {
    try {
        if (!POLYGON_API_KEY) {
            console.warn('Polygon API key not found');
            return [];
        }
        console.log(`📰 Fetching ticker-specific news for ${ticker} from Polygon...`);
        const response = await axios_1.default.get(`${POLYGON_BASE_URL}/v2/reference/news`, {
            params: {
                'ticker': ticker.toUpperCase(),
                limit,
                order: 'desc',
                sort: 'published_utc',
                apikey: POLYGON_API_KEY,
            },
        });
        if (!response.data.results || response.data.results.length === 0) {
            console.log(`No ticker-specific news found for ${ticker}`);
            return [];
        }
        const tickerNews = response.data.results.map((item) => {
            let sentiment = 'neutral';
            // Use insights for the specific ticker if available
            if (item.insights && item.insights.length > 0) {
                const tickerInsight = item.insights.find(insight => insight.ticker.toUpperCase() === ticker.toUpperCase());
                if (tickerInsight) {
                    sentiment = tickerInsight.sentiment;
                }
                else {
                    // Fallback to general sentiment analysis
                    const sentiments = item.insights.map(insight => insight.sentiment);
                    const positiveCount = sentiments.filter(s => s === 'positive').length;
                    const negativeCount = sentiments.filter(s => s === 'negative').length;
                    if (positiveCount > negativeCount)
                        sentiment = 'positive';
                    else if (negativeCount > positiveCount)
                        sentiment = 'negative';
                }
            }
            return {
                id: `polygon-ticker-news-${ticker}-${item.id}`,
                type: 'news',
                headline: item.title,
                content: item.description || item.title,
                source: item.publisher.name,
                timestamp: new Date(item.published_utc).getTime(),
                imageUrl: item.image_url,
                url: item.article_url,
                sentiment,
                tickers: item.tickers.length > 0 ? item.tickers : [ticker],
            };
        });
        console.log(`✅ Found ${tickerNews.length} news articles for ${ticker}`);
        return tickerNews;
    }
    catch (error) {
        console.error(`Error fetching ticker news for ${ticker}:`, error);
        return [];
    }
}
exports.fetchPolygonTickerNews = fetchPolygonTickerNews;
//# sourceMappingURL=polygon-service.js.map