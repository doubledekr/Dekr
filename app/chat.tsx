import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Message, sendMessage } from '../services/chat-service';
import * as Haptics from 'expo-haptics';
import { Stack, router } from 'expo-router';

export default function ChatScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant' as const,
      content: 'Hello! I\'m your financial learning assistant. How can I help you learn about stocks, trading, or financial health today?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const handleChangeText = useCallback((text: string) => {
    setInputMessage(text);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message to chat
    setMessages(prevMessages => [...prevMessages, { role: 'user' as const, content: userMessage }]);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setIsLoading(true);
      const response = await sendMessage(userMessage, messages);
      
      // Add AI response to chat
      setMessages(prevMessages => [...prevMessages, { role: 'assistant' as const, content: response }]);
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message in chat
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant' as const,
          content: 'I apologize, but I encountered an error. Please try again.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, messages]);

  const renderMessage = useCallback((message: Message, index: number) => {
    const isUser = message.role === 'user';
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.assistantMessage,
          { backgroundColor: isUser ? theme.colors.primary : theme.colors.surfaceVariant }
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: isUser ? theme.colors.surface : theme.colors.onSurface }
          ]}
        >
          {message.content}
        </Text>
      </View>
    );
  }, [theme.colors]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: "Financial Assistant",
          headerLeft: () => (
            <IconButton
              icon="close"
              size={24}
              onPress={() => router.back()}
            />
          ),
          presentation: 'modal',
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: theme.colors.onSurface }]}
            placeholder="Type your message..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={inputMessage}
            onChangeText={handleChangeText}
            multiline
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <IconButton
            icon="send"
            size={24}
            onPress={handleSend}
            disabled={!inputMessage.trim() || isLoading}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 8,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderTopRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
}); 