import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Searchbar, useTheme, Text, ActivityIndicator, Chip, Button } from 'react-native-paper';
import { MarketCard } from '../../components/MarketCard';
import { searchMarketData } from '../../services/market-data';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { safeHapticNotification } from '../../utils/haptics';

type FilterType = 'all' | 'stocks' | 'crypto';

export default function SearchScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    return () => {
      Keyboard.dismiss();
    };
  }, []);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      console.log('Searching for:', query);
      const results = await searchMarketData(query);
      console.log('Search results:', results);
      const filteredResults = filter === 'all' 
        ? results
        : results.filter(item => item.type === filter);
      console.log('Filtered results:', filteredResults);
      setSearchResults(filteredResults);
      setHasSearched(true);
      safeHapticNotification();
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
      safeHapticNotification();
    } finally {
      setIsSearching(false);
    }
  }, [filter]);

  const handleSearch = () => {
    Keyboard.dismiss();
    performSearch(searchQuery);
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setHasSearched(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Animated.View 
      entering={FadeIn} 
      layout={Layout.springify()}
      style={styles.cardContainer}
    >
      <MarketCard data={item} />
    </Animated.View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search stocks or crypto..."
            value={searchQuery}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
            iconColor={theme.colors.primary}
            inputStyle={{ color: theme.colors.onBackground }}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
          <Button 
            mode="contained"
            onPress={handleSearch}
            style={styles.searchButton}
            contentStyle={styles.searchButtonContent}
            loading={isSearching}
          >
            Search
          </Button>
        </View>

        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          </View>
        ) : hasSearched && !searchResults.length ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>
              No results found for "{searchQuery}"
            </Text>
          </View>
        ) : !hasSearched ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>
              Enter a search term to find stocks or cryptocurrencies
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    borderRadius: 12,
  },
  searchButton: {
    borderRadius: 12,
    minWidth: 100,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonContent: {
    height: 50,
    paddingHorizontal: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  cardContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
}); 