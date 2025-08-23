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