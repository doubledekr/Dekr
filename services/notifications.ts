import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { auth, firestore } from './firebase-platform';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function checkNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  return existingStatus === 'granted';
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Must use physical device for Push Notifications');
    return false;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  const isGranted = status === 'granted';

  // Store the user's choice
  await AsyncStorage.setItem('notificationsEnabled', isGranted.toString());
  
  if (isGranted) {
    // Register for push notifications if permission granted
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await savePushToken(token);
    }
  }

  return isGranted;
}

export async function toggleNotifications(enabled: boolean): Promise<boolean> {
  if (enabled) {
    const isGranted = await requestNotificationPermissions();
    if (!isGranted) {
      // If permission denied, revert the toggle
      return false;
    }
  } else {
    // Remove push token when notifications are disabled
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with your Expo project ID
    }).then(response => response.data);
    
    if (token) {
      await removePushToken(token);
    }
  }

  await AsyncStorage.setItem('notificationsEnabled', enabled.toString());
  return enabled;
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with your Expo project ID
    })).data;
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6CA393',
    });
  }

  return token;
}

export async function savePushToken(token: string) {
  const user = auth().currentUser;
  if (!user) return;

  try {
    const userRef = firestore().collection('users').doc(user.uid);
    await userRef.set({
      pushTokens: firestore.FieldValue.arrayUnion(token),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

export async function removePushToken(token: string) {
  const user = auth().currentUser;
  if (!user) return;

  try {
    const userRef = firestore().collection('users').doc(user.uid);
    await userRef.update({
      pushTokens: firestore.FieldValue.arrayRemove(token),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}

export async function sendPriceAlert(symbol: string, price: number, changePercent: number) {
  const user = auth().currentUser;
  if (!user) return;

  try {
    const userRef = firestore().collection('users').doc(user.uid);
    const userData = await userRef.get();
    const pushTokens = userData.data()?.pushTokens || [];

    // Send to your notification server or use Expo's push notification service
    // This is a placeholder for the actual implementation
    console.log('Would send price alert to tokens:', pushTokens);
  } catch (error) {
    console.error('Error sending price alert:', error);
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger?: Notifications.NotificationTriggerInput
) {
  try {
    const defaultTrigger = { seconds: 1 } as const;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        badge: 1,
      },
      trigger: trigger ?? defaultTrigger,
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
} 