/**
 * 患者个人资料页面组件
 * 
 * 功能特性：
 * - 复用通用设置页面组件
 * - 提供患者个人资料管理
 * - 统一的用户界面体验
 * - 支持患者特定功能配置
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

import React from 'react';
import SettingsScreen from '../common/SettingsScreen';

/**
 * 患者个人资料页面主组件
 * 
 * 主要功能：
 * - 复用通用设置页面功能
 * - 提供患者个人资料管理
 * - 支持患者特定设置选项
 * - 保持界面一致性
 * 
 * @param {Object} navigation - 导航对象，用于页面跳转
 * @returns {JSX.Element} 患者个人资料页面组件
 */
const ProfileScreen = ({ navigation }) => {
  return <SettingsScreen navigation={navigation} />;
};

/**
 * 导出患者个人资料页面组件
 * 作为默认导出，供其他模块使用
 */
export default ProfileScreen; 