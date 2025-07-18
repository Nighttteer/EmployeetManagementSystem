import React from 'react';
import { View, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';

const LineChart = ({
  data = [],
  width,
  height = 200,
  color = '#2196F3',
  showPoints = true,
  showGrid = true,
  yAxisLabel = '',
  xAxisLabel = '',
  title = '',
  series = null // 新增：支持多条线数据
}) => {
  const screenWidth = width || Dimensions.get('window').width - 40;
  const padding = 60; // 增加padding为Y轴标签留出空间
  const chartWidth = screenWidth - padding * 2;
  const chartHeight = height - padding * 2;

  // 处理多条线数据
  const isMultiSeries = series && series.length > 0;
  const chartData = isMultiSeries ? series : [{ data, color, name: '' }];
  
  if (!chartData || chartData.length === 0 || 
      (chartData.length === 1 && (!chartData[0].data || chartData[0].data.length === 0))) {
    return (
      <View style={{ width: screenWidth, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text>暂无数据</Text>
      </View>
    );
  }

  // 计算数据范围
  const allValues = chartData.flatMap(serie => serie.data.map(item => item.value));
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const yRange = maxY - minY || 1; // 防止除零
  
  // 计算每条线的点坐标
  const seriesData = chartData.map((serie, seriesIndex) => {
    const points = serie.data.map((item, index) => {
      const x = padding + (index / (serie.data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((item.value - minY) / yRange) * chartHeight;
      return { x, y, ...item };
    });
    
    // 生成路径
    const pathData = points.reduce((path, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }
      return `${path} L ${point.x} ${point.y}`;
    }, '');
    
    return {
      ...serie,
      points,
      pathData,
      color: serie.color || (Array.isArray(color) ? color[seriesIndex] : color)
    };
  });

  // 使用第一条线的数据作为X轴标签
  const xLabels = chartData[0].data;

  // 网格线
  const gridLines = [];
  if (showGrid) {
    for (let i = 0; i <= 4; i++) {
      const y = padding + (i / 4) * chartHeight;
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
        {[...Array(5)].map((_, i) => {
          const value = maxY - (i / 4) * yRange;
          const y = padding + (i / 4) * chartHeight;
          return (
            <SvgText
              key={`y-label-${i}`}
              x={padding - 30}
              y={y + 5}
              fontSize="10"
              fill="#666"
              textAnchor="end"
            >
              {value.toFixed(1)}
            </SvgText>
          );
        })}
        
        {/* X轴标签 */}
        {xLabels.map((item, index) => {
          if (index % Math.ceil(xLabels.length / 5) === 0) {
            const x = padding + (index / (xLabels.length - 1)) * chartWidth;
            return (
              <SvgText
                key={`x-label-${index}`}
                x={x}
                y={height - 10}
                fontSize="10"
                fill="#666"
                textAnchor="middle"
              >
                {item.label || `${index + 1}`}
              </SvgText>
            );
          }
          return null;
        })}
        
        {/* 多条折线 */}
        {seriesData.map((serie, seriesIndex) => (
          <React.Fragment key={`series-${seriesIndex}`}>
            {/* 折线 */}
            <Path
              d={serie.pathData}
              stroke={serie.color}
              strokeWidth="2"
              fill="none"
            />
            
            {/* 数据点 */}
            {showPoints && serie.points.map((point, index) => (
              <Circle
                key={`point-${seriesIndex}-${index}`}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={serie.color}
                stroke="#fff"
                strokeWidth="2"
              />
            ))}
          </React.Fragment>
        ))}
      </Svg>
      
      {/* 轴标签 */}
      {yAxisLabel && (
        <Text style={{ 
          position: 'absolute', 
          left: 5, 
          top: height / 2 - 20, 
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
      
      {/* 图例 */}
      {isMultiSeries && (
        <View style={{ marginTop: 10, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' }}>
            {seriesData.map((serie, index) => (
              <View key={`legend-${index}`} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                marginRight: 20,
                marginBottom: 5
              }}>
                <View style={{
                  width: 16,
                  height: 3,
                  backgroundColor: serie.color,
                  marginRight: 8,
                  borderRadius: 2
                }} />
                <Text style={{ fontSize: 12, color: '#666' }}>
                  {serie.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

export default LineChart; 