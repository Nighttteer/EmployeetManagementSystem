import React from 'react';
import { View, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

// Utility function: Validate if number is valid
// Chart rendering error: When invalid data is passed, the chart may not display properly or crash
const isValidNumber = (num) => {
  return typeof num === 'number' && !isNaN(num) && isFinite(num);
};

// Utility function: Safely get numeric value
const safeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return isValidNumber(num) ? num : defaultValue;
};

const BarChart = ({
  data = [],
  width,
  height = 200,
  color = '#2196F3',
  showGrid = true,
  showValues = true,
  title = '',
  yAxisLabel = '',
  xAxisLabel = '',
  onPress = null,
  // New: Horizontal scroll and label truncation control for long data
  enableHorizontalScroll = true,
  barUnitWidth = 70,
  maxLabelLength = 8
}) => {
  const { t } = useTranslation();//// Get translation functions, subscribe to language changes 准备好
  const screenWidth = width || Dimensions.get('window').width - 40;
  const padding = 70; // Increase padding to make room for Y-axis labels
  const bottomPadding = 48; // Make more room for X-axis labels

  // Data validation and cleanup
  if (!data || data.length === 0) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('common.noData')}</Text>
      </View>
    );
  }

  // Filter and validate data
  const validData = data
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      ...item,
      value: safeNumber(item.value, 0),
      label: item.label || 'Unknown'
    }));

  if (validData.length === 0) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('common.noValidData')}</Text>
      </View>
    );
  }

  // Calculate data range
  const values = validData.map(item => item.value);
  const maxValue = Math.max(...values, 1); // Ensure at least 1 to avoid division by zero
  const minValue = Math.min(...values, 0);
  
  // Validate maximum and minimum values
  if (!isValidNumber(maxValue) || !isValidNumber(minValue)) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('common.invalidDataRange')}</Text>
      </View>
    );
  }

  // Dynamically calculate content width based on data amount (allow horizontal scrolling)
  const desiredContentWidth = padding * 2 + Math.max(barUnitWidth, 50) * validData.length;
  const contentWidth = enableHorizontalScroll ? Math.max(screenWidth, desiredContentWidth) : screenWidth;
  const chartWidth = contentWidth - padding * 2;
  const chartHeight = height - padding - bottomPadding;

  // Fixed width for each group to ensure readability
  const barWidth = Math.min(32, Math.max(14, barUnitWidth * 0.6));
  const barSpacing = Math.max(8, barUnitWidth - barWidth);

  // Validate chart dimensions
  if (!isValidNumber(barWidth) || !isValidNumber(barSpacing) || barWidth <= 0) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid chart dimensions</Text>
      </View>
    );
  }

  // Grid lines
  const gridLines = [];
  const gridSteps = 5;
  if (showGrid) {
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding + (i / gridSteps) * chartHeight;
      gridLines.push(
        <Line
          key={`grid-${i}`}
          x1={padding}
          y1={y}
          x2={padding + chartWidth}
          y2={y}
          stroke="#E0E0E0"
          strokeWidth="1"
        />
      );
    }
  }

  const ChartSvg = (
    <Svg width={contentWidth} height={height}>
      {/* Grid lines */}
      {gridLines}
      
      {/* Y-axis labels */}
      {[...Array(gridSteps + 1)].map((_, i) => {
        const value = maxValue - (i / gridSteps) * maxValue;
        const y = padding + (i / gridSteps) * chartHeight;
        return (
          <SvgText
            key={`y-label-${i}`}
            x={padding - 10}
            y={y + 5}
            fontSize="10"
            fill="#666"
            textAnchor="end"
          >
            {value.toFixed(0)}
          </SvgText>
        );
      })}
      
      {/* Bar chart */}
      {validData.map((item, index) => {
        const barHeight = Math.max((item.value / maxValue) * chartHeight, 2); // Ensure at least 2px height
        const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
        const y = padding + chartHeight - barHeight;
        
        // Validate coordinate values
        if (!isValidNumber(x) || !isValidNumber(y) || !isValidNumber(barHeight)) {
          console.warn('Invalid coordinates for bar chart:', { x, y, barHeight, item });
          return null;
        }
        const displayLabel = (item.label || 'Unknown');
        const shortLabel = displayLabel.length > maxLabelLength ? `${displayLabel.slice(0, maxLabelLength)}…` : displayLabel;
        
        return (
          <React.Fragment key={`bar-${index}`}>
            <Rect
              x={x.toFixed(2)}
              y={y.toFixed(2)}
              width={barWidth.toFixed(2)}
              height={barHeight.toFixed(2)}
              fill={Array.isArray(color) ? color[index % color.length] : color}
              rx="4"
              stroke="#fff"
              strokeWidth="1"
            />
            
            {/* Value labels */}
            {showValues && (
              <SvgText
                x={(x + barWidth / 2).toFixed(2)}
                y={(y - 8).toFixed(2)}
                fontSize="11"
                fill="#333"
                textAnchor="middle"
                fontWeight="bold"
              >
                {isValidNumber(item.value) ? item.value.toString() : '0'}
              </SvgText>
            )}
            
            {/* X-axis labels (truncated to avoid overlap) */}
            <SvgText
              x={(x + barWidth / 2).toFixed(2)}
              y={(padding + chartHeight + 20).toFixed(2)}
              fontSize="11"
              fill="#666"
              textAnchor="middle"
              fontWeight="500"
            >
              {shortLabel}
            </SvgText>
          </React.Fragment>
        );
      }).filter(bar => bar !== null)}
    </Svg>
  );

  return (
    <View>
      {title && (
        <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          {title}
        </Text>
      )}

      {enableHorizontalScroll && contentWidth > screenWidth ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ width: contentWidth }}
        >
          {ChartSvg}
        </ScrollView>
      ) : (
        ChartSvg
      )}
      
      {/* Axis labels */}
      {yAxisLabel && (
        <Text style={{ 
          position: 'absolute', 
          left: 5, 
          top: height / 2 - 25, 
          transform: [{ rotate: '-90deg' }],
          fontSize: 11,
          color: '#666',
          textAlign: 'center'
        }}>
          {yAxisLabel}
        </Text>
      )}
      
      {xAxisLabel && (
        <Text style={{ 
          textAlign: 'center', 
          marginTop: 5,
          fontSize: 12,
          color: '#666'
        }}>
          {xAxisLabel}
        </Text>
      )}
      
      {/* Clickable data list */}
      {onPress && (
        <View style={{ marginTop: 15, paddingHorizontal: 20 }}>
          {validData.map((item, index) => (
            <TouchableOpacity
              key={`data-${index}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                marginBottom: 4,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
              }}
              onPress={() => onPress(item)}
              activeOpacity={0.7}
            >
              <View style={{
                width: 16,
                height: 16,
                backgroundColor: Array.isArray(color) ? color[index % color.length] : color,
                marginRight: 12,
                borderRadius: 2,
              }} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '500' }}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>
                {item.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default BarChart; 