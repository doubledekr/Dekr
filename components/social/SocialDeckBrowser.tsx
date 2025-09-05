import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, useTheme, Card, Button, Chip, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { FriendCardData, FriendRequestCard, PublicProfileCard } from '../../types/deck';

interface SocialDeckBrowserProps {
  friends: FriendCardData[];
  friendRequests: FriendRequestCard[];
  publicProfiles: PublicProfileCard[];
  onFriendsDeckSelect?: () => void;
  onFriendRequestsDeckSelect?: () => void;
  onPublicProfilesDeckSelect?: () => void;
}

export function SocialDeckBrowser({ 
  friends, 
  friendRequests,
  publicProfiles,
  onFriendsDeckSelect,
  onFriendRequestsDeckSelect,
  onPublicProfilesDeckSelect 
}: SocialDeckBrowserProps) {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleFriendsDeckPress = () => {
    if (onFriendsDeckSelect) {
      onFriendsDeckSelect();
    } else {
      router.push('/FriendsDeckScreen');
    }
  };

  const handleFriendRequestsDeckPress = () => {
    if (onFriendRequestsDeckSelect) {
      onFriendRequestsDeckSelect();
    } else {
      router.push('/FriendRequestsDeckScreen');
    }
  };

  const handlePublicProfilesDeckPress = () => {
    if (onPublicProfilesDeckSelect) {
      onPublicProfilesDeckSelect();
    } else {
      router.push('/PublicProfilesDeckScreen');
    }
  };

  const renderFriendsDeck = () => (
    <TouchableOpacity
      onPress={handleFriendsDeckPress}
    >
      <Card style={[
        styles.deckCard, 
        { backgroundColor: theme.colors.surface }
      ]}>
        <Card.Content style={styles.deckContent}>
          {/* Header */}
          <View style={styles.deckHeader}>
            <View style={styles.deckInfo}>
              <Text style={[
                styles.deckTitle, 
                { color: theme.colors.onSurface }
              ]}>
                Friends Deck
              </Text>
              <Text style={[
                styles.deckDescription, 
                { color: theme.colors.onSurfaceVariant }
              ]}>
                Connect and interact with your trading friends
              </Text>
            </View>
            <MaterialCommunityIcons name="account-group" size={32} color={theme.colors.primary} />
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                {friends.length} friends
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-check" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                {friends.filter(f => f.status === 'online').length} online
              </Text>
            </View>
          </View>

          {/* Recent Activity Preview */}
          <View style={styles.activityPreview}>
            <Text style={[styles.activityLabel, { color: theme.colors.onSurfaceVariant }]}>
              Recent Activity
            </Text>
            {friends.slice(0, 2).map((friend, index) => (
              <Text key={index} style={[styles.activityText, { color: theme.colors.onSurface }]}>
                {friend.username}: {friend.recentActivity}
              </Text>
            ))}
          </View>

          {/* Action Button */}
          <Button 
            mode="contained" 
            style={[
              styles.startButton,
              { backgroundColor: theme.colors.primary }
            ]}
            icon="account-group"
            onPress={handleFriendsDeckPress}
          >
            Browse Friends
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderFriendRequestsDeck = () => (
    <TouchableOpacity
      onPress={handleFriendRequestsDeckPress}
    >
      <Card style={[
        styles.deckCard, 
        { backgroundColor: theme.colors.surface }
      ]}>
        <Card.Content style={styles.deckContent}>
          {/* Header */}
          <View style={styles.deckHeader}>
            <View style={styles.deckInfo}>
              <Text style={[
                styles.deckTitle, 
                { color: theme.colors.onSurface }
              ]}>
                Friend Requests
              </Text>
              <Text style={[
                styles.deckDescription, 
                { color: theme.colors.onSurfaceVariant }
              ]}>
                Review and respond to friend requests
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              <MaterialCommunityIcons name="account-plus" size={32} color={theme.colors.primary} />
              {friendRequests.length > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.badgeText}>{friendRequests.length}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-plus" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                {friendRequests.length} pending
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                {friendRequests.filter(r => {
                  const hours = (Date.now() - r.sentAt.getTime()) / (1000 * 60 * 60);
                  return hours < 24;
                }).length} recent
              </Text>
            </View>
          </View>

          {/* Recent Requests Preview */}
          <View style={styles.activityPreview}>
            <Text style={[styles.activityLabel, { color: theme.colors.onSurfaceVariant }]}>
              Recent Requests
            </Text>
            {friendRequests.slice(0, 2).map((request, index) => (
              <Text key={index} style={[styles.activityText, { color: theme.colors.onSurface }]}>
                {request.username} wants to connect
              </Text>
            ))}
          </View>

          {/* Action Button */}
          <Button 
            mode="contained" 
            style={[
              styles.startButton,
              { backgroundColor: theme.colors.primary }
            ]}
            icon="account-plus"
            onPress={handleFriendRequestsDeckPress}
          >
            Review Requests
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderPublicProfilesDeck = () => (
    <TouchableOpacity
      onPress={handlePublicProfilesDeckPress}
    >
      <Card style={[
        styles.deckCard, 
        { backgroundColor: theme.colors.surface }
      ]}>
        <Card.Content style={styles.deckContent}>
          {/* Header */}
          <View style={styles.deckHeader}>
            <View style={styles.deckInfo}>
              <Text style={[
                styles.deckTitle, 
                { color: theme.colors.onSurface }
              ]}>
                Community Discovery
              </Text>
              <Text style={[
                styles.deckDescription, 
                { color: theme.colors.onSurfaceVariant }
              ]}>
                Discover and connect with new traders
              </Text>
            </View>
            <MaterialCommunityIcons name="account-search" size={32} color={theme.colors.primary} />
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-multiple" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                {publicProfiles.length} profiles
              </Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="star" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                {publicProfiles.filter(p => p.isExpert).length} experts
              </Text>
            </View>
          </View>

          {/* Featured Profiles Preview */}
          <View style={styles.activityPreview}>
            <Text style={[styles.activityLabel, { color: theme.colors.onSurfaceVariant }]}>
              Featured Members
            </Text>
            {publicProfiles.slice(0, 2).map((profile, index) => (
              <Text key={index} style={[styles.activityText, { color: theme.colors.onSurface }]}>
                {profile.username} - {profile.bio.substring(0, 30)}...
              </Text>
            ))}
          </View>

          {/* Action Button */}
          <Button 
            mode="contained" 
            style={[
              styles.startButton,
              { backgroundColor: theme.colors.primary }
            ]}
            icon="account-search"
            onPress={handlePublicProfilesDeckPress}
          >
            Discover Community
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Social Decks
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Connect and discover the trading community
          </Text>
        </View>

        {/* Social Decks */}
        <View style={styles.decksContainer}>
          {renderFriendsDeck()}
          {renderFriendRequestsDeck()}
          {renderPublicProfilesDeck()}
        </View>

        {/* Empty State */}
        {friends.length === 0 && friendRequests.length === 0 && publicProfiles.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={80}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
              No social content available
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Social features are being prepared
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Graphik-Regular',
  },
  decksContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  deckCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  deckContent: {
    padding: 16,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deckInfo: {
    flex: 1,
    marginRight: 12,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  deckDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  badgeContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Graphik-Bold',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  activityPreview: {
    marginBottom: 16,
  },
  activityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Graphik-Semibold',
  },
  activityText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'Graphik-Regular',
  },
  startButton: {
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
  },
});
