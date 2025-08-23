import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { 
  signInWithEmail, 
  signInWithGoogle, 
  signInWithGoogleFallback,
  checkGooglePlayServices,
  clearGoogleSignInData,
  checkIOSGoogleSignInConfig
} from '../../services/firebase';
import { setUser, setError, setLoading } from '../../store/slices/authSlice';

export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      dispatch(setError('Please fill in all fields'));
      return;
    }

    try {
      dispatch(setLoading(true));
      const userCredential = await signInWithEmail(email, password);
      dispatch(setUser(userCredential.user));
      router.replace('/(tabs)');
    } catch (error: any) {
      dispatch(setError(error.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      dispatch(setLoading(true));
      
      // 1. First clear any existing Google Sign-In state (helps prevent cached errors)
      await clearGoogleSignInData();

      // Log platform for debugging
      console.log(`Attempting Google Sign-In on platform: ${Platform.OS}`);
      
      // 2A. For Android, verify Google Play Services
      if (Platform.OS === 'android') {
        const playServicesAvailable = await checkGooglePlayServices();
        if (!playServicesAvailable) {
          Alert.alert(
            'Google Play Services Required',
            'Google Sign-In requires Google Play Services to be installed and up-to-date.',
            [{ text: 'OK' }]
          );
          dispatch(setLoading(false));
          return;
        }
      }
      // 2B. For iOS, check the configuration
      else if (Platform.OS === 'ios') {
        await checkIOSGoogleSignInConfig();
      }
      
      // 3. Attempt primary Google Sign-In method
      try {
        console.log("Starting Google Sign-In process...");
        const userCredential = await signInWithGoogle();
        console.log("Google Sign-In successful, redirecting...");
        dispatch(setUser(userCredential.user));
        router.replace('/(tabs)');
        return;
      } catch (primaryError: any) {
        console.error('Primary Google Sign-In failed:', primaryError);
        
        // Special handling for iOS errors
        if (Platform.OS === 'ios') {
          console.log("iOS specific error handling...");
          // Check for configuration issues on iOS
          if (primaryError.message && (
              primaryError.message.includes('configuration') || 
              primaryError.message.includes('SIGN_IN_FAILED') ||
              primaryError.message.includes('canceled'))
          ) {
            Alert.alert(
              'Google Sign-In Issue',
              'There was a problem signing in with Google. Please try again or use email sign-in.',
              [{ text: 'OK' }]
            );
            dispatch(setLoading(false));
            return;
          }
        }
        
        // Check for specific error codes
        if (primaryError.code === 10 || 
            (primaryError.message && primaryError.message.includes('DEVELOPER_ERROR'))) {
          Alert.alert(
            'Google Sign-In Configuration Error',
            'There\'s a configuration issue with Google Sign-In. Make sure the Firebase project has the correct SHA-1 fingerprint registered.',
            [{ text: 'OK' }]
          );
          throw primaryError;
        }
        
        // 4. Try fallback method if primary fails
        try {
          const userCredential = await signInWithGoogleFallback();
          dispatch(setUser(userCredential.user));
          router.replace('/(tabs)');
          return;
        } catch (fallbackError: any) {
          console.error('Fallback Google Sign-In failed:', fallbackError);
          throw primaryError; // Throw the primary error to keep original error context
        }
      }
    } catch (error: any) {
      console.error('Google Sign-In ultimately failed:', error);
      
      // Format a user-friendly error message
      const errorMessage = error.message || 'Unknown error occurred';
      const errorCode = error.code || 'unknown';
      
      Alert.alert(
        'Google Sign-In Failed',
        `Error: ${errorMessage}\nCode: ${errorCode}`,
        [{ text: 'OK' }]
      );
      
      dispatch(setError(errorMessage));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Welcome Back</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sign in to continue to Dekr
        </Text>

        <View style={styles.form}>
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
            textContentType="password"
            autoComplete="password"
          />

          <Button
            mode="text"
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotPassword}>
            Forgot Password?
          </Button>

          <Button
            mode="contained"
            onPress={handleEmailSignIn}
            style={styles.button}>
            Sign In
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text variant="bodyMedium" style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            mode="outlined"
            onPress={handleGoogleSignIn}
            icon={({ size, color }) => (
              <MaterialCommunityIcons name="google" size={size} color={color} />
            )}
            style={styles.googleButton}>
            Continue with Google
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMedium">Don't have an account? </Text>
          <Button
            mode="text"
            onPress={() => router.push('/auth/sign-up')}
            style={styles.signUpButton}>
            Sign Up
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  button: {
    marginTop: 8,
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
  signUpButton: {
    marginLeft: -8,
  },
}); 