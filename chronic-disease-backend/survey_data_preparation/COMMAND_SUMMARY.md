# 统一测试数据管理工具 - 完整命令总结

## 🎯 功能概览

这是一个功能强大的测试数据管理工具，整合了慢性疾病应用后端的所有测试数据生成和管理功能。

## 📋 完整命令列表

### 🔧 基础数据管理
```bash
# 清除数据库（保留表结构）
python unified_test_data_manager.py clear

# 创建基本测试用户（3医生+3患者）
python unified_test_data_manager.py basic

# 创建完整测试用户（3医生+8患者）
python unified_test_data_manager.py full

# 创建健康数据和告警
python unified_test_data_manager.py health

# 显示当前数据库状态
python unified_test_data_manager.py status
```

### 🧠 智能分析功能
```bash
# 运行智能告警分析
python unified_test_data_manager.py analyze

# 查看告警摘要
python unified_test_data_manager.py summary

# 模拟实时分析
python unified_test_data_manager.py realtime <patient_id> <metric_type>
# 示例：
python unified_test_data_manager.py realtime 1 blood_pressure
python unified_test_data_manager.py realtime 2 blood_glucose
python unified_test_data_manager.py realtime 3 heart_rate
```

### 🧪 功能测试
```bash
# 测试搜索功能
python unified_test_data_manager.py test

# 测试所有API端点
python unified_test_data_manager.py test_apis
```

### 🎯 风险评估系统
```bash
# 设置5级疾病风险评估系统
python unified_test_data_manager.py risk5
```

### 📊 数据管理
```bash
# 导出测试数据（JSON格式）
python unified_test_data_manager.py export json

# 导出测试数据（CSV格式）
python unified_test_data_manager.py export csv

# 验证数据完整性
python unified_test_data_manager.py validate

# 性能测试（基本）
python unified_test_data_manager.py performance basic

# 性能测试（压力测试）
python unified_test_data_manager.py performance stress

# 清理孤立数据
python unified_test_data_manager.py cleanup

# 备份数据库
python unified_test_data_manager.py backup

# 生成大量测试数据
python unified_test_data_manager.py generate <count>
# 示例：
python unified_test_data_manager.py generate 100
python unified_test_data_manager.py generate 500

# 生成数据统计报告
python unified_test_data_manager.py report
```

### 🚀 一键设置
```bash
# 完整系统设置（不包含5级风险）
python unified_test_data_manager.py setup

# 完整系统设置（包含5级风险系统）
python unified_test_data_manager.py fullsetup
```

## 🎨 5级风险评估系统说明

工具会自动设置5种不同的风险状态：

1. **未评估** (unassessed): 医生尚未评估
2. **健康** (healthy): 无慢性疾病
3. **低风险** (low): 关节炎、偏头痛等
4. **中风险** (medium): 糖尿病、高血压等
5. **高风险** (high): 癌症、心脏病等

## 📋 测试账号信息

### 医生账号
- **李医生**: +8613800138001 / test123456
- **王医生**: +8613800138021 / test123456  
- **张医生**: +8613800138022 / test123456

### 患者账号
- **张三**: +8613800138000 / test123456
- **李四**: +8613800138002 / test123456
- **王五**: +8613800138003 / test123456
- **赵六**: +8613800138004 / test123456
- **刘七**: +8613800138005 / test123456
- **陈八**: +8613800138006 / test123456
- **孙九**: +8613800138007 / test123456
- **周十**: +8613800138008 / test123456

## 🔄 典型工作流程

### 1. 快速开始
```bash
# 一键创建完整系统（推荐）
python unified_test_data_manager.py fullsetup
```

### 2. 分步创建
```bash
# 清除现有数据
python unified_test_data_manager.py clear

# 创建用户
python unified_test_data_manager.py full

# 创建健康数据
python unified_test_data_manager.py health

# 运行智能分析
python unified_test_data_manager.py analyze

# 设置5级风险系统
python unified_test_data_manager.py risk5
```

### 3. 数据验证和测试
```bash
# 验证数据完整性
python unified_test_data_manager.py validate

# 测试搜索功能
python unified_test_data_manager.py test

# 测试API
python unified_test_data_manager.py test_apis

# 性能测试
python unified_test_data_manager.py performance stress
```

### 4. 数据管理
```bash
# 生成报告
python unified_test_data_manager.py report

# 导出数据
python unified_test_data_manager.py export json

# 备份数据库
python unified_test_data_manager.py backup
```

## ⚠️ 注意事项

1. **数据安全**: 清除数据库操作不可逆，请谨慎使用
2. **环境要求**: 确保Django环境已正确配置
3. **权限要求**: 确保有足够的数据库操作权限
4. **备份建议**: 重要数据请提前备份
5. **5级风险系统**: 需要至少5个患者才能完整演示

## 🆘 常见问题

### Q: 运行时报错"ModuleNotFoundError"
A: 确保在正确的Django项目目录下运行，并且虚拟环境已激活

### Q: 数据库连接失败
A: 检查Django设置文件中的数据库配置

### Q: 权限不足
A: 确保当前用户有数据库读写权限

### Q: 5级风险系统设置失败
A: 确保先创建了足够的患者用户（至少5个）

### Q: 性能测试很慢
A: 这是正常的，压力测试会执行大量查询来评估性能

## 📞 技术支持

如有问题，请检查：
1. Django环境配置
2. 数据库连接状态
3. 模型字段定义
4. 依赖包安装情况
5. 文件权限设置
