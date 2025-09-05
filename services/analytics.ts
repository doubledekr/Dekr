import analytics from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

export const AnalyticsEvents = {
  VIEW_CARD: 'view_card',
  SWIPE_CARD: 'swipe_card',
  ADD_TO_WATCHLIST: 'add_to_watchlist',
  REMOVE_FROM_WATCHLIST: 'remove_from_watchlist',
  SHARE_CARD: 'share_card',
  VIEW_PROFILE: 'view_profile',
  COMPLETE_ONBOARDING: 'complete_onboarding',
  SET_PRICE_ALERT: 'set_price_alert',
  SEARCH_MARKET: 'search_market',
  FILTER_CHANGE: 'filter_change',
  ERROR_OCCURRED: 'error_occurred',
  SET_SENTIMENT: 'set_sentiment',
  // Social features
  SEND_RECOMMENDATION: 'send_recommendation',
  VIEW_RECOMMENDATION: 'view_recommendation',
  VOTE_ON_RECOMMENDATION: 'vote_on_recommendation',
  SUBMIT_FOR_VETTING: 'submit_for_vetting',
  CONVERT_TO_SIGNAL: 'convert_to_signal',
  CREATE_SIGNAL: 'create_signal',
  SUBSCRIBE_TO_SIGNAL: 'subscribe_to_signal',
  UNSUBSCRIBE_FROM_SIGNAL: 'unsubscribe_from_signal',
  CREATE_SIGNAL_ALERT: 'create_signal_alert',
  UPDATE_SIGNAL_STATUS: 'update_signal_status',
  // Competition features
  CREATE_COMPETITION: 'create_competition',
  SUBMIT_PREDICTION: 'submit_prediction',
  UPDATE_COMPETITION_STATUS: 'update_competition_status',
  CALCULATE_REWARDS: 'calculate_rewards',
  // Reward system
  AWARD_POINTS: 'award_points',
  SPEND_POINTS: 'spend_points',
  CREATE_BADGE: 'create_badge',
  AWARD_BADGE: 'award_badge',
  UPDATE_LEADERBOARD: 'update_leaderboard',
  // Challenge features
  CREATE_CHALLENGE: 'create_challenge',
  JOIN_CHALLENGE: 'join_challenge',
  SUBMIT_TO_CHALLENGE: 'submit_to_challenge',
  UPDATE_CHALLENGE_STATUS: 'update_challenge_status',
  CALCULATE_CHALLENGE_RESULTS: 'calculate_challenge_results',
  CREATE_TEAM_CHALLENGE: 'create_team_challenge',
  // Analytics and performance
  START_SESSION: 'start_session',
  END_SESSION: 'end_session',
  TRACK_PERFORMANCE: 'track_performance',
  TRACK_JOURNEY: 'track_journey',
  TRACK_FEATURE_USAGE: 'track_feature_usage',
  // Newsletter features
  CREATE_NEWSLETTER: 'create_newsletter',
  VIEW_NEWSLETTER: 'view_newsletter',
  SHARE_NEWSLETTER: 'share_newsletter',
  LIKE_NEWSLETTER: 'like_newsletter',
  UPDATE_NEWSLETTER_STATS: 'update_newsletter_stats',
  SEND_NEWSLETTER: 'send_newsletter',
  ADD_EMAIL_SUBSCRIBER: 'add_email_subscriber',
  REMOVE_EMAIL_SUBSCRIBER: 'remove_email_subscriber',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

interface BaseEventParams {
  timestamp: number;
  platform: string;
}

export async function logEvent(
  eventName: AnalyticsEventName,
  params?: Record<string, any>
) {
  try {
    const baseParams: BaseEventParams = {
      timestamp: Date.now(),
      platform: Platform.OS,
    };

    await analytics().logEvent(eventName, {
      ...baseParams,
      ...params,
    });
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
}

export async function setUserProperties(properties: Record<string, string>) {
  try {
    const entries = Object.entries(properties);
    for (const [key, value] of entries) {
      await analytics().setUserProperty(key, value);
    }
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
}

export async function logScreenView(screenName: string, screenClass?: string) {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch (error) {
    console.error('Error logging screen view:', error);
  }
}

export async function logError(error: Error, additionalParams?: Record<string, any>) {
  try {
    await logEvent(AnalyticsEvents.ERROR_OCCURRED, {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...additionalParams,
    });
  } catch (analyticsError) {
    console.error('Error logging error event:', analyticsError);
  }
} 