import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, CompletedLesson, Stage } from '../types/education';

interface EducationContextType {
  user: User;
  stages: Stage[];
  loading: boolean;
  updateXP: (xpToAdd: number) => void;
  addCompletedLesson: (lesson: CompletedLesson) => void;
  updateLoginStreak: (date: string) => void;
  addBadge: (badgeId: string) => void;
}

const INITIAL_USER: User = {
  id: '1',
  firstName: 'Trader',
  lastName: 'Pro',
  username: 'traderpro',
  email: 'trader@dekr.app',
  xp: 0,
  currentStage: 1,
  completedLessons: [],
  earnedBadges: [],
  loginDates: [new Date().toISOString().split('T')[0]],
  streakDays: 1,
};

// Load lesson data from JSON file
const loadLessonsData = async (): Promise<Stage[]> => {
  try {
    const lessonsData = require('../data/lessons.json');
    return lessonsData;
  } catch (error) {
    console.error('Error loading lessons data:', error);
    // Fallback to basic data if file loading fails
    return [
      {
        id: 1,
        title: "Stage 1: Core Money Skills",
        description: "Learn the essential basics of money and finance",
        requiredXP: 0,
        lessons: [
          {
            id: 1,
            title: "What is Money?",
            description: "Understanding the fundamental concept of money",
            duration: 10,
            xpReward: 25,
            content: [
              {
                type: 'text',
                title: 'Introduction to Money',
                content: 'Money is a medium of exchange that facilitates trade and commerce.'
              }
            ]
          }
        ]
      }
    ];
  }
};

const EducationContext = createContext<EducationContextType | undefined>(undefined);

export function EducationProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, lessonsData] = await Promise.all([
        loadUserData(),
        loadLessonsData()
      ]);
      setStages(lessonsData);
    } catch (error) {
      console.error('Error loading education data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('education_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserData = async (userData: User) => {
    try {
      await AsyncStorage.setItem('education_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const updateXP = (xpToAdd: number) => {
    const newUser = {
      ...user,
      xp: user.xp + xpToAdd
    };
    setUser(newUser);
    saveUserData(newUser);
  };

  const addCompletedLesson = (lesson: CompletedLesson) => {
    const newUser = {
      ...user,
      completedLessons: [...user.completedLessons, lesson],
      xp: user.xp + lesson.xpEarned
    };
    setUser(newUser);
    saveUserData(newUser);
  };

  const updateLoginStreak = (date: string) => {
    const loginDates = [...user.loginDates, date];
    const newUser = {
      ...user,
      loginDates,
      streakDays: calculateStreak(loginDates)
    };
    setUser(newUser);
    saveUserData(newUser);
  };

  const addBadge = (badgeId: string) => {
    const newUser = {
      ...user,
      earnedBadges: [...user.earnedBadges, badgeId]
    };
    setUser(newUser);
    saveUserData(newUser);
  };

  const calculateStreak = (dates: string[]): number => {
    const sortedDates = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let streak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const current = new Date(sortedDates[i - 1]);
      const previous = new Date(sortedDates[i]);
      const diffTime = current.getTime() - previous.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  return (
    <EducationContext.Provider value={{
      user,
      stages,
      loading,
      updateXP,
      addCompletedLesson,
      updateLoginStreak,
      addBadge
    }}>
      {children}
    </EducationContext.Provider>
  );
}

export function useEducation() {
  const context = useContext(EducationContext);
  if (context === undefined) {
    throw new Error('useEducation must be used within an EducationProvider');
  }
  return context;
}
