// Education module types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  xp: number;
  currentStage: number;
  completedLessons: CompletedLesson[];
  earnedBadges: string[];
  loginDates: string[];
  streakDays: number;
}

export interface CompletedLesson {
  stageId: number;
  lessonId: number;
  completedAt: string;
  score: number;
  xpEarned: number;
}

export interface Stage {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  requiredXP: number;
  checkpointQuiz?: Quiz;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  duration: number;
  xpReward: number;
  content: LessonContent[];
  quiz?: Quiz;
  isLocked?: boolean;
}

export type LessonContent = 
  | TextBlock
  | TapToRevealCard
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | SortingActivity
  | ImageBlock
  | VideoBlock
  | AudioBlock;

export interface TextBlock {
  type: 'text';
  title?: string;
  content: string;
}

export interface ImageBlock {
  type: 'image';
  imageUrl: string;
  caption?: string;
}

export interface VideoBlock {
  type: 'video';
  videoUrl: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface AudioBlock {
  type: 'audio';
  audioUrl: string;
  audioTitle?: string;
  transcript?: string;
  audioDuration?: number;
}

export interface TapToRevealCard {
  type: 'tap-to-reveal';
  title: string;
  hiddenContent: string | string[];
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string | string[] | number[];
  explanation?: string;
}

export interface MultipleChoiceQuestion {
  type: 'multiple-choice';
  question: Question;
  multiSelect?: boolean;
}

export interface TrueFalseQuestion {
  type: 'true-false';
  question: Question;
}

export interface SortingActivity {
  type: 'sorting';
  title: string;
  categories: {
    name: string;
    items: string[];
  }[];
  unsortedItems: {
    item: string;
    correctCategory: string;
  }[];
}

export interface Quiz {
  title: string;
  description: string;
  questions: Question[];
  passingScore: number;
  xpReward: number;
  duration: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'progress' | 'special';
  backgroundColor: string;
  unlockedAt?: string;
  requirements?: BadgeRequirement;
}

export interface BadgeRequirement {
  type: 'lessons_completed' | 'streak' | 'xp_earned' | 'quiz_score';
  threshold: number;
  specificStage?: number;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconBackground: string;
  link: string;
}
