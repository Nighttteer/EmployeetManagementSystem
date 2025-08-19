import React from 'react';
import { View, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

// 工具函数：验证数字是否有效
const isValidNumber = (num) => {
  return typeof num === 'number' && !isNaN(num) && isFinite(num);
};

// 工具函数：安全获取数字值
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
  // 新增：长数据时横向滚动与标签截断控制
  enableHorizontalScroll = true,
  barUnitWidth = 70,
  maxLabelLength = 8
}) => {
  const { t } = useTranslation();
  const screenWidth = width || Dimensions.get('window').width - 40;
  const padding = 70; // 增加padding为Y轴标签留出空间
  const bottomPadding = 48; // 为X轴标签留出更多空间

  // 数据验证和清理
  if (!data || data.length === 0) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('common.noData')}</Text>
      </View>
    );
  }

  // 过滤和验证数据
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

  // 计算数据范围
  const values = validData.map(item => item.value);
  const maxValue = Math.max(...values, 1); // 确保至少为1，避免除零
  const minValue = Math.min(...values, 0);
  
  // 验证最大值和最小值
  if (!isValidNumber(maxValue) || !isValidNumber(minValue)) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('common.invalidDataRange')}</Text>
      </View>
    );
  }

  // 根据数据量动态计算内容宽度（允许横向滚动）
  const desiredContentWidth = padding * 2 + Math.max(barUnitWidth, 50) * validData.length;
  const contentWidth = enableHorizontalScroll ? Math.max(screenWidth, desiredContentWidth) : screenWidth;
  const chartWidth = contentWidth - padding * 2;
  const chartHeight = height - padding - bottomPadding;

  // 固定每组宽度，保证可读性
  const barWidth = Math.min(32, Math.max(14, barUnitWidth * 0.6));
  const barSpacing = Math.max(8, barUnitWidth - barWidth);

  // 验证图表尺寸
  if (!isValidNumber(barWidth) || !isValidNumber(barSpacing) || barWidth <= 0) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>图表尺寸无效</Text>
      </View>
    );
  }

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

  const ChartSvg = (
    <Svg width={contentWidth} height={height}>
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
      {validData.map((item, index) => {
        const barHeight = Math.max((item.value / maxValue) * chartHeight, 2); // 确保至少有2px高度
        const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
        const y = padding + chartHeight - barHeight;
        
        // 验证坐标值
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
            
            {/* 数值标签 */}
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
            
            {/* X轴标签（截断以避免重叠） */}
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