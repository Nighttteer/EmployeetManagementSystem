import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

class MedicationReminderService {
  constructor() {
    this.setupNotifications();
  }

  // 设置通知
  async setupNotifications() {
    // 请求权限
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('通知权限被拒绝');
      return false;
    }

    // 设置通知处理器
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
      shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // 设置通知监听器
    Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);

    return true;
  }

  // 处理收到的通知
  handleNotificationReceived = (notification) => {
    console.log('收到用药提醒通知:', notification);
    
    const { type, medicationId, medicationName } = notification.request.content.data || {};
    
    if (type === 'medication_reminder') {
      // 可以在这里处理用药提醒逻辑
      console.log(`用药提醒: ${medicationName}`);
    }
  };

  // 处理通知响应（用户点击）
  handleNotificationResponse = (response) => {
    console.log('用户点击了用药提醒通知:', response);
    
    const { type, medicationId, medicationName } = response.notification.request.content.data || {};
    
    if (type === 'medication_reminder') {
      // 导航到用药页面或显示用药确认对话框
      console.log(`用户点击了 ${medicationName} 的用药提醒`);
    }
  };

  // 安排用药提醒
  async scheduleMedicationReminder(medication) {
    try {
      const {
        id,
        name,
        dosage,
        frequency,
        timeOfDay,
        startDate,
        endDate,
        instructions
      } = medication;

      // 解析时间
      const times = this.parseTimeOfDay(timeOfDay, frequency);
      
      const scheduledNotifications = [];

      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        const trigger = {
          hour: hours,
          minute: minutes,
          repeats: true,
        };

        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: '用药提醒',
            body: `该服用 ${name} (${dosage}) 了`,
            data: {
              type: 'medication_reminder',
              medicationId: id,
              medicationName: name,
              dosage: dosage,
              instructions: instructions,
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger,
        });

        scheduledNotifications.push({
          identifier,
          medicationId: id,
          time: time,
        });
      }

      // 保存到本地存储
      await this.saveScheduledReminders(scheduledNotifications);

      return scheduledNotifications;
    } catch (error) {
      console.error('安排用药提醒失败:', error);
      return [];
    }
  }

  // 解析服药时间
  parseTimeOfDay(timeOfDay, frequency) {
    const timeMapping = {
      'before_breakfast': '07:00',
      'after_breakfast': '08:00',
      'before_lunch': '11:30',
      'after_lunch': '12:30',
      'before_dinner': '17:30',
      'after_dinner': '18:30',
      'before_sleep': '21:00',
      'morning': '08:00',
      'noon': '12:00',
      'evening': '20:00',
    };

    const baseTime = timeMapping[timeOfDay] || '08:00';
    const times = [baseTime];

    // 根据频次添加额外时间
    switch (frequency) {
      case 'BID':
        times.push(this.addHours(baseTime, 12));
        break;
      case 'TID':
        times.push(this.addHours(baseTime, 8));
        times.push(this.addHours(baseTime, 16));
        break;
      case 'QID':
        times.push(this.addHours(baseTime, 6));
        times.push(this.addHours(baseTime, 12));
        times.push(this.addHours(baseTime, 18));
        break;
      case 'Q12H':
        times.push(this.addHours(baseTime, 12));
        break;
      case 'Q8H':
        times.push(this.addHours(baseTime, 8));
        times.push(this.addHours(baseTime, 16));
        break;
      case 'Q6H':
        times.push(this.addHours(baseTime, 6));
        times.push(this.addHours(baseTime, 12));
        times.push(this.addHours(baseTime, 18));
        break;
    }

    return times;
  }

  // 添加小时
  addHours(timeString, hours) {
    const [h, m] = timeString.split(':').map(Number);
    const newHour = (h + hours) % 24;
    return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // 取消用药提醒
  async cancelMedicationReminder(medicationId) {
    try {
      const scheduledReminders = await this.getScheduledReminders();
      const remindersToCancel = scheduledReminders.filter(
        reminder => reminder.medicationId === medicationId
      );

      for (const reminder of remindersToCancel) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }

      // 更新本地存储
      const updatedReminders = scheduledReminders.filter(
        reminder => reminder.medicationId !== medicationId
      );
      await this.saveScheduledReminders(updatedReminders);

      return true;
    } catch (error) {
      console.error('取消用药提醒失败:', error);
      return false;
    }
  }

  // 获取所有已安排的提醒
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('获取已安排通知失败:', error);
      return [];
    }
  }

  // 保存提醒到本地存储
  async saveScheduledReminders(reminders) {
    try {
      const { SecureStore } = await import('expo-secure-store');
      await SecureStore.setItemAsync(
        'scheduled_medication_reminders',
        JSON.stringify(reminders)
      );
    } catch (error) {
      console.error('保存提醒失败:', error);
    }
  }

  // 从本地存储获取提醒
  async getScheduledReminders() {
    try {
      const { SecureStore } = await import('expo-secure-store');
      const reminders = await SecureStore.getItemAsync('scheduled_medication_reminders');
      return reminders ? JSON.parse(reminders) : [];
    } catch (error) {
      console.error('获取提醒失败:', error);
      return [];
    }
  }

  // 记录服药
  async recordMedicationTaken(medicationId, dosage = null, notes = '') {
    try {
      const response = await api.post('/medication/record-taken/', {
        medication_id: medicationId,
        dosage_taken: dosage,
        notes: notes,
        taken_at: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      console.error('记录服药失败:', error);
      throw error;
    }
  }

  // 跳过服药
  async skipMedication(medicationId, reason = '') {
    try {
      const response = await api.post('/medication/skip/', {
        medication_id: medicationId,
        reason: reason,
        skipped_at: new Date().toISOString(),
      });

      return response.data;
    } catch (error) {
      console.error('跳过服药失败:', error);
      throw error;
    }
  }

  // 获取今日用药计划
  async getTodayMedications() {
    try {
      const response = await api.get('/medication/today/');
      return response.data;
    } catch (error) {
      console.error('获取今日用药失败:', error);
      throw error;
    }
  }

  // 获取用药计划
  async getMedicationPlans() {
    try {
      const response = await api.get('/medication/plans/');
      return response.data;
    } catch (error) {
      console.error('获取用药计划失败:', error);
      throw error;
    }
  }

  // 获取用药历史
  async getMedicationHistory(page = 1) {
    try {
      const response = await api.get('/medication/history/', {
        params: { page, page_size: 20 }
      });
      return response.data;
    } catch (error) {
      console.error('获取用药历史失败:', error);
      throw error;
    }
  }

  // 获取用药依从性统计
  async getComplianceStats() {
    try {
      const response = await api.get('/medication/compliance-stats/');
      return response.data;
    } catch (error) {
      console.error('获取依从性统计失败:', error);
      throw error;
    }
  }

  // 设置提醒偏好
  async setReminderPreferences(preferences) {
    try {
      const { SecureStore } = await import('expo-secure-store');
      await SecureStore.setItemAsync(
        'medication_reminder_preferences',
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('保存提醒偏好失败:', error);
    }
  }

  // 获取提醒偏好
  async getReminderPreferences() {
    try {
      const { SecureStore } = await import('expo-secure-store');
      const preferences = await SecureStore.getItemAsync('medication_reminder_preferences');
      return preferences ? JSON.parse(preferences) : {
        enabled: true,
        sound: true,
        vibration: true,
        advanceMinutes: 5,
        repeatInterval: 15,
      };
    } catch (error) {
      console.error('获取提醒偏好失败:', error);
      return {
        enabled: true,
        sound: true,
        vibration: true,
        advanceMinutes: 5,
        repeatInterval: 15,
      };
    }
  }

  // 清除所有提醒
  async clearAllReminders() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await this.saveScheduledReminders([]);
      return true;
    } catch (error) {
      console.error('清除所有提醒失败:', error);
      return false;
    }
  }

  // 安排本地通知
  async scheduleLocalNotification(title, body, data = {}, triggerSeconds = null) {
    try {
      const notificationContent = {
        title,
        body,
        data,
        sound: true,
      };

      const trigger = triggerSeconds ? { seconds: triggerSeconds } : null;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      return identifier;
    } catch (error) {
      console.error('安排本地通知失败:', error);
      return null;
    }
  }
}

// 创建单例实例
const medicationReminderService = new MedicationReminderService();

export default medicationReminderService; 