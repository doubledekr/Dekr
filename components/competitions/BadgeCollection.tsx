import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
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
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { UserBadge, Badge } from '../../services/RewardSystem';
import { rewardSystem } from '../../services/RewardSystem';
import { useAppSelector } from '../../store/hooks';

interface BadgeCollectionProps {
  userId?: string; // If not provided, shows current user's badges
  onBadgePress?: (badge: UserBadge) => void;
}

const { width } = Dimensions.get('window');

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  userId,
  onBadgePress,
}) => {
  const theme = useTheme();
  const { user } = useAppSelector(state => state.auth);
  
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Badge['category'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const targetUserId = userId || user?.uid;

  useEffect(() => {
    if (targetUserId) {
      loadUserBadges();
    }
  }, [targetUserId, selectedCategory]);

  const loadUserBadges = async () => {
    if (!targetUserId) return;

    try {
      setIsLoading(true);
      const badges = await rewardSystem.getUserBadges(targetUserId);
      
      // Filter by category if not 'all'
      const filteredBadges = selectedCategory === 'all' 
        ? badges 
        : badges.filter(badge => badge.badge.category === selectedCategory);
      
      setUserBadges(filteredBadges);
    } catch (error) {
      console.error('Error loading user badges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: Badge['category']): string => {
    switch (category) {
      case 'prediction':
        return 'chart-line';
      case 'social':
        return 'account-group';
      case 'learning':
        return 'school';
      case 'performance':
        return 'trophy';
      case 'challenge':
        return 'medal';
      default:
        return 'star';
    }
  };

  const getCategoryColor = (category: Badge['category']): string => {
    switch (category) {
      case 'prediction':
        return '#4CAF50';
      case 'social':
        return '#2196F3';
      case 'learning':
        return '#9C27B0';
      case 'performance':
        return '#FF9800';
      case 'challenge':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getRarityColor = (rarity: Badge['rarity']): string => {
    switch (rarity) {
      case 'common':
        return '#9E9E9E';
      case 'rare':
        return '#2196F3';
      case 'epic':
        return '#9C27B0';
      case 'legendary':
        return '#FFD700';
      default:
        return '#9E9E9E';
    }
  };

  const getRarityIcon = (rarity: Badge['rarity']): string => {
    switch (rarity) {
      case 'common':
        return 'circle';
      case 'rare':
        return 'circle-outline';
      case 'epic':
        return 'hexagon';
      case 'legendary':
        return 'star';
      default:
        return 'circle';
    }
  };

  const formatEarnedDate = (timestamp: any): string => {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleBadgePress = (badge: UserBadge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
    onBadgePress?.(badge);
  };

  const renderBadgeItem = ({ item }: { item: UserBadge }) => {
    const { badge } = item;
    
    return (
      <TouchableOpacity
        onPress={() => handleBadgePress(item)}
        style={styles.badgeItem}
      >
        <Card style={[
          styles.badgeCard,
          { borderColor: getRarityColor(badge.rarity) }
        ]}>
          <Card.Content style={styles.badgeContent}>
            {/* Badge Icon */}
            <View style={[
              styles.badgeIconContainer,
              { backgroundColor: getCategoryColor(badge.category) }
            ]}>
              <MaterialCommunityIcons
                name={badge.icon as any}
                size={32}
                color="white"
              />
            </View>

            {/* Rarity Indicator */}
            <View style={[
              styles.rarityIndicator,
              { backgroundColor: getRarityColor(badge.rarity) }
            ]}>
              <MaterialCommunityIcons
                name={getRarityIcon(badge.rarity) as any}
                size={12}
                color="white"
              />
            </View>

            {/* Badge Info */}
            <View style={styles.badgeInfo}>
              <Text style={styles.badgeName} numberOfLines={2}>
                {badge.name}
              </Text>
              <Text style={styles.badgeCategory}>
                {badge.category.toUpperCase()}
              </Text>
              <Text style={styles.earnedDate}>
                Earned {formatEarnedDate(item.earnedAt)}
              </Text>
            </View>

            {/* Points Reward */}
            <View style={styles.pointsContainer}>
              <MaterialCommunityIcons
                name="star"
                size={16}
                color="#FFD700"
              />
              <Text style={styles.pointsText}>
                {badge.pointsReward}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderBadgeModal = () => {
    if (!selectedBadge) return null;

    const { badge } = selectedBadge;

    return (
      <Modal
        visible={showBadgeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBadgeModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Title style={styles.modalTitle}>Badge Details</Title>
            <Button
              mode="text"
              onPress={() => setShowBadgeModal(false)}
              icon="close"
            >
              Close
            </Button>
          </View>

          <View style={styles.modalContent}>
            {/* Badge Display */}
            <View style={styles.badgeDisplay}>
              <View style={[
                styles.largeBadgeIcon,
                { backgroundColor: getCategoryColor(badge.category) }
              ]}>
                <MaterialCommunityIcons
                  name={badge.icon as any}
                  size={64}
                  color="white"
                />
              </View>
              
              <View style={[
                styles.largeRarityIndicator,
                { backgroundColor: getRarityColor(badge.rarity) }
              ]}>
                <MaterialCommunityIcons
                  name={getRarityIcon(badge.rarity) as any}
                  size={20}
                  color="white"
                />
              </View>
            </View>

            {/* Badge Information */}
            <View style={styles.badgeDetails}>
              <Text style={styles.badgeTitle}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>
              
              <View style={styles.badgeMeta}>
                <Chip
                  mode="outlined"
                  style={{ borderColor: getCategoryColor(badge.category) }}
                  textStyle={{ color: getCategoryColor(badge.category) }}
                >
                  {badge.category.toUpperCase()}
                </Chip>
                
                <Chip
                  mode="outlined"
                  style={{ borderColor: getRarityColor(badge.rarity) }}
                  textStyle={{ color: getRarityColor(badge.rarity) }}
                >
                  {badge.rarity.toUpperCase()}
                </Chip>
              </View>

              {/* Requirements */}
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Requirements</Text>
                <Text style={styles.requirementsText}>
                  {badge.requirements.description}
                </Text>
              </View>

              {/* Earned Information */}
              <View style={styles.earnedInfo}>
                <Text style={styles.earnedTitle}>Earned</Text>
                <Text style={styles.earnedDate}>
                  {formatEarnedDate(selectedBadge.earnedAt)}
                </Text>
                <Text style={styles.pointsEarned}>
                  +{badge.pointsReward} points
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="medal-outline"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurfaceVariant }]}>
        No Badges Yet
      </Text>
      <Text style={[styles.emptyStateDescription, { color: theme.colors.onSurfaceVariant }]}>
        Start participating in competitions and challenges to earn your first badge!
      </Text>
    </View>
  );

  const getCategoryStats = () => {
    const stats = {
      prediction: 0,
      social: 0,
      learning: 0,
      performance: 0,
      challenge: 0,
    };

    userBadges.forEach(badge => {
      stats[badge.badge.category]++;
    });

    return stats;
  };

  const categoryStats = getCategoryStats();
  const totalBadges = userBadges.length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading badges...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon source="medal" size={24} color={theme.colors.primary} />
          <Title style={styles.title}>Badge Collection</Title>
        </View>
        <Text style={styles.badgeCount}>{totalBadges} badges</Text>
      </View>

      {/* Category Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {Object.entries(categoryStats).map(([category, count]) => (
            <View key={category} style={styles.statItem}>
              <MaterialCommunityIcons
                name={getCategoryIcon(category as Badge['category'])}
                size={20}
                color={getCategoryColor(category as Badge['category'])}
              />
              <Text style={styles.statCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Category Filter */}
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={selectedCategory}
          onValueChange={(value) => setSelectedCategory(value as Badge['category'] | 'all')}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'prediction', label: 'Predictions', icon: 'chart-line' },
            { value: 'social', label: 'Social', icon: 'account-group' },
            { value: 'learning', label: 'Learning', icon: 'school' },
            { value: 'performance', label: 'Performance', icon: 'trophy' },
            { value: 'challenge', label: 'Challenges', icon: 'medal' },
          ]}
          style={styles.filterButtons}
        />
      </View>

      {/* Badges Grid */}
      <FlatList
        data={userBadges}
        renderItem={renderBadgeItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.badgesGrid}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Badge Detail Modal */}
      {renderBadgeModal()}
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
  badgeCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
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
  filterContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  filterButtons: {
    marginBottom: 8,
  },
  badgesGrid: {
    padding: 16,
  },
  badgeItem: {
    flex: 1,
    margin: 4,
  },
  badgeCard: {
    borderWidth: 2,
    elevation: 2,
  },
  badgeContent: {
    padding: 12,
    position: 'relative',
  },
  badgeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  rarityIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  badgeCategory: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  earnedDate: {
    fontSize: 10,
    color: '#999',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  badgeDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  largeBadgeIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeRarityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDetails: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  badgeDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    color: '#666',
  },
  badgeMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  requirementsContainer: {
    marginBottom: 24,
  },
  requirementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  requirementsText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  earnedInfo: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  earnedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  earnedDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  pointsEarned: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
});
