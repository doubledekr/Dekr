import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { isTablet } from '../../utils/deviceUtils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tabletWidthPercentage?: number; // Width percentage on tablets (defaults to 80%)
  phoneWidthPercentage?: number; // Width percentage on phones (defaults to 100%)
  centered?: boolean; // Whether to center the container
}

/**
 * A responsive container component that adapts its width based on device type
 * On tablets, the container will take up tabletWidthPercentage of the screen width
 * On phones, the container will take up phoneWidthPercentage of the screen width
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  tabletWidthPercentage = 80,
  phoneWidthPercentage = 100,
  centered = true,
}) => {
  const isTabletDevice = isTablet();
  
  // Calculate width based on device type
  const widthPercentage = isTabletDevice ? tabletWidthPercentage : phoneWidthPercentage;
  
  return (
    <View style={[
      styles.container,
      { width: `${widthPercentage}%` },
      centered && styles.centered,
      style
    ]}>
      {children}
    </View>
  );
};

/**
 * A responsive two-column layout component for tablets
 * On tablets, it renders the content in two columns
 * On phones, it stacks the content
 */
interface ResponsiveColumnLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftColumnWidth?: number; // Percentage of the left column width on tablets (default: 40%)
  spacing?: number; // Spacing between columns
  style?: StyleProp<ViewStyle>;
}

export const ResponsiveColumnLayout: React.FC<ResponsiveColumnLayoutProps> = ({
  leftContent,
  rightContent,
  leftColumnWidth = 40,
  spacing = 16,
  style,
}) => {
  const isTabletDevice = isTablet();
  
  if (isTabletDevice) {
    // Tablet layout: two columns
    return (
      <View style={[styles.tabletRow, style]}>
        <View style={[styles.column, { width: `${leftColumnWidth}%` }]}>
          {leftContent}
        </View>
        <View style={{ width: spacing }} />
        <View style={[styles.column, { width: `${100 - leftColumnWidth - (spacing / 4)}%` }]}>
          {rightContent}
        </View>
      </View>
    );
  }
  
  // Phone layout: stacked
  return (
    <View style={[styles.phoneStack, style]}>
      <View style={styles.stackedSection}>{leftContent}</View>
      <View style={{ height: spacing }} />
      <View style={styles.stackedSection}>{rightContent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  centered: {
    alignItems: 'center',
  },
  tabletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  phoneStack: {
    flexDirection: 'column',
    width: '100%',
  },
  column: {
    flexDirection: 'column',
  },
  stackedSection: {
    width: '100%',
  },
}); 