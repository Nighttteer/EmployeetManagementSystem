# 医患聊天功能文档

## 功能概述

本文档详细描述了慢性病管理系统中的医患聊天功能实现，包括后端API、前端界面、数据模型和使用指南。

## 功能特点

### 核心功能
- **实时聊天**: 医生与患者可以进行实时文本聊天
- **会话管理**: 自动创建和管理医患会话
- **用户搜索**: 患者可以搜索医生，医生可以搜索患者
- **消息状态**: 支持已读/未读状态管理
- **分页加载**: 消息列表支持分页加载，提高性能
- **角色权限**: 基于用户角色的聊天权限控制

### 界面特性
- **现代化UI**: 采用现代聊天界面设计
- **自适应布局**: 支持不同屏幕尺寸
- **消息气泡**: 区分发送者和接收者的消息样式
- **时间显示**: 智能时间格式化显示
- **状态反馈**: 加载状态、发送状态等用户反馈

## 技术架构

### 后端架构
- **Django REST Framework**: 提供RESTful API
- **JWT认证**: 基于Token的用户认证
- **PostgreSQL/SQLite**: 数据存储
- **分页支持**: 高效的消息分页查询

### 前端架构
- **React Native**: 跨平台移动应用
- **Redux**: 状态管理
- **React Navigation**: 导航管理
- **Axios**: HTTP请求库

## 数据模型

### 消息模型 (Message)
```python
class Message(models.Model):
    sender = models.ForeignKey(User, related_name='sent_messages')
    recipient = models.ForeignKey(User, related_name='received_messages')
    content = models.TextField()
    message_type = models.CharField(max_length=20, default='text')
    is_read = models.BooleanField(default=False)
    sent_at = models.DateTimeField(auto_now_add=True)
    priority = models.CharField(max_length=10, default='normal')
```

### 会话模型 (Conversation)
```python
class Conversation(models.Model):
    participants = models.ManyToManyField(User, related_name='conversations')
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField()
```

## API接口

### 1. 消息相关API

#### 获取消息列表
```
GET /api/communication/messages/
参数:
- conversation_id: 会话ID
- page: 页码 (默认: 1)
- page_size: 每页大小 (默认: 20)
```

#### 发送消息
```
POST /api/communication/messages/
请求体:
{
    "recipient": 接收者ID,
    "content": "消息内容",
    "message_type": "text"
}
```

#### 标记消息为已读
```
POST /api/communication/messages/{message_id}/mark-read/
```

### 2. 会话相关API

#### 获取会话列表
```
GET /api/communication/conversations/
```

#### 获取与特定用户的会话
```
GET /api/communication/conversations/with-user/{user_id}/
```

#### 开始新会话
```
POST /api/communication/conversations/start-with-user/{user_id}/
```

#### 标记会话为已读
```
POST /api/communication/conversations/{conversation_id}/mark-read/
```

### 3. 用户搜索API

#### 搜索用户
```
GET /api/communication/users/search/
参数:
- search: 搜索关键词 (姓名或手机号)
```

### 4. 统计API

#### 获取聊天统计
```
GET /api/communication/stats/
响应:
{
    "total_conversations": 总会话数,
    "unread_count": 未读消息数,
    "recent_messages": 最近7天消息数,
    "active_conversations": 活跃会话数
}
```

## 前端组件

### 1. 会话列表屏幕 (ConversationListScreen)
- 显示用户的所有会话
- 支持下拉刷新
- 显示未读消息数量
- 点击会话进入聊天界面

### 2. 聊天界面 (ChatScreen)
- 显示消息列表
- 支持发送文本消息
- 消息分页加载
- 自动标记消息为已读

### 3. 用户搜索屏幕 (UserSearchScreen)
- 搜索可聊天的用户
- 角色权限控制
- 创建新会话

## 权限控制

### 角色权限
- **患者**: 只能与医生聊天
- **医生**: 可以与患者聊天
- **管理员**: 可以查看所有会话

### 数据访问控制
- 用户只能访问自己参与的会话
- 只能发送和接收自己有权限的消息
- 搜索结果基于用户角色过滤

## 安装和配置

### 后端配置

1. **安装依赖**
```bash
pip install -r requirements.txt
```

2. **数据库迁移**
```bash
python manage.py makemigrations communication
python manage.py migrate
```

3. **URL配置**
已在 `chronic_disease_backend/urls.py` 中配置:
```python
path('api/communication/', include('communication.urls')),
```

### 前端配置

1. **安装依赖**
```bash
npm install
```

2. **导航配置**
聊天功能已集成到患者和医生导航中，无需额外配置。

## 使用指南

### 患者端使用
1. 登录患者账户
2. 点击底部"消息"标签
3. 点击右上角"+"开始新聊天
4. 搜索医生并选择
5. 开始发送消息

### 医生端使用
1. 登录医生账户
2. 点击底部"消息"标签
3. 查看现有会话或创建新会话
4. 选择患者开始聊天
5. 回复患者消息

### 消息管理
- 下拉刷新会话列表
- 点击会话查看聊天记录
- 消息自动标记为已读
- 查看未读消息数量

## 测试指南

### 测试环境准备

1. **创建测试用户**
```bash
cd chronic-disease-backend
python create_test_users.py
```

2. **启动后端服务**
```bash
python manage.py runserver
```

3. **启动前端应用**
```bash
cd chronic-disease-app
npm start
```

### 测试场景

#### 基本聊天测试
1. 使用患者账户登录 (+8613800138000)
2. 进入消息界面
3. 搜索医生并开始聊天
4. 发送测试消息
5. 切换到医生账户 (+8613800138001)
6. 查看和回复消息

#### 功能测试
- [ ] 会话创建
- [ ] 消息发送
- [ ] 消息接收
- [ ] 已读状态
- [ ] 用户搜索
- [ ] 权限控制

### 性能测试
- 大量消息的分页加载
- 多个并发会话
- 频繁的消息发送

## 故障排除

### 常见问题

1. **消息发送失败**
   - 检查网络连接
   - 验证用户认证状态
   - 确认后端服务运行

2. **会话列表不显示**
   - 检查API响应
   - 验证用户权限
   - 查看控制台错误

3. **搜索不到用户**
   - 确认用户存在
   - 检查角色权限
   - 验证搜索关键词

### 日志查看
```bash
# 后端日志
tail -f logs/django.log

# 前端调试
在浏览器开发工具中查看网络请求和控制台日志
```

## 扩展功能

### 计划中的功能
- [ ] 消息模板
- [ ] 文件附件支持
- [ ] 语音消息
- [ ] 消息推送通知
- [ ] 会话归档
- [ ] 消息搜索

### 自定义扩展
- 添加新的消息类型
- 集成第三方服务
- 实现实时通知
- 添加表情符号支持

## 维护指南

### 数据库维护
```bash
# 清理过期消息
python manage.py shell
from communication.models import Message
from datetime import datetime, timedelta
old_messages = Message.objects.filter(sent_at__lt=datetime.now() - timedelta(days=90))
old_messages.delete()
```

### 性能优化
- 定期清理过期消息
- 优化数据库查询
- 实现消息缓存
- 监控API性能

## 版本历史

- **v1.0.0** (2024-01-15): 基本聊天功能实现
- **v1.1.0** (2024-01-20): 添加用户搜索功能
- **v1.2.0** (2024-01-25): 优化界面和性能

## 技术支持

如需技术支持或报告问题，请联系开发团队或在项目仓库中提交Issue。

---

*本文档将随着功能更新而持续维护* 