import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, useTheme, ProgressBar, Button, Snackbar, Card, TextInput } from 'react-native-paper';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Course, CourseSection, generateCourse, saveCourseProgress } from '../../services/course-service';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CourseGeneratorScreen() {
  const { query } = useLocalSearchParams<{ query: string }>();
  const [localQuery, setLocalQuery] = useState("");
  const [course, setCourse] = useState<Course | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [answeredQuestions, setAnsweredQuestions] = useState<{[key: string]: number}>({});
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Update local query when route query changes
  useEffect(() => {
    if (query) {
      setLocalQuery(query);
    }
  }, [query]);

  const saveProgress = useCallback(async () => {
    if (!course) return;

    try {
      // Save progress for this course
      const progress = (currentSectionIndex + 1) / course.sections.length;
      const recentCourse = {
        id: course.id,
        title: course.title,
        progress,
        query,
        lastAccessed: Date.now(),
      };

      // Get existing recent courses
      const recentCoursesStr = await AsyncStorage.getItem('recent_courses');
      let recentCourses = recentCoursesStr ? JSON.parse(recentCoursesStr) : [];

      // Update or add the current course
      const existingIndex = recentCourses.findIndex((c: any) => c.id === course.id);
      if (existingIndex !== -1) {
        recentCourses[existingIndex] = recentCourse;
      } else {
        recentCourses.push(recentCourse);
      }

      // Keep only the last 10 courses
      if (recentCourses.length > 10) {
        recentCourses = recentCourses
          .sort((a: any, b: any) => b.lastAccessed - a.lastAccessed)
          .slice(0, 10);
      }

      await AsyncStorage.setItem('recent_courses', JSON.stringify(recentCourses));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [course, currentSectionIndex, query]);

  useEffect(() => {
    async function loadCourse() {
      if (!query) {
        // No query provided, just show the default search view
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null); // Reset any previous errors
        const generatedCourse = await generateCourse(query);
        
        if (!generatedCourse || !generatedCourse.sections || generatedCourse.sections.length === 0) {
          throw new Error('Invalid course structure received');
        }
        
        setCourse(generatedCourse);
        setIsLoading(false);

        // Check for existing progress
        const recentCoursesStr = await AsyncStorage.getItem('recent_courses');
        if (recentCoursesStr) {
          const recentCourses = JSON.parse(recentCoursesStr);
          const existingCourse = recentCourses.find((c: any) => c.id === generatedCourse.id);
          if (existingCourse) {
            const sectionIndex = Math.floor(existingCourse.progress * generatedCourse.sections.length);
            setCurrentSectionIndex(sectionIndex);
          }
        }
      } catch (error) {
        console.error('Error loading course:', error);
        setError(error instanceof Error ? error.message : 'Failed to generate course. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setIsLoading(false);
        setCourse(null);
      }
    }

    if (query) {
      loadCourse();
    } else {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (course) {
      setProgress(currentSectionIndex / course.sections.length);
      saveCourseProgress(course.id, currentSectionIndex);
    }
  }, [currentSectionIndex, course]);

  useEffect(() => {
    saveProgress();
  }, [currentSectionIndex, saveProgress]);

  const handleNext = () => {
    if (course && currentSectionIndex < course.sections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      Haptics.selectionAsync();
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      Haptics.selectionAsync();
    }
  };

  const handleQuizAnswer = (questionIndex: number, correctAnswer: number, selectedAnswer: number) => {
    setAnsweredQuestions(prev => ({
      ...prev,
      [`${currentSectionIndex}-${questionIndex}`]: selectedAnswer
    }));

    if (correctAnswer === selectedAnswer) {
      setFeedbackMessage('Correct! Well done! 🎉');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setFeedbackMessage('Not quite right. Try again! 💪');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setShowFeedback(true);
  };

  const quizStyles = React.useMemo(() => ({
    correctOption: {
      borderColor: theme.colors.primary,
      backgroundColor: 'rgba(230, 244, 234, 0.9)',
    },
    incorrectOption: {
      borderColor: theme.colors.error,
      backgroundColor: 'rgba(254, 238, 240, 0.9)',
    },
    revealedCorrectOption: {
      borderColor: theme.colors.primary,
      borderStyle: 'dashed' as const,
      backgroundColor: 'rgba(230, 244, 234, 0.3)',
    },
  }), [theme.colors]);

  // Handle search submission
  const handleSearch = () => {
    if (localQuery.trim()) {
      // Clear current state
      setCourse(null);
      setCurrentSectionIndex(0);
      setError(null);
      
      // Navigate with the new query
      router.push({
        pathname: '/(tabs)/course-generator',
        params: { query: localQuery.trim() }
      });
    }
  };

  if (!query && !isLoading && !course) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Course Generator',
            headerStyle: {
              backgroundColor: '#F0E7CB',
            },
          }}
        />
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons 
            name="book-education" 
            size={80} 
            color={theme.colors.primary} 
            style={styles.emptyStateIcon}
          />
          <Text style={styles.emptyStateTitle}>Generate a Course</Text>
          <Text style={styles.emptyStateText}>
            Enter a topic you'd like to learn about, and we'll create a personalized course for you.
          </Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              label="What would you like to learn about?"
              value={localQuery}
              onChangeText={setLocalQuery}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Button 
              mode="contained" 
              onPress={handleSearch}
              style={styles.searchButton}
              disabled={!localQuery.trim()}
            >
              Generate Course
            </Button>
          </View>
          
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Popular Topics</Text>
            <View style={styles.suggestionsGrid}>
              {[
                'Investing Basics', 
                'Technical Analysis', 
                'Stock Fundamentals',
                'Crypto Trading',
                'Options Trading',
                'Risk Management'
              ].map((topic) => (
                <Button 
                  key={topic}
                  mode="outlined"
                  onPress={() => {
                    setLocalQuery(topic);
                    router.push({
                      pathname: '/(tabs)/course-generator',
                      params: { query: topic }
                    });
                  }}
                  style={styles.suggestionButton}
                >
                  {topic}
                </Button>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.primary }]}>
          Loading your course...
        </Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.errorButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const currentSectionData = course.sections[currentSectionIndex];

  return (
    <>
      <Stack.Screen
        options={{
          title: course.title,
          headerStyle: {
            backgroundColor: '#F0E7CB',
          },
        }}
      />
      <View style={styles.container}>
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {currentSectionIndex + 1} of {course.sections.length}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <View style={styles.courseMetadata}>
              <View style={styles.metadataItem}>
                <MaterialCommunityIcons
                  name="school-outline"
                  size={20}
                  color={theme.colors.primary}
                />
                <Text style={styles.metadataText}>{course.difficulty}</Text>
              </View>
            </View>
          </View>

          <Card style={styles.sectionCard}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
                {currentSectionData.title}
              </Text>
              <Text style={styles.sectionContent}>
                {currentSectionData.content}
              </Text>
            </Card.Content>
          </Card>

          {currentSectionData.quiz && (
            <View style={styles.quizContainer}>
              <Text style={styles.quizTitle}>Quick Quiz</Text>
              {currentSectionData.quiz.map((quizItem, index) => (
                <View key={index} style={styles.quizItem}>
                  <Text style={styles.quizQuestion}>{quizItem.question}</Text>
                  {quizItem.options.map((option, optionIndex) => {
                    const questionKey = `${currentSectionIndex}-${index}`;
                    const hasAnswered = questionKey in answeredQuestions;
                    const isSelected = answeredQuestions[questionKey] === optionIndex;
                    const isCorrect = quizItem.correctAnswer === optionIndex;
                    
                    return (
                      <Button
                        key={optionIndex}
                        mode="outlined"
                        style={[
                          styles.quizOption,
                          isSelected && styles.selectedOption,
                          hasAnswered && isSelected && isCorrect && quizStyles.correctOption,
                          hasAnswered && isSelected && !isCorrect && quizStyles.incorrectOption,
                          hasAnswered && !isSelected && isCorrect && quizStyles.revealedCorrectOption,
                        ]}
                        labelStyle={styles.quizOptionLabel}
                        contentStyle={styles.quizOptionContent}
                        textColor={
                          hasAnswered && isSelected && isCorrect ? theme.colors.primary :
                          hasAnswered && isSelected && !isCorrect ? theme.colors.error :
                          hasAnswered && !isSelected && isCorrect ? theme.colors.primary :
                          theme.colors.onSurface
                        }
                        onPress={() => handleQuizAnswer(index, quizItem.correctAnswer, optionIndex)}
                        disabled={hasAnswered && (isSelected || answeredQuestions[questionKey] === quizItem.correctAnswer)}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.navigationContainer}>
          <Button
            mode="outlined"
            onPress={handlePrevious}
            disabled={currentSectionIndex === 0}
            style={styles.navigationButton}
          >
            Previous
          </Button>
          <Button
            mode="contained"
            onPress={handleNext}
            disabled={currentSectionIndex === course.sections.length - 1}
            style={styles.navigationButton}
          >
            Next
          </Button>
        </View>

        <Snackbar
          visible={showFeedback}
          onDismiss={() => setShowFeedback(false)}
          duration={3000}
        >
          {feedbackMessage}
        </Snackbar>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Graphik-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Graphik-Medium',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorButton: {
    minWidth: 120,
  },
  progressContainer: {
    padding: 16,
    backgroundColor: '#F0E7CB',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
    color: '#536B31',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  courseHeader: {
    marginBottom: 24,
  },
  courseTitle: {
    fontSize: 24,
    fontFamily: 'AustinNewsDeck-Bold',
    color: '#536B31',
    marginBottom: 12,
  },
  courseMetadata: {
    flexDirection: 'row',
    gap: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataText: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
    color: '#536B31',
  },
  sectionCard: {
    marginBottom: 24,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Graphik-Semibold',
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 16,
    fontFamily: 'Graphik-Regular',
    lineHeight: 24,
  },
  quizContainer: {
    marginTop: 24,
  },
  quizTitle: {
    fontSize: 18,
    fontFamily: 'Graphik-Medium',
    color: '#536B31',
    marginBottom: 16,
  },
  quizItem: {
    marginBottom: 24,
  },
  quizQuestion: {
    fontSize: 16,
    fontFamily: 'Graphik-Medium',
    color: '#536B31',
    marginBottom: 12,
  },
  quizOption: {
    marginBottom: 8,
    borderWidth: 1,
    alignSelf: 'stretch',
  },
  quizOptionLabel: {
    textAlign: 'left',
    flexShrink: 1,
    flexWrap: 'wrap',
    fontSize: 14,
  },
  quizOptionContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    height: 'auto',
    minHeight: 48,
    paddingVertical: 8,
  },
  selectedOption: {
    borderWidth: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 24,
  },
  navigationButton: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  searchContainer: {
    width: '100%',
    marginBottom: 30,
  },
  searchInput: {
    marginBottom: 10,
  },
  searchButton: {
    marginTop: 10,
  },
  suggestionsContainer: {
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  suggestionButton: {
    margin: 5,
    marginBottom: 10,
  },
}); 