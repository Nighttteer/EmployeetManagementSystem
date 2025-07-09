import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../../services/api';

// 异步action：获取用户个人信息
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取用户信息失败');
    }
  }
);

// 异步action：更新用户信息
export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userAPI.updateProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新用户信息失败');
    }
  }
);

// 异步action：提交健康指标
export const submitHealthMetrics = createAsyncThunk(
  'user/submitMetrics',
  async (metricsData, { rejectWithValue }) => {
    try {
      const response = await userAPI.submitHealthMetrics(metricsData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '提交健康数据失败');
    }
  }
);

// 异步action：获取健康趋势数据
export const fetchHealthTrends = createAsyncThunk(
  'user/fetchTrends',
  async ({ period = '30days' }, { rejectWithValue }) => {
    try {
      const response = await userAPI.getHealthTrends(period);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取健康趋势失败');
    }
  }
);

const initialState = {
  profile: null,
  healthMetrics: [],
  healthTrends: {
    bloodPressure: [],
    bloodSugar: [],
    heartRate: [],
    weight: []
  },
  medicationPlan: [],
  loading: false,
  error: null,
  lastSubmissionTime: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    },
    resetUserData: (state) => {
      state.profile = null;
      state.healthMetrics = [];
      state.healthTrends = {
        bloodPressure: [],
        bloodSugar: [],
        heartRate: [],
        weight: []
      };
      state.medicationPlan = [];
    },
    updateMedicationStatus: (state, action) => {
      const { medicationId, status, timestamp } = action.payload;
      const medication = state.medicationPlan.find(med => med.id === medicationId);
      if (medication) {
        medication.lastTaken = timestamp;
        medication.status = status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取用户资料
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.medicationPlan = action.payload.medicationPlan || [];
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新用户资料
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = { ...state.profile, ...action.payload };
      })
      // 提交健康指标
      .addCase(submitHealthMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitHealthMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.healthMetrics.push(action.payload);
        state.lastSubmissionTime = new Date().toISOString();
      })
      .addCase(submitHealthMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取健康趋势
      .addCase(fetchHealthTrends.fulfilled, (state, action) => {
        state.healthTrends = action.payload;
      });
  },
});

export const { clearUserError, resetUserData, updateMedicationStatus } = userSlice.actions;
export default userSlice.reducer; 