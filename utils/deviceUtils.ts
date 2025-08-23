import { Dimensions, Platform, PixelRatio } from 'react-native';
import { useWindowDimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on the screen density and size, determine if the device is a tablet
export const isTablet = (): boolean => {
  // iPad Pro 12.9-inch will have a width of 1024 in portrait
  const tabletMinWidth = 600; // Common threshold for tablet devices
  
  // Pixel ratio gives us a way to account for the display density
  const pixelDensity = PixelRatio.get();
  
  // Screen width accounting for pixel density
  const adjustedWidth = SCREEN_WIDTH / pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT / pixelDensity;
  
  // If width is greater than height, we're in landscape
  const currentWidth = Math.min(adjustedWidth, adjustedHeight);
  const currentHeight = Math.max(adjustedWidth, adjustedHeight);
  
  // Additional check for tablet-like aspect ratio
  const aspectRatio = currentHeight / currentWidth;
  const isTabletAspectRatio = aspectRatio < 1.6; // Most phones have aspect ratios >= 16:9 (1.77)
  
  // On Android, we can use additional criteria
  if (Platform.OS === 'android') {
    return currentWidth >= tabletMinWidth && isTabletAspectRatio;
  }
  
  // On iOS, rely primarily on screen size
  return currentWidth >= tabletMinWidth;
};

// Hook for responsive sizing that adapts to tablet or phone
export const useResponsiveSize = () => {
  const { width, height } = useWindowDimensions();
  const isTabletDevice = isTablet();
  
  // Scale factors for different device types
  const scaleFactor = isTabletDevice ? 1.2 : 1.0;
  
  return {
    // Function to scale sizes based on device type
    scale: (size: number) => size * scaleFactor,
    
    // Returns appropriate size from provided options based on device type
    size: <T>(options: { phone: T; tablet: T }) => 
      isTabletDevice ? options.tablet : options.phone,
    
    // Current device dimensions and status
    width,
    height,
    isTablet: isTabletDevice
  };
};

// Function to calculate responsive font size
export const responsiveFontSize = (size: number): number => {
  // Scale based on screen width compared to standard 375pt design
  const standardScreenWidth = 375;
  const scaleFactor = Math.min(SCREEN_WIDTH / standardScreenWidth, 1.3); // Cap at 1.3x for larger screens
  
  // Additional scale for tablets to prevent fonts from becoming too large
  const tabletFontScale = isTablet() ? 0.85 : 1;
  
  return size * scaleFactor * tabletFontScale;
};

// Calculate responsive spacing for margins/padding
export const spacing = (value: number): number => {
  const baseSpacing = 8;
  const scaleFactor = isTablet() ? 1.25 : 1;
  return value * baseSpacing * scaleFactor;
}; 