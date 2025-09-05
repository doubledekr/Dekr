import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Avatar, Chip, Button, ProgressBar, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { safeHapticImpact } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width * 0.9, 380);

export interface CompetitionParticipant {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  rank: number;
  isCurrentUser: boolean;
}

export interface CompetitionData {
  id: string;
  title: string;
  description: string;
  type: 'prediction' | 'challenge' | 'tournament';
  status: 'upcoming' | 'active' | 'completed';
  prize: {
    type: 'points' | 'badge' | 'cash';
    value: string;
    description: string;
  };
  rules: string[];
  participants: CompetitionParticipant[];
  maxParticipants: number;
  startDate: Date;
  endDate: Date;
  currentUserEntry?: {
    prediction?: string;
    score?: number;
    rank?: number;
  };
  leaderboard: CompetitionParticipant[];
  isJoined: boolean;
  canJoin: boolean;
}

interface CompetitionCardProps {
  data: CompetitionData;
  onJoin?: (competitionId: string) => void;
  onLeave?: (competitionId: string) => void;
  onMakePrediction?: (competitionId: string) => void;
  onViewLeaderboard?: (competitionId: string) => void;
  onViewProfile?: (userId: string) => void;
}

export function CompetitionCard({
  data,
  onJoin,
  onLeave,
  onMakePrediction,
  onViewLeaderboard,
  onViewProfile,
}: CompetitionCardProps) {
  const theme = useTheme();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleJoin = () => {
    safeHapticImpact();
    onJoin?.(data.id);
  };

  const handleLeave = () => {
    safeHapticImpact();
    onLeave?.(data.id);
  };

  const handleMakePrediction = () => {
    safeHapticImpact();
    onMakePrediction?.(data.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#f59e0b';
      case 'active': return '#10b981';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'prediction': return 'crystal-ball';
      case 'challenge': return 'trophy';
      case 'tournament': return 'tournament';
      default: return 'gamepad-variant';
    }
  };

  const getPrizeIcon = (type: string) => {
    switch (type) {
      case 'points': return 'star';
      case 'badge': return 'medal';
      case 'cash': return 'cash';
      default: return 'gift';
    }
  };

  const formatTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const getProgressPercentage = () => {
    const now = new Date();
    const total = data.endDate.getTime() - data.startDate.getTime();
    const elapsed = now.getTime() - data.startDate.getTime();
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons 
                name={getTypeIcon(data.type) as any} 
                size={24} 
                color={theme.colors.primary}
              />
              <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                {data.title}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Chip 
                mode="filled" 
                compact
                style={[styles.statusChip, { backgroundColor: getStatusColor(data.status) }]}
                textStyle={styles.statusText}
              >
                {data.status.toUpperCase()}
              </Chip>
              <Text style={[styles.timeRemaining, { color: theme.colors.onSurfaceVariant }]}>
                {formatTimeRemaining(data.endDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {data.description}
        </Text>

        {/* Prize Section */}
        <View style={styles.prizeSection}>
          <View style={styles.prizeHeader}>
            <MaterialCommunityIcons 
              name={getPrizeIcon(data.prize.type) as any} 
              size={20} 
              color="#fbbf24"
            />
            <Text style={[styles.prizeTitle, { color: theme.colors.onSurface }]}>
              Prize
            </Text>
          </View>
          <Text style={[styles.prizeValue, { color: '#fbbf24' }]}>
            {data.prize.value}
          </Text>
          <Text style={[styles.prizeDescription, { color: theme.colors.onSurfaceVariant }]}>
            {data.prize.description}
          </Text>
        </View>

        {/* Progress Bar */}
        {data.status === 'active' && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressTitle, { color: theme.colors.onSurface }]}>
                Competition Progress
              </Text>
              <Text style={[styles.progressPercentage, { color: theme.colors.onSurfaceVariant }]}>
                {getProgressPercentage().toFixed(0)}%
              </Text>
            </View>
            <ProgressBar 
              progress={getProgressPercentage() / 100} 
              color={theme.colors.primary}
              style={styles.progressBar}
            />
          </View>
        )}

        {/* Participants */}
        <View style={styles.participantsSection}>
          <View style={styles.participantsHeader}>
            <Text style={[styles.participantsTitle, { color: theme.colors.onSurface }]}>
              Participants ({data.participants.length}/{data.maxParticipants})
            </Text>
            <TouchableOpacity
              onPress={() => setShowLeaderboard(!showLeaderboard)}
            >
              <MaterialCommunityIcons 
                name={showLeaderboard ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
          
          {showLeaderboard && (
            <View style={styles.leaderboard}>
              {data.leaderboard.slice(0, 5).map((participant, index) => (
                <TouchableOpacity
                  key={participant.id}
                  style={[
                    styles.leaderboardItem,
                    participant.isCurrentUser && styles.currentUserItem
                  ]}
                  onPress={() => onViewProfile?.(participant.id)}
                >
                  <View style={styles.rankSection}>
                    <Text style={[
                      styles.rank,
                      { color: participant.isCurrentUser ? theme.colors.primary : theme.colors.onSurfaceVariant }
                    ]}>
                      #{participant.rank}
                    </Text>
                    <Avatar.Text 
                      size={32} 
                      label={participant.name[0]} 
                      style={[
                        styles.avatar,
                        participant.isCurrentUser && styles.currentUserAvatar
                      ]}
                    />
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={[
                      styles.participantName,
                      { color: participant.isCurrentUser ? theme.colors.primary : theme.colors.onSurface }
                    ]}>
                      {participant.name}
                    </Text>
                    <Text style={[styles.participantScore, { color: theme.colors.onSurfaceVariant }]}>
                      {participant.score} pts
                    </Text>
                  </View>
                  {index < 3 && (
                    <MaterialCommunityIcons 
                      name="trophy" 
                      size={20} 
                      color={index === 0 ? '#fbbf24' : index === 1 ? '#c0c0c0' : '#cd7f32'}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Current User Entry */}
        {data.currentUserEntry && (
          <View style={styles.userEntrySection}>
            <Text style={[styles.userEntryTitle, { color: theme.colors.onSurface }]}>
              Your Entry
            </Text>
            {data.currentUserEntry.prediction && (
              <Text style={[styles.userPrediction, { color: theme.colors.onSurfaceVariant }]}>
                Prediction: {data.currentUserEntry.prediction}
              </Text>
            )}
            {data.currentUserEntry.score !== undefined && (
              <View style={styles.userScoreRow}>
                <Text style={[styles.userScore, { color: theme.colors.onSurface }]}>
                  Score: {data.currentUserEntry.score} pts
                </Text>
                {data.currentUserEntry.rank && (
                  <Text style={[styles.userRank, { color: theme.colors.primary }]}>
                    Rank: #{data.currentUserEntry.rank}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {data.status === 'upcoming' && data.canJoin && !data.isJoined && (
            <Button
              mode="contained"
              onPress={handleJoin}
              style={styles.joinButton}
              icon="plus"
            >
              Join Competition
            </Button>
          )}
          
          {data.isJoined && data.status === 'active' && data.type === 'prediction' && (
            <Button
              mode="contained"
              onPress={handleMakePrediction}
              style={styles.predictionButton}
              icon="crystal-ball"
            >
              Make Prediction
            </Button>
          )}
          
          {data.isJoined && data.status === 'active' && (
            <Button
              mode="outlined"
              onPress={handleLeave}
              style={styles.leaveButton}
              icon="exit-to-app"
            >
              Leave
            </Button>
          )}
          
          {data.status === 'completed' && (
            <Button
              mode="outlined"
              onPress={() => onViewLeaderboard?.(data.id)}
              style={styles.leaderboardButton}
              icon="trophy"
            >
              View Results
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginHorizontal: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    marginRight: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  timeRemaining: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  prizeSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
  },
  prizeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  prizeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  prizeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  prizeDescription: {
    fontSize: 12,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  participantsSection: {
    marginBottom: 16,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  leaderboard: {
    gap: 8,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  currentUserItem: {
    backgroundColor: '#e0f2fe',
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    gap: 8,
  },
  rank: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 30,
  },
  avatar: {
    marginRight: 8,
  },
  currentUserAvatar: {
    backgroundColor: '#3b82f6',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  participantScore: {
    fontSize: 12,
  },
  userEntrySection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
  },
  userEntryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  userPrediction: {
    fontSize: 14,
    marginBottom: 4,
  },
  userScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userScore: {
    fontSize: 14,
    fontWeight: '500',
  },
  userRank: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 8,
  },
  joinButton: {
    backgroundColor: '#10b981',
  },
  predictionButton: {
    backgroundColor: '#3b82f6',
  },
  leaveButton: {
    borderColor: '#ef4444',
  },
  leaderboardButton: {
    borderColor: '#fbbf24',
  },
});
