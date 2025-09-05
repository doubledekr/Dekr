import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface WebAudioPlayerProps {
  audioUrl: string;
  title: string;
  transcript?: string;
}

export default function WebAudioPlayer({ audioUrl, title, transcript }: WebAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;

    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e: any) => {
      console.error('Audio error:', e);
      console.error('Failed to load audio from:', audioUrl);
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        console.log('Attempting to play audio from:', audioUrl);
        
        // Set the audio source if not already set
        if (!audioRef.current.src || audioRef.current.src !== audioUrl) {
          audioRef.current.src = audioUrl;
          console.log('Set audio source to:', audioRef.current.src);
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
        setIsLoading(false);
        console.log('Audio started playing successfully');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      console.error('Audio URL was:', audioUrl);
      setIsLoading(false);
      setIsPlaying(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: any) => {
    if (!audioRef.current) return;
    
    const rect = event.target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
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
          
          <View style={styles.progressBarContainer}>
            <View 
              style={styles.progressBar}
              // @ts-ignore - Web-specific event handling
              onClick={handleSeek}
            >
              <View 
                style={[
                  styles.progressFill, 
                  { width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }
                ]} 
              />
            </View>
          </View>
          
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
    cursor: 'pointer',
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
