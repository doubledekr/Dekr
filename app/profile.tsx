import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme, List, Switch, Avatar, Button, TextInput, SegmentedButtons, Icon, Chip } from 'react-native-paper';
import { Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

interface TradingPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  preferredAssets: ('stocks' | 'crypto' | 'etfs')[];
  notifyOnPriceChange: boolean;
  priceAlertThreshold: number;
  autoInvest: boolean;
}

export default function ProfileScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  // Trading preferences
  const [tradingPreferences, setTradingPreferences] = useState<TradingPreferences>({
    riskTolerance: 'moderate',
    investmentHorizon: 'medium',
    preferredAssets: ['stocks'],
    notifyOnPriceChange: true,
    priceAlertThreshold: 5,
    autoInvest: false,
  });

  useEffect(() => {
    // Load user data from Firebase when component mounts
    const loadUserData = async () => {
      const currentUser = auth().currentUser;
      if (!currentUser) return;
      
      try {
        const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData) {
            setDisplayName(userData.displayName || '');
            setBio(userData.bio || '');
            setEmail(userData.email || currentUser.email || '');
            setPhone(userData.phone || '');
            setProfileImage(userData.profileImage || null);
            if (userData.tradingPreferences) {
              setTradingPreferences(userData.tradingPreferences);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
      setImageChanged(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const updateTradingPreference = <K extends keyof TradingPreferences>(
    key: K,
    value: TradingPreferences[K]
  ) => {
    setTradingPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    Haptics.selectionAsync();
  };

  const saveProfileData = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be signed in to save your profile');
      return;
    }

    try {
      setSaving(true);
      let profileImageUrl = profileImage;

      // Upload image if it was changed
      if (imageChanged && profileImage) {
        const response = await fetch(profileImage);
        const blob = await response.blob();
        const fileRef = storage().ref(`profile_images/${currentUser.uid}`);
        await fileRef.put(blob);
        profileImageUrl = await fileRef.getDownloadURL();
      }

      // Save user data to Firestore
      await firestore().collection('users').doc(currentUser.uid).set({
        displayName,
        bio,
        email,
        phone,
        profileImage: profileImageUrl,
        tradingPreferences,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Profile saved successfully');
      router.back();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: "Profile",
          headerLeft: () => (
            <Button
              icon="close"
              onPress={() => router.back()}
              labelStyle={{ color: theme.colors.primary }}
            >
              Close
            </Button>
          ),
          headerRight: () => (
            <Button
              mode="contained"
              onPress={saveProfileData}
              loading={saving}
              disabled={saving}
            >
              Save
            </Button>
          ),
          presentation: 'modal',
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleImagePick}>
            <Avatar.Image
              size={100}
              source={profileImage ? { uri: profileImage } : require('../assets/images/default-avatar.png')}
            />
            <View style={styles.editBadge}>
              <Icon source="pencil" size={16} color={theme.colors.surface} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <List.Section>
          <List.Subheader>Personal Information</List.Subheader>
          <View style={styles.inputContainer}>
            <TextInput
              label="Display Name"
              value={displayName}
              onChangeText={setDisplayName}
              mode="outlined"
            />
            <TextInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
            />
          </View>
        </List.Section>

        {/* Trading Preferences */}
        <List.Section>
          <List.Subheader>Trading Preferences</List.Subheader>
          
          <View style={styles.preferencesContainer}>
            <Text style={styles.label}>Risk Tolerance</Text>
            <SegmentedButtons
              value={tradingPreferences.riskTolerance}
              onValueChange={value => 
                updateTradingPreference('riskTolerance', value as TradingPreferences['riskTolerance'])
              }
              buttons={[
                { value: 'conservative', label: 'Conservative' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'aggressive', label: 'Aggressive' },
              ]}
            />
          </View>

          <View style={styles.preferencesContainer}>
            <Text style={styles.label}>Investment Horizon</Text>
            <SegmentedButtons
              value={tradingPreferences.investmentHorizon}
              onValueChange={value => 
                updateTradingPreference('investmentHorizon', value as TradingPreferences['investmentHorizon'])
              }
              buttons={[
                { value: 'short', label: 'Short Term' },
                { value: 'medium', label: 'Medium Term' },
                { value: 'long', label: 'Long Term' },
              ]}
            />
          </View>

          <View style={styles.preferencesContainer}>
            <Text style={styles.label}>Preferred Assets</Text>
            <View style={styles.chipContainer}>
              {['stocks', 'crypto', 'etfs'].map((asset) => (
                <Chip
                  key={asset}
                  selected={tradingPreferences.preferredAssets.includes(asset as any)}
                  onPress={() => {
                    const newAssets = tradingPreferences.preferredAssets.includes(asset as any)
                      ? tradingPreferences.preferredAssets.filter(a => a !== asset)
                      : [...tradingPreferences.preferredAssets, asset as any];
                    updateTradingPreference('preferredAssets', newAssets);
                  }}
                  style={styles.chip}
                >
                  {asset.charAt(0).toUpperCase() + asset.slice(1)}
                </Chip>
              ))}
            </View>
          </View>

          <List.Item
            title="Notify on Price Changes"
            right={props => (
              <Switch
                value={tradingPreferences.notifyOnPriceChange}
                onValueChange={value => updateTradingPreference('notifyOnPriceChange', value)}
              />
            )}
          />

          {tradingPreferences.notifyOnPriceChange && (
            <View style={styles.preferencesContainer}>
              <Text style={styles.label}>Price Alert Threshold (%)</Text>
              <TextInput
                value={tradingPreferences.priceAlertThreshold.toString()}
                onChangeText={value => {
                  const num = parseFloat(value);
                  if (!isNaN(num)) {
                    updateTradingPreference('priceAlertThreshold', num);
                  }
                }}
                mode="outlined"
                keyboardType="numeric"
                style={styles.numberInput}
              />
            </View>
          )}

          <List.Item
            title="Auto-Invest"
            description="Automatically invest based on your preferences"
            right={props => (
              <Switch
                value={tradingPreferences.autoInvest}
                onValueChange={value => updateTradingPreference('autoInvest', value)}
              />
            )}
          />
        </List.Section>

        {/* Privacy Settings */}
        <List.Section>
          <List.Subheader>Privacy Settings</List.Subheader>
          <List.Item
            title="Profile Visibility"
            description="Control who can see your profile"
            right={props => (
              <SegmentedButtons
                value="friends"
                onValueChange={() => {}}
                buttons={[
                  { value: 'private', label: 'Private' },
                  { value: 'friends', label: 'Friends' },
                  { value: 'public', label: 'Public' },
                ]}
              />
            )}
          />
        </List.Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 20,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#6CA393',
    borderRadius: 12,
    padding: 4,
  },
  inputContainer: {
    padding: 16,
    gap: 12,
  },
  preferencesContainer: {
    padding: 16,
    gap: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'Graphik-Medium',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  numberInput: {
    maxWidth: 120,
  },
}); 