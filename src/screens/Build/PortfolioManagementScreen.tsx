import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme, Card, Avatar, Chip, Button, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SignalCard, SignalData } from '../../../components/social/SignalCard';

export function PortfolioManagementScreen() {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState('overview');

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'chart-line' },
    { id: 'positions', name: 'Positions', icon: 'briefcase' },
    { id: 'signals', name: 'Signals', icon: 'bell' },
    { id: 'alerts', name: 'Alerts', icon: 'alert' },
  ];

  const portfolioStats = {
    totalValue: 125000,
    dayChange: 2500,
    dayChangePercent: 2.04,
    totalReturn: 15000,
    totalReturnPercent: 13.64,
    winRate: 68.5,
    sharpeRatio: 1.42,
  };

  const positions = [
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 50,
      avgPrice: 175.00,
      currentPrice: 185.50,
      value: 9275,
      gain: 525,
      gainPercent: 6.0,
      allocation: 7.4,
    },
    {
      id: '2',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      shares: 20,
      avgPrice: 220.00,
      currentPrice: 245.80,
      value: 4916,
      gain: 516,
      gainPercent: 11.7,
      allocation: 3.9,
    },
    {
      id: '3',
      symbol: 'NVDA',
      name: 'NVIDIA Corporation',
      shares: 15,
      avgPrice: 450.00,
      currentPrice: 520.15,
      value: 7802.25,
      gain: 1052.25,
      gainPercent: 15.6,
      allocation: 6.2,
    },
  ];

  const signals: SignalData[] = [
    {
      id: '1',
      asset: {
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        price: 385.20,
        change: 1.9,
        type: 'stock',
      },
      signal: {
        type: 'buy',
        strength: 'strong',
        confidence: 88,
        reasoning: 'Strong cloud growth, AI integration, and solid fundamentals. Technical breakout above resistance.',
        targetPrice: 420.00,
        stopLoss: 360.00,
        timeHorizon: 'medium',
      },
      source: {
        type: 'ai',
        name: 'AI Strategy Engine',
        reputation: 95,
        isVerified: true,
      },
      performance: {
        accuracy: 78.5,
        totalSignals: 156,
        winRate: 78.5,
        avgReturn: 12.3,
      },
      timestamp: new Date('2024-01-15T14:30:00'),
      expiry: new Date('2024-01-22T14:30:00'),
      isActive: true,
      userAction: undefined,
      communityVotes: {
        upvotes: 67,
        downvotes: 12,
        userVote: undefined,
      },
    },
    {
      id: '2',
      asset: {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        price: 142.80,
        change: -0.5,
        type: 'stock',
      },
      signal: {
        type: 'hold',
        strength: 'moderate',
        confidence: 65,
        reasoning: 'Mixed signals. Strong search revenue but regulatory concerns. Wait for clearer direction.',
        timeHorizon: 'short',
      },
      source: {
        type: 'expert',
        name: 'Sarah Chen',
        reputation: 2200,
        isVerified: true,
      },
      performance: {
        accuracy: 82.1,
        totalSignals: 89,
        winRate: 82.1,
        avgReturn: 8.7,
      },
      timestamp: new Date('2024-01-15T11:15:00'),
      isActive: true,
      userAction: 'ignored',
      communityVotes: {
        upvotes: 34,
        downvotes: 18,
        userVote: 'downvote',
      },
    },
  ];

  const alerts = [
    {
      id: '1',
      type: 'price',
      symbol: 'AAPL',
      condition: 'above',
      value: 190.00,
      currentPrice: 185.50,
      isActive: true,
    },
    {
      id: '2',
      type: 'volume',
      symbol: 'TSLA',
      condition: 'above',
      value: '2x average',
      currentPrice: 245.80,
      isActive: true,
    },
    {
      id: '3',
      type: 'rsi',
      symbol: 'NVDA',
      condition: 'below',
      value: 30,
      currentPrice: 520.15,
      isActive: false,
    },
  ];

  const handleVote = (signalId: string, vote: 'upvote' | 'downvote') => {
    console.log('Voting on signal:', signalId, vote);
  };

  const handleFollow = (signalId: string) => {
    console.log('Following signal:', signalId);
  };

  const handleIgnore = (signalId: string) => {
    console.log('Ignoring signal:', signalId);
  };

  const handleOpposite = (signalId: string) => {
    console.log('Taking opposite position for signal:', signalId);
  };

  const handleViewProfile = (userId: string) => {
    console.log('Viewing profile:', userId);
  };

  const handleViewAsset = (symbol: string) => {
    console.log('Viewing asset:', symbol);
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? '#10b981' : '#ef4444';
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'price': return 'currency-usd';
      case 'volume': return 'chart-bar';
      case 'rsi': return 'chart-line';
      default: return 'bell';
    }
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Portfolio Stats */}
      <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.statsContent}>
          <View style={styles.totalValueSection}>
            <Text style={[styles.totalValue, { color: theme.colors.onSurface }]}>
              ${portfolioStats.totalValue.toLocaleString()}
            </Text>
            <View style={styles.dayChangeRow}>
              <MaterialCommunityIcons 
                name={portfolioStats.dayChange >= 0 ? "trending-up" : "trending-down"} 
                size={20} 
                color={getChangeColor(portfolioStats.dayChange)}
              />
              <Text style={[styles.dayChange, { color: getChangeColor(portfolioStats.dayChange) }]}>
                {portfolioStats.dayChange >= 0 ? '+' : ''}${portfolioStats.dayChange.toLocaleString()} ({portfolioStats.dayChangePercent.toFixed(2)}%)
              </Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: getChangeColor(portfolioStats.totalReturn) }]}>
                {portfolioStats.totalReturn >= 0 ? '+' : ''}${portfolioStats.totalReturn.toLocaleString()}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Total Return
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {portfolioStats.winRate.toFixed(1)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Win Rate
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                {portfolioStats.sharpeRatio.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                Sharpe Ratio
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Top Positions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Top Positions
        </Text>
        
        {positions.slice(0, 3).map((position) => (
          <Card key={position.id} style={[styles.positionCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.positionContent}>
              <View style={styles.positionHeader}>
                <View style={styles.positionInfo}>
                  <Text style={[styles.positionSymbol, { color: theme.colors.onSurface }]}>
                    {position.symbol}
                  </Text>
                  <Text style={[styles.positionName, { color: theme.colors.onSurfaceVariant }]}>
                    {position.name}
                  </Text>
                </View>
                <View style={styles.positionValue}>
                  <Text style={[styles.positionValueText, { color: theme.colors.onSurface }]}>
                    ${position.value.toLocaleString()}
                  </Text>
                  <Text style={[styles.positionAllocation, { color: theme.colors.onSurfaceVariant }]}>
                    {position.allocation.toFixed(1)}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.positionDetails}>
                <View style={styles.positionDetail}>
                  <Text style={[styles.positionDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Shares
                  </Text>
                  <Text style={[styles.positionDetailValue, { color: theme.colors.onSurface }]}>
                    {position.shares}
                  </Text>
                </View>
                <View style={styles.positionDetail}>
                  <Text style={[styles.positionDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Avg Price
                  </Text>
                  <Text style={[styles.positionDetailValue, { color: theme.colors.onSurface }]}>
                    ${position.avgPrice.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.positionDetail}>
                  <Text style={[styles.positionDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Current
                  </Text>
                  <Text style={[styles.positionDetailValue, { color: theme.colors.onSurface }]}>
                    ${position.currentPrice.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.positionDetail}>
                  <Text style={[styles.positionDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Gain/Loss
                  </Text>
                  <Text style={[styles.positionDetailValue, { color: getChangeColor(position.gain) }]}>
                    {position.gain >= 0 ? '+' : ''}${position.gain.toFixed(2)} ({position.gainPercent.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderPositions = () => (
    <View style={styles.tabContent}>
      {positions.map((position) => (
        <Card key={position.id} style={[styles.positionCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.positionContent}>
            <View style={styles.positionHeader}>
              <View style={styles.positionInfo}>
                <Text style={[styles.positionSymbol, { color: theme.colors.onSurface }]}>
                  {position.symbol}
                </Text>
                <Text style={[styles.positionName, { color: theme.colors.onSurfaceVariant }]}>
                  {position.name}
                </Text>
              </View>
              <View style={styles.positionValue}>
                <Text style={[styles.positionValueText, { color: theme.colors.onSurface }]}>
                  ${position.value.toLocaleString()}
                </Text>
                <Text style={[styles.positionAllocation, { color: theme.colors.onSurfaceVariant }]}>
                  {position.allocation.toFixed(1)}%
                </Text>
              </View>
            </View>
            
            <View style={styles.positionDetails}>
              <View style={styles.positionDetail}>
                <Text style={[styles.positionDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Shares
                </Text>
                <Text style={[styles.positionDetailValue, { color: theme.colors.onSurface }]}>
                  {position.shares}
                </Text>
              </View>
              <View style={styles.positionDetail}>
                <Text style={[styles.positionDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Avg Price
                </Text>
                <Text style={[styles.positionDetailValue, { color: theme.colors.onSurface }]}>
                  ${position.avgPrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.positionDetail}>
                <Text style={[styles.positionDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Current
                </Text>
                <Text style={[styles.positionDetailValue, { color: theme.colors.onSurface }]}>
                  ${position.currentPrice.toFixed(2)}
                </Text>
              </View>
              <View style={styles.positionDetail}>
                <Text style={[styles.positionDetailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Gain/Loss
                </Text>
                <Text style={[styles.positionDetailValue, { color: getChangeColor(position.gain) }]}>
                  {position.gain >= 0 ? '+' : ''}${position.gain.toFixed(2)} ({position.gainPercent.toFixed(1)}%)
                </Text>
              </View>
            </View>
            
            <View style={styles.positionActions}>
              <Button mode="outlined" compact style={styles.positionAction}>
                Sell
              </Button>
              <Button mode="outlined" compact style={styles.positionAction}>
                Add
              </Button>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderSignals = () => (
    <View style={styles.tabContent}>
      {signals.map((signal) => (
        <SignalCard
          key={signal.id}
          data={signal}
          onFollow={handleFollow}
          onIgnore={handleIgnore}
          onOpposite={handleOpposite}
          onVote={handleVote}
          onViewProfile={handleViewProfile}
          onViewAsset={handleViewAsset}
        />
      ))}
    </View>
  );

  const renderAlerts = () => (
    <View style={styles.tabContent}>
      {alerts.map((alert) => (
        <Card key={alert.id} style={[styles.alertCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <MaterialCommunityIcons 
                name={getAlertTypeIcon(alert.type) as any} 
                size={24} 
                color={theme.colors.primary}
              />
              <View style={styles.alertInfo}>
                <Text style={[styles.alertSymbol, { color: theme.colors.onSurface }]}>
                  {alert.symbol}
                </Text>
                <Text style={[styles.alertCondition, { color: theme.colors.onSurfaceVariant }]}>
                  {alert.type.toUpperCase()} {alert.condition} {alert.value}
                </Text>
              </View>
              <Chip 
                mode={alert.isActive ? "filled" : "outlined"}
                compact
                style={alert.isActive ? styles.activeChip : styles.inactiveChip}
                textStyle={alert.isActive ? styles.activeChipText : undefined}
              >
                {alert.isActive ? 'Active' : 'Inactive'}
              </Chip>
            </View>
            
            <View style={styles.alertDetails}>
              <Text style={[styles.alertCurrentPrice, { color: theme.colors.onSurface }]}>
                Current: ${alert.currentPrice.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>
          Portfolio Management
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Manage your investments and track performance
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && styles.tabActive,
                { borderColor: theme.colors.outline }
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <MaterialCommunityIcons 
                name={tab.icon as any} 
                size={20} 
                color={selectedTab === tab.id ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <Text style={[
                styles.tabText,
                { color: selectedTab === tab.id ? theme.colors.primary : theme.colors.onSurfaceVariant }
              ]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'positions' && renderPositions()}
        {selectedTab === 'signals' && renderSignals()}
        {selectedTab === 'alerts' && renderAlerts()}
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
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabActive: {
    backgroundColor: '#e0f2fe',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
  },
  statsContent: {
    padding: 20,
  },
  totalValueSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dayChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayChange: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  positionCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  positionContent: {
    padding: 16,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionInfo: {
    flex: 1,
  },
  positionSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  positionName: {
    fontSize: 14,
  },
  positionValue: {
    alignItems: 'flex-end',
  },
  positionValueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  positionAllocation: {
    fontSize: 12,
  },
  positionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  positionDetail: {
    alignItems: 'center',
  },
  positionDetailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  positionDetailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  positionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  positionAction: {
    flex: 1,
  },
  alertCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  alertContent: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alertSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertCondition: {
    fontSize: 14,
  },
  activeChip: {
    backgroundColor: '#10b981',
  },
  activeChipText: {
    color: '#ffffff',
  },
  inactiveChip: {
    borderColor: '#6b7280',
  },
  alertDetails: {
    marginTop: 8,
  },
  alertCurrentPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
});
