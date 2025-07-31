import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 基础API配置 - 根据你的运行环境选择正确的配置

// 🔧 请根据你的情况选择一个配置，注释掉其他的：

// 1. iOS模拟器
// const BASE_URL = 'http://localhost:8000/api';

// 2. Android模拟器
// const BASE_URL = 'http://10.0.2.2:8000/api';

// 3. 实体设备或Expo Go（当前配置）
// ✅ 已配置为你的实际IP地址
const BASE_URL = 'http://10.132.115.2:8000/api';
//const BASE_URL = 'http://10.56.205.246:8000/api';

// ✅ 已配置为你的实际IP地址（热点网络）
//const BASE_URL = 'http://172.20.10.3:8000/api';

// 导出API基础URL供其他组件使用
export const API_BASE_URL = BASE_URL;

// 4. Web浏览器
// const BASE_URL = 'http://127.0.0.1:8000/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
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

// 响应拦截器 - 处理通用错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并跳转到登录页
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('userRole');
      // 这里可以添加导航到登录页的逻辑
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户登录
  login: (phone, password, role) => {
    return apiClient.post('/auth/login/', {
      phone,
      password,
      role,
    });
  },

  // 验证token有效性
  validateToken: (token) => {
    return apiClient.get('/auth/token/verify/');
  },

  // 用户注册
  register: (userData) => {
    return apiClient.post('/auth/register/', userData);
  },

  // 带SMS验证的用户注册
  registerWithSMS: (userData) => {
    return apiClient.post('/auth/register/sms/', userData);
  },

  // 发送SMS验证码
  sendSMSCode: (phoneData) => {
    return apiClient.post('/auth/sms/send/', phoneData);
  },

  // 验证SMS验证码
  verifySMSCode: (verificationData) => {
    return apiClient.post('/auth/sms/verify/', verificationData);
  },

  // 刷新token
  refreshToken: (refreshToken) => {
    return apiClient.post('/auth/refresh/', {
      refresh: refreshToken,
    });
  },
};

// 用户相关API
export const userAPI = {
  // 获取用户个人资料
  getProfile: () => {
    return apiClient.get('/user/profile/');
  },

  // 更新用户资料
  updateProfile: (profileData) => {
    return apiClient.patch('/user/profile/', profileData);
  },

  // 提交健康指标
  submitHealthMetrics: (metricsData) => {
    return apiClient.post('/user/health-metrics/', metricsData);
  },

  // 获取健康趋势数据
  getHealthTrends: (period) => {
    return apiClient.get(`/user/health-trends/?period=${period}`);
  },

  // 获取用药计划
  getMedicationPlan: () => {
    return apiClient.get('/user/medication-plan/');
  },

  // 确认服药
  confirmMedication: (medicationId, timestamp) => {
    return apiClient.post('/user/medication-confirmation/', {
      medication_id: medicationId,
      timestamp,
    });
  },
};

// 患者管理相关API (医生端)
export const patientsAPI = {
  // 获取患者列表
  getPatientsList: () => {
    return apiClient.get('/auth/patients/').then(response => {
      // 处理分页响应，提取 results 字段
      if (response.data && typeof response.data === 'object' && response.data.results) {
        return { ...response, data: response.data.results };
      }
      return response;
    });
  },

  // 获取特定患者详情
  getPatientDetails: (patientId) => {
    return apiClient.get(`/auth/patients/${patientId}/`);
  },

  // 创建新患者
  createPatient: (patientData) => {
    return apiClient.post('/auth/patients/create/', patientData);
  },

  // 更新患者信息
  updatePatient: (patientId, patientData) => {
    return apiClient.put(`/auth/patients/${patientId}/`, patientData);
  },

  // 删除患者
  deletePatient: (patientId) => {
    return apiClient.delete(`/auth/patients/${patientId}/`);
  },

  // 更新患者用药计划
  updateMedicationPlan: (patientId, medicationPlan) => {
    return apiClient.put(`/auth/patients/${patientId}/medication-plan/`, {
      medication_plan: medicationPlan,
    });
  },

  // 发送建议给患者
  sendAdvice: (patientId, advice) => {
    return apiClient.post(`/auth/patients/${patientId}/advice/`, {
      advice,
      timestamp: new Date().toISOString(),
    });
  },

  // 获取患者健康历史
  getPatientHealthHistory: (patientId, period) => {
    return apiClient.get(`/auth/patients/${patientId}/health-history/?period=${period}`);
  },

  // 搜索未分配的患者
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

  // 绑定医患关系
  bindPatientToDoctor: (patientId, doctorId) => {
    return apiClient.post('/auth/patients/bind-doctor/', {
      patient_id: patientId,
      doctor_id: doctorId,
    });
  },

  // 解绑医患关系
  unbindPatientFromDoctor: (patientId, doctorId) => {
    return apiClient.delete('/auth/patients/unbind-doctor/', {
      data: {
        patient_id: patientId,
        doctor_id: doctorId,
      },
    });
  },
};

// 告警相关API
export const alertsAPI = {
  // 获取告警列表
  getAlerts: (status = 'all') => {
    return apiClient.get(`/alerts/?status=${status}`);
  },

  // 处理告警
  handleAlert: (alertId, action, notes) => {
    return apiClient.patch(`/alerts/${alertId}/`, {
      status: 'handled',
      action,
      notes,
      handled_at: new Date().toISOString(),
    });
  },

  // 创建新告警
  createAlert: (alertData) => {
    return apiClient.post('/alerts/', alertData);
  },

  // 获取告警统计
  getAlertStats: () => {
    return apiClient.get('/alerts/stats/');
  },
};

// 消息通信相关API
export const messagesAPI = {
  // 获取对话列表
  getConversations: () => {
    return apiClient.get('/communication/conversations/');
  },

  // 获取特定对话的消息
  getMessages: (conversationId, page = 1, pageSize = 20) => {
    return apiClient.get('/communication/messages/', {
      params: {
        conversation_id: conversationId,
        page,
        page_size: pageSize,
      },
    });
  },

  // 发送消息
  sendMessage: (messageData) => {
    return apiClient.post('/communication/messages/', messageData);
  },

  // 标记消息为已读
  markMessageAsRead: (messageId) => {
    return apiClient.post(`/communication/messages/${messageId}/mark-read/`);
  },

  // 标记会话为已读
  markConversationAsRead: (conversationId) => {
    return apiClient.post(`/communication/conversations/${conversationId}/mark-read/`);
  },

  // 获取与特定用户的会话
  getConversationWithUser: (userId) => {
    return apiClient.get(`/communication/conversations/with-user/${userId}/`);
  },

  // 与特定用户开始新会话
  startConversationWithUser: (userId) => {
    return apiClient.post(`/communication/conversations/start-with-user/${userId}/`);
  },

  // 搜索用户
  searchUsers: (searchQuery) => {
    return apiClient.get('/communication/users/search/', {
      params: { search: searchQuery },
    });
  },

  // 获取消息模板
  getMessageTemplates: () => {
    return apiClient.get('/communication/templates/');
  },

  // 发送快速消息（使用模板）
  sendQuickMessage: (templateId, recipientId, context = {}) => {
    return apiClient.post('/communication/quick-message/', {
      template_id: templateId,
      recipient_id: recipientId,
      context,
    });
  },

  // 获取聊天统计信息
  getChatStats: () => {
    return apiClient.get('/communication/stats/');
  },

  // 获取会话详情
  getConversationDetails: (conversationId) => {
    return apiClient.get(`/communication/conversations/${conversationId}/`);
  },

  // 更新会话信息
  updateConversation: (conversationId, updates) => {
    return apiClient.patch(`/communication/conversations/${conversationId}/`, updates);
  },

  // 删除会话
  deleteConversation: (conversationId) => {
    return apiClient.delete(`/communication/conversations/${conversationId}/`);
  },
};

// 推送通知相关API
export const notificationsAPI = {
  // 注册推送token
  registerPushToken: (pushToken, deviceType) => {
    return apiClient.post('/notifications/register-token/', {
      push_token: pushToken,
      device_type: deviceType, // 'ios' 或 'android'
    });
  },

  // 获取通知历史
  getNotificationHistory: () => {
    return apiClient.get('/notifications/history/');
  },

  // 更新通知设置
  updateNotificationSettings: (settings) => {
    return apiClient.patch('/notifications/settings/', settings);
  },
};

// 用药管理相关API
export const medicationAPI = {
  // 测试API连接
  testConnection: () => {
    return apiClient.get('/medication/test/');
  },

  // 获取药品列表
  getMedications: (params = {}) => {
    return apiClient.get('/medication/medications/', { params });
  },

  // 获取用药计划列表
  getMedicationPlans: (patientId = null, params = {}) => {
    const url = patientId 
      ? `/medication/patients/${patientId}/plans/`
      : '/medication/plans/';
    return apiClient.get(url, { params });
  },

  // 创建用药计划
  createMedicationPlan: (patientId, planData) => {
    return apiClient.post(`/medication/patients/${patientId}/plans/`, planData);
  },

  // 更新用药计划
  updateMedicationPlan: (patientId, planId, planData) => {
    return apiClient.put(`/medication/patients/${patientId}/plans/${planId}/`, planData);
  },

  // 删除用药计划
  deleteMedicationPlan: (patientId, planId) => {
    return apiClient.delete(`/medication/patients/${patientId}/plans/${planId}/`);
  },

  // 更新用药计划状态
  updatePlanStatus: (planId, status, reason = null) => {
    const data = { status };
    if (reason) {
      data.reason = reason;
    }
    return apiClient.post(`/medication/plans/${planId}/status/`, data);
  },

  // 获取用药统计
  getMedicationStats: (patientId = null) => {
    const url = patientId 
      ? `/medication/patients/${patientId}/plans/stats/`
      : '/medication/plans/stats/';
    return apiClient.get(url);
  },

  // 获取用药历史
  getMedicationHistory: (patientId) => {
    return apiClient.get(`/medication/patients/${patientId}/history/`);
  },
};

// 导出默认配置
export default apiClient;

// 导出api别名，用于聊天组件
export { apiClient as api }; 