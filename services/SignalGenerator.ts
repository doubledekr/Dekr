import { logEvent, AnalyticsEvents } from './analytics';
import { firestore } from './firebase-platform';
import { VettingRecommendation } from './VettingService';
import firestoreNS, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface TradingSignal {
  id: string;
  signalId: string;
  type: 'buy' | 'sell' | 'hold' | 'watch';
  assetSymbol: string;
  assetName: string;
  assetType: 'stock' | 'crypto' | 'etf' | 'forex';
  currentPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  timeHorizon: 'short' | 'medium' | 'long';
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number; // 0-100
  reasoning: string;
  technicalAnalysis?: string;
  fundamentalAnalysis?: string;
  communityScore: number; // Based on vetting votes
  sourceRecommendationId: string; // Link to original vetting recommendation
  sourceUserId: string;
  sourceUserName: string;
  sourceReputation: number;
  status: 'active' | 'triggered' | 'expired' | 'cancelled';
  performance?: {
    entryPrice?: number;
    exitPrice?: number;
    actualReturn?: number;
    maxDrawdown?: number;
    hitTarget?: boolean;
    hitStopLoss?: boolean;
  };
  subscribers: string[]; // User IDs who subscribed to this signal
  createdAt: FirebaseFirestoreTypes.Timestamp;
  updatedAt: FirebaseFirestoreTypes.Timestamp;
  expiresAt: FirebaseFirestoreTypes.Timestamp;
}

export interface SignalAlert {
  id: string;
  signalId: string;
  userId: string;
  alertType: 'price_target' | 'stop_loss' | 'time_expiry' | 'signal_update';
  triggerPrice?: number;
  triggerTime?: FirebaseFirestoreTypes.Timestamp;
  message: string;
  isRead: boolean;
  createdAt: FirebaseFirestoreTypes.Timestamp;
}

export interface SignalPerformance {
  signalId: string;
  totalSubscribers: number;
  totalViews: number;
  successRate: number;
  avgReturn: number;
  maxReturn: number;
  minReturn: number;
  avgHoldingPeriod: number; // in days
  riskAdjustedReturn: number; // Sharpe ratio equivalent
}

class SignalGenerator {
  private getSignalsCollection = () => firestore().collection('trading_signals');
  private getAlertsCollection = () => firestore().collection('signal_alerts');
  private getPerformanceCollection = () => firestore().collection('signal_performance');

  // Convert approved vetting recommendation to trading signal
  async convertVettingToSignal(vettingRecommendation: VettingRecommendation): Promise<string> {
    try {
      // Calculate confidence based on community voting
      const { upvotes, downvotes, weightedScore } = vettingRecommendation.votes;
      const totalVotes = upvotes + downvotes;
      const approvalRate = totalVotes > 0 ? upvotes / totalVotes : 0;
      
      // Base confidence on approval rate and weighted score
      let confidence = Math.min(approvalRate * 100, 95); // Cap at 95%
      
      // Boost confidence for high-reputation submitters
      if (vettingRecommendation.submitterReputation >= 80) {
        confidence = Math.min(confidence + 10, 95);
      } else if (vettingRecommendation.submitterReputation >= 50) {
        confidence = Math.min(confidence + 5, 95);
      }

      // Calculate community score (0-100)
      const communityScore = Math.min(weightedScore * 10, 100);

      // Determine signal type from recommendation
      const signalType = this.mapRecommendationToSignal(vettingRecommendation.recommendation);

      // Calculate expiry time based on time horizon
      const expiresAt = this.calculateExpiryTime(vettingRecommendation.timeHorizon);

      const signal: Omit<TradingSignal, 'id'> = {
        signalId: this.generateSignalId(),
        type: signalType,
        assetSymbol: vettingRecommendation.assetSymbol || 'UNKNOWN',
        assetName: vettingRecommendation.assetName || 'Unknown Asset',
        assetType: this.mapTypeToAssetType(vettingRecommendation.type),
        currentPrice: vettingRecommendation.assetPrice || 0,
        targetPrice: vettingRecommendation.targetPrice,
        stopLoss: this.calculateStopLoss(
          vettingRecommendation.assetPrice || 0,
          signalType,
          vettingRecommendation.riskLevel
        ),
        timeHorizon: vettingRecommendation.timeHorizon || 'medium',
        riskLevel: vettingRecommendation.riskLevel || 'medium',
        confidence,
        reasoning: vettingRecommendation.reasoning,
        technicalAnalysis: vettingRecommendation.supportingData?.technicalAnalysis,
        fundamentalAnalysis: vettingRecommendation.supportingData?.fundamentalAnalysis,
        communityScore,
        sourceRecommendationId: vettingRecommendation.id,
        sourceUserId: vettingRecommendation.submitterId,
        sourceUserName: vettingRecommendation.submitterName,
        sourceReputation: vettingRecommendation.submitterReputation,
        status: 'active',
        subscribers: [],
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        expiresAt,
      };

      const docRef = await this.getSignalsCollection().add(signal);

      // Create initial performance tracking
      await this.createSignalPerformance(docRef.id);

      // Log analytics event
      logEvent(AnalyticsEvents.CREATE_SIGNAL, {
        signal_id: docRef.id,
        source_recommendation_id: vettingRecommendation.id,
        signal_type: signalType,
        asset_symbol: signal.assetSymbol,
        confidence,
        community_score: communityScore,
      });

      return docRef.id;
    } catch (error) {
      console.error('Error converting vetting to signal:', error);
      throw error;
    }
  }

  // Map recommendation type to signal type
  private mapRecommendationToSignal(recommendation: VettingRecommendation['recommendation']): TradingSignal['type'] {
    switch (recommendation) {
      case 'buy':
        return 'buy';
      case 'sell':
        return 'sell';
      case 'hold':
        return 'hold';
      case 'watch':
        return 'watch';
      default:
        return 'watch';
    }
  }

  // Map vetting type to asset type
  private mapTypeToAssetType(type: VettingRecommendation['type']): TradingSignal['assetType'] {
    switch (type) {
      case 'stock':
        return 'stock';
      case 'crypto':
        return 'crypto';
      case 'strategy':
        return 'etf'; // Strategy recommendations often become ETF signals
      default:
        return 'stock';
    }
  }

  // Calculate stop loss based on risk level and signal type
  private calculateStopLoss(
    currentPrice: number,
    signalType: TradingSignal['type'],
    riskLevel: VettingRecommendation['riskLevel']
  ): number | undefined {
    if (signalType === 'hold' || signalType === 'watch') return undefined;

    let stopLossPercentage: number;
    switch (riskLevel) {
      case 'low':
        stopLossPercentage = 0.05; // 5%
        break;
      case 'medium':
        stopLossPercentage = 0.08; // 8%
        break;
      case 'high':
        stopLossPercentage = 0.12; // 12%
        break;
      default:
        stopLossPercentage = 0.08;
    }

    if (signalType === 'buy') {
      return currentPrice * (1 - stopLossPercentage);
    } else if (signalType === 'sell') {
      return currentPrice * (1 + stopLossPercentage);
    }

    return undefined;
  }

  // Calculate expiry time based on time horizon
  private calculateExpiryTime(timeHorizon: VettingRecommendation['timeHorizon']): any {
    const now = new Date();
    let expiryDays: number;

    switch (timeHorizon) {
      case 'short':
        expiryDays = 7; // 1 week
        break;
      case 'medium':
        expiryDays = 30; // 1 month
        break;
      case 'long':
        expiryDays = 90; // 3 months
        break;
      default:
        expiryDays = 30;
    }

    const expiryDate = new Date(now.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
    return firestore.Timestamp.fromDate(expiryDate);
  }

  // Generate unique signal ID
  private generateSignalId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `SIG_${timestamp}_${random}`.toUpperCase();
  }

  // Create initial performance tracking for a signal
  private async createSignalPerformance(signalId: string): Promise<void> {
    try {
      const performance: Omit<SignalPerformance, 'signalId'> = {
        totalSubscribers: 0,
        totalViews: 0,
        successRate: 0,
        avgReturn: 0,
        maxReturn: 0,
        minReturn: 0,
        avgHoldingPeriod: 0,
        riskAdjustedReturn: 0,
      };

      await this.getPerformanceCollection().add({
        signalId,
        ...performance,
      });
    } catch (error) {
      console.error('Error creating signal performance:', error);
    }
  }

  // Get active trading signals
  async getActiveSignals(limitCount: number = 20): Promise<TradingSignal[]> {
    try {
      const snapshot = await this.getSignalsCollection()
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(limitCount)
        .get();
      
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as TradingSignal));
    } catch (error) {
      console.error('Error getting active signals:', error);
      throw error;
    }
  }

  // Get signals by asset symbol
  async getSignalsByAsset(assetSymbol: string): Promise<TradingSignal[]> {
    try {
      const snapshot = await this.getSignalsCollection()
        .where('assetSymbol', '==', assetSymbol.toUpperCase())
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as TradingSignal));
    } catch (error) {
      console.error('Error getting signals by asset:', error);
      throw error;
    }
  }

  // Subscribe to a signal
  async subscribeToSignal(signalId: string, userId: string): Promise<void> {
    try {
      const signalRef = this.getSignalsCollection().doc(signalId);
      const signalDoc = await signalRef.get();
      
      if (!signalDoc.exists) {
        throw new Error('Signal not found');
      }

      const signal = signalDoc.data() as TradingSignal;
      
      if (signal.subscribers.includes(userId)) {
        throw new Error('Already subscribed to this signal');
      }

      const updatedSubscribers = [...signal.subscribers, userId];
      
      await signalRef.update({
        subscribers: updatedSubscribers,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update performance tracking
      await this.updateSignalPerformance(signalId, { totalSubscribers: updatedSubscribers.length });

      logEvent(AnalyticsEvents.SUBSCRIBE_TO_SIGNAL, {
        signal_id: signalId,
        user_id: userId,
      });
    } catch (error) {
      console.error('Error subscribing to signal:', error);
      throw error;
    }
  }

  // Unsubscribe from a signal
  async unsubscribeFromSignal(signalId: string, userId: string): Promise<void> {
    try {
      const signalRef = this.getSignalsCollection().doc(signalId);
      const signalDoc = await signalRef.get();
      
      if (!signalDoc.exists) {
        throw new Error('Signal not found');
      }

      const signal = signalDoc.data() as TradingSignal;
      const updatedSubscribers = signal.subscribers.filter(id => id !== userId);
      
      await signalRef.update({
        subscribers: updatedSubscribers,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update performance tracking
      await this.updateSignalPerformance(signalId, { totalSubscribers: updatedSubscribers.length });

      logEvent(AnalyticsEvents.UNSUBSCRIBE_FROM_SIGNAL, {
        signal_id: signalId,
        user_id: userId,
      });
    } catch (error) {
      console.error('Error unsubscribing from signal:', error);
      throw error;
    }
  }

  // Update signal performance metrics
  async updateSignalPerformance(
    signalId: string, 
    updates: Partial<Omit<SignalPerformance, 'signalId'>>
  ): Promise<void> {
    try {
      const snapshot = await this.getPerformanceCollection()
        .where('signalId', '==', signalId)
        .get();
      
      if (snapshot.empty) return;

      const docRef = snapshot.docs[0].ref;
      await docRef.update(updates);
    } catch (error) {
      console.error('Error updating signal performance:', error);
    }
  }

  // Create signal alert
  async createSignalAlert(
    signalId: string,
    userId: string,
    alertType: SignalAlert['alertType'],
    message: string,
    triggerPrice?: number,
    triggerTime?: any
  ): Promise<void> {
    try {
      const alert: Omit<SignalAlert, 'id'> = {
        signalId,
        userId,
        alertType,
        triggerPrice,
        triggerTime,
        message,
        isRead: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      await this.getAlertsCollection().add(alert);

      logEvent(AnalyticsEvents.CREATE_SIGNAL_ALERT, {
        signal_id: signalId,
        user_id: userId,
        alert_type: alertType,
      });
    } catch (error) {
      console.error('Error creating signal alert:', error);
      throw error;
    }
  }

  // Get user's signal alerts
  async getUserSignalAlerts(userId: string): Promise<SignalAlert[]> {
    try {
      const snapshot = await this.getAlertsCollection()
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();
      
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as SignalAlert));
    } catch (error) {
      console.error('Error getting user signal alerts:', error);
      throw error;
    }
  }

  // Update signal status
  async updateSignalStatus(
    signalId: string,
    status: TradingSignal['status'],
    performance?: TradingSignal['performance']
  ): Promise<void> {
    try {
      const signalRef = this.getSignalsCollection().doc(signalId);
      const updateData: any = {
        status,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      if (performance) {
        updateData.performance = performance;
      }

      await signalRef.update(updateData);

      logEvent(AnalyticsEvents.UPDATE_SIGNAL_STATUS, {
        signal_id: signalId,
        status,
        has_performance: !!performance,
      });
    } catch (error) {
      console.error('Error updating signal status:', error);
      throw error;
    }
  }

  // Subscribe to real-time signal updates
  subscribeToSignals(
    callback: (signals: TradingSignal[]) => void
  ): () => void {
    return this.getSignalsCollection()
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .onSnapshot((snapshot: any) => {
        const signals = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        } as TradingSignal));
        callback(signals);
      });
  }
}

export const signalGenerator = new SignalGenerator();
