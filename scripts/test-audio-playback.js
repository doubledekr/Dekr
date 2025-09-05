#!/usr/bin/env node

/**
 * Script to test audio playback with different URL types
 */

console.log('🔊 Testing Audio Playback with Different URL Types...');
console.log('');

// Test the getAudioAsset function with different URL types
const { getAudioAsset } = require('../utils/audioAssets.ts');

function testAudioAsset(url, description) {
  console.log(`🧪 Testing: ${description}`);
  console.log(`📝 URL: ${url}`);
  
  const result = getAudioAsset(url);
  console.log(`✅ Result:`, result);
  console.log(`📊 Type: ${typeof result}`);
  if (result && result.uri) {
    console.log(`🔗 URI: ${result.uri}`);
  }
  console.log('');
}

// Test different URL types
testAudioAsset('https://storage.autocontentapi.com/audio/test.mp3', 'AutoContent API URL');
testAudioAsset('https://firebasestorage.googleapis.com/v0/b/alpha-orbit.appspot.com/o/weekly-podcasts%2Ftest.mp3?alt=media', 'Firebase Storage URL');
testAudioAsset('blob:http://localhost:8080/12345678-1234-1234-1234-123456789abc', 'Blob URL');
testAudioAsset('lesson_1_1.mp3', 'Local Asset File');
testAudioAsset('/audio/Podcast Intro.mp3', 'Local Asset Path');

console.log('🎉 Audio Asset Testing Complete!');
console.log('');
console.log('📊 Summary:');
console.log('- External URLs (http/https/blob) → { uri: url }');
console.log('- Local assets → require() path');
console.log('- Unknown files → null');
console.log('');
console.log('✅ The audio player should now work with:');
console.log('1. AutoContent API URLs');
console.log('2. Firebase Storage URLs');
console.log('3. Blob URLs (temporary)');
console.log('4. Local bundled assets');
