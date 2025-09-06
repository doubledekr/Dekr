import { useEffect } from 'react';
import { useColorScheme, Alert } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from '../store/store';
import { darkTheme, lightTheme } from '../theme/theme';
import useCachedResources from '../hooks/useCachedResources';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { AuthProvider } from '@/providers/AuthProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, requestNotificationPermissions, checkNotificationPermissions } from '../services/notifications';
import { notificationHandler } from '../src/services/notificationHandler';
import { logScreenView } from '../services/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LayoutProvider } from '../contexts/LayoutContext';
import { EducationProvider } from '../contexts/EducationContext';

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';
    const inProtectedGroup = segments[0] === '(tabs)';

    if (!hasCompletedOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && !isAuthenticated && !inAuthGroup) {
      router.replace('/auth/sign-in');
    } else if (hasCompletedOnboarding && isAuthenticated && (inOnboardingGroup || inAuthGroup)) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, segments, isLoading, isAuthenticated]);

  return (
    <Stack screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="onboarding/index"
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="auth/sign-in"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/sign-up"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/forgot-password"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat"
        options={{
          headerShown: false,
          presentation: 'modal'
        }}
      />
      <Stack.Screen
        name="DeckDetail"
        options={{
          headerShown: true,
          title: 'Deck Details',
        }}
      />
      <Stack.Screen
        name="CreateDeck"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'Create Deck',
        }}
      />
      <Stack.Screen
        name="AddToDeck"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'Add to Deck',
        }}
      />
      <Stack.Screen
        name="CardDetail"
        options={{
          headerShown: true,
          title: 'Asset Details',
        }}
      />
      <Stack.Screen
        name="ShareCode"
        options={{
          headerShown: true,
          title: 'Enter Share Code',
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          title: 'User Profile',
        }}
      />
      <Stack.Screen
        name="StrategyEditor"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'Strategy Editor',
        }}
      />
      <Stack.Screen
        name="BacktestScreen"
        options={{
          headerShown: true,
          title: 'Backtest Results',
        }}
      />
      <Stack.Screen
        name="CreateChallenge"
        options={{
          headerShown: true,
          presentation: 'modal',
          title: 'Create Challenge',
        }}
      />
      <Stack.Screen
        name="ChallengeDetail"
        options={{
          headerShown: true,
          title: 'Challenge Details',
        }}
      />
      <Stack.Screen
        name="lesson-detail"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CommunityLearningDeckScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="StageDeckScreen"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="webview"
        options={{
          headerShown: true,
          title: 'Web View',
        }}
      />
      <Stack.Screen
        name="loading"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isLoadingComplete = useCachedResources();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    async function setupNotifications() {
      try {
        // Check if we've asked for permission before
        const hasAskedForPermission = await AsyncStorage.getItem('hasAskedForNotificationPermission');
        
        if (!hasAskedForPermission) {
          // Show custom prompt
          Alert.alert(
            "Stay Updated",
            "Would you like to receive notifications about price changes and market updates?",
            [
              {
                text: "Not Now",
                onPress: () => AsyncStorage.setItem('hasAskedForNotificationPermission', 'true'),
                style: "cancel"
              },
              {
                text: "Allow",
                onPress: async () => {
                  await AsyncStorage.setItem('hasAskedForNotificationPermission', 'true');
                  const granted = await requestNotificationPermissions();
                  if (!granted) {
                    Alert.alert(
                      "Notifications Disabled",
                      "You can enable notifications later in your device settings."
                    );
                  }
                }
              }
            ]
          );
        } else {
          // Check existing permission if we've asked before
          const hasPermission = await checkNotificationPermissions();
          if (hasPermission) {
            const token = await registerForPushNotificationsAsync();
            console.log('Push token:', token);
          }
        }

        // Set up notification response handler
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
          const data = response.notification.request.content.data;
          console.log('Notification interaction:', data);
          // Handle notification interaction here
        });

        // Initialize notification handler
        await notificationHandler.initialize();

        // Log initial screen view
        logScreenView('App Launch');

        return () => {
          Notifications.removeNotificationSubscription(responseListener);
        };
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    }

    setupNotifications();
  }, []);

  if (!isLoadingComplete) {
    return null;
  }

  return (
    <ReduxProvider store={store}>
      <ErrorBoundary>
        <AuthProvider>
          <PaperProvider theme={theme}>
            <LayoutProvider>
              <EducationProvider>
                <OnboardingProvider>
                  <RootLayoutNav />
                </OnboardingProvider>
              </EducationProvider>
            </LayoutProvider>
          </PaperProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ReduxProvider>
  );
}
