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
import { LessonCard } from './LessonCard';
import { LessonCard as LessonCardType, DeckProgress } from '../../types/deck';

const { width: screenWidth } = Dimensions.get('window');

interface LessonDeckProps {
  cards: LessonCardType[];
  onDeckComplete: (deckId: string) => void;
  onCardComplete: (cardId: string) => void;
  initialProgress?: DeckProgress;
}

export const LessonDeck: React.FC<LessonDeckProps> = ({
  cards,
  onDeckComplete,
  onCardComplete,
  initialProgress,
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialProgress?.currentIndex || 0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedCards, setCompletedCards] = useState<string[]>(
    initialProgress?.completedCards || []
  );

  const currentCard = cards[currentIndex];
  const isLastCard = currentIndex >= cards.length - 1;
  const isDeckComplete = completedCards.length === cards.length;

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right' && !isLastCard) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setProgress(0);
    } else if (direction === 'left' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setProgress(0);
    }
  }, [currentIndex, isLastCard]);

  const handleComplete = useCallback((cardId: string) => {
    if (!completedCards.includes(cardId)) {
      setCompletedCards(prev => [...prev, cardId]);
      onCardComplete(cardId);
      
      // Move to next card after completion
      if (!isLastCard) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setIsFlipped(false);
          setProgress(0);
        }, 1000);
      } else {
        // Deck completed
        setTimeout(() => {
          onDeckComplete(cards[0]?.courseId || '');
        }, 1000);
      }
    }
  }, [completedCards, isLastCard, onCardComplete, onDeckComplete, cards]);

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleProgressUpdate = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (!isLastCard) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setProgress(0);
    }
  }, [isLastCard]);

  if (isDeckComplete) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.completionContainer}>
          <MaterialCommunityIcons
            name="trophy"
            size={80}
            color={theme.colors.primary}
          />
          <Text style={[styles.completionTitle, { color: theme.colors.onBackground }]}>
            Deck Complete! 🎉
          </Text>
          <Text style={[styles.completionText, { color: theme.colors.onSurfaceVariant }]}>
            You've completed all {cards.length} lessons in this deck.
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => onDeckComplete(cards[0]?.courseId || '')}
          >
            <Text style={styles.continueButtonText}>Continue Learning</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
            No cards available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: theme.colors.onBackground }]}>
            {currentIndex + 1} of {cards.length}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.outline }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${((currentIndex + 1) / cards.length) * 100}%`
                }
              ]}
            />
          </View>
        </View>
        
        <View style={styles.navigationButtons}>
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
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <LessonCard
          card={currentCard}
          onSwipe={handleSwipe}
          onComplete={handleComplete}
          onFlip={handleFlip}
          isFlipped={isFlipped}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          progress={progress}
        />
      </View>

      {/* Swipe Instructions */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
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
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
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
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  completionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'Graphik-Regular',
  },
  continueButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
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
