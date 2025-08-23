import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

interface OnboardingImageProps {
  type: 'welcome' | 'swipe' | 'learn';
  size?: number;
}

export function OnboardingImage({ type, size = 200 }: OnboardingImageProps) {
  const theme = useTheme();

  const getIconName = () => {
    switch (type) {
      case 'welcome':
        return 'chart-line';
      case 'swipe':
        return 'gesture-swipe';
      case 'learn':
        return 'school';
      default:
        return 'chart-line';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: theme.colors.primary + '20',
          borderRadius: size / 2,
        },
      ]}>
      <MaterialCommunityIcons
        name={getIconName()}
        size={size * 0.5}
        color={theme.colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 