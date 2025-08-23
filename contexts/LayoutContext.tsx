import React, { createContext, useContext, useEffect, useState } from 'react';
import { Dimensions, ScaledSize, useWindowDimensions } from 'react-native';
import { isTablet } from '../utils/deviceUtils';

interface LayoutContextType {
  isTablet: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

/**
 * Provider component for layout information throughout the app
 */
export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { width, height } = useWindowDimensions();
  const tabletMode = isTablet();
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    width > height ? 'landscape' : 'portrait'
  );
  
  // Update orientation when dimensions change
  useEffect(() => {
    const handleDimensionsChange = ({ window }: { window: ScaledSize }) => {
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    };
    
    const dimensionSubscription = Dimensions.addEventListener('change', handleDimensionsChange);
    
    return () => {
      // Clean up in RN 0.65+ - no need to manually remove
      if (dimensionSubscription?.remove) {
        dimensionSubscription.remove();
      }
    };
  }, []);
  
  const value = {
    isTablet: tabletMode,
    width,
    height,
    orientation,
  };
  
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

/**
 * Hook to access layout information
 */
export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  
  return context;
}; 