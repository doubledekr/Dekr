#!/usr/bin/env python3
"""
Test script for the podcast generator
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from podcast_generator import PodcastGenerator

def test_script_generation():
    """Test script generation with OpenAI"""
    print("🧪 Testing script generation...")
    
    # Load environment variables
    load_dotenv()
    
    # Initialize generator
    generator = PodcastGenerator()
    
    # Mock user preferences
    user_preferences = {
        'email': 'test@example.com',
        'podcastPreferences': {
            'includeMarketAnalysis': True,
            'includeCommunityHighlights': True,
            'includeEducationalContent': True,
            'includePersonalizedInsights': True,
            'preferredLength': 'medium'
        },
        'lastPodcast': None
    }
    
    # Mock market data
    market_data = {
        'communitySize': 1250,
        'topPerformers': ['Alex Chen', 'Sarah Johnson'],
        'trendingStocks': ['AAPL', 'TSLA']
    }
    
    try:
        script = generator.generate_podcast_script(user_preferences, market_data)
        print("✅ Script generation successful!")
        print(f"Script length: {len(script)} characters")
        print(f"First 200 characters: {script[:200]}...")
        return True
    except Exception as e:
        print(f"❌ Script generation failed: {e}")
        return False

def test_voice_generation():
    """Test voice generation with ElevenLabs"""
    print("\n🧪 Testing voice generation...")
    
    # Load environment variables
    load_dotenv()
    
    # Initialize generator
    generator = PodcastGenerator()
    
    # Test script
    test_script = "Hello, this is a test of the ElevenLabs voice generation system. If you can hear this, the integration is working correctly."
    voice_id = "vDchjyOZZytffNeZXfZK"  # Default voice ID
    
    try:
        audio_data = generator.generate_voice(test_script, voice_id)
        print("✅ Voice generation successful!")
        print(f"Audio data size: {len(audio_data)} bytes")
        
        # Save test audio file
        with open("test_voice.mp3", "wb") as f:
            f.write(audio_data)
        print("✅ Test audio saved as 'test_voice.mp3'")
        return True
    except Exception as e:
        print(f"❌ Voice generation failed: {e}")
        return False

def test_audio_mixing():
    """Test audio mixing functionality"""
    print("\n🧪 Testing audio mixing...")
    
    # Load environment variables
    load_dotenv()
    
    # Initialize generator
    generator = PodcastGenerator()
    
    try:
        # Create test audio segments
        intro_audio = generator.load_intro_audio("Podcast Intro.mp3")
        voice_audio = AudioSegment.silent(duration=5000)  # 5 seconds of silence for testing
        
        # Mix audio
        final_audio = generator.mix_audio(intro_audio, voice_audio)
        
        print("✅ Audio mixing successful!")
        print(f"Final audio duration: {len(final_audio)} ms")
        
        # Export test file
        final_audio.export("test_mixed_audio.mp3", format="mp3")
        print("✅ Test mixed audio saved as 'test_mixed_audio.mp3'")
        return True
    except Exception as e:
        print(f"❌ Audio mixing failed: {e}")
        return False

def test_firebase_connection():
    """Test Firebase connection"""
    print("\n🧪 Testing Firebase connection...")
    
    try:
        # Load environment variables
        load_dotenv()
        
        # Initialize generator
        generator = PodcastGenerator()
        
        # Test Firestore connection
        users = generator.db.collection('users').limit(1).stream()
        user_count = len(list(users))
        
        print("✅ Firebase connection successful!")
        print(f"Found {user_count} users in database")
        return True
    except Exception as e:
        print(f"❌ Firebase connection failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Dekr Podcast Generator Tests")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Check if required environment variables are set
    required_vars = ['OPENAI_API_KEY', 'ELEVENLABS_API_KEY']
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {missing_vars}")
        print("Please update your .env file with the required API keys.")
        return
    
    # Run tests
    tests = [
        test_script_generation,
        test_voice_generation,
        test_audio_mixing,
        test_firebase_connection
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! The podcast generator is ready to use.")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main()
