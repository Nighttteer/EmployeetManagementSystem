/**
 * 智能异常提醒服务
 * 为医生端提供智能提醒功能
 */
import { api } from './api';

class IntelligentAlertService {
  constructor() {
    this.baseUrl = '/health';
  }

  /**
   * 获取智能提醒列表
   * @param {Object} params - 查询参数
   * @param {number} params.patient_id - 病人ID（可选）
   * @param {string} params.priority - 优先级（可选）
   * @param {string} params.type - 提醒类型（可选）
   * @param {number} params.days - 查看天数（默认7天）
   * @returns {Promise} 智能提醒数据
   */
  async getIntelligentAlerts(params = {}) {
    try {
      const response = await api.get(`${this.baseUrl}/intelligent-alerts/`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('获取智能提醒失败:', error);
      throw error;
    }
  }

  /**
   * 手动触发智能提醒生成
   * @param {number} patientId - 病人ID（可选，不传则为所有病人生成）
   * @returns {Promise} 生成结果
   */
  async generateIntelligentAlerts(patientId = null) {
    try {
      const data = patientId ? { patient_id: patientId } : {};
      const response = await api.post(`${this.baseUrl}/intelligent-alerts/generate/`, data);
      return response.data;
    } catch (error) {
      console.error('生成智能提醒失败:', error);
      throw error;
    }
  }

  /**
   * 获取病人风险分析
   * @param {number} patientId - 病人ID
   * @returns {Promise} 风险分析结果
   */
  async getPatientRiskAnalysis(patientId) {
    try {
      const response = await api.get(`${this.baseUrl}/intelligent-alerts/analysis/`, {
        params: { patient_id: patientId }
      });
      return response.data;
    } catch (error) {
      console.error('获取风险分析失败:', error);
      throw error;
    }
  }

  /**
   * 处理告警
   * @param {number} alertId - 告警ID
   * @param {Object} data - 处理数据
   * @param {string} data.action_taken - 采取的措施
   * @param {string} data.notes - 备注
   * @returns {Promise} 处理结果
   */
  async handleAlert(alertId, data) {
    try {
      const response = await api.post(`${this.baseUrl}/alerts/${alertId}/handle/`, data);
      return response.data;
    } catch (error) {
      console.error('处理告警失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警统计信息
   * @param {Object} params - 查询参数
   * @returns {Promise} 统计数据
   */
  async getAlertStats(params = {}) {
    try {
      const response = await this.getIntelligentAlerts(params);
      return response.stats;
    } catch (error) {
      console.error('获取告警统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取优先级颜色
   * @param {string} priority - 优先级
   * @returns {string} 颜色值
   */
  getPriorityColor(priority) {
    const colors = {
      'critical': '#F44336',  // 红色
      'high': '#FF9800',      // 橙色
      'medium': '#FFC107',    // 黄色
      'low': '#4CAF50'        // 绿色
    };
    return colors[priority] || '#9E9E9E';
  }

  /**
   * 获取优先级文本
   * @param {string} priority - 优先级
   * @returns {string} 优先级文本
   */
  getPriorityText(priority) {
    const texts = {
      'critical': '危急',
      'high': '高',
      'medium': '中',
      'low': '低'
    };
    return texts[priority] || '未知';
  }

  /**
   * 获取提醒类型文本
   * @param {string} type - 提醒类型
   * @returns {string} 类型文本
   */
  getAlertTypeText(type) {
    const texts = {
      'missed_medication': '漏服药物',
      'threshold_exceeded': '阈值超标',
      'abnormal_trend': '异常趋势',
      'system_notification': '系统通知'
    };
    return texts[type] || '未知类型';
  }

  /**
   * 获取提醒类型图标
   * @param {string} type - 提醒类型
   * @returns {string} 图标名称
   */
  getAlertTypeIcon(type) {
    const icons = {
      'missed_medication': 'medical',
      'threshold_exceeded': 'warning',
      'abnormal_trend': 'trending-up',
      'system_notification': 'notifications'
    };
    return icons[type] || 'alert-circle';
  }

  /**
   * 格式化时间
   * @param {string} dateString - 时间字符串
   * @returns {string} 格式化后的时间
   */
  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }


}

// 导出服务实例
export const intelligentAlertService = new IntelligentAlertService();
export default intelligentAlertService;