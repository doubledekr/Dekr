import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { resetPassword } from '../../services/firebase';
import { setError, setLoading } from '../../store/slices/authSlice';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [isResetSent, setIsResetSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      dispatch(setError('Please enter your email address'));
      return;
    }

    try {
      dispatch(setLoading(true));
      await resetPassword(email);
      setIsResetSent(true);
    } catch (error: any) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Reset Password</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {isResetSent
            ? 'Check your email for reset instructions'
            : 'Enter your email to receive reset instructions'}
        </Text>

        {!isResetSent ? (
          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />

            <Button
              mode="contained"
              onPress={handleResetPassword}
              style={styles.button}>
              Send Reset Link
            </Button>
          </View>
        ) : (
          <View style={styles.successContainer}>
            <Text variant="bodyLarge" style={styles.successText}>
              If an account exists for {email}, you will receive an email with instructions on how to reset your password.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={styles.button}>
              Return to Sign In
            </Button>
          </View>
        )}

        <Button
          mode="text"
          onPress={() => router.back()}
          style={styles.backButton}>
          Back to Sign In
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'AustinNewsDeck-Bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    fontFamily: 'Graphik-Regular',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    gap: 24,
  },
  successText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  backButton: {
    marginTop: 24,
  },
}); 