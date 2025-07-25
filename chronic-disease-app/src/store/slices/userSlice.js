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
  async (period = '30days', { rejectWithValue }) => {
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
    blood_pressure: [],
    blood_glucose: [],
    heart_rate: [],
    weight: [],
    uric_acid: [],
    lipids: []
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
        blood_pressure: [],
        blood_glucose: [],
        heart_rate: [],
        weight: [],
        uric_acid: [],
        lipids: []
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
    addHealthData: (state, action) => {
      // 添加健康数据到本地状态
      const healthMetric = action.payload;
      state.healthMetrics.push(healthMetric);
      state.lastSubmissionTime = new Date().toISOString();
      
      // 按时间排序，最新的在前面
      state.healthMetrics.sort((a, b) => {
        const timeA = new Date(a.measured_at).getTime();
        const timeB = new Date(b.measured_at).getTime();
        return timeB - timeA;
      });
      
      // 同时更新对应的健康趋势数据
      const metricType = healthMetric.metric_type;
      if (metricType && state.healthTrends[metricType]) {
        state.healthTrends[metricType].push(healthMetric);
        // 同样按时间排序
        state.healthTrends[metricType].sort((a, b) => {
          const timeA = new Date(a.measured_at).getTime();
          const timeB = new Date(b.measured_at).getTime();
          return timeB - timeA;
        });
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
        // 同时更新auth slice中的用户信息
        // 这里需要通过dispatch来更新auth slice，但在这个reducer中无法直接dispatch
        // 所以我们需要在组件中处理这个同步
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
        // 处理新的API响应格式
        const response = action.payload;
        
        // 合并API数据与本地数据，避免覆盖手动输入的数据
        if (response.metrics) {
          const apiMetrics = [];
          Object.values(response.metrics).forEach(metricData => {
            if (metricData.data_points) {
              apiMetrics.push(...metricData.data_points);
            }
          });
          
          // 如果本地没有数据，直接使用API数据
          if (!state.healthMetrics || state.healthMetrics.length === 0) {
            state.healthMetrics = apiMetrics;
          } else {
            // 合并数据，避免重复
            const existingIds = new Set(state.healthMetrics.map(m => m.id));
            const newMetrics = apiMetrics.filter(m => !existingIds.has(m.id));
            state.healthMetrics = [...state.healthMetrics, ...newMetrics];
            
            // 按时间排序，最新的在前面
            state.healthMetrics.sort((a, b) => {
              const timeA = new Date(a.measured_at).getTime();
              const timeB = new Date(b.measured_at).getTime();
              return timeB - timeA;
            });
          }
        }
        
        // 将API响应转换为兼容的格式
        const compatibleTrends = {
          blood_pressure: [],
          blood_glucose: [],
          heart_rate: [],
          weight: [],
          uric_acid: [],
          lipids: []
        };
        
        if (response.metrics) {
          Object.entries(response.metrics).forEach(([metricType, metricData]) => {
            if (metricData.data_points) {
              compatibleTrends[metricType] = metricData.data_points;
            }
          });
        }
        
        state.healthTrends = compatibleTrends;
      });
  },
});

export const { clearUserError, resetUserData, updateMedicationStatus, addHealthData } = userSlice.actions;
export default userSlice.reducer; 