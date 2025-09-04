import { StrategyCondition } from '../../../src/types/strategy';
import { MarketData } from './StrategyEngine';

/**
 * Technical Analysis utilities for calculating indicators and evaluating conditions
 */
export class TechnicalAnalysis {
  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    
    return sma;
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    ema[0] = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    
    return ema;
  }

  /**
   * Calculate Relative Strength Index
   */
  calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(Math.max(change, 0));
      losses.push(Math.max(-change, 0));
    }
    
    // Calculate RSI
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
    
    return [NaN, ...rsi]; // Add NaN at the beginning to match prices length
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);
    
    const macd = fastEMA.map((fast, i) => fast - slowEMA[i]);
    const signal = this.calculateEMA(macd.filter(v => !isNaN(v)), signalPeriod);
    
    // Pad signal array to match macd length
    const paddedSignal = [...Array(macd.length - signal.length).fill(NaN), ...signal];
    
    const histogram = macd.map((m, i) => m - paddedSignal[i]);
    
    return { macd, signal: paddedSignal, histogram };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices: number[], period: number = 20, standardDeviations: number = 2): {
    upper: number[];
    middle: number[];
    lower: number[];
  } {
    const middle = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = middle[i];
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        
        upper.push(mean + (standardDeviations * stdDev));
        lower.push(mean - (standardDeviations * stdDev));
      }
    }
    
    return { upper, middle, lower };
  }

  /**
   * Calculate Stochastic Oscillator
   */
  calculateStochastic(highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3): {
    k: number[];
    d: number[];
  } {
    const k: number[] = [];
    
    for (let i = 0; i < closes.length; i++) {
      if (i < kPeriod - 1) {
        k.push(NaN);
      } else {
        const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
        const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
        const currentClose = closes[i];
        
        if (highestHigh === lowestLow) {
          k.push(50); // Avoid division by zero
        } else {
          k.push(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100);
        }
      }
    }
    
    const d = this.calculateSMA(k.filter(v => !isNaN(v)), dPeriod);
    const paddedD = [...Array(k.length - d.length).fill(NaN), ...d];
    
    return { k, d: paddedD };
  }

  /**
   * Calculate multiple indicators at once
   */
  async calculateMultipleIndicators(
    marketData: MarketData[],
    indicators: string[]
  ): Promise<Record<string, number[]>> {
    const results: Record<string, number[]> = {};
    const closes = marketData.map(d => d.close);
    const highs = marketData.map(d => d.high);
    const lows = marketData.map(d => d.low);
    const volumes = marketData.map(d => d.volume);

    for (const indicator of indicators) {
      switch (indicator) {
        case 'sma':
          results.sma_20 = this.calculateSMA(closes, 20);
          results.sma_50 = this.calculateSMA(closes, 50);
          results.sma_200 = this.calculateSMA(closes, 200);
          break;
        case 'ema':
          results.ema_12 = this.calculateEMA(closes, 12);
          results.ema_26 = this.calculateEMA(closes, 26);
          results.ema_50 = this.calculateEMA(closes, 50);
          break;
        case 'rsi':
          results.rsi = this.calculateRSI(closes, 14);
          break;
        case 'macd':
          const macd = this.calculateMACD(closes);
          results.macd = macd.macd;
          results.macd_signal = macd.signal;
          results.macd_histogram = macd.histogram;
          break;
        case 'bollinger':
          const bb = this.calculateBollingerBands(closes);
          results.bb_upper = bb.upper;
          results.bb_middle = bb.middle;
          results.bb_lower = bb.lower;
          break;
        case 'stochastic':
          const stoch = this.calculateStochastic(highs, lows, closes);
          results.stoch_k = stoch.k;
          results.stoch_d = stoch.d;
          break;
        case 'volume':
          results.volume = volumes;
          results.volume_sma = this.calculateSMA(volumes, 20);
          break;
      }
    }

    return results;
  }

  /**
   * Evaluate a strategy condition against market data
   */
  async evaluateCondition(
    marketData: MarketData[],
    condition: StrategyCondition
  ): Promise<{ met: boolean; description: string; value?: number }> {
    const { indicator, operator, value, parameters } = condition;
    
    if (marketData.length === 0) {
      return { met: false, description: 'No market data available' };
    }

    try {
      const indicators = await this.calculateMultipleIndicators(marketData, [indicator]);
      const indicatorKey = this.getIndicatorKey(indicator, parameters);
      const indicatorValues = indicators[indicatorKey];
      
      if (!indicatorValues || indicatorValues.length === 0) {
        return { met: false, description: `Indicator ${indicator} not calculated` };
      }

      const currentValue = indicatorValues[indicatorValues.length - 1];
      
      if (isNaN(currentValue)) {
        return { met: false, description: `Indicator ${indicator} value is NaN` };
      }

      const compareValue = this.resolveComparisonValue(value, indicators, marketData);
      const conditionMet = this.evaluateOperator(currentValue, operator, compareValue);

      return {
        met: conditionMet,
        description: `${indicator} (${currentValue.toFixed(2)}) ${operator} ${compareValue}`,
        value: currentValue,
      };
    } catch (error) {
      return {
        met: false,
        description: `Error evaluating condition: ${error.message}`,
      };
    }
  }

  /**
   * Get the appropriate indicator key based on parameters
   */
  private getIndicatorKey(indicator: string, parameters: any): string {
    switch (indicator) {
      case 'sma':
        const smaPeriod = parameters?.period || 20;
        return `sma_${smaPeriod}`;
      case 'ema':
        const emaPeriod = parameters?.period || 26;
        return `ema_${emaPeriod}`;
      case 'rsi':
        return 'rsi';
      case 'macd':
        return 'macd';
      case 'bollinger':
        return 'bb_middle';
      case 'stochastic':
        return 'stoch_k';
      case 'volume':
        return 'volume';
      default:
        return indicator;
    }
  }

  /**
   * Resolve comparison value (could be a number or reference to another indicator)
   */
  private resolveComparisonValue(
    value: string | number,
    indicators: Record<string, number[]>,
    marketData: MarketData[]
  ): number {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      // Handle special values
      if (value === 'price' || value === 'close') {
        return marketData[marketData.length - 1].close;
      }

      // Handle indicator references (e.g., 'sma_200', 'ema_50')
      if (indicators[value]) {
        const indicatorValues = indicators[value];
        return indicatorValues[indicatorValues.length - 1];
      }

      // Try to parse as number
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue;
      }
    }

    throw new Error(`Cannot resolve comparison value: ${value}`);
  }

  /**
   * Evaluate an operator condition
   */
  private evaluateOperator(currentValue: number, operator: string, compareValue: number): boolean {
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
        // This would require previous values - simplified implementation
        return currentValue > compareValue;
      case 'crosses_below':
        // This would require previous values - simplified implementation
        return currentValue < compareValue;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  /**
   * Validate indicator parameters
   */
  validateIndicatorParameters(indicator: string, parameters: any): string[] {
    const errors: string[] = [];

    switch (indicator) {
      case 'sma':
      case 'ema':
        if (parameters.period && (parameters.period <= 0 || parameters.period > 200)) {
          errors.push('Period must be between 1 and 200');
        }
        break;
      case 'rsi':
        if (parameters.period && (parameters.period <= 0 || parameters.period > 50)) {
          errors.push('RSI period must be between 1 and 50');
        }
        break;
      case 'macd':
        if (parameters.fastPeriod && parameters.slowPeriod && parameters.fastPeriod >= parameters.slowPeriod) {
          errors.push('Fast period must be less than slow period');
        }
        break;
      case 'bollinger':
        if (parameters.standardDeviations && (parameters.standardDeviations <= 0 || parameters.standardDeviations > 5)) {
          errors.push('Standard deviations must be between 0 and 5');
        }
        break;
      case 'stochastic':
        if (parameters.kPeriod && (parameters.kPeriod <= 0 || parameters.kPeriod > 50)) {
          errors.push('K period must be between 1 and 50');
        }
        if (parameters.dPeriod && (parameters.dPeriod <= 0 || parameters.dPeriod > 20)) {
          errors.push('D period must be between 1 and 20');
        }
        break;
    }

    return errors;
  }

  /**
   * Get latest indicator values for a dataset
   */
  getLatestValues(marketData: MarketData[], indicators: string[]): Promise<Record<string, number>> {
    return this.calculateMultipleIndicators(marketData, indicators).then(results => {
      const latest: Record<string, number> = {};
      
      for (const [key, values] of Object.entries(results)) {
        const lastValue = values[values.length - 1];
        if (!isNaN(lastValue)) {
          latest[key] = lastValue;
        }
      }
      
      return latest;
    });
  }
}
