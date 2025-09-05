import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ChallengeSubmissionCard } from './ChallengeSubmissionCard';
import { ChallengeDeck as ChallengeDeckType, ChallengeSubmissionCard as ChallengeSubmissionCardType } from '../../types/deck';

const { width: screenWidth } = Dimensions.get('window');

interface ChallengeDeckProps {
  deck: ChallengeDeckType;
  onDeckComplete: (deckId: string) => void;
  onVote: (cardId: string, vote: 'up' | 'down') => void;
  onShare: (cardId: string) => void;
}

export const ChallengeDeck: React.FC<ChallengeDeckProps> = ({
  deck,
  onDeckComplete,
  onVote,
  onShare,
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [votedCards, setVotedCards] = useState<Set<string>>(new Set());

  const currentCard = deck.submissionCards[currentIndex];
  const isLastCard = currentIndex >= deck.submissionCards.length - 1;
  const isChallengeActive = deck.status === 'active';

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right' && !isLastCard) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else if (direction === 'left' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex, isLastCard]);

  const handleVote = useCallback((cardId: string, vote: 'up' | 'down') => {
    onVote(cardId, vote);
    setVotedCards(prev => new Set(prev).add(cardId));
  }, [onVote]);

  const handleShare = useCallback((cardId: string) => {
    onShare(cardId);
  }, [onShare]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (!isLastCard) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [isLastCard]);

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Challenge Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      default: return '#f59e0b';
    }
  };

  if (!currentCard) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={60}
            color={theme.colors.error}
          />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            No submissions available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.challengeInfo}>
          <Text style={[styles.challengeTitle, { color: theme.colors.onBackground }]}>
            {deck.title}
          </Text>
          <View style={styles.challengeMeta}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deck.status) }]}>
              <Text style={styles.statusText}>
                {deck.status.toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.timeRemaining, { color: theme.colors.onSurfaceVariant }]}>
              {formatTimeRemaining(deck.endDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: theme.colors.onBackground }]}>
            {currentIndex + 1} of {deck.submissionCards.length}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.outline }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${((currentIndex + 1) / deck.submissionCards.length) * 100}%`
                }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Challenge Details */}
      <View style={[styles.challengeDetails, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="chart-line" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {deck.symbol}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              {deck.participants.length} participants
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="trophy" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.detailText, { color: theme.colors.onSurfaceVariant }]}>
              ${deck.prizeAmount.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            { borderColor: theme.colors.outline },
            currentIndex === 0 && styles.navButtonDisabled
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={currentIndex === 0 ? theme.colors.onSurfaceVariant : theme.colors.primary}
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.navButton,
            { borderColor: theme.colors.outline },
            isLastCard && styles.navButtonDisabled
          ]}
          onPress={handleNext}
          disabled={isLastCard}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={isLastCard ? theme.colors.onSurfaceVariant : theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <ChallengeSubmissionCard
          card={currentCard}
          onSwipe={handleSwipe}
          onVote={handleVote}
          onShare={handleShare}
          onFlip={handleFlip}
          isFlipped={isFlipped}
          isRevealed={deck.status === 'completed'}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <MaterialCommunityIcons
            name="gesture-swipe-left"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
            Swipe left to skip
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <MaterialCommunityIcons
            name="gesture-swipe-right"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
            Swipe right to continue
          </Text>
        </View>
      </View>
    </View>
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
  challengeInfo: {
    marginBottom: 16,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  challengeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontFamily: 'Graphik-Semibold',
  },
  timeRemaining: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Graphik-Semibold',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  challengeDetails: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    fontFamily: 'Graphik-Semibold',
  },
});
