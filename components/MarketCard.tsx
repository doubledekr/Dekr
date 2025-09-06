import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, ViewStyle, TouchableWithoutFeedback, TouchableOpacity, GestureResponderEvent, Image, Linking, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon, useTheme } from 'react-native-paper';
import { MarketCard as MarketCardType } from '../store/slices/watchlistSlice';
import { UnifiedCard } from '../services/CardService';
import { safeHapticImpact } from '../utils/haptics';
import Animated, { interpolate, useAnimatedStyle, withTiming, useSharedValue, withSpring } from 'react-native-reanimated';
import { VectorBadge } from './VectorBadge';
import { SentimentButton } from './SentimentButton';
import { PriceChart } from './PriceChart';
import { useRouter } from 'expo-router';
import { logEvent, AnalyticsEvents } from '../services/analytics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { engagementTracker, CardType, InteractionAction } from '../services/EngagementTracker';
import { useAuth } from '../providers/AuthProvider';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.9, 380);
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.5, height * 0.65);
const CHART_HEIGHT = Math.min(width * 0.5, 180);

export interface NewsCardData {
  id: string;
  type: 'news';
  headline: string;
  content: string;
  source: string;
  timestamp: number;
  imageUrl?: string;
  url: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  tickers?: string[];
  sentimentScore?: number;
}

type CardData = MarketCardType | NewsCardData | UnifiedCard;

interface MarketCardProps {
  data: CardData;
  onFlip?: () => void;
  position?: number; // Position in feed for tracking
}

// Helper function to convert UnifiedCard to legacy format
function convertUnifiedCardToLegacy(unifiedCard: UnifiedCard): MarketCardType | NewsCardData {
  if (unifiedCard.type === 'news') {
    return {
      id: unifiedCard.id,
      type: 'news',
      headline: unifiedCard.title,
      content: unifiedCard.description,
      source: 'Financial News',
      timestamp: unifiedCard.createdAt.getTime(),
      imageUrl: unifiedCard.imageUrl,
      url: unifiedCard.contentUrl || '',
      sentiment: unifiedCard.tags.includes('positive') ? 'positive' : 
                 unifiedCard.tags.includes('negative') ? 'negative' : 'neutral',
      tickers: unifiedCard.tags.filter(tag => tag.startsWith('$')),
    } as NewsCardData;
  } else {
    // Extract price and change from description for market data
    const priceMatch = unifiedCard.description.match(/\$([\d.]+)/);
    const changeMatch = unifiedCard.description.match(/\(([+-]?[\d.]+)%\)/);
    
    return {
      id: unifiedCard.id,
      type: unifiedCard.type as 'stock' | 'crypto',
      symbol: unifiedCard.metadata.symbol || '',
      name: unifiedCard.title,
      price: priceMatch ? parseFloat(priceMatch[1]) : 0,
      changePercentage: changeMatch ? parseFloat(changeMatch[1]) : 0,
      sector: unifiedCard.metadata.sector,
      marketCap: 0,
      volume: 0,
      high24h: 0,
      low24h: 0,
      open24h: 0,
      grade: 'B',
      volatility: 'Medium',
      currentSignal: 'Hold',
      sentiment: 'neutral',
    } as MarketCardType;
  }
}

function getCardColors(type: string) {
  switch (type) {
    case 'news':
      return {
        background: '#F5F5DC',
        ribbon: '#2C5282',
        ribbonText: '#FFFFFF',
        text: '#1A1A1A',
        stats: '#EDF2F7',
      };
    case 'crypto':
      return {
        background: '#E7BFD7',
        ribbon: '#0C3434',
        ribbonText: '#DAAC28',
        text: '#536B31',
        stats: '#F5F5DC',
      };
    case 'stock':
    default:
      return {
        background: '#E86C52',
        ribbon: '#32599A',
        ribbonText: '#DAAC28',
        text: '#536B31',
        stats: '#F5F5DC',
      };
  }
}

export function MarketCard({ data, onFlip, position = 0 }: MarketCardProps) {
  const spin = useSharedValue(0);
  const sentimentExpand = useSharedValue(0);
  const [selectedSentiment, setSelectedSentiment] = useState<'bullish' | 'bearish' | null>(null);
  const theme = useTheme();
  const { user } = useAuth();
  
  // Convert unified card to legacy format if needed
  const legacyData = 'metadata' in data ? convertUnifiedCardToLegacy(data as UnifiedCard) : data;
  const colors = getCardColors(legacyData.type);
  const isSentimentPress = React.useRef(false);
  const router = useRouter();
  
  // Engagement tracking
  const viewStartTime = useRef<number | null>(null);
  const hasTrackedView = useRef(false);

  // console.log('Card Data:', data)

  // Track card view start
  useEffect(() => {
    if (user && !hasTrackedView.current) {
      viewStartTime.current = Date.now();
      engagementTracker.trackCardViewStart(legacyData.id);
      
      // Track view interaction
      const cardType = legacyData.type === 'news' ? 'news' : 
                      legacyData.type === 'crypto' ? 'crypto' : 'stock';
      
      engagementTracker.trackCardInteraction(
        user.uid,
        legacyData.id,
        cardType as CardType,
        'view',
        {
          position,
          timeSpent: 0,
          sessionId: engagementTracker.getSessionContext().sessionId
        }
      );
      
      hasTrackedView.current = true;
    }

    // Cleanup: track view end when component unmounts
    return () => {
      if (user && viewStartTime.current) {
        const timeSpent = engagementTracker.trackCardViewEnd(legacyData.id);
        
        // Update the view interaction with actual time spent
        engagementTracker.trackCardInteraction(
          user.uid,
          legacyData.id,
          (legacyData.type === 'news' ? 'news' : 
           legacyData.type === 'crypto' ? 'crypto' : 'stock') as CardType,
          'view',
          {
            position,
            timeSpent,
            sessionId: engagementTracker.getSessionContext().sessionId
          }
        );
      }
    };
  }, [user, legacyData.id, position]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 1], [0, 180]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${spinVal}deg` },
      ],
      backgroundColor: spinVal < 90 ? colors.background : 'transparent',
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 1], [180, 360]);
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${spinVal}deg` },
      ],
      backgroundColor: spinVal > 270 ? colors.background : 'transparent',
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  const sentimentContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          scaleX: interpolate(
            sentimentExpand.value,
            [0, 1],
            [1, 2]
          )
        }
      ],
    };
  });

  const handlePress = () => {
    if (isSentimentPress.current) {
      isSentimentPress.current = false;
      return;
    }
    safeHapticImpact();
    spin.value = withTiming(spin.value ? 0 : 1, { duration: 500 });
    onFlip?.();

    // Track flip interaction
    if (user) {
      const cardType = legacyData.type === 'news' ? 'news' : 
                      legacyData.type === 'crypto' ? 'crypto' : 'stock';
      
      engagementTracker.trackCardInteraction(
        user.uid,
        legacyData.id,
        cardType as CardType,
        'view', // Flip is considered a view interaction
        {
          position,
          timeSpent: viewStartTime.current ? Date.now() - viewStartTime.current : 0,
          sessionId: engagementTracker.getSessionContext().sessionId
        }
      );
    }

    // Log card view event
    logEvent(AnalyticsEvents.VIEW_CARD, {
      card_id: legacyData.id,
      card_type: legacyData.type,
      symbol: legacyData.type !== 'news' ? legacyData.symbol : undefined,
      headline: legacyData.type === 'news' ? (legacyData as NewsCardData).headline : undefined,
    });
  };

  const handleBullish = () => {
    isSentimentPress.current = true;
    if (selectedSentiment === 'bullish') {
      setSelectedSentiment(null);
      sentimentExpand.value = withSpring(0);
    } else {
      safeHapticImpact();
      setSelectedSentiment('bullish');
      sentimentExpand.value = withSpring(1);

      // Track sentiment interaction
      if (user && legacyData.type !== 'news') {
        const cardType = legacyData.type === 'crypto' ? 'crypto' : 'stock';
        
        engagementTracker.trackCardInteraction(
          user.uid,
          legacyData.id,
          cardType as CardType,
          'swipe_right', // Bullish sentiment is positive engagement
          {
            position,
            timeSpent: viewStartTime.current ? Date.now() - viewStartTime.current : 0,
            sessionId: engagementTracker.getSessionContext().sessionId
          }
        );
      }

      // Log sentiment event
      if (legacyData.type !== 'news') {
        logEvent(AnalyticsEvents.SET_SENTIMENT, {
          card_id: legacyData.id,
          symbol: legacyData.symbol,
          sentiment: 'bullish',
        });
      }
    }
  };

  const handleBearish = (e: GestureResponderEvent) => {
    e.stopPropagation();
    isSentimentPress.current = true;
    if (selectedSentiment === 'bearish') {
      setSelectedSentiment(null);
      sentimentExpand.value = withSpring(0);
    } else {
      safeHapticImpact();
      setSelectedSentiment('bearish');
      sentimentExpand.value = withSpring(1);

      // Track sentiment interaction
      if (user && legacyData.type !== 'news') {
        const cardType = legacyData.type === 'crypto' ? 'crypto' : 'stock';
        
        engagementTracker.trackCardInteraction(
          user.uid,
          legacyData.id,
          cardType as CardType,
          'swipe_left', // Bearish sentiment is negative engagement
          {
            position,
            timeSpent: viewStartTime.current ? Date.now() - viewStartTime.current : 0,
            sessionId: engagementTracker.getSessionContext().sessionId
          }
        );
      }

      // Log sentiment event
      if (legacyData.type !== 'news') {
        logEvent(AnalyticsEvents.SET_SENTIMENT, {
          card_id: legacyData.id,
          symbol: legacyData.symbol,
          sentiment: 'bearish',
        });
      }
    }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null || isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (num?: number) => {
    if (num === undefined || num === null || isNaN(num) || typeof num !== 'number') return '-';
    try {
      return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
    } catch (error) {
      console.error('formatPercentage error:', error, 'value:', num);
      return '-';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getSentimentIcon = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      default:
        return 'trending-neutral';
    }
  };

  const getSentimentColor = (sentiment?: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive':
        return '#006837';
      case 'negative':
        return '#9B2C2C';
      default:
        return '#666666';
    }
  };

  const getGradeColor = (grade?: 'A' | 'B' | 'C' | 'D' | 'F') => {
    switch (grade) {
      case 'A':
        return '#006837';
      case 'B':
        return '#2E8B57';
      case 'C':
        return '#DAA520';
      case 'D':
        return '#CD5C5C';
      case 'F':
        return '#9B2C2C';
      default:
        return '#666666';
    }
  };

  const getVolatilityColor = (volatility?: 'Low' | 'Medium' | 'High') => {
    switch (volatility) {
      case 'Low':
        return '#006837';
      case 'Medium':
        return '#DAA520';
      case 'High':
        return '#9B2C2C';
      default:
        return '#666666';
    }
  };

  const getSignalColor = (signal?: 'Buy' | 'Sell' | 'Hold') => {
    switch (signal) {
      case 'Buy':
        return '#006837';
      case 'Sell':
        return '#9B2C2C';
      case 'Hold':
        return '#DAA520';
      default:
        return '#666666';
    }
  };

  const renderSentiment = () => {
    if (!selectedSentiment) return null;
    
    const sentiment = {
      bullish: {
        percentage: 65,
        color: '#006837',
        icon: 'arrow-up',
      },
      bearish: {
        percentage: 35,
        color: '#9B2C2C',
        icon: 'arrow-down',
      }
    };

    const current = sentiment[selectedSentiment];

    return (
      <View style={styles.sentimentDisplay}>
        <Icon source={current.icon} size={24} color={current.color} />
        <Text style={[styles.sentimentPercentage, { color: current.color }]}>
          {current.percentage}%
        </Text>
      </View>
    );
  };

  const renderNewsCard = (isBack: boolean = false) => {
    const newsData = legacyData as NewsCardData;
    
    if (!isBack) {
      return (
        <View style={styles.cardContent}>
          <View style={[styles.cornerLabel, { backgroundColor: colors.ribbon }]}>
            <Text style={[styles.cornerLabelText, { color: colors.ribbonText }]}>NEWS</Text>
          </View>

          {newsData.imageUrl && (
            <View style={styles.newsImageContainer}>
              <Image 
                source={{ uri: newsData.imageUrl }}
                style={styles.newsImage}
                resizeMode="cover"
              />
            </View>
          )}

          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text, fontSize: 24 }]} numberOfLines={3}>
              {newsData.headline}
            </Text>
          </View>
          
          <View style={[styles.newsExcerpt, { backgroundColor: colors.stats }]}>
            <Text style={[styles.excerptText, { color: colors.text }]} numberOfLines={3}>
              {newsData.content}
            </Text>
            <View style={styles.newsFooter}>
              {newsData.tickers && newsData.tickers.length > 0 && (
                <View style={styles.tickerContainer}>
                  {newsData.tickers.map((ticker, index) => (
                    <View 
                      key={ticker} 
                      style={[
                        styles.tickerBadge,
                        { backgroundColor: colors.ribbon }
                      ]}
                    >
                      <Text style={[styles.tickerText, { color: colors.ribbonText }]}>
                        ${ticker}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={[styles.timestamp, { color: colors.text }]}>
                {formatTimestamp(newsData.timestamp)}
              </Text>
            </View>
          </View>
        </View>
      );
    } else {
      return (
        <View style={[styles.backNewsContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.backNewsHeadline, { color: colors.text }]}>
            {newsData.headline}
          </Text>
          
          <View style={styles.backNewsMetadata}>
            {newsData.source && (
              <View style={styles.backNewsSource}>
                <Icon source="newspaper" size={16} color={colors.text} />
                <Text style={[styles.backNewsSourceText, { color: colors.text }]}>
                  {newsData.source}
                </Text>
              </View>
            )}
            <Text style={[styles.backNewsTimestamp, { color: colors.text }]}>
              {formatTimestamp(newsData.timestamp)}
            </Text>
          </View>

          <ScrollView style={styles.backNewsScrollView}>
            <Text style={[styles.backNewsBody, { color: colors.text }]}>
              {newsData.content}
            </Text>
          </ScrollView>

          {newsData.sentiment && (
            <View style={[styles.sentimentIndicator, { backgroundColor: colors.stats }]}>
              <MaterialCommunityIcons
                name={getSentimentIcon(newsData.sentiment)}
                size={24}
                color={getSentimentColor(newsData.sentiment)}
                style={styles.sentimentIcon}
              />
              <Text style={[styles.sentimentText, { color: getSentimentColor(newsData.sentiment) }]}>
                {newsData.sentiment.charAt(0).toUpperCase() + newsData.sentiment.slice(1)} Sentiment
              </Text>
            </View>
          )}

          {newsData.url && (
            <TouchableOpacity 
              style={[styles.readMoreButton, { backgroundColor: colors.ribbon }]}
              onPress={() => {
                // Ensure URL is properly formed
                let url = newsData.url;
                if (url && !url.startsWith('http')) {
                  url = 'https://' + url;
                }
                
                router.push({
                  pathname: '/webview',
                  params: {
                    url: encodeURIComponent(url),
                    title: encodeURIComponent(newsData.source || 'Article')
                  }
                });
              }}
            >
              <Text style={[styles.readMoreText, { color: colors.ribbonText }]}>
                Read Full Article
              </Text>
              <Icon source="open-in-new" size={16} color={colors.ribbonText} />
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };

  const renderFront = () => (
    <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
      {legacyData.type === 'news' ? renderNewsCard() : (
        <>
          <View style={styles.cardContent}>
            {/* Add background image */}
            <Image 
              source={legacyData.type === 'crypto' 
                ? require('../assets/images/crypto-bg.png') 
                : require('../assets/images/stock-bg.png')} 
              style={styles.cardBackgroundImage} 
              resizeMode="cover"
            />
            <View style={[styles.cornerLabel, { backgroundColor: colors.ribbon }]}>
              <Text style={[styles.cornerLabelText, { color: colors.ribbonText }]}>{legacyData.type.toUpperCase()}</Text>
            </View>

            <View style={styles.symbolBadge}>
              <VectorBadge width={82} height={80} color={colors.text} />
              <View style={styles.symbolBadgeInner}>
                <Text style={[styles.symbolBadgeText, { color: colors.text }]}>{legacyData.symbol}</Text>
              </View>
            </View>

            <View style={styles.nameContainer}>
              <Text style={[styles.name, { color: colors.text }]}>{legacyData.name}</Text>
            </View>

            <View style={styles.pillContainer}>
              {legacyData.exchange && (
                <View style={[styles.pill, { backgroundColor: colors.ribbon }]}>
                  <Text style={[styles.pillText, { color: colors.ribbonText }]}>
                    {legacyData.exchange}
                  </Text>
                </View>
              )}
              {legacyData.sector && (
                <View style={[styles.pill, { backgroundColor: colors.ribbon }]}>
                  <Text style={[styles.pillText, { color: colors.ribbonText }]}>
                    {legacyData.sector}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.statsContainer, { backgroundColor: colors.stats }]}>
              <View style={styles.changeIndicator}>
                <Text style={[
                  styles.changePercentage,
                  { color: legacyData.changePercentage && legacyData.changePercentage >= 0 ? '#006837' : '#9B2C2C' }
                ]}>
                  {legacyData.changePercentage && legacyData.changePercentage >= 0 ? <Icon source={'arrow-up'} size={60} color='#006837'/> : <Icon source={'arrow-down'} size={60} color={'#9B2C2C'} />}
                </Text>
                <Text style={[
                  styles.changePercentage,
                  { color: legacyData.changePercentage && legacyData.changePercentage >= 0 ? '#006837' : '#9B2C2C' }
                  ]}>
                  {Math.abs(legacyData.changePercentage || 0).toFixed(2)}%
                </Text>
              </View>
              <View style={{marginHorizontal: 'auto'}}>
                <Text style={styles.price}>${legacyData.price}</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </Animated.View>
  );

  const renderBack = () => (
    <Animated.View style={[styles.cardFace, backAnimatedStyle]}>
      {legacyData.type === 'news' ? renderNewsCard(true) : (
        <>
          <ScrollView 
            style={styles.cardContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
            contentContainerStyle={styles.scrollableCardContent}
          >
            
            <View style={[styles.backHeader, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.backSymbol, { color: colors.text }]}>
                {legacyData.symbol}
              </Text>
            </View>

            <View style={[styles.backStatsGrid, { backgroundColor: 'rgba(245, 245, 220, 0.85)' }]}>
              {legacyData.type === 'crypto' ? (
                <>
                  <View style={styles.backStatBox}>
                    <Text style={[styles.backStatLabel, { color: colors.text }]}>24h High</Text>
                    <Text style={[styles.backStatValue, { color: colors.text }]}>
                      {formatNumber(legacyData.high24h || 0)}
                    </Text>
                  </View>
                  <View style={[styles.backStatBox, styles.backStatBoxRight]}>
                    <Text style={[styles.backStatLabel, { color: colors.text }]}>24h Low</Text>
                    <Text style={[styles.backStatValue, { color: colors.text }]}>
                      {formatNumber(legacyData.low24h || 0)}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.backStatBox}>
                    <Text style={[styles.backStatLabel, { color: colors.text }]}>Market Cap</Text>
                    <Text style={[styles.backStatValue, { color: colors.text }]}>
                      ${formatLargeNumber(legacyData.marketCap || 0)}
                    </Text>
                  </View>
                  <View style={[styles.backStatBox, styles.backStatBoxRight]}>
                    <Text style={[styles.backStatLabel, { color: colors.text }]}>24h volume</Text>
                    <Text style={[styles.backStatValue, { color: colors.text }]}>
                      ${formatLargeNumber(legacyData.volume || 0)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Additional Metrics Grid */}
            <View style={[styles.additionalMetricsGrid, { backgroundColor: 'rgba(245, 245, 220, 0.85)' }]}>
              <View style={styles.metricRow}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>Grade</Text>
                  <Text style={[styles.metricValue, { color: getGradeColor(legacyData.grade) }]}>
                    {legacyData.grade || '-'}
                  </Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>Volatility</Text>
                  <Text style={[styles.metricValue, { color: getVolatilityColor(legacyData.volatility) }]}>
                    {legacyData.volatility || '-'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.metricRow}>
                <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>Signal</Text>
                  <Text style={[styles.metricValue, { color: getSignalColor(legacyData.currentSignal) }]}>
                    {legacyData.currentSignal || '-'}
                  </Text>
                </View>
                {/* <View style={styles.metricBox}>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>P/E Ratio</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {legacyData.peRatio ? legacyData.peRatio.toFixed(2) : '-'}
                  </Text>
                </View> */}
                <View style={[styles.metricBox, styles.fullWidth]}>
                  <Text style={[styles.metricLabel, { color: colors.text }]}>Sentiment</Text>
                  <View style={styles.row}>
                    <MaterialCommunityIcons
                      name={getSentimentIcon(legacyData.sentiment)}
                      size={20}
                      color={getSentimentColor(legacyData.sentiment)}
                    />
                    <Text style={[styles.metricValue, { color: getSentimentColor(legacyData.sentiment) }]}>
                      {legacyData.sentiment ? legacyData.sentiment.charAt(0).toUpperCase() + legacyData.sentiment.slice(1) : '-'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* <View style={styles.metricRow}>
                
              </View> */}
            </View>

            <View style={[styles.backPriceHistory, { backgroundColor: colors.background }]}>
              <Text style={[styles.backPriceHistoryTitle, { color: colors.text }]}>
                6 month price history
              </Text>
              {legacyData.priceHistory ? (
                <PriceChart
                  data={legacyData.priceHistory.prices}
                  labels={legacyData.priceHistory.labels}
                  height={CHART_HEIGHT}
                  width={CARD_WIDTH - 60}
                  color={colors.text}
                />
              ) : (
                <View style={styles.noChartData}>
                  <Text style={[styles.noChartText, { color: colors.text }]}>
                    No price history available
                  </Text>
                </View>
              )}
            </View>

            {/* Ticker-specific news section */}
            {legacyData.tickerNews && legacyData.tickerNews.length > 0 && (
              <View style={[styles.tickerNewsSection, { backgroundColor: colors.background }]}>
                <View style={styles.tickerNewsHeader}>
                  <Text style={[styles.tickerNewsTitle, { color: colors.text }]}>
                    📰 Related News
                  </Text>
                  {legacyData.newsSentimentScore !== undefined && (
                    <View style={[
                      styles.newsSentimentBadge,
                      { backgroundColor: legacyData.newsSentimentScore > 0.1 ? '#10B981' : 
                                        legacyData.newsSentimentScore < -0.1 ? '#EF4444' : '#6B7280' }
                    ]}>
                      <Text style={styles.newsSentimentText}>
                        {legacyData.newsSentimentScore > 0.1 ? '📈 Positive' : 
                         legacyData.newsSentimentScore < -0.1 ? '📉 Negative' : '➡️ Neutral'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.newsScrollView}>
                  {legacyData.tickerNews.slice(0, 3).map((news, index) => (
                    <TouchableOpacity
                      key={news.id}
                      style={[styles.newsItem, { borderBottomColor: colors.text + '20' }]}
                      onPress={() => {
                        if (news.url) {
                          Linking.openURL(news.url);
                        }
                      }}
                    >
                      <View style={styles.newsItemHeader}>
                        <Text style={[styles.newsHeadline, { color: colors.text }]} numberOfLines={2}>
                          {news.headline}
                        </Text>
                        <View style={[
                          styles.newsItemSentiment,
                          { backgroundColor: news.sentiment === 'positive' ? '#10B981' : 
                                            news.sentiment === 'negative' ? '#EF4444' : '#6B7280' }
                        ]}>
                          <Text style={styles.newsItemSentimentText}>
                            {news.sentiment === 'positive' ? '📈' : 
                             news.sentiment === 'negative' ? '📉' : '➡️'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.newsContent, { color: colors.text + 'CC' }]} numberOfLines={2}>
                        {news.content}
                      </Text>
                      <View style={styles.newsItemFooter}>
                        <Text style={[styles.newsSource, { color: colors.text + '80' }]}>
                          {news.source}
                        </Text>
                        <Text style={[styles.newsTime, { color: colors.text + '80' }]}>
                          {formatTimestamp(news.timestamp)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </>
      )}
    </Animated.View>
  );

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

  return (
    <Pressable 
      style={[
        styles.container,
        {
          backgroundColor: colors.background + '00',
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }
      ]} 
      onPress={handlePress}
    >
      {renderFront()}
      {renderBack()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
  },
  cardFace: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    position: 'relative',
  },
  scrollableCardContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  cornerLabel: {
    position: 'absolute',
    top: 25,
    left: -48,
    backgroundColor: '#3B5998',
    transform: [
      { rotate: '-45deg' },
    ],
    width: 190,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 5,
  },
  cornerLabelText: {
    color: '#DAAC28',
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
    letterSpacing: 1,
  },
  symbolBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolBadgeInner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolBadgeText: {
    color: '#536B31',
    fontFamily: 'Graphik-Medium',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  name: {
    fontFamily: 'AustinNewsDeck-Bold',
    fontSize: 48,
    color: '#536B31',
    textAlign: 'right',
  },
  sentimentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    minHeight: 44,
  },
  sentimentButton: {
    flex: 1,
    minWidth: 100,
    height: 44,
  },
  statsContainer: {
    backgroundColor: '#F5F5DC',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  changeIndicator: {
    flexDirection: 'column',
    alignItems: 'center',
    borderColor: '#5B3F2C',
    borderRightWidth: 1,
    height: '100%',
    padding: 20,
    width: '30%'
  },
  changePercentage: {
    fontFamily: 'Graphik-Medium',
    fontSize: 20,
  },
  price: {
    fontSize: Math.min(28, width * 0.07),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  blurContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  backContent: {
    flex: 1,
    padding: 20,
  },
  backTitle: {
    fontFamily: 'AustinNewsDeck-Bold',
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  stat: {
    flex: 1,
    marginHorizontal: 10,
  },
  statLabel: {
    fontFamily: 'Graphik-Regular',
    fontSize: 14,
    color: '#fff',
    opacity: 0.7,
    marginBottom: 5,
  },
  statValue: {
    fontFamily: 'Graphik-Bold',
    fontSize: 18,
    color: '#fff',
  },
  content: {
    fontFamily: 'Graphik-Regular',
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  backHeader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  backSymbol: {
    fontSize: 32,
    fontFamily: 'Graphik-Medium',
    color: '#536B31',
  },
  backContentHeadline: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backHeadline: {
    fontSize: 16,
    fontFamily: 'Graphik-Regular',
    lineHeight: 24,
    textAlign: 'left',
  },
  backStatsGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#5B3F2C',
  },
  backStatBox: {
    flex: 1,
    padding: 16,
    borderRightWidth: 1,
    borderColor: '#5B3F2C',
  },
  backStatBoxRight: {
    borderRightWidth: 0,
  },
  backStatLabel: {
    fontSize: Math.min(14, width * 0.035),
    color: '#536B31',
    textAlign: 'center',
    marginBottom: 4,
  },
  backStatValue: {
    fontSize: Math.min(16, width * 0.045),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backPriceHistory: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 15
  },
  backPriceHistoryTitle: {
    fontSize: 16,
    fontFamily: 'Graphik-Regular',
    marginBottom: 20,
  },
  newsExcerpt: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: .5,
    borderColor: '#5B3F2C',
  },
  excerptText: {
    fontFamily: 'Graphik-Regular',
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 12,
  },
  timestamp: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
  },
  backNewsContent: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
  },
  backNewsHeadline: {
    fontFamily: 'AustinNewsDeck-Bold',
    fontSize: 28,
    marginBottom: 12,
  },
  backNewsTimestamp: {
    fontFamily: 'Graphik-Regular',
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  backNewsBody: {
    fontFamily: 'Graphik-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: '#1A1A1A',
    flex: 1,
  },
  backNewsSource: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  backNewsSourceText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
  },
  sentimentButtonExpanded: {
    flex: 2,
  },
  sentimentDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sentimentPercentage: {
    fontFamily: 'Graphik-Bold',
    fontSize: 24,
  },
  sentimentWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '70%',
    transform: [{ translateY: -22 }],
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  newsImageContainer: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: '100%',
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  tickerContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tickerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tickerText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 12,
  },
  backNewsMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backNewsScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  sentimentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  sentimentText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  readMoreText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
  },
  backPriceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backPriceLabel: {
    fontFamily: 'Graphik-Regular',
    fontSize: 14,
  },
  backPriceValue: {
    fontFamily: 'Graphik-Bold',
    fontSize: 18,
  },
  pillContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 5,
  },
  pillText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  noChartData: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChartText: {
    fontFamily: 'Graphik-Regular',
    fontSize: 14,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sentimentIcon: {
    opacity: 0.8,
  },
  additionalMetricsGrid: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#5B3F2C',
    borderRadius: 8,
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B3F2C',
  },
  metricBox: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#5B3F2C',
  },
  metricLabel: {
    fontSize: Math.min(14, width * 0.035),
    color: '#536B31',
    textAlign: 'center',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: Math.min(16, width * 0.04),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fullWidth: {
    flex: 2,
    borderRightWidth: 0,
  },
  cardBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  tickerNewsSection: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flex: 1,
  },
  tickerNewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tickerNewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  newsSentimentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newsSentimentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  newsScrollView: {
    marginTop: 8,
  },
  newsItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  newsItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  newsHeadline: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
    flex: 1,
    marginRight: 8,
  },
  newsItemSentiment: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsItemSentimentText: {
    fontSize: 12,
    color: 'white',
  },
  newsContent: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
    fontFamily: 'Graphik-Regular',
  },
  newsItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsSource: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  newsTime: {
    fontSize: 11,
    fontFamily: 'Graphik-Regular',
  },
}); 