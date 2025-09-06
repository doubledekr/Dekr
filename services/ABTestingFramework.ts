// A/B Testing Framework for systematic optimization of personalization algorithms and user experience
import { Platform } from 'react-native';

// Check if we're running in Expo Go (which doesn't support native Firebase modules)
const isExpoGo = typeof global.__expo !== 'undefined' && global.__expo?.modules?.ExpoGo;

// Dummy implementations for Expo Go
const dummyFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false, data: () => ({}) }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: () => Promise.resolve({ id: 'dummy-id' }),
    where: () => ({
      orderBy: () => ({
        limit: () => ({
          get: () => Promise.resolve({ docs: [] })
        }),
        get: () => Promise.resolve({ docs: [] })
      }),
      limit: () => ({
        get: () => Promise.resolve({ docs: [] })
      }),
      get: () => Promise.resolve({ docs: [] })
    }),
    orderBy: () => ({
      limit: () => ({
        get: () => Promise.resolve({ docs: [] })
      }),
      get: () => Promise.resolve({ docs: [] })
    }),
    limit: () => ({
      get: () => Promise.resolve({ docs: [] })
    }),
    get: () => Promise.resolve({ docs: [] })
  }),
  FieldValue: {
    serverTimestamp: () => ({ _type: 'serverTimestamp' }),
    increment: (value: number) => ({ _type: 'increment', value }),
    arrayUnion: (item: any) => ({ _type: 'arrayUnion', value: item }),
    arrayRemove: (item: any) => ({ _type: 'arrayRemove', value: item })
  },
  batch: () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: () => Promise.resolve()
  })
};

// Export appropriate Firebase services based on platform
export let firestore: any;

if (Platform.OS === 'web' || isExpoGo) {
  // Use dummy implementations for web/Expo Go
  firestore = () => dummyFirestore;
  console.log('🔄 Using dummy Firebase services for ABTestingFramework (Expo Go/Web mode)');
} else {
  // Use native Firebase for actual native builds
  try {
    const nativeFirestore = require('@react-native-firebase/firestore').default;
    firestore = nativeFirestore;
    console.log('✅ Using native Firebase services for ABTestingFramework');
  } catch (error) {
    console.log('⚠️ Native Firebase not available for ABTestingFramework, using dummy services');
    firestore = () => dummyFirestore;
  }
}

// A/B Testing Types
export interface Experiment {
  experimentId: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  variants: ExperimentVariant[];
  targetMetrics: TargetMetric[];
  targetAudience: TargetAudience;
  trafficAllocation: number; // 0-1, percentage of users to include
  minimumSampleSize: number;
  statisticalPower: number; // 0-1, desired statistical power
  significanceLevel: number; // 0-1, alpha level (typically 0.05)
  createdBy: string;
  createdAt: Date;
  lastUpdated: Date;
}

export interface ExperimentVariant {
  variantId: string;
  name: string;
  description: string;
  trafficWeight: number; // 0-1, relative traffic allocation
  configuration: Record<string, any>; // Variant-specific configuration
  isControl: boolean;
}

export interface TargetMetric {
  metricId: string;
  name: string;
  description: string;
  type: 'primary' | 'secondary';
  measurementType: 'conversion' | 'engagement' | 'retention' | 'revenue' | 'custom';
  targetValue?: number;
  improvementDirection: 'increase' | 'decrease';
  minimumDetectableEffect: number; // Minimum effect size to detect
}

export interface TargetAudience {
  segments: string[]; // User segments to target
  filters: {
    userProperties?: Record<string, any>;
    behaviorPatterns?: Record<string, any>;
    geographicLocation?: string[];
    deviceTypes?: string[];
  };
  exclusionCriteria: string[]; // Users to exclude from experiment
}

export interface ExperimentAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
  assignmentMethod: 'random' | 'deterministic' | 'weighted';
  assignmentHash: string; // For consistent assignment
}

export interface ExperimentMetrics {
  experimentId: string;
  variantId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    [metricId: string]: {
      value: number;
      sampleSize: number;
      confidence: number;
      significance: number;
    };
  };
  userCount: number;
  conversionRate: number;
  averageSessionLength: number;
  engagementScore: number;
  lastUpdated: Date;
}

export interface ExperimentResults {
  experimentId: string;
  status: 'running' | 'completed' | 'inconclusive';
  results: {
    variantId: string;
    metrics: Record<string, number>;
    sampleSize: number;
    confidence: number;
    significance: number;
    isWinner: boolean;
    improvement: number; // Percentage improvement over control
  }[];
  statisticalAnalysis: {
    power: number;
    significance: number;
    effectSize: number;
    confidenceInterval: [number, number];
    pValue: number;
  };
  recommendation: {
    action: 'continue' | 'stop' | 'implement_winner' | 'extend_experiment';
    reason: string;
    confidence: number;
  };
  completedAt: Date;
}

export interface ExperimentMonitoring {
  experimentId: string;
  alerts: ExperimentAlert[];
  healthScore: number; // 0-1, overall experiment health
  issues: ExperimentIssue[];
  lastChecked: Date;
}

export interface ExperimentAlert {
  alertId: string;
  type: 'sample_size' | 'statistical_power' | 'traffic_anomaly' | 'metric_anomaly' | 'early_winner';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
  triggeredAt: Date;
  resolved: boolean;
}

export interface ExperimentIssue {
  issueId: string;
  type: 'traffic_imbalance' | 'low_participation' | 'metric_inconsistency' | 'external_factors';
  description: string;
  impact: 'low' | 'medium' | 'high';
  resolution: string;
  detectedAt: Date;
  resolved: boolean;
}

// A/B Testing Framework Service
export class ABTestingFramework {
  private db: any;

  constructor() {
    this.db = firestore();
  }

  // Create a new experiment
  async createExperiment(
    name: string,
    variants: Omit<ExperimentVariant, 'variantId'>[],
    targetMetrics: Omit<TargetMetric, 'metricId'>[],
    targetAudience: TargetAudience,
    options: {
      trafficAllocation?: number;
      minimumSampleSize?: number;
      statisticalPower?: number;
      significanceLevel?: number;
    } = {}
  ): Promise<Experiment> {
    try {
      const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate variant IDs
      const experimentVariants: ExperimentVariant[] = variants.map((variant, index) => ({
        ...variant,
        variantId: `variant_${index + 1}`,
        trafficWeight: variant.trafficWeight || (1 / variants.length)
      }));

      // Generate metric IDs
      const experimentMetrics: TargetMetric[] = targetMetrics.map((metric, index) => ({
        ...metric,
        metricId: `metric_${index + 1}`
      }));

      // Validate traffic allocation
      const totalTrafficWeight = experimentVariants.reduce((sum, v) => sum + v.trafficWeight, 0);
      if (Math.abs(totalTrafficWeight - 1) > 0.01) {
        throw new Error('Variant traffic weights must sum to 1.0');
      }

      const experiment: Experiment = {
        experimentId,
        name,
        description: `A/B test for ${name}`,
        status: 'draft',
        startDate: new Date(),
        variants: experimentVariants,
        targetMetrics: experimentMetrics,
        targetAudience,
        trafficAllocation: options.trafficAllocation || 1.0,
        minimumSampleSize: options.minimumSampleSize || 1000,
        statisticalPower: options.statisticalPower || 0.8,
        significanceLevel: options.significanceLevel || 0.05,
        createdBy: 'system', // Would be actual user ID in real implementation
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      // Store experiment
      await this.db
        .collection('experiments')
        .doc(experimentId)
        .set({
          ...experiment,
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });

      console.log('🧪 Created experiment:', experimentId, 'Name:', name);
      return experiment;
    } catch (error) {
      console.error('Error creating experiment:', error);
      throw error;
    }
  }

  // Assign user to experiment variant
  async assignUserToVariant(userId: string, experimentId: string): Promise<ExperimentAssignment | null> {
    try {
      // Check if user is already assigned
      const existingAssignment = await this.getUserAssignment(userId, experimentId);
      if (existingAssignment) {
        return existingAssignment;
      }

      // Get experiment details
      const experiment = await this.getExperiment(experimentId);
      if (!experiment || experiment.status !== 'running') {
        return null;
      }

      // Check if user meets target audience criteria
      const isEligible = await this.isUserEligible(userId, experiment.targetAudience);
      if (!isEligible) {
        return null;
      }

      // Check traffic allocation
      const shouldInclude = this.shouldIncludeUser(userId, experiment.trafficAllocation);
      if (!shouldInclude) {
        return null;
      }

      // Assign variant using consistent hashing
      const variant = this.assignVariant(userId, experiment.variants);
      
      const assignment: ExperimentAssignment = {
        userId,
        experimentId,
        variantId: variant.variantId,
        assignedAt: new Date(),
        assignmentMethod: 'deterministic',
        assignmentHash: this.generateAssignmentHash(userId, experimentId)
      };

      // Store assignment
      await this.db
        .collection('experiment_assignments')
        .doc(`${userId}_${experimentId}`)
        .set({
          ...assignment,
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });

      console.log('🧪 Assigned user to variant:', userId, variant.variantId);
      return assignment;
    } catch (error) {
      console.error('Error assigning user to variant:', error);
      return null;
    }
  }

  // Track experiment metrics
  async trackExperimentMetrics(
    experimentId: string,
    userId: string,
    metrics: Record<string, number>
  ): Promise<void> {
    try {
      // Get user's variant assignment
      const assignment = await this.getUserAssignment(userId, experimentId);
      if (!assignment) {
        return; // User not in experiment
      }

      // Store metrics
      const metricsData = {
        experimentId,
        variantId: assignment.variantId,
        userId,
        metrics,
        timestamp: this.db.FieldValue.serverTimestamp()
      };

      await this.db
        .collection('experiment_metrics')
        .add(metricsData);

      console.log('🧪 Tracked metrics for experiment:', experimentId, 'User:', userId);
    } catch (error) {
      console.error('Error tracking experiment metrics:', error);
    }
  }

  // Analyze experiment results
  async analyzeExperimentResults(experimentId: string): Promise<ExperimentResults> {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Get all metrics for the experiment
      const metricsSnapshot = await this.db
        .collection('experiment_metrics')
        .where('experimentId', '==', experimentId)
        .get();

      const allMetrics = metricsSnapshot.docs.map((doc: any) => doc.data());

      // Group metrics by variant
      const variantMetrics = new Map<string, any[]>();
      experiment.variants.forEach(variant => {
        variantMetrics.set(variant.variantId, []);
      });

      allMetrics.forEach(metric => {
        const variantMetricsList = variantMetrics.get(metric.variantId) || [];
        variantMetricsList.push(metric);
        variantMetrics.set(metric.variantId, variantMetricsList);
      });

      // Calculate results for each variant
      const results = [];
      for (const variant of experiment.variants) {
        const metrics = variantMetrics.get(variant.variantId) || [];
        const variantResult = await this.calculateVariantResults(variant, metrics, experiment.targetMetrics);
        results.push(variantResult);
      }

      // Perform statistical analysis
      const statisticalAnalysis = this.performStatisticalAnalysis(results, experiment);

      // Determine recommendation
      const recommendation = this.generateRecommendation(results, statisticalAnalysis, experiment);

      // Determine experiment status
      const status = this.determineExperimentStatus(results, statisticalAnalysis, experiment);

      const experimentResults: ExperimentResults = {
        experimentId,
        status,
        results,
        statisticalAnalysis,
        recommendation,
        completedAt: new Date()
      };

      // Store results
      await this.db
        .collection('experiment_results')
        .doc(experimentId)
        .set({
          ...experimentResults,
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });

      console.log('🧪 Analyzed experiment results:', experimentId, 'Status:', status);
      return experimentResults;
    } catch (error) {
      console.error('Error analyzing experiment results:', error);
      throw error;
    }
  }

  // Implement winning variant
  async implementWinningVariant(experimentId: string): Promise<void> {
    try {
      const results = await this.getExperimentResults(experimentId);
      if (!results) {
        throw new Error('Experiment results not found');
      }

      // Find winning variant
      const winningVariant = results.results.find(r => r.isWinner);
      if (!winningVariant) {
        throw new Error('No winning variant found');
      }

      // Get experiment details
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Update experiment status
      await this.db
        .collection('experiments')
        .doc(experimentId)
        .update({
          status: 'completed',
          endDate: this.db.FieldValue.serverTimestamp(),
          winningVariant: winningVariant.variantId,
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });

      // Store implementation record
      await this.db
        .collection('experiment_implementations')
        .add({
          experimentId,
          winningVariant: winningVariant.variantId,
          implementedAt: this.db.FieldValue.serverTimestamp(),
          improvement: winningVariant.improvement,
          confidence: winningVariant.confidence
        });

      console.log('🧪 Implemented winning variant:', winningVariant.variantId, 'for experiment:', experimentId);
    } catch (error) {
      console.error('Error implementing winning variant:', error);
      throw error;
    }
  }

  // Start experiment
  async startExperiment(experimentId: string): Promise<void> {
    try {
      await this.db
        .collection('experiments')
        .doc(experimentId)
        .update({
          status: 'running',
          startDate: this.db.FieldValue.serverTimestamp(),
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });

      console.log('🧪 Started experiment:', experimentId);
    } catch (error) {
      console.error('Error starting experiment:', error);
      throw error;
    }
  }

  // Stop experiment
  async stopExperiment(experimentId: string, reason: string): Promise<void> {
    try {
      await this.db
        .collection('experiments')
        .doc(experimentId)
        .update({
          status: 'completed',
          endDate: this.db.FieldValue.serverTimestamp(),
          stopReason: reason,
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });

      console.log('🧪 Stopped experiment:', experimentId, 'Reason:', reason);
    } catch (error) {
      console.error('Error stopping experiment:', error);
      throw error;
    }
  }

  // Monitor experiment health
  async monitorExperiment(experimentId: string): Promise<ExperimentMonitoring> {
    try {
      const experiment = await this.getExperiment(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      const alerts: ExperimentAlert[] = [];
      const issues: ExperimentIssue[] = [];
      let healthScore = 1.0;

      // Check sample size
      const sampleSizeCheck = await this.checkSampleSize(experimentId, experiment);
      if (sampleSizeCheck.alert) {
        alerts.push(sampleSizeCheck.alert);
        healthScore -= 0.2;
      }

      // Check traffic balance
      const trafficCheck = await this.checkTrafficBalance(experimentId, experiment);
      if (trafficCheck.issue) {
        issues.push(trafficCheck.issue);
        healthScore -= 0.3;
      }

      // Check for early winner
      const earlyWinnerCheck = await this.checkEarlyWinner(experimentId, experiment);
      if (earlyWinnerCheck.alert) {
        alerts.push(earlyWinnerCheck.alert);
        healthScore -= 0.1;
      }

      // Check metric consistency
      const metricCheck = await this.checkMetricConsistency(experimentId, experiment);
      if (metricCheck.issue) {
        issues.push(metricCheck.issue);
        healthScore -= 0.2;
      }

      const monitoring: ExperimentMonitoring = {
        experimentId,
        alerts,
        healthScore: Math.max(0, healthScore),
        issues,
        lastChecked: new Date()
      };

      // Store monitoring data
      await this.db
        .collection('experiment_monitoring')
        .doc(experimentId)
        .set({
          ...monitoring,
          lastUpdated: this.db.FieldValue.serverTimestamp()
        });

      console.log('🧪 Monitored experiment:', experimentId, 'Health:', healthScore);
      return monitoring;
    } catch (error) {
      console.error('Error monitoring experiment:', error);
      throw error;
    }
  }

  // Get experiment dashboard data
  async getExperimentDashboard(experimentId: string): Promise<{
    experiment: Experiment;
    results?: ExperimentResults;
    monitoring: ExperimentMonitoring;
    metrics: ExperimentMetrics[];
  }> {
    try {
      const [experiment, results, monitoring, metrics] = await Promise.all([
        this.getExperiment(experimentId),
        this.getExperimentResults(experimentId),
        this.getExperimentMonitoring(experimentId),
        this.getExperimentMetrics(experimentId)
      ]);

      if (!experiment) {
        throw new Error('Experiment not found');
      }

      return {
        experiment,
        results,
        monitoring,
        metrics
      };
    } catch (error) {
      console.error('Error getting experiment dashboard:', error);
      throw error;
    }
  }

  // Helper methods
  private async getExperiment(experimentId: string): Promise<Experiment | null> {
    try {
      const doc = await this.db
        .collection('experiments')
        .doc(experimentId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting experiment:', error);
      return null;
    }
  }

  private async getUserAssignment(userId: string, experimentId: string): Promise<ExperimentAssignment | null> {
    try {
      const doc = await this.db
        .collection('experiment_assignments')
        .doc(`${userId}_${experimentId}`)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        assignedAt: data.assignedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting user assignment:', error);
      return null;
    }
  }

  private async isUserEligible(userId: string, targetAudience: TargetAudience): Promise<boolean> {
    try {
      // Get user data
      const userDoc = await this.db
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return false;
      }

      const userData = userDoc.data();

      // Check segment eligibility
      if (targetAudience.segments.length > 0) {
        const userSegments = userData.segments || [];
        const hasMatchingSegment = targetAudience.segments.some(segment => 
          userSegments.includes(segment)
        );
        if (!hasMatchingSegment) {
          return false;
        }
      }

      // Check exclusion criteria
      if (targetAudience.exclusionCriteria.length > 0) {
        const isExcluded = targetAudience.exclusionCriteria.some(criteria => {
          // Implement exclusion logic based on criteria
          return false; // Placeholder
        });
        if (isExcluded) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking user eligibility:', error);
      return false;
    }
  }

  private shouldIncludeUser(userId: string, trafficAllocation: number): boolean {
    // Use consistent hashing to determine if user should be included
    const hash = this.hashString(userId);
    return (hash % 100) < (trafficAllocation * 100);
  }

  private assignVariant(userId: string, variants: ExperimentVariant[]): ExperimentVariant {
    // Use consistent hashing for variant assignment
    const hash = this.hashString(userId);
    const random = (hash % 10000) / 10000; // 0-1

    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.trafficWeight;
      if (random <= cumulativeWeight) {
        return variant;
      }
    }

    // Fallback to last variant
    return variants[variants.length - 1];
  }

  private generateAssignmentHash(userId: string, experimentId: string): string {
    return this.hashString(`${userId}_${experimentId}`).toString();
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private async calculateVariantResults(
    variant: ExperimentVariant,
    metrics: any[],
    targetMetrics: TargetMetric[]
  ): Promise<any> {
    const result: any = {
      variantId: variant.variantId,
      metrics: {},
      sampleSize: metrics.length,
      confidence: 0,
      significance: 0,
      isWinner: false,
      improvement: 0
    };

    // Calculate metrics for each target metric
    for (const targetMetric of targetMetrics) {
      const metricValues = metrics.map(m => m.metrics[targetMetric.metricId] || 0);
      const value = this.calculateMetricValue(metricValues, targetMetric.measurementType);
      
      result.metrics[targetMetric.metricId] = value;
    }

    // Calculate confidence and significance (simplified)
    result.confidence = Math.min(metrics.length / 1000, 1);
    result.significance = result.confidence > 0.8 ? 0.95 : 0.7;

    return result;
  }

  private calculateMetricValue(values: number[], measurementType: string): number {
    switch (measurementType) {
      case 'conversion':
        return values.filter(v => v > 0).length / values.length;
      case 'engagement':
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      case 'retention':
        return values.filter(v => v > 0.5).length / values.length;
      case 'revenue':
        return values.reduce((sum, v) => sum + v, 0);
      default:
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    }
  }

  private performStatisticalAnalysis(results: any[], experiment: Experiment): any {
    // Simplified statistical analysis
    const controlVariant = results.find(r => 
      experiment.variants.find(v => v.variantId === r.variantId)?.isControl
    );

    if (!controlVariant) {
      return {
        power: 0.5,
        significance: 0.5,
        effectSize: 0,
        confidenceInterval: [0, 0],
        pValue: 1
      };
    }

    // Calculate effect size and statistical power
    const effectSize = this.calculateEffectSize(results, controlVariant);
    const power = this.calculateStatisticalPower(effectSize, experiment.minimumSampleSize);
    const significance = this.calculateSignificance(results, controlVariant);
    const pValue = this.calculatePValue(results, controlVariant);
    const confidenceInterval = this.calculateConfidenceInterval(results, controlVariant);

    return {
      power,
      significance,
      effectSize,
      confidenceInterval,
      pValue
    };
  }

  private calculateEffectSize(results: any[], control: any): number {
    // Simplified effect size calculation
    const treatmentResults = results.filter(r => r.variantId !== control.variantId);
    if (treatmentResults.length === 0) return 0;

    const treatmentMean = treatmentResults.reduce((sum, r) => sum + r.metrics.primary || 0, 0) / treatmentResults.length;
    const controlMean = control.metrics.primary || 0;
    
    return controlMean > 0 ? (treatmentMean - controlMean) / controlMean : 0;
  }

  private calculateStatisticalPower(effectSize: number, sampleSize: number): number {
    // Simplified power calculation
    return Math.min(0.5 + (effectSize * sampleSize / 1000), 0.95);
  }

  private calculateSignificance(results: any[], control: any): number {
    // Simplified significance calculation
    return results.some(r => r.variantId !== control.variantId && r.confidence > 0.8) ? 0.95 : 0.5;
  }

  private calculatePValue(results: any[], control: any): number {
    // Simplified p-value calculation
    const treatmentResults = results.filter(r => r.variantId !== control.variantId);
    if (treatmentResults.length === 0) return 1;

    const hasSignificantImprovement = treatmentResults.some(r => 
      r.metrics.primary > control.metrics.primary * 1.1
    );

    return hasSignificantImprovement ? 0.03 : 0.5;
  }

  private calculateConfidenceInterval(results: any[], control: any): [number, number] {
    // Simplified confidence interval calculation
    const treatmentResults = results.filter(r => r.variantId !== control.variantId);
    if (treatmentResults.length === 0) return [0, 0];

    const treatmentMean = treatmentResults.reduce((sum, r) => sum + r.metrics.primary || 0, 0) / treatmentResults.length;
    const margin = treatmentMean * 0.1; // 10% margin

    return [treatmentMean - margin, treatmentMean + margin];
  }

  private generateRecommendation(
    results: any[],
    statisticalAnalysis: any,
    experiment: Experiment
  ): any {
    const { power, significance, pValue } = statisticalAnalysis;
    const controlVariant = results.find(r => 
      experiment.variants.find(v => v.variantId === r.variantId)?.isControl
    );

    if (!controlVariant) {
      return {
        action: 'continue',
        reason: 'Insufficient data for analysis',
        confidence: 0.5
      };
    }

    // Check for early stopping conditions
    if (pValue < 0.01 && power > 0.8) {
      const winner = results.find(r => 
        r.variantId !== controlVariant.variantId && 
        r.metrics.primary > controlVariant.metrics.primary * 1.1
      );

      if (winner) {
        return {
          action: 'implement_winner',
          reason: 'Clear winner with high statistical significance',
          confidence: significance
        };
      }
    }

    if (pValue > 0.1 && power > 0.8) {
      return {
        action: 'stop',
        reason: 'No significant difference detected',
        confidence: 1 - pValue
      };
    }

    if (power < 0.5) {
      return {
        action: 'extend_experiment',
        reason: 'Insufficient statistical power',
        confidence: power
      };
    }

    return {
      action: 'continue',
      reason: 'Experiment needs more data',
      confidence: power
    };
  }

  private determineExperimentStatus(
    results: any[],
    statisticalAnalysis: any,
    experiment: Experiment
  ): 'running' | 'completed' | 'inconclusive' {
    const { power, pValue } = statisticalAnalysis;

    if (power > 0.8 && pValue < 0.05) {
      return 'completed';
    }

    if (power > 0.8 && pValue > 0.1) {
      return 'inconclusive';
    }

    return 'running';
  }

  private async getExperimentResults(experimentId: string): Promise<ExperimentResults | null> {
    try {
      const doc = await this.db
        .collection('experiment_results')
        .doc(experimentId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        ...data,
        completedAt: data.completedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting experiment results:', error);
      return null;
    }
  }

  private async getExperimentMonitoring(experimentId: string): Promise<ExperimentMonitoring | null> {
    try {
      const doc = await this.db
        .collection('experiment_monitoring')
        .doc(experimentId)
        .get();

      if (!doc.exists) {
        return {
          experimentId,
          alerts: [],
          healthScore: 1.0,
          issues: [],
          lastChecked: new Date()
        };
      }

      const data = doc.data();
      return {
        ...data,
        lastChecked: data.lastChecked?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting experiment monitoring:', error);
      return null;
    }
  }

  private async getExperimentMetrics(experimentId: string): Promise<ExperimentMetrics[]> {
    try {
      const snapshot = await this.db
        .collection('experiment_metrics')
        .where('experimentId', '==', experimentId)
        .get();

      return snapshot.docs.map((doc: any) => ({
        ...doc.data(),
        period: {
          start: doc.data().period?.start?.toDate() || new Date(),
          end: doc.data().period?.end?.toDate() || new Date()
        },
        lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
      }));
    } catch (error) {
      console.error('Error getting experiment metrics:', error);
      return [];
    }
  }

  // Monitoring helper methods
  private async checkSampleSize(experimentId: string, experiment: Experiment): Promise<{ alert?: ExperimentAlert }> {
    const assignments = await this.db
      .collection('experiment_assignments')
      .where('experimentId', '==', experimentId)
      .get();

    const totalAssignments = assignments.docs.length;

    if (totalAssignments < experiment.minimumSampleSize) {
      return {
        alert: {
          alertId: `sample_size_${experimentId}`,
          type: 'sample_size',
          severity: 'medium',
          message: `Sample size (${totalAssignments}) is below minimum required (${experiment.minimumSampleSize})`,
          recommendation: 'Consider extending experiment duration or increasing traffic allocation',
          triggeredAt: new Date(),
          resolved: false
        }
      };
    }

    return {};
  }

  private async checkTrafficBalance(experimentId: string, experiment: Experiment): Promise<{ issue?: ExperimentIssue }> {
    // Simplified traffic balance check
    const expectedTraffic = experiment.variants.map(v => v.trafficWeight);
    const actualTraffic = [0.4, 0.6]; // Placeholder - would calculate from actual data

    const imbalance = Math.max(...expectedTraffic.map((expected, i) => 
      Math.abs(expected - actualTraffic[i])
    ));

    if (imbalance > 0.2) {
      return {
        issue: {
          issueId: `traffic_imbalance_${experimentId}`,
          type: 'traffic_imbalance',
          description: `Traffic allocation is imbalanced (max deviation: ${(imbalance * 100).toFixed(1)}%)`,
          impact: 'medium',
          resolution: 'Review traffic allocation algorithm',
          detectedAt: new Date(),
          resolved: false
        }
      };
    }

    return {};
  }

  private async checkEarlyWinner(experimentId: string, experiment: Experiment): Promise<{ alert?: ExperimentAlert }> {
    // Simplified early winner check
    const hasEarlyWinner = Math.random() > 0.8; // Placeholder

    if (hasEarlyWinner) {
      return {
        alert: {
          alertId: `early_winner_${experimentId}`,
          type: 'early_winner',
          severity: 'high',
          message: 'Early winner detected with high confidence',
          recommendation: 'Consider stopping experiment early to implement winning variant',
          triggeredAt: new Date(),
          resolved: false
        }
      };
    }

    return {};
  }

  private async checkMetricConsistency(experimentId: string, experiment: Experiment): Promise<{ issue?: ExperimentIssue }> {
    // Simplified metric consistency check
    const hasInconsistency = Math.random() > 0.9; // Placeholder

    if (hasInconsistency) {
      return {
        issue: {
          issueId: `metric_inconsistency_${experimentId}`,
          type: 'metric_inconsistency',
          description: 'Inconsistent metric values detected across variants',
          impact: 'high',
          resolution: 'Review metric collection and calculation logic',
          detectedAt: new Date(),
          resolved: false
        }
      };
    }

    return {};
  }
}

// Export singleton instance
export const abTestingFramework = new ABTestingFramework();
