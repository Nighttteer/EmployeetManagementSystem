import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

/**
 * 调试认证状态
 */
export const debugAuthStatus = async () => {
  console.log('🔍 开始调试认证状态...');
  
  try {
    // 1. 检查本地存储的token
    const token = await SecureStore.getItemAsync('authToken');
    const role = await SecureStore.getItemAsync('userRole');
    
    console.log('📱 本地存储状态:');
    console.log('  - Token存在:', !!token);
    console.log('  - Token长度:', token?.length || 0);
    console.log('  - 用户角色:', role);
    
    if (token) {
      console.log('  - Token前20位:', token.substring(0, 20) + '...');
    }
    
    // 2. 验证token有效性
    if (token) {
      console.log('\n🔐 验证Token有效性...');
      try {
        const response = await authAPI.validateToken(token);
        console.log('✅ Token验证成功');
        console.log('  - 用户ID:', response.data?.user?.id);
        console.log('  - 用户名:', response.data?.user?.name);
        console.log('  - 用户角色:', response.data?.user?.role);
      } catch (error) {
        console.log('❌ Token验证失败:', error.response?.status, error.response?.data);
        
        if (error.response?.status === 401) {
          console.log('🔄 Token已过期，需要重新登录');
          // 清除过期token
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('userRole');
        }
      }
    } else {
      console.log('❌ 未找到认证Token，用户未登录');
    }
    
  } catch (error) {
    console.error('🚨 调试认证状态时发生错误:', error);
  }
  
  console.log('🔍 认证状态调试完成\n');
};

/**
 * 检查API请求的认证头
 */
export const debugApiHeaders = async () => {
  console.log('🔍 检查API请求头...');
  
  try {
    const token = await SecureStore.getItemAsync('authToken');
    
    if (token) {
      console.log('✅ 认证头应该包含: Authorization: Bearer ' + token.substring(0, 20) + '...');
    } else {
      console.log('❌ 没有Token，API请求将没有认证头');
    }
  } catch (error) {
    console.error('🚨 检查API请求头时发生错误:', error);
  }
};

/**
 * 快速登录测试
 */
export const quickLoginTest = async (phone = '+8613800138000', password = '123456') => {
  console.log('🔍 快速登录测试...');
  console.log('  - 手机号:', phone);
  console.log('  - 密码:', password);
  
  try {
    const response = await authAPI.login(phone, password, 'patient');
    console.log('✅ 登录成功!');
    console.log('  - 用户名:', response.data.user.name);
    console.log('  - 角色:', response.data.user.role);
    console.log('  - Token:', response.data.tokens.access.substring(0, 20) + '...');
    
    // 保存token
    await SecureStore.setItemAsync('authToken', response.data.tokens.access);
    await SecureStore.setItemAsync('userRole', response.data.user.role);
    
    return response.data;
  } catch (error) {
    console.log('❌ 登录失败:', error.response?.status, error.response?.data);
    return null;
  }
};

/**
 * 清除所有认证信息
 */
export const clearAuthData = async () => {
  console.log('🔄 清除认证数据...');
  
  try {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userRole');
    console.log('✅ 认证数据已清除');
  } catch (error) {
    console.error('❌ 清除认证数据失败:', error);
  }
}; 