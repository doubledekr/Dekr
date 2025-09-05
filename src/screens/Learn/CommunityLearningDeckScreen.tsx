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
import { LessonCard, DeckProgress, CommunityLearningDeck } from '../../../types/deck';

export function CommunityLearningDeckScreen() {
  const theme = useTheme();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const [deck, setDeck] = useState<CommunityLearningDeck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);

  // Load deck data
  useEffect(() => {
    if (deckId) {
      loadDeck();
      loadDeckProgress();
    }
  }, [deckId]);

  const loadDeck = async () => {
    if (!deckId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data - in real implementation, this would fetch from Firebase
      const mockDeck: CommunityLearningDeck = {
        id: deckId,
        title: 'Beginner Trading Fundamentals',
        description: 'Learn the basics of trading, market structure, and essential concepts.',
        creator: {
          id: '1',
          name: 'Sarah Chen',
          avatar: 'SC',
          reputation: 1250,
          isExpert: true,
        },
        topic: 'trading',
        cards: [
          {
            id: '1',
            type: 'lesson',
            title: 'What is Trading?',
            description: 'Introduction to the world of trading and financial markets.',
            audioUrl: '',
            duration: '5-10',
            difficulty: 'beginner',
            stage: 1,
            courseId: deckId,
            resources: [
              {
                id: '1',
                type: 'article',
                title: 'Trading Basics Guide',
                url: 'https://example.com',
                description: 'Comprehensive guide to trading fundamentals'
              }
            ],
            quiz: {
              id: '1',
              question: 'What is the primary goal of trading?',
              options: [
                'To make money',
                'To lose money',
                'To avoid markets',
                'To study charts only'
              ],
              correctAnswer: 0,
              explanation: 'The primary goal of trading is to make money by buying low and selling high.'
            },
            completed: false,
            xpReward: 10,
          },
          {
            id: '2',
            type: 'lesson',
            title: 'Market Structure',
            description: 'Understanding how financial markets are organized and function.',
            audioUrl: '',
            duration: '8-12',
            difficulty: 'beginner',
            stage: 2,
            courseId: deckId,
            resources: [],
            quiz: {
              id: '2',
              question: 'What are the main types of markets?',
              options: [
                'Stock, Bond, and Commodity',
                'Red, Blue, and Green',
                'Hot, Cold, and Warm',
                'Big, Medium, and Small'
              ],
              correctAnswer: 0,
              explanation: 'The main types of financial markets are Stock, Bond, and Commodity markets.'
            },
            completed: false,
            xpReward: 15,
          },
          {
            id: '3',
            type: 'lesson',
            title: 'Risk Management Basics',
            description: 'Learn how to protect your capital and manage risk effectively.',
            audioUrl: '',
            duration: '10-15',
            difficulty: 'beginner',
            stage: 3,
            courseId: deckId,
            resources: [],
            quiz: {
              id: '3',
              question: 'What is the golden rule of risk management?',
              options: [
                'Never risk more than you can afford to lose',
                'Always risk everything',
                'Risk management is not important',
                'Only trade on weekends'
              ],
              correctAnswer: 0,
              explanation: 'The golden rule is to never risk more than you can afford to lose.'
            },
            completed: false,
            xpReward: 20,
          }
        ],
        followers: 1250,
        rating: 4.8,
        difficulty: 'beginner',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        tags: ['trading', 'fundamentals', 'beginner'],
        estimatedDuration: '2 weeks',
      };

      setDeck(mockDeck);
    } catch (error) {
      console.error('Error loading deck:', error);
      setError(error instanceof Error ? error.message : 'Failed to load deck');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeckProgress = async () => {
    if (!deckId) return;

    try {
      // In real implementation, this would load from AsyncStorage or Firebase
      const progressKey = `community_deck_progress_${deckId}`;
      // Mock progress for now
      setDeckProgress({
        deckId,
        completedCards: [],
        totalCards: 3,
        currentIndex: 0,
        lastAccessed: new Date(),
        timeSpent: 0,
      });
    } catch (error) {
      console.error('Error loading deck progress:', error);
    }
  };

  const saveDeckProgress = async (progress: DeckProgress) => {
    if (!deckId) return;

    try {
      const progressKey = `community_deck_progress_${deckId}`;
      // In real implementation, save to AsyncStorage or Firebase
      setDeckProgress(progress);
    } catch (error) {
      console.error('Error saving deck progress:', error);
    }
  };

  const handleCardComplete = useCallback((cardId: string) => {
    if (!deckProgress) return;

    const updatedProgress: DeckProgress = {
      ...deckProgress,
      completedCards: [...deckProgress.completedCards, cardId],
      lastAccessed: new Date(),
    };

    saveDeckProgress(updatedProgress);
  }, [deckProgress]);

  const handleDeckComplete = useCallback((deckId: string) => {
    Alert.alert(
      'Deck Complete! 🎉',
      'You\'ve completed all lessons in this community deck. Great job!',
      [
        {
          text: 'Rate This Deck',
          onPress: () => {
            // Navigate to rating screen
            console.log('Rate deck:', deckId);
          },
        },
        {
          text: 'Back to Community',
          onPress: () => router.back(),
        },
      ]
    );
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
            Loading community deck...
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
            onPress={loadDeck}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!deck || deck.cards.length === 0) {
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
            This community deck doesn't have any lessons yet.
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
            {deck.title}
          </Text>
          <View style={styles.creatorInfo}>
            <Text style={[styles.creatorName, { color: theme.colors.onSurfaceVariant }]}>
              by {deck.creator.name}
            </Text>
            {deck.creator.isExpert && (
              <View style={styles.expertBadge}>
                <MaterialCommunityIcons name="star" size={12} color="#fbbf24" />
                <Text style={styles.expertText}>Expert</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Deck Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {deck.rating}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {deck.followers}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {deck.estimatedDuration}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="cards" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {deck.cards.length} lessons
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {deck.description}
        </Text>
      </View>

      {/* Deck */}
      <View style={styles.deckContainer}>
        <LessonDeck
          cards={deck.cards}
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
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorName: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
  },
  expertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  expertText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Graphik-Semibold',
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
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  deckContainer: {
    flex: 1,
  },
});