import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeck, useUpdateDeck, useDeleteDeck, useRemoveItemFromDeck } from '../../hooks/useDecks';
import { useCreateShareLink, useShareActions } from '../../hooks/useSharing';
import { DeckItem } from '../../types/firestore';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { PriceChart } from '../../../components/PriceChart';

type DeckDetailRouteProp = RouteProp<{ DeckDetail: { deckId: string } }, 'DeckDetail'>;

interface DeckItemCardProps {
  item: DeckItem;
  onPress: (item: DeckItem) => void;
  onLongPress: (item: DeckItem) => void;
  onRemove: (item: DeckItem) => void;
  isOwner: boolean;
}

const DeckItemCard: React.FC<DeckItemCardProps> = ({ 
  item, 
  onPress, 
  onLongPress, 
  onRemove, 
  isOwner 
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const getChangeColor = (change: number) => {
    return change >= 0 ? '#4CAF50' : '#F44336';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatPercentage = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <TouchableOpacity
      style={[styles.itemCard, { backgroundColor }]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemSymbol, { color: textColor }]}>
            {item.symbol}
          </Text>
          <Text style={[styles.itemName, { color: mutedColor }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.itemMeta}>
            <View style={[
              styles.typeBadge,
              { backgroundColor: item.type === 'stock' ? '#4CAF50' : '#FF9800' }
            ]}>
              <Text style={styles.typeText}>
                {item.type.toUpperCase()}
              </Text>
            </View>
            {item.exchange && (
              <Text style={[styles.exchangeText, { color: mutedColor }]}>
                {item.exchange}
              </Text>
            )}
          </View>
        </View>

        {item.position && (
          <View style={styles.itemStats}>
            <Text style={[styles.priceText, { color: textColor }]}>
              {formatPrice(item.position.currentPrice)}
            </Text>
            <Text style={[
              styles.changeText,
              { color: getChangeColor(item.position.dayChange) }
            ]}>
              {formatPercentage(item.position.dayChangePercent)}
            </Text>
            {item.position.totalReturn !== 0 && (
              <Text style={[
                styles.returnText,
                { color: getChangeColor(item.position.totalReturn) }
              ]}>
                {formatPrice(item.position.totalReturn)}
              </Text>
            )}
          </View>
        )}

        {isOwner && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item)}
          >
            <MaterialCommunityIcons name="close" size={18} color={mutedColor} />
          </TouchableOpacity>
        )}
      </View>

      {item.notes && (
        <Text style={[styles.itemNotes, { color: mutedColor }]} numberOfLines={2}>
          {item.notes}
        </Text>
      )}

      {item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={[styles.tag, { borderColor: mutedColor }]}>
              <Text style={[styles.tagText, { color: mutedColor }]}>
                {tag}
              </Text>
            </View>
          ))}
          {item.tags.length > 3 && (
            <Text style={[styles.moreTagsText, { color: mutedColor }]}>
              +{item.tags.length - 3} more
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export const DeckDetailScreen: React.FC = () => {
  const route = useRoute<DeckDetailRouteProp>();
  const navigation = useNavigation();
  const { deckId } = route.params;

  const [showPerformanceChart, setShowPerformanceChart] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const { deck, loading, error } = useDeck(deckId);
  const { updateDeck } = useUpdateDeck();
  const { deleteDeck } = useDeleteDeck();
  const { removeItemFromDeck } = useRemoveItemFromDeck();
  const { createShareLink, loading: shareLoading } = useCreateShareLink();
  const { shareViaSystem, copyToClipboard, shareViaCode } = useShareActions();

  const isOwner = deck?.ownerId === 'current-user-id'; // TODO: Get from auth context
  const isCollaborator = deck?.collaborators.includes('current-user-id') || false;
  const canEdit = isOwner || isCollaborator;

  const handleItemPress = (item: DeckItem) => {
    navigation.navigate('MarketDetail', { symbol: item.symbol, type: item.type });
  };

  const handleItemLongPress = (item: DeckItem) => {
    const actions = [
      { text: 'View Details', onPress: () => handleItemPress(item) },
      { text: 'Add Note', onPress: () => handleAddNote(item) },
      { text: 'Set Alert', onPress: () => handleSetAlert(item) },
    ];

    if (canEdit) {
      actions.push({
        text: 'Remove from Deck',
        onPress: () => handleRemoveItem(item),
        style: 'destructive' as const,
      });
    }

    actions.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert(item.symbol, 'Choose an action', actions);
  };

  const handleRemoveItem = useCallback(async (item: DeckItem) => {
    if (!deck) return;

    Alert.alert(
      'Remove Item',
      `Remove ${item.symbol} from "${deck.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItemFromDeck(deckId, item.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item from deck');
            }
          },
        },
      ]
    );
  }, [deck, deckId, removeItemFromDeck]);

  const handleAddNote = (item: DeckItem) => {
    navigation.navigate('AddNote', { cardId: item.symbol, symbol: item.symbol });
  };

  const handleSetAlert = (item: DeckItem) => {
    navigation.navigate('CreateAlert', { symbol: item.symbol });
  };

  const handleShareDeck = async () => {
    if (!deck) return;

    const shareOptions = [
      {
        text: 'Share Link',
        onPress: () => handleCreateShareLink('view'),
      },
      {
        text: 'Share for Editing',
        onPress: () => handleCreateShareLink('edit'),
        style: isOwner ? 'default' : 'cancel',
      },
      {
        text: 'Share via Code',
        onPress: () => handleShareViaCode(),
      },
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert(
      'Share Deck',
      `How would you like to share "${deck.title}"?`,
      shareOptions
    );
  };

  const handleCreateShareLink = async (permission: 'view' | 'edit') => {
    if (!deck) return;

    if (permission === 'edit' && !isOwner) {
      Alert.alert('Permission Denied', 'Only deck owners can share with edit permissions.');
      return;
    }

    try {
      const result = await createShareLink({
        type: 'deck',
        targetId: deck.id,
        permission,
        expiresIn: 30, // 30 days
      });

      const message = `Check out "${deck.title}" on Dekr!`;
      
      Alert.alert(
        'Share Created',
        `Your ${permission} link is ready!`,
        [
          {
            text: 'Copy Link',
            onPress: () => copyToClipboard(result.deepLink, 'Share link copied!'),
          },
          {
            text: 'Share Link',
            onPress: () => shareViaSystem(deck.title, result.deepLink, message),
          },
          {
            text: 'Share Code',
            onPress: () => shareViaCode(result.linkCode, deck.title),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create share link. Please try again.');
    }
  };

  const handleShareViaCode = async () => {
    if (!deck) return;

    try {
      const result = await createShareLink({
        type: 'deck',
        targetId: deck.id,
        permission: 'view',
        expiresIn: 7, // 7 days for code sharing
      });

      await shareViaCode(result.linkCode, deck.title);
    } catch (error) {
      Alert.alert('Error', 'Failed to create share code. Please try again.');
    }
  };

  const handleToggleVisibility = async () => {
    if (!deck || !isOwner) return;

    const visibilityOptions = [
      { label: 'Public', value: 'public' as const, icon: 'earth' },
      { label: 'Friends Only', value: 'friends' as const, icon: 'account-group' },
      { label: 'Private', value: 'private' as const, icon: 'lock' },
    ];

    const buttons = visibilityOptions.map(option => ({
      text: `${option.label} ${deck.visibility === option.value ? '✓' : ''}`,
      onPress: async () => {
        if (option.value !== deck.visibility) {
          try {
            await updateDeck(deckId, { visibility: option.value });
          } catch (error) {
            Alert.alert('Error', 'Failed to update deck visibility');
          }
        }
      },
    }));

    buttons.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert('Deck Visibility', 'Choose who can see this deck', buttons);
  };

  const handleInviteCollaborator = () => {
    // TODO: Implement invite collaborator functionality
    Alert.alert('Invite Collaborator', 'Feature coming soon!');
  };

  const handleEditDeck = () => {
    navigation.navigate('CreateDeck', { deckId });
  };

  const handleDeleteDeck = () => {
    if (!deck || !isOwner) return;

    Alert.alert(
      'Delete Deck',
      `Are you sure you want to delete "${deck.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeck(deckId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete deck');
            }
          },
        },
      ]
    );
  };

  const handleAddItems = () => {
    navigation.navigate('AddToDeck', { deckId });
  };

  const renderHeader = () => {
    if (!deck) return null;

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
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.deckTitle, { color: textColor }]}>
            {deck.title}
          </Text>
          <View style={styles.deckMeta}>
            <MaterialCommunityIcons 
              name={getVisibilityIcon()} 
              size={16} 
              color={mutedColor} 
            />
            <View 
              style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}
            >
              <Text style={styles.categoryText}>
                {deck.category.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {deck.description && (
          <Text style={[styles.deckDescription, { color: mutedColor }]}>
            {deck.description}
          </Text>
        )}

        {deck.performance && (
          <View style={styles.performanceSection}>
            <TouchableOpacity
              style={styles.performanceHeader}
              onPress={() => setShowPerformanceChart(!showPerformanceChart)}
            >
              <Text style={[styles.performanceTitle, { color: textColor }]}>
                Performance
              </Text>
              <MaterialCommunityIcons
                name={showPerformanceChart ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={mutedColor}
              />
            </TouchableOpacity>
            
            <View style={styles.performanceStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: mutedColor }]}>
                  Total Return
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: deck.performance.totalReturn >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {deck.performance.totalReturnPercent.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: mutedColor }]}>
                  Day Change
                </Text>
                <Text style={[
                  styles.statValue,
                  { color: deck.performance.dayChange >= 0 ? '#4CAF50' : '#F44336' }
                ]}>
                  {deck.performance.dayChangePercent.toFixed(2)}%
                </Text>
              </View>
            </View>

            {showPerformanceChart && (
              <View style={styles.chartContainer}>
                <PriceChart
                  data={[]} // TODO: Add historical performance data
                  height={200}
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: tintColor }]}
            onPress={handleShareDeck}
          >
            <MaterialCommunityIcons name="share" size={20} color="white" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          {canEdit && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: tintColor }]}
              onPress={handleAddItems}
            >
              <MaterialCommunityIcons name="plus" size={20} color="white" />
              <Text style={styles.actionButtonText}>Add Items</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: DeckItem }) => (
    <DeckItemCard
      item={item}
      onPress={handleItemPress}
      onLongPress={handleItemLongPress}
      onRemove={handleRemoveItem}
      isOwner={canEdit}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="cards-outline" size={64} color={mutedColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        No Items in Deck
      </Text>
      <Text style={[styles.emptyMessage, { color: mutedColor }]}>
        {canEdit
          ? 'Add stocks or crypto to start building your deck'
          : 'This deck is currently empty'
        }
      </Text>
      {canEdit && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: tintColor }]}
          onPress={handleAddItems}
        >
          <MaterialCommunityIcons name="plus" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Items</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  React.useLayoutEffect(() => {
    if (deck) {
      navigation.setOptions({
        title: deck.title,
        headerRight: () => (
          <View style={styles.headerActions}>
            {isOwner && (
              <>
                <TouchableOpacity onPress={handleToggleVisibility}>
                  <MaterialCommunityIcons
                    name={deck.visibility === 'public' ? 'earth' : 
                          deck.visibility === 'friends' ? 'account-group' : 'lock'}
                    size={24}
                    color={tintColor}
                    style={{ marginRight: 16 }}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleEditDeck}>
                  <MaterialCommunityIcons
                    name="pencil"
                    size={24}
                    color={tintColor}
                    style={{ marginRight: 16 }}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>
        ),
      });
    }
  }, [navigation, deck, isOwner, tintColor]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (error || !deck) {
    return (
      <ThemedView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color={mutedColor} />
        <Text style={[styles.errorTitle, { color: textColor }]}>
          Deck Not Found
        </Text>
        <Text style={[styles.errorMessage, { color: mutedColor }]}>
          This deck may have been deleted or you don't have permission to view it.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: tintColor }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={deck.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  titleSection: {
    marginBottom: 12,
  },
  deckTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deckMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  deckDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  performanceSection: {
    marginBottom: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  performanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartContainer: {
    marginTop: 16,
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
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemSymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 14,
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  exchangeText: {
    fontSize: 12,
  },
  itemStats: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  returnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  itemNotes: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
  },
  moreTagsText: {
    fontSize: 12,
    fontStyle: 'italic',
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
