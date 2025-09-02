/**
 * 自定义卡片组件
 * 
 * 功能特性：
 * - 支持标题、副标题、内容和图标的灵活展示
 * - 可选择是否支持点击交互
 * - 支持自定义样式和主题
 * - 自动适应内容变化
 * - 统一的视觉风格和交互体验
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';

/**
 * 自定义卡片组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.title - 卡片标题
 * @param {string} props.subtitle - 卡片副标题
 * @param {string|React.ReactNode} props.content - 卡片内容，支持字符串或React组件
 * @param {React.ReactNode} props.icon - 图标元素
 * @param {Function} props.onPress - 点击事件处理函数，传入后卡片变为可点击
 * @param {Object} props.style - 自定义卡片样式
 * @param {Object} props.titleStyle - 自定义标题样式
 * @param {Object} props.subtitleStyle - 自定义副标题样式
 * @param {Object} props.contentStyle - 自定义内容样式
 * @param {number} props.elevation - 阴影深度，默认值为2
 * @returns {JSX.Element} 自定义卡片组件
 */
const CustomCard = ({ 
  title, 
  subtitle, 
  content, 
  icon, 
  onPress, 
  style,
  titleStyle,
  subtitleStyle,
  contentStyle,
  elevation = 2
}) => {
  // 根据是否有点击事件决定使用TouchableOpacity还是View
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, { elevation }, style]}>
        <Card.Content style={styles.content}>
          {/* 卡片头部：图标和文字信息 */}
          <View style={styles.header}>
            {/* 图标容器 */}
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            {/* 文字信息容器 */}
            <View style={styles.textContainer}>
              {/* 标题 */}
              {title && (
                <Text variant="titleMedium" style={[styles.title, titleStyle]}>
                  {title}
                </Text>
              )}
              {/* 副标题 */}
              {subtitle && (
                <Text variant="bodyMedium" style={[styles.subtitle, subtitleStyle]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          
          {/* 卡片内容区域 */}
          {content && (
            <View style={styles.contentContainer}>
              {/* 根据内容类型渲染：字符串或React组件 */}
              {typeof content === 'string' ? (
                <Text variant="bodyLarge" style={[styles.contentText, contentStyle]}>
                  {content}
                </Text>
              ) : (
                content
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </CardComponent>
  );
};

// 组件样式定义
const styles = StyleSheet.create({
  // 卡片基础样式
  card: {
    margin: 8,                    // 外边距
    borderRadius: 12,             // 圆角半径
    backgroundColor: '#ffffff',   // 背景色
  },
  
  // 卡片内容区域样式
  content: {
    padding: 16,                  // 内边距
  },
  
  // 头部区域样式（图标+文字）
  header: {
    flexDirection: 'row',         // 水平排列
    alignItems: 'center',         // 垂直居中对齐
  },
  
  // 图标容器样式
  iconContainer: {
    marginRight: 12,              // 右侧外边距
    alignItems: 'center',         // 水平居中
    justifyContent: 'center',     // 垂直居中
    width: 40,                    // 固定宽度
    height: 40,                   // 固定高度
  },
  
  // 文字信息容器样式
  textContainer: {
    flex: 1,                      // 占据剩余空间
  },
  
  // 标题文字样式
  title: {
    fontSize: 18,                 // 字体大小
    fontWeight: '600',            // 字体粗细
    color: '#333333',             // 文字颜色
    marginBottom: 4,              // 底部外边距
  },
  
  // 副标题文字样式
  subtitle: {
    fontSize: 16,                 // 字体大小
    color: '#666666',             // 文字颜色
  },
  
  // 内容区域容器样式
  contentContainer: {
    marginTop: 12,                // 顶部外边距
  },
  
  // 内容文字样式（当content为字符串时使用）
  contentText: {
    fontSize: 16,                 // 字体大小
    color: '#333333',             // 文字颜色
    lineHeight: 24,               // 行高
  },
});

export default CustomCard; 