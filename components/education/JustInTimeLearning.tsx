import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Icon,
  ProgressBar,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { safeHapticImpact } from '../../utils/haptics';

const { width, height } = Dimensions.get('window');

export interface LearningContent {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'interactive' | 'quiz';
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'trading' | 'analysis' | 'risk' | 'strategy' | 'market';
  content: string;
  resources?: string[];
  prerequisites?: string[];
  relatedSignals?: string[];
  relatedCompetitions?: string[];
}

export interface LearningTrigger {
  id: string;
  context: 'competition_prep' | 'signal_analysis' | 'strategy_building' | 'risk_management' | 'market_volatility';
  trigger: string; // What action triggered this learning
  content: LearningContent[];
  priority: 'high' | 'medium' | 'low';
  expiresAt?: Date;
}

interface JustInTimeLearningProps {
  trigger: LearningTrigger | null;
  onDismiss?: () => void;
  onComplete?: (contentId: string) => void;
  onSkip?: () => void;
}

export const JustInTimeLearning: React.FC<JustInTimeLearningProps> = ({
  trigger,
  onDismiss,
  onComplete,
  onSkip,
}) => {
  const theme = useTheme();
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      setCurrentContentIndex(0);
      setProgress(0);
    }
  }, [trigger]);

  const currentContent = trigger?.content[currentContentIndex];

  const getContextIcon = (context: LearningTrigger['context']): string => {
    switch (context) {
      case 'competition_prep':
        return 'trophy';
      case 'signal_analysis':
        return 'chart-line';
      case 'strategy_building':
        return 'layers';
      case 'risk_management':
        return 'shield';
      case 'market_volatility':
        return 'trending-up';
      default:
        return 'school';
    }
  };

  const getContextColor = (context: LearningTrigger['context']): string => {
    switch (context) {
      case 'competition_prep':
        return '#FFD700';
      case 'signal_analysis':
        return '#4CAF50';
      case 'strategy_building':
        return '#2196F3';
      case 'risk_management':
        return '#F44336';
      case 'market_volatility':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getContextTitle = (context: LearningTrigger['context']): string => {
    switch (context) {
      case 'competition_prep':
        return 'Competition Preparation';
      case 'signal_analysis':
        return 'Signal Analysis';
      case 'strategy_building':
        return 'Strategy Building';
      case 'risk_management':
        return 'Risk Management';
      case 'market_volatility':
        return 'Market Volatility';
      default:
        return 'Learning';
    }
  };

  const getTypeIcon = (type: LearningContent['type']): string => {
    switch (type) {
      case 'video':
        return 'play-circle';
      case 'article':
        return 'file-document';
      case 'interactive':
        return 'gesture-tap';
      case 'quiz':
        return 'help-circle';
      default:
        return 'book';
    }
  };

  const getDifficultyColor = (difficulty: LearningContent['difficulty']): string => {
    switch (difficulty) {
      case 'beginner':
        return '#4CAF50';
      case 'intermediate':
        return '#FF9800';
      case 'advanced':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const handleNext = () => {
    if (currentContentIndex < (trigger?.content.length || 0) - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
      setProgress((currentContentIndex + 1) / (trigger?.content.length || 1));
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
      setProgress((currentContentIndex - 1) / (trigger?.content.length || 1));
    }
  };

  const handleComplete = () => {
    if (currentContent) {
      onComplete?.(currentContent.id);
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleSkip = () => {
    safeHapticImpact();
    onSkip?.();
    handleDismiss();
  };

  if (!trigger || !isVisible || !currentContent) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Icon
              source={getContextIcon(trigger.context)}
              size={24}
              color={getContextColor(trigger.context)}
            />
            <View style={styles.headerText}>
              <Title style={styles.headerTitle}>
                {getContextTitle(trigger.context)}
              </Title>
              <Text style={styles.headerSubtitle}>
                {trigger.trigger}
              </Text>
            </View>
          </View>
          <Button
            mode="text"
            onPress={handleDismiss}
            icon="close"
          >
            Close
          </Button>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {currentContentIndex + 1} of {trigger.content.length}
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

        {/* Content */}
        <View style={styles.contentContainer}>
          <Card style={styles.contentCard}>
            <Card.Content>
              {/* Content Header */}
              <View style={styles.contentHeader}>
                <View style={styles.contentTitleContainer}>
                  <MaterialCommunityIcons
                    name={getTypeIcon(currentContent.type)}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Title style={styles.contentTitle}>
                    {currentContent.title}
                  </Title>
                </View>
                <View style={styles.contentMeta}>
                  <Chip
                    mode="outlined"
                    style={{ borderColor: getDifficultyColor(currentContent.difficulty) }}
                    textStyle={{ color: getDifficultyColor(currentContent.difficulty) }}
                  >
                    {currentContent.difficulty.toUpperCase()}
                  </Chip>
                  <Chip
                    mode="outlined"
                    style={styles.categoryChip}
                  >
                    {currentContent.category.toUpperCase()}
                  </Chip>
                </View>
              </View>

              {/* Duration */}
              <View style={styles.durationContainer}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.durationText}>
                  {currentContent.duration} minutes
                </Text>
              </View>

              {/* Description */}
              <Paragraph style={styles.description}>
                {currentContent.description}
              </Paragraph>

              {/* Content */}
              <View style={styles.contentBody}>
                <Text style={styles.contentText}>
                  {currentContent.content}
                </Text>
              </View>

              {/* Resources */}
              {currentContent.resources && currentContent.resources.length > 0 && (
                <View style={styles.resourcesContainer}>
                  <Text style={styles.resourcesTitle}>Additional Resources</Text>
                  {currentContent.resources.map((resource, index) => (
                    <TouchableOpacity key={index} style={styles.resourceItem}>
                      <MaterialCommunityIcons
                        name="link"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.resourceText}>{resource}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Prerequisites */}
              {currentContent.prerequisites && currentContent.prerequisites.length > 0 && (
                <View style={styles.prerequisitesContainer}>
                  <Text style={styles.prerequisitesTitle}>Prerequisites</Text>
                  {currentContent.prerequisites.map((prereq, index) => (
                    <Chip key={index} mode="outlined" style={styles.prerequisiteChip}>
                      {prereq}
                    </Chip>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        </View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          <View style={styles.navigationButtons}>
            <Button
              mode="outlined"
              onPress={handlePrevious}
              disabled={currentContentIndex === 0}
              style={styles.navButton}
            >
              Previous
            </Button>
            
            <Button
              mode="outlined"
              onPress={handleSkip}
              style={styles.skipButton}
            >
              Skip
            </Button>
            
            <Button
              mode="contained"
              onPress={handleNext}
              style={styles.nextButton}
            >
              {currentContentIndex === trigger.content.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  contentCard: {
    elevation: 2,
  },
  contentHeader: {
    marginBottom: 16,
  },
  contentTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contentTitle: {
    marginLeft: 8,
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
  },
  contentMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    marginLeft: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  durationText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#333',
  },
  contentBody: {
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  resourcesContainer: {
    marginBottom: 16,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 4,
  },
  resourceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2196F3',
    flex: 1,
  },
  prerequisitesContainer: {
    marginBottom: 16,
  },
  prerequisitesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  prerequisiteChip: {
    marginRight: 8,
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
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
    marginRight: 8,
  },
  skipButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  nextButton: {
    flex: 1,
    marginLeft: 8,
  },
});
