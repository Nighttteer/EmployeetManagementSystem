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

const initialState = {
  patientsList: [],
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
      // 过滤患者列表
      if (action.payload === '') {
        state.filteredPatients = state.patientsList;
      } else {
        state.filteredPatients = state.patientsList.filter(patient => 
          patient.name.toLowerCase().includes(action.payload.toLowerCase()) ||
          patient.diagnosis.toLowerCase().includes(action.payload.toLowerCase())
        );
      }
    },
    updatePatientHealthData: (state, action) => {
      const { patientId, healthData } = action.payload;
      if (state.patientDetails[patientId]) {
        state.patientDetails[patientId].healthMetrics = [
          ...state.patientDetails[patientId].healthMetrics,
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