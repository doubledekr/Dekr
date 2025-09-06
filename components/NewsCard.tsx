import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { UnifiedCard } from '../services/CardService';
import { safeHapticImpact } from '../../utils/haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { engagementTracker, CardType, InteractionAction } from '../services/EngagementTracker';
import { useAuth } from '../providers/AuthProvider';

interface NewsCardProps {
  data: UnifiedCard;
  onReadMore?: () => void;
  onBookmark?: () => void;
  position?: number; // Position in feed for tracking
}

export function NewsCard({ data, onReadMore, onBookmark, position = 0 }: NewsCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Engagement tracking
  const viewStartTime = useRef<number | null>(null);
  const hasTrackedView = useRef(false);

  // Track card view start
  useEffect(() => {
    if (user && !hasTrackedView.current) {
      viewStartTime.current = Date.now();
      engagementTracker.trackCardViewStart(data.id);
      
      // Track view interaction
      engagementTracker.trackCardInteraction(
        user.uid,
        data.id,
        'news',
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
        const timeSpent = engagementTracker.trackCardViewEnd(data.id);
        
        // Update the view interaction with actual time spent
        engagementTracker.trackCardInteraction(
          user.uid,
          data.id,
          'news',
          'view',
          {
            position,
            timeSpent,
            sessionId: engagementTracker.getSessionContext().sessionId
          }
        );
      }
    };
  }, [user, data.id, position]);

  const handleReadMore = () => {
    safeHapticImpact();
    
    // Track read more interaction
    if (user) {
      engagementTracker.trackCardInteraction(
        user.uid,
        data.id,
        'news',
        'view', // Reading more is a positive engagement
        {
          position,
          timeSpent: viewStartTime.current ? Date.now() - viewStartTime.current : 0,
          sessionId: engagementTracker.getSessionContext().sessionId
        }
      );
    }
    
    if (data.contentUrl) {
      router.push({
        pathname: '/webview',
        params: {
          url: encodeURIComponent(data.contentUrl),
          title: encodeURIComponent(data.title)
        }
      });
    }
    onReadMore?.();
  };

  const handleBookmark = () => {
    safeHapticImpact();
    setIsBookmarked(!isBookmarked);
    
    // Track bookmark interaction
    if (user) {
      engagementTracker.trackCardInteraction(
        user.uid,
        data.id,
        'news',
        'save', // Bookmark is a save action
        {
          position,
          timeSpent: viewStartTime.current ? Date.now() - viewStartTime.current : 0,
          sessionId: engagementTracker.getSessionContext().sessionId
        }
      );
    }
    
    onBookmark?.();
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'trending-up';
      case 'negative':
        return 'trending-down';
      default:
        return 'trending-neutral';
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return '#4CAF50';
      case 'negative':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeIndicator}>
          <MaterialCommunityIcons name="newspaper" size={20} color="#2C5282" />
          <Text style={styles.typeText}>NEWS</Text>
        </View>
        <Text style={[styles.timestamp, { color: theme.colors.onSurfaceVariant }]}>
          {formatTimestamp(data.createdAt)}
        </Text>
      </View>

      {/* Image */}
      {data.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: data.imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlay}>
            <TouchableOpacity style={styles.bookmarkButton} onPress={handleBookmark}>
              <MaterialCommunityIcons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isBookmarked ? '#FFD700' : 'white'}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={3}>
          {data.title}
        </Text>
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]} numberOfLines={4}>
          {data.description}
        </Text>

        {/* Sentiment Indicator */}
        {data.tags.includes('positive') || data.tags.includes('negative') || data.tags.includes('neutral') && (
          <View style={styles.sentimentContainer}>
            <MaterialCommunityIcons
              name={getSentimentIcon(data.tags.find(tag => ['positive', 'negative', 'neutral'].includes(tag))) as any}
              size={16}
              color={getSentimentColor(data.tags.find(tag => ['positive', 'negative', 'neutral'].includes(tag)))}
            />
            <Text style={[
              styles.sentimentText,
              { color: getSentimentColor(data.tags.find(tag => ['positive', 'negative', 'neutral'].includes(tag))) }
            ]}>
              {data.tags.find(tag => ['positive', 'negative', 'neutral'].includes(tag))?.toUpperCase() || 'NEUTRAL'} SENTIMENT
            </Text>
          </View>
        )}

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {data.tags.slice(0, 4).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <Text style={[styles.tagText, { color: theme.colors.onTertiaryContainer }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.readMoreButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleReadMore}
        >
          <MaterialCommunityIcons name="open-in-new" size={20} color="white" />
          <Text style={styles.readMoreText}>Read Full Article</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: theme.colors.outline }]}
          onPress={() => {
            // Track share interaction
            if (user) {
              engagementTracker.trackCardInteraction(
                user.uid,
                data.id,
                'news',
                'share',
                {
                  position,
                  timeSpent: viewStartTime.current ? Date.now() - viewStartTime.current : 0,
                  sessionId: engagementTracker.getSessionContext().sessionId
                }
              );
            }
            
            // Share functionality would be implemented here
            console.log('Share news article');
          }}
        >
          <MaterialCommunityIcons name="share" size={20} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Source and Metadata */}
      <View style={styles.metadata}>
        <View style={styles.sourceContainer}>
          <MaterialCommunityIcons name="source-branch" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.sourceText, { color: theme.colors.onSurfaceVariant }]}>
            Financial News
          </Text>
        </View>
        <View style={styles.engagementContainer}>
          <MaterialCommunityIcons name="eye" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.engagementText, { color: theme.colors.onSurfaceVariant }]}>
            {data.engagement.views} views
          </Text>
        </View>
      </View>

      {/* Engagement Stats */}
      <View style={styles.engagement}>
        <View style={styles.engagementItem}>
          <MaterialCommunityIcons name="eye" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.engagementText, { color: theme.colors.onSurfaceVariant }]}>
            {data.engagement.views}
          </Text>
        </View>
        <View style={styles.engagementItem}>
          <MaterialCommunityIcons name="bookmark" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.engagementText, { color: theme.colors.onSurfaceVariant }]}>
            {data.engagement.saves}
          </Text>
        </View>
        <View style={styles.engagementItem}>
          <MaterialCommunityIcons name="share" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={[styles.engagementText, { color: theme.colors.onSurfaceVariant }]}>
            {data.engagement.shares}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5DC',
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2C5282',
    letterSpacing: 0.5,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  imageContainer: {
    height: 160,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bookmarkButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  sentimentText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  readMoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  readMoreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  engagementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementText: {
    fontSize: 12,
  },
  engagement: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
