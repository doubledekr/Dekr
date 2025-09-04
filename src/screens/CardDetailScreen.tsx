import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CardNotes } from '../components/CardNotes';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useThemeColor } from '../../hooks/useThemeColor';
import { PriceChart } from '../../components/PriceChart';
import { useCreateShareLink, useShareActions } from '../hooks/useSharing';

type CardDetailRouteProp = RouteProp<{ CardDetail: { symbol: string; cardId?: string } }, 'CardDetail'>;

interface TabButtonProps {
  title: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, icon, active, onPress }) => {
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const textColor = useThemeColor({}, 'text');

  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        { borderBottomColor: active ? tintColor : 'transparent' }
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={icon}
        size={20}
        color={active ? tintColor : mutedColor}
      />
      <Text
        style={[
          styles.tabLabel,
          { color: active ? tintColor : mutedColor }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export const CardDetailScreen: React.FC = () => {
  const route = useRoute<CardDetailRouteProp>();
  const navigation = useNavigation();
  const { symbol, cardId } = route.params;

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'news'>('overview');

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  
  const { createShareLink, loading: shareLoading } = useCreateShareLink();
  const { shareViaSystem, copyToClipboard, shareViaCode } = useShareActions();

  // Mock data - replace with actual data fetching
  const cardData = {
    symbol,
    name: symbol === 'AAPL' ? 'Apple Inc.' : 
          symbol === 'BTC' ? 'Bitcoin' : 
          symbol === 'TSLA' ? 'Tesla, Inc.' : 
          `${symbol} Company`,
    price: 175.43,
    change: 2.15,
    changePercent: 1.25,
    marketCap: 2800000000000,
    volume: 45678900,
    high52w: 199.62,
    low52w: 124.17,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.priceSection}>
        <Text style={[styles.currentPrice, { color: textColor }]}>
          {formatPrice(cardData.price)}
        </Text>
        <View style={styles.changeContainer}>
          <Text style={[
            styles.change,
            { color: cardData.change >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            {cardData.change >= 0 ? '+' : ''}{cardData.change.toFixed(2)}
          </Text>
          <Text style={[
            styles.changePercent,
            { color: cardData.change >= 0 ? '#4CAF50' : '#F44336' }
          ]}>
            ({cardData.changePercent >= 0 ? '+' : ''}{cardData.changePercent.toFixed(2)}%)
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <PriceChart
          data={[]} // Add actual price data
          height={200}
        />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: mutedColor }]}>Market Cap</Text>
          <Text style={[styles.statValue, { color: textColor }]}>
            {formatMarketCap(cardData.marketCap)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: mutedColor }]}>Volume</Text>
          <Text style={[styles.statValue, { color: textColor }]}>
            {cardData.volume.toLocaleString()}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: mutedColor }]}>52W High</Text>
          <Text style={[styles.statValue, { color: textColor }]}>
            {formatPrice(cardData.high52w)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: mutedColor }]}>52W Low</Text>
          <Text style={[styles.statValue, { color: textColor }]}>
            {formatPrice(cardData.low52w)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderNotes = () => (
    <CardNotes
      cardId={cardId || symbol}
      symbol={symbol}
      style={styles.tabContent}
    />
  );

  const renderNews = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyState}>
        <MaterialCommunityIcons name="newspaper" size={48} color={mutedColor} />
        <Text style={[styles.emptyTitle, { color: textColor }]}>
          News Coming Soon
        </Text>
        <Text style={[styles.emptyMessage, { color: mutedColor }]}>
          Latest news and analysis for {symbol} will appear here
        </Text>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'notes':
        return renderNotes();
      case 'news':
        return renderNews();
      default:
        return renderOverview();
    }
  };

  const handleShareCard = async () => {
    const shareOptions = [
      {
        text: 'Share Link',
        onPress: () => handleCreateShareLink(),
      },
      {
        text: 'Share via Code',
        onPress: () => handleShareViaCode(),
      },
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert(
      'Share Card',
      `Share ${cardData.name} (${symbol}) with others`,
      shareOptions
    );
  };

  const handleCreateShareLink = async () => {
    try {
      const result = await createShareLink({
        type: 'card',
        targetId: symbol,
        permission: 'view',
        expiresIn: 30, // 30 days
      });

      const message = `Check out ${cardData.name} (${symbol}) on Dekr!`;
      
      Alert.alert(
        'Share Created',
        'Your share link is ready!',
        [
          {
            text: 'Copy Link',
            onPress: () => copyToClipboard(result.deepLink, 'Share link copied!'),
          },
          {
            text: 'Share Link',
            onPress: () => shareViaSystem(`${cardData.name} (${symbol})`, result.deepLink, message),
          },
          {
            text: 'Share Code',
            onPress: () => shareViaCode(result.linkCode, `${cardData.name} (${symbol})`),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create share link. Please try again.');
    }
  };

  const handleShareViaCode = async () => {
    try {
      const result = await createShareLink({
        type: 'card',
        targetId: symbol,
        permission: 'view',
        expiresIn: 7, // 7 days for code sharing
      });

      await shareViaCode(result.linkCode, `${cardData.name} (${symbol})`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create share code. Please try again.');
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: cardData.name,
      headerBackTitle: 'Back',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShareCard}
          disabled={shareLoading}
          style={{ marginRight: 16 }}
        >
          {shareLoading ? (
            <ActivityIndicator size="small" color={mutedColor} />
          ) : (
            <MaterialCommunityIcons name="share" size={24} color={mutedColor} />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, cardData.name, shareLoading, mutedColor]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.symbolContainer}>
          <Text style={[styles.symbol, { color: textColor }]}>
            {symbol}
          </Text>
          <Text style={[styles.companyName, { color: mutedColor }]}>
            {cardData.name}
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TabButton
          title="Overview"
          icon="chart-line"
          active={activeTab === 'overview'}
          onPress={() => setActiveTab('overview')}
        />
        <TabButton
          title="Notes"
          icon="comment-text"
          active={activeTab === 'notes'}
          onPress={() => setActiveTab('notes')}
        />
        <TabButton
          title="News"
          icon="newspaper"
          active={activeTab === 'news'}
          onPress={() => setActiveTab('news')}
        />
      </View>

      {renderTabContent()}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  symbolContainer: {
    alignItems: 'center',
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  priceSection: {
    alignItems: 'center',
    padding: 20,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  change: {
    fontSize: 16,
    fontWeight: '600',
  },
  changePercent: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartContainer: {
    padding: 20,
    paddingTop: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    paddingTop: 0,
  },
  statItem: {
    width: '50%',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
