import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEducation } from '../contexts/EducationContext';
import { LessonContent, AudioBlock, TextBlock, TapToRevealCard, MultipleChoiceQuestion } from '../types/education';
import ReactNativeAudioPlayer from '../components/ReactNativeAudioPlayer';

const { width } = Dimensions.get('window');

export default function LessonDetailScreen() {
  const { stageId, lessonId } = useLocalSearchParams<{ stageId: string; lessonId: string }>();
  const { user, stages, addCompletedLesson } = useEducation();
  const insets = useSafeAreaInsets();
  
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [showExplanations, setShowExplanations] = useState<Set<number>>(new Set());

  const stage = stages.find(s => s.id === parseInt(stageId || '1'));
  const lesson = stage?.lessons.find(l => l.id === parseInt(lessonId || '1'));

  console.log('📚 Lesson Detail Screen - Stage ID:', stageId, 'Lesson ID:', lessonId);
  console.log('📚 Found stage:', stage?.title);
  console.log('📚 Found lesson:', lesson?.title);



  if (!stage || !lesson) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#536B31" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lesson Not Found</Text>
        </View>
      </View>
    );
  }

  const isCompleted = user.completedLessons.some(
    completed => completed.stageId === parseInt(stageId || '1') && completed.lessonId === parseInt(lessonId || '1')
  );



  const toggleReveal = (index: number) => {
    const newRevealed = new Set(revealedCards);
    if (newRevealed.has(index)) {
      newRevealed.delete(index);
    } else {
      newRevealed.add(index);
    }
    setRevealedCards(newRevealed);
  };

  const handleAnswerSelect = (contentIndex: number, answer: string) => {
    setSelectedAnswers({ ...selectedAnswers, [contentIndex]: answer });
  };

  const showExplanation = (contentIndex: number) => {
    const newExplanations = new Set(showExplanations);
    newExplanations.add(contentIndex);
    setShowExplanations(newExplanations);
  };

  const completeLesson = () => {
    const completedLesson = {
      stageId: parseInt(stageId || '1'),
      lessonId: parseInt(lessonId || '1'),
      completedAt: new Date().toISOString(),
      score: 100, // For now, assume perfect score
      xpEarned: lesson.xpReward,
    };
    
    addCompletedLesson(completedLesson);
    Alert.alert(
      'Lesson Complete!',
      `Congratulations! You earned ${lesson.xpReward} XP.`,
      [{ text: 'Continue', onPress: () => router.back() }]
    );
  };

  const renderContent = (content: LessonContent, index: number) => {
    console.log('📚 Rendering content:', content.type, 'at index:', index);
    
    switch (content.type) {
      case 'audio':
        const audioContent = content as AudioBlock;
        console.log('🎵 Rendering audio content:', audioContent);
        return (
          <View key={index} style={styles.contentBlock}>
            <ReactNativeAudioPlayer
              audioUrl={audioContent.audioUrl}
              title={audioContent.audioTitle || 'Audio Content'}
              transcript={audioContent.transcript}
            />
          </View>
        );

      case 'text':
        const textContent = content as TextBlock;
        return (
          <View key={index} style={styles.contentBlock}>
            {textContent.title && (
              <Text style={styles.contentTitle}>{textContent.title}</Text>
            )}
            <Text style={styles.contentText}>{textContent.content}</Text>
          </View>
        );

      case 'tap-to-reveal':
        const tapContent = content as TapToRevealCard;
        const isRevealed = revealedCards.has(index);
        return (
          <View key={index} style={styles.contentBlock}>
            <TouchableOpacity
              style={styles.tapToRevealCard}
              onPress={() => toggleReveal(index)}
            >
              <View style={styles.tapToRevealHeader}>
                <Text style={styles.tapToRevealTitle}>{tapContent.title}</Text>
                <MaterialCommunityIcons 
                  name={isRevealed ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#2563eb" 
                />
              </View>
              
              {isRevealed && (
                <View style={styles.revealedContent}>
                  {Array.isArray(tapContent.hiddenContent) ? (
                    tapContent.hiddenContent.map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.revealedItem}>
                        <Text style={styles.revealedText}>• {item}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.revealedText}>{tapContent.hiddenContent}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          </View>
        );

      case 'multiple-choice':
        const mcContent = content as MultipleChoiceQuestion;
        const selectedAnswer = selectedAnswers[index];
        const showExp = showExplanations.has(index);
        
        return (
          <View key={index} style={styles.contentBlock}>
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>{mcContent.question.questionText}</Text>
              
              {mcContent.question.options.map((option, optionIndex) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === mcContent.question.correctAnswer;
                
                return (
                  <TouchableOpacity
                    key={optionIndex}
                    style={[
                      styles.optionButton,
                      isSelected && styles.selectedOption,
                      showExp && isCorrect && styles.correctOption,
                      showExp && isSelected && !isCorrect && styles.incorrectOption,
                    ]}
                    onPress={() => handleAnswerSelect(index, option)}
                    disabled={showExp}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.selectedOptionText,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              
              {selectedAnswer && !showExp && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => showExplanation(index)}
                >
                  <Text style={styles.submitButtonText}>Submit Answer</Text>
                </TouchableOpacity>
              )}
              
              {showExp && mcContent.question.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>Explanation:</Text>
                  <Text style={styles.explanationText}>{mcContent.question.explanation}</Text>
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#536B31" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{lesson.title}</Text>
          <Text style={styles.headerSubtitle}>{stage.title}</Text>
        </View>
        <View style={styles.xpBadge}>
          <MaterialCommunityIcons name="star" size={16} color="#fbbf24" />
          <Text style={styles.xpText}>{lesson.xpReward} XP</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonDescription}>{lesson.description}</Text>
          <View style={styles.lessonMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#6b7280" />
              <Text style={styles.metaText}>{lesson.duration} minutes</Text>
            </View>
            {isCompleted && (
              <View style={styles.completedBadge}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </View>


        {/* Lesson Content */}
        {lesson.content.map((content, index) => renderContent(content, index))}

        {/* Complete Lesson Button */}
        {!isCompleted && (
          <TouchableOpacity style={styles.completeButton} onPress={completeLesson}>
            <Text style={styles.completeButtonText}>Complete Lesson</Text>
            <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#536B31',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Graphik-Regular',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#536B31',
    marginLeft: 4,
    fontFamily: 'Graphik-Semibold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lessonInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
  },
  lessonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    fontFamily: 'Graphik-Regular',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
    fontFamily: 'Graphik-Medium',
  },
  contentBlock: {
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#536B31',
    marginBottom: 12,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  contentText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },

  tapToRevealCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  tapToRevealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  tapToRevealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#536B31',
    fontFamily: 'Graphik-Semibold',
  },
  revealedContent: {
    padding: 16,
  },
  revealedItem: {
    marginBottom: 8,
  },
  revealedText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  questionContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#536B31',
    marginBottom: 16,
    fontFamily: 'Graphik-Semibold',
  },
  optionButton: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  correctOption: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  incorrectOption: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Graphik-Regular',
  },
  selectedOptionText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Graphik-Semibold',
  },
  explanationContainer: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
    fontFamily: 'Graphik-Semibold',
  },
  explanationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  completeButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 20,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Graphik-Semibold',
  },
});
