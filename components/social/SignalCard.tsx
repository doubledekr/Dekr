import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Avatar, Chip, Button, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { safeHapticImpact } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.9, 380);

export interface SignalData {
  id: string;
  asset: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    type: 'stock' | 'crypto' | 'forex';
  };
  signal: {
    type: 'buy' | 'sell' | 'hold';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
    reasoning: string;
    targetPrice?: number;
    stopLoss?: number;
    timeHorizon: 'short' | 'medium' | 'long';
  };
  source: {
    type: 'ai' | 'community' | 'expert' | 'strategy';
    name: string;
    avatar?: string;
    reputation: number;
    isVerified: boolean;
  };
  performance: {
    accuracy: number;
    totalSignals: number;
    winRate: number;
    avgReturn: number;
  };
  timestamp: Date;
  expiry?: Date;
  isActive: boolean;
  userAction?: 'followed' | 'ignored' | 'opposite';
  communityVotes: {
    upvotes: number;
    downvotes: number;
    userVote?: 'upvote' | 'downvote';
  };
}

interface SignalCardProps {
  data: SignalData;
  onFollow?: (signalId: string) => void;
  onIgnore?: (signalId: string) => void;
  onOpposite?: (signalId: string) => void;
  onVote?: (signalId: string, vote: 'upvote' | 'downvote') => void;
  onViewProfile?: (userId: string) => void;
  onViewAsset?: (symbol: string) => void;
}

export function SignalCard({
  data,
  onFollow,
  onIgnore,
  onOpposite,
  onVote,
  onViewProfile,
  onViewAsset,
}: SignalCardProps) {
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const handleAction = (action: string) => {
    safeHapticImpact();
    
    switch (action) {
      case 'follow':
        onFollow?.(data.id);
        break;
      case 'ignore':
        onIgnore?.(data.id);
        break;
      case 'opposite':
        onOpposite?.(data.id);
        break;
    }
  };

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    safeHapticImpact();
    onVote?.(data.id, voteType);
  };

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'buy': return '#10b981';
      case 'sell': return '#ef4444';
      case 'hold': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return '#f59e0b';
      case 'moderate': return '#3b82f6';
      case 'strong': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'ai': return 'robot';
      case 'community': return 'account-group';
      case 'expert': return 'account-star';
      case 'strategy': return 'chart-line';
      default: return 'source-branch';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const formatExpiry = (expiry?: Date) => {
    if (!expiry) return null;
    
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `Expires in ${hours}h`;
    return `Expires in ${minutes}m`;
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.signalHeader}>
            <View style={styles.signalTypeRow}>
              <Chip 
                mode="filled" 
                style={[styles.signalChip, { backgroundColor: getSignalColor(data.signal.type) }]}
                textStyle={styles.signalText}
              >
                {data.signal.type.toUpperCase()}
              </Chip>
              <Chip 
                mode="outlined" 
                compact
                style={[styles.strengthChip, { borderColor: getStrengthColor(data.signal.strength) }]}
                textStyle={{ color: getStrengthColor(data.signal.strength) }}
              >
                {data.signal.strength}
              </Chip>
            </View>
            <View style={styles.confidenceRow}>
              <Text style={[styles.confidence, { color: theme.colors.onSurfaceVariant }]}>
                {data.signal.confidence}% confidence
              </Text>
              {data.expiry && (
                <Text style={[styles.expiry, { color: theme.colors.onSurfaceVariant }]}>
                  {formatExpiry(data.expiry)}
                </Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.detailsToggle}
            onPress={() => setShowDetails(!showDetails)}
          >
            <MaterialCommunityIcons 
              name={showDetails ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Asset Info */}
        <TouchableOpacity 
          style={styles.assetInfo}
          onPress={() => onViewAsset?.(data.asset.symbol)}
        >
          <View style={styles.assetHeader}>
            <Text style={[styles.assetSymbol, { color: theme.colors.onSurface }]}>
              {data.asset.symbol}
            </Text>
            <Chip 
              mode="outlined" 
              compact
              textStyle={{ color: theme.colors.onSurfaceVariant }}
            >
              {data.asset.type.toUpperCase()}
            </Chip>
          </View>
          <Text style={[styles.assetName, { color: theme.colors.onSurfaceVariant }]}>
            {data.asset.name}
          </Text>
          <View style={styles.priceInfo}>
            <Text style={[styles.price, { color: theme.colors.onSurface }]}>
              ${data.asset.price.toFixed(2)}
            </Text>
            <Text style={[
              styles.change, 
              { color: data.asset.change >= 0 ? '#10b981' : '#ef4444' }
            ]}>
              {data.asset.change >= 0 ? '+' : ''}{data.asset.change.toFixed(2)}%
            </Text>
          </View>
        </TouchableOpacity>

        {/* Source Info */}
        <TouchableOpacity 
          style={styles.sourceInfo}
          onPress={() => onViewProfile?.(data.source.name)}
        >
          <View style={styles.sourceHeader}>
            <MaterialCommunityIcons 
              name={getSourceIcon(data.source.type) as any} 
              size={20} 
              color={theme.colors.primary}
            />
            <Text style={[styles.sourceName, { color: theme.colors.onSurface }]}>
              {data.source.name}
            </Text>
            {data.source.isVerified && (
              <MaterialCommunityIcons 
                name="check-decagram" 
                size={16} 
                color="#3b82f6"
              />
            )}
          </View>
          <View style={styles.sourceMeta}>
            <Chip 
              mode="outlined" 
              compact
              textStyle={styles.sourceTypeText}
            >
              {data.source.type}
            </Chip>
            <Chip 
              mode="outlined" 
              compact
              textStyle={styles.reputationText}
            >
              {data.source.reputation} rep
            </Chip>
          </View>
        </TouchableOpacity>

        {/* Signal Reasoning */}
        <View style={styles.reasoningSection}>
          <Text style={[styles.reasoningTitle, { color: theme.colors.onSurface }]}>
            Signal Reasoning
          </Text>
          <Text style={[styles.reasoning, { color: theme.colors.onSurfaceVariant }]}>
            {data.signal.reasoning}
          </Text>
        </View>

        {/* Details Section */}
        {showDetails && (
          <View style={styles.detailsSection}>
            {/* Target Price & Stop Loss */}
            {(data.signal.targetPrice || data.signal.stopLoss) && (
              <View style={styles.priceTargets}>
                {data.signal.targetPrice && (
                  <View style={styles.priceTarget}>
                    <Text style={[styles.priceTargetLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Target Price
                    </Text>
                    <Text style={[styles.priceTargetValue, { color: '#10b981' }]}>
                      ${data.signal.targetPrice.toFixed(2)}
                    </Text>
                  </View>
                )}
                {data.signal.stopLoss && (
                  <View style={styles.priceTarget}>
                    <Text style={[styles.priceTargetLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Stop Loss
                    </Text>
                    <Text style={[styles.priceTargetValue, { color: '#ef4444' }]}>
                      ${data.signal.stopLoss.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Performance Metrics */}
            <View style={styles.performanceSection}>
              <Text style={[styles.performanceTitle, { color: theme.colors.onSurface }]}>
                Source Performance
              </Text>
              <View style={styles.performanceGrid}>
                <View style={styles.performanceItem}>
                  <Text style={[styles.performanceValue, { color: getSignalColor('buy') }]}>
                    {data.performance.accuracy.toFixed(1)}%
                  </Text>
                  <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Accuracy
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={[styles.performanceValue, { color: theme.colors.onSurface }]}>
                    {data.performance.totalSignals}
                  </Text>
                  <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Signals
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={[styles.performanceValue, { color: getSignalColor('buy') }]}>
                    {data.performance.winRate.toFixed(1)}%
                  </Text>
                  <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Win Rate
                  </Text>
                </View>
                <View style={styles.performanceItem}>
                  <Text style={[styles.performanceValue, { color: getSignalColor('buy') }]}>
                    {data.performance.avgReturn >= 0 ? '+' : ''}{data.performance.avgReturn.toFixed(1)}%
                  </Text>
                  <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Avg Return
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Community Voting */}
        <View style={styles.votingSection}>
          <View style={styles.voteButtons}>
            <TouchableOpacity
              style={[
                styles.voteButton,
                data.communityVotes.userVote === 'upvote' && styles.voteButtonActive
              ]}
              onPress={() => handleVote('upvote')}
            >
              <MaterialCommunityIcons 
                name="thumb-up" 
                size={20} 
                color={data.communityVotes.userVote === 'upvote' ? '#10b981' : theme.colors.onSurfaceVariant}
              />
              <Text style={[
                styles.voteCount,
                { color: data.communityVotes.userVote === 'upvote' ? '#10b981' : theme.colors.onSurfaceVariant }
              ]}>
                {data.communityVotes.upvotes}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.voteButton,
                data.communityVotes.userVote === 'downvote' && styles.voteButtonActive
              ]}
              onPress={() => handleVote('downvote')}
            >
              <MaterialCommunityIcons 
                name="thumb-down" 
                size={20} 
                color={data.communityVotes.userVote === 'downvote' ? '#ef4444' : theme.colors.onSurfaceVariant}
              />
              <Text style={[
                styles.voteCount,
                { color: data.communityVotes.userVote === 'downvote' ? '#ef4444' : theme.colors.onSurfaceVariant }
              ]}>
                {data.communityVotes.downvotes}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
            {formatTimeAgo(data.timestamp)}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {data.userAction !== 'followed' && (
            <Button
              mode="contained"
              onPress={() => handleAction('follow')}
              style={[styles.actionButton, styles.followButton]}
              icon="check"
            >
              Follow Signal
            </Button>
          )}
          
          {data.userAction !== 'ignored' && (
            <Button
              mode="outlined"
              onPress={() => handleAction('ignore')}
              style={[styles.actionButton, styles.ignoreButton]}
              icon="close"
            >
              Ignore
            </Button>
          )}
          
          {data.userAction !== 'opposite' && (
            <Button
              mode="outlined"
              onPress={() => handleAction('opposite')}
              style={[styles.actionButton, styles.oppositeButton]}
              icon="swap-horizontal"
            >
              Opposite
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginHorizontal: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  signalHeader: {
    flex: 1,
  },
  signalTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  signalChip: {
    marginRight: 8,
  },
  signalText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  strengthChip: {
    marginRight: 8,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confidence: {
    fontSize: 12,
  },
  expiry: {
    fontSize: 12,
  },
  detailsToggle: {
    padding: 4,
  },
  assetInfo: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  assetSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  assetName: {
    fontSize: 14,
    marginBottom: 8,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
  },
  change: {
    fontSize: 16,
    fontWeight: '500',
  },
  sourceInfo: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sourceMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  sourceTypeText: {
    fontSize: 12,
  },
  reputationText: {
    fontSize: 12,
  },
  reasoningSection: {
    marginBottom: 12,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reasoning: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailsSection: {
    marginBottom: 12,
  },
  priceTargets: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  priceTarget: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  priceTargetLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceTargetValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  performanceItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  performanceLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  votingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  voteButtonActive: {
    backgroundColor: '#e0f2fe',
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  followButton: {
    backgroundColor: '#10b981',
  },
  ignoreButton: {
    borderColor: '#6b7280',
  },
  oppositeButton: {
    borderColor: '#f59e0b',
  },
});
