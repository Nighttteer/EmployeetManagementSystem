/**
 * 登录诊断工具
 * 用于诊断登录过程中的各种问题
 */
import { API_BASE_URL } from '../services/api';

/**
 * 全面诊断登录问题
 */
export const diagnoseLoginIssues = async (phone, password, userType) => {
  console.log('🔧 开始登录问题诊断...');
  console.log('=' * 50);
  
  const diagnostics = {
    networkConnection: false,
    backendHealth: false,
    apiEndpoint: false,
    authCredentials: false,
    userExists: false,
    overall: false
  };
  
  // 1. 检查网络连接
  console.log('\n1️⃣ 检查网络连接...');
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      timeout: 5000 
    });
    if (response.ok) {
      console.log('✅ 网络连接正常');
      diagnostics.networkConnection = true;
    } else {
      console.log('⚠️ 网络连接异常');
    }
  } catch (error) {
    console.log('❌ 网络连接失败:', error.message);
  }
  
  // 2. 检查后端健康状态
  console.log('\n2️⃣ 检查后端服务状态...');
  console.log('🌐 后端地址:', API_BASE_URL);
  try {
    const healthUrl = `${API_BASE_URL}/health/`;
    console.log('📡 发送健康检查请求:', healthUrl);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      console.log('✅ 后端服务运行正常');
      diagnostics.backendHealth = true;
    } else {
      console.log(`⚠️ 后端服务异常: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ 后端服务连接失败:', error.message);
    console.log('💡 建议: 确认后端服务已启动 (python manage.py runserver)');
  }
  
  // 3. 检查登录API端点
  console.log('\n3️⃣ 检查登录API端点...');
  try {
    const loginUrl = `${API_BASE_URL}/auth/login/`;
    console.log('🔗 登录端点:', loginUrl);
    
    // 发送一个无效请求来测试端点是否存在
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      timeout: 10000
    });
    
    // 如果返回400而不是404，说明端点存在
    if (response.status === 400 || response.status === 422) {
      console.log('✅ 登录API端点存在');
      diagnostics.apiEndpoint = true;
    } else if (response.status === 404) {
      console.log('❌ 登录API端点不存在 (404)');
      console.log('💡 建议: 检查后端URL配置和路由设置');
    } else {
      console.log(`⚠️ 登录API端点响应异常: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ 登录API端点检查失败:', error.message);
  }
  
  // 4. 测试认证凭据
  console.log('\n4️⃣ 测试登录凭据...');
  console.log('📱 手机号:', phone);
  console.log('👤 用户类型:', userType);
  console.log('🔑 密码长度:', password ? password.length : 0);
  
  try {
    const loginUrl = `${API_BASE_URL}/auth/login/`;
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        password: password,
        user_type: userType
      }),
      timeout: 15000
    });
    
    const responseData = await response.json();
    console.log('📦 登录响应:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });
    
    if (response.ok) {
      console.log('✅ 登录凭据正确');
      diagnostics.authCredentials = true;
      diagnostics.userExists = true;
    } else {
      console.log('❌ 登录凭据验证失败');
      
      // 详细分析错误原因
      if (response.status === 400) {
        console.log('💡 可能原因: 请求参数格式错误');
        console.log('   - 检查手机号格式 (应包含+86前缀)');
        console.log('   - 检查用户类型 (patient/doctor)');
      } else if (response.status === 401) {
        console.log('💡 可能原因: 用户名或密码错误');
        console.log('   - 确认手机号是否正确');
        console.log('   - 确认密码是否正确');
        console.log('   - 确认用户类型是否匹配');
      } else if (response.status === 404) {
        console.log('💡 可能原因: 用户不存在');
        console.log('   - 确认用户已注册');
        console.log('   - 确认用户类型正确');
      }
    }
  } catch (error) {
    console.log('❌ 凭据测试失败:', error.message);
  }
  
  // 5. 生成诊断报告
  console.log('\n📋 诊断报告');
  console.log('=' * 30);
  console.log(`网络连接: ${diagnostics.networkConnection ? '✅' : '❌'}`);
  console.log(`后端服务: ${diagnostics.backendHealth ? '✅' : '❌'}`);
  console.log(`API端点: ${diagnostics.apiEndpoint ? '✅' : '❌'}`);
  console.log(`登录凭据: ${diagnostics.authCredentials ? '✅' : '❌'}`);
  
  // 总体评估
  const passedChecks = Object.values(diagnostics).filter(Boolean).length;
  const totalChecks = Object.keys(diagnostics).length - 1; // 排除overall
  diagnostics.overall = passedChecks >= totalChecks - 1; // 允许一个检查失败
  
  console.log(`\n🎯 总体状态: ${diagnostics.overall ? '✅ 系统正常' : '❌ 存在问题'}`);
  console.log(`通过检查: ${passedChecks}/${totalChecks}`);
  
  // 提供解决建议
  if (!diagnostics.overall) {
    console.log('\n🔧 建议的解决步骤:');
    if (!diagnostics.networkConnection) {
      console.log('1. 检查网络连接');
    }
    if (!diagnostics.backendHealth) {
      console.log('2. 启动后端服务: python manage.py runserver 0.0.0.0:8000');
    }
    if (!diagnostics.apiEndpoint) {
      console.log('3. 检查API配置和路由设置');
    }
    if (!diagnostics.authCredentials) {
      console.log('4. 确认用户凭据或创建测试用户');
      console.log('   python unified_test_data_manager.py setup');
    }
  }
  
  console.log('\n' + '=' * 50);
  return diagnostics;
};

/**
 * 快速登录诊断（简化版）
 */
export const quickLoginDiagnosis = async () => {
  console.log('⚡ 快速登录诊断...');
  
  const checks = [];
  
  // 检查后端连接
  try {
    const response = await fetch(`${API_BASE_URL}/health/`, { timeout: 5000 });
    checks.push({
      name: '后端连接',
      passed: response.ok,
      message: response.ok ? '正常' : `错误: ${response.status}`
    });
  } catch (error) {
    checks.push({
      name: '后端连接',
      passed: false,
      message: `连接失败: ${error.message}`
    });
  }
  
  // 检查登录端点
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      timeout: 5000
    });
    checks.push({
      name: '登录端点',
      passed: response.status !== 404,
      message: response.status === 404 ? 'API端点不存在' : '端点可用'
    });
  } catch (error) {
    checks.push({
      name: '登录端点',
      passed: false,
      message: `检查失败: ${error.message}`
    });
  }
  
  // 输出结果
  checks.forEach(check => {
    console.log(`${check.passed ? '✅' : '❌'} ${check.name}: ${check.message}`);
  });
  
  return checks;
};

/**
 * 获取系统状态摘要
 */
export const getSystemStatus = async () => {
  const status = {
    backend: false,
    database: false,
    auth: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    // 检查后端基本状态
    const healthResponse = await fetch(`${API_BASE_URL}/health/`);
    status.backend = healthResponse.ok;
    
    // 检查认证系统
    const authResponse = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    status.auth = authResponse.status !== 404;
    
    // 这里可以添加更多检查...
    
  } catch (error) {
    console.error('系统状态检查失败:', error);
  }
  
  return status;
};