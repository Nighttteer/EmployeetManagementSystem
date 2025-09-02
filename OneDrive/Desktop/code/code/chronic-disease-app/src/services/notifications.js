/**
 * 通知服务 (Notification Service)
 * 
 * 提供完整的推送通知和本地通知功能，包括：
 * - 推送通知权限管理和token获取
 * - 本地通知的创建和管理
 * - 通知事件监听和处理
 * - 用药提醒通知安排
 * - 通知徽章管理
 * 
 * 使用Expo Notifications API实现跨平台通知功能
 * 支持Android和iOS平台的推送通知和本地通知
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { notificationsAPI } from './api';

// ============================================================================
// 全局通知配置
// ============================================================================

// 配置通知行为 - 定义所有通知的默认显示行为
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,    // 显示横幅通知
    shouldShowList: true,      // 在通知列表中显示
    shouldPlaySound: true,     // 播放提示音
    shouldSetBadge: true,      // 设置应用角标
  }),
});

/**
 * 通知服务类
 * 管理所有与通知相关的功能，包括推送通知和本地通知
 */
class NotificationService {
  /**
   * 构造函数
   * 初始化通知服务的状态变量
   */
  constructor() {
    this.pushToken = null;                    // 推送通知token
    this.notificationSubscription = null;     // 通知接收监听器
    this.responseSubscription = null;         // 通知响应监听器
  }

  /**
   * 初始化推送通知服务
   * 
   * 完整的推送通知初始化流程，包括：
   * - 权限检查和请求
   * - 推送token获取
   * - 通知监听器设置
   * - 开发环境和生产环境的适配
   * 
   * @returns {Promise<string|null>} 返回推送token或状态标识
   *   - 成功时返回实际的推送token
   *   - 'simulator-mode': 模拟器模式
   *   - 'permission-denied': 权限被拒绝
   *   - 'local-only': 仅本地通知模式
   *   - null: 初始化失败
   */
  async initialize() {
    try {
      // 在开发模式下，我们简化推送通知的初始化
      console.log('正在初始化推送通知服务...');

      // 检查是否为真实设备（推送通知在模拟器中不可用）
      if (!Device.isDevice) {
        console.log('推送通知在模拟器中不可用，但本地通知仍然可以工作');
        // 即使在模拟器中，我们也设置本地通知监听器
        this.setupNotificationListeners();
        return 'simulator-mode';
      }

      // 请求通知权限
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 如果没有权限，请求用户授权
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // 如果权限被拒绝，记录警告但继续设置本地通知
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

  /**
   * 获取推送通知token
   * 
   * 从Expo推送服务获取唯一的设备标识符
   * 在开发环境中可能会失败，这是正常现象
   * 
   * @returns {Promise<string|null>} 返回推送token，失败时返回null
   */
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

  /**
   * 向后端注册推送token
   * 
   * 将推送token发送到后端服务器，用于推送通知的发送
   * 只有在成功获取token后才会调用
   * 
   * @returns {Promise<void>}
   */
  async registerPushToken() {
    try {
      if (!this.pushToken) return;

      // 获取设备类型（ios/android）
      const deviceType = Platform.OS;
      
      // 调用后端API注册推送token
      await notificationsAPI.registerPushToken(this.pushToken, deviceType);
      console.log('推送token注册成功');
    } catch (error) {
      console.error('注册推送token失败:', error);
    }
  }

  /**
   * 设置通知监听器
   * 
   * 注册通知接收和响应的监听器
   * 这些监听器会在通知到达和用户交互时触发
   */
  setupNotificationListeners() {
    // 监听收到的通知（通知到达时触发）
    this.notificationSubscription = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    // 监听通知响应（用户点击通知时触发）
    this.responseSubscription = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );
  }

  /**
   * 处理收到的通知
   * 
   * 当推送通知到达时触发
   * 可以根据通知类型执行不同的业务逻辑
   * 
   * @param {Object} notification - 通知对象，包含通知的完整信息
   */
  handleNotificationReceived = (notification) => {
    console.log('收到推送通知:', notification);
    
    // 从通知数据中提取类型和具体数据
    const { type, data } = notification.request.content.data || {};
    
    // 根据通知类型执行相应的处理逻辑
    switch (type) {
      case 'medication_reminder':
        // 处理用药提醒通知
        console.log('收到用药提醒推送通知');
        break;
      case 'doctor_advice':
        // 处理医生建议通知
        console.log('收到医生建议推送通知');
        break;
      case 'health_alert':
        // 处理健康告警通知
        console.log('收到健康告警推送通知');
        break;
      default:
        console.log('收到未知类型的推送通知');
        break;
    }
  };

  /**
   * 处理通知响应（用户点击通知）
   * 
   * 当用户点击推送通知时触发
   * 通常用于导航到相关页面或执行特定操作
   * 
   * @param {Object} response - 通知响应对象，包含用户交互信息
   */
  handleNotificationResponse = (response) => {
    console.log('用户点击了通知:', response);
    
    // 从通知数据中提取类型和具体数据
    const { type, data } = response.notification.request.content.data || {};
    
    // 根据通知类型导航到相应页面或执行相应操作
    switch (type) {
      case 'medication_reminder':
        // 导航到用药提醒页面
        console.log('用户点击了用药提醒通知，准备导航到用药页面');
        break;
      case 'doctor_advice':
        // 导航到消息页面
        console.log('用户点击了医生建议通知，准备导航到消息页面');
        break;
      case 'health_alert':
        // 导航到健康数据页面
        console.log('用户点击了健康告警通知，准备导航到健康数据页面');
        break;
      default:
        console.log('用户点击了未知类型的通知');
        break;
    }
  };

  /**
   * 安排本地通知
   * 
   * 创建一个一次性的本地通知
   * 可以用于测试、临时提醒或其他即时通知需求
   * 
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   * @param {Object} [data={}] - 通知数据（可选，用于传递额外信息）
   * @param {number} [triggerSeconds] - 延迟秒数（可选，立即显示如果不提供）
   * @returns {Promise<string|null>} 返回通知标识符，失败时返回null
   */
  async scheduleLocalNotification(title, body, data = {}, triggerSeconds = null) {
    try {
      // 构建通知内容
      const notificationContent = {
        title,
        body,
        data,
        sound: true,  // 播放提示音
      };

      // 设置触发器（如果提供了延迟时间）
      const trigger = triggerSeconds ? { seconds: triggerSeconds } : null;

      // 安排通知并获取标识符
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

  /**
   * 安排用药提醒通知
   * 
   * 根据用药计划创建定时提醒通知
   * 支持多个时间点的提醒设置
   * 
   * @param {Object} medication - 用药信息对象
   * @param {string} medication.id - 用药计划ID
   * @param {string} medication.name - 药品名称
   * @param {string} medication.dosage - 用药剂量
   * @param {Array<string>} medication.times - 服药时间数组（格式：['08:00', '20:00']）
   * @returns {Promise<Array>} 返回已安排的通知标识符数组
   */
  async scheduleMedicationReminder(medication) {
    try {
      const { id, name, dosage, times } = medication;
      
      const scheduledNotifications = [];

      // 为每个服药时间创建提醒通知
      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        // 设置通知触发器（每天重复）
        const trigger = {
          hour: hours,
          minute: minutes,
          repeats: true,
        };

        // 创建用药提醒通知
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: '用药提醒',
            body: `该服用 ${name} (${dosage}) 了`,
            data: {
              type: 'medication_reminder',
              medicationId: id,
              medicationName: name,
            },
            sound: true,  // 播放提示音
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

  /**
   * 取消特定通知
   * 
   * 根据通知标识符取消已安排的通知
   * 
   * @param {string} identifier - 通知标识符
   * @returns {Promise<void>}
   */
  async cancelNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('通知取消成功:', identifier);
    } catch (error) {
      console.error('取消通知失败:', error);
    }
  }

  /**
   * 取消所有已安排的通知
   * 
   * 清除所有已安排的本地通知
   * 通常用于重置通知状态或用户登出时
   * 
   * @returns {Promise<void>}
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('所有通知已取消');
    } catch (error) {
      console.error('取消所有通知失败:', error);
    }
  }

  /**
   * 获取已安排的通知
   * 
   * 获取系统中所有已安排的本地通知
   * 用于显示通知列表或管理通知状态
   * 
   * @returns {Promise<Array>} 返回已安排的通知列表
   */
  async getScheduledNotifications() {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('获取到已安排的通知数量:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('获取已安排通知失败:', error);
      return [];
    }
  }

  /**
   * 设置通知徽章数量
   * 
   * 在应用图标上显示未读通知的数量
   * 通常用于提醒用户有新的通知
   * 
   * @param {number} count - 徽章显示的数量
   * @returns {Promise<void>}
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('徽章数量设置成功:', count);
    } catch (error) {
      console.error('设置徽章数量失败:', error);
    }
  }

  /**
   * 清除通知徽章
   * 
   * 将应用图标上的通知徽章数量设置为0
   * 通常在用户查看所有通知后调用
   * 
   * @returns {Promise<void>}
   */
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('徽章已清除');
    } catch (error) {
      console.error('清除徽章失败:', error);
    }
  }

  /**
   * 清理资源
   * 
   * 移除通知监听器，释放内存资源
   * 通常在组件卸载或服务停止时调用
   */
  cleanup() {
    // 移除通知接收监听器
    if (this.notificationSubscription) {
      this.notificationSubscription.remove();
      this.notificationSubscription = null;
    }
    
    // 移除通知响应监听器
    if (this.responseSubscription) {
      this.responseSubscription.remove();
      this.responseSubscription = null;
    }
    
    console.log('通知服务资源已清理');
  }
}

// ============================================================================
// 导出配置
// ============================================================================

// 创建单例实例，确保整个应用使用同一个通知服务实例
const notificationService = new NotificationService();

// 导出默认服务实例
export default notificationService; 