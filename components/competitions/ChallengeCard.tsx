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
  ProgressBar,
  Chip,
  Icon,
  Avatar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Challenge, UserChallengeParticipation } from '../../services/ChallengeService';
import { challengeService } from '../../services/ChallengeService';
import { useAppSelector } from '../../store/hooks';
import { safeHapticImpact } from '../../utils/haptics';

interface ChallengeCardProps {
  challenge: Challenge;
  userParticipation?: UserChallengeParticipation;
  onJoinChallenge?: (participation: UserChallengeParticipation) => void;
  onViewChallenge?: (challenge: Challenge) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userParticipation,
  onJoinChallenge,
  onViewChallenge,
}) => {
  const theme = useTheme();
  const { user } = useAppSelector(state => state.auth);
  
  const [isJoining, setIsJoining] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    // Calculate time remaining
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const endTime = challenge.endDate.toDate().getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    // Load participant count
    loadParticipantCount();

    return () => clearInterval(interval);
  }, [challenge]);

  const loadParticipantCount = async () => {
    try {
      const participants = await challengeService.getChallengeParticipants(challenge.id);
      setParticipantCount(participants.length);
    } catch (error) {
      console.error('Error loading participant count:', error);
    }
  };

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

  const getChallengeTypeIcon = (type: Challenge['type']): string => {
    switch (type) {
      case 'portfolio':
        return 'chart-pie';
      case 'prediction':
        return 'chart-line';
      case 'educational':
        return 'school';
      case 'social':
        return 'account-group';
      case 'mixed':
        return 'layers';
      default:
        return 'trophy';
    }
  };

  const getChallengeTypeColor = (type: Challenge['type']): string => {
    switch (type) {
      case 'portfolio':
        return '#4CAF50';
      case 'prediction':
        return '#2196F3';
      case 'educational':
        return '#9C27B0';
      case 'social':
        return '#FF9800';
      case 'mixed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getCategoryIcon = (category: Challenge['category']): string => {
    switch (category) {
      case 'tech':
        return 'laptop';
      case 'crypto':
        return 'bitcoin';
      case 'esg':
        return 'leaf';
      case 'earnings':
        return 'chart-bar';
      case 'general':
        return 'trophy';
      default:
        return 'trophy';
    }
  };

  const getStatusColor = (status: Challenge['status']): string => {
    switch (status) {
      case 'upcoming':
        return '#FF9800';
      case 'active':
        return '#4CAF50';
      case 'completed':
        return '#9E9E9E';
      case 'cancelled':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const calculateProgress = (): number => {
    if (!userParticipation || !challenge.requirements) return 0;

    const { progress, requirements } = userParticipation;
    let totalRequirements = 0;
    let completedRequirements = 0;

    if (requirements.minPredictions) {
      totalRequirements += requirements.minPredictions;
      completedRequirements += Math.min(progress.predictionsCompleted, requirements.minPredictions);
    }

    if (requirements.educationalModules) {
      totalRequirements += requirements.educationalModules.length;
      completedRequirements += Math.min(progress.educationalModulesCompleted, requirements.educationalModules.length);
    }

    if (requirements.socialInteractions) {
      totalRequirements += requirements.socialInteractions;
      completedRequirements += Math.min(progress.socialInteractions, requirements.socialInteractions);
    }

    return totalRequirements > 0 ? completedRequirements / totalRequirements : 0;
  };

  const handleJoinChallenge = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to join challenges');
      return;
    }

    if (userParticipation) {
      Alert.alert('Info', 'You are already participating in this challenge');
      return;
    }

    setIsJoining(true);
    safeHapticImpact();

    try {
      const participationId = await challengeService.joinChallenge(user.uid, challenge.id);
      
      Alert.alert(
        'Success!',
        'You have successfully joined the challenge. Good luck!',
        [{ text: 'OK' }]
      );

      // Refresh participation data
      const participation = await challengeService.getUserParticipation(user.uid, challenge.id);
      if (participation) {
        onJoinChallenge?.(participation);
      }

    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join challenge');
    } finally {
      setIsJoining(false);
    }
  };

  const handleViewChallenge = () => {
    onViewChallenge?.(challenge);
  };

  const canJoin = () => {
    return (
      !userParticipation &&
      challenge.status === 'active' &&
      timeRemaining > 0 &&
      (!challenge.maxParticipants || participantCount < challenge.maxParticipants) &&
      !isJoining
    );
  };

  const progress = calculateProgress();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Icon
              source={getChallengeTypeIcon(challenge.type)}
              size={24}
              color={getChallengeTypeColor(challenge.type)}
            />
            <Title style={styles.title}>{challenge.title}</Title>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(challenge.status) }}
            style={{ borderColor: getStatusColor(challenge.status) }}
          >
            {challenge.status.toUpperCase()}
          </Chip>
        </View>

        {/* Theme and Category */}
        <View style={styles.themeContainer}>
          <Chip
            mode="outlined"
            icon={getCategoryIcon(challenge.category)}
            style={styles.themeChip}
          >
            {challenge.theme}
          </Chip>
          <Chip
            mode="outlined"
            style={styles.categoryChip}
          >
            {challenge.category.toUpperCase()}
          </Chip>
        </View>

        {/* Description */}
        <Paragraph style={styles.description}>
          {challenge.description}
        </Paragraph>

        {/* Challenge Type and Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          <View style={styles.requirementsList}>
            {challenge.requirements.minPredictions && (
              <Text style={styles.requirementItem}>
                • {challenge.requirements.minPredictions} predictions
              </Text>
            )}
            {challenge.requirements.portfolioSize && (
              <Text style={styles.requirementItem}>
                • Portfolio size: {challenge.requirements.portfolioSize}
              </Text>
            )}
            {challenge.requirements.educationalModules && (
              <Text style={styles.requirementItem}>
                • {challenge.requirements.educationalModules.length} educational modules
              </Text>
            )}
            {challenge.requirements.socialInteractions && (
              <Text style={styles.requirementItem}>
                • {challenge.requirements.socialInteractions} social interactions
              </Text>
            )}
          </View>
        </View>

        {/* Time Remaining */}
        <View style={styles.timeContainer}>
          <View style={styles.timeHeader}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.timeLabel}>Time Remaining</Text>
          </View>
          <Text style={styles.timeRemaining}>
            {timeRemaining > 0 ? formatTimeRemaining(timeRemaining) : 'Challenge Ended'}
          </Text>
          {timeRemaining > 0 && (
            <ProgressBar
              progress={1 - (timeRemaining / (30 * 24 * 60 * 60 * 1000))} // Assuming 30 days total
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          )}
        </View>

        {/* Participant Count */}
        <View style={styles.participantContainer}>
          <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.participantText}>
            {participantCount} participants
            {challenge.maxParticipants && ` / ${challenge.maxParticipants} max`}
          </Text>
        </View>

        {/* Prize Pool */}
        <View style={styles.prizeContainer}>
          <MaterialCommunityIcons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.prizeText}>
            Prize Pool: {challenge.prizePool.toLocaleString()} points
          </Text>
        </View>

        {/* Educational Content */}
        {challenge.educationalContent && (
          <View style={styles.educationalContainer}>
            <Text style={styles.educationalTitle}>
              📚 {challenge.educationalContent.title}
            </Text>
            <Text style={styles.educationalDescription}>
              {challenge.educationalContent.description}
            </Text>
            <Text style={styles.modulesCount}>
              {challenge.educationalContent.modules.length} modules available
            </Text>
          </View>
        )}

        {/* User Progress */}
        {userParticipation && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <ProgressBar
              progress={progress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}% Complete
            </Text>
            <View style={styles.progressDetails}>
              <Text style={styles.progressDetail}>
                Predictions: {userParticipation.progress.predictionsCompleted}
              </Text>
              <Text style={styles.progressDetail}>
                Modules: {userParticipation.progress.educationalModulesCompleted}
              </Text>
              <Text style={styles.progressDetail}>
                Social: {userParticipation.progress.socialInteractions}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {challenge.status === 'active' && (
            <Button
              mode="contained"
              onPress={canJoin() ? handleJoinChallenge : handleViewChallenge}
              disabled={!canJoin() && !userParticipation}
              loading={isJoining}
              style={styles.joinButton}
              contentStyle={styles.joinButtonContent}
            >
              {userParticipation ? 'View Challenge' : 'Join Challenge'}
            </Button>
          )}
          
          {challenge.status === 'upcoming' && (
            <Button
              mode="outlined"
              onPress={handleViewChallenge}
              style={styles.viewButton}
            >
              View Details
            </Button>
          )}

          {challenge.status === 'completed' && (
            <Button
              mode="outlined"
              onPress={handleViewChallenge}
              style={styles.viewButton}
            >
              View Results
            </Button>
          )}
        </View>

        {/* Results Display */}
        {challenge.results && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>🏆 Challenge Results</Text>
            <Text style={styles.resultsText}>
              {challenge.results.totalParticipants} participants
            </Text>
            <Text style={styles.resultsText}>
              Average Score: {challenge.results.averageScore.toFixed(1)}
            </Text>
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
  themeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  themeChip: {
    marginRight: 8,
  },
  categoryChip: {
    marginRight: 8,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  requirementsContainer: {
    marginBottom: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  requirementsList: {
    marginLeft: 8,
  },
  requirementItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  participantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
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
    marginBottom: 4,
  },
  modulesCount: {
    fontSize: 12,
    color: '#1976D2',
    fontStyle: 'italic',
  },
  progressContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2E7D32',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E7D32',
    marginTop: 4,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressDetail: {
    fontSize: 12,
    color: '#2E7D32',
  },
  actionButtons: {
    marginTop: 16,
  },
  joinButton: {
    marginBottom: 8,
  },
  joinButtonContent: {
    paddingVertical: 8,
  },
  viewButton: {
    marginBottom: 8,
  },
  resultsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#7B1FA2',
  },
  resultsText: {
    fontSize: 14,
    color: '#7B1FA2',
    marginBottom: 4,
  },
});
