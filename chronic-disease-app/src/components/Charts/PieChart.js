import React from 'react';
import { View, Dimensions, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path, Text as SvgText, Circle } from 'react-native-svg';

const PieChart = ({
  data = [],
  width,
  height = 200,
  showLabels = true,
  showLegend = true,
  title = '',
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
  onPress = null
}) => {
  const screenWidth = width || Dimensions.get('window').width - 40;
  const radius = Math.min(screenWidth, height) / 3;
  const centerX = screenWidth / 2;
  const centerY = height / 2;

  if (!data || data.length === 0) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>暂无数据</Text>
      </View>
    );
  }

  // 计算总值
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // 计算每个扇形的角度
  let currentAngle = -Math.PI / 2; // 从顶部开始
  const slices = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    // 计算路径
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    // 计算标签位置
    const labelAngle = startAngle + angle / 2;
    const labelRadius = radius * 0.7;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);

    currentAngle = endAngle;

    return {
      ...item,
      pathData,
      percentage,
      color: colors[index % colors.length],
      labelX,
      labelY
    };
  });

  return (
    <View>
      {title && (
        <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
          {title}
        </Text>
      )}
      
      <Svg width={screenWidth} height={height}>
        {/* 饼图扇形 */}
        {slices.map((slice, index) => (
          <Path
            key={`slice-${index}`}
            d={slice.pathData}
            fill={slice.color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
        
        {/* 标签 */}
        {showLabels && slices.map((slice, index) => (
          <SvgText
            key={`label-${index}`}
            x={slice.labelX}
            y={slice.labelY}
            fontSize="12"
            fill="#fff"
            textAnchor="middle"
            fontWeight="bold"
          >
            {(slice.percentage * 100).toFixed(0)}%
          </SvgText>
        ))}
      </Svg>
      
      {/* 图例 */}
      {showLegend && (
        <View style={{ marginTop: 15, paddingHorizontal: 20 }}>
          {slices.map((slice, index) => {
            const LegendItem = onPress ? TouchableOpacity : View;
            return (
              <LegendItem 
                key={`legend-${index}`} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  marginBottom: 8 
                }}
                onPress={onPress ? () => onPress(slice) : undefined}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 16,
                  height: 16,
                  backgroundColor: slice.color,
                  marginRight: 10,
                  borderRadius: 8
                }} />
                <Text style={{ flex: 1, fontSize: 14 }}>
                  {slice.label}: {slice.value}
                </Text>
                <Text style={{ fontSize: 14, color: '#666' }}>
                  {(slice.percentage * 100).toFixed(1)}%
                </Text>
              </LegendItem>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default PieChart; 