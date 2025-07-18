import React from 'react';
import { View, Dimensions, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';

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
  onPress = null
}) => {
  const screenWidth = width || Dimensions.get('window').width - 40;
  const padding = 70; // 增加padding为Y轴标签留出空间
  const bottomPadding = 40; // 为X轴标签留出更多空间
  const chartWidth = screenWidth - padding * 2;
  const chartHeight = height - padding - bottomPadding;

  if (!data || data.length === 0) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>暂无数据</Text>
      </View>
    );
  }

  // 计算数据范围
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const barWidth = chartWidth / data.length * 0.6;
  const barSpacing = chartWidth / data.length * 0.4;

  // 网格线
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

  return (
    <View>
      {title && (
        <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          {title}
        </Text>
      )}
      
      <Svg width={screenWidth} height={height}>
        {/* 网格线 */}
        {gridLines}
        
        {/* Y轴标签 */}
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
        
        {/* 柱状图 */}
        {data.map((item, index) => {
          const barHeight = Math.max((item.value / maxValue) * chartHeight, 2); // 确保至少有2px高度
          const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = padding + chartHeight - barHeight;
          
          return (
            <React.Fragment key={`bar-${index}`}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={Array.isArray(color) ? color[index % color.length] : color}
                rx="4"
                stroke="#fff"
                strokeWidth="1"
              />
              
              {/* 数值标签 */}
              {showValues && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 8}
                  fontSize="11"
                  fill="#333"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {item.value}
                </SvgText>
              )}
              
              {/* X轴标签 */}
              <SvgText
                x={x + barWidth / 2}
                y={padding + chartHeight + 20}
                fontSize="11"
                fill="#666"
                textAnchor="middle"
                fontWeight="500"
              >
                {item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
      
      {/* 轴标签 */}
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
      
      {/* 可点击的数据列表 */}
      {onPress && (
        <View style={{ marginTop: 15, paddingHorizontal: 20 }}>
          {data.map((item, index) => (
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