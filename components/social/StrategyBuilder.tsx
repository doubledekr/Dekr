import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  Chip,
  FAB,
  Modal,
  Portal,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { safeHapticImpact } from '../../utils/haptics';

const { width } = Dimensions.get('window');

export interface StrategyAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  allocation: number; // Percentage (0-100)
  type: 'stock' | 'crypto' | 'etf' | 'bond';
  source: 'community' | 'personal' | 'template';
  entryCriteria?: {
    price?: number;
    technical?: string;
    fundamental?: string;
  };
  exitCriteria?: {
    targetPrice?: number;
    stopLoss?: number;
    timeBased?: number; // days
  };
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'conservative' | 'moderate' | 'aggressive' | 'sector' | 'theme';
  assets: StrategyAsset[];
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  maxDrawdown: number;
  createdBy: string;
  popularity: number;
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    winRate: number;
  };
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  assets: StrategyAsset[];
  totalAllocation: number;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  maxDrawdown: number;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StrategyBuilderProps {
  onSave?: (strategy: Strategy) => void;
  onClose?: () => void;
  initialStrategy?: Strategy;
}

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  onSave,
  onClose,
  initialStrategy,
}) => {
  const [strategyName, setStrategyName] = useState(initialStrategy?.name || '');
  const [strategyDescription, setStrategyDescription] = useState(initialStrategy?.description || '');
  const [assets, setAssets] = useState<StrategyAsset[]>(initialStrategy?.assets || []);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingAsset, setEditingAsset] = useState<StrategyAsset | null>(null);

  const flatListRef = useRef<DraggableFlatList<StrategyAsset>>(null);

  const totalAllocation = assets.reduce((sum, asset) => sum + asset.allocation, 0);
  const isValidAllocation = totalAllocation <= 100;

  const handleDragEnd = ({ data }: { data: StrategyAsset[] }) => {
    setAssets(data);
    safeHapticImpact();
  };

  const addAsset = (asset: StrategyAsset) => {
    const newAsset = {
      ...asset,
      id: Date.now().toString(),
      allocation: Math.min(10, 100 - totalAllocation), // Default 10% or remaining space
    };
    setAssets([...assets, newAsset]);
    setShowAssetSelector(false);
    safeHapticImpact();
  };

  const removeAsset = (assetId: string) => {
    setAssets(assets.filter(asset => asset.id !== assetId));
    safeHapticImpact();
  };

  const updateAssetAllocation = (assetId: string, allocation: number) => {
    setAssets(assets.map(asset => 
      asset.id === assetId ? { ...asset, allocation } : asset
    ));
  };

  const editAsset = (asset: StrategyAsset) => {
    setEditingAsset(asset);
  };

  const applyTemplate = (template: StrategyTemplate) => {
    Alert.alert(
      'Apply Template',
      `Apply "${template.name}" template? This will replace your current strategy.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            setAssets(template.assets.map(asset => ({
              ...asset,
              id: Date.now().toString() + Math.random(),
            })));
            setStrategyName(template.name);
            setStrategyDescription(template.description);
            setShowTemplates(false);
            safeHapticImpact();
          },
        },
      ]
    );
  };

  const calculateStrategyMetrics = () => {
    if (assets.length === 0) return { riskLevel: 'low', expectedReturn: 0, maxDrawdown: 0 };

    // Simple risk calculation based on asset types and allocation
    const riskScores = assets.map(asset => {
      let baseRisk = 0;
      switch (asset.type) {
        case 'crypto': baseRisk = 0.8; break;
        case 'stock': baseRisk = 0.6; break;
        case 'etf': baseRisk = 0.4; break;
        case 'bond': baseRisk = 0.2; break;
      }
      return baseRisk * (asset.allocation / 100);
    });

    const avgRisk = riskScores.reduce((sum, risk) => sum + risk, 0);
    const riskLevel = avgRisk > 0.6 ? 'high' : avgRisk > 0.3 ? 'medium' : 'low';

    // Simple expected return calculation
    const expectedReturn = assets.reduce((sum, asset) => {
      let baseReturn = 0;
      switch (asset.type) {
        case 'crypto': baseReturn = 0.15; break;
        case 'stock': baseReturn = 0.10; break;
        case 'etf': baseReturn = 0.08; break;
        case 'bond': baseReturn = 0.04; break;
      }
      return sum + (baseReturn * (asset.allocation / 100));
    }, 0);

    const maxDrawdown = avgRisk * 0.3; // Rough estimate

    return { riskLevel, expectedReturn, maxDrawdown };
  };

  const saveStrategy = () => {
    if (!strategyName.trim()) {
      Alert.alert('Missing Name', 'Please enter a strategy name.');
      return;
    }

    if (assets.length === 0) {
      Alert.alert('No Assets', 'Please add at least one asset to your strategy.');
      return;
    }

    if (!isValidAllocation) {
      Alert.alert('Invalid Allocation', 'Total allocation cannot exceed 100%.');
      return;
    }

    const metrics = calculateStrategyMetrics();
    
    const strategy: Strategy = {
      id: initialStrategy?.id || Date.now().toString(),
      name: strategyName.trim(),
      description: strategyDescription.trim(),
      assets,
      totalAllocation,
      ...metrics,
      isPublic: false,
      createdAt: initialStrategy?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave?.(strategy);
    Alert.alert('Success', 'Strategy saved successfully!');
    safeHapticImpact();
  };

  const renderAsset = ({ item, drag, isActive }: RenderItemParams<StrategyAsset>) => (
    <ScaleDecorator>
      <Card style={[styles.assetCard, isActive && styles.activeAssetCard]}>
        <Card.Content>
          <View style={styles.assetHeader}>
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              style={styles.dragHandle}
            >
              <MaterialCommunityIcons name="drag" size={24} color="#666" />
            </TouchableOpacity>
            
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>{item.name}</Text>
              <Text style={styles.assetSymbol}>{item.symbol}</Text>
              <Text style={styles.assetPrice}>${item.price.toFixed(2)}</Text>
            </View>

            <View style={styles.assetActions}>
              <Chip
                mode="outlined"
                style={styles.typeChip}
                textStyle={styles.typeChipText}
              >
                {item.type.toUpperCase()}
              </Chip>
              
              <TouchableOpacity
                onPress={() => editAsset(item)}
                style={styles.editButton}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#6CA393" />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => removeAsset(item.id)}
                style={styles.deleteButton}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.allocationSection}>
            <Text style={styles.allocationLabel}>Allocation: {item.allocation.toFixed(1)}%</Text>
            <View style={styles.allocationBar}>
              <View 
                style={[
                  styles.allocationFill, 
                  { width: `${item.allocation}%` }
                ]} 
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScaleDecorator>
  );

  const metrics = calculateStrategyMetrics();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Strategy Builder</Text>
        <TouchableOpacity onPress={saveStrategy} style={styles.saveButton}>
          <MaterialCommunityIcons name="check" size={24} color="#6CA393" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Strategy Info */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Strategy Information</Text>
            <TextInput
              label="Strategy Name"
              value={strategyName}
              onChangeText={setStrategyName}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Description (optional)"
              value={strategyDescription}
              onChangeText={setStrategyDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Strategy Metrics */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Strategy Metrics</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Risk Level</Text>
                <Chip
                  mode="outlined"
                  style={[
                    styles.metricChip,
                    { borderColor: metrics.riskLevel === 'high' ? '#F44336' : metrics.riskLevel === 'medium' ? '#FF9800' : '#4CAF50' }
                  ]}
                  textStyle={{
                    color: metrics.riskLevel === 'high' ? '#F44336' : metrics.riskLevel === 'medium' ? '#FF9800' : '#4CAF50'
                  }}
                >
                  {metrics.riskLevel.toUpperCase()}
                </Chip>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Expected Return</Text>
                <Text style={styles.metricValue}>{(metrics.expectedReturn * 100).toFixed(1)}%</Text>
              </View>
              
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Max Drawdown</Text>
                <Text style={styles.metricValue}>{(metrics.maxDrawdown * 100).toFixed(1)}%</Text>
              </View>
            </View>
            
            <View style={styles.allocationSummary}>
              <Text style={styles.allocationLabel}>
                Total Allocation: {totalAllocation.toFixed(1)}%
              </Text>
              <View style={styles.allocationBar}>
                <View 
                  style={[
                    styles.allocationFill, 
                    { 
                      width: `${Math.min(totalAllocation, 100)}%`,
                      backgroundColor: isValidAllocation ? '#4CAF50' : '#F44336'
                    }
                  ]} 
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Assets */}
        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.assetsHeader}>
              <Text style={styles.sectionTitle}>Assets ({assets.length})</Text>
              <View style={styles.assetsActions}>
                <TouchableOpacity
                  onPress={() => setShowTemplates(true)}
                  style={styles.templateButton}
                >
                  <MaterialCommunityIcons name="view-grid" size={20} color="#6CA393" />
                  <Text style={styles.templateButtonText}>Templates</Text>
                </TouchableOpacity>
              </View>
            </View>

            {assets.length === 0 ? (
              <View style={styles.emptyAssets}>
                <MaterialCommunityIcons name="chart-line" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No assets added yet</Text>
                <Text style={styles.emptySubtext}>Add assets to build your strategy</Text>
              </View>
            ) : (
              <DraggableFlatList
                ref={flatListRef}
                data={assets}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.id}
                renderItem={renderAsset}
                scrollEnabled={false}
                style={styles.assetsList}
              />
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Add Asset FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAssetSelector(true)}
        label="Add Asset"
      />

      {/* Asset Selector Modal */}
      <Portal>
        <Modal
          visible={showAssetSelector}
          onDismiss={() => setShowAssetSelector(false)}
          contentContainerStyle={styles.modal}
        >
          <AssetSelector
            onSelectAsset={addAsset}
            onClose={() => setShowAssetSelector(false)}
            currentAllocation={totalAllocation}
          />
        </Modal>
      </Portal>

      {/* Templates Modal */}
      <Portal>
        <Modal
          visible={showTemplates}
          onDismiss={() => setShowTemplates(false)}
          contentContainerStyle={styles.modal}
        >
          <StrategyTemplate
            onSelectTemplate={applyTemplate}
            onClose={() => setShowTemplates(false)}
          />
        </Modal>
      </Portal>
    </View>
  );
};

// Placeholder components - these would be implemented separately
const AssetSelector: React.FC<{
  onSelectAsset: (asset: StrategyAsset) => void;
  onClose: () => void;
  currentAllocation: number;
}> = ({ onSelectAsset, onClose, currentAllocation }) => (
  <View style={styles.modalContent}>
    <Text>Asset Selector - Coming Soon</Text>
    <Button onPress={onClose}>Close</Button>
  </View>
);

const StrategyTemplate: React.FC<{
  onSelectTemplate: (template: StrategyTemplate) => void;
  onClose: () => void;
}> = ({ onSelectTemplate, onClose }) => (
  <View style={styles.modalContent}>
    <Text>Strategy Templates - Coming Soon</Text>
    <Button onPress={onClose}>Close</Button>
  </View>
);

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
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  metricChip: {
    marginTop: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  allocationSummary: {
    marginTop: 8,
  },
  allocationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  allocationBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  allocationFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  assetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f9f5',
    borderRadius: 16,
    gap: 4,
  },
  templateButtonText: {
    fontSize: 12,
    color: '#6CA393',
    fontWeight: '600',
  },
  emptyAssets: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  assetsList: {
    maxHeight: 400,
  },
  assetCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  activeAssetCard: {
    backgroundColor: '#f0f9f5',
    elevation: 8,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragHandle: {
    padding: 8,
    marginRight: 8,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  assetSymbol: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  assetPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6CA393',
    marginTop: 2,
  },
  assetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    borderColor: '#e0e0e0',
  },
  typeChipText: {
    fontSize: 10,
    color: '#666',
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  allocationSection: {
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6CA393',
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalContent: {
    padding: 20,
    alignItems: 'center',
  },
});
