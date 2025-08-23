import React, { useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useDispatch } from 'react-redux';
import { setUser, setHasCompletedOnboarding } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        dispatch(setUser(user));
        // Store onboarding status
        const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
        if (hasCompletedOnboarding === 'true') {
          dispatch(setHasCompletedOnboarding(true));
        }
      } else {
        // User is signed out
        dispatch(setUser(null));
      }
    });

    // Cleanup subscription
    return unsubscribe;
  }, [dispatch]);

  return <>{children}</>;
} 