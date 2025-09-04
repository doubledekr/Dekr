// Firebase Web SDK configuration for web platform
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration from requirement_files/firebase.txt
const firebaseConfig = {
  apiKey: "AIzaSyBsOes01Lnp2leFMN_qJbk-_X6nZIlHvBU",
  authDomain: "alpha-orbit.firebaseapp.com",
  projectId: "alpha-orbit",
  storageBucket: "alpha-orbit.appspot.com",
  messagingSenderId: "152969284019",
  appId: "1:152969284019:web:8c2a1d6a7d6a48c52623c6",
  measurementId: "G-4TB90WRQ97"
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
