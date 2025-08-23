import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { DeckCard } from './DeckCard';
import { DeckSettingsModal } from './DeckSettingsModal';

interface DeckScrollViewProps {
  onDeckSelect?: (deckType: 'stocks' | 'crypto' | 'discover' | 'watchlist') => void;
  activeDeck?: 'stocks' | 'crypto' | 'discover' | 'watchlist';
  isLoading?: boolean;
}

export function DeckScrollView({ onDeckSelect, activeDeck, isLoading }: DeckScrollViewProps) {
  const [selectedDeck, setSelectedDeck] = useState<{
    title: string;
    backgroundColor: string;
  } | null>(null);

  const decks = [
    {
      title: 'Discover',
      subtitle: 'Explore new assets',
      backgroundColor: '#F7DAC8',
      icon: 'compass',
      showSettings: false,
      type: 'discover' as const,
    },
    {
      title: 'Stocks',
      subtitle: 'Stock market assets',
      backgroundColor: '#EE7F58',
      icon: 'chart-line',
      count: 2,
      type: 'stocks' as const,
    },
    {
      title: 'Crypto Assets',
      subtitle: 'Cryptocurrency assets',
      backgroundColor: '#E7BFD7',
      icon: 'bitcoin',
      count: 3,
      type: 'crypto' as const,
    },
    {
      title: 'Watchlist',
      subtitle: 'Your saved assets',
      backgroundColor: '#DAAC28',
      icon: 'eye',
      type: 'watchlist' as const,
    },
  ];

  const handleDeckPress = (type: 'stocks' | 'crypto' | 'discover' | 'watchlist') => {
    if (isLoading) return; // Prevent deck switching while loading
    onDeckSelect?.(type);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.container}
      >
        {decks.map((deck, index) => (
          <DeckCard
            key={index}
            title={deck.title}
            subtitle={deck.subtitle}
            backgroundColor={deck.backgroundColor}
            icon={deck.icon}
            count={deck.count}
            onPress={() => handleDeckPress(deck.type)}
            isActive={activeDeck === deck.type}
            isLoading={isLoading && activeDeck === deck.type}
          />
        ))}
      </ScrollView>

      <DeckSettingsModal
        visible={selectedDeck !== null}
        onClose={() => setSelectedDeck(null)}
        title={selectedDeck?.title || ''}
        backgroundColor={selectedDeck?.backgroundColor || '#FFF'}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
}); 