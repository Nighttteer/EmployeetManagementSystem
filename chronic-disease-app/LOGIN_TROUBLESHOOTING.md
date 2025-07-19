# 登录问题故障排除指南

## 🚨 问题描述
用户反映"为什么登不上"，无法正常登录系统。

## 🔍 可能的原因

### 1. **网络连接问题**
- 设备与后端服务器无法连通
- API地址配置错误
- 防火墙阻止连接

### 2. **后端服务问题**
- Django后端服务未运行
- 数据库连接失败
- 服务器端口被占用

### 3. **用户数据问题**
- 测试用户不存在
- 密码错误
- 用户账户被禁用

### 4. **前端配置问题**
- API接口地址错误
- 认证逻辑错误
- 表单验证问题

## 🛠 解决方案

### 📲 **方案1：使用调试工具（推荐）**

1. **点击登录页面右上角的🐛按钮**
   - 这会自动运行诊断流程
   - 查看控制台输出的调试信息

2. **使用快速测试按钮**
   - 点击"患者登录"或"医生登录"按钮
   - 自动填充测试账户信息
   - 然后点击"登录"按钮

### 🔧 **方案2：手动检查后端服务**

1. **启动Django后端服务**
   ```bash
   cd chronic-disease-backend
   python manage.py runserver
   ```

2. **验证服务运行**
   - 打开浏览器访问：`http://127.0.0.1:8000/admin/`
   - 应该看到Django管理界面

3. **检查API可用性**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"phone": "+8613800138000", "password": "123456", "role": "patient"}'
   ```

### 👥 **方案3：创建测试用户**

1. **快速创建基本用户**
   ```bash
   cd chronic-disease-backend
   python manual_create_users.py
   ```

2. **创建完整测试数据**
   ```bash
   cd chronic-disease-backend
   python create_test_users.py
   ```

3. **验证用户创建**
   ```bash
   cd chronic-disease-backend
   python manage.py shell
   ```
   ```python
   from accounts.models import User
   print(f"患者数量: {User.objects.filter(role='patient').count()}")
   print(f"医生数量: {User.objects.filter(role='doctor').count()}")
   ```

### 🌐 **方案4：检查网络配置**

1. **确认API地址**
   - 检查 `src/services/api.js` 中的 `BASE_URL`
   - 确保IP地址正确：`http://10.132.115.2:8000/api`

2. **测试网络连接**
   ```bash
   ping 10.132.115.2
   ```

3. **检查防火墙**
   - 确保8000端口开放
   - 检查Windows防火墙设置

## 📋 **详细调试步骤**

### 第1步：基础检查
```javascript
// 在浏览器控制台运行
import { fullLoginTest } from './src/utils/debugLogin';
fullLoginTest();
```

### 第2步：网络测试
```javascript
// 测试API连接
fetch('http://10.132.115.2:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+8613800138000',
    password: '123456',
    role: 'patient'
  })
})
.then(response => response.json())
.then(data => console.log('登录测试:', data))
.catch(error => console.error('连接失败:', error));
```

### 第3步：后端检查
```bash
# 检查Django进程
ps aux | grep python

# 检查端口占用
netstat -an | grep 8000

# 查看Django日志
cd chronic-disease-backend
tail -f logs/django.log
```

## 🔑 **测试账户信息**

### 患者账户
- 手机号：`+8613800138000`
- 密码：`123456`
- 角色：patient

### 医生账户
- 手机号：`+8613800138001`
- 密码：`123456`
- 角色：doctor

## ⚡ **快速修复流程**

### 🚀 **5分钟快速修复**

1. **启动后端服务**
   ```bash
   cd chronic-disease-backend
   python manage.py runserver
   ```

2. **创建测试用户**
   ```bash
   python manual_create_users.py
   ```

3. **重启前端应用**
   ```bash
   cd chronic-disease-app
   npm start
   ```

4. **使用快速测试登录**
   - 点击"患者登录"按钮
   - 点击"登录"按钮

### 📱 **移动端特殊问题**

1. **Expo Go问题**
   - 确保设备和开发机在同一网络
   - 检查IP地址配置

2. **iOS模拟器**
   - 使用 `localhost:8000` 作为API地址

3. **Android模拟器**
   - 使用 `10.0.2.2:8000` 作为API地址

## 🆘 **常见错误及解决方案**

### 错误1：Network Error
```
原因：无法连接到后端服务
解决：检查后端服务是否运行，IP地址是否正确
```

### 错误2：400 Bad Request
```
原因：用户名或密码错误
解决：检查测试用户是否存在，密码是否正确
```

### 错误3：500 Internal Server Error
```
原因：后端服务器错误
解决：查看Django日志，检查数据库连接
```

### 错误4：CORS Error
```
原因：跨域请求被阻止
解决：检查Django CORS设置
```

## 📞 **获取帮助**

如果上述方案都无法解决问题，请提供以下信息：

1. **错误信息**
   - 完整的错误消息
   - 控制台输出

2. **环境信息**
   - 操作系统版本
   - 设备类型（实体设备/模拟器）
   - 网络配置

3. **调试输出**
   - 点击🐛按钮后的控制台输出
   - 网络请求详情

4. **重现步骤**
   - 详细的操作步骤
   - 预期结果vs实际结果

## 🔄 **定期维护**

### 每周检查
- [ ] 后端服务状态
- [ ] 测试用户数据
- [ ] 网络连接配置

### 每月检查
- [ ] 清理过期Token
- [ ] 更新依赖包
- [ ] 检查日志文件

---

*这个故障排除指南会根据实际问题持续更新和完善* 