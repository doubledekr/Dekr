// Placeholder for push notifications
export const pushNotificationService = {
  initialize: async () => null,
  updateSettings: async () => {},
  getSettings: async () => null,
  sendLocalNotification: async () => {},
  addNotificationReceivedListener: () => ({ remove: () => {} }),
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  getCurrentToken: () => null,
  areNotificationsEnabled: async () => false,
  isQuietHours: async () => false,
  testNotification: async () => {},
};

export const usePushNotifications = () => ({
  isInitialized: false,
  settings: null,
  loading: false,
  error: null,
  updateSettings: async () => {},
  sendTestNotification: async () => {},
  reinitialize: async () => {},
});