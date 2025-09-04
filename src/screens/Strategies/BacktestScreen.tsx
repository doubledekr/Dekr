import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Strategy, BacktestResult } from '../../types/strategy';
import { useRunBacktest, useBacktestResults } from '../../hooks/useStrategies';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type BacktestRouteProp = RouteProp<{
  BacktestScreen: { strategy: Strategy };
}, 'BacktestScreen'>;

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  icon: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  color,
  icon,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  return (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <View style={styles.metricHeader}>
        <MaterialCommunityIcons 
          name={icon} 
          size={24} 
          color={color || textColor} 
        />
        <Text style={[styles.metricTitle, { color: mutedColor }]}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color: color || textColor }]}>
        {value}
      </Text>
      {subtitle && (
        <Text style={[styles.metricSubtitle, { color: mutedColor }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

interface TradeItemProps {
  trade: any;
  index: number;
}

const TradeItem: React.FC<TradeItemProps> = ({ trade, index }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const profitColor = trade.returnPct > 0 ? '#4CAF50' : '#F44336';
  const signalIcon = trade.signal === 'buy' ? 'arrow-up' : 'arrow-down';
  const signalColor = trade.signal === 'buy' ? '#4CAF50' : '#F44336';

  return (
    <View style={[styles.tradeItem, { backgroundColor }]}>
      <View style={styles.tradeHeader}>
        <View style={styles.tradeInfo}>
          <Text style={[styles.tradeSymbol, { color: textColor }]}>
            {trade.symbol} #{index + 1}
          </Text>
          <MaterialCommunityIcons 
            name={signalIcon} 
            size={16} 
            color={signalColor} 
          />
        </View>
        <Text style={[styles.tradeReturn, { color: profitColor }]}>
          {(trade.returnPct * 100).toFixed(2)}%
        </Text>
      </View>

      <View style={styles.tradeDetails}>
        <View style={styles.tradeDetailRow}>
          <Text style={[styles.tradeDetailLabel, { color: mutedColor }]}>Entry:</Text>
          <Text style={[styles.tradeDetailValue, { color: textColor }]}>
            ${trade.entryPrice.toFixed(2)} on {new Date(trade.entryDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.tradeDetailRow}>
          <Text style={[styles.tradeDetailLabel, { color: mutedColor }]}>Exit:</Text>
          <Text style={[styles.tradeDetailValue, { color: textColor }]}>
            ${trade.exitPrice.toFixed(2)} on {new Date(trade.exitDate).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.tradeDetailRow}>
          <Text style={[styles.tradeDetailLabel, { color: mutedColor }]}>Duration:</Text>
          <Text style={[styles.tradeDetailValue, { color: textColor }]}>
            {trade.durationDays} days
          </Text>
        </View>
        <View style={styles.tradeDetailRow}>
          <Text style={[styles.tradeDetailLabel, { color: mutedColor }]}>P&L:</Text>
          <Text style={[styles.tradeDetailValue, { color: profitColor }]}>
            ${trade.profitLoss.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const BacktestScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<BacktestRouteProp>();
  const { strategy } = route.params;

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const [selectedPeriod, setSelectedPeriod] = useState<'1Y' | '2Y' | '5Y'>('1Y');
  const [selectedUniverse, setSelectedUniverse] = useState<'deck' | 'list' | 'asset'>('asset');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['AAPL', 'GOOGL', 'MSFT']);

  // Hooks
  const { runBacktest, loading: backtestLoading } = useRunBacktest();
  const { backtestResults, loading: resultsLoading, refetch } = useBacktestResults(strategy.id);

  const [currentBacktest, setCurrentBacktest] = useState<any>(null);

  useEffect(() => {
    if (backtestResults && backtestResults.length > 0) {
      setCurrentBacktest(backtestResults[0]);
    }
  }, [backtestResults]);

  const handleRunBacktest = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '1Y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        case '2Y':
          startDate.setFullYear(endDate.getFullYear() - 2);
          break;
        case '5Y':
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
      }

      const universe = {
        type: selectedUniverse,
        symbols: selectedUniverse === 'asset' ? selectedSymbols : undefined,
        deckId: selectedUniverse === 'deck' ? 'default-deck-id' : undefined,
      };

      const config = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        initialCapital: 10000,
      };

      const result = await runBacktest(strategy.id, universe, config);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        await refetch();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to run backtest. Please try again.');
    }
  };

  const formatPerformanceValue = (value: number | undefined, isPercentage: boolean = true, decimals: number = 2) => {
    if (value === undefined) return 'N/A';
    const formatted = value.toFixed(decimals);
    return isPercentage ? `${formatted}%` : formatted;
  };

  const getPerformanceColor = (value: number | undefined) => {
    if (value === undefined) return mutedColor;
    return value > 0 ? '#4CAF50' : value < 0 ? '#F44336' : mutedColor;
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {['1Y', '2Y', '5Y'].map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            {
              backgroundColor: selectedPeriod === period ? tintColor : 'transparent',
              borderColor: tintColor,
            }
          ]}
          onPress={() => setSelectedPeriod(period as any)}
        >
          <Text
            style={[
              styles.periodButtonText,
              { color: selectedPeriod === period ? 'white' : tintColor }
            ]}
          >
            {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPerformanceChart = () => {
    if (!currentBacktest?.results || currentBacktest.results.length === 0) {
      return (
        <View style={[styles.chartContainer, { backgroundColor }]}>
          <Text style={[styles.chartPlaceholder, { color: mutedColor }]}>
            No data available for chart
          </Text>
        </View>
      );
    }

    // Generate sample data for demonstration
    const chartData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          data: [0, 5, 12, 8, 15, 20],
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: [0, 3, 8, 6, 10, 12],
          color: (opacity = 1) => `rgba(158, 158, 158, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    const screenWidth = Dimensions.get('window').width;

    return (
      <View style={[styles.chartContainer, { backgroundColor }]}>
        <Text style={[styles.chartTitle, { color: textColor }]}>
          Performance Comparison
        </Text>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={200}
          chartConfig={{
            backgroundColor: backgroundColor,
            backgroundGradientFrom: backgroundColor,
            backgroundGradientTo: backgroundColor,
            decimalPlaces: 1,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            labelColor: (opacity = 1) => textColor,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2',
            },
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text style={[styles.legendText, { color: textColor }]}>Strategy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#9E9E9E' }]} />
            <Text style={[styles.legendText, { color: textColor }]}>Benchmark</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMetrics = () => {
    const metrics = currentBacktest?.aggregateMetrics;
    
    return (
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Total Return"
            value={formatPerformanceValue(metrics?.avgTotalReturn * 100)}
            color={getPerformanceColor(metrics?.avgTotalReturn)}
            icon="trending-up"
          />
          <MetricCard
            title="Sharpe Ratio"
            value={formatPerformanceValue(metrics?.avgSharpeRatio, false)}
            color={textColor}
            icon="chart-line"
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            title="Win Rate"
            value={formatPerformanceValue(metrics?.avgWinRate * 100)}
            color={textColor}
            icon="check-circle"
          />
          <MetricCard
            title="Total Trades"
            value={metrics?.totalTrades?.toString() || 'N/A'}
            color={textColor}
            icon="swap-horizontal"
          />
        </View>
      </View>
    );
  };

  const renderTradesList = () => {
    if (!currentBacktest?.results || currentBacktest.results.length === 0) {
      return (
        <View style={styles.emptyTradesContainer}>
          <MaterialCommunityIcons name="chart-line" size={48} color={mutedColor} />
          <Text style={[styles.emptyTradesText, { color: mutedColor }]}>
            No trades to display
          </Text>
        </View>
      );
    }

    const allTrades = currentBacktest.results.flatMap((result: any) => 
      result.trades.map((trade: any) => ({ ...trade, symbol: result.symbol }))
    );

    return (
      <View style={styles.tradesContainer}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Recent Trades ({allTrades.length})
        </Text>
        {allTrades.slice(0, 10).map((trade: any, index: number) => (
          <TradeItem key={index} trade={trade} index={index} />
        ))}
      </View>
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `Backtest: ${strategy.name}`,
      headerRight: () => (
        <TouchableOpacity
          onPress={handleRunBacktest}
          disabled={backtestLoading}
          style={{ marginRight: 16 }}
        >
          {backtestLoading ? (
            <ActivityIndicator size="small" color={tintColor} />
          ) : (
            <MaterialCommunityIcons name="play" size={24} color={tintColor} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, strategy.name, backtestLoading, tintColor]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Controls */}
        <View style={styles.controlsSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Backtest Configuration
          </Text>
          {renderPeriodSelector()}
          
          <TouchableOpacity
            style={[styles.runButton, { backgroundColor: tintColor }]}
            onPress={handleRunBacktest}
            disabled={backtestLoading}
          >
            {backtestLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="play" size={20} color="white" />
            )}
            <Text style={styles.runButtonText}>
              {backtestLoading ? 'Running...' : 'Run Backtest'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results */}
        {resultsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tintColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Loading backtest results...
            </Text>
          </View>
        ) : currentBacktest ? (
          <>
            {renderPerformanceChart()}
            {renderMetrics()}
            {renderTradesList()}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-line" size={64} color={mutedColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              No Backtest Results
            </Text>
            <Text style={[styles.emptyMessage, { color: mutedColor }]}>
              Run a backtest to see performance metrics and trade history
            </Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  controlsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  runButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  chartContainer: {
    margin: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  chartPlaceholder: {
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 40,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  metricsContainer: {
    paddingHorizontal: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 10,
  },
  tradesContainer: {
    padding: 20,
  },
  emptyTradesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTradesText: {
    fontSize: 16,
    marginTop: 12,
  },
  tradeItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tradeSymbol: {
    fontSize: 14,
    fontWeight: '600',
  },
  tradeReturn: {
    fontSize: 14,
    fontWeight: '600',
  },
  tradeDetails: {
    gap: 4,
  },
  tradeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tradeDetailLabel: {
    fontSize: 12,
  },
  tradeDetailValue: {
    fontSize: 12,
    fontWeight: '500',
  },
});
