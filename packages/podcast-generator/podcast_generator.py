#!/usr/bin/env python3
"""
Weekly Podcast Generator for Dekr Trading Community
Generates personalized audio newsletters using OpenAI + ElevenLabs + Firebase
"""

import os
import json
import random
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import tempfile
import logging

import firebase_admin
from firebase_admin import credentials, firestore, storage
import requests
import openai
from pydub import AudioSegment
from pydub.effects import normalize
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PodcastGenerator:
    def __init__(self):
        """Initialize the podcast generator with API keys and Firebase connection"""
        
        # Initialize OpenAI
        self.openai_client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY', 'your-openai-key-here')
        )
        
        # ElevenLabs configuration
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY', '')
        self.elevenlabs_base_url = 'https://api.elevenlabs.io/v1'
        
        # Initialize Firebase
        self.init_firebase()
        
        # Available intro stingers
        self.intro_stingers = [
            'Podcast Intro.mp3',
            'Fashion Podcast Intro.mp3',
            # Add more intro files as needed
        ]
        
        # Intro files directory
        self.intro_dir = '/mnt/data'  # Update this path as needed
        
    def init_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            # Try to use service account key file
            if os.path.exists('firebase-service-account.json'):
                cred = credentials.Certificate('firebase-service-account.json')
                firebase_admin.initialize_app(cred, {
                    'storageBucket': 'alpha-orbit.appspot.com'
                })
            else:
                # Use default credentials (for local development)
                firebase_admin.initialize_app()
                
            self.db = firestore.client()
            self.bucket = storage.bucket()
            logger.info("Firebase initialized successfully")
            
        except Exception as e:
            logger.error(f"Firebase initialization failed: {e}")
            raise
    
    def generate_podcast_script(self, user_preferences: Dict, market_data: Dict) -> str:
        """Generate personalized podcast script using OpenAI"""
        
        system_prompt = """You are Kai Ryssdal, the host of NPR's Marketplace. You're creating a personalized 3-minute weekly podcast for a trading community member. Your style is conversational, engaging, and makes complex financial topics accessible.

Key characteristics of your voice:
- Conversational and approachable, like talking to a friend
- Uses analogies and everyday language to explain complex concepts
- Includes subtle humor and wit
- Makes data-driven points but keeps them accessible
- Ends with actionable insights or questions for reflection
- Uses phrases like "Here's the thing," "Let me put this in perspective," "Here's what's really interesting"

Format the script for audio delivery:
- Use natural speech patterns and pauses
- Include verbal cues like "Well," "Now," "Here's where it gets interesting"
- Keep sentences shorter for audio consumption
- Use emphasis and pacing cues in brackets like [pause] or [emphasis]
- Target length: 2-3 minutes when read aloud (approximately 400-600 words)

Structure:
1. Personal greeting and week overview
2. Market highlights with community context
3. Key insights or trends
4. Actionable takeaway or question for the week ahead
5. Sign-off with encouragement"""

        user_prompt = f"""Create a personalized weekly podcast script for a community member with these preferences:

User Profile:
- Email: {user_preferences.get('email', 'Community Member')}
- Preferred content: {json.dumps(user_preferences.get('podcastPreferences', {}))}
- Last podcast: {'Previous podcast available' if user_preferences.get('lastPodcast') else 'First-time listener'}

Market Context:
- Community size: 1,250 active members
- This week's performance: Strong tech sector gains
- Top performers: Alex Chen (12.5% return), Sarah Johnson (9.8% return)
- Trending stocks: AAPL, TSLA with strong community recommendations
- Fed decision: Rates held steady with dovish commentary

Make it feel personal and relevant to their trading journey. Include specific numbers and insights that would be valuable to someone actively trading and learning."""

        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return response.choices[0].message.content or self.get_fallback_script()
            
        except Exception as e:
            logger.error(f"Error generating script: {e}")
            return self.get_fallback_script()
    
    def get_fallback_script(self) -> str:
        """Fallback script if OpenAI fails"""
        return """Well, well, well... if you're listening to this, you've made it through another week in the markets, and let me tell you, what a week it's been. Welcome to your personalized Dekr Weekly podcast.

Here's the thing about this week - our community absolutely crushed it. We're talking about 1,250 smart people all looking at the same data and coming to remarkably similar conclusions. That's not luck, folks, that's collective intelligence in action.

Leading the charge this week is Alex Chen with a 12.5% return and 85.2% prediction accuracy. That's the kind of consistency that makes Wall Street take notice. Not to be outdone, Sarah Johnson delivered a solid 9.8% return with a 78.9% accuracy rate.

Here's where it gets interesting - the markets had themselves quite the week. The S&P 500 gained 2.3%, the NASDAQ popped 3.1%, and here's the kicker - our community saw it coming. I'm talking about 78% accuracy in the tech sector alone.

Apple and Tesla were the talk of the town this week, with 45 and 38 recommendations respectively. But here's what's really compelling - these weren't just blind recommendations. They came with data, with analysis, with actual reasoning behind them.

The Fed's latest move - holding rates steady with some surprisingly dovish commentary - sent ripples through the financial sector. But our community had already positioned themselves for exactly this scenario.

Here's what I want you to take away from this week's performance: we're not just building a trading community here, we're building a learning community. We're building a place where smart people can share ideas, test strategies, and yes, make money together.

The markets will do what the markets do - they'll go up, they'll go down, they'll make you question everything you thought you knew. But this community? This community is different. This community is thinking, learning, and adapting.

And that, my friends, is how you build wealth that lasts.

Until next week, keep your charts close and your stop-losses closer. This is your Dekr Weekly, and I'll see you on the trading floor."""
    
    def generate_voice(self, script: str, voice_id: str) -> bytes:
        """Generate voice using ElevenLabs API"""
        
        url = f"{self.elevenlabs_base_url}/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.elevenlabs_api_key
        }
        
        data = {
            "text": script,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.5
            }
        }
        
        try:
            response = requests.post(url, json=data, headers=headers)
            response.raise_for_status()
            return response.content
            
        except Exception as e:
            logger.error(f"Error generating voice: {e}")
            raise
    
    def select_random_intro(self) -> str:
        """Select a random intro stinger"""
        return random.choice(self.intro_stingers)
    
    def load_intro_audio(self, intro_filename: str) -> AudioSegment:
        """Load intro audio file"""
        intro_path = os.path.join(self.intro_dir, intro_filename)
        
        if not os.path.exists(intro_path):
            logger.warning(f"Intro file not found: {intro_path}, using silence")
            return AudioSegment.silent(duration=3000)  # 3 seconds of silence
        
        return AudioSegment.from_mp3(intro_path)
    
    def mix_audio(self, intro_audio: AudioSegment, voice_audio: AudioSegment) -> AudioSegment:
        """Mix intro and voice audio with fade effects"""
        
        # Apply 3-second fade-out to intro
        intro_faded = intro_audio.fade_out(3000)
        
        # Normalize voice audio
        voice_normalized = normalize(voice_audio)
        
        # Overlay voice starting at the beginning (intro fades as voice begins)
        final_audio = intro_faded.overlay(voice_normalized, position=0)
        
        # Ensure intro is slightly quieter (-6dB)
        intro_volume_adjusted = intro_faded - 6
        final_audio = intro_volume_adjusted.overlay(voice_normalized, position=0)
        
        return final_audio
    
    def upload_to_firebase_storage(self, uid: str, audio_data: bytes) -> str:
        """Upload podcast to Firebase Storage"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"podcast_{timestamp}.mp3"
        blob_path = f"podcasts/{uid}/{filename}"
        
        try:
            blob = self.bucket.blob(blob_path)
            blob.upload_from_string(audio_data, content_type='audio/mpeg')
            
            # Make the blob publicly accessible
            blob.make_public()
            
            return blob.public_url
            
        except Exception as e:
            logger.error(f"Error uploading to Firebase Storage: {e}")
            raise
    
    def should_generate_podcast(self, user_data: Dict) -> bool:
        """Check if user needs a new podcast (weekly check)"""
        
        if not user_data.get('lastPodcast'):
            return True  # First podcast
        
        last_podcast = user_data['lastPodcast']
        if hasattr(last_podcast, 'timestamp'):
            last_podcast_date = last_podcast.timestamp()
        else:
            last_podcast_date = last_podcast
        
        now = datetime.now()
        days_since_last = (now - last_podcast_date).days
        
        return days_since_last >= 7  # Weekly
    
    def generate_podcast(self, uid: str) -> Dict:
        """Generate complete podcast for a user"""
        
        try:
            logger.info(f"Generating podcast for user: {uid}")
            
            # 1. Get user data
            user_doc = self.db.collection('users').doc(uid).get()
            if not user_doc.exists:
                raise ValueError(f"User {uid} not found")
            
            user_data = user_doc.to_dict()
            voice_id = user_data.get('preferredVoiceId', 'vDchjyOZZytffNeZXfZK')
            
            # 2. Generate script
            script = self.generate_podcast_script(user_data, {})
            
            # 3. Generate voice
            voice_audio_data = self.generate_voice(script, voice_id)
            
            # 4. Load and process intro
            intro_filename = self.select_random_intro()
            intro_audio = self.load_intro_audio(intro_filename)
            
            # 5. Convert voice data to AudioSegment
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_voice:
                temp_voice.write(voice_audio_data)
                temp_voice.flush()
                voice_audio = AudioSegment.from_mp3(temp_voice.name)
                os.unlink(temp_voice.name)
            
            # 6. Mix audio
            final_audio = self.mix_audio(intro_audio, voice_audio)
            
            # 7. Export final audio
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_final:
                final_audio.export(temp_final.name, format='mp3')
                with open(temp_final.name, 'rb') as f:
                    final_audio_data = f.read()
                os.unlink(temp_final.name)
            
            # 8. Upload to Firebase Storage
            audio_url = self.upload_to_firebase_storage(uid, final_audio_data)
            
            # 9. Create podcast document
            podcast_data = {
                'userId': uid,
                'title': f"Weekly Market Update - {datetime.now().strftime('%B %d, %Y')}",
                'script': script,
                'audioUrl': audio_url,
                'duration': len(final_audio) / 1000,  # Duration in seconds
                'createdAt': firestore.SERVER_TIMESTAMP,
                'voiceId': voice_id,
                'introStinger': intro_filename,
                'status': 'completed'
            }
            
            # 10. Save to Firestore
            podcast_ref = self.db.collection('podcasts').add(podcast_data)
            podcast_id = podcast_ref[1].id
            
            # 11. Update user's last podcast info
            self.db.collection('users').doc(uid).update({
                'lastPodcast': firestore.SERVER_TIMESTAMP,
                'lastPodcastUrl': audio_url
            })
            
            logger.info(f"Successfully generated podcast {podcast_id} for user {uid}")
            
            return {
                'id': podcast_id,
                'userId': uid,
                'audioUrl': audio_url,
                'duration': podcast_data['duration'],
                'status': 'completed'
            }
            
        except Exception as e:
            logger.error(f"Error generating podcast for user {uid}: {e}")
            raise
    
    def run_weekly_job(self) -> Dict[str, int]:
        """Run weekly job to generate podcasts for all eligible users"""
        
        results = {'generated': 0, 'skipped': 0, 'errors': 0}
        
        try:
            # Get all users
            users = self.db.collection('users').stream()
            
            for user_doc in users:
                uid = user_doc.id
                user_data = user_doc.to_dict()
                
                try:
                    if self.should_generate_podcast(user_data):
                        self.generate_podcast(uid)
                        results['generated'] += 1
                        logger.info(f"Generated podcast for user: {uid}")
                    else:
                        results['skipped'] += 1
                        logger.info(f"Skipped user {uid} - not time for new podcast yet")
                        
                except Exception as e:
                    logger.error(f"Error processing user {uid}: {e}")
                    results['errors'] += 1
            
            logger.info(f"Weekly podcast job completed: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Error running weekly podcast job: {e}")
            raise

# FastAPI app for endpoints
app = FastAPI(title="Dekr Podcast Generator", version="1.0.0")

# Initialize generator
generator = PodcastGenerator()

@app.post("/generate-podcast/{uid}")
async def generate_podcast_endpoint(uid: str):
    """Generate podcast for a specific user"""
    try:
        result = generator.generate_podcast(uid)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/run-weekly-job")
async def run_weekly_job_endpoint():
    """Run weekly job to generate podcasts for all eligible users"""
    try:
        results = generator.run_weekly_job()
        return {"success": True, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user-podcasts/{uid}")
async def get_user_podcasts(uid: str, limit: int = 10):
    """Get podcast history for a user"""
    try:
        podcasts = generator.db.collection('podcasts')\
            .where('userId', '==', uid)\
            .order_by('createdAt', direction=firestore.Query.DESCENDING)\
            .limit(limit)\
            .stream()
        
        podcast_list = []
        for podcast in podcasts:
            podcast_data = podcast.to_dict()
            podcast_data['id'] = podcast.id
            podcast_list.append(podcast_data)
        
        return {"success": True, "podcasts": podcast_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run the FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)
