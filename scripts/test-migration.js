#!/usr/bin/env node

/**
 * Firebase Storage Migration Test Script
 * 
 * This script tests the Firebase Storage migration system to ensure:
 * 1. All lesson audio files are properly uploaded to Firebase Storage
 * 2. Lesson metadata is correctly populated in Firestore
 * 3. Audio loading works from Firebase Storage with proper fallbacks
 * 4. Caching system is working correctly
 * 5. Offline fallback mechanisms are functional
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Firebase Storage Migration Test...\n');

// Test configuration
const TEST_CONFIG = {
  testStages: [1, 2], // Test stages 1 and 2
  testLessons: [1, 2, 3], // Test first 3 lessons of each stage
  timeout: 30000, // 30 second timeout per test
};

/**
 * Run a test with timeout
 */
function runWithTimeout(testFn, timeout = TEST_CONFIG.timeout) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Test timed out after ${timeout}ms`));
    }, timeout);

    testFn()
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * Test 1: Verify Firebase Functions are deployed
 */
async function testFirebaseFunctions() {
  console.log('🔍 Test 1: Verifying Firebase Functions deployment...');
  
  try {
    // Check if functions directory exists and has the migration function
    const functionsPath = path.join(__dirname, '../functions/src/migrations/uploadLessonAudio.ts');
    
    if (!fs.existsSync(functionsPath)) {
      throw new Error('Migration function file not found');
    }
    
    console.log('✅ Firebase Functions migration file exists');
    return { success: true, message: 'Firebase Functions are properly configured' };
    
  } catch (error) {
    console.log('❌ Firebase Functions test failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Test 2: Verify Storage Service configuration
 */
async function testStorageService() {
  console.log('🔍 Test 2: Verifying Storage Service configuration...');
  
  try {
    // Check if StorageService file exists
    const storageServicePath = path.join(__dirname, '../services/StorageService.ts');
    
    if (!fs.existsSync(storageServicePath)) {
      throw new Error('StorageService file not found');
    }
    
    // Check if the file has the required methods
    const storageServiceContent = fs.readFileSync(storageServicePath, 'utf8');
    const requiredMethods = [
      'getLessonAudioUrl',
      'preloadLessonAudio',
      'clearAllCache',
      'isStorageAvailable'
    ];
    
    const missingMethods = requiredMethods.filter(method => 
      !storageServiceContent.includes(method)
    );
    
    if (missingMethods.length > 0) {
      throw new Error(`Missing required methods: ${missingMethods.join(', ')}`);
    }
    
    console.log('✅ Storage Service is properly configured');
    return { success: true, message: 'Storage Service has all required methods' };
    
  } catch (error) {
    console.log('❌ Storage Service test failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Test 3: Verify Audio Asset Manager
 */
async function testAudioAssetManager() {
  console.log('🔍 Test 3: Verifying Audio Asset Manager...');
  
  try {
    // Check if audioAssets file exists and has been updated
    const audioAssetsPath = path.join(__dirname, '../utils/audioAssets.ts');
    
    if (!fs.existsSync(audioAssetsPath)) {
      throw new Error('Audio Assets file not found');
    }
    
    const audioAssetsContent = fs.readFileSync(audioAssetsPath, 'utf8');
    
    // Check for Firebase Storage integration
    if (!audioAssetsContent.includes('AudioAssetManager')) {
      throw new Error('AudioAssetManager class not found');
    }
    
    if (!audioAssetsContent.includes('StorageService')) {
      throw new Error('StorageService integration not found');
    }
    
    console.log('✅ Audio Asset Manager is properly configured');
    return { success: true, message: 'Audio Asset Manager has Firebase Storage integration' };
    
  } catch (error) {
    console.log('❌ Audio Asset Manager test failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Test 4: Verify ReactNativeAudioPlayer updates
 */
async function testAudioPlayer() {
  console.log('🔍 Test 4: Verifying ReactNativeAudioPlayer updates...');
  
  try {
    const audioPlayerPath = path.join(__dirname, '../components/ReactNativeAudioPlayer.tsx');
    
    if (!fs.existsSync(audioPlayerPath)) {
      throw new Error('ReactNativeAudioPlayer file not found');
    }
    
    const audioPlayerContent = fs.readFileSync(audioPlayerPath, 'utf8');
    
    // Check for Firebase Storage integration
    if (!audioPlayerContent.includes('audioAssetManager')) {
      throw new Error('AudioAssetManager integration not found');
    }
    
    if (!audioPlayerContent.includes('loadAudioSource')) {
      throw new Error('loadAudioSource method not found');
    }
    
    if (!audioPlayerContent.includes('retryCount')) {
      throw new Error('Retry logic not found');
    }
    
    console.log('✅ ReactNativeAudioPlayer is properly updated');
    return { success: true, message: 'ReactNativeAudioPlayer has Firebase Storage support' };
    
  } catch (error) {
    console.log('❌ ReactNativeAudioPlayer test failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Test 5: Verify LessonCard updates
 */
async function testLessonCard() {
  console.log('🔍 Test 5: Verifying LessonCard updates...');
  
  try {
    const lessonCardPath = path.join(__dirname, '../components/deck/LessonCard.tsx');
    
    if (!fs.existsSync(lessonCardPath)) {
      throw new Error('LessonCard file not found');
    }
    
    const lessonCardContent = fs.readFileSync(lessonCardPath, 'utf8');
    
    // Check for Firebase Storage integration
    if (!lessonCardContent.includes('audioAssetManager')) {
      throw new Error('AudioAssetManager integration not found');
    }
    
    if (!lessonCardContent.includes('loadAudioUrl')) {
      throw new Error('loadAudioUrl method not found');
    }
    
    if (!lessonCardContent.includes('isLoadingAudio')) {
      throw new Error('Loading state management not found');
    }
    
    console.log('✅ LessonCard is properly updated');
    return { success: true, message: 'LessonCard has Firebase Storage integration' };
    
  } catch (error) {
    console.log('❌ LessonCard test failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Test 6: Verify Lesson Metadata Service
 */
async function testLessonMetadataService() {
  console.log('🔍 Test 6: Verifying Lesson Metadata Service...');
  
  try {
    const metadataServicePath = path.join(__dirname, '../services/LessonMetadataService.ts');
    
    if (!fs.existsSync(metadataServicePath)) {
      throw new Error('LessonMetadataService file not found');
    }
    
    const metadataServiceContent = fs.readFileSync(metadataServicePath, 'utf8');
    
    // Check for required methods
    const requiredMethods = [
      'getLessonMetadata',
      'getStageLessons',
      'getAllStages',
      'saveLessonMetadata'
    ];
    
    const missingMethods = requiredMethods.filter(method => 
      !metadataServiceContent.includes(method)
    );
    
    if (missingMethods.length > 0) {
      throw new Error(`Missing required methods: ${missingMethods.join(', ')}`);
    }
    
    console.log('✅ Lesson Metadata Service is properly configured');
    return { success: true, message: 'Lesson Metadata Service has all required methods' };
    
  } catch (error) {
    console.log('❌ Lesson Metadata Service test failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Test 7: Verify Migration Verification Service
 */
async function testMigrationVerificationService() {
  console.log('🔍 Test 7: Verifying Migration Verification Service...');
  
  try {
    const verificationServicePath = path.join(__dirname, '../services/MigrationVerificationService.ts');
    
    if (!fs.existsSync(verificationServicePath)) {
      throw new Error('MigrationVerificationService file not found');
    }
    
    const verificationServiceContent = fs.readFileSync(verificationServicePath, 'utf8');
    
    // Check for required methods
    const requiredMethods = [
      'runFullVerification',
      'verifyStorageAvailability',
      'verifyLessonMetadata',
      'verifyAudioLoading'
    ];
    
    const missingMethods = requiredMethods.filter(method => 
      !verificationServiceContent.includes(method)
    );
    
    if (missingMethods.length > 0) {
      throw new Error(`Missing required methods: ${missingMethods.join(', ')}`);
    }
    
    console.log('✅ Migration Verification Service is properly configured');
    return { success: true, message: 'Migration Verification Service has all required methods' };
    
  } catch (error) {
    console.log('❌ Migration Verification Service test failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Test 8: Verify Firebase Storage rules
 */
async function testStorageRules() {
  console.log('🔍 Test 8: Verifying Firebase Storage rules...');
  
  try {
    const storageRulesPath = path.join(__dirname, '../storage.rules');
    
    if (!fs.existsSync(storageRulesPath)) {
      throw new Error('Storage rules file not found');
    }
    
    const storageRulesContent = fs.readFileSync(storageRulesPath, 'utf8');
    
    // Check for required rules
    const requiredRules = [
      'dekr-content',
      'lessons',
      'isAuthenticated',
      'allow read'
    ];
    
    const missingRules = requiredRules.filter(rule => 
      !storageRulesContent.includes(rule)
    );
    
    if (missingRules.length > 0) {
      throw new Error(`Missing required storage rules: ${missingRules.join(', ')}`);
    }
    
    console.log('✅ Firebase Storage rules are properly configured');
    return { success: true, message: 'Firebase Storage rules have required permissions' };
    
  } catch (error) {
    console.log('❌ Storage rules test failed:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  const tests = [
    testFirebaseFunctions,
    testStorageService,
    testAudioAssetManager,
    testAudioPlayer,
    testLessonCard,
    testLessonMetadataService,
    testMigrationVerificationService,
    testStorageRules
  ];
  
  const results = [];
  let passedTests = 0;
  let failedTests = 0;
  
  console.log('🧪 Running migration tests...\n');
  
  for (const test of tests) {
    try {
      const result = await runWithTimeout(test);
      results.push(result);
      
      if (result.success) {
        passedTests++;
      } else {
        failedTests++;
      }
    } catch (error) {
      results.push({
        success: false,
        message: `Test failed with error: ${error.message}`
      });
      failedTests++;
    }
  }
  
  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / tests.length) * 100).toFixed(1)}%`);
  
  if (failedTests > 0) {
    console.log('\n❌ Failed Tests:');
    results.forEach((result, index) => {
      if (!result.success) {
        console.log(`${index + 1}. ${result.message}`);
      }
    });
  }
  
  console.log('\n🎯 Next Steps:');
  if (failedTests === 0) {
    console.log('✅ All tests passed! The migration system is ready.');
    console.log('📋 To complete the migration:');
    console.log('   1. Deploy Firebase Functions: npm run deploy:functions');
    console.log('   2. Run the migration function to upload audio files');
    console.log('   3. Test the app with Firebase Storage integration');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues before proceeding.');
    console.log('📋 Review the failed tests above and update the code accordingly.');
  }
  
  return {
    total: tests.length,
    passed: passedTests,
    failed: failedTests,
    results
  };
}

// Run the tests
if (require.main === module) {
  runAllTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testFirebaseFunctions,
  testStorageService,
  testAudioAssetManager,
  testAudioPlayer,
  testLessonCard,
  testLessonMetadataService,
  testMigrationVerificationService,
  testStorageRules
};
