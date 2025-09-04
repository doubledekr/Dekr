import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { pushNotificationService } from './pushNotifications';

export interface NotificationData {
  alertId?: string;
  strategyId?: string;
  symbol?: string;
  signalType?: 'buy' | 'sell';
  type: 'trading_alert' | 'trading_alerts_summary' | 'test';
  alertCount?: number;
}

/**
 * Hook to handle notification interactions and navigation
 */
export const useNotificationHandler = () => {
  const navigation = useNavigation();

  const handleNotificationPress = useCallback((data: NotificationData) => {
    switch (data.type) {
      case 'trading_alert':
        // Navigate to specific alert or asset
        if (data.symbol) {
          navigation.navigate('CardDetail', {
            symbol: data.symbol,
            cardId: data.symbol,
          });
        } else if (data.alertId) {
          navigation.navigate('Alerts');
        }
        break;

      case 'trading_alerts_summary':
        // Navigate to alerts screen
        navigation.navigate('Alerts');
        break;

      case 'test':
        // Just navigate to alerts for test notifications
        navigation.navigate('Alerts');
        break;

      default:
        // Default to alerts screen
        navigation.navigate('Alerts');
        break;
    }
  }, [navigation]);

  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    
    // You could show a custom in-app notification here
    // or update badge counts, etc.
  }, []);

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    console.log('Notification tapped:', response);
    
    const data = response.notification.request.content.data as NotificationData;
    if (data) {
      handleNotificationPress(data);
    }
  }, [handleNotificationPress]);

  useEffect(() => {
    // Set up notification listeners
    const receivedSubscription = pushNotificationService.addNotificationReceivedListener(
      handleNotificationReceived
    );

    const responseSubscription = pushNotificationService.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [handleNotificationReceived, handleNotificationResponse]);

  return {
    handleNotificationPress,
  };
};

/**
 * Service to manage app-wide notification behavior
 */
export class NotificationHandlerService {
  private static instance: NotificationHandlerService;

  static getInstance(): NotificationHandlerService {
    if (!NotificationHandlerService.instance) {
      NotificationHandlerService.instance = new NotificationHandlerService();
    }
    return NotificationHandlerService.instance;
  }

  /**
   * Initialize notification handling
   */
  async initialize() {
    try {
      // Initialize push notifications
      await pushNotificationService.initialize();

      // Set up app state change handlers for badge management
      this.setupBadgeManagement();

      console.log('Notification handler initialized');
    } catch (error) {
      console.error('Error initializing notification handler:', error);
    }
  }

  /**
   * Set up badge management
   */
  private setupBadgeManagement() {
    // Clear badge when app becomes active
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        this.clearBadge();
      }
    };

    // Note: In a real implementation, you'd import AppState from 'react-native'
    // and add a listener here. For now, we'll just clear the badge.
    this.clearBadge();
  }

  /**
   * Clear app badge
   */
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  /**
   * Set app badge count
   */
  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Handle deep link from notification
   */
  handleDeepLink(url: string) {
    try {
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      const data: NotificationData = {
        type: (params.get('type') as any) || 'trading_alert',
        alertId: params.get('alertId') || undefined,
        strategyId: params.get('strategyId') || undefined,
        symbol: params.get('symbol') || undefined,
        signalType: (params.get('signalType') as any) || undefined,
      };

      return data;
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleTestNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Trading Alert',
          body: 'BUY signal for AAPL at $150.00 from RSI Strategy',
          data: {
            type: 'trading_alert',
            symbol: 'AAPL',
            signalType: 'buy',
            alertId: 'test-alert-123',
          } as NotificationData,
          sound: true,
        },
        trigger: {
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  }

  /**
   * Get pending notifications
   */
  async getPendingNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Cancel all pending notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  /**
   * Request permissions if not already granted
   */
  async requestPermissions() {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationHandler = NotificationHandlerService.getInstance();
