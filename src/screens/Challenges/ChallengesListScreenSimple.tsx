import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card, Button, Chip, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Mock data for demonstration
const mockChallenges = [
  {
    id: '1',
    title: 'Weekly Stock Prediction',
    description: 'Predict the top 3 performing stocks for this week',
    type: 'prediction',
    status: 'active',
    participants: 1250,
    prize: '500 XP + Expert Badge',
    endDate: '2024-01-19',
    difficulty: 'Medium',
    isJoined: true,
  },
  {
    id: '2',
    title: 'Risk Management Master',
    description: 'Demonstrate your risk management skills in simulated trading',
    type: 'skill',
    status: 'upcoming',
    participants: 890,
    prize: '300 XP + Risk Manager Badge',
    endDate: '2024-01-22',
    difficulty: 'Hard',
    isJoined: false,
  },
  {
    id: '3',
    title: 'Technical Analysis Expert',
    description: 'Identify chart patterns and technical indicators accurately',
    type: 'knowledge',
    status: 'completed',
    participants: 650,
    prize: '200 XP + Analyst Badge',
    endDate: '2024-01-12',
    difficulty: 'Easy',
    isJoined: true,
  },
];

export const ChallengesListScreen: React.FC = () => {
  const theme = useTheme();
  const [challenges] = useState(mockChallenges);
  const [loading] = useState(false);

  const handleJoinChallenge = (challengeId: string) => {
    console.log('Join challenge:', challengeId);
  };

  const handleViewChallenge = (challengeId: string) => {
    console.log('View challenge:', challengeId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'upcoming': return '#f59e0b';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderChallenge = ({ item }: { item: any }) => (
    <Card style={[styles.challengeCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.challengeContent}>
        <View style={styles.challengeHeader}>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeTitle, { color: theme.colors.onSurface }]}>
              {item.title}
            </Text>
            <Text style={[styles.challengeDescription, { color: theme.colors.onSurfaceVariant }]}>
              {item.description}
            </Text>
          </View>
          <Chip 
            mode="filled" 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>

        <View style={styles.challengeMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
              {item.participants} participants
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="gift" size={16} color="#fbbf24" />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
              {item.prize}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
              Ends {item.endDate}
            </Text>
          </View>
        </View>

        <View style={styles.challengeFooter}>
          <Chip 
            mode="outlined" 
            compact
            style={[styles.difficultyChip, { borderColor: getDifficultyColor(item.difficulty) }]}
            textStyle={{ color: getDifficultyColor(item.difficulty) }}
          >
            {item.difficulty}
          </Chip>
          
          <View style={styles.challengeActions}>
            {item.status === 'active' && !item.isJoined && (
              <Button
                mode="contained"
                onPress={() => handleJoinChallenge(item.id)}
                style={styles.joinButton}
                icon="plus"
              >
                Join
              </Button>
            )}
            {item.isJoined && (
              <Button
                mode="outlined"
                onPress={() => handleViewChallenge(item.id)}
                style={styles.viewButton}
                icon="eye"
              >
                View
              </Button>
            )}
            {item.status === 'completed' && (
              <Button
                mode="outlined"
                onPress={() => handleViewChallenge(item.id)}
                style={styles.resultsButton}
                icon="trophy"
              >
                Results
              </Button>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading challenges...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Challenges
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Compete with the community and test your skills
        </Text>
      </View>

      {/* Challenges List */}
      <FlatList
        data={challenges}
        renderItem={renderChallenge}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  challengeCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  challengeContent: {
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  challengeMeta: {
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyChip: {
    marginRight: 8,
  },
  challengeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  joinButton: {
    backgroundColor: '#10b981',
  },
  viewButton: {
    borderColor: '#3b82f6',
  },
  resultsButton: {
    borderColor: '#fbbf24',
  },
});
