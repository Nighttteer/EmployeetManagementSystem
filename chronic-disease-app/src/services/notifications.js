import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsAPI } from './api';

// 配置通知行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.pushToken = null;
    this.notificationSubscription = null;
    this.responseSubscription = null;
  }

  // 初始化推送通知
  async initialize() {
    try {
      // 在开发模式下，我们简化推送通知的初始化
      console.log('正在初始化推送通知服务...');

      // 检查是否为真实设备
      if (!Device.isDevice) {
        console.log('推送通知在模拟器中不可用，但本地通知仍然可以工作');
        // 即使在模拟器中，我们也设置本地通知监听器
        this.setupNotificationListeners();
        return 'simulator-mode';
      }

      // 请求通知权限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('用户拒绝了推送通知权限，但本地通知仍然可以工作');
        this.setupNotificationListeners();
        return 'permission-denied';
      }

      // 尝试获取推送token（在开发环境中可能会失败，这是正常的）
      this.pushToken = await this.getPushToken();
      
      // 设置通知监听器（无论是否获取到token都要设置）
      this.setupNotificationListeners();
      
      if (this.pushToken) {
        console.log('✅ 推送通知完全初始化成功');
        // 在生产环境中才向后端注册token
        // await this.registerPushToken();
      } else {
        console.log('ℹ️  推送通知以本地模式运行（这在开发环境中是正常的）');
      }

      return this.pushToken || 'local-only';
    } catch (error) {
      console.log('⚠️  推送通知初始化遇到问题，切换到本地模式:', error.message);
      // 即使初始化失败，我们也设置本地通知监听器
      this.setupNotificationListeners();
      return null;
    }
  }

  // 获取推送token
  async getPushToken() {
    try {
      // 在开发环境中，如果没有projectId，我们跳过token获取
      // 但保留本地通知功能
      if (!Device.isDevice) {
        console.log('模拟器环境，跳过推送token获取');
        return null;
      }

      // 尝试获取推送token
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      // 在开发环境中，如果缺少projectId，这是正常的
      console.log('推送token获取失败，这在开发环境中是正常的:', error.message);
      return null;
    }
  }

  // 向后端注册推送token
  async registerPushToken() {
    try {
      if (!this.pushToken) return;

      const deviceType = Platform.OS;
      await notificationsAPI.registerPushToken(this.pushToken, deviceType);
      console.log('推送token注册成功');
    } catch (error) {
      console.error('注册推送token失败:', error);
    }
  }

  // 设置通知监听器
  setupNotificationListeners() {
    // 监听收到的通知
    this.notificationSubscription = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    // 监听通知响应（用户点击通知）
    this.responseSubscription = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
  }

  // 处理收到的通知
  handleNotificationReceived = (notification) => {
    console.log('收到推送通知:', notification);
    
    // 可以在这里处理特定类型的通知
    const { type, data } = notification.request.content.data || {};
    
    switch (type) {
      case 'medication_reminder':
        // 处理用药提醒
        break;
      case 'doctor_advice':
        // 处理医生建议
        break;
      case 'health_alert':
        // 处理健康告警
        break;
      default:
        break;
    }
  };

  // 处理通知响应（用户点击）
  handleNotificationResponse = (response) => {
    console.log('用户点击了通知:', response);
    
    const { type, data } = response.notification.request.content.data || {};
    
    // 根据通知类型导航到相应页面
    switch (type) {
      case 'medication_reminder':
        // 导航到用药提醒页面
        break;
      case 'doctor_advice':
        // 导航到消息页面
        break;
      case 'health_alert':
        // 导航到健康数据页面
        break;
      default:
        break;
    }
  };

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

  // 安排用药提醒通知
  async scheduleMedicationReminder(medication) {
    try {
      const { id, name, dosage, times } = medication;
      
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
            },
            sound: true,
          },
          trigger,
        });

        scheduledNotifications.push(identifier);
      }

      return scheduledNotifications;
    } catch (error) {
      console.error('安排用药提醒失败:', error);
      return [];
    }
  }

  // 取消特定通知
  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('取消通知失败:', error);
    }
  }

  // 取消所有通知
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('取消所有通知失败:', error);
    }
  }

  // 获取已安排的通知
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('获取已安排通知失败:', error);
      return [];
    }
  }

  // 设置通知徽章数量
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('设置徽章数量失败:', error);
    }
  }

  // 清除通知徽章
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('清除徽章失败:', error);
    }
  }

  // 清理资源
  cleanup() {
    if (this.notificationSubscription) {
      Notifications.removeNotificationSubscription(this.notificationSubscription);
    }
    if (this.responseSubscription) {
      Notifications.removeNotificationSubscription(this.responseSubscription);
    }
  }
}

// 创建单例实例
const notificationService = new NotificationService();

export default notificationService; 