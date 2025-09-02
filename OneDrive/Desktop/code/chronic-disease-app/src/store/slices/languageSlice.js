/**
 * 多语言状态管理切片 (Language State Slice)
 * 
 * 管理应用的多语言功能，包括：
 * - 当前语言设置
 * - 支持的语言列表
 * - 语言切换功能
 * - 语言初始化状态
 * 
 * 使用 Redux Toolkit 的 createSlice 和 createAsyncThunk
 * 提供完整的多语言状态管理解决方案
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '../../config/i18n';

// ============================================================================
// 异步Action定义 - 处理多语言相关的异步操作
// ============================================================================

/**
 * 异步Action：切换语言
 * 
 * 动态切换应用的语言设置，包括：
 * - 验证语言代码的有效性
 * - 更新应用的语言配置
 * - 保存语言偏好设置
 * 
 * @param {string} languageCode - 目标语言代码（如：'en', 'zh'）
 * @returns {Promise<string>} 返回切换后的语言代码或错误信息
 */
export const switchLanguage = createAsyncThunk(
  'language/switchLanguage',
  async (languageCode, { rejectWithValue }) => {
    try {
      // 调用i18n配置模块切换语言
      const success = await changeLanguage(languageCode);
      if (success) {
        return languageCode;
      } else {
        throw new Error('Unsupported language');
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/**
 * 异步Action：初始化语言设置
 * 
 * 应用启动时获取当前语言设置，包括：
 * - 从本地存储读取用户语言偏好
 * - 设置默认语言（如果没有偏好设置）
 * - 确保语言配置的一致性
 * 
 * @returns {Promise<string>} 返回当前语言代码或错误信息
 */
export const initializeLanguage = createAsyncThunk(
  'language/initializeLanguage',
  async (_, { rejectWithValue }) => {
    try {
      // 获取当前语言设置
      const currentLanguage = getCurrentLanguage();
      return currentLanguage;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// 初始状态定义
// ============================================================================

/**
 * 多语言状态的初始值
 * 
 * 定义了多语言模块所有状态字段的默认值
 * 确保应用启动时语言状态的一致性
 */
const initialState = {
  currentLanguage: 'en',                    // 当前语言，默认英文
  supportedLanguages: getSupportedLanguages(), // 支持的语言列表
  isLoading: false,                         // 加载状态标识
  error: null,                              // 错误信息
};

// ============================================================================
// Slice定义 - 状态更新逻辑
// ============================================================================

/**
 * 多语言状态切片
 * 
 * 使用 Redux Toolkit 的 createSlice 创建
 * 包含同步reducer和异步action的处理逻辑
 */
const languageSlice = createSlice({
  name: 'language',  // slice名称，用于调试和开发工具
  initialState,      // 初始状态
  reducers: {
    /**
     * 清除错误信息
     * 
     * 当用户执行新操作或错误被处理后，清除之前的错误状态
     */
    clearError: (state) => {
      state.error = null;
    },
    
    /**
     * 手动设置当前语言（用于同步状态）
     * 
     * 在组件中直接更新语言状态，通常用于：
     * - 从本地存储恢复语言设置
     * - 响应系统语言变化
     * - 测试和调试目的
     * 
     * @param {string} action.payload - 新的语言代码
     */
    setCurrentLanguage: (state, action) => {
      state.currentLanguage = action.payload;
    },
  },
  
  // ============================================================================
  // 异步Action处理 - 使用extraReducers处理异步操作的状态变化
  // ============================================================================
  
  extraReducers: (builder) => {
    builder
      // ============================================================================
      // 初始化语言相关状态处理
      // ============================================================================
      
      // 开始初始化语言 - 设置加载状态
      .addCase(initializeLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // 初始化语言成功 - 更新当前语言
      .addCase(initializeLanguage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLanguage = action.payload;
        state.error = null;
      })
      // 初始化语言失败 - 设置错误状态
      .addCase(initializeLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 切换语言相关状态处理
      // ============================================================================
      
      // 开始切换语言 - 设置加载状态
      .addCase(switchLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // 切换语言成功 - 更新当前语言
      .addCase(switchLanguage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLanguage = action.payload;
        state.error = null;
      })
      // 切换语言失败 - 设置错误状态
      .addCase(switchLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// ============================================================================
// 导出配置
// ============================================================================

// 导出同步action creators，供组件调用
export const { 
  clearError,           // 清除错误信息
  setCurrentLanguage    // 手动设置当前语言
} = languageSlice.actions;

// 导出选择器函数，供组件获取状态
export const selectCurrentLanguage = (state) => state.language.currentLanguage;      // 当前语言
export const selectSupportedLanguages = (state) => state.language.supportedLanguages; // 支持的语言列表
export const selectLanguageLoading = (state) => state.language.isLoading;            // 加载状态
export const selectLanguageError = (state) => state.language.error;                  // 错误状态

// 导出reducer，供store使用
export default languageSlice.reducer; 