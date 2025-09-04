import { z } from 'zod';

// Enums
export const DataTierEnum = z.enum([
  'FREEMIUM',
  'MARKET_HOURS_PRO', 
  'SECTOR_SPECIALIST',
  'WEEKEND_WARRIOR',
  'DARK_POOL_INSIDER',
  'ALGORITHMIC_TRADER',
  'INSTITUTIONAL_ELITE'
]);

export const StrategyTypeEnum = z.enum([
  'technical',
  'fundamental', 
  'sentiment',
  'hybrid',
  'custom'
]);

export const SignalTypeEnum = z.enum([
  'buy',
  'sell',
  'hold',
  'strong_buy',
  'strong_sell'
]);

export const IndicatorTypeEnum = z.enum([
  'sma',
  'ema',
  'rsi',
  'macd',
  'bollinger',
  'stochastic',
  'volume',
  'sentiment',
  'custom'
]);

export const OperatorEnum = z.enum([
  '>',
  '<',
  '>=',
  '<=',
  '==',
  '!=',
  'crosses_above',
  'crosses_below',
  'between',
  'outside'
]);

export const TimeframeEnum = z.enum([
  '1m',
  '5m',
  '15m',
  '30m',
  '1h',
  '4h',
  '1D',
  '1W',
  '1M'
]);

export const TargetTypeEnum = z.enum([
  'deck',
  'list',
  'asset'
]);

// Base schemas
export const StrategyConditionSchema = z.object({
  id: z.string().optional(),
  indicator: IndicatorTypeEnum,
  operator: OperatorEnum,
  value: z.union([z.number(), z.string()]),
  secondValue: z.union([z.number(), z.string()]).optional(), // For "between" operations
  timeframe: TimeframeEnum.default('1D'),
  parameters: z.record(z.string(), z.any()).default({}),
  description: z.string().optional(),
  weight: z.number().min(0).max(1).default(1), // Condition importance weight
});

export const RiskManagementSchema = z.object({
  stopLoss: z.number().min(0).max(1).optional(), // Percentage
  takeProfit: z.number().min(0).optional(), // Percentage
  positionSize: z.number().min(0).max(1).default(0.1), // Portfolio percentage
  maxPositions: z.number().int().min(1).default(5),
  riskPerTrade: z.number().min(0).max(1).default(0.02), // 2% risk per trade
  trailingStop: z.boolean().default(false),
  trailingStopDistance: z.number().min(0).optional(),
  dynamicSizing: z.boolean().default(false),
  volatilityAdjustment: z.boolean().default(false),
});

export const TargetSelectionSchema = z.object({
  type: TargetTypeEnum,
  deckId: z.string().optional(), // Required if type is 'deck'
  symbols: z.array(z.string()).optional(), // Required if type is 'list' or 'asset'
  filters: z.object({
    marketCap: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    sector: z.array(z.string()).optional(),
    exchange: z.array(z.string()).optional(),
    priceRange: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
  }).optional(),
});

export const BacktestConfigSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  initialCapital: z.number().min(1000).default(10000),
  commission: z.number().min(0).default(0.001), // 0.1%
  slippage: z.number().min(0).default(0.0005), // 0.05%
  benchmark: z.string().default('SPY'),
  rebalanceFrequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

export const StrategySchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  strategyType: StrategyTypeEnum,
  
  // Conditions
  buyConditions: z.array(StrategyConditionSchema).min(1),
  sellConditions: z.array(StrategyConditionSchema).min(1),
  
  // Configuration
  riskManagement: RiskManagementSchema,
  targetSelection: TargetSelectionSchema,
  
  // Metadata
  tierRequired: DataTierEnum.default('FREEMIUM'),
  isActive: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  
  // Timestamps
  createdAt: z.date(),
  updatedAt: z.date(),
  lastRunAt: z.date().optional(),
  
  // Performance data
  performanceMetrics: z.object({
    totalReturn: z.number(),
    annualizedReturn: z.number(),
    sharpeRatio: z.number(),
    maxDrawdown: z.number(),
    winRate: z.number(),
    totalTrades: z.number(),
    avgTradeDuration: z.number(),
    profitFactor: z.number(),
    calmarRatio: z.number().optional(),
    sortinoRatio: z.number().optional(),
    beta: z.number().optional(),
    alpha: z.number().optional(),
  }).optional(),
  
  // Backtest results
  backtestResults: z.array(z.object({
    id: z.string(),
    symbol: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    totalReturn: z.number(),
    annualizedReturn: z.number(),
    sharpeRatio: z.number(),
    maxDrawdown: z.number(),
    winRate: z.number(),
    totalTrades: z.number(),
    trades: z.array(z.object({
      entryDate: z.string().datetime(),
      exitDate: z.string().datetime(),
      entryPrice: z.number(),
      exitPrice: z.number(),
      quantity: z.number(),
      returnPct: z.number(),
      profitLoss: z.number(),
      durationDays: z.number(),
      signal: SignalTypeEnum,
    })),
    createdAt: z.string().datetime(),
  })).default([]),
});

export const SignalSchema = z.object({
  id: z.string(),
  strategyId: z.string(),
  symbol: z.string(),
  signalType: SignalTypeEnum,
  confidence: z.number().min(0).max(1),
  price: z.number().min(0),
  timestamp: z.date(),
  conditionsMet: z.array(z.string()),
  marketData: z.record(z.string(), z.any()),
  sentimentData: z.record(z.string(), z.any()).optional(),
  isProcessed: z.boolean().default(false),
  
  // Additional context
  volume: z.number().optional(),
  technicalIndicators: z.record(z.string(), z.number()).optional(),
  newsImpact: z.number().min(-1).max(1).optional(),
  
  // Alert settings
  alertSent: z.boolean().default(false),
  alertMethods: z.array(z.enum(['push', 'email', 'sms'])).default(['push']),
});

export const BacktestResultSchema = z.object({
  id: z.string(),
  strategyId: z.string(),
  symbol: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  
  // Performance metrics
  totalReturn: z.number(),
  annualizedReturn: z.number(),
  sharpeRatio: z.number(),
  maxDrawdown: z.number(),
  winRate: z.number(),
  totalTrades: z.number(),
  avgTradeDuration: z.number(),
  profitFactor: z.number(),
  
  // Additional metrics
  calmarRatio: z.number().optional(),
  sortinoRatio: z.number().optional(),
  beta: z.number().optional(),
  alpha: z.number().optional(),
  volatility: z.number().optional(),
  
  // Comparison with benchmark
  benchmarkReturn: z.number().optional(),
  excessReturn: z.number().optional(),
  trackingError: z.number().optional(),
  informationRatio: z.number().optional(),
  
  // Trade details
  trades: z.array(z.object({
    entryDate: z.string().datetime(),
    exitDate: z.string().datetime(),
    entryPrice: z.number(),
    exitPrice: z.number(),
    quantity: z.number(),
    returnPct: z.number(),
    profitLoss: z.number(),
    durationDays: z.number(),
    signal: SignalTypeEnum,
    conditionsMet: z.array(z.string()),
  })),
  
  // Metadata
  createdAt: z.date(),
  config: BacktestConfigSchema,
});

export const AlertSchema = z.object({
  id: z.string(),
  userId: z.string(),
  strategyId: z.string(),
  signalId: z.string(),
  symbol: z.string(),
  alertType: z.enum(['signal', 'performance', 'risk']),
  title: z.string(),
  message: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  
  // Alert data
  data: z.record(z.string(), z.any()).optional(),
  
  // Delivery
  methods: z.array(z.enum(['push', 'email', 'sms'])).default(['push']),
  sentAt: z.date().optional(),
  readAt: z.date().optional(),
  
  // Metadata
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});

// Type exports
export type DataTier = z.infer<typeof DataTierEnum>;
export type StrategyType = z.infer<typeof StrategyTypeEnum>;
export type SignalType = z.infer<typeof SignalTypeEnum>;
export type IndicatorType = z.infer<typeof IndicatorTypeEnum>;
export type Operator = z.infer<typeof OperatorEnum>;
export type Timeframe = z.infer<typeof TimeframeEnum>;
export type TargetType = z.infer<typeof TargetTypeEnum>;

export type StrategyCondition = z.infer<typeof StrategyConditionSchema>;
export type RiskManagement = z.infer<typeof RiskManagementSchema>;
export type TargetSelection = z.infer<typeof TargetSelectionSchema>;
export type BacktestConfig = z.infer<typeof BacktestConfigSchema>;
export type Strategy = z.infer<typeof StrategySchema>;
export type Signal = z.infer<typeof SignalSchema>;
export type BacktestResult = z.infer<typeof BacktestResultSchema>;
export type Alert = z.infer<typeof AlertSchema>;

// Validation helpers
export const validateStrategy = (data: unknown): Strategy => {
  return StrategySchema.parse(data);
};

export const validateStrategyCondition = (data: unknown): StrategyCondition => {
  return StrategyConditionSchema.parse(data);
};

export const validateBacktestConfig = (data: unknown): BacktestConfig => {
  return BacktestConfigSchema.parse(data);
};

export const validateSignal = (data: unknown): Signal => {
  return SignalSchema.parse(data);
};

// Default values
export const DEFAULT_RISK_MANAGEMENT: RiskManagement = {
  positionSize: 0.1,
  maxPositions: 5,
  riskPerTrade: 0.02,
  trailingStop: false,
  dynamicSizing: false,
  volatilityAdjustment: false,
};

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
  endDate: new Date().toISOString(),
  initialCapital: 10000,
  commission: 0.001,
  slippage: 0.0005,
  benchmark: 'SPY',
  rebalanceFrequency: 'daily',
};

// Common indicator configurations
export const INDICATOR_CONFIGS = {
  sma: {
    name: 'Simple Moving Average',
    parameters: { period: 20 },
    description: 'Average price over a specified period',
  },
  ema: {
    name: 'Exponential Moving Average',
    parameters: { period: 20 },
    description: 'Weighted average giving more importance to recent prices',
  },
  rsi: {
    name: 'Relative Strength Index',
    parameters: { period: 14 },
    description: 'Momentum oscillator measuring speed and change of price movements',
  },
  macd: {
    name: 'MACD',
    parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    description: 'Trend-following momentum indicator',
  },
  bollinger: {
    name: 'Bollinger Bands',
    parameters: { period: 20, standardDeviations: 2 },
    description: 'Volatility bands placed above and below a moving average',
  },
  stochastic: {
    name: 'Stochastic Oscillator',
    parameters: { kPeriod: 14, dPeriod: 3 },
    description: 'Momentum indicator comparing closing price to price range',
  },
  volume: {
    name: 'Volume',
    parameters: { period: 20 },
    description: 'Trading volume analysis',
  },
} as const;

// Strategy templates
export const STRATEGY_TEMPLATES = {
  goldenCross: {
    name: 'Golden Cross',
    description: 'Buy when 50-day SMA crosses above 200-day SMA',
    strategyType: 'technical' as StrategyType,
    buyConditions: [
      {
        indicator: 'sma' as IndicatorType,
        operator: 'crosses_above' as Operator,
        value: 'sma_200',
        timeframe: '1D' as Timeframe,
        parameters: { period: 50 },
      }
    ],
    sellConditions: [
      {
        indicator: 'sma' as IndicatorType,
        operator: 'crosses_below' as Operator,
        value: 'sma_200',
        timeframe: '1D' as Timeframe,
        parameters: { period: 50 },
      }
    ],
  },
  rsiOversold: {
    name: 'RSI Oversold',
    description: 'Buy when RSI drops below 30, sell when it rises above 70',
    strategyType: 'technical' as StrategyType,
    buyConditions: [
      {
        indicator: 'rsi' as IndicatorType,
        operator: '<' as Operator,
        value: 30,
        timeframe: '1D' as Timeframe,
        parameters: { period: 14 },
      }
    ],
    sellConditions: [
      {
        indicator: 'rsi' as IndicatorType,
        operator: '>' as Operator,
        value: 70,
        timeframe: '1D' as Timeframe,
        parameters: { period: 14 },
      }
    ],
  },
  macdCrossover: {
    name: 'MACD Crossover',
    description: 'Buy when MACD line crosses above signal line',
    strategyType: 'technical' as StrategyType,
    buyConditions: [
      {
        indicator: 'macd' as IndicatorType,
        operator: 'crosses_above' as Operator,
        value: 'macd_signal',
        timeframe: '1D' as Timeframe,
        parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      }
    ],
    sellConditions: [
      {
        indicator: 'macd' as IndicatorType,
        operator: 'crosses_below' as Operator,
        value: 'macd_signal',
        timeframe: '1D' as Timeframe,
        parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      }
    ],
  },
} as const;
