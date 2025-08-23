import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { Icon } from 'react-native-paper';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';

const { height } = Dimensions.get('window');
const MODAL_HEIGHT = 280; // Approximate height of the modal content

interface DeckSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  backgroundColor: string;
}

export function DeckSettingsModal({ 
  visible, 
  onClose,
  title,
  backgroundColor
}: DeckSettingsModalProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(MODAL_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(MODAL_HEIGHT, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const settingsOptions = [
    { icon: 'sort-ascending', label: 'Sort by Name', onPress: () => {} },
    { icon: 'sort-numeric-ascending', label: 'Sort by Price', onPress: () => {} },
    { icon: 'sort-calendar-ascending', label: 'Sort by Date Added', onPress: () => {} },
    { icon: 'filter-variant', label: 'Filter Assets', onPress: () => {} },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={styles.overlayPress} onPress={onClose} />
        </Animated.View>
        
        <Animated.View style={[styles.content, { backgroundColor }, modalStyle]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title} Settings</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon source="close" size={24} color="#1A1A1A" />
            </Pressable>
          </View>
          
          <View style={styles.options}>
            {settingsOptions.map((option, index) => (
              <Pressable
                key={index}
                style={styles.option}
                onPress={option.onPress}
              >
                <Icon source={option.icon} size={24} color="#1A1A1A" />
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayPress: {
    flex: 1,
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Graphik-Semibold',
    fontSize: 20,
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  optionText: {
    fontFamily: 'Graphik-Regular',
    fontSize: 16,
    color: '#1A1A1A',
  },
}); 