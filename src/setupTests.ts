import '@testing-library/jest-native/extend-expect';

// Mock react-native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-router', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => ({
  useTheme: () => ({
    colors: {
      primary: '#6200EE',
      surface: '#FFFFFF',
      background: '#FFFFFF',
      onSurface: '#000000',
      onSurfaceVariant: '#666666',
    },
  }),
}));

// Mock theme colors hook
jest.mock('../../hooks/useThemeColor', () => ({
  useThemeColor: () => '#6200EE',
}));

// Global test setup
global.__DEV__ = true;
