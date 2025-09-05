import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEducation } from '../../../contexts/EducationContext';
import { StageDeckBrowser } from '../../../components/education/StageDeckBrowser';

const { width } = Dimensions.get('window');

export function EducationScreen() {
  const { user, stages, loading } = useEducation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'stages', title: 'Learning Path' },
  ]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      </View>
    );
  }

  const currentStage = stages.find(stage => stage.id === user.currentStage);
  const completedLessonsCount = user.completedLessons.length;
  const totalLessons = stages.reduce((total, stage) => total + stage.lessons.length, 0);
  const progressPercentage = (completedLessonsCount / totalLessons) * 100;

  const isLessonCompleted = (stageId: number, lessonId: number) => {
    return user.completedLessons.some(
      completed => completed.stageId === stageId && completed.lessonId === lessonId
    );
  };

  const isLessonLocked = (stageId: number, lessonId: number) => {
    // All lessons are now unlocked - users can learn freely
    return false;
  };

  const getStageProgress = (stageId: number) => {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return 0;
    
    const completedCount = stage.lessons.filter(lesson => 
      isLessonCompleted(stageId, lesson.id)
    ).length;
    
    return (completedCount / stage.lessons.length) * 100;
  };

  const handleLessonPress = (stageId: number, lessonId: number) => {
    // All lessons are accessible - no locking restrictions
    router.push({
      pathname: '/lesson-detail',
      params: { stageId: stageId.toString(), lessonId: lessonId.toString() }
    });
  };

  const renderStagesTab = () => (
    <StageDeckBrowser 
      stages={stages}
      completedLessons={user.completedLessons}
    />
  );

  const renderScene = SceneMap({
    stages: renderStagesTab,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user.firstName}!</Text>
          <Text style={styles.subtitle}>Ready to learn today?</Text>
        </View>
        <View style={styles.xpContainer}>
          <MaterialCommunityIcons name="star" size={24} color="#fbbf24" />
          <Text style={styles.xpText}>{user.xp} XP</Text>
        </View>
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{ backgroundColor: theme.colors.primary }}
            style={{ backgroundColor: theme.colors.surface }}
            labelStyle={{ color: theme.colors.onSurface }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0E7CB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
    fontFamily: 'Graphik-Regular',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#536B31',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    fontFamily: 'Graphik-Regular',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  xpText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#536B31',
    marginLeft: 6,
    fontFamily: 'Graphik-Semibold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressCard: {
    backgroundColor: '#ffffff',
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#536B31',
    marginBottom: 12,
    fontFamily: 'Graphik-Semibold',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Graphik-Regular',
  },
  currentStageCard: {
    backgroundColor: '#ffffff',
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    fontFamily: 'Graphik-Semibold',
  },
  stageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#536B31',
    marginBottom: 8,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  stageDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 24,
    fontFamily: 'Graphik-Regular',
  },
  continueButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Graphik-Semibold',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#536B31',
    marginTop: 8,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Graphik-Regular',
  },
  stagesContainer: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#536B31',
    marginBottom: 16,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  stageContainer: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stageHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  stageInfo: {
    marginBottom: 12,
  },
  stageCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#536B31',
    marginBottom: 4,
    fontFamily: 'AustinNewsDeck-Bold',
  },
  stageCardDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginLeft: 8,
  },
  stageProgressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 3,
  },
  lessonsContainer: {
    padding: 16,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  lessonCardLocked: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  lessonCardCompleted: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  lessonIcon: {
    marginRight: 16,
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#536B31',
    marginBottom: 4,
    fontFamily: 'Graphik-Semibold',
  },
  lessonTitleLocked: {
    color: '#9ca3af',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'Graphik-Regular',
  },
  lessonDescriptionLocked: {
    color: '#d1d5db',
  },
  lessonMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    fontFamily: 'Graphik-Regular',
  },
});
