import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export * from './strategies';
export * from './challenges';
export * from './social';
export * from './migrations/uploadLessonAudio';
export * from './content/cardGenerator';
