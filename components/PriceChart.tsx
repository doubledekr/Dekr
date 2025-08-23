import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Circle } from 'react-native-svg';

interface PriceChartProps {
  data: number[];
  labels: string[];
  width?: number;
  height?: number;
  color?: string;
}

export function PriceChart({ 
  data, 
  labels, 
  width = Dimensions.get('window').width * 0.9,
  height = 200,
  color = '#536B31'
}: PriceChartProps) {
  // Validate input data
  if (!data?.length || !labels?.length || data.some(value => isNaN(value))) {
    return (
      <View style={[styles.container, { width, height }]}>
        <View style={styles.noDataContainer}>
          <Text style={[styles.noDataText, { color }]}>No chart data available</Text>
        </View>
      </View>
    );
  }

  // Calculate min and max for scaling
  const minValue = Math.min(...data.filter(val => !isNaN(val)));
  const maxValue = Math.max(...data.filter(val => !isNaN(val)));
  const range = maxValue - minValue || 1; // Prevent division by zero
  
  // Add padding to the value range
  const paddedMin = minValue - (range * 0.1);
  const paddedMax = maxValue + (range * 0.1);
  const paddedRange = paddedMax - paddedMin || 1; // Prevent division by zero

  // Layout constants
  const LABEL_WIDTH = 45;
  const CHART_PADDING_RIGHT = 10;
  const CHART_PADDING_TOP = 10;
  const CHART_PADDING_BOTTOM = 20;
  const chartWidth = width - LABEL_WIDTH - CHART_PADDING_RIGHT;
  const chartHeight = height - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

  // Create points for the line
  const points = data.map((value, index) => ({
    x: LABEL_WIDTH + (index / (data.length - 1)) * chartWidth,
    y: CHART_PADDING_TOP + chartHeight - ((value - paddedMin) / paddedRange) * chartHeight
  }));

  // Create the path string
  const pathD = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Create grid lines
  const horizontalLines = [0, 0.25, 0.5, 0.75, 1].map(percentage => {
    const y = CHART_PADDING_TOP + (chartHeight * percentage);
    const value = paddedMax - (paddedRange * percentage);
    return { y, value: `$${value.toFixed(2)}` };
  });

  // Create month labels
  const monthLabels = labels.map((label, index) => {
    // Only return items with actual label text
    if (label && label.trim() !== '') {
      return {
        x: LABEL_WIDTH + (index / (labels.length - 1)) * chartWidth,
        label: label
      };
    }
    return null;
  }).filter(item => item !== null);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {horizontalLines.map((line, index) => (
          <React.Fragment key={index}>
            <Line
              x1={LABEL_WIDTH}
              y1={line.y}
              x2={width - CHART_PADDING_RIGHT}
              y2={line.y}
              stroke={color}
              strokeWidth={0.5}
              strokeDasharray="3,3"
              opacity={0.3}
            />
            <SvgText
              x={2}
              y={line.y + 3}
              fill={color}
              fontSize={10}
              opacity={0.8}
              fontFamily="Graphik-Regular"
            >
              {line.value}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Month labels - only showing non-empty labels */}
        {monthLabels.map((labelObj, index) => (
          labelObj && (
            <SvgText
              key={index}
              x={labelObj.x}
              y={height - 5}
              fill={color}
              fontSize={10}
              opacity={0.8}
              fontFamily="Graphik-Regular"
              textAnchor="middle"
            >
              {labelObj.label}
            </SvgText>
          )
        ))}

        {/* Area under the line */}
        <Path
          d={`${pathD} L ${width - CHART_PADDING_RIGHT} ${height - CHART_PADDING_BOTTOM} L ${LABEL_WIDTH} ${height - CHART_PADDING_BOTTOM} Z`}
          fill={color}
          fillOpacity={0.1}
        />

        {/* Line */}
        <Path
          d={pathD}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
        />

        {/* Data points */}
        {points.map((point, index) => {
          // Only show dots at certain intervals to avoid overcrowding
          const showDot = index === 0 || index === points.length - 1 || 
                          index % Math.max(1, Math.floor(points.length / 10)) === 0;
          return showDot ? (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={2}
              fill={color}
              opacity={0.8}
            />
          ) : null;
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontFamily: 'Graphik-Regular',
    fontSize: 14,
    opacity: 0.7,
  },
}); 