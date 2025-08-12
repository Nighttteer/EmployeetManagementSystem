# 🚀 智能告警系统 - 快速启动指南

## 🎯 **系统特点**
- ✅ **零依赖**: 不需要Redis、Celery等额外服务
- ✅ **实时响应**: 患者数据异常立即生成告警
- ✅ **智能分析**: 基于真实数据库数据的趋势分析
- ✅ **简单部署**: 只需要Django + React Native

## 🛠️ **快速启动**

### **1. 启动后端**
```bash
cd chronic-disease-backend

# 创建测试数据（包含医生、患者、健康数据）
python manage.py create_test_data

# 启动Django服务器
python manage.py runserver 0.0.0.0:8000
```

### **2. 启动前端**
```bash
cd chronic-disease-app

# 清理缓存并启动
npx expo start --clear
```

### **3. 测试系统**

#### **测试实时告警**
1. **患者端**: 填写异常健康数据
   - 血压: 185/95 (会触发紧急告警)
   - 血糖: 16.5 (会触发紧急告警)
   - 心率: 125 (会触发紧急告警)

2. **观察Django控制台**，应该看到:
   ```
   📊 患者 张三 提交了新的健康数据: blood_pressure
   🚨 实时分析患者ID 1 的 blood_pressure 数据...
   🚨 生成紧急告警: 患者血压危急：185/95mmHg
   ✅ 已完成患者 张三 的实时数据分析
   ```

3. **医生端**: 登录后查看告警页面，应能看到新生成的告警

#### **测试智能分析**
```bash
# 手动触发数据分析
python manage.py analyze_patient_data --doctor-id 1 --verbose

# 查看生成的告警
python manage.py shell
from health.models import Alert
print(f"总告警数: {Alert.objects.count()}")
for alert in Alert.objects.all()[:5]:
    print(f"- {alert.title}: {alert.priority} ({alert.status})")
```

## 📊 **数据流程**

```
患者填写数据 → HealthMetric表
         ↓
    Django信号触发
         ↓  
    实时分析(同步执行)
         ↓
    生成告警 → Alert表
         ↓
    医生端API获取 → 显示告警
```

## 🔧 **管理命令**

```bash
# 创建测试数据
python manage.py create_test_data

# 分析特定医生的患者数据
python manage.py analyze_patient_data --doctor-id 1

# 分析所有医生的患者数据  
python manage.py analyze_patient_data --all-doctors

# 清理过期告警
python manage.py shell
from health.tasks import cleanup_old_alerts
cleanup_old_alerts()
```

## 📱 **测试账号**

系统会自动创建以下测试账号：

### **医生账号**
- 邮箱: `doctor@test.com`
- 密码: `test123456`
- 姓名: 张医生

### **患者账号**
- 张三: `patient1@test.com` / `test123456`
- 李四: `patient2@test.com` / `test123456`  
- 王五: `patient3@test.com` / `test123456`

## 🎯 **验证成功**

系统工作正常的标志：

1. ✅ **Django启动无错误**: `Starting development server at http://0.0.0.0:8000/`
2. ✅ **前端连接成功**: 不再出现 `Network request failed`
3. ✅ **实时分析工作**: 控制台显示分析日志
4. ✅ **告警生成**: 医生端能看到告警数据
5. ✅ **数据来源正确**: 页面显示"数据来源: database"

## 📋 **API端点**

- 告警数据: `GET /api/health/alerts/doctor/{doctor_id}/`
- 智能分析: `GET /api/health/intelligent-alerts/`
- 患者数据: `GET /api/patients/{patient_id}/health-data/`

现在系统已经完全简化，不再需要复杂的异步任务配置！🎉