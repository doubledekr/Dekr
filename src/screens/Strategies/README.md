# Strategy Builder Integration

A comprehensive trading strategy development, backtesting, and deployment system integrated from the [Dekr Strategy Builder Enhanced](https://github.com/doubledekr/Module-5-Dekr-Strategy-Builder-Enhanced) repository.

## Overview

The Strategy Builder enables users to create, test, and deploy automated trading strategies using technical analysis, fundamental analysis, and sentiment analysis. The system includes:

1. **Strategy Editor** - Visual strategy builder with condition editor
2. **Backtesting Engine** - Historical performance testing with detailed metrics
3. **Signal Generation** - Real-time trading signal generation
4. **Alert System** - Automated notifications for strategy signals
5. **Cloud Functions** - Server-side strategy execution and monitoring

## Features

### 🎯 **Strategy Creation**

#### **Visual Strategy Builder**
- **Drag-and-Drop Interface**: Intuitive condition builder
- **Technical Indicators**: SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic
- **Multiple Timeframes**: 1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W, 1M
- **Complex Conditions**: Crosses above/below, between ranges, multiple operators
- **Strategy Templates**: Pre-built strategies (Golden Cross, RSI Oversold, MACD Crossover)

#### **Risk Management**
- **Position Sizing**: Percentage of portfolio per trade
- **Stop Loss**: Automatic loss protection
- **Take Profit**: Profit target levels
- **Max Positions**: Concurrent position limits
- **Trailing Stops**: Dynamic stop loss adjustment

#### **Target Selection**
- **Apply to Deck**: Run strategy on entire deck holdings
- **Apply to List**: Custom symbol lists
- **Apply to Asset**: Individual stock/crypto targeting

### 📊 **Backtesting System**

#### **Historical Testing**
- **Multi-Symbol Backtests**: Test across multiple assets simultaneously
- **Configurable Periods**: 1Y, 2Y, 5Y historical data
- **Commission & Slippage**: Realistic trading cost modeling
- **Benchmark Comparison**: Compare against buy-and-hold strategies

#### **Performance Metrics**
- **Return Metrics**: Total return, annualized return, excess return
- **Risk Metrics**: Sharpe ratio, max drawdown, volatility
- **Trade Analysis**: Win rate, profit factor, average trade duration
- **Advanced Metrics**: Calmar ratio, Sortino ratio, Information ratio

#### **Visual Analytics**
- **Performance Charts**: Strategy vs benchmark comparison
- **Equity Curves**: Portfolio value over time
- **Drawdown Analysis**: Risk visualization
- **Trade Distribution**: Win/loss analysis

### 🚨 **Real-Time Alerts**

#### **Signal Generation**
- **Scheduled Scanning**: Market hours monitoring (9 AM, 3 PM EST)
- **Condition Evaluation**: Real-time technical analysis
- **Confidence Scoring**: Signal quality assessment
- **Multi-Asset Monitoring**: Simultaneous strategy execution

#### **Alert Delivery**
- **Push Notifications**: Mobile alerts
- **Email Notifications**: Detailed signal information
- **In-App Alerts**: Real-time dashboard updates
- **Priority Levels**: Critical, high, medium, low

## Technical Implementation

### **Frontend Architecture**

#### **Strategy Types** (`src/types/strategy.ts`)
```typescript
interface Strategy {
  id: string;
  name: string;
  description?: string;
  strategyType: 'technical' | 'fundamental' | 'sentiment' | 'hybrid' | 'custom';
  buyConditions: StrategyCondition[];
  sellConditions: StrategyCondition[];
  riskManagement: RiskManagement;
  targetSelection: TargetSelection;
  performanceMetrics?: PerformanceMetrics;
}

interface StrategyCondition {
  indicator: IndicatorType;
  operator: Operator;
  value: number | string;
  timeframe: Timeframe;
  parameters: Record<string, any>;
}
```

#### **React Hooks** (`src/hooks/useStrategies.ts`)
- **`useStrategies()`**: Strategy list management with real-time updates
- **`useCreateStrategy()`**: Strategy creation with validation
- **`useUpdateStrategy()`**: Strategy modification
- **`useRunBacktest()`**: Backtest execution with progress tracking
- **`useAlerts()`**: Real-time alert management

#### **Screen Components**
- **`StrategyListScreen`**: Strategy portfolio with performance overview
- **`StrategyEditorScreen`**: Visual strategy builder with templates
- **`BacktestScreen`**: Historical testing with detailed analytics

### **Backend Architecture**

#### **Cloud Functions** (`functions/src/strategies.ts`)

##### **`runBacktest(strategyId, universe, config)`**
- Validates strategy configuration and user permissions
- Fetches historical market data from Polygon API
- Executes headless backtesting engine with technical analysis
- Stores comprehensive results in `backtests/{backtestId}` collection
- Returns performance metrics and trade history

##### **`scanAndAlert()` (Scheduled)**
- Runs on market schedule (9 AM, 3 PM EST weekdays)
- Evaluates all active strategies against current market data
- Generates signals when conditions are met
- Creates alerts in `alerts/{uid}/items` collection
- Supports push notifications and email delivery

##### **`createStrategy(strategyData)`**
- Validates strategy configuration with Zod schemas
- Creates strategy document with user ownership
- Initializes performance tracking
- Returns strategy ID for immediate use

### **Strategy Engine** (`packages/strategy-engine/`)

#### **Technical Analysis Engine**
```typescript
class TechnicalAnalysis {
  calculateSMA(prices: number[], period: number): number[];
  calculateEMA(prices: number[], period: number): number[];
  calculateRSI(prices: number[], period: number): number[];
  calculateMACD(prices: number[], fast: number, slow: number): MACD;
  calculateBollingerBands(prices: number[], period: number, stdDev: number): BollingerBands;
  evaluateCondition(marketData: MarketData[], condition: StrategyCondition): ConditionResult;
}
```

#### **Backtesting Engine**
```typescript
class BacktestingEngine {
  async runBacktest(strategy: Strategy, symbol: string, marketData: MarketData[]): Promise<BacktestResult>;
  calculatePerformanceMetrics(trades: Trade[]): PerformanceMetrics;
  compareWithBenchmark(strategyMetrics: PerformanceMetrics, benchmarkData: MarketData[]): Comparison;
}
```

#### **Signal Generation**
```typescript
class SignalGenerator {
  async generateSignals(strategy: Strategy, marketData: Record<string, MarketData[]>): Promise<Signal[]>;
  calculateSignalConfidence(conditions: string[], marketData: MarketData[]): number;
  startRealTimeMonitoring(strategies: Strategy[]): void;
}
```

## Data Sources & APIs

### **Market Data Integration**
- **Primary**: Polygon API for stocks and crypto
- **Secondary**: MarketAux for news sentiment
- **Fallback**: Twelve Data API
- **Real-time**: WebSocket connections for live data

### **Data Pipeline**
```typescript
// Market data fetching
const fetchMarketData = async (symbol: string, startDate: string, endDate: string) => {
  const response = await axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startDate}/${endDate}`, {
    params: { apikey: process.env.POLYGON_API_KEY }
  });
  return response.data.results.map(bar => ({
    timestamp: new Date(bar.t),
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));
};
```

## Security & Performance

### **Firestore Security Rules**
```firestore
// Strategies collection
match /strategies/{strategyId} {
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid || 
    resource.data.isPublic == true
  );
  allow write: if request.auth != null && resource.data.userId == request.auth.uid;
}

// Backtests collection
match /backtests/{backtestId} {
  allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
}

// Alerts collection
match /alerts/{alertId} {
  allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
}
```

### **Performance Optimizations**
- **Composite Indexes**: Optimized queries for strategy lists and backtests
- **Real-time Listeners**: Selective onSnapshot subscriptions
- **Batch Operations**: Atomic multi-document updates
- **Caching Strategy**: Local state with periodic refresh
- **Background Processing**: Cloud Functions for heavy computations

## Usage Examples

### **Creating a Strategy**
```typescript
const strategy: Partial<Strategy> = {
  name: "RSI Mean Reversion",
  description: "Buy oversold, sell overbought using RSI",
  strategyType: "technical",
  buyConditions: [
    {
      indicator: "rsi",
      operator: "<",
      value: 30,
      timeframe: "1D",
      parameters: { period: 14 }
    }
  ],
  sellConditions: [
    {
      indicator: "rsi", 
      operator: ">",
      value: 70,
      timeframe: "1D",
      parameters: { period: 14 }
    }
  ],
  riskManagement: {
    positionSize: 0.1,
    stopLoss: 0.05,
    takeProfit: 0.15,
    maxPositions: 5
  },
  targetSelection: {
    type: "deck",
    deckId: "my-tech-stocks"
  }
};

const { createStrategy } = useCreateStrategy();
const result = await createStrategy(strategy);
```

### **Running a Backtest**
```typescript
const { runBacktest } = useRunBacktest();

const backtestConfig = {
  startDate: "2023-01-01",
  endDate: "2024-01-01", 
  initialCapital: 10000,
  commission: 0.001,
  slippage: 0.0005
};

const universe = {
  type: "deck",
  deckId: "my-portfolio"
};

const result = await runBacktest(strategy.id, universe, backtestConfig);
console.log(`Strategy returned ${(result.aggregateMetrics.avgTotalReturn * 100).toFixed(2)}%`);
```

### **Real-Time Monitoring**
```typescript
const { alerts, markAsRead } = useAlerts();

// Display unread alerts
const unreadAlerts = alerts.filter(alert => !alert.readAt);

// Handle alert interaction
const handleAlertClick = async (alert: Alert) => {
  await markAsRead(alert.id);
  
  if (alert.alertType === 'signal') {
    navigation.navigate('CardDetail', { 
      symbol: alert.symbol,
      signalType: alert.data.signalType 
    });
  }
};
```

## Strategy Templates

### **Pre-Built Strategies**

#### **Golden Cross**
```typescript
{
  name: "Golden Cross",
  description: "Buy when 50-day SMA crosses above 200-day SMA",
  buyConditions: [
    {
      indicator: "sma",
      operator: "crosses_above", 
      value: "sma_200",
      parameters: { period: 50 }
    }
  ],
  sellConditions: [
    {
      indicator: "sma",
      operator: "crosses_below",
      value: "sma_200", 
      parameters: { period: 50 }
    }
  ]
}
```

#### **RSI Oversold/Overbought**
```typescript
{
  name: "RSI Mean Reversion",
  description: "Buy oversold (RSI < 30), sell overbought (RSI > 70)",
  buyConditions: [
    {
      indicator: "rsi",
      operator: "<",
      value: 30,
      parameters: { period: 14 }
    }
  ],
  sellConditions: [
    {
      indicator: "rsi", 
      operator: ">",
      value: 70,
      parameters: { period: 14 }
    }
  ]
}
```

#### **MACD Crossover**
```typescript
{
  name: "MACD Momentum",
  description: "Buy when MACD crosses above signal line",
  buyConditions: [
    {
      indicator: "macd",
      operator: "crosses_above",
      value: "macd_signal",
      parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
    }
  ],
  sellConditions: [
    {
      indicator: "macd",
      operator: "crosses_below", 
      value: "macd_signal",
      parameters: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
    }
  ]
}
```

## Deployment & Configuration

### **Environment Variables**
```bash
# API Keys
POLYGON_API_KEY=your_polygon_api_key
MARKETAUX_API_KEY=your_marketaux_api_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Strategy Engine Settings
ENABLE_REAL_TIME_SIGNALS=true
MAX_CONCURRENT_BACKTESTS=5
SIGNAL_CONFIDENCE_THRESHOLD=0.6
```

### **Cloud Function Deployment**
```bash
# Deploy strategy functions
firebase deploy --only functions:runBacktest,functions:createStrategy,functions:scanAndAlert

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

### **Required Firestore Indexes**
```json
{
  "indexes": [
    {
      "collectionGroup": "strategies",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "isActive", "order": "ASCENDING"}, 
        {"fieldPath": "updatedAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "backtests",
      "fields": [
        {"fieldPath": "strategyId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "alerts", 
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

## Testing & Quality Assurance

### **Unit Tests**
- Strategy validation logic
- Technical indicator calculations
- Backtesting engine accuracy
- Signal generation reliability

### **Integration Tests**
- End-to-end strategy creation flow
- Backtest execution and result storage
- Real-time alert generation and delivery
- Cross-platform compatibility testing

### **Performance Tests**
- Large dataset backtesting performance
- Concurrent strategy execution limits
- Real-time signal generation latency
- Memory usage optimization

## Troubleshooting

### **Common Issues**

#### **Backtest Failures**
- **Insufficient Data**: Ensure adequate historical data (minimum 50 days)
- **Invalid Conditions**: Validate indicator parameters and operators
- **API Limits**: Check Polygon API rate limits and quotas
- **Memory Issues**: Large datasets may require optimization

#### **Signal Generation Issues**
- **No Signals Generated**: Check condition logic and market data availability
- **False Signals**: Adjust confidence thresholds and add filters
- **Delayed Alerts**: Verify Cloud Function execution and scheduling

#### **Performance Issues**
- **Slow Backtests**: Optimize indicator calculations and data processing
- **High Memory Usage**: Implement data pagination and cleanup
- **Rate Limiting**: Implement proper API throttling and caching

## Future Enhancements

### **Advanced Features**
- **Machine Learning Integration**: AI-powered strategy optimization
- **Portfolio Optimization**: Modern portfolio theory implementation
- **Options Strategies**: Support for complex derivatives strategies
- **Social Trading**: Strategy sharing and copy trading

### **Technical Improvements**
- **WebSocket Integration**: Real-time market data streaming
- **Advanced Charting**: Interactive strategy visualization
- **Mobile Optimization**: Native mobile strategy builder
- **Cloud Scaling**: Auto-scaling for high-volume processing

The Strategy Builder system provides a comprehensive platform for developing, testing, and deploying automated trading strategies with institutional-grade features and performance.
