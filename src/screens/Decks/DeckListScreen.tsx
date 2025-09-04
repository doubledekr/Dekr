import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMyDecks, usePublicDecks } from '../../hooks/useDecks';
import { Deck } from '../../types/firestore';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type TabType = 'my' | 'public' | 'shared';

interface DeckCardProps {
  deck: Deck;
  onPress: (deck: Deck) => void;
  onLongPress?: (deck: Deck) => void;
}

const DeckCard: React.FC<DeckCardProps> = ({ deck, onPress, onLongPress }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const getVisibilityIcon = () => {
    switch (deck.visibility) {
      case 'public': return 'earth';
      case 'friends': return 'account-group';
      case 'private': return 'lock';
      default: return 'lock';
    }
  };

  const getCategoryColor = () => {
    switch (deck.category) {
      case 'stocks': return '#4CAF50';
      case 'crypto': return '#FF9800';
      case 'mixed': return '#9C27B0';
      case 'watchlist': return '#2196F3';
      default: return mutedColor;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.deckCard, { backgroundColor }]}
      onPress={() => onPress(deck)}
      onLongPress={() => onLongPress?.(deck)}
      activeOpacity={0.7}
    >
      <View style={styles.deckHeader}>
        <View style={styles.deckTitleContainer}>
          <Text style={[styles.deckTitle, { color: textColor }]} numberOfLines={2}>
            {deck.title}
          </Text>
          <View style={styles.deckMeta}>
            <MaterialCommunityIcons 
              name={getVisibilityIcon()} 
              size={14} 
              color={mutedColor} 
            />
            <View 
              style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}
            >
              <Text style={styles.categoryText}>{deck.category.toUpperCase()}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.deckStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="cards" size={16} color={mutedColor} />
            <Text style={[styles.statText, { color: mutedColor }]}>
              {deck.itemCount}
            </Text>
          </View>
          {deck.performance && (
            <View style={styles.statItem}>
              <MaterialCommunityIcons 
                name={deck.performance.dayChangePercent >= 0 ? 'trending-up' : 'trending-down'} 
                size={16} 
                color={deck.performance.dayChangePercent >= 0 ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[
                styles.statText, 
                { color: deck.performance.dayChangePercent >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {deck.performance.dayChangePercent.toFixed(2)}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {deck.description && (
        <Text 
          style={[styles.deckDescription, { color: mutedColor }]} 
          numberOfLines={2}
        >
          {deck.description}
        </Text>
      )}

      <View style={styles.deckFooter}>
        <Text style={[styles.ownerText, { color: mutedColor }]}>
          by {deck.ownerName}
        </Text>
        <View style={styles.deckActions}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="eye" size={14} color={mutedColor} />
            <Text style={[styles.statText, { color: mutedColor }]}>
              {deck.viewsCount || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="heart" size={14} color={mutedColor} />
            <Text style={[styles.statText, { color: mutedColor }]}>
              {deck.likesCount || 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const DeckListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const { 
    decks: myDecks, 
    loading: myDecksLoading, 
    error: myDecksError,
    refetch: refetchMyDecks 
  } = useMyDecks();

  const { 
    decks: publicDecks, 
    loading: publicDecksLoading, 
    error: publicDecksError,
    refetch: refetchPublicDecks 
  } = usePublicDecks();

  const getCurrentDecks = () => {
    switch (activeTab) {
      case 'my': return myDecks;
      case 'public': return publicDecks;
      case 'shared': return myDecks.filter(deck => deck.collaborators.length > 0);
      default: return [];
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'my': return myDecksLoading;
      case 'public': return publicDecksLoading;
      case 'shared': return myDecksLoading;
      default: return false;
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'my' || activeTab === 'shared') {
        await refetchMyDecks();
      } else if (activeTab === 'public') {
        await refetchPublicDecks();
      }
    } catch (error) {
      console.error('Error refreshing decks:', error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab, refetchMyDecks, refetchPublicDecks]);

  const handleDeckPress = (deck: Deck) => {
    navigation.navigate('DeckDetail', { deckId: deck.id });
  };

  const handleDeckLongPress = (deck: Deck) => {
    // Show context menu for deck actions
    Alert.alert(
      deck.title,
      'Choose an action',
      [
        { text: 'View Details', onPress: () => handleDeckPress(deck) },
        { text: 'Share', onPress: () => handleShareDeck(deck) },
        ...(deck.ownerId === 'current-user-id' ? [
          { text: 'Edit', onPress: () => handleEditDeck(deck) },
          { text: 'Delete', onPress: () => handleDeleteDeck(deck), style: 'destructive' as const },
        ] : []),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const handleShareDeck = (deck: Deck) => {
    // TODO: Implement share functionality
    Alert.alert('Share Deck', `Sharing "${deck.title}" - Feature coming soon!`);
  };

  const handleEditDeck = (deck: Deck) => {
    navigation.navigate('CreateDeck', { deckId: deck.id });
  };

  const handleDeleteDeck = (deck: Deck) => {
    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete functionality
            console.log('Deleting deck:', deck.id);
          }
        },
      ]
    );
  };

  const handleCreateDeck = () => {
    navigation.navigate('CreateDeck');
  };

  const renderTabButton = (tab: TabType, label: string, icon: string) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        { borderBottomColor: activeTab === tab ? tintColor : 'transparent' }
      ]}
      onPress={() => setActiveTab(tab)}
    >
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
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="folder-outline" size={64} color={mutedColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        {activeTab === 'my' ? 'No Decks Yet' : 'No Decks Found'}
      </Text>
      <Text style={[styles.emptyMessage, { color: mutedColor }]}>
        {activeTab === 'my' 
          ? 'Create your first deck to start organizing your investments'
          : 'Check back later for new public decks'
        }
      </Text>
      {activeTab === 'my' && (
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: tintColor }]}
          onPress={handleCreateDeck}
        >
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Deck</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDeckItem = ({ item }: { item: Deck }) => (
    <DeckCard
      deck={item}
      onPress={handleDeckPress}
      onLongPress={handleDeckLongPress}
    />
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textColor }]}>Decks</Text>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: tintColor }]}
          onPress={handleCreateDeck}
        >
          <MaterialCommunityIcons name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {renderTabButton('my', 'My Decks', 'folder')}
        {renderTabButton('public', 'Discover', 'earth')}
        {renderTabButton('shared', 'Shared', 'account-group')}
      </View>

      {getCurrentLoading() && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
        </View>
      ) : (
        <FlatList
          data={getCurrentDecks()}
          keyExtractor={(item) => item.id}
          renderItem={renderDeckItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
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
  headerButton: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
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
  deckCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deckTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  deckMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  deckStats: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deckDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  deckFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerText: {
    fontSize: 12,
  },
  deckActions: {
    flexDirection: 'row',
    gap: 12,
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
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
