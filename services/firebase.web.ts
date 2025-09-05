// Firebase Web SDK configuration for web platform
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

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

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized for web');
} else {
  app = getApp();
  console.log('✅ Firebase already initialized');
}

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);

// Export the app instance
export { app };

// For development, you can connect to emulators
// Uncomment these lines if you're using Firebase emulators
// if (process.env.NODE_ENV === 'development') {
//   connectAuthEmulator(auth, 'http://localhost:9099');
//   connectFirestoreEmulator(firestore, 'localhost', 8080);
// }

export default app;
