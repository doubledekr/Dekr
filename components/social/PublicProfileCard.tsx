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
import { PublicProfileCard as PublicProfileCardType } from '../../types/deck';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.6;

// Platform-specific native driver support
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface PublicProfileCardProps {
  card: PublicProfileCardType;
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void;
  onConnect: (cardId: string) => void;
  onViewProfile: (cardId: string) => void;
  onFlip: () => void;
  isFlipped: boolean;
}

export const PublicProfileCard: React.FC<PublicProfileCardProps> = ({
  card,
  onSwipe,
  onConnect,
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
        
        // Handle connect on right swipe
        if (direction === 'right') {
          onConnect(card.id);
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

  const formatLastActive = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Active now';
    } else if (diffInHours < 24) {
      return `Active ${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Active ${diffInDays}d ago`;
    }
  };

  const getPerformanceColor = (performance?: number) => {
    if (!performance) return theme.colors.onSurfaceVariant;
    return performance >= 0 ? '#10b981' : '#ef4444';
  };

  const renderFront = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileLabel, { color: theme.colors.onSurfaceVariant }]}>
            Community Member
          </Text>
          <Text style={[styles.lastActive, { color: theme.colors.onSurfaceVariant }]}>
            {formatLastActive(card.lastActive)}
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

      {/* Bio */}
      <View style={styles.bioContainer}>
        <Text style={[styles.bioText, { color: theme.colors.onSurface }]}>
          {card.bio}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
            {card.mutualConnections}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            Mutual
          </Text>
        </View>
        
        {card.portfolioPerformance !== undefined && (
          <View style={styles.statItem}>
            <MaterialCommunityIcons 
              name="trending-up" 
              size={20} 
              color={getPerformanceColor(card.portfolioPerformance)} 
            />
            <Text style={[
              styles.statValue, 
              { color: getPerformanceColor(card.portfolioPerformance) }
            ]}>
              {card.portfolioPerformance > 0 ? '+' : ''}{card.portfolioPerformance}%
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
              Portfolio
            </Text>
          </View>
        )}
        
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star" size={20} color="#fbbf24" />
          <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
            {card.reputation}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
            Rep
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.connectButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onConnect(card.id)}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="white" />
          <Text style={styles.connectButtonText}>Connect</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.profileButton, { backgroundColor: theme.colors.outline }]}
          onPress={() => onViewProfile(card.id)}
        >
          <MaterialCommunityIcons name="account" size={20} color={theme.colors.onSurface} />
          <Text style={[styles.profileButtonText, { color: theme.colors.onSurface }]}>Profile</Text>
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

      {/* Bio */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          About
        </Text>
        <Text style={[styles.bioText, { color: theme.colors.onSurface }]}>
          {card.bio}
        </Text>
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

      {/* Recent Achievements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Recent Achievements
        </Text>
        {card.recentAchievements.map((achievement, index) => (
          <View key={index} style={styles.achievementItem}>
            <MaterialCommunityIcons name="trophy" size={16} color="#fbbf24" />
            <Text style={[styles.achievementText, { color: theme.colors.onSurface }]}>
              {achievement}
            </Text>
          </View>
        ))}
      </View>

      {/* Portfolio Performance Details */}
      {card.portfolioPerformance !== undefined && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Portfolio Performance
          </Text>
          <View style={styles.performanceContainer}>
            <Text style={[
              styles.performanceValue,
              { color: getPerformanceColor(card.portfolioPerformance) }
            ]}>
              {card.portfolioPerformance > 0 ? '+' : ''}{card.portfolioPerformance}%
            </Text>
            <Text style={[styles.performanceLabel, { color: theme.colors.onSurfaceVariant }]}>
              This month
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.backActionButtons}>
        <TouchableOpacity 
          style={[styles.primaryActionButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onConnect(card.id)}
        >
          <MaterialCommunityIcons name="account-plus" size={20} color="white" />
          <Text style={styles.primaryActionButtonText}>Send Connection Request</Text>
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
  profileInfo: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  lastActive: {
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
  bioContainer: {
    marginBottom: 20,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Graphik-Regular',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  profileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  profileButtonText: {
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
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  achievementText: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'Graphik-Regular',
  },
  performanceContainer: {
    alignItems: 'center',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  performanceLabel: {
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
