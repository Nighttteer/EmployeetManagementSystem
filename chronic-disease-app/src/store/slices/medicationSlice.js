import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import medicationReminderService from '../../services/medicationReminder';

// 异步thunk
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

const initialState = {
  // 今日用药
  todayMedications: [],
  todayMedicationsLoading: false,
  todayMedicationsError: null,

  // 用药计划
  medicationPlans: [],
  medicationPlansLoading: false,
  medicationPlansError: null,

  // 用药历史
  medicationHistory: [],
  medicationHistoryLoading: false,
  medicationHistoryError: null,
  medicationHistoryPage: 1,
  medicationHistoryHasMore: true,

  // 依从性统计
  complianceStats: null,
  complianceStatsLoading: false,
  complianceStatsError: null,

  // 提醒设置
  reminderPreferences: {
    enabled: true,
    sound: true,
    vibration: true,
    advanceMinutes: 5,
    repeatInterval: 15,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  },

  // 操作状态
  recordingMedication: false,
  skippingMedication: false,
  schedulingReminder: false,
};

const medicationSlice = createSlice({
  name: 'medication',
  initialState,
  reducers: {
    // 清除错误
    clearErrors: (state) => {
      state.todayMedicationsError = null;
      state.medicationPlansError = null;
      state.medicationHistoryError = null;
      state.complianceStatsError = null;
    },

    // 更新今日用药状态
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

    // 更新提醒偏好
    updateReminderPreferences: (state, action) => {
      state.reminderPreferences = {
        ...state.reminderPreferences,
        ...action.payload,
      };
    },

    // 重置状态
    resetMedicationState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // fetchTodayMedications
    builder
      .addCase(fetchTodayMedications.pending, (state) => {
        state.todayMedicationsLoading = true;
        state.todayMedicationsError = null;
      })
      .addCase(fetchTodayMedications.fulfilled, (state, action) => {
        state.todayMedicationsLoading = false;
        state.todayMedications = action.payload;
      })
      .addCase(fetchTodayMedications.rejected, (state, action) => {
        state.todayMedicationsLoading = false;
        state.todayMedicationsError = action.payload;
      });

    // fetchMedicationPlans
    builder
      .addCase(fetchMedicationPlans.pending, (state) => {
        state.medicationPlansLoading = true;
        state.medicationPlansError = null;
      })
      .addCase(fetchMedicationPlans.fulfilled, (state, action) => {
        state.medicationPlansLoading = false;
        state.medicationPlans = action.payload;
      })
      .addCase(fetchMedicationPlans.rejected, (state, action) => {
        state.medicationPlansLoading = false;
        state.medicationPlansError = action.payload;
      });

    // fetchMedicationHistory
    builder
      .addCase(fetchMedicationHistory.pending, (state) => {
        state.medicationHistoryLoading = true;
        state.medicationHistoryError = null;
      })
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
        state.medicationHistoryPage = action.meta.arg || 1;
        state.medicationHistoryHasMore = !!action.payload.next;
      })
      .addCase(fetchMedicationHistory.rejected, (state, action) => {
        state.medicationHistoryLoading = false;
        state.medicationHistoryError = action.payload;
      });

    // recordMedicationTaken
    builder
      .addCase(recordMedicationTaken.pending, (state) => {
        state.recordingMedication = true;
      })
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
      .addCase(recordMedicationTaken.rejected, (state) => {
        state.recordingMedication = false;
      });

    // skipMedication
    builder
      .addCase(skipMedication.pending, (state) => {
        state.skippingMedication = true;
      })
      .addCase(skipMedication.fulfilled, (state, action) => {
        state.skippingMedication = false;
        // 更新今日用药状态
        const { medication_id } = action.payload;
        const medication = state.todayMedications.find(m => m.id === medication_id);
        if (medication) {
          medication.status = 'skipped';
        }
      })
      .addCase(skipMedication.rejected, (state) => {
        state.skippingMedication = false;
      });

    // scheduleMedicationReminder
    builder
      .addCase(scheduleMedicationReminder.pending, (state) => {
        state.schedulingReminder = true;
      })
      .addCase(scheduleMedicationReminder.fulfilled, (state) => {
        state.schedulingReminder = false;
      })
      .addCase(scheduleMedicationReminder.rejected, (state) => {
        state.schedulingReminder = false;
      });

    // fetchComplianceStats
    builder
      .addCase(fetchComplianceStats.pending, (state) => {
        state.complianceStatsLoading = true;
        state.complianceStatsError = null;
      })
      .addCase(fetchComplianceStats.fulfilled, (state, action) => {
        state.complianceStatsLoading = false;
        state.complianceStats = action.payload;
      })
      .addCase(fetchComplianceStats.rejected, (state, action) => {
        state.complianceStatsLoading = false;
        state.complianceStatsError = action.payload;
      });
  },
});

export const {
  clearErrors,
  updateTodayMedicationStatus,
  updateReminderPreferences,
  resetMedicationState,
} = medicationSlice.actions;

// 选择器
export const selectTodayMedications = (state) => state.medication.todayMedications;
export const selectTodayMedicationsLoading = (state) => state.medication.todayMedicationsLoading;
export const selectTodayMedicationsError = (state) => state.medication.todayMedicationsError;

export const selectMedicationPlans = (state) => state.medication.medicationPlans;
export const selectMedicationPlansLoading = (state) => state.medication.medicationPlansLoading;
export const selectMedicationPlansError = (state) => state.medication.medicationPlansError;

export const selectMedicationHistory = (state) => state.medication.medicationHistory;
export const selectMedicationHistoryLoading = (state) => state.medication.medicationHistoryLoading;
export const selectMedicationHistoryError = (state) => state.medication.medicationHistoryError;
export const selectMedicationHistoryHasMore = (state) => state.medication.medicationHistoryHasMore;

export const selectComplianceStats = (state) => state.medication.complianceStats;
export const selectComplianceStatsLoading = (state) => state.medication.complianceStatsLoading;
export const selectComplianceStatsError = (state) => state.medication.complianceStatsError;

export const selectReminderPreferences = (state) => state.medication.reminderPreferences;

export const selectRecordingMedication = (state) => state.medication.recordingMedication;
export const selectSkippingMedication = (state) => state.medication.skippingMedication;
export const selectSchedulingReminder = (state) => state.medication.schedulingReminder;

export default medicationSlice.reducer; 