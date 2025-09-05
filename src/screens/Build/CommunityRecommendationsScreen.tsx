import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, Button, SegmentedButtons } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SocialRecommendationCard, SocialRecommendation } from '../../../components/social/SocialRecommendationCard';

export function CommunityRecommendationsScreen() {
  const theme = useTheme();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'stocks', label: 'Stocks' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'following', label: 'Following' },
  ];

  const recommendations: SocialRecommendation[] = [
    {
      id: '1',
      user: {
        id: '1',
        name: 'Alex Thompson',
        avatar: 'AT',
        reputation: 2500,
        badges: ['Expert', 'Strategy Master'],
      },
      asset: {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        price: 185.50,
        change: 2.5,
        type: 'stock',
      },
      recommendation: {
        type: 'buy',
        reasoning: 'Strong Q4 earnings expected, new product launches, and expanding services revenue. Technical indicators show bullish momentum.',
        confidence: 85,
        targetPrice: 200.00,
        timeHorizon: 'medium',
      },
      votes: {
        upvotes: 45,
        downvotes: 8,
        userVote: 'upvote',
      },
      timestamp: new Date('2024-01-15T10:30:00'),
      isVerified: true,
    },
    {
      id: '2',
      user: {
        id: '2',
        name: 'Sarah Chen',
        avatar: 'SC',
        reputation: 2200,
        badges: ['Expert', 'Risk Manager'],
      },
      asset: {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 42500.00,
        change: -1.2,
        type: 'crypto',
      },
      recommendation: {
        type: 'hold',
        reasoning: 'Bitcoin showing consolidation pattern. Wait for breakout above $45k resistance before considering position increase.',
        confidence: 70,
        timeHorizon: 'short',
      },
      votes: {
        upvotes: 32,
        downvotes: 15,
        userVote: undefined,
      },
      timestamp: new Date('2024-01-15T09:15:00'),
      isVerified: true,
    },
    {
      id: '3',
      user: {
        id: '3',
        name: 'Mike Rodriguez',
        avatar: 'MR',
        reputation: 1800,
        badges: ['Analyst'],
      },
      asset: {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        price: 245.80,
        change: 4.2,
        type: 'stock',
      },
      recommendation: {
        type: 'sell',
        reasoning: 'Overvalued at current levels. EV market competition increasing, regulatory headwinds, and production concerns.',
        confidence: 75,
        timeHorizon: 'short',
      },
      votes: {
        upvotes: 12,
        downvotes: 28,
        userVote: 'downvote',
      },
      timestamp: new Date('2024-01-15T08:45:00'),
      isVerified: false,
    },
  ];

  const trendingAssets = [
    {
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      price: 520.15,
      change: 3.8,
      mentions: 156,
      sentiment: 'positive',
    },
    {
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 385.20,
      change: 1.9,
      mentions: 134,
      sentiment: 'positive',
    },
    {
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 142.80,
      change: -0.5,
      mentions: 98,
      sentiment: 'neutral',
    },
  ];

  const handleVote = (recommendationId: string, vote: 'upvote' | 'downvote') => {
    console.log('Voting on recommendation:', recommendationId, vote);
  };

  const handleFollow = (userId: string) => {
    console.log('Following user:', userId);
  };

  const handleViewProfile = (userId: string) => {
    console.log('Viewing profile:', userId);
  };

  const handleViewAsset = (symbol: string) => {
    console.log('Viewing asset:', symbol);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981';
      case 'negative': return '#ef4444';
      case 'neutral': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            Community Recommendations
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Get insights from trusted community members
          </Text>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <SegmentedButtons
            value={selectedFilter}
            onValueChange={setSelectedFilter}
            buttons={filters}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Trending Assets */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Trending Assets
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trendingAssets.map((asset, index) => (
              <Card key={asset.symbol} style={[styles.trendingCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content style={styles.trendingContent}>
                  <View style={styles.trendingHeader}>
                    <Text style={[styles.trendingSymbol, { color: theme.colors.onSurface }]}>
                      {asset.symbol}
                    </Text>
                    <Chip 
                      mode="outlined" 
                      compact
                      style={[styles.sentimentChip, { borderColor: getSentimentColor(asset.sentiment) }]}
                      textStyle={{ color: getSentimentColor(asset.sentiment) }}
                    >
                      {asset.sentiment}
                    </Chip>
                  </View>
                  <Text style={[styles.trendingName, { color: theme.colors.onSurfaceVariant }]}>
                    {asset.name}
                  </Text>
                  <View style={styles.trendingPrice}>
                    <Text style={[styles.trendingPriceValue, { color: theme.colors.onSurface }]}>
                      ${asset.price.toFixed(2)}
                    </Text>
                    <Text style={[
                      styles.trendingChange, 
                      { color: asset.change >= 0 ? '#10b981' : '#ef4444' }
                    ]}>
                      {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.trendingMeta}>
                    <MaterialCommunityIcons name="trending-up" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.trendingMentions, { color: theme.colors.onSurfaceVariant }]}>
                      {asset.mentions} mentions
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </View>

        {/* Community Recommendations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Latest Recommendations
          </Text>
          
          {recommendations.map((recommendation) => (
            <SocialRecommendationCard
              key={recommendation.id}
              data={recommendation}
              onVote={handleVote}
              onFollow={handleFollow}
              onViewProfile={handleViewProfile}
              onViewAsset={handleViewAsset}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActions}>
            <Button
              mode="contained"
              style={styles.quickActionButton}
              icon="plus"
            >
              Share Recommendation
            </Button>
            <Button
              mode="outlined"
              style={styles.quickActionButton}
              icon="account-plus"
            >
              Find Experts
            </Button>
          </View>
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
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  segmentedButtons: {
    backgroundColor: 'transparent',
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
  trendingCard: {
    width: 160,
    marginRight: 12,
    borderRadius: 12,
    elevation: 2,
  },
  trendingContent: {
    padding: 12,
  },
  trendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trendingSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sentimentChip: {
    marginLeft: 8,
  },
  trendingName: {
    fontSize: 12,
    marginBottom: 8,
  },
  trendingPrice: {
    marginBottom: 8,
  },
  trendingPriceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendingChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingMentions: {
    fontSize: 10,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
  },
});
