import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../../services/api';

// 异步action：登录
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ phone, password, userType }, { rejectWithValue }) => {
    try {
      console.log('🔐 AuthSlice: 开始执行登录...');
      console.log('📊 登录参数:', { phone, userType });
      
      const response = await authAPI.login(phone, password, userType);
      
      console.log('✅ AuthSlice: 登录API调用成功');
      console.log('📦 响应数据结构:', {
        hasTokens: !!response.data.tokens,
        hasUser: !!response.data.user,
        userRole: response.data.user?.role
      });
      
      // 保存token到安全存储
      await SecureStore.setItemAsync('authToken', response.data.tokens.access);
      await SecureStore.setItemAsync('userRole', response.data.user.role);
      
      console.log('💾 Token已保存到安全存储');
      
      return {
        token: response.data.tokens.access,
        user: response.data.user,
        role: response.data.user.role
      };
    } catch (error) {
      console.error('❌ AuthSlice: 登录失败');
      console.error('🔍 错误详情:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      });
      
      // 根据HTTP状态码提供具体错误信息
      let errorMessage = '登录失败';
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message || error.response.data?.detail;
        
        switch (status) {
          case 400:
            errorMessage = `请求参数错误 (${status}): ${serverMessage || '请检查手机号和密码格式'}`;
            break;
          case 401:
            errorMessage = `认证失败 (${status}): ${serverMessage || '手机号或密码错误'}`;
            break;
          case 403:
            errorMessage = `访问被拒绝 (${status}): ${serverMessage || '账号可能被禁用'}`;
            break;
          case 404:
            errorMessage = `API接口不存在 (${status}): 请检查后端服务配置`;
            break;
          case 500:
            errorMessage = `服务器内部错误 (${status}): ${serverMessage || '请联系管理员'}`;
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = `服务器连接错误 (${status}): 后端服务可能未启动`;
            break;
          default:
            errorMessage = `HTTP错误 (${status}): ${serverMessage || error.response.statusText}`;
        }
      } else if (error.request) {
        errorMessage = '网络连接失败: 无法连接到服务器，请检查网络和后端服务状态';
      } else {
        errorMessage = `请求配置错误: ${error.message}`;
      }
      
      console.error('💬 用户错误信息:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// 异步action：用户注册
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      // 注册成功后自动保存token
      await SecureStore.setItemAsync('authToken', response.data.tokens.access);
      await SecureStore.setItemAsync('userRole', response.data.user.role);
      return {
        token: response.data.tokens.access,
        user: response.data.user,
        role: response.data.user.role
      };
    } catch (error) {
      console.error('注册API错误详情:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || error.message || '注册失败');
    }
  }
);

// 异步action：注销
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // 清除本地存储的token
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userRole');
      return null;
    } catch (error) {
      return rejectWithValue('注销失败');
    }
  }
);

// 异步action：检查现有token
export const checkAuthToken = createAsyncThunk(
  'auth/checkToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const role = await SecureStore.getItemAsync('userRole');
      
      if (!token) {
        throw new Error('未找到认证token');
      }
      
      // 验证token有效性
      const response = await authAPI.validateToken(token);
      return {
        token,
        role,
        user: response.data.user,
        isAuthenticated: true
      };
    } catch (error) {
      // 清除无效token
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userRole');
      return rejectWithValue('Token无效');
    }
  }
);

const initialState = {
  isAuthenticated: false,
  token: null,
  user: null,
  role: null, // 'patient' 或 'doctor'
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      state.role = null;
      state.error = null;
    },
    updateAuthUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // 注册
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.role;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // 注销
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.role = null;
        state.error = null;
      })
      // 检查token
      .addCase(checkAuthToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.role;
      })
      .addCase(checkAuthToken.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.role = null;
      });
  },
});

export const { clearError, resetAuth, updateAuthUser } = authSlice.actions;
export default authSlice.reducer; 