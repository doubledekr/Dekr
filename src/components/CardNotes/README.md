# CardNotes Feature

The CardNotes feature enables users to create and share micro-notes (max 280 characters) about specific assets/cards. These notes are visible to friends or public based on user preference and include social features like mentions, likes, and comments.

## Overview

The CardNotes feature consists of:

1. **`CardNotes.tsx`** - Main component that displays notes and composer
2. **`useCardNotes.ts`** - Comprehensive hooks for note management
3. **`CardDetailScreen.tsx`** - Example integration showing tabbed interface

## Features

### 📝 **Note Composition**
- **280 Character Limit**: Twitter-style micro-notes with live character count
- **Visibility Controls**: Public, Friends Only, or Private notes
- **@Mentions**: Autocomplete for mentioning friends
- **Real-time Validation**: Visual feedback for character limits and posting state

### 👥 **Social Features**
- **Like/Unlike**: Heart button with like counts
- **Comments**: Comment system (placeholder for future implementation)
- **Sharing**: Share notes (placeholder for future implementation)
- **Author Attribution**: Display author avatar, name, and timestamp

### 🔒 **Privacy & Permissions**
- **Visibility Settings**: Three levels of privacy control
- **Author Controls**: Edit and delete own notes
- **Firestore Security**: Respects existing security rules
- **Friend-based Access**: Notes visible to friends based on relationships

### 📱 **User Experience**
- **Real-time Updates**: Live synchronization using Firestore listeners
- **Pagination**: Efficient loading with "load more" functionality
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Keyboard Handling**: Proper keyboard avoidance and input management

## Technical Implementation

### Hooks (`useCardNotes.ts`)

#### **`useCardNotes(cardId, pageSize?, visibilityFilter?)`**
- Fetches notes for a specific card with pagination
- Real-time updates via Firestore onSnapshot
- Returns: `{ notes, loading, error, hasMore, loadMore, refetch }`

#### **`useCreateNote(cardId)`**
- Creates new notes with mention parsing
- Handles visibility settings and validation
- Returns: `{ createNote, loading, error }`

#### **`useLikeNote(cardId)`**
- Like/unlike functionality with optimistic updates
- Updates like counts in real-time
- Returns: `{ likeNote, unlikeNote, loading, error }`

#### **`useDeleteNote(cardId)`**
- Delete notes (author only)
- Handles confirmation and error states
- Returns: `{ deleteNote, loading, error }`

#### **`useFriends()`**
- Fetches user's friends for mention autocomplete
- Returns: `{ friends, loading, error }`

#### **`useNoteLikeStatus(cardId, noteId)`**
- Checks if current user has liked a specific note
- Real-time status updates
- Returns: `{ isLiked, loading }`

### Component Structure

```tsx
<CardNotes>
  <FlatList>
    <Header />
    <NoteItem />
    <NoteItem />
    ...
    <Footer />
  </FlatList>
  <NoteComposer>
    <MentionAutocomplete />
    <TextInput />
    <VisibilitySelector />
    <CharacterCount />
    <PostButton />
  </NoteComposer>
</CardNotes>
```

## Data Structure

Notes are stored in Firestore at: `card_notes/{cardId}/notes/{noteId}`

```typescript
interface CardNote {
  id: string;
  cardId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  content: string; // Max 280 characters
  visibility: 'public' | 'friends' | 'private';
  tags: string[];
  mentions?: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}
```

## Integration Example

```tsx
import { CardNotes } from '../components/CardNotes';

const MyCardDetailScreen = () => {
  const { symbol } = useRoute().params;
  
  return (
    <View style={{ flex: 1 }}>
      {/* Other card content */}
      <CardNotes
        cardId={symbol}
        symbol={symbol}
        style={{ flex: 1 }}
      />
    </View>
  );
};
```

## Security Rules

The component respects the existing Firestore security rules:

- **Read Access**: Based on note visibility and user relationships
- **Write Access**: Only authenticated users can create notes
- **Delete Access**: Only note authors can delete their own notes
- **Like Access**: Authenticated users can like/unlike any visible note

## Styling & Theming

The component uses the app's theming system:

- **Theme Colors**: Respects light/dark mode
- **Consistent Styling**: Matches app design patterns
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Proper contrast and touch targets

## Performance Optimizations

- **Pagination**: Loads notes in batches to reduce initial load time
- **Real-time Listeners**: Efficient Firestore onSnapshot usage
- **Optimistic Updates**: Immediate UI feedback for user actions
- **Memory Management**: Proper cleanup of listeners and subscriptions

## Future Enhancements

Potential improvements:

1. **Rich Text**: Support for bold, italic, and links
2. **Image Attachments**: Allow users to attach images to notes
3. **Thread Replies**: Nested comment system
4. **Push Notifications**: Notify users of mentions and likes
5. **Search**: Search through notes by content or author
6. **Moderation**: Report and moderate inappropriate content
7. **Analytics**: Track engagement metrics
8. **Export**: Allow users to export their notes

## Usage Guidelines

### Character Limit
- Hard limit of 280 characters
- Visual indicator when approaching limit
- Prevents posting when over limit

### Mentions
- Type `@` followed by username to trigger autocomplete
- Shows up to 5 matching friends
- Mentions are highlighted in blue

### Visibility
- **Public**: Visible to all users
- **Friends**: Visible to user's friends only
- **Private**: Visible to author only

### Best Practices
- Keep notes concise and relevant
- Use mentions to engage with friends
- Respect community guidelines
- Consider note visibility carefully

## Testing

The component includes comprehensive error handling:

- Network connectivity issues
- Authentication errors
- Permission denied scenarios
- Invalid data handling
- Loading states and empty states

## Accessibility

- Screen reader support
- Keyboard navigation
- High contrast mode compatibility
- Proper focus management
- Semantic HTML elements where applicable
