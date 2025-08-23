import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface SentimentButtonProps {
  label: string;
  variant?: 'bullish' | 'bearish';
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function SentimentButton({ 
  label, 
  variant = 'bullish',
  style,
  children
}: SentimentButtonProps) {
  const getBgColor = () => {
    if (variant === 'bullish') {
      return label ? '#E6F4EA' : '#006837';
    }
    return label ? '#FEEEF0' : '#9B2C2C';
  };

  const getTextColor = () => {
    if (variant === 'bullish') {
      return '#006837';
    }
    return '#9B2C2C';
  };

  return (
    <View
      style={[
        styles.button,
        { backgroundColor: getBgColor() },
        style
      ]}
    >
      {label ? (
        <Text style={[styles.label, { color: getTextColor() }]}>
          {label}
        </Text>
      ) : children}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  label: {
    fontFamily: 'Graphik-Medium',
    fontSize: 16,
  },
}); 