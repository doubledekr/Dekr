import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import type { User } from '@react-native-google-signin/google-signin';

// ------------------------------------------------------------
// Google Sign-In Configuration
// ------------------------------------------------------------

// IMPORTANT: You need to add the SHA-1 fingerprint to Firebase Console for Android
// For debug builds, this is typically: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25

// IMPORTANT FOR iOS: 
// 1. Make sure the REVERSED_CLIENT_ID from GoogleService-Info.plist is added as a URL scheme in Info.plist
// 2. Enable "Sign in with Apple" capability in Xcode
// 3. Ensure GoogleService-Info.plist has the correct bundle ID (io.dekr.app)

// Configure Google Sign-In with the appropriate client IDs
GoogleSignin.configure({
  // The webClientId is your Firebase Web Client ID (used for Android and iOS)
  // This should match the one in your Firebase console
  webClientId: '152969284019-p42jnunll1hg2dqdcpqnacvvkjf9b9vs.apps.googleusercontent.com',
  
  // iOS-specific client ID from GoogleService-Info.plist (CLIENT_ID value)
  iosClientId: Platform.OS === 'ios' ? '152969284019-s54gbe5rn0qjoqqjp0h84e3bmt8jat44.apps.googleusercontent.com' : undefined,
  
  // Required for offline access
  offlineAccess: true,
  
  // Additional configuration
  forceCodeForRefreshToken: true,
  
  // Requested scopes (permissions)
  scopes: ['profile', 'email'],
});

// ------------------------------------------------------------
// Google Sign-In Helper Functions
// ------------------------------------------------------------

/**
 * Check iOS configuration for Google Sign-In
 * This helps diagnose common setup issues
 */
export const checkIOSGoogleSignInConfig = async (): Promise<void> => {
  if (Platform.OS !== 'ios') return;
  
  try {
    console.log('📱 iOS Google Sign-In Configuration Check:');
    
    // 1. Check if iosClientId is configured
    const iosClientId = '152969284019-s54gbe5rn0qjoqqjp0h84e3bmt8jat44.apps.googleusercontent.com';
    console.log(`✅ iOS Client ID: ${iosClientId}`);
    
    // 2. Check hasPlayServices (should work on iOS too)
    try {
      await GoogleSignin.hasPlayServices();
      console.log('✅ Google Sign-In services check passed');
    } catch (error: any) {
      console.error('❌ Google Sign-In services check failed:', error);
    }
    
    // 3. Attempt to get current Google user
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log('ℹ️ Current user:', currentUser ? 'Signed in' : 'Not signed in');
      if (currentUser && currentUser.user) {
        console.log('✅ Current user name:', currentUser.user.name || 'Name not available');
      }
    } catch (error) {
      console.error('❌ Error getting current user:', error);
    }
    
    console.log('✅ iOS configuration check complete');
  } catch (error: any) {
    console.error('❌ iOS configuration check error:', error);
  }
};

/**
 * Verifies that Google Play Services are available and up-to-date
 * Critical for Android devices
 */
export const checkGooglePlayServices = async (): Promise<boolean> => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('✅ Google Play Services are available');
    return true;
  } catch (error: any) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.error('❌ Google Play Services are not available');
    } else {
      console.error('❌ Error checking Google Play Services:', error);
    }
    return false;
  }
};

/**
 * Sign in with Google account
 * This is the primary method you should use for Google authentication
 */
export const signInWithGoogle = async (): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    console.log('🔄 Starting Google Sign-In process...');
    
    // 1. First check if Google Play Services are available (Android only)
    if (Platform.OS === 'android') {
      const playServicesAvailable = await checkGooglePlayServices();
      if (!playServicesAvailable) {
        throw new Error('Google Play Services are required for Google Sign-In');
      }
    }
    
    // 2. Sign in with Google to get user info
    // On iOS, this will open a webview to authenticate if needed
    const signInResult = await GoogleSignin.signIn();
    console.log('✅ Google Sign-In successful');
    
    if (Platform.OS === 'ios') {
      // Access user info based on the available properties
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log('iOS sign-in: User info:', currentUser?.user?.name || 'User info not available');
    }
    
    // 3. Get ID token for Firebase
    const { idToken } = await GoogleSignin.getTokens();
    if (!idToken) {
      console.error('❌ No ID token returned from Google');
      throw new Error('No ID token returned from Google Sign-In');
    }
    
    // 4. Create a Firebase credential from the Google ID token
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    
    // 5. Sign in to Firebase with the Google credential
    const userCredential = await auth().signInWithCredential(googleCredential);
    
    // 6. Create or update user profile in Firestore
    await createUserProfileIfNeeded(userCredential.user);
    
    console.log('✅ Firebase Authentication successful');
    return userCredential;
  } catch (error: any) {
    console.error('❌ Google Sign-In Error:', error);
    
    // Enhanced error handling with platform-specific messages
    let errorMessage = 'Google Sign-In failed';
    
    if (Platform.OS === 'ios') {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        errorMessage = 'User cancelled the sign-in flow';
      } else if (error.code === statusCodes.IN_PROGRESS) {
        errorMessage = 'Sign in is in progress already';
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        errorMessage = 'Play services not available or outdated';
      } else {
        errorMessage = `iOS Sign-In Error: ${error.message || 'Unknown error'}`;
        
        // Check for specific iOS configuration issues
        if (error.message && error.message.includes('config')) {
          console.error('⚠️ Possible iOS configuration issue. Verify GoogleService-Info.plist and URL Schemes');
        }
      }
    }
    
    console.error(`❌ Detailed error: ${errorMessage}`);
    throw error;
  }
};

/**
 * Alternative method for Google Sign-In using Firebase's provider
 * This is a fallback in case the primary method fails
 */
export const signInWithGoogleFallback = async (): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    console.log('🔄 Attempting fallback Google Sign-In...');
    
    // Use Firebase's built-in Google provider
    const googleProvider = auth.GoogleAuthProvider;
    
    // Sign in with Google provider
    const userCredential = await auth().signInWithProvider(googleProvider);
    
    // Create or update user profile
    await createUserProfileIfNeeded(userCredential.user);
    
    console.log('✅ Google Sign-In fallback successful');
    return userCredential;
  } catch (error: any) {
    console.error('❌ Google Sign-In Fallback Error:', error);
    throw error;
  }
};

/**
 * Clear Google Sign-In state
 * Useful for resolving authentication issues
 */
export const clearGoogleSignInData = async (): Promise<void> => {
  try {
    // Revoke access and sign out from Google
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    console.log('✅ Successfully cleared Google Sign-In data');
  } catch (error) {
    console.error('❌ Error clearing Google Sign-In data:', error);
  }
};

// ------------------------------------------------------------
// Email Authentication Functions 
// ------------------------------------------------------------

export const signInWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    return await auth().signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error('❌ Email Sign-In Error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    
    // Create user profile for new email users
    await createUserProfileIfNeeded(userCredential.user);
    
    return userCredential;
  } catch (error) {
    console.error('❌ Email Sign-Up Error:', error);
    throw error;
  }
};

// ------------------------------------------------------------
// General Authentication Functions
// ------------------------------------------------------------

export const signOut = async (): Promise<void> => {
  try {
    // Clear Google Sign-In data first
    await clearGoogleSignInData();
    // Then sign out from Firebase
    await auth().signOut();
  } catch (error) {
    console.error('❌ Sign-Out Error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await auth().sendPasswordResetEmail(email);
  } catch (error) {
    console.error('❌ Password Reset Error:', error);
    throw error;
  }
};

// ------------------------------------------------------------
// Firestore Helper Functions
// ------------------------------------------------------------

export async function saveToWatchlist(userId: string, item: any) {
  try {
    const watchlistRef = firestore().collection('watchlists').doc(userId);
    const watchlistDoc = await watchlistRef.get();

    if (watchlistDoc.exists) {
      // Update existing watchlist
      const currentItems = watchlistDoc.data()?.items || [];
      if (!currentItems.find((i: any) => i.id === item.id)) {
        await watchlistRef.update({
          items: firestore.FieldValue.arrayUnion(item),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      // Create new watchlist
      await watchlistRef.set({
        items: [item],
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving to watchlist:', error);
    throw error;
  }
}

export async function loadWatchlist(userId: string) {
  try {
    const watchlistRef = firestore().collection('watchlists').doc(userId);
    const watchlistDoc = await watchlistRef.get();

    if (watchlistDoc.exists) {
      return watchlistDoc.data()?.items || [];
    }
    return [];
  } catch (error) {
    console.error('Error loading watchlist:', error);
    throw error;
  }
}

export async function removeFromWatchlist(itemId: string) {
  try {
    const user = auth().currentUser;
    if (!user) throw new Error('No user logged in');

    const watchlistRef = firestore().collection('watchlists').doc(user.uid);
    const watchlistDoc = await watchlistRef.get();

    if (watchlistDoc.exists) {
      const currentItems = watchlistDoc.data()?.items || [];
      const updatedItems = currentItems.filter((item: any) => item.id !== itemId);
      
      await watchlistRef.update({
        items: updatedItems,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

// Helper function to create a user profile if it doesn't exist
async function createUserProfileIfNeeded(user: FirebaseAuthTypes.User): Promise<void> {
  try {
    if (!user) return;
    
    // Check if user document already exists
    const userRef = firestore().collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create new user profile
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: firestore.FieldValue.serverTimestamp(),
        watchlist: [],
        settings: {
          pushNotifications: true,
          emailNotifications: true,
          theme: 'auto'
        }
      };
      
      await userRef.set(userData);
      console.log('✅ Created new user profile for:', user.uid);
    }
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    // Don't throw here to prevent blocking the auth flow
  }
} 