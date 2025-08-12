/**
 * Intelligent Alert Service
 * Provides intelligent alert functionality for doctors
 */
import { api } from './api';

class IntelligentAlertService {
  constructor() {
    this.baseUrl = '/health';
  }

  /**
   * Get intelligent alerts list
   * @param {Object} params - Query parameters
   * @param {number} params.patient_id - Patient ID (optional)
   * @param {string} params.priority - Priority level (optional)
   * @param {string} params.type - Alert type (optional)
   * @param {number} params.days - Days to view (default 7 days)
   * @returns {Promise} Intelligent alert data
   */
  async getIntelligentAlerts(params = {}) {
    try {
      const response = await api.get(`${this.baseUrl}/intelligent-alerts/`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get intelligent alerts:', error);
      throw error;
    }
  }

  /**
   * Manually trigger intelligent alert generation
   * @param {number} patientId - Patient ID (optional, generate for all patients if not provided)
   * @returns {Promise} Generation result
   */
  async generateIntelligentAlerts(patientId = null) {
    try {
      const data = patientId ? { patient_id: patientId } : {};
      const response = await api.post(`${this.baseUrl}/intelligent-alerts/generate/`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to generate intelligent alerts:', error);
      throw error;
    }
  }

  /**
   * Get patient risk analysis
   * @param {number} patientId - Patient ID
   * @returns {Promise} Risk analysis result
   */
  async getPatientRiskAnalysis(patientId) {
    try {
      const response = await api.get(`${this.baseUrl}/intelligent-alerts/analysis/`, {
        params: { patient_id: patientId }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get risk analysis:', error);
      throw error;
    }
  }

  /**
   * Handle alert
   * @param {number} alertId - Alert ID
   * @param {Object} data - Handling data
   * @param {string} data.action_taken - Action taken
   * @param {string} data.notes - Notes
   * @returns {Promise} Handling result
   */
  async handleAlert(alertId, data) {
    try {
      const response = await api.post(`${this.baseUrl}/alerts/${alertId}/handle/`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to handle alert:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   * @param {Object} params - Query parameters
   * @returns {Promise} Statistics data
   */
  async getAlertStats(params = {}) {
    try {
      const response = await this.getIntelligentAlerts(params);
      return response.stats;
    } catch (error) {
      console.error('Failed to get alert statistics:', error);
      throw error;
    }
  }

  /**
   * Get priority color
   * @param {string} priority - Priority level
   * @returns {string} Color value
   */
  getPriorityColor(priority) {
    const colors = {
      'critical': '#F44336',  // Red
      'high': '#FF9800',      // Orange
      'medium': '#FFC107',    // Yellow
      'low': '#4CAF50'        // Green
    };
    return colors[priority] || '#9E9E9E';
  }

  /**
   * Get priority text
   * @param {string} priority - Priority level
   * @returns {string} Priority text
   */
  getPriorityText(priority) {
    const texts = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return texts[priority] || 'Unknown';
  }

  /**
   * Get alert type text
   * @param {string} type - Alert type
   * @returns {string} Type text
   */
  getAlertTypeText(type) {
    const texts = {
      'missed_medication': 'Missed Medication',
      'threshold_exceeded': 'Threshold Exceeded',
      'abnormal_trend': 'Abnormal Trend',
      'system_notification': 'System Notification'
    };
    return texts[type] || 'Unknown Type';
  }

  /**
   * Get alert type icon
   * @param {string} type - Alert type
   * @returns {string} Icon name
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
   * Format time
   * @param {string} dateString - Date string
   * @returns {string} Formatted time
   */
  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }


}

// Export service instance
export const intelligentAlertService = new IntelligentAlertService();
export default intelligentAlertService;