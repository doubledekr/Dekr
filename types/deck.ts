export interface Resource {
  id: string;
  type: 'article' | 'video' | 'pdf' | 'link';
  title: string;
  url: string;
  description?: string;
}

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface LessonCard {
  id: string;
  type: 'lesson';
  title: string;
  description: string;
  audioUrl: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  stage: number;
  courseId: string;
  resources: Resource[];
  quiz?: Quiz;
  completed: boolean;
  xpReward: number;
  thumbnailUrl?: string;
}

export interface CourseDecks {
  beginner: LessonCard[];
  intermediate: LessonCard[];
  advanced: LessonCard[];
}

export interface CommunityLearningDeck {
  id: string;
  title: string;
  description: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    reputation: number;
    isExpert: boolean;
  };
  topic: 'trading' | 'analysis' | 'psychology' | 'risk_management';
  cards: LessonCard[];
  followers: number;
  rating: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  estimatedDuration: string;
  thumbnailUrl?: string;
}

export interface ChallengeSubmissionCard {
  id: string;
  type: 'challenge_submission';
  challengeId: string;
  username: string;
  avatar: string;
  submittedAt: Date;
  isRevealed: boolean; // false until challenge ends
  preview?: string; // non-revealing preview
  fullSubmission?: {
    prediction: number;
    reasoning: string;
    confidence: number;
    supportingData?: any;
  };
  votes?: {
    upvotes: number;
    downvotes: number;
    userVote?: 'up' | 'down' | null;
  };
}

export interface ChallengeDeck {
  id: string;
  title: string;
  description: string;
  endDate: Date;
  status: 'active' | 'completed';
  submissionCards: ChallengeSubmissionCard[];
  userSubmitted: boolean;
  symbol: string;
  type: 'direction' | 'price';
  prizeAmount: number;
  maxParticipants?: number;
  participants: Array<{
    userId: string;
    displayName: string;
    avatar: string;
  }>;
  creatorId: string;
}

export interface DeckState {
  currentIndex: number;
  isFlipped: boolean;
  isPlaying: boolean;
  progress: number;
}

export interface SwipeAction {
  type: 'like' | 'dislike' | 'skip' | 'bookmark';
  cardId: string;
  timestamp: Date;
}

export interface DeckProgress {
  deckId: string;
  completedCards: string[];
  totalCards: number;
  currentIndex: number;
  lastAccessed: Date;
  timeSpent: number; // in seconds
}
