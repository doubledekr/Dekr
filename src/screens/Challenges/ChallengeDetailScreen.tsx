import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  useChallenge, 
  useJoinChallenge, 
  useSubmitGuess, 
  useCancelChallenge 
} from '../../hooks/useChallenges';
import { Challenge, Participant } from '../../types/firestore';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { useAuth } from '../../hooks/useAuth';

type ChallengeDetailRouteProp = RouteProp<{
  ChallengeDetail: { challengeId: string };
}, 'ChallengeDetail'>;

interface ParticipantItemProps {
  participant: Participant;
  challenge: Challenge;
  isCurrentUser: boolean;
  showGuess: boolean;
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({
  participant,
  challenge,
  isCurrentUser,
  showGuess,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  const formatGuess = (guess: any) => {
    if (!guess) return 'No guess yet';
    
    if (challenge.type === 'direction') {
      return guess.direction === 'up' ? '📈 UP' : '📉 DOWN';
    } else {
      return `$${guess.targetPrice?.toFixed(2) || 'N/A'}`;
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return mutedColor;
    if (score > 80) return '#4CAF50';
    if (score > 50) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={[styles.participantItem, { backgroundColor }]}>
      <View style={styles.participantInfo}>
        <View style={styles.participantHeader}>
          <Text style={[styles.participantName, { color: textColor }]}>
            {participant.displayName || 'Anonymous'}
            {isCurrentUser && ' (You)'}
          </Text>
          {participant.score !== undefined && (
            <View style={[
              styles.scoreBadge, 
              { backgroundColor: getScoreColor(participant.score) + '20' }
            ]}>
              <Text style={[styles.scoreText, { color: getScoreColor(participant.score) }]}>
                {participant.score.toFixed(0)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.participantDetails}>
          <Text style={[styles.guessText, { color: mutedColor }]}>
            Guess: {showGuess ? formatGuess(participant.guess) : 'Hidden'}
          </Text>
          <Text style={[styles.joinedText, { color: mutedColor }]}>
            Joined {new Date(participant.joinedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {participant.isWinner && (
        <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
      )}
    </View>
  );
};

export const ChallengeDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ChallengeDetailRouteProp>();
  const { challengeId } = route.params;

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  // Hooks
  const { user } = useAuth();
  const { challenge, loading, refetch } = useChallenge(challengeId);
  const { joinChallenge, loading: joinLoading } = useJoinChallenge();
  const { submitGuess, loading: guessLoading } = useSubmitGuess();
  const { cancelChallenge, loading: cancelLoading } = useCancelChallenge();

  // State
  const [guess, setGuess] = useState<string>('');
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const currentUserId = user?.uid;
  const isCreator = challenge?.creatorId === currentUserId;
  const isParticipant = challenge?.participants.some(p => p.userId === currentUserId);
  const userParticipant = challenge?.participants.find(p => p.userId === currentUserId);
  const hasSubmittedGuess = userParticipant?.guess !== undefined;

  const canJoin = challenge && 
    challenge.status === 'active' && 
    !isParticipant && 
    new Date() < challenge.endDate &&
    (challenge.maxParticipants === undefined || challenge.participants.length < challenge.maxParticipants);

  const canSubmitGuess = challenge &&
    challenge.status === 'active' &&
    isParticipant &&
    !hasSubmittedGuess &&
    new Date() < challenge.endDate;

  const canCancel = challenge &&
    isCreator &&
    challenge.status === 'active' &&
    challenge.participants.length <= 1; // Only creator

  const showGuesses = challenge && (
    challenge.status === 'completed' || 
    challenge.status === 'cancelled' ||
    new Date() >= challenge.endDate
  );

  useEffect(() => {
    if (userParticipant?.guess) {
      if (challenge?.type === 'direction') {
        setDirection(userParticipant.guess.direction);
      } else {
        setGuess(userParticipant.guess.targetPrice?.toString() || '');
      }
    }
  }, [userParticipant, challenge?.type]);

  const handleJoin = useCallback(async () => {
    if (!challenge) return;

    try {
      await joinChallenge(challengeId);
      Alert.alert('Success', 'You have joined the challenge!');
      await refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to join challenge. Please try again.');
    }
  }, [challenge, challengeId, joinChallenge, refetch]);

  const handleSubmitGuess = useCallback(async () => {
    if (!challenge || !canSubmitGuess) return;

    let guessData: any = {};

    if (challenge.type === 'direction') {
      if (!direction) {
        Alert.alert('Error', 'Please select a direction');
        return;
      }
      guessData = { direction };
    } else {
      const targetPrice = parseFloat(guess);
      if (isNaN(targetPrice) || targetPrice <= 0) {
        Alert.alert('Error', 'Please enter a valid target price');
        return;
      }
      guessData = { targetPrice };
    }

    try {
      await submitGuess(challengeId, guessData);
      Alert.alert('Success', 'Your guess has been submitted!');
      await refetch();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit guess. Please try again.');
    }
  }, [challenge, challengeId, direction, guess, canSubmitGuess, submitGuess, refetch]);

  const handleCancel = useCallback(async () => {
    if (!challenge || !canCancel) return;

    Alert.alert(
      'Cancel Challenge',
      'Are you sure you want to cancel this challenge? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelChallenge(challengeId);
              Alert.alert('Success', 'Challenge cancelled successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel challenge');
            }
          },
        },
      ]
    );
  }, [challenge, challengeId, canCancel, cancelChallenge, navigation]);

  const handleShare = useCallback(async () => {
    if (!challenge) return;

    const shareUrl = `https://dekr.app/challenge/${challengeId}`;
    const message = `Join my "${challenge.title}" challenge on Dekr! Predict ${challenge.symbol} ${challenge.type === 'direction' ? 'direction' : 'price'} by ${challenge.endDate.toLocaleDateString()}. ${shareUrl}`;

    try {
      await Share.share({
        message,
        url: shareUrl,
        title: challenge.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [challenge, challengeId]);

  const handleCopyLink = useCallback(async () => {
    const shareUrl = `https://dekr.app/challenge/${challengeId}`;
    await Clipboard.setString(shareUrl);
    Alert.alert('Success', 'Challenge link copied to clipboard!');
  }, [challengeId]);

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Challenge ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return mutedColor;
    }
  };

  const renderGuessSection = () => {
    if (!canSubmitGuess && !hasSubmittedGuess) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          {hasSubmittedGuess ? 'Your Guess' : 'Make Your Guess'}
        </Text>

        {challenge?.type === 'direction' ? (
          <View style={styles.directionSelector}>
            <TouchableOpacity
              style={[
                styles.directionButton,
                {
                  backgroundColor: direction === 'up' ? '#4CAF50' + '20' : 'transparent',
                  borderColor: direction === 'up' ? '#4CAF50' : mutedColor,
                }
              ]}
              onPress={() => !hasSubmittedGuess && setDirection('up')}
              disabled={hasSubmittedGuess}
            >
              <MaterialCommunityIcons 
                name="trending-up" 
                size={32} 
                color={direction === 'up' ? '#4CAF50' : mutedColor} 
              />
              <Text style={[
                styles.directionText, 
                { color: direction === 'up' ? '#4CAF50' : textColor }
              ]}>
                UP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.directionButton,
                {
                  backgroundColor: direction === 'down' ? '#F44336' + '20' : 'transparent',
                  borderColor: direction === 'down' ? '#F44336' : mutedColor,
                }
              ]}
              onPress={() => !hasSubmittedGuess && setDirection('down')}
              disabled={hasSubmittedGuess}
            >
              <MaterialCommunityIcons 
                name="trending-down" 
                size={32} 
                color={direction === 'down' ? '#F44336' : mutedColor} 
              />
              <Text style={[
                styles.directionText, 
                { color: direction === 'down' ? '#F44336' : textColor }
              ]}>
                DOWN
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: mutedColor }]}>Target Price ($)</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  color: textColor, 
                  borderColor: mutedColor,
                  backgroundColor: hasSubmittedGuess ? mutedColor + '10' : 'transparent'
                }
              ]}
              value={guess}
              onChangeText={setGuess}
              placeholder="Enter your price prediction"
              placeholderTextColor={mutedColor}
              keyboardType="numeric"
              editable={!hasSubmittedGuess}
            />
          </View>
        )}

        {canSubmitGuess && (
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: tintColor }]}
            onPress={handleSubmitGuess}
            disabled={guessLoading}
          >
            {guessLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color="white" />
                <Text style={styles.submitButtonText}>Submit Guess</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {hasSubmittedGuess && (
          <View style={[styles.submittedBanner, { backgroundColor: tintColor + '20' }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color={tintColor} />
            <Text style={[styles.submittedText, { color: tintColor }]}>
              Guess submitted successfully!
            </Text>
          </View>
        )}
      </View>
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: challenge?.title || 'Challenge',
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleShare}
            style={{ marginRight: 16 }}
          >
            <MaterialCommunityIcons name="share" size={24} color={tintColor} />
          </TouchableOpacity>
          {canCancel && (
            <TouchableOpacity
              onPress={handleCancel}
              style={{ marginRight: 16 }}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <ActivityIndicator size="small" color={tintColor} />
              ) : (
                <MaterialCommunityIcons name="delete" size={24} color="#F44336" />
              )}
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, challenge, tintColor, handleShare, canCancel, handleCancel, cancelLoading]);

  if (loading || !challenge) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading challenge...
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Challenge Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.symbolContainer}>
              <MaterialCommunityIcons 
                name={challenge.type === 'direction' ? 'trending-up' : 'target'} 
                size={24} 
                color={tintColor} 
              />
              <Text style={[styles.symbol, { color: textColor }]}>
                {challenge.symbol}
              </Text>
            </View>
            
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(challenge.status) }]}>
              <Text style={styles.statusText}>
                {challenge.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={[styles.challengeTitle, { color: textColor }]}>
            {challenge.title}
          </Text>

          {challenge.description && (
            <Text style={[styles.challengeDescription, { color: mutedColor }]}>
              {challenge.description}
            </Text>
          )}

          <View style={styles.challengeStats}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock" size={16} color={mutedColor} />
              <Text style={[styles.statText, { color: textColor }]}>
                {formatTimeRemaining(challenge.endDate)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={16} color={mutedColor} />
              <Text style={[styles.statText, { color: textColor }]}>
                {challenge.participants.length} participants
              </Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons name="trophy" size={16} color={mutedColor} />
              <Text style={[styles.statText, { color: textColor }]}>
                {challenge.prizeAmount === 0 ? 'Free' : `$${challenge.prizeAmount.toFixed(2)}`}
              </Text>
            </View>
          </View>

          {challenge.startingPrice && (
            <View style={styles.priceInfo}>
              <Text style={[styles.priceLabel, { color: mutedColor }]}>
                Starting Price: 
              </Text>
              <Text style={[styles.priceValue, { color: textColor }]}>
                ${challenge.startingPrice.toFixed(2)}
              </Text>
            </View>
          )}

          {challenge.targetPrice && (
            <View style={styles.priceInfo}>
              <Text style={[styles.priceLabel, { color: mutedColor }]}>
                Target Price: 
              </Text>
              <Text style={[styles.priceValue, { color: tintColor }]}>
                ${challenge.targetPrice.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {canJoin && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: tintColor }]}
              onPress={handleJoin}
              disabled={joinLoading}
            >
              {joinLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="account-plus" size={20} color="white" />
                  <Text style={styles.joinButtonText}>Join Challenge</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Guess Section */}
        {renderGuessSection()}

        {/* Participants */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Participants ({challenge.participants.length})
          </Text>

          {challenge.participants.length === 0 ? (
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              No participants yet. Be the first to join!
            </Text>
          ) : (
            challenge.participants
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((participant, index) => (
                <ParticipantItem
                  key={participant.userId}
                  participant={participant}
                  challenge={challenge}
                  isCurrentUser={participant.userId === currentUserId}
                  showGuess={showGuesses}
                />
              ))
          )}
        </View>

        {/* Share Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Share Challenge</Text>
          
          <View style={styles.shareActions}>
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: tintColor + '20' }]}
              onPress={handleShare}
            >
              <MaterialCommunityIcons name="share" size={20} color={tintColor} />
              <Text style={[styles.shareButtonText, { color: tintColor }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: mutedColor + '20' }]}
              onPress={handleCopyLink}
            >
              <MaterialCommunityIcons name="content-copy" size={20} color={mutedColor} />
              <Text style={[styles.shareButtonText, { color: mutedColor }]}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symbolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  symbol: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  challengeStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  directionSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  directionButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  directionText: {
    fontSize: 16,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submittedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 16,
  },
  submittedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  participantInfo: {
    flex: 1,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  participantDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  guessText: {
    fontSize: 14,
    fontWeight: '500',
  },
  joinedText: {
    fontSize: 12,
  },
  shareActions: {
    flexDirection: 'row',
    gap: 12,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
