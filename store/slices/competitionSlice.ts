import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Competition, UserPrediction } from '../../services/CompetitionService';
import { Challenge, UserChallengeParticipation } from '../../services/ChallengeService';
import { UserBadge, UserPoints, LeaderboardEntry } from '../../services/RewardSystem';
import { competitionService } from '../../services/CompetitionService';
import { challengeService } from '../../services/ChallengeService';
import { rewardSystem } from '../../services/RewardSystem';

interface CompetitionState {
  // Competitions
  activeCompetitions: Competition[];
  upcomingCompetitions: Competition[];
  completedCompetitions: Competition[];
  userPredictions: UserPrediction[];
  
  // Challenges
  activeChallenges: Challenge[];
  upcomingChallenges: Challenge[];
  completedChallenges: Challenge[];
  userParticipations: UserChallengeParticipation[];
  
  // Rewards
  userBadges: UserBadge[];
  userPoints: UserPoints | null;
  leaderboards: {
    [key: string]: LeaderboardEntry[];
  };
  
  // UI State
  selectedCompetitionCategory: 'all' | 'binary' | 'multiple_choice' | 'numeric';
  selectedChallengeCategory: 'all' | 'portfolio' | 'prediction' | 'educational' | 'social' | 'mixed';
  selectedLeaderboardCategory: 'overall' | 'predictions' | 'social' | 'learning' | 'performance';
  selectedLeaderboardPeriod: 'weekly' | 'monthly' | 'all_time';
  
  // Loading States
  isLoading: boolean;
  isSubmittingPrediction: boolean;
  isJoiningChallenge: boolean;
  isAwardingBadge: boolean;
  
  // Error States
  error: string | null;
}

const initialState: CompetitionState = {
  // Competitions
  activeCompetitions: [],
  upcomingCompetitions: [],
  completedCompetitions: [],
  userPredictions: [],
  
  // Challenges
  activeChallenges: [],
  upcomingChallenges: [],
  completedChallenges: [],
  userParticipations: [],
  
  // Rewards
  userBadges: [],
  userPoints: null,
  leaderboards: {},
  
  // UI State
  selectedCompetitionCategory: 'all',
  selectedChallengeCategory: 'all',
  selectedLeaderboardCategory: 'overall',
  selectedLeaderboardPeriod: 'weekly',
  
  // Loading States
  isLoading: false,
  isSubmittingPrediction: false,
  isJoiningChallenge: false,
  isAwardingBadge: false,
  
  // Error States
  error: null,
};

// Async Thunks for Competitions
export const fetchActiveCompetitions = createAsyncThunk(
  'competition/fetchActiveCompetitions',
  async () => {
    return await competitionService.getActiveCompetitions();
  }
);

export const fetchUpcomingCompetitions = createAsyncThunk(
  'competition/fetchUpcomingCompetitions',
  async () => {
    return await competitionService.getUpcomingCompetitions();
  }
);

export const fetchCompletedCompetitions = createAsyncThunk(
  'competition/fetchCompletedCompetitions',
  async (limit: number = 10) => {
    return await competitionService.getCompletedCompetitions(limit);
  }
);

export const submitPrediction = createAsyncThunk(
  'competition/submitPrediction',
  async (params: {
    userId: string;
    competitionId: string;
    prediction: string | number;
    confidence: number;
  }) => {
    const predictionId = await competitionService.submitPrediction(
      params.userId,
      params.competitionId,
      params.prediction,
      params.confidence
    );
    return await competitionService.getUserPrediction(params.userId, params.competitionId);
  }
);

export const fetchUserCompetitionHistory = createAsyncThunk(
  'competition/fetchUserCompetitionHistory',
  async (params: { userId: string; limit?: number }) => {
    return await competitionService.getUserCompetitionHistory(params.userId, params.limit);
  }
);

// Async Thunks for Challenges
export const fetchActiveChallenges = createAsyncThunk(
  'competition/fetchActiveChallenges',
  async () => {
    return await challengeService.getActiveChallenges();
  }
);

export const fetchUpcomingChallenges = createAsyncThunk(
  'competition/fetchUpcomingChallenges',
  async () => {
    return await challengeService.getUpcomingChallenges();
  }
);

export const fetchCompletedChallenges = createAsyncThunk(
  'competition/fetchCompletedChallenges',
  async (limit: number = 10) => {
    return await challengeService.getCompletedChallenges(limit);
  }
);

export const joinChallenge = createAsyncThunk(
  'competition/joinChallenge',
  async (params: { userId: string; challengeId: string }) => {
    const participationId = await challengeService.joinChallenge(params.userId, params.challengeId);
    return await challengeService.getUserParticipation(params.userId, params.challengeId);
  }
);

export const fetchUserChallengeHistory = createAsyncThunk(
  'competition/fetchUserChallengeHistory',
  async (params: { userId: string; limit?: number }) => {
    return await challengeService.getUserChallengeHistory(params.userId, params.limit);
  }
);

// Async Thunks for Rewards
export const fetchUserBadges = createAsyncThunk(
  'competition/fetchUserBadges',
  async (userId: string) => {
    return await rewardSystem.getUserBadges(userId);
  }
);

export const fetchUserPoints = createAsyncThunk(
  'competition/fetchUserPoints',
  async (userId: string) => {
    return await rewardSystem.getUserPoints(userId);
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'competition/fetchLeaderboard',
  async (params: {
    category: LeaderboardEntry['category'];
    period: LeaderboardEntry['period'];
    limit?: number;
  }) => {
    const leaderboard = await rewardSystem.getLeaderboard(
      params.category,
      params.period,
      params.limit
    );
    return {
      key: `${params.category}_${params.period}`,
      data: leaderboard,
    };
  }
);

export const awardPoints = createAsyncThunk(
  'competition/awardPoints',
  async (params: {
    userId: string;
    amount: number;
    reason: string;
    source: 'competition' | 'prediction' | 'social' | 'learning' | 'challenge' | 'badge' | 'admin';
    metadata?: Record<string, any>;
  }) => {
    await rewardSystem.awardPoints(
      params.userId,
      params.amount,
      params.reason,
      params.source,
      params.metadata
    );
    return await rewardSystem.getUserPoints(params.userId);
  }
);

export const awardBadge = createAsyncThunk(
  'competition/awardBadge',
  async (params: { userId: string; badgeId: string; progress?: number }) => {
    await rewardSystem.awardBadge(params.userId, params.badgeId, params.progress);
    return await rewardSystem.getUserBadges(params.userId);
  }
);

const competitionSlice = createSlice({
  name: 'competition',
  initialState,
  reducers: {
    // UI State Reducers
    setSelectedCompetitionCategory: (state, action: PayloadAction<CompetitionState['selectedCompetitionCategory']>) => {
      state.selectedCompetitionCategory = action.payload;
    },
    setSelectedChallengeCategory: (state, action: PayloadAction<CompetitionState['selectedChallengeCategory']>) => {
      state.selectedChallengeCategory = action.payload;
    },
    setSelectedLeaderboardCategory: (state, action: PayloadAction<CompetitionState['selectedLeaderboardCategory']>) => {
      state.selectedLeaderboardCategory = action.payload;
    },
    setSelectedLeaderboardPeriod: (state, action: PayloadAction<CompetitionState['selectedLeaderboardPeriod']>) => {
      state.selectedLeaderboardPeriod = action.payload;
    },
    
    // Clear Error
    clearError: (state) => {
      state.error = null;
    },
    
    // Add Real-time Updates
    addActiveCompetition: (state, action: PayloadAction<Competition>) => {
      const existingIndex = state.activeCompetitions.findIndex(c => c.id === action.payload.id);
      if (existingIndex >= 0) {
        state.activeCompetitions[existingIndex] = action.payload;
      } else {
        state.activeCompetitions.push(action.payload);
      }
    },
    
    addActiveChallenge: (state, action: PayloadAction<Challenge>) => {
      const existingIndex = state.activeChallenges.findIndex(c => c.id === action.payload.id);
      if (existingIndex >= 0) {
        state.activeChallenges[existingIndex] = action.payload;
      } else {
        state.activeChallenges.push(action.payload);
      }
    },
    
    addUserPrediction: (state, action: PayloadAction<UserPrediction>) => {
      const existingIndex = state.userPredictions.findIndex(p => p.id === action.payload.id);
      if (existingIndex >= 0) {
        state.userPredictions[existingIndex] = action.payload;
      } else {
        state.userPredictions.push(action.payload);
      }
    },
    
    addUserParticipation: (state, action: PayloadAction<UserChallengeParticipation>) => {
      const existingIndex = state.userParticipations.findIndex(p => p.id === action.payload.id);
      if (existingIndex >= 0) {
        state.userParticipations[existingIndex] = action.payload;
      } else {
        state.userParticipations.push(action.payload);
      }
    },
    
    addUserBadge: (state, action: PayloadAction<UserBadge>) => {
      const existingIndex = state.userBadges.findIndex(b => b.id === action.payload.id);
      if (existingIndex >= 0) {
        state.userBadges[existingIndex] = action.payload;
      } else {
        state.userBadges.push(action.payload);
      }
    },
    
    updateUserPoints: (state, action: PayloadAction<UserPoints>) => {
      state.userPoints = action.payload;
    },
    
    updateLeaderboard: (state, action: PayloadAction<{ key: string; data: LeaderboardEntry[] }>) => {
      state.leaderboards[action.payload.key] = action.payload.data;
    },
  },
  extraReducers: (builder) => {
    // Competitions
    builder
      .addCase(fetchActiveCompetitions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveCompetitions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeCompetitions = action.payload;
      })
      .addCase(fetchActiveCompetitions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch active competitions';
      })
      
      .addCase(fetchUpcomingCompetitions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingCompetitions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.upcomingCompetitions = action.payload;
      })
      .addCase(fetchUpcomingCompetitions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch upcoming competitions';
      })
      
      .addCase(fetchCompletedCompetitions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompletedCompetitions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.completedCompetitions = action.payload;
      })
      .addCase(fetchCompletedCompetitions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch completed competitions';
      })
      
      .addCase(submitPrediction.pending, (state) => {
        state.isSubmittingPrediction = true;
        state.error = null;
      })
      .addCase(submitPrediction.fulfilled, (state, action) => {
        state.isSubmittingPrediction = false;
        if (action.payload) {
          state.userPredictions.push(action.payload);
        }
      })
      .addCase(submitPrediction.rejected, (state, action) => {
        state.isSubmittingPrediction = false;
        state.error = action.error.message || 'Failed to submit prediction';
      })
      
      .addCase(fetchUserCompetitionHistory.fulfilled, (state, action) => {
        state.userPredictions = action.payload;
      });

    // Challenges
    builder
      .addCase(fetchActiveChallenges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveChallenges.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeChallenges = action.payload;
      })
      .addCase(fetchActiveChallenges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch active challenges';
      })
      
      .addCase(fetchUpcomingChallenges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingChallenges.fulfilled, (state, action) => {
        state.isLoading = false;
        state.upcomingChallenges = action.payload;
      })
      .addCase(fetchUpcomingChallenges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch upcoming challenges';
      })
      
      .addCase(fetchCompletedChallenges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompletedChallenges.fulfilled, (state, action) => {
        state.isLoading = false;
        state.completedChallenges = action.payload;
      })
      .addCase(fetchCompletedChallenges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch completed challenges';
      })
      
      .addCase(joinChallenge.pending, (state) => {
        state.isJoiningChallenge = true;
        state.error = null;
      })
      .addCase(joinChallenge.fulfilled, (state, action) => {
        state.isJoiningChallenge = false;
        if (action.payload) {
          state.userParticipations.push(action.payload);
        }
      })
      .addCase(joinChallenge.rejected, (state, action) => {
        state.isJoiningChallenge = false;
        state.error = action.error.message || 'Failed to join challenge';
      })
      
      .addCase(fetchUserChallengeHistory.fulfilled, (state, action) => {
        state.userParticipations = action.payload;
      });

    // Rewards
    builder
      .addCase(fetchUserBadges.fulfilled, (state, action) => {
        state.userBadges = action.payload;
      })
      
      .addCase(fetchUserPoints.fulfilled, (state, action) => {
        state.userPoints = action.payload;
      })
      
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.leaderboards[action.payload.key] = action.payload.data;
      })
      
      .addCase(awardPoints.fulfilled, (state, action) => {
        state.userPoints = action.payload;
      })
      
      .addCase(awardBadge.pending, (state) => {
        state.isAwardingBadge = true;
        state.error = null;
      })
      .addCase(awardBadge.fulfilled, (state, action) => {
        state.isAwardingBadge = false;
        state.userBadges = action.payload;
      })
      .addCase(awardBadge.rejected, (state, action) => {
        state.isAwardingBadge = false;
        state.error = action.error.message || 'Failed to award badge';
      });
  },
});

export const {
  setSelectedCompetitionCategory,
  setSelectedChallengeCategory,
  setSelectedLeaderboardCategory,
  setSelectedLeaderboardPeriod,
  clearError,
  addActiveCompetition,
  addActiveChallenge,
  addUserPrediction,
  addUserParticipation,
  addUserBadge,
  updateUserPoints,
  updateLeaderboard,
} = competitionSlice.actions;

export default competitionSlice.reducer;
