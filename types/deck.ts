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

export interface PredictionCard {
  id: string;
  type: 'prediction';
  username: string;
  avatar: string;
  prediction: {
    symbol: string;
    direction: 'up' | 'down';
    targetPrice?: number;
    confidence: number;
    reasoning: string;
  };
  isRevealed: boolean;
  submittedAt: Date;
  accuracy?: number; // calculated after competition ends
}

export interface WeeklyCompetitionDeck {
  id: string;
  title: string;
  description: string;
  symbol: string;
  endDate: Date;
  status: 'active' | 'completed';
  prizeAmount: number;
  maxParticipants?: number;
  participants: Array<{
    userId: string;
    displayName: string;
    avatar: string;
  }>;
  predictionCards: PredictionCard[];
  userSubmitted: boolean;
  creatorId: string;
}

export interface FriendRequestCard {
  id: string;
  type: 'friend_request';
  fromUserId: string;
  username: string;
  avatar: string;
  mutualFriends: number;
  requestMessage?: string;
  sentAt: Date;
  interests: string[];
  reputation: number;
  isExpert: boolean;
}

export interface PublicProfileCard {
  id: string;
  type: 'public_profile';
  userId: string;
  username: string;
  avatar: string;
  bio: string;
  interests: string[];
  reputation: number;
  isExpert: boolean;
  portfolioPerformance?: number;
  mutualConnections: number;
  recentAchievements: string[];
  lastActive: Date;
}

export interface FriendCardData {
  id: string;
  type: 'friend';
  userId: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline';
  recentActivity: string;
  mutualFriends: number;
  portfolioPerformance?: number;
  lastInteraction: Date;
  reputation: number;
  isExpert: boolean;
  interests: string[];
  recentAchievements: string[];
}
