# 慢性病管理系统 Django 后端

## 🚀 **项目简介**

这是一个基于 Django + Django REST Framework 构建的慢性病管理系统后端API，为React Native移动应用提供完整的数据服务。

## 📋 **功能特性**

### 🔐 **用户认证系统**
- JWT Token 认证
- 用户注册、登录、登出
- 多角色支持（患者、医生、管理员）
- 密码加密存储
- 用户资料管理

### 🏥 **健康数据管理**
- 健康指标记录（血压、血糖、心率、体重等）
- 健康档案管理
- 预警阈值设定
- 健康数据趋势分析
- 异常告警系统

### 💊 **用药管理**
- 药品信息管理
- 用药计划制定
- 用药提醒系统
- 用药依从性跟踪
- 药品库存管理

### 💬 **医患沟通**
- 实时消息系统
- 医生建议推送
- 消息模板管理
- 通知日志记录

## 🛠 **技术栈**

- **框架**: Django 5.2.3
- **API**: Django REST Framework 3.16.0
- **认证**: Django REST Framework SimpleJWT
- **跨域**: django-cors-headers
- **数据库**: SQLite (开发) / PostgreSQL (生产推荐)
- **图像处理**: Pillow

## ⚡ **快速开始**

### 1. 环境准备
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
venv\Scripts\activate

# 激活虚拟环境 (Linux/Mac)
source venv/bin/activate
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 数据库迁移
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. 创建超级用户
```bash
python manage.py createsuperuser
```

### 5. 启动服务器
```bash
python manage.py runserver
```

服务器启动后访问：
- API根端点：`http://127.0.0.1:8000/api/`
- 管理后台：`http://127.0.0.1:8000/admin/`

## 📚 **API文档**

### 认证相关
- `POST /api/auth/register/` - 用户注册
- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/logout/` - 用户登出
- `POST /api/auth/token/refresh/` - 刷新Token
- `GET /api/auth/verify/` - 验证Token

### 用户资料
- `GET /api/auth/profile/` - 获取用户资料
- `PUT /api/auth/profile/` - 更新用户资料
- `POST /api/auth/profile/avatar/` - 上传头像

### 仪表板
- `GET /api/auth/dashboard/` - 获取用户仪表板数据

## 🗃 **数据库架构**

### 核心模型
1. **User** - 统一用户模型（患者、医生、管理员）
2. **HealthMetric** - 健康指标记录
3. **HealthRecord** - 健康档案
4. **ThresholdSetting** - 预警阈值设定
5. **DoctorAdvice** - 医生建议
6. **Medication** - 药品信息
7. **MedicationPlan** - 用药计划
8. **MedicationReminder** - 用药提醒
9. **Message** - 医患沟通消息
10. **DoctorPatientRelation** - 医患关系
11. **Alert** - 健康告警

## 🔧 **配置说明**

### 环境变量
创建 `.env` 文件：
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

### CORS设置
默认允许以下端口访问：
- `http://localhost:8081` (Expo)
- `http://localhost:19006` (Expo Web)

### JWT设置
- Access Token 有效期：1天
- Refresh Token 有效期：7天
- 支持Token自动轮换

## 📱 **与前端集成**

此后端API专为React Native应用设计，支持：
- JWT认证头：`Authorization: Bearer <token>`
- JSON数据格式
- 文件上传（头像、附件）
- 分页数据
- 实时通知

## 🚀 **部署建议**

### 生产环境
1. 使用PostgreSQL数据库
2. 配置Nginx反向代理
3. 使用Gunicorn作为WSGI服务器
4. 配置SSL证书
5. 使用Redis作为缓存
6. 配置日志监控

### Docker部署
```dockerfile
# Dockerfile示例
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "chronic_disease_backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## 🧪 **测试**

```bash
# 运行所有测试
python manage.py test

# 运行特定应用测试
python manage.py test accounts
```

## 📊 **监控和日志**

- 日志文件：`logs/django.log`
- 错误追踪：Django内置异常处理
- 性能监控：可集成Sentry

## 🤝 **贡献**

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交变更：`git commit -m 'Add some AmazingFeature'`
4. 推送分支：`git push origin feature/AmazingFeature`
5. 提交Pull Request

## 📄 **许可证**

该项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 **联系支持**

- 项目主页：[GitHub Repository]
- 问题反馈：[Issues]
- 邮箱：support@chronic-care-system.com

---

🎯 **专为慢性病患者和医疗人员打造的智能管理系统后端** 