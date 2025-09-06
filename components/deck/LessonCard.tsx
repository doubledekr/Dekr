import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useTheme } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LessonCard as LessonCardType, Resource, Quiz } from '../../types/deck';
import ReactNativeAudioPlayer from '../ReactNativeAudioPlayer';
import { audioAssetManager } from '../../utils/audioAssets';
import LessonMetadataService from '../../services/LessonMetadataService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth * 0.9;
const CARD_HEIGHT = screenHeight * 0.7;

// Platform-specific native driver support
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface LessonCardProps {
  card: LessonCardType;
  onSwipe: (direction: 'left' | 'right') => void;
  onComplete: (cardId: string) => void;
  onFlip: () => void;
  isFlipped: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  progress: number;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  card,
  onSwipe,
  onComplete,
  onFlip,
  isFlipped,
  isPlaying,
  onPlayPause,
  progress,
}) => {
  const theme = useTheme();
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [audioUrl, setAudioUrl] = useState(card.audioUrl);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const lessonMetadataService = LessonMetadataService.getInstance();
  
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Load audio URL from Firebase Storage when component mounts
  useEffect(() => {
    loadAudioUrl();
  }, [card.id, card.stage]);

  const loadAudioUrl = async () => {
    if (!card.audioUrl) return;

    setIsLoadingAudio(true);
    setAudioError(null);

    try {
      // Try to get Firebase Storage URL if we have stage and lesson info
      if (card.stage && card.courseId) {
        console.log(`🔄 Loading Firebase Storage URL for lesson ${card.courseId}_${card.stage}`);
        
        try {
          const firebaseUrl = await audioAssetManager.getLessonAudioAsset(
            parseInt(card.courseId), 
            card.stage
          );
          
          if (firebaseUrl && firebaseUrl.uri) {
            setAudioUrl(firebaseUrl.uri);
            console.log('✅ Firebase Storage URL loaded successfully');
            return;
          }
        } catch (firebaseError) {
          console.warn('⚠️ Firebase Storage failed, using fallback URL:', firebaseError);
        }
      }

      // Fallback to original audioUrl
      setAudioUrl(card.audioUrl);
      console.log('✅ Using fallback audio URL');
      
    } catch (error) {
      console.error('❌ Error loading audio URL:', error);
      setAudioError('Failed to load audio');
      setAudioUrl(card.audioUrl); // Fallback to original
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'school';
      case 'intermediate': return 'chart-line';
      case 'advanced': return 'trophy';
      default: return 'help-circle';
    }
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: USE_NATIVE_DRIVER }
  );

  const handleGestureStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      if (Math.abs(translationX) > CARD_WIDTH * 0.3 || Math.abs(velocityX) > 500) {
        const direction = translationX > 0 ? 'right' : 'left';
        onSwipe(direction);
        
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: direction === 'right' ? CARD_WIDTH : -CARD_WIDTH,
            duration: 200,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: USE_NATIVE_DRIVER,
          }),
        ]).start();
      } else {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: USE_NATIVE_DRIVER,
        }).start();
      }
    }
  };

  const handleFlip = () => {
    Animated.sequence([
      Animated.timing(rotate, {
        toValue: 1,
        duration: 300,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
    onFlip();
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setQuizAnswer(answerIndex);
    setShowAnswer(true);
    
    if (answerIndex === card.quiz?.correctAnswer) {
      setTimeout(() => {
        onComplete(card.id);
        setShowQuiz(false);
      }, 2000);
    }
  };

  const renderFront = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.difficultyContainer}>
          <MaterialCommunityIcons
            name={getDifficultyIcon(card.difficulty)}
            size={20}
            color={getDifficultyColor(card.difficulty)}
          />
          <Text style={[styles.difficultyText, { color: getDifficultyColor(card.difficulty) }]}>
            {card.difficulty.toUpperCase()}
          </Text>
        </View>
        <View style={styles.stageContainer}>
          <Text style={[styles.stageText, { color: theme.colors.onSurfaceVariant }]}>
            Stage {card.stage}
          </Text>
        </View>
      </View>



      {/* Thumbnail */}
      {card.thumbnailUrl && (
        <View style={styles.thumbnailContainer}>
          <View style={[styles.thumbnail, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="play-circle"
              size={60}
              color={theme.colors.primary}
            />
          </View>
        </View>
      )}

      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>
        {card.title}
      </Text>

      {/* Description */}
      <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
        {card.description}
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.outline }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: theme.colors.primary, width: `${progress * 100}%` }
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.colors.onSurfaceVariant }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: theme.colors.primary }]}
          onPress={onPlayPause}
        >
          <MaterialCommunityIcons
            name={isPlaying ? 'pause' : 'play'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
        
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
              {card.duration}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
            <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
              {card.xpReward} XP
            </Text>
          </View>
        </View>
      </View>

      {/* Flip Button */}
      <TouchableOpacity
        style={[styles.flipButton, { borderColor: theme.colors.outline }]}
        onPress={handleFlip}
      >
        <MaterialCommunityIcons name="flip-horizontal" size={20} color={theme.colors.primary} />
        <Text style={[styles.flipButtonText, { color: theme.colors.primary }]}>
          Flip for Details
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBack = () => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.backTitle, { color: theme.colors.onSurface }]}>
          Lesson Details
        </Text>
        <TouchableOpacity onPress={handleFlip}>
          <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Audio Player */}
      {card.audioUrl && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Audio Lesson
          </Text>
          
          {isLoadingAudio ? (
            <View style={styles.loadingContainer}>
              <MaterialCommunityIcons name="loading" size={24} color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                Loading audio...
              </Text>
            </View>
          ) : audioError ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {audioError}
              </Text>
              <TouchableOpacity onPress={loadAudioUrl} style={styles.retryButton}>
                <Text style={[styles.retryText, { color: theme.colors.primary }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ReactNativeAudioPlayer 
              audioUrl={audioUrl}
              title={card.title}
              stage={parseInt(card.courseId)}
              lessonId={card.stage}
            />
          )}
        </View>
      )}

      {/* Resources */}
      {card.resources.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Resources
          </Text>
          {card.resources.map((resource: Resource) => (
            <TouchableOpacity key={resource.id} style={styles.resourceItem}>
              <MaterialCommunityIcons
                name={resource.type === 'video' ? 'play-circle' : 'file-document'}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.resourceText, { color: theme.colors.onSurface }]}>
                {resource.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quiz */}
      {card.quiz && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
            Quick Quiz
          </Text>
          <Text style={[styles.quizQuestion, { color: theme.colors.onSurface }]}>
            {card.quiz.question}
          </Text>
          {card.quiz.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.quizOption,
                { borderColor: theme.colors.outline },
                quizAnswer === index && styles.quizOptionSelected,
                showAnswer && index === card.quiz?.correctAnswer && styles.quizOptionCorrect,
                showAnswer && quizAnswer === index && index !== card.quiz?.correctAnswer && styles.quizOptionIncorrect,
              ]}
              onPress={() => handleQuizAnswer(index)}
              disabled={showAnswer}
            >
              <Text style={[styles.quizOptionText, { color: theme.colors.onSurface }]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
          {showAnswer && card.quiz.explanation && (
            <Text style={[styles.quizExplanation, { color: theme.colors.onSurfaceVariant }]}>
              {card.quiz.explanation}
            </Text>
          )}
        </View>
      )}

      {/* Complete Button */}
      <TouchableOpacity
        style={[styles.completeButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => onComplete(card.id)}
      >
        <MaterialCommunityIcons name="check" size={20} color="white" />
        <Text style={styles.completeButtonText}>Mark Complete</Text>
      </TouchableOpacity>
    </View>
  );

  const frontRotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <PanGestureHandler
      onGestureEvent={handleGestureEvent}
      onHandlerStateChange={handleGestureStateChange}
    >
      <Animated.View
        style={[
          styles.container,
          {
            transform: [
              { translateX },
              { scale },
            ],
          },
        ]}
      >
        {/* Front side */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ rotateY: frontRotateInterpolate }],
            },
          ]}
        >
          {renderFront()}
        </Animated.View>
        
        {/* Back side */}
        <Animated.View
          style={[
            styles.cardContainer,
            styles.backCard,
            {
              transform: [{ rotateY: backRotateInterpolate }],
            },
          ]}
        >
          {renderBack()}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  cardContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  backCard: {
    transform: [{ rotateY: '180deg' }],
  },
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  stageContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  stageText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  thumbnailContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Graphik-Regular',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Graphik-Regular',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
  },
  flipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  flipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Graphik-Medium',
  },
  backTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Graphik-Semibold',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  resourceText: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'Graphik-Regular',
  },
  quizQuestion: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'Graphik-Medium',
  },
  quizOption: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  quizOptionSelected: {
    borderWidth: 2,
  },
  quizOptionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  quizOptionIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  quizOptionText: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
  },
  quizExplanation: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    fontFamily: 'Graphik-Regular',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 'auto',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  retryText: {
    fontSize: 14,
    fontFamily: 'Graphik-Medium',
  },
});
