import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function SimpleAudioTest() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Add debug info to the list
  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage);
    setDebugInfo(prev => [...prev.slice(-9), debugMessage]); // Keep last 10 messages
  };

  // Check system audio capabilities on mount
  useEffect(() => {
    addDebugInfo('🔍 SimpleAudioTest: Component mounted');
    addDebugInfo(`🔍 Platform: ${Platform.OS} ${Platform.Version}`);
    
    // Check if Audio is available
    addDebugInfo(`🔍 Audio module available: ${!!Audio}`);
    addDebugInfo(`🔍 Audio.Sound available: ${!!Audio.Sound}`);
    addDebugInfo(`🔍 Audio.requestPermissionsAsync available: ${!!Audio.requestPermissionsAsync}`);
    addDebugInfo(`🔍 Audio.setAudioModeAsync available: ${!!Audio.setAudioModeAsync}`);
    
    // Check if the audio file exists
    try {
      const audioFile = require('../assets/audio/lesson_1_1.mp3');
      addDebugInfo(`🔍 Audio file require() result: ${typeof audioFile} - ${JSON.stringify(audioFile)}`);
    } catch (error) {
      addDebugInfo(`❌ Audio file require() failed: ${error.message}`);
    }
  }, []);

  const playTestAudio = async () => {
    try {
      addDebugInfo('🎵 Starting audio playback test');
      
      // Step 1: Check current audio state
      addDebugInfo(`🔍 Current sound state: ${sound ? 'exists' : 'null'}`);
      addDebugInfo(`🔍 Current playing state: ${isPlaying}`);
      
      // Step 2: Request audio permission
      addDebugInfo('🔍 Requesting audio permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      addDebugInfo(`🔍 Permission result: ${status}`);
      
      if (status !== 'granted') {
        addDebugInfo('❌ Audio permission denied');
        Alert.alert('Permission Required', 'Audio permission is required to play audio');
        return;
      }
      
      // Step 3: Set audio mode
      addDebugInfo('🔍 Setting audio mode...');
      const audioModeConfig = {
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      };
      addDebugInfo(`🔍 Audio mode config: ${JSON.stringify(audioModeConfig)}`);
      
      await Audio.setAudioModeAsync(audioModeConfig);
      addDebugInfo('✅ Audio mode set successfully');
      
      // Step 4: Clean up existing sound
      if (sound) {
        addDebugInfo('🔍 Unloading existing sound...');
        try {
          await sound.unloadAsync();
          addDebugInfo('✅ Existing sound unloaded');
        } catch (unloadError) {
          addDebugInfo(`⚠️ Error unloading existing sound: ${unloadError.message}`);
        }
        setSound(null);
      }

      // Step 5: Load audio file
      addDebugInfo('🔍 Loading audio file...');
      let audioFile;
      try {
        audioFile = require('../assets/audio/lesson_1_1.mp3');
        addDebugInfo(`🔍 Audio file loaded: ${typeof audioFile} - ${JSON.stringify(audioFile)}`);
      } catch (requireError) {
        addDebugInfo(`❌ Failed to require audio file: ${requireError.message}`);
        throw requireError;
      }
      
      // Step 6: Create sound object
      addDebugInfo('🔍 Creating Audio.Sound object...');
      const createOptions = { shouldPlay: false };
      addDebugInfo(`🔍 Create options: ${JSON.stringify(createOptions)}`);
      
      const { sound: newSound } = await Audio.Sound.createAsync(audioFile, createOptions);
      addDebugInfo(`✅ Sound object created: ${typeof newSound}`);
      addDebugInfo(`🔍 Sound object methods: ${Object.getOwnPropertyNames(newSound).join(', ')}`);
      
      // Step 7: Set up status listener
      addDebugInfo('🔍 Setting up playback status listener...');
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.durationMillis && !isNaN(status.durationMillis)) {
          addDebugInfo(`✅ Audio loaded - Duration: ${status.durationMillis}ms, Playing: ${status.isPlaying}`);
          setIsPlaying(status.isPlaying);
          
          if (status.didJustFinish) {
            addDebugInfo('✅ Audio playback finished');
            setIsPlaying(false);
          }
        } else if (status.error) {
          addDebugInfo(`❌ Audio error: ${status.error}`);
        }
      });

      // Step 8: Store sound reference
      setSound(newSound);
      addDebugInfo('✅ Sound reference stored');
      
      // Step 9: Attempt to play
      addDebugInfo('🔍 Attempting to play audio...');
      const playResult = await newSound.playAsync();
      addDebugInfo(`✅ Play command executed: ${JSON.stringify(playResult)}`);
      
      // Step 10: Check if actually playing (simplified)
      setTimeout(async () => {
        try {
          const status = await newSound.getStatusAsync();
          if (status.isLoaded) {
            addDebugInfo(`✅ Status after 1 second: Playing: ${status.isPlaying}, Duration: ${status.durationMillis}ms`);
          }
        } catch (statusError) {
          addDebugInfo(`❌ Error getting status: ${statusError.message}`);
        }
      }, 1000);
      
    } catch (error) {
      addDebugInfo(`❌ Audio playback failed: ${error.message}`);
      addDebugInfo(`❌ Error stack: ${error.stack}`);
      addDebugInfo(`❌ Error details: ${JSON.stringify(error, null, 2)}`);
      
      console.error('❌ SimpleAudioTest: Full error:', error);
      Alert.alert('Audio Error', `Failed to play audio: ${error.message || error}`);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      addDebugInfo('🔍 Stopping audio...');
      try {
        await sound.pauseAsync();
        addDebugInfo('✅ Audio paused successfully');
      } catch (error) {
        addDebugInfo(`❌ Error pausing audio: ${error.message}`);
      }
    } else {
      addDebugInfo('⚠️ No sound object to stop');
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
    addDebugInfo('🔍 Debug log cleared');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Audio Test</Text>
      <Text style={styles.subtitle}>This should play lesson_1_1.mp3 (now converted to proper MP3)</Text>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isPlaying ? '#ef4444' : '#10b981' }]}
        onPress={isPlaying ? stopAudio : playTestAudio}
      >
        <MaterialCommunityIcons 
          name={isPlaying ? "stop" : "play"} 
          size={24} 
          color="white" 
        />
        <Text style={styles.buttonText}>
          {isPlaying ? 'Stop' : 'Play'} Test Audio
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6b7280', marginTop: 10 }]}
        onPress={clearDebugInfo}
      >
        <MaterialCommunityIcons 
          name="delete" 
          size={20} 
          color="white" 
        />
        <Text style={styles.buttonText}>
          Clear Debug Log
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.status}>
        Status: {isPlaying ? 'Playing' : 'Stopped'}
      </Text>
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Log:</Text>
        {debugInfo.length === 0 ? (
          <Text style={styles.debugText}>No debug info yet. Click "Play Test Audio" to start.</Text>
        ) : (
          debugInfo.map((info, index) => (
            <Text key={index} style={styles.debugText}>{info}</Text>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    margin: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#536B31',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  status: {
    fontSize: 14,
    color: '#6b7280',
  },
  debugContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    maxHeight: 300,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#4b5563',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
    lineHeight: 14,
  },
});
