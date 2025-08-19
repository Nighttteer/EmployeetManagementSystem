# 统一测试数据管理工具

这是一个功能强大的测试数据管理工具，整合了慢性疾病应用后端的所有测试数据生成和管理功能。

## 📁 文件结构

本目录包含以下文件：

- `unified_test_data_manager.py` - 统一测试数据管理器（主要脚本）
- `enhanced_data_creator.py` - 增强数据创建器（创建触发报警的健康数据）
- `test_enhanced_data.py` - 测试增强数据创建器
- `quick_setup.py` - 一键快速设置脚本
- `create_test_data.py` - Django管理命令（创建测试健康数据和告警）
- `README.md` - 本说明文档
- `COMMAND_SUMMARY.md` - 命令摘要和使用说明

## 🎯 主要功能

### 1. 数据库管理
- **清除数据库**: 清除所有测试数据，保留表结构
- **状态查看**: 显示当前数据库的详细状态

### 2. 用户数据创建
- **基本用户**: 创建3个医生+3个患者的最小测试集
- **完整用户**: 创建3个医生+8个患者的完整测试集
- **自动医患关系**: 自动建立医生和患者的管理关系

### 3. 健康数据和告警
- **健康数据生成**: 通过Django管理命令创建测试健康数据
- **增强数据创建**: 使用增强数据创建器生成能触发各种报警的真实健康数据
- **智能告警分析**: 运行智能告警生成系统
- **实时分析**: 模拟患者数据提交，触发实时分析
- **用药依从性监控**: 创建用药计划和依从性数据
- **趋势异常检测**: 生成趋势异常告警

### 4. 5级风险评估系统
- **风险状态设置**: 自动设置5种不同的疾病风险状态
- **状态分布**: 展示各风险等级的分布统计
- **前端测试**: 为前端界面提供完整的测试数据

### 5. 功能测试
- **搜索功能测试**: 测试用户搜索API
- **告警摘要分析**: 分析告警数据的统计信息

### 6. 数据管理
- **数据导出**: 支持JSON和CSV格式导出
- **数据验证**: 检查数据完整性和一致性
- **性能测试**: 基本性能测试和压力测试
- **数据清理**: 清理孤立的无效数据

## 🚀 使用方法

### 交互式模式
```bash
cd chronic-disease-backend
python survey_data_preparation/unified_test_data_manager.py
```

### 完整命令列表
```bash
# 基础数据管理
python unified_test_data_manager.py clear          # 清除数据库
python unified_test_data_manager.py basic          # 创建基本用户
python unified_test_data_manager.py full           # 创建完整用户
python unified_test_data_manager.py health         # 创建健康数据
python unified_test_data_manager.py enhanced       # 创建增强健康数据（触发报警）
python unified_test_data_manager.py enhanced 7     # 创建7天的增强健康数据
python unified_test_data_manager.py status         # 显示状态

# 智能分析功能
python unified_test_data_manager.py analyze        # 运行智能告警分析
python unified_test_data_manager.py summary        # 查看告警摘要
python unified_test_data_manager.py realtime 1 blood_pressure  # 模拟实时分析

# 功能测试
python unified_test_data_manager.py test           # 测试搜索功能

# 风险评估系统
python unified_test_data_manager.py risk5          # 设置5级风险评估系统

# 数据管理
python unified_test_data_manager.py export json    # 导出JSON格式数据
python unified_test_data_manager.py export csv     # 导出CSV格式数据
python unified_test_data_manager.py validate       # 验证数据完整性
python unified_test_data_manager.py performance basic   # 基本性能测试
python unified_test_data_manager.py performance stress  # 压力测试
python unified_test_data_manager.py cleanup        # 清理孤立数据
python unified_test_data_manager.py backup         # 备份数据库
python unified_test_data_manager.py generate 100   # 生成大量测试数据
python unified_test_data_manager.py report         # 生成数据报告
python unified_test_data_manager.py test_apis      # 测试所有API

# 一键设置
python unified_test_data_manager.py setup          # 完整系统设置
python unified_test_data_manager.py fullsetup      # 完整系统设置（包含5级风险）
```

### 命令行模式

#### 基本操作
```bash
# 查看数据库状态
python survey_data_preparation/unified_test_data_manager.py status

# 清除数据库
python survey_data_preparation/unified_test_data_manager.py clear

# 创建基本用户
python survey_data_preparation/unified_test_data_manager.py basic

# 创建完整用户
python survey_data_preparation/unified_test_data_manager.py full
```

#### 高级功能
```bash
# 创建健康数据
python survey_data_preparation/unified_test_data_manager.py health

# 创建增强健康数据（触发各种报警）
python survey_data_preparation/unified_test_data_manager.py enhanced
python survey_data_preparation/unified_test_data_manager.py enhanced 7

# 运行智能分析
python survey_data_preparation/unified_test_data_manager.py analyze

# 设置5级风险系统
python survey_data_preparation/unified_test_data_manager.py risk5

# 测试搜索功能
python survey_data_preparation/unified_test_data_manager.py test
```

#### 一键设置
```bash
# 完整系统设置（不包含5级风险）
python survey_data_preparation/unified_test_data_manager.py setup

# 完整系统设置（包含5级风险）
python survey_data_preparation/unified_test_data_manager.py fullsetup

# 设置5级风险评估系统
python survey_data_preparation/unified_test_data_manager.py risk5

# 导出测试数据（JSON格式）
python survey_data_preparation/unified_test_data_manager.py export json

# 导出测试数据（CSV格式）
python survey_data_preparation/unified_test_data_manager.py export csv

# 验证数据完整性
python survey_data_preparation/unified_test_data_manager.py validate

# 性能测试（基本）
python survey_data_preparation/unified_test_data_manager.py performance basic

# 性能测试（压力测试）
python survey_data_preparation/unified_test_data_manager.py performance stress

# 清理孤立数据
python survey_data_preparation/unified_test_data_manager.py cleanup

# 备份数据库
python survey_data_preparation/unified_test_data_manager.py backup

# 生成大量测试数据
python survey_data_preparation/unified_test_data_manager.py generate 100

# 生成数据报告
python survey_data_preparation/unified_test_data_manager.py report

# 测试所有API
python survey_data_preparation/unified_test_data_manager.py test_apis
```

#### 实时分析测试
```bash
# 模拟患者ID为1的血压数据实时分析
python survey_data_preparation/unified_test_data_manager.py realtime 1 blood_pressure

# 模拟患者ID为2的血糖数据实时分析
python survey_data_preparation/unified_test_data_manager.py realtime 2 blood_glucose

# 模拟患者ID为3的心率数据实时分析
python survey_data_preparation/unified_test_data_manager.py realtime 3 heart_rate
```

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

## 🎨 5级风险评估系统

工具会自动设置5种不同的风险状态：

1. **未评估** (unassessed): 医生尚未评估
2. **健康** (healthy): 无慢性疾病
3. **低风险** (low): 关节炎、偏头痛等
4. **中风险** (medium): 糖尿病、高血压等
5. **高风险** (high): 癌症、心脏病等

## 🔧 技术特性

- **Django集成**: 完全集成Django ORM和模型
- **错误处理**: 完善的异常处理和用户提示
- **数据安全**: 清除数据前需要确认
- **灵活配置**: 支持交互式和命令行两种模式
- **中文界面**: 友好的中文用户界面

## 📁 文件结构

```
survey_data_preparation/
├── unified_test_data_manager.py  # 统一测试数据管理工具
├── setup_5_level_risk_system.py  # 5级风险系统设置
├── initialize_disease_data.py     # 疾病数据初始化
├── setup_doctor_patient_relations.py  # 医患关系设置
├── prepare_survey_data.py         # 调查数据准备
└── README.md                      # 使用说明
```

## ⚠️ 注意事项

1. **数据安全**: 清除数据库操作不可逆，请谨慎使用
2. **环境要求**: 确保Django环境已正确配置
3. **权限要求**: 确保有足够的数据库操作权限
4. **备份建议**: 重要数据请提前备份

## 🆘 常见问题

### Q: 运行时报错"ModuleNotFoundError"
A: 确保在正确的Django项目目录下运行，并且虚拟环境已激活

### Q: 数据库连接失败
A: 检查Django设置文件中的数据库配置

### Q: 权限不足
A: 确保当前用户有数据库读写权限

### Q: 5级风险系统设置失败
A: 确保先创建了足够的患者用户（至少5个）

## 📞 技术支持

如有问题，请检查：
1. Django环境配置
2. 数据库连接状态
3. 模型字段定义
4. 依赖包安装情况
