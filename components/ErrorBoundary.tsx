import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import * as Updates from 'expo-updates';
import { logError } from '../services/analytics';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logError(error, {
      component_stack: errorInfo.componentStack,
    });
  }

  handleRestart = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      if (error instanceof Error) {
        logError(error);
      }
      // If reload fails, force a hard reload
      if (__DEV__) {
        console.log('Development mode: Please reload manually');
      } else {
        Updates.reloadAsync();
      }
    }
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRestart={this.handleRestart} />;
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onRestart: () => void;
}

function ErrorFallback({ error, onRestart }: ErrorFallbackProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.error }]}>
        Oops! Something went wrong
      </Text>
      <Text style={[styles.message, { color: theme.colors.onBackground }]}>
        {error?.message || 'An unexpected error occurred'}
      </Text>
      <Button
        mode="contained"
        onPress={onRestart}
        style={styles.button}
        buttonColor={theme.colors.primary}
      >
        Restart App
      </Button>
      {__DEV__ && error && (
        <View style={styles.debugContainer}>
          <Text style={[styles.debugText, { color: theme.colors.error }]}>
            Debug Information:
          </Text>
          <Text style={[styles.debugText, { color: theme.colors.onBackground }]}>
            {error.stack}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
  debugContainer: {
    marginTop: 40,
    padding: 20,
    width: '100%',
  },
  debugText: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
}); 