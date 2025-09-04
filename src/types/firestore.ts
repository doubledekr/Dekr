// Firestore type definitions for Dekr app

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  isPublic: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
  followersCount: number;
  followingCount: number;
  decksCount: number;
  totalXP: number;
  level: number;
  badges: string[];
  preferences: {
    notifications: {
      email: boolean;
      push: boolean;
      friendRequests: boolean;
      deckShares: boolean;
      challenges: boolean;
      newsletters: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'friends' | 'private';
      deckVisibility: 'public' | 'friends' | 'private';
      activityVisibility: 'public' | 'friends' | 'private';
    };
  };
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  collaborators: string[]; // UIDs of users who can edit
  visibility: 'public' | 'friends' | 'private';
  category: 'stocks' | 'crypto' | 'mixed' | 'watchlist';
  tags: string[];
  itemCount: number;
  items: DeckItem[];
  performance?: {
    totalReturn: number;
    totalReturnPercent: number;
    dayChange: number;
    dayChangePercent: number;
    lastUpdated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  sharedCount: number;
  likesCount: number;
  viewsCount: number;
  isArchived: boolean;
}

export interface DeckItem {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  exchange?: string;
  addedAt: Date;
  addedBy: string; // UID
  position?: {
    shares: number;
    avgPrice: number;
    currentPrice: number;
    totalValue: number;
    dayChange: number;
    dayChangePercent: number;
    totalReturn: number;
    totalReturnPercent: number;
  };
  notes?: string;
  tags: string[];
  alertsEnabled: boolean;
}

export interface CardNote {
  id: string;
  cardId: string; // Symbol or asset ID
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  title?: string;
  content: string;
  visibility: 'public' | 'friends' | 'private';
  tags: string[];
  attachments?: {
    type: 'image' | 'link' | 'chart';
    url: string;
    caption?: string;
  }[];
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  targetPrice?: number;
  timeHorizon?: '1d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'long';
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isEdited: boolean;
}

export interface Share {
  id: string;
  type: 'deck' | 'note' | 'strategy';
  itemId: string;
  itemTitle: string;
  sharedBy: string; // UID
  sharedByName: string;
  sharedWith?: string[]; // UIDs, empty for public shares
  message?: string;
  createdAt: Date;
  expiresAt?: Date;
  viewCount: number;
  isActive: boolean;
}

export interface FriendEdge {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserPhoto?: string;
  toUserId: string;
  toUserName: string;
  toUserPhoto?: string;
  status: 'pending' | 'accepted' | 'blocked';
  requestedAt: Date;
  respondedAt?: Date;
  mutualFriendsCount?: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  type: 'momentum' | 'value' | 'growth' | 'dividend' | 'swing' | 'custom';
  rules: {
    entryConditions: string[];
    exitConditions: string[];
    riskManagement: {
      stopLoss?: number;
      takeProfit?: number;
      positionSize: number;
      maxDrawdown: number;
    };
  };
  universe: {
    assetTypes: ('stocks' | 'crypto')[];
    exchanges?: string[];
    marketCap?: {
      min?: number;
      max?: number;
    };
    excludeList: string[];
  };
  isActive: boolean;
  isPublic: boolean;
  performance?: {
    totalTrades: number;
    winRate: number;
    avgReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    lastBacktest: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  backtests: Backtest[];
}

export interface Backtest {
  id: string;
  strategyId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  results: {
    finalValue: number;
    totalReturn: number;
    totalReturnPercent: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    sortinoRatio: number;
    profitFactor: number;
  };
  trades: {
    symbol: string;
    entryDate: Date;
    exitDate: Date;
    entryPrice: number;
    exitPrice: number;
    shares: number;
    return: number;
    returnPercent: number;
  }[];
  createdAt: Date;
  runTimeMs: number;
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  type: 'price' | 'volume' | 'news' | 'technical' | 'earnings';
  condition: {
    operator: '>' | '<' | '>=' | '<=' | '==' | 'crosses_above' | 'crosses_below';
    value: number;
    field: 'price' | 'volume' | 'change_percent' | 'rsi' | 'macd' | 'sma' | 'ema';
    timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  };
  isActive: boolean;
  isRepeating: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  expiresAt?: Date;
  notificationMethods: ('push' | 'email' | 'sms')[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'trading' | 'prediction' | 'education' | 'social';
  creatorId: string;
  creatorName: string;
  rules: {
    duration: number; // days
    startingCapital: number;
    allowedAssets: string[];
    maxPositions?: number;
    tradingFees: number;
  };
  prizes: {
    first: string;
    second?: string;
    third?: string;
    participation?: string;
  };
  status: 'draft' | 'open' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  maxParticipants?: number;
  currentParticipants: number;
  entryFee?: number;
  totalPrizePool: number;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Participant {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  joinedAt: Date;
  currentRank: number;
  portfolio: {
    value: number;
    cash: number;
    positions: {
      symbol: string;
      shares: number;
      avgPrice: number;
      currentValue: number;
      return: number;
      returnPercent: number;
    }[];
  };
  performance: {
    totalReturn: number;
    totalReturnPercent: number;
    bestDay: number;
    worstDay: number;
    winRate: number;
    totalTrades: number;
    sharpeRatio: number;
  };
  trades: {
    id: string;
    symbol: string;
    type: 'buy' | 'sell';
    shares: number;
    price: number;
    timestamp: Date;
    fees: number;
  }[];
  isActive: boolean;
  disqualified?: {
    reason: string;
    date: Date;
  };
}

export interface Newsletter {
  id: string;
  userId: string;
  title: string;
  content: {
    summary: string;
    sections: {
      title: string;
      content: string;
      charts?: string[];
      links?: {
        title: string;
        url: string;
      }[];
    }[];
  };
  marketData: {
    period: string;
    topMovers: {
      symbol: string;
      name: string;
      change: number;
      changePercent: number;
    }[];
    keyEvents: string[];
    economicIndicators?: {
      name: string;
      value: string;
      change?: string;
    }[];
  };
  personalizedInsights: {
    portfolioSummary?: string;
    recommendedActions: string[];
    watchlistHighlights: {
      symbol: string;
      reason: string;
    }[];
  };
  generatedAt: Date;
  deliveredAt?: Date;
  isRead: boolean;
  readAt?: Date;
  emailSent: boolean;
  preferences: {
    frequency: 'daily' | 'weekly' | 'monthly';
    sections: string[];
    includePortfolio: boolean;
    includeWatchlist: boolean;
  };
}

// Subcollection types for better organization
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  likesCount: number;
  isEdited: boolean;
  parentCommentId?: string; // For nested comments
}

export interface Like {
  id: string;
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'friend_request' | 'deck_share' | 'note_like' | 'challenge_invite' | 'alert_triggered' | 'newsletter';
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
}

// Utility types for queries and updates
export type UserProfileUpdate = Partial<Omit<UserProfile, 'uid' | 'joinedAt'>>;
export type DeckUpdate = Partial<Omit<Deck, 'id' | 'ownerId' | 'createdAt'>>;
export type CardNoteUpdate = Partial<Omit<CardNote, 'id' | 'authorId' | 'createdAt'>>;
export type StrategyUpdate = Partial<Omit<Strategy, 'id' | 'ownerId' | 'createdAt'>>;
export type ChallengeUpdate = Partial<Omit<Challenge, 'id' | 'creatorId' | 'createdAt'>>;

// Query filter types
export interface DeckFilters {
  ownerId?: string;
  visibility?: 'public' | 'friends' | 'private';
  category?: 'stocks' | 'crypto' | 'mixed' | 'watchlist';
  tags?: string[];
  isArchived?: boolean;
}

export interface CardNoteFilters {
  cardId?: string;
  authorId?: string;
  visibility?: 'public' | 'friends' | 'private';
  sentiment?: 'bullish' | 'bearish' | 'neutral';
  tags?: string[];
}

export interface ChallengeFilters {
  status?: 'draft' | 'open' | 'active' | 'completed' | 'cancelled';
  type?: 'trading' | 'prediction' | 'education' | 'social';
  creatorId?: string;
  isPublic?: boolean;
}
