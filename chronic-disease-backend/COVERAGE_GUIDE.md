# 测试覆盖率查看指南

## 📊 覆盖率报告已生成！

### 1. 终端覆盖率报告

刚刚运行的测试显示了accounts模块的覆盖率：

```
============================================ tests coverage ============================================= 
Name                      Stmts   Miss Branch BrPart   Cover   Missing
----------------------------------------------------------------------
accounts\__init__.py          0      0      0      0 100.00%
accounts\admin.py             1      0      0      0 100.00%
accounts\apps.py              4      0      0      0 100.00%
accounts\models.py          173      5     32      4  95.61%   91->90, 98->97, 108, 121, 265, 361-362
accounts\serializers.py     345    345    144      0   0.00%   1-917
accounts\sms_service.py      68     68     14      0   0.00%   5-176
accounts\tests.py             0      0      0      0 100.00%
accounts\urls.py              5      5      0      0   0.00%   1-8
accounts\user_urls.py         3      3      0      0   0.00%   1-5
accounts\views.py           309    309     64      0   0.00%   1-791
----------------------------------------------------------------------
TOTAL                       908    735    254      4  17.30%
```

### 2. HTML覆盖率报告 🌐

更详细的HTML报告已生成到 `htmlcov/` 目录！

#### 如何查看HTML报告：

1. **打开HTML报告**：
   ```bash
   # Windows
   start htmlcov/index.html
   
   # 或者直接用浏览器打开
   # htmlcov/index.html
   ```

2. **HTML报告包含的信息**：
   - 📈 **总体覆盖率统计**
   - 📁 **按模块分类的覆盖率**
   - 🔍 **逐行代码覆盖情况**
   - ❌ **未覆盖的代码行高亮**
   - 🌿 **分支覆盖率分析**

### 3. 覆盖率数据解读

#### 列说明：
- **Stmts**: 总语句数
- **Miss**: 未覆盖的语句数
- **Branch**: 分支总数
- **BrPart**: 部分覆盖的分支数
- **Cover**: 覆盖率百分比
- **Missing**: 未覆盖的行号

#### 当前结果分析：
- ✅ **models.py**: 95.61% - 很好的覆盖率！
- ❌ **serializers.py**: 0% - 需要添加API测试
- ❌ **views.py**: 0% - 需要添加视图测试
- ❌ **sms_service.py**: 0% - 需要添加服务测试

### 4. 不同类型的覆盖率测试

#### 测试单个模块：
```bash
# 测试accounts模块
$env:DJANGO_SETTINGS_MODULE="chronic_disease_backend.test_settings"
python -m pytest tests/unit/test_accounts.py --cov=accounts --cov-report=html

# 测试health模块
python -m pytest tests/unit/test_health.py --cov=health --cov-report=html

# 测试medication模块  
python -m pytest tests/unit/test_medication.py --cov=medication --cov-report=html
```

#### 测试所有模块：
```bash
# 测试所有单元测试
python -m pytest tests/unit/ --cov=. --cov-report=html

# 测试所有测试（包括集成测试）
python -m pytest --cov=. --cov-report=html
```

#### 使用测试脚本：
```bash
# 生成HTML覆盖率报告
python run_tests.py --html-coverage

# 生成终端覆盖率报告
python run_tests.py --coverage

# 测试特定模块的覆盖率
python run_tests.py --health --html-coverage
```

### 5. 覆盖率报告选项

#### 终端报告格式：
```bash
# 简单报告
--cov-report=term

# 显示缺失行号
--cov-report=term-missing

# 只显示总计
--cov-report=term:skip-covered
```

#### 文件报告格式：
```bash
# HTML报告（推荐）
--cov-report=html

# XML报告（CI/CD用）
--cov-report=xml

# JSON报告
--cov-report=json
```

### 6. 覆盖率配置

在 `pytest.ini` 或 `.coveragerc` 中可以配置：

```ini
# .coveragerc
[run]
source = .
omit = 
    */venv/*
    */migrations/*
    manage.py
    */settings/*
    */tests/*

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError

[html]
directory = htmlcov
```

### 7. 查看具体未覆盖代码

#### 在HTML报告中：
1. 点击文件名查看详细覆盖情况
2. 红色高亮 = 未覆盖代码
3. 绿色高亮 = 已覆盖代码  
4. 黄色高亮 = 部分覆盖的分支

#### 在终端中查看：
```bash
# 显示缺失的行号
python -m pytest --cov=accounts --cov-report=term-missing

# 只显示未覆盖的文件
python -m pytest --cov=accounts --cov-report=term:skip-covered
```

### 8. 提高覆盖率的策略

#### 当前需要添加的测试：

1. **API测试** (serializers.py + views.py):
   ```python
   # 测试用户注册API
   # 测试用户登录API
   # 测试用户资料更新API
   # 测试SMS验证API
   ```

2. **服务测试** (sms_service.py):
   ```python
   # 测试SMS发送服务
   # 测试验证码生成
   # 测试验证逻辑
   ```

3. **边界情况测试**:
   ```python
   # 测试异常情况
   # 测试边界值
   # 测试错误处理
   ```

### 9. 覆盖率目标

#### 推荐的覆盖率标准：
- 🎯 **总体目标**: ≥85%
- 🏆 **核心业务逻辑**: ≥95%
- 📊 **模型层**: ≥90%
- 🔌 **API层**: ≥80%
- 🛡️ **关键安全功能**: 100%

#### 当前状态：
- ✅ **models.py**: 95.61% (已达标)
- ❌ **serializers.py**: 0% (需要提升)
- ❌ **views.py**: 0% (需要提升)
- ❌ **services**: 0% (需要提升)

### 10. 持续监控

#### 在CI/CD中集成：
```yaml
# GitHub Actions示例
- name: Run tests with coverage
  run: |
    pytest --cov=. --cov-report=xml --cov-fail-under=85

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v1
```

#### 本地开发流程：
```bash
# 开发前运行覆盖率测试
python run_tests.py --html-coverage

# 添加新测试后再次检查
python run_tests.py --html-coverage

# 比较覆盖率变化
```

---

## 🚀 立即查看你的覆盖率报告！

**HTML报告已生成在 `htmlcov/index.html`**

在浏览器中打开这个文件，你将看到：
- 📊 详细的覆盖率统计
- 🎨 彩色代码覆盖高亮
- 📈 分支覆盖率分析
- 🔍 逐行覆盖情况

这是查看和分析代码覆盖率最直观的方式！
