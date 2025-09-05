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
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "school" : "school-outline"} size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "gamepad-variant" : "gamepad-variant-outline"} size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="build"
        options={{
          title: 'Build',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "hammer-wrench" : "wrench-outline"} size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="newsletter"
        options={{
          title: 'Newsletter',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? "newspaper" : "newspaper-variant-outline"} size={size} color={color} />
          ),
        }}
      />
      
      {/* Hidden screens - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="strategies"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="education"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
