import OpenAI from 'openai';
import { firestore } from './firebase';
import { Platform } from 'react-native';
import { logEvent, AnalyticsEvents } from './analytics';

export interface PodcastData {
  id: string;
  userId: string;
  title: string;
  script: string;
  audioUrl: string;
  duration: number;
  createdAt: any;
  voiceId: string;
  introStinger: string;
  backgroundMusic: string;
  status: 'generating' | 'completed' | 'failed';
}

export interface UserPodcastPreferences {
  uid: string;
  email: string;
  preferredVoiceId: string;
  weeklyScript?: string;
  lastPodcast?: any;
  lastPodcastUrl?: string;
  podcastPreferences: {
    includeMarketAnalysis: boolean;
    includeCommunityHighlights: boolean;
    includeEducationalContent: boolean;
    includePersonalizedInsights: boolean;
    preferredLength: 'short' | 'medium' | 'long'; // 2min, 3min, 5min
  };
  // Additional properties for demo users
  preferredLength?: 'short' | 'medium' | 'long';
  interests?: string[];
  experienceLevel?: string;
}

export class PodcastService {
  private openai: OpenAI;
  private db: any;
  private storage: any;
  private elevenLabsApiKey: string;
  private elevenLabsBaseUrl: string = 'https://api.elevenlabs.io/v1';

  // Available intro stingers
  private introStingers: string[] = [
    'Podcast Intro.mp3',
    'Fashion Podcast Intro.mp3',
    // Add more intro files as needed
  ];

  // Available intro tracks
  private introTracks: string[] = [
    'Podcast Intro.mp3',
    'Fashion Podcast Intro.mp3',
  ];

  // Available outro tracks
  private outroTracks: string[] = [
    'Podcast Intro.mp3',
    'Fashion Podcast Intro.mp3',
  ];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    this.db = firestore;
    this.elevenLabsApiKey = process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '';
    
    // Initialize Firebase Storage
    if (Platform.OS === 'web') {
      const { getStorage } = require('firebase/storage');
      this.storage = getStorage();
    } else {
      // For React Native, we'll use a fallback approach
      this.storage = null;
    }
  }

  // Platform-aware timestamp helpers
  private createTimestamp(date: Date): any {
    if (Platform.OS === 'web') {
      const { Timestamp } = require('firebase/firestore');
      return Timestamp.fromDate(date);
    } else {
      const firestoreNS = require('@react-native-firebase/firestore');
      return firestoreNS.Timestamp.fromDate(date);
    }
  }

  private getServerTimestamp(): any {
    if (Platform.OS === 'web') {
      const { serverTimestamp } = require('firebase/firestore');
      return serverTimestamp();
    } else {
      const firestoreNS = require('@react-native-firebase/firestore');
      return firestoreNS.FieldValue.serverTimestamp();
    }
  }

  // Generate personalized podcast script using OpenAI
  private async generatePodcastScript(userPreferences: UserPodcastPreferences, marketData: any): Promise<string> {
    const systemPrompt = `You're creating a personalized 3-minute weekly podcast for a trading community member. Your style is conversational, engaging, and makes complex financial topics accessible - similar to how a skilled financial journalist would present market insights.

Key characteristics of your voice:
- Conversational and approachable, like talking to a friend
- Uses analogies and everyday language to explain complex concepts
- Includes subtle humor and wit
- Makes data-driven points but keeps them accessible
- Ends with actionable insights or questions for reflection
- Uses phrases like "Here's the thing," "Let me put this in perspective," "Here's what's really interesting"

Dynamic and emotional delivery:
- Vary your tone and pace for emphasis
- Use emotional language that conveys excitement, concern, or confidence
- Include dramatic pauses and emphasis on key points
- Build tension and release it with insights
- Use exclamations and questions to engage listeners
- Create emotional peaks and valleys in your delivery

Format the script for audio delivery:
- Use natural speech patterns and pauses
- Include verbal cues like "Well," "Now," "Here's where it gets interesting"
- Keep sentences shorter for audio consumption
- Write in natural conversational flow without production notes or direction cues
- Target length: 2-3 minutes when read aloud (approximately 400-600 words)

Structure:
1. Personal greeting and week overview
2. Market highlights with community context
3. Key insights or trends
4. Actionable takeaway or question for the week ahead
5. Sign-off with encouragement`;

    const userPrompt = `Create a personalized weekly podcast script for a community member with these preferences:

User Profile:
- Email: ${userPreferences.email}
- Preferred content: ${JSON.stringify(userPreferences.podcastPreferences)}
- Last podcast: ${userPreferences.lastPodcast ? 'Previous podcast available' : 'First-time listener'}

Market Context:
- Community size: 1,250 active members
- This week's performance: Strong tech sector gains
- Top performers: Alex Chen (12.5% return), Sarah Johnson (9.8% return)
- Trending stocks: Apple (AAPL), Tesla (TSLA) with strong community recommendations
- Fed decision: Rates held steady with dovish commentary

Create a conversational, engaging script that makes complex financial topics accessible. Use a friendly, approachable tone similar to how a skilled financial journalist would present market insights. Make it feel personal and relevant to their trading journey. Include specific numbers and insights that would be valuable to someone actively trading and learning.

IMPORTANT: 
- Always mention company names alongside ticker symbols (e.g., "Apple (AAPL)", "Tesla (TSLA)")
- End the podcast with a mention of "Dekr" (pronounced "Decker") to impress the community
- Write the script as natural spoken dialogue only. Do not include any production notes, direction cues, or bracketed instructions like [pause], [emphasis], [pause for laughter], etc. The script should flow naturally as if someone is speaking directly to the listener.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      return completion.choices[0].message.content || this.getFallbackScript();
    } catch (error) {
      console.error('Error generating podcast script:', error);
      return this.getFallbackScript();
    }
  }

  // Fallback script if OpenAI fails
  private getFallbackScript(): string {
    return `Well, well, well... if you're listening to this, you've made it through another week in the markets, and let me tell you, what a week it's been. Welcome to your personalized Dekr Weekly podcast.

Here's the thing about this week - our community absolutely crushed it. We're talking about 1,250 smart people all looking at the same data and coming to remarkably similar conclusions. That's not luck, folks, that's collective intelligence in action.

Leading the charge this week is Alex Chen with a 12.5% return and 85.2% prediction accuracy. That's the kind of consistency that makes Wall Street take notice. Not to be outdone, Sarah Johnson delivered a solid 9.8% return with a 78.9% accuracy rate.

Here's where it gets interesting - the markets had themselves quite the week. The S&P 500 gained 2.3%, the NASDAQ popped 3.1%, and here's the kicker - our community saw it coming. I'm talking about 78% accuracy in the tech sector alone.

Apple (AAPL) and Tesla (TSLA) were the talk of the town this week, with 45 and 38 recommendations respectively. But here's what's really compelling - these weren't just blind recommendations. They came with data, with analysis, with actual reasoning behind them.

The Fed's latest move - holding rates steady with some surprisingly dovish commentary - sent ripples through the financial sector. But our community had already positioned themselves for exactly this scenario.

Here's what I want you to take away from this week's performance: we're not just building a trading community here, we're building a learning community. We're building a place where smart people can share ideas, test strategies, and yes, make money together.

The markets will do what the markets do - they'll go up, they'll go down, they'll make you question everything you thought you knew. But this community? This community is different. This community is thinking, learning, and adapting.

And that, my friends, is how you build wealth that lasts.

Until next week, keep your charts close and your stop-losses closer. This is your Dekr Weekly, and I'll see you on the trading floor. Thanks for being part of the Dekr community - that's D-E-K-R, pronounced "Decker" - where smart traders come to learn, share, and succeed together.`;
  }

  // Generate voice using ElevenLabs API
  private async generateVoice(script: string, voiceId: string): Promise<ArrayBuffer> {
    try {
      console.log('Generating voice with ElevenLabs API...');
      console.log('Script length:', script.length);
      console.log('Voice ID:', voiceId);
      
      // Check if API key is available
      if (!this.elevenLabsApiKey || this.elevenLabsApiKey === 'your-elevenlabs-api-key-here') {
        throw new Error('ElevenLabs API key not configured. Please add EXPO_PUBLIC_ELEVENLABS_API_KEY to your .env file.');
      }

      const response = await fetch(`${this.elevenLabsBaseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.3, // Lower stability for more variation and expressiveness
            similarity_boost: 0.7, // Higher similarity to maintain voice character
            style: 0.4, // Higher style for more emotional expression
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', response.status, errorText);
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      console.log('Voice generation successful, audio size:', audioBuffer.byteLength);
      
      return audioBuffer;
    } catch (error) {
      console.error('Error generating voice:', error);
      throw error;
    }
  }

  // Select random intro stinger
  private selectRandomIntro(): string {
    const randomIndex = Math.floor(Math.random() * this.introStingers.length);
    return this.introStingers[randomIndex];
  }

  // Select random intro track
  private selectRandomIntroTrack(): string {
    const randomIndex = Math.floor(Math.random() * this.introTracks.length);
    return this.introTracks[randomIndex];
  }

  // Select random outro track
  private selectRandomOutroTrack(): string {
    const randomIndex = Math.floor(Math.random() * this.outroTracks.length);
    return this.outroTracks[randomIndex];
  }

  // Load intro stinger from assets
  private async loadIntroStinger(fileName: string): Promise<ArrayBuffer> {
    try {
      console.log(`Loading intro stinger: ${fileName}`);
      
      // Try multiple paths for the intro stinger
      const possiblePaths = [
        `/audio/${fileName}`,  // Public directory
        `/assets/audio/${fileName}`,  // Assets directory
        `./audio/${fileName}`,  // Relative path
        `./assets/audio/${fileName}`  // Relative assets path
      ];
      
      let response: Response | null = null;
      let lastError: Error | null = null;
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying path: ${path}`);
          response = await fetch(path);
          if (response.ok) {
            console.log(`Successfully loaded from: ${path}`);
            break;
          }
        } catch (error) {
          lastError = error as Error;
          console.log(`Failed to load from ${path}:`, error);
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to load intro stinger from any path. Last error: ${lastError?.message || 'Unknown error'}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Loaded intro stinger: ${fileName}, size: ${arrayBuffer.byteLength} bytes`);
      
      return arrayBuffer;
    } catch (error) {
      console.error(`Error loading intro stinger ${fileName}:`, error);
      // Return empty buffer as fallback
      return new ArrayBuffer(0);
    }
  }

  // Load intro track from assets
  private async loadIntroTrack(fileName: string): Promise<ArrayBuffer> {
    try {
      console.log(`Loading intro track: ${fileName}`);
      
      // Try multiple paths for the intro track
      const possiblePaths = [
        `/audio/${fileName}`,  // Public directory
        `/assets/audio/${fileName}`,  // Assets directory
        `./audio/${fileName}`,  // Relative path
        `./assets/audio/${fileName}`  // Relative assets path
      ];
      
      let response: Response | null = null;
      let lastError: Error | null = null;
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying path: ${path}`);
          response = await fetch(path);
          if (response.ok) {
            console.log(`Successfully loaded from: ${path}`);
            break;
          }
        } catch (error) {
          lastError = error as Error;
          console.log(`Failed to load from ${path}:`, error);
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to load intro track from any path. Last error: ${lastError?.message || 'Unknown error'}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Loaded intro track: ${fileName}, size: ${arrayBuffer.byteLength} bytes`);
      
      return arrayBuffer;
    } catch (error) {
      console.error(`Error loading intro track ${fileName}:`, error);
      // Return empty buffer as fallback
      return new ArrayBuffer(0);
    }
  }

  // Load outro track from assets
  private async loadOutroTrack(fileName: string): Promise<ArrayBuffer> {
    try {
      console.log(`Loading outro track: ${fileName}`);
      
      // Try multiple paths for the outro track
      const possiblePaths = [
        `/audio/${fileName}`,  // Public directory
        `/assets/audio/${fileName}`,  // Assets directory
        `./audio/${fileName}`,  // Relative path
        `./assets/audio/${fileName}`  // Relative assets path
      ];
      
      let response: Response | null = null;
      let lastError: Error | null = null;
      
      for (const path of possiblePaths) {
        try {
          console.log(`Trying path: ${path}`);
          response = await fetch(path);
          if (response.ok) {
            console.log(`Successfully loaded from: ${path}`);
            break;
          }
        } catch (error) {
          lastError = error as Error;
          console.log(`Failed to load from ${path}:`, error);
        }
      }
      
      if (!response || !response.ok) {
        throw new Error(`Failed to load outro track from any path. Last error: ${lastError?.message || 'Unknown error'}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Loaded outro track: ${fileName}, size: ${arrayBuffer.byteLength} bytes`);
      
      return arrayBuffer;
    } catch (error) {
      console.error(`Error loading outro track ${fileName}:`, error);
      // Return empty buffer as fallback
      return new ArrayBuffer(0);
    }
  }

  // Mix audio with simple approach: music plays once starting with voice
  private async mixAudio(introStingerBuffer: ArrayBuffer, voiceBuffer: ArrayBuffer, introTrackBuffer: ArrayBuffer, outroTrackBuffer: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      console.log('Mixing audio with simple approach: music plays once starting with voice...');
      
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Decode audio buffers
      const introStingerAudioBuffer = introStingerBuffer.byteLength > 0 ? await audioContext.decodeAudioData(introStingerBuffer.slice(0)) : null;
      const voiceAudioBuffer = await audioContext.decodeAudioData(voiceBuffer.slice(0));
      const musicTrackAudioBuffer = introTrackBuffer.byteLength > 0 ? await audioContext.decodeAudioData(introTrackBuffer.slice(0)) : null;
      
      // Calculate timing with music starting first (no intro stinger)
      const musicDuration = musicTrackAudioBuffer ? musicTrackAudioBuffer.duration : 0;
      const voiceDuration = voiceAudioBuffer.duration;
      
      // Timing: music starts -> voice overlaps music -> music continues to end
      const musicStartTime = 0.0; // Start music immediately
      const voiceStartTime = musicStartTime + 2.0; // Start voice 2 seconds after music starts (overlap)
      const totalDuration = Math.max(voiceStartTime + voiceDuration, musicStartTime + musicDuration); // Use whichever is longer
      
      // Create output buffer
      const outputBuffer = audioContext.createBuffer(
        2, // Stereo
        Math.ceil(totalDuration * audioContext.sampleRate),
        audioContext.sampleRate
      );
      
      // Get audio data
      const outputData = outputBuffer.getChannelData(0);
      const outputDataRight = outputBuffer.getChannelData(1);
      const sampleRate = audioContext.sampleRate;
      
      // No intro stinger - music starts immediately
      
      // Mix music track starting first, then voice overlaps it, with fade-in at end
      if (musicTrackAudioBuffer) {
        const musicTrackData = musicTrackAudioBuffer.getChannelData(0);
        const musicStartSample = Math.floor(musicStartTime * sampleRate);
        const voiceStartSample = Math.floor(voiceStartTime * sampleRate);
        const voiceEndSample = Math.floor((voiceStartTime + voiceDuration) * sampleRate);
        const musicFadeInStartSample = Math.floor((voiceEndSample - 3.0 * sampleRate)); // Start fading in 3 seconds before voice ends
        
        for (let i = 0; i < musicTrackData.length; i++) {
          const outputIndex = musicStartSample + i;
          if (outputIndex < outputData.length) {
            let volume = 0.25; // Base music volume 25%
            
            // Duck music when voice is active (overlapping)
            if (outputIndex >= voiceStartSample && outputIndex < musicFadeInStartSample) {
              volume = 0.05; // Duck to 5% when voice is active
            }
            // Fade in music during last 3 seconds of voice
            else if (outputIndex >= musicFadeInStartSample && outputIndex < voiceEndSample) {
              const fadeInProgress = (outputIndex - musicFadeInStartSample) / (voiceEndSample - musicFadeInStartSample);
              volume = 0.05 + (0.20 * fadeInProgress); // Fade from 5% to 25% during voice end
            }
            // Music at full volume after voice ends
            else if (outputIndex >= voiceEndSample) {
              volume = 0.25; // Full volume after voice ends
            }
            
            outputData[outputIndex] += musicTrackData[i] * volume;
            outputDataRight[outputIndex] += musicTrackData[i] * volume;
          }
        }
      }
      
      // Mix voice narration with priority
      const voiceData = voiceAudioBuffer.getChannelData(0);
      const voiceStartSample = Math.floor(voiceStartTime * sampleRate);
      const voiceFadeInDuration = 0.5; // 0.5 seconds voice fade-in
      const voiceFadeInSamples = Math.floor(voiceFadeInDuration * sampleRate);
      
      for (let i = 0; i < voiceData.length; i++) {
        const outputIndex = voiceStartSample + i;
        if (outputIndex < outputData.length) {
          let voiceVolume = 1.0; // Base voice volume
          
          // Apply fade in for voice (first 0.5 seconds)
          if (i < voiceFadeInSamples) {
            voiceVolume = (i / voiceFadeInSamples) * 1.0;
          }
          
          // Voice gets priority in the mix
          outputData[outputIndex] += voiceData[i] * voiceVolume;
          outputDataRight[outputIndex] += voiceData[i] * voiceVolume;
        }
      }
      
      // Convert back to ArrayBuffer
      const offlineContext = new OfflineAudioContext(
        outputBuffer.numberOfChannels,
        outputBuffer.length,
        outputBuffer.sampleRate
      );
      
      const source = offlineContext.createBufferSource();
      source.buffer = outputBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      
      // Convert to WAV format (simplified)
      const wavBuffer = this.audioBufferToWav(renderedBuffer);
      
      console.log('Audio mixing with music fade-in at end completed successfully');
      return wavBuffer;
      
    } catch (error) {
      console.error('Error mixing audio:', error);
      // Fallback to voice only if mixing fails
      return voiceBuffer;
    }
  }

  // Convert AudioBuffer to WAV format
  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  }

  // Upload podcast to Firebase Storage
  private async uploadPodcastToStorage(uid: string, audioBuffer: ArrayBuffer): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `podcasts/${uid}/podcast_${timestamp}.mp3`;
      
      console.log(`Uploading podcast to Firebase Storage: ${fileName}`);
      console.log(`Audio size: ${audioBuffer.byteLength} bytes`);
      
      if (Platform.OS === 'web' && this.storage) {
        try {
          // Use Firebase Storage for web
          const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');
          
          // Create a reference to the file
          const storageRef = ref(this.storage, fileName);
          
          // Convert ArrayBuffer to Blob
          const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          
          // Upload the file
          console.log('Uploading to Firebase Storage...');
          const snapshot = await uploadBytes(storageRef, blob);
          console.log('Upload successful:', snapshot.metadata.name);
          
          // Get the download URL
          const downloadURL = await getDownloadURL(storageRef);
          console.log(`Generated permanent audio URL: ${downloadURL}`);
          
          return downloadURL;
        } catch (storageError) {
          console.warn('Firebase Storage upload failed, using blob URL fallback:', storageError);
          // Fall through to blob URL fallback
        }
      }
      
      // Fallback to blob URL for React Native or when storage fails
      console.log('Using blob URL fallback (temporary storage)');
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      console.log(`Generated temporary audio URL: ${audioUrl}`);
      return audioUrl;
    } catch (error) {
      console.error('Error uploading podcast to storage:', error);
      
      // Final fallback to blob URL
      console.log('All storage methods failed, using blob URL fallback');
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      console.log(`Generated fallback audio URL: ${audioUrl}`);
      return audioUrl;
    }
  }

  // Check if demo user already has a podcast
  private async getExistingDemoPodcast(): Promise<PodcastData | null> {
    try {
      if (Platform.OS === 'web') {
        const { collection, query, where, getDocs } = require('firebase/firestore');
        const podcastsRef = collection(this.db, 'podcasts');
        const q = query(
          podcastsRef,
          where('userId', '==', 'demo-user-123')
        );
        
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          // Sort by createdAt in memory to avoid composite index requirement
          const podcasts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as PodcastData));
          
          // Sort by createdAt descending and get the most recent
          podcasts.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
          });
          
          const mostRecent = podcasts[0];
          console.log('✅ Found existing demo podcast:', mostRecent.id);
          return mostRecent;
        }
      } else {
        const snapshot = await this.db.collection('podcasts')
          .where('userId', '==', 'demo-user-123')
          .get();

        if (!snapshot.empty) {
          // Sort by createdAt in memory to avoid composite index requirement
          const podcasts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as PodcastData));
          
          // Sort by createdAt descending and get the most recent
          podcasts.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
            return bTime - aTime;
          });
          
          const mostRecent = podcasts[0];
          console.log('✅ Found existing demo podcast:', mostRecent.id);
          return mostRecent;
        }
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Error checking for existing demo podcast:', error);
      return null;
    }
  }

  // Create and store the initial demo podcast
  async createInitialDemoPodcast(): Promise<PodcastData> {
    try {
      console.log('🎙️ Creating initial demo podcast...');
      
      // Check if demo podcast already exists
      const existingPodcast = await this.getExistingDemoPodcast();
      if (existingPodcast) {
        console.log('✅ Demo podcast already exists, returning existing one');
        return existingPodcast;
      }

      // Demo user preferences
      const userData: UserPodcastPreferences = {
        uid: 'demo-user-123',
        email: 'demo@dekr.com',
        preferredVoiceId: 'EozfaQ3ZX0esAp1cW5nG',
        preferredLength: 'medium',
        interests: ['trading', 'markets', 'finance'],
        experienceLevel: 'intermediate',
        podcastPreferences: {
          includeMarketAnalysis: true,
          includeCommunityHighlights: true,
          includeEducationalContent: true,
          includePersonalizedInsights: true,
          preferredLength: 'medium'
        }
      };

      // Generate script
      const script = await this.generatePodcastScript(userData, {});
      
      // Generate voice
      const voiceBuffer = await this.generateVoice(script, userData.preferredVoiceId);
      
      // Select and load intro stinger
      const introStinger = this.selectRandomIntro();
      const introStingerBuffer = await this.loadIntroStinger(introStinger);
      
      // Select and load intro track
      const introTrack = this.selectRandomIntroTrack();
      const introTrackBuffer = await this.loadIntroTrack(introTrack);
      
      // Select and load outro track
      const outroTrack = this.selectRandomOutroTrack();
      const outroTrackBuffer = await this.loadOutroTrack(outroTrack);
      
      // Mix audio
      const finalAudioBuffer = await this.mixAudio(introStingerBuffer, voiceBuffer, introTrackBuffer, outroTrackBuffer);
      
      // Upload to storage
      const audioUrl = await this.uploadPodcastToStorage('demo-user-123', finalAudioBuffer);
      
      // Create podcast document
      const podcastData: PodcastData = {
        id: `demo_podcast_${Date.now()}`,
        userId: 'demo-user-123',
        title: 'Demo Podcast - Weekly Market Update',
        script,
        audioUrl,
        duration: 180, // 3 minutes
        createdAt: this.createTimestamp(new Date()),
        voiceId: userData.preferredVoiceId,
        introStinger,
        backgroundMusic: `${introTrack} + ${outroTrack}`,
        status: 'completed'
      };

      // Save to Firestore
      if (Platform.OS === 'web') {
        const { collection, addDoc } = require('firebase/firestore');
        const podcastsRef = collection(this.db, 'podcasts');
        await addDoc(podcastsRef, podcastData);
        console.log('✅ Demo podcast saved to Firestore');
      } else {
        await this.db.collection('podcasts').add(podcastData);
        console.log('✅ Demo podcast saved to Firestore');
      }

      // Create demo user document
      const userRef = Platform.OS === 'web' 
        ? require('firebase/firestore').doc(this.db, 'users', 'demo-user-123')
        : this.db.collection('users').doc('demo-user-123');
      
      if (Platform.OS === 'web') {
        const { setDoc } = require('firebase/firestore');
        await setDoc(userRef, {
          uid: 'demo-user-123',
          email: 'demo@dekr.com',
          displayName: 'Demo User',
          lastPodcast: this.getServerTimestamp(),
          lastPodcastUrl: audioUrl,
          createdAt: this.getServerTimestamp(),
          podcastPreferences: userData.podcastPreferences
        });
      } else {
        await userRef.set({
          uid: 'demo-user-123',
          email: 'demo@dekr.com',
          displayName: 'Demo User',
          lastPodcast: this.getServerTimestamp(),
          lastPodcastUrl: audioUrl,
          createdAt: this.getServerTimestamp(),
          podcastPreferences: userData.podcastPreferences
        });
      }
      
      console.log('✅ Demo user document created in Firestore');
      console.log('🎧 Demo podcast created successfully:', podcastData.id);
      
      return podcastData;
    } catch (error) {
      console.error('Error creating initial demo podcast:', error);
      throw error;
    }
  }

  // Generate complete podcast for a user
  async generatePodcast(uid: string): Promise<PodcastData> {
    try {
      console.log('🎙️ PodcastService.generatePodcast called for user:', uid);
      
      // Check if demo user already has a podcast
      if (uid === 'demo-user-123') {
        const existingPodcast = await this.getExistingDemoPodcast();
        if (existingPodcast) {
          console.log('🎧 Returning existing demo podcast');
          return existingPodcast;
        }
      }
      
      logEvent(AnalyticsEvents.CREATE_PODCAST, {
        user_id: uid,
        timestamp: new Date().toISOString(),
      });

      // 1. Get user preferences (handle demo users)
      let userData: UserPodcastPreferences;
      let voiceId = 'EozfaQ3ZX0esAp1cW5nG'; // Default voice
      
      if (uid === 'demo-user-123') {
        // Demo user - use default preferences
        console.log('Using demo user preferences');
        userData = {
          uid: 'demo-user-123',
          email: 'demo@dekr.com',
          preferredVoiceId: 'EozfaQ3ZX0esAp1cW5nG',
          preferredLength: 'medium',
          interests: ['trading', 'markets', 'finance'],
          experienceLevel: 'intermediate',
          podcastPreferences: {
            includeMarketAnalysis: true,
            includeCommunityHighlights: true,
            includeEducationalContent: true,
            includePersonalizedInsights: true,
            preferredLength: 'medium'
          }
        };
        voiceId = userData.preferredVoiceId;
      } else {
        // Real user - get from Firestore
        const userDoc = await this.db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
          throw new Error('User not found');
        }
        userData = userDoc.data() as UserPodcastPreferences;
        voiceId = userData.preferredVoiceId || 'EozfaQ3ZX0esAp1cW5nG';
      }

      // 2. Generate script
      const script = await this.generatePodcastScript(userData, {});
      
      // 3. Generate voice
      const voiceBuffer = await this.generateVoice(script, voiceId);
      
      // 4. Select and load intro stinger
      const introStinger = this.selectRandomIntro();
      console.log(`Selected intro stinger: ${introStinger}`);
      
      // Load the intro stinger file
      const introStingerBuffer = await this.loadIntroStinger(introStinger);
      
      // 5. Select and load intro track
      const introTrack = this.selectRandomIntroTrack();
      console.log(`Selected intro track: ${introTrack}`);
      
      // Load the intro track file
      const introTrackBuffer = await this.loadIntroTrack(introTrack);
      
      // 6. Select and load outro track
      const outroTrack = this.selectRandomOutroTrack();
      console.log(`Selected outro track: ${outroTrack}`);
      
      // Load the outro track file
      const outroTrackBuffer = await this.loadOutroTrack(outroTrack);
      
      // 7. Mix audio
      const finalAudioBuffer = await this.mixAudio(introStingerBuffer, voiceBuffer, introTrackBuffer, outroTrackBuffer);
      
      // 8. Upload to storage
      const audioUrl = await this.uploadPodcastToStorage(uid, finalAudioBuffer);
      
      // 9. Create podcast document
      const podcastData: PodcastData = {
        id: `podcast_${uid}_${Date.now()}`,
        userId: uid,
        title: `Weekly Market Update - ${new Date().toLocaleDateString()}`,
        script,
        audioUrl,
        duration: 180, // 3 minutes
        createdAt: this.createTimestamp(new Date()),
        voiceId,
        introStinger,
        backgroundMusic: `${introTrack} + ${outroTrack}`, // Track both intro and outro
        status: 'completed'
      };

      // 10. Save to Firestore (including demo users for permanent storage)
      try {
        await this.db.collection('podcasts').add(podcastData);
        console.log('✅ Podcast metadata saved to Firestore');
        
        // 11. Update user's last podcast info (create demo user doc if needed)
        if (uid === 'demo-user-123') {
          // Ensure demo user document exists
          const userRef = Platform.OS === 'web' 
            ? require('firebase/firestore').doc(this.db, 'users', uid)
            : this.db.collection('users').doc(uid);
          
          if (Platform.OS === 'web') {
            const { setDoc, getDoc } = require('firebase/firestore');
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
              await setDoc(userRef, {
                uid: 'demo-user-123',
                email: 'demo@dekr.com',
                displayName: 'Demo User',
                lastPodcast: this.getServerTimestamp(),
                lastPodcastUrl: audioUrl,
                createdAt: this.getServerTimestamp()
              });
              console.log('✅ Created demo user document in Firestore');
            } else {
              await require('firebase/firestore').updateDoc(userRef, {
                lastPodcast: this.getServerTimestamp(),
                lastPodcastUrl: audioUrl
              });
              console.log('✅ Updated demo user podcast info in Firestore');
            }
          } else {
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
              await userRef.set({
                uid: 'demo-user-123',
                email: 'demo@dekr.com',
                displayName: 'Demo User',
                lastPodcast: this.getServerTimestamp(),
                lastPodcastUrl: audioUrl,
                createdAt: this.getServerTimestamp()
              });
              console.log('✅ Created demo user document in Firestore');
            } else {
              await userRef.update({
                lastPodcast: this.getServerTimestamp(),
                lastPodcastUrl: audioUrl
              });
              console.log('✅ Updated demo user podcast info in Firestore');
            }
          }
        } else {
          await this.db.collection('users').doc(uid).update({
            lastPodcast: this.getServerTimestamp(),
            lastPodcastUrl: audioUrl
          });
          console.log('✅ User podcast info updated in Firestore');
        }
      } catch (firestoreError) {
        console.warn('⚠️ Firestore operations failed, but podcast was generated:', firestoreError);
        // Continue even if Firestore fails - the podcast is still generated
      }

      logEvent(AnalyticsEvents.CREATE_PODCAST, {
        podcast_id: podcastData.id,
        user_id: uid,
        duration: podcastData.duration,
      });

      return podcastData;
    } catch (error) {
      console.error('Error generating podcast:', error);
      throw error;
    }
  }

  // Check if user needs a new podcast (weekly check)
  async shouldGeneratePodcast(uid: string): Promise<boolean> {
    try {
      const userDoc = await this.db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return false;
      }

      const userData = userDoc.data();
      if (!userData.lastPodcast) {
        return true; // First podcast
      }

      const lastPodcastDate = userData.lastPodcast.toDate();
      const now = new Date();
      const daysSinceLastPodcast = (now.getTime() - lastPodcastDate.getTime()) / (1000 * 60 * 60 * 24);

      return daysSinceLastPodcast >= 7; // Weekly
    } catch (error) {
      console.error('Error checking podcast schedule:', error);
      return false;
    }
  }

  // Run weekly job to generate podcasts for all eligible users
  async runWeeklyJob(): Promise<{ generated: number; skipped: number; errors: number }> {
    try {
      const results = { generated: 0, skipped: 0, errors: 0 };
      
      // Get all users
      const usersSnapshot = await this.db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const uid = userDoc.id;
        
        try {
          const shouldGenerate = await this.shouldGeneratePodcast(uid);
          
          if (shouldGenerate) {
            await this.generatePodcast(uid);
            results.generated++;
            console.log(`Generated podcast for user: ${uid}`);
          } else {
            results.skipped++;
            console.log(`Skipped user ${uid} - not time for new podcast yet`);
          }
        } catch (error) {
          console.error(`Error processing user ${uid}:`, error);
          results.errors++;
        }
      }

      console.log('Weekly podcast job completed:', results);
      return results;
    } catch (error) {
      console.error('Error running weekly podcast job:', error);
      throw error;
    }
  }

  // Get user's podcast history
  async getUserPodcasts(uid: string, limit: number = 10): Promise<PodcastData[]> {
    try {
      // For demo users, always return the demo podcast
      if (uid === 'demo-user-123') {
        const demoPodcast = await this.getExistingDemoPodcast();
        return demoPodcast ? [demoPodcast] : [];
      }
      
      if (Platform.OS === 'web') {
        const { collection, query, where, getDocs } = require('firebase/firestore');
        const podcastsRef = collection(this.db, 'podcasts');
        const q = query(
          podcastsRef,
          where('userId', '==', uid)
        );
        
        const snapshot = await getDocs(q);
        const podcasts = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as PodcastData));
        
        // Sort by createdAt descending and limit in memory to avoid composite index requirement
        podcasts.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        
        return podcasts.slice(0, limit);
      } else {
        const snapshot = await this.db.collection('podcasts')
          .where('userId', '==', uid)
          .get();
        
        const podcasts = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as PodcastData));
        
        // Sort by createdAt descending and limit in memory to avoid composite index requirement
        podcasts.sort((a, b) => {
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        
        return podcasts.slice(0, limit);
      }
    } catch (error) {
      console.error('Error getting user podcasts:', error);
      return [];
    }
  }

  // Update user podcast preferences
  async updateUserPreferences(uid: string, preferences: Partial<UserPodcastPreferences>): Promise<void> {
    try {
      await this.db.collection('users').doc(uid).update({
        ...preferences,
        updatedAt: this.getServerTimestamp()
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }
}

export const podcastService = new PodcastService();
