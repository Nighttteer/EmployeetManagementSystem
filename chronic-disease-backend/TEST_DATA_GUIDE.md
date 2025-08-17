# 📊 统一测试数据管理指南

## 🎯 **概述**

所有与创建用户和测试数据相关的Python文件已整合为 `unified_test_data_manager.py`

## 🗑️ **已删除的旧文件**

### **用户创建相关**
- ✅ `create_test_users.py` - 完整测试用户创建
- ✅ `manual_create_users.py` - 基本测试用户创建
- ✅ `test_search_function.py` - 搜索功能测试
- ✅ `quick_test_chat.py` - 聊天功能测试

### **API测试相关**
- ✅ `test_api.py` - 通用API测试
- ✅ `test_api_endpoints.py` - API端点测试
- ✅ `test_health_trends_api.py` - 健康趋势API测试

### **音频处理相关**
- ✅ `test_audio_headers.py` - 音频请求头测试
- ✅ `test_audio_endpoint.py` - 音频端点测试
- ✅ `test_audio_files.py` - 音频文件测试

### **验证功能相关**
- ✅ `test_sms_fix.py` - 短信修复测试
- ✅ `test_international_phone.py` - 国际电话测试
- ✅ `test_phone_role_validation.py` - 电话角色验证测试

**总计删除**: 12个旧测试文件 → 统一为1个管理工具 🎉

## 🚀 **使用方法**

### **1. 交互式菜单（推荐）**
```bash
cd chronic-disease-backend
python unified_test_data_manager.py
```

将显示交互菜单：
```
🎯 统一测试数据管理器
====================================
1. 显示数据库状态
2. 清除数据库数据（保留表结构）
3. 创建基本测试用户（3医生+3患者）
4. 创建完整测试用户（3医生+8患者）
5. 创建健康数据和告警（默认患者=12，天数=7；可用环境变量 TEST_PATIENTS/TEST_DAYS 调整）
6. 运行智能告警分析
7. 测试搜索功能
8. 分析告警摘要
9. 模拟实时分析
10. 一键创建完整系统（清除+用户+数据+分析）
0. 退出
```

### **2. 命令行模式**
```bash
# 清除数据库
python unified_test_data_manager.py clear

# 创建基本用户
python unified_test_data_manager.py basic

# 创建完整用户
python unified_test_data_manager.py full

# 创建健康数据（可调规模）
# 使用环境变量控制数量，例如：
# Windows PowerShell
$env:TEST_PATIENTS=20; $env:TEST_DAYS=10; python unified_test_data_manager.py health
# macOS/Linux
TEST_PATIENTS=20 TEST_DAYS=10 python unified_test_data_manager.py health

# 运行智能告警分析
python unified_test_data_manager.py analyze

# 查看告警摘要
python unified_test_data_manager.py summary

# 模拟实时分析
python unified_test_data_manager.py realtime 1 blood_pressure

# 测试搜索功能
python unified_test_data_manager.py test

# 显示状态
python unified_test_data_manager.py status

# 一键完整设置（包含智能分析）
python unified_test_data_manager.py setup
```

## 🔧 **功能特性**

### **数据清理**
- ✅ 清除所有用户数据
- ✅ 清除所有健康记录
- ✅ 清除所有告警数据
- ✅ 清除所有用药记录
- ✅ 保留数据库表结构

### **用户创建**
- ✅ **基本模式**: 1医生 + 3患者
- ✅ **完整模式**: 3医生 + 8患者
- ✅ 自动创建医患关系
- ✅ 自动清理重复用户

### **数据生成**
- ✅ 调用Django管理命令创建健康数据（支持 --patients 与 --days 参数）
- ✅ 生成智能告警
- ✅ 创建用药记录

### **智能分析**
- ✅ 运行智能告警分析服务
- ✅ 模拟实时分析触发
- ✅ 生成各类优先级告警
- ✅ 分析医生患者数据关系

### **功能测试**
- ✅ 测试用户搜索API
- ✅ 测试医患搜索功能
- ✅ 显示数据库状态

## 🔐 **默认登录信息**

### **基本模式**
- **医生**: `+8613800138001` / `test123456`
- **患者**: `+8613800138000` / `test123456`
- **患者**: `+8613800138002` / `test123456`
- **患者**: `+8613800138003` / `test123456`

### **完整模式**
- **李医生**: `+8613800138001` / `test123456`
- **王医生**: `+8613800138021` / `test123456`
- **张医生**: `+8613800138022` / `test123456`
- **所有患者**: 密码统一为 `test123456`

## 🎯 **推荐工作流**

### **开发测试**
```bash
# 1. 一键设置完整系统（包含智能分析）
python unified_test_data_manager.py setup

# 2. 启动Django服务器
python manage.py runserver 0.0.0.0:8000

# 3. 启动前端应用
cd ../chronic-disease-app
npx expo start --clear

# 4. 查看智能分析结果
python unified_test_data_manager.py summary
```

### **快速重置**
```bash
# 清除数据，重新开始
python unified_test_data_manager.py clear
python unified_test_data_manager.py basic
```

## 📊 **状态检查**
随时运行以下命令查看数据库状态：
```bash
python unified_test_data_manager.py status
```

输出示例：
```
📊 当前数据库状态:
   👨‍⚕️ 医生数量: 3
   👤 患者数量: 8
   🔗 医患关系: 5
   📈 健康记录: 45
   🚨 告警记录: 12
   💊 用药记录: 30
```

## ⚡ **快速启动建议**

如果需要立即测试系统，运行：
```bash
python unified_test_data_manager.py setup
```

这将自动完成：
1. 清除旧数据
2. 创建完整用户体系
3. 生成健康数据和告警
4. 显示最终状态

然后直接启动前后端服务即可开始测试！🎉