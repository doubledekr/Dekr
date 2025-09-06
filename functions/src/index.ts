import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export all functions
export * from './strategies';
export * from './challenges';
export * from './social';
// export * from './migrations/uploadLessonAudio'; // Migration script - not for cloud deployment
export * from './content/cardGenerator';
// export * from './content/weeklyPodcastGenerator'; // Temporarily disabled due to TypeScript errors
