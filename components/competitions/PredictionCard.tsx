import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  SegmentedButtons,
  ProgressBar,
  Chip,
  Icon,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Competition, UserPrediction } from '../../services/CompetitionService';
import { competitionService } from '../../services/CompetitionService';
import { rewardSystem } from '../../services/RewardSystem';
import { useAppSelector } from '../../store/hooks';
import { safeHapticImpact } from '../../utils/haptics';

interface PredictionCardProps {
  competition: Competition;
  userPrediction?: UserPrediction;
  onPredictionSubmitted?: (prediction: UserPrediction) => void;
  onPredictionUpdated?: (prediction: UserPrediction) => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  competition,
  userPrediction,
  onPredictionSubmitted,
  onPredictionUpdated,
}) => {
  const theme = useTheme();
  const { user } = useAppSelector(state => state.auth);
  
  const [prediction, setPrediction] = useState<string | number>('');
  const [confidence, setConfidence] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (userPrediction) {
      setPrediction(userPrediction.prediction);
      setConfidence(userPrediction.confidence);
    }
  }, [userPrediction]);

  useEffect(() => {
    // Calculate time remaining
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = competition.endDate.toDate().getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [competition.endDate]);

  const formatTimeRemaining = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getCompetitionTypeIcon = (type: Competition['type']): string => {
    switch (type) {
      case 'binary':
        return 'chart-line';
      case 'multiple_choice':
        return 'format-list-bulleted';
      case 'numeric':
        return 'calculator';
      default:
        return 'chart-line';
    }
  };

  const getCompetitionTypeColor = (type: Competition['type']): string => {
    switch (type) {
      case 'binary':
        return '#4CAF50';
      case 'multiple_choice':
        return '#2196F3';
      case 'numeric':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const renderBinaryPrediction = () => (
    <View style={styles.predictionSection}>
      <Text style={styles.sectionTitle}>Your Prediction</Text>
      <SegmentedButtons
        value={prediction as string}
        onValueChange={setPrediction}
        buttons={[
          { value: 'up', label: 'Up', icon: 'trending-up' },
          { value: 'down', label: 'Down', icon: 'trending-down' },
        ]}
        style={styles.segmentedButtons}
      />
    </View>
  );

  const renderMultipleChoicePrediction = () => (
    <View style={styles.predictionSection}>
      <Text style={styles.sectionTitle}>Choose the Best Performer</Text>
      <View style={styles.optionsContainer}>
        {competition.options?.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              prediction === option && styles.selectedOption,
              { borderColor: theme.colors.primary }
            ]}
            onPress={() => setPrediction(option)}
          >
            <Text style={[
              styles.optionText,
              prediction === option && styles.selectedOptionText
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNumericPrediction = () => (
    <View style={styles.predictionSection}>
      <Text style={styles.sectionTitle}>Predict the % Change</Text>
      <TextInput
        mode="outlined"
        label="Percentage Change"
        value={prediction.toString()}
        onChangeText={(text) => {
          const num = parseFloat(text);
          if (!isNaN(num)) {
            setPrediction(num);
          } else if (text === '') {
            setPrediction('');
          }
        }}
        keyboardType="numeric"
        right={<TextInput.Affix text="%" />}
        style={styles.numericInput}
      />
      <Text style={styles.inputHint}>
        Enter your prediction for {competition.assets[0]}'s weekly performance
      </Text>
    </View>
  );

  const renderPredictionInput = () => {
    switch (competition.type) {
      case 'binary':
        return renderBinaryPrediction();
      case 'multiple_choice':
        return renderMultipleChoicePrediction();
      case 'numeric':
        return renderNumericPrediction();
      default:
        return null;
    }
  };

  const handleSubmitPrediction = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to make predictions');
      return;
    }

    if (!prediction) {
      Alert.alert('Error', 'Please make a prediction before submitting');
      return;
    }

    if (competition.type === 'numeric' && (typeof prediction !== 'number' || isNaN(prediction))) {
      Alert.alert('Error', 'Please enter a valid number for your prediction');
      return;
    }

    setIsSubmitting(true);
    safeHapticImpact();

    try {
      let predictionId: string;
      
      if (userPrediction) {
        // Update existing prediction (if allowed)
        Alert.alert('Error', 'Cannot update existing predictions');
        return;
      } else {
        // Submit new prediction
        predictionId = await competitionService.submitPrediction(
          user.uid,
          competition.id,
          prediction,
          confidence
        );
      }

      // Award participation points
      await rewardSystem.awardPoints(
        user.uid,
        10,
        `Participation in competition: ${competition.title}`,
        'competition',
        { competitionId: competition.id, predictionId }
      );

      Alert.alert(
        'Success!',
        'Your prediction has been submitted successfully. Good luck!',
        [{ text: 'OK' }]
      );

      // Refresh prediction data
      const updatedPrediction = await competitionService.getUserPrediction(user.uid, competition.id);
      if (updatedPrediction) {
        onPredictionSubmitted?.(updatedPrediction);
      }

    } catch (error) {
      console.error('Error submitting prediction:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit prediction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPredictionValid = () => {
    if (!prediction) return false;
    if (competition.type === 'numeric') {
      return typeof prediction === 'number' && !isNaN(prediction);
    }
    return true;
  };

  const canSubmit = () => {
    return (
      !userPrediction &&
      competition.status === 'active' &&
      timeRemaining > 0 &&
      isPredictionValid() &&
      !isSubmitting
    );
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon
              source={getCompetitionTypeIcon(competition.type)}
              size={24}
              color={getCompetitionTypeColor(competition.type)}
            />
            <Title style={styles.title}>{competition.title}</Title>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getCompetitionTypeColor(competition.type) }}
            style={{ borderColor: getCompetitionTypeColor(competition.type) }}
          >
            {competition.type.replace('_', ' ').toUpperCase()}
          </Chip>
        </View>

        {/* Description */}
        <Paragraph style={styles.description}>
          {competition.description}
        </Paragraph>

        {/* Assets */}
        <View style={styles.assetsContainer}>
          <Text style={styles.assetsLabel}>Assets:</Text>
          <View style={styles.assetsChips}>
            {competition.assets.map((asset, index) => (
              <Chip key={index} mode="outlined" style={styles.assetChip}>
                {asset}
              </Chip>
            ))}
          </View>
        </View>

        {/* Time Remaining */}
        <View style={styles.timeContainer}>
          <View style={styles.timeHeader}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.timeLabel}>Time Remaining</Text>
          </View>
          <Text style={styles.timeRemaining}>
            {timeRemaining > 0 ? formatTimeRemaining(timeRemaining) : 'Competition Ended'}
          </Text>
          {timeRemaining > 0 && (
            <ProgressBar
              progress={1 - (timeRemaining / (7 * 24 * 60 * 60 * 1000))} // Assuming 7 days total
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          )}
        </View>

        {/* Prize Pool */}
        <View style={styles.prizeContainer}>
          <MaterialCommunityIcons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.prizeText}>
            Prize Pool: {competition.prizePool.toLocaleString()} points
          </Text>
        </View>

        {/* Educational Content */}
        {competition.educationalContent && (
          <View style={styles.educationalContainer}>
            <Text style={styles.educationalTitle}>
              📚 {competition.educationalContent.title}
            </Text>
            <Text style={styles.educationalDescription}>
              {competition.educationalContent.description}
            </Text>
          </View>
        )}

        {/* Prediction Input */}
        {competition.status === 'active' && (
          <>
            {renderPredictionInput()}

            {/* Confidence Slider */}
            <View style={styles.confidenceSection}>
              <Text style={styles.sectionTitle}>
                Confidence Level: {confidence}%
              </Text>
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Low</Text>
                <View style={styles.confidenceSlider}>
                  <TouchableOpacity
                    style={[
                      styles.confidenceButton,
                      { left: `${confidence}%` }
                    ]}
                    onPressIn={() => {
                      // This would be replaced with a proper slider component
                    }}
                  />
                </View>
                <Text style={styles.confidenceLabel}>High</Text>
              </View>
            </View>

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmitPrediction}
              disabled={!canSubmit()}
              loading={isSubmitting}
              style={styles.submitButton}
              contentStyle={styles.submitButtonContent}
            >
              {userPrediction ? 'Prediction Submitted' : 'Submit Prediction'}
            </Button>
          </>
        )}

        {/* User's Prediction Display */}
        {userPrediction && (
          <View style={styles.userPredictionContainer}>
            <Text style={styles.userPredictionTitle}>Your Prediction</Text>
            <View style={styles.userPredictionContent}>
              <Text style={styles.userPredictionValue}>
                {userPrediction.prediction}
                {competition.type === 'numeric' && '%'}
              </Text>
              <Text style={styles.userPredictionConfidence}>
                Confidence: {userPrediction.confidence}%
              </Text>
            </View>
            {userPrediction.pointsAwarded && (
              <Text style={styles.pointsAwarded}>
                🏆 {userPrediction.pointsAwarded} points awarded
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    marginLeft: 8,
    flex: 1,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  assetsContainer: {
    marginBottom: 16,
  },
  assetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  assetsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assetChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  timeContainer: {
    marginBottom: 16,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeLabel: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  timeRemaining: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  progressBar: {
    marginTop: 8,
    height: 4,
  },
  prizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  prizeText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
  },
  educationalContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  educationalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1976D2',
  },
  educationalDescription: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 18,
  },
  predictionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedOptionText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  numericInput: {
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  confidenceSection: {
    marginBottom: 16,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    width: 30,
  },
  confidenceSlider: {
    flex: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginHorizontal: 8,
    position: 'relative',
  },
  confidenceButton: {
    position: 'absolute',
    top: -5,
    width: 30,
    height: 30,
    backgroundColor: '#1976D2',
    borderRadius: 15,
    transform: [{ translateX: -15 }],
  },
  submitButton: {
    marginTop: 16,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  userPredictionContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  userPredictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2E7D32',
  },
  userPredictionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userPredictionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  userPredictionConfidence: {
    fontSize: 14,
    color: '#2E7D32',
  },
  pointsAwarded: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
});
