import React, { useState, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useCreateChallenge } from '../../hooks/useChallenges';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type ChallengeType = 'direction' | 'price';

interface ChallengeFormData {
  title: string;
  description: string;
  symbol: string;
  type: ChallengeType;
  endDate: Date;
  prizeAmount: number;
  maxParticipants?: number;
  isPrivate: boolean;
  targetPrice?: number;
}

export const CreateChallengeScreen: React.FC = () => {
  const navigation = useNavigation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  // Hooks
  const { createChallenge, loading } = useCreateChallenge();

  // Form state
  const [formData, setFormData] = useState<ChallengeFormData>({
    title: '',
    description: '',
    symbol: '',
    type: 'direction',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    prizeAmount: 0,
    maxParticipants: undefined,
    isPrivate: false,
    targetPrice: undefined,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const updateFormData = <K extends keyof ChallengeFormData>(
    field: K,
    value: ChallengeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSymbolChange = useCallback(async (symbol: string) => {
    updateFormData('symbol', symbol.toUpperCase());
    
    // Fetch current price for the symbol (placeholder)
    // In real implementation, you'd call your market data API
    if (symbol.length >= 3) {
      try {
        // Mock price fetch - replace with actual API call
        const mockPrice = Math.random() * 200 + 50; // $50-$250 range
        setCurrentPrice(mockPrice);
        
        if (!formData.title) {
          updateFormData('title', `${symbol.toUpperCase()} ${formData.type === 'direction' ? 'Direction' : 'Price'} Challenge`);
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      }
    }
  }, [formData.type, formData.title]);

  const handleTypeChange = (type: ChallengeType) => {
    updateFormData('type', type);
    
    // Update title if it's still default
    if (formData.symbol && (!formData.title || formData.title.includes('Direction') || formData.title.includes('Price'))) {
      updateFormData('title', `${formData.symbol} ${type === 'direction' ? 'Direction' : 'Price'} Challenge`);
    }
    
    // Clear target price if switching to direction
    if (type === 'direction') {
      updateFormData('targetPrice', undefined);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateFormData('endDate', selectedDate);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push('Title is required');
    }

    if (!formData.symbol.trim()) {
      errors.push('Symbol is required');
    }

    if (formData.symbol.trim().length < 2) {
      errors.push('Symbol must be at least 2 characters');
    }

    if (formData.endDate <= new Date()) {
      errors.push('End date must be in the future');
    }

    const maxEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    if (formData.endDate > maxEndDate) {
      errors.push('End date cannot be more than 1 year in the future');
    }

    if (formData.prizeAmount < 0) {
      errors.push('Prize amount cannot be negative');
    }

    if (formData.maxParticipants !== undefined && formData.maxParticipants < 2) {
      errors.push('Maximum participants must be at least 2');
    }

    if (formData.type === 'price' && (formData.targetPrice === undefined || formData.targetPrice <= 0)) {
      errors.push('Target price is required for price challenges');
    }

    return errors;
  };

  const handleSubmit = useCallback(async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    try {
      const challengeData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        type: formData.type,
        endDate: formData.endDate,
        prizeAmount: formData.prizeAmount,
        maxParticipants: formData.maxParticipants,
        isPrivate: formData.isPrivate,
        targetPrice: formData.targetPrice,
        startingPrice: currentPrice || undefined,
      };

      const result = await createChallenge(challengeData);
      
      Alert.alert(
        'Success',
        'Challenge created successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
              // Navigate to the created challenge
              navigation.navigate('ChallengeDetail', { challengeId: result.challengeId });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', 'Failed to create challenge. Please try again.');
    }
  }, [formData, currentPrice, createChallenge, navigation]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    return maxDate;
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Create Challenge',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ marginRight: 16 }}
        >
          <Text style={[styles.saveButton, { color: tintColor }]}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleSubmit, loading, tintColor]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Basic Information</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>Challenge Title *</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                placeholder="Enter challenge title"
                placeholderTextColor={mutedColor}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>Description</Text>
              <TextInput
                style={[styles.input, styles.multilineInput, { color: textColor, borderColor: mutedColor }]}
                value={formData.description}
                onChangeText={(text) => updateFormData('description', text)}
                placeholder="Describe your challenge..."
                placeholderTextColor={mutedColor}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>Symbol *</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                value={formData.symbol}
                onChangeText={handleSymbolChange}
                placeholder="AAPL, TSLA, BTC, etc."
                placeholderTextColor={mutedColor}
                autoCapitalize="characters"
              />
              {currentPrice && (
                <Text style={[styles.currentPrice, { color: tintColor }]}>
                  Current price: ${currentPrice.toFixed(2)}
                </Text>
              )}
            </View>
          </View>

          {/* Challenge Type */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Challenge Type</Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: formData.type === 'direction' ? tintColor + '20' : 'transparent',
                    borderColor: formData.type === 'direction' ? tintColor : mutedColor,
                  }
                ]}
                onPress={() => handleTypeChange('direction')}
              >
                <MaterialCommunityIcons 
                  name="trending-up" 
                  size={24} 
                  color={formData.type === 'direction' ? tintColor : mutedColor} 
                />
                <Text style={[
                  styles.typeTitle, 
                  { color: formData.type === 'direction' ? tintColor : textColor }
                ]}>
                  Direction
                </Text>
                <Text style={[styles.typeDescription, { color: mutedColor }]}>
                  Predict if price goes up or down
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: formData.type === 'price' ? tintColor + '20' : 'transparent',
                    borderColor: formData.type === 'price' ? tintColor : mutedColor,
                  }
                ]}
                onPress={() => handleTypeChange('price')}
              >
                <MaterialCommunityIcons 
                  name="target" 
                  size={24} 
                  color={formData.type === 'price' ? tintColor : mutedColor} 
                />
                <Text style={[
                  styles.typeTitle, 
                  { color: formData.type === 'price' ? tintColor : textColor }
                ]}>
                  Price Target
                </Text>
                <Text style={[styles.typeDescription, { color: mutedColor }]}>
                  Predict closest to exact price
                </Text>
              </TouchableOpacity>
            </View>

            {formData.type === 'price' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: mutedColor }]}>Target Price *</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                  value={formData.targetPrice?.toString() || ''}
                  onChangeText={(text) => {
                    const price = parseFloat(text);
                    updateFormData('targetPrice', isNaN(price) ? undefined : price);
                  }}
                  placeholder="Enter target price"
                  placeholderTextColor={mutedColor}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>

          {/* Challenge Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Challenge Settings</Text>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>End Date & Time *</Text>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: mutedColor }]}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={20} color={mutedColor} />
                <Text style={[styles.dateText, { color: textColor }]}>
                  {formatDate(formData.endDate)}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={formData.endDate}
                  mode="datetime"
                  display="default"
                  minimumDate={getMinDate()}
                  maximumDate={getMaxDate()}
                  onChange={handleDateChange}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>Prize Amount ($)</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                value={formData.prizeAmount.toString()}
                onChangeText={(text) => {
                  const amount = parseFloat(text);
                  updateFormData('prizeAmount', isNaN(amount) ? 0 : amount);
                }}
                placeholder="0 for free challenge"
                placeholderTextColor={mutedColor}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: mutedColor }]}>Max Participants</Text>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: mutedColor }]}
                value={formData.maxParticipants?.toString() || ''}
                onChangeText={(text) => {
                  const max = parseInt(text);
                  updateFormData('maxParticipants', isNaN(max) ? undefined : max);
                }}
                placeholder="Leave empty for unlimited"
                placeholderTextColor={mutedColor}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={[styles.switchLabel, { color: textColor }]}>Private Challenge</Text>
                <Text style={[styles.switchDescription, { color: mutedColor }]}>
                  Only people with invite link can join
                </Text>
              </View>
              <Switch
                value={formData.isPrivate}
                onValueChange={(value) => updateFormData('isPrivate', value)}
                thumbColor={formData.isPrivate ? tintColor : mutedColor}
                trackColor={{ false: mutedColor + '40', true: tintColor + '40' }}
              />
            </View>
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Preview</Text>
            
            <View style={[styles.previewCard, { backgroundColor, borderColor: mutedColor }]}>
              <View style={styles.previewHeader}>
                <MaterialCommunityIcons 
                  name={formData.type === 'direction' ? 'trending-up' : 'target'} 
                  size={20} 
                  color={tintColor} 
                />
                <Text style={[styles.previewTitle, { color: textColor }]}>
                  {formData.title || 'Challenge Title'}
                </Text>
              </View>
              
              <View style={styles.previewDetails}>
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: mutedColor }]}>Symbol:</Text>
                  <Text style={[styles.previewValue, { color: textColor }]}>
                    {formData.symbol || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: mutedColor }]}>Type:</Text>
                  <Text style={[styles.previewValue, { color: textColor }]}>
                    {formData.type === 'direction' ? 'Direction Prediction' : 'Price Target'}
                  </Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: mutedColor }]}>Ends:</Text>
                  <Text style={[styles.previewValue, { color: textColor }]}>
                    {formatDate(formData.endDate)}
                  </Text>
                </View>
                
                <View style={styles.previewRow}>
                  <Text style={[styles.previewLabel, { color: mutedColor }]}>Prize:</Text>
                  <Text style={[styles.previewValue, { color: textColor }]}>
                    {formData.prizeAmount === 0 ? 'Free' : `$${formData.prizeAmount.toFixed(2)}`}
                  </Text>
                </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  currentPrice: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewDetails: {
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewLabel: {
    fontSize: 14,
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});
