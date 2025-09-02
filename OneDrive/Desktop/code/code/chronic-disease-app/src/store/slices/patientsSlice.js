/**
 * 患者管理状态切片 (Patients Management State Slice)
 * 
 * 管理医生端患者相关的所有状态，包括：
 * - 患者列表和搜索功能
 * - 患者详情和健康数据
 * - 医患关系管理
 * - 用药计划更新
 * - 医生建议发送
 * 
 * 使用 Redux Toolkit 的 createSlice 和 createAsyncThunk
 * 提供完整的患者管理状态解决方案
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { patientsAPI } from '../../services/api';

// ============================================================================
// 异步Action定义 - 处理患者管理相关的API调用
// ============================================================================

/**
 * 异步Action：获取患者列表
 * 
 * 从后端API获取医生管理的患者列表
 * 包括患者基本信息、状态和关系信息
 * 
 * @returns {Promise<Object>} 返回患者列表数据或错误信息
 */
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

/**
 * 异步Action：获取特定患者详情
 * 
 * 获取指定患者的详细信息，包括：
 * - 个人基本信息
 * - 健康数据历史
 * - 用药计划状态
 * - 医生建议记录
 * 
 * @param {string} patientId - 患者ID
 * @returns {Promise<Object>} 返回患者详情数据或错误信息
 */
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

/**
 * 异步Action：更新患者用药计划
 * 
 * 医生为患者更新或创建用药计划，包括：
 * - 药物选择和剂量设置
 * - 服药时间和频次
 * - 用药说明和注意事项
 * 
 * @param {Object} updateData - 更新数据
 * @param {string} updateData.patientId - 患者ID
 * @param {Object} updateData.medicationPlan - 新的用药计划
 * @returns {Promise<Object>} 返回更新结果或错误信息
 */
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

/**
 * 异步Action：发送建议给患者
 * 
 * 医生向患者发送健康建议或指导，包括：
 * - 健康建议内容
 * - 生活方式指导
 * - 注意事项提醒
 * 
 * @param {Object} adviceData - 建议数据
 * @param {string} adviceData.patientId - 患者ID
 * @param {Object} adviceData.advice - 建议内容
 * @returns {Promise<Object>} 返回发送结果或错误信息
 */
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

/**
 * 异步Action：创建新患者
 * 
 * 医生创建新的患者档案，包括：
 * - 基本信息录入
 * - 联系方式设置
 * - 初始健康评估
 * 
 * @param {Object} patientData - 患者数据
 * @returns {Promise<Object>} 返回创建的患者数据或错误信息
 */
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

/**
 * 异步Action：更新患者信息
 * 
 * 更新现有患者的信息，包括：
 * - 基本信息修改
 * - 联系方式更新
 * - 健康档案补充
 * 
 * @param {Object} updateData - 更新数据
 * @param {string} updateData.patientId - 患者ID
 * @param {Object} updateData.patientData - 更新的患者数据
 * @returns {Promise<Object>} 返回更新后的患者数据或错误信息
 */
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

/**
 * 异步Action：删除患者
 * 
 * 删除患者档案，通常用于：
 * - 患者转诊到其他医生
 * - 患者档案错误需要重建
 * - 患者主动要求删除
 * 
 * @param {string} patientId - 患者ID
 * @returns {Promise<string>} 返回删除的患者ID或错误信息
 */
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

/**
 * 异步Action：搜索未分配的患者
 * 
 * 搜索系统中尚未分配给医生的患者，用于：
 * - 新患者分配
 * - 患者转诊管理
 * - 医生工作量平衡
 * 
 * @param {string} searchQuery - 搜索关键词
 * @returns {Promise<Object>} 返回搜索结果或错误信息
 */
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

/**
 * 异步Action：绑定医患关系
 * 
 * 建立医生与患者的管理关系，包括：
 * - 分配患者给医生
 * - 设置管理权限
 * - 建立沟通渠道
 * 
 * @param {Object} bindData - 绑定数据
 * @param {string} bindData.patientId - 患者ID
 * @param {string} bindData.doctorId - 医生ID
 * @returns {Promise<Object>} 返回绑定结果或错误信息
 */
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

// ============================================================================
// 初始状态定义
// ============================================================================

/**
 * 患者管理状态的初始值
 * 
 * 定义了患者管理模块所有状态字段的默认值
 * 确保应用启动时患者管理状态的一致性
 */
const initialState = {
  patientsList: [],           // 患者列表
  unassignedPatients: [],     // 未分配的患者列表
  currentPatient: null,       // 当前选中的患者
  patientDetails: {},         // 患者详情缓存（按ID索引）
  searchQuery: '',            // 搜索关键词
  filteredPatients: [],       // 过滤后的患者列表
  loading: false,             // 加载状态标识
  error: null,                // 错误信息
};

// ============================================================================
// Slice定义 - 状态更新逻辑
// ============================================================================

/**
 * 患者管理状态切片
 * 
 * 使用 Redux Toolkit 的 createSlice 创建
 * 包含同步reducer和异步action的处理逻辑
 */
const patientsSlice = createSlice({
  name: 'patients',  // slice名称，用于调试和开发工具
  initialState,      // 初始状态
  reducers: {
    /**
     * 清除患者管理错误信息
     * 
     * 当用户执行新操作或错误被处理后，清除之前的错误状态
     */
    clearPatientsError: (state) => {
      state.error = null;
    },
    
    /**
     * 设置当前选中的患者
     * 
     * 更新当前选中的患者，用于：
     * - 患者详情页面显示
     * - 操作上下文设置
     * - UI状态同步
     * 
     * @param {Object} action.payload - 选中的患者对象
     */
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    
    /**
     * 设置搜索关键词并过滤患者列表
     * 
     * 根据搜索关键词实时过滤患者列表，支持：
     * - 姓名搜索
     * - 联系方式搜索
     * - 生物信息搜索
     * 
     * @param {string} action.payload - 搜索关键词
     */
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      
      // 确保 patientsList 是一个数组
      const patientsList = Array.isArray(state.patientsList) ? state.patientsList : [];
      
      // 根据搜索关键词过滤患者列表
      if (action.payload === '') {
        // 空关键词时显示全部患者
        state.filteredPatients = patientsList;
      } else {
        const query = action.payload.toLowerCase();
        // 支持多字段搜索
        state.filteredPatients = patientsList.filter(patient => 
          patient?.name?.toLowerCase().includes(query) ||
          patient?.bio?.toLowerCase().includes(query) ||
          patient?.phone?.toLowerCase().includes(query) ||
          patient?.email?.toLowerCase().includes(query)
        );
      }
    },
    
    /**
     * 更新患者健康数据
     * 
     * 将新的健康数据添加到指定患者的健康指标中，用于：
     * - 实时数据更新
     * - 健康趋势分析
     * - 告警检测
     * 
     * @param {Object} action.payload - 更新数据
     * @param {string} action.payload.patientId - 患者ID
     * @param {Object} action.payload.healthData - 健康数据
     */
    updatePatientHealthData: (state, action) => {
      const { patientId, healthData } = action.payload;
      if (state.patientDetails[patientId]) {
        // 确保健康指标数组存在
        const existingMetrics = Array.isArray(state.patientDetails[patientId].healthMetrics) 
          ? state.patientDetails[patientId].healthMetrics 
          : [];
        
        // 添加新的健康数据
        state.patientDetails[patientId].healthMetrics = [
          ...existingMetrics,
          healthData
        ];
      }
    },
    
    /**
     * 重置患者管理数据
     * 
     * 清空所有患者相关数据，通常用于：
     * - 用户登出时清理状态
     * - 应用重置时清空数据
     * - 测试和调试目的
     */
    resetPatientsData: (state) => {
      state.patientsList = [];
      state.currentPatient = null;
      state.patientDetails = {};
      state.filteredPatients = [];
    },
  },
  
  // ============================================================================
  // 异步Action处理 - 使用extraReducers处理异步操作的状态变化
  // ============================================================================
  
  extraReducers: (builder) => {
    builder
      // ============================================================================
      // 获取患者列表相关状态处理
      // ============================================================================
      
      // 开始获取患者列表 - 设置加载状态
      .addCase(fetchPatientsList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 获取患者列表成功 - 更新患者数据和过滤列表
      .addCase(fetchPatientsList.fulfilled, (state, action) => {
        state.loading = false;
        state.patientsList = action.payload;
        state.filteredPatients = action.payload;
      })
      // 获取患者列表失败 - 设置错误状态
      .addCase(fetchPatientsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 获取患者详情相关状态处理
      // ============================================================================
      
      // 开始获取患者详情 - 设置加载状态
      .addCase(fetchPatientDetails.pending, (state) => {
        state.loading = true;
      })
      // 获取患者详情成功 - 缓存患者详情数据
      .addCase(fetchPatientDetails.fulfilled, (state, action) => {
        state.loading = false;
        const patientId = action.payload.id;
        // 使用患者ID作为键缓存详情数据
        state.patientDetails[patientId] = action.payload;
      })
      // 获取患者详情失败 - 设置错误状态
      .addCase(fetchPatientDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 更新用药计划相关状态处理
      // ============================================================================
      
      // 更新用药计划成功 - 更新患者详情中的用药计划
      .addCase(updateMedicationPlan.fulfilled, (state, action) => {
        const { patientId, medicationPlan } = action.payload;
        if (state.patientDetails[patientId]) {
          state.patientDetails[patientId].medicationPlan = medicationPlan;
        }
      })
      
      // ============================================================================
      // 发送建议相关状态处理
      // ============================================================================
      
      // 发送建议成功 - 可以在这里更新发送建议的状态
      .addCase(sendAdviceToPatient.fulfilled, (state, action) => {
        // 可以在这里更新发送建议的状态
        // 例如：更新建议历史、通知状态等
      })
      
      // ============================================================================
      // 创建患者相关状态处理
      // ============================================================================
      
      // 开始创建患者 - 设置加载状态
      .addCase(createPatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 创建患者成功 - 将新患者添加到列表开头
      .addCase(createPatient.fulfilled, (state, action) => {
        state.loading = false;
        // 将新患者添加到列表开头，便于医生查看
        state.patientsList.unshift(action.payload);
        state.filteredPatients.unshift(action.payload);
      })
      // 创建患者失败 - 设置错误状态
      .addCase(createPatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 更新患者相关状态处理
      // ============================================================================
      
      // 开始更新患者 - 设置加载状态
      .addCase(updatePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 更新患者成功 - 同步更新所有相关列表
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.loading = false;
        const updatedPatient = action.payload;
        
        // 更新患者列表中的患者信息
        const index = state.patientsList.findIndex(p => p.id === updatedPatient.id);
        if (index !== -1) {
          state.patientsList[index] = updatedPatient;
        }
        
        // 更新过滤列表中的患者信息
        const filteredIndex = state.filteredPatients.findIndex(p => p.id === updatedPatient.id);
        if (filteredIndex !== -1) {
          state.filteredPatients[filteredIndex] = updatedPatient;
        }
        
        // 更新患者详情缓存
        state.patientDetails[updatedPatient.id] = updatedPatient;
      })
      // 更新患者失败 - 设置错误状态
      .addCase(updatePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 删除患者相关状态处理
      // ============================================================================
      
      // 开始删除患者 - 设置加载状态
      .addCase(deletePatient.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 删除患者成功 - 从所有相关列表中移除患者
      .addCase(deletePatient.fulfilled, (state, action) => {
        state.loading = false;
        const deletedPatientId = action.payload;
        
        // 从患者列表中移除
        state.patientsList = state.patientsList.filter(p => p.id !== deletedPatientId);
        state.filteredPatients = state.filteredPatients.filter(p => p.id !== deletedPatientId);
        
        // 清除患者详情缓存
        delete state.patientDetails[deletedPatientId];
        
        // 如果当前选中的患者被删除，清除选中状态
        if (state.currentPatient && state.currentPatient.id === deletedPatientId) {
          state.currentPatient = null;
        }
      })
      // 删除患者失败 - 设置错误状态
      .addCase(deletePatient.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 搜索未分配患者相关状态处理
      // ============================================================================
      
      // 开始搜索未分配患者 - 设置加载状态
      .addCase(searchUnassignedPatients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 搜索未分配患者成功 - 更新未分配患者列表
      .addCase(searchUnassignedPatients.fulfilled, (state, action) => {
        state.loading = false;
        state.unassignedPatients = action.payload;
      })
      // 搜索未分配患者失败 - 设置错误状态
      .addCase(searchUnassignedPatients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // ============================================================================
      // 绑定医患关系相关状态处理
      // ============================================================================
      
      // 开始绑定医患关系 - 设置加载状态
      .addCase(bindPatientToDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 绑定医患关系成功 - 更新患者分配状态
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
      // 绑定医患关系失败 - 设置错误状态
      .addCase(bindPatientToDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ============================================================================
// 导出配置
// ============================================================================

// 导出同步action creators，供组件调用
export const { 
  clearPatientsError,        // 清除错误信息
  setCurrentPatient,         // 设置当前患者
  setSearchQuery,            // 设置搜索关键词
  updatePatientHealthData,   // 更新患者健康数据
  resetPatientsData          // 重置患者数据
} = patientsSlice.actions;

// 导出reducer，供store使用
export default patientsSlice.reducer; 