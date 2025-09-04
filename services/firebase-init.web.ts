// Simple Firebase initialization for web
import { initializeApp, getApps } from 'firebase/app';

// Firebase configuration
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
if (getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized for web platform');
} else {
  console.log('✅ Firebase already initialized');
}

export {};
