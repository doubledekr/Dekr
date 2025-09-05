# ElevenLabs Setup Guide for Dekr Podcast Generation

## 🎙️ What You Need to Do

### 1. **Get Your ElevenLabs API Key**

1. Go to [ElevenLabs.io](https://elevenlabs.io)
2. Sign up for an account (free tier available)
3. Go to your Profile → API Keys
4. Create a new API key
5. Copy the API key (starts with `sk_`)

### 2. **Configure Your Environment**

1. **Update your `.env` file** in the project root:
   ```bash
   EXPO_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

2. **Restart your Expo development server**:
   ```bash
   npx expo start --clear
   ```

### 3. **Choose Your Voice**

The system uses these voice IDs by default:
- `vDchjyOZZytffNeZXfZK` - Default voice (Kai Ryssdal style)
- You can find more voices in your ElevenLabs dashboard

To use a different voice:
1. Go to ElevenLabs → Voice Library
2. Find a voice you like
3. Copy the Voice ID
4. Update the `preferredVoiceId` in your user profile

### 4. **Test the Integration**

1. Open your app
2. Go to the Newsletter tab
3. Click the **"Generate Podcast"** button (microphone icon)
4. Wait for the voice generation (takes 10-30 seconds)
5. The audio player should appear with your generated podcast

## 🔧 Troubleshooting

### **"API key not configured" Error**
- Make sure your `.env` file has the correct API key
- Restart the Expo server after updating `.env`
- Check that the key starts with `sk_`

### **"ElevenLabs API error" Messages**
- Check your API key is valid
- Ensure you have credits remaining in your ElevenLabs account
- Check the console for detailed error messages

### **Audio Not Playing**
- The generated audio is stored as a blob URL
- Make sure your device supports MP3 playback
- Check browser console for audio errors

### **Voice Quality Issues**
- Try different voice IDs from ElevenLabs
- Adjust voice settings in the code (stability, similarity_boost)
- Use shorter scripts for better quality

## 💰 Pricing

**ElevenLabs Free Tier:**
- 10,000 characters per month
- 3 custom voices
- Standard quality

**Paid Plans:**
- Starter: $5/month - 30,000 characters
- Creator: $22/month - 100,000 characters
- Pro: $99/month - 500,000 characters

## 🎯 Voice Settings Explained

```javascript
voice_settings: {
  stability: 0.5,        // 0.0-1.0, higher = more consistent
  similarity_boost: 0.5, // 0.0-1.0, higher = closer to original voice
  style: 0.0,           // 0.0-1.0, higher = more expressive
  use_speaker_boost: true // Enhances voice clarity
}
```

## 🚀 Next Steps

1. **Test with your API key** - Generate a few podcasts to test quality
2. **Choose your preferred voice** - Try different voices to find the best fit
3. **Adjust voice settings** - Fine-tune the voice parameters
4. **Set up Firebase Storage** - For permanent podcast storage
5. **Add intro music** - Upload your intro stingers to the audio files directory

## 📞 Support

If you're having issues:
1. Check the browser console for error messages
2. Verify your ElevenLabs account has credits
3. Test with a simple script first
4. Check the ElevenLabs API documentation

The system is now ready to generate real podcasts with ElevenLabs voice synthesis! 🎧
