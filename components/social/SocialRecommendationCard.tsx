import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Avatar, Chip, Button, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { safeHapticImpact } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.9, 380);

export interface SocialRecommendation {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    reputation: number;
    badges: string[];
  };
  asset: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    type: 'stock' | 'crypto';
  };
  recommendation: {
    type: 'buy' | 'sell' | 'hold';
    reasoning: string;
    confidence: number;
    targetPrice?: number;
    timeHorizon: 'short' | 'medium' | 'long';
  };
  votes: {
    upvotes: number;
    downvotes: number;
    userVote?: 'upvote' | 'downvote';
  };
  timestamp: Date;
  isVerified: boolean;
}

interface SocialRecommendationCardProps {
  data: SocialRecommendation;
  onVote?: (recommendationId: string, vote: 'upvote' | 'downvote') => void;
  onFollow?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  onViewAsset?: (symbol: string) => void;
}

export function SocialRecommendationCard({
  data,
  onVote,
  onFollow,
  onViewProfile,
  onViewAsset,
}: SocialRecommendationCardProps) {
  const theme = useTheme();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;
    
    setIsVoting(true);
    safeHapticImpact();
    
    try {
      await onVote?.(data.id, voteType);
    } finally {
      setIsVoting(false);
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'buy': return '#10b981';
      case 'sell': return '#ef4444';
      case 'hold': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTimeHorizonColor = (horizon: string) => {
    switch (horizon) {
      case 'short': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'long': return '#8b5cf6';
      default: return '#6b7280';
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

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        {/* User Header */}
        <View style={styles.userHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => onViewProfile?.(data.user.id)}
          >
            <Avatar.Text 
              size={40} 
              label={data.user.name[0]} 
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                  {data.user.name}
                </Text>
                {data.isVerified && (
                  <MaterialCommunityIcons 
                    name="check-decagram" 
                    size={16} 
                    color="#3b82f6" 
                    style={styles.verifiedIcon}
                  />
                )}
              </View>
              <View style={styles.userMeta}>
                <Chip 
                  mode="outlined" 
                  compact
                  textStyle={styles.reputationText}
                >
                  {data.user.reputation} rep
                </Chip>
                {data.user.badges.slice(0, 2).map((badge, index) => (
                  <Chip 
                    key={index}
                    mode="outlined" 
                    compact
                    textStyle={styles.badgeText}
                  >
                    {badge}
                  </Chip>
                ))}
              </View>
            </View>
          </TouchableOpacity>
          
          <Button 
            mode="outlined" 
            compact
            onPress={() => onFollow?.(data.user.id)}
            style={styles.followButton}
          >
            Follow
          </Button>
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
              textStyle={{ color: getRecommendationColor(data.recommendation.type) }}
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

        {/* Recommendation */}
        <View style={styles.recommendation}>
          <View style={styles.recommendationHeader}>
            <Chip 
              mode="filled" 
              style={[styles.recommendationChip, { backgroundColor: getRecommendationColor(data.recommendation.type) }]}
              textStyle={styles.recommendationText}
            >
              {data.recommendation.type.toUpperCase()}
            </Chip>
            <Chip 
              mode="outlined" 
              compact
              style={[styles.timeHorizonChip, { borderColor: getTimeHorizonColor(data.recommendation.timeHorizon) }]}
              textStyle={{ color: getTimeHorizonColor(data.recommendation.timeHorizon) }}
            >
              {data.recommendation.timeHorizon}
            </Chip>
            <Text style={[styles.confidence, { color: theme.colors.onSurfaceVariant }]}>
              {data.recommendation.confidence}% confidence
            </Text>
          </View>
          
          <Text style={[styles.reasoning, { color: theme.colors.onSurface }]}>
            {data.recommendation.reasoning}
          </Text>
          
          {data.recommendation.targetPrice && (
            <Text style={[styles.targetPrice, { color: theme.colors.onSurfaceVariant }]}>
              Target: ${data.recommendation.targetPrice.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Voting Section */}
        <View style={styles.votingSection}>
          <View style={styles.voteButtons}>
            <TouchableOpacity
              style={[
                styles.voteButton,
                data.votes.userVote === 'upvote' && styles.voteButtonActive
              ]}
              onPress={() => handleVote('upvote')}
              disabled={isVoting}
            >
              <MaterialCommunityIcons 
                name="thumb-up" 
                size={20} 
                color={data.votes.userVote === 'upvote' ? '#10b981' : theme.colors.onSurfaceVariant}
              />
              <Text style={[
                styles.voteCount,
                { color: data.votes.userVote === 'upvote' ? '#10b981' : theme.colors.onSurfaceVariant }
              ]}>
                {data.votes.upvotes}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.voteButton,
                data.votes.userVote === 'downvote' && styles.voteButtonActive
              ]}
              onPress={() => handleVote('downvote')}
              disabled={isVoting}
            >
              <MaterialCommunityIcons 
                name="thumb-down" 
                size={20} 
                color={data.votes.userVote === 'downvote' ? '#ef4444' : theme.colors.onSurfaceVariant}
              />
              <Text style={[
                styles.voteCount,
                { color: data.votes.userVote === 'downvote' ? '#ef4444' : theme.colors.onSurfaceVariant }
              ]}>
                {data.votes.downvotes}
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
            {formatTimeAgo(data.timestamp)}
          </Text>
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  reputationText: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 10,
  },
  followButton: {
    marginLeft: 8,
  },
  assetInfo: {
    marginBottom: 16,
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
  recommendation: {
    marginBottom: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  recommendationChip: {
    marginRight: 8,
  },
  recommendationText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  timeHorizonChip: {
    marginRight: 8,
  },
  confidence: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  reasoning: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  targetPrice: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  votingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
});
