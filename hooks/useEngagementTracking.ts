// Hook for managing engagement tracking in components
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { engagementTracker } from '../services/EngagementTracker';
import { preferenceAnalyzer } from '../services/PreferenceAnalyzer';
import { useAuth } from '../providers/AuthProvider';

export function useEngagementTracking() {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Initialize session tracking when user is available
  useEffect(() => {
    if (user) {
      initializeSession();
    }

    return () => {
      if (user && sessionIdRef.current) {
        endSession();
      }
    };
  }, [user]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (user && !sessionIdRef.current) {
          initializeSession();
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        if (user && sessionIdRef.current) {
          endSession();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user]);

  const initializeSession = async () => {
    if (!user || sessionIdRef.current) return;

    try {
      const sessionId = await engagementTracker.trackSessionStart(user.uid);
      sessionIdRef.current = sessionId;
      console.log('📊 Session initialized:', sessionId);
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const endSession = async () => {
    if (!user || !sessionIdRef.current) return;

    try {
      await engagementTracker.trackSessionEnd(user.uid, sessionIdRef.current);
      sessionIdRef.current = null;
      console.log('📊 Session ended');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const updateUserPreferences = async () => {
    if (!user) return;

    try {
      await preferenceAnalyzer.updateUserPreferences(user.uid);
      console.log('📊 User preferences updated');
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

  const getSessionContext = () => {
    return engagementTracker.getSessionContext();
  };

  const trackCardInteraction = async (
    cardId: string,
    cardType: 'lesson' | 'podcast' | 'news' | 'stock' | 'crypto' | 'challenge',
    action: 'swipe_right' | 'swipe_left' | 'save' | 'share' | 'play' | 'complete' | 'view' | 'bookmark',
    context?: {
      position?: number;
      timeSpent?: number;
    }
  ) => {
    if (!user) return;

    try {
      await engagementTracker.trackCardInteraction(
        user.uid,
        cardId,
        cardType,
        action,
        {
          ...context,
          sessionId: sessionIdRef.current || getSessionContext().sessionId
        }
      );
    } catch (error) {
      console.error('Error tracking card interaction:', error);
    }
  };

  return {
    sessionId: sessionIdRef.current,
    trackCardInteraction,
    updateUserPreferences,
    getSessionContext,
    initializeSession,
    endSession
  };
}
