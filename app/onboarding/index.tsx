import React, { useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, useTheme } from 'react-native-paper';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { OnboardingImage } from '../../components/OnboardingImage';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    type: 'welcome' as const,
    title: 'Welcome to Dekr',
    description: 'Your AI-powered trading companion for smarter market decisions.',
  },
  {
    type: 'swipe' as const,
    title: 'Swipe to Discover',
    description: 'Explore stocks, crypto, and market news with our intuitive card interface.',
  },
  {
    type: 'learn' as const,
    title: 'Save & Learn',
    description: 'Build your watchlist and learn from our educational content.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/auth/sign-up');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}>
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <OnboardingImage type={slide.type} size={width * 0.8} />
            <Text variant="displaySmall" style={[styles.title, { fontFamily: 'AustinNewsDeck-Bold' }]}>
              {slide.title}
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.description, { fontFamily: 'Graphik-Regular' }]}>
              {slide.description}
            </Text>
          </View>
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => {
            const dotStyle = useAnimatedStyle(() => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];
              const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.3, 1, 0.3],
                'clamp'
              );
              const scale = interpolate(
                scrollX.value,
                inputRange,
                [1, 1.2, 1],
                'clamp'
              );

              return {
                opacity,
                transform: [{ scale }],
              };
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: theme.colors.primary },
                  dotStyle,
                ]}
              />
            );
          })}
        </View>

        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.button}>
          {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    marginTop: 20,
  },
}); 