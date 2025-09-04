import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { 
  Strategy, 
  StrategyCondition, 
  StrategyType, 
  IndicatorType, 
  Operator, 
  Timeframe,
  TargetType,
  STRATEGY_TEMPLATES,
  INDICATOR_CONFIGS,
  DEFAULT_RISK_MANAGEMENT,
  validateStrategy,
} from '../../types/strategy';
import { useCreateStrategy, useUpdateStrategy } from '../../hooks/useStrategies';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type StrategyEditorRouteProp = RouteProp<{
  StrategyEditor: { 
    mode: 'create' | 'edit'; 
    strategy?: Partial<Strategy>;
  };
}, 'StrategyEditor'>;

interface ConditionEditorProps {
  condition: StrategyCondition;
  onUpdate: (condition: StrategyCondition) => void;
  onDelete: () => void;
}

const ConditionEditor: React.FC<ConditionEditorProps> = ({
  condition,
  onUpdate,
  onDelete,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  const updateCondition = (updates: Partial<StrategyCondition>) => {
    onUpdate({ ...condition, ...updates });
  };

  return (
    <View style={[styles.conditionCard, { backgroundColor }]}>
      <View style={styles.conditionHeader}>
        <Text style={[styles.conditionTitle, { color: textColor }]}>Condition</Text>
        <TouchableOpacity onPress={onDelete}>
          <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>

      <View style={styles.conditionRow}>
        <View style={styles.pickerContainer}>
          <Text style={[styles.label, { color: mutedColor }]}>Indicator</Text>
          <Picker
            selectedValue={condition.indicator}
            onValueChange={(value) => updateCondition({ indicator: value as IndicatorType })}
            style={[styles.picker, { color: textColor }]}
          >
            {Object.entries(INDICATOR_CONFIGS).map(([key, config]) => (
              <Picker.Item key={key} label={config.name} value={key} />
            ))}
          </Picker>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={[styles.label, { color: mutedColor }]}>Operator</Text>
          <Picker
            selectedValue={condition.operator}
            onValueChange={(value) => updateCondition({ operator: value as Operator })}
            style={[styles.picker, { color: textColor }]}
          >
            <Picker.Item label="Greater than (>)" value=">" />
            <Picker.Item label="Less than (<)" value="<" />
            <Picker.Item label="Greater or equal (>=)" value=">=" />
            <Picker.Item label="Less or equal (<=)" value="<=" />
            <Picker.Item label="Equal (==)" value="==" />
            <Picker.Item label="Not equal (!=)" value="!=" />
            <Picker.Item label="Crosses above" value="crosses_above" />
            <Picker.Item label="Crosses below" value="crosses_below" />
          </Picker>
        </View>
      </View>

      <View style={styles.conditionRow}>
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: mutedColor }]}>Value</Text>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: mutedColor }]}
            value={String(condition.value)}
            onChangeText={(text) => {
              const numValue = parseFloat(text);
              updateCondition({ value: isNaN(numValue) ? text : numValue });
            }}
            placeholder="Enter value"
            placeholderTextColor={mutedColor}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.pickerContainer}>
          <Text style={[styles.label, { color: mutedColor }]}>Timeframe</Text>
          <Picker
            selectedValue={condition.timeframe}
            onValueChange={(value) => updateCondition({ timeframe: value as Timeframe })}
            style={[styles.picker, { color: textColor }]}
          >
            <Picker.Item label="1 Minute" value="1m" />
            <Picker.Item label="5 Minutes" value="5m" />
            <Picker.Item label="15 Minutes" value="15m" />
            <Picker.Item label="30 Minutes" value="30m" />
            <Picker.Item label="1 Hour" value="1h" />
            <Picker.Item label="4 Hours" value="4h" />
            <Picker.Item label="1 Day" value="1D" />
            <Picker.Item label="1 Week" value="1W" />
            <Picker.Item label="1 Month" value="1M" />
          </Picker>
        </View>
      </View>

      {condition.description && (
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: mutedColor }]}>Description</Text>
          <TextInput
            style={[styles.input, { color: textColor, borderColor: mutedColor }]}
            value={condition.description}
            onChangeText={(text) => updateCondition({ description: text })}
            placeholder="Optional description"
            placeholderTextColor={mutedColor}
            multiline
          />
        </View>
      )}
    </View>
  );
};

export const StrategyEditorScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<StrategyEditorRouteProp>();
  const { mode, strategy: initialStrategy } = route.params;

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  // Hooks
  const { createStrategy, loading: createLoading } = useCreateStrategy();
  const { updateStrategy, loading: updateLoading } = useUpdateStrategy();

  // State
  const [strategy, setStrategy] = useState<Partial<Strategy>>({
    name: '',
    description: '',
    strategyType: 'technical' as StrategyType,
    buyConditions: [
      {
        indicator: 'rsi' as IndicatorType,
        operator: '<' as Operator,
        value: 30,
        timeframe: '1D' as Timeframe,
        parameters: { period: 14 },
      }
    ],
    sellConditions: [
      {
        indicator: 'rsi' as IndicatorType,
        operator: '>' as Operator,
        value: 70,
        timeframe: '1D' as Timeframe,
        parameters: { period: 14 },
      }
    ],
    riskManagement: DEFAULT_RISK_MANAGEMENT,
    targetSelection: {
      type: 'asset' as TargetType,
      symbols: ['AAPL'],
    },
    isActive: false,
    isPublic: false,
    tags: [],
    ...initialStrategy,
  });

  const [showTemplates, setShowTemplates] = useState(false);

  const loading = createLoading || updateLoading;

  useEffect(() => {
    if (initialStrategy) {
      setStrategy(initialStrategy);
    }
  }, [initialStrategy]);

  const updateStrategyField = <K extends keyof Strategy>(
    field: K,
    value: Strategy[K]
  ) => {
    setStrategy(prev => ({ ...prev, [field]: value }));
  };

  const addBuyCondition = () => {
    const newCondition: StrategyCondition = {
      indicator: 'rsi' as IndicatorType,
      operator: '<' as Operator,
      value: 30,
      timeframe: '1D' as Timeframe,
      parameters: { period: 14 },
    };
    setStrategy(prev => ({
      ...prev,
      buyConditions: [...(prev.buyConditions || []), newCondition],
    }));
  };

  const addSellCondition = () => {
    const newCondition: StrategyCondition = {
      indicator: 'rsi' as IndicatorType,
      operator: '>' as Operator,
      value: 70,
      timeframe: '1D' as Timeframe,
      parameters: { period: 14 },
    };
    setStrategy(prev => ({
      ...prev,
      sellConditions: [...(prev.sellConditions || []), newCondition],
    }));
  };

  const updateBuyCondition = (index: number, condition: StrategyCondition) => {
    setStrategy(prev => ({
      ...prev,
      buyConditions: prev.buyConditions?.map((c, i) => i === index ? condition : c) || [],
    }));
  };

  const updateSellCondition = (index: number, condition: StrategyCondition) => {
    setStrategy(prev => ({
      ...prev,
      sellConditions: prev.sellConditions?.map((c, i) => i === index ? condition : c) || [],
    }));
  };

  const deleteBuyCondition = (index: number) => {
    setStrategy(prev => ({
      ...prev,
      buyConditions: prev.buyConditions?.filter((_, i) => i !== index) || [],
    }));
  };

  const deleteSellCondition = (index: number) => {
    setStrategy(prev => ({
      ...prev,
      sellConditions: prev.sellConditions?.filter((_, i) => i !== index) || [],
    }));
  };

  const applyTemplate = (templateKey: keyof typeof STRATEGY_TEMPLATES) => {
    const template = STRATEGY_TEMPLATES[templateKey];
    setStrategy(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      strategyType: template.strategyType,
      buyConditions: template.buyConditions,
      sellConditions: template.sellConditions,
    }));
    setShowTemplates(false);
  };

  const handleSave = async () => {
    try {
      // Validate strategy
      const now = new Date();
      const fullStrategy = {
        ...strategy,
        id: strategy.id || '',
        userId: 'current-user-id', // TODO: Get from auth context
        createdAt: strategy.createdAt || now,
        updatedAt: now,
        buyConditions: strategy.buyConditions || [],
        sellConditions: strategy.sellConditions || [],
        riskManagement: strategy.riskManagement || DEFAULT_RISK_MANAGEMENT,
        targetSelection: strategy.targetSelection || { type: 'asset' as TargetType, symbols: [] },
        tags: strategy.tags || [],
      } as Strategy;

      validateStrategy(fullStrategy);

      if (mode === 'create') {
        const result = await createStrategy(fullStrategy);
        Alert.alert('Success', 'Strategy created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await updateStrategy(fullStrategy);
        Alert.alert('Success', 'Strategy updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving strategy:', error);
      Alert.alert('Error', 'Failed to save strategy. Please check your inputs and try again.');
    }
  };

  const renderTemplateSelector = () => {
    if (!showTemplates) return null;

    return (
      <View style={[styles.templateSelector, { backgroundColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Strategy Templates</Text>
        {Object.entries(STRATEGY_TEMPLATES).map(([key, template]) => (
          <TouchableOpacity
            key={key}
            style={[styles.templateItem, { borderColor: mutedColor }]}
            onPress={() => applyTemplate(key as keyof typeof STRATEGY_TEMPLATES)}
          >
            <Text style={[styles.templateName, { color: textColor }]}>{template.name}</Text>
            <Text style={[styles.templateDescription, { color: mutedColor }]}>
              {template.description}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.closeTemplatesButton, { backgroundColor: mutedColor + '20' }]}
          onPress={() => setShowTemplates(false)}
        >
          <Text style={[styles.closeTemplatesText, { color: mutedColor }]}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: mode === 'create' ? 'Create Strategy' : 'Edit Strategy',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{ marginRight: 16 }}
        >
          <Text style={[styles.saveButton, { color: tintColor }]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, mode, loading, tintColor]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Basic Information</Text>
              <TouchableOpacity
                onPress={() => setShowTemplates(!showTemplates)}
                style={[styles.templatesButton, { backgroundColor: tintColor + '20' }]}
              >
                <MaterialCommunityIcons name="file-document-multiple" size={16} color={tintColor} />
                <Text style={[styles.templatesButtonText, { color: tintColor }]}>Templates</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>Strategy Name *</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                value={strategy.name}
                onChangeText={(text) => updateStrategyField('name', text)}
                placeholder="Enter strategy name"
                placeholderTextColor={mutedColor}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { color: textColor, borderColor: mutedColor }]}
                value={strategy.description}
                onChangeText={(text) => updateStrategyField('description', text)}
                placeholder="Describe your strategy..."
                placeholderTextColor={mutedColor}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>Strategy Type</Text>
              <Picker
                selectedValue={strategy.strategyType}
                onValueChange={(value) => updateStrategyField('strategyType', value as StrategyType)}
                style={[styles.picker, { color: textColor }]}
              >
                <Picker.Item label="Technical Analysis" value="technical" />
                <Picker.Item label="Fundamental Analysis" value="fundamental" />
                <Picker.Item label="Sentiment Analysis" value="sentiment" />
                <Picker.Item label="Hybrid" value="hybrid" />
                <Picker.Item label="Custom" value="custom" />
              </Picker>
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: textColor }]}>Active Strategy</Text>
              <Switch
                value={strategy.isActive}
                onValueChange={(value) => updateStrategyField('isActive', value)}
                thumbColor={strategy.isActive ? tintColor : mutedColor}
                trackColor={{ false: mutedColor + '40', true: tintColor + '40' }}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: textColor }]}>Public Strategy</Text>
              <Switch
                value={strategy.isPublic}
                onValueChange={(value) => updateStrategyField('isPublic', value)}
                thumbColor={strategy.isPublic ? tintColor : mutedColor}
                trackColor={{ false: mutedColor + '40', true: tintColor + '40' }}
              />
            </View>
          </View>

          {renderTemplateSelector()}

          {/* Buy Conditions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Buy Conditions</Text>
              <TouchableOpacity
                onPress={addBuyCondition}
                style={[styles.addButton, { backgroundColor: '#4CAF50' + '20' }]}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#4CAF50" />
                <Text style={[styles.addButtonText, { color: '#4CAF50' }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {strategy.buyConditions?.map((condition, index) => (
              <ConditionEditor
                key={index}
                condition={condition}
                onUpdate={(updated) => updateBuyCondition(index, updated)}
                onDelete={() => deleteBuyCondition(index)}
              />
            ))}
          </View>

          {/* Sell Conditions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Sell Conditions</Text>
              <TouchableOpacity
                onPress={addSellCondition}
                style={[styles.addButton, { backgroundColor: '#F44336' + '20' }]}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#F44336" />
                <Text style={[styles.addButtonText, { color: '#F44336' }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {strategy.sellConditions?.map((condition, index) => (
              <ConditionEditor
                key={index}
                condition={condition}
                onUpdate={(updated) => updateSellCondition(index, updated)}
                onDelete={() => deleteSellCondition(index)}
              />
            ))}
          </View>

          {/* Risk Management */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Risk Management</Text>
            
            <View style={styles.riskRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: mutedColor }]}>Position Size (%)</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                  value={String((strategy.riskManagement?.positionSize || 0) * 100)}
                  onChangeText={(text) => {
                    const value = parseFloat(text) / 100;
                    updateStrategyField('riskManagement', {
                      ...strategy.riskManagement!,
                      positionSize: isNaN(value) ? 0.1 : value,
                    });
                  }}
                  placeholder="10"
                  placeholderTextColor={mutedColor}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: mutedColor }]}>Stop Loss (%)</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                  value={strategy.riskManagement?.stopLoss ? String(strategy.riskManagement.stopLoss * 100) : ''}
                  onChangeText={(text) => {
                    const value = text ? parseFloat(text) / 100 : undefined;
                    updateStrategyField('riskManagement', {
                      ...strategy.riskManagement!,
                      stopLoss: isNaN(value!) ? undefined : value,
                    });
                  }}
                  placeholder="5"
                  placeholderTextColor={mutedColor}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.riskRow}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: mutedColor }]}>Take Profit (%)</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                  value={strategy.riskManagement?.takeProfit ? String(strategy.riskManagement.takeProfit * 100) : ''}
                  onChangeText={(text) => {
                    const value = text ? parseFloat(text) / 100 : undefined;
                    updateStrategyField('riskManagement', {
                      ...strategy.riskManagement!,
                      takeProfit: isNaN(value!) ? undefined : value,
                    });
                  }}
                  placeholder="10"
                  placeholderTextColor={mutedColor}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: mutedColor }]}>Max Positions</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                  value={String(strategy.riskManagement?.maxPositions || 5)}
                  onChangeText={(text) => {
                    const value = parseInt(text);
                    updateStrategyField('riskManagement', {
                      ...strategy.riskManagement!,
                      maxPositions: isNaN(value) ? 5 : value,
                    });
                  }}
                  placeholder="5"
                  placeholderTextColor={mutedColor}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  templatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  templatesButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 4,
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  templateSelector: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  templateItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
  },
  closeTemplatesButton: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  closeTemplatesText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});
