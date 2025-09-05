import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, router } from 'expo-router';
import { LessonDeck } from '../../../components/deck';
import { LessonCard, DeckProgress } from '../../../types/deck';
import { Stage } from '../../../types/education';
import { useEducation } from '../../../contexts/EducationContext';

export function StageDeckScreen() {
  const theme = useTheme();
  const { stageId } = useLocalSearchParams<{ stageId: string }>();
  const { stages, user, addCompletedLesson } = useEducation();
  const [stage, setStage] = useState<Stage | null>(null);
  const [lessonCards, setLessonCards] = useState<LessonCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);

  // Load stage data
  useEffect(() => {
    if (stageId) {
      loadStageData();
      loadDeckProgress();
    }
  }, [stageId, stages]);

  const loadStageData = async () => {
    if (!stageId || !stages.length) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const foundStage = stages.find(s => s.id === parseInt(stageId));
      if (!foundStage) {
        throw new Error('Stage not found');
      }

      setStage(foundStage);

      // Transform stage lessons to lesson cards
      const cards: LessonCard[] = foundStage.lessons.map(lesson => {
        const audioContent = lesson.content.find(c => c.type === 'audio');
        const quizContent = lesson.content.find(c => c.type === 'multiple-choice');
        
        return {
          id: `${foundStage.id}-${lesson.id}`,
          type: 'lesson',
          title: lesson.title,
          description: lesson.description,
          audioUrl: audioContent?.audioUrl || '',
          duration: `${lesson.duration} min`,
          difficulty: getDifficultyLabel(foundStage.id).toLowerCase() as 'beginner' | 'intermediate' | 'advanced',
          stage: lesson.id,
          courseId: foundStage.id.toString(),
          resources: lesson.content
            .filter(c => c.type === 'text')
            .map((c, index) => ({
              id: `${lesson.id}-resource-${index}`,
              type: 'article' as const,
              title: c.title || 'Lesson Content',
              url: '',
              description: c.content,
            })),
          quiz: quizContent ? {
            id: `${lesson.id}-quiz`,
            question: quizContent.question?.questionText || '',
            options: quizContent.question?.options || [],
            correctAnswer: quizContent.question?.options?.indexOf(
              quizContent.question?.correctAnswer || ''
            ) || 0,
            explanation: quizContent.question?.explanation || '',
          } : undefined,
          completed: user.completedLessons.some(cl => cl.stageId === foundStage.id && cl.lessonId === lesson.id),
          xpReward: lesson.xpReward,
          thumbnailUrl: undefined,
        };
      });

      setLessonCards(cards);
    } catch (error) {
      console.error('Error loading stage data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load stage');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeckProgress = async () => {
    if (!stageId) return;

    try {
      const completedInStage = user.completedLessons.filter(lesson => 
        lesson.stageId === parseInt(stageId)
      );
      
      setDeckProgress({
        deckId: stageId,
        completedCards: completedInStage.map(l => `${stageId}-${l.lessonId}`),
        totalCards: stage?.lessons.length || 0,
        currentIndex: completedInStage.length,
        lastAccessed: new Date(),
        timeSpent: 0,
      });
    } catch (error) {
      console.error('Error loading deck progress:', error);
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

  const handleCardComplete = useCallback((cardId: string) => {
    if (!stage) return;

    // Extract lesson ID from card ID (format: "stageId-lessonId")
    const lessonId = parseInt(cardId.split('-')[1]);
    
    // Add to completed lessons
    addCompletedLesson({
      stageId: stage.id,
      lessonId: lessonId,
      completedAt: new Date(),
      xpEarned: stage.lessons.find(l => l.id === lessonId)?.xpReward || 0,
    });

    // Update deck progress
    if (deckProgress) {
      const updatedProgress: DeckProgress = {
        ...deckProgress,
        completedCards: [...deckProgress.completedCards, cardId],
        lastAccessed: new Date(),
      };
      setDeckProgress(updatedProgress);
    }
  }, [stage, addCompletedLesson, deckProgress]);

  const handleDeckComplete = useCallback((deckId: string) => {
    Alert.alert(
      'Stage Complete! 🎉',
      `You've completed all lessons in ${stage?.title}. Great job!`,
      [
        {
          text: 'Continue to Next Stage',
          onPress: () => {
            // Navigate to next stage if available
            const nextStage = stages.find(s => s.id === stage!.id + 1);
            if (nextStage) {
              router.push({
                pathname: '/StageDeckScreen',
                params: { stageId: nextStage.id.toString() }
              });
            } else {
              router.back();
            }
          },
        },
        {
          text: 'Back to Learning Path',
          onPress: () => router.back(),
        },
      ]
    );
  }, [stage, stages]);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
            Loading stage deck...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={60}
            color={theme.colors.error}
          />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadStageData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!stage || lessonCards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="book-education"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
            No lessons available
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            This stage doesn't have any lessons yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {stage.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {stage.description}
          </Text>
        </View>
      </View>

      {/* Stage Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="cards" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {lessonCards.length} lessons
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {stage.lessons.reduce((total, lesson) => total + lesson.duration, 0)} min total
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {stage.lessons.reduce((total, lesson) => total + lesson.xpReward, 0)} XP
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="headphones" size={16} color={theme.colors.primary} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {lessonCards.filter(card => card.audioUrl).length} with audio
          </Text>
        </View>
      </View>

      {/* Deck */}
      <View style={styles.deckContainer}>
        <LessonDeck
          cards={lessonCards}
          onDeckComplete={handleDeckComplete}
          onCardComplete={handleCardComplete}
          initialProgress={deckProgress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Graphik-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Graphik-Medium',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  deckContainer: {
    flex: 1,
  },
});
