// Platform-aware Firebase service
import { Platform } from 'react-native';

// Check if we're running in Expo Go (which doesn't support native Firebase modules)
const isExpoGo = typeof global.__expo !== 'undefined' && global.__expo?.modules?.ExpoGo;

// Dummy implementations for Expo Go
const dummyAuth = {
  onAuthStateChanged: (callback: any) => {
    // Return a dummy user or null for testing
    callback(null);
    return () => {}; // unsubscribe function
  }
};

const dummyFieldValue = {
  arrayUnion: (item: any) => ({ _type: 'arrayUnion', value: item }),
  arrayRemove: (item: any) => ({ _type: 'arrayRemove', value: item }),
  serverTimestamp: () => ({ _type: 'serverTimestamp' }),
  increment: (value: number) => ({ _type: 'increment', value }),
  delete: () => ({ _type: 'delete' })
};

const dummyFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve()
    })
  }),
  FieldValue: dummyFieldValue
};

// Export appropriate Firebase services based on platform
export let auth: any;
export let firestore: any;

if (Platform.OS === 'web' || isExpoGo) {
  // Use dummy implementations for web/Expo Go
  auth = () => dummyAuth;
  firestore = () => dummyFirestore;
  console.log('🔄 Using dummy Firebase services (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeAuth = require('@react-native-firebase/auth').default;
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    auth = nativeAuth;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services');
  } catch (error) {
    console.log('⚠️ Native Firebase not available, using dummy services');
    auth = () => dummyAuth;
    firestore = () => dummyFirestore;
  }
}

// Dummy Firebase functions for Expo Go
export const saveToWatchlist = async (userId: string, item: any) => {
  console.log('📝 Dummy saveToWatchlist called:', { userId, item: item?.symbol || 'unknown' });
  return Promise.resolve();
};

export const loadWatchlist = async (userId: string) => {
  console.log('📖 Dummy loadWatchlist called:', userId);
  return Promise.resolve([]);
};

export const removeFromWatchlist = async (itemId: string) => {
  console.log('🗑️ Dummy removeFromWatchlist called:', itemId);
  return Promise.resolve();
};

export default { auth, firestore, saveToWatchlist, loadWatchlist, removeFromWatchlist };
