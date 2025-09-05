import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  SegmentedButtons,
  Avatar,
  Chip,
  Icon,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { LeaderboardEntry } from '../../services/RewardSystem';
import { rewardSystem } from '../../services/RewardSystem';
import { useAppSelector } from '../../store/hooks';

interface LeaderboardProps {
  onUserPress?: (userId: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onUserPress }) => {
  const theme = useTheme();
  const { user } = useAppSelector(state => state.auth);
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardEntry['category']>('overall');
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardEntry['period']>('weekly');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userRank, setUserRank] = useState<number>(-1);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedCategory, selectedPeriod]);

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      const data = await rewardSystem.getLeaderboard(selectedCategory, selectedPeriod, 50);
      setLeaderboardData(data);

      // Get user's rank if logged in
      if (user) {
        const rank = await rewardSystem.getUserRank(user.uid, selectedCategory, selectedPeriod);
        setUserRank(rank);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLeaderboard();
    setIsRefreshing(false);
  };

  const getCategoryIcon = (category: LeaderboardEntry['category']): string => {
    switch (category) {
      case 'predictions':
        return 'chart-line';
      case 'social':
        return 'account-group';
      case 'learning':
        return 'school';
      case 'performance':
        return 'trophy';
      case 'overall':
        return 'star';
      default:
        return 'star';
    }
  };

  const getCategoryColor = (category: LeaderboardEntry['category']): string => {
    switch (category) {
      case 'predictions':
        return '#4CAF50';
      case 'social':
        return '#2196F3';
      case 'learning':
        return '#9C27B0';
      case 'performance':
        return '#FF9800';
      case 'overall':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getRankIcon = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'trophy';
      case 2:
        return 'medal';
      case 3:
        return 'medal';
      default:
        return 'numeric-' + rank;
    }
  };

  const getRankColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return '#9E9E9E';
    }
  };

  const formatScore = (score: number, category: LeaderboardEntry['category']): string => {
    switch (category) {
      case 'predictions':
        return `${score.toFixed(1)}%`;
      case 'social':
        return score.toLocaleString();
      case 'learning':
        return `${score} modules`;
      case 'performance':
        return `${score.toFixed(2)}%`;
      case 'overall':
        return score.toLocaleString();
      default:
        return score.toString();
    }
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = user && item.userId === user.uid;
    
    return (
      <TouchableOpacity
        onPress={() => onUserPress?.(item.userId)}
        style={[
          styles.leaderboardItem,
          isCurrentUser && styles.currentUserItem,
        ]}
      >
        <View style={styles.rankContainer}>
          <View style={[
            styles.rankBadge,
            { backgroundColor: getRankColor(item.rank) }
          ]}>
            {item.rank <= 3 ? (
              <MaterialCommunityIcons
                name={getRankIcon(item.rank)}
                size={20}
                color="white"
              />
            ) : (
              <Text style={styles.rankText}>{item.rank}</Text>
            )}
          </View>
        </View>

        <View style={styles.userInfo}>
          <Avatar.Text
            size={40}
            label={item.userName.charAt(0).toUpperCase()}
            style={[
              styles.avatar,
              isCurrentUser && styles.currentUserAvatar,
            ]}
          />
          <View style={styles.userDetails}>
            <Text style={[
              styles.userName,
              isCurrentUser && styles.currentUserName,
            ]}>
              {item.userName}
              {isCurrentUser && ' (You)'}
            </Text>
            <View style={styles.userStats}>
              <Text style={styles.score}>
                {formatScore(item.score, item.category)}
              </Text>
              {item.badges > 0 && (
                <View style={styles.badgesContainer}>
                  <MaterialCommunityIcons
                    name="medal"
                    size={14}
                    color="#FFD700"
                  />
                  <Text style={styles.badgesCount}>{item.badges}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.achievementsContainer}>
          {item.achievements.slice(0, 3).map((achievement, idx) => (
            <Chip
              key={idx}
              mode="outlined"
              compact
              style={styles.achievementChip}
              textStyle={styles.achievementText}
            >
              {achievement}
            </Chip>
          ))}
          {item.achievements.length > 3 && (
            <Text style={styles.moreAchievements}>
              +{item.achievements.length - 3}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserRankCard = () => {
    if (!user || userRank === -1) return null;

    return (
      <Card style={[styles.userRankCard, { backgroundColor: theme.colors.primaryContainer }]}>
        <Card.Content>
          <View style={styles.userRankContent}>
            <Icon
              source="account-circle"
              size={24}
              color={theme.colors.onPrimaryContainer}
            />
            <View style={styles.userRankDetails}>
              <Text style={[styles.userRankTitle, { color: theme.colors.onPrimaryContainer }]}>
                Your Rank
              </Text>
              <Text style={[styles.userRankValue, { color: theme.colors.onPrimaryContainer }]}>
                #{userRank} in {selectedCategory} ({selectedPeriod})
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="trophy-outline"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurfaceVariant }]}>
        No Rankings Yet
      </Text>
      <Text style={[styles.emptyStateDescription, { color: theme.colors.onSurfaceVariant }]}>
        Start participating in competitions and challenges to appear on the leaderboard!
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon
            source="trophy"
            size={24}
            color={getCategoryColor(selectedCategory)}
          />
          <Title style={styles.title}>Leaderboard</Title>
        </View>
        <Chip
          mode="outlined"
          textStyle={{ color: getCategoryColor(selectedCategory) }}
          style={{ borderColor: getCategoryColor(selectedCategory) }}
        >
          {selectedCategory.toUpperCase()}
        </Chip>
      </View>

      {/* Category Selection */}
      <View style={styles.selectionContainer}>
        <SegmentedButtons
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as LeaderboardEntry['category'])}
          buttons={[
            { value: 'overall', label: 'Overall', icon: 'star' },
            { value: 'predictions', label: 'Predictions', icon: 'chart-line' },
            { value: 'social', label: 'Social', icon: 'account-group' },
            { value: 'learning', label: 'Learning', icon: 'school' },
            { value: 'performance', label: 'Performance', icon: 'trophy' },
          ]}
          style={styles.categoryButtons}
        />
      </View>

      {/* Period Selection */}
      <View style={styles.periodContainer}>
        <SegmentedButtons
          value={selectedPeriod}
          onValueChange={(value) => setSelectedPeriod(value as LeaderboardEntry['period'])}
          buttons={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'all_time', label: 'All Time' },
          ]}
          style={styles.periodButtons}
        />
      </View>

      {/* User Rank Card */}
      {renderUserRankCard()}

      {/* Leaderboard List */}
      <FlatList
        data={leaderboardData}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.userId}
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
      />
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
  selectionContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryButtons: {
    marginBottom: 8,
  },
  periodContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
  },
  periodButtons: {
    marginBottom: 8,
  },
  userRankCard: {
    margin: 16,
    elevation: 2,
  },
  userRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRankDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userRankTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  userRankValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  currentUserItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  rankContainer: {
    marginRight: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  currentUserAvatar: {
    backgroundColor: '#2196F3',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  currentUserName: {
    color: '#1976D2',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  score: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesCount: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 2,
    fontWeight: '600',
  },
  achievementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    maxWidth: 120,
  },
  achievementChip: {
    marginRight: 4,
    marginBottom: 4,
    height: 24,
  },
  achievementText: {
    fontSize: 10,
  },
  moreAchievements: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
});
