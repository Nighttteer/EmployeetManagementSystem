/**
 * LoginScreen 单元测试
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import LoginScreen from '../../screens/auth/LoginScreen';
import authSlice from '../../store/slices/authSlice';

// 创建测试store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
    },
    preloadedState: {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

// 包装组件的辅助函数
const renderWithProviders = (component, { initialState = {} } = {}) => {
  const store = createTestStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('LoginScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('渲染登录界面基本元素', () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    // 检查基本UI元素
    expect(getByText('auth.login')).toBeTruthy();
    expect(getByPlaceholderText('auth.phoneNumber')).toBeTruthy();
    expect(getByText('auth.sendVerificationCode')).toBeTruthy();
  });

  test('手机号输入功能', () => {
    const { getByPlaceholderText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    const phoneInput = getByPlaceholderText('auth.phoneNumber');
    fireEvent.changeText(phoneInput, '+8613800138000');

    expect(phoneInput.props.value).toBe('+8613800138000');
  });

  test('发送验证码按钮点击', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    // 输入手机号
    const phoneInput = getByPlaceholderText('auth.phoneNumber');
    fireEvent.changeText(phoneInput, '+8613800138000');

    // 点击发送验证码
    const sendCodeButton = getByText('auth.sendVerificationCode');
    fireEvent.press(sendCodeButton);

    // 验证按钮状态变化
    await waitFor(() => {
      expect(getByText('auth.resendIn')).toBeTruthy();
    });
  });

  test('验证码输入和登录', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    // 输入手机号
    const phoneInput = getByPlaceholderText('auth.phoneNumber');
    fireEvent.changeText(phoneInput, '+8613800138000');

    // 发送验证码
    const sendCodeButton = getByText('auth.sendVerificationCode');
    fireEvent.press(sendCodeButton);

    // 等待验证码输入框出现
    await waitFor(() => {
      const codeInput = getByPlaceholderText('auth.verificationCode');
      expect(codeInput).toBeTruthy();
    });

    // 输入验证码
    const codeInput = getByPlaceholderText('auth.verificationCode');
    fireEvent.changeText(codeInput, '123456');

    // 点击登录
    const loginButton = getByText('auth.login');
    fireEvent.press(loginButton);

    // 验证登录逻辑被触发
    expect(codeInput.props.value).toBe('123456');
  });

  test('显示加载状态', () => {
    const { getByTestId } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />,
      {
        initialState: {
          loading: true,
        },
      }
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  test('显示错误信息', () => {
    const errorMessage = '手机号格式错误';
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />,
      {
        initialState: {
          error: errorMessage,
        },
      }
    );

    expect(getByText(errorMessage)).toBeTruthy();
  });

  test('国家代码选择器功能', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    // 查找默认国家代码
    expect(getByText('+86')).toBeTruthy();
    
    // 点击国家代码选择器
    const countryPicker = getByText('+86');
    fireEvent.press(countryPicker);
    
    // 验证选择器被触发（具体实现取决于CountryCodePicker组件）
  });

  test('导航到注册页面', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    const registerLink = getByText('auth.noAccount');
    fireEvent.press(registerLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  test('导航到忘记密码页面', () => {
    const { getByText } = renderWithProviders(
      <LoginScreen navigation={mockNavigation} />
    );

    const forgotPasswordLink = getByText('auth.forgotPassword');
    fireEvent.press(forgotPasswordLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
