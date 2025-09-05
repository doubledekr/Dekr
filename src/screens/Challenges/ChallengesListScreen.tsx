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
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useChallenges } from '../../hooks/useChallenges';
import { Challenge } from '../../types/firestore';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { router } from 'expo-router';

type TabType = 'active' | 'joined' | 'completed' | 'leaderboard';

interface ChallengeCardProps {
  challenge: Challenge;
  onPress: (challenge: Challenge) => void;
  currentUserId: string;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  onPress,
  currentUserId,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'completed': return '#9E9E9E';
      case 'cancelled': return '#F44336';
      default: return mutedColor;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'direction': return 'trending-up';
      case 'price': return 'target';
      default: return 'help-circle';
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const formatPrize = (prize: number) => {
    if (prize === 0) return 'Free';
    return `$${prize.toFixed(2)}`;
  };

  const isCreator = challenge.creatorId === currentUserId;
  const isParticipant = challenge.participants.some(p => p.userId === currentUserId);

  return (
    <TouchableOpacity
      style={[styles.challengeCard, { backgroundColor }]}
      onPress={() => onPress(challenge)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.challengeInfo}>
          <View style={styles.titleRow}>
            <MaterialCommunityIcons
              name={getTypeIcon(challenge.type)}
              size={20}
              color={tintColor}
            />
            <Text style={[styles.challengeTitle, { color: textColor }]} numberOfLines={1}>
              {challenge.title}
            </Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(challenge.status) }
                ]}
              >
                <Text style={styles.statusText}>
                  {challenge.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.challengeDetails}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="chart-line" size={16} color={mutedColor} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {challenge.symbol}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="account-group" size={16} color={mutedColor} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {challenge.participants.length}/{challenge.maxParticipants || '∞'}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="trophy" size={16} color={mutedColor} />
              <Text style={[styles.detailText, { color: textColor }]}>
                {formatPrize(challenge.prizeAmount)}
              </Text>
            </View>
          </View>
          
          <View style={styles.challengeMeta}>
            <Text style={[styles.timeRemaining, { color: mutedColor }]}>
              {formatTimeRemaining(challenge.endDate)}
            </Text>
            
            <View style={styles.userBadges}>
              {isCreator && (
                <View style={[styles.userBadge, { backgroundColor: tintColor + '20' }]}>
                  <Text style={[styles.userBadgeText, { color: tintColor }]}>Creator</Text>
                </View>
              )}
              {isParticipant && !isCreator && (
                <View style={[styles.userBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                  <Text style={[styles.userBadgeText, { color: '#4CAF50' }]}>Joined</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const ChallengesListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  // Hooks
  const { 
    challenges, 
    loading, 
    refetch, 
    leaderboard,
    currentUserId 
  } = useChallenges(activeTab);

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

  const handleCreateChallenge = useCallback(() => {
    navigation.navigate('CreateChallenge');
  }, [navigation]);

  const handleChallengePress = useCallback((challenge: Challenge) => {
    // Navigate to the new challenge deck screen
    router.push({
      pathname: '/ChallengeDeckScreen',
      params: { challengeId: challenge.id }
    });
  }, []);

  const renderTabButton = (tab: TabType, label: string, icon: string, count?: number) => (
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
        {count !== undefined && count > 0 && (
          <View style={[styles.tabBadge, { backgroundColor: tintColor }]}>
            <Text style={styles.tabBadgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderChallengeItem = ({ item }: { item: Challenge }) => (
    <ChallengeCard
      challenge={item}
      onPress={handleChallengePress}
      currentUserId={currentUserId || ''}
    />
  );

  const renderLeaderboardItem = ({ item, index }: { item: any; index: number }) => (
    <View style={[styles.leaderboardItem, { backgroundColor }]}>
      <View style={styles.rankContainer}>
        <View style={[
          styles.rankBadge,
          { backgroundColor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : mutedColor }
        ]}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
      </View>
      
      <View style={styles.leaderboardInfo}>
        <Text style={[styles.leaderboardName, { color: textColor }]}>
          {item.displayName || 'Anonymous'}
        </Text>
        <Text style={[styles.leaderboardStats, { color: mutedColor }]}>
          {item.challengesWon} wins • {item.totalChallenges} challenges
        </Text>
      </View>
      
      <View style={styles.leaderboardScore}>
        <Text style={[styles.scoreValue, { color: tintColor }]}>
          {item.score}
        </Text>
        <Text style={[styles.scoreLabel, { color: mutedColor }]}>
          points
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    let icon, title, message, actionText;
    
    switch (activeTab) {
      case 'active':
        icon = 'trophy';
        title = 'No Active Challenges';
        message = 'Create or join challenges to compete with friends';
        actionText = 'Create Challenge';
        break;
      case 'joined':
        icon = 'account-group';
        title = 'No Joined Challenges';
        message = 'Challenges you\'ve joined will appear here';
        break;
      case 'completed':
        icon = 'check-circle';
        title = 'No Completed Challenges';
        message = 'Your challenge history will appear here';
        break;
      case 'leaderboard':
        icon = 'podium';
        title = 'No Leaderboard Data';
        message = 'Complete challenges to see rankings';
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
            onPress={handleCreateChallenge}
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
      title: 'Challenges',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleCreateChallenge}
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
        <Text style={[styles.title, { color: textColor }]}>Challenges</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>
          Compete with friends on price predictions
        </Text>
      </View>

      <View style={styles.tabs}>
        {renderTabButton('active', 'Active', 'trophy')}
        {renderTabButton('joined', 'Joined', 'account-group')}
        {renderTabButton('completed', 'Completed', 'check-circle')}
        {renderTabButton('leaderboard', 'Leaderboard', 'podium')}
      </View>

      {loading && (activeTab !== 'leaderboard' ? challenges.length === 0 : !leaderboard) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading challenges...
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'leaderboard' ? leaderboard : challenges}
          keyExtractor={(item) => activeTab === 'leaderboard' ? item.userId : item.id}
          renderItem={activeTab === 'leaderboard' ? renderLeaderboardItem : renderChallengeItem}
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
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
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
  challengeCard: {
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
    marginBottom: 0,
  },
  challengeInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  challengeTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  challengeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
  },
  challengeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRemaining: {
    fontSize: 14,
    fontWeight: '500',
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  userBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  leaderboardStats: {
    fontSize: 14,
  },
  leaderboardScore: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
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
