/**
 * 告警状态管理切片 (Alerts State Slice)
 * 
 * 管理健康告警相关的所有状态，包括：
 * - 告警列表和筛选状态
 * - 告警处理流程和状态更新
 * - 告警统计信息和计数
 * - 实时告警更新和通知
 * - 告警错误处理和用户反馈
 * 
 * 使用 Redux Toolkit 的 createSlice 和 createAsyncThunk
 * 提供完整的告警管理状态解决方案
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { alertsAPI } from '../../services/api';

// ============================================================================
// 异步Action定义 - 处理告警相关的API调用
// ============================================================================

/**
 * 异步Action：获取告警列表
 * 
 * 从后端API获取告警数据，支持状态筛选
 * 包括未处理、已处理等不同状态的告警
 * 
 * @param {Object} filterParams - 筛选参数
 * @param {string} [filterParams.status='unhandled'] - 告警状态筛选
 * @returns {Promise<Object>} 返回告警列表数据或错误信息
 */
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async ({ status = 'unhandled' }, { rejectWithValue }) => {
    try {
      const response = await alertsAPI.getAlerts(status);
      return response.data;
    } catch (error) {
      // 提取后端错误信息，如果没有则使用默认错误信息
      return rejectWithValue(error.response?.data?.message || '获取告警列表失败');
    }
  }
);

/**
 * 异步Action：处理告警
 * 
 * 医生处理告警后，更新告警状态和处理信息
 * 记录处理动作和备注，便于后续追踪和分析
 * 
 * @param {Object} handleData - 处理数据
 * @param {string} handleData.alertId - 告警ID
 * @param {string} handleData.action - 处理动作
 * @param {string} handleData.notes - 处理备注
 * @returns {Promise<Object>} 返回处理结果或错误信息
 */
export const handleAlert = createAsyncThunk(
  'alerts/handleAlert',
  async ({ alertId, action, notes }, { rejectWithValue }) => {
    try {
      const response = await alertsAPI.handleAlert(alertId, action, notes);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '处理告警失败');
    }
  }
);

/**
 * 异步Action：创建新告警
 * 
 * 创建新的健康告警，通常用于：
 * - 系统自动检测到的健康异常
 * - 医生手动创建的告警
 * - 患者报告的健康问题
 * 
 * @param {Object} alertData - 告警数据
 * @returns {Promise<Object>} 返回创建的告警或错误信息
 */
export const createAlert = createAsyncThunk(
  'alerts/createAlert',
  async (alertData, { rejectWithValue }) => {
    try {
      const response = await alertsAPI.createAlert(alertData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '创建告警失败');
    }
  }
);

// ============================================================================
// 初始状态定义
// ============================================================================

/**
 * 告警状态的初始值
 * 
 * 定义了告警模块所有状态字段的默认值
 * 确保应用启动时告警状态的一致性
 */
const initialState = {
  alerts: [],                    // 告警列表
  unhandledCount: 0,            // 未处理告警数量
  handledAlerts: [],            // 已处理告警列表
  loading: false,               // 加载状态标识
  error: null,                  // 错误信息
  filterStatus: 'all',          // 筛选状态：'all', 'unhandled', 'handled'
};

// ============================================================================
// Slice定义 - 状态更新逻辑
// ============================================================================

/**
 * 告警状态切片
 * 
 * 使用 Redux Toolkit 的 createSlice 创建
 * 包含同步reducer和异步action的处理逻辑
 */
const alertsSlice = createSlice({
  name: 'alerts',  // slice名称，用于调试和开发工具
  initialState,    // 初始状态
  reducers: {
    /**
     * 清除告警错误信息
     * 
     * 当用户执行新操作或错误被处理后，清除之前的错误状态
     */
    clearAlertsError: (state) => {
      state.error = null;
    },
    
    /**
     * 设置筛选状态
     * 
     * 更新告警列表的筛选条件，用于：
     * - 切换显示全部/未处理/已处理告警
     * - 根据用户需求过滤告警数据
     * 
     * @param {string} action.payload - 新的筛选状态
     */
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    
    /**
     * 标记告警为已读
     * 
     * 更新告警的已读状态，通常用于：
     * - 用户查看告警详情后标记为已读
     * - 减少未读告警的数量显示
     * 
     * @param {string} action.payload - 告警ID
     */
    markAlertAsRead: (state, action) => {
      const alertId = action.payload;
      const alert = state.alerts.find(alert => alert.id === alertId);
      if (alert) {
        alert.isRead = true;
      }
    },
    
    /**
     * 重置告警数据
     * 
     * 清空所有告警相关数据，通常用于：
     * - 用户登出时清理状态
     * - 应用重置时清空数据
     * - 测试和调试目的
     */
    resetAlertsData: (state) => {
      state.alerts = [];
      state.handledAlerts = [];
      state.unhandledCount = 0;
    },
    
    /**
     * 实时添加新告警
     * 
     * 用于WebSocket或推送通知的实时告警更新
     * 将新告警添加到列表顶部，并更新计数
     * 
     * @param {Object} action.payload - 新告警数据
     */
    addNewAlert: (state, action) => {
      // 将新告警添加到列表顶部
      state.alerts.unshift(action.payload);
      
      // 如果是未处理告警，增加计数
      if (action.payload.status === 'unhandled') {
        state.unhandledCount += 1;
      }
    },
  },
  
  // ============================================================================
  // 异步Action处理 - 使用extraReducers处理异步操作的状态变化
  // ============================================================================
  
  extraReducers: (builder) => {
    builder
      // ============================================================================
      // 获取告警列表相关状态处理
      // ============================================================================
      
      // 开始获取告警列表 - 设置加载状态
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 获取告警列表成功 - 更新告警数据和计数
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload.alerts;
        state.unhandledCount = action.payload.unhandledCount || 0;
      })
      // 获取告警列表失败 - 设置错误状态
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 处理告警相关状态处理
      // ============================================================================
      
      // 开始处理告警 - 设置加载状态
      .addCase(handleAlert.pending, (state) => {
        state.loading = true;
      })
      // 处理告警成功 - 更新告警状态和计数
      .addCase(handleAlert.fulfilled, (state, action) => {
        state.loading = false;
        
        // 更新告警状态
        const updatedAlert = action.payload;
        const alertIndex = state.alerts.findIndex(alert => alert.id === updatedAlert.id);
        
        if (alertIndex !== -1) {
          // 更新告警信息
          state.alerts[alertIndex] = updatedAlert;
          
          // 如果告警被处理，减少未处理计数
          if (updatedAlert.status === 'handled') {
            state.unhandledCount = Math.max(0, state.unhandledCount - 1);
          }
        }
      })
      // 处理告警失败 - 设置错误状态
      .addCase(handleAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 创建告警相关状态处理
      // ============================================================================
      
      // 创建告警成功 - 添加新告警到列表
      .addCase(createAlert.fulfilled, (state, action) => {
        const newAlert = action.payload;
        
        // 将新告警添加到列表顶部
        state.alerts.unshift(newAlert);
        
        // 如果是未处理告警，增加计数
        if (newAlert.status === 'unhandled') {
          state.unhandledCount += 1;
        }
      });
  },
});

// ============================================================================
// 导出配置
// ============================================================================

// 导出同步action creators，供组件调用
export const { 
  clearAlertsError,    // 清除错误信息
  setFilterStatus,      // 设置筛选状态
  markAlertAsRead,     // 标记告警为已读
  resetAlertsData,     // 重置告警数据
  addNewAlert          // 添加新告警
} = alertsSlice.actions;

// 导出reducer，供store使用
export default alertsSlice.reducer; 