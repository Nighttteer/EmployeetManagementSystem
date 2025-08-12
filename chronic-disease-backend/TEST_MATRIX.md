# 🧪 慢病管理系统测试矩阵

## 📋 需求追溯矩阵

| 需求ID | 需求描述 | 测试用例ID | 测试类型 | 测试文件 | 通过标准 | 状态 |
|--------|----------|------------|----------|----------|----------|------|
| R-AUTH-01 | 用户登录与短信验证 | TC-AUTH-LOGIN-01 | 单元/集成 | `test_models.py`, `test_api_endpoints.py` | 登录成功返回token，验证码验证通过 | ✅ |
| R-AUTH-02 | 用户角色权限控制 | TC-AUTH-PERM-01 | 集成/安全 | `test_api_endpoints.py`, `security_tests.py` | 患者无法访问医生功能，医生可管理患者 | ✅ |
| R-PAT-CRUD | 患者信息增删改查 | TC-PAT-CRUD-01 | API/集成 | `test_api_endpoints.py` | CRUD操作正确，权限控制有效 | ✅ |
| R-HEALTH-01 | 健康数据录入与查看 | TC-HEALTH-DATA-01 | 单元/API | `test_models.py`, `test_api_endpoints.py` | 数据正确保存，查询准确 | ✅ |
| R-ALERT-01 | 智能预警生成与管理 | TC-ALERT-GEN-01 | 单元/集成 | `test_models.py`, `test_api_endpoints.py` | 预警规则正确，状态管理准确 | ✅ |
| R-MED-01 | 用药计划与提醒 | TC-MED-PLAN-01 | API/集成 | `test_medication_api.py` | 计划创建成功，提醒触发准确 | 🟡 |
| R-CHAT-01 | 医患沟通消息 | TC-CHAT-MSG-01 | API/集成 | 待开发 | 消息发送成功，附件上传正常 | ⏳ |
| R-PERF-01 | 系统性能要求 | TC-PERF-LOAD-01 | 性能 | `locustfile.py` | P95 < 2s，并发100用户无错误 | ✅ |
| R-SEC-01 | 数据安全与隐私 | TC-SEC-VULN-01 | 安全 | `security_tests.py` | 无SQL注入，权限控制严格 | ✅ |

### 图例
- ✅ 已实现并通过
- 🟡 部分实现
- ⏳ 待开发
- ❌ 未通过

## 🎯 测试用例详细清单

### 单元测试 (Unit Tests)

#### 模型测试
| 用例ID | 测试场景 | 预期结果 | 文件位置 |
|--------|----------|----------|----------|
| TC-MODEL-USER-01 | 创建患者用户 | 用户创建成功，角色正确 | `tests/unit/test_models.py` |
| TC-MODEL-USER-02 | 创建医生用户 | 用户创建成功，慢病列表为空 | `tests/unit/test_models.py` |
| TC-MODEL-USER-03 | 手机号验证 | 无效手机号抛出ValidationError | `tests/unit/test_models.py` |
| TC-MODEL-HEALTH-01 | 健康指标创建 | 指标数据正确保存 | `tests/unit/test_models.py` |
| TC-MODEL-RELATION-01 | 医患关系创建 | 关系创建成功，唯一性约束生效 | `tests/unit/test_models.py` |
| TC-MODEL-ALERT-01 | 预警创建与解决 | 预警状态正确管理 | `tests/unit/test_models.py` |

### 集成测试 (Integration Tests)

#### API端点测试
| 用例ID | 测试场景 | 预期结果 | 文件位置 |
|--------|----------|----------|----------|
| TC-API-AUTH-01 | 用户登录成功 | 返回access和refresh token | `tests/integration/test_api_endpoints.py` |
| TC-API-AUTH-02 | 登录失败处理 | 返回401，错误信息明确 | `tests/integration/test_api_endpoints.py` |
| TC-API-HEALTH-01 | 创建健康指标 | 201状态码，数据库记录创建 | `tests/integration/test_api_endpoints.py` |
| TC-API-HEALTH-02 | 查询健康指标 | 返回用户相关数据 | `tests/integration/test_api_endpoints.py` |
| TC-API-PERM-01 | 权限控制测试 | 患者无法访问医生API | `tests/integration/test_api_endpoints.py` |
| TC-API-ALERT-01 | 预警CRUD操作 | 创建、查询、更新、删除正常 | `tests/integration/test_api_endpoints.py` |

### E2E测试 (End-to-End Tests)

#### 前端用户流程
| 用例ID | 测试场景 | 操作步骤 | 预期结果 | 文件位置 |
|--------|----------|----------|----------|----------|
| TC-E2E-LOGIN-01 | 完整登录流程 | 1.输入手机号 2.获取验证码 3.输入验证码 4.登录 | 进入对应角色首页 | `e2e/loginFlow.e2e.js` |
| TC-E2E-DATA-01 | 健康数据录入 | 1.登录患者 2.录入血压 3.查看趋势 | 数据正确显示 | `e2e/dataEntry.e2e.js` |
| TC-E2E-ALERT-01 | 预警处理流程 | 1.登录医生 2.查看预警 3.处理预警 | 状态正确更新 | `e2e/alertManagement.e2e.js` |

### 性能测试 (Performance Tests)

#### 负载测试场景
| 场景ID | 测试场景 | 并发用户 | 持续时间 | 成功标准 | 文件位置 |
|--------|----------|----------|----------|----------|----------|
| TC-PERF-LOAD-01 | 正常负载 | 50用户 | 10分钟 | P95 < 2s, 错误率 < 1% | `locustfile.py` |
| TC-PERF-STRESS-01 | 压力测试 | 100用户 | 5分钟 | P95 < 5s, 错误率 < 5% | `locustfile.py` |
| TC-PERF-SPIKE-01 | 峰值测试 | 200用户 | 2分钟 | 系统不崩溃，快速恢复 | `locustfile.py` |

#### 关键API性能指标
| API端点 | 期望响应时间 | 并发能力 | 备注 |
|---------|--------------|----------|------|
| `/api/accounts/login/` | P95 < 1s | 50 RPS | 登录高频操作 |
| `/api/health/patients/` | P95 < 2s | 30 RPS | 医生查看患者列表 |
| `/api/health/alerts/` | P95 < 1.5s | 40 RPS | 预警查看高频 |
| `/api/health/metrics/` | P95 < 1s | 20 RPS | 数据录入 |

### 安全测试 (Security Tests)

#### 安全漏洞检查
| 用例ID | 测试场景 | 检查内容 | 预期结果 | 文件位置 |
|--------|----------|----------|----------|----------|
| TC-SEC-AUTH-01 | 认证绕过 | 未认证访问受保护API | 返回401 | `security_tests.py` |
| TC-SEC-AUTHZ-01 | 权限绕过 | 患者访问医生功能 | 返回403 | `security_tests.py` |
| TC-SEC-INJ-01 | SQL注入 | 恶意SQL输入 | 无异常，正确处理 | `security_tests.py` |
| TC-SEC-XSS-01 | XSS攻击 | 脚本注入测试 | 输入被转义或过滤 | `security_tests.py` |
| TC-SEC-RATE-01 | 速率限制 | 快速重复请求 | 触发429限制 | `security_tests.py` |
| TC-SEC-CORS-01 | CORS配置 | 跨域请求测试 | 配置安全，非通配符 | `security_tests.py` |

### 兼容性测试 (Compatibility Tests)

#### 移动端兼容性
| 平台 | 版本范围 | 屏幕尺寸 | 测试重点 | 状态 |
|------|----------|----------|----------|------|
| Android | API 23-34 | 320x568 - 414x896 | 布局适配，功能正常 | 🟡 |
| iOS | 14.0-17.x | iPhone SE - iPhone 15 Pro Max | 性能，UI一致性 | 🟡 |
| 平板 | iPad 9.7" - 12.9" | 768x1024 - 1024x1366 | 大屏适配 | ⏳ |

#### 网络兼容性
| 网络类型 | 测试场景 | 预期表现 | 状态 |
|----------|----------|----------|------|
| WiFi | 正常使用 | 快速响应 | ✅ |
| 4G | 数据录入 | 3s内完成 | ✅ |
| 3G | 基本功能 | 降级但可用 | 🟡 |
| 弱网 | 离线缓存 | 本地数据可用 | ⏳ |

## 📊 覆盖率要求

### 代码覆盖率目标
| 模块 | 行覆盖率 | 分支覆盖率 | 函数覆盖率 |
|------|----------|------------|------------|
| accounts | ≥ 85% | ≥ 80% | ≥ 90% |
| health | ≥ 80% | ≥ 75% | ≥ 85% |
| medication | ≥ 75% | ≥ 70% | ≥ 80% |
| communication | ≥ 70% | ≥ 65% | ≥ 75% |
| **整体目标** | **≥ 80%** | **≥ 75%** | **≥ 85%** |

### 功能覆盖率
- 核心功能覆盖率: 100%
- 边缘情况覆盖率: ≥ 80%
- 错误处理覆盖率: ≥ 90%

## 🚀 执行命令

### 后端测试
```bash
# 安装依赖
cd chronic-disease-backend
pip install -r requirements.txt

# 运行单元测试
pytest tests/unit/ -v

# 运行集成测试
pytest tests/integration/ -v

# 运行所有测试并生成覆盖率报告
pytest --cov=. --cov-report=html --cov-report=term-missing

# 性能测试
locust -f locustfile.py --host=http://localhost:8000

# 安全测试
python security_tests.py

# 代码质量检查
bandit -r .
safety check
```

### 前端测试
```bash
# 安装依赖
cd chronic-disease-app
npm install

# 运行单元测试
npm test

# 运行测试并生成覆盖率
npm run test:coverage

# E2E测试
npm run e2e:build
npm run e2e:test

# 代码检查
npm run lint
```

## 📈 持续改进

### 测试质量指标
1. **测试通过率**: ≥ 95%
2. **测试执行时间**: 单元测试 < 30s，集成测试 < 2min
3. **缺陷逃逸率**: < 5%
4. **回归测试覆盖**: 100%

### 下一步计划
- [ ] 完善E2E测试用例
- [ ] 添加视觉回归测试
- [ ] 实现测试数据管理自动化
- [ ] 集成CI/CD流水线
- [ ] 性能基线建立和监控
