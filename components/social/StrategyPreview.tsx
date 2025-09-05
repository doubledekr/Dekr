import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  ProgressBar,
  Switch,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Strategy, StrategyAsset } from './StrategyBuilder';
import { PieChart } from 'react-native-chart-kit';
import { safeHapticImpact } from '../../utils/haptics';

const { width } = Dimensions.get('window');

interface StrategyPreviewProps {
  strategy: Strategy;
  onEdit?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onClose?: () => void;
}

export const StrategyPreview: React.FC<StrategyPreviewProps> = ({
  strategy,
  onEdit,
  onSave,
  onShare,
  onClose,
}) => {
  const [isPublic, setIsPublic] = useState(strategy.isPublic);

  const chartData = strategy.assets.map((asset, index) => ({
    name: asset.symbol,
    population: asset.allocation,
    color: getAssetColor(index),
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  const totalValue = 10000; // Mock portfolio value
  const expectedReturn = strategy.expectedReturn * totalValue;
  const maxDrawdown = strategy.maxDrawdown * totalValue;

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

  const getAssetColor = (index: number) => {
    const colors = [
      '#6CA393', '#4CAF50', '#2196F3', '#FF9800', '#F44336',
      '#9C27B0', '#00BCD4', '#8BC34A', '#FFC107', '#E91E63'
    ];
    return colors[index % colors.length];
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderAssetItem = (asset: StrategyAsset, index: number) => (
    <Card key={asset.id} style={styles.assetCard}>
      <Card.Content>
        <View style={styles.assetHeader}>
          <View style={styles.assetInfo}>
            <MaterialCommunityIcons
              name={getAssetIcon(asset.type)}
              size={24}
              color={getAssetColor(index)}
            />
            <View style={styles.assetDetails}>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.assetName} numberOfLines={1}>
                {asset.name}
              </Text>
            </View>
          </View>

          <View style={styles.assetMetrics}>
            <Text style={styles.allocationValue}>{asset.allocation.toFixed(1)}%</Text>
            <Text style={styles.dollarValue}>
              {formatCurrency((asset.allocation / 100) * totalValue)}
            </Text>
          </View>
        </View>

        <View style={styles.allocationBar}>
          <View 
            style={[
              styles.allocationFill, 
              { 
                width: `${asset.allocation}%`,
                backgroundColor: getAssetColor(index)
              }
            ]} 
          />
        </View>

        <View style={styles.assetFooter}>
          <Chip
            mode="outlined"
            style={styles.typeChip}
            textStyle={styles.typeChipText}
          >
            {asset.type.toUpperCase()}
          </Chip>
          <Text style={styles.assetPrice}>${asset.price.toFixed(2)}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Strategy Preview</Text>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={24} color="#6CA393" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Strategy Overview */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text style={styles.strategyName}>{strategy.name}</Text>
            {strategy.description && (
              <Text style={styles.strategyDescription}>{strategy.description}</Text>
            )}
            
            <View style={styles.strategyMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Created</Text>
                <Text style={styles.metaValue}>
                  {strategy.createdAt.toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Assets</Text>
                <Text style={styles.metaValue}>{strategy.assets.length}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Allocation</Text>
                <Text style={styles.metaValue}>{strategy.totalAllocation.toFixed(1)}%</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Portfolio Allocation Chart */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Portfolio Allocation</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={chartData}
                width={width - 80}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                absolute
              />
            </View>
          </Card.Content>
        </Card>

        {/* Strategy Metrics */}
        <Card style={styles.metricsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Strategy Metrics</Text>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Risk Level</Text>
                <Chip
                  mode="outlined"
                  style={[
                    styles.riskChip,
                    { borderColor: getRiskColor(strategy.riskLevel) }
                  ]}
                  textStyle={{ color: getRiskColor(strategy.riskLevel) }}
                >
                  {strategy.riskLevel.toUpperCase()}
                </Chip>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Expected Return</Text>
                <Text style={styles.metricValue}>
                  {(strategy.expectedReturn * 100).toFixed(1)}%
                </Text>
                <Text style={styles.metricSubtext}>
                  {formatCurrency(expectedReturn)} annually
                </Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Max Drawdown</Text>
                <Text style={styles.metricValue}>
                  {(strategy.maxDrawdown * 100).toFixed(1)}%
                </Text>
                <Text style={styles.metricSubtext}>
                  {formatCurrency(maxDrawdown)} potential loss
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Asset Breakdown */}
        <Card style={styles.assetsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Asset Breakdown</Text>
            {strategy.assets.map((asset, index) => renderAssetItem(asset, index))}
          </Card.Content>
        </Card>

        {/* Diversification Analysis */}
        <Card style={styles.diversificationCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Diversification Analysis</Text>
            
            <View style={styles.diversificationItem}>
              <Text style={styles.diversificationLabel}>Asset Types</Text>
              <View style={styles.diversificationBar}>
                <View style={[styles.diversificationFill, { width: '75%' }]} />
              </View>
              <Text style={styles.diversificationValue}>Good</Text>
            </View>
            
            <View style={styles.diversificationItem}>
              <Text style={styles.diversificationLabel}>Concentration Risk</Text>
              <View style={styles.diversificationBar}>
                <View style={[styles.diversificationFill, { width: '60%', backgroundColor: '#FF9800' }]} />
              </View>
              <Text style={styles.diversificationValue}>Moderate</Text>
            </View>
            
            <View style={styles.diversificationItem}>
              <Text style={styles.diversificationLabel}>Geographic Spread</Text>
              <View style={styles.diversificationBar}>
                <View style={[styles.diversificationFill, { width: '40%', backgroundColor: '#F44336' }]} />
              </View>
              <Text style={styles.diversificationValue}>Limited</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Sharing Options */}
        <Card style={styles.sharingCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Sharing Options</Text>
            
            <View style={styles.sharingOption}>
              <View style={styles.sharingInfo}>
                <MaterialCommunityIcons name="earth" size={24} color="#6CA393" />
                <View style={styles.sharingDetails}>
                  <Text style={styles.sharingTitle}>Make Public</Text>
                  <Text style={styles.sharingDescription}>
                    Allow other users to view and copy this strategy
                  </Text>
                </View>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                color="#6CA393"
              />
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={onEdit}
          style={styles.footerButton}
          icon="pencil"
        >
          Edit
        </Button>
        <Button
          mode="outlined"
          onPress={onShare}
          style={styles.footerButton}
          icon="share"
        >
          Share
        </Button>
        <Button
          mode="contained"
          onPress={onSave}
          style={[styles.footerButton, styles.saveButton]}
          icon="content-save"
        >
          Save Strategy
        </Button>
      </View>
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  strategyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  strategyDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  strategyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  metricsCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  metricsGrid: {
    gap: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  riskChip: {
    marginTop: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  metricSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  assetsCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  assetCard: {
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetDetails: {
    marginLeft: 12,
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
  assetMetrics: {
    alignItems: 'flex-end',
  },
  allocationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dollarValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  allocationBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  allocationFill: {
    height: '100%',
    borderRadius: 3,
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeChip: {
    borderColor: '#e0e0e0',
  },
  typeChipText: {
    fontSize: 10,
    color: '#666',
  },
  assetPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6CA393',
  },
  diversificationCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  diversificationItem: {
    marginBottom: 16,
  },
  diversificationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  diversificationBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  diversificationFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  diversificationValue: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  sharingCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sharingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sharingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sharingDetails: {
    marginLeft: 12,
    flex: 1,
  },
  sharingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sharingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  footerButton: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#6CA393',
  },
});
