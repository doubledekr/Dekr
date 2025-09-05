import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useTheme, SegmentedButtons } from 'react-native-paper';
import { ChallengesListScreen } from '../../src/screens/Challenges/ChallengesListScreenSimple';
import { FriendsScreen } from '../../src/screens/Social/FriendsScreen';
import { LeaderboardsScreen } from '../../src/screens/Play/LeaderboardsScreen';
// import { WeeklyCompetitionsScreen } from '../../src/screens/Play/WeeklyCompetitionsScreen';
import { SwipeToHome } from '../../components/SwipeToHome';

export default function PlayTab() {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState('challenges');

  const renderContent = () => {
    switch (selectedTab) {
      case 'challenges':
        return <ChallengesListScreen />;
      case 'social':
        return <FriendsScreen />;
      case 'leaderboards':
        return <LeaderboardsScreen />;
      case 'competitions':
        return (
          <View style={{ padding: 16 }}>
            <Text>Weekly Competitions - Coming Soon</Text>
          </View>
        );
      default:
        return <ChallengesListScreen />;
    }
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Play
        </Text>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            { value: 'challenges', label: 'Challenges' },
            { value: 'social', label: 'Social' },
            { value: 'leaderboards', label: 'Leaderboards' },
            { value: 'competitions', label: 'Weekly' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );

  return (
    <SwipeToHome children={content} />
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
