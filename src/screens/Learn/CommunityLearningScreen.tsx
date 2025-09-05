import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, Button } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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

  const learningPaths = [
    {
      id: '1',
      title: 'Beginner Trading Fundamentals',
      description: 'Learn the basics of trading, market structure, and essential concepts.',
      author: {
        name: 'Sarah Chen',
        avatar: 'SC',
        reputation: 1250,
        isExpert: true,
      },
      rating: 4.8,
      students: 1250,
      duration: '2 weeks',
      difficulty: 'Beginner',
      tags: ['trading', 'fundamentals', 'beginner'],
      progress: 0,
    },
    {
      id: '2',
      title: 'Technical Analysis Mastery',
      description: 'Master chart patterns, indicators, and technical analysis techniques.',
      author: {
        name: 'Mike Rodriguez',
        avatar: 'MR',
        reputation: 2100,
        isExpert: true,
      },
      rating: 4.9,
      students: 890,
      duration: '3 weeks',
      difficulty: 'Intermediate',
      tags: ['technical-analysis', 'charting', 'indicators'],
      progress: 0,
    },
    {
      id: '3',
      title: 'Risk Management Strategies',
      description: 'Learn how to protect your capital and manage risk effectively.',
      author: {
        name: 'Dr. Lisa Wang',
        avatar: 'LW',
        reputation: 3200,
        isExpert: true,
      },
      rating: 4.7,
      students: 650,
      duration: '1 week',
      difficulty: 'Intermediate',
      tags: ['risk-management', 'portfolio', 'protection'],
      progress: 0,
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
      case 'Beginner': return '#10b981';
      case 'Intermediate': return '#f59e0b';
      case 'Advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Community Learning
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Learn from experts and share your knowledge
          </Text>
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

        {/* Featured Learning Paths */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Featured Learning Paths
          </Text>
          
          {learningPaths.map((path) => (
            <Card key={path.id} style={[styles.pathCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.pathContent}>
                <View style={styles.pathHeader}>
                  <View style={styles.pathInfo}>
                    <Text style={[styles.pathTitle, { color: theme.colors.onSurface }]}>
                      {path.title}
                    </Text>
                    <Text style={[styles.pathDescription, { color: theme.colors.onSurfaceVariant }]}>
                      {path.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.pathAuthor}>
                  <Avatar.Text size={32} label={path.author.avatar} />
                  <View style={styles.authorInfo}>
                    <View style={styles.authorNameRow}>
                      <Text style={[styles.authorName, { color: theme.colors.onSurface }]}>
                        {path.author.name}
                      </Text>
                      {path.author.isExpert && (
                        <Chip mode="outlined" compact textStyle={styles.expertChip}>
                          Expert
                        </Chip>
                      )}
                    </View>
                    <Text style={[styles.authorReputation, { color: theme.colors.onSurfaceVariant }]}>
                      {path.author.reputation} reputation
                    </Text>
                  </View>
                </View>

                <View style={styles.pathMeta}>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {path.rating}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {path.students}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {path.duration}
                    </Text>
                  </View>
                  <Chip 
                    mode="outlined" 
                    compact
                    style={[styles.difficultyChip, { borderColor: getDifficultyColor(path.difficulty) }]}
                    textStyle={{ color: getDifficultyColor(path.difficulty) }}
                  >
                    {path.difficulty}
                  </Chip>
                </View>

                <View style={styles.pathTags}>
                  {path.tags.map((tag, index) => (
                    <Chip key={index} mode="outlined" compact textStyle={styles.tagText}>
                      {tag}
                    </Chip>
                  ))}
                </View>

                <Button 
                  mode="contained" 
                  style={styles.startButton}
                  icon="play"
                >
                  Start Learning Path
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Community Posts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Community Discussions
          </Text>
          
          {communityPosts.map((post) => (
            <Card key={post.id} style={[styles.postCard, { backgroundColor: theme.colors.surface }]}>
              <Card.Content style={styles.postContent}>
                <View style={styles.postHeader}>
                  <Avatar.Text size={32} label={post.author.avatar} />
                  <View style={styles.postAuthorInfo}>
                    <Text style={[styles.postAuthorName, { color: theme.colors.onSurface }]}>
                      {post.author.name}
                    </Text>
                    <Text style={[styles.postAuthorReputation, { color: theme.colors.onSurfaceVariant }]}>
                      {post.author.reputation} rep • {post.timestamp}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.postTitle, { color: theme.colors.onSurface }]}>
                  {post.title}
                </Text>
                <Text style={[styles.postContent, { color: theme.colors.onSurfaceVariant }]}>
                  {post.content}
                </Text>

                <View style={styles.postTags}>
                  {post.tags.map((tag, index) => (
                    <Chip key={index} mode="outlined" compact textStyle={styles.tagText}>
                      {tag}
                    </Chip>
                  ))}
                </View>

                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.postAction}>
                    <MaterialCommunityIcons name="thumb-up-outline" size={20} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.postActionText, { color: theme.colors.onSurfaceVariant }]}>
                      {post.likes}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postAction}>
                    <MaterialCommunityIcons name="comment-outline" size={20} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.postActionText, { color: theme.colors.onSurfaceVariant }]}>
                      {post.comments}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.postAction}>
                    <MaterialCommunityIcons name="share-outline" size={20} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.postActionText, { color: theme.colors.onSurfaceVariant }]}>
                      Share
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>
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
