/**
 * 用药提醒服务 (Medication Reminder Service)
 * 
 * 提供完整的用药提醒功能，包括：
 * - 本地推送通知设置和管理
 * - 用药时间安排和提醒
 * - 服药记录和依从性跟踪
 * - 用药计划管理
 * - 用户偏好设置
 * 
 * 使用Expo Notifications API实现跨平台推送通知
 * 支持Android和iOS平台的本地通知功能
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

/**
 * 用药提醒服务类
 * 管理所有与用药提醒相关的功能
 */
class MedicationReminderService {
  /**
   * 构造函数
   * 初始化服务并设置通知系统
   */
  constructor() {
    // 在实例化时自动设置通知系统
    this.setupNotifications();
  }

  /**
   * 设置通知系统
   * 
   * 配置推送通知的权限、处理器和监听器
   * 包括权限请求、通知处理器设置和事件监听器注册
   * 
   * @returns {Promise<boolean>} 设置是否成功
   */
  async setupNotifications() {
    // 检查现有通知权限状态
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // 如果没有权限，请求用户授权
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // 如果权限被拒绝，记录日志并返回失败
    if (finalStatus !== 'granted') {
      console.log('通知权限被拒绝');
      return false;
    }

    // 设置通知处理器，定义通知的显示行为
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,      // 显示横幅通知
        shouldShowList: true,        // 在通知列表中显示
        shouldPlaySound: true,       // 播放提示音
        shouldSetBadge: false,       // 不设置应用角标
      }),
    });

    // 注册通知接收监听器（通知到达时触发）
    Notifications.addNotificationReceivedListener(this.handleNotificationReceived);
    
    // 注册通知响应监听器（用户点击通知时触发）
    Notifications.addNotificationResponseReceivedListener(this.handleNotificationResponse);

    return true;
  }

  /**
   * 处理收到的通知
   * 
   * 当用药提醒通知到达时触发
   * 可以在这里添加通知到达时的业务逻辑
   * 
   * @param {Object} notification - 通知对象
   */
  handleNotificationReceived = (notification) => {
    console.log('收到用药提醒通知:', notification);
    
    // 从通知数据中提取相关信息
    const { type, medicationId, medicationName } = notification.request.content.data || {};
    
    // 如果是用药提醒类型的通知，执行相应逻辑
    if (type === 'medication_reminder') {
      // 可以在这里处理用药提醒逻辑
      console.log(`用药提醒: ${medicationName}`);
    }
  };

  /**
   * 处理通知响应（用户点击通知）
   * 
   * 当用户点击用药提醒通知时触发
   * 通常用于导航到相关页面或显示确认对话框
   * 
   * @param {Object} response - 通知响应对象
   */
  handleNotificationResponse = (response) => {
    console.log('用户点击了用药提醒通知:', response);
    
    // 从通知数据中提取相关信息
    const { type, medicationId, medicationName } = response.notification.request.content.data || {};
    
    // 如果是用药提醒类型的通知，执行相应逻辑
    if (type === 'medication_reminder') {
      // 导航到用药页面或显示用药确认对话框
      console.log(`用户点击了 ${medicationName} 的用药提醒`);
    }
  };

  /**
   * 安排用药提醒
   * 
   * 根据用药计划创建定时提醒通知
   * 支持多种服药频次和时间设置
   * 
   * @param {Object} medication - 用药信息对象
   * @param {string} medication.id - 用药计划ID
   * @param {string} medication.name - 药品名称
   * @param {string} medication.dosage - 用药剂量
   * @param {string} medication.frequency - 服药频次（BID、TID、QID等）
   * @param {string} medication.timeOfDay - 服药时间（before_breakfast、after_lunch等）
   * @param {string} medication.startDate - 开始日期
   * @param {string} medication.endDate - 结束日期
   * @param {string} medication.instructions - 用药说明
   * @returns {Promise<Array>} 返回已安排的提醒列表
   */
  async scheduleMedicationReminder(medication) {
    try {
      // 解构用药信息
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

      // 解析服药时间，根据频次生成具体时间点
      const times = this.parseTimeOfDay(timeOfDay, frequency);
      
      const scheduledNotifications = [];

      // 为每个时间点创建提醒通知
      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        // 设置通知触发器（每天重复）
        const trigger = {
          hour: hours,
          minute: minutes,
          repeats: true,
        };

        // 创建通知内容
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
            priority: Notifications.AndroidNotificationPriority.HIGH, // Android高优先级
          },
          trigger,
        });

        // 保存通知信息到本地
        scheduledNotifications.push({
          identifier,
          medicationId: id,
          time: time,
        });
      }

      // 保存到本地存储，便于后续管理
      await this.saveScheduledReminders(scheduledNotifications);

      return scheduledNotifications;
    } catch (error) {
      console.error('安排用药提醒失败:', error);
      return [];
    }
  }

  /**
   * 解析服药时间
   * 
   * 根据服药时间描述和频次，生成具体的提醒时间点
   * 支持多种时间描述和频次组合
   * 
   * @param {string} timeOfDay - 服药时间描述
   * @param {string} frequency - 服药频次
   * @returns {Array<string>} 返回时间点数组（格式：HH:MM）
   */
  parseTimeOfDay(timeOfDay, frequency) {
    // 时间映射表：将描述性时间转换为具体时间
    const timeMapping = {
      'before_breakfast': '07:00',    // 早餐前
      'after_breakfast': '08:00',     // 早餐后
      'before_lunch': '11:30',        // 午餐前
      'after_lunch': '12:30',         // 午餐后
      'before_dinner': '17:30',       // 晚餐前
      'after_dinner': '18:30',        // 晚餐后
      'before_sleep': '21:00',        // 睡前
      'morning': '08:00',             // 早晨
      'noon': '12:00',                // 中午
      'evening': '20:00',             // 晚上
    };

    // 获取基础时间，如果没有匹配则使用默认时间
    const baseTime = timeMapping[timeOfDay] || '08:00';
    const times = [baseTime];

    // 根据频次添加额外时间点
    switch (frequency) {
      case 'BID':    // 每日两次
        times.push(this.addHours(baseTime, 12));
        break;
      case 'TID':    // 每日三次
        times.push(this.addHours(baseTime, 8));
        times.push(this.addHours(baseTime, 16));
        break;
      case 'QID':    // 每日四次
        times.push(this.addHours(baseTime, 6));
        times.push(this.addHours(baseTime, 12));
        times.push(this.addHours(baseTime, 18));
        break;
      case 'Q12H':   // 每12小时
        times.push(this.addHours(baseTime, 12));
        break;
      case 'Q8H':    // 每8小时
        times.push(this.addHours(baseTime, 8));
        times.push(this.addHours(baseTime, 16));
        break;
      case 'Q6H':    // 每6小时
        times.push(this.addHours(baseTime, 6));
        times.push(this.addHours(baseTime, 12));
        times.push(this.addHours(baseTime, 18));
        break;
    }

    return times;
  }

  /**
   * 添加小时数
   * 
   * 在给定时间基础上添加指定小时数
   * 自动处理24小时循环
   * 
   * @param {string} timeString - 时间字符串（格式：HH:MM）
   * @param {number} hours - 要添加的小时数
   * @returns {string} 返回新的时间字符串（格式：HH:MM）
   */
  addHours(timeString, hours) {
    const [h, m] = timeString.split(':').map(Number);
    const newHour = (h + hours) % 24; // 使用模运算处理24小时循环
    return `${newHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * 取消用药提醒
   * 
   * 取消指定药品的所有提醒通知
   * 同时更新本地存储
   * 
   * @param {string} medicationId - 用药计划ID
   * @returns {Promise<boolean>} 返回是否成功取消
   */
  async cancelMedicationReminder(medicationId) {
    try {
      // 获取所有已安排的提醒
      const scheduledReminders = await this.getScheduledReminders();
      
      // 筛选出需要取消的提醒
      const remindersToCancel = scheduledReminders.filter(
        reminder => reminder.medicationId === medicationId
      );

      // 逐个取消通知
      for (const reminder of remindersToCancel) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }

      // 更新本地存储，移除已取消的提醒
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

  /**
   * 获取所有已安排的通知
   * 
   * 获取系统中所有已安排的本地通知
   * 包括用药提醒和其他类型的通知
   * 
   * @returns {Promise<Array>} 返回已安排的通知列表
   */
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('获取已安排通知失败:', error);
      return [];
    }
  }

  /**
   * 保存提醒到本地存储
   * 
   * 将提醒信息保存到安全存储中
   * 使用JSON格式序列化数据
   * 
   * @param {Array} reminders - 提醒信息数组
   */
  async saveScheduledReminders(reminders) {
    try {
      // 动态导入SecureStore，避免循环依赖
      const { SecureStore } = await import('expo-secure-store');
      await SecureStore.setItemAsync(
        'scheduled_medication_reminders',
        JSON.stringify(reminders)
      );
    } catch (error) {
      console.error('保存提醒失败:', error);
    }
  }

  /**
   * 从本地存储获取提醒
   * 
   * 从安全存储中读取保存的提醒信息
   * 自动解析JSON格式的数据
   * 
   * @returns {Promise<Array>} 返回提醒信息数组
   */
  async getScheduledReminders() {
    try {
      // 动态导入SecureStore，避免循环依赖
      const { SecureStore } = await import('expo-secure-store');
      const reminders = await SecureStore.getItemAsync('scheduled_medication_reminders');
      return reminders ? JSON.parse(reminders) : [];
    } catch (error) {
      console.error('获取提醒失败:', error);
      return [];
    }
  }

  /**
   * 记录服药
   * 
   * 记录用户已服用的药物信息
   * 包括服药时间、剂量和备注
   * 
   * @param {string} medicationId - 用药计划ID
   * @param {string} [dosage] - 实际服用的剂量（可选）
   * @param {string} [notes] - 备注信息（可选）
   * @returns {Promise<Object>} 返回记录结果
   * @throws {Error} 当API调用失败时抛出错误
   */
  async recordMedicationTaken(medicationId, dosage = null, notes = '') {
    try {
      // 调用后端API记录服药信息
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

  /**
   * 跳过服药
   * 
   * 记录用户跳过的药物信息
   * 包括跳过原因和时间
   * 
   * @param {string} medicationId - 用药计划ID
   * @param {string} [reason] - 跳过原因（可选）
   * @returns {Promise<Object>} 返回跳过记录结果
   * @throws {Error} 当API调用失败时抛出错误
   */
  async skipMedication(medicationId, reason = '') {
    try {
      // 调用后端API记录跳过服药信息
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

  /**
   * 获取今日用药计划
   * 
   * 获取当前日期有效的用药计划
   * 自动过滤过期和未开始的计划
   * 
   * @returns {Promise<Array>} 返回今日用药计划列表
   */
  async getTodayMedications() {
    try {
      // 使用患者专用的用药计划端点
      const response = await api.get('/medication/patient/plans/');
      const plans = response.data?.plans || [];
      
      // 添加详细的调试信息
      console.log('🔍 原始用药计划数据:', {
        plansCount: plans.length,
        firstPlan: plans[0],
        allPlans: plans
      });
      
      // 过滤出今日的用药计划
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      console.log('🔍 日期过滤信息:', {
        today: todayString,
        todayDate: today
      });
      
      // 过滤和转换今日用药计划
      const todayMedications = plans.filter(plan => {
        console.log('🔍 检查计划:', {
          planId: plan.id,
          planName: plan.medication?.name,
          startDate: plan.start_date,
          endDate: plan.end_date,
          status: plan.status,
          hasStartDate: !!plan.start_date,
          hasEndDate: !!plan.end_date,
          isActive: plan.status === 'active'
        });
        
        // 放宽过滤条件：如果没有日期信息，也包含进来
        if (!plan.start_date && !plan.end_date) {
          console.log('✅ 计划无日期限制，包含');
          return true;
        }
        
        if (!plan.start_date || !plan.end_date) {
          console.log('⚠️ 计划日期信息不完整，包含');
          return true;
        }
        
        // 检查日期范围
        const startDate = new Date(plan.start_date);
        const endDate = new Date(plan.end_date);
        const todayDate = new Date(todayString);
        
        const isInDateRange = todayDate >= startDate && todayDate <= endDate;
        const isActive = plan.status === 'active';
        
        console.log('🔍 日期范围检查:', {
          startDate,
          endDate,
          todayDate,
          isInDateRange,
          isActive,
          result: isInDateRange && isActive
        });
        
        return isInDateRange && isActive;
      }).map(plan => ({
        ...plan,
        id: plan.id,
        name: plan.medication?.name || '未知药物',
        dosage: plan.dosage || '未知剂量',
        status: 'pending', // 添加状态字段，默认为pending
        time_of_day: plan.time_of_day || [],
        frequency: plan.frequency || '未知频次'
      }));
      
      console.log('📊 今日用药数据转换完成:', {
        originalPlans: plans.length,
        todayMedications: todayMedications.length,
        sample: todayMedications[0],
        allTodayMedications: todayMedications
      });
      
      return todayMedications;
    } catch (error) {
      console.error('获取今日用药失败:', error);
      // 返回空数组而不是抛出错误，避免页面崩溃
      return [];
    }
  }

  /**
   * 获取用药计划
   * 
   * 获取用户的所有用药计划
   * 
   * @returns {Promise<Object>} 返回用药计划数据
   */
  async getMedicationPlans() {
    try {
      const response = await api.get('/medication/plans/');
      return response.data;
    } catch (error) {
      console.error('获取用药计划失败:', error);
      // 返回空数组而不是抛出错误
      return [];
    }
  }

  /**
   * 获取用药历史
   * 
   * 获取用户的用药记录历史
   * 支持分页查询
   * 
   * @param {number} [page=1] - 页码
   * @returns {Promise<Object>} 返回用药历史数据
   */
  async getMedicationHistory(page = 1) {
    try {
      const response = await api.get('/medication/history/', {
        params: { page, page_size: 20 }
      });
      return response.data;
    } catch (error) {
      console.error('获取用药历史失败:', error);
      // 返回空数组而不是抛出错误
      return [];
    }
  }

  /**
   * 获取用药依从性统计
   * 
   * 获取用户的用药依从性数据
   * 包括按时服药率、漏服次数等统计信息
   * 
   * @returns {Promise<Object>} 返回依从性统计数据
   */
  async getComplianceStats() {
    try {
      const response = await api.get('/medication/compliance-stats/');
      return response.data;
    } catch (error) {
      console.error('获取依从性统计失败:', error);
      // 返回空数组而不是抛出错误
      return [];
    }
  }

  /**
   * 设置提醒偏好
   * 
   * 保存用户的提醒设置偏好
   * 包括声音、震动、提前提醒时间等设置
   * 
   * @param {Object} preferences - 偏好设置对象
   */
  async setReminderPreferences(preferences) {
    try {
      // 动态导入SecureStore，避免循环依赖
      const { SecureStore } = await import('expo-secure-store');
      await SecureStore.setItemAsync(
        'medication_reminder_preferences',
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('保存提醒偏好失败:', error);
    }
  }

  /**
   * 获取提醒偏好
   * 
   * 获取用户保存的提醒设置偏好
   * 如果没有保存过，返回默认设置
   * 
   * @returns {Promise<Object>} 返回提醒偏好设置
   */
  async getReminderPreferences() {
    try {
      // 动态导入SecureStore，避免循环依赖
      const { SecureStore } = await import('expo-secure-store');
      const preferences = await SecureStore.getItemAsync('medication_reminder_preferences');
      
      // 如果没有保存过偏好，返回默认设置
      return preferences ? JSON.parse(preferences) : {
        enabled: true,           // 启用提醒
        sound: true,             // 播放声音
        vibration: true,         // 震动提醒
        advanceMinutes: 5,       // 提前5分钟提醒
        repeatInterval: 15,      // 重复间隔15分钟
      };
    } catch (error) {
      console.error('获取提醒偏好失败:', error);
      // 出错时返回默认设置
      return {
        enabled: true,
        sound: true,
        vibration: true,
        advanceMinutes: 5,
        repeatInterval: 15,
      };
    }
  }

  /**
   * 清除所有提醒
   * 
   * 取消所有已安排的本地通知
   * 清空本地存储的提醒信息
   * 
   * @returns {Promise<boolean>} 返回是否成功清除
   */
  async clearAllReminders() {
    try {
      // 取消所有已安排的通知
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // 清空本地存储的提醒信息
      await this.saveScheduledReminders([]);
      
      return true;
    } catch (error) {
      console.error('清除所有提醒失败:', error);
      return false;
    }
  }

  /**
   * 安排本地通知
   * 
   * 安排一个一次性的本地通知
   * 可以用于测试或其他临时提醒
   * 
   * @param {string} title - 通知标题
   * @param {string} body - 通知内容
   * @param {Object} [data={}] - 通知数据（可选）
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
        sound: true,
      };

      // 设置触发器（如果提供了延迟时间）
      const trigger = triggerSeconds ? { seconds: triggerSeconds } : null;

      // 安排通知
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

// ============================================================================
// 导出配置
// ============================================================================

// 创建单例实例，确保整个应用使用同一个服务实例
const medicationReminderService = new MedicationReminderService();

// 导出默认服务实例
export default medicationReminderService; 