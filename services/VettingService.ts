import { logEvent, AnalyticsEvents } from './analytics';
import { firestore } from './firebase-platform';
import firestoreNS, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface VettingRecommendation {
  id: string;
  submitterId: string;
  submitterName: string;
  submitterAvatar?: string;
  submitterReputation: number;
  type: 'stock' | 'crypto' | 'strategy' | 'education';
  assetSymbol?: string;
  assetName?: string;
  assetPrice?: number;
  assetChange?: number;
  recommendation: 'buy' | 'sell' | 'hold' | 'watch';
  reasoning: string;
  targetPrice?: number;
  timeHorizon?: 'short' | 'medium' | 'long';
  riskLevel?: 'low' | 'medium' | 'high';
  supportingData?: {
    technicalAnalysis?: string;
    fundamentalAnalysis?: string;
    newsEvents?: string[];
    charts?: string[];
  };
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'expired';
  votes: {
    upvotes: number;
    downvotes: number;
    totalVoters: number;
    weightedScore: number;
  };
  voterDetails: Array<{
    userId: string;
    userName: string;
    vote: 'up' | 'down';
    reputation: number;
    timestamp: FirebaseFirestoreTypes.Timestamp;
    comment?: string;
  }>;
  communityAnalysis: {
    discussionCount: number;
    lastDiscussionAt?: FirebaseFirestoreTypes.Timestamp;
    consensusScore: number;
    confidenceLevel: 'low' | 'medium' | 'high';
  };
  performance?: {
    actualPrice?: number;
    actualChange?: number;
    targetMet?: boolean;
    accuracyScore?: number;
  };
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  expiresAt: FirebaseFirestoreTypes.Timestamp;
}

export interface UserReputation {
  userId: string;
  userName: string;
  userAvatar?: string;
  totalRecommendations: number;
  approvedRecommendations: number;
  accuracyRate: number;
  reputationScore: number;
  level: 'novice' | 'intermediate' | 'expert' | 'master';
  badges: string[];
  lastUpdated: FirebaseFirestoreTypes.Timestamp;
}

export interface VettingStats {
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectionRate: number;
  avgVotingTime: number;
  communityEngagement: number;
}

class VettingService {
  private getVettingCollection = () => firestore().collection('vetting_queue');
  private getReputationCollection = () => firestore().collection('user_reputation');
  private getVotesCollection = () => firestore().collection('vetting_votes');

  // Submit a recommendation for community vetting
  async submitForVetting(
    submitterId: string,
    submitterName: string,
    submitterAvatar: string | undefined,
    submitterReputation: number,
    recommendationData: Omit<VettingRecommendation, 'id' | 'submitterId' | 'submitterName' | 'submitterAvatar' | 'submitterReputation' | 'status' | 'votes' | 'voterDetails' | 'communityAnalysis' | 'createdAt' | 'updatedAt' | 'expiresAt'>
  ): Promise<string> {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days to vote

      const vettingRecommendation: Omit<VettingRecommendation, 'id'> = {
        ...recommendationData,
        submitterId,
        submitterName,
        submitterAvatar,
        submitterReputation,
        status: 'pending',
        votes: {
          upvotes: 0,
          downvotes: 0,
          totalVoters: 0,
          weightedScore: 0,
        },
        voterDetails: [],
        communityAnalysis: {
          discussionCount: 0,
          consensusScore: 0,
          confidenceLevel: 'low',
        },
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        expiresAt: firestore.Timestamp.fromDate(expiresAt),
      };

      const docRef = await this.getVettingCollection().add(vettingRecommendation);
      
      // Log analytics event
      logEvent(AnalyticsEvents.SUBMIT_FOR_VETTING, {
        vetting_id: docRef.id,
        type: recommendationData.type,
        asset_symbol: recommendationData.assetSymbol,
        submitter_reputation: submitterReputation,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error submitting for vetting:', error);
      throw error;
    }
  }

  // Get pending vetting recommendations
  async getPendingVetting(): Promise<VettingRecommendation[]> {
    try {
      const snapshot = await this.getVettingCollection()
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as VettingRecommendation));
    } catch (error) {
      console.error('Error getting pending vetting:', error);
      throw error;
    }
  }

  // Get voting queue (recommendations open for voting)
  async getVotingQueue(): Promise<VettingRecommendation[]> {
    try {
      const snapshot = await this.getVettingCollection()
        .where('status', '==', 'voting')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();
      
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as VettingRecommendation));
    } catch (error) {
      console.error('Error getting voting queue:', error);
      throw error;
    }
  }

  // Vote on a recommendation
  async voteOnRecommendation(
    vettingId: string,
    userId: string,
    userName: string,
    userReputation: number,
    vote: 'up' | 'down',
    comment?: string
  ): Promise<void> {
    try {
      const vettingRef = this.getVettingCollection().doc(vettingId);
      const voteRef = this.getVotesCollection().doc(`${vettingId}_${userId}`);

      // Check if user already voted
      const existingVote = await voteRef.get();
      
      if (existingVote.exists) {
        throw new Error('User has already voted on this recommendation');
      }

      // Add vote record
      await this.getVotesCollection().add({
        vettingId,
        userId,
        userName,
        userReputation,
        vote,
        comment,
        timestamp: firestore.FieldValue.serverTimestamp(),
      });

      // Update vetting recommendation
      const voteWeight = this.calculateVoteWeight(userReputation);
      const voteIncrement = vote === 'up' ? 1 : -1;
      const weightedIncrement = voteWeight * voteIncrement;

      await vettingRef.update({
        [`votes.${vote === 'up' ? 'upvotes' : 'downvotes'}`]: firestore.FieldValue.increment(1),
        'votes.totalVoters': firestore.FieldValue.increment(1),
        'votes.weightedScore': firestore.FieldValue.increment(weightedIncrement),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Add voter details using arrayUnion
      await vettingRef.update({
        voterDetails: firestore.FieldValue.arrayUnion({
          userId,
          userName,
          vote,
          reputation: userReputation,
          timestamp: firestore.FieldValue.serverTimestamp(),
          comment,
        }),
      });

      // Check if recommendation should be approved/rejected
      await this.checkVotingThreshold(vettingId);

      logEvent(AnalyticsEvents.VOTE_ON_RECOMMENDATION, {
        vetting_id: vettingId,
        vote,
        user_reputation: userReputation,
        has_comment: !!comment,
      });
    } catch (error) {
      console.error('Error voting on recommendation:', error);
      throw error;
    }
  }

  // Calculate vote weight based on user reputation
  private calculateVoteWeight(userReputation: number): number {
    if (userReputation >= 100) return 3; // Master level
    if (userReputation >= 50) return 2;  // Expert level
    if (userReputation >= 20) return 1.5; // Intermediate level
    return 1; // Novice level
  }

  // Check if recommendation meets voting threshold
  private async checkVotingThreshold(vettingId: string): Promise<void> {
    try {
      const vettingRef = this.getVettingCollection().doc(vettingId);
      const vettingDoc = await vettingRef.get();
      
      if (!vettingDoc.exists) return;

      const data = vettingDoc.data() as VettingRecommendation;
      const { upvotes, downvotes, weightedScore, totalVoters } = data.votes;

      // Approval threshold: 70% approval rate with minimum 10 votes
      const approvalRate = upvotes / (upvotes + downvotes);
      const isApproved = approvalRate >= 0.7 && totalVoters >= 10 && weightedScore > 0;
      
      // Rejection threshold: 60% rejection rate with minimum 5 votes
      const rejectionRate = downvotes / (upvotes + downvotes);
      const isRejected = rejectionRate >= 0.6 && totalVoters >= 5;

      if (isApproved) {
        await vettingRef.update({
          status: 'approved',
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        
        // Convert to trading signal
        await this.convertToSignal(data);
      } else if (isRejected) {
        await vettingRef.update({
          status: 'rejected',
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error checking voting threshold:', error);
    }
  }

  // Convert approved recommendation to trading signal
  private async convertToSignal(vettingRecommendation: VettingRecommendation): Promise<void> {
    try {
      // This would integrate with your signal generation system
      // For now, we'll just log the conversion
      console.log('Converting approved recommendation to signal:', vettingRecommendation.id);
      
      logEvent(AnalyticsEvents.CONVERT_TO_SIGNAL, {
        vetting_id: vettingRecommendation.id,
        type: vettingRecommendation.type,
        asset_symbol: vettingRecommendation.assetSymbol,
      });
    } catch (error) {
      console.error('Error converting to signal:', error);
    }
  }

  // Get user reputation
  async getUserReputation(userId: string): Promise<UserReputation | null> {
    try {
      const snapshot = await this.getReputationCollection()
        .where('userId', '==', userId)
        .get();
      
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as UserReputation;
    } catch (error) {
      console.error('Error getting user reputation:', error);
      throw error;
    }
  }

  // Update user reputation
  async updateUserReputation(
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    accuracyScore: number
  ): Promise<void> {
    try {
      const snapshot = await this.getReputationCollection()
        .where('userId', '==', userId)
        .get();
      
      if (snapshot.empty) {
        // Create new reputation record
        const newReputation: Omit<UserReputation, 'id'> = {
          userId,
          userName,
          userAvatar,
          totalRecommendations: 1,
          approvedRecommendations: accuracyScore > 0 ? 1 : 0,
          accuracyRate: accuracyScore,
          reputationScore: this.calculateReputationScore(1, accuracyScore),
          level: this.calculateReputationLevel(1, accuracyScore),
          badges: this.calculateBadges(1, accuracyScore),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        };

        await this.getReputationCollection().add(newReputation);
      } else {
        // Update existing reputation
        const docRef = snapshot.docs[0].ref;
        const currentData = snapshot.docs[0].data() as UserReputation;
        
        const newTotal = currentData.totalRecommendations + 1;
        const newApproved = currentData.approvedRecommendations + (accuracyScore > 0 ? 1 : 0);
        const newAccuracyRate = (currentData.accuracyRate * currentData.totalRecommendations + accuracyScore) / newTotal;
        const newReputationScore = this.calculateReputationScore(newTotal, newAccuracyRate);

        await docRef.update({
          totalRecommendations: newTotal,
          approvedRecommendations: newApproved,
          accuracyRate: newAccuracyRate,
          reputationScore: newReputationScore,
          level: this.calculateReputationLevel(newTotal, newAccuracyRate),
          badges: this.calculateBadges(newTotal, newAccuracyRate),
          lastUpdated: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating user reputation:', error);
      throw error;
    }
  }

  // Calculate reputation score
  private calculateReputationScore(totalRecommendations: number, accuracyRate: number): number {
    const baseScore = totalRecommendations * 2;
    const accuracyBonus = accuracyRate * 10;
    return Math.min(baseScore + accuracyBonus, 100); // Cap at 100
  }

  // Calculate reputation level
  private calculateReputationLevel(totalRecommendations: number, accuracyRate: number): UserReputation['level'] {
    const score = this.calculateReputationScore(totalRecommendations, accuracyRate);
    
    if (score >= 80) return 'master';
    if (score >= 60) return 'expert';
    if (score >= 30) return 'intermediate';
    return 'novice';
  }

  // Calculate badges
  private calculateBadges(totalRecommendations: number, accuracyRate: number): string[] {
    const badges: string[] = [];
    
    if (totalRecommendations >= 10) badges.push('contributor');
    if (totalRecommendations >= 50) badges.push('veteran');
    if (accuracyRate >= 0.8) badges.push('accurate');
    if (accuracyRate >= 0.9) badges.push('expert');
    if (totalRecommendations >= 100) badges.push('legend');
    
    return badges;
  }

  // Get vetting statistics
  async getVettingStats(): Promise<VettingStats> {
    try {
      const snapshot = await this.getVettingCollection().get();
      
      const recommendations = snapshot.docs.map((doc: any) => doc.data() as VettingRecommendation);
      
      const totalSubmissions = recommendations.length;
      const approvedSubmissions = recommendations.filter((r: any) => r.status === 'approved').length;
      const rejectionRate = recommendations.filter((r: any) => r.status === 'rejected').length / totalSubmissions;
      
      // Calculate average voting time (simplified)
      const avgVotingTime = 24; // hours
      
      // Calculate community engagement
      const totalVotes = recommendations.reduce((sum: any, r: any) => sum + r.votes.totalVoters, 0);
      const communityEngagement = totalVotes / totalSubmissions;

      return {
        totalSubmissions,
        approvedSubmissions,
        rejectionRate,
        avgVotingTime,
        communityEngagement,
      };
    } catch (error) {
      console.error('Error getting vetting stats:', error);
      throw error;
    }
  }

  // Subscribe to real-time vetting updates
  subscribeToVettingQueue(
    callback: (recommendations: VettingRecommendation[]) => void
  ): () => void {
    return this.getVettingCollection()
      .where('status', 'in', ['pending', 'voting'])
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot((snapshot: any) => {
        const recommendations = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as VettingRecommendation));
        callback(recommendations);
      });
  }
}

export const vettingService = new VettingService();
