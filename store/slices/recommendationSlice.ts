import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Recommendation, FriendRecommendationStats, recommendationService } from '../../services/RecommendationService';

interface RecommendationState {
  sentRecommendations: Recommendation[];
  receivedRecommendations: Recommendation[];
  pendingRecommendations: Recommendation[];
  userStats: FriendRecommendationStats | null;
  friends: Array<{id: string, name: string, avatar?: string}>;
  loading: {
    sent: boolean;
    received: boolean;
    pending: boolean;
    stats: boolean;
    friends: boolean;
  };
  error: string | null;
}

const initialState: RecommendationState = {
  sentRecommendations: [],
  receivedRecommendations: [],
  pendingRecommendations: [],
  userStats: null,
  friends: [],
  loading: {
    sent: false,
    received: false,
    pending: false,
    stats: false,
    friends: false,
  },
  error: null,
};

// Async thunks
export const fetchSentRecommendations = createAsyncThunk(
  'recommendations/fetchSent',
  async (userId: string) => {
    return await recommendationService.getSentRecommendations(userId);
  }
);

export const fetchReceivedRecommendations = createAsyncThunk(
  'recommendations/fetchReceived',
  async (userId: string) => {
    return await recommendationService.getReceivedRecommendations(userId);
  }
);

export const fetchPendingRecommendations = createAsyncThunk(
  'recommendations/fetchPending',
  async (userId: string) => {
    return await recommendationService.getPendingRecommendations(userId);
  }
);

export const fetchUserStats = createAsyncThunk(
  'recommendations/fetchStats',
  async (userId: string) => {
    return await recommendationService.getUserRecommendationStats(userId);
  }
);

export const fetchFriends = createAsyncThunk(
  'recommendations/fetchFriends',
  async (userId: string) => {
    return await recommendationService.getFriends(userId);
  }
);

export const sendRecommendation = createAsyncThunk(
  'recommendations/send',
  async (params: {
    fromUserId: string;
    fromUserName: string;
    fromUserAvatar?: string;
    toUserId: string;
    toUserName: string;
    recommendationData: Omit<Recommendation, 'id' | 'fromUserId' | 'fromUserName' | 'fromUserAvatar' | 'toUserId' | 'toUserName' | 'createdAt' | 'updatedAt' | 'status'>;
  }) => {
    const { fromUserId, fromUserName, fromUserAvatar, toUserId, toUserName, recommendationData } = params;
    return await recommendationService.sendRecommendation(
      fromUserId,
      fromUserName,
      fromUserAvatar,
      toUserId,
      toUserName,
      recommendationData
    );
  }
);

export const markRecommendationAsViewed = createAsyncThunk(
  'recommendations/markViewed',
  async (recommendationId: string) => {
    await recommendationService.markAsViewed(recommendationId);
    return recommendationId;
  }
);

export const updateRecommendationStatus = createAsyncThunk(
  'recommendations/updateStatus',
  async (params: {
    recommendationId: string;
    status: Recommendation['status'];
    performance?: Recommendation['performance'];
  }) => {
    const { recommendationId, status, performance } = params;
    await recommendationService.updateRecommendationStatus(recommendationId, status, performance);
    return { recommendationId, status, performance };
  }
);

export const deleteRecommendation = createAsyncThunk(
  'recommendations/delete',
  async (recommendationId: string) => {
    await recommendationService.deleteRecommendation(recommendationId);
    return recommendationId;
  }
);

const recommendationSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addRealTimeRecommendation: (state, action: PayloadAction<Recommendation>) => {
      const recommendation = action.payload;
      
      // Add to received recommendations if it's for current user
      if (recommendation.toUserId === state.receivedRecommendations[0]?.toUserId) {
        state.receivedRecommendations.unshift(recommendation);
        
        // Add to pending if status is pending
        if (recommendation.status === 'pending') {
          state.pendingRecommendations.unshift(recommendation);
        }
      }
    },
    updateRealTimeRecommendation: (state, action: PayloadAction<Recommendation>) => {
      const updatedRecommendation = action.payload;
      
      // Update in received recommendations
      const receivedIndex = state.receivedRecommendations.findIndex(
        rec => rec.id === updatedRecommendation.id
      );
      if (receivedIndex !== -1) {
        state.receivedRecommendations[receivedIndex] = updatedRecommendation;
      }
      
      // Update in pending recommendations
      const pendingIndex = state.pendingRecommendations.findIndex(
        rec => rec.id === updatedRecommendation.id
      );
      if (pendingIndex !== -1) {
        if (updatedRecommendation.status === 'pending') {
          state.pendingRecommendations[pendingIndex] = updatedRecommendation;
        } else {
          state.pendingRecommendations.splice(pendingIndex, 1);
        }
      }
    },
    removeRealTimeRecommendation: (state, action: PayloadAction<string>) => {
      const recommendationId = action.payload;
      
      state.receivedRecommendations = state.receivedRecommendations.filter(
        rec => rec.id !== recommendationId
      );
      state.pendingRecommendations = state.pendingRecommendations.filter(
        rec => rec.id !== recommendationId
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch sent recommendations
    builder
      .addCase(fetchSentRecommendations.pending, (state) => {
        state.loading.sent = true;
        state.error = null;
      })
      .addCase(fetchSentRecommendations.fulfilled, (state, action) => {
        state.loading.sent = false;
        state.sentRecommendations = action.payload;
      })
      .addCase(fetchSentRecommendations.rejected, (state, action) => {
        state.loading.sent = false;
        state.error = action.error.message || 'Failed to fetch sent recommendations';
      });

    // Fetch received recommendations
    builder
      .addCase(fetchReceivedRecommendations.pending, (state) => {
        state.loading.received = true;
        state.error = null;
      })
      .addCase(fetchReceivedRecommendations.fulfilled, (state, action) => {
        state.loading.received = false;
        state.receivedRecommendations = action.payload;
      })
      .addCase(fetchReceivedRecommendations.rejected, (state, action) => {
        state.loading.received = false;
        state.error = action.error.message || 'Failed to fetch received recommendations';
      });

    // Fetch pending recommendations
    builder
      .addCase(fetchPendingRecommendations.pending, (state) => {
        state.loading.pending = true;
        state.error = null;
      })
      .addCase(fetchPendingRecommendations.fulfilled, (state, action) => {
        state.loading.pending = false;
        state.pendingRecommendations = action.payload;
      })
      .addCase(fetchPendingRecommendations.rejected, (state, action) => {
        state.loading.pending = false;
        state.error = action.error.message || 'Failed to fetch pending recommendations';
      });

    // Fetch user stats
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.loading.stats = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.userStats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.error.message || 'Failed to fetch user stats';
      });

    // Fetch friends
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.loading.friends = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.loading.friends = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.loading.friends = false;
        state.error = action.error.message || 'Failed to fetch friends';
      });

    // Send recommendation
    builder
      .addCase(sendRecommendation.fulfilled, (state, action) => {
        // Refresh sent recommendations after sending
        // The real-time listener will handle the update
      })
      .addCase(sendRecommendation.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to send recommendation';
      });

    // Mark as viewed
    builder
      .addCase(markRecommendationAsViewed.fulfilled, (state, action) => {
        const recommendationId = action.payload;
        
        // Update in received recommendations
        const receivedIndex = state.receivedRecommendations.findIndex(
          rec => rec.id === recommendationId
        );
        if (receivedIndex !== -1) {
          state.receivedRecommendations[receivedIndex].status = 'viewed';
        }
        
        // Remove from pending
        state.pendingRecommendations = state.pendingRecommendations.filter(
          rec => rec.id !== recommendationId
        );
      });

    // Update recommendation status
    builder
      .addCase(updateRecommendationStatus.fulfilled, (state, action) => {
        const { recommendationId, status, performance } = action.payload;
        
        // Update in received recommendations
        const receivedIndex = state.receivedRecommendations.findIndex(
          rec => rec.id === recommendationId
        );
        if (receivedIndex !== -1) {
          state.receivedRecommendations[receivedIndex].status = status;
          if (performance) {
            state.receivedRecommendations[receivedIndex].performance = performance;
          }
        }
        
        // Remove from pending if status changed
        if (status !== 'pending') {
          state.pendingRecommendations = state.pendingRecommendations.filter(
            rec => rec.id !== recommendationId
          );
        }
      });

    // Delete recommendation
    builder
      .addCase(deleteRecommendation.fulfilled, (state, action) => {
        const recommendationId = action.payload;
        
        state.receivedRecommendations = state.receivedRecommendations.filter(
          rec => rec.id !== recommendationId
        );
        state.pendingRecommendations = state.pendingRecommendations.filter(
          rec => rec.id !== recommendationId
        );
      });
  },
});

export const {
  clearError,
  addRealTimeRecommendation,
  updateRealTimeRecommendation,
  removeRealTimeRecommendation,
} = recommendationSlice.actions;

export default recommendationSlice.reducer;
