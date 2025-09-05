import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { CommunityLearningDeck } from '../../../types/deck';
import { CommunityLearningDeckBrowser } from '../../../components/education/CommunityLearningDeckBrowser';

export function CommunityLearningScreen() {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All', icon: 'view-grid' },
    { id: 'trading', name: 'Trading', icon: 'chart-line' },
    { id: 'analysis', name: 'Analysis', icon: 'chart-box' },
    { id: 'psychology', name: 'Psychology', icon: 'brain' },
    { id: 'risk', name: 'Risk Management', icon: 'shield-check' },
  ];

  const learningDecks: CommunityLearningDeck[] = [
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
      cards: [], // Will be populated with actual lesson cards
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
  ];

  const communityPosts = [
    {
      id: '1',
      title: 'What I learned from my biggest trading loss',
      author: {
        name: 'Alex Thompson',
        avatar: 'AT',
        reputation: 850,
      },
      content: 'Sharing my experience and lessons learned from a significant loss...',
      likes: 45,
      comments: 12,
      timestamp: '2 hours ago',
      tags: ['experience', 'lessons', 'risk'],
    },
    {
      id: '2',
      title: 'RSI Divergence - A powerful signal I use',
      author: {
        name: 'Emma Davis',
        avatar: 'ED',
        reputation: 1200,
      },
      content: 'Here\'s how I identify and trade RSI divergences effectively...',
      likes: 78,
      comments: 23,
      timestamp: '5 hours ago',
      tags: ['rsi', 'divergence', 'signals'],
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleDeckPress = (deck: CommunityLearningDeck) => {
    router.push({
      pathname: '/CommunityLearningDeckScreen',
      params: { deckId: deck.id }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <CommunityLearningDeckBrowser />
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
  },
  subtitle: {
    fontSize: 16,
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
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pathCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  pathContent: {
    padding: 16,
  },
  pathHeader: {
    marginBottom: 12,
  },
  pathInfo: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pathDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  pathAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  expertChip: {
    fontSize: 10,
  },
  authorReputation: {
    fontSize: 12,
  },
  pathMeta: {
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
  },
  difficultyChip: {
    marginLeft: 'auto',
  },
  pathTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 12,
  },
  startButton: {
    backgroundColor: '#2563eb',
  },
  postCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  postContent: {
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postAuthorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  postAuthorReputation: {
    fontSize: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  postTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postActionText: {
    fontSize: 12,
  },
});
