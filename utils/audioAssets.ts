// Audio asset mapping for React Native
export const getAudioAsset = (audioUrl: string) => {
  console.log('🔊 getAudioAsset called with:', audioUrl);
  
  // Check if it's an external URL (http/https/blob)
  if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://') || audioUrl.startsWith('blob:')) {
    console.log('🔊 External URL detected, returning URL directly:', audioUrl);
    return { uri: audioUrl };
  }
  
  // Extract filename from the audioUrl, handling both /audio/filename.mp3 and filename.mp3 formats
  const filename = audioUrl.split('/').pop();
  console.log('🔊 Extracted filename:', filename);
  
  // Map filenames to their require() paths
  const audioAssets: { [key: string]: any } = {
    'lesson_1_1.mp3': require('../assets/audio/lesson_1_1.mp3'),
    'lesson_1_2.mp3': require('../assets/audio/lesson_1_2.mp3'),
    'lesson_1_3.mp3': require('../assets/audio/lesson_1_3.mp3'),
    'lesson_1_4.mp3': require('../assets/audio/lesson_1_4.mp3'),
    'lesson_1_5.mp3': require('../assets/audio/lesson_1_5.mp3'),
    'lesson_1_6.mp3': require('../assets/audio/lesson_1_6.mp3'),
    'lesson_1_7.mp3': require('../assets/audio/lesson_1_7.mp3'),
    'lesson_1_8.mp3': require('../assets/audio/lesson_1_8.mp3'),
    'lesson_2_1.mp3': require('../assets/audio/lesson_2_1.mp3'),
    'lesson_2_2.mp3': require('../assets/audio/lesson_2_2.mp3'),
    'lesson_2_3.mp3': require('../assets/audio/lesson_2_3.mp3'),
    'lesson_2_4.mp3': require('../assets/audio/lesson_2_4.mp3'),
    'lesson_2_5.mp3': require('../assets/audio/lesson_2_5.mp3'),
    'lesson_2_6.mp3': require('../assets/audio/lesson_2_6.mp3'),
    'lesson_2_7.mp3': require('../assets/audio/lesson_2_7.mp3'),
    'lesson_2_8.mp3': require('../assets/audio/lesson_2_8.mp3'),
    'lesson_2_9.mp3': require('../assets/audio/lesson_2_9.mp3'),
    'lesson_2_11.mp3': require('../assets/audio/lesson_2_11.mp3'),
    'lesson_2_12.mp3': require('../assets/audio/lesson_2_12.mp3'),
    'lesson_2_13.mp3': require('../assets/audio/lesson_2_13.mp3'),
    'lesson_2_14.mp3': require('../assets/audio/lesson_2_14.mp3'),
    'lesson_2_15.mp3': require('../assets/audio/lesson_2_15.mp3'),
    'lesson_2_16.mp3': require('../assets/audio/lesson_2_16.mp3'),
    'Fashion Podcast Intro.mp3': require('../assets/audio/Fashion Podcast Intro.mp3'),
    'Podcast Intro.mp3': require('../assets/audio/Podcast Intro.mp3'),
  };
  
  if (filename && audioAssets[filename]) {
    console.log('🔊 Found audio asset for:', filename);
    console.log('🔊 Audio asset value:', audioAssets[filename]);
    return audioAssets[filename];
  }
  
  // Fallback - return null if no mapping found
  console.warn(`❌ No audio asset found for: ${filename}`);
  console.log('🔊 Available assets:', Object.keys(audioAssets));
  console.log('🔊 Input audioUrl was:', audioUrl);
  return null;
};
