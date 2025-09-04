import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { z } from 'zod';
import axios from 'axios';

const db = getFirestore();

// Validation schemas
const runBacktestSchema = z.object({
  strategyId: z.string().min(1),
  universe: z.object({
    type: z.enum(['deck', 'list', 'asset']),
    deckId: z.string().optional(),
    symbols: z.array(z.string()).optional(),
  }),
  config: z.object({
    startDate: z.string(),
    endDate: z.string(),
    initialCapital: z.number().min(1000).default(10000),
    commission: z.number().min(0).default(0.001),
    slippage: z.number().min(0).default(0.0005),
    benchmark: z.string().default('SPY'),
  }).optional(),
});

const createStrategySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  strategyType: z.enum(['technical', 'fundamental', 'sentiment', 'hybrid', 'custom']),
  buyConditions: z.array(z.object({
    indicator: z.string(),
    operator: z.string(),
    value: z.union([z.number(), z.string()]),
    timeframe: z.string().default('1D'),
    parameters: z.record(z.any()).default({}),
  })).min(1),
  sellConditions: z.array(z.object({
    indicator: z.string(),
    operator: z.string(),
    value: z.union([z.number(), z.string()]),
    timeframe: z.string().default('1D'),
    parameters: z.record(z.any()).default({}),
  })).min(1),
  riskManagement: z.object({
    stopLoss: z.number().optional(),
    takeProfit: z.number().optional(),
    positionSize: z.number().min(0).max(1).default(0.1),
    maxPositions: z.number().int().min(1).default(5),
    riskPerTrade: z.number().min(0).max(1).default(0.02),
  }),
  targetSelection: z.object({
    type: z.enum(['deck', 'list', 'asset']),
    deckId: z.string().optional(),
    symbols: z.array(z.string()).optional(),
  }),
  isActive: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

// Helper function to get strategy from Firestore
async function getStrategy(strategyId: string) {
  const strategyDoc = await db.collection('strategies').doc(strategyId).get();
  if (!strategyDoc.exists) {
    throw new HttpsError('not-found', 'Strategy not found');
  }
  return { id: strategyDoc.id, ...strategyDoc.data() };
}

// Helper function to get symbols from universe
async function getUniverseSymbols(universe: any): Promise<string[]> {
  switch (universe.type) {
    case 'deck':
      if (!universe.deckId) {
        throw new HttpsError('invalid-argument', 'deckId required for deck universe');
      }
      const deckDoc = await db.collection('decks').doc(universe.deckId).get();
      if (!deckDoc.exists) {
        throw new HttpsError('not-found', 'Deck not found');
      }
      const deckData = deckDoc.data()!;
      return deckData.items?.map((item: any) => item.symbol) || [];
    
    case 'list':
    case 'asset':
      if (!universe.symbols || universe.symbols.length === 0) {
        throw new HttpsError('invalid-argument', 'symbols required for list/asset universe');
      }
      return universe.symbols;
    
    default:
      throw new HttpsError('invalid-argument', 'Invalid universe type');
  }
}

// Helper function to fetch market data (using Polygon API)
async function fetchMarketData(symbol: string, startDate: string, endDate: string) {
  try {
    const polygonApiKey = process.env.POLYGON_API_KEY;
    if (!polygonApiKey) {
      throw new Error('Polygon API key not configured');
    }

    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}`;
    const response = await axios.get(url, {
      params: {
        apikey: polygonApiKey,
        adjusted: true,
        sort: 'asc',
      },
    });

    if (response.data.status !== 'OK' || !response.data.results) {
      throw new Error(`No data available for ${symbol}`);
    }

    return response.data.results.map((bar: any) => ({
      timestamp: new Date(bar.t),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));
  } catch (error) {
    logger.error(`Error fetching market data for ${symbol}:`, error);
    throw new Error(`Failed to fetch market data for ${symbol}`);
  }
}

// Technical analysis functions
function calculateSMA(data: number[], period: number): number[] {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

function calculateEMA(data: number[], period: number): number[] {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = (data[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
  }
  return ema;
}

function calculateRSI(data: number[], period: number = 14): number[] {
  const rsi = [];
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
  }
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      rsi.push(NaN);
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
  }
  
  return [NaN, ...rsi]; // Add NaN at the beginning to match data length
}

// Strategy evaluation functions
function evaluateCondition(data: any[], indicators: any, condition: any): boolean {
  const { indicator, operator, value, parameters } = condition;
  
  if (!data || data.length === 0) return false;
  
  let currentValue: number;
  let compareValue: number | string = value;
  
  // Get indicator value
  switch (indicator) {
    case 'price':
      currentValue = data[data.length - 1].close;
      break;
    case 'sma':
      const smaPeriod = parameters.period || 20;
      const smaValues = calculateSMA(data.map(d => d.close), smaPeriod);
      currentValue = smaValues[smaValues.length - 1];
      break;
    case 'ema':
      const emaPeriod = parameters.period || 20;
      const emaValues = calculateEMA(data.map(d => d.close), emaPeriod);
      currentValue = emaValues[emaValues.length - 1];
      break;
    case 'rsi':
      const rsiPeriod = parameters.period || 14;
      const rsiValues = calculateRSI(data.map(d => d.close), rsiPeriod);
      currentValue = rsiValues[rsiValues.length - 1];
      break;
    case 'volume':
      currentValue = data[data.length - 1].volume;
      if (typeof value === 'string' && value.includes('avg')) {
        const avgPeriod = parameters.period || 20;
        const recentVolumes = data.slice(-avgPeriod).map(d => d.volume);
        compareValue = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
      }
      break;
    default:
      return false;
  }
  
  if (isNaN(currentValue)) return false;
  
  // Handle string comparison values (e.g., 'sma_200')
  if (typeof compareValue === 'string') {
    if (compareValue.startsWith('sma_')) {
      const period = parseInt(compareValue.split('_')[1]);
      const smaValues = calculateSMA(data.map(d => d.close), period);
      compareValue = smaValues[smaValues.length - 1];
    } else if (compareValue.startsWith('ema_')) {
      const period = parseInt(compareValue.split('_')[1]);
      const emaValues = calculateEMA(data.map(d => d.close), period);
      compareValue = emaValues[emaValues.length - 1];
    }
  }
  
  if (typeof compareValue === 'string') {
    compareValue = parseFloat(compareValue);
  }
  
  if (isNaN(compareValue)) return false;
  
  // Evaluate condition
  switch (operator) {
    case '>':
      return currentValue > compareValue;
    case '<':
      return currentValue < compareValue;
    case '>=':
      return currentValue >= compareValue;
    case '<=':
      return currentValue <= compareValue;
    case '==':
      return Math.abs(currentValue - compareValue) < 0.0001;
    case '!=':
      return Math.abs(currentValue - compareValue) >= 0.0001;
    case 'crosses_above':
      // Simplified: current > compare and previous <= compare
      if (data.length < 2) return false;
      const prevValue = getPreviousIndicatorValue(data.slice(0, -1), indicator, parameters);
      return currentValue > compareValue && prevValue <= compareValue;
    case 'crosses_below':
      if (data.length < 2) return false;
      const prevValueBelow = getPreviousIndicatorValue(data.slice(0, -1), indicator, parameters);
      return currentValue < compareValue && prevValueBelow >= compareValue;
    default:
      return false;
  }
}

function getPreviousIndicatorValue(data: any[], indicator: string, parameters: any): number {
  switch (indicator) {
    case 'price':
      return data[data.length - 1]?.close || 0;
    case 'sma':
      const smaPeriod = parameters.period || 20;
      const smaValues = calculateSMA(data.map(d => d.close), smaPeriod);
      return smaValues[smaValues.length - 1] || 0;
    case 'ema':
      const emaPeriod = parameters.period || 20;
      const emaValues = calculateEMA(data.map(d => d.close), emaPeriod);
      return emaValues[emaValues.length - 1] || 0;
    case 'rsi':
      const rsiPeriod = parameters.period || 14;
      const rsiValues = calculateRSI(data.map(d => d.close), rsiPeriod);
      return rsiValues[rsiValues.length - 1] || 0;
    default:
      return 0;
  }
}

// Backtesting engine
async function runBacktestForSymbol(strategy: any, symbol: string, config: any) {
  try {
    // Fetch market data
    const marketData = await fetchMarketData(symbol, config.startDate, config.endDate);
    
    if (marketData.length < 50) {
      throw new Error(`Insufficient data for ${symbol}`);
    }
    
    const trades: any[] = [];
    let position: any = null;
    let cash = config.initialCapital;
    let portfolioValue = cash;
    
    // Simulate trading
    for (let i = 50; i < marketData.length; i++) {
      const currentData = marketData.slice(0, i + 1);
      const currentPrice = currentData[currentData.length - 1].close;
      
      // Check for buy signal
      if (!position) {
        const buySignal = strategy.buyConditions.every((condition: any) => 
          evaluateCondition(currentData, {}, condition)
        );
        
        if (buySignal) {
          const quantity = Math.floor((cash * strategy.riskManagement.positionSize) / currentPrice);
          if (quantity > 0) {
            const entryPrice = currentPrice * (1 + config.slippage);
            const cost = quantity * entryPrice + (quantity * entryPrice * config.commission);
            
            if (cost <= cash) {
              position = {
                symbol,
                quantity,
                entryPrice,
                entryDate: currentData[currentData.length - 1].timestamp,
                entryIndex: i,
              };
              cash -= cost;
            }
          }
        }
      }
      
      // Check for sell signal
      if (position) {
        const sellSignal = strategy.sellConditions.every((condition: any) => 
          evaluateCondition(currentData, {}, condition)
        );
        
        // Also check stop loss and take profit
        const stopLossTriggered = strategy.riskManagement.stopLoss && 
          currentPrice <= position.entryPrice * (1 - strategy.riskManagement.stopLoss);
        const takeProfitTriggered = strategy.riskManagement.takeProfit && 
          currentPrice >= position.entryPrice * (1 + strategy.riskManagement.takeProfit);
        
        if (sellSignal || stopLossTriggered || takeProfitTriggered) {
          const exitPrice = currentPrice * (1 - config.slippage);
          const proceeds = position.quantity * exitPrice - (position.quantity * exitPrice * config.commission);
          
          const trade = {
            symbol,
            entryDate: position.entryDate.toISOString(),
            exitDate: currentData[currentData.length - 1].timestamp.toISOString(),
            entryPrice: position.entryPrice,
            exitPrice,
            quantity: position.quantity,
            returnPct: (exitPrice - position.entryPrice) / position.entryPrice,
            profitLoss: proceeds - (position.quantity * position.entryPrice),
            durationDays: Math.ceil((currentData[currentData.length - 1].timestamp.getTime() - position.entryDate.getTime()) / (1000 * 60 * 60 * 24)),
            signal: sellSignal ? 'sell' : (stopLossTriggered ? 'stop_loss' : 'take_profit'),
            conditionsMet: sellSignal ? strategy.sellConditions.map((c: any) => `${c.indicator} ${c.operator} ${c.value}`) : [],
          };
          
          trades.push(trade);
          cash += proceeds;
          position = null;
        }
      }
      
      // Update portfolio value
      portfolioValue = cash + (position ? position.quantity * currentPrice : 0);
    }
    
    // Calculate performance metrics
    const totalReturn = (portfolioValue - config.initialCapital) / config.initialCapital;
    const tradingDays = marketData.length;
    const annualizedReturn = Math.pow(1 + totalReturn, 252 / tradingDays) - 1;
    
    const returns = trades.map(t => t.returnPct);
    const winningTrades = trades.filter(t => t.returnPct > 0);
    const winRate = trades.length > 0 ? winningTrades.length / trades.length : 0;
    
    const avgTradeDuration = trades.length > 0 ? 
      trades.reduce((sum, t) => sum + t.durationDays, 0) / trades.length : 0;
    
    const profits = trades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + t.profitLoss, 0);
    const losses = Math.abs(trades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + t.profitLoss, 0));
    const profitFactor = losses > 0 ? profits / losses : (profits > 0 ? Infinity : 0);
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = config.initialCapital;
    let currentValue = config.initialCapital;
    
    for (const trade of trades) {
      currentValue += trade.profitLoss;
      if (currentValue > peak) {
        peak = currentValue;
      }
      const drawdown = (peak - currentValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    // Calculate Sharpe ratio (simplified)
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const returnStd = returns.length > 1 ? 
      Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)) : 0;
    const sharpeRatio = returnStd > 0 ? (avgReturn - 0.02/252) / returnStd * Math.sqrt(252) : 0;
    
    return {
      symbol,
      totalReturn,
      annualizedReturn,
      sharpeRatio,
      maxDrawdown,
      winRate,
      totalTrades: trades.length,
      avgTradeDuration,
      profitFactor,
      trades,
      finalPortfolioValue: portfolioValue,
    };
  } catch (error) {
    logger.error(`Error running backtest for ${symbol}:`, error);
    throw error;
  }
}

// Cloud Function: Run Backtest
export const runBacktest = onCall(
  {
    region: 'us-central1',
    timeoutSeconds: 540, // 9 minutes
    memory: '2GiB',
  },
  async (request) => {
    const { auth, data } = request;
    
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    try {
      const { strategyId, universe, config = {} } = runBacktestSchema.parse(data);
      
      // Get strategy
      const strategy = await getStrategy(strategyId);
      
      // Verify ownership
      if ((strategy as any).userId !== auth.uid) {
        throw new HttpsError('permission-denied', 'You can only backtest your own strategies');
      }
      
      // Get symbols to backtest
      const symbols = await getUniverseSymbols(universe);
      
      if (symbols.length === 0) {
        throw new HttpsError('invalid-argument', 'No symbols found in universe');
      }
      
      // Default config
      const backtestConfig = {
        startDate: (config as any).startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: (config as any).endDate || new Date().toISOString().split('T')[0],
        initialCapital: (config as any).initialCapital || 10000,
        commission: (config as any).commission || 0.001,
        slippage: (config as any).slippage || 0.0005,
        benchmark: (config as any).benchmark || 'SPY',
      };
      
      // Run backtests for all symbols
      const results = [];
      const errors = [];
      
      for (const symbol of symbols) {
        try {
          logger.info(`Running backtest for ${symbol}`);
          const result = await runBacktestForSymbol(strategy, symbol, backtestConfig);
          results.push(result);
        } catch (error) {
          logger.error(`Failed to backtest ${symbol}:`, error);
          errors.push({ symbol, error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      // Calculate aggregate metrics
      const aggregateMetrics = {
        totalSymbols: symbols.length,
        successfulBacktests: results.length,
        failedBacktests: errors.length,
        avgTotalReturn: results.length > 0 ? results.reduce((sum, r) => sum + r.totalReturn, 0) / results.length : 0,
        avgSharpeRatio: results.length > 0 ? results.reduce((sum, r) => sum + r.sharpeRatio, 0) / results.length : 0,
        avgWinRate: results.length > 0 ? results.reduce((sum, r) => sum + r.winRate, 0) / results.length : 0,
        totalTrades: results.reduce((sum, r) => sum + r.totalTrades, 0),
      };
      
      // Create backtest document
      const backtestId = db.collection('backtests').doc().id;
      const backtestData = {
        id: backtestId,
        strategyId,
        userId: auth.uid,
        universe,
        config: backtestConfig,
        results,
        aggregateMetrics,
        errors,
        status: 'completed',
        createdAt: FieldValue.serverTimestamp(),
      };
      
      await db.collection('backtests').doc(backtestId).set(backtestData);
      
      // Update strategy with latest backtest results
      await db.collection('strategies').doc(strategyId).update({
        lastBacktestId: backtestId,
        lastBacktestAt: FieldValue.serverTimestamp(),
        performanceMetrics: aggregateMetrics,
      });
      
      logger.info(`Backtest completed for strategy ${strategyId}: ${results.length}/${symbols.length} successful`);
      
      return {
        success: true,
        backtestId,
        results: results.slice(0, 10), // Return first 10 results
        aggregateMetrics,
        errors: errors.slice(0, 5), // Return first 5 errors
        totalSymbols: symbols.length,
        message: `Backtest completed: ${results.length}/${symbols.length} symbols successful`,
      };
      
    } catch (error) {
      logger.error('Error running backtest:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to run backtest');
    }
  }
);

// Cloud Function: Create Strategy
export const createStrategy = onCall(
  {
    region: 'us-central1',
  },
  async (request) => {
    const { auth, data } = request;
    
    if (!auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    try {
      const validatedData = createStrategySchema.parse(data);
      
      const strategyId = db.collection('strategies').doc().id;
      const strategyData = {
        id: strategyId,
        userId: auth.uid,
        ...validatedData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastRunAt: null,
        performanceMetrics: null,
        backtestResults: [],
      };
      
      await db.collection('strategies').doc(strategyId).set(strategyData);
      
      logger.info(`Strategy created: ${strategyId} by user ${auth.uid}`);
      
      return {
        success: true,
        strategyId,
        message: 'Strategy created successfully',
      };
      
    } catch (error) {
      logger.error('Error creating strategy:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to create strategy');
    }
  }
);

// Enhanced Scheduled function: Scan and Alert with Push Notifications
export const scanAndAlert = onSchedule(
  {
    schedule: '0 * * * *', // Run every hour (configurable)
    timeZone: 'America/New_York',
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 300,
  },
  async () => {
    logger.info('Starting scheduled strategy scan and alert');
    
    try {
      // Check if it's market hours (9 AM - 4 PM EST, Monday-Friday)
      const now = new Date();
      const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      const hour = easternTime.getHours();
      const day = easternTime.getDay();
      
      const isMarketHours = day >= 1 && day <= 5 && hour >= 9 && hour <= 16;
      const isExtendedHours = day >= 1 && day <= 5 && (hour >= 4 && hour <= 20);
      
      // Get configuration for scan frequency
      const configDoc = await db.collection('config').doc('alerts').get();
      const config = configDoc.exists ? configDoc.data() || {} : {};
      
      const scanConfig = {
        marketHoursOnly: (config as any).marketHoursOnly || false,
        extendedHours: (config as any).extendedHours || true,
        weekendsEnabled: (config as any).weekendsEnabled || false,
        cryptoAlwaysOn: (config as any).cryptoAlwaysOn || true,
        ...config
      };
      
      // Skip if outside configured hours
      if (scanConfig.marketHoursOnly && !isMarketHours) {
        logger.info('Skipping scan - outside market hours');
        return;
      }
      
      if (!scanConfig.extendedHours && !isMarketHours && !scanConfig.weekendsEnabled && (day === 0 || day === 6)) {
        logger.info('Skipping scan - outside configured trading hours');
        return;
      }
      
      // Get all active strategies
      const strategiesSnapshot = await db.collection('strategies')
        .where('isActive', '==', true)
        .get();
      
      if (strategiesSnapshot.empty) {
        logger.info('No active strategies found');
        return;
      }
      
      const alertPromises = [];
      const strategies = strategiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      logger.info(`Processing ${strategies.length} active strategies`);
      
      for (const strategy of strategies) {
        try {
          // Get target symbols
          const symbols = await getUniverseSymbols((strategy as any).targetSelection);
          
          for (const symbol of symbols) {
            // Check if symbol is crypto for 24/7 monitoring
            const isCrypto = symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH');
            
            if (!scanConfig.cryptoAlwaysOn && isCrypto && !isExtendedHours) {
              continue; // Skip crypto if not in extended hours and crypto always-on is disabled
            }
            
            alertPromises.push(
              checkStrategyForSymbol(strategy, symbol, scanConfig)
                .catch(error => {
                  logger.error(`Error checking ${strategy.id} for ${symbol}:`, error);
                  return null;
                })
            );
          }
          
        } catch (error) {
          logger.error(`Error processing strategy ${strategy.id}:`, error);
        }
      }
      
      const results = await Promise.allSettled(alertPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const alerts = results
        .filter(r => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.status === 'fulfilled' ? r.value : null)
        .filter(v => v !== null);
      
      // Send push notifications for new alerts
      if (alerts.length > 0) {
        await sendPushNotificationsForAlerts(alerts);
      }
      
      logger.info(`Strategy scan completed: ${successful} successful, ${failed} failed, ${alerts.length} alerts generated`);
      
      // Update scan statistics
      await updateScanStatistics({
        timestamp: FieldValue.serverTimestamp(),
        strategiesProcessed: strategies.length,
        alertsGenerated: alerts.length,
        successful,
        failed,
        marketHours: isMarketHours,
        extendedHours: isExtendedHours,
      });
      
    } catch (error) {
      logger.error('Error in scheduled strategy scan:', error);
    }
  }
);

async function checkStrategyForSymbol(strategy: any, symbol: string, scanConfig: any = {}) {
  try {
    // Get recent market data (last 30 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const marketData = await fetchMarketData(symbol, startDate, endDate);
    
    if (marketData.length < 20) {
      return null; // Not enough data
    }
    
    // Check for duplicate alerts in the last hour to avoid spam
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentAlertsQuery = await db.collection('alerts')
      .where('userId', '==', strategy.userId)
      .where('strategyId', '==', strategy.id)
      .where('symbol', '==', symbol)
      .where('createdAt', '>', Timestamp.fromDate(oneHourAgo))
      .get();
    
    if (!recentAlertsQuery.empty) {
      logger.info(`Skipping duplicate alert for ${symbol} from strategy ${strategy.id}`);
      return null;
    }
    
    // Check buy conditions
    const buySignal = strategy.buyConditions.every((condition: any) => 
      evaluateCondition(marketData, {}, condition)
    );
    
    // Check sell conditions
    const sellSignal = strategy.sellConditions.every((condition: any) => 
      evaluateCondition(marketData, {}, condition)
    );
    
    if (buySignal || sellSignal) {
      const currentPrice = marketData[marketData.length - 1].close;
      const signalType = buySignal ? 'buy' : 'sell';
      
      // Calculate signal confidence
      const confidence = calculateSignalConfidence(marketData, strategy, signalType);
      
      // Skip low confidence signals if configured
      const minConfidence = scanConfig.minConfidence || 0.5;
      if (confidence < minConfidence) {
        logger.info(`Skipping low confidence signal (${confidence.toFixed(2)}) for ${symbol}`);
        return null;
      }
      
      // Create alert
      const alertId = db.collection('alerts').doc().id;
      const alertData = {
        id: alertId,
        userId: strategy.userId,
        strategyId: strategy.id,
        strategyName: strategy.name,
        symbol,
        alertType: 'signal',
        signalType,
        title: `${signalType.toUpperCase()} Signal: ${symbol}`,
        message: `Strategy "${strategy.name}" generated a ${signalType} signal for ${symbol} at $${currentPrice.toFixed(2)}`,
        priority: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low',
        confidence,
        data: {
          price: currentPrice,
          confidence,
          conditionsMet: buySignal ? 
            strategy.buyConditions.map((c: any) => `${c.indicator} ${c.operator} ${c.value}`) :
            strategy.sellConditions.map((c: any) => `${c.indicator} ${c.operator} ${c.value}`),
          marketData: {
            volume: marketData[marketData.length - 1].volume,
            change: ((currentPrice - marketData[marketData.length - 2].close) / marketData[marketData.length - 2].close) * 100,
          }
        },
        methods: ['push'],
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
      };
      
      await db.collection('alerts').doc(alertId).set(alertData);
      
      logger.info(`Alert created: ${signalType} signal for ${symbol} from strategy ${strategy.name} (confidence: ${confidence.toFixed(2)})`);
      
      return alertData;
    }
    
    return null;
    
  } catch (error) {
    logger.error(`Error checking strategy ${strategy.id} for ${symbol}:`, error);
    throw error;
  }
}

// Calculate signal confidence based on market conditions
function calculateSignalConfidence(marketData: any[], strategy: any, signalType: string): number {
  let confidence = 0.6; // Base confidence
  
  try {
    const currentPrice = marketData[marketData.length - 1].close;
    const previousPrice = marketData[marketData.length - 2].close;
    const currentVolume = marketData[marketData.length - 1].volume;
    
    // Calculate recent average volume
    const recentVolumes = marketData.slice(-10).map((d: any) => d.volume);
    const avgVolume = recentVolumes.reduce((sum: number, vol: number) => sum + vol, 0) / recentVolumes.length;
    
    // Volume confirmation
    if (currentVolume > avgVolume * 1.5) {
      confidence += 0.15; // High volume increases confidence
    } else if (currentVolume < avgVolume * 0.5) {
      confidence -= 0.1; // Low volume decreases confidence
    }
    
    // Price momentum confirmation
    const priceChange = (currentPrice - previousPrice) / previousPrice;
    if (signalType === 'buy' && priceChange > 0) {
      confidence += 0.1; // Positive momentum for buy signal
    } else if (signalType === 'sell' && priceChange < 0) {
      confidence += 0.1; // Negative momentum for sell signal
    }
    
    // Multiple conditions increase confidence
    const totalConditions = strategy.buyConditions.length + strategy.sellConditions.length;
    if (totalConditions >= 3) {
      confidence += 0.05;
    }
    
    // Market volatility adjustment
    const recentPrices = marketData.slice(-5).map((d: any) => d.close);
    const returns = recentPrices.slice(1).map((price: number, i: number) => (price - recentPrices[i]) / recentPrices[i]);
    const volatility = Math.sqrt(returns.reduce((sum: number, r: number) => sum + r * r, 0) / returns.length);
    
    if (volatility > 0.05) {
      confidence -= 0.05; // High volatility decreases confidence
    }
    
  } catch (error) {
    logger.warn('Error calculating signal confidence:', error);
  }
  
  return Math.max(0.1, Math.min(1.0, confidence));
}

// Send push notifications for new alerts
async function sendPushNotificationsForAlerts(alerts: any[]) {
  try {
    const userAlerts = new Map<string, any[]>();
    
    // Group alerts by user
    alerts.forEach(alert => {
      if (!userAlerts.has(alert.userId)) {
        userAlerts.set(alert.userId, []);
      }
      userAlerts.get(alert.userId)!.push(alert);
    });
    
    const notificationPromises = [];
    
    for (const [userId, userAlertsArray] of userAlerts) {
      notificationPromises.push(sendUserPushNotifications(userId, userAlertsArray));
    }
    
    await Promise.allSettled(notificationPromises);
    
  } catch (error) {
    logger.error('Error sending push notifications:', error);
  }
}

// Send push notifications to a specific user
async function sendUserPushNotifications(userId: string, alerts: any[]) {
  try {
    // Get user's push notification settings
    const pushSettingsDoc = await db.collection('users').doc(userId).collection('settings').doc('push').get();
    
    if (!pushSettingsDoc.exists) {
      logger.info(`No push settings found for user ${userId}`);
      return;
    }
    
    const pushSettings = pushSettingsDoc.data()!;
    
    if (!pushSettings.enabled || !pushSettings.tradingAlerts) {
      logger.info(`Push notifications disabled for user ${userId}`);
      return;
    }
    
    // Check quiet hours
    if (pushSettings.quietHours?.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = pushSettings.quietHours;
      
      let isQuietTime = false;
      if (start > end) {
        // Overnight quiet hours (e.g., 22:00 to 08:00)
        isQuietTime = currentTime >= start || currentTime <= end;
      } else {
        isQuietTime = currentTime >= start && currentTime <= end;
      }
      
      if (isQuietTime) {
        logger.info(`Skipping notifications for user ${userId} - quiet hours`);
        return;
      }
    }
    
    const deviceToken = pushSettings.deviceToken;
    if (!deviceToken) {
      logger.warn(`No device token found for user ${userId}`);
      return;
    }
    
    // Prepare notifications
    const notifications = [];
    
    if (alerts.length === 1) {
      // Single alert
      const alert = alerts[0];
      notifications.push({
        to: deviceToken,
        title: alert.title,
        body: alert.message,
        data: {
          alertId: alert.id,
          strategyId: alert.strategyId,
          symbol: alert.symbol,
          signalType: alert.signalType,
          type: 'trading_alert',
        },
        sound: 'default',
        badge: 1,
        priority: alert.priority === 'high' ? 'high' : 'normal',
      });
    } else {
      // Multiple alerts - send summary
      const buyAlerts = alerts.filter(a => a.signalType === 'buy');
      const sellAlerts = alerts.filter(a => a.signalType === 'sell');
      
      let title = 'Trading Alerts';
      let body = '';
      
      if (buyAlerts.length > 0 && sellAlerts.length > 0) {
        body = `${buyAlerts.length} buy signals, ${sellAlerts.length} sell signals`;
      } else if (buyAlerts.length > 0) {
        body = `${buyAlerts.length} buy signal${buyAlerts.length > 1 ? 's' : ''}`;
      } else {
        body = `${sellAlerts.length} sell signal${sellAlerts.length > 1 ? 's' : ''}`;
      }
      
      notifications.push({
        to: deviceToken,
        title,
        body,
        data: {
          alertCount: alerts.length,
          type: 'trading_alerts_summary',
        },
        sound: 'default',
        badge: alerts.length,
        priority: 'normal',
      });
    }
    
    // Send notifications using Expo Push API
    for (const notification of notifications) {
      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notification),
        });
        
        if (!response.ok) {
          throw new Error(`Push notification failed: ${response.status}`);
        }
        
        const result = await response.json();
        logger.info(`Push notification sent to user ${userId}:`, result);
        
      } catch (error) {
        logger.error(`Error sending push notification to user ${userId}:`, error);
      }
    }
    
  } catch (error) {
    logger.error(`Error sending push notifications to user ${userId}:`, error);
  }
}

// Update scan statistics
async function updateScanStatistics(stats: any) {
  try {
    const statsRef = db.collection('system').doc('scanStats');
    
    // Get current stats
    const currentStatsDoc = await statsRef.get();
    const currentStats = currentStatsDoc.exists ? currentStatsDoc.data() || {} : {};
    
    // Update counters
    const updatedStats = {
      lastScanAt: stats.timestamp,
      totalScans: (currentStats.totalScans || 0) + 1,
      totalStrategiesProcessed: (currentStats.totalStrategiesProcessed || 0) + stats.strategiesProcessed,
      totalAlertsGenerated: (currentStats.totalAlertsGenerated || 0) + stats.alertsGenerated,
      totalSuccessful: (currentStats.totalSuccessful || 0) + stats.successful,
      totalFailed: (currentStats.totalFailed || 0) + stats.failed,
      lastScanResults: {
        strategiesProcessed: stats.strategiesProcessed,
        alertsGenerated: stats.alertsGenerated,
        successful: stats.successful,
        failed: stats.failed,
        marketHours: stats.marketHours,
        extendedHours: stats.extendedHours,
      },
    };
    
    await statsRef.set(updatedStats);
    
  } catch (error) {
    logger.error('Error updating scan statistics:', error);
  }
}

// Trigger: Update strategy performance when backtest is created
export const updateStrategyPerformance = onDocumentCreated(
  'backtests/{backtestId}',
  async (event) => {
    const backtestData = event.data?.data();
    if (!backtestData || !backtestData.strategyId) {
      return;
    }
    
    try {
      const { strategyId, aggregateMetrics } = backtestData;
      
      await db.collection('strategies').doc(strategyId).update({
        performanceMetrics: aggregateMetrics,
        lastBacktestAt: FieldValue.serverTimestamp(),
      });
      
      logger.info(`Updated performance metrics for strategy ${strategyId}`);
      
    } catch (error) {
      logger.error('Error updating strategy performance:', error);
    }
  }
);

// Trigger: Clean up old alerts
export const cleanupOldAlerts = onSchedule(
  {
    schedule: '0 0 * * *', // Daily at midnight
    timeZone: 'UTC',
    region: 'us-central1',
  },
  async () => {
    try {
      const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const oldAlertsSnapshot = await db.collection('alerts')
        .where('createdAt', '<', Timestamp.fromDate(cutoffDate))
        .get();
      
      if (oldAlertsSnapshot.empty) {
        logger.info('No old alerts to clean up');
        return;
      }
      
      const batch = db.batch();
      oldAlertsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      logger.info(`Cleaned up ${oldAlertsSnapshot.size} old alerts`);
      
    } catch (error) {
      logger.error('Error cleaning up old alerts:', error);
    }
  }
);
