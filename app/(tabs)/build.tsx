import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useTheme, SegmentedButtons, Card } from 'react-native-paper';
import { DeckListScreen } from '../../src/screens/Decks/DeckListScreenSimple';
import { StrategyListScreen } from '../../src/screens/Strategies/StrategyListScreenSimple';
import { CommunityRecommendationsScreen } from '../../src/screens/Build/CommunityRecommendationsScreen';
// import { PortfolioManagementScreen } from '../../src/screens/Build/PortfolioManagementScreen';
import { SwipeToHome } from '../../components/SwipeToHome';

export default function BuildTab() {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState('decks');

  const renderContent = () => {
    switch (selectedTab) {
      case 'decks':
        return <DeckListScreen />;
      case 'strategies':
        return <StrategyListScreen />;
      case 'recommendations':
        return <CommunityRecommendationsScreen />;
      case 'portfolio':
        return (
          <View style={{ padding: 16 }}>
            <Text>Portfolio Management - Coming Soon</Text>
          </View>
        );
      default:
        return <DeckListScreen />;
    }
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Build
        </Text>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            { value: 'decks', label: 'Decks' },
            { value: 'strategies', label: 'Strategies' },
            { value: 'recommendations', label: 'Community' },
            { value: 'portfolio', label: 'Portfolio' },
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
