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
import { FriendRequestCard as FriendRequestCardType } from '../../types/deck';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.6;

// Platform-specific native driver support
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface FriendRequestCardProps {
  card: FriendRequestCardType;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onAccept: (cardId: string) => void;
  onDecline: (cardId: string) => void;
  onViewProfile: (cardId: string) => void;
  onFlip: () => void;
  isFlipped: boolean;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  card,
  onSwipe,
  onAccept,
  onDecline,
  onViewProfile,
  onFlip,
  isFlipped,
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
        
        // Handle accept/decline based on swipe direction
        if (direction === 'right') {
          onAccept(card.id);
        } else {
          onDecline(card.id);
        }
        
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
        
        // Handle view profile on up swipe
        if (direction === 'up') {
          onViewProfile(card.id);
        }
        
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

  const formatSentAt = (date: Date) => {
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

  const renderFront = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.requestInfo}>
          <Text style={[styles.requestLabel, { color: theme.colors.onSurfaceVariant }]}>
            Friend Request
          </Text>
          <Text style={[styles.sentAt, { color: theme.colors.onSurfaceVariant }]}>
            {formatSentAt(card.sentAt)}
          </Text>
        </View>
        <TouchableOpacity onPress={handleFlip}>
          <MaterialCommunityIcons name="information" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userContainer}>
        <Avatar.Text size={80} label={card.avatar} />
        {card.isExpert && (
          <View style={styles.expertBadge}>
            <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
          </View>
        )}
      </View>

      <Text style={[styles.username, { color: theme.colors.onSurface }]}>
        {card.username}
      </Text>

      {/* Mutual Friends */}
      <View style={styles.mutualFriendsContainer}>
        <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
        <Text style={[styles.mutualFriendsText, { color: theme.colors.onSurface }]}>
          {card.mutualFriends} mutual friends
        </Text>
      </View>

      {/* Request Message */}
      {card.requestMessage && (
        <View style={styles.messageContainer}>
          <Text style={[styles.messageLabel, { color: theme.colors.onSurfaceVariant }]}>
            Message
          </Text>
          <Text style={[styles.messageText, { color: theme.colors.onSurface }]}>
            "{card.requestMessage}"
          </Text>
        </View>
      )}

      {/* Reputation */}
      <View style={styles.reputationContainer}>
        <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
        <Text style={[styles.reputationText, { color: theme.colors.onSurface }]}>
          {card.reputation} reputation
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.acceptButton, { backgroundColor: '#10b981' }]}
          onPress={() => onAccept(card.id)}
        >
          <MaterialCommunityIcons name="check" size={20} color="white" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.declineButton, { backgroundColor: '#ef4444' }]}
          onPress={() => onDecline(card.id)}
        >
          <MaterialCommunityIcons name="close" size={20} color="white" />
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBack = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.backTitle, { color: theme.colors.onSurface }]}>
          {card.username}'s Profile
        </Text>
        <TouchableOpacity onPress={handleFlip}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Interests */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Interests
        </Text>
        <View style={styles.interestsContainer}>
          {card.interests.map((interest, index) => (
            <Chip key={index} mode="outlined" compact style={styles.interestChip}>
              {interest}
            </Chip>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
            {card.mutualFriends}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            Mutual Friends
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
            {card.reputation}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            Reputation
          </Text>
        </View>
      </View>

      {/* Request Message */}
      {card.requestMessage && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Request Message
          </Text>
          <Text style={[styles.messageText, { color: theme.colors.onSurface }]}>
            {card.requestMessage}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.backActionButtons}>
        <TouchableOpacity 
          style={[styles.primaryActionButton, { backgroundColor: '#10b981' }]}
          onPress={() => onAccept(card.id)}
        >
          <MaterialCommunityIcons name="check" size={20} color="white" />
          <Text style={styles.primaryActionButtonText}>Accept Request</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.secondaryActionButton, { borderColor: theme.colors.outline }]}
          onPress={() => onViewProfile(card.id)}
        >
          <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
          <Text style={[styles.secondaryActionButtonText, { color: theme.colors.primary }]}>
            View Full Profile
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
  requestInfo: {
    flex: 1,
  },
  requestLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  sentAt: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  userContainer: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  expertBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fbbf24',
    borderRadius: 12,
    padding: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  mutualFriendsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  mutualFriendsText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 8,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Graphik-Medium',
  },
  messageText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: 'Graphik-Regular',
  },
  reputationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  reputationText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  declineButtonText: {
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Graphik-Semibold',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestChip: {
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
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
