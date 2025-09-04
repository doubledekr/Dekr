import { Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#F0E7CB',
          borderTopColor: theme.colors.onSurfaceVariant,
        },
        tabBarActiveTintColor: `#6CA393`,
        tabBarInactiveTintColor: `#6CA393`,
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "cards" : "cards-outline"} size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="decks"
        options={{
          title: 'Decks',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'folder' : 'folder-outline'} size={size} color={color} />
          ),
          tabBarBadge: undefined, // TODO: Add collaboration invites count
        }}
      />
      <Tabs.Screen
        name="strategies"
        options={{
          title: 'Strategies',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'strategy' : 'strategy'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'bell' : 'bell-outline'} size={size} color={color} />
          ),
          tabBarBadge: undefined, // TODO: Add unread alerts count
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'trophy' : 'trophy-outline'} size={size} color={color} />
          ),
          tabBarBadge: undefined, // TODO: Add active challenges count
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'magnify' : "magnify"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "account-group" : 'account-group-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="education"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "school" : 'school-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="course-generator"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'account-circle' : 'account-circle-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
