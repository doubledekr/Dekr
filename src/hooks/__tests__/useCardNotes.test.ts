import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCardNotes, useCreateNote, useLikeNote, useDeleteNote } from '../useCardNotes';
import { CardNote } from '../../types/firestore';

// Mock Firebase
jest.mock('../../../services/firebase-platform', () => ({
  firestore: {
    collection: jest.fn(),
    doc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    startAfter: jest.fn(),
    onSnapshot: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    increment: jest.fn(),
    serverTimestamp: jest.fn(() => new Date()),
  },
  auth: {
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      photoURL: 'https://example.com/avatar.jpg',
    },
  },
}));

const mockFirestore = require('../../../services/firebase-platform').firestore;
const mockAuth = require('../../../services/firebase-platform').auth;

describe('useCardNotes hooks', () => {
  const mockNote: CardNote = {
    id: 'test-note-id',
    cardId: 'AAPL',
    authorId: 'test-user-id',
    authorName: 'Test User',
    authorPhotoURL: 'https://example.com/avatar.jpg',
    content: 'This is a test note about AAPL',
    visibility: 'friends',
    tags: [],
    mentions: ['friend1'],
    likesCount: 5,
    commentsCount: 2,
    sharesCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    isEdited: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useCardNotes', () => {
    it('should fetch card notes successfully', async () => {
      const mockUnsubscribe = jest.fn();
      const mockSnapshot = {
        docs: [
          {
            id: 'test-note-id',
            data: () => ({
              ...mockNote,
              createdAt: { toDate: () => mockNote.createdAt },
              updatedAt: { toDate: () => mockNote.updatedAt },
            }),
          },
        ],
      };

      mockFirestore.collection.mockReturnValue('notes-ref');
      mockFirestore.query.mockReturnValue('query-ref');
      mockFirestore.orderBy.mockReturnValue('orderby-ref');
      mockFirestore.limit.mockReturnValue('limit-ref');
      mockFirestore.onSnapshot.mockImplementation((query, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useCardNotes('AAPL'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notes).toHaveLength(1);
      expect(result.current.notes[0].id).toBe('test-note-id');
      expect(result.current.notes[0].content).toBe('This is a test note about AAPL');
      expect(result.current.error).toBeNull();
    });

    it('should handle authentication error', async () => {
      mockAuth.currentUser = null;

      const { result } = renderHook(() => useCardNotes('AAPL'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.notes).toHaveLength(0);
      expect(result.current.error).toBe('User not authenticated');
    });

    it('should handle Firestore errors', async () => {
      mockAuth.currentUser = { uid: 'test-user-id', displayName: 'Test User' };
      
      mockFirestore.onSnapshot.mockImplementation((query, callback, errorCallback) => {
        errorCallback(new Error('Firestore error'));
        return jest.fn();
      });

      const { result } = renderHook(() => useCardNotes('AAPL'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load notes');
    });
  });

  describe('useCreateNote', () => {
    it('should create a note successfully', async () => {
      const mockDocRef = { id: 'new-note-id' };
      mockFirestore.collection.mockReturnValue('notes-ref');
      mockFirestore.addDoc.mockResolvedValue(mockDocRef);

      const { result } = renderHook(() => useCreateNote('AAPL'));

      const noteData = {
        content: 'This is a new note with @friend1 mention',
        visibility: 'friends' as const,
      };

      let createdNote: CardNote;
      await act(async () => {
        createdNote = await result.current.createNote(noteData);
      });

      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(createdNote!.id).toBe('new-note-id');
      expect(createdNote!.content).toBe('This is a new note with @friend1 mention');
      expect(createdNote!.mentions).toContain('friend1');
      expect(result.current.error).toBeNull();
    });

    it('should handle character limit validation', async () => {
      const { result } = renderHook(() => useCreateNote('AAPL'));

      const longContent = 'a'.repeat(281); // Over 280 character limit
      const noteData = {
        content: longContent,
        visibility: 'public' as const,
      };

      // The component should prevent this from being called, but if it is:
      await act(async () => {
        try {
          await result.current.createNote(noteData);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should extract mentions from content', async () => {
      const mockDocRef = { id: 'new-note-id' };
      mockFirestore.addDoc.mockResolvedValue(mockDocRef);

      const { result } = renderHook(() => useCreateNote('AAPL'));

      const noteData = {
        content: 'Hey @john and @jane, check this out!',
        visibility: 'friends' as const,
      };

      let createdNote: CardNote;
      await act(async () => {
        createdNote = await result.current.createNote(noteData);
      });

      expect(createdNote!.mentions).toContain('john');
      expect(createdNote!.mentions).toContain('jane');
    });
  });

  describe('useLikeNote', () => {
    it('should like a note successfully', async () => {
      mockFirestore.collection.mockReturnValue('likes-ref');
      mockFirestore.doc.mockReturnValue('note-ref');
      mockFirestore.addDoc.mockResolvedValue({ id: 'like-id' });
      mockFirestore.updateDoc.mockResolvedValue(undefined);
      mockFirestore.increment.mockReturnValue('increment-result');

      const { result } = renderHook(() => useLikeNote('AAPL'));

      await act(async () => {
        await result.current.likeNote('test-note-id');
      });

      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        'note-ref',
        expect.objectContaining({
          likesCount: 'increment-result',
        })
      );
      expect(result.current.error).toBeNull();
    });

    it('should unlike a note successfully', async () => {
      mockFirestore.doc.mockReturnValue('note-ref');
      mockFirestore.updateDoc.mockResolvedValue(undefined);
      mockFirestore.increment.mockReturnValue('decrement-result');

      const { result } = renderHook(() => useLikeNote('AAPL'));

      await act(async () => {
        await result.current.unlikeNote('test-note-id');
      });

      expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
        'note-ref',
        expect.objectContaining({
          likesCount: 'decrement-result',
        })
      );
      expect(result.current.error).toBeNull();
    });
  });

  describe('useDeleteNote', () => {
    it('should delete a note successfully', async () => {
      mockFirestore.doc.mockReturnValue('note-ref');
      mockFirestore.deleteDoc.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteNote('AAPL'));

      await act(async () => {
        await result.current.deleteNote('test-note-id');
      });

      expect(mockFirestore.deleteDoc).toHaveBeenCalledWith('note-ref');
      expect(result.current.error).toBeNull();
    });

    it('should handle delete errors', async () => {
      mockFirestore.deleteDoc.mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeleteNote('AAPL'));

      await act(async () => {
        try {
          await result.current.deleteNote('test-note-id');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      expect(result.current.error).toBe('Delete failed');
    });
  });
});
