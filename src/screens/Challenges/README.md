# Head-to-Head Challenges System

A comprehensive prediction challenge system where users compete by predicting stock/crypto price directions or exact price targets, with automated scoring, leaderboards, and prize distribution.

## Overview

The Challenges system enables users to create and participate in head-to-head prediction competitions with two types:

1. **Direction Challenges** - Predict if price goes up or down by end date
2. **Price Target Challenges** - Predict closest to exact price by end date

Features include real-time participation, automated settlement, scoring algorithms, weekly leaderboards, and social sharing.

## Features

### 🏆 **Challenge Types**

#### **Direction Challenges**
- **Objective**: Predict if asset price will go UP or DOWN by end date
- **Scoring**: Base 50 points for correct direction + bonus based on magnitude of change
- **Strategy**: Simple binary prediction with volatility bonus
- **Example**: "Will AAPL go up or down by Friday close?"

#### **Price Target Challenges**
- **Objective**: Predict the exact price closest to actual final price
- **Scoring**: Accuracy-based scoring (0-100 points based on percentage error)
- **Strategy**: Requires precise market analysis and price forecasting
- **Example**: "What will TSLA's price be next Monday at 4 PM EST?"

### 📱 **User Interface**

#### **ChallengesListScreen** (`src/screens/Challenges/ChallengesListScreen.tsx`)
- **Tabbed Interface**: Active, Joined, Completed, Leaderboard
- **Real-time Updates**: Live challenge status and participant counts
- **Challenge Cards**: Rich preview with status, time remaining, participants
- **Quick Actions**: Create, join, share challenges
- **Filter & Search**: Find challenges by status, type, or symbol

#### **CreateChallengeScreen** (`src/screens/Challenges/CreateChallengeScreen.tsx`)
- **Challenge Builder**: Step-by-step challenge creation wizard
- **Type Selection**: Visual direction vs. price target selector
- **Market Data Integration**: Real-time price fetching for symbols
- **Advanced Settings**: Privacy, participant limits, prize amounts
- **Live Preview**: Real-time preview of challenge card

#### **ChallengeDetailScreen** (`src/screens/Challenges/ChallengeDetailScreen.tsx`)
- **Interactive Participation**: Join challenges and submit guesses
- **Real-time Updates**: Live participant list and status changes
- **Guess Interface**: Direction selector or price input based on challenge type
- **Results Display**: Scores, winners, and final settlement data
- **Social Features**: Share, invite friends, copy challenge links

### ⚡ **Real-time Features**

#### **Live Challenge Updates**
```typescript
// Real-time challenge listening
const { challenge, loading } = useChallenge(challengeId);

// Automatic updates for:
- Participant joins/leaves
- Guess submissions
- Status changes
- Settlement results
```

#### **Dynamic Scoring Display**
- **Pre-Settlement**: Hidden guesses until challenge ends
- **Post-Settlement**: Full transparency with scores and rankings
- **Winner Highlighting**: Crown icons and special styling for winners
- **Score Breakdown**: Detailed scoring explanation for each participant

### 🎯 **Scoring Algorithms**

#### **Direction Challenge Scoring**
```typescript
function calculateDirectionScore(challenge, participant, finalPrice): number {
  const startingPrice = challenge.startingPrice;
  const actualDirection = finalPrice > startingPrice ? 'up' : 'down';
  const guessedDirection = participant.guess.direction;
  
  if (guessedDirection === actualDirection) {
    // Base score for correct direction
    let score = 50;
    
    // Bonus based on magnitude of change
    const changePercent = Math.abs((finalPrice - startingPrice) / startingPrice);
    const magnitudeBonus = Math.min(50, changePercent * 500);
    
    return score + magnitudeBonus;
  } else {
    return 0; // Wrong direction = 0 points
  }
}
```

#### **Price Target Scoring**
```typescript
function calculatePriceScore(challenge, participant, finalPrice): number {
  const targetPrice = participant.guess.targetPrice;
  const accuracy = 1 - Math.abs(finalPrice - targetPrice) / finalPrice;
  return Math.max(0, accuracy * 100);
}
```

### 🏅 **Leaderboard System**

#### **Weekly Leaderboard**
- **Reset Schedule**: Every Monday at midnight UTC
- **Scoring**: Cumulative weekly challenge scores
- **Rankings**: Real-time top 50 users
- **Rewards**: Recognition badges and titles

#### **All-Time Statistics**
```typescript
interface LeaderboardEntry {
  userId: string;
  displayName: string;
  totalChallenges: number;      // Lifetime participation
  challengesWon: number;        // Total wins
  totalScore: number;           // Cumulative score
  averageScore: number;         // Performance average
  totalPrizeWon: number;        // Prize money earned
  weeklyScore: number;          // Current week score
  score: number;                // Overall ranking score
}
```

## Technical Implementation

### **Frontend Architecture**

#### **React Hooks** (`src/hooks/useChallenges.ts`)
```typescript
// Primary hooks for challenge management
const { challenges, loading, refetch } = useChallenges('active');
const { challenge } = useChallenge(challengeId);
const { createChallenge } = useCreateChallenge();
const { joinChallenge } = useJoinChallenge();
const { submitGuess } = useSubmitGuess();
const { cancelChallenge } = useCancelChallenge();

// Utility hooks
const { stats } = useChallengeStats(userId);
const { updates } = useChallengeUpdates(challengeId);
const permissions = useChallengePermissions(challenge, userId);
```

#### **Real-time Data Synchronization**
```typescript
// Firestore onSnapshot listeners for live updates
useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(firestore, 'challenges', challengeId),
    (doc) => {
      if (doc.exists()) {
        const challengeData = convertFirestoreToChallenge(doc);
        setChallenge(challengeData);
      }
    }
  );
  return unsubscribe;
}, [challengeId]);
```

### **Backend Architecture**

#### **Cloud Functions** (`functions/src/challenges.ts`)

##### **Challenge Management Functions**
```typescript
// Create new challenge
export const createChallenge = onCall(async (request) => {
  // Validate challenge data
  // Fetch current market price
  // Create challenge document
  // Return challenge ID
});

// Join existing challenge
export const joinChallenge = onCall(async (request) => {
  // Validate challenge status
  // Check participant limits
  // Add user to participants array
  // Create activity log
});

// Submit prediction guess
export const submitGuess = onCall(async (request) => {
  // Validate guess format
  // Check submission deadline
  // Update participant with guess
  // Log submission activity
});

// Cancel challenge (creator only)
export const cancelChallenge = onCall(async (request) => {
  // Verify creator permissions
  // Check cancellation rules
  // Update challenge status
  // Notify participants
});
```

##### **Automated Settlement System**
```typescript
// Scheduled nightly settlement
export const settleChallenges = onSchedule({
  schedule: '0 2 * * *', // Daily at 2 AM UTC
}, async () => {
  // Find expired active challenges
  // Fetch final prices from market APIs
  // Calculate scores for all participants
  // Determine winners
  // Update leaderboard
  // Send notifications
  // Create settlement records
});
```

##### **Settlement Process Flow**
```typescript
async function settleChallenge(challenge) {
  // 1. Fetch final price from Polygon API
  const finalPrice = await fetchCurrentPrice(challenge.symbol);
  
  // 2. Calculate scores for all participants
  const scoredParticipants = challenge.participants.map(participant => ({
    ...participant,
    score: calculateScore(challenge, participant, finalPrice),
  }));
  
  // 3. Determine winners (highest score)
  const maxScore = Math.max(...scoredParticipants.map(p => p.score));
  const winners = scoredParticipants.filter(p => p.score === maxScore);
  
  // 4. Update challenge with results
  await updateChallengeResults(challenge.id, {
    status: 'completed',
    participants: scoredParticipants,
    finalPrice,
    winners,
  });
  
  // 5. Update leaderboard and send notifications
  await Promise.all([
    updateLeaderboard(scoredParticipants, challenge),
    notifyParticipants(challenge, scoredParticipants, winners),
  ]);
}
```

### **Data Models**

#### **Challenge Document** (`challenges/{challengeId}`)
```typescript
interface Challenge {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  symbol: string;                    // AAPL, TSLA, BTC, etc.
  type: 'direction' | 'price';       // Challenge type
  endDate: Date;                     // Settlement deadline
  prizeAmount: number;               // Prize pool (0 for free)
  maxParticipants?: number;          // Participant limit
  isPrivate: boolean;                // Public vs private
  targetPrice?: number;              // For price challenges
  startingPrice: number;             // Reference price
  currentPrice: number;              // Price at creation
  finalPrice?: number;               // Settlement price
  status: 'active' | 'completed' | 'cancelled' | 'settlement_failed';
  participants: Participant[];
  settlementResult?: SettlementResult;
  createdAt: Date;
  settledAt?: Date;
}
```

#### **Participant Structure**
```typescript
interface Participant {
  userId: string;
  displayName: string;
  joinedAt: Date;
  guess?: {
    direction?: 'up' | 'down';      // For direction challenges
    targetPrice?: number;          // For price challenges
  };
  guessSubmittedAt?: Date;
  score?: number;                   // 0-100 calculated score
  isWinner: boolean;                // Winner flag
  finalPrice?: number;              // Price at settlement
}
```

#### **Settlement Result**
```typescript
interface SettlementResult {
  challengeId: string;
  settledAt: Date;
  finalPrice: number;
  startingPrice: number;
  winners: Array<{
    userId: string;
    displayName: string;
    score: number;
    guess: any;
  }>;
  totalParticipants: number;
  averageScore: number;
}
```

### **Security & Permissions**

#### **Firestore Security Rules**
```firestore
// Challenges collection
match /challenges/{challengeId} {
  // Anyone can read public challenges
  allow read: if resource.data.isPrivate == false || 
                 request.auth.uid == resource.data.creatorId ||
                 request.auth.uid in resource.data.participants[].userId;
  
  // Only authenticated users can create
  allow create: if request.auth != null && 
                   request.auth.uid == request.resource.data.creatorId;
  
  // Only creator can update before participants join
  allow update: if request.auth.uid == resource.data.creatorId && 
                   resource.data.participants.size() <= 1;
  
  // Cloud Functions can update for settlements
  allow update: if request.auth.token.firebase.sign_in_provider == 'custom';
}

// Challenge results subcollection
match /challenges/{challengeId}/results/{resultId} {
  allow read: if request.auth != null;
  allow write: if false; // Only Cloud Functions
}

// Leaderboard collection
match /leaderboard/{userId} {
  allow read: if request.auth != null;
  allow write: if false; // Only Cloud Functions
}
```

#### **Permission Validation**
```typescript
// Client-side permission checks
const permissions = useChallengePermissions(challenge, userId);

const {
  canJoin,          // Can user join this challenge?
  canSubmitGuess,   // Can user submit/update guess?
  canCancel,        // Can user cancel challenge?
  isCreator,        // Is user the challenge creator?
  isParticipant,    // Is user a participant?
  challengeEnded,   // Has challenge deadline passed?
} = permissions;
```

### **Market Data Integration**

#### **Price Fetching** (Polygon API)
```typescript
async function fetchCurrentPrice(symbol: string): Promise<number> {
  const response = await axios.get(
    `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev`,
    {
      params: {
        apikey: process.env.POLYGON_API_KEY,
        adjusted: true,
      },
    }
  );
  
  return response.data.results[0].c; // closing price
}
```

#### **Supported Assets**
- **Stocks**: AAPL, TSLA, GOOGL, MSFT, AMZN, etc.
- **Crypto**: BTC, ETH, ADA, DOGE, etc. (via crypto exchanges)
- **ETFs**: SPY, QQQ, VTI, etc.
- **Forex**: EUR/USD, GBP/USD, etc. (future expansion)

### **Performance Optimizations**

#### **Real-time Efficiency**
- **Selective Listeners**: Only active challenges use onSnapshot
- **Pagination**: Limit 50 challenges per query
- **Caching**: Client-side challenge data caching
- **Batch Operations**: Bulk updates for settlements

#### **Settlement Optimization**
```typescript
// Parallel processing for multiple challenges
const settlementPromises = challenges.map(challenge => 
  settleChallenge(challenge).catch(error => {
    logger.error(`Settlement failed for ${challenge.id}:`, error);
    return null; // Continue with other challenges
  })
);

const results = await Promise.allSettled(settlementPromises);
```

## Usage Examples

### **Creating a Challenge**
```typescript
import { useCreateChallenge } from '../hooks/useChallenges';

const CreateChallengeExample = () => {
  const { createChallenge, loading } = useCreateChallenge();

  const handleCreate = async () => {
    try {
      const result = await createChallenge({
        title: "AAPL Direction Challenge",
        symbol: "AAPL",
        type: "direction",
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        prizeAmount: 50.00,
        maxParticipants: 10,
        isPrivate: false,
      });
      
      console.log('Challenge created:', result.challengeId);
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };
};
```

### **Joining and Participating**
```typescript
import { useJoinChallenge, useSubmitGuess } from '../hooks/useChallenges';

const ParticipationExample = () => {
  const { joinChallenge } = useJoinChallenge();
  const { submitGuess } = useSubmitGuess();

  const handleJoin = async (challengeId: string) => {
    await joinChallenge(challengeId);
  };

  const handleGuess = async (challengeId: string) => {
    // For direction challenge
    await submitGuess(challengeId, { direction: 'up' });
    
    // For price challenge
    await submitGuess(challengeId, { targetPrice: 150.25 });
  };
};
```

### **Real-time Challenge Monitoring**
```typescript
import { useChallenge, useChallengeUpdates } from '../hooks/useChallenges';

const ChallengeMonitoring = ({ challengeId }: { challengeId: string }) => {
  const { challenge, loading } = useChallenge(challengeId);
  const { updates } = useChallengeUpdates(challengeId);

  return (
    <View>
      <Text>Participants: {challenge?.participants.length}</Text>
      <Text>Status: {challenge?.status}</Text>
      
      {/* Recent activity feed */}
      {updates.map(update => (
        <Text key={update.id}>
          {update.type}: {update.displayName} at {update.timestamp.toLocaleString()}
        </Text>
      ))}
    </View>
  );
};
```

## Deployment & Configuration

### **Environment Variables**
```bash
# Market Data API
POLYGON_API_KEY=your_polygon_api_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key

# Challenge Settings
CHALLENGE_MAX_DURATION_DAYS=365
CHALLENGE_MIN_PARTICIPANTS=2
CHALLENGE_MAX_PARTICIPANTS=100
SETTLEMENT_RETRY_ATTEMPTS=3
```

### **Cloud Function Deployment**
```bash
# Deploy challenge functions
firebase deploy --only functions:createChallenge,functions:joinChallenge,functions:submitGuess,functions:cancelChallenge,functions:settleChallenges,functions:resetWeeklyLeaderboard

# Deploy Firestore rules and indexes
firebase deploy --only firestore:rules,firestore:indexes

# Set environment variables
firebase functions:config:set polygon.api_key="your_api_key"
firebase functions:config:set challenges.max_duration="365"
```

### **Required Firestore Indexes**
```json
{
  "indexes": [
    {
      "collectionGroup": "challenges",
      "fields": [
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "endDate", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "challenges",
      "fields": [
        {"fieldPath": "creatorId", "order": "ASCENDING"},
        {"fieldPath": "status", "order": "ASCENDING"},
        {"fieldPath": "endDate", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "leaderboard",
      "fields": [
        {"fieldPath": "score", "order": "DESCENDING"}
      ]
    },
    {
      "collectionGroup": "leaderboard",
      "fields": [
        {"fieldPath": "weeklyScore", "order": "DESCENDING"}
      ]
    }
  ]
}
```

## Testing & Monitoring

### **Unit Tests**
```typescript
// Example test for scoring algorithm
describe('Challenge Scoring', () => {
  test('direction challenge scoring', () => {
    const challenge = { type: 'direction', startingPrice: 100 };
    const participant = { guess: { direction: 'up' } };
    const finalPrice = 110; // 10% increase
    
    const score = calculateScore(challenge, participant, finalPrice);
    expect(score).toBeGreaterThan(50); // Base + magnitude bonus
  });
  
  test('price challenge accuracy', () => {
    const challenge = { type: 'price' };
    const participant = { guess: { targetPrice: 105 } };
    const finalPrice = 100; // 5% error
    
    const score = calculateScore(challenge, participant, finalPrice);
    expect(score).toBe(95); // 95% accuracy
  });
});
```

### **Monitoring & Analytics**
```typescript
// Settlement statistics tracking
interface SettlementStats {
  totalSettlements: number;
  totalChallengesSettled: number;
  totalSuccessful: number;
  totalFailed: number;
  lastSettlementAt: Date;
  averageSettlementTime: number;
}

// Challenge performance metrics
interface ChallengeMetrics {
  totalChallengesCreated: number;
  activechallenges: number;
  completionRate: number;
  averageParticipants: number;
  popularSymbols: string[];
  prizeDistribution: number;
}
```

### **Error Handling**
- **Settlement Failures**: Automatic retry with exponential backoff
- **API Rate Limits**: Request queuing and throttling
- **Network Issues**: Graceful degradation and offline support
- **Data Validation**: Comprehensive input validation on client and server

## Future Enhancements

### **Advanced Features**
- **Multi-Asset Challenges**: Predict multiple symbols simultaneously
- **Time-Series Challenges**: Predict price at multiple time points
- **Volatility Challenges**: Predict price volatility ranges
- **Options Challenges**: Predict option prices and Greeks

### **Social Features**
- **Team Challenges**: Group competitions and corporate leagues
- **Tournament Brackets**: Elimination-style competitions
- **Achievement System**: Badges for various accomplishments
- **Social Feeds**: Activity streams and challenge discussions

### **Gamification**
- **Skill Ratings**: ELO-style rating system for participants
- **Seasonal Competitions**: Quarterly championships with big prizes
- **Prediction Streaks**: Bonus points for consecutive wins
- **Market Specialist Badges**: Recognition for expertise in specific assets

The Challenges system provides a comprehensive platform for financial prediction competitions with enterprise-grade reliability, real-time features, and extensive customization options. It's designed to scale from small friend groups to large community competitions while maintaining fairness and transparency.
