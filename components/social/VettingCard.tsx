import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Avatar,
  Chip,
  Button,
  TextInput,
  Divider,
  Badge,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VettingRecommendation } from '../../services/VettingService';
import { vettingService } from '../../services/VettingService';
import { safeHapticImpact } from '../../utils/haptics';

interface VettingCardProps {
  recommendation: VettingRecommendation;
  onVote?: (recommendationId: string, vote: 'up' | 'down') => void;
  onClose?: () => void;
}

export const VettingCard: React.FC<VettingCardProps> = ({
  recommendation,
  onVote,
  onClose,
}) => {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getRecommendationIcon = (type: VettingRecommendation['type']) => {
    switch (type) {
      case 'stock':
        return 'chart-line';
      case 'crypto':
        return 'bitcoin';
      case 'strategy':
        return 'strategy';
      case 'education':
        return 'school';
      default:
        return 'lightbulb';
    }
  };

  const getRecommendationColor = (recommendation: VettingRecommendation['recommendation']) => {
    switch (recommendation) {
      case 'buy':
        return '#4CAF50';
      case 'sell':
        return '#F44336';
      case 'hold':
        return '#FF9800';
      case 'watch':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const getReputationLevel = (reputation: number) => {
    if (reputation >= 80) return { level: 'Master', color: '#9C27B0' };
    if (reputation >= 60) return { level: 'Expert', color: '#FF9800' };
    if (reputation >= 30) return { level: 'Intermediate', color: '#2196F3' };
    return { level: 'Novice', color: '#9E9E9E' };
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const calculateVotingProgress = () => {
    const { upvotes, downvotes } = recommendation.votes;
    const total = upvotes + downvotes;
    if (total === 0) return { progress: 0, approvalRate: 0 };
    
    const approvalRate = upvotes / total;
    const progress = Math.min(total / 10, 1); // Progress towards 10 votes threshold
    
    return { progress, approvalRate };
  };

  const handleVote = async () => {
    if (!vote) {
      Alert.alert('Select Vote', 'Please select upvote or downvote before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      
      // In a real implementation, you'd get the current user's info
      const userId = 'current_user_id';
      const userName = 'Current User';
      const userReputation = 25; // This would come from user state
      
      await vettingService.voteOnRecommendation(
        recommendation.id,
        userId,
        userName,
        userReputation,
        vote,
        comment.trim() || undefined
      );
      
      safeHapticImpact();
      Alert.alert('Vote Submitted', 'Thank you for helping the community!');
      onVote?.(recommendation.id, vote);
    } catch (error) {
      console.error('Error voting on recommendation:', error);
      Alert.alert('Error', 'Failed to submit vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reputationInfo = getReputationLevel(recommendation.submitterReputation);
  const { progress, approvalRate } = calculateVotingProgress();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review Recommendation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Submitter Info */}
        <Card style={styles.section}>
          <Card.Content>
            <View style={styles.submitterSection}>
              <Avatar.Text
                size={60}
                label={recommendation.submitterName.charAt(0).toUpperCase()}
                style={[styles.avatar, { backgroundColor: reputationInfo.color }]}
              />
              <View style={styles.submitterInfo}>
                <Text style={styles.submitterName}>{recommendation.submitterName}</Text>
                <View style={styles.reputationRow}>
                  <Chip
                    mode="outlined"
                    style={[styles.reputationChip, { borderColor: reputationInfo.color }]}
                    textStyle={{ color: reputationInfo.color }}
                  >
                    {reputationInfo.level}
                  </Chip>
                  <Text style={styles.reputationScore}>Reputation: {recommendation.submitterReputation}</Text>
                </View>
                <Text style={styles.submitTime}>Submitted {formatTimeAgo(recommendation.createdAt)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Asset Information */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Asset Information</Text>
            <View style={styles.assetHeader}>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>
                  {recommendation.assetName || recommendation.assetSymbol}
                </Text>
                {recommendation.assetSymbol && (
                  <Text style={styles.assetSymbol}>{recommendation.assetSymbol}</Text>
                )}
                {recommendation.assetPrice && (
                  <Text style={styles.assetPrice}>${recommendation.assetPrice.toFixed(2)}</Text>
                )}
              </View>
              
              <View style={styles.recommendationMeta}>
                <MaterialCommunityIcons
                  name={getRecommendationIcon(recommendation.type)}
                  size={24}
                  color="#666"
                />
                <Chip
                  mode="outlined"
                  style={[styles.recommendationChip, { borderColor: getRecommendationColor(recommendation.recommendation) }]}
                  textStyle={{ color: getRecommendationColor(recommendation.recommendation) }}
                >
                  {recommendation.recommendation.toUpperCase()}
                </Chip>
              </View>
            </View>

            {recommendation.targetPrice && (
              <View style={styles.targetInfo}>
                <Text style={styles.targetLabel}>Target Price:</Text>
                <Text style={styles.targetPrice}>${recommendation.targetPrice.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.metaRow}>
              <Chip mode="outlined" style={styles.metaChip}>
                {recommendation.timeHorizon || 'Medium'} Term
              </Chip>
              <Chip mode="outlined" style={styles.metaChip}>
                {recommendation.riskLevel || 'Medium'} Risk
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Reasoning */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Reasoning</Text>
            <Text style={styles.reasoning}>{recommendation.reasoning}</Text>
          </Card.Content>
        </Card>

        {/* Supporting Data */}
        {recommendation.supportingData && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Supporting Analysis</Text>
              
              {recommendation.supportingData.technicalAnalysis && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisTitle}>Technical Analysis</Text>
                  <Text style={styles.analysisText}>{recommendation.supportingData.technicalAnalysis}</Text>
                </View>
              )}

              {recommendation.supportingData.fundamentalAnalysis && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisTitle}>Fundamental Analysis</Text>
                  <Text style={styles.analysisText}>{recommendation.supportingData.fundamentalAnalysis}</Text>
                </View>
              )}

              {recommendation.supportingData.newsEvents && recommendation.supportingData.newsEvents.length > 0 && (
                <View style={styles.analysisSection}>
                  <Text style={styles.analysisTitle}>Relevant News</Text>
                  {recommendation.supportingData.newsEvents.map((event, index) => (
                    <Text key={index} style={styles.newsItem}>• {event}</Text>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Community Voting */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Community Voting</Text>
            
            <View style={styles.votingStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{recommendation.votes.upvotes}</Text>
                <Text style={styles.statLabel}>Upvotes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{recommendation.votes.downvotes}</Text>
                <Text style={styles.statLabel}>Downvotes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{recommendation.votes.totalVoters}</Text>
                <Text style={styles.statLabel}>Total Voters</Text>
              </View>
            </View>

            <ProgressBar
              progress={progress}
              color={approvalRate >= 0.7 ? '#4CAF50' : '#FF9800'}
              style={styles.progressBar}
            />
            
            <Text style={styles.progressText}>
              {Math.round(approvalRate * 100)}% approval rate • {Math.round(progress * 10)}/10 votes needed
            </Text>

            {/* Your Vote */}
            <Divider style={styles.divider} />
            <Text style={styles.voteTitle}>Your Vote</Text>
            
            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[styles.voteButton, vote === 'up' && styles.selectedUpvote]}
                onPress={() => setVote('up')}
              >
                <MaterialCommunityIcons 
                  name="thumb-up" 
                  size={24} 
                  color={vote === 'up' ? '#fff' : '#4CAF50'} 
                />
                <Text style={[styles.voteText, vote === 'up' && styles.selectedVoteText]}>
                  Upvote
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.voteButton, vote === 'down' && styles.selectedDownvote]}
                onPress={() => setVote('down')}
              >
                <MaterialCommunityIcons 
                  name="thumb-down" 
                  size={24} 
                  color={vote === 'down' ? '#fff' : '#F44336'} 
                />
                <Text style={[styles.voteText, vote === 'down' && styles.selectedVoteText]}>
                  Downvote
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              label="Add a comment (optional)"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={styles.commentInput}
              placeholder="Share your analysis or reasoning..."
            />

            <Button
              mode="contained"
              onPress={handleVote}
              style={styles.submitButton}
              loading={submitting}
              disabled={!vote}
            >
              Submit Vote
            </Button>
          </Card.Content>
        </Card>

        {/* Recent Voters */}
        {recommendation.voterDetails.length > 0 && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Recent Voters</Text>
              {recommendation.voterDetails.slice(0, 5).map((voter, index) => (
                <View key={index} style={styles.voterItem}>
                  <Avatar.Text
                    size={32}
                    label={voter.userName.charAt(0).toUpperCase()}
                    style={styles.voterAvatar}
                  />
                  <View style={styles.voterInfo}>
                    <Text style={styles.voterName}>{voter.userName}</Text>
                    <Text style={styles.voterReputation}>Rep: {voter.reputation}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name={voter.vote === 'up' ? 'thumb-up' : 'thumb-down'}
                    size={20}
                    color={voter.vote === 'up' ? '#4CAF50' : '#F44336'}
                  />
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  placeholder: {
    width: 40,
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
  submitterSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  submitterInfo: {
    flex: 1,
  },
  submitterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  reputationChip: {
    marginRight: 8,
  },
  reputationScore: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  submitTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  assetSymbol: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  assetPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6CA393',
    marginTop: 2,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationChip: {
    marginLeft: 8,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  targetPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6CA393',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaChip: {
    borderColor: '#e0e0e0',
  },
  reasoning: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  newsItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  votingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  voteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  selectedUpvote: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  selectedDownvote: {
    backgroundColor: '#F44336',
    borderColor: '#F44336',
  },
  voteText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#666',
  },
  selectedVoteText: {
    color: '#fff',
  },
  commentInput: {
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#6CA393',
  },
  voterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  voterAvatar: {
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  voterInfo: {
    flex: 1,
  },
  voterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  voterReputation: {
    fontSize: 12,
    color: '#666',
  },
});
