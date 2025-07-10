# 手机号登录修改文档

## 📱 修改概述
将用户登录方式从邮箱改为手机号，用户现在可以使用手机号作为用户名登录系统。

## 🔧 修改内容

### 后端修改

#### 1. 修改登录序列化器 (`accounts/serializers.py`)
- **文件**: `chronic-disease-backend/accounts/serializers.py`
- **修改**: `UserLoginSerializer` 类
- **变更**:
  - 将 `email` 字段改为 `phone` 字段
  - 添加手机号格式验证
  - 修改用户查找逻辑，使用 `User.objects.get(phone=phone)` 而不是 `authenticate()`
  - 添加密码验证逻辑 `user.check_password(password)`

#### 2. 修改测试文件 (`test_api.py`)
- **文件**: `chronic-disease-backend/test_api.py`
- **修改**: `test_user_login()` 函数
- **变更**:
  - 将登录数据中的 `email` 改为 `phone`
  - 使用手机号 `+8613800138000` 进行测试

#### 3. 创建测试用户数据脚本
- **文件**: `chronic-disease-backend/create_test_users.py`
- **功能**: 创建测试用户数据
- **内容**:
  - 创建测试患者：手机号 `+8613800138000`
  - 创建测试医生：手机号 `+8613800138001`
  - 密码统一为 `testpass123`

### 前端修改

#### 1. 修改登录界面 (`LoginScreen.js`)
- **文件**: `chronic-disease-app/src/screens/auth/LoginScreen.js`
- **修改**: 登录表单
- **变更**:
  - 将 `username` 字段改为 `phone` 字段
  - 修改输入框标签为 "手机号"
  - 添加手机号输入键盘类型 `keyboardType="phone-pad"`
  - 添加占位符提示用户输入格式
  - 修改图标为手机图标
  - 更新验证提示信息

#### 2. 修改Redux状态管理 (`authSlice.js`)
- **文件**: `chronic-disease-app/src/store/slices/authSlice.js`
- **修改**: `loginUser` 异步action
- **变更**:
  - 将参数从 `{username, password}` 改为 `{phone, password, userType}`
  - 修改API调用传递手机号和角色参数
  - 更新token和用户数据处理逻辑

#### 3. 修改API服务 (`api.js`)
- **文件**: `chronic-disease-app/src/services/api.js`
- **修改**: `authAPI.login` 函数
- **变更**:
  - 参数从 `(username, password)` 改为 `(phone, password, role)`
  - 修改请求体数据结构

## 📋 测试用户信息

### 患者账户
- **手机号**: `+8613800138000`
- **密码**: `testpass123`
- **角色**: 患者 (patient)
- **姓名**: 测试患者

### 医生账户
- **手机号**: `+8613800138001`
- **密码**: `testpass123`
- **角色**: 医生 (doctor)
- **姓名**: 测试医生

## 🚀 使用方法

### 创建测试用户
```bash
cd chronic-disease-backend
python create_test_users.py
```

### 登录测试
1. 启动后端服务: `python manage.py runserver`
2. 启动前端应用: `npm start` (在 chronic-disease-app 目录)
3. 在登录界面输入手机号和密码

### API测试
```bash
cd chronic-disease-backend
python test_api.py
```

## 📝 注意事项

1. **手机号格式**: 必须包含国家区号，以 `+` 开头
2. **角色验证**: 登录时会验证用户角色是否匹配
3. **数据库**: 确保数据库中的用户有正确的手机号字段
4. **向后兼容**: 现有用户需要添加手机号字段才能登录

## 🔄 回滚方案

如果需要回滚到邮箱登录，需要：
1. 恢复 `UserLoginSerializer` 使用邮箱认证
2. 恢复前端登录界面使用邮箱字段
3. 恢复API调用参数
4. 恢复测试数据

## ✅ 验证清单

- [ ] 后端登录API支持手机号
- [ ] 前端登录界面显示手机号输入
- [ ] 手机号格式验证正常
- [ ] 角色验证正常
- [ ] 测试用户可以正常登录
- [ ] API测试通过
- [ ] 患者和医生角色都可以正常登录 