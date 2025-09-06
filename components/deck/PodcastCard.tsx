import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { UnifiedCard } from '../../services/CardService';
import { safeHapticImpact } from '../../utils/haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { engagementTracker, CardType, InteractionAction } from '../../services/EngagementTracker';
import { useAuth } from '../../providers/AuthProvider';

interface PodcastCardProps {
  data: UnifiedCard;
  onPlay?: () => void;
  onSubscribe?: () => void;
  position?: number; // Position in feed for tracking
}

export function PodcastCard({ data, onPlay, onSubscribe, position = 0 }: PodcastCardProps) {
  const theme = useTheme();
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
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
        'podcast',
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
          'podcast',
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

  const handlePlay = () => {
    safeHapticImpact();
    setIsPlaying(!isPlaying);
    
    // Track play interaction
    if (user) {
      engagementTracker.trackCardInteraction(
        user.uid,
        data.id,
        'podcast',
        'play',
        {
          position,
          timeSpent: viewStartTime.current ? Date.now() - viewStartTime.current : 0,
          sessionId: engagementTracker.getSessionContext().sessionId
        }
      );
    }
    
    onPlay?.();
  };

  const handleSubscribe = () => {
    safeHapticImpact();
    setIsSubscribed(!isSubscribed);
    
    // Track subscribe interaction
    if (user) {
      engagementTracker.trackCardInteraction(
        user.uid,
        data.id,
        'podcast',
        'save', // Subscribe is a save action
        {
          position,
          timeSpent: viewStartTime.current ? Date.now() - viewStartTime.current : 0,
          sessionId: engagementTracker.getSessionContext().sessionId
        }
      );
    }
    
    onSubscribe?.();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeIndicator}>
          <MaterialCommunityIcons name="podcast" size={20} color="#388E3C" />
          <Text style={styles.typeText}>PODCAST</Text>
        </View>
        <View style={styles.weekBadge}>
          <Text style={styles.weekText}>Week {data.metadata.weekNumber}</Text>
        </View>
      </View>

      {/* Image */}
      {data.imageUrl && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: data.imageUrl }} style={styles.image} resizeMode="cover" />
          <View style={styles.playOverlay}>
            <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {data.title}
        </Text>
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
          {data.description}
        </Text>

        {/* Episode Info */}
        <View style={styles.episodeInfo}>
          <View style={styles.episodeItem}>
            <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.primary} />
            <Text style={[styles.episodeText, { color: theme.colors.onSurfaceVariant }]}>
              Week {data.metadata.weekNumber}
            </Text>
          </View>
          <View style={styles.episodeItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.episodeText, { color: theme.colors.onSurfaceVariant }]}>
              ~30 min
            </Text>
          </View>
        </View>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {data.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: theme.colors.secondaryContainer }]}>
                <Text style={[styles.tagText, { color: theme.colors.onSecondaryContainer }]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {data.contentUrl && (
          <TouchableOpacity
            style={[
              styles.playButton,
              { backgroundColor: isPlaying ? theme.colors.error : theme.colors.primary }
            ]}
            onPress={handlePlay}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color="white"
            />
            <Text style={styles.playButtonText}>
              {isPlaying ? 'Pause' : 'Play Episode'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            { 
              backgroundColor: isSubscribed ? theme.colors.secondary : theme.colors.outline,
              borderColor: theme.colors.outline,
              borderWidth: 1,
            }
          ]}
          onPress={handleSubscribe}
        >
          <MaterialCommunityIcons 
            name={isSubscribed ? 'bell' : 'bell-outline'} 
            size={20} 
            color={isSubscribed ? 'white' : theme.colors.onSurfaceVariant} 
          />
          <Text style={[
            styles.subscribeButtonText,
            { color: isSubscribed ? 'white' : theme.colors.onSurfaceVariant }
          ]}>
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Episode Segments Preview */}
      <View style={styles.segmentsPreview}>
        <Text style={[styles.segmentsTitle, { color: theme.colors.onSurface }]}>
          Episode Segments:
        </Text>
        <View style={styles.segmentsList}>
          <View style={styles.segmentItem}>
            <MaterialCommunityIcons name="play-circle-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.segmentText, { color: theme.colors.onSurfaceVariant }]}>
              Market Overview (5:30)
            </Text>
          </View>
          <View style={styles.segmentItem}>
            <MaterialCommunityIcons name="play-circle-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.segmentText, { color: theme.colors.onSurfaceVariant }]}>
              Trading Strategies (12:45)
            </Text>
          </View>
          <View style={styles.segmentItem}>
            <MaterialCommunityIcons name="play-circle-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.segmentText, { color: theme.colors.onSurfaceVariant }]}>
              Q&A Session (8:20)
            </Text>
          </View>
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
    backgroundColor: '#E8F5E8',
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#388E3C',
    letterSpacing: 0.5,
  },
  weekBadge: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  weekText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
  episodeInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  episodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  episodeText: {
    fontSize: 12,
    fontWeight: '500',
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
  playButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  playButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subscribeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  segmentsPreview: {
    padding: 16,
    paddingTop: 0,
  },
  segmentsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  segmentsList: {
    gap: 6,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segmentText: {
    fontSize: 12,
    flex: 1,
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
  engagementText: {
    fontSize: 12,
  },
});
