import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase-platform';
import { Deck, DeckItem, DeckUpdate } from '../types/firestore';

// Types for hook returns
interface UseDecksResult {
  decks: Deck[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseDeckResult {
  deck: Deck | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCreateDeckResult {
  createDeck: (deckData: Omit<Deck, 'id' | 'ownerId' | 'ownerName' | 'createdAt' | 'updatedAt' | 'itemCount' | 'items' | 'sharedCount' | 'likesCount' | 'viewsCount' | 'isArchived'>) => Promise<Deck>;
  loading: boolean;
  error: string | null;
}

interface UseUpdateDeckResult {
  updateDeck: (deckId: string, updates: DeckUpdate) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseDeleteDeckResult {
  deleteDeck: (deckId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseAddItemToDeckResult {
  addItemToDeck: (deckId: string, item: Omit<DeckItem, 'id' | 'addedAt' | 'addedBy'>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseRemoveItemFromDeckResult {
  removeItemFromDeck: (deckId: string, itemId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Helper function to convert Firestore data to Deck
const convertFirestoreToDecks = (docs: any[]): Deck[] => {
  return docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      performance: data.performance ? {
        ...data.performance,
        lastUpdated: data.performance.lastUpdated?.toDate() || new Date(),
      } : undefined,
      items: data.items?.map((item: any) => ({
        ...item,
        addedAt: item.addedAt?.toDate() || new Date(),
      })) || [],
    } as Deck;
  });
};

// Helper function to get current user info
const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return {
    uid: user.uid,
    displayName: user.displayName || 'Anonymous',
  };
};

// Hook to fetch user's own decks
export const useMyDecks = (): UseDecksResult => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setDecks([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    const decksRef = collection(firestore, 'decks');
    const q = query(
      decksRef,
      where('ownerId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const deckData = convertFirestoreToDecks(snapshot.docs);
          setDecks(deckData);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing my decks:', err);
          setError('Failed to load decks');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching my decks:', err);
        setError('Failed to load decks');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { decks, loading, error, refetch };
};

// Hook to fetch public decks
export const usePublicDecks = (limitCount: number = 20): UseDecksResult => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    const decksRef = collection(firestore, 'decks');
    const q = query(
      decksRef,
      where('visibility', '==', 'public'),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const deckData = convertFirestoreToDecks(snapshot.docs);
          setDecks(deckData);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing public decks:', err);
          setError('Failed to load public decks');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching public decks:', err);
        setError('Failed to load public decks');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [limitCount]);

  return { decks, loading, error, refetch };
};

// Hook to fetch a specific deck
export const useDeck = (deckId: string): UseDeckResult => {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (!deckId) {
      setDeck(null);
      setLoading(false);
      return;
    }

    const deckRef = doc(firestore, 'decks', deckId);
    
    const unsubscribe = onSnapshot(
      deckRef,
      (snapshot) => {
        try {
          if (snapshot.exists()) {
            const deckData = convertFirestoreToDecks([snapshot])[0];
            setDeck(deckData);
          } else {
            setDeck(null);
            setError('Deck not found');
          }
          setLoading(false);
        } catch (err) {
          console.error('Error processing deck:', err);
          setError('Failed to load deck');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching deck:', err);
        setError('Failed to load deck');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [deckId]);

  return { deck, loading, error, refetch };
};

// Hook to create a new deck
export const useCreateDeck = (): UseCreateDeckResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createDeck = useCallback(async (deckData: Omit<Deck, 'id' | 'ownerId' | 'ownerName' | 'createdAt' | 'updatedAt' | 'itemCount' | 'items' | 'sharedCount' | 'likesCount' | 'viewsCount' | 'isArchived'>): Promise<Deck> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      
      const newDeck = {
        ...deckData,
        ownerId: user.uid,
        ownerName: user.displayName,
        collaborators: [],
        itemCount: 0,
        items: [],
        sharedCount: 0,
        likesCount: 0,
        viewsCount: 0,
        isArchived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const decksRef = collection(firestore, 'decks');
      const docRef = await addDoc(decksRef, newDeck);

      const createdDeck: Deck = {
        id: docRef.id,
        ...deckData,
        ownerId: user.uid,
        ownerName: user.displayName,
        collaborators: [],
        itemCount: 0,
        items: [],
        sharedCount: 0,
        likesCount: 0,
        viewsCount: 0,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return createdDeck;
    } catch (err) {
      console.error('Error creating deck:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deck';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createDeck, loading, error };
};

// Hook to update a deck
export const useUpdateDeck = (): UseUpdateDeckResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDeck = useCallback(async (deckId: string, updates: DeckUpdate): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const deckRef = doc(firestore, 'decks', deckId);
      
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(deckRef, updateData);
    } catch (err) {
      console.error('Error updating deck:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update deck';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateDeck, loading, error };
};

// Hook to delete a deck
export const useDeleteDeck = (): UseDeleteDeckResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDeck = useCallback(async (deckId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const deckRef = doc(firestore, 'decks', deckId);
      
      await deleteDoc(deckRef);
    } catch (err) {
      console.error('Error deleting deck:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete deck';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteDeck, loading, error };
};

// Hook to add an item to a deck
export const useAddItemToDeck = (): UseAddItemToDeckResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItemToDeck = useCallback(async (deckId: string, item: Omit<DeckItem, 'id' | 'addedAt' | 'addedBy'>): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const deckRef = doc(firestore, 'decks', deckId);
      
      const newItem: DeckItem = {
        id: `${item.symbol}_${Date.now()}`,
        ...item,
        addedAt: new Date(),
        addedBy: user.uid,
        position: undefined, // Will be populated by market data service
      };

      await updateDoc(deckRef, {
        items: arrayUnion(newItem),
        itemCount: arrayUnion(newItem).length, // This will be recalculated by the listener
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error adding item to deck:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to deck';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { addItemToDeck, loading, error };
};

// Hook to remove an item from a deck
export const useRemoveItemFromDeck = (): UseRemoveItemFromDeckResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeItemFromDeck = useCallback(async (deckId: string, itemId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const deckRef = doc(firestore, 'decks', deckId);
      
      // First, get the current deck to find the item to remove
      const deckSnapshot = await deckRef.get();
      if (!deckSnapshot.exists()) {
        throw new Error('Deck not found');
      }
      
      const deckData = deckSnapshot.data() as Deck;
      const itemToRemove = deckData.items.find(item => item.id === itemId);
      
      if (!itemToRemove) {
        throw new Error('Item not found in deck');
      }

      await updateDoc(deckRef, {
        items: arrayRemove(itemToRemove),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error removing item from deck:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from deck';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { removeItemFromDeck, loading, error };
};

// Hook to get decks where user is a collaborator
export const useCollaborativeDecks = (): UseDecksResult => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setDecks([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    const decksRef = collection(firestore, 'decks');
    const q = query(
      decksRef,
      where('collaborators', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const deckData = convertFirestoreToDecks(snapshot.docs);
          setDecks(deckData);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing collaborative decks:', err);
          setError('Failed to load collaborative decks');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching collaborative decks:', err);
        setError('Failed to load collaborative decks');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return { decks, loading, error, refetch };
};

// Hook to search decks
export const useSearchDecks = (searchQuery: string, filters?: {
  category?: 'stocks' | 'crypto' | 'mixed' | 'watchlist';
  visibility?: 'public' | 'friends' | 'private';
}): UseDecksResult => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setDecks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const decksRef = collection(firestore, 'decks');
    let q = query(
      decksRef,
      where('visibility', '==', 'public'),
      orderBy('updatedAt', 'desc'),
      limit(50)
    );

    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const allDecks = convertFirestoreToDecks(snapshot.docs);
          
          // Filter by search query (client-side for now)
          const filteredDecks = allDecks.filter(deck =>
            deck.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deck.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            deck.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
            deck.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          setDecks(filteredDecks);
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing search results:', err);
          setError('Failed to search decks');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error searching decks:', err);
        setError('Failed to search decks');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [searchQuery, filters]);

  return { decks, loading, error, refetch };
};

// Hook to get deck statistics
export const useDeckStats = (deckId: string) => {
  const { deck } = useDeck(deckId);
  
  const stats = useMemo(() => {
    if (!deck) return null;

    const totalItems = deck.items.length;
    const stockItems = deck.items.filter(item => item.type === 'stock').length;
    const cryptoItems = deck.items.filter(item => item.type === 'crypto').length;
    
    let totalValue = 0;
    let totalReturn = 0;
    let dayChange = 0;
    
    deck.items.forEach(item => {
      if (item.position) {
        totalValue += item.position.totalValue;
        totalReturn += item.position.totalReturn;
        dayChange += item.position.dayChange;
      }
    });

    const totalReturnPercent = totalValue > 0 ? (totalReturn / (totalValue - totalReturn)) * 100 : 0;
    const dayChangePercent = totalValue > 0 ? (dayChange / totalValue) * 100 : 0;

    return {
      totalItems,
      stockItems,
      cryptoItems,
      totalValue,
      totalReturn,
      totalReturnPercent,
      dayChange,
      dayChangePercent,
      averageReturn: totalItems > 0 ? totalReturn / totalItems : 0,
    };
  }, [deck]);

  return stats;
};
