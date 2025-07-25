import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import LineChart from './LineChart';
import BarChart from './BarChart';
import PieChart from './PieChart';

// 错误边界组件
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('Chart rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
          minHeight: 200
        }}>
          <Text style={{ textAlign: 'center', color: '#666' }}>
            图表渲染失败
          </Text>
          <Text style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 5 }}>
            请检查数据格式或刷新页面
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// 包装组件的高阶函数
const withErrorBoundary = (Component) => {
  return React.forwardRef((props, ref) => (
    <ChartErrorBoundary>
      <Component {...props} ref={ref} />
    </ChartErrorBoundary>
  ));
};

// 导出包装后的组件
export const SafeLineChart = withErrorBoundary(LineChart);
export const SafeBarChart = withErrorBoundary(BarChart);
export const SafePieChart = withErrorBoundary(PieChart);

// 向后兼容的导出
export { SafeLineChart as LineChart };
export { SafeBarChart as BarChart };
export { SafePieChart as PieChart };

export default {
  LineChart: SafeLineChart,
  BarChart: SafeBarChart,
  PieChart: SafePieChart
}; 