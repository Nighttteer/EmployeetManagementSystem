# 慢性病管理系统测试指南

## 概述

本项目使用 pytest + pytest-django 作为测试框架，提供了完整的单元测试、集成测试和API测试。

## 测试结构

```
tests/
├── conftest.py              # 全局配置和fixtures
├── factories/               # 数据工厂
│   ├── user_factories.py
│   ├── health_factories.py
│   ├── medication_factories.py
│   └── communication_factories.py
├── unit/                    # 单元测试
│   ├── test_accounts.py
│   ├── test_health.py
│   ├── test_medication.py
│   └── test_communication.py
├── integration/             # 集成测试
│   ├── test_api_auth.py
│   └── test_health_workflow.py
└── utils/                   # 测试工具
    └── test_helpers.py
```

## 快速开始

### 安装依赖

```bash
pip install -r requirements.txt
```

### 运行所有测试

```bash
pytest
```

### 使用测试脚本

```bash
# 运行所有测试
python run_tests.py

# 只运行单元测试
python run_tests.py --unit

# 只运行集成测试
python run_tests.py --integration

# 测试特定模块
python run_tests.py --health

# 生成覆盖率报告
python run_tests.py --coverage

# 生成HTML覆盖率报告
python run_tests.py --html-coverage
```

## 测试标记

项目使用pytest标记来分类测试：

- `@pytest.mark.unit` - 单元测试
- `@pytest.mark.integration` - 集成测试
- `@pytest.mark.api` - API测试
- `@pytest.mark.auth` - 认证测试
- `@pytest.mark.doctor` - 医生功能测试
- `@pytest.mark.patient` - 患者功能测试
- `@pytest.mark.health` - 健康数据测试
- `@pytest.mark.medication` - 用药管理测试
- `@pytest.mark.communication` - 沟通测试
- `@pytest.mark.alert` - 告警测试
- `@pytest.mark.security` - 安全测试
- `@pytest.mark.slow` - 慢速测试

### 运行特定标记的测试

```bash
# 运行单元测试
pytest -m unit

# 运行健康模块的集成测试
pytest -m "health and integration"

# 运行除了慢速测试外的所有测试
pytest -m "not slow"
```

## 测试数据管理

### 使用Factory Boy

项目使用Factory Boy创建测试数据：

```python
from tests.factories import DoctorFactory, PatientFactory, HealthMetricFactory

# 创建测试用户
doctor = DoctorFactory()
patient = PatientFactory(chronic_diseases=['hypertension'])

# 创建健康指标
metric = HealthMetricFactory(patient=patient, measured_by=doctor)
```

### 使用Fixtures

```python
def test_example(authenticated_patient_client, patient_user):
    # authenticated_patient_client 是已认证的API客户端
    # patient_user 是患者用户对象
    url = '/api/health/metrics/'
    response = authenticated_patient_client.get(url)
    assert response.status_code == 200
```

## 常用测试模式

### API测试

```python
@pytest.mark.api
def test_create_health_metric(authenticated_patient_client):
    data = {
        'metric_type': 'blood_pressure',
        'systolic': 120,
        'diastolic': 80,
        'measured_at': '2024-01-15T10:00:00Z'
    }
    
    response = authenticated_patient_client.post('/api/health/metrics/', data)
    assert response.status_code == 201
    assert response.data['systolic'] == 120
```

### 模型测试

```python
@pytest.mark.unit
def test_user_risk_level():
    patient = PatientFactory(chronic_diseases=['diabetes', 'hypertension'])
    assert patient.get_disease_risk_level() == 'medium'
```

### 业务流程测试

```python
@pytest.mark.integration
def test_complete_medication_workflow(api_client):
    # 1. 创建医生和患者
    doctor = DoctorFactory()
    patient = PatientFactory()
    
    # 2. 医生制定用药计划
    api_client.force_authenticate(user=doctor)
    # ... 创建用药计划
    
    # 3. 患者接收提醒
    api_client.force_authenticate(user=patient)
    # ... 验证提醒
    
    # 4. 患者确认服药
    # ... 确认服药
```

## 覆盖率报告

### 生成覆盖率报告

```bash
# 终端报告
pytest --cov=. --cov-report=term-missing

# HTML报告
pytest --cov=. --cov-report=html

# 使用脚本
python run_tests.py --html-coverage
```

### 查看覆盖率

HTML报告会生成在 `htmlcov/` 目录中，打开 `htmlcov/index.html` 查看详细报告。

## 测试配置

### 测试设置

测试使用独立的设置文件 `test_settings.py`：

- 使用内存数据库（SQLite :memory:）
- 禁用迁移以加速测试
- 简化密码哈希
- 禁用缓存和日志

### 环境变量

```bash
export DJANGO_SETTINGS_MODULE=chronic_disease_backend.test_settings
```

## 最佳实践

### 1. 测试命名

- 测试类名以 `Test` 开头
- 测试方法名以 `test_` 开头
- 使用描述性的名称

```python
class TestUserAuthentication:
    def test_login_with_valid_credentials_should_return_tokens(self):
        pass
```

### 2. 测试隔离

- 每个测试都应该独立运行
- 使用factories创建测试数据
- 避免在测试间共享状态

### 3. 断言

- 使用明确的断言
- 提供有意义的错误信息

```python
assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.data}"
```

### 4. 测试数据

- 使用最小必要的测试数据
- 优先使用factories而不是fixtures
- 避免硬编码的测试数据

### 5. Mock和Patch

- 对外部服务使用mock
- 对时间敏感的测试使用时间mock

```python
@patch('django.utils.timezone.now')
def test_with_fixed_time(mock_now):
    mock_now.return_value = datetime(2024, 1, 15, 10, 0, 0)
    # 测试代码
```

## 持续集成

### GitHub Actions配置示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.12'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
    
    - name: Run tests
      run: |
        pytest --cov=. --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v1
```

## 性能测试

对于性能敏感的功能，可以使用pytest-benchmark：

```python
def test_health_metric_query_performance(benchmark, authenticated_patient_client):
    # 创建大量测试数据
    patient = PatientFactory()
    HealthMetricFactory.create_batch(1000, patient=patient)
    
    # 基准测试查询
    def query_metrics():
        return authenticated_patient_client.get('/api/health/metrics/')
    
    result = benchmark(query_metrics)
    assert result.status_code == 200
```

## 故障排除

### 常见问题

1. **数据库错误**: 确保使用 `@pytest.mark.django_db` 或在conftest.py中启用数据库访问
2. **认证错误**: 使用提供的认证fixtures
3. **时区问题**: 使用 `timezone.now()` 而不是 `datetime.now()`
4. **Import错误**: 检查Django设置是否正确配置

### 调试技巧

```python
# 打印响应内容
print(response.data)

# 使用pdb调试
import pdb; pdb.set_trace()

# 临时跳过测试
@pytest.mark.skip(reason="调试中")
def test_something():
    pass
```

## 贡献指南

1. 为新功能编写测试
2. 确保测试覆盖率不降低
3. 遵循现有的测试模式
4. 更新测试文档

运行测试前请确保：
- 所有测试都能通过
- 覆盖率达到要求（≥85%）
- 没有测试警告
