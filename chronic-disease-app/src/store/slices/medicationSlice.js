/**
 * 用药状态管理切片 (Medication State Slice)
 * 
 * 管理用药相关的所有状态，包括：
 * - 今日用药计划和状态
 * - 用药计划列表和历史记录
 * - 服药记录和依从性统计
 * - 用药提醒设置和偏好
 * - 操作状态和错误处理
 * 
 * 使用 Redux Toolkit 的 createSlice 和 createAsyncThunk
 * 提供完整的用药管理状态解决方案
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import medicationReminderService from '../../services/medicationReminder';

// ============================================================================
// 异步Action定义 - 处理用药相关的API调用和本地服务
// ============================================================================

/**
 * 异步Action：获取今日用药计划
 * 
 * 从用药提醒服务获取当前日期有效的用药计划
 * 包括今日需要服用的所有药物信息
 * 
 * @returns {Promise<Array>} 返回今日用药计划列表或错误信息
 */
export const fetchTodayMedications = createAsyncThunk(
  'medication/fetchTodayMedications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await medicationReminderService.getTodayMedications();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || '获取今日用药失败');
    }
  }
);

/**
 * 异步Action：获取用药计划列表
 * 
 * 获取用户的所有用药计划，包括：
 * - 当前有效的用药计划
 * - 已完成的用药计划
 * - 暂停或取消的用药计划
 * 
 * @returns {Promise<Array>} 返回用药计划列表或错误信息
 */
export const fetchMedicationPlans = createAsyncThunk(
  'medication/fetchMedicationPlans',
  async (_, { rejectWithValue }) => {
    try {
      const response = await medicationReminderService.getMedicationPlans();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || '获取用药计划失败');
    }
  }
);

/**
 * 异步Action：获取用药历史记录
 * 
 * 分页获取用户的用药历史数据，包括：
 * - 服药记录和跳过记录
 * - 用药依从性数据
 * - 历史趋势分析
 * 
 * @param {number} [page=1] - 页码，支持分页查询
 * @returns {Promise<Object>} 返回用药历史数据或错误信息
 */
export const fetchMedicationHistory = createAsyncThunk(
  'medication/fetchMedicationHistory',
  async (page = 1, { rejectWithValue }) => {
    try {
      const response = await medicationReminderService.getMedicationHistory(page);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || '获取用药历史失败');
    }
  }
);

/**
 * 异步Action：记录服药
 * 
 * 记录用户已服用的药物信息，包括：
 * - 服药时间和剂量
 * - 备注信息
 * - 依从性统计更新
 * 
 * @param {Object} medicationData - 服药数据
 * @param {string} medicationData.medicationId - 用药计划ID
 * @param {string} [medicationData.dosage] - 实际服用的剂量
 * @param {string} [medicationData.notes] - 备注信息
 * @returns {Promise<Object>} 返回记录结果或错误信息
 */
export const recordMedicationTaken = createAsyncThunk(
  'medication/recordMedicationTaken',
  async ({ medicationId, dosage, notes }, { rejectWithValue }) => {
    try {
      const response = await medicationReminderService.recordMedicationTaken(
        medicationId,
        dosage,
        notes
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || '记录服药失败');
    }
  }
);

/**
 * 异步Action：跳过服药
 * 
 * 记录用户跳过的药物信息，包括：
 * - 跳过原因和时间
 * - 依从性统计更新
 * - 医生通知（如需要）
 * 
 * @param {Object} skipData - 跳过服药数据
 * @param {string} skipData.medicationId - 用药计划ID
 * @param {string} [skipData.reason] - 跳过原因
 * @returns {Promise<Object>} 返回跳过记录结果或错误信息
 */
export const skipMedication = createAsyncThunk(
  'medication/skipMedication',
  async ({ medicationId, reason }, { rejectWithValue }) => {
    try {
      const response = await medicationReminderService.skipMedication(
        medicationId,
        reason
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || '跳过服药失败');
    }
  }
);

/**
 * 异步Action：安排用药提醒
 * 
 * 为特定用药计划创建本地提醒通知，包括：
 * - 定时提醒设置
 * - 提醒音和震动配置
 * - 重复提醒规则
 * 
 * @param {Object} medication - 用药信息对象
 * @returns {Promise<Array>} 返回已安排的提醒列表或错误信息
 */
export const scheduleMedicationReminder = createAsyncThunk(
  'medication/scheduleMedicationReminder',
  async (medication, { rejectWithValue }) => {
    try {
      const response = await medicationReminderService.scheduleMedicationReminder(medication);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || '安排用药提醒失败');
    }
  }
);

/**
 * 异步Action：获取依从性统计
 * 
 * 获取用户的用药依从性数据，包括：
 * - 按时服药率
 * - 漏服和跳过统计
 * - 依从性趋势分析
 * 
 * @returns {Promise<Object>} 返回依从性统计数据或错误信息
 */
export const fetchComplianceStats = createAsyncThunk(
  'medication/fetchComplianceStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await medicationReminderService.getComplianceStats();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || '获取依从性统计失败');
    }
  }
);

// ============================================================================
// 初始状态定义
// ============================================================================

/**
 * 用药状态的初始值
 * 
 * 定义了用药模块所有状态字段的默认值
 * 确保应用启动时用药状态的一致性
 */
const initialState = {
  // ============================================================================
  // 今日用药相关状态
  // ============================================================================
  todayMedications: [],              // 今日用药计划列表
  todayMedicationsLoading: false,    // 今日用药加载状态
  todayMedicationsError: null,       // 今日用药错误信息

  // ============================================================================
  // 用药计划相关状态
  // ============================================================================
  medicationPlans: [],               // 用药计划列表
  medicationPlansLoading: false,     // 用药计划加载状态
  medicationPlansError: null,        // 用药计划错误信息

  // ============================================================================
  // 用药历史相关状态
  // ============================================================================
  medicationHistory: [],             // 用药历史记录列表
  medicationHistoryLoading: false,   // 用药历史加载状态
  medicationHistoryError: null,      // 用药历史错误信息
  medicationHistoryPage: 1,          // 当前页码
  medicationHistoryHasMore: true,    // 是否还有更多数据

  // ============================================================================
  // 依从性统计相关状态
  // ============================================================================
  complianceStats: null,             // 依从性统计数据
  complianceStatsLoading: false,     // 依从性统计加载状态
  complianceStatsError: null,        // 依从性统计错误信息

  // ============================================================================
  // 提醒设置相关状态
  // ============================================================================
  reminderPreferences: {
    enabled: true,                   // 是否启用提醒
    sound: true,                     // 是否播放提示音
    vibration: true,                 // 是否震动提醒
    advanceMinutes: 5,               // 提前提醒时间（分钟）
    repeatInterval: 15,              // 重复提醒间隔（分钟）
    quietHours: {                    // 静音时段设置
      enabled: false,                // 是否启用静音时段
      startTime: '22:00',            // 静音开始时间
      endTime: '08:00',              // 静音结束时间
    },
  },

  // ============================================================================
  // 操作状态相关
  // ============================================================================
  recordingMedication: false,        // 正在记录服药
  skippingMedication: false,         // 正在跳过服药
  schedulingReminder: false,         // 正在安排提醒
};

// ============================================================================
// Slice定义 - 状态更新逻辑
// ============================================================================

/**
 * 用药状态切片
 * 
 * 使用 Redux Toolkit 的 createSlice 创建
 * 包含同步reducer和异步action的处理逻辑
 */
const medicationSlice = createSlice({
  name: 'medication',  // slice名称，用于调试和开发工具
  initialState,        // 初始状态
  reducers: {
    /**
     * 清除所有错误信息
     * 
     * 当用户执行新操作或错误被处理后，清除所有模块的错误状态
     */
    clearErrors: (state) => {
      state.todayMedicationsError = null;
      state.medicationPlansError = null;
      state.medicationHistoryError = null;
      state.complianceStatsError = null;
    },

    /**
     * 更新今日用药状态
     * 
     * 更新特定药物的服用状态，用于：
     * - 标记药物为已服用
     * - 更新服药时间
     * - 同步UI显示状态
     * 
     * @param {Object} action.payload - 更新数据
     * @param {string} action.payload.medicationId - 用药计划ID
     * @param {string} action.payload.status - 新状态
     */
    updateTodayMedicationStatus: (state, action) => {
      const { medicationId, status } = action.payload;
      const medication = state.todayMedications.find(m => m.id === medicationId);
      if (medication) {
        medication.status = status;
        if (status === 'taken') {
          medication.taken = true;
        }
      }
    },

    /**
     * 更新提醒偏好设置
     * 
     * 更新用户的用药提醒偏好，包括：
     * - 提醒开关设置
     * - 声音和震动偏好
     * - 静音时段配置
     * 
     * @param {Object} action.payload - 新的偏好设置
     */
    updateReminderPreferences: (state, action) => {
      state.reminderPreferences = {
        ...state.reminderPreferences,
        ...action.payload,
      };
    },

    /**
     * 重置用药状态
     * 
     * 清空所有用药相关数据，通常用于：
     * - 用户登出时清理状态
     * - 应用重置时清空数据
     * - 测试和调试目的
     */
    resetMedicationState: (state) => {
      return initialState;
    },
  },
  
  // ============================================================================
  // 异步Action处理 - 使用extraReducers处理异步操作的状态变化
  // ============================================================================
  
  extraReducers: (builder) => {
    // ============================================================================
    // 获取今日用药相关状态处理
    // ============================================================================
    
    // 开始获取今日用药 - 设置加载状态
    builder
      .addCase(fetchTodayMedications.pending, (state) => {
        state.todayMedicationsLoading = true;
        state.todayMedicationsError = null;
      })
      // 获取今日用药成功 - 更新用药数据
      .addCase(fetchTodayMedications.fulfilled, (state, action) => {
        state.todayMedicationsLoading = false;
        state.todayMedications = action.payload;
      })
      // 获取今日用药失败 - 设置错误状态
      .addCase(fetchTodayMedications.rejected, (state, action) => {
        state.todayMedicationsLoading = false;
        state.todayMedicationsError = action.payload;
      });

    // ============================================================================
    // 获取用药计划相关状态处理
    // ============================================================================
    
    // 开始获取用药计划 - 设置加载状态
    builder
      .addCase(fetchMedicationPlans.pending, (state) => {
        state.medicationPlansLoading = true;
        state.medicationPlansError = null;
      })
      // 获取用药计划成功 - 更新计划数据
      .addCase(fetchMedicationPlans.fulfilled, (state, action) => {
        state.medicationPlansLoading = false;
        state.medicationPlans = action.payload;
      })
      // 获取用药计划失败 - 设置错误状态
      .addCase(fetchMedicationPlans.rejected, (state, action) => {
        state.medicationPlansLoading = false;
        state.medicationPlansError = action.payload;
      });

    // ============================================================================
    // 获取用药历史相关状态处理
    // ============================================================================
    
    // 开始获取用药历史 - 设置加载状态
    builder
      .addCase(fetchMedicationHistory.pending, (state) => {
        state.medicationHistoryLoading = true;
        state.medicationHistoryError = null;
      })
      // 获取用药历史成功 - 处理分页数据
      .addCase(fetchMedicationHistory.fulfilled, (state, action) => {
        state.medicationHistoryLoading = false;
        
        if (action.meta.arg === 1) {
          // 第一页，替换数据
          state.medicationHistory = action.payload.results || action.payload;
        } else {
          // 后续页面，追加数据
          state.medicationHistory = [
            ...state.medicationHistory,
            ...(action.payload.results || action.payload),
          ];
        }
        
        // 更新分页信息
        state.medicationHistoryPage = action.meta.arg || 1;
        state.medicationHistoryHasMore = !!action.payload.next;
      })
      // 获取用药历史失败 - 设置错误状态
      .addCase(fetchMedicationHistory.rejected, (state, action) => {
        state.medicationHistoryLoading = false;
        state.medicationHistoryError = action.payload;
      });

    // ============================================================================
    // 记录服药相关状态处理
    // ============================================================================
    
    // 开始记录服药 - 设置操作状态
    builder
      .addCase(recordMedicationTaken.pending, (state) => {
        state.recordingMedication = true;
      })
      // 记录服药成功 - 更新今日用药状态
      .addCase(recordMedicationTaken.fulfilled, (state, action) => {
        state.recordingMedication = false;
        
        // 更新今日用药状态
        const { medication_id } = action.payload;
        const medication = state.todayMedications.find(m => m.id === medication_id);
        if (medication) {
          medication.status = 'taken';
          medication.taken = true;
        }
      })
      // 记录服药失败 - 清除操作状态
      .addCase(recordMedicationTaken.rejected, (state) => {
        state.recordingMedication = false;
      });

    // ============================================================================
    // 跳过服药相关状态处理
    // ============================================================================
    
    // 开始跳过服药 - 设置操作状态
    builder
      .addCase(skipMedication.pending, (state) => {
        state.skippingMedication = true;
      })
      // 跳过服药成功 - 更新今日用药状态
      .addCase(skipMedication.fulfilled, (state, action) => {
        state.skippingMedication = false;
        
        // 更新今日用药状态
        const { medication_id } = action.payload;
        const medication = state.todayMedications.find(m => m.id === medication_id);
        if (medication) {
          medication.status = 'skipped';
        }
      })
      // 跳过服药失败 - 清除操作状态
      .addCase(skipMedication.rejected, (state) => {
        state.skippingMedication = false;
      });

    // ============================================================================
    // 安排用药提醒相关状态处理
    // ============================================================================
    
    // 开始安排提醒 - 设置操作状态
    builder
      .addCase(scheduleMedicationReminder.pending, (state) => {
        state.schedulingReminder = true;
      })
      // 安排提醒成功 - 清除操作状态
      .addCase(scheduleMedicationReminder.fulfilled, (state) => {
        state.schedulingReminder = false;
      })
      // 安排提醒失败 - 清除操作状态
      .addCase(scheduleMedicationReminder.rejected, (state) => {
        state.schedulingReminder = false;
      });

    // ============================================================================
    // 获取依从性统计相关状态处理
    // ============================================================================
    
    // 开始获取统计 - 设置加载状态
    builder
      .addCase(fetchComplianceStats.pending, (state) => {
        state.complianceStatsLoading = true;
        state.complianceStatsError = null;
      })
      // 获取统计成功 - 更新统计数据
      .addCase(fetchComplianceStats.fulfilled, (state, action) => {
        state.complianceStatsLoading = false;
        state.complianceStats = action.payload;
      })
      // 获取统计失败 - 设置错误状态
      .addCase(fetchComplianceStats.rejected, (state, action) => {
        state.complianceStatsLoading = false;
        state.complianceStatsError = action.payload;
      });
  },
});

// ============================================================================
// 导出配置
// ============================================================================

// 导出同步action creators，供组件调用
export const {
  clearErrors,                    // 清除所有错误
  updateTodayMedicationStatus,    // 更新今日用药状态
  updateReminderPreferences,      // 更新提醒偏好
  resetMedicationState,           // 重置用药状态
} = medicationSlice.actions;

// ============================================================================
// 选择器函数 - 供组件获取状态
// ============================================================================

// 今日用药相关选择器
export const selectTodayMedications = (state) => state.medication.todayMedications;
export const selectTodayMedicationsLoading = (state) => state.medication.todayMedicationsLoading;
export const selectTodayMedicationsError = (state) => state.medication.todayMedicationsError;

// 用药计划相关选择器
export const selectMedicationPlans = (state) => state.medication.medicationPlans;
export const selectMedicationPlansLoading = (state) => state.medication.medicationPlansLoading;
export const selectMedicationPlansError = (state) => state.medication.medicationPlansError;

// 用药历史相关选择器
export const selectMedicationHistory = (state) => state.medication.medicationHistory;
export const selectMedicationHistoryLoading = (state) => state.medication.medicationHistoryLoading;
export const selectMedicationHistoryError = (state) => state.medication.medicationHistoryError;
export const selectMedicationHistoryHasMore = (state) => state.medication.medicationHistoryHasMore;

// 依从性统计相关选择器
export const selectComplianceStats = (state) => state.medication.complianceStats;
export const selectComplianceStatsLoading = (state) => state.medication.complianceStatsLoading;
export const selectComplianceStatsError = (state) => state.medication.complianceStatsError;

// 提醒偏好选择器
export const selectReminderPreferences = (state) => state.medication.reminderPreferences;

// 操作状态选择器
export const selectRecordingMedication = (state) => state.medication.recordingMedication;
export const selectSkippingMedication = (state) => state.medication.skippingMedication;
export const selectSchedulingReminder = (state) => state.medication.schedulingReminder;

// 导出reducer，供store使用
export default medicationSlice.reducer; 