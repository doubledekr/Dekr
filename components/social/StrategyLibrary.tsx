import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Avatar,
  Chip,
  Button,
  Searchbar,
  SegmentedButtons,
  Badge,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Strategy, StrategyTemplate } from './StrategyBuilder';
import { safeHapticImpact } from '../../utils/haptics';

interface StrategyLibraryProps {
  onSelectStrategy?: (strategy: Strategy) => void;
  onSelectTemplate?: (template: StrategyTemplate) => void;
  onCreateNew?: () => void;
}

export const StrategyLibrary: React.FC<StrategyLibraryProps> = ({
  onSelectStrategy,
  onSelectTemplate,
  onCreateNew,
}) => {
  const [selectedTab, setSelectedTab] = useState<'my' | 'community' | 'templates'>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - in real implementation, this would come from your API
  const mockStrategies: Strategy[] = [
    {
      id: '1',
      name: 'Tech Growth Portfolio',
      description: 'Focused on high-growth technology companies with strong fundamentals',
      assets: [],
      totalAllocation: 100,
      riskLevel: 'high',
      expectedReturn: 0.15,
      maxDrawdown: 0.25,
      isPublic: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: '2',
      name: 'Balanced Income Strategy',
      description: 'Mix of dividend stocks and bonds for steady income',
      assets: [],
      totalAllocation: 100,
      riskLevel: 'medium',
      expectedReturn: 0.08,
      maxDrawdown: 0.12,
      isPublic: false,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
    },
  ];

  const mockTemplates: StrategyTemplate[] = [
    {
      id: '1',
      name: 'Conservative Growth',
      description: 'Low-risk strategy focused on stable, dividend-paying stocks',
      category: 'conservative',
      assets: [],
      riskLevel: 'low',
      expectedReturn: 0.06,
      maxDrawdown: 0.08,
      createdBy: 'Community',
      popularity: 95,
      performance: {
        totalReturn: 0.12,
        sharpeRatio: 1.8,
        winRate: 0.85,
      },
    },
    {
      id: '2',
      name: 'Aggressive Tech',
      description: 'High-growth technology and innovation companies',
      category: 'aggressive',
      assets: [],
      riskLevel: 'high',
      expectedReturn: 0.20,
      maxDrawdown: 0.35,
      createdBy: 'Expert Trader',
      popularity: 78,
      performance: {
        totalReturn: 0.28,
        sharpeRatio: 1.2,
        winRate: 0.65,
      },
    },
    {
      id: '3',
      name: 'Crypto Diversified',
      description: 'Balanced cryptocurrency portfolio with major coins',
      category: 'theme',
      assets: [],
      riskLevel: 'high',
      expectedReturn: 0.25,
      maxDrawdown: 0.40,
      createdBy: 'Crypto Expert',
      popularity: 82,
      performance: {
        totalReturn: 0.35,
        sharpeRatio: 0.9,
        winRate: 0.70,
      },
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, selectedCategory, selectedTab]);

  const loadData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setStrategies(mockStrategies);
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filterData = () => {
    let filtered: any[] = [];
    
    if (selectedTab === 'my') {
      filtered = strategies.filter(strategy => !strategy.isPublic);
    } else if (selectedTab === 'community') {
      filtered = strategies.filter(strategy => strategy.isPublic);
    } else if (selectedTab === 'templates') {
      filtered = templates;
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        if ('category' in item) {
          return item.category === selectedCategory;
        }
        return item.riskLevel === selectedCategory;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    // Sort by popularity/performance
    filtered.sort((a, b) => {
      if ('popularity' in a && 'popularity' in b) {
        return b.popularity - a.popularity;
      }
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    if (selectedTab === 'templates') {
      setTemplates(filtered);
    } else {
      setStrategies(filtered);
    }
  };

  const handleSelectItem = (item: Strategy | StrategyTemplate) => {
    safeHapticImpact();
    if ('category' in item) {
      onSelectTemplate?.(item as StrategyTemplate);
    } else {
      onSelectStrategy?.(item as Strategy);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#666';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'conservative':
        return '#4CAF50';
      case 'moderate':
        return '#FF9800';
      case 'aggressive':
        return '#F44336';
      case 'sector':
        return '#2196F3';
      case 'theme':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStrategy = ({ item }: { item: Strategy }) => (
    <Card style={styles.strategyCard}>
      <TouchableOpacity onPress={() => handleSelectItem(item)}>
        <Card.Content>
          <View style={styles.strategyHeader}>
            <View style={styles.strategyInfo}>
              <Text style={styles.strategyName}>{item.name}</Text>
              <Text style={styles.strategyDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            
            <View style={styles.strategyMeta}>
              <Chip
                mode="outlined"
                style={[styles.riskChip, { borderColor: getRiskColor(item.riskLevel) }]}
                textStyle={{ color: getRiskColor(item.riskLevel) }}
              >
                {item.riskLevel.toUpperCase()}
              </Chip>
              {item.isPublic && (
                <Badge style={styles.publicBadge}>PUBLIC</Badge>
              )}
            </View>
          </View>

          <View style={styles.strategyMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Expected Return</Text>
              <Text style={styles.metricValue}>
                {(item.expectedReturn * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Max Drawdown</Text>
              <Text style={styles.metricValue}>
                {(item.maxDrawdown * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Assets</Text>
              <Text style={styles.metricValue}>{item.assets.length}</Text>
            </View>
          </View>

          <View style={styles.strategyFooter}>
            <Text style={styles.lastUpdated}>
              Updated {formatDate(item.updatedAt)}
            </Text>
            <View style={styles.strategyActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="eye" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="share" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const renderTemplate = ({ item }: { item: StrategyTemplate }) => (
    <Card style={styles.templateCard}>
      <TouchableOpacity onPress={() => handleSelectItem(item)}>
        <Card.Content>
          <View style={styles.templateHeader}>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{item.name}</Text>
              <Text style={styles.templateDescription} numberOfLines={2}>
                {item.description}
              </Text>
              <Text style={styles.templateCreator}>by {item.createdBy}</Text>
            </View>
            
            <View style={styles.templateMeta}>
              <Chip
                mode="outlined"
                style={[styles.categoryChip, { borderColor: getCategoryColor(item.category) }]}
                textStyle={{ color: getCategoryColor(item.category) }}
              >
                {item.category.toUpperCase()}
              </Chip>
              <Badge style={styles.popularityBadge}>
                {item.popularity}% popular
              </Badge>
            </View>
          </View>

          <View style={styles.templateMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Return</Text>
              <Text style={styles.metricValue}>
                {(item.performance.totalReturn * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Sharpe Ratio</Text>
              <Text style={styles.metricValue}>
                {item.performance.sharpeRatio.toFixed(2)}
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Win Rate</Text>
              <Text style={styles.metricValue}>
                {(item.performance.winRate * 100).toFixed(0)}%
              </Text>
            </View>
          </View>

          <View style={styles.templateFooter}>
            <Chip
              mode="outlined"
              style={[styles.riskChip, { borderColor: getRiskColor(item.riskLevel) }]}
              textStyle={{ color: getRiskColor(item.riskLevel) }}
            >
              {item.riskLevel.toUpperCase()} RISK
            </Chip>
            <Button
              mode="outlined"
              compact
              style={styles.useTemplateButton}
              onPress={() => handleSelectItem(item)}
            >
              Use Template
            </Button>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  const currentData = selectedTab === 'templates' ? templates : strategies;
  const renderItem = selectedTab === 'templates' ? renderTemplate : renderStrategy;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Strategy Library</Text>
        <TouchableOpacity onPress={onCreateNew} style={styles.createButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#6CA393" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={selectedTab}
          onValueChange={setSelectedTab}
          buttons={[
            { value: 'my', label: 'My Strategies' },
            { value: 'community', label: 'Community' },
            { value: 'templates', label: 'Templates' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search strategies..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <SegmentedButtons
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'low', label: 'Low Risk' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High Risk' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <FlatList
        data={currentData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="strategy" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {selectedTab === 'my' 
                ? 'No personal strategies yet' 
                : selectedTab === 'community'
                ? 'No community strategies found'
                : 'No templates available'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'my' 
                ? 'Create your first strategy to get started' 
                : 'Try adjusting your search or filters'
              }
            </Text>
            {selectedTab === 'my' && (
              <Button
                mode="contained"
                onPress={onCreateNew}
                style={styles.createFirstButton}
              >
                Create Strategy
              </Button>
            )}
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    padding: 8,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  segmentedButtons: {
    marginTop: 8,
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
  listContainer: {
    padding: 16,
  },
  strategyCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  templateCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#6CA393',
  },
  strategyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  strategyInfo: {
    flex: 1,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  strategyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  strategyDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  templateCreator: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  strategyMeta: {
    alignItems: 'flex-end',
  },
  templateMeta: {
    alignItems: 'flex-end',
  },
  riskChip: {
    marginBottom: 4,
  },
  categoryChip: {
    marginBottom: 4,
  },
  publicBadge: {
    backgroundColor: '#4CAF50',
  },
  popularityBadge: {
    backgroundColor: '#FF9800',
  },
  strategyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  templateMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  strategyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
  },
  strategyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  useTemplateButton: {
    borderColor: '#6CA393',
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
  createFirstButton: {
    marginTop: 16,
    backgroundColor: '#6CA393',
  },
});
