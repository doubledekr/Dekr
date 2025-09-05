import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Icon,
  Title,
  Paragraph,
  Chip,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { weeklyPodcastService, WeeklyPodcastData } from '../services/WeeklyPodcastService';
import { safeHapticImpact } from '../utils/haptics';

interface WeeklyPodcastCardProps {
  onPlay?: (audioUrl: string) => void;
}

export const WeeklyPodcastCard: React.FC<WeeklyPodcastCardProps> = ({ onPlay }) => {
  const theme = useTheme();
  const [weeklyPodcast, setWeeklyPodcast] = useState<WeeklyPodcastData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadWeeklyPodcast();
  }, []);

  const loadWeeklyPodcast = async () => {
    try {
      setIsLoading(true);
      const podcasts = await weeklyPodcastService.getWeeklyPodcasts(1);
      if (podcasts.length > 0) {
        setWeeklyPodcast(podcasts[0]);
        console.log('✅ Loaded weekly podcast:', podcasts[0].title);
      } else {
        console.log('ℹ️ No weekly podcasts found, will show generation option');
      }
    } catch (error) {
      console.error('Error loading weekly podcast:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWeeklyPodcast = async () => {
    try {
      setIsGenerating(true);
      safeHapticImpact();
      
      const podcast = await weeklyPodcastService.generateWeeklyPodcast();
      setWeeklyPodcast(podcast);
      
      Alert.alert('Success', 'Weekly community podcast generated successfully!');
    } catch (error) {
      console.error('Error generating weekly podcast:', error);
      Alert.alert('Error', 'Failed to generate weekly podcast');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
            Loading weekly podcast...
          </Text>
        </Card.Content>
      </Card>
    );
  }

  if (!weeklyPodcast) {
    return (
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <MaterialCommunityIcons 
                name="podcast" 
                size={24} 
                color={theme.colors.primary} 
              />
              <Title style={[styles.title, { color: theme.colors.onSurface }]}>
                Weekly Community Podcast
              </Title>
            </View>
            <Chip 
              icon="calendar-week" 
              style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={{ color: theme.colors.onPrimaryContainer }}
            >
              Fridays
            </Chip>
          </View>
          
          <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            Join us every Friday for the Dekr Weekly Community Podcast! We'll cover the week's top news, 
            celebrate community achievements, and share smart investing insights.
          </Paragraph>
          
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="newspaper" size={16} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Top News & Market Events
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Community Highlights
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="school" size={16} color={theme.colors.primary} />
              <Text style={[styles.featureText, { color: theme.colors.onSurface }]}>
                Smart Investing Tips
              </Text>
            </View>
          </View>
          
          <Button
            mode="contained"
            onPress={generateWeeklyPodcast}
            loading={isGenerating}
            disabled={isGenerating}
            icon="microphone"
            style={styles.generateButton}
          >
            Generate This Week's Podcast
          </Button>
          
          <Button
            mode="outlined"
            onPress={async () => {
              try {
                setIsGenerating(true);
                safeHapticImpact();
                
                // Import and run the real podcast generation
                const { generateRealWeeklyPodcast } = await import('../scripts/generate-real-podcast.js');
                const podcast = await generateRealWeeklyPodcast();
                
                Alert.alert('Success', 'Real weekly podcast generated successfully! Check the app for the new podcast.');
                await loadWeeklyPodcast(); // Refresh the list
              } catch (error) {
                console.error('Error generating real podcast:', error);
                Alert.alert('Error', 'Failed to generate real podcast');
              } finally {
                setIsGenerating(false);
              }
            }}
            loading={isGenerating}
            disabled={isGenerating}
            icon="rocket-launch"
            style={[styles.generateButton, { marginTop: 8 }]}
          >
            Generate Real Podcast (APIs)
          </Button>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons 
              name="podcast" 
              size={24} 
              color={theme.colors.primary} 
            />
            <Title style={[styles.title, { color: theme.colors.onSurface }]}>
              {weeklyPodcast.title}
            </Title>
          </View>
          <Chip 
            icon="calendar-week" 
            style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
            textStyle={{ color: theme.colors.onPrimaryContainer }}
          >
            Week of {weeklyPodcast.weekOf}
          </Chip>
        </View>
        
        <Text style={[styles.date, { color: theme.colors.onSurfaceVariant }]}>
          {formatDate(weeklyPodcast.createdAt)}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="clock" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {formatDuration(weeklyPodcast.duration)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="newspaper" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {weeklyPodcast.dataSources.newsCount} news
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {weeklyPodcast.dataSources.communityMembers} members
            </Text>
          </View>
        </View>
        
        <Paragraph style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          This week's community podcast features {weeklyPodcast.dataSources.topPerformers} top performers, 
          analysis of {weeklyPodcast.dataSources.stockCount} stocks and {weeklyPodcast.dataSources.cryptoCount} crypto assets, 
          and insights from {weeklyPodcast.dataSources.newsCount} news articles.
        </Paragraph>
        
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => {
              if (onPlay && weeklyPodcast.audioUrl) {
                onPlay(weeklyPodcast.audioUrl);
              }
            }}
            icon="play"
            style={styles.playButton}
            disabled={!weeklyPodcast.audioUrl}
          >
            Play Podcast
          </Button>
          <Button
            mode="outlined"
            onPress={generateWeeklyPodcast}
            loading={isGenerating}
            disabled={isGenerating}
            icon="refresh"
            style={styles.refreshButton}
          >
            Regenerate
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    marginLeft: 8,
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  chip: {
    marginLeft: 8,
  },
  date: {
    fontSize: 14,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  features: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playButton: {
    flex: 1,
    marginRight: 8,
  },
  refreshButton: {
    flex: 1,
    marginLeft: 8,
  },
  generateButton: {
    marginTop: 8,
  },
});
