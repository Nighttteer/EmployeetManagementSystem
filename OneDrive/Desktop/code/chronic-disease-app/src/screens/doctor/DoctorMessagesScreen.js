/**
 * 医生消息页面组件
 * 
 * 功能特性：
 * - 医生消息功能开发中页面
 * - 显示开发状态提示
 * - 预留消息管理功能接口
 * - 简洁的用户界面设计
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * 医生消息页面主组件
 * 
 * 主要功能：
 * - 显示消息功能开发状态
 * - 为用户提供功能说明
 * - 预留未来消息管理功能
 * 
 * @param {Object} navigation - 导航对象，用于页面跳转
 * @returns {JSX.Element} 医生消息页面组件
 */
const DoctorMessagesScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          消息
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          医生消息功能开发中...
        </Text>
      </View>
    </SafeAreaView>
  );
};

/**
 * 样式定义
 * 包含医生消息页面的所有UI样式
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
});

/**
 * 导出医生消息页面组件
 * 作为默认导出，供其他模块使用
 */
export default DoctorMessagesScreen; 