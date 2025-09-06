import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, TouchableOpacity, Image, ScrollView, Linking } from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon, useTheme } from 'react-native-paper';
import { safeHapticImpact } from '../utils/haptics';
import Animated, { interpolate, useAnimatedStyle, withTiming, useSharedValue, withSpring } from 'react-native-reanimated';
import { VectorBadge } from './VectorBadge';
import { SentimentButton } from './SentimentButton';
import { PriceChart } from './PriceChart';
import { useRouter } from 'expo-router';
import { logEvent, AnalyticsEvents } from '../services/analytics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { UnifiedCard as UnifiedCardType } from '../services/CardService';
import { PersonalizedCard } from '../services/PersonalizationEngine';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.9, 380);
const CARD_HEIGHT = Math.min(CARD_WIDTH * 1.5, height * 0.65);
const CHART_HEIGHT = Math.min(width * 0.5, 180);

interface UnifiedCardProps {
  data: UnifiedCardType | PersonalizedCard;
  onFlip?: () => void;
}

function getCardColors(type: string) {
  switch (type) {
    case 'lesson':
      return {
        background: '#E3F2FD',
        ribbon: '#1976D2',
        ribbonText: '#FFFFFF',
        text: '#0D47A1',
        stats: '#BBDEFB',
      };
    case 'podcast':
      return {
        background: '#E8F5E8',
        ribbon: '#388E3C',
        ribbonText: '#FFFFFF',
        text: '#1B5E20',
        stats: '#C8E6C9',
      };
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
      return {
        background: '#E86C52',
        ribbon: '#32599A',
        ribbonText: '#DAAC28',
        text: '#536B31',
        stats: '#F5F5DC',
      };
    case 'challenge':
      return {
        background: '#FFF3E0',
        ribbon: '#F57C00',
        ribbonText: '#FFFFFF',
        text: '#E65100',
        stats: '#FFE0B2',
      };
    default:
      return {
        background: '#F5F5F5',
        ribbon: '#666666',
        ribbonText: '#FFFFFF',
        text: '#333333',
        stats: '#E0E0E0',
      };
  }
}

function getCardIcon(type: string) {
  switch (type) {
    case 'lesson':
      return 'school';
    case 'podcast':
      return 'podcast';
    case 'news':
      return 'newspaper';
    case 'stock':
      return 'trending-up';
    case 'crypto':
      return 'currency-btc';
    case 'challenge':
      return 'trophy';
    default:
      return 'card';
  }
}

export function UnifiedCard({ data, onFlip }: UnifiedCardProps) {
  const spin = useSharedValue(0);
  const sentimentExpand = useSharedValue(0);
  const [selectedSentiment, setSelectedSentiment] = useState<'bullish' | 'bearish' | null>(null);
  const theme = useTheme();
  const colors = getCardColors(data.type);
  const isSentimentPress = React.useRef(false);
  const router = useRouter();

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

  const handlePress = () => {
    if (isSentimentPress.current) {
      isSentimentPress.current = false;
      return;
    }
    safeHapticImpact();
    spin.value = withTiming(spin.value ? 0 : 1, { duration: 500 });
    onFlip?.();

    // Log card view event
    logEvent(AnalyticsEvents.VIEW_CARD, {
      card_id: data.id,
      card_type: data.type,
      symbol: data.metadata.symbol,
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

      // Log sentiment event
      if (data.type === 'stock' || data.type === 'crypto') {
        logEvent(AnalyticsEvents.SET_SENTIMENT, {
          card_id: data.id,
          symbol: data.metadata.symbol,
          sentiment: 'bullish',
        });
      }
    }
  };

  const handleBearish = (e: any) => {
    e.stopPropagation();
    isSentimentPress.current = true;
    if (selectedSentiment === 'bearish') {
      setSelectedSentiment(null);
      sentimentExpand.value = withSpring(0);
    } else {
      safeHapticImpact();
      setSelectedSentiment('bearish');
      sentimentExpand.value = withSpring(1);

      // Log sentiment event
      if (data.type === 'stock' || data.type === 'crypto') {
        logEvent(AnalyticsEvents.SET_SENTIMENT, {
          card_id: data.id,
          symbol: data.metadata.symbol,
          sentiment: 'bearish',
        });
      }
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      return timestamp.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderFront = () => (
    <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
      <View style={styles.cardContent}>
        {/* Background image based on type */}
        {data.type === 'stock' && (
          <Image 
            source={require('../assets/images/stock-bg.png')} 
            style={styles.cardBackgroundImage} 
            resizeMode="cover"
          />
        )}
        {data.type === 'crypto' && (
          <Image 
            source={require('../assets/images/crypto-bg.png')} 
            style={styles.cardBackgroundImage} 
            resizeMode="cover"
          />
        )}

        <View style={[styles.cornerLabel, { backgroundColor: colors.ribbon }]}>
          <Text style={[styles.cornerLabelText, { color: colors.ribbonText }]}>
            {data.type.toUpperCase()}
          </Text>
        </View>

        {/* Type-specific icon */}
        <View style={styles.typeIconContainer}>
          <MaterialCommunityIcons
            name={getCardIcon(data.type) as any}
            size={32}
            color={colors.text}
          />
        </View>

        {/* Personalization indicator */}
        {'relevanceScore' in data && data.relevanceScore > 0.5 && (
          <View style={styles.personalizationIndicator}>
            <MaterialCommunityIcons
              name="brain"
              size={12}
              color="#4CAF50"
            />
            <Text style={styles.personalizationText}>
              {Math.round(data.relevanceScore * 100)}% match
            </Text>
          </View>
        )}

        {/* Symbol badge for market data */}
        {(data.type === 'stock' || data.type === 'crypto') && data.metadata.symbol && (
          <View style={styles.symbolBadge}>
            <VectorBadge width={82} height={80} color={colors.text} />
            <View style={styles.symbolBadgeInner}>
              <Text style={[styles.symbolBadgeText, { color: colors.text }]}>
                {data.metadata.symbol}
              </Text>
            </View>
          </View>
        )}

        {/* Title */}
        <View style={styles.nameContainer}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={3}>
            {data.title}
          </Text>
        </View>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <View style={styles.pillContainer}>
            {data.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.pill, { backgroundColor: colors.ribbon }]}>
                <Text style={[styles.pillText, { color: colors.ribbonText }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Type-specific content */}
        {data.type === 'lesson' && (
          <View style={[styles.statsContainer, { backgroundColor: colors.stats }]}>
            <View style={styles.lessonInfo}>
              <Text style={[styles.lessonStage, { color: colors.text }]}>
                Stage {data.metadata.stage}
              </Text>
              <Text style={[styles.lessonDifficulty, { color: colors.text }]}>
                {data.metadata.difficulty}
              </Text>
            </View>
          </View>
        )}

        {data.type === 'podcast' && (
          <View style={[styles.statsContainer, { backgroundColor: colors.stats }]}>
            <View style={styles.podcastInfo}>
              <Text style={[styles.podcastWeek, { color: colors.text }]}>
                Week {data.metadata.weekNumber}
              </Text>
              <MaterialCommunityIcons name="play-circle" size={24} color={colors.text} />
            </View>
          </View>
        )}

        {data.type === 'challenge' && (
          <View style={[styles.statsContainer, { backgroundColor: colors.stats }]}>
            <View style={styles.challengeInfo}>
              <Text style={[styles.challengeEndDate, { color: colors.text }]}>
                Ends: {data.metadata.endDate?.toLocaleDateString()}
              </Text>
              <MaterialCommunityIcons name="trophy" size={24} color={colors.text} />
            </View>
          </View>
        )}

        {/* News image */}
        {data.type === 'news' && data.imageUrl && (
          <View style={styles.newsImageContainer}>
            <Image 
              source={{ uri: data.imageUrl }}
              style={styles.newsImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderBack = () => (
    <Animated.View style={[styles.cardFace, backAnimatedStyle]}>
      <ScrollView 
        style={styles.cardContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={styles.scrollableCardContent}
      >
        <View style={[styles.backHeader, { backgroundColor: 'transparent' }]}>
          <Text style={[styles.backTitle, { color: colors.text }]}>
            {data.title}
          </Text>
        </View>

        <View style={[styles.backDescription, { backgroundColor: colors.stats }]}>
          <Text style={[styles.descriptionText, { color: colors.text }]}>
            {data.description}
          </Text>
        </View>

        {/* Type-specific back content */}
        {data.type === 'lesson' && (
          <View style={[styles.lessonBackContent, { backgroundColor: colors.background }]}>
            <View style={styles.lessonMetadata}>
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: colors.text }]}>Stage</Text>
                <Text style={[styles.metadataValue, { color: colors.text }]}>
                  {data.metadata.stage}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: colors.text }]}>Difficulty</Text>
                <Text style={[styles.metadataValue, { color: colors.text }]}>
                  {data.metadata.difficulty}
                </Text>
              </View>
            </View>
            {data.contentUrl && (
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: colors.ribbon }]}
                onPress={() => {
                  // Handle lesson play
                  console.log('Play lesson:', data.id);
                }}
              >
                <MaterialCommunityIcons name="play" size={20} color={colors.ribbonText} />
                <Text style={[styles.playButtonText, { color: colors.ribbonText }]}>
                  Play Lesson
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {data.type === 'podcast' && (
          <View style={[styles.podcastBackContent, { backgroundColor: colors.background }]}>
            <View style={styles.podcastMetadata}>
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: colors.text }]}>Week</Text>
                <Text style={[styles.metadataValue, { color: colors.text }]}>
                  {data.metadata.weekNumber}
                </Text>
              </View>
            </View>
            {data.contentUrl && (
              <TouchableOpacity 
                style={[styles.playButton, { backgroundColor: colors.ribbon }]}
                onPress={() => {
                  // Handle podcast play
                  console.log('Play podcast:', data.id);
                }}
              >
                <MaterialCommunityIcons name="play" size={20} color={colors.ribbonText} />
                <Text style={[styles.playButtonText, { color: colors.ribbonText }]}>
                  Play Podcast
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {data.type === 'news' && (
          <View style={[styles.newsBackContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.newsBody, { color: colors.text }]}>
              {data.description}
            </Text>
            {data.contentUrl && (
              <TouchableOpacity 
                style={[styles.readMoreButton, { backgroundColor: colors.ribbon }]}
                onPress={() => {
                  router.push({
                    pathname: '/webview',
                    params: {
                      url: encodeURIComponent(data.contentUrl!),
                      title: encodeURIComponent(data.title)
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
        )}

        {data.type === 'challenge' && (
          <View style={[styles.challengeBackContent, { backgroundColor: colors.background }]}>
            <View style={styles.challengeMetadata}>
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: colors.text }]}>Symbol</Text>
                <Text style={[styles.metadataValue, { color: colors.text }]}>
                  {data.metadata.symbol || 'N/A'}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: colors.text }]}>Ends</Text>
                <Text style={[styles.metadataValue, { color: colors.text }]}>
                  {data.metadata.endDate?.toLocaleDateString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.joinButton, { backgroundColor: colors.ribbon }]}
              onPress={() => {
                // Handle challenge join
                console.log('Join challenge:', data.id);
              }}
            >
              <MaterialCommunityIcons name="trophy" size={20} color={colors.ribbonText} />
              <Text style={[styles.joinButtonText, { color: colors.ribbonText }]}>
                Join Challenge
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Engagement stats */}
        <View style={[styles.engagementStats, { backgroundColor: colors.stats }]}>
          <View style={styles.engagementRow}>
            <MaterialCommunityIcons name="eye" size={16} color={colors.text} />
            <Text style={[styles.engagementText, { color: colors.text }]}>
              {data.engagement.views}
            </Text>
          </View>
          <View style={styles.engagementRow}>
            <MaterialCommunityIcons name="bookmark" size={16} color={colors.text} />
            <Text style={[styles.engagementText, { color: colors.text }]}>
              {data.engagement.saves}
            </Text>
          </View>
          <View style={styles.engagementRow}>
            <MaterialCommunityIcons name="share" size={16} color={colors.text} />
            <Text style={[styles.engagementText, { color: colors.text }]}>
              {data.engagement.shares}
            </Text>
          </View>
        </View>

        {/* Personalization info */}
        {'personalizationReason' in data && data.personalizationReason && (
          <View style={[styles.personalizationInfo, { backgroundColor: colors.stats }]}>
            <View style={styles.personalizationHeader}>
              <MaterialCommunityIcons name="brain" size={16} color={colors.text} />
              <Text style={[styles.personalizationTitle, { color: colors.text }]}>
                Why this was recommended
              </Text>
            </View>
            <Text style={[styles.personalizationReason, { color: colors.text }]}>
              {data.personalizationReason}
            </Text>
            {'confidence' in data && (
              <View style={styles.confidenceBar}>
                <View style={[styles.confidenceFill, { 
                  width: `${data.confidence * 100}%`,
                  backgroundColor: colors.ribbon 
                }]} />
              </View>
            )}
          </View>
        )}

        {/* Created date */}
        <View style={styles.createdDateContainer}>
          <Text style={[styles.createdDate, { color: colors.text }]}>
            Created: {formatTimestamp(data.createdAt)}
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );

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
  typeIconContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 24,
    color: '#536B31',
    textAlign: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
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
  statsContainer: {
    backgroundColor: '#F5F5DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
  },
  lessonInfo: {
    alignItems: 'center',
  },
  lessonStage: {
    fontFamily: 'Graphik-Medium',
    fontSize: 16,
    marginBottom: 4,
  },
  lessonDifficulty: {
    fontFamily: 'Graphik-Regular',
    fontSize: 14,
  },
  podcastInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  podcastWeek: {
    fontFamily: 'Graphik-Medium',
    fontSize: 16,
  },
  challengeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeEndDate: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
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
  cardBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  backHeader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  backTitle: {
    fontSize: 24,
    fontFamily: 'AustinNewsDeck-Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  backDescription: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionText: {
    fontFamily: 'Graphik-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  lessonBackContent: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  lessonMetadata: {
    marginBottom: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metadataLabel: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
  },
  metadataValue: {
    fontFamily: 'Graphik-Bold',
    fontSize: 14,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  playButtonText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
  },
  podcastBackContent: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  podcastMetadata: {
    marginBottom: 16,
  },
  newsBackContent: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  newsBody: {
    fontFamily: 'Graphik-Regular',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
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
  challengeBackContent: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  challengeMetadata: {
    marginBottom: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  joinButtonText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
  },
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  engagementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
  },
  createdDateContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  createdDate: {
    fontFamily: 'Graphik-Regular',
    fontSize: 12,
    opacity: 0.7,
  },
  personalizationIndicator: {
    position: 'absolute',
    top: 70,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  personalizationText: {
    fontFamily: 'Graphik-Medium',
    fontSize: 10,
    color: '#fff',
  },
  personalizationInfo: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  personalizationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  personalizationTitle: {
    fontFamily: 'Graphik-Medium',
    fontSize: 14,
  },
  personalizationReason: {
    fontFamily: 'Graphik-Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
});
