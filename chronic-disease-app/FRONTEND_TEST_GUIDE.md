# 🧪 前端单元测试指南

## 📋 概述

本项目使用 **Jest** + **React Native Testing Library** 进行前端单元测试，主要测试：

- ✅ **组件逻辑** - UI组件的渲染和交互
- ✅ **工具函数** - 纯函数的输入输出
- ✅ **服务层** - API调用和数据处理
- ✅ **状态管理** - Redux store的状态变化
- ✅ **屏幕组件** - 页面级组件的功能

## 🚀 快速开始

### 运行所有测试
```bash
npm test
```

### 运行特定测试文件
```bash
npm test -- src/__tests__/components/CustomButton.test.js
```

### 运行测试并查看覆盖率
```bash
npm run test:coverage
```

### 监视模式运行测试
```bash
npm run test:watch
```

## 📁 测试文件结构

```
src/
├── __tests__/
│   ├── setup.js              # 测试环境配置
│   ├── example.test.js        # 示例测试
│   ├── components/           # 组件测试
│   │   └── CustomButton.test.js
│   ├── utils/               # 工具函数测试
│   │   └── helpers.test.js
│   ├── services/            # 服务层测试
│   │   └── api.test.js
│   ├── store/              # 状态管理测试
│   │   └── authSlice.test.js
│   └── screens/            # 屏幕组件测试
│       └── LoginScreen.test.js
```

## 🧩 测试类型详解

### 1. 组件测试 (Component Tests)

**目标**: 测试UI组件的渲染、属性传递和用户交互

```javascript
// src/__tests__/components/CustomButton.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomButton from '../../components/CustomButton';

describe('CustomButton 组件测试', () => {
  it('应该正确渲染按钮', () => {
    const { getByText } = render(
      <CustomButton title="测试按钮" onPress={() => {}} />
    );
    
    expect(getByText('测试按钮')).toBeTruthy();
  });

  it('点击时应该调用 onPress 函数', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <CustomButton title="点击测试" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('点击测试'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

### 2. 工具函数测试 (Utility Tests)

**目标**: 测试纯函数的逻辑正确性

```javascript
// src/__tests__/utils/helpers.test.js
import { formatDate, validators } from '../../utils/helpers';

describe('helpers.js 工具函数测试', () => {
  describe('formatDate 日期格式化', () => {
    it('应该格式化为 YYYY-MM-DD', () => {
      const testDate = new Date('2024-01-15T10:30:00');
      expect(formatDate(testDate, 'YYYY-MM-DD')).toBe('2024-01-15');
    });
  });

  describe('validators 验证器', () => {
    it('应该验证有效的手机号', () => {
      expect(validators.phone('13800138000')).toBe(true);
      expect(validators.phone('12345678901')).toBe(false);
    });
  });
});
```

### 3. 服务层测试 (Service Tests)

**目标**: 测试API调用和数据处理逻辑

```javascript
// src/__tests__/services/api.test.js
import axios from 'axios';
import { authAPI } from '../../services/api';

jest.mock('axios');

describe('API 服务测试', () => {
  it('login - 应该发送登录请求', async () => {
    const mockResponse = {
      data: { access: 'token', user: { id: 1 } }
    };
    axios.post.mockResolvedValue(mockResponse);

    const result = await authAPI.login('13800138000', 'password');
    
    expect(axios.post).toHaveBeenCalledWith('/auth/login/', {
      phone: '13800138000',
      password: 'password'
    });
    expect(result).toEqual(mockResponse.data);
  });
});
```

### 4. 状态管理测试 (Redux Tests)

**目标**: 测试Redux状态的变化和异步actions

```javascript
// src/__tests__/store/authSlice.test.js
import { configureStore } from '@reduxjs/toolkit';
import authSlice, { loginUser } from '../../store/slices/authSlice';

describe('authSlice 认证状态管理测试', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { auth: authSlice },
    });
  });

  it('应该有正确的初始状态', () => {
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
```

### 5. 屏幕组件测试 (Screen Tests)

**目标**: 测试页面级组件的完整功能

```javascript
// src/__tests__/screens/LoginScreen.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import LoginScreen from '../../screens/auth/LoginScreen';

describe('LoginScreen 登录屏幕测试', () => {
  it('应该正确渲染登录表单', () => {
    const { getByText, getByPlaceholderText } = render(
      <Provider store={mockStore}>
        <LoginScreen />
      </Provider>
    );

    expect(getByText('登录')).toBeTruthy();
    expect(getByPlaceholderText('手机号')).toBeTruthy();
  });
});
```

## 🔧 测试最佳实践

### 1. 测试命名规范
- 文件名: `ComponentName.test.js`
- 测试套件: `describe('ComponentName 组件测试', () => {})`
- 测试用例: `it('应该做某事', () => {})`

### 2. 模拟(Mocking)策略
```javascript
// 模拟外部依赖
jest.mock('../../services/api');
jest.mock('@react-navigation/native');
jest.mock('react-redux');

// 模拟函数
const mockOnPress = jest.fn();
const mockNavigate = jest.fn();
```

### 3. 测试数据准备
```javascript
// 使用工厂函数创建测试数据
const createMockUser = (overrides = {}) => ({
  id: 1,
  name: '测试用户',
  phone: '13800138000',
  ...overrides,
});
```

### 4. 异步测试处理
```javascript
// 使用 async/await
it('应该处理异步操作', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe('expected');
});

// 使用 waitFor
import { waitFor } from '@testing-library/react-native';

it('应该等待异步更新', async () => {
  render(<Component />);
  
  await waitFor(() => {
    expect(getByText('加载完成')).toBeTruthy();
  });
});
```

## 📊 测试覆盖率

### 查看覆盖率报告
```bash
npm run test:coverage
```

### 覆盖率目标
- **语句覆盖率**: ≥ 50%
- **分支覆盖率**: ≥ 50%
- **函数覆盖率**: ≥ 50%
- **行覆盖率**: ≥ 50%

### HTML覆盖率报告
运行测试后，打开 `coverage/index.html` 查看详细的覆盖率报告。

## 🚫 常见问题

### 1. 模拟React Native组件
```javascript
jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
}));
```

### 2. 模拟导航
```javascript
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));
```

### 3. 模拟Redux
```javascript
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
}));
```

## 📝 测试脚本

在 `package.json` 中已配置的测试脚本：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 🎯 下一步

1. **扩展组件测试** - 为更多UI组件添加测试
2. **集成测试** - 测试组件间的交互
3. **E2E测试** - 使用Detox进行端到端测试
4. **性能测试** - 测试组件渲染性能
5. **快照测试** - 使用Jest快照测试UI一致性

## 🔗 相关资源

- [Jest官方文档](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)
- [Redux Testing](https://redux.js.org/usage/writing-tests)

---

**🎉 恭喜！你现在已经有了一个完整的前端单元测试框架！**
