import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, auth, functions } from '../../services/firebase-platform';
import { Strategy, BacktestResult, Alert } from '../types/strategy';

// Types for hook returns
interface UseStrategiesResult {
  strategies: Strategy[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCreateStrategyResult {
  createStrategy: (strategy: Partial<Strategy>) => Promise<{ strategyId: string }>;
  loading: boolean;
  error: string | null;
}

interface UseUpdateStrategyResult {
  updateStrategy: (strategy: Strategy) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseDeleteStrategyResult {
  deleteStrategy: (strategyId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseToggleStrategyStatusResult {
  toggleStrategyStatus: (strategyId: string, isActive: boolean) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseRunBacktestResult {
  runBacktest: (strategyId: string, universe: any, config?: any) => Promise<any>;
  loading: boolean;
  error: string | null;
}

interface UseBacktestResultsResult {
  backtestResults: any[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAlertsResult {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  markAsRead: (alertId: string) => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// Helper function to convert Firestore data
const convertFirestoreToStrategy = (doc: any): Strategy => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    lastRunAt: data.lastRunAt?.toDate() || undefined,
  } as Strategy;
};

const convertFirestoreToAlert = (doc: any): Alert => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    sentAt: data.sentAt?.toDate() || undefined,
    readAt: data.readAt?.toDate() || undefined,
    expiresAt: data.expiresAt?.toDate() || undefined,
  } as Alert;
};

// Helper function to get current user
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return user;
};

// Hook to fetch strategies
export const useStrategies = (type: 'my_strategies' | 'public' | 'templates' = 'my_strategies'): UseStrategiesResult => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const strategiesRef = collection(firestore, 'strategies');
      let q;

      switch (type) {
        case 'my_strategies':
          q = query(
            strategiesRef,
            where('userId', '==', user.uid),
            orderBy('updatedAt', 'desc'),
            limit(50)
          );
          break;
        case 'public':
          q = query(
            strategiesRef,
            where('isPublic', '==', true),
            orderBy('performanceMetrics.totalReturn', 'desc'),
            limit(50)
          );
          break;
        case 'templates':
          // For templates, we could have a special collection or flag
          q = query(
            strategiesRef,
            where('isTemplate', '==', true),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
          break;
        default:
          q = query(strategiesRef, orderBy('updatedAt', 'desc'), limit(50));
      }

      const snapshot = await getDocs(q);
      const strategyData = snapshot.docs.map(convertFirestoreToStrategy);
      
      setStrategies(strategyData);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching strategies:', err);
      setError(err.message || 'Failed to fetch strategies');
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setStrategies([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    // Set up real-time listener for my strategies
    if (type === 'my_strategies') {
      const strategiesRef = collection(firestore, 'strategies');
      const q = query(
        strategiesRef,
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          try {
            const strategyData = snapshot.docs.map(convertFirestoreToStrategy);
            setStrategies(strategyData);
            setLoading(false);
            setError(null);
          } catch (err: any) {
            console.error('Error processing strategies:', err);
            setError('Failed to load strategies');
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error listening to strategies:', err);
          setError('Failed to load strategies');
          setLoading(false);
        }
      );

      return unsubscribe;
    } else {
      // For public and templates, use one-time fetch
      refetch();
    }
  }, [type, refetch]);

  return { strategies, loading, error, refetch };
};

// Hook to create strategy
export const useCreateStrategy = (): UseCreateStrategyResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStrategy = useCallback(async (strategy: Partial<Strategy>): Promise<{ strategyId: string }> => {
    setLoading(true);
    setError(null);

    try {
      const createStrategyFn = httpsCallable(functions, 'createStrategy');
      const result = await createStrategyFn(strategy);
      
      if (result.data.success) {
        return { strategyId: result.data.strategyId };
      } else {
        throw new Error(result.data.message || 'Failed to create strategy');
      }
    } catch (err: any) {
      console.error('Error creating strategy:', err);
      const errorMessage = err.message || 'Failed to create strategy';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { createStrategy, loading, error };
};

// Hook to update strategy
export const useUpdateStrategy = (): UseUpdateStrategyResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStrategy = useCallback(async (strategy: Strategy): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      
      // Verify ownership
      if (strategy.userId !== user.uid) {
        throw new Error('You can only update your own strategies');
      }

      const strategyRef = doc(firestore, 'strategies', strategy.id);
      await updateDoc(strategyRef, {
        ...strategy,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('Error updating strategy:', err);
      const errorMessage = err.message || 'Failed to update strategy';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateStrategy, loading, error };
};

// Hook to delete strategy
export const useDeleteStrategy = (): UseDeleteStrategyResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteStrategy = useCallback(async (strategyId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      
      // Get strategy to verify ownership
      const strategyRef = doc(firestore, 'strategies', strategyId);
      const strategyDoc = await strategyRef.get();
      
      if (!strategyDoc.exists) {
        throw new Error('Strategy not found');
      }

      const strategyData = strategyDoc.data();
      if (strategyData?.userId !== user.uid) {
        throw new Error('You can only delete your own strategies');
      }

      await deleteDoc(strategyRef);
    } catch (err: any) {
      console.error('Error deleting strategy:', err);
      const errorMessage = err.message || 'Failed to delete strategy';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteStrategy, loading, error };
};

// Hook to toggle strategy status
export const useToggleStrategyStatus = (): UseToggleStrategyStatusResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleStrategyStatus = useCallback(async (strategyId: string, isActive: boolean): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      
      // Get strategy to verify ownership
      const strategyRef = doc(firestore, 'strategies', strategyId);
      const strategyDoc = await strategyRef.get();
      
      if (!strategyDoc.exists) {
        throw new Error('Strategy not found');
      }

      const strategyData = strategyDoc.data();
      if (strategyData?.userId !== user.uid) {
        throw new Error('You can only modify your own strategies');
      }

      await updateDoc(strategyRef, {
        isActive,
        updatedAt: serverTimestamp(),
        lastRunAt: isActive ? serverTimestamp() : strategyData.lastRunAt,
      });
    } catch (err: any) {
      console.error('Error toggling strategy status:', err);
      const errorMessage = err.message || 'Failed to update strategy status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { toggleStrategyStatus, loading, error };
};

// Hook to run backtest
export const useRunBacktest = (): UseRunBacktestResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runBacktest = useCallback(async (
    strategyId: string, 
    universe: any, 
    config?: any
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const runBacktestFn = httpsCallable(functions, 'runBacktest');
      const result = await runBacktestFn({
        strategyId,
        universe,
        config,
      });
      
      if (result.data.success) {
        return result.data;
      } else {
        throw new Error(result.data.message || 'Failed to run backtest');
      }
    } catch (err: any) {
      console.error('Error running backtest:', err);
      const errorMessage = err.message || 'Failed to run backtest';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return { runBacktest, loading, error };
};

// Hook to get backtest results
export const useBacktestResults = (strategyId: string): UseBacktestResultsResult => {
  const [backtestResults, setBacktestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const backtestsRef = collection(firestore, 'backtests');
      const q = query(
        backtestsRef,
        where('strategyId', '==', strategyId),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      
      setBacktestResults(results);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching backtest results:', err);
      setError(err.message || 'Failed to fetch backtest results');
      setLoading(false);
    }
  }, [strategyId]);

  useEffect(() => {
    if (strategyId) {
      refetch();
    }
  }, [strategyId, refetch]);

  return { backtestResults, loading, error, refetch };
};

// Hook to manage alerts
export const useAlerts = (): UseAlertsResult => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const alertsRef = collection(firestore, 'alerts');
      const q = query(
        alertsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      const alertData = snapshot.docs.map(convertFirestoreToAlert);
      
      setAlerts(alertData);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message || 'Failed to fetch alerts');
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (alertId: string): Promise<void> => {
    try {
      const alertRef = doc(firestore, 'alerts', alertId);
      await updateDoc(alertRef, {
        readAt: serverTimestamp(),
      });
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, readAt: new Date() }
          : alert
      ));
    } catch (err: any) {
      console.error('Error marking alert as read:', err);
      throw new Error('Failed to mark alert as read');
    }
  }, []);

  const deleteAlert = useCallback(async (alertId: string): Promise<void> => {
    try {
      const alertRef = doc(firestore, 'alerts', alertId);
      await deleteDoc(alertRef);
      
      // Update local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (err: any) {
      console.error('Error deleting alert:', err);
      throw new Error('Failed to delete alert');
    }
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setAlerts([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    // Set up real-time listener for alerts
    const alertsRef = collection(firestore, 'alerts');
    const q = query(
      alertsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const alertData = snapshot.docs.map(convertFirestoreToAlert);
          setAlerts(alertData);
          setLoading(false);
          setError(null);
        } catch (err: any) {
          console.error('Error processing alerts:', err);
          setError('Failed to load alerts');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error listening to alerts:', err);
        setError('Failed to load alerts');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { alerts, loading, error, markAsRead, deleteAlert, refetch };
};

// Hook to get strategy by ID
export const useStrategy = (strategyId: string) => {
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!strategyId) {
      setStrategy(null);
      setLoading(false);
      return;
    }

    const strategyRef = doc(firestore, 'strategies', strategyId);
    const unsubscribe = onSnapshot(
      strategyRef,
      (doc) => {
        if (doc.exists()) {
          const strategyData = convertFirestoreToStrategy(doc);
          setStrategy(strategyData);
        } else {
          setStrategy(null);
          setError('Strategy not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching strategy:', err);
        setError('Failed to load strategy');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [strategyId]);

  return { strategy, loading, error };
};

// Utility hook to get strategy performance summary
export const useStrategyPerformanceSummary = (userId?: string) => {
  const [summary, setSummary] = useState({
    totalStrategies: 0,
    activeStrategies: 0,
    avgReturn: 0,
    bestStrategy: null as Strategy | null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const user = getCurrentUser();
        const targetUserId = userId || user.uid;
        
        const strategiesRef = collection(firestore, 'strategies');
        const q = query(
          strategiesRef,
          where('userId', '==', targetUserId)
        );

        const snapshot = await getDocs(q);
        const strategies = snapshot.docs.map(convertFirestoreToStrategy);
        
        const activeStrategies = strategies.filter(s => s.isActive);
        const strategiesWithPerformance = strategies.filter(s => s.performanceMetrics);
        
        const avgReturn = strategiesWithPerformance.length > 0
          ? strategiesWithPerformance.reduce((sum, s) => sum + (s.performanceMetrics?.totalReturn || 0), 0) / strategiesWithPerformance.length
          : 0;
        
        const bestStrategy = strategiesWithPerformance.reduce((best, current) => {
          const currentReturn = current.performanceMetrics?.totalReturn || 0;
          const bestReturn = best?.performanceMetrics?.totalReturn || -Infinity;
          return currentReturn > bestReturn ? current : best;
        }, null as Strategy | null);

        setSummary({
          totalStrategies: strategies.length,
          activeStrategies: activeStrategies.length,
          avgReturn,
          bestStrategy,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching strategy summary:', error);
        setLoading(false);
      }
    };

    fetchSummary();
  }, [userId]);

  return { summary, loading };
};
