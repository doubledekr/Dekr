import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { safeHapticImpact } from '../utils/haptics';

interface SwipeToHomeProps {
  children: React.ReactNode;
  swipeThreshold?: number;
}

export function SwipeToHome({ children, swipeThreshold = 100 }: SwipeToHomeProps) {
  const panRef = useRef<PanGestureHandler>(null);

  const handleGestureEvent = (event: any) => {
    const { translationX, translationY, state } = event.nativeEvent;
    
    // Check if gesture is complete
    if (state === State.END) {
      // Detect swipe up gesture (negative Y translation)
      if (translationY < -swipeThreshold && Math.abs(translationX) < Math.abs(translationY)) {
        safeHapticImpact();
        router.push('/');
      }
    }
  };

  return (
    <PanGestureHandler 
      ref={panRef}
      onHandlerStateChange={handleGestureEvent}
    >
      <View style={styles.container}>
        {children}
        {/* Swipe indicator */}
        <View style={styles.swipeIndicator}>
          <View style={styles.swipeArrow} />
        </View>
      </View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  swipeIndicator: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  swipeArrow: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 2,
  },
});
