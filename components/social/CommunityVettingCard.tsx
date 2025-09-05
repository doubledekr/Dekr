import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Card, Avatar, Chip, Button, TextInput, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { safeHapticImpact } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.9, 380);

export interface VettingDiscussion {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    reputation: number;
    isExpert: boolean;
  };
  content: string;
  timestamp: Date;
  votes: {
    upvotes: number;
    downvotes: number;
    userVote?: 'upvote' | 'downvote';
  };
  isTopComment: boolean;
}

export interface CommunityVettingData {
  id: string;
  asset: {
    symbol: string;
    name: string;
    price: number;
    change: number;
  };
  recommendation: {
    type: 'buy' | 'sell' | 'hold';
    reasoning: string;
    confidence: number;
  };
  vetting: {
    totalVotes: number;
    approvalRate: number;
    expertConsensus: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell' | 'mixed';
    riskLevel: 'low' | 'medium' | 'high';
    timeHorizon: 'short' | 'medium' | 'long';
  };
  discussions: VettingDiscussion[];
  isUserVoted: boolean;
  userVote?: 'approve' | 'reject';
}

interface CommunityVettingCardProps {
  data: CommunityVettingData;
  onVote?: (vettingId: string, vote: 'approve' | 'reject') => void;
  onAddDiscussion?: (vettingId: string, content: string) => void;
  onVoteDiscussion?: (discussionId: string, vote: 'upvote' | 'downvote') => void;
  onViewProfile?: (userId: string) => void;
}

export function CommunityVettingCard({
  data,
  onVote,
  onAddDiscussion,
  onVoteDiscussion,
  onViewProfile,
}: CommunityVettingCardProps) {
  const theme = useTheme();
  const [showDiscussions, setShowDiscussions] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVote = async (voteType: 'approve' | 'reject') => {
    safeHapticImpact();
    await onVote?.(data.id, voteType);
  };

  const handleAddDiscussion = async () => {
    if (!newComment.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddDiscussion?.(data.id, newComment.trim());
      setNewComment('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteDiscussion = async (discussionId: string, voteType: 'upvote' | 'downvote') => {
    safeHapticImpact();
    await onVoteDiscussion?.(discussionId, voteType);
  };

  const getConsensusColor = (consensus: string) => {
    switch (consensus) {
      case 'strong_buy': return '#10b981';
      case 'buy': return '#22c55e';
      case 'hold': return '#6b7280';
      case 'sell': return '#f59e0b';
      case 'strong_sell': return '#ef4444';
      case 'mixed': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
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
        {/* Asset Header */}
        <View style={styles.assetHeader}>
          <View style={styles.assetInfo}>
            <Text style={[styles.assetSymbol, { color: theme.colors.onSurface }]}>
              {data.asset.symbol}
            </Text>
            <Text style={[styles.assetName, { color: theme.colors.onSurfaceVariant }]}>
              {data.asset.name}
            </Text>
          </View>
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
        </View>

        {/* Vetting Stats */}
        <View style={styles.vettingStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: getConsensusColor(data.vetting.expertConsensus) }]}>
              {data.vetting.approvalRate.toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Approval
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
              {data.vetting.totalVotes}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Votes
            </Text>
          </View>
          <View style={styles.statItem}>
            <Chip 
              mode="outlined" 
              compact
              style={[styles.consensusChip, { borderColor: getConsensusColor(data.vetting.expertConsensus) }]}
              textStyle={{ color: getConsensusColor(data.vetting.expertConsensus) }}
            >
              {data.vetting.expertConsensus.replace('_', ' ')}
            </Chip>
          </View>
        </View>

        {/* Risk and Time Horizon */}
        <View style={styles.metaInfo}>
          <Chip 
            mode="outlined" 
            compact
            style={[styles.riskChip, { borderColor: getRiskColor(data.vetting.riskLevel) }]}
            textStyle={{ color: getRiskColor(data.vetting.riskLevel) }}
          >
            {data.vetting.riskLevel} risk
          </Chip>
          <Chip 
            mode="outlined" 
            compact
            textStyle={{ color: theme.colors.onSurfaceVariant }}
          >
            {data.vetting.timeHorizon} term
          </Chip>
        </View>

        {/* Recommendation */}
        <View style={styles.recommendation}>
          <Text style={[styles.recommendationTitle, { color: theme.colors.onSurface }]}>
            Community Recommendation
          </Text>
          <Text style={[styles.recommendationText, { color: theme.colors.onSurface }]}>
            {data.recommendation.reasoning}
          </Text>
          <View style={styles.recommendationMeta}>
            <Chip 
              mode="filled" 
              compact
              style={[styles.typeChip, { backgroundColor: getConsensusColor(data.recommendation.type) }]}
              textStyle={styles.typeText}
            >
              {data.recommendation.type.toUpperCase()}
            </Chip>
            <Text style={[styles.confidence, { color: theme.colors.onSurfaceVariant }]}>
              {data.recommendation.confidence}% confidence
            </Text>
          </View>
        </View>

        {/* Voting Section */}
        <View style={styles.votingSection}>
          <Text style={[styles.votingTitle, { color: theme.colors.onSurface }]}>
            Do you agree with this recommendation?
          </Text>
          <View style={styles.voteButtons}>
            <Button
              mode={data.userVote === 'approve' ? 'contained' : 'outlined'}
              onPress={() => handleVote('approve')}
              style={[
                styles.voteButton,
                data.userVote === 'approve' && styles.approveButton
              ]}
              labelStyle={data.userVote === 'approve' ? styles.approveButtonText : undefined}
            >
              <MaterialCommunityIcons 
                name="thumb-up" 
                size={20} 
                color={data.userVote === 'approve' ? '#ffffff' : '#10b981'}
              />
              Approve
            </Button>
            <Button
              mode={data.userVote === 'reject' ? 'contained' : 'outlined'}
              onPress={() => handleVote('reject')}
              style={[
                styles.voteButton,
                data.userVote === 'reject' && styles.rejectButton
              ]}
              labelStyle={data.userVote === 'reject' ? styles.rejectButtonText : undefined}
            >
              <MaterialCommunityIcons 
                name="thumb-down" 
                size={20} 
                color={data.userVote === 'reject' ? '#ffffff' : '#ef4444'}
              />
              Reject
            </Button>
          </View>
        </View>

        {/* Discussions Toggle */}
        <TouchableOpacity
          style={styles.discussionsToggle}
          onPress={() => setShowDiscussions(!showDiscussions)}
        >
          <Text style={[styles.discussionsTitle, { color: theme.colors.onSurface }]}>
            Community Discussions ({data.discussions.length})
          </Text>
          <MaterialCommunityIcons 
            name={showDiscussions ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>

        {/* Discussions */}
        {showDiscussions && (
          <View style={styles.discussions}>
            {/* Add Comment */}
            <View style={styles.addComment}>
              <TextInput
                mode="outlined"
                placeholder="Share your thoughts..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                style={styles.commentInput}
                outlineStyle={styles.commentInputOutline}
              />
              <Button
                mode="contained"
                onPress={handleAddDiscussion}
                disabled={!newComment.trim() || isSubmitting}
                style={styles.submitButton}
              >
                Post
              </Button>
            </View>

            {/* Comments List */}
            <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
              {data.discussions.map((discussion) => (
                <View key={discussion.id} style={styles.comment}>
                  <View style={styles.commentHeader}>
                    <TouchableOpacity 
                      style={styles.commentUser}
                      onPress={() => onViewProfile?.(discussion.user.id)}
                    >
                      <Avatar.Text 
                        size={32} 
                        label={discussion.user.name[0]} 
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentUserInfo}>
                        <View style={styles.commentUserNameRow}>
                          <Text style={[styles.commentUserName, { color: theme.colors.onSurface }]}>
                            {discussion.user.name}
                          </Text>
                          {discussion.user.isExpert && (
                            <Chip 
                              mode="outlined" 
                              compact
                              textStyle={styles.expertChip}
                            >
                              Expert
                            </Chip>
                          )}
                          {discussion.isTopComment && (
                            <Chip 
                              mode="filled" 
                              compact
                              style={styles.topCommentChip}
                              textStyle={styles.topCommentText}
                            >
                              Top
                            </Chip>
                          )}
                        </View>
                        <Text style={[styles.commentReputation, { color: theme.colors.onSurfaceVariant }]}>
                          {discussion.user.reputation} rep
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={[styles.commentTime, { color: theme.colors.onSurfaceVariant }]}>
                      {formatTimeAgo(discussion.timestamp)}
                    </Text>
                  </View>
                  
                  <Text style={[styles.commentContent, { color: theme.colors.onSurface }]}>
                    {discussion.content}
                  </Text>
                  
                  <View style={styles.commentVoting}>
                    <TouchableOpacity
                      style={[
                        styles.commentVoteButton,
                        discussion.votes.userVote === 'upvote' && styles.commentVoteButtonActive
                      ]}
                      onPress={() => handleVoteDiscussion(discussion.id, 'upvote')}
                    >
                      <MaterialCommunityIcons 
                        name="thumb-up" 
                        size={16} 
                        color={discussion.votes.userVote === 'upvote' ? '#10b981' : theme.colors.onSurfaceVariant}
                      />
                      <Text style={[
                        styles.commentVoteCount,
                        { color: discussion.votes.userVote === 'upvote' ? '#10b981' : theme.colors.onSurfaceVariant }
                      ]}>
                        {discussion.votes.upvotes}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.commentVoteButton,
                        discussion.votes.userVote === 'downvote' && styles.commentVoteButtonActive
                      ]}
                      onPress={() => handleVoteDiscussion(discussion.id, 'downvote')}
                    >
                      <MaterialCommunityIcons 
                        name="thumb-down" 
                        size={16} 
                        color={discussion.votes.userVote === 'downvote' ? '#ef4444' : theme.colors.onSurfaceVariant}
                      />
                      <Text style={[
                        styles.commentVoteCount,
                        { color: discussion.votes.userVote === 'downvote' ? '#ef4444' : theme.colors.onSurfaceVariant }
                      ]}>
                        {discussion.votes.downvotes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
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
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  assetName: {
    fontSize: 14,
    marginTop: 2,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
  },
  change: {
    fontSize: 16,
    fontWeight: '500',
  },
  vettingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  consensusChip: {
    marginTop: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  riskChip: {
    marginRight: 8,
  },
  recommendation: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    marginRight: 8,
  },
  typeText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  confidence: {
    fontSize: 12,
  },
  votingSection: {
    marginBottom: 16,
  },
  votingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  approveButtonText: {
    color: '#ffffff',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  rejectButtonText: {
    color: '#ffffff',
  },
  discussionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  discussionsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  discussions: {
    marginTop: 16,
  },
  addComment: {
    marginBottom: 16,
  },
  commentInput: {
    marginBottom: 8,
  },
  commentInputOutline: {
    borderRadius: 8,
  },
  submitButton: {
    alignSelf: 'flex-end',
  },
  commentsList: {
    maxHeight: 300,
  },
  comment: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    marginRight: 8,
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUserNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  expertChip: {
    fontSize: 10,
  },
  topCommentChip: {
    backgroundColor: '#fbbf24',
  },
  topCommentText: {
    color: '#ffffff',
    fontSize: 10,
  },
  commentReputation: {
    fontSize: 12,
  },
  commentTime: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentVoting: {
    flexDirection: 'row',
    gap: 12,
  },
  commentVoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  commentVoteButtonActive: {
    backgroundColor: '#e0f2fe',
  },
  commentVoteCount: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});
