import { Platform } from 'react-native';
import { firestore } from './firebase';
import { storageService } from './StorageService';

// Platform-aware Firestore imports
let collection: any;
let doc: any;
let getDoc: any;
let getDocs: any;
let setDoc: any;
let updateDoc: any;
let query: any;
let where: any;
let orderBy: any;
let limit: any;
let serverTimestamp: any;

if (Platform.OS === 'web') {
  const { 
    collection: webCollection, 
    doc: webDoc, 
    getDoc: webGetDoc, 
    getDocs: webGetDocs,
    setDoc: webSetDoc,
    updateDoc: webUpdateDoc,
    query: webQuery,
    where: webWhere,
    orderBy: webOrderBy,
    limit: webLimit,
    serverTimestamp: webServerTimestamp
  } = require('firebase/firestore');
  
  collection = webCollection;
  doc = webDoc;
  getDoc = webGetDoc;
  getDocs = webGetDocs;
  setDoc = webSetDoc;
  updateDoc = webUpdateDoc;
  query = webQuery;
  where = webWhere;
  orderBy = webOrderBy;
  limit = webLimit;
  serverTimestamp = webServerTimestamp;
} else {
  try {
    const firestoreModule = require('@react-native-firebase/firestore').default;
    collection = (db: any, collectionName: string) => db.collection(collectionName);
    doc = (db: any, collectionName: string, docId: string) => db.collection(collectionName).doc(docId);
    getDoc = (docRef: any) => docRef.get();
    getDocs = (queryRef: any) => queryRef.get();
    setDoc = (docRef: any, data: any) => docRef.set(data);
    updateDoc = (docRef: any, data: any) => docRef.update(data);
    query = (queryRef: any, ...constraints: any[]) => queryRef;
    where = (field: string, operator: string, value: any) => ({ field, operator, value });
    orderBy = (field: string, direction: string) => ({ field, direction });
    limit = (count: number) => ({ count });
    serverTimestamp = () => firestoreModule.FieldValue.serverTimestamp();
  } catch (error) {
    console.log('⚠️ Firestore not available, using dummy implementation');
    // Dummy implementations
    collection = () => ({ doc: () => ({ get: () => Promise.resolve({ exists: false, data: () => ({}) }) }) });
    doc = () => ({ get: () => Promise.resolve({ exists: false, data: () => ({}) }) });
    getDoc = () => Promise.resolve({ exists: false, data: () => ({}) });
    getDocs = () => Promise.resolve({ docs: [] });
    setDoc = () => Promise.resolve();
    updateDoc = () => Promise.resolve();
    query = () => ({ get: () => Promise.resolve({ docs: [] }) });
    where = () => ({});
    orderBy = () => ({});
    limit = () => ({});
    serverTimestamp = () => ({ _type: 'serverTimestamp' });
  }
}

export interface Lesson {
  id: string;
  type: 'lesson' | 'course';
  title: string;
  description: string;
  stage: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audioUrl?: string;
  duration: number;
  xpReward: number;
  createdAt: any;
  thumbnailUrl?: string;
  transcriptUrl?: string;
  prerequisites?: string[];
  tags?: string[];
}

export interface CompletedLesson {
  lessonId: string;
  completedAt: any;
  xpEarned: number;
  stage: number;
  timeSpent?: number;
  score?: number;
}

export interface UserProgress {
  currentStage: number;
  totalXp: number;
  lessonsCompleted: number;
  completedLessons: CompletedLesson[];
  weeklyProgress: {
    lessonsCompleted: number;
    xpEarned: number;
  };
}

export class LessonService {
  private static instance: LessonService;

  private constructor() {}

  public static getInstance(): LessonService {
    if (!LessonService.instance) {
      LessonService.instance = new LessonService();
    }
    return LessonService.instance;
  }

  /**
   * Get lessons by stage from educationContent collection
   */
  public async getLessonsByStage(stage: number): Promise<Lesson[]> {
    try {
      let lessonsQuery;
      
      if (Platform.OS === 'web') {
        const lessonsRef = collection(firestore, 'educationContent');
        lessonsQuery = query(
          lessonsRef,
          where('type', '==', 'lesson'),
          where('stage', '==', stage),
          orderBy('createdAt', 'asc')
        );
      } else {
        lessonsQuery = firestore()
          .collection('educationContent')
          .where('type', '==', 'lesson')
          .where('stage', '==', stage)
          .orderBy('createdAt', 'asc');
      }

      const snapshot = await getDocs(lessonsQuery);
      const lessons: Lesson[] = [];

      if (Platform.OS === 'web') {
        snapshot.forEach((doc: any) => {
          lessons.push({
            id: doc.id,
            ...doc.data()
          } as Lesson);
        });
      } else {
        snapshot.forEach((doc: any) => {
          lessons.push({
            id: doc.id,
            ...doc.data()
          } as Lesson);
        });
      }

      // Enhance lessons with audio URLs from StorageService
      for (const lesson of lessons) {
        try {
          lesson.audioUrl = await storageService.getLessonAudioUrl(lesson.stage, lesson.id);
          lesson.thumbnailUrl = await storageService.getLessonThumbnailUrl(lesson.id);
        } catch (error) {
          console.warn(`Could not load audio/thumbnail for lesson ${lesson.id}:`, error);
        }
      }

      return lessons;
    } catch (error) {
      console.error(`❌ Error getting lessons for stage ${stage}:`, error);
      throw error;
    }
  }

  /**
   * Get all lessons with optional filtering
   */
  public async getAllLessons(filters?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    stage?: number;
    limit?: number;
  }): Promise<Lesson[]> {
    try {
      let lessonsQuery;
      
      if (Platform.OS === 'web') {
        const lessonsRef = collection(firestore, 'educationContent');
        let constraints = [where('type', '==', 'lesson')];
        
        if (filters?.difficulty) {
          constraints.push(where('difficulty', '==', filters.difficulty));
        }
        if (filters?.stage) {
          constraints.push(where('stage', '==', filters.stage));
        }
        
        constraints.push(orderBy('stage', 'asc'), orderBy('createdAt', 'asc'));
        
        if (filters?.limit) {
          constraints.push(limit(filters.limit));
        }
        
        lessonsQuery = query(lessonsRef, ...constraints);
      } else {
        let query = firestore()
          .collection('educationContent')
          .where('type', '==', 'lesson');
        
        if (filters?.difficulty) {
          query = query.where('difficulty', '==', filters.difficulty);
        }
        if (filters?.stage) {
          query = query.where('stage', '==', filters.stage);
        }
        
        query = query.orderBy('stage', 'asc').orderBy('createdAt', 'asc');
        
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        
        lessonsQuery = query;
      }

      const snapshot = await getDocs(lessonsQuery);
      const lessons: Lesson[] = [];

      if (Platform.OS === 'web') {
        snapshot.forEach((doc: any) => {
          lessons.push({
            id: doc.id,
            ...doc.data()
          } as Lesson);
        });
      } else {
        snapshot.forEach((doc: any) => {
          lessons.push({
            id: doc.id,
            ...doc.data()
          } as Lesson);
        });
      }

      // Enhance lessons with URLs
      for (const lesson of lessons) {
        try {
          lesson.audioUrl = await storageService.getLessonAudioUrl(lesson.stage, lesson.id);
          lesson.thumbnailUrl = await storageService.getLessonThumbnailUrl(lesson.id);
        } catch (error) {
          console.warn(`Could not load URLs for lesson ${lesson.id}:`, error);
        }
      }

      return lessons;
    } catch (error) {
      console.error('❌ Error getting all lessons:', error);
      throw error;
    }
  }

  /**
   * Get a specific lesson by ID
   */
  public async getLessonById(lessonId: string): Promise<Lesson | null> {
    try {
      let lessonDoc;
      
      if (Platform.OS === 'web') {
        const lessonRef = doc(firestore, 'educationContent', lessonId);
        lessonDoc = await getDoc(lessonRef);
      } else {
        lessonDoc = await firestore().collection('educationContent').doc(lessonId).get();
      }

      if (!lessonDoc.exists) {
        return null;
      }

      const lesson: Lesson = {
        id: lessonId,
        ...lessonDoc.data()
      } as Lesson;

      // Enhance with URLs
      try {
        lesson.audioUrl = await storageService.getLessonAudioUrl(lesson.stage, lesson.id);
        lesson.thumbnailUrl = await storageService.getLessonThumbnailUrl(lesson.id);
      } catch (error) {
        console.warn(`Could not load URLs for lesson ${lesson.id}:`, error);
      }

      return lesson;
    } catch (error) {
      console.error(`❌ Error getting lesson ${lessonId}:`, error);
      throw error;
    }
  }

  /**
   * Mark a lesson as completed for a user
   */
  public async markLessonComplete(userId: string, lessonId: string, timeSpent?: number, score?: number): Promise<void> {
    try {
      // Get lesson details first
      const lesson = await this.getLessonById(lessonId);
      if (!lesson) {
        throw new Error(`Lesson ${lessonId} not found`);
      }

      const completedLesson: CompletedLesson = {
        lessonId,
        completedAt: serverTimestamp(),
        xpEarned: lesson.xpReward,
        stage: lesson.stage,
        timeSpent,
        score
      };

      // Add to user's completed lessons subcollection
      if (Platform.OS === 'web') {
        const completedRef = doc(firestore, 'users', userId, 'completedLessons', lessonId);
        await setDoc(completedRef, completedLesson);
        
        // Update user's stats
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, {
          'stats.lessonsCompleted': firestore.FieldValue.increment(1),
          'stats.weeklyGainPercent': firestore.FieldValue.increment(lesson.xpReward),
          xp: firestore.FieldValue.increment(lesson.xpReward),
          currentStage: Math.max(lesson.stage, await this.getUserCurrentStage(userId))
        });
      } else {
        await firestore()
          .collection('users')
          .doc(userId)
          .collection('completedLessons')
          .doc(lessonId)
          .set(completedLesson);
        
        // Update user's stats
        await firestore()
          .collection('users')
          .doc(userId)
          .update({
            'stats.lessonsCompleted': firestore.FieldValue.increment(1),
            'stats.weeklyGainPercent': firestore.FieldValue.increment(lesson.xpReward),
            xp: firestore.FieldValue.increment(lesson.xpReward),
            currentStage: Math.max(lesson.stage, await this.getUserCurrentStage(userId))
          });
      }

      console.log(`✅ Lesson ${lessonId} marked as completed for user ${userId}`);
    } catch (error) {
      console.error(`❌ Error marking lesson ${lessonId} as complete:`, error);
      throw error;
    }
  }

  /**
   * Get user's progress and completed lessons
   */
  public async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      // Get user document
      let userDoc;
      if (Platform.OS === 'web') {
        const userRef = doc(firestore, 'users', userId);
        userDoc = await getDoc(userRef);
      } else {
        userDoc = await firestore().collection('users').doc(userId).get();
      }

      if (!userDoc.exists) {
        throw new Error(`User ${userId} not found`);
      }

      const userData = userDoc.data();
      
      // Get completed lessons
      let completedLessonsQuery;
      if (Platform.OS === 'web') {
        const completedRef = collection(firestore, 'users', userId, 'completedLessons');
        completedLessonsQuery = query(completedRef, orderBy('completedAt', 'desc'));
      } else {
        completedLessonsQuery = firestore()
          .collection('users')
          .doc(userId)
          .collection('completedLessons')
          .orderBy('completedAt', 'desc');
      }

      const completedSnapshot = await getDocs(completedLessonsQuery);
      const completedLessons: CompletedLesson[] = [];

      if (Platform.OS === 'web') {
        completedSnapshot.forEach((doc: any) => {
          completedLessons.push({
            lessonId: doc.id,
            ...doc.data()
          } as CompletedLesson);
        });
      } else {
        completedSnapshot.forEach((doc: any) => {
          completedLessons.push({
            lessonId: doc.id,
            ...doc.data()
          } as CompletedLesson);
        });
      }

      // Calculate weekly progress (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const weeklyLessons = completedLessons.filter(lesson => {
        const completedDate = lesson.completedAt?.toDate ? lesson.completedAt.toDate() : new Date(lesson.completedAt);
        return completedDate >= oneWeekAgo;
      });

      const weeklyXp = weeklyLessons.reduce((total, lesson) => total + lesson.xpEarned, 0);

      return {
        currentStage: userData.currentStage || 1,
        totalXp: userData.xp || 0,
        lessonsCompleted: userData.stats?.lessonsCompleted || 0,
        completedLessons,
        weeklyProgress: {
          lessonsCompleted: weeklyLessons.length,
          xpEarned: weeklyXp
        }
      };
    } catch (error) {
      console.error(`❌ Error getting user progress for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a lesson is completed by a user
   */
  public async isLessonCompleted(userId: string, lessonId: string): Promise<boolean> {
    try {
      let completedDoc;
      
      if (Platform.OS === 'web') {
        const completedRef = doc(firestore, 'users', userId, 'completedLessons', lessonId);
        completedDoc = await getDoc(completedRef);
      } else {
        completedDoc = await firestore()
          .collection('users')
          .doc(userId)
          .collection('completedLessons')
          .doc(lessonId)
          .get();
      }

      return completedDoc.exists;
    } catch (error) {
      console.error(`❌ Error checking if lesson ${lessonId} is completed:`, error);
      return false;
    }
  }

  /**
   * Get lessons available for a user based on their current stage
   */
  public async getAvailableLessons(userId: string): Promise<Lesson[]> {
    try {
      const progress = await this.getUserProgress(userId);
      const currentStage = progress.currentStage;
      
      // Get lessons for current stage and previous stages
      const availableLessons: Lesson[] = [];
      
      for (let stage = 1; stage <= currentStage; stage++) {
        const stageLessons = await this.getLessonsByStage(stage);
        availableLessons.push(...stageLessons);
      }
      
      return availableLessons;
    } catch (error) {
      console.error(`❌ Error getting available lessons for ${userId}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private async getUserCurrentStage(userId: string): Promise<number> {
    try {
      let userDoc;
      
      if (Platform.OS === 'web') {
        const userRef = doc(firestore, 'users', userId);
        userDoc = await getDoc(userRef);
      } else {
        userDoc = await firestore().collection('users').doc(userId).get();
      }

      return userDoc.exists ? (userDoc.data().currentStage || 1) : 1;
    } catch (error) {
      console.error(`❌ Error getting current stage for ${userId}:`, error);
      return 1;
    }
  }
}

// Export singleton instance
export const lessonService = LessonService.getInstance();
export default lessonService;
