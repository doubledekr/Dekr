import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface AuthState {
  user: FirebaseAuthTypes.User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  hasCompletedOnboarding: boolean;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  hasCompletedOnboarding: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<FirebaseAuthTypes.User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
      state.error = null;
      state.isInitialized = true;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    signOut: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setHasCompletedOnboarding: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedOnboarding = action.payload;
    },
  },
});

export const { 
  setUser, 
  setLoading, 
  setError, 
  signOut, 
  setHasCompletedOnboarding 
} = authSlice.actions;

export default authSlice.reducer; 