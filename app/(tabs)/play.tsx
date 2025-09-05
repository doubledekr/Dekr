import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useTheme } from 'react-native-paper';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { PlayDeckBrowser } from '../../components/play/PlayDeckBrowser';
import { LeaderboardsScreen } from '../../src/screens/Play/LeaderboardsScreen';
import { SwipeToHome } from '../../components/SwipeToHome';
import { ChallengeDeck, WeeklyCompetitionDeck } from '../../types/deck';

// Mock data - replace with actual data fetching
const mockChallengeDecks: ChallengeDeck[] = [
  {
    id: 'challenge-1',
    title: 'AAPL Direction Challenge',
    description: 'Predict if Apple stock will go up or down this week',
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    status: 'active',
    submissionCards: [],
    userSubmitted: false,
    symbol: 'AAPL',
    type: 'direction',
    prizeAmount: 100,
    maxParticipants: 50,
    participants: [
      { userId: 'user1', displayName: 'Trader1', avatar: 'T1' },
      { userId: 'user2', displayName: 'Trader2', avatar: 'T2' },
    ],
    creatorId: 'admin',
  },
  {
    id: 'challenge-2',
    title: 'TSLA Price Target',
    description: 'Predict Tesla stock price by end of week',
    endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: 'active',
    submissionCards: [],
    userSubmitted: true,
    symbol: 'TSLA',
    type: 'price',
    prizeAmount: 250,
    maxParticipants: 30,
    participants: [
      { userId: 'user1', displayName: 'Trader1', avatar: 'T1' },
      { userId: 'user3', displayName: 'Trader3', avatar: 'T3' },
    ],
    creatorId: 'admin',
  },
];

const mockWeeklyCompetitionDecks: WeeklyCompetitionDeck[] = [
  {
    id: 'weekly-1',
    title: 'Weekly Market Prediction',
    description: 'Predict the direction of major market indices',
    symbol: 'SPY',
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: 'active',
    prizeAmount: 500,
    maxParticipants: 100,
    participants: [
      { userId: 'user1', displayName: 'Trader1', avatar: 'T1' },
      { userId: 'user2', displayName: 'Trader2', avatar: 'T2' },
      { userId: 'user3', displayName: 'Trader3', avatar: 'T3' },
    ],
    predictionCards: [],
    userSubmitted: false,
    creatorId: 'admin',
  },
];

const PlayDecksScene = () => (
  <PlayDeckBrowser 
    challengeDecks={mockChallengeDecks}
    weeklyCompetitionDecks={mockWeeklyCompetitionDecks}
  />
);

const LeaderboardsScene = () => <LeaderboardsScreen />;

const renderScene = SceneMap({
  decks: PlayDecksScene,
  leaderboards: LeaderboardsScene,
});

export default function PlayTab() {
  const theme = useTheme();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'decks', title: 'Decks' },
    { key: 'leaderboards', title: 'Leaderboards' },
  ]);

  return (
    <SwipeToHome>
      <View style={styles.container}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={(props: any) => (
            <TabBar
              {...props}
              indicatorStyle={{ backgroundColor: theme.colors.primary }}
              style={{ backgroundColor: theme.colors.surface }}
              labelStyle={{ color: theme.colors.onSurface }}
            />
          )}
        />
      </View>
    </SwipeToHome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
  },
  header: {
    padding: 16,
    backgroundColor: '#F0E7CB',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
});
