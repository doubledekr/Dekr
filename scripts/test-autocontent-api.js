#!/usr/bin/env node

/**
 * Simple test of AutoContent API with a short script
 */

console.log('🧪 Testing AutoContent API with Short Script...');
console.log('');

async function testAutoContentAPI() {
  try {
    const shortScript = "Welcome to the Dekr Weekly Community Podcast. This is a test of our AutoContent API integration. The markets have been exciting this week with strong performance across tech stocks. Our community members have been sharing great insights and strategies. That's all for this test episode. Thanks for listening!";

    console.log('📝 Test script length:', shortScript.length, 'characters');
    console.log('');

    // Step 1: Create content request
    console.log('📝 Step 1: Creating content request...');
    const createResponse = await fetch('https://api.autocontentapi.com/content/Create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ff08e0f1-e8ed-4616-bbe8-fd1ca653470d`
      },
      body: JSON.stringify({
        resources: [
          {
            type: "text",
            content: shortScript
          }
        ],
        outputType: "audio",
        text: "Create a short test podcast episode",
        duration: "short" // 3-5 minutes
      })
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ AutoContent API create error:', createResponse.status, errorText);
      return;
    }

    const createResult = await createResponse.json();
    const requestId = createResult.request_id;
    console.log('✅ Content request created successfully!');
    console.log('📋 Request ID:', requestId);
    console.log('');

    // Step 2: Poll for status
    console.log('⏳ Step 2: Polling for completion...');
    let attempts = 0;
    const maxAttempts = 20; // 3 minutes max (10 second intervals)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
      
      const statusResponse = await fetch(`https://api.autocontentapi.com/content/Status/${requestId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ff08e0f1-e8ed-4616-bbe8-fd1ca653470d`
        }
      });

      if (!statusResponse.ok) {
        console.error('❌ Status check failed:', statusResponse.status);
        break;
      }

      const statusResult = await statusResponse.json();
      console.log(`📊 Status check ${attempts}: ${statusResult.status}`);

      if (statusResult.status === 100) {
        // Step 3: Get the audio
        console.log('🎉 Audio ready! Downloading...');
        const audioUrl = statusResult.audio_url;
        
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
          throw new Error(`Failed to download audio: ${audioResponse.status}`);
        }

        const audioBuffer = await audioResponse.arrayBuffer();
        console.log('✅ Audio generation successful!');
        console.log('🎵 Audio size:', audioBuffer.byteLength, 'bytes');
        console.log('⏱️ Audio duration:', statusResult.audio_duration, 'seconds');
        console.log('🔗 Audio URL:', audioUrl);
        console.log('');
        console.log('🎉 AutoContent API is working perfectly!');
        return;
        
      } else if (statusResult.status === 0) {
        console.log('⏳ Still pending...');
      } else if (statusResult.status === 5) {
        console.log('🔄 Processing...');
      } else if (statusResult.error_code && statusResult.error_code !== 0) {
        console.log('❌ Error during processing:', statusResult.error_code, statusResult.error_message);
        console.log('This might be a temporary issue with AutoContent API processing');
        return;
      }
    }

    console.log('⏰ Timeout - processing took longer than expected');
    
  } catch (error) {
    console.error('❌ Error testing AutoContent API:', error);
  }
}

// Run the test
testAutoContentAPI().then(() => {
  console.log('');
  console.log('🧪 AutoContent API Test Complete!');
}).catch(error => {
  console.error('❌ AutoContent API test failed:', error);
});
