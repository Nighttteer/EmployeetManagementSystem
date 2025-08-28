/**
 * 用户状态管理切片 (User State Slice)
 * 
 * 管理用户相关的所有状态，包括：
 * - 用户个人资料信息
 * - 健康指标数据
 * - 健康趋势分析
 * - 用药计划状态
 * - 数据加载和错误状态
 * 
 * 使用 Redux Toolkit 的 createSlice 和 createAsyncThunk
 * 提供异步操作和状态更新的完整解决方案
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAPI } from '../../services/api';

// ============================================================================
//synchronous Action定义 - 处理API调用和异步状态管理
// ============================================================================

/**
 * 异步Action：获取用户个人信息
 * 
 * 从后端API获取用户的个人资料信息
 * 包括基本信息、联系方式、偏好设置等
 * 
 * @returns {Promise} 返回用户资料数据或错误信息
 */
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAPI.getProfile();
      return response.data;
    } catch (error) {
      // 提取后端错误信息，如果没有则使用默认错误信息
      return rejectWithValue(error.response?.data?.message || '获取用户信息失败');
    }
  }
);

/**
 * 异步Action：更新用户信息
 * 
 * 向后端API提交用户信息的更新
 * 支持部分字段更新，如头像、联系方式、偏好设置等
 * 
 * @param {Object} profileData - 要更新的用户资料数据
 * @returns {Promise} 返回更新后的用户资料或错误信息
 */
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

/**
 * 异步Action：提交健康指标
 * 
 * 向后端API提交用户的健康数据
 * 包括血压、血糖、心率、体重等各项健康指标
 * 
 * @param {Object} metricsData - 健康指标数据对象
 * @returns {Promise} 返回提交结果或错误信息
 */
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

/**
 * 异步Action：获取健康趋势数据
 * 
 * 从后端API获取用户的健康数据趋势
 * 支持不同时间周期的数据分析（如7天、30天、90天等）
 * 
 * @param {string} [period='30days'] - 时间周期，默认30天
 * @returns {Promise} 返回健康趋势数据或错误信息
 */
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

// ============================================================================
// 初始状态定义
// ============================================================================

/**
 * 用户状态的初始值
 * 
 * 定义了用户模块所有状态字段的默认值
 * 确保应用启动时状态的一致性
 */
const initialState = {
  // 用户个人资料信息
  profile: null,
  
  // 健康指标数据数组
  healthMetrics: [],
  
  // 健康趋势数据，按指标类型分组
  healthTrends: {
    blood_pressure: [],    // 血压趋势
    blood_glucose: [],     // 血糖趋势
    heart_rate: [],        // 心率趋势
    weight: [],            // 体重趋势
    uric_acid: [],        // 尿酸趋势
    lipids: []             // 血脂趋势
  },
  
  // 用户用药计划
  medicationPlan: [],
  
  // 加载状态标识
  loading: false,
  
  // 错误信息
  error: null,
  
  // 最后提交健康数据的时间
  lastSubmissionTime: null,
};

// ============================================================================
// Slice定义 - 状态更新逻辑
// ============================================================================

/**
 * 用户状态切片
 * 
 * 使用 Redux Toolkit 的 createSlice 创建
 * 包含同步reducer和异步action的处理逻辑
 */
const userSlice = createSlice({
  name: 'user',  // slice名称，用于调试和开发工具
  initialState,  // 初始状态
  reducers: {
    /**
     * 清除用户错误信息
     * 
     * 当用户执行新操作或错误被处理后，清除之前的错误状态
     */
    clearUserError: (state) => {
      state.error = null;
    },
    
    /**
     * 重置用户数据
     * 
     * 清空所有用户相关数据，通常用于用户登出或重置应用状态
     */
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
    
    /**
     * 更新用药状态
     * 
     * 更新特定药物的服用状态和时间
     * 用于记录用户的服药情况
     * 
     * @param {Object} action.payload - 包含medicationId、status、timestamp的对象
     */
    updateMedicationStatus: (state, action) => {
      const { medicationId, status, timestamp } = action.payload;
      const medication = state.medicationPlan.find(med => med.id === medicationId);
      if (medication) {
        medication.lastTaken = timestamp;
        medication.status = status;
      }
    },
    /**
     * 添加健康数据
     * 
     * 将新的健康数据添加到本地状态，并更新对应的健康趋势数据
     * 
     * @param {Object} action.payload - 新的健康数据对象
     */
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
  
  // ============================================================================
  // 异步Action处理 - 使用extraReducers处理异步操作的状态变化
  // ============================================================================
  
  extraReducers: (builder) => {
    builder
      // ============================================================================
      // 获取用户资料相关状态处理
      // ============================================================================
      
      // 开始获取用户资料 - 设置加载状态
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 获取用户资料成功 - 更新状态数据
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.medicationPlan = action.payload.medicationPlan || [];
      })
      // 获取用户资料失败 - 设置错误状态
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 更新用户资料相关状态处理
      // ============================================================================
      
      // 更新用户资料成功 - 合并更新数据
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profile = { ...state.profile, ...action.payload };
        // 注意：这里需要通过dispatch来更新auth slice，但在这个reducer中无法直接dispatch
        // 所以我们需要在组件中处理这个同步
      })
      
      // ============================================================================
      // 提交健康指标相关状态处理
      // ============================================================================
      
      // 开始提交健康指标 - 设置加载状态
      .addCase(submitHealthMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 提交健康指标成功 - 添加新数据并更新时间戳
      .addCase(submitHealthMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.healthMetrics.push(action.payload);
        state.lastSubmissionTime = new Date().toISOString();
      })
      // 提交健康指标失败 - 设置错误状态
      .addCase(submitHealthMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 获取健康趋势相关状态处理
      // ============================================================================
      
      // 获取健康趋势成功 - 处理API响应数据
      .addCase(fetchHealthTrends.fulfilled, (state, action) => {
        // 处理新的API响应格式
        const response = action.payload;
        
        // 合并API数据与本地数据，避免覆盖手动输入的数据
        if (response.metrics) {
          const apiMetrics = [];
          // 从API响应中提取所有指标数据点
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
        
        // 将API响应转换为兼容的格式，确保数据结构一致性
        const compatibleTrends = {
          blood_pressure: [],
          blood_glucose: [],
          heart_rate: [],
          weight: [],
          uric_acid: [],
          lipids: []
        };
        
        // 将API数据映射到兼容格式
        if (response.metrics) {
          Object.entries(response.metrics).forEach(([metricType, metricData]) => {
            if (metricData.data_points) {
              compatibleTrends[metricType] = metricData.data_points;
            }
          });
        }
        
        // 更新健康趋势状态
        state.healthTrends = compatibleTrends;
      });
  },
});

// ============================================================================
// 导出配置
// ============================================================================

// 导出同步action creators，供组件调用
export const { 
  clearUserError,        // 清除错误信息
  resetUserData,         // 重置用户数据
  updateMedicationStatus, // 更新用药状态
  addHealthData          // 添加健康数据
} = userSlice.actions;

// 导出reducer，供store使用
export default userSlice.reducer; 