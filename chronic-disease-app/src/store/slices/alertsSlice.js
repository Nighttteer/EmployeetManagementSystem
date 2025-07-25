import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { alertsAPI } from '../../services/api';

// 异步action：获取告警列表
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async ({ status = 'unhandled' }, { rejectWithValue }) => {
    try {
      const response = await alertsAPI.getAlerts(status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取告警列表失败');
    }
  }
);

// 异步action：处理告警
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

// 异步action：创建新告警
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

const initialState = {
  alerts: [],
  unhandledCount: 0,
  handledAlerts: [],
  loading: false,
  error: null,
  filterStatus: 'all', // 'all', 'unhandled', 'handled'
};

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    clearAlertsError: (state) => {
      state.error = null;
    },
    setFilterStatus: (state, action) => {
      state.filterStatus = action.payload;
    },
    markAlertAsRead: (state, action) => {
      const alertId = action.payload;
      const alert = state.alerts.find(alert => alert.id === alertId);
      if (alert) {
        alert.isRead = true;
      }
    },
    resetAlertsData: (state) => {
      state.alerts = [];
      state.handledAlerts = [];
      state.unhandledCount = 0;
    },
    // 实时添加新告警（用于WebSocket或推送通知）
    addNewAlert: (state, action) => {
      state.alerts.unshift(action.payload);
      if (action.payload.status === 'unhandled') {
        state.unhandledCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取告警列表
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload.alerts;
        state.unhandledCount = action.payload.unhandledCount || 0;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 处理告警
      .addCase(handleAlert.pending, (state) => {
        state.loading = true;
      })
      .addCase(handleAlert.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAlert = action.payload;
        const alertIndex = state.alerts.findIndex(alert => alert.id === updatedAlert.id);
        
        if (alertIndex !== -1) {
          state.alerts[alertIndex] = updatedAlert;
          // 如果告警状态从未处理变为已处理，减少未处理计数
          if (updatedAlert.status === 'handled') {
            state.unhandledCount = Math.max(0, state.unhandledCount - 1);
          }
        }
      })
      .addCase(handleAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 创建告警
      .addCase(createAlert.fulfilled, (state, action) => {
        state.alerts.unshift(action.payload);
        if (action.payload.status === 'unhandled') {
          state.unhandledCount += 1;
        }
      });
  },
});

export const { 
  clearAlertsError, 
  setFilterStatus, 
  markAlertAsRead, 
  resetAlertsData,
  addNewAlert 
} = alertsSlice.actions;

export default alertsSlice.reducer; 