# Decks Feature

The Decks feature allows users to create, manage, and share collections of stocks and cryptocurrencies. This document outlines the implementation and usage of the decks functionality.

## Overview

The Decks feature consists of four main screens and a comprehensive set of hooks for data management:

### Screens

1. **DeckListScreen** - Browse and manage user's decks
2. **DeckDetailScreen** - View and interact with individual deck contents
3. **CreateDeckModal** - Create and edit deck information
4. **AddToDeckSheet** - Search and add assets to decks

### Hooks

The `useDecks.ts` file provides a complete set of hooks for deck management:

- `useMyDecks()` - Fetch user's owned decks
- `usePublicDecks()` - Fetch public decks for discovery
- `useDeck(deckId)` - Fetch a specific deck with real-time updates
- `useCreateDeck()` - Create new decks
- `useUpdateDeck()` - Update existing decks
- `useDeleteDeck()` - Delete decks
- `useAddItemToDeck()` - Add assets to decks
- `useRemoveItemFromDeck()` - Remove assets from decks
- `useCollaborativeDecks()` - Fetch decks where user is a collaborator
- `useSearchDecks()` - Search public decks
- `useDeckStats()` - Calculate deck performance statistics

## Features

### Deck Management
- Create decks with customizable categories (Stocks, Crypto, Mixed, Watchlist)
- Set visibility levels (Public, Friends Only, Private)
- Add descriptions and tags for better organization
- Archive/unarchive decks

### Asset Management
- Add stocks and cryptocurrencies to decks
- Remove assets from decks
- View real-time price data and performance
- Add notes and tags to individual assets
- Set price alerts for deck items

### Social Features
- Share decks publicly or with friends
- Collaborate on decks with other users
- Like and view public decks
- Track deck performance and statistics

### Privacy & Security
- Granular visibility controls
- Owner and collaborator permissions
- Secure Firestore rules implementation

## Navigation

The decks feature integrates with the app's navigation system:

- **Bottom Tab**: "Decks" tab with folder icon
- **Stack Screens**:
  - `DeckDetail` - Deck details view
  - `CreateDeck` - Create/edit deck modal
  - `AddToDeck` - Add assets modal

## Data Structure

Decks are stored in Firestore with the following structure:

```typescript
interface Deck {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  collaborators: string[];
  visibility: 'public' | 'friends' | 'private';
  category: 'stocks' | 'crypto' | 'mixed' | 'watchlist';
  tags: string[];
  itemCount: number;
  items: DeckItem[];
  performance?: DeckPerformance;
  createdAt: Date;
  updatedAt: Date;
  sharedCount: number;
  likesCount: number;
  viewsCount: number;
  isArchived: boolean;
}
```

## Security Rules

The Firestore security rules ensure:
- Users can only read decks they have permission to view
- Only owners and collaborators can modify decks
- Public decks are readable by all authenticated users
- Private decks are only accessible to the owner
- Friends-only decks are accessible to the owner and their friends

## Testing

Comprehensive unit tests are provided for all hooks:
- Mock Firestore operations
- Test success and error scenarios
- Verify proper data transformations
- Test authentication requirements

Run tests with:
```bash
npm test
npm run test:watch
npm run test:coverage
```

## Performance Considerations

- Real-time updates using Firestore onSnapshot listeners
- Optimistic updates for better user experience
- Efficient querying with composite indexes
- Proper cleanup of listeners to prevent memory leaks

## Future Enhancements

Potential future features:
- Deck templates
- Performance analytics
- Social features (comments, likes)
- Export/import functionality
- Advanced filtering and sorting
- Collaboration notifications
- Deck comparison tools
