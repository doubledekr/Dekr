import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, useTheme, Card, Button, Chip, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Stage } from '../../../types/education';
import { LessonCard as LessonCardType } from '../../../types/deck';

interface StageDeckBrowserProps {
  stages: Stage[];
  completedLessons: any[];
  onStageSelect?: (stage: Stage) => void;
}

export function StageDeckBrowser({ stages, completedLessons, onStageSelect }: StageDeckBrowserProps) {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const getStageProgress = (stage: Stage) => {
    const completedInStage = completedLessons.filter(lesson => 
      lesson.stageId === stage.id
    ).length;
    return (completedInStage / stage.lessons.length) * 100;
  };

  const isStageUnlocked = (stage: Stage) => {
    // All stages are now unlocked - users can learn freely
    return true;
  };

  const getDifficultyColor = (stageId: number) => {
    switch (stageId) {
      case 1: return '#10b981'; // Beginner - Green
      case 2: return '#f59e0b'; // Intermediate - Orange
      case 3: return '#ef4444'; // Advanced - Red
      default: return '#6b7280'; // Default - Gray
    }
  };

  const getDifficultyLabel = (stageId: number) => {
    switch (stageId) {
      case 1: return 'Beginner';
      case 2: return 'Intermediate';
      case 3: return 'Advanced';
      default: return 'Expert';
    }
  };

  const getDifficultyIcon = (stageId: number) => {
    switch (stageId) {
      case 1: return 'school';
      case 2: return 'chart-line';
      case 3: return 'trophy';
      default: return 'star';
    }
  };

  const handleStagePress = (stage: Stage) => {
    if (onStageSelect) {
      onStageSelect(stage);
    } else {
      router.push({
        pathname: '/StageDeckScreen',
        params: { stageId: stage.id.toString() }
      });
    }
  };

  const transformStageToDeck = (stage: Stage): LessonCardType[] => {
    return stage.lessons.map(lesson => ({
      id: `${stage.id}-${lesson.id}`,
      type: 'lesson',
      title: lesson.title,
      description: lesson.description,
      audioUrl: lesson.content.find(c => c.type === 'audio')?.audioUrl || '',
      duration: `${lesson.duration} min`,
      difficulty: getDifficultyLabel(stage.id).toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
      stage: lesson.id,
      courseId: stage.id.toString(),
      resources: lesson.content
        .filter(c => c.type === 'text')
        .map((c, index) => ({
          id: `${lesson.id}-resource-${index}`,
          type: 'article' as const,
          title: c.title || 'Lesson Content',
          url: '',
          description: c.content,
        })),
      quiz: lesson.content.find(c => c.type === 'multiple-choice') ? {
        id: `${lesson.id}-quiz`,
        question: lesson.content.find(c => c.type === 'multiple-choice')?.question?.questionText || '',
        options: lesson.content.find(c => c.type === 'multiple-choice')?.question?.options || [],
        correctAnswer: lesson.content.find(c => c.type === 'multiple-choice')?.question?.options?.indexOf(
          lesson.content.find(c => c.type === 'multiple-choice')?.question?.correctAnswer || ''
        ) || 0,
        explanation: lesson.content.find(c => c.type === 'multiple-choice')?.question?.explanation || '',
      } : undefined,
      completed: completedLessons.some(cl => cl.stageId === stage.id && cl.lessonId === lesson.id),
      xpReward: lesson.xpReward,
      thumbnailUrl: undefined,
    }));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Learning Path Decks
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Master financial concepts through structured learning decks
          </Text>
        </View>

        {/* Stage Decks */}
        <View style={styles.decksContainer}>
          {stages.map((stage) => {
            const progress = getStageProgress(stage);
            const isCompleted = progress === 100;
            const lessonCards = transformStageToDeck(stage);

            return (
              <TouchableOpacity
                key={stage.id}
                onPress={() => handleStagePress(stage)}
              >
                <Card style={[
                  styles.stageCard, 
                  { backgroundColor: theme.colors.surface }
                ]}>
                  <Card.Content style={styles.stageContent}>
                    {/* Header */}
                    <View style={styles.stageHeader}>
                      <View style={styles.stageInfo}>
                        <Text style={[
                          styles.stageTitle, 
                          { color: theme.colors.onSurface }
                        ]}>
                          {stage.title}
                        </Text>
                        <Text style={[
                          styles.stageDescription, 
                          { color: theme.colors.onSurfaceVariant }
                        ]}>
                          {stage.description}
                        </Text>
                      </View>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressInfo}>
                        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
                          {Math.round(progress)}% Complete
                        </Text>
                        <Text style={[styles.lessonCount, { color: theme.colors.onSurfaceVariant }]}>
                          {completedLessons.filter(l => l.stageId === stage.id).length} of {stage.lessons.length} lessons
                        </Text>
                      </View>
                      <ProgressBar 
                        progress={progress / 100} 
                        color={isCompleted ? '#10b981' : theme.colors.primary}
                        style={styles.progressBar}
                      />
                    </View>

                    {/* Meta Info */}
                    <View style={styles.metaContainer}>
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                          {stage.lessons.reduce((total, lesson) => total + lesson.duration, 0)} min total
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="cards" size={16} color={theme.colors.onSurfaceVariant} />
                        <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                          {stage.lessons.length} lessons
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
                        <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                          {stage.lessons.reduce((total, lesson) => total + lesson.xpReward, 0)} XP
                        </Text>
                      </View>
                      <Chip 
                        mode="outlined" 
                        compact
                        style={[styles.difficultyChip, { borderColor: getDifficultyColor(stage.id) }]}
                        textStyle={{ color: getDifficultyColor(stage.id) }}
                        icon={() => (
                          <MaterialCommunityIcons
                            name={getDifficultyIcon(stage.id)}
                            size={12}
                            color={getDifficultyColor(stage.id)}
                          />
                        )}
                      >
                        {getDifficultyLabel(stage.id)}
                      </Chip>
                    </View>

                    {/* Audio Content Indicator */}
                    <View style={styles.audioIndicator}>
                      <MaterialCommunityIcons name="headphones" size={16} color={theme.colors.primary} />
                      <Text style={[styles.audioText, { color: theme.colors.primary }]}>
                        {lessonCards.filter(card => card.audioUrl).length} lessons with audio
                      </Text>
                    </View>

                    {/* Action Button */}
                    <Button 
                      mode="contained" 
                      style={[
                        styles.startButton,
                        { backgroundColor: theme.colors.primary }
                      ]}
                      icon={isCompleted ? "check" : "play"}
                      onPress={() => handleStagePress(stage)}
                    >
                      {isCompleted ? 'Review Deck' : 'Start Learning Deck'}
                    </Button>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Empty State */}
        {stages.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="book-education-outline"
              size={80}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
              No learning decks available
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Learning content is being prepared
            </Text>
          </View>
        )}
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
    fontFamily: 'AustinNewsDeck-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Graphik-Regular',
  },
  decksContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  stageCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  stageContent: {
    padding: 16,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stageInfo: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  stageDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  lessonCount: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  difficultyChip: {
    marginLeft: 'auto',
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  audioText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  startButton: {
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
  },
});
