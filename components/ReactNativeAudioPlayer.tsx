import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getAudioAsset, audioAssetManager } from '../utils/audioAssets';

interface ReactNativeAudioPlayerProps {
  audioUrl: string;
  title: string;
  transcript?: string;
  stage?: number;
  lessonId?: number;
}

export default function ReactNativeAudioPlayer({ audioUrl, title, transcript, stage, lessonId }: ReactNativeAudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [audioSource, setAudioSource] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [maxRetries] = useState(3);

  // Reduced logging for cleaner console output
  console.log('🎵 ReactNativeAudioPlayer:', title, '- URL:', audioUrl);

  useEffect(() => {
    loadAudioSource();
    
    return () => {
      // Cleanup function
      if (sound) {
        console.log('🔍 ReactNativeAudioPlayer: Cleaning up sound on unmount');
        sound.unloadAsync().catch(error => {
          console.error('❌ ReactNativeAudioPlayer: Error during cleanup:', error);
        });
      }
    };
  }, [audioUrl, stage, lessonId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (sound) {
        console.log('🔍 ReactNativeAudioPlayer: Final cleanup on unmount');
        sound.unloadAsync().catch(error => {
          console.error('❌ ReactNativeAudioPlayer: Error during final cleanup:', error);
        });
      }
    };
  }, []);

  const requestAudioPermission = async () => {
    // Skip if permissions already granted
    if (permissionsGranted) {
      console.log('🎵 Audio permissions already granted, skipping...');
      return true;
    }

    try {
      console.log('🎵 Requesting audio permission');
      const { status } = await Audio.requestPermissionsAsync();
      console.log('🎵 Audio permission status:', status);
      
      if (status !== 'granted') {
        console.error('❌ Audio permission not granted');
        return false;
      }
      
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('🎵 Audio mode set successfully');
      setPermissionsGranted(true);
      return true;
    } catch (error) {
      console.error('❌ Error setting up audio:', error);
      return false;
    }
  };

  const loadAudioSource = async () => {
    try {
      setIsLoading(true);
      setRetryCount(0);

      // Try to get audio source from Firebase Storage first if stage and lessonId are provided
      if (stage && lessonId) {
        console.log(`🔄 Loading audio from Firebase Storage for lesson ${stage}_${lessonId}`);
        try {
          const firebaseSource = await audioAssetManager.getLessonAudioAsset(stage, lessonId);
          setAudioSource(firebaseSource);
          console.log('✅ Firebase Storage audio source loaded');
        } catch (firebaseError) {
          console.warn('⚠️ Firebase Storage failed, falling back to local assets:', firebaseError);
          // Fall through to local asset loading
        }
      }

      // If no Firebase source or Firebase failed, try local assets
      if (!audioSource) {
        console.log('🔄 Loading audio from local assets');
        const localSource = getAudioAsset(audioUrl);
        
        if (!localSource) {
          throw new Error('No audio source available - neither Firebase Storage nor local assets found');
        }
        
        setAudioSource(localSource);
        console.log('✅ Local audio source loaded');
      }

      // Load the audio with the determined source
      await loadAudio();
      
    } catch (error) {
      console.error('❌ ReactNativeAudioPlayer: Error loading audio source:', error);
      setIsLoading(false);
      
      // Retry logic
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying audio load (${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          loadAudioSource();
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    }
  };

  const loadAudio = async () => {
    try {
      if (!audioSource) {
        throw new Error('No audio source available');
      }

      // Request permissions first
      const hasPermissions = await requestAudioPermission();
      if (!hasPermissions) {
        console.error('❌ ReactNativeAudioPlayer: Cannot load audio without permissions');
        setIsLoading(false);
        return;
      }
      
      // Unload previous sound if exists
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (unloadError) {
          console.error('❌ ReactNativeAudioPlayer: Error unloading previous sound:', unloadError);
        }
      }
      
      // Create a new sound object
      const createOptions = { shouldPlay: false };
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioSource,
        createOptions,
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsLoading(false);
      console.log('✅ Audio loaded successfully');
    } catch (error) {
      console.error('❌ ReactNativeAudioPlayer: Error loading audio:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && status.durationMillis && !isNaN(status.durationMillis)) {
      setDuration(status.durationMillis / 1000);
      setCurrentTime(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);
      
      if (status.didJustFinish) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    } else if (status.error) {
      console.error('❌ ReactNativeAudioPlayer: Audio playback error:', status.error);
    }
  };

  const togglePlayPause = async () => {
    if (!sound || isLoading) {
      return;
    }

    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('❌ ReactNativeAudioPlayer: Error toggling playback:', error.message);
      
      // If playback fails and we have retries left, try to reload the audio
      if (retryCount < maxRetries) {
        console.log('🔄 Playback failed, attempting to reload audio...');
        setRetryCount(prev => prev + 1);
        await loadAudioSource();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = async (event: any) => {
    if (!sound) return;
    
    const { locationX } = event.nativeEvent;
    const progressBarWidth = 200; // Approximate width of progress bar
    const newTime = (locationX / progressBarWidth) * duration;
    
    try {
      await sound.setPositionAsync(newTime * 1000);
    } catch (error) {
      console.error('Error seeking:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="volume-high" size={24} color="#2563eb" />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <MaterialCommunityIcons name="loading" size={32} color="#ffffff" />
          ) : (
            <MaterialCommunityIcons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#ffffff" 
            />
          )}
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          
          <TouchableOpacity 
            style={styles.progressBarContainer}
            onPress={handleSeek}
            activeOpacity={0.7}
          >
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }
                ]} 
              />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      {transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptTitle}>Transcript:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#536B31',
    marginLeft: 8,
    fontFamily: 'Graphik-Semibold',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  playButton: {
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Graphik-Regular',
    minWidth: 40,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 2,
  },
  transcriptContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
  },
  transcriptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#536B31',
    marginBottom: 8,
    fontFamily: 'Graphik-Semibold',
  },
  transcriptText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
});
