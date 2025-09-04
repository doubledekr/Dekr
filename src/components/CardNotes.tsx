import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCardNotes, useCreateNote, useLikeNote, useDeleteNote, useFriends, useNoteLikeStatus } from '../hooks/useCardNotes';
import { CardNote } from '../types/firestore';
import { useThemeColor } from '../../hooks/useThemeColor';
import { auth } from '../../services/firebase-platform';

interface CardNotesProps {
  cardId: string;
  symbol: string;
  style?: any;
}

interface NoteItemProps {
  note: CardNote;
  cardId: string;
  onDelete?: (noteId: string) => void;
}

interface NoteComposerProps {
  cardId: string;
  onNoteCreated?: (note: CardNote) => void;
}

interface MentionAutocompleteProps {
  query: string;
  onSelectMention: (mention: string) => void;
  visible: boolean;
}

// Mention autocomplete component
const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  query,
  onSelectMention,
  visible,
}) => {
  const { friends, loading } = useFriends();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const filteredFriends = useMemo(() => {
    if (!query) return friends.slice(0, 5);
    return friends
      .filter(friend => 
        friend.displayName.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  }, [friends, query]);

  if (!visible || loading || filteredFriends.length === 0) {
    return null;
  }

  return (
    <View style={[styles.mentionAutocomplete, { backgroundColor }]}>
      {filteredFriends.map((friend) => (
        <TouchableOpacity
          key={friend.uid}
          style={styles.mentionItem}
          onPress={() => onSelectMention(friend.displayName)}
        >
          <View style={styles.mentionAvatar}>
            {friend.photoURL ? (
              <Image source={{ uri: friend.photoURL }} style={styles.avatarImage} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={32} color={mutedColor} />
            )}
          </View>
          <Text style={[styles.mentionName, { color: textColor }]}>
            {friend.displayName}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Note composer component
const NoteComposer: React.FC<NoteComposerProps> = ({ cardId, onNoteCreated }) => {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textInputRef = useRef<TextInput>(null);
  const { createNote, loading } = useCreateNote(cardId);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const characterCount = content.length;
  const isOverLimit = characterCount > 280;
  const canPost = content.trim().length > 0 && !isOverLimit && !loading;

  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    
    // Check for @ mentions
    const beforeCursor = text.substring(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [cursorPosition]);

  const handleSelectionChange = useCallback((event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  }, []);

  const handleMentionSelect = useCallback((mention: string) => {
    const beforeCursor = content.substring(0, cursorPosition);
    const afterCursor = content.substring(cursorPosition);
    
    // Replace the partial mention with the selected mention
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const newBeforeCursor = beforeCursor.replace(/@(\w*)$/, `@${mention} `);
      const newContent = newBeforeCursor + afterCursor;
      setContent(newContent);
      
      // Update cursor position
      const newCursorPosition = newBeforeCursor.length;
      setCursorPosition(newCursorPosition);
      
      // Focus back to input
      setTimeout(() => {
        textInputRef.current?.setSelection(newCursorPosition, newCursorPosition);
      }, 100);
    }
    
    setShowMentions(false);
    setMentionQuery('');
  }, [content, cursorPosition]);

  const handlePost = useCallback(async () => {
    if (!canPost) return;

    try {
      const note = await createNote({
        content,
        visibility,
      });
      
      setContent('');
      setVisibility('friends');
      onNoteCreated?.(note);
    } catch (error) {
      Alert.alert('Error', 'Failed to post note. Please try again.');
    }
  }, [canPost, content, visibility, createNote, onNoteCreated]);

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public': return 'earth';
      case 'friends': return 'account-group';
      case 'private': return 'lock';
      default: return 'lock';
    }
  };

  const handleVisibilityPress = () => {
    const options = [
      { label: 'Public', value: 'public' as const, icon: 'earth' },
      { label: 'Friends Only', value: 'friends' as const, icon: 'account-group' },
      { label: 'Private', value: 'private' as const, icon: 'lock' },
    ];

    Alert.alert(
      'Note Visibility',
      'Who can see this note?',
      [
        ...options.map(option => ({
          text: `${option.label} ${visibility === option.value ? '✓' : ''}`,
          onPress: () => setVisibility(option.value),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  return (
    <View style={styles.composer}>
      <MentionAutocomplete
        query={mentionQuery}
        onSelectMention={handleMentionSelect}
        visible={showMentions}
      />
      
      <View style={[styles.composerInput, { backgroundColor, borderColor: mutedColor }]}>
        <TextInput
          ref={textInputRef}
          style={[styles.textInput, { color: textColor }]}
          value={content}
          onChangeText={handleContentChange}
          onSelectionChange={handleSelectionChange}
          placeholder={`Share your thoughts about this asset...`}
          placeholderTextColor={mutedColor}
          multiline
          maxLength={300} // Allow slight overage for better UX
          scrollEnabled={false}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.composerFooter}>
        <View style={styles.composerLeft}>
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={handleVisibilityPress}
          >
            <MaterialCommunityIcons
              name={getVisibilityIcon()}
              size={16}
              color={mutedColor}
            />
            <Text style={[styles.visibilityText, { color: mutedColor }]}>
              {visibility === 'public' ? 'Public' : visibility === 'friends' ? 'Friends' : 'Private'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.composerRight}>
          <Text style={[
            styles.characterCount,
            { 
              color: isOverLimit ? '#F44336' : mutedColor,
              fontWeight: isOverLimit ? '600' : 'normal',
            }
          ]}>
            {characterCount}/280
          </Text>
          
          <TouchableOpacity
            style={[
              styles.postButton,
              {
                backgroundColor: canPost ? tintColor : mutedColor,
                opacity: canPost ? 1 : 0.5,
              }
            ]}
            onPress={handlePost}
            disabled={!canPost}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Individual note item component
const NoteItem: React.FC<NoteItemProps> = ({ note, cardId, onDelete }) => {
  const { likeNote, unlikeNote, loading: likeLoading } = useLikeNote(cardId);
  const { isLiked, loading: likeStatusLoading } = useNoteLikeStatus(cardId, note.id);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  const currentUser = auth.currentUser;
  const isOwnNote = currentUser?.uid === note.authorId;

  const formatTimestamp = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  }, []);

  const handleLike = useCallback(async () => {
    try {
      if (isLiked) {
        await unlikeNote(note.id);
      } else {
        await likeNote(note.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update like. Please try again.');
    }
  }, [isLiked, likeNote, unlikeNote, note.id]);

  const handleLongPress = useCallback(() => {
    if (!isOwnNote) return;

    Alert.alert(
      'Note Options',
      'What would you like to do?',
      [
        { text: 'Delete', onPress: () => handleDelete(), style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [isOwnNote]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete?.(note.id)
        },
      ]
    );
  }, [note.id, onDelete]);

  // Render mentions and links in content
  const renderContent = useCallback((content: string) => {
    const parts = content.split(/(@\w+)/g);
    
    return (
      <Text style={[styles.noteContent, { color: textColor }]}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            return (
              <Text key={index} style={[styles.mention, { color: tintColor }]}>
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  }, [textColor, tintColor]);

  return (
    <TouchableOpacity
      style={[styles.noteItem, { backgroundColor }]}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.noteHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            {note.authorPhotoURL ? (
              <Image source={{ uri: note.authorPhotoURL }} style={styles.avatarImage} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={32} color={mutedColor} />
            )}
          </View>
          
          <View style={styles.authorDetails}>
            <Text style={[styles.authorName, { color: textColor }]}>
              {note.authorName}
            </Text>
            <View style={styles.noteMetadata}>
              <Text style={[styles.timestamp, { color: mutedColor }]}>
                {formatTimestamp(note.createdAt)}
              </Text>
              
              <MaterialCommunityIcons
                name={note.visibility === 'public' ? 'earth' : 
                      note.visibility === 'friends' ? 'account-group' : 'lock'}
                size={12}
                color={mutedColor}
                style={styles.visibilityIcon}
              />
              
              {note.isEdited && (
                <Text style={[styles.editedIndicator, { color: mutedColor }]}>
                  edited
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.noteBody}>
        {renderContent(note.content)}
      </View>

      <View style={styles.noteActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          disabled={likeLoading || likeStatusLoading}
        >
          <MaterialCommunityIcons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? '#F44336' : mutedColor}
          />
          {note.likesCount > 0 && (
            <Text style={[styles.actionCount, { color: mutedColor }]}>
              {note.likesCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="comment-outline" size={16} color={mutedColor} />
          {note.commentsCount > 0 && (
            <Text style={[styles.actionCount, { color: mutedColor }]}>
              {note.commentsCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialCommunityIcons name="share-outline" size={16} color={mutedColor} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Main CardNotes component
export const CardNotes: React.FC<CardNotesProps> = ({ cardId, symbol, style }) => {
  const { notes, loading, error, hasMore, loadMore, refetch } = useCardNotes(cardId);
  const { deleteNote } = useDeleteNote(cardId);
  
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const handleNoteCreated = useCallback((note: CardNote) => {
    // Optimistically add the note to the top of the list
    // The real-time listener will handle the actual update
  }, []);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await deleteNote(noteId);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete note. Please try again.');
    }
  }, [deleteNote]);

  const renderNoteItem = useCallback(({ item }: { item: CardNote }) => (
    <NoteItem
      note={item}
      cardId={cardId}
      onDelete={handleDeleteNote}
    />
  ), [cardId, handleDeleteNote]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: textColor }]}>
        Notes about {symbol}
      </Text>
      <Text style={[styles.headerSubtitle, { color: mutedColor }]}>
        Share your thoughts and insights
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMore}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={mutedColor} />
        ) : (
          <Text style={[styles.loadMoreText, { color: mutedColor }]}>
            Load more notes
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="comment-text-outline" size={48} color={mutedColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        No notes yet
      </Text>
      <Text style={[styles.emptyMessage, { color: mutedColor }]}>
        Be the first to share your thoughts about {symbol}
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorState}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={mutedColor} />
          <Text style={[styles.errorTitle, { color: textColor }]}>
            Unable to load notes
          </Text>
          <Text style={[styles.errorMessage, { color: mutedColor }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: mutedColor }]}
            onPress={refetch}
          >
            <Text style={[styles.retryText, { color: mutedColor }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNoteItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
      />
      
      <NoteComposer
        cardId={cardId}
        onNoteCreated={handleNoteCreated}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  noteItem: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  noteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  visibilityIcon: {
    marginLeft: 4,
  },
  editedIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noteBody: {
    marginBottom: 12,
  },
  noteContent: {
    fontSize: 15,
    lineHeight: 20,
  },
  mention: {
    fontWeight: '600',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    padding: 16,
  },
  composerInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: 'top',
    minHeight: 56,
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  composerLeft: {
    flex: 1,
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  composerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  characterCount: {
    fontSize: 12,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mentionAutocomplete: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    maxHeight: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  mentionAvatar: {
    marginRight: 8,
  },
  mentionName: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadMoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
