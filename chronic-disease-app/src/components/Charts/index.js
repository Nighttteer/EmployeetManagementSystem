import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import LineChart from './LineChart';
import BarChart from './BarChart';
import PieChart from './PieChart';

/**
 * 图表错误边界组件
 * 用于捕获图表渲染过程中的错误，防止单个图表错误导致整个应用崩溃
 * 当错误发生时，显示友好的错误提示界面
 */
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // 初始化错误状态：hasError表示是否有错误，error存储具体错误信息
    this.state = { hasError: false, error: null };
  }

  /**
   * 静态方法：当子组件抛出错误时调用
   * 返回新的状态对象，用于更新组件状态
   * @param {Error} error - 捕获到的错误对象
   * @returns {Object} 新的状态对象
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * 生命周期方法：当错误被捕获时调用
   * 用于记录错误信息到控制台，便于调试
   * @param {Error} error - 捕获到的错误对象
   * @param {Object} errorInfo - 错误相关的额外信息
   */
  componentDidCatch(error, errorInfo) {
    console.warn('Chart rendering error:', error, errorInfo);
  }

  /**
   * 渲染方法：根据错误状态决定显示内容
   * @returns {JSX.Element} 渲染的组件
   */
  render() {
    // 如果有错误，显示错误提示界面
    if (this.state.hasError) {
      return (
        <View style={{ 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
          minHeight: 200  // 确保错误提示有足够的显示空间
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

    // 如果没有错误，正常渲染子组件
    return this.props.children;
  }
}

/**
 * 高阶组件函数：为图表组件添加错误边界保护
 * 使用React.forwardRef确保ref能正确传递给被包装的组件
 * @param {React.Component} Component - 需要包装的组件
 * @returns {React.Component} 包装后的安全组件
 */
const withErrorBoundary = (Component) => {
  return React.forwardRef((props, ref) => (
    <ChartErrorBoundary>
      <Component {...props} ref={ref} />
    </ChartErrorBoundary>
  ));
};

// 导出包装后的安全图表组件，每个组件都有错误边界保护
export const SafeLineChart = withErrorBoundary(LineChart);    // 安全的折线图组件
export const SafeBarChart = withErrorBoundary(BarChart);      // 安全的柱状图组件
export const SafePieChart = withErrorBoundary(PieChart);      // 安全的饼图组件

// 向后兼容的导出：保持原有API的兼容性
// 这样其他组件仍然可以使用原来的导入方式
export { SafeLineChart as LineChart };
export { SafeBarChart as BarChart };
export { SafePieChart as PieChart };

// 默认导出：提供统一的组件集合
// 可以通过 import Charts from './components/Charts' 的方式导入
export default {
  LineChart: SafeLineChart,
  BarChart: SafeBarChart,
  PieChart: SafePieChart
}; 