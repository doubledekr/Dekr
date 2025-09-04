import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Button, List, Switch, useTheme, Avatar, TextInput, SegmentedButtons, Text, IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signOut as signOutAction } from '../../store/slices/authSlice';
import * as ImagePicker from 'expo-image-picker';
import { firestore } from '../../services/firebase-platform';
import { RootState } from '../../store/store';

interface UserProfile {
  displayName: string;
  photoURL?: string | null;
  bio?: string;
  email: string;
  followersCount: number;
  followingCount: number;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  isPublic: boolean;
}

// Arrays for generating random display names
const cardAdjectives = [
  'Wild', 'Lucky', 'Royal', 'Golden', 'Silver', 'Diamond', 'Mystic', 'Clever',
  'Swift', 'Bright', 'Sharp', 'Wise', 'Bold', 'Brave', 'Noble', 'Grand'
];

const cardNouns = [
  'Ace', 'King', 'Queen', 'Jack', 'Joker', 'Heart', 'Spade', 'Club',
  'Diamond', 'Player', 'Dealer', 'Card', 'Hand', 'Draw', 'Deck', 'Suit'
];

function generateDisplayName(): string {
  const adjective = cardAdjectives[Math.floor(Math.random() * cardAdjectives.length)];
  const noun = cardNouns[Math.floor(Math.random() * cardNouns.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${adjective}${noun}${number}`;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load user profile data
  useEffect(() => {
    async function loadUserProfile() {
      if (!user) return;

      try {
        setIsLoading(true);
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        const userData = userDoc.data() as UserProfile;

        if (userData) {
          setDisplayName(userData.displayName || generateDisplayName());
          setProfileImage(userData.photoURL || null);
          setBio(userData.bio || '');
          setEmail(userData.email || '');
          setPushNotifications(userData.notificationsEnabled ?? true);
          setEmailNotifications(userData.emailNotifications ?? true);
          setIsPublic(userData.isPublic ?? true);
        } else {
          // If no user data exists, create a new profile with generated display name
          const newDisplayName = generateDisplayName();
          setDisplayName(newDisplayName);
          // Create initial user profile
          await firestore().collection('users').doc(user.uid).set({
            displayName: newDisplayName,
            email: user.email || '',
            followersCount: 0,
            followingCount: 0,
            notificationsEnabled: true,
            emailNotifications: true,
            isPublic: true,
          });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [user]);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleGenerateNewName = () => {
    const newName = generateDisplayName();
    setDisplayName(newName);
    Haptics.selectionAsync();
  };

  const uploadImage = async (uri: string): Promise<string> => {
    if (!user) throw new Error('No user logged in');

    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `profile_images/${user.uid}/${Date.now()}.jpg`;
    const ref = storage().ref(filename);
    
    await ref.put(blob);
    return await ref.getDownloadURL();
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      Haptics.selectionAsync();

      let photoURL = profileImage;
      if (profileImage && !profileImage.startsWith('http')) {
        photoURL = await uploadImage(profileImage);
      }

      const userData: Partial<UserProfile> = {
        displayName,
        ...(photoURL && { photoURL }),
        ...(bio && { bio }),
        email,
        notificationsEnabled: pushNotifications,
        emailNotifications,
        isPublic,
      };

      await firestore().collection('users').doc(user.uid).set(userData, { merge: true });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      dispatch(signOutAction());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error signing out:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Profile Section */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Profile</List.Subheader>
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handleImagePick}>
            <Avatar.Image
              size={80}
              source={profileImage ? { uri: profileImage } : require('../../assets/images/default-avatar.png')}
            />
            <View style={[styles.editBadge, { backgroundColor: theme.colors.primary }]}>
              <List.Icon icon="pencil" color={theme.colors.surface} />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.displayNameContainer}>
            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
              style={styles.displayNameInput}
            />
            <IconButton
              icon="dice-3"
              mode="contained"
              onPress={handleGenerateNewName}
              style={styles.generateButton}
            />
          </View>
          <TextInput
            label="Bio (optional)"
            value={bio}
            onChangeText={setBio}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Tell others about yourself..."
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </List.Section>

      {/* Privacy Settings */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Privacy Settings</List.Subheader>
        <List.Item
          title="Public Profile"
          description={isPublic ? "Anyone can view your profile" : "Only you can view your profile"}
          left={props => <List.Icon {...props} icon={isPublic ? "earth" : "lock"} />}
          right={() => <Switch value={isPublic} onValueChange={setIsPublic} />}
        />
      </List.Section>

      {/* Notification Settings */}
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Notifications</List.Subheader>
        <List.Item
          title="Push Notifications"
          description="Receive push notifications"
          left={props => <List.Icon {...props} icon="bell" />}
          right={() => <Switch value={pushNotifications} onValueChange={setPushNotifications} />}
        />
        <List.Item
          title="Email Notifications"
          description="Receive email notifications"
          left={props => <List.Icon {...props} icon="email" />}
          right={() => <Switch value={emailNotifications} onValueChange={setEmailNotifications} />}
        />
      </List.Section>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          style={styles.saveButton}
        >
          Save Changes
        </Button>
        
        <Button 
          mode="outlined" 
          onPress={handleSignOut}
          style={[styles.signOutButton, { borderColor: theme.colors.error }]}
          textColor={theme.colors.error}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
  },
  editBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    borderRadius: 12,
    padding: 4,
  },
  inputContainer: {
    padding: 16,
    gap: 12,
  },
  displayNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayNameInput: {
    flex: 1,
  },
  generateButton: {
    marginTop: 6,
  },
  privacyContainer: {
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Graphik-Medium',
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  saveButton: {
    marginBottom: 12,
  },
  signOutButton: {
    marginTop: 'auto',
  },
}); 