# 401认证错误故障排除指南

## 问题描述
搜索用户时出现 "AxiosError: Request failed with status code 401" 错误。

## 原因分析
HTTP 401状态码表示"未授权"，通常有以下几种原因：

1. **用户未登录**
2. **JWT Token过期**
3. **Token格式错误**
4. **后端认证配置问题**
5. **API请求头缺少认证信息**

## 解决方案

### 🔍 第一步：检查认证状态

1. **使用调试工具**
   - 在用户搜索页面，点击右上角的🐛按钮
   - 查看控制台输出的认证状态信息

2. **手动检查**
   ```javascript
   // 在控制台运行以下代码
   import { debugAuthStatus } from './src/utils/debugAuth';
   debugAuthStatus();
   ```

### 🔄 第二步：重新登录

1. **退出当前账户**
   - 返回登录页面
   - 点击"退出登录"

2. **重新登录**
   - 使用测试账户：
     - 患者：`+8613800138000` / `123456`
     - 医生：`+8613800138001` / `123456`

### 🛠 第三步：检查后端服务

1. **确认后端运行**
   ```bash
   cd chronic-disease-backend
   python manage.py runserver
   ```

2. **检查API连接**
   - 确认API地址正确：`http://10.132.115.2:8000/api`
   - 确认设备与后端服务器在同一网络

### 🔧 第四步：创建测试用户

如果没有测试用户数据：

1. **简单创建**
   ```bash
   cd chronic-disease-backend
   python manual_create_users.py
   ```

2. **完整创建**
   ```bash
   cd chronic-disease-backend
   python create_test_users.py
   ```

## 调试步骤

### 1. 检查本地存储
```javascript
import * as SecureStore from 'expo-secure-store';

const checkAuth = async () => {
  const token = await SecureStore.getItemAsync('authToken');
  const role = await SecureStore.getItemAsync('userRole');
  console.log('Token:', token ? 'exists' : 'not found');
  console.log('Role:', role);
};
```

### 2. 验证Token有效性
```javascript
import { authAPI } from './src/services/api';

const validateToken = async () => {
  try {
    const response = await authAPI.validateToken();
    console.log('Token valid:', response.data);
  } catch (error) {
    console.log('Token invalid:', error.response?.status);
  }
};
```

### 3. 测试API连接
```javascript
const testConnection = async () => {
  try {
    const response = await fetch('http://10.132.115.2:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '+8613800138000',
        password: '123456',
        role: 'patient'
      })
    });
    
    const data = await response.json();
    console.log('Connection test:', data);
  } catch (error) {
    console.log('Connection failed:', error);
  }
};
```

## 常见解决方案

### 方案1：清除认证数据重新登录
```javascript
import { clearAuthData } from './src/utils/debugAuth';

// 清除所有认证信息
clearAuthData();
// 然后重新登录
```

### 方案2：快速登录测试
```javascript
import { quickLoginTest } from './src/utils/debugAuth';

// 快速登录测试
quickLoginTest('+8613800138000', '123456');
```

### 方案3：检查API配置
确认 `src/services/api.js` 中的BASE_URL设置正确：
```javascript
const BASE_URL = 'http://10.132.115.2:8000/api';
```

## 预防措施

1. **定期更新Token**
   - 实现自动刷新Token机制
   - 在Token过期前主动更新

2. **错误处理**
   - 捕获401错误并自动跳转到登录页
   - 提供友好的错误提示

3. **用户体验**
   - 添加加载状态提示
   - 提供重试机制

## 如果问题仍然存在

1. **检查网络连接**
   - 确认设备与后端服务器连通
   - 检查防火墙设置

2. **查看后端日志**
   ```bash
   cd chronic-disease-backend
   tail -f logs/django.log
   ```

3. **重启服务**
   ```bash
   # 重启后端服务
   python manage.py runserver
   
   # 重启前端应用
   npm start
   ```

4. **联系开发者**
   - 提供详细的错误信息
   - 包含控制台输出
   - 说明重现步骤

---

*这个故障排除指南会根据实际情况持续更新* 