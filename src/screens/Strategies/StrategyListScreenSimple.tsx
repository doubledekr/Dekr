import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card, Button, Chip, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Mock data for demonstration
const mockStrategies = [
  {
    id: '1',
    name: 'Momentum Breakout Strategy',
    description: 'Identifies stocks breaking out of consolidation patterns with high volume',
    isActive: true,
    performance: {
      winRate: 68.5,
      totalReturn: 15.2,
      sharpeRatio: 1.42,
    },
    createdAt: '2024-01-10',
    tags: ['momentum', 'breakout', 'volume'],
  },
  {
    id: '2',
    name: 'RSI Mean Reversion',
    description: 'Buys oversold stocks and sells overbought based on RSI indicators',
    isActive: false,
    performance: {
      winRate: 72.1,
      totalReturn: 8.7,
      sharpeRatio: 1.18,
    },
    createdAt: '2024-01-08',
    tags: ['rsi', 'mean-reversion', 'technical'],
  },
  {
    id: '3',
    name: 'Earnings Surprise Strategy',
    description: 'Trades around earnings announcements based on surprise factors',
    isActive: true,
    performance: {
      winRate: 58.3,
      totalReturn: 22.1,
      sharpeRatio: 1.65,
    },
    createdAt: '2024-01-05',
    tags: ['earnings', 'fundamental', 'events'],
  },
];

export const StrategyListScreen: React.FC = () => {
  const theme = useTheme();
  const [strategies] = useState(mockStrategies);
  const [loading] = useState(false);

  const handleCreateStrategy = () => {
    console.log('Create new strategy');
  };

  const handleEditStrategy = (strategyId: string) => {
    console.log('Edit strategy:', strategyId);
  };

  const handleToggleStrategy = (strategyId: string) => {
    console.log('Toggle strategy:', strategyId);
  };

  const handleBacktestStrategy = (strategyId: string) => {
    console.log('Backtest strategy:', strategyId);
  };

  const renderStrategy = ({ item }: { item: any }) => (
    <Card style={[styles.strategyCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.strategyContent}>
        <View style={styles.strategyHeader}>
          <View style={styles.strategyInfo}>
            <Text style={[styles.strategyName, { color: theme.colors.onSurface }]}>
              {item.name}
            </Text>
            <Text style={[styles.strategyDescription, { color: theme.colors.onSurfaceVariant }]}>
              {item.description}
            </Text>
          </View>
          <Chip 
            mode={item.isActive ? "filled" : "outlined"}
            style={item.isActive ? styles.activeChip : styles.inactiveChip}
            textStyle={item.isActive ? styles.activeChipText : undefined}
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </Chip>
        </View>

        <View style={styles.performanceSection}>
          <Text style={[styles.performanceTitle, { color: theme.colors.onSurface }]}>
            Performance
          </Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: '#10b981' }]}>
                {item.performance.winRate.toFixed(1)}%
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Win Rate
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: '#10b981' }]}>
                +{item.performance.totalReturn.toFixed(1)}%
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Return
              </Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceValue, { color: theme.colors.onSurface }]}>
                {item.performance.sharpeRatio.toFixed(2)}
              </Text>
              <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Sharpe Ratio
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tagsSection}>
          {item.tags.map((tag: string, index: number) => (
            <Chip key={index} mode="outlined" compact textStyle={styles.tagText}>
              {tag}
            </Chip>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <Button
            mode="outlined"
            onPress={() => handleBacktestStrategy(item.id)}
            style={styles.actionButton}
            icon="chart-line"
          >
            Backtest
          </Button>
          <Button
            mode="contained"
            onPress={() => handleEditStrategy(item.id)}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading strategies...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          My Strategies
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Build and manage your trading strategies
        </Text>
      </View>

      {/* Create Strategy Button */}
      <View style={styles.createButtonContainer}>
        <Button
          mode="contained"
          onPress={handleCreateStrategy}
          style={styles.createButton}
          icon="plus"
        >
          Create New Strategy
        </Button>
      </View>

      {/* Strategies List */}
      <FlatList
        data={strategies}
        renderItem={renderStrategy}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#2563eb',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  strategyCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  strategyContent: {
    padding: 16,
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  strategyInfo: {
    flex: 1,
    marginRight: 12,
  },
  strategyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  strategyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  activeChip: {
    backgroundColor: '#10b981',
  },
  activeChipText: {
    color: '#ffffff',
  },
  inactiveChip: {
    borderColor: '#6b7280',
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
