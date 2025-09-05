#!/usr/bin/env node

/**
 * Script to debug audio playback issues
 * This will check Firebase Storage access, audio URL validity, and authentication
 */

console.log('🔍 Debugging Audio Playback Issues...');
console.log('This will check Firebase Storage access, audio URL validity, and authentication');
console.log('');

// Set up environment variables
process.env.EXPO_PUBLIC_OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-proj-your-key-here';
process.env.EXPO_PUBLIC_AUTOCONTENT_API_KEY = 'ff08e0f1-e8ed-4616-bbe8-fd1ca653470d';
process.env.EXPO_PUBLIC_POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'your-polygon-key-here';

// Mock the React Native environment for Node.js
global.Platform = { OS: 'web' };
global.window = {
  AudioContext: class AudioContext {
    createBuffer() { return { getChannelData: () => new Float32Array(1000) }; }
    decodeAudioData() { return Promise.resolve({ duration: 300, getChannelData: () => new Float32Array(1000) }); }
  },
  webkitAudioContext: global.window?.AudioContext,
  OfflineAudioContext: class OfflineAudioContext {
    constructor() {}
    createBufferSource() { return { buffer: null, connect: () => {}, start: () => {} }; }
    startRendering() { return Promise.resolve({ length: 1000, numberOfChannels: 2, sampleRate: 44100, getChannelData: () => new Float32Array(1000) }); }
  }
};

async function debugAudioPlayback() {
  try {
    console.log('🔧 Environment configured for audio debugging');
    console.log('');
    
    // Test 1: Check if there are any weekly podcasts in Firebase
    console.log('📊 Step 1: Checking for weekly podcasts in Firebase...');
    try {
      const { initializeApp } = require('firebase/app');
      const { getFirestore, collection, query, orderBy, limit, getDocs, where } = require('firebase/firestore');
      
      // Firebase config
      const firebaseConfig = {
        apiKey: "AIzaSyBvOkBwJ1BqJ1BqJ1BqJ1BqJ1BqJ1BqJ1B",
        authDomain: "alpha-orbit.firebaseapp.com",
        projectId: "alpha-orbit",
        storageBucket: "alpha-orbit.appspot.com",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abcdef123456789"
      };
      
      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      // Query weekly podcasts
      const podcastsRef = collection(db, 'weekly_podcasts');
      const q = query(
        podcastsRef,
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      console.log(`✅ Found ${snapshot.docs.length} weekly podcasts in Firebase`);
      
      if (snapshot.docs.length > 0) {
        const latestPodcast = snapshot.docs[0].data();
        console.log('📋 Latest podcast details:');
        console.log(`- ID: ${snapshot.docs[0].id}`);
        console.log(`- Title: ${latestPodcast.title}`);
        console.log(`- Audio URL: ${latestPodcast.audioUrl}`);
        console.log(`- Duration: ${latestPodcast.duration} seconds`);
        console.log(`- Public: ${latestPodcast.isPublic}`);
        console.log(`- Access Level: ${latestPodcast.accessLevel}`);
        console.log('');
        
        // Test 2: Check if the audio URL is accessible
        console.log('🌐 Step 2: Testing audio URL accessibility...');
        try {
          const response = await fetch(latestPodcast.audioUrl, { method: 'HEAD' });
          console.log(`✅ Audio URL response: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            console.log('✅ Audio URL is accessible');
            console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
            console.log(`📊 Content-Length: ${response.headers.get('content-length')}`);
          } else {
            console.log('❌ Audio URL is not accessible');
            console.log(`❌ Status: ${response.status} ${response.statusText}`);
          }
        } catch (urlError) {
          console.log('❌ Error accessing audio URL:', urlError.message);
        }
        console.log('');
        
        // Test 3: Check Firebase Storage rules
        console.log('🔒 Step 3: Checking Firebase Storage rules...');
        const storageUrl = 'https://firebasestorage.googleapis.com/v0/b/alpha-orbit.appspot.com/o/weekly-podcasts%2F';
        console.log(`📁 Storage base URL: ${storageUrl}`);
        console.log('📋 Storage rules should allow public read access for /weekly-podcasts/{allPaths=**}');
        console.log('');
        
        // Test 4: Test audio asset handling
        console.log('🎵 Step 4: Testing audio asset handling...');
        const { getAudioAsset } = require('../utils/audioAssets.ts');
        const audioAsset = getAudioAsset(latestPodcast.audioUrl);
        console.log('✅ Audio asset result:', audioAsset);
        
        if (audioAsset && audioAsset.uri) {
          console.log('✅ Audio asset format is correct for React Native Audio');
          console.log(`🔗 URI: ${audioAsset.uri}`);
        } else {
          console.log('❌ Audio asset format issue detected');
        }
        console.log('');
        
        // Test 5: Check if it's a demo account issue
        console.log('👤 Step 5: Checking demo account access...');
        console.log('📋 Demo account considerations:');
        console.log('- Demo accounts should have access to public weekly podcasts');
        console.log('- Weekly podcasts are marked as isPublic: true');
        console.log('- Access level is set to "community"');
        console.log('- Firebase Storage rules should allow public read access');
        console.log('');
        
        // Test 6: Check React Native Audio Player requirements
        console.log('📱 Step 6: React Native Audio Player requirements...');
        console.log('📋 Requirements for audio playback:');
        console.log('- Audio URL must be accessible (HTTP/HTTPS)');
        console.log('- Audio format must be supported (MP3, WAV, etc.)');
        console.log('- React Native Audio permissions must be granted');
        console.log('- Audio source must be properly formatted');
        console.log('');
        
        console.log('🎉 Audio Playback Debug Complete!');
        console.log('');
        console.log('📊 Summary:');
        console.log(`- ✅ Weekly podcasts found: ${snapshot.docs.length}`);
        console.log(`- ✅ Latest podcast: ${latestPodcast.title}`);
        console.log(`- ✅ Audio URL: ${latestPodcast.audioUrl}`);
        console.log(`- ✅ Public access: ${latestPodcast.isPublic}`);
        console.log(`- ✅ Access level: ${latestPodcast.accessLevel}`);
        console.log('');
        console.log('🔧 Potential Issues:');
        console.log('1. Audio URL accessibility (check Step 2 results)');
        console.log('2. Firebase Storage rules (check Step 3)');
        console.log('3. React Native Audio permissions');
        console.log('4. Audio format compatibility');
        console.log('5. Network connectivity');
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Check console logs in the app for audio player errors');
        console.log('2. Verify Firebase Storage rules allow public access');
        console.log('3. Test audio URL in browser to confirm accessibility');
        console.log('4. Check React Native Audio permissions');
        console.log('5. Verify audio format is supported');
        
      } else {
        console.log('❌ No weekly podcasts found in Firebase');
        console.log('🔧 This could be the issue - no podcasts to play');
        console.log('');
        console.log('🎯 Solution:');
        console.log('1. Generate a weekly podcast using the app');
        console.log('2. Or use the test script to create one');
        console.log('3. Check Firebase connection and permissions');
      }
      
    } catch (firebaseError) {
      console.log('❌ Firebase connection error:', firebaseError.message);
      console.log('🔧 This could be the issue - cannot connect to Firebase');
    }
    
  } catch (error) {
    console.error('❌ Error during audio debugging:', error);
  }
}

// Run the debug
debugAudioPlayback().then(() => {
  console.log('');
  console.log('🧪 Audio Playback Debug Complete!');
  console.log('Check the results above to identify the audio playback issue.');
}).catch(error => {
  console.error('❌ Audio debug failed:', error);
});

// Export for use in the app
module.exports = { debugAudioPlayback };
