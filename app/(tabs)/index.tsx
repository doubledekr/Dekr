import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Share, Platform, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Swiper from 'react-native-deck-swiper';
import { useTheme, FAB } from 'react-native-paper';
import { MarketCard } from '../../components/MarketCard';
import { RootState } from '../../store/store';
import { addToWatchlist, setWatchlistItems, removeFromWatchlist } from '../../store/slices/watchlistSlice';
import { saveToWatchlist, loadWatchlist } from '../../services/firebase-platform';
import { safeHapticImpact, safeHapticNotification } from '../../utils/haptics';
import { DeckScrollView } from '../../components/DeckScrollView';
import { NewsCardData } from '../../components/MarketCard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import axios from 'axios';
import { logEvent, AnalyticsEvents } from '../../services/analytics';
import { getRandomMarketData, SearchResult } from '../../services/market-data';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface PriceHistory {
  prices: number[];
  labels: string[];
}

interface MarketDataResponse {
  data: (MarketData | NewsArticle)[];
}

interface MarketData extends SearchResult {
  priceHistory?: PriceHistory;
  sentiment?: 'positive' | 'negative' | 'neutral';
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  volatility?: 'Low' | 'Medium' | 'High';
  currentSignal?: 'Buy' | 'Sell' | 'Hold';
  peRatio?: number;
}

interface NewsArticle {
  id: string;
  type: 'news';
  headline: string;
  content: string;
  source: string;
  timestamp: number;
  imageUrl?: string;
  url: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tickers: string[];
}

const FIREBASE_API_URL = 'https://getrandommarketinfo-u3cp3jehlq-uc.a.run.app';

const fetchMarketData = async (stockCount: number, cryptoCount: number, newsCount: number) => {
  try {
    // Get random market data using our service
    const marketData = await getRandomMarketData(stockCount, cryptoCount, newsCount);

    return { data: marketData };
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};

const formatMarketCard = (item: MarketData) => {
  
  try {
    const formattedItem = {
      ...item,
      price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0),
      high24h: typeof item.high24h === 'string' ? parseFloat(item.high24h) : (item.high24h || 0),
      low24h: typeof item.low24h === 'string' ? parseFloat(item.low24h) : (item.low24h || 0),
      open24h: typeof item.open24h === 'string' ? parseFloat(item.open24h) : (item.open24h || 0)
    };

    return formattedItem;
  } catch (error) {
    console.error('Error formatting market card for', item.symbol, error);
    return null;
  }
};

const formatNewsCard = (item: NewsArticle): NewsCardData => {
  return {
    id: item.id,
    type: 'news',
    headline: item.headline,
    content: item.content,
    source: item.source,
    timestamp: item.timestamp,
    imageUrl: item.imageUrl || undefined,
    url: item.url,
    sentiment: item.sentiment || determineSentiment(item.headline + ' ' + item.content),
    tickers: item.tickers || [],
  };
};

const determineSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = ['surge', 'gain', 'rise', 'up', 'high', 'growth', 'profit', 'boost', 'success'];
  const negativeWords = ['drop', 'fall', 'down', 'low', 'loss', 'crash', 'decline', 'risk', 'concern'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
};

// Add cache interface
interface CardCache {
  discover: any[];
  stocks: any[];
  crypto: any[];
  watchlist: any[];
  timestamp: number;
}

export default function HomeScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const swiperRef = useRef<Swiper<any>>(null);
  const insets = useSafeAreaInsets();
  const isFetchingRef = useRef(false);
  
  // Add cache state
  const [cardCache, setCardCache] = useState<CardCache>({
    discover: [],
    stocks: [],
    crypto: [],
    watchlist: [],
    timestamp: Date.now(),
  });

  const watchlist = useSelector((state: RootState) => state.watchlist.items);

  // Add cache duration constant (15 minutes)
  const CACHE_DURATION = 15 * 60 * 1000;

  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  // Load watchlist on mount
  useEffect(() => {
    const loadUserWatchlist = async () => {
      if (user) {
        try {
          const watchlistItems = await loadWatchlist(user.uid);
          dispatch(setWatchlistItems(watchlistItems));
        } catch (error) {
          console.error('Error loading watchlist:', error);
        }
      }
    };

    loadUserWatchlist();
  }, [user]);

  const loadMoreCards = useCallback(async (type?: 'stocks' | 'crypto' | 'discover' | 'watchlist') => {
    if (isFetchingRef.current) return;
    
    try {
      // Handle watchlist separately
      if (type === 'watchlist') {
        setIsLoading(true);
        if (user && watchlist.length > 0) {
          setCards(watchlist);
        } else {
          console.log('Watchlist is empty');
          setCards([]);
        }
        setIsLoading(false);
        return;
      }

      // Check cache first if a deck type is specified
      if (type && cardCache[type].length > 0 && isCacheValid(cardCache.timestamp)) {
        console.log('Using cached cards for', type);
        setCards(cardCache[type]);
        return;
      }

      isFetchingRef.current = true;
      setIsLoading(true);
      
      let stockCount = 10;
      let cryptoCount = 10;
      let newsCount = 10;

      // Adjust counts based on deck type
      if (type === 'stocks') {
        stockCount = 10;
        cryptoCount = 0;
        newsCount = 10;
      } else if (type === 'crypto') {
        stockCount = 0;
        cryptoCount = 10;
        newsCount = 10;
      }
      
      const response = await fetchMarketData(stockCount, cryptoCount, newsCount);
      
      if (!response || !response.data) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response from API');
      }
      // Separate items by type
      const marketItems = response.data
        .filter((item): item is MarketData => 
          item.type === 'stock' || item.type === 'crypto'
        )
        .map((item: MarketData) => ({
          ...item,
          marketCap: item.marketCap || 0,
          volume: item.volume || 0,
        }));

      console.log('Market Items Count:', marketItems.length);
      console.log('Market Items:', marketItems.map(item => `${item.type}: ${item.symbol || item.id}`));
      
      const newsItems = response.data
        .filter((item) => item.type === 'news');

      console.log('News Items Count:', newsItems.length);
      console.log('Total response.data items:', response.data.length);
      console.log('Response data types:', response.data.map(item => item.type));

      // Filter market items based on deck type
      const filteredMarketItems = type === 'stocks' 
        ? marketItems.filter((item: MarketData) => item.type === 'stock')
        : type === 'crypto'
        ? marketItems.filter((item: MarketData) => item.type === 'crypto')
        : marketItems;

      // Format market cards
      const marketCards = filteredMarketItems
        .filter((item: MarketData) => item && item.price && item.symbol)
        .map(formatMarketCard)
        .filter((card: MarketData | null): card is MarketData => card !== null);

      // Format news cards only if not filtering by type or if explicitly requesting discover
      const newsCards = (!type || type === 'discover') 
        ? newsItems.map(formatNewsCard)
        : [];

      console.log('Market Cards Count:', marketCards.length);
      console.log('News Cards Count:', newsCards.length);

      // Shuffle all cards together
      function shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }

      const formattedCards = shuffleArray([...marketCards, ...newsCards]);
      console.log('Total Formatted Cards:', formattedCards.length);
      
      // Update cache if a deck type is specified
      if (type) {
        setCardCache(prev => ({
          ...prev,
          [type]: formattedCards,
          timestamp: Date.now(),
        }));
        setCards(formattedCards);
      } else {
        // Add cards only if we have less than 5 during normal operation
        setCards(prevCards => {
          if (prevCards.length < 5) {
            const existingIds = new Set(prevCards.map(card => card.id));
            const newCards = formattedCards.filter(card => !existingIds.has(card.id));
            return [...prevCards, ...newCards];
          }
          return prevCards;
        });
      }
      
    } catch (error) {
      console.error('Error loading cards:', error);
      setCards([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [cardCache, isCacheValid, watchlist, user]);

  // Clear expired cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isCacheValid(cardCache.timestamp)) {
        console.log('Clearing expired card cache');
        setCardCache({
          discover: [],
          stocks: [],
          crypto: [],
          watchlist: [],
          timestamp: Date.now(),
        });
      }
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [cardCache.timestamp, isCacheValid]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadMoreCards();
    }
  }, [user]);

  // Check if we need more cards
  useEffect(() => {
    if (user && cards.length < 5 && !isFetchingRef.current) {
      loadMoreCards();
    }
  }, [cards.length, user]);

  // Add activeDeck state near the top of the component
  const [activeDeck, setActiveDeck] = useState<'stocks' | 'crypto' | 'discover' | 'watchlist'>('discover');

  // Update the handleDeckSelect function
  const handleDeckSelect = (deckType: 'stocks' | 'crypto' | 'discover' | 'watchlist') => {
    if (!user) {
      router.push('/');
      return;
    }
    setActiveDeck(deckType);
    loadMoreCards(deckType);
  };

  const handleSwipeRight = async (cardIndex: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const card = cards[cardIndex];

    if (activeDeck === 'watchlist') {
      // In watchlist, just move card to back
      setCards(prev => {
        const remainingCards = prev.filter((_, index) => index !== cardIndex);
        return [...remainingCards, card];
      });
      return;
    }
  
    if (user) {
      try {
        // Check if card is already in watchlist
        const isAlreadyInWatchlist = watchlist.some(item => item.id === card.id);
        if (!isAlreadyInWatchlist) {
          await saveToWatchlist(user.uid, card);
          dispatch(addToWatchlist(card));
          // Show success feedback
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Log add to watchlist event
          logEvent(AnalyticsEvents.ADD_TO_WATCHLIST, {
            card_id: card.id,
            card_type: card.type,
            symbol: card.type !== 'news' ? card.symbol : undefined,
          });
        } else {
          console.log('Card already in watchlist');
          // Show different feedback for already saved items
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } catch (error) {
        console.error('Error saving to watchlist:', error);
        // Show error feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      // Show feedback for non-logged in users
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/');
    }
  
    setCards((prev) => prev.slice(1));
  };
  
  const handleSwipeLeft = async (cardIndex: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    const card = cards[cardIndex];
    
    if (activeDeck === 'watchlist' && user) {
      try {
        await removeFromWatchlist(card.id);
        dispatch(removeFromWatchlist(card.id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Log remove from watchlist event
        logEvent(AnalyticsEvents.REMOVE_FROM_WATCHLIST, {
          card_id: card.id,
          card_type: card.type,
          symbol: card.type !== 'news' ? card.symbol : undefined,
        });
      } catch (error) {
        console.error('Error removing from watchlist:', error);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
    
    setCards((prev) => prev.slice(1));
  };
  
  const handleSwipeTop = async (cardIndex: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const card = cards[cardIndex];
  
    try {
      await Share.share({
        message: `${card.name} (${card.symbol})\nPrice: $${card.price?.toLocaleString()}\nChange: ${formatPercentage(card.changePercentage)}`,
        title: card.type === 'news' ? (card as NewsCardData).headline : `${card.symbol} Stock Info`,
      });
  
      // Log share event
      logEvent(AnalyticsEvents.SHARE_CARD, {
        card_id: card.id,
        card_type: card.type,
        symbol: card.type !== 'news' ? card.symbol : undefined,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  
    if (activeDeck === 'watchlist') {
      // In watchlist, move card to back after sharing
      setCards(prev => {
        const remainingCards = prev.filter((_, index) => index !== cardIndex);
        return [...remainingCards, card];
      });
    } else {
      setCards((prev) => prev.slice(1));
    }
  };

  const handleSwipeBottom = (cardIndex: number) => {
  safeHapticNotification();

  setCards(prev => {
    if (prev.length <= 1) return prev; // Avoid breaking on a single card

    const updatedDeck = prev.slice(); // ✅ Clone without breaking reference
    const [cardToMove] = updatedDeck.splice(cardIndex, 1);
    updatedDeck.push(cardToMove); // ✅ Move the card

    return updatedDeck; // ✅ React will now treat it as the same array
    });
  };

  const formatPercentage = (num?: number) => {
    if (num === undefined || num === null || isNaN(num) || typeof num !== 'number') return '-';
    try {
      return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    } catch (error) {
      console.error('formatPercentage error in index.tsx:', error, 'value:', num);
      return '-';
    }
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toString();
  };

  const handleChatPress = () => {
    safeHapticImpact();
    router.push('/chat');
  };

  if (isLoading && cards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation Indicator */}
      <View style={styles.navigationIndicator}>
        <Text style={styles.navigationText}>Swipe down from any tab to return here</Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color="#6b7280" />
      </View>
      
      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={cards}
          key={cards.length}
          renderCard={(card) => card ? <MarketCard data={card} /> : null}
          onSwipedRight={handleSwipeRight}
          onSwipedLeft={handleSwipeLeft}
          onSwipedTop={handleSwipeTop}
          onSwipedBottom={handleSwipeBottom}
          cardIndex={0}
          backgroundColor="transparent"
          stackSize={3}
          stackScale={0}
          stackSeparation={8}
          animateOverlayLabelsOpacity
          animateCardOpacity
          swipeBackCard
          verticalSwipe={true}
          horizontalSwipe={true}
          cardVerticalMargin={10}
          cardHorizontalMargin={15}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: theme.colors.error,
                  color: 'white',
                  fontSize: 24
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30
                }
              }
            },
            right: {
              title: 'SAVE',
              style: {
                label: {
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                  fontSize: 24
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30
                }
              }
            },
            top: {
              title: 'SHARE',
              style: {
                label: {
                  backgroundColor: theme.colors.secondary,
                  color: 'white',
                  fontSize: 24
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }
              }
            },
            bottom: {
              title: 'LATER',
              style: {
                label: {
                  backgroundColor: theme.colors.tertiary,
                  color: 'white',
                  fontSize: 24
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }
              }
            }
          }}
        />
      </View>
      <View style={styles.decksContainer}>
        <DeckScrollView 
          onDeckSelect={handleDeckSelect} 
          activeDeck={activeDeck}
          isLoading={isLoading}
        />
      </View>

      <FAB
        icon="chat"
        label="Chat"
        style={[
          styles.fab, 
          { bottom: insets.bottom - 20 }
        ]}
        onPress={handleChatPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
    paddingTop: 60,
  },
  navigationIndicator: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  navigationText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  swiperContainer: {
    flex: 0.8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  decksContainer: {
    flex: 0.2,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  fab: {
    position: 'absolute',
    right: 16,
    borderRadius: 28,
    zIndex: 1000,
  },
});
