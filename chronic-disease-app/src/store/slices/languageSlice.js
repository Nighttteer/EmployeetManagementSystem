import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { changeLanguage, getCurrentLanguage, getSupportedLanguages } from '../../config/i18n';

// 异步切换语言
export const switchLanguage = createAsyncThunk(
  'language/switchLanguage',
  async (languageCode, { rejectWithValue }) => {
    try {
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

// 初始化语言设置
export const initializeLanguage = createAsyncThunk(
  'language/initializeLanguage',
  async (_, { rejectWithValue }) => {
    try {
      const currentLanguage = getCurrentLanguage();
      return currentLanguage;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  currentLanguage: 'en', // 默认英文
  supportedLanguages: getSupportedLanguages(),
  isLoading: false,
  error: null,
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
    // 手动设置当前语言（用于同步状态）
    setCurrentLanguage: (state, action) => {
      state.currentLanguage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // 初始化语言
      .addCase(initializeLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeLanguage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLanguage = action.payload;
        state.error = null;
      })
      .addCase(initializeLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // 切换语言
      .addCase(switchLanguage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(switchLanguage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLanguage = action.payload;
        state.error = null;
      })
      .addCase(switchLanguage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentLanguage } = languageSlice.actions;

// 选择器
export const selectCurrentLanguage = (state) => state.language.currentLanguage;
export const selectSupportedLanguages = (state) => state.language.supportedLanguages;
export const selectLanguageLoading = (state) => state.language.isLoading;
export const selectLanguageError = (state) => state.language.error;

export default languageSlice.reducer; 