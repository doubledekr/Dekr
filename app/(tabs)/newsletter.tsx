import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import ReactNativeAudioPlayer from '../../components/ReactNativeAudioPlayer';
import {
  Text,
  Card,
  Button,
  FAB,
  Icon,
  Title,
  Paragraph,
  Chip,
} from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Newsletter, newsletterService } from '../../services/NewsletterService';
import { useAppSelector } from '../../store/hooks';
import { safeHapticImpact } from '../../utils/haptics';
import { WeeklyPodcastCard } from '../../components/WeeklyPodcastCard';

export default function NewsletterScreen() {
  const theme = useTheme();
  const { user } = useAppSelector((state: any) => state.auth);
  
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [currentNewsletter, setCurrentNewsletter] = useState<Newsletter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPodcastUrl, setCurrentPodcastUrl] = useState<string | null>(null);

  useEffect(() => {
    loadNewsletters();
  }, [user]);

  const loadNewsletters = async () => {
    try {
      setIsLoading(true);
      const recentNewsletters = await newsletterService.getRecentNewsletters();
      setNewsletters(recentNewsletters);
      if (recentNewsletters.length > 0) {
        setCurrentNewsletter(recentNewsletters[0]);
      }
    } catch (error) {
      console.error('Error loading newsletters:', error);
      Alert.alert('Error', 'Failed to load newsletters');
    } finally {
      setIsLoading(false);
    }
  };


  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNewsletters();
    setRefreshing(false);
  };

  const generateNewNewsletter = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to generate newsletters');
      return;
    }

    try {
      setIsGenerating(true);
      safeHapticImpact();
      
      const newNewsletter = await newsletterService.generateWeeklyNewsletter();
      await loadNewsletters(); // Refresh the list
      
      Alert.alert('Success', 'Newsletter generated successfully!');
    } catch (error) {
      console.error('Error generating newsletter:', error);
      Alert.alert('Error', 'Failed to generate newsletter');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePodcastNewsletter = async () => {
    console.log('🎙️ Generate podcast button clicked!');
    console.log('👤 User:', user);
    console.log('🔑 User ID:', user?.uid);
    
    if (!user) {
      console.log('❌ No user found, showing error alert');
      Alert.alert('Error', 'You must be logged in to generate podcast newsletters');
      return;
    }

    try {
      console.log('🚀 Starting podcast generation for user:', user.uid);
      setIsGeneratingPodcast(true);
      safeHapticImpact();
      
      console.log('📧 Calling newsletterService.generateWeeklyPodcastNewsletter...');
      const result = await newsletterService.generateWeeklyPodcastNewsletter(user.uid);
      console.log('✅ Podcast generation result:', result);
      
      setCurrentPodcastUrl(result.podcastUrl || null);
      await loadNewsletters(); // Refresh the list
      
      if (result.podcastUrl) {
        Alert.alert('Success', 'Podcast newsletter generated successfully! Check the audio player below.');
      } else {
        Alert.alert('Success', 'Newsletter generated successfully! (Podcast generation failed)');
      }
    } catch (error) {
      console.error('Error generating podcast newsletter:', error);
      Alert.alert('Error', `Failed to generate podcast newsletter: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const shareNewsletter = async (newsletter: Newsletter) => {
    try {
      safeHapticImpact();
      await Share.share({
        message: `Check out this week's Dekr community newsletter: ${newsletter.title}`,
        title: newsletter.title,
      });
      
      // Update share count
      await newsletterService.updateNewsletterStats(newsletter.id, { shares: 1 });
    } catch (error) {
      console.error('Error sharing newsletter:', error);
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

  const formatWeekOf = (timestamp: any): string => {
    if (!timestamp) return 'Unknown week';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderNewsletterContent = (newsletter: Newsletter) => {
    // Split content into sections for better formatting
    const sections = newsletter.content.split(/\*\*(.*?)\*\*/);
    const formattedContent = sections.map((section, index) => {
      if (index % 2 === 1) {
        // This is a header
        return (
          <Text key={index} style={[styles.sectionHeader, { color: theme.colors.primary }]}>
            {section}
          </Text>
        );
      } else {
        // This is content
        return (
          <Text key={index} style={[styles.sectionContent, { color: theme.colors.onSurface }]}>
            {section}
          </Text>
        );
      }
    });

    return formattedContent;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="newspaper-variant-outline"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Title style={[styles.emptyStateTitle, { color: theme.colors.onSurfaceVariant }]}>
        No Newsletters Yet
      </Title>
      <Paragraph style={[styles.emptyStateDescription, { color: theme.colors.onSurfaceVariant }]}>
        Weekly newsletters will appear here once they're generated. 
        Check back soon for community insights and market updates!
      </Paragraph>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
        Loading newsletters...
      </Text>
    </View>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  if (newsletters.length === 0) {
    return (
      <View style={styles.container}>
        {renderEmptyState()}
        {user && (
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={generateNewNewsletter}
            loading={isGenerating}
            disabled={isGenerating}
            label="Generate First Newsletter"
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly Community Podcast */}
        <WeeklyPodcastCard 
          onPlay={(audioUrl) => setCurrentPodcastUrl(audioUrl)}
        />

        {/* Audio Player for Weekly Community Podcast */}
        {currentPodcastUrl && (
          <Card style={[styles.newsletterCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.podcastHeader}>
                <Icon source="headphones" size={24} color={theme.colors.primary} />
                <Title style={[styles.podcastTitle, { color: theme.colors.onSurface }]}>
                  Weekly Community Podcast
                </Title>
              </View>
              <ReactNativeAudioPlayer
                audioUrl={currentPodcastUrl}
                title="Weekly Community Podcast"
              />
            </Card.Content>
          </Card>
        )}

        {/* Current Newsletter */}
        {currentNewsletter && (
          <Card style={[styles.newsletterCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <View style={styles.newsletterHeader}>
                <View style={styles.titleContainer}>
                  <Icon source="newspaper" size={24} color={theme.colors.primary} />
                  <Title style={[styles.newsletterTitle, { color: theme.colors.onSurface }]}>
                    {currentNewsletter.title}
                  </Title>
                </View>
                <Chip
                  mode="outlined"
                  textStyle={{ color: theme.colors.primary }}
                  style={{ borderColor: theme.colors.primary }}
                >
                  Latest
                </Chip>
              </View>
              
              <Text style={[styles.newsletterDate, { color: theme.colors.onSurfaceVariant }]}>
                Week of {formatWeekOf(currentNewsletter.weekOf)} • Published {formatDate(currentNewsletter.publishedAt)}
              </Text>
              
              <View style={styles.contentContainer}>
                {renderNewsletterContent(currentNewsletter)}
              </View>

              {/* Newsletter Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="eye" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                    {currentNewsletter.stats.views}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="share" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                    {currentNewsletter.stats.shares}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="heart" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                    {currentNewsletter.stats.likes}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="clock" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                    {Math.round(currentNewsletter.stats.engagementTime / 60)}m read
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={() => shareNewsletter(currentNewsletter)}
                  icon="share"
                  style={styles.actionButton}
                >
                  Share
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    // Could implement like functionality
                    safeHapticImpact();
                  }}
                  icon="heart"
                  style={styles.actionButton}
                >
                  Like
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Previous Newsletters */}
        {newsletters.length > 1 && (
          <View style={styles.previousNewsletters}>
            <Title style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Previous Newsletters
            </Title>
            {newsletters.slice(1).map((newsletter) => (
              <Card 
                key={newsletter.id} 
                style={[styles.previousNewsletterCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => setCurrentNewsletter(newsletter)}
              >
                <Card.Content>
                  <View style={styles.previousNewsletterHeader}>
                    <Text style={[styles.previousNewsletterTitle, { color: theme.colors.onSurface }]}>
                      {newsletter.title}
                    </Text>
                    <Text style={[styles.previousNewsletterDate, { color: theme.colors.onSurfaceVariant }]}>
                      {formatDate(newsletter.publishedAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.previousNewsletterStats}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="eye" size={14} color={theme.colors.onSurfaceVariant} />
                      <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                        {newsletter.stats.views}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="share" size={14} color={theme.colors.onSurfaceVariant} />
                      <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                        {newsletter.stats.shares}
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Generate buttons */}
      {user ? (
        <View style={styles.fabContainer}>
          <FAB
            icon="microphone"
            style={[styles.fab, styles.podcastFab, { backgroundColor: theme.colors.secondary }]}
            onPress={() => {
              console.log('🎯 FAB button pressed!');
              generatePodcastNewsletter();
            }}
            loading={isGeneratingPodcast}
            disabled={isGeneratingPodcast || isGenerating}
            label="Generate Podcast"
            size="small"
          />
          <FAB
            icon="plus"
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={generateNewNewsletter}
            loading={isGenerating}
            disabled={isGenerating || isGeneratingPodcast}
            label="Generate Newsletter"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  newsletterCard: {
    margin: 16,
    elevation: 4,
  },
  newsletterHeader: {
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
  newsletterTitle: {
    marginLeft: 8,
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  newsletterDate: {
    fontSize: 14,
    marginBottom: 16,
  },
  contentContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
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
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  previousNewsletters: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  previousNewsletterCard: {
    marginBottom: 12,
    elevation: 2,
  },
  previousNewsletterHeader: {
    marginBottom: 8,
  },
  previousNewsletterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  previousNewsletterDate: {
    fontSize: 12,
  },
  previousNewsletterStats: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'column',
    gap: 12,
  },
  fab: {
    alignSelf: 'flex-end',
  },
  podcastFab: {
    marginBottom: 0,
  },
  podcastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  podcastTitle: {
    marginLeft: 8,
    fontSize: 20,
    fontWeight: '600',
  },
});
