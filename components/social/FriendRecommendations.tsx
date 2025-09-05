import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Card, Avatar, Chip, Button, Badge, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Recommendation } from '../../services/RecommendationService';
import {
  fetchReceivedRecommendations,
  fetchPendingRecommendations,
  markRecommendationAsViewed,
  updateRecommendationStatus,
  deleteRecommendation,
} from '../../store/slices/recommendationSlice';
import { safeHapticImpact } from '../../utils/haptics';

interface FriendRecommendationsProps {
  userId: string;
  onRecommendationPress?: (recommendation: Recommendation) => void;
  onSendRecommendation?: () => void;
}

export const FriendRecommendations: React.FC<FriendRecommendationsProps> = ({
  userId,
  onRecommendationPress,
  onSendRecommendation,
}) => {
  const dispatch = useDispatch();
  const { receivedRecommendations, pendingRecommendations, loading } = useSelector(
    (state: RootState) => state.recommendations
  );

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    loadRecommendations();
  }, [userId]);

  const loadRecommendations = async () => {
    try {
      await Promise.all([
        dispatch(fetchReceivedRecommendations(userId) as any),
        dispatch(fetchPendingRecommendations(userId) as any),
      ]);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const handleRecommendationPress = async (recommendation: Recommendation) => {
    safeHapticImpact();
    
    // Mark as viewed if still pending
    if (recommendation.status === 'pending') {
      await dispatch(markRecommendationAsViewed(recommendation.id) as any);
    }
    
    onRecommendationPress?.(recommendation);
  };

  const handleAction = async (recommendation: Recommendation, action: 'acted' | 'dismissed') => {
    try {
      await dispatch(updateRecommendationStatus({
        recommendationId: recommendation.id,
        status: action,
      }) as any);
      
      safeHapticImpact();
    } catch (error) {
      console.error('Error updating recommendation status:', error);
      Alert.alert('Error', 'Failed to update recommendation status');
    }
  };

  const handleDelete = async (recommendation: Recommendation) => {
    Alert.alert(
      'Delete Recommendation',
      'Are you sure you want to delete this recommendation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteRecommendation(recommendation.id) as any);
              safeHapticImpact();
            } catch (error) {
              console.error('Error deleting recommendation:', error);
              Alert.alert('Error', 'Failed to delete recommendation');
            }
          },
        },
      ]
    );
  };

  const getRecommendationIcon = (type: Recommendation['type']) => {
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

  const getRecommendationColor = (recommendation: Recommendation['recommendation']) => {
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

  const renderRecommendation = ({ item }: { item: Recommendation }) => (
    <Card style={styles.recommendationCard}>
      <TouchableOpacity onPress={() => handleRecommendationPress(item)}>
        <Card.Content>
          <View style={styles.recommendationHeader}>
            <View style={styles.userInfo}>
              <Avatar.Text
                size={40}
                label={item.fromUserName.charAt(0).toUpperCase()}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{item.fromUserName}</Text>
                <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
              </View>
            </View>
            
            <View style={styles.recommendationMeta}>
              <MaterialCommunityIcons
                name={getRecommendationIcon(item.type)}
                size={20}
                color="#666"
              />
              {item.isTimeSensitive && (
                <Badge style={styles.urgentBadge}>URGENT</Badge>
              )}
              {item.status === 'pending' && (
                <Badge style={styles.pendingBadge}>NEW</Badge>
              )}
            </View>
          </View>

          <View style={styles.recommendationContent}>
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>
                {item.assetName || item.strategyName || item.educationTitle}
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

          <Text style={styles.reasoning} numberOfLines={3}>
            {item.reasoning}
          </Text>

          {item.targetPrice && (
            <View style={styles.targetInfo}>
              <Text style={styles.targetLabel}>Target Price:</Text>
              <Text style={styles.targetPrice}>${item.targetPrice.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.recommendationActions}>
            <Button
              mode="outlined"
              onPress={() => handleAction(item, 'acted')}
              style={styles.actionButton}
              compact
            >
              Acted
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleAction(item, 'dismissed')}
              style={styles.actionButton}
              compact
            >
              Dismiss
            </Button>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.deleteButton}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const currentRecommendations = selectedTab === 'pending' ? pendingRecommendations : receivedRecommendations;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friend Recommendations</Text>
        <TouchableOpacity onPress={onSendRecommendation} style={styles.sendButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#6CA393" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All ({receivedRecommendations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
            Pending ({pendingRecommendations.length})
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
            <MaterialCommunityIcons name="lightbulb-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {selectedTab === 'pending' 
                ? 'No pending recommendations' 
                : 'No recommendations yet'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'pending' 
                ? 'You\'re all caught up!' 
                : 'Ask your friends to share their investment ideas'
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  sendButton: {
    padding: 8,
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#6CA393',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeAgo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentBadge: {
    backgroundColor: '#F44336',
  },
  pendingBadge: {
    backgroundColor: '#2196F3',
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
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  targetPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6CA393',
  },
  recommendationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
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
