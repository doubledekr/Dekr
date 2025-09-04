import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signUpWithEmail, signInWithGoogle } from '../../services/firebase';
import { setUser, setError, setLoading, setHasCompletedOnboarding } from '../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignUpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      dispatch(setError('Please fill in all fields'));
      return;
    }

    if (password !== confirmPassword) {
      dispatch(setError('Passwords do not match'));
      return;
    }

    try {
      dispatch(setLoading(true));
      const userCredential = await signUpWithEmail(email, password);
      dispatch(setUser(userCredential.user));
      router.replace('/(tabs)');
    } catch (error: any) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDemoSignIn = async () => {
    try {
      dispatch(setLoading(true));
      
      // Create a mock demo user
      const demoUser = {
        uid: 'demo-user-123',
        email: 'demo@dekr.app',
        displayName: 'Demo User',
        photoURL: null,
        emailVerified: true,
      };
      
      // Set demo user in Redux store
      dispatch(setUser(demoUser));
      
      // Mark onboarding as completed for demo
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      dispatch(setHasCompletedOnboarding(true));
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      dispatch(setError('Demo sign-in failed'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      dispatch(setLoading(true));
      const userCredential = await signInWithGoogle();
      dispatch(setUser(userCredential.user));
      router.replace('/(tabs)');
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
        <Text variant="displaySmall" style={styles.title}>Create Account</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Join Dekr to start trading smarter
        </Text>

        <View style={styles.form}>
          <Button
            mode="contained"
            onPress={handleDemoSignIn}
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="account-circle" size={size} color={color} />
            )}
            style={[styles.button, styles.demoButton]}
            buttonColor="#4CAF50"
            textColor="white">
            🚀 Try Demo Account
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text variant="bodyMedium" style={styles.dividerText}>or create your account</Text>
            <View style={styles.dividerLine} />
          </View>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
            textContentType="newPassword"
            autoComplete="password-new"
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            style={styles.input}
            textContentType="newPassword"
            autoComplete="password-new"
          />

          <Button
            mode="contained"
            onPress={handleEmailSignUp}
            style={styles.button}>
            Sign Up
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text variant="bodyMedium" style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            mode="outlined"
            onPress={handleGoogleSignUp}
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="google" size={size} color={color} />
            )}
            style={styles.googleButton}>
            Continue with Google
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMedium">Already have an account? </Text>
          <Button
            mode="text"
            onPress={() => router.push('/auth/sign-in')}
            style={styles.signInButton}>
            Sign In
          </Button>
        </View>
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
    marginTop: 8,
  },
  demoButton: {
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    marginHorizontal: 16,
    opacity: 0.7,
  },
  googleButton: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signInButton: {
    marginLeft: -8,
  },
}); 