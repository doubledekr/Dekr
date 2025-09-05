import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, Button, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export function CompetitionPrepScreen() {
  const theme = useTheme();
  const [selectedCompetition, setSelectedCompetition] = useState('weekly');

  const competitions = [
    {
      id: 'weekly',
      name: 'Weekly Prediction Challenge',
      description: 'Predict the top 3 performing stocks for the week',
      startDate: '2024-01-15',
      endDate: '2024-01-19',
      participants: 1250,
      prize: '500 XP + Expert Badge',
      difficulty: 'Medium',
      status: 'upcoming',
    },
    {
      id: 'monthly',
      name: 'Monthly Strategy Tournament',
      description: 'Build and backtest the best trading strategy',
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      participants: 890,
      prize: '1000 XP + Strategy Master Badge',
      difficulty: 'Hard',
      status: 'upcoming',
    },
  ];

  const prepMaterials = [
    {
      id: '1',
      title: 'Technical Analysis Fundamentals',
      type: 'video',
      duration: '45 min',
      description: 'Learn the basics of chart patterns and indicators',
      progress: 0,
      isRequired: true,
    },
    {
      id: '2',
      title: 'Market Sentiment Analysis',
      type: 'article',
      duration: '20 min',
      description: 'Understand how to gauge market sentiment',
      progress: 0,
      isRequired: true,
    },
    {
      id: '3',
      title: 'Risk Management Strategies',
      type: 'interactive',
      duration: '30 min',
      description: 'Practice risk management techniques',
      progress: 0,
      isRequired: false,
    },
  ];

  const practiceChallenges = [
    {
      id: '1',
      title: 'Predict AAPL Movement',
      description: 'Predict if AAPL will go up or down in the next 24 hours',
      difficulty: 'Easy',
      reward: '50 XP',
      completed: false,
    },
    {
      id: '2',
      title: 'Identify Chart Pattern',
      description: 'Identify the chart pattern in the given example',
      difficulty: 'Medium',
      reward: '100 XP',
      completed: true,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#f59e0b';
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Competition Prep
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Prepare for upcoming competitions and tournaments
          </Text>
        </View>

        {/* Competition Selector */}
        <View style={styles.competitionSelector}>
          {competitions.map((competition) => (
            <TouchableOpacity
              key={competition.id}
              style={[
                styles.competitionTab,
                selectedCompetition === competition.id && styles.competitionTabActive,
                { borderColor: theme.colors.outline }
              ]}
              onPress={() => setSelectedCompetition(competition.id)}
            >
              <Text style={[
                styles.competitionTabText,
                { color: selectedCompetition === competition.id ? theme.colors.primary : theme.colors.onSurfaceVariant }
              ]}>
                {competition.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Competition Details */}
        {competitions
          .filter(c => c.id === selectedCompetition)
          .map((competition) => (
            <Card key={competition.id} style={[styles.competitionCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.competitionContent}>
                <View style={styles.competitionHeader}>
                  <Text style={[styles.competitionTitle, { color: theme.colors.onSurface }]}>
                    {competition.name}
                  </Text>
                  <Chip 
                    mode="filled" 
                    compact
                    style={[styles.statusChip, { backgroundColor: getStatusColor(competition.status) }]}
                    textStyle={styles.statusText}
                  >
                    {competition.status.toUpperCase()}
                  </Chip>
                </View>

                <Text style={[styles.competitionDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {competition.description}
                </Text>

                <View style={styles.competitionMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {competition.startDate} - {competition.endDate}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {competition.participants} participants
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="gift" size={16} color="#fbbf24" />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {competition.prize}
                    </Text>
                  </View>
                </View>

                <Chip 
                  mode="outlined" 
                  compact
                  style={[styles.difficultyChip, { borderColor: getDifficultyColor(competition.difficulty) }]}
                  textStyle={{ color: getDifficultyColor(competition.difficulty) }}
                >
                  {competition.difficulty} Difficulty
                </Chip>
              </Card.Content>
            </Card>
          ))}

        {/* Prep Materials */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Preparation Materials
          </Text>
          
          {prepMaterials.map((material) => (
            <Card key={material.id} style={[styles.materialCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.materialContent}>
                <View style={styles.materialHeader}>
                  <View style={styles.materialInfo}>
                    <View style={styles.materialTitleRow}>
                      <MaterialCommunityIcons 
                        name={material.type === 'video' ? 'play-circle' : material.type === 'article' ? 'file-document' : 'puzzle'} 
                        size={24} 
                        color={theme.colors.primary}
                      />
                      <Text style={[styles.materialTitle, { color: theme.colors.onSurface }]}>
                        {material.title}
                      </Text>
                      {material.isRequired && (
                        <Chip mode="outlined" compact textStyle={styles.requiredChip}>
                          Required
                        </Chip>
                      )}
                    </View>
                    <Text style={[styles.materialDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {material.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.materialMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {material.duration}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {material.progress === 0 ? 'Not Started' : `${material.progress}% Complete`}
                    </Text>
                  </View>
                </View>

                {material.progress > 0 && (
                  <ProgressBar 
                    progress={material.progress / 100} 
                    color={theme.colors.primary}
                    style={styles.progressBar}
                  />
                )}

                <Button 
                  mode={material.progress === 0 ? "contained" : "outlined"}
                  style={styles.startButton}
                  icon={material.progress === 0 ? "play" : "refresh"}
                >
                  {material.progress === 0 ? 'Start' : 'Continue'}
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Practice Challenges */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Practice Challenges
          </Text>
          
          {practiceChallenges.map((challenge) => (
            <Card key={challenge.id} style={[styles.challengeCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.challengeContent}>
                <View style={styles.challengeHeader}>
                  <View style={styles.challengeInfo}>
                    <Text style={[styles.challengeTitle, { color: theme.colors.onSurface }]}>
                      {challenge.title}
                    </Text>
                    <Text style={[styles.challengeDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {challenge.description}
                    </Text>
                  </View>
                  {challenge.completed && (
                    <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
                  )}
                </View>

                <View style={styles.challengeMeta}>
                  <Chip 
                    mode="outlined" 
                    compact
                    style={[styles.difficultyChip, { borderColor: getDifficultyColor(challenge.difficulty) }]}
                    textStyle={{ color: getDifficultyColor(challenge.difficulty) }}
                  >
                    {challenge.difficulty}
                  </Chip>
                  <View style={styles.rewardItem}>
                    <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
                    <Text style={[styles.rewardText, { color: theme.colors.onSurfaceVariant }]}>
                      {challenge.reward}
                    </Text>
                  </View>
                </View>

                <Button 
                  mode={challenge.completed ? "outlined" : "contained"}
                  style={styles.challengeButton}
                  icon={challenge.completed ? "check" : "play"}
                >
                  {challenge.completed ? 'Completed' : 'Start Challenge'}
                </Button>
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
  competitionSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  competitionTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  competitionTabActive: {
    backgroundColor: '#e0f2fe',
  },
  competitionTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  competitionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
  },
  competitionContent: {
    padding: 16,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  competitionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  competitionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  competitionMeta: {
    marginBottom: 12,
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
  difficultyChip: {
    alignSelf: 'flex-start',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  materialCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  materialContent: {
    padding: 16,
  },
  materialHeader: {
    marginBottom: 12,
  },
  materialInfo: {
    flex: 1,
  },
  materialTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  materialTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  requiredChip: {
    fontSize: 10,
  },
  materialDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  materialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#2563eb',
  },
  challengeCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  challengeContent: {
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
  },
  challengeButton: {
    backgroundColor: '#10b981',
  },
});
