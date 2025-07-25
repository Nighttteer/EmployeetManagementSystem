import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { patientsAPI } from '../../services/api';

// 异步action：获取患者列表
export const fetchPatientsList = createAsyncThunk(
  'patients/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.getPatientsList();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取患者列表失败');
    }
  }
);

// 异步action：获取特定患者详情
export const fetchPatientDetails = createAsyncThunk(
  'patients/fetchDetails',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.getPatientDetails(patientId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '获取患者详情失败');
    }
  }
);

// 异步action：更新患者用药计划
export const updateMedicationPlan = createAsyncThunk(
  'patients/updateMedication',
  async ({ patientId, medicationPlan }, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.updateMedicationPlan(patientId, medicationPlan);
      return { patientId, medicationPlan: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新用药计划失败');
    }
  }
);

// 异步action：发送建议给患者
export const sendAdviceToPatient = createAsyncThunk(
  'patients/sendAdvice',
  async ({ patientId, advice }, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.sendAdvice(patientId, advice);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '发送建议失败');
    }
  }
);

// 异步action：创建新患者
export const createPatient = createAsyncThunk(
  'patients/create',
  async (patientData, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.createPatient(patientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '创建患者失败');
    }
  }
);

// 异步action：更新患者信息
export const updatePatient = createAsyncThunk(
  'patients/update',
  async ({ patientId, patientData }, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.updatePatient(patientId, patientData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '更新患者失败');
    }
  }
);

// 异步action：删除患者
export const deletePatient = createAsyncThunk(
  'patients/delete',
  async (patientId, { rejectWithValue }) => {
    try {
      await patientsAPI.deletePatient(patientId);
      return patientId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '删除患者失败');
    }
  }
);

// 异步action：搜索未分配的患者
export const searchUnassignedPatients = createAsyncThunk(
  'patients/searchUnassigned',
  async (searchQuery, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.searchUnassignedPatients(searchQuery);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '搜索患者失败');
    }
  }
);

// 异步action：绑定医患关系
export const bindPatientToDoctor = createAsyncThunk(
  'patients/bindToDoctor',
  async ({ patientId, doctorId }, { rejectWithValue }) => {
    try {
      const response = await patientsAPI.bindPatientToDoctor(patientId, doctorId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '绑定患者失败');
    }
  }
);

const initialState = {
  patientsList: [],
  unassignedPatients: [],
  currentPatient: null,
  patientDetails: {},
  searchQuery: '',
  filteredPatients: [],
  loading: false,
  error: null,
};

const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearPatientsError: (state) => {
      state.error = null;
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      // 确保 patientsList 是一个数组
      const patientsList = Array.isArray(state.patientsList) ? state.patientsList : [];
      
      // 过滤患者列表
      if (action.payload === '') {
        state.filteredPatients = patientsList;
      } else {
        const query = action.payload.toLowerCase();
        state.filteredPatients = patientsList.filter(patient => 
          patient?.name?.toLowerCase().includes(query) ||
          patient?.bio?.toLowerCase().includes(query) ||
          patient?.phone?.toLowerCase().includes(query) ||
          patient?.email?.toLowerCase().includes(query)
        );
      }
    },
    updatePatientHealthData: (state, action) => {
      const { patientId, healthData } = action.payload;
      if (state.patientDetails[patientId]) {
        const existingMetrics = Array.isArray(state.patientDetails[patientId].healthMetrics) 
          ? state.patientDetails[patientId].healthMetrics 
          : [];
        state.patientDetails[patientId].healthMetrics = [
          ...existingMetrics,
          healthData
        ];
      }
    },
    resetPatientsData: (state) => {
      state.patientsList = [];
      state.currentPatient = null;
      state.patientDetails = {};
      state.filteredPatients = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取患者列表
      .addCase(fetchPatientsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatientsList.fulfilled, (state, action) => {
        state.loading = false;
        state.patientsList = action.payload;
        state.filteredPatients = action.payload;
      })
      .addCase(fetchPatientsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 获取患者详情
      .addCase(fetchPatientDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPatientDetails.fulfilled, (state, action) => {
        state.loading = false;
        const patientId = action.payload.id;
        state.patientDetails[patientId] = action.payload;
      })
      .addCase(fetchPatientDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新用药计划
      .addCase(updateMedicationPlan.fulfilled, (state, action) => {
        const { patientId, medicationPlan } = action.payload;
        if (state.patientDetails[patientId]) {
          state.patientDetails[patientId].medicationPlan = medicationPlan;
        }
      })
      // 发送建议
      .addCase(sendAdviceToPatient.fulfilled, (state, action) => {
        // 可以在这里更新发送建议的状态
      })
      // 创建患者
      .addCase(createPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.loading = false;
        // 将新患者添加到列表开头
        state.patientsList.unshift(action.payload);
        state.filteredPatients.unshift(action.payload);
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 更新患者
      .addCase(updatePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPatient = action.payload;
        // 更新患者列表中的患者信息
        const index = state.patientsList.findIndex(p => p.id === updatedPatient.id);
        if (index !== -1) {
          state.patientsList[index] = updatedPatient;
        }
        // 更新过滤列表
        const filteredIndex = state.filteredPatients.findIndex(p => p.id === updatedPatient.id);
        if (filteredIndex !== -1) {
          state.filteredPatients[filteredIndex] = updatedPatient;
        }
        // 更新患者详情
        state.patientDetails[updatedPatient.id] = updatedPatient;
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 删除患者
      .addCase(deletePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.loading = false;
        const deletedPatientId = action.payload;
        // 从患者列表中移除
        state.patientsList = state.patientsList.filter(p => p.id !== deletedPatientId);
        state.filteredPatients = state.filteredPatients.filter(p => p.id !== deletedPatientId);
        // 清除患者详情
        delete state.patientDetails[deletedPatientId];
        // 如果当前选中的患者被删除，清除选中状态
        if (state.currentPatient && state.currentPatient.id === deletedPatientId) {
          state.currentPatient = null;
        }
      })
      .addCase(deletePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 搜索未分配患者
      .addCase(searchUnassignedPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUnassignedPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.unassignedPatients = action.payload;
      })
      .addCase(searchUnassignedPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // 绑定医患关系
      .addCase(bindPatientToDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bindPatientToDoctor.fulfilled, (state, action) => {
        state.loading = false;
        // 将患者从未分配列表中移除
        const boundPatient = action.payload.patient;
        state.unassignedPatients = state.unassignedPatients.filter(
          p => p.id !== boundPatient.id
        );
        // 将患者添加到已分配列表中
        state.patientsList.unshift(boundPatient);
        state.filteredPatients.unshift(boundPatient);
      })
      .addCase(bindPatientToDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearPatientsError, 
  setCurrentPatient, 
  setSearchQuery, 
  updatePatientHealthData,
  resetPatientsData 
} = patientsSlice.actions;

export default patientsSlice.reducer; 