import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Icon,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Competition } from '../../services/CompetitionService';
import { LearningContent } from './JustInTimeLearning';
import { safeHapticImpact } from '../../utils/haptics';

interface CompetitionPrepProps {
  competition: Competition;
  onStartCompetition?: () => void;
  onSkipPrep?: () => void;
}

export const CompetitionPrep: React.FC<CompetitionPrepProps> = ({
  competition,
  onStartCompetition,
  onSkipPrep,
}) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isReady, setIsReady] = useState(false);

  const prepSteps = [
    {
      id: 'market_context',
      title: 'Market Context',
      description: 'Understand current market conditions and trends',
      content: getMarketContextContent(competition),
      icon: 'chart-line',
      required: true,
    },
    {
      id: 'asset_analysis',
      title: 'Asset Analysis',
      description: 'Learn about the assets in this competition',
      content: getAssetAnalysisContent(competition),
      icon: 'chart-bar',
      required: true,
    },
    {
      id: 'prediction_strategy',
      title: 'Prediction Strategy',
      description: 'Tips for making better predictions',
      content: getPredictionStrategyContent(competition),
      icon: 'lightbulb',
      required: false,
    },
    {
      id: 'risk_management',
      title: 'Risk Management',
      description: 'Understanding risk in predictions',
      content: getRiskManagementContent(competition),
      icon: 'shield',
      required: false,
    },
  ];

  useEffect(() => {
    // Check if user is ready to start competition
    const requiredSteps = prepSteps.filter(step => step.required);
    const completedRequiredSteps = requiredSteps.filter(step => 
      completedSteps.includes(prepSteps.indexOf(step))
    );
    setIsReady(completedRequiredSteps.length === requiredSteps.length);
  }, [completedSteps]);

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    safeHapticImpact();
  };

  const handleNextStep = () => {
    if (currentStep < prepSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStartCompetition = () => {
    safeHapticImpact();
    onStartCompetition?.();
  };

  const handleSkipPrep = () => {
    safeHapticImpact();
    onSkipPrep?.();
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

  const currentStepData = prepSteps[currentStep];
  const progress = (currentStep + 1) / prepSteps.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon
            source={getCompetitionTypeIcon(competition.type)}
            size={24}
            color={getCompetitionTypeColor(competition.type)}
          />
          <Title style={styles.title}>Competition Preparation</Title>
        </View>
        <Chip
          mode="outlined"
          textStyle={{ color: getCompetitionTypeColor(competition.type) }}
          style={{ borderColor: getCompetitionTypeColor(competition.type) }}
        >
          {competition.type.replace('_', ' ').toUpperCase()}
        </Chip>
      </View>

      {/* Competition Info */}
      <Card style={styles.competitionCard}>
        <Card.Content>
          <Title style={styles.competitionTitle}>{competition.title}</Title>
          <Paragraph style={styles.competitionDescription}>
            {competition.description}
          </Paragraph>
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
        </Card.Content>
      </Card>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {prepSteps.length}
          </Text>
          <Text style={styles.progressLabel}>
            {Math.round(progress * 100)}% Complete
          </Text>
        </View>
        <ProgressBar
          progress={progress}
          color={theme.colors.primary}
          style={styles.progressBar}
        />
      </View>

      {/* Step Navigation */}
      <View style={styles.stepNavigation}>
        {prepSteps.map((step, index) => (
          <TouchableOpacity
            key={step.id}
            style={[
              styles.stepIndicator,
              index === currentStep && styles.activeStep,
              completedSteps.includes(index) && styles.completedStep,
            ]}
            onPress={() => setCurrentStep(index)}
          >
            <MaterialCommunityIcons
              name={completedSteps.includes(index) ? 'check' : step.icon}
              size={20}
              color={
                completedSteps.includes(index)
                  ? '#4CAF50'
                  : index === currentStep
                  ? theme.colors.primary
                  : '#9E9E9E'
              }
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Current Step Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Card style={styles.stepCard}>
          <Card.Content>
            <View style={styles.stepHeader}>
              <MaterialCommunityIcons
                name={currentStepData.icon}
                size={32}
                color={theme.colors.primary}
              />
              <View style={styles.stepTitleContainer}>
                <Title style={styles.stepTitle}>{currentStepData.title}</Title>
                <Text style={styles.stepDescription}>
                  {currentStepData.description}
                </Text>
              </View>
            </View>

            <View style={styles.stepContent}>
              {currentStepData.content}
            </View>

            <View style={styles.stepActions}>
              <Button
                mode="contained"
                onPress={() => handleStepComplete(currentStep)}
                style={styles.completeButton}
                disabled={completedSteps.includes(currentStep)}
              >
                {completedSteps.includes(currentStep) ? 'Completed' : 'Mark Complete'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <View style={styles.navigationButtons}>
          <Button
            mode="outlined"
            onPress={handlePreviousStep}
            disabled={currentStep === 0}
            style={styles.navButton}
          >
            Previous
          </Button>
          
          {currentStep < prepSteps.length - 1 ? (
            <Button
              mode="contained"
              onPress={handleNextStep}
              style={styles.nextButton}
            >
              Next
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleStartCompetition}
              disabled={!isReady}
              style={styles.startButton}
            >
              Start Competition
            </Button>
          )}
        </View>
        
        <Button
          mode="text"
          onPress={handleSkipPrep}
          style={styles.skipButton}
        >
          Skip Preparation
        </Button>
      </View>
    </View>
  );
};

// Helper functions to generate content based on competition type
function getMarketContextContent(competition: Competition): React.ReactNode {
  return (
    <View>
      <Text style={styles.contentText}>
        Understanding market context is crucial for making informed predictions. 
        Consider these factors:
      </Text>
      <View style={styles.bulletList}>
        <Text style={styles.bulletPoint}>• Current market trends and sentiment</Text>
        <Text style={styles.bulletPoint}>• Economic indicators and news events</Text>
        <Text style={styles.bulletPoint}>• Sector-specific developments</Text>
        <Text style={styles.bulletPoint}>• Historical performance patterns</Text>
      </View>
      <Text style={styles.contentText}>
        For {competition.assets.join(', ')}, pay attention to recent news, 
        earnings reports, and industry developments that might impact their performance.
      </Text>
    </View>
  );
}

function getAssetAnalysisContent(competition: Competition): React.ReactNode {
  return (
    <View>
      <Text style={styles.contentText}>
        Analyze each asset in this competition:
      </Text>
      {competition.assets.map((asset, index) => (
        <View key={index} style={styles.assetAnalysis}>
          <Text style={styles.assetName}>{asset}</Text>
          <Text style={styles.assetDescription}>
            Research {asset}'s recent performance, key metrics, and market position.
            Look at technical indicators, fundamental analysis, and analyst ratings.
          </Text>
        </View>
      ))}
    </View>
  );
}

function getPredictionStrategyContent(competition: Competition): React.ReactNode {
  const strategyTips = {
    binary: [
      'Consider both technical and fundamental analysis',
      'Look for clear trend indicators',
      'Don\'t let emotions drive your decision',
      'Set a confidence level based on your analysis',
    ],
    multiple_choice: [
      'Compare relative performance of all options',
      'Consider sector rotation and market cycles',
      'Look for catalysts that might drive outperformance',
      'Analyze risk-reward ratios for each option',
    ],
    numeric: [
      'Use historical volatility as a guide',
      'Consider current market conditions',
      'Factor in upcoming events and catalysts',
      'Be realistic about potential price movements',
    ],
  };

  const tips = strategyTips[competition.type] || strategyTips.binary;

  return (
    <View>
      <Text style={styles.contentText}>
        Strategy tips for {competition.type.replace('_', ' ')} predictions:
      </Text>
      <View style={styles.bulletList}>
        {tips.map((tip, index) => (
          <Text key={index} style={styles.bulletPoint}>• {tip}</Text>
        ))}
      </View>
    </View>
  );
}

function getRiskManagementContent(competition: Competition): React.ReactNode {
  return (
    <View>
      <Text style={styles.contentText}>
        Risk management principles for predictions:
      </Text>
      <View style={styles.bulletList}>
        <Text style={styles.bulletPoint}>• Never risk more than you can afford to lose</Text>
        <Text style={styles.bulletPoint}>• Diversify your predictions across different assets</Text>
        <Text style={styles.bulletPoint}>• Set clear entry and exit criteria</Text>
        <Text style={styles.bulletPoint}>• Learn from both wins and losses</Text>
        <Text style={styles.bulletPoint}>• Keep emotions in check</Text>
      </View>
      <Text style={styles.contentText}>
        Remember: This is a learning experience. Focus on improving your 
        analysis skills rather than just winning.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
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
  competitionCard: {
    margin: 16,
    elevation: 2,
  },
  competitionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  competitionDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  assetsContainer: {
    marginBottom: 8,
  },
  assetsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
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
  progressContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 6,
  },
  stepNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  activeStep: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  completedStep: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  stepCard: {
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  stepContent: {
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 16,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 4,
  },
  assetAnalysis: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  assetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  assetDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
  stepActions: {
    marginTop: 16,
  },
  completeButton: {
    marginBottom: 8,
  },
  navigationContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navButton: {
    flex: 1,
    marginRight: 8,
  },
  nextButton: {
    flex: 1,
    marginLeft: 8,
  },
  startButton: {
    flex: 1,
    marginLeft: 8,
  },
  skipButton: {
    alignSelf: 'center',
  },
});
