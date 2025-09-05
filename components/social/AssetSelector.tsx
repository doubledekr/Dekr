import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Card,
  Avatar,
  Chip,
  Button,
  Searchbar,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyAsset } from './StrategyBuilder';
import { safeHapticImpact } from '../../utils/haptics';

interface AssetSelectorProps {
  onSelectAsset: (asset: StrategyAsset) => void;
  onClose: () => void;
  currentAllocation: number;
}

interface CommunityAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'crypto' | 'etf' | 'bond';
  marketCap?: number;
  volume?: number;
  recommendationCount: number;
  avgRating: number;
  lastUpdated: Date;
  tags: string[];
  description?: string;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  onSelectAsset,
  onClose,
  currentAllocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAssets, setSelectedAssets] = useState<CommunityAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<CommunityAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - in real implementation, this would come from your API
  const mockAssets: CommunityAsset[] = [
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 175.43,
      change: 2.15,
      changePercent: 1.24,
      type: 'stock',
      marketCap: 2800000000000,
      volume: 45000000,
      recommendationCount: 156,
      avgRating: 4.2,
      lastUpdated: new Date(),
      tags: ['tech', 'large-cap', 'dividend'],
      description: 'Leading technology company with strong ecosystem',
    },
    {
      id: '2',
      symbol: 'TSLA',
      name: 'Tesla Inc.',
      price: 248.87,
      change: -5.23,
      changePercent: -2.06,
      type: 'stock',
      marketCap: 790000000000,
      volume: 32000000,
      recommendationCount: 89,
      avgRating: 3.8,
      lastUpdated: new Date(),
      tags: ['ev', 'automotive', 'energy'],
      description: 'Electric vehicle and clean energy company',
    },
    {
      id: '3',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.00,
      change: 1250.00,
      changePercent: 2.98,
      type: 'crypto',
      marketCap: 850000000000,
      volume: 18000000000,
      recommendationCount: 234,
      avgRating: 4.1,
      lastUpdated: new Date(),
      tags: ['crypto', 'store-of-value', 'digital-gold'],
      description: 'First and largest cryptocurrency',
    },
    {
      id: '4',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2650.00,
      change: 85.00,
      changePercent: 3.31,
      type: 'crypto',
      marketCap: 320000000000,
      volume: 12000000000,
      recommendationCount: 178,
      avgRating: 4.0,
      lastUpdated: new Date(),
      tags: ['crypto', 'smart-contracts', 'defi'],
      description: 'Smart contract platform and cryptocurrency',
    },
    {
      id: '5',
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF',
      price: 445.67,
      change: 1.23,
      changePercent: 0.28,
      type: 'etf',
      marketCap: 450000000000,
      volume: 25000000,
      recommendationCount: 67,
      avgRating: 4.5,
      lastUpdated: new Date(),
      tags: ['etf', 'sp500', 'diversified'],
      description: 'Tracks the S&P 500 index',
    },
    {
      id: '6',
      symbol: 'QQQ',
      name: 'Invesco QQQ Trust',
      price: 378.45,
      change: 2.87,
      changePercent: 0.76,
      type: 'etf',
      marketCap: 200000000000,
      volume: 18000000,
      recommendationCount: 45,
      avgRating: 4.3,
      lastUpdated: new Date(),
      tags: ['etf', 'nasdaq', 'tech-heavy'],
      description: 'Tracks the NASDAQ-100 index',
    },
  ];

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setSelectedAssets(mockAssets);
      setFilteredAssets(mockAssets);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchQuery, selectedCategory, selectedAssets]);

  const filterAssets = () => {
    let filtered = selectedAssets;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.type === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.symbol.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort by recommendation count and rating
    filtered.sort((a, b) => {
      const scoreA = a.recommendationCount * a.avgRating;
      const scoreB = b.recommendationCount * b.avgRating;
      return scoreB - scoreA;
    });

    setFilteredAssets(filtered);
  };

  const handleSelectAsset = (asset: CommunityAsset) => {
    const strategyAsset: StrategyAsset = {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      price: asset.price,
      allocation: Math.min(10, 100 - currentAllocation), // Default 10% or remaining space
      type: asset.type,
      source: 'community',
    };

    onSelectAsset(strategyAsset);
    safeHapticImpact();
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'stock':
        return 'chart-line';
      case 'crypto':
        return 'bitcoin';
      case 'etf':
        return 'chart-box';
      case 'bond':
        return 'shield-check';
      default:
        return 'chart-line';
    }
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? '#4CAF50' : '#F44336';
  };

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const renderAsset = ({ item }: { item: CommunityAsset }) => (
    <Card style={styles.assetCard}>
      <TouchableOpacity onPress={() => handleSelectAsset(item)}>
        <Card.Content>
          <View style={styles.assetHeader}>
            <View style={styles.assetInfo}>
              <Avatar.Icon
                size={40}
                icon={getAssetIcon(item.type)}
                style={styles.assetIcon}
              />
              <View style={styles.assetDetails}>
                <Text style={styles.assetSymbol}>{item.symbol}</Text>
                <Text style={styles.assetName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.assetPrice}>${item.price.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.assetMetrics}>
              <Text style={[styles.changeText, { color: getChangeColor(item.change) }]}>
                {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)} ({item.changePercent.toFixed(2)}%)
              </Text>
              <Text style={styles.marketCap}>{formatMarketCap(item.marketCap)}</Text>
            </View>
          </View>

          <View style={styles.assetFooter}>
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  compact
                  style={styles.tag}
                  textStyle={styles.tagText}
                >
                  {tag}
                </Chip>
              ))}
            </View>

            <View style={styles.communityStats}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="thumb-up" size={16} color="#666" />
                <Text style={styles.statText}>{item.recommendationCount}</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
                <Text style={styles.statText}>{item.avgRating.toFixed(1)}</Text>
              </View>
            </View>
          </View>

          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Asset</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search assets..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <SegmentedButtons
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'stock', label: 'Stocks' },
            { value: 'crypto', label: 'Crypto' },
            { value: 'etf', label: 'ETFs' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.allocationInfo}>
        <Text style={styles.allocationText}>
          Current Allocation: {currentAllocation.toFixed(1)}% • Remaining: {(100 - currentAllocation).toFixed(1)}%
        </Text>
      </View>

      <FlatList
        data={filteredAssets}
        renderItem={renderAsset}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="search" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No assets found</Text>
            <Text style={styles.emptySubtext}>
              Try adjusting your search or category filter
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    marginBottom: 12,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  allocationInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  allocationText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  assetCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetIcon: {
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  assetDetails: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  assetName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  assetPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6CA393',
    marginTop: 2,
  },
  assetMetrics: {
    alignItems: 'flex-end',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  marketCap: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    borderColor: '#e0e0e0',
  },
  tagText: {
    fontSize: 10,
    color: '#666',
  },
  communityStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
