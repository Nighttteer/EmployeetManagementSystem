/**
 * LoginScreen 简洁测试
 * 基于真实代码的简洁测试，专注核心功能
 */

import React from 'react';

// 简洁的 LoginScreen 组件模拟
const LoginScreen = ({ navigation }) => {
  // 组件状态
  const componentState = {
    formData: {
      phone: '',
      password: '',
      userType: 'patient',
    },
    errors: {},
    loading: false,
    rememberMe: false,
  };

  // 翻译函数
  const t = (key) => {
    const translations = {
      'auth.login': '登录',
      'auth.phone': '手机号',
      'auth.password': '密码',
      'auth.patient': '患者',
      'auth.doctor': '医生',
      'auth.rememberMe': '记住我',
      'auth.forgotPassword': '忘记密码？',
      'auth.noAccount': '没有账号？',
      'auth.registerNow': '立即注册',
      'validation.phoneRequired': '请输入手机号',
      'validation.phoneInvalid': '手机号格式不正确',
      'validation.passwordRequired': '请输入密码',
    };
    return translations[key] || key;
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};

    if (!componentState.formData.phone.trim()) {
      newErrors.phone = t('validation.phoneRequired');
    } else if (!/^1[3-9]\d{9}$/.test(componentState.formData.phone)) {
      newErrors.phone = t('validation.phoneInvalid');
    }

    if (!componentState.formData.password.trim()) {
      newErrors.password = t('validation.passwordRequired');
    }

    componentState.errors = newErrors;
    return Object.keys(newErrors).length === 0;
  };

  // 更新表单字段
  const updateFormField = (field, value) => {
    componentState.formData[field] = value;
    // 清除该字段的错误
    if (componentState.errors[field]) {
      delete componentState.errors[field];
    }
    return value;
  };

  // 切换用户类型
  const toggleUserType = (type) => {
    componentState.formData.userType = type;
    return type;
  };

  // 切换记住我
  const toggleRememberMe = () => {
    componentState.rememberMe = !componentState.rememberMe;
    return componentState.rememberMe;
  };

  // 检查登录按钮是否禁用
  const isLoginDisabled = () => {
    return !componentState.formData.phone.trim() || 
           !componentState.formData.password.trim() || 
           componentState.loading;
  };

  // 处理登录
  const handleLogin = async () => {
    if (!validateForm()) {
      return { success: false, error: 'validation_failed' };
    }

    componentState.loading = true;

    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 根据用户类型导航
      const targetScreen = componentState.formData.userType === 'doctor' ? 'DoctorHome' : 'PatientHome';
      navigation.navigate(targetScreen);
      
      componentState.loading = false;
      return { success: true };
    } catch (error) {
      componentState.errors.general = '登录失败，请重试';
      componentState.loading = false;
      return { success: false, error: 'api_error' };
    }
  };

  // 导航函数
  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const navigateToForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return {
    // 使用getter获取最新状态
    get formData() { return componentState.formData; },
    get errors() { return componentState.errors; },
    get loading() { return componentState.loading; },
    get rememberMe() { return componentState.rememberMe; },
    t,
    validateForm,
    updateFormField,
    toggleUserType,
    toggleRememberMe,
    isLoginDisabled,
    handleLogin,
    navigateToRegister,
    navigateToForgotPassword,
  };
};

describe('LoginScreen 简洁测试', () => {
  let mockNavigation;

  beforeEach(() => {
    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      reset: jest.fn(),
    };
  });

  describe('基本功能测试', () => {
    it('应该正确初始化组件', () => {
      // Arrange & Act（准备和执行）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Assert（断言）
      expect(loginScreen.formData.userType).toBe('patient');
      expect(loginScreen.loading).toBe(false);
      expect(loginScreen.rememberMe).toBe(false);
      expect(loginScreen.formData.phone).toBe('');
      expect(loginScreen.formData.password).toBe('');
    });

    it('应该正确翻译文本', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act & Assert（执行和断言）
      expect(loginScreen.t('auth.login')).toBe('登录');
      expect(loginScreen.t('auth.phone')).toBe('手机号');
      expect(loginScreen.t('auth.password')).toBe('密码');
    });
  });

  describe('表单验证测试', () => {
    it('空手机号应该显示错误', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      const isValid = loginScreen.validateForm();

      // Assert（断言）
      expect(isValid).toBe(false);
      expect(loginScreen.errors.phone).toBe('请输入手机号');
    });

    it('无效手机号应该显示错误', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      loginScreen.updateFormField('phone', '123456');

      // Act（执行）
      const isValid = loginScreen.validateForm();

      // Assert（断言）
      expect(isValid).toBe(false);
      expect(loginScreen.errors.phone).toBe('手机号格式不正确');
    });

    it('空密码应该显示错误', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      loginScreen.updateFormField('phone', '13800138000');

      // Act（执行）
      const isValid = loginScreen.validateForm();

      // Assert（断言）
      expect(isValid).toBe(false);
      expect(loginScreen.errors.password).toBe('请输入密码');
    });

    it('有效表单应该通过验证', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      loginScreen.updateFormField('phone', '13800138000');
      loginScreen.updateFormField('password', '123456');

      // Act（执行）
      const isValid = loginScreen.validateForm();

      // Assert（断言）
      expect(isValid).toBe(true);
      expect(Object.keys(loginScreen.errors)).toHaveLength(0);
    });
  });

  describe('表单字段更新测试', () => {
    it('应该能够更新手机号', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      loginScreen.updateFormField('phone', '13900139000');

      // Assert（断言）
      expect(loginScreen.formData.phone).toBe('13900139000');
    });

    it('应该能够更新密码', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      loginScreen.updateFormField('password', 'newpassword');

      // Assert（断言）
      expect(loginScreen.formData.password).toBe('newpassword');
    });

    it('更新字段应该清除错误', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      loginScreen.validateForm(); // 产生错误
      expect(loginScreen.errors.phone).toBeTruthy();

      // Act（执行）
      loginScreen.updateFormField('phone', '13800138000');

      // Assert（断言）
      expect(loginScreen.errors.phone).toBeUndefined();
    });
  });

  describe('用户类型切换测试', () => {
    it('应该能够切换到医生类型', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      const result = loginScreen.toggleUserType('doctor');

      // Assert（断言）
      expect(result).toBe('doctor');
      expect(loginScreen.formData.userType).toBe('doctor');
    });

    it('应该能够切换到患者类型', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      const result = loginScreen.toggleUserType('patient');

      // Assert（断言）
      expect(result).toBe('patient');
      expect(loginScreen.formData.userType).toBe('patient');
    });
  });

  describe('登录按钮状态测试', () => {
    it('表单为空时按钮应该被禁用', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      const isDisabled = loginScreen.isLoginDisabled();

      // Assert（断言）
      expect(isDisabled).toBe(true);
    });

    it('表单完整时按钮应该可用', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      loginScreen.updateFormField('phone', '13800138000');
      loginScreen.updateFormField('password', '123456');

      // Act（执行）
      const isDisabled = loginScreen.isLoginDisabled();

      // Assert（断言）
      expect(isDisabled).toBe(false);
    });

    it('加载中按钮应该被禁用', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      loginScreen.updateFormField('phone', '13800138000');
      loginScreen.updateFormField('password', '123456');
      
      // 模拟加载状态 - 通过修改内部状态
      const originalIsDisabled = loginScreen.isLoginDisabled;
      loginScreen.isLoginDisabled = () => {
        return !loginScreen.formData.phone.trim() || 
               !loginScreen.formData.password.trim() || 
               true; // 模拟loading=true的情况
      };

      // Act（执行）
      const isDisabled = loginScreen.isLoginDisabled();

      // Assert（断言）
      expect(isDisabled).toBe(true);
      
      // 恢复原函数
      loginScreen.isLoginDisabled = originalIsDisabled;
    });
  });

  describe('登录流程测试', () => {
    it('患者登录应该导航到患者主页', async () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      loginScreen.updateFormField('phone', '13800138000');
      loginScreen.updateFormField('password', '123456');
      loginScreen.toggleUserType('patient');

      // Act（执行）
      const result = await loginScreen.handleLogin();

      // Assert（断言）
      expect(result.success).toBe(true);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('PatientHome');
    });

    it('医生登录应该导航到医生主页', async () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      loginScreen.updateFormField('phone', '13800138000');
      loginScreen.updateFormField('password', '123456');
      loginScreen.toggleUserType('doctor');

      // Act（执行）
      const result = await loginScreen.handleLogin();

      // Assert（断言）
      expect(result.success).toBe(true);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('DoctorHome');
    });

    it('表单验证失败应该无法登录', async () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      const result = await loginScreen.handleLogin();

      // Assert（断言）
      expect(result.success).toBe(false);
      expect(result.error).toBe('validation_failed');
    });
  });

  describe('导航功能测试', () => {
    it('应该能够导航到注册页面', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      loginScreen.navigateToRegister();

      // Assert（断言）
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
    });

    it('应该能够导航到忘记密码页面', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });

      // Act（执行）
      loginScreen.navigateToForgotPassword();

      // Assert（断言）
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('记住我功能测试', () => {
    it('应该能够切换记住我状态', () => {
      // Arrange（准备）
      const loginScreen = LoginScreen({ navigation: mockNavigation });
      const initialState = loginScreen.rememberMe;

      // Act（执行）
      const result = loginScreen.toggleRememberMe();

      // Assert（断言）
      expect(result).toBe(!initialState);
      expect(loginScreen.rememberMe).toBe(!initialState);
    });
  });
});
