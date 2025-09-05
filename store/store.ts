import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import watchlistReducer from './slices/watchlistSlice';
import recommendationReducer from './slices/recommendationSlice';
import competitionReducer from './slices/competitionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    watchlist: watchlistReducer,
    recommendations: recommendationReducer,
    competition: competitionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 