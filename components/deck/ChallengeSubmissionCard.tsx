import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanGestureHandler,
  State,
  Platform,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ChallengeSubmissionCard as ChallengeSubmissionCardType } from '../../types/deck';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.7;

// Platform-specific native driver support
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface ChallengeSubmissionCardProps {
  card: ChallengeSubmissionCardType;
  onSwipe: (direction: 'left' | 'right') => void;
  onVote: (cardId: string, vote: 'up' | 'down') => void;
  onShare: (cardId: string) => void;
  onFlip: () => void;
  isFlipped: boolean;
  isRevealed: boolean;
}

export const ChallengeSubmissionCard: React.FC<ChallengeSubmissionCardProps> = ({
  card,
  onSwipe,
  onVote,
  onShare,
  onFlip,
  isFlipped,
  isRevealed,
}) => {
  const theme = useTheme();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(card.votes?.userVote || null);
  
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: USE_NATIVE_DRIVER }
  );

  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      if (Math.abs(translationX) > CARD_WIDTH * 0.3 || Math.abs(velocityX) > 500) {
        const direction = translationX > 0 ? 'right' : 'left';
        onSwipe(direction);
        
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: direction === 'right' ? CARD_WIDTH : -CARD_WIDTH,
            duration: 200,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();
      }
    }
  };

  const handleFlip = () => {
    Animated.sequence([
      Animated.timing(rotate, {
        toValue: 1,
        duration: 300,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
    onFlip();
  };

  const handleVote = (vote: 'up' | 'down') => {
    if (userVote === vote) {
      setUserVote(null);
      onVote(card.id, vote); // Remove vote
    } else {
      setUserVote(vote);
      onVote(card.id, vote);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const renderFront = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{card.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={[styles.username, { color: theme.colors.onSurface }]}>
              {card.username}
            </Text>
            <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
              {formatTimeAgo(card.submittedAt)}
            </Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          {card.isRevealed ? (
            <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}>
              <MaterialCommunityIcons name="eye" size={16} color="white" />
              <Text style={styles.statusText}>REVEALED</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: '#f59e0b' }]}>
              <MaterialCommunityIcons name="eye-off" size={16} color="white" />
              <Text style={styles.statusText}>HIDDEN</Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {card.isRevealed && card.fullSubmission ? (
          <View style={styles.revealedContent}>
            <View style={styles.predictionContainer}>
              <Text style={[styles.predictionLabel, { color: theme.colors.onSurfaceVariant }]}>
                Prediction
              </Text>
              <Text style={[styles.predictionValue, { color: theme.colors.primary }]}>
                ${card.fullSubmission.prediction.toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.confidenceContainer}>
              <Text style={[styles.confidenceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Confidence
              </Text>
              <View style={styles.confidenceBar}>
                <View
                  style={[
                    styles.confidenceFill,
                    {
                      width: `${card.fullSubmission.confidence * 100}%`,
                      backgroundColor: card.fullSubmission.confidence > 0.7 ? '#10b981' : 
                                     card.fullSubmission.confidence > 0.4 ? '#f59e0b' : '#ef4444'
                    }
                  ]}
                />
              </View>
              <Text style={[styles.confidenceText, { color: theme.colors.onSurfaceVariant }]}>
                {Math.round(card.fullSubmission.confidence * 100)}%
              </Text>
            </View>

            <View style={styles.reasoningContainer}>
              <Text style={[styles.reasoningLabel, { color: theme.colors.onSurfaceVariant }]}>
                Reasoning
              </Text>
              <Text style={[styles.reasoningText, { color: theme.colors.onSurface }]}>
                {card.fullSubmission.reasoning}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.hiddenContent}>
            <MaterialCommunityIcons
              name="lock"
              size={60}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.hiddenText, { color: theme.colors.onSurfaceVariant }]}>
              {card.preview || 'Submission will be revealed when the challenge ends'}
            </Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {card.isRevealed && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: theme.colors.outline },
              userVote === 'up' && { backgroundColor: '#10b981', borderColor: '#10b981' }
            ]}
            onPress={() => handleVote('up')}
          >
            <MaterialCommunityIcons
              name="thumb-up"
              size={20}
              color={userVote === 'up' ? 'white' : theme.colors.onSurfaceVariant}
            />
            <Text style={[
              styles.actionText,
              { color: userVote === 'up' ? 'white' : theme.colors.onSurfaceVariant }
            ]}>
              {card.votes?.upvotes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { borderColor: theme.colors.outline },
              userVote === 'down' && { backgroundColor: '#ef4444', borderColor: '#ef4444' }
            ]}
            onPress={() => handleVote('down')}
          >
            <MaterialCommunityIcons
              name="thumb-down"
              size={20}
              color={userVote === 'down' ? 'white' : theme.colors.onSurfaceVariant}
            />
            <Text style={[
              styles.actionText,
              { color: userVote === 'down' ? 'white' : theme.colors.onSurfaceVariant }
            ]}>
              {card.votes?.downvotes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { borderColor: theme.colors.outline }]}
            onPress={() => onShare(card.id)}
          >
            <MaterialCommunityIcons
              name="share"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.actionText, { color: theme.colors.onSurfaceVariant }]}>
              Share
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Flip Button */}
      <TouchableOpacity
        style={[styles.flipButton, { borderColor: theme.colors.outline }]}
        onPress={handleFlip}
      >
        <MaterialCommunityIcons name="flip-horizontal" size={20} color={theme.colors.primary} />
        <Text style={[styles.flipButtonText, { color: theme.colors.primary }]}>
          {isFlipped ? 'Back to Submission' : 'View Details'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBack = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.backTitle, { color: theme.colors.onSurface }]}>
          Submission Details
        </Text>
        <TouchableOpacity onPress={handleFlip}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Detailed Info */}
      <View style={styles.detailsContent}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            Submitted
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {card.submittedAt.toLocaleDateString()} at {card.submittedAt.toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            Status
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {card.isRevealed ? 'Revealed' : 'Hidden until challenge ends'}
          </Text>
        </View>

        {card.isRevealed && card.fullSubmission && (
          <>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                Prediction
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.primary }]}>
                ${card.fullSubmission.prediction.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                Confidence Level
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                {Math.round(card.fullSubmission.confidence * 100)}%
              </Text>
            </View>

            {card.fullSubmission.supportingData && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Supporting Data
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  {JSON.stringify(card.fullSubmission.supportingData)}
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            Votes
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            ↑ {card.votes?.upvotes || 0} ↓ {card.votes?.downvotes || 0}
          </Text>
        </View>
      </View>
    </View>
  );

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleGestureStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX },
              { scale },
              { rotateY: rotateInterpolate },
            ],
          },
        ]}
      >
        {isFlipped ? renderBack() : renderFront()}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Graphik-Semibold',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealedContent: {
    width: '100%',
    gap: 20,
  },
  predictionContainer: {
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
    marginBottom: 4,
  },
  predictionValue: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  confidenceContainer: {
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
    marginBottom: 8,
  },
  confidenceBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  reasoningContainer: {
    alignItems: 'center',
  },
  reasoningLabel: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
    marginBottom: 8,
  },
  reasoningText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
  },
  hiddenContent: {
    alignItems: 'center',
    gap: 16,
  },
  hiddenText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  flipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  backTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  detailsContent: {
    flex: 1,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
});
