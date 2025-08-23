import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { router } from 'expo-router';

export default function LoadingScreen() {
  const theme = useTheme();
  const { user, hasCompletedOnboarding, isInitialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuthState = async () => {
      if (!isInitialized) return;

      // Add a small delay to prevent flash of loading screen
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else if (!user) {
        router.replace('/auth/sign-in');
      } else {
        router.replace('/(tabs)');
      }
    };

    checkAuthState();
  }, [user, hasCompletedOnboarding, isInitialized]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0E7CB',
  },
}); 