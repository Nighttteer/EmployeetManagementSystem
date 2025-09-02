/**
 * 智能告警服务 (Intelligent Alert Service)
 * 
 * 为医生提供智能告警功能的服务类
 * 包括获取智能告警、生成告警、风险分析、处理告警等功能
 * 
 * 主要功能：
 * - 智能告警列表获取和筛选
 * - 手动触发告警生成
 * - 患者风险评估分析
 * - 告警处理和状态更新
 * - 告警统计信息获取
 * - 告警优先级和类型的格式化显示
 */
import { api } from './api';

/**
 * 智能告警服务类
 * 封装了所有与智能告警相关的API调用和业务逻辑
 */
class IntelligentAlertService {
  /**
   * 构造函数
   * 初始化服务的基础URL配置
   */
  constructor() {
    // 设置健康模块的基础URL路径
    this.baseUrl = '/health';
  }

  /**
   * 获取智能告警列表
   * 
   * @param {Object} params - 查询参数对象
   * @param {number} [params.patient_id] - 患者ID（可选，用于筛选特定患者的告警）
   * @param {string} [params.priority] - 优先级级别（可选，如：'critical', 'high', 'medium', 'low'）
   * @param {string} [params.type] - 告警类型（可选，如：'missed_medication', 'threshold_exceeded'等）
   * @param {number} [params.days=7] - 查看天数（默认7天，用于时间范围筛选）
   * @returns {Promise<Object>} 返回智能告警数据，包含告警列表和统计信息
   * @throws {Error} 当API调用失败时抛出错误
   */
  async getIntelligentAlerts(params = {}) {
    try {
      // 调用后端智能告警API，传递查询参数
      const response = await api.get(`${this.baseUrl}/intelligent-alerts/`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('获取智能告警失败:', error);
      // 重新抛出错误，让调用方处理
      throw error;
    }
  }

  /**
   * 手动触发智能告警生成
   * 
   * 此功能允许医生手动触发系统为特定患者或所有患者生成智能告警
   * 通常用于重新分析患者数据或生成新的告警
   * 
   * @param {number} [patientId] - 患者ID（可选，如果不提供则生成所有患者的告警）
   * @returns {Promise<Object>} 返回告警生成结果，包含生成状态和数量信息
   * @throws {Error} 当API调用失败时抛出错误
   */
  async generateIntelligentAlerts(patientId = null) {
    try {
      // 根据是否提供患者ID构建请求数据
      const data = patientId ? { patient_id: patientId } : {};
      
      // 调用后端告警生成API
      const response = await api.post(`${this.baseUrl}/intelligent-alerts/generate/`, data);
      return response.data;
    } catch (error) {
      console.error('生成智能告警失败:', error);
      throw error;
    }
  }

  /**
   * 获取患者风险评估分析
   * 
   * 分析特定患者的健康数据，评估其健康风险等级
   * 为医生提供决策支持信息
   * 
   * @param {number} patientId - 患者ID（必需参数）
   * @returns {Promise<Object>} 返回风险评估结果，包含风险等级、风险因素、建议等信息
   * @throws {Error} 当API调用失败时抛出错误
   */
  async getPatientRiskAnalysis(patientId) {
    try {
      // 调用后端风险分析API，传递患者ID参数
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
   * 
   * 医生处理告警后，更新告警状态和处理信息
   * 记录处理动作和备注，便于后续追踪和分析
   * 
   * @param {number} alertId - 告警ID（必需参数）
   * @param {Object} data - 处理数据对象
   * @param {string} data.action_taken - 采取的处理动作（如：'contacted_patient', 'adjusted_medication'等）
   * @param {string} data.notes - 处理备注和说明
   * @returns {Promise<Object>} 返回处理结果，包含更新后的告警状态
   * @throws {Error} 当API调用失败时抛出错误
   */
  async handleAlert(alertId, data) {
    try {
      // 调用后端告警处理API，更新告警状态
      const response = await api.post(`${this.baseUrl}/alerts/${alertId}/handle/`, data);
      return response.data;
    } catch (error) {
      console.error('处理告警失败:', error);
      throw error;
    }
  }

  /**
   * 获取告警统计信息
   * 
   * 从智能告警数据中提取统计信息
   * 为仪表板提供数据概览
   * 
   * @param {Object} params - 查询参数（与getIntelligentAlerts相同）
   * @returns {Promise<Object>} 返回告警统计数据，包含各类型告警的数量和分布
   * @throws {Error} 当获取告警数据失败时抛出错误
   */
  async getAlertStats(params = {}) {
    try {
      // 先获取智能告警数据，然后提取统计信息
      const response = await this.getIntelligentAlerts(params);
      return response.stats;
    } catch (error) {
      console.error('获取告警统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取优先级对应的颜色值
   * 
   * 为不同优先级的告警提供视觉区分
   * 用于UI界面的颜色显示
   * 
   * @param {string} priority - 优先级级别
   * @returns {string} 对应的颜色值（十六进制格式）
   */
  getPriorityColor(priority) {
    // 定义优先级颜色映射表
    const colors = {
      'critical': '#F44336',  // 红色 - 紧急
      'high': '#FF9800',      // 橙色 - 高
      'medium': '#FFC107',    // 黄色 - 中等
      'low': '#4CAF50'        // 绿色 - 低
    };
    // 如果找不到对应颜色，返回默认的灰色
    return colors[priority] || '#9E9E9E';
  }

  /**
   * 获取优先级对应的文本描述
   * 
   * 将优先级代码转换为用户友好的文本显示
   * 
   * @param {string} priority - 优先级级别
   * @returns {string} 对应的优先级文本描述
   */
  getPriorityText(priority) {
    // 定义优先级文本映射表
    const texts = {
      'critical': 'Critical',    // 紧急
      'high': 'High',            // 高
      'medium': 'Medium',        // 中等
      'low': 'Low'               // 低
    };
    // 如果找不到对应文本，返回"未知"
    return texts[priority] || 'Unknown';
  }

  /**
   * 获取告警类型对应的文本描述
   * 
   * 将告警类型代码转换为用户友好的文本显示
   * 
   * @param {string} type - 告警类型代码
   * @returns {string} 对应的告警类型文本描述
   */
  getAlertTypeText(type) {
    // 定义告警类型文本映射表
    const texts = {
      'missed_medication': 'Missed Medication',      // 漏服药物
      'threshold_exceeded': 'Threshold Exceeded',    // 阈值超限
      'abnormal_trend': 'Abnormal Trend',            // 异常趋势
      'system_notification': 'System Notification'   // 系统通知
    };
    // 如果找不到对应文本，返回"未知类型"
    return texts[type] || 'Unknown Type';
  }

  /**
   * 获取告警类型对应的图标名称
   * 
   * 为不同告警类型提供对应的图标显示
   * 用于UI界面的图标展示
   * 
   * @param {string} type - 告警类型代码
   * @returns {string} 对应的图标名称
   */
  getAlertTypeIcon(type) {
    // 定义告警类型图标映射表
    const icons = {
      'missed_medication': 'medical',        // 医疗图标
      'threshold_exceeded': 'warning',       // 警告图标
      'abnormal_trend': 'trending-up',       // 趋势上升图标
      'system_notification': 'notifications' // 通知图标
    };
    // 如果找不到对应图标，返回默认的告警圆圈图标
    return icons[type] || 'alert-circle';
  }

  /**
   * 格式化时间显示
   * 
   * 将时间戳转换为用户友好的相对时间显示
   * 如："刚刚"、"5分钟前"、"2小时前"等
   * 
   * @param {string} dateString - 日期时间字符串
   * @returns {string} 格式化后的时间显示文本
   */
  formatTime(dateString) {
    // 解析日期字符串
    const date = new Date(dateString);
    const now = new Date();
    
    // 计算时间差（秒）
    const diffInSeconds = Math.floor((now - date) / 1000);

    // 根据时间差返回不同的显示格式
    if (diffInSeconds < 60) {
      return 'Just now';  // 刚刚
    } else if (diffInSeconds < 3600) {
      // 小于1小时，显示分钟
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      // 小于24小时，显示小时
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      // 超过24小时，显示具体日期和时间
      return date.toLocaleDateString('en-US', {
        month: 'short',      // 月份缩写
        day: 'numeric',      // 日期数字
        hour: '2-digit',     // 小时（两位数）
        minute: '2-digit'    // 分钟（两位数）
      });
    }
  }
}

// ============================================================================
// 导出配置
// ============================================================================

// 导出服务实例（单例模式）
export const intelligentAlertService = new IntelligentAlertService();

// 导出默认服务实例
export default intelligentAlertService;