import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, useTheme, Card, Button, Chip, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { ChallengeDeck as ChallengeDeckType, WeeklyCompetitionDeck } from '../../types/deck';

interface PlayDeckBrowserProps {
  challengeDecks: ChallengeDeckType[];
  weeklyCompetitionDecks: WeeklyCompetitionDeck[];
  onChallengeDeckSelect?: (deck: ChallengeDeckType) => void;
  onWeeklyCompetitionSelect?: (deck: WeeklyCompetitionDeck) => void;
}

export function PlayDeckBrowser({ 
  challengeDecks, 
  weeklyCompetitionDecks,
  onChallengeDeckSelect,
  onWeeklyCompetitionSelect 
}: PlayDeckBrowserProps) {
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      default: return '#f59e0b';
    }
  };

  const handleChallengeDeckPress = (deck: ChallengeDeckType) => {
    if (onChallengeDeckSelect) {
      onChallengeDeckSelect(deck);
    } else {
      router.push({
        pathname: '/ChallengeDeckScreen',
        params: { deckId: deck.id }
      });
    }
  };

  const handleWeeklyCompetitionPress = (deck: WeeklyCompetitionDeck) => {
    if (onWeeklyCompetitionSelect) {
      onWeeklyCompetitionSelect(deck);
    } else {
      router.push({
        pathname: '/WeeklyCompetitionDeckScreen',
        params: { deckId: deck.id }
      });
    }
  };

  const renderChallengeDeck = (deck: ChallengeDeckType) => (
    <TouchableOpacity
      key={deck.id}
      onPress={() => handleChallengeDeckPress(deck)}
    >
      <Card style={[
        styles.deckCard, 
        { backgroundColor: theme.colors.surface }
      ]}>
        <Card.Content style={styles.deckContent}>
          {/* Header */}
          <View style={styles.deckHeader}>
            <View style={styles.deckInfo}>
              <Text style={[
                styles.deckTitle, 
                { color: theme.colors.onSurface }
              ]}>
                {deck.title}
              </Text>
              <Text style={[
                styles.deckDescription, 
                { color: theme.colors.onSurfaceVariant }
              ]}>
                {deck.description}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deck.status) }]}>
              <Text style={styles.statusText}>
                {deck.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="chart-line" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                {deck.symbol}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                {deck.participants.length} participants
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="trophy" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                ${deck.prizeAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                {formatTimeRemaining(deck.endDate)}
              </Text>
            </View>
          </View>

          {/* Submission Count */}
          <View style={styles.submissionInfo}>
            <MaterialCommunityIcons name="cards" size={16} color={theme.colors.primary} />
            <Text style={[styles.submissionText, { color: theme.colors.primary }]}>
              {deck.submissionCards.length} submissions to review
            </Text>
          </View>

          {/* Action Button */}
          <Button 
            mode="contained" 
            style={[
              styles.startButton,
              { backgroundColor: theme.colors.primary }
            ]}
            icon="cards"
            onPress={() => handleChallengeDeckPress(deck)}
          >
            {deck.userSubmitted ? 'Review Submissions' : 'Join Challenge'}
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderWeeklyCompetitionDeck = (deck: WeeklyCompetitionDeck) => (
    <TouchableOpacity
      key={deck.id}
      onPress={() => handleWeeklyCompetitionPress(deck)}
    >
      <Card style={[
        styles.deckCard, 
        { backgroundColor: theme.colors.surface }
      ]}>
        <Card.Content style={styles.deckContent}>
          {/* Header */}
          <View style={styles.deckHeader}>
            <View style={styles.deckInfo}>
              <Text style={[
                styles.deckTitle, 
                { color: theme.colors.onSurface }
              ]}>
                {deck.title}
              </Text>
              <Text style={[
                styles.deckDescription, 
                { color: theme.colors.onSurfaceVariant }
              ]}>
                {deck.description}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deck.status) }]}>
              <Text style={styles.statusText}>
                {deck.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="chart-line" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                {deck.symbol}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                {deck.participants.length} participants
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="trophy" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                ${deck.prizeAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                {formatTimeRemaining(deck.endDate)}
              </Text>
            </View>
          </View>

          {/* Prediction Count */}
          <View style={styles.submissionInfo}>
            <MaterialCommunityIcons name="crystal-ball" size={16} color={theme.colors.primary} />
            <Text style={[styles.submissionText, { color: theme.colors.primary }]}>
              {deck.predictionCards.length} predictions to review
            </Text>
          </View>

          {/* Action Button */}
          <Button 
            mode="contained" 
            style={[
              styles.startButton,
              { backgroundColor: theme.colors.primary }
            ]}
            icon="crystal-ball"
            onPress={() => handleWeeklyCompetitionPress(deck)}
          >
            {deck.userSubmitted ? 'Review Predictions' : 'Make Prediction'}
          </Button>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

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
            Play Decks
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Join challenges and weekly competitions
          </Text>
        </View>

        {/* Challenge Decks Section */}
        {challengeDecks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cards" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Challenge Decks
              </Text>
            </View>
            <View style={styles.decksContainer}>
              {challengeDecks.map(renderChallengeDeck)}
            </View>
          </View>
        )}

        {/* Weekly Competition Decks Section */}
        {weeklyCompetitionDecks.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="crystal-ball" size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Weekly Competitions
              </Text>
            </View>
            <View style={styles.decksContainer}>
              {weeklyCompetitionDecks.map(renderWeeklyCompetitionDeck)}
            </View>
          </View>
        )}

        {/* Empty State */}
        {challengeDecks.length === 0 && weeklyCompetitionDecks.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="cards-outline"
              size={80}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
              No play decks available
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              New challenges and competitions are being prepared
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
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  decksContainer: {
    paddingHorizontal: 20,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  submissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  submissionText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  startButton: {
    borderRadius: 8,
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
