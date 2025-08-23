import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, useTheme, Searchbar, Avatar, List, Button, Divider, ActivityIndicator, Chip } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import firestore from '@react-native-firebase/firestore';
import * as Haptics from 'expo-haptics';

interface UserProfile {
  id: string;
  displayName: string;
  photoURL: string | null;
  bio?: string;
  followersCount: number;
  followingCount: number;
}

export default function SocialScreen() {
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');

  // Load following and followers
  const loadSocialData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Get following
      const followingSnapshot = await firestore()
        .collection('following')
        .doc(user.uid)
        .collection('users')
        .get();

      const followingIds = followingSnapshot.docs.map(doc => doc.id);
      
      // Get followers
      const followersSnapshot = await firestore()
        .collection('followers')
        .doc(user.uid)
        .collection('users')
        .get();

      const followersIds = followersSnapshot.docs.map(doc => doc.id);

      // Get user profiles for following
      const followingProfiles = await Promise.all(
        followingIds.map(async (id) => {
          const userDoc = await firestore().collection('users').doc(id).get();
          return {
            ...userDoc.data(),
            id
          } as UserProfile;
        })
      );

      // Get user profiles for followers
      const followerProfiles = await Promise.all(
        followersIds.map(async (id) => {
          const userDoc = await firestore().collection('users').doc(id).get();
          return {
            ...userDoc.data(),
            id
          } as UserProfile;
        })
      );

      setFollowing(followingProfiles);
      setFollowers(followerProfiles);
      
      // Load suggested users if following list is empty
      if (followingProfiles.length === 0) {
        loadSuggestedUsers();
      }
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load suggested users
  const loadSuggestedUsers = useCallback(async () => {
    if (!user) return;

    try {
      // Get some random users to suggest
      const usersSnapshot = await firestore()
        .collection('users')
        .limit(10)
        .get();

      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserProfile));
      
      // Filter out current user and users already followed
      const suggested = allUsers.filter(
        u => u.id !== user.uid && !following.some(f => f.id === u.id)
      );
      
      setSuggestedUsers(suggested);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  }, [user, following]);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      const usersSnapshot = await firestore()
        .collection('users')
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(10)
        .get();

      const results = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as UserProfile));

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userToFollow: UserProfile) => {
    if (!user) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Create user document for current user if it doesn't exist
      const currentUserDoc = await firestore().collection('users').doc(user.uid).get();
      if (!currentUserDoc.exists) {
        await firestore().collection('users').doc(user.uid).set({
          displayName: user.displayName || 'User',
          photoURL: user.photoURL,
          followersCount: 0,
          followingCount: 0
        });
      }
      
      // Add to following collection
      await firestore()
        .collection('following')
        .doc(user.uid)
        .collection('users')
        .doc(userToFollow.id)
        .set({
          timestamp: firestore.FieldValue.serverTimestamp()
        });

      // Add to their followers collection
      await firestore()
        .collection('followers')
        .doc(userToFollow.id)
        .collection('users')
        .doc(user.uid)
        .set({
          timestamp: firestore.FieldValue.serverTimestamp()
        });

      // Update counts
      await firestore().collection('users').doc(user.uid).update({
        followingCount: firestore.FieldValue.increment(1)
      });

      await firestore().collection('users').doc(userToFollow.id).update({
        followersCount: firestore.FieldValue.increment(1)
      });

      // Immediately update the local state before refreshing
      setFollowing(prev => [...prev, userToFollow]);
      
      // Refresh data
      loadSocialData();
    } catch (error) {
      console.error('Error following user:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleUnfollow = async (userToUnfollow: UserProfile) => {
    if (!user) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Remove from following collection
      await firestore()
        .collection('following')
        .doc(user.uid)
        .collection('users')
        .doc(userToUnfollow.id)
        .delete();

      // Remove from their followers collection
      await firestore()
        .collection('followers')
        .doc(userToUnfollow.id)
        .collection('users')
        .doc(user.uid)
        .delete();

      // Update counts
      await firestore().collection('users').doc(user.uid).update({
        followingCount: firestore.FieldValue.increment(-1)
      });

      await firestore().collection('users').doc(userToUnfollow.id).update({
        followersCount: firestore.FieldValue.increment(-1)
      });

      // Refresh data
      loadSocialData();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSocialData();
    setIsRefreshing(false);
  };

  const renderUserItem = (userProfile: UserProfile, isFollowing: boolean) => (
    <List.Item
      title={userProfile.displayName}
      description={userProfile.bio}
      left={() => (
        <Avatar.Image
          size={40}
          source={
            userProfile.photoURL
              ? { uri: userProfile.photoURL }
              : require('../../assets/images/default-avatar.png')
          }
        />
      )}
      right={() => (
        <Button
          mode={isFollowing ? "outlined" : "contained"}
          onPress={() => isFollowing ? handleUnfollow(userProfile) : handleFollow(userProfile)}
          style={styles.followButton}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </Button>
      )}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={() => handleSearch(searchQuery)}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.tabContainer}>
        <Chip
          selected={activeTab === 'following'}
          onPress={() => setActiveTab('following')}
          style={styles.tab}
        >
          Following ({following.length})
        </Chip>
        <Chip
          selected={activeTab === 'followers'}
          onPress={() => setActiveTab('followers')}
          style={styles.tab}
        >
          Followers ({followers.length})
        </Chip>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {searchQuery ? (
          <View style={styles.searchResults}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {isLoading ? (
              <ActivityIndicator style={styles.loading} />
            ) : (
              searchResults.map(userProfile => (
                <React.Fragment key={userProfile.id}>
                  {renderUserItem(
                    userProfile,
                    following.some(f => f.id === userProfile.id)
                  )}
                  <Divider />
                </React.Fragment>
              ))
            )}
          </View>
        ) : (
          <View style={styles.lists}>
            {activeTab === 'following' ? (
              following.length > 0 ? (
                following.map(userProfile => (
                  <React.Fragment key={userProfile.id}>
                    {renderUserItem(userProfile, true)}
                    <Divider />
                  </React.Fragment>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>You aren't following anyone yet</Text>
                  {suggestedUsers.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Suggested Users</Text>
                      {suggestedUsers.map(userProfile => (
                        <React.Fragment key={userProfile.id}>
                          {renderUserItem(userProfile, false)}
                          <Divider />
                        </React.Fragment>
                      ))}
                    </>
                  )}
                </View>
              )
            ) : (
              followers.length > 0 ? (
                followers.map(userProfile => (
                  <React.Fragment key={userProfile.id}>
                    {renderUserItem(
                      userProfile,
                      following.some(f => f.id === userProfile.id)
                    )}
                    <Divider />
                  </React.Fragment>
                ))
              ) : (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>You don't have any followers yet</Text>
                </View>
              )
            )}
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
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    elevation: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    marginHorizontal: 8,
  },
  searchResults: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginVertical: 8,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  loading: {
    marginTop: 20,
  },
  followButton: {
    marginLeft: 8,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    fontFamily: 'Graphik-Regular',
    opacity: 0.7,
  },
  lists: {
    flex: 1,
  }
}); 