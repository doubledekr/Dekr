import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCreateDeck, useUpdateDeck, useDeck } from '../../hooks/useDecks';
import { Deck } from '../../types/firestore';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

type CreateDeckRouteProp = RouteProp<{ CreateDeck: { deckId?: string } }, 'CreateDeck'>;

interface CategoryOption {
  value: 'stocks' | 'crypto' | 'mixed' | 'watchlist';
  label: string;
  icon: string;
  description: string;
}

interface VisibilityOption {
  value: 'public' | 'friends' | 'private';
  label: string;
  icon: string;
  description: string;
}

const categoryOptions: CategoryOption[] = [
  {
    value: 'stocks',
    label: 'Stocks',
    icon: 'chart-line',
    description: 'Focus on stock investments',
  },
  {
    value: 'crypto',
    label: 'Crypto',
    icon: 'currency-btc',
    description: 'Cryptocurrency portfolio',
  },
  {
    value: 'mixed',
    label: 'Mixed',
    icon: 'view-dashboard',
    description: 'Stocks and crypto combined',
  },
  {
    value: 'watchlist',
    label: 'Watchlist',
    icon: 'eye',
    description: 'Track potential investments',
  },
];

const visibilityOptions: VisibilityOption[] = [
  {
    value: 'public',
    label: 'Public',
    icon: 'earth',
    description: 'Anyone can view this deck',
  },
  {
    value: 'friends',
    label: 'Friends Only',
    icon: 'account-group',
    description: 'Only your friends can view',
  },
  {
    value: 'private',
    label: 'Private',
    icon: 'lock',
    description: 'Only you can view this deck',
  },
];

export const CreateDeckModal: React.FC = () => {
  const route = useRoute<CreateDeckRouteProp>();
  const navigation = useNavigation();
  const deckId = route.params?.deckId;
  const isEditing = !!deckId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'stocks' | 'crypto' | 'mixed' | 'watchlist'>('mixed');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('private');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const { createDeck } = useCreateDeck();
  const { updateDeck } = useUpdateDeck();
  const { deck: existingDeck, loading: deckLoading } = useDeck(deckId || '');

  useEffect(() => {
    if (isEditing && existingDeck) {
      setTitle(existingDeck.title);
      setDescription(existingDeck.description || '');
      setCategory(existingDeck.category);
      setVisibility(existingDeck.visibility);
      setTags(existingDeck.tags);
    }
  }, [isEditing, existingDeck]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Deck' : 'Create Deck',
      headerLeft: () => (
        <TouchableOpacity onPress={handleCancel}>
          <Text style={[styles.headerButton, { color: mutedColor }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isSubmitting || !title.trim()}
        >
          <Text style={[
            styles.headerButton, 
            { 
              color: (!title.trim() || isSubmitting) ? mutedColor : tintColor,
              opacity: (!title.trim() || isSubmitting) ? 0.5 : 1,
            }
          ]}>
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isEditing, isSubmitting, title, tintColor, mutedColor]);

  const handleCancel = () => {
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const hasChanges = () => {
    if (!isEditing) return title.trim() || description.trim() || tags.length > 0;
    if (!existingDeck) return false;
    
    return (
      title !== existingDeck.title ||
      description !== (existingDeck.description || '') ||
      category !== existingDeck.category ||
      visibility !== existingDeck.visibility ||
      JSON.stringify(tags) !== JSON.stringify(existingDeck.tags)
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a deck title');
      return;
    }

    setIsSubmitting(true);

    try {
      const deckData = {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        visibility,
        tags,
      };

      if (isEditing && deckId) {
        await updateDeck(deckId, deckData);
        Alert.alert('Success', 'Deck updated successfully');
      } else {
        const newDeck = await createDeck(deckData);
        navigation.replace('DeckDetail', { deckId: newDeck.id });
        return;
      }

      navigation.goBack();
    } catch (error) {
      console.error('Error saving deck:', error);
      Alert.alert(
        'Error', 
        `Failed to ${isEditing ? 'update' : 'create'} deck. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const renderCategoryOption = (option: CategoryOption) => {
    const isSelected = category === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.optionCard,
          { 
            backgroundColor,
            borderColor: isSelected ? tintColor : mutedColor,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => setCategory(option.value)}
      >
        <MaterialCommunityIcons
          name={option.icon}
          size={24}
          color={isSelected ? tintColor : mutedColor}
        />
        <Text style={[
          styles.optionTitle,
          { color: isSelected ? tintColor : textColor }
        ]}>
          {option.label}
        </Text>
        <Text style={[styles.optionDescription, { color: mutedColor }]}>
          {option.description}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderVisibilityOption = (option: VisibilityOption) => {
    const isSelected = visibility === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.visibilityOption,
          { 
            backgroundColor: isSelected ? `${tintColor}20` : backgroundColor,
            borderColor: isSelected ? tintColor : mutedColor,
          }
        ]}
        onPress={() => setVisibility(option.value)}
      >
        <MaterialCommunityIcons
          name={option.icon}
          size={20}
          color={isSelected ? tintColor : mutedColor}
        />
        <View style={styles.visibilityContent}>
          <Text style={[
            styles.visibilityTitle,
            { color: isSelected ? tintColor : textColor }
          ]}>
            {option.label}
          </Text>
          <Text style={[styles.visibilityDescription, { color: mutedColor }]}>
            {option.description}
          </Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={tintColor}
          />
        )}
      </TouchableOpacity>
    );
  };

  if (isEditing && deckLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Basic Information
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: mutedColor }]}>
              Deck Title *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  backgroundColor,
                  color: textColor,
                  borderColor: mutedColor,
                }
              ]}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter deck title"
              placeholderTextColor={mutedColor}
              maxLength={50}
            />
            <Text style={[styles.characterCount, { color: mutedColor }]}>
              {title.length}/50
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: mutedColor }]}>
              Description (Optional)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                styles.textArea,
                { 
                  backgroundColor,
                  color: textColor,
                  borderColor: mutedColor,
                }
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your deck..."
              placeholderTextColor={mutedColor}
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={[styles.characterCount, { color: mutedColor }]}>
              {description.length}/200
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Category
          </Text>
          <View style={styles.categoryGrid}>
            {categoryOptions.map(renderCategoryOption)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Privacy
          </Text>
          <View style={styles.visibilityList}>
            {visibilityOptions.map(renderVisibilityOption)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Tags (Optional)
          </Text>
          <Text style={[styles.sectionDescription, { color: mutedColor }]}>
            Add up to 5 tags to help others discover your deck
          </Text>
          
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[
                styles.tagInput,
                { 
                  backgroundColor,
                  color: textColor,
                  borderColor: mutedColor,
                }
              ]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag..."
              placeholderTextColor={mutedColor}
              onSubmitEditing={handleAddTag}
              maxLength={20}
            />
            <TouchableOpacity
              style={[
                styles.addTagButton,
                { 
                  backgroundColor: tintColor,
                  opacity: (tagInput.trim() && tags.length < 5) ? 1 : 0.5,
                }
              ]}
              onPress={handleAddTag}
              disabled={!tagInput.trim() || tags.length >= 5}
            >
              <MaterialCommunityIcons name="plus" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: `${tintColor}20` }]}>
                  <Text style={[styles.tagText, { color: tintColor }]}>
                    {tag}
                  </Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <MaterialCommunityIcons
                      name="close"
                      size={16}
                      color={tintColor}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  headerButton: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 100,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  visibilityList: {
    gap: 12,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  visibilityContent: {
    flex: 1,
  },
  visibilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  visibilityDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 48,
  },
  addTagButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
