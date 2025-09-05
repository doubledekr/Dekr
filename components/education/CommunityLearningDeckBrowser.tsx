import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, Button, Searchbar } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { CommunityLearningDeck } from '../../../types/deck';

interface CommunityLearningDeckBrowserProps {
  onDeckSelect?: (deck: CommunityLearningDeck) => void;
}

export function CommunityLearningDeckBrowser({ onDeckSelect }: CommunityLearningDeckBrowserProps) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [decks, setDecks] = useState<CommunityLearningDeck[]>([]);

  const categories = [
    { id: 'all', name: 'All', icon: 'view-grid' },
    { id: 'trading', name: 'Trading', icon: 'chart-line' },
    { id: 'analysis', name: 'Analysis', icon: 'chart-box' },
    { id: 'psychology', name: 'Psychology', icon: 'brain' },
    { id: 'risk_management', name: 'Risk Management', icon: 'shield-check' },
  ];

  // Mock data - in real implementation, this would fetch from Firebase
  const mockDecks: CommunityLearningDeck[] = [
    {
      id: '1',
      title: 'Beginner Trading Fundamentals',
      description: 'Learn the basics of trading, market structure, and essential concepts.',
      creator: {
        id: '1',
        name: 'Sarah Chen',
        avatar: 'SC',
        reputation: 1250,
        isExpert: true,
      },
      topic: 'trading',
      cards: [],
      followers: 1250,
      rating: 4.8,
      difficulty: 'beginner',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      tags: ['trading', 'fundamentals', 'beginner'],
      estimatedDuration: '2 weeks',
    },
    {
      id: '2',
      title: 'Technical Analysis Mastery',
      description: 'Master chart patterns, indicators, and technical analysis techniques.',
      creator: {
        id: '2',
        name: 'Mike Rodriguez',
        avatar: 'MR',
        reputation: 2100,
        isExpert: true,
      },
      topic: 'analysis',
      cards: [],
      followers: 890,
      rating: 4.9,
      difficulty: 'intermediate',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      tags: ['technical-analysis', 'charting', 'indicators'],
      estimatedDuration: '3 weeks',
    },
    {
      id: '3',
      title: 'Risk Management Strategies',
      description: 'Learn how to protect your capital and manage risk effectively.',
      creator: {
        id: '3',
        name: 'Dr. Lisa Wang',
        avatar: 'LW',
        reputation: 3200,
        isExpert: true,
      },
      topic: 'risk_management',
      cards: [],
      followers: 650,
      rating: 4.7,
      difficulty: 'intermediate',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-19'),
      tags: ['risk-management', 'portfolio', 'protection'],
      estimatedDuration: '1 week',
    },
    {
      id: '4',
      title: 'Trading Psychology Essentials',
      description: 'Master your emotions and develop the mindset of a successful trader.',
      creator: {
        id: '4',
        name: 'Dr. James Wilson',
        avatar: 'JW',
        reputation: 1800,
        isExpert: true,
      },
      topic: 'psychology',
      cards: [],
      followers: 420,
      rating: 4.6,
      difficulty: 'advanced',
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-16'),
      tags: ['psychology', 'mindset', 'emotions'],
      estimatedDuration: '2 weeks',
    },
    {
      id: '5',
      title: 'Options Trading Basics',
      description: 'Introduction to options trading and basic strategies.',
      creator: {
        id: '5',
        name: 'Alex Thompson',
        avatar: 'AT',
        reputation: 950,
        isExpert: false,
      },
      topic: 'trading',
      cards: [],
      followers: 320,
      rating: 4.4,
      difficulty: 'intermediate',
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-21'),
      tags: ['options', 'derivatives', 'strategies'],
      estimatedDuration: '1 week',
    },
  ];

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    // Simulate API call
    setTimeout(() => {
      setDecks(mockDecks);
    }, 500);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDecks();
    setIsRefreshing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'school';
      case 'intermediate': return 'chart-line';
      case 'advanced': return 'trophy';
      default: return 'help-circle';
    }
  };

  const handleDeckPress = (deck: CommunityLearningDeck) => {
    if (onDeckSelect) {
      onDeckSelect(deck);
    } else {
      router.push({
        pathname: '/CommunityLearningDeckScreen',
        params: { deckId: deck.id }
      });
    }
  };

  const filteredDecks = decks.filter(deck => {
    const matchesCategory = selectedCategory === 'all' || deck.topic === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deck.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const sortedDecks = filteredDecks.sort((a, b) => {
    // Sort by rating first, then by followers
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return b.followers - a.followers;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Community Learning Decks
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Learn from experts and share your knowledge
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search decks, topics, or creators..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
          />
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                  { borderColor: theme.colors.outline }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <MaterialCommunityIcons 
                  name={category.icon as any} 
                  size={20} 
                  color={selectedCategory === category.id ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text style={[
                  styles.categoryText,
                  { color: selectedCategory === category.id ? theme.colors.primary : theme.colors.onSurfaceVariant }
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultsText, { color: theme.colors.onSurfaceVariant }]}>
            {sortedDecks.length} deck{sortedDecks.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {/* Learning Decks */}
        <View style={styles.decksContainer}>
          {sortedDecks.map((deck) => (
            <TouchableOpacity
              key={deck.id}
              onPress={() => handleDeckPress(deck)}
            >
              <Card style={[styles.deckCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={styles.deckContent}>
                  <View style={styles.deckHeader}>
                    <View style={styles.deckInfo}>
                      <Text style={[styles.deckTitle, { color: theme.colors.onSurface }]}>
                        {deck.title}
                      </Text>
                      <Text style={[styles.deckDescription, { color: theme.colors.onSurfaceVariant }]}>
                        {deck.description}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.deckCreator}>
                    <Avatar.Text size={32} label={deck.creator.avatar} />
                    <View style={styles.creatorInfo}>
                      <View style={styles.creatorNameRow}>
                        <Text style={[styles.creatorName, { color: theme.colors.onSurface }]}>
                          {deck.creator.name}
                        </Text>
                        {deck.creator.isExpert && (
                          <Chip mode="outlined" compact textStyle={styles.expertChip}>
                            Expert
                          </Chip>
                        )}
                      </View>
                      <Text style={[styles.creatorReputation, { color: theme.colors.onSurfaceVariant }]}>
                        {deck.creator.reputation} reputation
                      </Text>
                    </View>
                  </View>

                  <View style={styles.deckMeta}>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
                      <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                        {deck.rating}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
                      <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                        {deck.followers}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
                      <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                        {deck.estimatedDuration}
                      </Text>
                    </View>
                    <Chip 
                      mode="outlined" 
                      compact
                      style={[styles.difficultyChip, { borderColor: getDifficultyColor(deck.difficulty) }]}
                      textStyle={{ color: getDifficultyColor(deck.difficulty) }}
                      icon={() => (
                        <MaterialCommunityIcons
                          name={getDifficultyIcon(deck.difficulty)}
                          size={12}
                          color={getDifficultyColor(deck.difficulty)}
                        />
                      )}
                    >
                      {deck.difficulty}
                    </Chip>
                  </View>

                  <View style={styles.deckTags}>
                    {deck.tags.slice(0, 3).map((tag, index) => (
                      <Chip key={index} mode="outlined" compact textStyle={styles.tagText}>
                        {tag}
                      </Chip>
                    ))}
                    {deck.tags.length > 3 && (
                      <Chip mode="outlined" compact textStyle={styles.tagText}>
                        +{deck.tags.length - 3} more
                      </Chip>
                    )}
                  </View>

                  <Button 
                    mode="contained" 
                    style={styles.startButton}
                    icon="play"
                    onPress={() => handleDeckPress(deck)}
                  >
                    Start Learning Deck
                  </Button>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Empty State */}
        {sortedDecks.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="book-education-outline"
              size={80}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
              No decks found
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              Try adjusting your search or category filter
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Graphik-Regular',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    elevation: 2,
  },
  searchInput: {
    fontFamily: 'Graphik-Regular',
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipActive: {
    backgroundColor: '#e0f2fe',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
    fontFamily: 'Graphik-Medium',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
  },
  decksContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  deckCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  deckContent: {
    padding: 16,
  },
  deckHeader: {
    marginBottom: 12,
  },
  deckInfo: {
    flex: 1,
  },
  deckTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  deckDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  deckCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  expertChip: {
    fontSize: 10,
  },
  creatorReputation: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  deckMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  difficultyChip: {
    marginLeft: 'auto',
  },
  deckTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
  },
  startButton: {
    backgroundColor: '#2563eb',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
  },
});
