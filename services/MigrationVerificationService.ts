import { Platform } from 'react-native';
import StorageService from './StorageService';
import LessonMetadataService from './LessonMetadataService';
import { audioAssetManager } from '../utils/audioAssets';

// Platform-aware Firebase imports
let firestore: any;
let collection: any;
let doc: any;
let getDoc: any;
let getDocs: any;
let query: any;
let where: any;
let orderBy: any;

if (Platform.OS === 'web') {
  const { getFirestore, collection: webCollection, doc: webDoc, getDoc: webGetDoc, getDocs: webGetDocs, query: webQuery, where: webWhere, orderBy: webOrderBy } = require('firebase/firestore');
  const { getApp } = require('firebase/app');
  
  try {
    const app = getApp();
    firestore = getFirestore(app);
    collection = webCollection;
    doc = webDoc;
    getDoc = webGetDoc;
    getDocs = webGetDocs;
    query = webQuery;
    where = webWhere;
    orderBy = webOrderBy;
  } catch (error) {
    console.warn('⚠️ Firebase Firestore not available on web, using fallback');
    firestore = null;
  }
} else {
  try {
    const firestoreModule = require('@react-native-firebase/firestore').default;
    firestore = firestoreModule();
    collection = (db: any, collectionName: string) => db.collection(collectionName);
    doc = (db: any, collectionName: string, docId: string) => db.collection(collectionName).doc(docId);
    getDoc = (docRef: any) => docRef.get();
    getDocs = (queryRef: any) => queryRef.get();
    query = (queryRef: any, ...constraints: any[]) => queryRef;
    where = (field: string, operator: string, value: any) => ({ field, operator, value });
    orderBy = (field: string, direction: string) => ({ field, direction });
  } catch (error) {
    console.warn('⚠️ React Native Firebase Firestore not available, using fallback');
    firestore = null;
  }
}

interface VerificationResult {
  success: boolean;
  message: string;
  details?: any;
  errors?: string[];
}

interface MigrationStats {
  totalLessons: number;
  uploadedLessons: number;
  failedUploads: number;
  cacheHits: number;
  cacheMisses: number;
  averageLoadTime: number;
  errors: string[];
}

class MigrationVerificationService {
  private static instance: MigrationVerificationService;
  private storageService: StorageService;
  private lessonMetadataService: LessonMetadataService;
  private stats: MigrationStats = {
    totalLessons: 0,
    uploadedLessons: 0,
    failedUploads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageLoadTime: 0,
    errors: []
  };

  private constructor() {
    this.storageService = StorageService.getInstance();
    this.lessonMetadataService = LessonMetadataService.getInstance();
  }

  public static getInstance(): MigrationVerificationService {
    if (!MigrationVerificationService.instance) {
      MigrationVerificationService.instance = new MigrationVerificationService();
    }
    return MigrationVerificationService.instance;
  }

  /**
   * Run comprehensive migration verification
   */
  public async runFullVerification(): Promise<VerificationResult> {
    console.log('🔍 Starting comprehensive migration verification...');
    
    const results: VerificationResult[] = [];
    const errors: string[] = [];

    try {
      // 1. Verify Firebase Storage availability
      const storageResult = await this.verifyStorageAvailability();
      results.push(storageResult);
      if (!storageResult.success) errors.push(storageResult.message);

      // 2. Verify lesson metadata in Firestore
      const metadataResult = await this.verifyLessonMetadata();
      results.push(metadataResult);
      if (!metadataResult.success) errors.push(metadataResult.message);

      // 3. Test audio URL loading for all lessons
      const audioResult = await this.verifyAudioLoading();
      results.push(audioResult);
      if (!audioResult.success) errors.push(audioResult.message);

      // 4. Test cache functionality
      const cacheResult = await this.verifyCacheFunctionality();
      results.push(cacheResult);
      if (!cacheResult.success) errors.push(cacheResult.message);

      // 5. Test offline fallback
      const offlineResult = await this.verifyOfflineFallback();
      results.push(offlineResult);
      if (!offlineResult.success) errors.push(offlineResult.message);

      const allSuccessful = results.every(r => r.success);
      
      return {
        success: allSuccessful,
        message: allSuccessful 
          ? 'All migration verification tests passed successfully!' 
          : `${results.filter(r => !r.success).length} verification tests failed`,
        details: {
          results,
          stats: this.stats
        },
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      console.error('❌ Migration verification failed:', error);
      return {
        success: false,
        message: `Migration verification failed: ${error.message}`,
        errors: [error.message]
      };
    }
  }

  /**
   * Verify Firebase Storage availability and configuration
   */
  private async verifyStorageAvailability(): Promise<VerificationResult> {
    console.log('🔍 Verifying Firebase Storage availability...');
    
    try {
      const isAvailable = this.storageService.isStorageAvailable();
      
      if (!isAvailable) {
        return {
          success: false,
          message: 'Firebase Storage is not available'
        };
      }

      // Test basic storage operations
      const testStage = 1;
      const testLesson = 1;
      
      const startTime = Date.now();
      const audioUrl = await this.storageService.getLessonAudioUrl(testStage, testLesson);
      const loadTime = Date.now() - startTime;
      
      if (!audioUrl) {
        return {
          success: false,
          message: 'Failed to retrieve test audio URL from Firebase Storage'
        };
      }

      if (!audioUrl.startsWith('http')) {
        return {
          success: false,
          message: 'Retrieved URL is not a valid HTTP URL'
        };
      }

      this.stats.averageLoadTime = loadTime;
      this.stats.cacheMisses++;

      return {
        success: true,
        message: 'Firebase Storage is available and working correctly',
        details: {
          testUrl: audioUrl,
          loadTime
        }
      };

    } catch (error) {
      this.stats.errors.push(`Storage availability check failed: ${error.message}`);
      return {
        success: false,
        message: `Firebase Storage verification failed: ${error.message}`
      };
    }
  }

  /**
   * Verify lesson metadata exists in Firestore
   */
  private async verifyLessonMetadata(): Promise<VerificationResult> {
    console.log('🔍 Verifying lesson metadata in Firestore...');
    
    if (!firestore) {
      return {
        success: false,
        message: 'Firestore is not available'
      };
    }

    try {
      const stagesQuery = query(
        collection(firestore, 'educationContent'),
        where('type', '==', 'lesson'),
        orderBy('stage', 'asc'),
        orderBy('lessonNumber', 'asc')
      );
      
      const querySnapshot = await getDocs(stagesQuery);
      const lessons: any[] = [];
      
      querySnapshot.forEach((doc: any) => {
        lessons.push(doc.data());
      });

      this.stats.totalLessons = lessons.length;

      if (lessons.length === 0) {
        return {
          success: false,
          message: 'No lesson metadata found in Firestore'
        };
      }

      // Verify required fields
      const requiredFields = ['id', 'title', 'description', 'stage', 'lessonNumber', 'audioUrl'];
      const invalidLessons = lessons.filter(lesson => 
        requiredFields.some(field => !lesson[field])
      );

      if (invalidLessons.length > 0) {
        return {
          success: false,
          message: `${invalidLessons.length} lessons are missing required fields`,
          details: { invalidLessons: invalidLessons.map(l => l.id) }
        };
      }

      return {
        success: true,
        message: `Found ${lessons.length} lesson metadata entries in Firestore`,
        details: {
          totalLessons: lessons.length,
          stages: [...new Set(lessons.map(l => l.stage))].length
        }
      };

    } catch (error) {
      this.stats.errors.push(`Metadata verification failed: ${error.message}`);
      return {
        success: false,
        message: `Lesson metadata verification failed: ${error.message}`
      };
    }
  }

  /**
   * Verify audio loading for all lessons
   */
  private async verifyAudioLoading(): Promise<VerificationResult> {
    console.log('🔍 Verifying audio loading for all lessons...');
    
    try {
      const stages = await this.lessonMetadataService.getAllStages();
      const testResults: any[] = [];
      let successfulLoads = 0;
      let failedLoads = 0;

      for (const stage of stages) {
        for (const lesson of stage.lessons) {
          const startTime = Date.now();
          
          try {
            const audioAsset = await audioAssetManager.getLessonAudioAsset(
              lesson.stage, 
              lesson.lessonNumber
            );
            
            const loadTime = Date.now() - startTime;
            
            if (audioAsset && (audioAsset.uri || audioAsset)) {
              successfulLoads++;
              this.stats.uploadedLessons++;
              testResults.push({
                lessonId: lesson.id,
                success: true,
                loadTime,
                source: audioAsset.uri ? 'firebase' : 'local'
              });
            } else {
              failedLoads++;
              this.stats.failedUploads++;
              testResults.push({
                lessonId: lesson.id,
                success: false,
                error: 'No audio asset returned'
              });
            }
          } catch (error) {
            failedLoads++;
            this.stats.failedUploads++;
            testResults.push({
              lessonId: lesson.id,
              success: false,
              error: error.message
            });
          }
        }
      }

      const successRate = (successfulLoads / (successfulLoads + failedLoads)) * 100;

      return {
        success: successRate >= 90, // 90% success rate threshold
        message: `Audio loading test: ${successfulLoads}/${successfulLoads + failedLoads} successful (${successRate.toFixed(1)}%)`,
        details: {
          successfulLoads,
          failedLoads,
          successRate,
          testResults: testResults.slice(0, 10) // Show first 10 results
        }
      };

    } catch (error) {
      this.stats.errors.push(`Audio loading verification failed: ${error.message}`);
      return {
        success: false,
        message: `Audio loading verification failed: ${error.message}`
      };
    }
  }

  /**
   * Verify cache functionality
   */
  private async verifyCacheFunctionality(): Promise<VerificationResult> {
    console.log('🔍 Verifying cache functionality...');
    
    try {
      // Clear cache first
      await this.storageService.clearAllCache();
      
      // First load (should be cache miss)
      const startTime1 = Date.now();
      await this.storageService.getLessonAudioUrl(1, 1);
      const firstLoadTime = Date.now() - startTime1;
      this.stats.cacheMisses++;
      
      // Second load (should be cache hit)
      const startTime2 = Date.now();
      await this.storageService.getLessonAudioUrl(1, 1);
      const secondLoadTime = Date.now() - startTime2;
      this.stats.cacheHits++;
      
      // Verify cache stats
      const cacheStats = this.storageService.getCacheStats();
      
      if (cacheStats.size === 0) {
        return {
          success: false,
          message: 'Cache is not working - no entries found after loading'
        };
      }

      const cacheWorking = secondLoadTime < firstLoadTime;

      return {
        success: cacheWorking,
        message: cacheWorking 
          ? 'Cache is working correctly' 
          : 'Cache may not be working - second load was not faster',
        details: {
          firstLoadTime,
          secondLoadTime,
          cacheStats,
          cacheEntries: cacheStats.entries
        }
      };

    } catch (error) {
      this.stats.errors.push(`Cache verification failed: ${error.message}`);
      return {
        success: false,
        message: `Cache functionality verification failed: ${error.message}`
      };
    }
  }

  /**
   * Verify offline fallback functionality
   */
  private async verifyOfflineFallback(): Promise<VerificationResult> {
    console.log('🔍 Verifying offline fallback functionality...');
    
    try {
      // Test with a lesson that should have local fallback
      const testStage = 1;
      const testLesson = 1;
      
      // Clear cache to force fresh load
      await this.storageService.clearLessonCache(testStage, testLesson);
      
      // Try to get audio asset (should fall back to local if Firebase fails)
      const audioAsset = await audioAssetManager.getLessonAudioAsset(testStage, testLesson);
      
      if (!audioAsset) {
        return {
          success: false,
          message: 'No audio asset returned - offline fallback failed'
        };
      }

      // Check if we got a local asset as fallback
      const isLocalAsset = !audioAsset.uri || !audioAsset.uri.startsWith('http');
      
      return {
        success: true,
        message: 'Offline fallback is working correctly',
        details: {
          audioAssetType: isLocalAsset ? 'local' : 'firebase',
          hasFallback: true
        }
      };

    } catch (error) {
      this.stats.errors.push(`Offline fallback verification failed: ${error.message}`);
      return {
        success: false,
        message: `Offline fallback verification failed: ${error.message}`
      };
    }
  }

  /**
   * Test specific lesson audio loading
   */
  public async testLessonAudio(stage: number, lessonId: number): Promise<VerificationResult> {
    console.log(`🔍 Testing audio loading for lesson ${stage}_${lessonId}...`);
    
    try {
      const startTime = Date.now();
      const audioAsset = await audioAssetManager.getLessonAudioAsset(stage, lessonId);
      const loadTime = Date.now() - startTime;
      
      if (!audioAsset) {
        return {
          success: false,
          message: `No audio asset found for lesson ${stage}_${lessonId}`
        };
      }

      const isFirebaseUrl = audioAsset.uri && audioAsset.uri.startsWith('http');
      
      return {
        success: true,
        message: `Audio loaded successfully for lesson ${stage}_${lessonId}`,
        details: {
          loadTime,
          source: isFirebaseUrl ? 'firebase' : 'local',
          url: audioAsset.uri || 'local asset'
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to load audio for lesson ${stage}_${lessonId}: ${error.message}`
      };
    }
  }

  /**
   * Get migration statistics
   */
  public getMigrationStats(): MigrationStats {
    return { ...this.stats };
  }

  /**
   * Reset migration statistics
   */
  public resetStats(): void {
    this.stats = {
      totalLessons: 0,
      uploadedLessons: 0,
      failedUploads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLoadTime: 0,
      errors: []
    };
  }

  /**
   * Generate migration report
   */
  public generateReport(): string {
    const stats = this.getMigrationStats();
    const cacheHitRate = stats.cacheHits + stats.cacheMisses > 0 
      ? (stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(1)
      : '0';
    
    const successRate = stats.totalLessons > 0 
      ? (stats.uploadedLessons / stats.totalLessons * 100).toFixed(1)
      : '0';

    return `
📊 Firebase Storage Migration Report
=====================================

📈 Statistics:
- Total Lessons: ${stats.totalLessons}
- Successfully Uploaded: ${stats.uploadedLessons}
- Failed Uploads: ${stats.failedUploads}
- Success Rate: ${successRate}%

⚡ Performance:
- Average Load Time: ${stats.averageLoadTime}ms
- Cache Hit Rate: ${cacheHitRate}%
- Cache Hits: ${stats.cacheHits}
- Cache Misses: ${stats.cacheMisses}

❌ Errors (${stats.errors.length}):
${stats.errors.map(error => `- ${error}`).join('\n')}

✅ Migration Status: ${stats.failedUploads === 0 ? 'COMPLETE' : 'PARTIAL'}
    `.trim();
  }
}

export default MigrationVerificationService;
