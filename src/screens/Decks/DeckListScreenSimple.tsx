import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Card, Button, Chip, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// Mock data for demonstration
const mockDecks = [
  {
    id: '1',
    name: 'Tech Giants Watchlist',
    description: 'Top technology companies for long-term growth',
    cardCount: 12,
    isPublic: true,
    createdAt: '2024-01-10',
    tags: ['technology', 'growth', 'large-cap'],
    performance: {
      totalReturn: 8.5,
      winRate: 75.0,
    },
  },
  {
    id: '2',
    name: 'Dividend Aristocrats',
    description: 'High-quality dividend-paying stocks',
    cardCount: 8,
    isPublic: false,
    createdAt: '2024-01-08',
    tags: ['dividend', 'value', 'income'],
    performance: {
      totalReturn: 5.2,
      winRate: 87.5,
    },
  },
  {
    id: '3',
    name: 'Crypto Leaders',
    description: 'Leading cryptocurrency investments',
    cardCount: 6,
    isPublic: true,
    createdAt: '2024-01-05',
    tags: ['crypto', 'volatile', 'growth'],
    performance: {
      totalReturn: 15.8,
      winRate: 66.7,
    },
  },
];

export const DeckListScreen: React.FC = () => {
  const theme = useTheme();
  const [decks] = useState(mockDecks);
  const [loading] = useState(false);

  const handleCreateDeck = () => {
    console.log('Create new deck');
  };

  const handleEditDeck = (deckId: string) => {
    console.log('Edit deck:', deckId);
  };

  const handleViewDeck = (deckId: string) => {
    console.log('View deck:', deckId);
  };

  const handleShareDeck = (deckId: string) => {
    console.log('Share deck:', deckId);
  };

  const renderDeck = ({ item }: { item: any }) => (
    <Card style={[styles.deckCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.deckContent}>
        <View style={styles.deckHeader}>
          <View style={styles.deckInfo}>
            <Text style={[styles.deckName, { color: theme.colors.onSurface }]}>
              {item.name}
            </Text>
            <Text style={[styles.deckDescription, { color: theme.colors.onSurfaceVariant }]}>
              {item.description}
            </Text>
          </View>
          <Chip 
            mode="outlined" 
            compact
            textStyle={styles.publicChip}
          >
            {item.isPublic ? 'Public' : 'Private'}
          </Chip>
        </View>

        <View style={styles.deckStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="cards" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
              {item.cardCount} cards
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="chart-line" size={16} color="#10b981" />
            <Text style={[styles.statText, { color: '#10b981' }]}>
              +{item.performance.totalReturn.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="target" size={16} color="#10b981" />
            <Text style={[styles.statText, { color: '#10b981' }]}>
              {item.performance.winRate.toFixed(0)}% win rate
            </Text>
          </View>
        </View>

        <View style={styles.tagsSection}>
          {item.tags.map((tag: string, index: number) => (
            <Chip key={index} mode="outlined" compact textStyle={styles.tagText}>
              {tag}
            </Chip>
          ))}
        </View>

        <View style={styles.actionsSection}>
          <Button
            mode="outlined"
            onPress={() => handleViewDeck(item.id)}
            style={styles.actionButton}
            icon="eye"
          >
            View
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleShareDeck(item.id)}
            style={styles.actionButton}
            icon="share"
          >
            Share
          </Button>
          <Button
            mode="contained"
            onPress={() => handleEditDeck(item.id)}
            style={styles.actionButton}
            icon="pencil"
          >
            Edit
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.onBackground }]}>
          Loading decks...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          My Decks
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Organize your watchlists and trading ideas
        </Text>
      </View>

      {/* Create Deck Button */}
      <View style={styles.createButtonContainer}>
        <Button
          mode="contained"
          onPress={handleCreateDeck}
          style={styles.createButton}
          icon="plus"
        >
          Create New Deck
        </Button>
      </View>

      {/* Decks List */}
      <FlatList
        data={decks}
        renderItem={renderDeck}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  createButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#2563eb',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  deckInfo: {
    flex: 1,
    marginRight: 12,
  },
  deckName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deckDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  publicChip: {
    fontSize: 12,
  },
  deckStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  tagText: {
    fontSize: 12,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
