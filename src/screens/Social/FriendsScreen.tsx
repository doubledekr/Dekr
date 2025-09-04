import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFriendRequests, useMyFriends, useSearchUsers, useSendFriendRequest, useRespondToFriendRequest } from '../../hooks/useFriends';
import { FriendEdge, UserProfile } from '../../types/firestore';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type TabType = 'requests' | 'friends' | 'find';

interface FriendRequestItemProps {
  request: FriendEdge;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  loading: boolean;
}

interface FriendItemProps {
  friend: UserProfile;
  onMessage?: (friend: UserProfile) => void;
  onViewProfile?: (friend: UserProfile) => void;
}

interface SearchResultItemProps {
  user: UserProfile;
  onSendRequest: (userId: string) => void;
  loading: boolean;
  alreadyFriends: boolean;
  requestSent: boolean;
}

const FriendRequestItem: React.FC<FriendRequestItemProps> = ({
  request,
  onAccept,
  onDecline,
  loading,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  const formatTimestamp = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }, []);

  return (
    <View style={[styles.requestItem, { backgroundColor }]}>
      <View style={styles.requestInfo}>
        <View style={styles.avatar}>
          {request.fromUserPhoto ? (
            <Image source={{ uri: request.fromUserPhoto }} style={styles.avatarImage} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={48} color={mutedColor} />
          )}
        </View>
        
        <View style={styles.requestDetails}>
          <Text style={[styles.userName, { color: textColor }]}>
            {request.fromUserName}
          </Text>
          <Text style={[styles.requestTime, { color: mutedColor }]}>
            Sent {formatTimestamp(request.requestedAt)}
          </Text>
          {request.mutualFriendsCount && request.mutualFriendsCount > 0 && (
            <Text style={[styles.mutualFriends, { color: mutedColor }]}>
              {request.mutualFriendsCount} mutual friends
            </Text>
          )}
        </View>
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: tintColor }]}
          onPress={() => onAccept(request.id)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialCommunityIcons name="check" size={20} color="white" />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.declineButton, { borderColor: mutedColor }]}
          onPress={() => onDecline(request.id)}
          disabled={loading}
        >
          <MaterialCommunityIcons name="close" size={20} color={mutedColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FriendItem: React.FC<FriendItemProps> = ({
  friend,
  onMessage,
  onViewProfile,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const formatLastActive = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);

    if (days > 7) return 'Active over a week ago';
    if (days > 0) return `Active ${days}d ago`;
    if (hours > 0) return `Active ${hours}h ago`;
    return 'Active recently';
  }, []);

  return (
    <TouchableOpacity
      style={[styles.friendItem, { backgroundColor }]}
      onPress={() => onViewProfile?.(friend)}
      activeOpacity={0.7}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          {friend.photoURL ? (
            <Image source={{ uri: friend.photoURL }} style={styles.avatarImage} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={48} color={mutedColor} />
          )}
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={[styles.userName, { color: textColor }]}>
            {friend.displayName}
          </Text>
          {friend.bio && (
            <Text style={[styles.userBio, { color: mutedColor }]} numberOfLines={1}>
              {friend.bio}
            </Text>
          )}
          <Text style={[styles.lastActive, { color: mutedColor }]}>
            {formatLastActive(friend.lastActiveAt)}
          </Text>
        </View>
      </View>

      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onMessage?.(friend)}
        >
          <MaterialCommunityIcons name="message" size={20} color={mutedColor} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onViewProfile?.(friend)}
        >
          <MaterialCommunityIcons name="account" size={20} color={mutedColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  user,
  onSendRequest,
  loading,
  alreadyFriends,
  requestSent,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  const getButtonContent = () => {
    if (loading) return <ActivityIndicator size="small" color="white" />;
    if (alreadyFriends) return <MaterialCommunityIcons name="check" size={16} color="white" />;
    if (requestSent) return <MaterialCommunityIcons name="clock" size={16} color="white" />;
    return <MaterialCommunityIcons name="account-plus" size={16} color="white" />;
  };

  const getButtonText = () => {
    if (alreadyFriends) return 'Friends';
    if (requestSent) return 'Sent';
    return 'Add';
  };

  const getButtonColor = () => {
    if (alreadyFriends) return '#4CAF50';
    if (requestSent) return mutedColor;
    return tintColor;
  };

  return (
    <View style={[styles.searchItem, { backgroundColor }]}>
      <View style={styles.searchInfo}>
        <View style={styles.avatar}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={48} color={mutedColor} />
          )}
        </View>
        
        <View style={styles.searchDetails}>
          <Text style={[styles.userName, { color: textColor }]}>
            {user.displayName}
          </Text>
          {user.bio && (
            <Text style={[styles.userBio, { color: mutedColor }]} numberOfLines={2}>
              {user.bio}
            </Text>
          )}
          <View style={styles.userStats}>
            <Text style={[styles.statText, { color: mutedColor }]}>
              {user.followersCount} followers
            </Text>
            <Text style={[styles.statText, { color: mutedColor }]}>
              {user.decksCount} decks
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.addButton,
          { 
            backgroundColor: getButtonColor(),
            opacity: (alreadyFriends || requestSent || loading) ? 0.7 : 1,
          }
        ]}
        onPress={() => onSendRequest(user.uid)}
        disabled={alreadyFriends || requestSent || loading}
      >
        {getButtonContent()}
        <Text style={styles.addButtonText}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export const FriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  // Hooks
  const { requests, loading: requestsLoading, refetch: refetchRequests } = useFriendRequests();
  const { friends, loading: friendsLoading, refetch: refetchFriends } = useMyFriends();
  const { users: searchResults, loading: searchLoading, search } = useSearchUsers();
  const { sendFriendRequest, loading: sendRequestLoading } = useSendFriendRequest();
  const { respondToFriendRequest, loading: respondLoading } = useRespondToFriendRequest();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'requests') {
        await refetchRequests();
      } else if (activeTab === 'friends') {
        await refetchFriends();
      }
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchRequests, refetchFriends]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      search(query.trim());
    }
  }, [search]);

  const handleSendFriendRequest = useCallback(async (toUserId: string) => {
    try {
      await sendFriendRequest(toUserId);
      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    }
  }, [sendFriendRequest]);

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    try {
      await respondToFriendRequest(requestId, 'accepted');
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    }
  }, [respondToFriendRequest]);

  const handleDeclineRequest = useCallback(async (requestId: string) => {
    try {
      await respondToFriendRequest(requestId, 'declined');
    } catch (error) {
      Alert.alert('Error', 'Failed to decline friend request. Please try again.');
    }
  }, [respondToFriendRequest]);

  const handleMessageFriend = useCallback((friend: UserProfile) => {
    // TODO: Navigate to chat with friend
    Alert.alert('Message', `Start a conversation with ${friend.displayName}`);
  }, []);

  const handleViewProfile = useCallback((user: UserProfile) => {
    navigation.navigate('UserProfile', { userId: user.uid });
  }, [navigation]);

  const renderTabButton = (tab: TabType, label: string, icon: string, badgeCount?: number) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        { borderBottomColor: activeTab === tab ? tintColor : 'transparent' }
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <View style={styles.tabContent}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={activeTab === tab ? tintColor : mutedColor}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === tab ? tintColor : mutedColor }
          ]}
        >
          {label}
        </Text>
        {badgeCount && badgeCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#F44336' }]}>
            <Text style={styles.badgeText}>
              {badgeCount > 99 ? '99+' : badgeCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRequestItem = ({ item }: { item: FriendEdge }) => (
    <FriendRequestItem
      request={item}
      onAccept={handleAcceptRequest}
      onDecline={handleDeclineRequest}
      loading={respondLoading}
    />
  );

  const renderFriendItem = ({ item }: { item: UserProfile }) => (
    <FriendItem
      friend={item}
      onMessage={handleMessageFriend}
      onViewProfile={handleViewProfile}
    />
  );

  const renderSearchItem = ({ item }: { item: UserProfile }) => {
    const alreadyFriends = friends.some(friend => friend.uid === item.uid);
    const requestSent = requests.some(request => request.toUserId === item.uid && request.status === 'pending');
    
    return (
      <SearchResultItem
        user={item}
        onSendRequest={handleSendFriendRequest}
        loading={sendRequestLoading}
        alreadyFriends={alreadyFriends}
        requestSent={requestSent}
      />
    );
  };

  const renderEmptyState = () => {
    let icon, title, message;
    
    switch (activeTab) {
      case 'requests':
        icon = 'account-clock';
        title = 'No Friend Requests';
        message = 'When people send you friend requests, they\'ll appear here';
        break;
      case 'friends':
        icon = 'account-group';
        title = 'No Friends Yet';
        message = 'Start connecting with other users by searching for them';
        break;
      case 'find':
        icon = 'magnify';
        title = searchQuery ? 'No Users Found' : 'Search for Friends';
        message = searchQuery 
          ? 'Try searching with a different name or email'
          : 'Search by name or email to find and connect with other users';
        break;
    }

    return (
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name={icon} size={64} color={mutedColor} />
        <Text style={[styles.emptyTitle, { color: textColor }]}>
          {title}
        </Text>
        <Text style={[styles.emptyMessage, { color: mutedColor }]}>
          {message}
        </Text>
      </View>
    );
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'requests': return requests;
      case 'friends': return friends;
      case 'find': return searchResults;
      default: return [];
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'requests': return requestsLoading;
      case 'friends': return friendsLoading;
      case 'find': return searchLoading;
      default: return false;
    }
  };

  const getCurrentRenderItem = () => {
    switch (activeTab) {
      case 'requests': return renderRequestItem;
      case 'friends': return renderFriendItem;
      case 'find': return renderSearchItem;
      default: return renderFriendItem;
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Friends</Text>
        <TouchableOpacity
          style={[styles.shareCodeButton, { backgroundColor: tintColor }]}
          onPress={() => navigation.navigate('ShareCode')}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {renderTabButton('requests', 'Requests', 'account-clock', requests.length)}
        {renderTabButton('friends', 'Friends', 'account-group')}
        {renderTabButton('find', 'Find', 'magnify')}
      </View>

      {activeTab === 'find' && (
        <View style={styles.searchContainer}>
          <View style={[styles.searchInput, { backgroundColor, borderColor: mutedColor }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={mutedColor} />
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search by name or email..."
              placeholderTextColor={mutedColor}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <MaterialCommunityIcons name="close" size={20} color={mutedColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {getCurrentLoading() && getCurrentData().length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <FlatList
          data={getCurrentData()}
          keyExtractor={(item) => 'uid' in item ? item.uid : item.id}
          renderItem={getCurrentRenderItem()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            activeTab !== 'find' ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={tintColor}
              />
            ) : undefined
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </ThemedView>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  shareCodeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  requestDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  mutualFriends: {
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  friendInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendDetails: {
    flex: 1,
  },
  userBio: {
    fontSize: 14,
    marginBottom: 2,
  },
  lastActive: {
    fontSize: 12,
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchDetails: {
    flex: 1,
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
