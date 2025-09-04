// Mock Firebase platform module for testing

export const firestore = {
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
};

export const auth = {
  currentUser: {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com',
  },
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
};

export const saveToWatchlist = jest.fn();
export const loadWatchlist = jest.fn();
export const safeHapticImpact = jest.fn();
export const safeHapticNotification = jest.fn();
