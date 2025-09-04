import { Strategy, StrategyCondition, Signal, BacktestResult } from '../../../src/types/strategy';
import { TechnicalAnalysis } from './TechnicalAnalysis';
import { BacktestingEngine } from './BacktestingEngine';
import { SignalGenerator } from './SignalGenerator';

export interface MarketData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StrategyEngineConfig {
  enableRealTimeSignals?: boolean;
  backtestConfig?: {
    commission: number;
    slippage: number;
    initialCapital: number;
  };
  signalConfig?: {
    minConfidence: number;
    maxSignalsPerDay: number;
  };
}

/**
 * Main Strategy Engine class that orchestrates strategy execution,
 * backtesting, and signal generation
 */
export class StrategyEngine {
  private technicalAnalysis: TechnicalAnalysis;
  private backtestingEngine: BacktestingEngine;
  private signalGenerator: SignalGenerator;
  private config: StrategyEngineConfig;

  constructor(config: StrategyEngineConfig = {}) {
    this.config = {
      enableRealTimeSignals: false,
      backtestConfig: {
        commission: 0.001,
        slippage: 0.0005,
        initialCapital: 10000,
      },
      signalConfig: {
        minConfidence: 0.5,
        maxSignalsPerDay: 10,
      },
      ...config,
    };

    this.technicalAnalysis = new TechnicalAnalysis();
    this.backtestingEngine = new BacktestingEngine(this.config.backtestConfig!);
    this.signalGenerator = new SignalGenerator(this.config.signalConfig!);
  }

  /**
   * Validate a strategy configuration
   */
  validateStrategy(strategy: Strategy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check basic required fields
    if (!strategy.name || strategy.name.trim().length === 0) {
      errors.push('Strategy name is required');
    }

    if (!strategy.buyConditions || strategy.buyConditions.length === 0) {
      errors.push('At least one buy condition is required');
    }

    if (!strategy.sellConditions || strategy.sellConditions.length === 0) {
      errors.push('At least one sell condition is required');
    }

    // Validate conditions
    [...(strategy.buyConditions || []), ...(strategy.sellConditions || [])].forEach((condition, index) => {
      const conditionErrors = this.validateCondition(condition);
      if (conditionErrors.length > 0) {
        errors.push(`Condition ${index + 1}: ${conditionErrors.join(', ')}`);
      }
    });

    // Validate risk management
    if (strategy.riskManagement) {
      const { positionSize, stopLoss, takeProfit, maxPositions } = strategy.riskManagement;
      
      if (positionSize <= 0 || positionSize > 1) {
        errors.push('Position size must be between 0 and 1');
      }

      if (stopLoss && (stopLoss <= 0 || stopLoss > 1)) {
        errors.push('Stop loss must be between 0 and 1');
      }

      if (takeProfit && takeProfit <= 0) {
        errors.push('Take profit must be greater than 0');
      }

      if (maxPositions <= 0) {
        errors.push('Max positions must be greater than 0');
      }
    }

    // Validate target selection
    if (!strategy.targetSelection) {
      errors.push('Target selection is required');
    } else {
      const { type, symbols, deckId } = strategy.targetSelection;
      
      if (type === 'asset' && (!symbols || symbols.length === 0)) {
        errors.push('Symbols are required for asset targeting');
      }

      if (type === 'deck' && !deckId) {
        errors.push('Deck ID is required for deck targeting');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single strategy condition
   */
  private validateCondition(condition: StrategyCondition): string[] {
    const errors: string[] = [];

    if (!condition.indicator) {
      errors.push('Indicator is required');
    }

    if (!condition.operator) {
      errors.push('Operator is required');
    }

    if (condition.value === undefined || condition.value === null) {
      errors.push('Value is required');
    }

    // Validate indicator-specific parameters
    if (condition.indicator && condition.parameters) {
      const indicatorErrors = this.technicalAnalysis.validateIndicatorParameters(
        condition.indicator,
        condition.parameters
      );
      errors.push(...indicatorErrors);
    }

    return errors;
  }

  /**
   * Calculate technical indicators for market data
   */
  async calculateIndicators(
    marketData: MarketData[],
    indicators: string[]
  ): Promise<Record<string, number[]>> {
    return this.technicalAnalysis.calculateMultipleIndicators(marketData, indicators);
  }

  /**
   * Evaluate strategy conditions against market data
   */
  async evaluateConditions(
    marketData: MarketData[],
    conditions: StrategyCondition[]
  ): Promise<{ met: boolean; details: string[] }> {
    const results = await Promise.all(
      conditions.map(condition => 
        this.technicalAnalysis.evaluateCondition(marketData, condition)
      )
    );

    const metConditions = results.filter(result => result.met);
    const allMet = metConditions.length === conditions.length;

    return {
      met: allMet,
      details: metConditions.map(result => result.description),
    };
  }

  /**
   * Generate trading signals for a strategy
   */
  async generateSignals(
    strategy: Strategy,
    marketData: Record<string, MarketData[]>
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    for (const [symbol, data] of Object.entries(marketData)) {
      // Check buy conditions
      const buyEvaluation = await this.evaluateConditions(data, strategy.buyConditions);
      if (buyEvaluation.met) {
        const signal = await this.signalGenerator.createSignal({
          strategyId: strategy.id,
          symbol,
          signalType: 'buy',
          conditions: buyEvaluation.details,
          marketData: data,
          confidence: this.calculateSignalConfidence(buyEvaluation.details, data),
        });
        signals.push(signal);
      }

      // Check sell conditions
      const sellEvaluation = await this.evaluateConditions(data, strategy.sellConditions);
      if (sellEvaluation.met) {
        const signal = await this.signalGenerator.createSignal({
          strategyId: strategy.id,
          symbol,
          signalType: 'sell',
          conditions: sellEvaluation.details,
          marketData: data,
          confidence: this.calculateSignalConfidence(sellEvaluation.details, data),
        });
        signals.push(signal);
      }
    }

    return signals.filter(signal => signal.confidence >= this.config.signalConfig!.minConfidence);
  }

  /**
   * Run a backtest for a strategy
   */
  async runBacktest(
    strategy: Strategy,
    marketData: Record<string, MarketData[]>,
    config?: {
      startDate?: Date;
      endDate?: Date;
      initialCapital?: number;
    }
  ): Promise<BacktestResult[]> {
    const validation = this.validateStrategy(strategy);
    if (!validation.valid) {
      throw new Error(`Strategy validation failed: ${validation.errors.join(', ')}`);
    }

    const results: BacktestResult[] = [];

    for (const [symbol, data] of Object.entries(marketData)) {
      try {
        const result = await this.backtestingEngine.runBacktest(
          strategy,
          symbol,
          data,
          config
        );
        results.push(result);
      } catch (error) {
        console.error(`Backtest failed for ${symbol}:`, error);
        // Continue with other symbols
      }
    }

    return results;
  }

  /**
   * Calculate signal confidence based on conditions and market data
   */
  private calculateSignalConfidence(conditions: string[], marketData: MarketData[]): number {
    // Base confidence from number of conditions met
    let confidence = Math.min(conditions.length / 3, 1.0);

    // Adjust based on recent volume
    if (marketData.length >= 20) {
      const recentVolume = marketData.slice(-5).reduce((sum, d) => sum + d.volume, 0) / 5;
      const avgVolume = marketData.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
      
      if (recentVolume > avgVolume * 1.5) {
        confidence *= 1.1; // Higher volume increases confidence
      } else if (recentVolume < avgVolume * 0.5) {
        confidence *= 0.9; // Lower volume decreases confidence
      }
    }

    // Adjust based on price volatility
    if (marketData.length >= 10) {
      const recentPrices = marketData.slice(-10).map(d => d.close);
      const returns = recentPrices.slice(1).map((price, i) => (price - recentPrices[i]) / recentPrices[i]);
      const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);
      
      // Moderate volatility is preferred
      if (volatility > 0.05) {
        confidence *= 0.9; // High volatility decreases confidence
      } else if (volatility < 0.01) {
        confidence *= 0.95; // Very low volatility also decreases confidence
      }
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Get strategy performance summary
   */
  getStrategyPerformance(backtestResults: BacktestResult[]): {
    totalReturn: number;
    avgReturn: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalTrades: number;
  } {
    if (backtestResults.length === 0) {
      return {
        totalReturn: 0,
        avgReturn: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalTrades: 0,
      };
    }

    const totalReturn = backtestResults.reduce((sum, result) => sum + result.totalReturn, 0);
    const avgReturn = totalReturn / backtestResults.length;
    const avgWinRate = backtestResults.reduce((sum, result) => sum + result.winRate, 0) / backtestResults.length;
    const avgSharpe = backtestResults.reduce((sum, result) => sum + result.sharpeRatio, 0) / backtestResults.length;
    const maxDrawdown = Math.min(...backtestResults.map(result => result.maxDrawdown));
    const totalTrades = backtestResults.reduce((sum, result) => sum + result.totalTrades, 0);

    return {
      totalReturn,
      avgReturn,
      winRate: avgWinRate,
      sharpeRatio: avgSharpe,
      maxDrawdown,
      totalTrades,
    };
  }

  /**
   * Start real-time signal monitoring
   */
  startRealTimeMonitoring(strategies: Strategy[]): void {
    if (!this.config.enableRealTimeSignals) {
      throw new Error('Real-time signals are not enabled');
    }

    this.signalGenerator.startMonitoring(strategies);
  }

  /**
   * Stop real-time signal monitoring
   */
  stopRealTimeMonitoring(): void {
    this.signalGenerator.stopMonitoring();
  }

  /**
   * Add a signal callback for real-time notifications
   */
  onSignal(callback: (signal: Signal) => void): void {
    this.signalGenerator.addSignalCallback(callback);
  }

  /**
   * Remove a signal callback
   */
  offSignal(callback: (signal: Signal) => void): void {
    this.signalGenerator.removeSignalCallback(callback);
  }
}
