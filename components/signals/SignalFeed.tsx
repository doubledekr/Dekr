import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  SegmentedButtons,
  Chip,
  Icon,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { TradingSignal } from '../../services/SignalGenerator';
import { signalGenerator } from '../../services/SignalGenerator';
import { useAppSelector } from '../../store/hooks';
import { SignalCard } from './SignalCard';
import { safeHapticImpact } from '../../utils/haptics';

interface SignalFeedProps {
  onSignalPress?: (signal: TradingSignal) => void;
  onSubscribeToSignal?: (signalId: string) => void;
  onUnsubscribeFromSignal?: (signalId: string) => void;
}

export const SignalFeed: React.FC<SignalFeedProps> = ({
  onSignalPress,
  onSubscribeToSignal,
  onUnsubscribeFromSignal,
}) => {
  const theme = useTheme();
  const { user } = useAppSelector((state: any) => state.auth);
  
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [filteredSignals, setFilteredSignals] = useState<TradingSignal[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'buy' | 'sell' | 'hold' | 'watch'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFAB, setShowFAB] = useState(true);

  useEffect(() => {
    loadSignals();
  }, []);

  useEffect(() => {
    filterSignals();
  }, [signals, selectedType]);

  const loadSignals = async () => {
    try {
      setIsLoading(true);
      const activeSignals = await signalGenerator.getActiveSignals();
      setSignals(activeSignals);
    } catch (error) {
      console.error('Error loading signals:', error);
      Alert.alert('Error', 'Failed to load trading signals');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSignals = () => {
    if (selectedType === 'all') {
      setFilteredSignals(signals);
    } else {
      setFilteredSignals(signals.filter(signal => signal.type === selectedType));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSignals();
    setIsRefreshing(false);
  };

  const handleSubscribeToSignal = async (signalId: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to subscribe to signals');
      return;
    }

    try {
      safeHapticImpact();
      await signalGenerator.subscribeToSignal(user.uid, signalId);
      onSubscribeToSignal?.(signalId);
      
      // Refresh signals to update subscription status
      await loadSignals();
      
      Alert.alert('Success', 'You have subscribed to this signal');
    } catch (error) {
      console.error('Error subscribing to signal:', error);
      Alert.alert('Error', 'Failed to subscribe to signal');
    }
  };

  const handleUnsubscribeFromSignal = async (signalId: string) => {
    if (!user) {
      return;
    }

    try {
      safeHapticImpact();
      await signalGenerator.unsubscribeFromSignal(user.uid, signalId);
      onUnsubscribeFromSignal?.(signalId);
      
      // Refresh signals to update subscription status
      await loadSignals();
      
      Alert.alert('Success', 'You have unsubscribed from this signal');
    } catch (error) {
      console.error('Error unsubscribing from signal:', error);
      Alert.alert('Error', 'Failed to unsubscribe from signal');
    }
  };

  const getSignalTypeIcon = (type: TradingSignal['type']): string => {
    switch (type) {
      case 'buy':
        return 'trending-up';
      case 'sell':
        return 'trending-down';
      case 'hold':
        return 'pause';
      case 'watch':
        return 'eye';
      default:
        return 'chart-line';
    }
  };

  const getSignalTypeColor = (type: TradingSignal['type']): string => {
    switch (type) {
      case 'buy':
        return '#4CAF50';
      case 'sell':
        return '#F44336';
      case 'hold':
        return '#FF9800';
      case 'watch':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getSignalTypeLabel = (type: TradingSignal['type']): string => {
    switch (type) {
      case 'buy':
        return 'BUY';
      case 'sell':
        return 'SELL';
      case 'hold':
        return 'HOLD';
      case 'watch':
        return 'WATCH';
      default:
        return 'SIGNAL';
    }
  };

  const formatTimeRemaining = (expiresAt: any): string => {
    const now = new Date().getTime();
    const expiryTime = expiresAt.toDate ? expiresAt.toDate().getTime() : new Date(expiresAt).getTime();
    const remaining = Math.max(0, expiryTime - now);
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return 'Expired';
    }
  };

  const renderSignalItem = ({ item }: { item: TradingSignal }) => {
    const isSubscribed = user && item.subscribers.includes(user.uid);
    
    return (
      <SignalCard
        signal={item}
        isSubscribed={isSubscribed}
        onPress={() => onSignalPress?.(item)}
        onSubscribe={() => handleSubscribeToSignal(item.id)}
        onUnsubscribe={() => handleUnsubscribeFromSignal(item.id)}
        onViewDetails={() => onSignalPress?.(item)}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="chart-line-variant"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurfaceVariant }]}>
        No Active Signals
      </Text>
      <Text style={[styles.emptyStateDescription, { color: theme.colors.onSurfaceVariant }]}>
        Community-vetted recommendations will appear here as trading signals.
        Check back soon for new opportunities!
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Icon source="chart-line" size={24} color={theme.colors.primary} />
        <Title style={styles.title}>Trading Signals</Title>
      </View>
      <Text style={styles.signalCount}>
        {filteredSignals.length} active signals
      </Text>
    </View>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <SegmentedButtons
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as 'all' | 'buy' | 'sell' | 'hold' | 'watch')}
        buttons={[
          { value: 'all', label: 'All', icon: 'view-list' },
          { value: 'buy', label: 'Buy', icon: 'trending-up' },
          { value: 'sell', label: 'Sell', icon: 'trending-down' },
          { value: 'hold', label: 'Hold', icon: 'pause' },
          { value: 'watch', label: 'Watch', icon: 'eye' },
        ]}
        style={styles.filterButtons}
      />
    </View>
  );

  const renderStats = () => {
    const stats = {
      buy: signals.filter(s => s.type === 'buy').length,
      sell: signals.filter(s => s.type === 'sell').length,
      hold: signals.filter(s => s.type === 'hold').length,
      watch: signals.filter(s => s.type === 'watch').length,
    };

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {Object.entries(stats).map(([type, count]) => (
            <View key={type} style={styles.statItem}>
              <MaterialCommunityIcons
                name={getSignalTypeIcon(type as TradingSignal['type'])}
                size={16}
                color={getSignalTypeColor(type as TradingSignal['type'])}
              />
              <Text style={styles.statCount}>{count}</Text>
              <Text style={styles.statLabel}>{getSignalTypeLabel(type as TradingSignal['type'])}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading trading signals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderFilterButtons()}
      {renderStats()}

      <FlatList
        data={filteredSignals}
        renderItem={renderSignalItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          setShowFAB(offsetY < 100);
        }}
        scrollEventThrottle={16}
      />

      {showFAB && (
        <FAB
          icon="refresh"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleRefresh}
          label="Refresh"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    marginLeft: 8,
    flex: 1,
  },
  signalCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterButtons: {
    marginBottom: 8,
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
    color: '#333',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
