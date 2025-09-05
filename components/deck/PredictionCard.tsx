import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useTheme, Avatar, Chip } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PredictionCard as PredictionCardType } from '../../types/deck';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.6;

// Platform-specific native driver support
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface PredictionCardProps {
  card: PredictionCardType;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onVote: (cardId: string, vote: 'up' | 'down') => void;
  onShare: (cardId: string) => void;
  onFlip: () => void;
  isFlipped: boolean;
  isRevealed: boolean;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  card,
  onSwipe,
  onVote,
  onShare,
  onFlip,
  isFlipped,
  isRevealed,
}) => {
  const theme = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const handleGestureEvent = Animated.event(
    [
      { nativeEvent: { translationX: translateX, translationY: translateY } }
    ],
    { useNativeDriver: USE_NATIVE_DRIVER }
  );

  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, translationY, velocityX, velocityY } = event.nativeEvent;
      
      // Determine swipe direction based on translation and velocity
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);
      const absVelX = Math.abs(velocityX);
      const absVelY = Math.abs(velocityY);
      
      if (absX > CARD_WIDTH * 0.3 || absVelX > 500) {
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
      } else if (absY > CARD_HEIGHT * 0.2 || absVelY > 500) {
        const direction = translationY > 0 ? 'down' : 'up';
        onSwipe(direction);
        
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: direction === 'down' ? CARD_HEIGHT : -CARD_HEIGHT,
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
        // Return to center
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]).start();
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

  const formatSubmittedAt = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getDirectionColor = (direction: 'up' | 'down') => {
    return direction === 'up' ? '#10b981' : '#ef4444';
  };

  const getDirectionIcon = (direction: 'up' | 'down') => {
    return direction === 'up' ? 'trending-up' : 'trending-down';
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return theme.colors.onSurfaceVariant;
    if (accuracy >= 80) return '#10b981';
    if (accuracy >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const renderFront = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar.Text size={40} label={card.avatar} />
          <View style={styles.userDetails}>
            <Text style={[styles.username, { color: theme.colors.onSurface }]}>
              {card.username}
            </Text>
            <Text style={[styles.submittedAt, { color: theme.colors.onSurfaceVariant }]}>
              {formatSubmittedAt(card.submittedAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleFlip}>
          <MaterialCommunityIcons name="information" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Prediction Preview */}
      <View style={styles.predictionContainer}>
        <Text style={[styles.predictionLabel, { color: theme.colors.onSurfaceVariant }]}>
          Prediction for {card.prediction.symbol}
        </Text>
        
        {isRevealed ? (
          <View style={styles.revealedPrediction}>
            <View style={styles.directionContainer}>
              <MaterialCommunityIcons 
                name={getDirectionIcon(card.prediction.direction)} 
                size={32} 
                color={getDirectionColor(card.prediction.direction)} 
              />
              <Text style={[
                styles.directionText, 
                { color: getDirectionColor(card.prediction.direction) }
              ]}>
                {card.prediction.direction.toUpperCase()}
              </Text>
            </View>
            
            {card.prediction.targetPrice && (
              <Text style={[styles.targetPrice, { color: theme.colors.onSurface }]}>
                Target: ${card.prediction.targetPrice.toFixed(2)}
              </Text>
            )}
            
            <View style={styles.confidenceContainer}>
              <Text style={[styles.confidenceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Confidence
              </Text>
              <Text style={[styles.confidenceValue, { color: theme.colors.onSurface }]}>
                {card.prediction.confidence}%
              </Text>
            </View>

            {card.accuracy !== undefined && (
              <View style={styles.accuracyContainer}>
                <Text style={[styles.accuracyLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Accuracy
                </Text>
                <Text style={[
                  styles.accuracyValue, 
                  { color: getAccuracyColor(card.accuracy) }
                ]}>
                  {card.accuracy.toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.hiddenPrediction}>
            <MaterialCommunityIcons 
              name="eye-off" 
              size={48} 
              color={theme.colors.onSurfaceVariant} 
            />
            <Text style={[styles.hiddenText, { color: theme.colors.onSurfaceVariant }]}>
              Prediction hidden until competition ends
            </Text>
            <View style={styles.confidenceContainer}>
              <Text style={[styles.confidenceLabel, { color: theme.colors.onSurfaceVariant }]}>
                Confidence
              </Text>
              <Text style={[styles.confidenceValue, { color: theme.colors.onSurface }]}>
                {card.prediction.confidence}%
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onVote(card.id, 'up')}
        >
          <MaterialCommunityIcons name="thumb-up" size={20} color="white" />
          <Text style={styles.actionButtonText}>Good</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.colors.outline }]}
          onPress={() => onShare(card.id)}
        >
          <MaterialCommunityIcons name="share" size={20} color={theme.colors.onSurface} />
          <Text style={[styles.actionButtonText, { color: theme.colors.onSurface }]}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBack = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.backTitle, { color: theme.colors.onSurface }]}>
          {card.username}'s Reasoning
        </Text>
        <TouchableOpacity onPress={handleFlip}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Reasoning */}
      <View style={styles.reasoningContainer}>
        <Text style={[styles.reasoningLabel, { color: theme.colors.onSurfaceVariant }]}>
          Analysis & Reasoning
        </Text>
        <Text style={[styles.reasoningText, { color: theme.colors.onSurface }]}>
          {card.prediction.reasoning}
        </Text>
      </View>

      {/* Prediction Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            Symbol
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {card.prediction.symbol}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            Direction
          </Text>
          <View style={styles.directionBadge}>
            <MaterialCommunityIcons 
              name={getDirectionIcon(card.prediction.direction)} 
              size={16} 
              color={getDirectionColor(card.prediction.direction)} 
            />
            <Text style={[
              styles.directionBadgeText, 
              { color: getDirectionColor(card.prediction.direction) }
            ]}>
              {card.prediction.direction.toUpperCase()}
            </Text>
          </View>
        </View>
        
        {card.prediction.targetPrice && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              Target Price
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              ${card.prediction.targetPrice.toFixed(2)}
            </Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            Confidence
          </Text>
          <Text style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {card.prediction.confidence}%
          </Text>
        </View>
        
        {card.accuracy !== undefined && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              Accuracy
            </Text>
            <Text style={[
              styles.detailValue, 
              { color: getAccuracyColor(card.accuracy) }
            ]}>
              {card.accuracy.toFixed(1)}%
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.backActionButtons}>
        <TouchableOpacity 
          style={[styles.primaryActionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onVote(card.id, 'up')}
        >
          <MaterialCommunityIcons name="thumb-up" size={20} color="white" />
          <Text style={styles.primaryActionButtonText}>Good Analysis</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryActionButton, { borderColor: theme.colors.outline }]}
          onPress={() => onShare(card.id)}
        >
          <MaterialCommunityIcons name="share" size={20} color={theme.colors.primary} />
          <Text style={[styles.secondaryActionButtonText, { color: theme.colors.primary }]}>
            Share Prediction
          </Text>
        </TouchableOpacity>
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
              { translateY },
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
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  submittedAt: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  predictionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  predictionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 20,
    fontFamily: 'Graphik-Medium',
  },
  revealedPrediction: {
    alignItems: 'center',
    gap: 16,
  },
  directionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  directionText: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  targetPrice: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  confidenceContainer: {
    alignItems: 'center',
    gap: 4,
  },
  confidenceLabel: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  confidenceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  accuracyContainer: {
    alignItems: 'center',
    gap: 4,
  },
  accuracyLabel: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  accuracyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  hiddenPrediction: {
    alignItems: 'center',
    gap: 16,
  },
  hiddenText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Graphik-Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  backTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  reasoningContainer: {
    flex: 1,
    marginBottom: 20,
  },
  reasoningLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Graphik-Semibold',
  },
  reasoningText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  directionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  directionBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  backActionButtons: {
    gap: 12,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  secondaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
});
