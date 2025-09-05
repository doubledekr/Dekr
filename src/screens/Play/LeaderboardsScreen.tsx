import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, SegmentedButtons } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export function LeaderboardsScreen() {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');

  const periods = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'all-time', label: 'All Time' },
  ];

  const leaderboardData = [
    {
      rank: 1,
      user: {
        id: '1',
        name: 'Alex Thompson',
        avatar: 'AT',
        reputation: 2500,
        badges: ['Expert', 'Strategy Master'],
      },
      score: 1250,
      change: '+150',
      isCurrentUser: false,
    },
    {
      rank: 2,
      user: {
        id: '2',
        name: 'Sarah Chen',
        avatar: 'SC',
        reputation: 2200,
        badges: ['Expert', 'Risk Manager'],
      },
      score: 1180,
      change: '+120',
      isCurrentUser: false,
    },
    {
      rank: 3,
      user: {
        id: '3',
        name: 'Mike Rodriguez',
        avatar: 'MR',
        reputation: 2100,
        badges: ['Expert'],
      },
      score: 1100,
      change: '+80',
      isCurrentUser: false,
    },
    {
      rank: 4,
      user: {
        id: '4',
        name: 'You',
        avatar: 'YO',
        reputation: 1800,
        badges: ['Rising Star'],
      },
      score: 950,
      change: '+200',
      isCurrentUser: true,
    },
    {
      rank: 5,
      user: {
        id: '5',
        name: 'Emma Davis',
        avatar: 'ED',
        reputation: 1750,
        badges: ['Analyst'],
      },
      score: 920,
      change: '+50',
      isCurrentUser: false,
    },
  ];

  const categories = [
    {
      id: 'overall',
      name: 'Overall',
      icon: 'trophy',
      description: 'Total performance across all activities',
    },
    {
      id: 'predictions',
      name: 'Predictions',
      icon: 'crystal-ball',
      description: 'Accuracy in market predictions',
    },
    {
      id: 'strategies',
      name: 'Strategies',
      icon: 'chart-line',
      description: 'Strategy building and backtesting',
    },
    {
      id: 'social',
      name: 'Social',
      icon: 'account-group',
      description: 'Community engagement and contributions',
    },
  ];

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#fbbf24';
      case 2: return '#c0c0c0';
      case 3: return '#cd7f32';
      default: return theme.colors.onSurfaceVariant;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return 'trophy';
    return 'numeric-' + rank;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Leaderboards
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            See how you rank against the community
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={periods}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
              >
                <MaterialCommunityIcons 
                  name={category.icon as any} 
                  size={24} 
                  color={theme.colors.primary}
                />
                <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                  {category.name}
                </Text>
                <Text style={[styles.categoryDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {category.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Top 3 Podium */}
        <View style={styles.podiumSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Top Performers
          </Text>
          
          <View style={styles.podium}>
            {/* 2nd Place */}
            {leaderboardData[1] && (
              <View style={[styles.podiumItem, styles.secondPlace]}>
                <View style={styles.podiumRank}>
                  <MaterialCommunityIcons name="trophy" size={24} color="#c0c0c0" />
                  <Text style={[styles.podiumRankText, { color: '#c0c0c0' }]}>2</Text>
                </View>
                <Avatar.Text 
                  size={60} 
                  label={leaderboardData[1].user.avatar} 
                  style={styles.podiumAvatar}
                />
                <Text style={[styles.podiumName, { color: theme.colors.onSurface }]}>
                  {leaderboardData[1].user.name}
                </Text>
                <Text style={[styles.podiumScore, { color: theme.colors.onSurfaceVariant }]}>
                  {leaderboardData[1].score} pts
                </Text>
              </View>
            )}

            {/* 1st Place */}
            {leaderboardData[0] && (
              <View style={[styles.podiumItem, styles.firstPlace]}>
                <View style={styles.podiumRank}>
                  <MaterialCommunityIcons name="trophy" size={32} color="#fbbf24" />
                  <Text style={[styles.podiumRankText, { color: '#fbbf24' }]}>1</Text>
                </View>
                <Avatar.Text 
                  size={80} 
                  label={leaderboardData[0].user.avatar} 
                  style={[styles.podiumAvatar, styles.championAvatar]}
                />
                <Text style={[styles.podiumName, { color: theme.colors.onSurface }]}>
                  {leaderboardData[0].user.name}
                </Text>
                <Text style={[styles.podiumScore, { color: theme.colors.onSurfaceVariant }]}>
                  {leaderboardData[0].score} pts
                </Text>
              </View>
            )}

            {/* 3rd Place */}
            {leaderboardData[2] && (
              <View style={[styles.podiumItem, styles.thirdPlace]}>
                <View style={styles.podiumRank}>
                  <MaterialCommunityIcons name="trophy" size={24} color="#cd7f32" />
                  <Text style={[styles.podiumRankText, { color: '#cd7f32' }]}>3</Text>
                </View>
                <Avatar.Text 
                  size={60} 
                  label={leaderboardData[2].user.avatar} 
                  style={styles.podiumAvatar}
                />
                <Text style={[styles.podiumName, { color: theme.colors.onSurface }]}>
                  {leaderboardData[2].user.name}
                </Text>
                <Text style={[styles.podiumScore, { color: theme.colors.onSurfaceVariant }]}>
                  {leaderboardData[2].score} pts
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Full Leaderboard */}
        <View style={styles.leaderboardSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Full Leaderboard
          </Text>
          
          {leaderboardData.map((item) => (
            <Card 
              key={item.user.id} 
              style={[
                styles.leaderboardCard, 
                { backgroundColor: theme.colors.surface },
                item.isCurrentUser && styles.currentUserCard
              ]}
            >
              <Card.Content style={styles.leaderboardContent}>
                <View style={styles.rankSection}>
                  <View style={styles.rankContainer}>
                    <MaterialCommunityIcons 
                      name={getRankIcon(item.rank) as any} 
                      size={24} 
                      color={getRankColor(item.rank)}
                    />
                    <Text style={[styles.rankText, { color: getRankColor(item.rank) }]}>
                      #{item.rank}
                    </Text>
                  </View>
                </View>

                <View style={styles.userSection}>
                  <Avatar.Text 
                    size={48} 
                    label={item.user.avatar} 
                    style={[
                      styles.userAvatar,
                      item.isCurrentUser && styles.currentUserAvatar
                    ]}
                  />
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={[
                        styles.userName, 
                        { color: item.isCurrentUser ? theme.colors.primary : theme.colors.onSurface }
                      ]}>
                        {item.user.name}
                      </Text>
                      {item.isCurrentUser && (
                        <Chip mode="outlined" compact textStyle={styles.currentUserChip}>
                          You
                        </Chip>
                      )}
                    </View>
                    <View style={styles.userMeta}>
                      <Text style={[styles.userReputation, { color: theme.colors.onSurfaceVariant }]}>
                        {item.user.reputation} reputation
                      </Text>
                      <View style={styles.badgesContainer}>
                        {item.user.badges.slice(0, 2).map((badge, index) => (
                          <Chip key={index} mode="outlined" compact textStyle={styles.badgeText}>
                            {badge}
                          </Chip>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.scoreSection}>
                  <Text style={[styles.score, { color: theme.colors.onSurface }]}>
                    {item.score}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: theme.colors.onSurfaceVariant }]}>
                    points
                  </Text>
                  <View style={styles.changeContainer}>
                    <MaterialCommunityIcons 
                      name="trending-up" 
                      size={16} 
                      color="#10b981"
                    />
                    <Text style={[styles.change, { color: '#10b981' }]}>
                      {item.change}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  periodSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoryCard: {
    width: 120,
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  podiumSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 200,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  firstPlace: {
    order: 2,
  },
  secondPlace: {
    order: 1,
  },
  thirdPlace: {
    order: 3,
  },
  podiumRank: {
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumRankText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  podiumAvatar: {
    marginBottom: 8,
  },
  championAvatar: {
    borderWidth: 3,
    borderColor: '#fbbf24',
  },
  podiumName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumScore: {
    fontSize: 12,
  },
  leaderboardSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  leaderboardCard: {
    marginBottom: 8,
    borderRadius: 12,
    elevation: 1,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  leaderboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rankSection: {
    marginRight: 16,
  },
  rankContainer: {
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  userSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    marginRight: 12,
  },
  currentUserAvatar: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  currentUserChip: {
    fontSize: 10,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userReputation: {
    fontSize: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
  },
  scoreSection: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  change: {
    fontSize: 12,
    fontWeight: '500',
  },
});
