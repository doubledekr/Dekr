import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert as RNAlert,
  RefreshControl,
  ActivityIndicator,
  Switch,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlerts } from '../../hooks/useStrategies';
import { usePushNotifications } from '../../services/pushNotifications';
import { Alert } from '../../types/strategy';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type FilterType = 'all' | 'unread' | 'buy' | 'sell' | 'high' | 'medium' | 'low';

interface AlertItemProps {
  alert: Alert;
  onPress: (alert: Alert) => void;
  onMarkAsRead: (alertId: string) => void;
  onDelete: (alertId: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({
  alert,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'buy': return '#4CAF50';
      case 'sell': return '#F44336';
      default: return mutedColor;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#9E9E9E';
      default: return mutedColor;
    }
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'buy': return 'arrow-up-bold';
      case 'sell': return 'arrow-down-bold';
      default: return 'bell';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 24) {
      return date.toLocaleDateString();
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  return (
    <TouchableOpacity
      style={[
        styles.alertItem,
        { backgroundColor },
        !alert.readAt && styles.unreadAlert,
      ]}
      onPress={() => onPress(alert)}
      activeOpacity={0.7}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          <MaterialCommunityIcons
            name={getSignalIcon(alert.data?.signalType || alert.alertType)}
            size={24}
            color={getSignalColor(alert.data?.signalType || alert.alertType)}
          />
        </View>
        
        <View style={styles.alertInfo}>
          <View style={styles.alertTitleRow}>
            <Text style={[styles.alertTitle, { color: textColor }]} numberOfLines={1}>
              {alert.title}
            </Text>
            <View style={styles.alertMeta}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(alert.priority) }
                ]}
              >
                <Text style={styles.priorityText}>
                  {alert.priority.toUpperCase()}
                </Text>
              </View>
              {!alert.readAt && <View style={styles.unreadDot} />}
            </View>
          </View>
          
          <Text style={[styles.alertMessage, { color: mutedColor }]} numberOfLines={2}>
            {alert.message}
          </Text>
          
          <View style={styles.alertDetails}>
            <Text style={[styles.alertSymbol, { color: textColor }]}>
              {alert.symbol}
            </Text>
            {alert.data?.price && (
              <Text style={[styles.alertPrice, { color: textColor }]}>
                {formatPrice(alert.data.price)}
              </Text>
            )}
            {alert.data?.marketData?.change && (
              <Text
                style={[
                  styles.alertChange,
                  { color: alert.data.marketData.change >= 0 ? '#4CAF50' : '#F44336' }
                ]}
              >
                {formatChange(alert.data.marketData.change)}
              </Text>
            )}
            {alert.data?.confidence && (
              <Text style={[styles.alertConfidence, { color: mutedColor }]}>
                {Math.round(alert.data.confidence * 100)}% confidence
              </Text>
            )}
          </View>
          
          <Text style={[styles.alertTimestamp, { color: mutedColor }]}>
            {formatTimestamp(alert.createdAt)}
          </Text>
        </View>
        
        <View style={styles.alertActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onMarkAsRead(alert.id)}
          >
            <MaterialCommunityIcons
              name={alert.readAt ? 'email-open' : 'email'}
              size={20}
              color={mutedColor}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(alert.id)}
          >
            <MaterialCommunityIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const AlertsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  // Hooks
  const { alerts, loading, markAsRead, deleteAlert, refetch } = useAlerts();
  const {
    settings: pushSettings,
    updateSettings: updatePushSettings,
    sendTestNotification,
  } = usePushNotifications();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing alerts:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleAlertPress = useCallback((alert: Alert) => {
    // Mark as read when tapped
    if (!alert.readAt) {
      markAsRead(alert.id);
    }

    // Navigate based on alert type
    if (alert.data?.symbol) {
      navigation.navigate('CardDetail', {
        symbol: alert.data.symbol,
        cardId: alert.data.symbol,
      });
    } else if (alert.strategyId) {
      navigation.navigate('StrategyEditor', {
        mode: 'edit',
        strategyId: alert.strategyId,
      });
    }
  }, [navigation, markAsRead]);

  const handleMarkAsRead = useCallback(async (alertId: string) => {
    try {
      await markAsRead(alertId);
    } catch (error) {
      RNAlert.alert('Error', 'Failed to mark alert as read');
    }
  }, [markAsRead]);

  const handleDeleteAlert = useCallback(async (alertId: string) => {
    RNAlert.alert(
      'Delete Alert',
      'Are you sure you want to delete this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAlert(alertId);
            } catch (error) {
              RNAlert.alert('Error', 'Failed to delete alert');
            }
          },
        },
      ]
    );
  }, [deleteAlert]);

  const handleMarkAllAsRead = useCallback(async () => {
    const unreadAlerts = alerts.filter(alert => !alert.readAt);
    
    if (unreadAlerts.length === 0) {
      RNAlert.alert('Info', 'No unread alerts to mark');
      return;
    }

    try {
      await Promise.all(unreadAlerts.map(alert => markAsRead(alert.id)));
      RNAlert.alert('Success', `Marked ${unreadAlerts.length} alerts as read`);
    } catch (error) {
      RNAlert.alert('Error', 'Failed to mark alerts as read');
    }
  }, [alerts, markAsRead]);

  const handleClearAll = useCallback(async () => {
    if (alerts.length === 0) {
      RNAlert.alert('Info', 'No alerts to clear');
      return;
    }

    RNAlert.alert(
      'Clear All Alerts',
      `Are you sure you want to delete all ${alerts.length} alerts? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(alerts.map(alert => deleteAlert(alert.id)));
              RNAlert.alert('Success', 'All alerts cleared');
            } catch (error) {
              RNAlert.alert('Error', 'Failed to clear alerts');
            }
          },
        },
      ]
    );
  }, [alerts, deleteAlert]);

  const handleToggleNotifications = useCallback(async (enabled: boolean) => {
    try {
      await updatePushSettings({ enabled });
      RNAlert.alert(
        'Success',
        `Push notifications ${enabled ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      RNAlert.alert('Error', 'Failed to update notification settings');
    }
  }, [updatePushSettings]);

  const handleTestNotification = useCallback(async () => {
    try {
      await sendTestNotification();
      RNAlert.alert('Success', 'Test notification sent!');
    } catch (error) {
      RNAlert.alert('Error', 'Failed to send test notification');
    }
  }, [sendTestNotification]);

  // Filter alerts based on active filter and search query
  const filteredAlerts = alerts.filter(alert => {
    // Apply filter
    switch (activeFilter) {
      case 'unread':
        if (alert.readAt) return false;
        break;
      case 'buy':
        if (alert.data?.signalType !== 'buy') return false;
        break;
      case 'sell':
        if (alert.data?.signalType !== 'sell') return false;
        break;
      case 'high':
        if (alert.priority !== 'high') return false;
        break;
      case 'medium':
        if (alert.priority !== 'medium') return false;
        break;
      case 'low':
        if (alert.priority !== 'low') return false;
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        alert.title.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.symbol?.toLowerCase().includes(query) ||
        alert.data?.strategyName?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const unreadCount = alerts.filter(alert => !alert.readAt).length;

  const renderFilterButton = (filter: FilterType, label: string, icon: string, count?: number) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        {
          backgroundColor: activeFilter === filter ? tintColor + '20' : 'transparent',
          borderColor: activeFilter === filter ? tintColor : mutedColor,
        }
      ]}
      onPress={() => setActiveFilter(filter)}
    >
      <MaterialCommunityIcons
        name={icon}
        size={16}
        color={activeFilter === filter ? tintColor : mutedColor}
      />
      <Text
        style={[
          styles.filterButtonText,
          { color: activeFilter === filter ? tintColor : mutedColor }
        ]}
      >
        {label}
      </Text>
      {count !== undefined && count > 0 && (
        <View style={[styles.filterBadge, { backgroundColor: tintColor }]}>
          <Text style={styles.filterBadgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="bell-off" size={64} color={mutedColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        {activeFilter === 'all' ? 'No Alerts' : `No ${activeFilter} alerts`}
      </Text>
      <Text style={[styles.emptyMessage, { color: mutedColor }]}>
        {activeFilter === 'all'
          ? 'Trading alerts from your active strategies will appear here'
          : `No alerts match the ${activeFilter} filter`
        }
      </Text>
    </View>
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Alerts',
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={{ marginRight: 16 }}
          >
            <MaterialCommunityIcons name="email-open" size={24} color={tintColor} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClearAll}
            style={{ marginRight: 16 }}
          >
            <MaterialCommunityIcons name="delete-sweep" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, tintColor, handleMarkAllAsRead, handleClearAll]);

  return (
    <ThemedView style={styles.container}>
      {/* Header with notification settings */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { color: textColor }]}>Trade Alerts</Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </Text>
        </View>
        
        <View style={styles.notificationControls}>
          <View style={styles.notificationToggle}>
            <MaterialCommunityIcons name="bell" size={20} color={mutedColor} />
            <Switch
              value={pushSettings?.enabled || false}
              onValueChange={handleToggleNotifications}
              thumbColor={pushSettings?.enabled ? tintColor : mutedColor}
              trackColor={{ false: mutedColor + '40', true: tintColor + '40' }}
            />
          </View>
          
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: tintColor + '20' }]}
            onPress={handleTestNotification}
          >
            <MaterialCommunityIcons name="bell-ring" size={16} color={tintColor} />
            <Text style={[styles.testButtonText, { color: tintColor }]}>Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor, borderColor: mutedColor }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={mutedColor} />
          <TextInput
            style={[styles.textInput, { color: textColor }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search alerts..."
            placeholderTextColor={mutedColor}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={20} color={mutedColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filtersScrollView}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
          {renderFilterButton('all', 'All', 'bell', alerts.length)}
          {renderFilterButton('unread', 'Unread', 'bell-badge', unreadCount)}
          {renderFilterButton('buy', 'Buy', 'arrow-up-bold')}
          {renderFilterButton('sell', 'Sell', 'arrow-down-bold')}
          {renderFilterButton('high', 'High', 'alert')}
          {renderFilterButton('medium', 'Medium', 'alert-outline')}
          {renderFilterButton('low', 'Low', 'information')}
          </ScrollView>
        </View>
      </View>

      {/* Alerts List */}
      {loading && alerts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            Loading alerts...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredAlerts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AlertItem
              alert={item}
              onPress={handleAlertPress}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteAlert}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  notificationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 20,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersScrollView: {
    // Wrapper for scroll view
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadAlert: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  alertTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  alertDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  alertSymbol: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertPrice: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertConfidence: {
    fontSize: 12,
  },
  alertTimestamp: {
    fontSize: 12,
    marginTop: 4,
  },
  alertActions: {
    flexDirection: 'column',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
