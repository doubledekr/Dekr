# Dekr Podcast Generator

A Python service that generates personalized weekly audio newsletters for the Dekr trading community using OpenAI for script generation and ElevenLabs for voice synthesis.

## Features

- 🎙️ **Personalized Scripts**: Uses OpenAI GPT-4 to generate Kai Ryssdal-style market commentary
- 🗣️ **Voice Synthesis**: ElevenLabs API for high-quality voice generation
- 🎵 **Audio Mixing**: Combines intro stingers with voice narration using pydub
- 🔥 **Firebase Integration**: Stores podcasts in Firebase Storage and metadata in Firestore
- ⏰ **Automated Scheduling**: Weekly job to generate podcasts for all eligible users
- 🌐 **REST API**: FastAPI endpoints for podcast generation and management

## Setup

### 1. Install Dependencies

```bash
# Install Python requirements
pip install -r requirements.txt

# Or run the setup script
python setup.py
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your API keys:

```bash
cp .env.example .env
```

Update the following variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ELEVENLABS_API_KEY`: Your ElevenLabs API key
- `FIREBASE_PROJECT_ID`: Your Firebase project ID

### 3. Firebase Setup

1. Download your Firebase service account key from the Firebase Console
2. Save it as `firebase-service-account.json` in the project root
3. Or update the template file created by the setup script

### 4. Audio Files

Add your intro stinger MP3 files to the `audio_files` directory:
- `Podcast Intro.mp3`
- `Fashion Podcast Intro.mp3`
- Add more as needed

## Usage

### Development Server

```bash
# Start the FastAPI development server
uvicorn podcast_generator:app --reload

# Or run directly
python podcast_generator.py
```

### API Endpoints

#### Generate Podcast for User
```bash
POST /generate-podcast/{uid}
```

#### Run Weekly Job
```bash
POST /run-weekly-job
```

#### Get User Podcasts
```bash
GET /user-podcasts/{uid}?limit=10
```

#### Health Check
```bash
GET /health
```

### Programmatic Usage

```python
from podcast_generator import PodcastGenerator

# Initialize generator
generator = PodcastGenerator()

# Generate podcast for a specific user
result = generator.generate_podcast("user123")

# Run weekly job for all users
results = generator.run_weekly_job()
```

## User Data Structure

Users in Firestore should have this structure:

```json
{
  "uid": "user123",
  "email": "user@example.com",
  "preferredVoiceId": "vDchjyOZZytffNeZXfZK",
  "podcastPreferences": {
    "includeMarketAnalysis": true,
    "includeCommunityHighlights": true,
    "includeEducationalContent": true,
    "includePersonalizedInsights": true,
    "preferredLength": "medium"
  },
  "lastPodcast": "2025-01-15T10:00:00Z",
  "lastPodcastUrl": "https://storage.googleapis.com/..."
}
```

## Podcast Generation Process

1. **Script Generation**: OpenAI GPT-4 creates personalized Kai Ryssdal-style commentary
2. **Voice Synthesis**: ElevenLabs converts script to high-quality audio
3. **Audio Mixing**: pydub combines intro stinger with voice narration
4. **Storage**: Final MP3 uploaded to Firebase Storage
5. **Metadata**: Podcast info saved to Firestore

## Deployment

### Local Development
```bash
python podcast_generator.py
```

### Production (Docker)
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "podcast_generator:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Firebase Functions
The service can be deployed as a Firebase Cloud Function for automated weekly execution.

## Configuration

### Voice Settings
- **Stability**: 0.5 (balanced between consistency and expressiveness)
- **Similarity Boost**: 0.5 (maintains voice characteristics)
- **Model**: eleven_monolingual_v1

### Audio Processing
- **Intro Fade**: 3-second fade-out
- **Volume Adjustment**: Intro -6dB relative to voice
- **Format**: MP3, 44.1kHz

## Troubleshooting

### Common Issues

1. **Firebase Authentication**: Ensure service account key is valid
2. **ElevenLabs API**: Check API key and rate limits
3. **Audio Files**: Verify intro files exist and are valid MP3s
4. **Dependencies**: Ensure ffmpeg is installed for pydub

### Logs
Check the console output for detailed error messages and processing logs.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
