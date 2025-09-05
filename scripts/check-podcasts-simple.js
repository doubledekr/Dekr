#!/usr/bin/env node

/**
 * Script to check for weekly podcasts with a simple query (no index required)
 */

console.log('🔍 Checking for Weekly Podcasts (Simple Query)...');
console.log('');

// Set up environment variables
process.env.EXPO_PUBLIC_OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-proj-your-key-here';
process.env.EXPO_PUBLIC_AUTOCONTENT_API_KEY = 'ff08e0f1-e8ed-4616-bbe8-fd1ca653470d';
process.env.EXPO_PUBLIC_POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'your-polygon-key-here';

// Mock the React Native environment for Node.js
global.Platform = { OS: 'web' };

async function checkPodcastsSimple() {
  try {
    console.log('🔧 Environment configured for simple podcast check');
    console.log('');
    
    // Test 1: Check if there are any weekly podcasts in Firebase (simple query)
    console.log('📊 Step 1: Checking for weekly podcasts (simple query)...');
    try {
      const { initializeApp } = require('firebase/app');
      const { getFirestore, collection, getDocs } = require('firebase/firestore');
      
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
      
      // Simple query - get all weekly podcasts (no ordering or filtering)
      const podcastsRef = collection(db, 'weekly_podcasts');
      const snapshot = await getDocs(podcastsRef);
      
      console.log(`✅ Found ${snapshot.docs.length} weekly podcasts in Firebase`);
      
      if (snapshot.docs.length > 0) {
        console.log('📋 All weekly podcasts:');
        snapshot.docs.forEach((doc, index) => {
          const data = doc.data();
          console.log(`${index + 1}. ID: ${doc.id}`);
          console.log(`   Title: ${data.title}`);
          console.log(`   Audio URL: ${data.audioUrl}`);
          console.log(`   Public: ${data.isPublic}`);
          console.log(`   Access Level: ${data.accessLevel}`);
          console.log(`   Created: ${data.createdAt ? data.createdAt.toDate ? data.createdAt.toDate() : data.createdAt : 'Unknown'}`);
          console.log('');
        });
        
        // Test the first podcast's audio URL
        const firstPodcast = snapshot.docs[0].data();
        console.log('🌐 Testing first podcast audio URL...');
        try {
          const response = await fetch(firstPodcast.audioUrl, { method: 'HEAD' });
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
        
      } else {
        console.log('❌ No weekly podcasts found in Firebase');
        console.log('🔧 This is likely the issue - no podcasts to play');
        console.log('');
        console.log('🎯 Solution:');
        console.log('1. Generate a weekly podcast using the app');
        console.log('2. Or run the test script to create one');
        console.log('3. Check if the podcast was saved correctly');
      }
      
    } catch (firebaseError) {
      console.log('❌ Firebase connection error:', firebaseError.message);
      console.log('🔧 This could be the issue - cannot connect to Firebase');
    }
    
  } catch (error) {
    console.error('❌ Error during podcast check:', error);
  }
}

// Run the check
checkPodcastsSimple().then(() => {
  console.log('');
  console.log('🧪 Podcast Check Complete!');
}).catch(error => {
  console.error('❌ Podcast check failed:', error);
});

// Export for use in the app
module.exports = { checkPodcastsSimple };
