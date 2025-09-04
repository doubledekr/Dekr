# Trade Alerts System

A comprehensive real-time trade alerts system that delivers push notifications when strategy signals fire, with advanced filtering, management, and notification preferences.

## Overview

The Trade Alerts system monitors active trading strategies and automatically generates push notifications when buy/sell signals are detected. The system includes:

1. **Real-time Signal Detection** - Hourly scanning of active strategies
2. **Push Notifications** - FCM/Expo push notifications with rich data
3. **Alerts Management** - Comprehensive alerts screen with filtering and actions
4. **Notification Preferences** - User-configurable settings including quiet hours
5. **Deep Linking** - Direct navigation from notifications to relevant screens

## Features

### 🔔 **Push Notification System**

#### **FCM/Expo Integration**
- **Device Token Management**: Automatic token registration and storage
- **Cross-Platform Support**: iOS, Android, and web compatibility
- **Rich Notifications**: Custom data payloads with alert context
- **Badge Management**: Automatic badge count updates
- **Sound & Vibration**: Configurable notification sounds

#### **Notification Types**
- **Single Alert**: Individual signal notifications with full details
- **Summary Alerts**: Grouped notifications for multiple signals
- **Test Notifications**: User-triggered test notifications
- **Priority-Based**: High/medium/low priority visual indicators

### ⏰ **Scheduled Signal Scanning**

#### **Cloud Function: `scanAndAlert`**
- **Hourly Execution**: Configurable cron schedule (`0 * * * *`)
- **Market Hours Aware**: Respects trading hours and extended hours
- **Crypto 24/7**: Optional always-on monitoring for cryptocurrency
- **Weekend Support**: Configurable weekend scanning
- **Duplicate Prevention**: Prevents spam alerts within 1-hour windows

#### **Advanced Configuration**
```typescript
const scanConfig = {
  marketHoursOnly: false,        // Restrict to market hours (9 AM - 4 PM EST)
  extendedHours: true,           // Include extended hours (4 AM - 8 PM EST)
  weekendsEnabled: false,        // Enable weekend scanning
  cryptoAlwaysOn: true,          // 24/7 crypto monitoring
  minConfidence: 0.5,            // Minimum signal confidence threshold
};
```

### 📱 **Alerts Management Screen**

#### **Advanced Filtering System**
- **Status Filters**: All, Unread, Read alerts
- **Signal Type**: Buy signals, Sell signals
- **Priority Levels**: High, Medium, Low priority
- **Search Function**: Full-text search across titles, messages, symbols
- **Real-time Updates**: Live synchronization with Firestore

#### **Alert Actions**
- **Mark as Read/Unread**: Individual alert status management
- **Delete Alerts**: Single or bulk alert deletion
- **Navigation**: Direct navigation to asset details or strategy editor
- **Bulk Operations**: Mark all as read, clear all alerts

#### **Rich Alert Display**
```typescript
interface AlertDisplay {
  title: string;                    // "BUY Signal: AAPL"
  message: string;                  // Strategy description and price
  symbol: string;                   // Asset symbol
  signalType: 'buy' | 'sell';      // Signal direction
  priority: 'high' | 'medium' | 'low'; // Priority level
  confidence: number;               // Signal confidence (0-1)
  price: number;                    // Current asset price
  change: number;                   // Price change percentage
  timestamp: Date;                  // Alert creation time
  strategyName: string;             // Source strategy name
}
```

### ⚙️ **Notification Preferences**

#### **User Settings** (`users/{uid}/settings/push`)
```typescript
interface PushNotificationSettings {
  enabled: boolean;                 // Master notification toggle
  tradingAlerts: boolean;          // Trading signal notifications
  strategyAlerts: boolean;         // Strategy status notifications
  performanceAlerts: boolean;      // Performance milestone alerts
  riskAlerts: boolean;             // Risk management alerts
  quietHours: {
    enabled: boolean;              // Enable quiet hours
    start: string;                 // Start time (HH:MM)
    end: string;                   // End time (HH:MM)
  };
  deviceToken: string;             // Expo push token
  deviceType: 'ios' | 'android';  // Device platform
}
```

#### **Quiet Hours Support**
- **Configurable Time Windows**: User-defined quiet periods
- **Overnight Support**: Handles overnight quiet hours (22:00 - 08:00)
- **Automatic Respect**: Cloud Function honors quiet hours settings
- **Emergency Override**: High-priority alerts can bypass quiet hours

## Technical Implementation

### **Frontend Architecture**

#### **Push Notification Service** (`src/services/pushNotifications.ts`)
```typescript
class PushNotificationService {
  async initialize(): Promise<string | null>;
  async updateSettings(updates: Partial<PushNotificationSettings>): Promise<void>;
  async getSettings(): Promise<PushNotificationSettings | null>;
  async sendLocalNotification(title: string, body: string, data?: any): Promise<void>;
  async areNotificationsEnabled(): Promise<boolean>;
  async isQuietHours(): Promise<boolean>;
  async testNotification(): Promise<void>;
}
```

#### **Notification Handler** (`src/services/notificationHandler.ts`)
```typescript
class NotificationHandlerService {
  async initialize(): Promise<void>;
  async clearBadge(): Promise<void>;
  async setBadgeCount(count: number): Promise<void>;
  handleDeepLink(url: string): NotificationData | null;
  async scheduleTestNotification(): Promise<void>;
  async requestPermissions(): Promise<boolean>;
}
```

#### **React Hooks**
- **`usePushNotifications()`**: Manage notification settings and initialization
- **`useNotificationHandler()`**: Handle notification interactions and navigation
- **`useAlerts()`**: Manage alerts data with real-time updates

### **Backend Architecture**

#### **Enhanced Cloud Function** (`functions/src/strategies.ts`)

##### **Signal Detection Engine**
```typescript
async function checkStrategyForSymbol(strategy: any, symbol: string, scanConfig: any) {
  // Fetch 30 days of market data
  const marketData = await fetchMarketData(symbol, startDate, endDate);
  
  // Prevent duplicate alerts (1-hour window)
  const recentAlerts = await checkForDuplicateAlerts(strategy.userId, strategy.id, symbol);
  
  // Evaluate buy/sell conditions
  const buySignal = strategy.buyConditions.every(condition => 
    evaluateCondition(marketData, {}, condition)
  );
  
  // Calculate signal confidence
  const confidence = calculateSignalConfidence(marketData, strategy, signalType);
  
  // Create alert if confidence threshold met
  if (confidence >= scanConfig.minConfidence) {
    return await createAlert(alertData);
  }
}
```

##### **Confidence Scoring Algorithm**
```typescript
function calculateSignalConfidence(marketData: any[], strategy: any, signalType: string): number {
  let confidence = 0.6; // Base confidence
  
  // Volume confirmation (+15% if above 1.5x average, -10% if below 0.5x)
  const volumeFactor = calculateVolumeFactor(marketData);
  confidence += volumeFactor;
  
  // Price momentum confirmation (+10% for aligned momentum)
  const momentumFactor = calculateMomentumFactor(marketData, signalType);
  confidence += momentumFactor;
  
  // Multiple conditions bonus (+5% for 3+ conditions)
  const conditionsFactor = calculateConditionsFactor(strategy);
  confidence += conditionsFactor;
  
  // Volatility adjustment (-5% for high volatility)
  const volatilityFactor = calculateVolatilityFactor(marketData);
  confidence += volatilityFactor;
  
  return Math.max(0.1, Math.min(1.0, confidence));
}
```

##### **Push Notification Delivery**
```typescript
async function sendUserPushNotifications(userId: string, alerts: any[]) {
  // Get user notification settings
  const pushSettings = await getUserPushSettings(userId);
  
  // Check if notifications enabled and not in quiet hours
  if (!pushSettings.enabled || await isQuietHours(pushSettings)) {
    return;
  }
  
  // Prepare notification payload
  const notification = {
    to: pushSettings.deviceToken,
    title: alert.title,
    body: alert.message,
    data: {
      alertId: alert.id,
      strategyId: alert.strategyId,
      symbol: alert.symbol,
      signalType: alert.signalType,
      type: 'trading_alert',
    },
    sound: 'default',
    badge: unreadCount,
    priority: alert.priority === 'high' ? 'high' : 'normal',
  };
  
  // Send via Expo Push API
  await sendExpoNotification(notification);
}
```

### **Data Models**

#### **Alert Document Structure** (`alerts/{alertId}`)
```typescript
interface AlertDocument {
  id: string;
  userId: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  alertType: 'signal' | 'performance' | 'risk';
  signalType: 'buy' | 'sell';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  data: {
    price: number;
    confidence: number;
    conditionsMet: string[];
    marketData: {
      volume: number;
      change: number;
    };
  };
  methods: ['push'];
  read: boolean;
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

#### **Push Settings Document** (`users/{uid}/settings/push`)
```typescript
interface PushSettingsDocument {
  deviceToken: string;
  deviceType: 'ios' | 'android' | 'web';
  enabled: boolean;
  tradingAlerts: boolean;
  strategyAlerts: boolean;
  performanceAlerts: boolean;
  riskAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### **Security & Performance**

#### **Firestore Security Rules**
```firestore
// Alerts collection
match /alerts/{alertId} {
  allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
}

// Push settings
match /users/{userId}/settings/push {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

#### **Performance Optimizations**
- **Composite Indexes**: Optimized queries for alert filtering
- **Duplicate Prevention**: Prevents notification spam with time-based checks
- **Batch Processing**: Efficient bulk notification sending
- **Real-time Listeners**: Selective onSnapshot subscriptions
- **Background Processing**: Cloud Functions handle heavy computations

## Usage Examples

### **Initialize Push Notifications**
```typescript
import { usePushNotifications } from '../services/pushNotifications';

const MyComponent = () => {
  const {
    isInitialized,
    settings,
    loading,
    updateSettings,
    sendTestNotification,
  } = usePushNotifications();

  const handleToggleNotifications = async (enabled: boolean) => {
    await updateSettings({ enabled });
  };

  const handleSetQuietHours = async () => {
    await updateSettings({
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
      },
    });
  };
};
```

### **Handle Notification Interactions**
```typescript
import { useNotificationHandler } from '../services/notificationHandler';

const App = () => {
  const { handleNotificationPress } = useNotificationHandler();

  // Notification handler automatically sets up listeners
  // and navigates based on notification data
};
```

### **Manage Alerts**
```typescript
import { useAlerts } from '../hooks/useStrategies';

const AlertsScreen = () => {
  const { alerts, loading, markAsRead, deleteAlert, refetch } = useAlerts();

  const handleAlertPress = async (alert: Alert) => {
    if (!alert.readAt) {
      await markAsRead(alert.id);
    }
    
    // Navigate to relevant screen
    if (alert.data?.symbol) {
      navigation.navigate('CardDetail', { symbol: alert.data.symbol });
    }
  };
};
```

### **Configure Cloud Function**
```typescript
// Deploy with custom configuration
export const scanAndAlert = onSchedule({
  schedule: '0 * * * *',        // Every hour
  timeZone: 'America/New_York', // EST timezone
  region: 'us-central1',        // Cloud region
  memory: '1GiB',               // Memory allocation
  timeoutSeconds: 300,          // 5-minute timeout
}, async () => {
  // Scan logic here
});
```

## Deployment & Configuration

### **Environment Variables**
```bash
# Expo Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Market Data APIs
POLYGON_API_KEY=your_polygon_api_key
MARKETAUX_API_KEY=your_marketaux_api_key

# Alert Configuration
ALERT_MIN_CONFIDENCE=0.5
ALERT_MAX_PER_HOUR=10
ALERT_RETENTION_DAYS=30
```

### **Cloud Function Deployment**
```bash
# Deploy alert functions
firebase deploy --only functions:scanAndAlert

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Set environment variables
firebase functions:config:set alerts.min_confidence=0.5
firebase functions:config:set alerts.max_per_hour=10
```

### **Required Firestore Indexes**
```json
{
  "indexes": [
    {
      "collectionGroup": "alerts",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "read", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "alerts",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "priority", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "alerts",
      "fields": [
        {"fieldPath": "userId", "order": "ASCENDING"},
        {"fieldPath": "signalType", "order": "ASCENDING"},
        {"fieldPath": "createdAt", "order": "DESCENDING"}
      ]
    }
  ]
}
```

## Testing & Debugging

### **Test Notifications**
```typescript
// Send test notification
const { sendTestNotification } = usePushNotifications();
await sendTestNotification();

// Schedule local test
await notificationHandler.scheduleTestNotification();

// Check notification permissions
const hasPermission = await notificationHandler.areNotificationsEnabled();
```

### **Debug Cloud Function**
```bash
# View function logs
firebase functions:log --only scanAndAlert

# Test function locally
firebase functions:shell
> scanAndAlert()

# Monitor function execution
firebase functions:config:get
```

### **Alert Statistics**
The system tracks comprehensive statistics in `system/scanStats`:
- Total scans executed
- Strategies processed
- Alerts generated
- Success/failure rates
- Market hours vs extended hours activity

## Troubleshooting

### **Common Issues**

#### **No Notifications Received**
1. Check notification permissions in device settings
2. Verify device token registration in Firestore
3. Confirm user notification settings are enabled
4. Check if in quiet hours period
5. Verify Cloud Function execution logs

#### **Duplicate Notifications**
1. Check duplicate prevention logic (1-hour window)
2. Verify strategy condition evaluation
3. Review confidence threshold settings
4. Check for multiple active strategies with same conditions

#### **Performance Issues**
1. Monitor Cloud Function execution time and memory usage
2. Optimize market data fetching and caching
3. Review Firestore query performance
4. Check for rate limiting on external APIs

#### **Deep Link Navigation Issues**
1. Verify notification data payload structure
2. Check navigation route definitions
3. Test deep link handling in notification handler
4. Ensure proper authentication state for protected routes

The Trade Alerts system provides enterprise-grade real-time notifications for trading strategies with comprehensive management, filtering, and user preferences. The system is designed for scalability, reliability, and optimal user experience across all platforms.
