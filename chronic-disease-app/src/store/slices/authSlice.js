import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../../services/api';

// 异步action：登录
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(username, password);
      // 保存token到安全存储
      await SecureStore.setItemAsync('authToken', response.data.token);
      await SecureStore.setItemAsync('userRole', response.data.role);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '登录失败');
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

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer; 