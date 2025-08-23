import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

declare global {
  namespace ReactNativePaper {
    interface ThemeColors {
      warning: string;
    }
  }
}

const baseTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6CA393',
    secondary: '#F0E7CB',
    accent: '#F9E9E6',
    error: '#9E2D2D',
    warning: '#FF9500',
    background: '#F0E7CB',
    onBackground: '#474747',
    surface: '#F0E7CB',
    surfaceVariant: '#F9E9E6',
    onSurface: '#474747',
    onSurfaceVariant: '#474747',
    elevation: {
      level0: 'transparent',
      level1: '#F0E7CB',
      level2: '#F9E9E6',
      level3: '#F9E9E6',
      level4: '#F9E9E6',
      level5: '#F9E9E6',
    },
  },
};

export const darkTheme = {
  ...baseTheme,
  dark: true,
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6CA393',
    secondary: '#F0E7CB',
    accent: '#F9E9E6',
    error: '#9E2D2D',
    warning: '#FF9500',
    background: '#F0E7CB',
    onBackground: '#474747',
    surface: '#F0E7CB',
    surfaceVariant: '#F9E9E6',
    onSurface: '#474747',
    onSurfaceVariant: '#474747',
    elevation: {
      level0: 'transparent',
      level1: '#F0E7CB',
      level2: '#F9E9E6',
      level3: '#F9E9E6',
      level4: '#F9E9E6',
      level5: '#F9E9E6',
    },
  },
  dark: false,
}; 