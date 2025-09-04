import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  where,
} from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase-platform';
import { CardNote, Comment, Like } from '../types/firestore';

// Types for hook returns
interface UseCardNotesResult {
  notes: CardNote[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

interface UseCreateNoteResult {
  createNote: (noteData: {
    content: string;
    visibility: 'public' | 'friends' | 'private';
    mentions?: string[];
  }) => Promise<CardNote>;
  loading: boolean;
  error: string | null;
}

interface UseLikeNoteResult {
  likeNote: (noteId: string) => Promise<void>;
  unlikeNote: (noteId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface UseDeleteNoteResult {
  deleteNote: (noteId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Helper function to convert Firestore data to CardNote
const convertFirestoreToNotes = (docs: QueryDocumentSnapshot[]): CardNote[] => {
  return docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CardNote;
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
    photoURL: user.photoURL || undefined,
  };
};

// Hook to fetch card notes with pagination
export const useCardNotes = (
  cardId: string,
  pageSize: number = 10,
  visibilityFilter?: 'public' | 'friends' | 'private'
): UseCardNotesResult => {
  const [notes, setNotes] = useState<CardNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastDoc(null);
    setHasMore(true);
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    
    setLoading(true);
    setError(null);
  }, [hasMore, loading]);

  useEffect(() => {
    if (!cardId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setNotes([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    const notesRef = collection(firestore, `card_notes/${cardId}/notes`);
    
    let q = query(
      notesRef,
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    // Add visibility filter if specified
    if (visibilityFilter) {
      q = query(q, where('visibility', '==', visibilityFilter));
    }

    // Add pagination if we have a last document
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const newNotes = convertFirestoreToNotes(snapshot.docs);
          
          if (lastDoc) {
            // Append to existing notes for pagination
            setNotes(prev => [...prev, ...newNotes]);
          } else {
            // Replace notes for initial load or refetch
            setNotes(newNotes);
          }
          
          // Update pagination state
          if (snapshot.docs.length > 0) {
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
          }
          setHasMore(snapshot.docs.length === pageSize);
          
          setLoading(false);
          setError(null);
        } catch (err) {
          console.error('Error processing card notes:', err);
          setError('Failed to load notes');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching card notes:', err);
        setError('Failed to load notes');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [cardId, pageSize, visibilityFilter, lastDoc]);

  return { notes, loading, error, hasMore, loadMore, refetch };
};

// Hook to create a new note
export const useCreateNote = (cardId: string): UseCreateNoteResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNote = useCallback(async (noteData: {
    content: string;
    visibility: 'public' | 'friends' | 'private';
    mentions?: string[];
  }): Promise<CardNote> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      
      // Extract mentions from content
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(noteData.content)) !== null) {
        mentions.push(match[1]);
      }
      
      const newNote = {
        cardId,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhotoURL: user.photoURL,
        content: noteData.content.trim(),
        visibility: noteData.visibility,
        tags: [], // Can be extracted from content or added later
        mentions: mentions.length > 0 ? mentions : undefined,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isEdited: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const notesRef = collection(firestore, `card_notes/${cardId}/notes`);
      const docRef = await addDoc(notesRef, newNote);

      const createdNote: CardNote = {
        id: docRef.id,
        cardId,
        authorId: user.uid,
        authorName: user.displayName,
        authorPhotoURL: user.photoURL,
        content: noteData.content.trim(),
        visibility: noteData.visibility,
        tags: [],
        mentions: mentions.length > 0 ? mentions : undefined,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isEdited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return createdNote;
    } catch (err) {
      console.error('Error creating note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  return { createNote, loading, error };
};

// Hook to like/unlike a note
export const useLikeNote = (cardId: string): UseLikeNoteResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const likeNote = useCallback(async (noteId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      
      // Add like document
      const likesRef = collection(firestore, `card_notes/${cardId}/notes/${noteId}/likes`);
      await addDoc(likesRef, {
        userId: user.uid,
        userName: user.displayName,
        createdAt: serverTimestamp(),
      });

      // Increment like count on note
      const noteRef = doc(firestore, `card_notes/${cardId}/notes/${noteId}`);
      await updateDoc(noteRef, {
        likesCount: increment(1),
      });
    } catch (err) {
      console.error('Error liking note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to like note';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  const unlikeNote = useCallback(async (noteId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      
      // Find and delete like document
      const likesRef = collection(firestore, `card_notes/${cardId}/notes/${noteId}/likes`);
      const likeQuery = query(likesRef, where('userId', '==', user.uid));
      
      // Note: In a real implementation, you'd need to get the like document and delete it
      // For now, we'll just decrement the count
      
      // Decrement like count on note
      const noteRef = doc(firestore, `card_notes/${cardId}/notes/${noteId}`);
      await updateDoc(noteRef, {
        likesCount: increment(-1),
      });
    } catch (err) {
      console.error('Error unliking note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlike note';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  return { likeNote, unlikeNote, loading, error };
};

// Hook to delete a note
export const useDeleteNote = (cardId: string): UseDeleteNoteResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const user = getCurrentUser();
      const noteRef = doc(firestore, `card_notes/${cardId}/notes/${noteId}`);
      
      await deleteDoc(noteRef);
    } catch (err) {
      console.error('Error deleting note:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  return { deleteNote, loading, error };
};

// Hook to get user's friends for mention autocomplete
export const useFriends = () => {
  const [friends, setFriends] = useState<{ uid: string; displayName: string; photoURL?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setFriends([]);
      setLoading(false);
      setError('User not authenticated');
      return;
    }

    // In a real implementation, you would fetch friends from a friends collection
    // For now, we'll return a mock list
    const mockFriends = [
      { uid: 'friend-1', displayName: 'John Doe', photoURL: undefined },
      { uid: 'friend-2', displayName: 'Jane Smith', photoURL: undefined },
      { uid: 'friend-3', displayName: 'Mike Johnson', photoURL: undefined },
    ];

    setFriends(mockFriends);
    setLoading(false);
    setError(null);
  }, []);

  return { friends, loading, error };
};

// Hook to check if current user has liked a note
export const useNoteLikeStatus = (cardId: string, noteId: string) => {
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !noteId) {
      setIsLiked(false);
      setLoading(false);
      return;
    }

    const likesRef = collection(firestore, `card_notes/${cardId}/notes/${noteId}/likes`);
    const likeQuery = query(likesRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      likeQuery,
      (snapshot) => {
        setIsLiked(!snapshot.empty);
        setLoading(false);
      },
      (err) => {
        console.error('Error checking like status:', err);
        setIsLiked(false);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [cardId, noteId]);

  return { isLiked, loading };
};
