import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 基础API配置
// 根据您的测试设备选择合适的地址：

// Android模拟器
//const BASE_URL = 'http://10.0.2.2:8000/api';

// iOS模拟器 - 取消下面这行的注释并注释上面的行
// const BASE_URL = 'http://localhost:8000/api';

// 实体设备 - 需要使用开发机器的实际IP地址
// 获取IP地址：在Windows中运行 ipconfig，找到无线网络适配器的IPv4地址
const BASE_URL = 'http://10.132.115.2:8000/api'; // 您的开发机器IP地址

// Expo Go应用 - 有时需要使用Expo的tunneling
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
  login: (username, password) => {
    return apiClient.post('/auth/login/', {
      username,
      password,
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
    return apiClient.get('/doctor/patients/');
  },

  // 获取特定患者详情
  getPatientDetails: (patientId) => {
    return apiClient.get(`/doctor/patients/${patientId}/`);
  },

  // 更新患者用药计划
  updateMedicationPlan: (patientId, medicationPlan) => {
    return apiClient.put(`/doctor/patients/${patientId}/medication-plan/`, {
      medication_plan: medicationPlan,
    });
  },

  // 发送建议给患者
  sendAdvice: (patientId, advice) => {
    return apiClient.post(`/doctor/patients/${patientId}/advice/`, {
      advice,
      timestamp: new Date().toISOString(),
    });
  },

  // 获取患者健康历史
  getPatientHealthHistory: (patientId, period) => {
    return apiClient.get(`/doctor/patients/${patientId}/health-history/?period=${period}`);
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
    return apiClient.get('/messages/conversations/');
  },

  // 获取特定对话的消息
  getMessages: (conversationId, page = 1) => {
    return apiClient.get(`/messages/conversations/${conversationId}/messages/?page=${page}`);
  },

  // 发送消息
  sendMessage: (conversationId, message, messageType = 'text') => {
    return apiClient.post(`/messages/conversations/${conversationId}/messages/`, {
      message,
      message_type: messageType,
      timestamp: new Date().toISOString(),
    });
  },

  // 标记消息为已读
  markAsRead: (conversationId) => {
    return apiClient.patch(`/messages/conversations/${conversationId}/mark-read/`);
  },

  // 创建新对话 (医生与患者)
  createConversation: (participantId) => {
    return apiClient.post('/messages/conversations/', {
      participant_id: participantId,
    });
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

// 导出默认配置
export default apiClient; 