import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import { SocialDeckBrowser } from '../../components/social/SocialDeckBrowser';
import { SwipeToHome } from '../../components/SwipeToHome';
import { FriendCardData, FriendRequestCard, PublicProfileCard } from '../../types/deck';

// Mock data - replace with actual data fetching
const mockFriends: FriendCardData[] = [
  {
    id: 'friend-1',
    type: 'friend',
    userId: 'user1',
    username: 'TraderPro',
    avatar: 'TP',
    status: 'online',
    recentActivity: 'Just completed AAPL analysis',
    mutualFriends: 5,
    portfolioPerformance: 12.5,
    lastInteraction: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    reputation: 850,
    isExpert: true,
    interests: ['Options Trading', 'Technical Analysis', 'Risk Management'],
    recentAchievements: ['Top Performer This Month', 'Expert Trader Badge'],
  },
  {
    id: 'friend-2',
    type: 'friend',
    userId: 'user2',
    username: 'MarketGuru',
    avatar: 'MG',
    status: 'offline',
    recentActivity: 'Shared TSLA prediction',
    mutualFriends: 3,
    portfolioPerformance: -2.1,
    lastInteraction: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    reputation: 420,
    isExpert: false,
    interests: ['Day Trading', 'Cryptocurrency'],
    recentAchievements: ['First Profit', 'Active Trader'],
  },
];

const mockFriendRequests: FriendRequestCard[] = [
  {
    id: 'request-1',
    type: 'friend_request',
    fromUserId: 'user3',
    username: 'NewTrader',
    avatar: 'NT',
    mutualFriends: 2,
    requestMessage: 'Hi! I saw your analysis on SPY and would love to connect.',
    sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    interests: ['Swing Trading', 'Fundamental Analysis'],
    reputation: 150,
    isExpert: false,
  },
  {
    id: 'request-2',
    type: 'friend_request',
    fromUserId: 'user4',
    username: 'OptionsMaster',
    avatar: 'OM',
    mutualFriends: 8,
    requestMessage: 'Looking to connect with other options traders!',
    sentAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    interests: ['Options Trading', 'Volatility Trading'],
    reputation: 720,
    isExpert: true,
  },
];

const mockPublicProfiles: PublicProfileCard[] = [
  {
    id: 'profile-1',
    type: 'public_profile',
    userId: 'user5',
    username: 'QuantTrader',
    avatar: 'QT',
    bio: 'Algorithmic trader specializing in quantitative strategies and machine learning.',
    interests: ['Quantitative Trading', 'Machine Learning', 'Python'],
    reputation: 1200,
    isExpert: true,
    portfolioPerformance: 25.8,
    mutualConnections: 12,
    recentAchievements: ['Quant Master', 'ML Expert', 'Top 1% Trader'],
    lastActive: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
  {
    id: 'profile-2',
    type: 'public_profile',
    userId: 'user6',
    username: 'ValueInvestor',
    avatar: 'VI',
    bio: 'Long-term value investor focused on fundamental analysis and dividend stocks.',
    interests: ['Value Investing', 'Dividend Stocks', 'Fundamental Analysis'],
    reputation: 680,
    isExpert: false,
    portfolioPerformance: 8.2,
    mutualConnections: 5,
    recentAchievements: ['Value Investor', 'Dividend Champion'],
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
];

export default function SocialTab() {
  const theme = useTheme();

  return (
    <SwipeToHome>
      <View style={styles.container}>
        <SocialDeckBrowser 
          friends={mockFriends}
          friendRequests={mockFriendRequests}
          publicProfiles={mockPublicProfiles}
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
});