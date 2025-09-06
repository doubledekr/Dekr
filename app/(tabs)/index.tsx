import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Share, Platform, Text, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Swiper from 'react-native-deck-swiper';
import { useTheme, FAB } from 'react-native-paper';
import { UnifiedCard } from '../../components/UnifiedCard';
import { NewsCardData } from '../../components/MarketCard';
import { RootState } from '../../store/store';
import { addToWatchlist, setWatchlistItems, removeFromWatchlist } from '../../store/slices/watchlistSlice';
import { saveToWatchlist, loadWatchlist } from '../../services/firebase-platform';
import { safeHapticImpact, safeHapticNotification } from '../../utils/haptics';
import { DeckScrollView } from '../../components/DeckScrollView';
import { cardService, UnifiedCard as UnifiedCardType } from '../../services/CardService';
import { PersonalizedCard } from '../../services/PersonalizationEngine';
import { personalizationAnalytics } from '../../services/PersonalizationAnalytics';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import axios from 'axios';
import { logEvent, AnalyticsEvents } from '../../services/analytics';
import { getRandomMarketData, SearchResult } from '../../services/market-data';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Haptics from 'expo-haptics';

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
  const [cards, setCards] = useState<PersonalizedCard[]>([]);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMoreCards, setHasMoreCards] = useState(true);
  const swiperRef = useRef<Swiper<PersonalizedCard>>(null);
  const insets = useSafeAreaInsets();
  const isFetchingRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeDeck, setActiveDeck] = useState<'stocks' | 'crypto' | 'discover' | 'watchlist'>('discover');
  
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

  const loadMoreCards = useCallback(async (type?: 'stocks' | 'crypto' | 'discover' | 'watchlist', isRefresh: boolean = false) => {
    if (isFetchingRef.current) return;
    
    try {
      // Handle watchlist separately
      if (type === 'watchlist') {
        setIsLoading(true);
        if (user && watchlist.length > 0) {
          // Convert watchlist items to unified cards
          const watchlistCards = watchlist.map((item: any) => ({
            id: item.id,
            type: item.type,
            title: item.name || item.headline,
            description: item.type === 'news' ? item.content : `${item.symbol} - Current price: $${item.price?.toFixed(2)}`,
            contentUrl: item.type === 'news' ? item.url : undefined,
            imageUrl: item.imageUrl,
            metadata: {
              symbol: item.symbol,
              sector: item.sector,
            },
            createdAt: new Date(),
            priority: 100, // High priority for watchlist items
            tags: item.tags || [item.type],
            engagement: {
              views: 0,
              saves: 0,
              shares: 0,
            },
            relevanceScore: 1.0,
            personalizationReason: 'From your watchlist',
            confidence: 0.9,
          }));
          setCards(watchlistCards);
        } else {
          console.log('Watchlist is empty');
          setCards([]);
        }
        setIsLoading(false);
        return;
      }

      // Check cache first if a deck type is specified and not refreshing
      if (type && cardCache[type].length > 0 && isCacheValid(cardCache.timestamp) && !isRefresh) {
        console.log('Using cached cards for', type);
        setCards(cardCache[type]);
        return;
      }

      isFetchingRef.current = true;
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      // Use personalized feed if enabled, otherwise use basic feed
      const limit = isRefresh ? 20 : 10;
      let unifiedCards: PersonalizedCard[];
      
      if (personalizationEnabled && user) {
        unifiedCards = await cardService.getPersonalizedFeed(user.uid, limit);
      } else {
        const basicCards = await cardService.getBasicFeed(user?.uid || 'anonymous', limit);
        unifiedCards = basicCards.map(card => ({
          ...card,
          relevanceScore: card.priority / 100,
          personalizationReason: 'General recommendation',
          confidence: 0.3
        }));
      }
      
      console.log('Loaded unified cards:', unifiedCards.length);
      console.log('Card types:', unifiedCards.map(card => card.type));
      
      if (isRefresh) {
        setCards(unifiedCards);
        setCurrentPage(0);
        setHasMoreCards(unifiedCards.length === limit);
      } else {
        // Add new cards to existing ones
        setCards(prevCards => {
          const existingIds = new Set(prevCards.map(card => card.id));
          const newCards = unifiedCards.filter(card => !existingIds.has(card.id));
          return [...prevCards, ...newCards];
        });
        setCurrentPage(prev => prev + 1);
        setHasMoreCards(unifiedCards.length === limit);
      }
      
      // Update cache
      if (type) {
        setCardCache(prev => ({
          ...prev,
          [type]: unifiedCards,
          timestamp: Date.now(),
        }));
      }
      
    } catch (error) {
      console.error('Error loading cards:', error);
      if (isRefresh) {
        setCards([]);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      loadMoreCards('discover', true);
    }
  }, [user]);

  // Check if we need more cards
  useEffect(() => {
    if (user && cards.length < 5 && !isFetchingRef.current) {
      loadMoreCards(activeDeck);
    }
  }, [cards.length, user, activeDeck]);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    if (!isFetchingRef.current) {
      loadMoreCards(activeDeck, true);
    }
  }, [activeDeck, loadMoreCards]);

  // activeDeck state is now declared at the top of the component

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
          // Only add stock and crypto cards to watchlist
          if (card.type === 'stock' || card.type === 'crypto') {
            // Convert unified card to watchlist format
            const watchlistItem = {
              id: card.id,
              type: card.type as 'stock' | 'crypto',
              name: card.title,
              symbol: card.metadata.symbol || '',
              price: parseFloat(card.description.match(/\$([\d.]+)/)?.[1] || '0'),
              changePercentage: 0, // Default value
              timestamp: Date.now(), // Default timestamp
            };
            
            await saveToWatchlist(user.uid, watchlistItem);
            dispatch(addToWatchlist(watchlistItem));
          } else {
            // For other card types, show a different message
            Alert.alert('Info', 'This type of content cannot be added to watchlist');
            return;
          }
          
          // Update card engagement
          await cardService.updateCardEngagement(card.id, 'save');
          
          // Show success feedback
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          // Log add to watchlist event
          logEvent(AnalyticsEvents.ADD_TO_WATCHLIST, {
            card_id: card.id,
            card_type: card.type,
            symbol: card.metadata.symbol,
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
          symbol: card.type !== 'news' ? card.metadata.symbol : undefined,
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
      let shareMessage = '';
      let shareTitle = '';
      
      switch (card.type) {
        case 'lesson':
          shareMessage = `${card.title}\n${card.description}`;
          shareTitle = 'Check out this lesson';
          break;
        case 'podcast':
          shareMessage = `${card.title}\n${card.description}`;
          shareTitle = 'Check out this podcast';
          break;
        case 'news':
          shareMessage = `${card.title}\n${card.description}`;
          shareTitle = 'Check out this news';
          break;
        case 'stock':
        case 'crypto':
          shareMessage = `${card.title} (${card.metadata.symbol})\n${card.description}`;
          shareTitle = `${card.metadata.symbol} Market Info`;
          break;
        case 'challenge':
          shareMessage = `${card.title}\n${card.description}`;
          shareTitle = 'Join this challenge';
          break;
        default:
          shareMessage = `${card.title}\n${card.description}`;
          shareTitle = 'Check this out';
      }
      
      await Share.share({
        message: shareMessage,
        title: shareTitle,
      });
  
      // Update card engagement
      await cardService.updateCardEngagement(card.id, 'share');
  
      // Log share event
      logEvent(AnalyticsEvents.SHARE_CARD, {
        card_id: card.id,
        card_type: card.type,
        symbol: card.metadata.symbol,
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

  const togglePersonalization = () => {
    setPersonalizationEnabled(!personalizationEnabled);
    // Reload cards with new personalization setting
    loadMoreCards(activeDeck, true);
  };

  const handlePersonalizationFeedback = async (cardId: string, rating: number) => {
    if (user) {
      try {
        await personalizationAnalytics.collectUserFeedback(user.uid, {
          cardId,
          rating,
          category: 'relevance'
        });
        console.log('📊 Personalization feedback collected');
      } catch (error) {
        console.error('Error collecting personalization feedback:', error);
      }
    }
  };

  if (isLoading && cards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading unified content feed...</Text>
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

      {/* Personalization Controls */}
      {user && (
        <View style={styles.personalizationControls}>
          <TouchableOpacity 
            style={[styles.personalizationToggle, personalizationEnabled && styles.personalizationToggleActive]}
            onPress={togglePersonalization}
          >
            <MaterialCommunityIcons 
              name={personalizationEnabled ? "lightbulb" : "lightbulb-outline"} 
              size={16} 
              color={personalizationEnabled ? "#fff" : "#6b7280"} 
            />
            <Text style={[styles.personalizationText, personalizationEnabled && styles.personalizationTextActive]}>
              {personalizationEnabled ? 'Personalized' : 'General'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={cards}
          key={cards.length}
          renderCard={(card) => card ? <UnifiedCard data={card} /> : null}
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
          onSwipedAll={() => {
            // Load more cards when all cards are swiped
            if (hasMoreCards && !isFetchingRef.current) {
              loadMoreCards(activeDeck);
            }
          }}
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
    backgroundColor: '#F0E7CB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Graphik-Regular',
  },
  fab: {
    position: 'absolute',
    right: 16,
    borderRadius: 28,
    zIndex: 1000,
  },
  personalizationControls: {
    position: 'absolute',
    top: 100,
    right: 16,
    zIndex: 1000,
  },
  personalizationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  personalizationToggleActive: {
    backgroundColor: '#6CA393', // theme.colors.primary
    borderColor: '#6CA393', // theme.colors.primary
  },
  personalizationText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  personalizationTextActive: {
    color: '#fff',
  },
});
