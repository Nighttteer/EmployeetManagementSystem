import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';
import { API_BASE_URL } from '../services/api';

/**
 * 调试登录功能
 */
export const debugLogin = async (phone = '+8613800138000', password = '123456', userType = 'patient') => {
  console.log('🔍 开始调试登录功能...');
  console.log('参数:', { phone, password: '***', userType });

  try {
    // 1. 检查网络连接
    console.log('\n1. 检查网络连接:');
    console.log('API地址:', API_BASE_URL);
    
    try {
      const response = await fetch(API_BASE_URL + '/health/');
      console.log('✅ 网络连接正常');
    } catch (error) {
      console.log('❌ 网络连接失败:', error.message);
      return;
    }

    // 2. 测试登录API
    console.log('\n2. 测试登录API:');
    try {
      const response = await authAPI.login(phone, password, userType);
      console.log('✅ 登录成功!');
      console.log('用户信息:', response.data.user);
      console.log('Token:', response.data.tokens.access.substring(0, 20) + '...');
      
      // 保存Token用于后续测试
      await SecureStore.setItemAsync('authToken', response.data.tokens.access);
      await SecureStore.setItemAsync('userRole', response.data.user.role);
      
      return response.data;
    } catch (error) {
      console.log('❌ 登录失败');
      console.log('状态码:', error.response?.status);
      console.log('错误信息:', error.response?.data);
      
      if (error.response?.status === 400) {
        console.log('💡 可能原因: 用户名或密码错误');
      } else if (error.response?.status === 500) {
        console.log('💡 可能原因: 后端服务器错误');
      } else {
        console.log('💡 可能原因: 网络连接问题');
      }
    }

  } catch (error) {
    console.error('🚨 调试过程中发生错误:', error);
  }
};

/**
 * 测试所有预设账户
 */
export const testAllAccounts = async () => {
  console.log('🔍 测试所有预设账户...');
  
  const accounts = [
    { phone: '+8613800138000', password: '123456', userType: 'patient', name: '患者账户' },
    { phone: '+8613800138001', password: '123456', userType: 'doctor', name: '医生账户' },
    { phone: '+8613800138002', password: '123456', userType: 'patient', name: '患者账户2' },
  ];

  for (const account of accounts) {
    console.log(`\n测试 ${account.name} (${account.phone}):`)
    try {
      const response = await authAPI.login(account.phone, account.password, account.userType);
      console.log('✅ 登录成功:', response.data.user.name);
    } catch (error) {
      console.log('❌ 登录失败:', error.response?.data?.message || error.message);
    }
  }
};

/**
 * 检查后端服务状态
 */
export const checkBackendStatus = async () => {
  console.log('🔍 检查后端服务状态...');
  
  const endpoints = [
    '/health/',
    '/auth/login/',
    '/communication/users/search/',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(API_BASE_URL + endpoint, {
        method: endpoint === '/auth/login/' ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: endpoint === '/auth/login/' ? JSON.stringify({
          phone: '+8613800138000',
          password: 'wrong_password',
          userType: 'patient'
        }) : undefined,
      });
      
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${endpoint}: ❌ 连接失败 - ${error.message}`);
    }
  }
};

/**
 * 清除所有认证数据
 */
export const clearAllAuthData = async () => {
  console.log('🔄 清除所有认证数据...');
  
  try {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('userRole');
    console.log('✅ 认证数据已清除');
  } catch (error) {
    console.error('❌ 清除认证数据失败:', error);
  }
};

/**
 * 完整登录测试流程
 */
export const fullLoginTest = async () => {
  console.log('🔍 开始完整登录测试流程...');
  
  // 1. 清除旧数据
  await clearAllAuthData();
  
  // 2. 检查后端状态
  await checkBackendStatus();
  
  // 3. 测试登录
  await debugLogin();
  
  // 4. 测试所有账户
  await testAllAccounts();
  
  console.log('✅ 完整登录测试完成');
};

/**
 * 快速修复登录问题
 */
export const quickFixLogin = async () => {
  console.log('🔧 快速修复登录问题...');
  
  try {
    // 1. 清除旧数据
    await clearAllAuthData();
    
    // 2. 尝试登录
    const result = await debugLogin();
    
    if (result) {
      console.log('✅ 登录问题已修复');
      return true;
    } else {
      console.log('❌ 登录问题未解决，请检查：');
      console.log('  1. 后端服务是否运行 (python manage.py runserver)');
      console.log('  2. 网络连接是否正常');
      console.log('  3. 测试用户是否存在 (python manual_create_users.py)');
      return false;
    }
  } catch (error) {
    console.error('🚨 快速修复过程中发生错误:', error);
    return false;
  }
}; 