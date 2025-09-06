// Simple Firebase initialization for web
import { initializeApp, getApps } from 'firebase/app';

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
if (getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized for web platform');
} else {
  console.log('✅ Firebase already initialized');
}

export {};
