import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAddItemToDeck } from '../../hooks/useDecks';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type AddToDeckRouteProp = RouteProp<{ AddToDeck: { deckId: string } }, 'AddToDeck'>;

interface SearchResult {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  exchange?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  marketCap?: number;
  volume?: number;
}

interface SearchResultItemProps {
  item: SearchResult;
  onPress: (item: SearchResult) => void;
  isAdding: boolean;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ 
  item, 
  onPress, 
  isAdding 
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? '#4CAF50' : '#F44336';
  };

  return (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor }]}
      onPress={() => onPress(item)}
      disabled={isAdding}
      activeOpacity={0.7}
    >
      <View style={styles.resultInfo}>
        <View style={styles.resultHeader}>
          <Text style={[styles.resultSymbol, { color: textColor }]}>
            {item.symbol}
          </Text>
          <View style={[
            styles.typeBadge,
            { backgroundColor: item.type === 'stock' ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.typeText}>
              {item.type.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.resultName, { color: mutedColor }]} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.exchange && (
          <Text style={[styles.exchangeText, { color: mutedColor }]}>
            {item.exchange}
          </Text>
        )}
      </View>

      <View style={styles.resultStats}>
        {item.price && (
          <Text style={[styles.priceText, { color: textColor }]}>
            {formatPrice(item.price)}
          </Text>
        )}
        
        {item.changePercent !== undefined && (
          <Text style={[
            styles.changeText,
            { color: getChangeColor(item.changePercent) }
          ]}>
            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
          </Text>
        )}
        
        {item.marketCap && (
          <Text style={[styles.marketCapText, { color: mutedColor }]}>
            {formatMarketCap(item.marketCap)}
          </Text>
        )}
      </View>

      <View style={styles.addButton}>
        {isAdding ? (
          <ActivityIndicator size="small" color={tintColor} />
        ) : (
          <MaterialCommunityIcons name="plus" size={24} color={tintColor} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export const AddToDeckSheet: React.FC = () => {
  const route = useRoute<AddToDeckRouteProp>();
  const navigation = useNavigation();
  const { deckId } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingItems, setAddingItems] = useState<Set<string>>(new Set());

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const { addItemToDeck } = useAddItemToDeck();

  // Mock popular assets for initial display
  const popularAssets: SearchResult[] = useMemo(() => [
    {
      id: 'AAPL',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      type: 'stock',
      exchange: 'NASDAQ',
      price: 175.43,
      changePercent: 1.25,
      marketCap: 2800000000000,
    },
    {
      id: 'BTC',
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'crypto',
      price: 43250.00,
      changePercent: -2.15,
      marketCap: 845000000000,
    },
    {
      id: 'TSLA',
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      type: 'stock',
      exchange: 'NASDAQ',
      price: 248.87,
      changePercent: 3.42,
      marketCap: 790000000000,
    },
    {
      id: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      type: 'crypto',
      price: 2650.75,
      changePercent: 1.87,
      marketCap: 318000000000,
    },
    {
      id: 'GOOGL',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      type: 'stock',
      exchange: 'NASDAQ',
      price: 142.56,
      changePercent: 0.95,
      marketCap: 1800000000000,
    },
    {
      id: 'MSFT',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      type: 'stock',
      exchange: 'NASDAQ',
      price: 378.85,
      changePercent: 2.10,
      marketCap: 2810000000000,
    },
  ], []);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(popularAssets);
      return;
    }

    setIsSearching(true);
    
    try {
      // TODO: Replace with actual search API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
      const mockResults = popularAssets.filter(asset =>
        asset.symbol.toLowerCase().includes(query.toLowerCase()) ||
        asset.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search assets. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [popularAssets]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    performSearch(text);
  }, [performSearch]);

  const handleAddItem = useCallback(async (item: SearchResult) => {
    setAddingItems(prev => new Set(prev).add(item.id));
    
    try {
      await addItemToDeck(deckId, {
        symbol: item.symbol,
        name: item.name,
        type: item.type,
        exchange: item.exchange,
        notes: '',
        tags: [],
        alertsEnabled: false,
      });
      
      Alert.alert(
        'Success',
        `${item.symbol} has been added to your deck!`,
        [
          {
            text: 'Add Another',
            style: 'default',
          },
          {
            text: 'View Deck',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error adding item to deck:', error);
      Alert.alert(
        'Error',
        `Failed to add ${item.symbol} to deck. Please try again.`
      );
    } finally {
      setAddingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  }, [deckId, addItemToDeck, navigation]);

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <SearchResultItem
      item={item}
      onPress={handleAddItem}
      isAdding={addingItems.has(item.id)}
    />
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (searchQuery.trim() && searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="magnify" size={64} color={mutedColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>
            No Results Found
          </Text>
          <Text style={[styles.emptyMessage, { color: mutedColor }]}>
            Try searching for a different stock symbol or cryptocurrency
          </Text>
        </View>
      );
    }

    return null;
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add to Deck',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color={tintColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, tintColor]);

  // Initialize with popular assets
  React.useEffect(() => {
    setSearchResults(popularAssets);
  }, [popularAssets]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor, borderColor: mutedColor }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={mutedColor} />
          <TextInput
            style={[styles.textInput, { color: textColor }]}
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholder="Search stocks or crypto..."
            placeholderTextColor={mutedColor}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <MaterialCommunityIcons name="close" size={20} color={mutedColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!searchQuery.trim() && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Popular Assets
          </Text>
          <Text style={[styles.sectionSubtitle, { color: mutedColor }]}>
            Trending stocks and cryptocurrencies
          </Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={renderSearchResult}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
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
  sectionHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultInfo: {
    flex: 1,
    marginRight: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  resultSymbol: {
    fontSize: 18,
    fontWeight: '600',
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
  resultName: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  exchangeText: {
    fontSize: 12,
  },
  resultStats: {
    alignItems: 'flex-end',
    marginRight: 12,
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
  marketCapText: {
    fontSize: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
