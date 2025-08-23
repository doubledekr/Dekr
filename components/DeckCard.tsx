import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DeckCardProps {
  title: string;
  subtitle: string;
  backgroundColor: string;
  icon: string;
  count?: number;
  onPress: () => void;
  isActive?: boolean;
  isLoading?: boolean;
}

export function DeckCard({
  title,
  subtitle,
  backgroundColor,
  icon,
  count,
  onPress,
  isActive,
  isLoading,
}: DeckCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor },
        isActive && styles.activeContainer,
      ]}
      onPress={onPress}
      disabled={isLoading}
    >
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={icon as any}
          size={24}
          color="#000"
          style={[styles.icon, isActive && styles.activeIcon]}
        />
        <Text
          variant="titleMedium"
          style={[styles.title, isActive && styles.activeText]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          variant="bodySmall"
          style={[styles.subtitle, isActive && styles.activeText]}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#000" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 100,
    marginRight: 12,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    opacity: 0.9,
  },
  activeContainer: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  icon: {
    marginBottom: 8,
    opacity: 0.8,
  },
  activeIcon: {
    opacity: 1,
  },
  title: {
    fontFamily: 'Graphik-Medium',
    fontSize: 16,
    color: '#000',
    opacity: 0.8,
  },
  subtitle: {
    fontFamily: 'Graphik-Regular',
    fontSize: 12,
    color: '#000',
    opacity: 0.6,
  },
  activeText: {
    opacity: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    padding: 4,
  },
}); 