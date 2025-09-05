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
import { FriendCard, FriendCardData } from './FriendCard';

const { width: screenWidth } = Dimensions.get('window');

interface FriendsDeckProps {
  friends: FriendCardData[];
  onFriendAction: (friendId: string, action: 'message' | 'profile' | 'share') => void;
  onDeckComplete: () => void;
}

export const FriendsDeck: React.FC<FriendsDeckProps> = ({
  friends,
  onFriendAction,
  onDeckComplete,
}) => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedFriends, setCompletedFriends] = useState<string[]>([]);

  const currentFriend = friends[currentIndex];
  const isLastFriend = currentIndex >= friends.length - 1;
  const isDeckComplete = completedFriends.length === friends.length;

  const handleSwipe = useCallback((direction: 'left' | 'right' | 'up' | 'down') => {
    if (direction === 'right' && !isLastFriend) {
      // Like/Message action
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else if (direction === 'left' && currentIndex > 0) {
      // Skip action
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    } else if (direction === 'up') {
      // View profile action
      if (currentFriend) {
        onFriendAction(currentFriend.id, 'profile');
      }
    } else if (direction === 'down') {
      // Share action
      if (currentFriend) {
        onFriendAction(currentFriend.id, 'share');
      }
    }
  }, [currentIndex, isLastFriend, currentFriend, onFriendAction]);

  const handleComplete = useCallback((friendId: string) => {
    if (!completedFriends.includes(friendId)) {
      setCompletedFriends(prev => [...prev, friendId]);
      
      // Move to next friend after completion
      if (!isLastFriend) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setIsFlipped(false);
        }, 1000);
      } else {
        // Deck completed
        setTimeout(() => {
          onDeckComplete();
        }, 1000);
      }
    }
  }, [completedFriends, isLastFriend, onDeckComplete]);

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
    if (!isLastFriend) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  }, [isLastFriend]);

  if (isDeckComplete) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.completionContainer}>
          <MaterialCommunityIcons
            name="account-group"
            size={80}
            color={theme.colors.primary}
          />
          <Text style={[styles.completionTitle, { color: theme.colors.onBackground }]}>
            All Friends Reviewed! 🎉
          </Text>
          <Text style={[styles.completionText, { color: theme.colors.onSurfaceVariant }]}>
            You've gone through all {friends.length} friends in your deck.
          </Text>
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: theme.colors.primary }]}
            onPress={onDeckComplete}
          >
            <Text style={styles.continueButtonText}>Back to Friends</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!currentFriend) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle"
            size={60}
            color={theme.colors.error}
          />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            No friends available
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
            {currentIndex + 1} of {friends.length}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.outline }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${((currentIndex + 1) / friends.length) * 100}%`
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
              isLastFriend && styles.navButtonDisabled
            ]}
            onPress={handleNext}
            disabled={isLastFriend}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={isLastFriend ? theme.colors.onSurfaceVariant : theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Card */}
      <View style={styles.cardContainer}>
        <FriendCard
          friend={currentFriend}
          onSwipe={handleSwipe}
          onFlip={handleFlip}
          isFlipped={isFlipped}
        />
      </View>

      {/* Swipe Instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionRow}>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons
              name="gesture-swipe-left"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
              Skip
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons
              name="gesture-swipe-right"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
              Message
            </Text>
          </View>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons
              name="gesture-swipe-up"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
              Profile
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <MaterialCommunityIcons
              name="gesture-swipe-down"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.instructionText, { color: theme.colors.onSurfaceVariant }]}>
              Share
            </Text>
          </View>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  instructionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
