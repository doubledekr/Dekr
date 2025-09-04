import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStrategies, useToggleStrategyStatus, useDeleteStrategy } from '../../hooks/useStrategies';
import { Strategy } from '../../types/strategy';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type TabType = 'my_strategies' | 'public' | 'templates';

interface StrategyCardProps {
  strategy: Strategy;
  onEdit: (strategy: Strategy) => void;
  onBacktest: (strategy: Strategy) => void;
  onToggleStatus: (strategyId: string, isActive: boolean) => void;
  onDelete: (strategy: Strategy) => void;
  onDuplicate: (strategy: Strategy) => void;
  loading: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  onEdit,
  onBacktest,
  onToggleStatus,
  onDelete,
  onDuplicate,
  loading,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  const formatPerformance = (value: number | undefined, suffix: string = '%') => {
    if (value === undefined) return 'N/A';
    return `${(value * 100).toFixed(1)}${suffix}`;
  };

  const getStrategyTypeIcon = (type: string) => {
    switch (type) {
      case 'technical': return 'chart-line';
      case 'fundamental': return 'file-document';
      case 'sentiment': return 'emoticon';
      case 'hybrid': return 'merge';
      default: return 'cog';
    }
  };

  const getPerformanceColor = (value: number | undefined) => {
    if (value === undefined) return mutedColor;
    return value > 0 ? '#4CAF50' : value < 0 ? '#F44336' : mutedColor;
  };

  return (
    <View style={[styles.strategyCard, { backgroundColor }]}>
      <View style={styles.cardHeader}>
        <View style={styles.strategyInfo}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons 
              name={getStrategyTypeIcon(strategy.strategyType)} 
              size={20} 
              color={tintColor} 
            />
            <Text style={[styles.strategyName, { color: textColor }]} numberOfLines={1}>
              {strategy.name}
            </Text>
            <View style={styles.statusContainer}>
              <Switch
                value={strategy.isActive}
                onValueChange={(value) => onToggleStatus(strategy.id, value)}
                disabled={loading}
                thumbColor={strategy.isActive ? tintColor : mutedColor}
                trackColor={{ false: mutedColor + '40', true: tintColor + '40' }}
              />
            </View>
          </View>
          
          {strategy.description && (
            <Text style={[styles.strategyDescription, { color: mutedColor }]} numberOfLines={2}>
              {strategy.description}
            </Text>
          )}
          
          <View style={styles.tagsContainer}>
            {strategy.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: tintColor + '20' }]}>
                <Text style={[styles.tagText, { color: tintColor }]}>{tag}</Text>
              </View>
            ))}
            {strategy.tags.length > 3 && (
              <Text style={[styles.moreTagsText, { color: mutedColor }]}>
                +{strategy.tags.length - 3} more
              </Text>
            )}
          </View>
        </View>
      </View>

      {strategy.performanceMetrics && (
        <View style={styles.performanceSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: mutedColor }]}>Return</Text>
              <Text style={[styles.metricValue, { color: getPerformanceColor(strategy.performanceMetrics.totalReturn) }]}>
                {formatPerformance(strategy.performanceMetrics.totalReturn)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: mutedColor }]}>Sharpe</Text>
              <Text style={[styles.metricValue, { color: textColor }]}>
                {strategy.performanceMetrics.sharpeRatio?.toFixed(2) || 'N/A'}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: mutedColor }]}>Win Rate</Text>
              <Text style={[styles.metricValue, { color: textColor }]}>
                {formatPerformance(strategy.performanceMetrics.winRate)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, { color: mutedColor }]}>Trades</Text>
              <Text style={[styles.metricValue, { color: textColor }]}>
                {strategy.performanceMetrics.totalTrades || 0}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: tintColor + '20' }]}
          onPress={() => onEdit(strategy)}
          disabled={loading}
        >
          <MaterialCommunityIcons name="pencil" size={16} color={tintColor} />
          <Text style={[styles.actionButtonText, { color: tintColor }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' + '20' }]}
          onPress={() => onBacktest(strategy)}
          disabled={loading}
        >
          <MaterialCommunityIcons name="chart-line" size={16} color="#2196F3" />
          <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>Backtest</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF9800' + '20' }]}
          onPress={() => onDuplicate(strategy)}
          disabled={loading}
        >
          <MaterialCommunityIcons name="content-copy" size={16} color="#FF9800" />
          <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#F44336' + '20' }]}
          onPress={() => onDelete(strategy)}
          disabled={loading}
        >
          <MaterialCommunityIcons name="delete" size={16} color="#F44336" />
          <Text style={[styles.actionButtonText, { color: '#F44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const StrategyListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('my_strategies');
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  // Hooks
  const { strategies, loading, refetch } = useStrategies(activeTab);
  const { toggleStrategyStatus, loading: toggleLoading } = useToggleStrategyStatus();
  const { deleteStrategy, loading: deleteLoading } = useDeleteStrategy();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleCreateStrategy = useCallback(() => {
    navigation.navigate('StrategyEditor', { mode: 'create' });
  }, [navigation]);

  const handleEditStrategy = useCallback((strategy: Strategy) => {
    navigation.navigate('StrategyEditor', { mode: 'edit', strategy });
  }, [navigation]);

  const handleBacktestStrategy = useCallback((strategy: Strategy) => {
    navigation.navigate('BacktestScreen', { strategy });
  }, [navigation]);

  const handleToggleStatus = useCallback(async (strategyId: string, isActive: boolean) => {
    try {
      await toggleStrategyStatus(strategyId, isActive);
      Alert.alert(
        'Success', 
        `Strategy ${isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update strategy status');
    }
  }, [toggleStrategyStatus]);

  const handleDeleteStrategy = useCallback(async (strategy: Strategy) => {
    Alert.alert(
      'Delete Strategy',
      `Are you sure you want to delete "${strategy.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStrategy(strategy.id);
              Alert.alert('Success', 'Strategy deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete strategy');
            }
          },
        },
      ]
    );
  }, [deleteStrategy]);

  const handleDuplicateStrategy = useCallback((strategy: Strategy) => {
    const duplicatedStrategy = {
      ...strategy,
      id: '', // Will be generated
      name: `${strategy.name} (Copy)`,
      isActive: false,
    };
    navigation.navigate('StrategyEditor', { mode: 'create', strategy: duplicatedStrategy });
  }, [navigation]);

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        { borderBottomColor: activeTab === tab ? tintColor : 'transparent' }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <View style={styles.tabContent}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={activeTab === tab ? tintColor : mutedColor}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === tab ? tintColor : mutedColor }
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderStrategyItem = ({ item }: { item: Strategy }) => (
    <StrategyCard
      strategy={item}
      onEdit={handleEditStrategy}
      onBacktest={handleBacktestStrategy}
      onToggleStatus={handleToggleStatus}
      onDelete={handleDeleteStrategy}
      onDuplicate={handleDuplicateStrategy}
      loading={toggleLoading || deleteLoading}
    />
  );

  const renderEmptyState = () => {
    let icon, title, message, actionText;
    
    switch (activeTab) {
      case 'my_strategies':
        icon = 'strategy';
        title = 'No Strategies Yet';
        message = 'Create your first trading strategy to start automated trading';
        actionText = 'Create Strategy';
        break;
      case 'public':
        icon = 'earth';
        title = 'No Public Strategies';
        message = 'Browse and discover strategies shared by the community';
        break;
      case 'templates':
        icon = 'file-document-multiple';
        title = 'No Templates Available';
        message = 'Strategy templates help you get started quickly';
        break;
    }

    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name={icon} size={64} color={mutedColor} />
        <Text style={[styles.emptyTitle, { color: textColor }]}>
          {title}
        </Text>
        <Text style={[styles.emptyMessage, { color: mutedColor }]}>
          {message}
        </Text>
        {actionText && (
          <TouchableOpacity
            style={[styles.emptyActionButton, { backgroundColor: tintColor }]}
            onPress={handleCreateStrategy}
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
            <Text style={styles.emptyActionButtonText}>{actionText}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Strategies',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleCreateStrategy}
          style={{ marginRight: 16 }}
        >
          <MaterialCommunityIcons name="plus" size={24} color={tintColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, tintColor]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Strategies</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>
          Build, backtest, and deploy trading strategies
        </Text>
      </View>

      <View style={styles.tabs}>
        {renderTabButton('my_strategies', 'My Strategies', 'account')}
        {renderTabButton('public', 'Public', 'earth')}
        {renderTabButton('templates', 'Templates', 'file-document-multiple')}
      </View>

      {loading && strategies.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading strategies...
          </Text>
        </View>
      ) : (
        <FlatList
          data={strategies}
          keyExtractor={(item) => item.id}
          renderItem={renderStrategyItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  strategyCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  strategyInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  strategyName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  strategyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  performanceSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
