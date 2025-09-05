import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Slider,
  Button,
  Chip,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StrategyAsset } from './StrategyBuilder';
import { safeHapticImpact } from '../../utils/haptics';

interface AllocationSliderProps {
  asset: StrategyAsset;
  totalAllocation: number;
  onUpdateAllocation: (assetId: string, allocation: number) => void;
  onClose: () => void;
}

export const AllocationSlider: React.FC<AllocationSliderProps> = ({
  asset,
  totalAllocation,
  onUpdateAllocation,
  onClose,
}) => {
  const [allocation, setAllocation] = useState(asset.allocation);
  const [customValue, setCustomValue] = useState(asset.allocation.toString());
  const [showCustomInput, setShowCustomInput] = useState(false);

  const maxAllocation = 100 - (totalAllocation - asset.allocation);
  const remainingAllocation = 100 - totalAllocation;

  useEffect(() => {
    setAllocation(asset.allocation);
    setCustomValue(asset.allocation.toString());
  }, [asset.allocation]);

  const handleSliderChange = (value: number) => {
    setAllocation(value);
    setCustomValue(value.toFixed(1));
    safeHapticImpact();
  };

  const handleCustomInputChange = (text: string) => {
    setCustomValue(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= maxAllocation) {
      setAllocation(numValue);
    }
  };

  const handlePresetAllocation = (preset: number) => {
    const newAllocation = Math.min(preset, maxAllocation);
    setAllocation(newAllocation);
    setCustomValue(newAllocation.toFixed(1));
    safeHapticImpact();
  };

  const handleSave = () => {
    if (allocation < 0 || allocation > maxAllocation) {
      Alert.alert(
        'Invalid Allocation',
        `Allocation must be between 0% and ${maxAllocation.toFixed(1)}%`
      );
      return;
    }

    onUpdateAllocation(asset.id, allocation);
    onClose();
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

  const getRiskColor = (allocation: number) => {
    if (allocation > 30) return '#F44336'; // High risk - red
    if (allocation > 15) return '#FF9800'; // Medium risk - orange
    return '#4CAF50'; // Low risk - green
  };

  const getRiskLevel = (allocation: number) => {
    if (allocation > 30) return 'High Risk';
    if (allocation > 15) return 'Medium Risk';
    return 'Low Risk';
  };

  const calculateDollarAmount = (allocation: number, portfolioValue: number = 10000) => {
    return (allocation / 100) * portfolioValue;
  };

  const presets = [5, 10, 15, 20, 25, 30];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Allocation Settings</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <MaterialCommunityIcons name="check" size={24} color="#6CA393" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Asset Info */}
        <Card style={styles.assetCard}>
          <Card.Content>
            <View style={styles.assetHeader}>
              <MaterialCommunityIcons
                name={getAssetIcon(asset.type)}
                size={32}
                color="#6CA393"
              />
              <View style={styles.assetInfo}>
                <Text style={styles.assetSymbol}>{asset.symbol}</Text>
                <Text style={styles.assetName}>{asset.name}</Text>
                <Text style={styles.assetPrice}>${asset.price.toFixed(2)}</Text>
              </View>
              <Chip
                mode="outlined"
                style={styles.typeChip}
                textStyle={styles.typeChipText}
              >
                {asset.type.toUpperCase()}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Current Allocation */}
        <Card style={styles.allocationCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Current Allocation</Text>
            <View style={styles.allocationDisplay}>
              <Text style={styles.allocationValue}>{allocation.toFixed(1)}%</Text>
              <Text style={styles.allocationDollar}>
                ${calculateDollarAmount(allocation).toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.allocationBar}>
              <View 
                style={[
                  styles.allocationFill, 
                  { 
                    width: `${allocation}%`,
                    backgroundColor: getRiskColor(allocation)
                  }
                ]} 
              />
            </View>

            <View style={styles.riskIndicator}>
              <Text style={[styles.riskText, { color: getRiskColor(allocation) }]}>
                {getRiskLevel(allocation)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Allocation Slider */}
        <Card style={styles.sliderCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Adjust Allocation</Text>
            
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>0%</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={maxAllocation}
                value={allocation}
                onValueChange={handleSliderChange}
                minimumTrackTintColor="#6CA393"
                maximumTrackTintColor="#e0e0e0"
                thumbStyle={styles.sliderThumb}
              />
              <Text style={styles.sliderLabel}>{maxAllocation.toFixed(0)}%</Text>
            </View>

            <View style={styles.customInputContainer}>
              <TouchableOpacity
                onPress={() => setShowCustomInput(!showCustomInput)}
                style={styles.customInputButton}
              >
                <MaterialCommunityIcons 
                  name={showCustomInput ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6CA393" 
                />
                <Text style={styles.customInputButtonText}>Custom Value</Text>
              </TouchableOpacity>
              
              {showCustomInput && (
                <View style={styles.customInputRow}>
                  <TextInput
                    value={customValue}
                    onChangeText={handleCustomInputChange}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.customInput}
                    right={<TextInput.Affix text="%" />}
                  />
                  <Button
                    mode="outlined"
                    onPress={() => {
                      const numValue = parseFloat(customValue);
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= maxAllocation) {
                        setAllocation(numValue);
                      }
                    }}
                    style={styles.applyButton}
                  >
                    Apply
                  </Button>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Quick Presets */}
        <Card style={styles.presetsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Presets</Text>
            <View style={styles.presetsContainer}>
              {presets.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    allocation === preset && styles.selectedPreset,
                    preset > maxAllocation && styles.disabledPreset,
                  ]}
                  onPress={() => handlePresetAllocation(preset)}
                  disabled={preset > maxAllocation}
                >
                  <Text style={[
                    styles.presetText,
                    allocation === preset && styles.selectedPresetText,
                    preset > maxAllocation && styles.disabledPresetText,
                  ]}>
                    {preset}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Allocation Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Portfolio Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Current Total:</Text>
              <Text style={styles.summaryValue}>
                {(totalAllocation - asset.allocation + allocation).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Remaining:</Text>
              <Text style={styles.summaryValue}>
                {(100 - (totalAllocation - asset.allocation + allocation)).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Max for this asset:</Text>
              <Text style={styles.summaryValue}>{maxAllocation.toFixed(1)}%</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Risk Warning */}
        {allocation > 20 && (
          <Card style={styles.warningCard}>
            <Card.Content>
              <View style={styles.warningHeader}>
                <MaterialCommunityIcons name="alert" size={24} color="#FF9800" />
                <Text style={styles.warningTitle}>High Allocation Warning</Text>
              </View>
              <Text style={styles.warningText}>
                Allocating more than 20% to a single asset increases portfolio risk. 
                Consider diversifying across multiple assets.
              </Text>
            </Card.Content>
          </Card>
        )}
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
  saveButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  assetCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  assetSymbol: {
    fontSize: 18,
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
  typeChip: {
    borderColor: '#e0e0e0',
  },
  typeChipText: {
    fontSize: 10,
    color: '#666',
  },
  allocationCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  allocationDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  allocationValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  allocationDollar: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  allocationBar: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  allocationFill: {
    height: '100%',
    borderRadius: 6,
  },
  riskIndicator: {
    alignItems: 'center',
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    marginHorizontal: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  sliderThumb: {
    backgroundColor: '#6CA393',
    width: 24,
    height: 24,
  },
  customInputContainer: {
    marginTop: 8,
  },
  customInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  customInputButtonText: {
    fontSize: 14,
    color: '#6CA393',
    fontWeight: '600',
    marginLeft: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  customInput: {
    flex: 1,
  },
  applyButton: {
    borderColor: '#6CA393',
  },
  presetsCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedPreset: {
    backgroundColor: '#6CA393',
    borderColor: '#6CA393',
  },
  disabledPreset: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  presetText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  selectedPresetText: {
    color: '#fff',
  },
  disabledPresetText: {
    color: '#ccc',
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    borderWidth: 1,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
