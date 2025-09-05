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
import { ChallengeDeck } from '../../../components/deck';
import { ChallengeSubmissionCard, DeckProgress, ChallengeDeck as ChallengeDeckType } from '../../../types/deck';

export function ChallengeDeckScreen() {
  const theme = useTheme();
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>();
  const [challengeDeck, setChallengeDeck] = useState<ChallengeDeckType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckProgress, setDeckProgress] = useState<DeckProgress | null>(null);

  // Load challenge deck data
  useEffect(() => {
    if (challengeId) {
      loadChallengeDeck();
      loadDeckProgress();
    }
  }, [challengeId]);

  const loadChallengeDeck = async () => {
    if (!challengeId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data - in real implementation, this would fetch from Firebase
      const mockChallengeDeck: ChallengeDeckType = {
        id: challengeId,
        title: 'Weekly Trading Challenge',
        description: 'Predict the direction of AAPL stock for next week',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'active',
        symbol: 'AAPL',
        type: 'direction',
        prizeAmount: 100,
        maxParticipants: 50,
        participants: [
          { userId: '1', displayName: 'TraderMike', avatar: 'TM' },
          { userId: '2', displayName: 'StockGuru', avatar: 'SG' },
          { userId: '3', displayName: 'CryptoQueen', avatar: 'CQ' },
        ],
        creatorId: 'admin',
        userSubmitted: false,
        submissionCards: [
          {
            id: '1',
            type: 'challenge_submission',
            challengeId: challengeId,
            username: 'TraderMike',
            avatar: 'TM',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isRevealed: false,
            preview: 'Bullish prediction with technical analysis',
            votes: {
              upvotes: 12,
              downvotes: 3,
              userVote: null,
            },
          },
          {
            id: '2',
            type: 'challenge_submission',
            challengeId: challengeId,
            username: 'StockGuru',
            avatar: 'SG',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            isRevealed: false,
            preview: 'Bearish outlook based on fundamentals',
            votes: {
              upvotes: 8,
              downvotes: 5,
              userVote: null,
            },
          },
          {
            id: '3',
            type: 'challenge_submission',
            challengeId: challengeId,
            username: 'CryptoQueen',
            avatar: 'CQ',
            submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            isRevealed: false,
            preview: 'Neutral stance with market analysis',
            votes: {
              upvotes: 15,
              downvotes: 2,
              userVote: 'up',
            },
          },
        ],
      };

      setChallengeDeck(mockChallengeDeck);
    } catch (error) {
      console.error('Error loading challenge deck:', error);
      setError(error instanceof Error ? error.message : 'Failed to load challenge deck');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeckProgress = async () => {
    if (!challengeId) return;

    try {
      // In real implementation, this would load from AsyncStorage or Firebase
      setDeckProgress({
        deckId: challengeId,
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
    if (!challengeId) return;

    try {
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
      'Challenge Complete! 🎉',
      'You\'ve reviewed all submissions in this challenge.',
      [
        {
          text: 'Submit Your Prediction',
          onPress: () => {
            // Navigate to submission screen
            console.log('Submit prediction for challenge:', deckId);
          },
        },
        {
          text: 'Back to Challenges',
          onPress: () => router.back(),
        },
      ]
    );
  }, []);

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return 'Challenge ended';
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else {
      return `${hours}h remaining`;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
            Loading challenge deck...
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
            onPress={loadChallengeDeck}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!challengeDeck || challengeDeck.submissionCards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="trophy-outline"
            size={80}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
            No submissions yet
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            Be the first to submit your prediction for this challenge!
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
            {challengeDeck.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {challengeDeck.description}
          </Text>
        </View>
      </View>

      {/* Challenge Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="trophy" size={16} color="#fbbf24" />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            ${challengeDeck.prizeAmount} prize
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {challengeDeck.submissionCards.length} submissions
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {formatTimeRemaining(challengeDeck.endDate)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="chart-line" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
            {challengeDeck.symbol}
          </Text>
        </View>
      </View>

      {/* Status Badge */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: challengeDeck.status === 'active' ? '#10b981' : '#6b7280' }
        ]}>
          <Text style={styles.statusText}>
            {challengeDeck.status === 'active' ? 'Active' : 'Completed'}
          </Text>
        </View>
        {challengeDeck.userSubmitted && (
          <View style={[styles.submittedBadge, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="check" size={12} color="white" />
            <Text style={styles.submittedText}>You submitted</Text>
          </View>
        )}
      </View>

      {/* Deck */}
      <View style={styles.deckContainer}>
        <ChallengeDeck
          cards={challengeDeck.submissionCards}
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  submittedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  deckContainer: {
    flex: 1,
  },
});