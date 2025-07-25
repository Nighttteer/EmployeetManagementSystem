# 慢性病管理系统 React Native App

一个专为慢性病患者和医生设计的跨平台移动应用，支持健康数据管理、用药提醒、医患沟通等功能。

## 功能特性

### 患者端功能
- **健康指标录入** - 血压、血糖、心率、体重等数据录入
- **健康趋势图表** - 历史数据可视化显示
- **用药提醒** - 智能用药提醒和确认
- **医生建议接收** - 实时接收医生的健康指导
- **医患沟通** - 与医生在线聊天咨询
- **个人档案** - 查看和管理个人健康档案

### 医生端功能
- **患者列表管理** - 查看负责的患者信息
- **异常告警处理** - 处理患者健康异常提醒
- **远程沟通** - 与患者实时聊天
- **用药计划制定** - 为患者制定和调整用药方案
- **建议发送** - 向患者发送健康管理建议

## 技术栈

- **前端框架**: React Native + Expo
- **导航**: React Navigation v6
- **状态管理**: Redux Toolkit
- **UI组件**: React Native Paper
- **网络请求**: Axios
- **推送通知**: Expo Notifications
- **图表库**: React Native Chart Kit
- **聊天UI**: React Native Gifted Chat
- **安全存储**: Expo Secure Store

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── CustomButton.js
│   ├── CustomCard.js
│   └── ...
├── screens/            # 页面组件
│   ├── auth/           # 认证相关页面
│   ├── patient/        # 患者端页面
│   └── doctor/         # 医生端页面
├── navigation/         # 导航配置
│   ├── AppNavigator.js
│   ├── PatientNavigator.js
│   └── DoctorNavigator.js
├── store/              # Redux状态管理
│   ├── store.js
│   └── slices/
├── services/           # API和服务
│   ├── api.js
│   └── notifications.js
└── utils/              # 工具函数
    └── helpers.js
```

## 安装和运行

### 环境要求
- Node.js 16+
- npm 或 yarn
- Expo CLI
- Android Studio (Android开发)
- Xcode (iOS开发，仅macOS)

### 安装依赖
```bash
cd chronic-disease-app
npm install
```

### 运行项目
```bash
# 启动开发服务器
npm start

# 在Android模拟器中运行
npm run android

# 在iOS模拟器中运行 (仅macOS)
npm run ios

# 在Web浏览器中运行
npm run web
```

## 配置说明

### 后端API配置
在 `src/services/api.js` 文件中修改后端API地址：
```javascript
const BASE_URL = 'https://your-django-backend.com/api';
```

### 推送通知配置
在 `src/services/notifications.js` 文件中配置Expo项目ID：
```javascript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id',
});
```

## 与Django后端对接

### API接口要求
后端需要提供以下RESTful API端点：

#### 认证相关
- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/validate-token/` - 验证Token
- `POST /api/auth/refresh/` - 刷新Token

#### 用户管理
- `GET /api/user/profile/` - 获取用户资料
- `PATCH /api/user/profile/` - 更新用户资料
- `POST /api/user/health-metrics/` - 提交健康指标
- `GET /api/user/health-trends/` - 获取健康趋势

#### 患者管理（医生端）
- `GET /api/doctor/patients/` - 获取患者列表
- `GET /api/doctor/patients/{id}/` - 获取患者详情
- `PUT /api/doctor/patients/{id}/medication-plan/` - 更新用药计划

#### 告警管理
- `GET /api/alerts/` - 获取告警列表
- `PATCH /api/alerts/{id}/` - 处理告警

#### 消息通信
- `GET /api/messages/conversations/` - 获取对话列表
- `POST /api/messages/conversations/{id}/messages/` - 发送消息

#### 推送通知
- `POST /api/notifications/register-token/` - 注册推送Token

### 认证机制
应用使用JWT Token进行认证：
1. 登录成功后获取Token
2. Token存储在Expo SecureStore中
3. 每次API请求自动在Header中添加Token
4. Token过期时自动清除并跳转到登录页

## 适老化设计特性

- **大字号字体** - 最小16sp，适合老年用户
- **高对比度** - 深色文字配浅色背景
- **大按钮尺寸** - 最小48dp高度，充足间距
- **简洁界面** - 减少复杂元素和干扰项
- **清晰导航** - 使用熟悉的图标和术语
- **容错设计** - 重要操作提供确认机制

## 开发调试

### 使用Expo开发工具
- 扫码在真机上运行
- 热重载快速预览
- 远程调试JS代码

### 状态管理调试
使用Redux DevTools查看状态变化：
```javascript
// 在store.js中已配置开发工具
```

### 网络调试
使用Flipper或代理工具查看API请求。

## 构建发布

### Android构建
```bash
# 使用EAS构建服务
npx eas build -p android --profile production
```

### iOS构建
```bash
# 使用EAS构建服务 (需要Apple Developer账号)
npx eas build -p ios --profile production
```

## 注意事项

1. **推送通知仅在真实设备上工作**
2. **需要配置正确的API地址和认证**
3. **iOS构建需要Apple Developer账号**
4. **遵循应用商店审核规范**

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。

---

# 快速开始指南

## 1. 克隆项目
```bash
git clone <repository-url>
cd chronic-disease-app
```

## 2. 安装依赖
```bash
npm install
```

## 3. 配置后端API
编辑 `src/services/api.js`，设置正确的后端地址。

## 4. 启动开发服务器
```bash
npm start
```

## 5. 在设备上测试
使用Expo Go应用扫描二维码，或在模拟器中运行。

现在您可以开始开发和测试应用了！ 