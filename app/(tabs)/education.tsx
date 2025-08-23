import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Text, Searchbar, useTheme, Chip, Card, ProgressBar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SuggestedTopic {
  id: string;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
}

const suggestedTopics: SuggestedTopic[] = [
  {
    id: '1',
    title: 'Trading Strategies',
    icon: 'chart-line',
    description: 'Learn different trading strategies and find what works for you',
  },
  {
    id: '2',
    title: 'Trader Type Quiz',
    icon: 'help-circle',
    description: 'Discover your trading personality and optimal strategies',
  },
  {
    id: '3',
    title: 'Market Basics',
    icon: 'book-open-variant',
    description: 'Understanding market fundamentals and key concepts',
  },
  {
    id: '4',
    title: 'Risk Management',
    icon: 'shield-check',
    description: 'Learn how to protect your investments and manage risk',
  },
];

const popularSearches = [
  'How to start investing',
  'Best trading strategies',
  'Crypto basics',
  'Stock analysis',
  'Technical indicators',
  'Risk management',
];

interface RecentCourse {
  id: string;
  title: string;
  progress: number;
  query: string;
  lastAccessed: number;
}

export default function EducationScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentCourses, setRecentCourses] = useState<RecentCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<RecentCourse[]>([]);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function loadRecentCourses() {
      try {
        const recent = await AsyncStorage.getItem('recent_courses');
        if (recent) {
          const courses = JSON.parse(recent) as RecentCourse[];
          // Sort by last accessed, most recent first
          courses.sort((a, b) => b.lastAccessed - a.lastAccessed);
          
          // Split courses into in-progress and completed
          const inProgress = courses.filter(course => course.progress < 1);
          const completed = courses.filter(course => course.progress >= 1);
          
          setRecentCourses(inProgress.slice(0, 3)); // Show only last 3 in-progress courses
          setCompletedCourses(completed.slice(0, 3)); // Show only last 3 completed courses
        }
      } catch (error) {
        console.error('Error loading recent courses:', error);
      }
    }

    loadRecentCourses();
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/course-generator',
        params: { query: searchQuery },
      });
    }
  }, [searchQuery]);

  const handleTopicPress = (topic: SuggestedTopic) => {
    router.push({
      pathname: '/(tabs)/course-generator',
      params: { query: topic.title },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="What would you like to learn?"
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {recentCourses.length > 0 && (
          <View style={styles.recentCourses}>
            <Text style={styles.sectionTitle}>Continue Learning</Text>
            {recentCourses.map((course) => (
              <TouchableOpacity
                key={course.id}
                onPress={() => router.push({
                  pathname: '/(tabs)/course-generator',
                  params: { query: course.query },
                })}
              >
                <Card style={styles.courseCard}>
                  <Card.Content>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <View style={styles.progressContainer}>
                      <ProgressBar
                        progress={course.progress}
                        color={theme.colors.primary}
                        style={styles.progressBar}
                      />
                      <Text style={styles.progressText}>
                        {Math.round(course.progress * 100)}% Complete
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.popularSearches}>
          <Text style={styles.sectionTitle}>Popular Topics</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsContainer}
          >
            {popularSearches.map((search, index) => (
              <Chip
                key={index}
                style={styles.chip}
                onPress={() => setSearchQuery(search)}
                mode="outlined"
              >
                {search}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.suggestedTopics}>
          <Text style={styles.sectionTitle}>Featured Courses</Text>
          {suggestedTopics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              onPress={() => handleTopicPress(topic)}
            >
              <Card style={styles.topicCard}>
                <Card.Content style={styles.topicCardContent}>
                  <MaterialCommunityIcons
                    name={topic.icon}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <View style={styles.topicTextContainer}>
                    <Text style={styles.topicTitle}>{topic.title}</Text>
                    <Text style={styles.topicDescription}>
                      {topic.description}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.primary}
                  />
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {completedCourses.length > 0 && (
          <View style={styles.completedCourses}>
            <Text style={styles.sectionTitle}>Completed Courses</Text>
            {completedCourses.map((course) => (
              <TouchableOpacity
                key={course.id}
                onPress={() => router.push({
                  pathname: '/(tabs)/course-generator',
                  params: { query: course.query },
                })}
              >
                <Card style={[styles.courseCard, styles.completedCourseCard]}>
                  <Card.Content>
                    <View style={styles.completedCourseHeader}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text style={styles.completedText}>
                      Completed on {new Date(course.lastAccessed).toLocaleDateString()}
                    </Text>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#F0E7CB',
  },
  searchBar: {
    borderRadius: 12,
    elevation: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  recentCourses: {
    marginBottom: 24,
  },
  courseCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  courseTitle: {
    fontSize: 16,
    fontFamily: 'Graphik-Medium',
    marginBottom: 8,
    color: '#536B31',
  },
  progressContainer: {
    gap: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
    color: '#536B31',
  },
  popularSearches: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'AustinNewsDeck-Bold',
    marginBottom: 12,
    color: '#536B31',
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  chip: {
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  suggestedTopics: {
    gap: 12,
  },
  topicCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  topicCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topicTextContainer: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontFamily: 'Graphik-Medium',
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: 14,
    fontFamily: 'Graphik-Regular',
    color: '#666666',
  },
  completedCourses: {
    marginTop: 24,
    marginBottom: 24,
  },
  completedCourseCard: {
    opacity: 0.9,
  },
  completedCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completedText: {
    fontSize: 12,
    fontFamily: 'Graphik-Regular',
    color: '#666666',
  },
});
