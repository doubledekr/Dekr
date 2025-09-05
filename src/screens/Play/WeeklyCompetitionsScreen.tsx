import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, Button, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CompetitionCard, CompetitionData } from '../../../components/social/CompetitionCard';

export function WeeklyCompetitionsScreen() {
  const theme = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', name: 'All', icon: 'view-grid' },
    { id: 'active', name: 'Active', icon: 'play-circle' },
    { id: 'upcoming', name: 'Upcoming', icon: 'clock-outline' },
    { id: 'completed', name: 'Completed', icon: 'check-circle' },
  ];

  const competitions: CompetitionData[] = [
    {
      id: '1',
      title: 'Weekly Stock Prediction Challenge',
      description: 'Predict the top 3 performing stocks for this week. Points awarded based on accuracy and timing.',
      type: 'prediction',
      status: 'active',
      prize: {
        type: 'points',
        value: '500 XP + Expert Badge',
        description: 'First place gets 500 XP and Expert Badge',
      },
      rules: [
        'Submit predictions before market open on Monday',
        'Predictions must be for stocks with market cap > $1B',
        'Points awarded based on accuracy and timing',
      ],
      participants: [
        {
          id: '1',
          name: 'Alex Thompson',
          avatar: 'AT',
          score: 1250,
          rank: 1,
          isCurrentUser: false,
        },
        {
          id: '2',
          name: 'Sarah Chen',
          avatar: 'SC',
          score: 1180,
          rank: 2,
          isCurrentUser: false,
        },
        {
          id: '3',
          name: 'You',
          avatar: 'YO',
          score: 950,
          rank: 4,
          isCurrentUser: true,
        },
      ],
      maxParticipants: 1000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-19'),
      currentUserEntry: {
        prediction: 'AAPL, TSLA, NVDA',
        score: 950,
        rank: 4,
      },
      leaderboard: [
        {
          id: '1',
          name: 'Alex Thompson',
          avatar: 'AT',
          score: 1250,
          rank: 1,
          isCurrentUser: false,
        },
        {
          id: '2',
          name: 'Sarah Chen',
          avatar: 'SC',
          score: 1180,
          rank: 2,
          isCurrentUser: false,
        },
        {
          id: '3',
          name: 'Mike Rodriguez',
          avatar: 'MR',
          score: 1100,
          rank: 3,
          isCurrentUser: false,
        },
        {
          id: '4',
          name: 'You',
          avatar: 'YO',
          score: 950,
          rank: 4,
          isCurrentUser: true,
        },
      ],
      isJoined: true,
      canJoin: true,
    },
    {
      id: '2',
      title: 'Strategy Building Tournament',
      description: 'Build and backtest the most profitable trading strategy. Winner gets featured in our strategy library.',
      type: 'tournament',
      status: 'upcoming',
      prize: {
        type: 'badge',
        value: 'Strategy Master Badge',
        description: 'Exclusive badge and strategy featured in library',
      },
      rules: [
        'Strategy must be original and not copied',
        'Backtest results must be verifiable',
        'Strategy must be profitable over 6-month period',
      ],
      participants: [],
      maxParticipants: 500,
      startDate: new Date('2024-01-22'),
      endDate: new Date('2024-02-22'),
      leaderboard: [],
      isJoined: false,
      canJoin: true,
    },
    {
      id: '3',
      title: 'Risk Management Challenge',
      description: 'Demonstrate your risk management skills in a simulated trading environment.',
      type: 'challenge',
      status: 'completed',
      prize: {
        type: 'points',
        value: '300 XP',
        description: 'Points awarded based on risk-adjusted returns',
      },
      rules: [
        'Maintain portfolio within risk limits',
        'Achieve positive returns while minimizing drawdown',
        'Complete all risk management modules',
      ],
      participants: [
        {
          id: '1',
          name: 'Emma Davis',
          avatar: 'ED',
          score: 1450,
          rank: 1,
          isCurrentUser: false,
        },
        {
          id: '2',
          name: 'You',
          avatar: 'YO',
          score: 1200,
          rank: 3,
          isCurrentUser: true,
        },
      ],
      maxParticipants: 200,
      startDate: new Date('2024-01-08'),
      endDate: new Date('2024-01-12'),
      currentUserEntry: {
        score: 1200,
        rank: 3,
      },
      leaderboard: [
        {
          id: '1',
          name: 'Emma Davis',
          avatar: 'ED',
          score: 1450,
          rank: 1,
          isCurrentUser: false,
        },
        {
          id: '2',
          name: 'David Kim',
          avatar: 'DK',
          score: 1300,
          rank: 2,
          isCurrentUser: false,
        },
        {
          id: '3',
          name: 'You',
          avatar: 'YO',
          score: 1200,
          rank: 3,
          isCurrentUser: true,
        },
      ],
      isJoined: true,
      canJoin: false,
    },
  ];

  const filteredCompetitions = competitions.filter(competition => {
    if (selectedFilter === 'all') return true;
    return competition.status === selectedFilter;
  });

  const handleJoin = (competitionId: string) => {
    console.log('Joining competition:', competitionId);
  };

  const handleLeave = (competitionId: string) => {
    console.log('Leaving competition:', competitionId);
  };

  const handleMakePrediction = (competitionId: string) => {
    console.log('Making prediction for competition:', competitionId);
  };

  const handleViewLeaderboard = (competitionId: string) => {
    console.log('Viewing leaderboard for competition:', competitionId);
  };

  const handleViewProfile = (userId: string) => {
    console.log('Viewing profile:', userId);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Weekly Competitions
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Compete with the community and win prizes
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  selectedFilter === filter.id && styles.filterChipActive,
                  { borderColor: theme.colors.outline }
                ]}
                onPress={() => setSelectedFilter(filter.id)}
              >
                <MaterialCommunityIcons 
                  name={filter.icon as any} 
                  size={20} 
                  color={selectedFilter === filter.id ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text style={[
                  styles.filterText,
                  { color: selectedFilter === filter.id ? theme.colors.primary : theme.colors.onSurfaceVariant }
                ]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Competition Stats */}
        <View style={styles.statsContainer}>
          <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.statsContent}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="trophy" size={24} color="#fbbf24" />
                <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>3</Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Wins</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="chart-line" size={24} color="#10b981" />
                <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>1,250</Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Total Points</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="account-group" size={24} color="#3b82f6" />
                <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>#4</Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>Current Rank</Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Competitions List */}
        <View style={styles.competitionsContainer}>
          {filteredCompetitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              data={competition}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onMakePrediction={handleMakePrediction}
              onViewLeaderboard={handleViewLeaderboard}
              onViewProfile={handleViewProfile}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActions}>
            <Button
              mode="contained"
              style={styles.quickActionButton}
              icon="plus"
            >
              Create Competition
            </Button>
            <Button
              mode="outlined"
              style={styles.quickActionButton}
              icon="calendar"
            >
              View Schedule
            </Button>
          </View>
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
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: '#e0f2fe',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statsCard: {
    borderRadius: 16,
    elevation: 2,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  competitionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
});
