import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// ============================================================================
// 基础API配置 - 根据你的运行环境选择正确的配置
// ============================================================================

// 🔧 请根据你的情况选择一个配置，注释掉其他的：

// 1. iOS模拟器
// const BASE_URL = 'http://localhost:8000/api';

// 2. Android模拟器
// const BASE_URL = 'http://10.0.2.2:8000/api';

// 3. 实体设备或Expo Go（当前配置）
const BASE_URL = 'http://192.168.2.47:8000/api';

// 4. Web浏览器/localhost
// const BASE_URL = 'http://localhost:8000/api';
//const BASE_URL = 'http://10.56.205.246:8000/api';

// ✅ 已配置为你的实际IP地址（热点网络）
//const BASE_URL = 'http://172.20.10.3:8000/api';

// 导出API基础URL供其他组件使用
export const API_BASE_URL = BASE_URL;

// 原来的Web浏览器配置
// const BASE_URL = 'http://127.0.0.1:8000/api';

// ============================================================================
// 创建axios实例 - 配置基础请求设置
// ============================================================================
const apiClient = axios.create({
  baseURL: BASE_URL,        // 设置基础URL
  timeout: 10000,           // 请求超时时间：10秒
  headers: {
    'Content-Type': 'application/json',  // 设置默认请求头为JSON格式
  },
});

// ============================================================================
// 请求拦截器 - 在发送请求前自动添加认证token
// ============================================================================
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // 从安全存储中获取认证token
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // 如果token存在，添加到请求头中
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('获取认证token失败:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// 响应拦截器 - 处理通用错误响应
// ============================================================================
apiClient.interceptors.response.use(
  (response) => {
    // 成功响应直接返回
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效时的处理
      // 清除本地存储的认证信息
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userRole');
      // 这里可以添加导航到登录页的逻辑
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// 认证相关API - 处理用户登录、注册、token管理等
// ============================================================================
export const authAPI = {
  /**
   * 用户登录
   * @param {string} phone - 手机号码
   * @param {string} password - 密码
   * @param {string} role - 用户角色（医生/患者）
   * @returns {Promise} 登录响应
   */
  login: (phone, password, role) => {
    return apiClient.post('/auth/login/', {
      phone,
      password,
      role,  // 修正参数名：使用role而不是user_type
    });
  },

  /**
   * 验证token有效性
   * @param {string} token - 要验证的token
   * @returns {Promise} 验证结果
   */
  validateToken: (token) => {
    return apiClient.get('/auth/token/verify/');
  },

  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise} 注册响应
   */
  register: (userData) => {
    return apiClient.post('/auth/register/', userData);
  },

  /**
   * 带SMS验证的用户注册
   * @param {Object} userData - 用户注册数据
   * @returns {Promise} 注册响应
   */
  registerWithSMS: (userData) => {
    return apiClient.post('/auth/register/sms/', userData);
  },

  /**
   * 发送SMS验证码
   * @param {Object} phoneData - 包含手机号的数据
   * @returns {Promise} 发送结果
   */
  sendSMSCode: (phoneData) => {
    return apiClient.post('/auth/sms/send/', phoneData);
  },

  /**
   * 验证SMS验证码
   * @param {Object} verificationData - 验证数据
   * @returns {Promise} 验证结果
   */
  verifySMSCode: (verificationData) => {
    return apiClient.post('/auth/sms/verify/', verificationData);
  },

  /**
   * 刷新token
   * @param {string} refreshToken - 刷新token
   * @returns {Promise} 新的token
   */
  refreshToken: (refreshToken) => {
    return apiClient.post('/auth/refresh/', {
      refresh: refreshToken,
    });
  },
};

// ============================================================================
// 用户相关API - 处理用户个人资料、健康数据等
// ============================================================================
export const userAPI = {
  /**
   * 获取用户个人资料
   * @returns {Promise} 用户资料数据
   */
  getProfile: () => {
    return apiClient.get('/user/profile/');
  },

  /**
   * 更新用户资料
   * @param {Object} profileData - 要更新的资料数据
   * @returns {Promise} 更新结果
   */
  updateProfile: (profileData) => {
    return apiClient.patch('/user/profile/', profileData);
  },

  /**
   * 提交健康指标
   * @param {Object} metricsData - 健康指标数据
   * @returns {Promise} 提交结果
   */
  submitHealthMetrics: (metricsData) => {
    return apiClient.post('/user/health-metrics/', metricsData);
  },

  /**
   * 获取健康趋势数据
   * @param {string} period - 时间周期（如：week, month, year）
   * @returns {Promise} 健康趋势数据
   */
  getHealthTrends: (period) => {
    return apiClient.get(`/user/health-trends/?period=${period}`);
  },

  /**
   * 获取用药计划
   * @returns {Promise} 用药计划数据
   */
  getMedicationPlan: () => {
    return apiClient.get('/user/medication-plan/');
  },

  /**
   * 确认服药
   * @param {string} medicationId - 药品ID
   * @param {string} timestamp - 服药时间戳
   * @returns {Promise} 确认结果
   */
  confirmMedication: (medicationId, timestamp) => {
    return apiClient.post('/user/medication-confirmation/', {
      medication_id: medicationId,
      timestamp,
    });
  },
};

// ============================================================================
// 患者管理相关API (医生端) - 处理医生对患者的管理操作
// ============================================================================
export const patientsAPI = {
  /**
   * 获取患者列表
   * @returns {Promise} 患者列表数据（自动处理分页）
   */
  getPatientsList: () => {
    return apiClient.get('/auth/patients/').then(response => {
      // 处理分页响应，提取 results 字段
      if (response.data && typeof response.data === 'object' && response.data.results) {
        return { ...response, data: response.data.results };
      }
      return response;
    });
  },

  /**
   * 获取指定患者的医生建议列表
   * @param {string} patientId - 患者ID
   * @returns {Promise} 建议列表
   */
  getPatientAdvice: (patientId) => {
    return apiClient.get(`/health/patients/${patientId}/advice/`);
  },

  /**
   * 医生为患者新增建议
   * @param {string} patientId - 患者ID
   * @param {Object} advice - 建议内容
   * @returns {Promise} 创建结果
   */
  createPatientAdvice: (patientId, advice) => {
    return apiClient.post(`/health/patients/${patientId}/advice/`, advice);
  },

  /**
   * 更新建议（仅作者医生）
   * @param {string} adviceId - 建议ID
   * @param {Object} updates - 更新内容
   * @returns {Promise} 更新结果
   */
  updatePatientAdvice: (adviceId, updates) => {
    return apiClient.patch(`/health/advice/${adviceId}/`, updates);
  },

  /**
   * 删除建议（仅作者医生）
   * @param {string} adviceId - 建议ID
   * @returns {Promise} 删除结果
   */
  deletePatientAdvice: (adviceId) => {
    return apiClient.delete(`/health/advice/${adviceId}/`);
  },

  /**
   * 获取特定患者详情
   * @param {string} patientId - 患者ID
   * @returns {Promise} 患者详细信息
   */
  getPatientDetails: (patientId) => {
    return apiClient.get(`/accounts/patients/${patientId}/update/`);
  },

  /**
   * 创建新患者
   * @param {Object} patientData - 患者数据
   * @returns {Promise} 创建结果
   */
  createPatient: (patientData) => {
    return apiClient.post('/auth/patients/create/', patientData);
  },

  /**
   * 更新患者信息
   * @param {string} patientId - 患者ID
   * @param {Object} patientData - 更新的患者数据
   * @returns {Promise} 更新结果
   */
  updatePatient: (patientId, patientData) => {
    return apiClient.put(`/accounts/patients/${patientId}/update/`, patientData);
  },

  /**
   * 删除患者
   * @param {string} patientId - 患者ID
   * @returns {Promise} 删除结果
   */
  deletePatient: (patientId) => {
    return apiClient.delete(`/auth/patients/${patientId}/`);
  },

  /**
   * 更新患者用药计划
   * @param {string} patientId - 患者ID
   * @param {Object} medicationPlan - 用药计划数据
   * @returns {Promise} 更新结果
   */
  updateMedicationPlan: (patientId, medicationPlan) => {
    return apiClient.put(`/auth/patients/${patientId}/medication-plan/`, {
      medication_plan: medicationPlan,
    });
  },

  /**
   * 发送建议给患者
   * @param {string} patientId - 患者ID
   * @param {Object} advice - 建议内容
   * @returns {Promise} 发送结果
   */
  sendAdvice: (patientId, advice) => {
    return apiClient.post(`/health/patients/${patientId}/advice/`, advice);
  },

  /**
   * 获取患者健康历史
   * @param {string} patientId - 患者ID
   * @param {string} period - 时间周期
   * @returns {Promise} 健康历史数据
   */
  getPatientHealthHistory: (patientId, period) => {
    return apiClient.get(`/auth/patients/${patientId}/health-history/?period=${period}`);
  },

  /**
   * 搜索未分配的患者
   * @param {string} searchQuery - 搜索关键词
   * @returns {Promise} 搜索结果（自动处理分页）
   */
  searchUnassignedPatients: (searchQuery) => {
    return apiClient.get('/auth/patients/unassigned/', {
      params: {
        search: searchQuery,
      },
    }).then(response => {
      // 处理分页响应，提取 results 字段
      if (response.data && typeof response.data === 'object' && response.data.results) {
        return { ...response, data: response.data.results };
      }
      return response;
    });
  },

  /**
   * 绑定医患关系
   * @param {string} patientId - 患者ID
   * @param {string} doctorId - 医生ID
   * @returns {Promise} 绑定结果
   */
  bindPatientToDoctor: (patientId, doctorId) => {
    return apiClient.post('/auth/patients/bind-doctor/', {
      patient_id: patientId,
      doctor_id: doctorId,
    });
  },

  /**
   * 解绑医患关系
   * @param {string} patientId - 患者ID
   * @param {string} doctorId - 医生ID
   * @returns {Promise} 解绑结果
   */
  unbindPatientFromDoctor: (patientId, doctorId) => {
    return apiClient.delete('/auth/patients/unbind-doctor/', {
      data: {
        patient_id: patientId,
        doctor_id: doctorId,
      },
    });
  },
};

// ============================================================================
// 告警相关API - 处理健康告警的创建、查询和处理
// ============================================================================
export const alertsAPI = {
  /**
   * 获取告警列表
   * @param {string} status - 告警状态筛选（默认：'all'）
   * @returns {Promise} 告警列表
   */
  getAlerts: (status = 'all') => {
    return apiClient.get(`/alerts/?status=${status}`);
  },

  /**
   * 处理告警
   * @param {string} alertId - 告警ID
   * @param {string} action - 处理动作
   * @param {string} notes - 处理备注
   * @returns {Promise} 处理结果
   */
  handleAlert: (alertId, action, notes) => {
    return apiClient.patch(`/alerts/${alertId}/`, {
      status: 'handled',
      action,
      notes,
      handled_at: new Date().toISOString(),
    });
  },

  /**
   * 创建新告警
   * @param {Object} alertData - 告警数据
   * @returns {Promise} 创建结果
   */
  createAlert: (alertData) => {
    return apiClient.post('/alerts/', alertData);
  },

  /**
   * 获取告警统计
   * @returns {Promise} 告警统计数据
   */
  getAlertStats: () => {
    return apiClient.get('/alerts/stats/');
  },
};

// ============================================================================
// 消息通信相关API - 处理用户间的消息传递和聊天功能
// ============================================================================
export const messagesAPI = {
  /**
   * 获取对话列表
   * @returns {Promise} 对话列表
   */
  getConversations: () => {
    return apiClient.get('/communication/conversations/');
  },

  /**
   * 获取特定对话的消息
   * @param {string} conversationId - 对话ID
   * @param {number} page - 页码（默认：1）
   * @param {number} pageSize - 每页消息数量（默认：20）
   * @returns {Promise} 消息列表
   */
  getMessages: (conversationId, page = 1, pageSize = 20) => {
    return apiClient.get('/communication/messages/', {
      params: {
        conversation_id: conversationId,
        page,
        page_size: pageSize,
      },
    });
  },

  /**
   * 发送消息
   * @param {Object} messageData - 消息数据
   * @returns {Promise} 发送结果
   */
  sendMessage: (messageData) => {
    return apiClient.post('/communication/messages/', messageData);
  },

  /**
   * 标记消息为已读
   * @param {string} messageId - 消息ID
   * @returns {Promise} 标记结果
   */
  markMessageAsRead: (messageId) => {
    return apiClient.post(`/communication/messages/${messageId}/mark-read/`);
  },

  /**
   * 标记会话为已读
   * @param {string} conversationId - 对话ID
   * @returns {Promise} 标记结果
   */
  markConversationAsRead: (conversationId) => {
    return apiClient.post(`/communication/conversations/${conversationId}/mark-read/`);
  },

  /**
   * 获取与特定用户的会话
   * @param {string} userId - 用户ID
   * @returns {Promise} 会话信息
   */
  getConversationWithUser: (userId) => {
    return apiClient.get(`/communication/conversations/with-user/${userId}/`);
  },

  /**
   * 与特定用户开始新会话
   * @param {string} userId - 用户ID
   * @returns {Promise} 会话创建结果
   */
  startConversationWithUser: (userId) => {
    return apiClient.post(`/communication/conversations/start-with-user/${userId}/`);
  },

  /**
   * 搜索用户
   * @param {string} searchQuery - 搜索关键词
   * @returns {Promise} 搜索结果
   */
  searchUsers: (searchQuery) => {
    return apiClient.get('/communication/users/search/', {
      params: { search: searchQuery },
    });
  },

  /**
   * 获取消息模板
   * @returns {Promise} 消息模板列表
   */
  getMessageTemplates: () => {
    return apiClient.get('/communication/templates/');
  },

  /**
   * 发送快速消息（使用模板）
   * @param {string} templateId - 模板ID
   * @param {string} recipientId - 接收者ID
   * @param {Object} context - 上下文数据
   * @returns {Promise} 发送结果
   */
  sendQuickMessage: (templateId, recipientId, context = {}) => {
    return apiClient.post('/communication/quick-message/', {
      template_id: templateId,
      recipient_id: recipientId,
      context,
    });
  },

  /**
   * 获取聊天统计信息
   * @returns {Promise} 聊天统计数据
   */
  getChatStats: () => {
    return apiClient.get('/communication/stats/');
  },

  /**
   * 获取会话详情
   * @param {string} conversationId - 对话ID
   * @returns {Promise} 会话详细信息
   */
  getConversationDetails: (conversationId) => {
    return apiClient.get(`/communication/conversations/${conversationId}/`);
  },

  /**
   * 更新会话信息
   * @param {string} conversationId - 对话ID
   * @param {Object} updates - 更新内容
   * @returns {Promise} 更新结果
   */
  updateConversation: (conversationId, updates) => {
    return apiClient.patch(`/communication/conversations/${conversationId}/`, updates);
  },

  /**
   * 删除会话
   * @param {string} conversationId - 对话ID
   * @returns {Promise} 删除结果
   */
  deleteConversation: (conversationId) => {
    return apiClient.delete(`/communication/conversations/${conversationId}/`);
  },
};

// ============================================================================
// 推送通知相关API - 处理推送通知的注册和设置
// ============================================================================
export const notificationsAPI = {
  /**
   * 注册推送token
   * @param {string} pushToken - 推送token
   * @param {string} deviceType - 设备类型（'ios' 或 'android'）
   * @returns {Promise} 注册结果
   */
  registerPushToken: (pushToken, deviceType) => {
    return apiClient.post('/notifications/register-token/', {
      push_token: pushToken,
      device_type: deviceType, // 'ios' 或 'android'
    });
  },

  /**
   * 获取通知历史
   * @returns {Promise} 通知历史列表
   */
  getNotificationHistory: () => {
    return apiClient.get('/notifications/history/');
  },

  /**
   * 更新通知设置
   * @param {Object} settings - 通知设置
   * @returns {Promise} 更新结果
   */
  updateNotificationSettings: (settings) => {
    return apiClient.patch('/notifications/settings/', settings);
  },
};

// ============================================================================
// 用药管理相关API - 处理药品、用药计划等医疗相关功能
// ============================================================================
export const medicationAPI = {
  /**
   * 获取药品列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 药品列表
   */
  getMedications: (params = {}) => {
    return apiClient.get('/medication/medications/', { params });
  },

  /**
   * 获取用药计划列表
   * @param {string|null} patientId - 患者ID（可选）
   * @param {Object} params - 查询参数
   * @returns {Promise} 用药计划列表
   */
  getMedicationPlans: (patientId = null, params = {}) => {
    const url = patientId 
      ? `/medication/patients/${patientId}/plans/`
      : '/medication/plans/';
    return apiClient.get(url, { params });
  },

  /**
   * 创建用药计划
   * @param {string} patientId - 患者ID
   * @param {Object} planData - 用药计划数据
   * @returns {Promise} 创建结果
   */
  createMedicationPlan: (patientId, planData) => {
    return apiClient.post(`/medication/patients/${patientId}/plans/`, planData);
  },

  /**
   * 创建用药计划（别名）
   * @param {string} patientId - 患者ID
   * @param {Object} planData - 用药计划数据
   * @returns {Promise} 创建结果
   */
  createPlan: (patientId, planData) => {
    return apiClient.post(`/medication/patients/${patientId}/plans/`, planData);
  },

  /**
   * 更新用药计划
   * @param {string} patientId - 患者ID
   * @param {string} planId - 计划ID
   * @param {Object} planData - 更新的计划数据
   * @returns {Promise} 更新结果
   */
  updateMedicationPlan: (patientId, planId, planData) => {
    return apiClient.put(`/medication/patients/${patientId}/plans/${planId}/`, planData);
  },

  /**
   * 更新用药计划（别名）
   * @param {string} patientId - 患者ID
   * @param {string} planId - 计划ID
   * @param {Object} planData - 更新的计划数据
   * @returns {Promise} 更新结果
   */
  updatePlan: (patientId, planId, planData) => {
    return apiClient.put(`/medication/patients/${patientId}/plans/${planId}/`, planData);
  },

  /**
   * 删除用药计划
   * @param {string} patientId - 患者ID
   * @param {string} planId - 计划ID
   * @returns {Promise} 删除结果
   */
  deleteMedicationPlan: (patientId, planId) => {
    return apiClient.delete(`/medication/patients/${patientId}/plans/${planId}/`);
  },

  /**
   * 删除用药计划（别名）
   * @param {string} patientId - 患者ID
   * @param {string} planId - 计划ID
   * @returns {Promise} 删除结果
   */
  deletePlan: (patientId, planId) => {
    return apiClient.delete(`/medication/patients/${patientId}/plans/${planId}/`);
  },

  /**
   * 更新用药计划状态
   * @param {string} planId - 计划ID
   * @param {string} status - 新状态
   * @param {string|null} reason - 状态变更原因（可选）
   * @returns {Promise} 更新结果
   */
  updatePlanStatus: (planId, status, reason = null) => {
    const data = { status };
    if (reason) {
      data.reason = reason;
    }
    return apiClient.post(`/medication/plans/${planId}/status/`, data);
  },

  /**
   * 获取用药统计
   * @param {string|null} patientId - 患者ID（可选）
   * @returns {Promise} 用药统计数据
   */
  getMedicationStats: (patientId = null) => {
    const url = patientId 
      ? `/medication/patients/${patientId}/plans/stats/`
      : '/medication/plans/stats/';
    return apiClient.get(url);
  },

  /**
   * 获取用药历史
   * @param {string} patientId - 患者ID
   * @returns {Promise} 用药历史数据
   */
  getMedicationHistory: (patientId) => {
    return apiClient.get(`/medication/patients/${patientId}/history/`);
  },
};

// ============================================================================
// 导出配置和别名
// ============================================================================

// 导出默认配置
export default apiClient;

// 导出api别名，用于聊天组件
export { apiClient as api }; 