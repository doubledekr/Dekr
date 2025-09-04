import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShareCodeInput } from '../../hooks/useSharing';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { useThemeColor } from '../../../hooks/useThemeColor';

export const ShareCodeScreen: React.FC = () => {
  const navigation = useNavigation();
  const [code, setCode] = useState('');
  const { processShareCode, loading } = useShareCodeInput();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({}, 'tabIconDefault');

  const handleSubmit = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a share code');
      return;
    }

    try {
      const result = await processShareCode(code);
      
      if (result) {
        // Navigate to the appropriate screen
        if (result.share.type === 'deck') {
          navigation.navigate('DeckDetail', { deckId: result.share.targetId });
        } else if (result.share.type === 'card') {
          navigation.navigate('CardDetail', { 
            symbol: result.share.targetId, 
            cardId: result.share.targetId 
          });
        }
      }
    } catch (error) {
      // Error already handled in processShareCode
    }
  };

  const handlePaste = async () => {
    try {
      // In a real implementation, you'd use Clipboard.getStringAsync()
      // For now, we'll show a placeholder
      Alert.alert('Paste', 'Paste functionality would be implemented here');
    } catch (error) {
      Alert.alert('Error', 'Failed to paste from clipboard');
    }
  };

  const isValidCode = code.trim().length >= 8; // Minimum code length

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Enter Share Code',
      headerBackTitle: 'Back',
    });
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="qrcode-scan" size={64} color={tintColor} />
          <Text style={[styles.title, { color: textColor }]}>
            Enter Share Code
          </Text>
          <Text style={[styles.subtitle, { color: mutedColor }]}>
            Enter the code shared with you to access decks and cards
          </Text>
        </View>

        <View style={styles.inputSection}>
          <View style={[styles.inputContainer, { backgroundColor, borderColor: mutedColor }]}>
            <MaterialCommunityIcons name="key" size={20} color={mutedColor} />
            <TextInput
              style={[styles.textInput, { color: textColor }]}
              value={code}
              onChangeText={setCode}
              placeholder="Enter share code..."
              placeholderTextColor={mutedColor}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.pasteButton}
              onPress={handlePaste}
              disabled={loading}
            >
              <MaterialCommunityIcons name="content-paste" size={20} color={tintColor} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: isValidCode && !loading ? tintColor : mutedColor,
                opacity: isValidCode && !loading ? 1 : 0.5,
              }
            ]}
            onPress={handleSubmit}
            disabled={!isValidCode || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="white" />
                <Text style={styles.submitButtonText}>Access Shared Content</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={[styles.helpTitle, { color: textColor }]}>
            How it works
          </Text>
          <View style={styles.helpItem}>
            <MaterialCommunityIcons name="numeric-1-circle" size={20} color={mutedColor} />
            <Text style={[styles.helpText, { color: mutedColor }]}>
              Get a share code from a friend or colleague
            </Text>
          </View>
          <View style={styles.helpItem}>
            <MaterialCommunityIcons name="numeric-2-circle" size={20} color={mutedColor} />
            <Text style={[styles.helpText, { color: mutedColor }]}>
              Enter the code in the field above
            </Text>
          </View>
          <View style={styles.helpItem}>
            <MaterialCommunityIcons name="numeric-3-circle" size={20} color={mutedColor} />
            <Text style={[styles.helpText, { color: mutedColor }]}>
              Access the shared deck or card instantly
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: mutedColor }]}>
            Share codes are temporary and may expire
          </Text>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 20,
  },
  pasteButton: {
    padding: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helpSection: {
    marginBottom: 40,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
