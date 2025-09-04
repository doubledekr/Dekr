import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMyDecks, usePublicDecks, useDeck, useCreateDeck, useUpdateDeck, useDeleteDeck, useAddItemToDeck, useRemoveItemFromDeck } from '../useDecks';
import { Deck, DeckItem } from '../../types/firestore';

// Mock Firebase
jest.mock('../../../services/firebase-platform', () => ({
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    arrayUnion: jest.fn(),
    arrayRemove: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
  },
  auth: {
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
    },
  },
}));

// Mock Firestore functions
const mockFirestore = require('../../../services/firebase-platform').firestore;
const mockAuth = require('../../../services/firebase-platform').auth;

describe('useDecks hooks', () => {
  const mockDeck: Deck = {
    id: 'test-deck-id',
    title: 'Test Deck',
    description: 'A test deck',
    ownerId: 'test-user-id',
    ownerName: 'Test User',
    collaborators: [],
    visibility: 'private',
    category: 'mixed',
    tags: ['test'],
    itemCount: 2,
    items: [
      {
        id: 'item-1',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        type: 'stock',
        exchange: 'NASDAQ',
        addedAt: new Date(),
        addedBy: 'test-user-id',
        notes: 'Good stock',
        tags: ['tech'],
        alertsEnabled: false,
      },
      {
        id: 'item-2',
        symbol: 'BTC',
        name: 'Bitcoin',
        type: 'crypto',
        addedAt: new Date(),
        addedBy: 'test-user-id',
        notes: '',
        tags: [],
        alertsEnabled: true,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    sharedCount: 0,
    likesCount: 5,
    viewsCount: 100,
    isArchived: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useMyDecks', () => {
    it('should fetch user decks successfully', async () => {
      const mockUnsubscribe = jest.fn();
      const mockSnapshot = {
        docs: [
          {
            id: 'test-deck-id',
            data: () => ({
              ...mockDeck,
              createdAt: { toDate: () => mockDeck.createdAt },
              updatedAt: { toDate: () => mockDeck.updatedAt },
              items: mockDeck.items.map(item => ({
                ...item,
                addedAt: { toDate: () => item.addedAt },
              })),
            }),
          },
        ],
      };

      mockFirestore.collection.mockReturnValue('decks-ref');
      mockFirestore.query.mockReturnValue('query-ref');
      mockFirestore.where.mockReturnValue('where-ref');
      mockFirestore.orderBy.mockReturnValue('orderby-ref');
      mockFirestore.onSnapshot.mockImplementation((query, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useMyDecks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.decks).toHaveLength(1);
      expect(result.current.decks[0].id).toBe('test-deck-id');
      expect(result.current.decks[0].title).toBe('Test Deck');
      expect(result.current.error).toBeNull();
    });

    it('should handle authentication error', async () => {
      mockAuth.currentUser = null;

      const { result } = renderHook(() => useMyDecks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.decks).toHaveLength(0);
      expect(result.current.error).toBe('User not authenticated');
    });

    it('should handle Firestore errors', async () => {
      mockAuth.currentUser = { uid: 'test-user-id', displayName: 'Test User' };
      
      mockFirestore.onSnapshot.mockImplementation((query, callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      const { result } = renderHook(() => useMyDecks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load decks');
    });
  });

  describe('usePublicDecks', () => {
    it('should fetch public decks successfully', async () => {
      const mockUnsubscribe = jest.fn();
      const mockSnapshot = {
        docs: [
          {
            id: 'public-deck-id',
            data: () => ({
              ...mockDeck,
              id: 'public-deck-id',
              visibility: 'public',
              createdAt: { toDate: () => mockDeck.createdAt },
              updatedAt: { toDate: () => mockDeck.updatedAt },
              items: [],
            }),
          },
        ],
      };

      mockFirestore.onSnapshot.mockImplementation((query, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => usePublicDecks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.decks).toHaveLength(1);
      expect(result.current.decks[0].visibility).toBe('public');
    });
  });

  describe('useDeck', () => {
    it('should fetch a specific deck successfully', async () => {
      const mockUnsubscribe = jest.fn();
      const mockSnapshot = {
        exists: () => true,
        id: 'test-deck-id',
        data: () => ({
          ...mockDeck,
          createdAt: { toDate: () => mockDeck.createdAt },
          updatedAt: { toDate: () => mockDeck.updatedAt },
          items: mockDeck.items.map(item => ({
            ...item,
            addedAt: { toDate: () => item.addedAt },
          })),
        }),
      };

      mockFirestore.doc.mockReturnValue('deck-ref');
      mockFirestore.onSnapshot.mockImplementation((ref, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useDeck('test-deck-id'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.deck).toBeTruthy();
      expect(result.current.deck?.id).toBe('test-deck-id');
      expect(result.current.error).toBeNull();
    });

    it('should handle deck not found', async () => {
      const mockSnapshot = {
        exists: () => false,
      };

      mockFirestore.onSnapshot.mockImplementation((ref, callback) => {
        callback(mockSnapshot);
        return jest.fn();
      });

      const { result } = renderHook(() => useDeck('non-existent-deck'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.deck).toBeNull();
      expect(result.current.error).toBe('Deck not found');
    });
  });

  describe('useCreateDeck', () => {
    it('should create a deck successfully', async () => {
      const mockDocRef = { id: 'new-deck-id' };
      mockFirestore.collection.mockReturnValue('decks-ref');
      mockFirestore.addDoc.mockResolvedValue(mockDocRef);

      const { result } = renderHook(() => useCreateDeck());

      const deckData = {
        title: 'New Deck',
        description: 'A new deck',
        category: 'stocks' as const,
        visibility: 'private' as const,
        tags: ['new'],
      };

      let createdDeck: Deck;
      await act(async () => {
        createdDeck = await result.current.createDeck(deckData);
      });

      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(createdDeck!.id).toBe('new-deck-id');
      expect(createdDeck!.title).toBe('New Deck');
      expect(createdDeck!.ownerId).toBe('test-user-id');
      expect(result.current.error).toBeNull();
    });

    it('should handle creation errors', async () => {
      mockFirestore.addDoc.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useCreateDeck());

      const deckData = {
        title: 'New Deck',
        description: 'A new deck',
        category: 'stocks' as const,
        visibility: 'private' as const,
        tags: ['new'],
      };

      await act(async () => {
        try {
          await result.current.createDeck(deckData);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Creation failed');
    });
  });

  describe('useUpdateDeck', () => {
    it('should update a deck successfully', async () => {
      mockFirestore.doc.mockReturnValue('deck-ref');
      mockFirestore.updateDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useUpdateDeck());

      const updates = {
        title: 'Updated Deck',
        description: 'Updated description',
      };

      await act(async () => {
        await result.current.updateDeck('test-deck-id', updates);
      });

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        'deck-ref',
        expect.objectContaining({
          title: 'Updated Deck',
          description: 'Updated description',
        })
      );
      expect(result.current.error).toBeNull();
    });
  });

  describe('useDeleteDeck', () => {
    it('should delete a deck successfully', async () => {
      mockFirestore.doc.mockReturnValue('deck-ref');
      mockFirestore.deleteDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteDeck());

      await act(async () => {
        await result.current.deleteDeck('test-deck-id');
      });

      expect(mockFirestore.deleteDoc).toHaveBeenCalledWith('deck-ref');
      expect(result.current.error).toBeNull();
    });
  });

  describe('useAddItemToDeck', () => {
    it('should add an item to a deck successfully', async () => {
      mockFirestore.doc.mockReturnValue('deck-ref');
      mockFirestore.updateDoc.mockResolvedValue(undefined);
      mockFirestore.arrayUnion.mockReturnValue('array-union-result');

      const { result } = renderHook(() => useAddItemToDeck());

      const newItem = {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        type: 'stock' as const,
        exchange: 'NASDAQ',
        notes: 'Electric vehicle company',
        tags: ['ev', 'tech'],
        alertsEnabled: true,
      };

      await act(async () => {
        await result.current.addItemToDeck('test-deck-id', newItem);
      });

      expect(mockFirestore.updateDoc).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });
  });

  describe('useRemoveItemFromDeck', () => {
    it('should remove an item from a deck successfully', async () => {
      const mockDeckRef = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            ...mockDeck,
            items: mockDeck.items,
          }),
        }),
      };

      mockFirestore.doc.mockReturnValue(mockDeckRef);
      mockFirestore.updateDoc.mockResolvedValue(undefined);
      mockFirestore.arrayRemove.mockReturnValue('array-remove-result');

      const { result } = renderHook(() => useRemoveItemFromDeck());

      await act(async () => {
        await result.current.removeItemFromDeck('test-deck-id', 'item-1');
      });

      expect(mockFirestore.updateDoc).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should handle item not found error', async () => {
      const mockDeckRef = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            ...mockDeck,
            items: [], // No items
          }),
        }),
      };

      mockFirestore.doc.mockReturnValue(mockDeckRef);

      const { result } = renderHook(() => useRemoveItemFromDeck());

      await act(async () => {
        try {
          await result.current.removeItemFromDeck('test-deck-id', 'non-existent-item');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toBe('Item not found in deck');
        }
      });
    });
  });
});
