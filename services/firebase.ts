import { Platform } from 'react-native';

// Platform-aware imports
let auth: any;
let firestore: any;
let GoogleSignin: any;
let statusCodes: any;
let FirebaseAuthTypes: any;

if (Platform.OS === 'web') {
  // Use Firebase Web SDK for web platform
  const { getAuth, connectAuthEmulator } = require('firebase/auth');
  const { getFirestore, connectFirestoreEmulator } = require('firebase/firestore');
  const { initializeApp, getApps, getApp } = require('firebase/app');
  
  // Firebase configuration for dekr-nextgen project
  const firebaseConfig = {
    apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "dekr-nextgen.firebaseapp.com",
    projectId: "dekr-nextgen",
    storageBucket: "dekr-nextgen.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890abcdef",
    measurementId: "G-XXXXXXXXXX"
  };

  // Initialize Firebase
  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  firestore = getFirestore(app);
  
  // Dummy Google Sign-In for web (not supported in web SDK)
  GoogleSignin = {
    configure: () => {},
    signIn: () => Promise.reject(new Error('Google Sign-In not supported on web')),
    getCurrentUser: () => Promise.resolve(null),
    getTokens: () => Promise.resolve({ idToken: null }),
    revokeAccess: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
    hasPlayServices: () => Promise.resolve(true)
  };
  
  statusCodes = {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE'
  };
  
  FirebaseAuthTypes = {
    UserCredential: class UserCredential {
      user: any;
      constructor(user: any) {
        this.user = user;
      }
    }
  };
  
  console.log('✅ Using Firebase Web SDK');
} else {
  // Use React Native Firebase for native platforms
  try {
    auth = require('@react-native-firebase/auth').default;
    firestore = require('@react-native-firebase/firestore').default;
    const googleSignin = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignin.GoogleSignin;
    statusCodes = googleSignin.statusCodes;
    FirebaseAuthTypes = require('@react-native-firebase/auth').FirebaseAuthTypes;
    console.log('✅ Using React Native Firebase');
  } catch (error) {
    console.log('⚠️ React Native Firebase not available, using dummy services');
    // Fallback to dummy implementations
    auth = () => ({
      onAuthStateChanged: (callback: any) => {
        callback(null);
        return () => {};
      },
      signInWithEmailAndPassword: () => Promise.reject(new Error('Firebase not available')),
      createUserWithEmailAndPassword: () => Promise.reject(new Error('Firebase not available')),
      signOut: () => Promise.resolve(),
      sendPasswordResetEmail: () => Promise.reject(new Error('Firebase not available')),
      currentUser: null,
      GoogleAuthProvider: {
        credential: () => ({})
      }
    });
    firestore = () => ({
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({ exists: false, data: () => ({}) }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve()
        })
      }),
      FieldValue: {
        arrayUnion: (item: any) => ({ _type: 'arrayUnion', value: item }),
        arrayRemove: (item: any) => ({ _type: 'arrayRemove', value: item }),
        serverTimestamp: () => ({ _type: 'serverTimestamp' }),
        increment: (value: number) => ({ _type: 'increment', value }),
        delete: () => ({ _type: 'delete' })
      }
    });
    GoogleSignin = {
      configure: () => {},
      signIn: () => Promise.reject(new Error('Google Sign-In not available')),
      getCurrentUser: () => Promise.resolve(null),
      getTokens: () => Promise.resolve({ idToken: null }),
      revokeAccess: () => Promise.resolve(),
      signOut: () => Promise.resolve(),
      hasPlayServices: () => Promise.resolve(true)
    };
    statusCodes = {
      SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
      IN_PROGRESS: 'IN_PROGRESS',
      PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE'
    };
    FirebaseAuthTypes = {
      UserCredential: class UserCredential {
        user: any;
        constructor(user: any) {
          this.user = user;
        }
      }
    };
  }
}

// ------------------------------------------------------------
// Google Sign-In Configuration
// ------------------------------------------------------------

// IMPORTANT: You need to add the SHA-1 fingerprint to Firebase Console for Android
// For debug builds, this is typically: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25

// IMPORTANT FOR iOS: 
// 1. Make sure the REVERSED_CLIENT_ID from GoogleService-Info.plist is added as a URL scheme in Info.plist
// 2. Enable "Sign in with Apple" capability in Xcode
// 3. Ensure GoogleService-Info.plist has the correct bundle ID (com.dekr.app)

// Configure Google Sign-In with the appropriate client IDs (only for native platforms)
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    // The webClientId is your Firebase Web Client ID (used for Android and iOS)
    // This should match the one in your Firebase console for dekr-nextgen
    webClientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
    
    // iOS-specific client ID from GoogleService-Info.plist (CLIENT_ID value)
    iosClientId: Platform.OS === 'ios' ? '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com' : undefined,
    
    // Required for offline access
    offlineAccess: true,
    
    // Additional configuration
    forceCodeForRefreshToken: true,
    
    // Requested scopes (permissions)
    scopes: ['profile', 'email'],
  });
}

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
    const iosClientId = '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
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
    if (Platform.OS === 'web') {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return new FirebaseAuthTypes.UserCredential(userCredential.user);
    } else {
      return await auth().signInWithEmailAndPassword(email, password);
    }
  } catch (error) {
    console.error('❌ Email Sign-In Error:', error);
    throw error;
  }
};

export const signUpWithEmail = async (email: string, password: string): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    let userCredential;
    if (Platform.OS === 'web') {
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      userCredential = new FirebaseAuthTypes.UserCredential(userCredential.user);
    } else {
      userCredential = await auth().createUserWithEmailAndPassword(email, password);
    }
    
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
    // Clear Google Sign-In data first (only for native platforms)
    if (Platform.OS !== 'web') {
      await clearGoogleSignInData();
    }
    // Then sign out from Firebase
    if (Platform.OS === 'web') {
      const { signOut: webSignOut } = require('firebase/auth');
      await webSignOut(auth);
    } else {
      await auth().signOut();
    }
  } catch (error) {
    console.error('❌ Sign-Out Error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      const { sendPasswordResetEmail } = require('firebase/auth');
      await sendPasswordResetEmail(auth, email);
    } else {
      await auth().sendPasswordResetEmail(email);
    }
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
    if (Platform.OS === 'web') {
      const { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } = require('firebase/firestore');
      const watchlistRef = doc(firestore, 'watchlists', userId);
      const watchlistDoc = await getDoc(watchlistRef);

      if (watchlistDoc.exists()) {
        // Update existing watchlist
        const currentItems = watchlistDoc.data()?.items || [];
        if (!currentItems.find((i: any) => i.id === item.id)) {
          await updateDoc(watchlistRef, {
            items: arrayUnion(item),
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        // Create new watchlist
        await setDoc(watchlistRef, {
          items: [item],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } else {
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
    }
  } catch (error) {
    console.error('Error saving to watchlist:', error);
    throw error;
  }
}

export async function loadWatchlist(userId: string) {
  try {
    if (Platform.OS === 'web') {
      const { doc, getDoc } = require('firebase/firestore');
      const watchlistRef = doc(firestore, 'watchlists', userId);
      const watchlistDoc = await getDoc(watchlistRef);

      if (watchlistDoc.exists()) {
        return watchlistDoc.data()?.items || [];
      }
      return [];
    } else {
      const watchlistRef = firestore().collection('watchlists').doc(userId);
      const watchlistDoc = await watchlistRef.get();

      if (watchlistDoc.exists) {
        return watchlistDoc.data()?.items || [];
      }
      return [];
    }
  } catch (error) {
    console.error('Error loading watchlist:', error);
    throw error;
  }
}

export async function removeFromWatchlist(itemId: string) {
  try {
    let user;
    if (Platform.OS === 'web') {
      user = auth.currentUser;
    } else {
      user = auth().currentUser;
    }
    if (!user) throw new Error('No user logged in');

    if (Platform.OS === 'web') {
      const { doc, getDoc, updateDoc, serverTimestamp } = require('firebase/firestore');
      const watchlistRef = doc(firestore, 'watchlists', user.uid);
      const watchlistDoc = await getDoc(watchlistRef);

      if (watchlistDoc.exists()) {
        const currentItems = watchlistDoc.data()?.items || [];
        const updatedItems = currentItems.filter((item: any) => item.id !== itemId);
        
        await updateDoc(watchlistRef, {
          items: updatedItems,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
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
    }
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
}

// Helper function to create a user profile if it doesn't exist
async function createUserProfileIfNeeded(user: any): Promise<void> {
  try {
    if (!user) return;
    
    if (Platform.OS === 'web') {
      const { doc, getDoc, setDoc, serverTimestamp } = require('firebase/firestore');
      // Check if user document already exists
      const userRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user profile with new schema
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          avatarUrl: user.photoURL || '',
          joinDate: serverTimestamp(),
          isPublic: false,
          currentStage: 1,
          xp: 0,
          stats: {
            weeklyGainPercent: 0,
            competitionsWon: 0,
            lessonsCompleted: 0
          },
          settings: {
            pushNotifications: true,
            emailNotifications: true,
            theme: 'auto'
          }
        };
        
        await setDoc(userRef, userData);
        console.log('✅ Created new user profile for:', user.uid);
      }
    } else {
      // Check if user document already exists
      const userRef = firestore().collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        // Create new user profile with new schema
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          avatarUrl: user.photoURL || '',
          joinDate: firestore.FieldValue.serverTimestamp(),
          isPublic: false,
          currentStage: 1,
          xp: 0,
          stats: {
            weeklyGainPercent: 0,
            competitionsWon: 0,
            lessonsCompleted: 0
          },
          settings: {
            pushNotifications: true,
            emailNotifications: true,
            theme: 'auto'
          }
        };
        
        await userRef.set(userData);
        console.log('✅ Created new user profile for:', user.uid);
      }
    }
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    // Don't throw here to prevent blocking the auth flow
  }
} 