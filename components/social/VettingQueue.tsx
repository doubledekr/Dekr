import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Avatar, Chip, Button, ProgressBar, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VettingRecommendation } from '../../services/VettingService';
import { vettingService } from '../../services/VettingService';
import { safeHapticImpact } from '../../utils/haptics';

interface VettingQueueProps {
  onRecommendationPress?: (recommendation: VettingRecommendation) => void;
  onVote?: (recommendationId: string, vote: 'up' | 'down') => void;
}

export const VettingQueue: React.FC<VettingQueueProps> = ({
  onRecommendationPress,
  onVote,
}) => {
  const [recommendations, setRecommendations] = useState<VettingRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'voting'>('pending');

  useEffect(() => {
    loadRecommendations();
    
    // Subscribe to real-time updates
    const unsubscribe = vettingService.subscribeToVettingQueue((updatedRecommendations) => {
      setRecommendations(updatedRecommendations);
    });

    return unsubscribe;
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const pending = await vettingService.getPendingVetting();
      const voting = await vettingService.getVotingQueue();
      setRecommendations([...pending, ...voting]);
    } catch (error) {
      console.error('Error loading vetting recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const handleRecommendationPress = (recommendation: VettingRecommendation) => {
    safeHapticImpact();
    onRecommendationPress?.(recommendation);
  };

  const handleVote = async (recommendationId: string, vote: 'up' | 'down') => {
    try {
      // In a real implementation, you'd get the current user's info
      const userId = 'current_user_id';
      const userName = 'Current User';
      const userReputation = 25; // This would come from user state
      
      await vettingService.voteOnRecommendation(
        recommendationId,
        userId,
        userName,
        userReputation,
        vote
      );
      
      safeHapticImpact();
      onVote?.(recommendationId, vote);
    } catch (error) {
      console.error('Error voting on recommendation:', error);
    }
  };

  const getRecommendationIcon = (type: VettingRecommendation['type']) => {
    switch (type) {
      case 'stock':
        return 'chart-line';
      case 'crypto':
        return 'bitcoin';
      case 'strategy':
        return 'strategy';
      case 'education':
        return 'school';
      default:
        return 'lightbulb';
    }
  };

  const getRecommendationColor = (recommendation: VettingRecommendation['recommendation']) => {
    switch (recommendation) {
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

  const getReputationLevel = (reputation: number) => {
    if (reputation >= 80) return { level: 'Master', color: '#9C27B0' };
    if (reputation >= 60) return { level: 'Expert', color: '#FF9800' };
    if (reputation >= 30) return { level: 'Intermediate', color: '#2196F3' };
    return { level: 'Novice', color: '#9E9E9E' };
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const calculateVotingProgress = (recommendation: VettingRecommendation) => {
    const { upvotes, downvotes } = recommendation.votes;
    const total = upvotes + downvotes;
    if (total === 0) return { progress: 0, approvalRate: 0 };
    
    const approvalRate = upvotes / total;
    const progress = Math.min(total / 10, 1); // Progress towards 10 votes threshold
    
    return { progress, approvalRate };
  };

  const renderRecommendation = ({ item }: { item: VettingRecommendation }) => {
    const { progress, approvalRate } = calculateVotingProgress(item);
    const reputationInfo = getReputationLevel(item.submitterReputation);
    
    return (
      <Card style={styles.recommendationCard}>
        <TouchableOpacity onPress={() => handleRecommendationPress(item)}>
          <Card.Content>
            <View style={styles.recommendationHeader}>
              <View style={styles.submitterInfo}>
                <Avatar.Text
                  size={40}
                  label={item.submitterName.charAt(0).toUpperCase()}
                  style={[styles.avatar, { backgroundColor: reputationInfo.color }]}
                />
                <View style={styles.submitterDetails}>
                  <Text style={styles.submitterName}>{item.submitterName}</Text>
                  <View style={styles.reputationRow}>
                    <Chip
                      mode="outlined"
                      compact
                      style={[styles.reputationChip, { borderColor: reputationInfo.color }]}
                      textStyle={{ color: reputationInfo.color, fontSize: 10 }}
                    >
                      {reputationInfo.level}
                    </Chip>
                    <Text style={styles.reputationScore}>{item.submitterReputation}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.recommendationMeta}>
                <MaterialCommunityIcons
                  name={getRecommendationIcon(item.type)}
                  size={20}
                  color="#666"
                />
                <Badge style={styles.statusBadge}>
                  {item.status.toUpperCase()}
                </Badge>
              </View>
            </View>

            <View style={styles.recommendationContent}>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>
                  {item.assetName || item.assetSymbol}
                </Text>
                {item.assetSymbol && (
                  <Text style={styles.assetSymbol}>{item.assetSymbol}</Text>
                )}
                {item.assetPrice && (
                  <Text style={styles.assetPrice}>${item.assetPrice.toFixed(2)}</Text>
                )}
              </View>

              <Chip
                mode="outlined"
                style={[styles.recommendationChip, { borderColor: getRecommendationColor(item.recommendation) }]}
                textStyle={{ color: getRecommendationColor(item.recommendation) }}
              >
                {item.recommendation.toUpperCase()}
              </Chip>
            </View>

            <Text style={styles.reasoning} numberOfLines={2}>
              {item.reasoning}
            </Text>

            {item.status === 'voting' && (
              <View style={styles.votingSection}>
                <View style={styles.votingHeader}>
                  <Text style={styles.votingTitle}>Community Voting</Text>
                  <Text style={styles.votingStats}>
                    {item.votes.upvotes} up • {item.votes.downvotes} down
                  </Text>
                </View>
                
                <ProgressBar
                  progress={progress}
                  color={approvalRate >= 0.7 ? '#4CAF50' : '#FF9800'}
                  style={styles.progressBar}
                />
                
                <View style={styles.votingActions}>
                  <Button
                    mode="outlined"
                    onPress={() => handleVote(item.id, 'up')}
                    style={[styles.voteButton, styles.upvoteButton]}
                    icon="thumb-up"
                    compact
                  >
                    Upvote
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => handleVote(item.id, 'down')}
                    style={[styles.voteButton, styles.downvoteButton]}
                    icon="thumb-down"
                    compact
                  >
                    Downvote
                  </Button>
                </View>
              </View>
            )}

            <View style={styles.recommendationFooter}>
              <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
              <View style={styles.footerStats}>
                <MaterialCommunityIcons name="comment-outline" size={16} color="#666" />
                <Text style={styles.footerText}>{item.communityAnalysis.discussionCount}</Text>
                <MaterialCommunityIcons name="account-group" size={16} color="#666" />
                <Text style={styles.footerText}>{item.votes.totalVoters}</Text>
              </View>
            </View>
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  const currentRecommendations = recommendations.filter(rec => 
    selectedTab === 'pending' ? rec.status === 'pending' : rec.status === 'voting'
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Community Vetting</Text>
        <Text style={styles.subtitle}>Help validate investment recommendations</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
            Pending ({recommendations.filter(r => r.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'voting' && styles.activeTab]}
          onPress={() => setSelectedTab('voting')}
        >
          <Text style={[styles.tabText, selectedTab === 'voting' && styles.activeTabText]}>
            Voting ({recommendations.filter(r => r.status === 'voting').length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentRecommendations}
        renderItem={renderRecommendation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="gavel" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {selectedTab === 'pending' 
                ? 'No pending recommendations' 
                : 'No active voting'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'pending' 
                ? 'All recommendations are being reviewed' 
                : 'Be the first to vote on new recommendations'
              }
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6CA393',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6CA393',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  recommendationCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  submitterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  submitterDetails: {
    flex: 1,
  },
  submitterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reputationChip: {
    marginRight: 8,
  },
  reputationScore: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#6CA393',
  },
  recommendationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  assetSymbol: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  assetPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6CA393',
    marginTop: 2,
  },
  recommendationChip: {
    marginLeft: 12,
  },
  reasoning: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  votingSection: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  votingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  votingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  votingStats: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
  },
  votingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    flex: 1,
  },
  upvoteButton: {
    borderColor: '#4CAF50',
  },
  downvoteButton: {
    borderColor: '#F44336',
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
  },
  footerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
