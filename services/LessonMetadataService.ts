import { Platform } from 'react-native';

// Platform-aware Firebase imports
let firestore: any;
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
  // Use Firebase Web SDK for web platform
  const { getFirestore, collection: webCollection, doc: webDoc, getDoc: webGetDoc, getDocs: webGetDocs, setDoc: webSetDoc, updateDoc: webUpdateDoc, query: webQuery, where: webWhere, orderBy: webOrderBy, limit: webLimit, serverTimestamp: webServerTimestamp } = require('firebase/firestore');
  const { getApp } = require('firebase/app');
  
  try {
    const app = getApp();
    firestore = getFirestore(app);
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
  } catch (error) {
    console.warn('⚠️ Firebase Firestore not available on web, using fallback');
    firestore = null;
  }
} else {
  // Use React Native Firebase for native platforms
  try {
    const firestoreModule = require('@react-native-firebase/firestore').default;
    firestore = firestoreModule();
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
    console.warn('⚠️ React Native Firebase Firestore not available, using fallback');
    firestore = null;
  }
}

export interface LessonMetadata {
  id: string;
  type: 'lesson' | 'course';
  title: string;
  description: string;
  stage: number;
  lessonNumber: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  audioUrl?: string;
  storagePath?: string;
  duration: number;
  xpReward: number;
  thumbnailUrl?: string;
  transcriptUrl?: string;
  prerequisites?: string[];
  tags?: string[];
  createdAt: any;
  updatedAt: any;
  isLocked?: boolean;
  completionRate?: number;
  averageRating?: number;
  totalPlays?: number;
}

export interface StageMetadata {
  id: number;
  title: string;
  description: string;
  requiredXP: number;
  lessons: LessonMetadata[];
  isUnlocked: boolean;
  completionRate: number;
}

class LessonMetadataService {
  private static instance: LessonMetadataService;
  private cache: Map<string, LessonMetadata> = new Map();
  private stagesCache: Map<number, StageMetadata> = new Map();

  private constructor() {}

  public static getInstance(): LessonMetadataService {
    if (!LessonMetadataService.instance) {
      LessonMetadataService.instance = new LessonMetadataService();
    }
    return LessonMetadataService.instance;
  }

  /**
   * Get lesson metadata by ID
   */
  public async getLessonMetadata(lessonId: string): Promise<LessonMetadata | null> {
    // Check cache first
    if (this.cache.has(lessonId)) {
      return this.cache.get(lessonId)!;
    }

    if (!firestore) {
      console.warn('⚠️ Firestore not available, returning null');
      return null;
    }

    try {
      const lessonDoc = doc(firestore, 'educationContent', lessonId);
      const lessonSnap = await getDoc(lessonDoc);
      
      if (lessonSnap.exists()) {
        const lessonData = lessonSnap.data() as LessonMetadata;
        this.cache.set(lessonId, lessonData);
        return lessonData;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error getting lesson metadata for ${lessonId}:`, error);
      return null;
    }
  }

  /**
   * Get all lessons for a specific stage
   */
  public async getStageLessons(stage: number): Promise<LessonMetadata[]> {
    // Check cache first
    if (this.stagesCache.has(stage)) {
      return this.stagesCache.get(stage)!.lessons;
    }

    if (!firestore) {
      console.warn('⚠️ Firestore not available, returning empty array');
      return [];
    }

    try {
      const lessonsQuery = query(
        collection(firestore, 'educationContent'),
        where('stage', '==', stage),
        where('type', '==', 'lesson'),
        orderBy('lessonNumber', 'asc')
      );
      
      const querySnapshot = await getDocs(lessonsQuery);
      const lessons: LessonMetadata[] = [];
      
      querySnapshot.forEach((doc: any) => {
        const lessonData = doc.data() as LessonMetadata;
        lessons.push(lessonData);
        this.cache.set(lessonData.id, lessonData);
      });
      
      // Update stage cache
      this.stagesCache.set(stage, {
        id: stage,
        title: this.getStageTitle(stage),
        description: this.getStageDescription(stage),
        requiredXP: this.getRequiredXP(stage),
        lessons,
        isUnlocked: true, // This would be determined by user progress
        completionRate: 0 // This would be calculated from user progress
      });
      
      return lessons;
    } catch (error) {
      console.error(`❌ Error getting stage lessons for stage ${stage}:`, error);
      return [];
    }
  }

  /**
   * Get all stages with their lessons
   */
  public async getAllStages(): Promise<StageMetadata[]> {
    if (!firestore) {
      console.warn('⚠️ Firestore not available, returning empty array');
      return [];
    }

    try {
      const stagesQuery = query(
        collection(firestore, 'educationContent'),
        where('type', '==', 'lesson'),
        orderBy('stage', 'asc'),
        orderBy('lessonNumber', 'asc')
      );
      
      const querySnapshot = await getDocs(stagesQuery);
      const stagesMap = new Map<number, LessonMetadata[]>();
      
      querySnapshot.forEach((doc: any) => {
        const lessonData = doc.data() as LessonMetadata;
        if (!stagesMap.has(lessonData.stage)) {
          stagesMap.set(lessonData.stage, []);
        }
        stagesMap.get(lessonData.stage)!.push(lessonData);
        this.cache.set(lessonData.id, lessonData);
      });
      
      const stages: StageMetadata[] = [];
      for (const [stageNumber, lessons] of stagesMap) {
        stages.push({
          id: stageNumber,
          title: this.getStageTitle(stageNumber),
          description: this.getStageDescription(stageNumber),
          requiredXP: this.getRequiredXP(stageNumber),
          lessons,
          isUnlocked: true, // This would be determined by user progress
          completionRate: 0 // This would be calculated from user progress
        });
        
        this.stagesCache.set(stageNumber, stages[stages.length - 1]);
      }
      
      return stages;
    } catch (error) {
      console.error('❌ Error getting all stages:', error);
      return [];
    }
  }

  /**
   * Create or update lesson metadata
   */
  public async saveLessonMetadata(lesson: LessonMetadata): Promise<boolean> {
    if (!firestore) {
      console.warn('⚠️ Firestore not available, cannot save lesson metadata');
      return false;
    }

    try {
      const lessonDoc = doc(firestore, 'educationContent', lesson.id);
      const lessonData = {
        ...lesson,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(lessonDoc, lessonData);
      
      // Update cache
      this.cache.set(lesson.id, lessonData);
      
      console.log(`✅ Saved lesson metadata for ${lesson.id}`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving lesson metadata for ${lesson.id}:`, error);
      return false;
    }
  }

  /**
   * Batch save multiple lesson metadata
   */
  public async batchSaveLessonMetadata(lessons: LessonMetadata[]): Promise<boolean> {
    if (!firestore) {
      console.warn('⚠️ Firestore not available, cannot save lesson metadata');
      return false;
    }

    try {
      const batch = firestore.batch();
      
      for (const lesson of lessons) {
        const lessonDoc = doc(firestore, 'educationContent', lesson.id);
        const lessonData = {
          ...lesson,
          updatedAt: serverTimestamp()
        };
        
        batch.set(lessonDoc, lessonData);
        this.cache.set(lesson.id, lessonData);
      }
      
      await batch.commit();
      console.log(`✅ Batch saved ${lessons.length} lesson metadata documents`);
      return true;
    } catch (error) {
      console.error('❌ Error batch saving lesson metadata:', error);
      return false;
    }
  }

  /**
   * Update lesson statistics (plays, ratings, etc.)
   */
  public async updateLessonStats(lessonId: string, stats: {
    totalPlays?: number;
    averageRating?: number;
    completionRate?: number;
  }): Promise<boolean> {
    if (!firestore) {
      console.warn('⚠️ Firestore not available, cannot update lesson stats');
      return false;
    }

    try {
      const lessonDoc = doc(firestore, 'educationContent', lessonId);
      const updateData = {
        ...stats,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(lessonDoc, updateData);
      
      // Update cache
      const cachedLesson = this.cache.get(lessonId);
      if (cachedLesson) {
        Object.assign(cachedLesson, updateData);
        this.cache.set(lessonId, cachedLesson);
      }
      
      console.log(`✅ Updated lesson stats for ${lessonId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating lesson stats for ${lessonId}:`, error);
      return false;
    }
  }

  /**
   * Search lessons by title or description
   */
  public async searchLessons(searchTerm: string): Promise<LessonMetadata[]> {
    if (!firestore) {
      console.warn('⚠️ Firestore not available, returning empty array');
      return [];
    }

    try {
      // Note: This is a simple implementation. For better search, consider using Algolia or similar
      const lessonsQuery = query(
        collection(firestore, 'educationContent'),
        where('type', '==', 'lesson')
      );
      
      const querySnapshot = await getDocs(lessonsQuery);
      const lessons: LessonMetadata[] = [];
      
      querySnapshot.forEach((doc: any) => {
        const lessonData = doc.data() as LessonMetadata;
        const searchLower = searchTerm.toLowerCase();
        
        if (
          lessonData.title.toLowerCase().includes(searchLower) ||
          lessonData.description.toLowerCase().includes(searchLower) ||
          (lessonData.tags && lessonData.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        ) {
          lessons.push(lessonData);
        }
      });
      
      return lessons;
    } catch (error) {
      console.error('❌ Error searching lessons:', error);
      return [];
    }
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.stagesCache.clear();
    console.log('🧹 Cleared lesson metadata cache');
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { lessons: number; stages: number } {
    return {
      lessons: this.cache.size,
      stages: this.stagesCache.size
    };
  }

  // Private helper methods

  private getStageTitle(stage: number): string {
    const stageTitles: { [key: number]: string } = {
      1: 'Core Money Skills',
      2: 'Advanced Financial Concepts',
      3: 'Investment Strategies',
      4: 'Portfolio Management',
      5: 'Risk Management'
    };
    
    return stageTitles[stage] || `Stage ${stage}`;
  }

  private getStageDescription(stage: number): string {
    const stageDescriptions: { [key: number]: string } = {
      1: 'Learn the essential basics of money and finance',
      2: 'Master advanced financial concepts and strategies',
      3: 'Explore sophisticated investment strategies and portfolio management',
      4: 'Dive deep into portfolio optimization and asset allocation',
      5: 'Master risk assessment and mitigation strategies'
    };
    
    return stageDescriptions[stage] || `Educational content for stage ${stage}`;
  }

  private getRequiredXP(stage: number): number {
    return (stage - 1) * 100; // Each stage requires 100 more XP than the previous
  }
}

export default LessonMetadataService;
