import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Icon,
  Avatar,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { TradingSignal } from '../../services/SignalGenerator';
import { safeHapticImpact } from '../../utils/haptics';

interface SignalCardProps {
  signal: TradingSignal;
  isSubscribed?: boolean;
  onPress?: () => void;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
  onViewDetails?: () => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  isSubscribed = false,
  onPress,
  onSubscribe,
  onUnsubscribe,
  onViewDetails,
}) => {
  const theme = useTheme();
  const [isSubscribing, setIsSubscribing] = useState(false);

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

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#4CAF50';
    if (confidence >= 60) return '#FF9800';
    return '#F44336';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  const formatTimeRemaining = (expiresAt: any): string => {
    const now = new Date().getTime();
    const expiryTime = expiresAt.toDate ? expiresAt.toDate().getTime() : new Date(expiresAt).getTime();
    const remaining = Math.max(0, expiryTime - now);
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Expired';
    }
  };

  const formatPrice = (price?: number): string => {
    if (!price) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatPercentage = (percentage?: number): string => {
    if (!percentage) return 'N/A';
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const handleSubscribe = async () => {
    if (isSubscribing) return;
    
    setIsSubscribing(true);
    safeHapticImpact();
    
    try {
      await onSubscribe?.();
    } catch (error) {
      console.error('Error subscribing to signal:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (isSubscribing) return;
    
    setIsSubscribing(true);
    safeHapticImpact();
    
    try {
      await onUnsubscribe?.();
    } catch (error) {
      console.error('Error unsubscribing from signal:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const isExpired = () => {
    const now = new Date().getTime();
    const expiryTime = signal.expiresAt.toDate ? signal.expiresAt.toDate().getTime() : new Date(signal.expiresAt).getTime();
    return now > expiryTime;
  };

  const getPerformanceColor = (performance?: TradingSignal['performance']): string => {
    if (!performance || !performance.actualReturn) return '#9E9E9E';
    return performance.actualReturn >= 0 ? '#4CAF50' : '#F44336';
  };

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Card style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        isExpired() && styles.expiredCard
      ]}>
        <Card.Content>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Icon
                source={getSignalTypeIcon(signal.type)}
                size={24}
                color={getSignalTypeColor(signal.type)}
              />
              <View style={styles.titleContent}>
                <Title style={styles.title}>{signal.assetName}</Title>
                <Text style={styles.symbol}>{signal.assetSymbol}</Text>
              </View>
            </View>
            <Chip
              mode="outlined"
              textStyle={{ color: getSignalTypeColor(signal.type) }}
              style={{ borderColor: getSignalTypeColor(signal.type) }}
            >
              {getSignalTypeLabel(signal.type)}
            </Chip>
          </View>

          {/* Signal Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.signalTitle}>{signal.title}</Text>
            <Paragraph style={styles.description}>
              {signal.description}
            </Paragraph>
          </View>

          {/* Price and Performance */}
          <View style={styles.priceContainer}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Current Price</Text>
              <Text style={styles.priceValue}>
                {formatPrice(signal.currentPrice)}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Target Price</Text>
              <Text style={styles.priceValue}>
                {formatPrice(signal.targetPrice)}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Stop Loss</Text>
              <Text style={styles.priceValue}>
                {formatPrice(signal.stopLoss)}
              </Text>
            </View>
          </View>

          {/* Performance Metrics */}
          {signal.performance && (
            <View style={styles.performanceContainer}>
              <Text style={styles.performanceTitle}>Performance</Text>
              <View style={styles.performanceRow}>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Return</Text>
                  <Text style={[
                    styles.performanceValue,
                    { color: getPerformanceColor(signal.performance) }
                  ]}>
                    {formatPercentage(signal.performance.actualReturn)}
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Max Drawdown</Text>
                  <Text style={styles.performanceValue}>
                    {formatPercentage(signal.performance.maxDrawdown)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Confidence and Community */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricItem}>
              <MaterialCommunityIcons
                name="chart-line"
                size={16}
                color={getConfidenceColor(signal.confidence)}
              />
              <Text style={styles.metricLabel}>Confidence</Text>
              <Text style={[
                styles.metricValue,
                { color: getConfidenceColor(signal.confidence) }
              ]}>
                {signal.confidence}% ({getConfidenceLabel(signal.confidence)})
              </Text>
            </View>
            <View style={styles.metricItem}>
              <MaterialCommunityIcons
                name="account-group"
                size={16}
                color="#2196F3"
              />
              <Text style={styles.metricLabel}>Subscribers</Text>
              <Text style={styles.metricValue}>
                {signal.subscribers.length}
              </Text>
            </View>
          </View>

          {/* Time Remaining */}
          <View style={styles.timeContainer}>
            <View style={styles.timeHeader}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.timeLabel}>Time Remaining</Text>
            </View>
            <Text style={[
              styles.timeRemaining,
              { color: isExpired() ? '#F44336' : '#FF6B35' }
            ]}>
              {formatTimeRemaining(signal.expiresAt)}
            </Text>
            {!isExpired() && (
              <ProgressBar
                progress={1 - (Date.now() - signal.createdAt.toDate().getTime()) / (signal.expiresAt.toDate().getTime() - signal.createdAt.toDate().getTime())}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={onViewDetails}
              style={styles.detailsButton}
              compact
            >
              View Details
            </Button>
            
            {!isExpired() && (
              <Button
                mode={isSubscribed ? "outlined" : "contained"}
                onPress={isSubscribed ? handleUnsubscribe : handleSubscribe}
                loading={isSubscribing}
                disabled={isSubscribing}
                style={[
                  styles.subscribeButton,
                  isSubscribed && styles.unsubscribeButton
                ]}
                compact
              >
                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </Button>
            )}
          </View>

          {/* Community Consensus */}
          <View style={styles.consensusContainer}>
            <Text style={styles.consensusTitle}>Community Consensus</Text>
            <View style={styles.consensusRow}>
              <View style={styles.consensusItem}>
                <MaterialCommunityIcons name="thumb-up" size={16} color="#4CAF50" />
                <Text style={styles.consensusCount}>
                  {signal.communityConsensus?.upvotes || 0}
                </Text>
              </View>
              <View style={styles.consensusItem}>
                <MaterialCommunityIcons name="thumb-down" size={16} color="#F44336" />
                <Text style={styles.consensusCount}>
                  {signal.communityConsensus?.downvotes || 0}
                </Text>
              </View>
              <View style={styles.consensusItem}>
                <MaterialCommunityIcons name="comment" size={16} color="#2196F3" />
                <Text style={styles.consensusCount}>
                  {signal.communityConsensus?.comments || 0}
                </Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    elevation: 4,
  },
  expiredCard: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleContent: {
    marginLeft: 8,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  symbol: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  signalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  priceItem: {
    alignItems: 'center',
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  performanceContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2E7D32',
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceItem: {
    alignItems: 'center',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#2E7D32',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    marginRight: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeContainer: {
    marginBottom: 16,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeRemaining: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    marginTop: 8,
    height: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailsButton: {
    flex: 1,
    marginRight: 8,
  },
  subscribeButton: {
    flex: 1,
    marginLeft: 8,
  },
  unsubscribeButton: {
    borderColor: '#F44336',
  },
  consensusContainer: {
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  consensusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1976D2',
  },
  consensusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  consensusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consensusCount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    color: '#1976D2',
  },
});
