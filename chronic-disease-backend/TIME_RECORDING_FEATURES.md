# 健康数据时间记录功能

## 📅 功能概述

为healthcare system添加了完整的时间记录功能，用户在录入健康数据时可以选择具体的测量时间，而不仅仅是使用当前时间。

## 🔧 修改内容

### 前端修改

#### 1. 数据录入界面 (`DataEntryScreen.js`)
- **新增功能**：
  - 时间选择器（日期和时间分别选择）
  - 快速选择"现在"按钮
  - 时间格式化显示（中文格式）
  - 时间验证（不能选择未来时间）

- **新增状态**：
  ```javascript
  const [measurementTime, setMeasurementTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  ```

- **新增UI组件**：
  - 日期选择按钮
  - 时间选择按钮
  - 日历和时钟图标
  - 快速选择按钮

#### 2. 依赖添加 (`package.json`)
- **新增依赖**：`@react-native-community/datetimepicker: ^8.2.0`

### 后端修改

#### 1. 健康数据序列化器 (`health/serializers.py`)
- **新增文件**：创建了完整的健康数据序列化器
- **主要功能**：
  - `HealthMetricSerializer` - 健康指标完整序列化器
  - `HealthMetricCreateSerializer` - 创建健康指标的简化序列化器
  - `HealthRecordSerializer` - 健康档案序列化器
  - `DoctorAdviceSerializer` - 医生建议序列化器
  - `AlertSerializer` - 健康告警序列化器
  - `HealthTrendsSerializer` - 健康趋势数据序列化器

- **时间验证**：
  ```python
  def validate_measured_at(self, value):
      if value > timezone.now():
          raise serializers.ValidationError("测量时间不能是未来时间")
      return value
  ```

#### 2. 健康数据视图 (`health/views.py`)
- **新增文件**：创建了完整的健康数据API视图
- **主要视图**：
  - `HealthMetricListCreateView` - 健康指标列表和创建
  - `HealthMetricDetailView` - 健康指标详情
  - `HealthRecordView` - 健康档案
  - `DoctorAdviceListView` - 医生建议列表
  - `AlertListView` - 健康告警列表
  - `health_dashboard` - 健康仪表板
  - `health_trends` - 健康趋势分析

#### 3. URL配置 (`health/urls.py`)
- **新增文件**：健康应用的URL配置
- **API端点**：
  - `POST /api/health/metrics/` - 创建健康指标
  - `GET /api/health/metrics/` - 获取健康指标列表
  - `GET /api/health/dashboard/` - 获取健康仪表板
  - `GET /api/health/trends/` - 获取健康趋势

#### 4. 主URL配置 (`chronic_disease_backend/urls.py`)
- **修改**：启用健康应用的URL路由
- **新增路由**：`path('api/health/', include('health.urls'))`

## 📊 数据库模型

### 时间字段
后端模型中已包含完整的时间字段：

```python
class HealthMetric(models.Model):
    measured_at = models.DateTimeField('测量时间')  # 用户选择的测量时间
    updated_at = models.DateTimeField('更新时间', auto_now=True)  # 自动更新时间
```

### 其他时间字段
- `HealthRecord.last_updated` - 健康档案最后更新时间
- `HealthRecord.created_at` - 健康档案创建时间
- `DoctorAdvice.advice_time` - 医生建议时间
- `DoctorAdvice.read_at` - 建议阅读时间
- `Alert.created_at` - 告警创建时间
- `Alert.handled_at` - 告警处理时间

## 🔧 使用方法

### 前端使用
1. 在数据录入界面选择测量时间
2. 可以选择日期和时间
3. 点击"现在"快速选择当前时间
4. 提交数据时会包含选择的时间

### API使用
```json
POST /api/health/metrics/
{
    "metric_type": "blood_pressure",
    "systolic": 120,
    "diastolic": 80,
    "measured_at": "2024-01-15T14:30:00Z",
    "note": "餐后2小时测量"
}
```

## 📱 UI特性

### 时间选择器
- 日期选择：使用日历图标触发
- 时间选择：使用时钟图标触发
- 快速选择：一键选择当前时间
- 中文格式：显示中文日期和时间格式

### 验证提示
- 不能选择未来时间
- 显示测量时间在保存确认中
- 时间格式自动验证

## 🔍 数据查询

### 按时间查询
- 支持按日期范围查询健康数据
- 支持按时间段分析健康趋势
- 支持最近30天数据快速查看

### 时间统计
- 计算平均值（基于时间段）
- 趋势分析（上升/下降/稳定）
- 健康状态评估

## 🚀 安装和配置

### 前端依赖安装
```bash
cd chronic-disease-app
npm install @react-native-community/datetimepicker
```

### 后端迁移
```bash
cd chronic-disease-backend
python manage.py makemigrations health
python manage.py migrate
```

## 📝 API文档

### 健康指标端点
- `GET /api/health/metrics/` - 获取健康指标列表
- `POST /api/health/metrics/` - 创建健康指标
- `GET /api/health/metrics/{id}/` - 获取特定健康指标
- `PUT /api/health/metrics/{id}/` - 更新健康指标
- `DELETE /api/health/metrics/{id}/` - 删除健康指标

### 数据分析端点
- `GET /api/health/dashboard/` - 获取健康仪表板数据
- `GET /api/health/trends/?metric_type=blood_pressure&period=7` - 获取健康趋势

## ✅ 功能验证

### 测试清单
- [ ] 时间选择器正常工作
- [ ] 日期和时间可以分别选择
- [ ] 快速选择"现在"功能正常
- [ ] 时间验证（不能选择未来时间）
- [ ] 数据提交包含正确时间
- [ ] API返回时间数据
- [ ] 时间格式显示正确
- [ ] 健康趋势分析基于时间

## 🔧 技术实现

### 前端技术
- React Native DateTimePicker
- JavaScript Date对象
- 时间格式化和验证

### 后端技术
- Django timezone处理
- DRF序列化器时间验证
- 数据库时间字段索引

### 数据格式
- 前端：ISO 8601格式 (`2024-01-15T14:30:00Z`)
- 后端：Django DateTimeField
- 数据库：DATETIME类型

## 🎯 未来扩展

### 可能的改进
1. 添加时区支持
2. 批量数据导入时间处理
3. 数据导出时间格式选择
4. 更复杂的时间分析功能
5. 定时提醒功能

### 性能优化
1. 时间字段数据库索引
2. 查询优化
3. 缓存常用时间数据
4. 分页优化 