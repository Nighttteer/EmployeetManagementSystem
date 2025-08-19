import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Text,
  Card,
  Button,
  Chip,
  List,
  FAB,
  Portal,
  TextInput,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import * as Notifications from 'expo-notifications';
import i18n from 'i18next';
import { userAPI, medicationAPI } from '../../services/api';

const MedicationScreen = ({ navigation }) => {
  const { t, ready, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const [refreshing, setRefreshing] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);
  



  const getMedicationData = async () => {
    try {
      if (!user || !user.id) {
        console.log('❌ 用户信息缺失，无法获取用药数据');
        return {
    todayMedications: [],
    medicationPlans: [],
    medicationHistory: []
        };
      }

      console.log('🔍 开始获取用户用药数据');
      console.log('🔍 用户认证ID:', user.id);
      console.log('🔍 用户角色:', user.role);
      console.log('🔍 用户手机号:', user.phone);
      console.log('🔍 用户姓名:', user.name);
      
      // 获取用药计划 - 病人端应该获取医生为自己制定的用药计划
      // 重要：病人端的用药计划完全基于医生端的设置
      console.log('👤 当前用户信息:', user);
      console.log('🆔 用户认证ID:', user.id);
      console.log('🏥 用户角色:', user.role);
      
      // 病人端应该调用与医生端相同的API，获取自己的用药计划
      let plansResponse;
      if (user.role === 'patient') {
        // 重要：确认user.id是否就是病人的ID
        // 如果user.id是用户认证ID而不是病人ID，这里需要调整
        console.log('🔍 使用用户ID作为病人ID:', user.id);
        console.log('🔍 如果这是错误的，需要从用户信息中获取正确的病人ID');
        
        // 尝试使用病人端API获取用药计划
        try {
          plansResponse = await userAPI.getMedicationPlan();
          console.log('📋 病人端用药计划API响应（使用病人专用端点）:', plansResponse.data);
          
          // 如果病人端API返回空数据，尝试使用医生端API（需要权限调整）
          if (!plansResponse.data || 
              (plansResponse.data.medications && plansResponse.data.medications.length === 0) ||
              (Array.isArray(plansResponse.data) && plansResponse.data.length === 0)) {
            console.log('⚠️ 病人端API返回空数据，尝试使用医生端API');
            try {
              const doctorAPIResponse = await medicationAPI.getMedicationPlans(user.id);
              console.log('📋 医生端API响应（作为备选）:', doctorAPIResponse.data);
              plansResponse = doctorAPIResponse;
            } catch (doctorError) {
              console.log('❌ 医生端API也失败，使用空数据:', doctorError.message);
              plansResponse = { data: { medications: [], message: '所有API都失败' } };
            }
          }
        } catch (error) {
          console.log('⚠️ 病人端API调用失败，尝试医生端API:', error.message);
          try {
            const doctorAPIResponse = await medicationAPI.getMedicationPlans(user.id);
            console.log('📋 医生端API响应（作为备选）:', doctorAPIResponse.data);
            plansResponse = doctorAPIResponse;
          } catch (doctorError) {
            console.log('❌ 医生端API也失败，使用空数据:', doctorError.message);
            plansResponse = { data: { medications: [], message: '所有API都失败' } };
          }
        }
      } else {
        console.log('⚠️ 用户角色不是病人:', user.role);
        plansResponse = { data: { medications: [], message: '用户角色错误' } };
      }
      
      console.log('📋 响应数据类型:', typeof plansResponse.data);
      console.log('📋 响应数据键:', Object.keys(plansResponse.data || {}));
      if (plansResponse.data?.medications) {
        console.log('📋 medications字段类型:', typeof plansResponse.data.medications);
        console.log('📋 medications是否为数组:', Array.isArray(plansResponse.data.medications));
      }
      
      // 获取用药历史和统计 - 病人端暂时使用空数据
      // 注意：病人端没有专门的用药历史和统计API端点
      // 这些功能可能需要医生端提供，或者后续开发专门的病人端API
      let medicationHistory = [];
      let medicationStats = {};
      
      console.log('📚 病人端用药历史（暂时为空，等待API开发）:', medicationHistory);
      console.log('📊 病人端用药统计（暂时为空，等待API开发）:', medicationStats);
      
      // 处理用药计划数据 - 修复数据结构问题
      let medicationPlans = [];
      if (plansResponse.data && typeof plansResponse.data === 'object') {
        if (Array.isArray(plansResponse.data)) {
          // 如果直接是数组
          medicationPlans = plansResponse.data;
        } else if (plansResponse.data.medications && Array.isArray(plansResponse.data.medications)) {
          // 如果是包含 medications 字段的对象
          medicationPlans = plansResponse.data.medications;
        } else if (plansResponse.data.data && Array.isArray(plansResponse.data.data)) {
          // 如果是包含 data 字段的对象
          medicationPlans = plansResponse.data.data;
        } else {
          console.log('⚠️ 未知的用药计划数据结构:', plansResponse.data);
          medicationPlans = [];
        }
      }
      console.log('💊 处理后的用药计划:', medicationPlans);
      console.log('💊 用药计划详情:', medicationPlans.map(plan => ({
        id: plan.id,
        name: plan.medication?.name || plan.medication_name || plan.name,
        status: plan.status,
        time_of_day: plan.time_of_day,
        frequency: plan.frequency,
        dosage: plan.dosage
      })));
      
      // 处理用药历史数据（病人端暂时为空）
      console.log('📖 处理后的用药历史:', medicationHistory);
      
      // 生成今日用药提醒（基于用药计划）
      console.log('🔍 开始生成今日用药提醒，用药计划数量:', medicationPlans.length);
      
      const todayMedications = medicationPlans
        .filter(plan => {
          console.log('🔍 检查计划状态:', {
            id: plan.id,
            status: plan.status,
            isActive: plan.status === 'active',
            medication: plan.medication,
            medication_name: plan.medication_name,
            dosage: plan.dosage,
            time_of_day: plan.time_of_day
          });
          return plan.status === 'active';
        })
        .map(plan => {
          // 详细记录每个计划的数据结构
          console.log('📋 处理用药计划:', {
            id: plan.id,
            medication: plan.medication,
            medication_name: plan.medication_name,
            dosage: plan.dosage,
            time_of_day: plan.time_of_day,
            instructions: plan.instructions,
            side_effects: plan.side_effects,
            category: plan.medication?.category,
            frequency: plan.frequency
          });
          
          // 智能提取药物名称
          let medicationName = '未知药物';
          if (plan.medication?.name) {
            medicationName = plan.medication.name;
          } else if (plan.medication_name) {
            medicationName = plan.medication_name;
          } else if (plan.name) {
            medicationName = plan.name;
          }
          
          // 智能提取剂量
          let dosage = '未知剂量';
          if (plan.dosage) {
            dosage = plan.dosage;
          } else if (plan.medication?.dosage) {
            dosage = plan.medication.dosage;
          }
          
          // 智能提取时间
          let time = '08:00';
          if (plan.time_of_day) {
            if (Array.isArray(plan.time_of_day)) {
              time = plan.time_of_day[0] || '08:00';
            } else if (typeof plan.time_of_day === 'string') {
              time = plan.time_of_day;
            }
          }
          
          // 智能提取类别
          let category = '未知类别';
          if (plan.medication?.category) {
            category = plan.medication.category;
          } else if (plan.category) {
            category = plan.category;
          }
          
          const medication = {
            id: plan.id,
            name: medicationName,
            dosage: dosage,
            time: time,
        status: 'pending',
        taken: false,
            category: category,
            instructions: plan.instructions || '按医嘱服用',
            sideEffects: plan.side_effects || '请咨询医生',
            planId: plan.id,
            frequency: plan.frequency || '未知频次'
          };
          
          console.log('💊 生成的用药提醒:', medication);
          return medication;
        });
      
      console.log('⏰ 生成的今日用药提醒:', todayMedications);
      
      return {
        todayMedications,
        medicationPlans,
        medicationHistory
      };
      
    } catch (error) {
      console.error('❌ 获取用药数据失败:', error);
      // 返回空数据，避免应用崩溃
      return {
    todayMedications: [],
    medicationPlans: [],
    medicationHistory: []
      };
    }
  };

  const loadMedicationData = async () => {
    try {
      console.log('🔄 开始加载用药数据...');
      const data = await getMedicationData();
      setMedicationData(data);
      console.log('✅ 用药数据加载完成:', data.todayMedications.length, '个今日用药');
      console.log('📊 用药计划数量:', data.medicationPlans.length);
      console.log('📚 用药历史数量:', data.medicationHistory.length);
      
      // 数据加载完成后，重新设置用药提醒
      if (data.medicationPlans.length > 0) {
        console.log('🔄 检测到用药计划，重新设置用药提醒');
        // 先更新状态，再设置提醒
        setMedicationData(data);
        // 等待状态更新完成后再设置提醒
        setTimeout(async () => {
          await scheduleMedicationReminders();
        }, 100);
      } else {
        setMedicationData(data);
      }
    } catch (error) {
      console.error('❌ 加载用药数据失败:', error);
      // 设置空数据，避免界面崩溃
      setMedicationData({
        todayMedications: [],
        medicationPlans: [],
        medicationHistory: []
      });
    }
  };

  // 设置用药提醒通知
  const setupMedicationReminders = async () => {
    try {
    // 请求通知权限
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.permissionDenied'), t('medication.permissionRequired'));
      return;
    }

    // 设置通知处理器
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true, // 显示横幅通知
        shouldShowList: true,   // 在通知列表中显示
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

      console.log('✅ 通知权限已获取，开始设置用药提醒');
      
      // 设置用药提醒
      await scheduleMedicationReminders();
      
    } catch (error) {
      console.error('❌ 设置用药提醒失败:', error);
    }
  };

  // 根据用药计划设置定时提醒
  const scheduleMedicationReminders = async () => {
    try {
      // 获取当前的用药数据
      const currentData = await getMedicationData();
      if (!currentData.medicationPlans || currentData.medicationPlans.length === 0) {
        console.log('⚠️ 没有用药计划，跳过提醒设置');
        return;
      }
      
      console.log(`📋 开始设置 ${currentData.medicationPlans.length} 个用药计划的提醒`);

      // 清除之前的提醒
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🧹 已清除之前的用药提醒');

      // 为每个用药计划设置提醒
      for (const plan of currentData.medicationPlans) {
        if (plan.status === 'active' && plan.time_of_day) {
          await schedulePlanReminders(plan);
        }
      }

      console.log('✅ 用药提醒设置完成');
      
    } catch (error) {
      console.error('❌ 设置用药提醒失败:', error);
    }
  };

  // 为单个用药计划设置提醒
  const schedulePlanReminders = async (plan) => {
    try {
      const times = Array.isArray(plan.time_of_day) ? plan.time_of_day : [plan.time_of_day];
      
      // 获取药物名称
      const medicationName = plan.medication?.name || plan.medication_name || '药物';
      const dosage = plan.dosage || '未知剂量';
      
      // 如果只有一个时间点，设置单个提醒
      if (times.length === 1) {
        const timeStr = times[0];
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return;

        const trigger = { hour: hours, minute: minutes, repeats: true };
        const notificationContent = {
          content: {
            title: '💊 用药提醒',
            body: `该服用 ${medicationName} 了 (${dosage})`,
            data: { 
              planId: plan.id,
              medicationName,
              dosage,
              time: timeStr,
              frequency: plan.frequency
            },
          },
          trigger,
        };

        await Notifications.scheduleNotificationAsync(notificationContent);
        console.log(`⏰ 已设置单次用药提醒: ${medicationName} - ${timeStr}`);
      } 
      // 如果有多个时间点，设置一个智能提醒
      else if (times.length > 1) {
        // 按时间排序
        const sortedTimes = times.sort();
        const firstTime = sortedTimes[0];
        const lastTime = sortedTimes[sortedTimes.length - 1];
        
        // 设置第一个时间的提醒
        const [hours, minutes] = firstTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const trigger = { hour: hours, minute: minutes, repeats: true };
          const notificationContent = {
            content: {
              title: '💊 用药提醒',
              body: `该服用 ${medicationName} 了 (${dosage}) - 今日第1次`,
              data: { 
                planId: plan.id,
                medicationName,
                dosage,
                time: firstTime,
                frequency: plan.frequency,
                totalTimes: times.length,
                currentTime: 1,
                allTimes: times
              },
            },
            trigger,
          };

          await Notifications.scheduleNotificationAsync(notificationContent);
          console.log(`⏰ 已设置多次用药提醒: ${medicationName} - 今日第1次 (${firstTime})`);
        }
        
        // 设置其他时间的提醒（间隔提醒）
        for (let i = 1; i < times.length; i++) {
          const timeStr = times[i];
          const [hours, minutes] = timeStr.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) continue;

          const trigger = { hour: hours, minute: minutes, repeats: true };
          const notificationContent = {
            content: {
              title: '💊 用药提醒',
              body: `该服用 ${medicationName} 了 (${dosage}) - 今日第${i + 1}次`,
              data: { 
                planId: plan.id,
                medicationName,
                dosage,
                time: timeStr,
                frequency: plan.frequency,
                totalTimes: times.length,
                currentTime: i + 1,
                allTimes: times
              },
            },
            trigger,
          };

          await Notifications.scheduleNotificationAsync(notificationContent);
          console.log(`⏰ 已设置多次用药提醒: ${medicationName} - 今日第${i + 1}次 (${timeStr})`);
        }
      }
      
    } catch (error) {
      console.error(`❌ 设置用药计划提醒失败 (${plan.id}):`, error);
    }
  };





  // 初始化用药数据 - 延迟初始化避免翻译问题
  const [medicationData, setMedicationData] = useState({
    todayMedications: [],
    medicationPlans: [],
    medicationHistory: []
  });
  const [forceUpdate, setForceUpdate] = useState(0);

  // 监听语言变化
  useEffect(() => {
    if (ready && i18n.isInitialized) {
      setI18nReady(true);
      console.log(`🌍 病人端用药管理界面语言: ${i18n.language}`);
    }
  }, [ready, i18n.isInitialized, i18n.language]);

  // 监听Redux语言状态变化
  useEffect(() => {
    if (currentLanguage && i18n.language !== currentLanguage) {
      console.log(`🔄 同步语言状态: Redux=${currentLanguage}, i18n=${i18n.language}`);
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  // 等待国际化系统准备就绪
  useEffect(() => {
    if (ready && t && typeof t === 'function') {
      console.log('🌍 国际化系统已准备就绪');
      console.log('🌍 当前语言:', i18n.language);
      console.log('🌍 测试翻译:', t('common.medicationReminder'));
      console.log('👤 当前用户信息:', user);
      setI18nReady(true);
      loadMedicationData();
      // 移除这里的 setupMedicationReminders() 调用，等数据加载完成后再调用
    } else {
      console.log('❌ 国际化系统未准备就绪');
      setI18nReady(false);
    }
  }, [ready, t, user]);

  // 检查并重置每日计数器，同时更新时间点
  useEffect(() => {
    const checkAndResetDailyCounters = () => {
      const today = new Date().toISOString().split('T')[0];
      
      setMedicationData(prev => ({
        ...prev,
        medicationPlans: prev.medicationPlans.map(plan => {
          // 如果最后服用时间或跳过时间不是今天，重置计数器
          const lastTakenDate = plan.last_taken ? new Date(plan.last_taken).toISOString().split('T')[0] : null;
          const lastSkippedDate = plan.last_skipped ? new Date(plan.last_skipped).toISOString().split('T')[0] : null;
          
          if ((lastTakenDate && lastTakenDate !== today) || (lastSkippedDate && lastSkippedDate !== today)) {
            console.log(`🔄 重置 ${plan.medication?.name || '药物'} 的每日计数器`);
            return { 
              ...plan, 
              taken_count_today: 0,
              skipped_count_today: 0,
              current_time_slot: getCurrentTimeSlot(plan) // 重新计算当前时间点
            };
          } else {
            // 即使不是跨日，也要更新时间点和检查自动跳过
            const planWithAutoSkip = checkAndAutoSkip(plan);
            return {
              ...planWithAutoSkip,
              current_time_slot: getCurrentTimeSlot(planWithAutoSkip)
            };
          }
        }),
      }));
    };

    // 页面加载时检查
    checkAndResetDailyCounters();
    
    // 设置定时器，每5分钟检查一次时间点
    const interval = setInterval(checkAndResetDailyCounters, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 等待国际化系统准备就绪
  if (!i18nReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text>正在加载国际化资源...</Text>
      </View>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicationData();
    setRefreshing(false);
  };

  // 标记药物已服用
  const markAsTaken = async (medicationId, time = null) => {
    try {
      console.log('💊 标记药物已服用:', medicationId, time ? `时间: ${time}` : '');
      
                  // 更新本地状态 - 同时更新用药计划和今日用药
      setMedicationData(prev => {
        const updatedData = {
      ...prev,
          medicationPlans: prev.medicationPlans.map(plan => {
            if (plan.id === medicationId) {
              // 检查今天是否已经服用过
              const today = new Date().toISOString().split('T')[0];
              const lastTakenToday = plan.last_taken && 
                new Date(plan.last_taken).toISOString().split('T')[0] === today;
              
              // 获取当前时间点信息
              const currentTimeSlot = getCurrentTimeSlot(plan);
              const timeArray = Array.isArray(plan.time_of_day) ? plan.time_of_day : [plan.time_of_day];
              
              console.log('🔍 当前时间点信息:', {
                currentTimeSlot,
                timeArray,
                planCurrentTimeSlot: plan.current_time_slot
              });
              
              // 计算今天的服用次数
              let takenCountToday = plan.taken_count_today || 0;
              if (!lastTakenToday) {
                // 如果今天第一次服用，重置计数
                takenCountToday = 1;
              } else {
                // 如果今天已经服用过，增加计数
                takenCountToday += 1;
              }
              
              // 服用后，跳转到下一个时间点
              console.log('🔍 调用 getNextTimeSlot 前的参数:', {
                planId: plan.id,
                currentTimeSlot,
                timeArray: plan.time_of_day
              });
              const nextTimeSlot = getNextTimeSlot(plan, currentTimeSlot);
              
              // 更新用药计划的状态
              const updatedPlan = { 
                ...plan, 
                status: 'active', // 保持计划状态为活跃
                last_taken: new Date().toISOString(), // 记录最后服用时间
                taken_count_today: takenCountToday, // 记录今天服用次数
                skipped_count_today: plan.skipped_count_today || 0, // 保持跳过次数
                current_time_slot: nextTimeSlot, // 跳转到下一个时间点
                compliance_updated: true // 标记需要更新依从性
              };
              
              console.log('📊 更新后的用药计划:', updatedPlan);
              console.log('💊 今天服用次数:', takenCountToday);
              console.log('⏰ 下一个时间点:', nextTimeSlot);
              return updatedPlan;
            }
            return plan;
          }),
                            // 同时更新 todayMedications 中的时间显示
                  todayMedications: prev.todayMedications.map(medication => {
                    // 直接使用 ID 匹配
                    if (medication.id === medicationId) {
                      // 如果这个药物被服用了，更新时间显示
                      const plan = prev.medicationPlans.find(p => p.id === medicationId);
                      if (plan) {
                        const nextTimeSlot = getNextTimeSlot(plan, getCurrentTimeSlot(plan));
                        return {
                          ...medication,
                          time: nextTimeSlot?.time || medication.time
                        };
                      }
                    }
                    return medication;
                  })
        };
        
        console.log('🔄 整个状态更新:', updatedData);
        
        // 强制重新渲染
        setTimeout(() => {
          setForceUpdate(prev => prev + 1);
        }, 100);
        
        return updatedData;
      });
      
      // 调用后端API记录服药
      try {
        console.log('📡 调用后端API记录服药:', medicationId);
        const response = await userAPI.confirmMedication(medicationId, new Date().toISOString());
        console.log('✅ 服药记录已保存到后端:', response);
      } catch (apiError) {
        console.log('⚠️ 后端API调用失败，但本地状态已更新');
        console.log('❌ API错误详情:', {
          message: apiError.message,
          status: apiError.response?.status,
          data: apiError.response?.data,
          config: apiError.config
        });
      }
      
      // 显示成功消息
      const medication = medicationData.medicationPlans.find(m => m.id === medicationId);
      const timeText = time ? ` (${time})` : '';
      Alert.alert(t('common.success'), `${t('medication.medicationRecorded')}${timeText}`);
      
    } catch (error) {
      console.error('❌ 标记药物已服用失败:', error);
      Alert.alert(t('common.error'), t('medication.operationFailed'));
    }
  };

    // 跳过药物
  const skipMedication = (medicationId, time = null) => {
    Alert.alert(
      t('medication.skipMedication'),
      t('medication.confirmSkipMedication'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: async () => {
            try {
              console.log('⏭️ 跳过药物:', medicationId, time ? `时间: ${time}` : '');
              
                            // 更新本地状态 - 同时更新用药计划和今日用药
              setMedicationData(prev => {
                const updatedData = {
              ...prev,
                  medicationPlans: prev.medicationPlans.map(plan => {
                    if (plan.id === medicationId) {
                      // 检查今天是否已经跳过过
                      const today = new Date().toISOString().split('T')[0];
                      const lastSkippedToday = plan.last_skipped && 
                        new Date(plan.last_skipped).toISOString().split('T')[0] === today;
                      
                      // 获取当前时间点信息
                      const currentTimeSlot = getCurrentTimeSlot(plan);
                      
                      // 计算今天的跳过次数
                      let skippedCountToday = plan.skipped_count_today || 0;
                      if (!lastSkippedToday) {
                        // 如果今天第一次跳过，重置计数
                        skippedCountToday = 1;
                      } else {
                        // 如果今天已经跳过过，增加计数
                        skippedCountToday += 1;
                      }
                      
                      // 跳过后，跳转到下一个时间点
                      const nextTimeSlot = getNextTimeSlot(plan, currentTimeSlot);
                      console.log('⏭️ 跳过后的下一个时间点:', nextTimeSlot);
                      
                      // 更新用药计划的状态
                      return { 
                        ...plan, 
                        status: 'active', // 保持计划状态为活跃
                        last_skipped: new Date().toISOString(), // 记录最后跳过时间
                        skipped_count_today: skippedCountToday, // 记录今天跳过次数
                        current_time_slot: nextTimeSlot, // 跳转到下一个时间点
                        compliance_updated: true // 标记需要更新依从性
                      };
                    }
                    return plan;
                  }),
                  // 同时更新 todayMedications 中的时间显示
                  todayMedications: prev.todayMedications.map(medication => {
                    // 直接使用 ID 匹配
                    if (medication.id === medicationId) {
                      // 如果这个药物被跳过了，更新时间显示
                      const plan = prev.medicationPlans.find(p => p.id === medicationId);
                      if (plan) {
                        const nextTimeSlot = getNextTimeSlot(plan, getCurrentTimeSlot(plan));
                        return {
                          ...medication,
                          time: nextTimeSlot?.time || medication.time
                        };
                      }
                    }
                    return medication;
                  })
                };
                
                console.log('🔄 整个状态更新 (跳过):', updatedData);
                
                // 强制重新渲染
                setTimeout(() => {
                  setForceUpdate(prev => prev + 1);
                }, 100);
                
                return updatedData;
              });
              
              // 这里可以添加跳过药物的API调用（如果后端支持）
              // 例如：await userAPI.skipMedication(medicationId, new Date().toISOString());
              
              // 显示成功消息
              const timeText = time ? ` (${time})` : '';
              Alert.alert(t('common.success'), `${t('medication.medicationSkipped')}${timeText}`);
              
            } catch (error) {
              console.error('❌ 跳过药物失败:', error);
              Alert.alert(t('common.error'), t('medication.operationFailed'));
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'skipped': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'taken': return t('medication.taken');
      case 'pending': return t('common.pending');
      case 'skipped': return t('common.skipped');
      default: return t('common.unknown');
    }
  };

  // 渲染单次用药的操作按钮
  const renderSingleMedicationButtons = (medication) => {
    // 查找对应的用药计划
    const plan = medicationData.medicationPlans.find(p => p.id === medication.id);
    
    if (!plan) {
      // 如果没有找到计划，使用原始状态
      return medication.status === 'pending' && (
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => markAsTaken(medication.id)}
            style={[styles.actionButton, styles.takeButton]}
            labelStyle={styles.actionButtonText}
          >
            Take
          </Button>
          <Button
            mode="outlined"
            onPress={() => skipMedication(medication.id)}
            style={[styles.actionButton, styles.skipButton]}
            labelStyle={styles.skipButtonText}
          >
            {t('medication.skip')}
          </Button>
        </View>
      );
    }
    
    // 检查是否达到最大点击数
    const totalDoses = Array.isArray(plan.time_of_day) ? plan.time_of_day.length : 1;
    const takenCount = plan.taken_count_today || 0;
    const skippedCount = plan.skipped_count_today || 0;
    const isCompleted = (takenCount + skippedCount) >= totalDoses;
    
    if (isCompleted) {
      // 今日计划已完成
      return (
        <View style={styles.completedStatus}>
          <Chip 
            style={[styles.statusChip, { backgroundColor: '#4CAF50' }]}
            textStyle={styles.statusChipText}
            icon="check-circle"
          >
                                    {t('medication.todayPlanCompleted')}
          </Chip>
        </View>
      );
    }
    
    // 显示操作按钮
    return (
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={() => markAsTaken(medication.id)}
          style={[styles.actionButton, styles.takeButton]}
          labelStyle={styles.actionButtonText}
        >
          Take
        </Button>
        <Button
          mode="outlined"
          onPress={() => skipMedication(medication.id)}
          style={[styles.actionButton, styles.skipButton]}
          labelStyle={styles.skipButtonText}
        >
          {t('medication.skip')}
        </Button>
      </View>
    );
  };

  // 检查是否需要自动跳过超时的时间点
  const checkAndAutoSkip = (plan) => {
    try {
      const timeArray = Array.isArray(plan.time_of_day) ? plan.time_of_day : [plan.time_of_day];
      if (timeArray.length === 0) return plan;
      
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      let hasChanges = false;
      let updatedPlan = { ...plan };
      
      // 检查每个时间点是否超时
      for (let i = 0; i < timeArray.length; i++) {
        const timeStr = timeArray[i];
        const [hours, minutes] = timeStr.split(':').map(Number);
        const doseTime = hours * 60 + minutes;
        
        // 如果超过20分钟没有处理，自动标记为跳过
        if (currentTime > doseTime + 20) {
          // 检查这个时间点是否已经处理过
          const timeSlotKey = `time_slot_${i}`;
          if (!updatedPlan[timeSlotKey] || updatedPlan[timeSlotKey].status === 'pending') {
            console.log(`⏰ 自动跳过超时时间点: ${timeStr} (${plan.medication?.name || '药物'})`);
            
            // 自动增加跳过计数（避免重复计数）
            if (!updatedPlan[timeSlotKey] || updatedPlan[timeSlotKey].status !== 'skipped') {
              updatedPlan.skipped_count_today = (updatedPlan.skipped_count_today || 0) + 1;
            }
            
            updatedPlan[timeSlotKey] = {
              time: timeStr,
              status: 'skipped',
              skipped_at: new Date().toISOString()
            };
            
            // 自动跳过后，跳转到下一个时间点
            const nextTimeSlot = getNextTimeSlot(updatedPlan, {
              time: timeStr,
              index: i,
              isOverdue: true,
              isCurrent: false
            });
            updatedPlan.current_time_slot = nextTimeSlot;
            
            hasChanges = true;
          }
        }
      }
      
      return hasChanges ? updatedPlan : plan;
    } catch (error) {
      console.error('自动跳过检查失败:', error);
      return plan;
    }
  };

  // 获取下一个时间点
  const getNextTimeSlot = (plan, currentTimeSlot) => {
    try {
      const timeArray = Array.isArray(plan.time_of_day) ? plan.time_of_day : [plan.time_of_day];
      if (timeArray.length === 0) return null;
      
      console.log('🔍 getNextTimeSlot 输入:', { 
        planName: plan.medication?.name, 
        currentTimeSlot, 
        timeArray 
      });
      
      // 如果没有当前时间点，返回第一个
      if (!currentTimeSlot || currentTimeSlot.index === undefined) {
        const firstSlot = {
          time: timeArray[0],
          index: 0,
          isOverdue: false,
          isCurrent: true
        };
        console.log('🔍 返回第一个时间点:', firstSlot);
        return firstSlot;
      }
      
      const nextIndex = currentTimeSlot.index + 1;
      console.log('🔍 下一个索引:', nextIndex, '总长度:', timeArray.length);
      
      // 如果还有下一个时间点
      if (nextIndex < timeArray.length) {
        const nextSlot = {
          time: timeArray[nextIndex],
          index: nextIndex,
          isOverdue: false,
          isCurrent: true
        };
        console.log('🔍 返回下一个时间点:', nextSlot);
        return nextSlot;
      } else {
        // 如果已经是最后一个时间点，返回null表示完成
        console.log('🔍 所有时间点已完成，返回null');
        return null;
      }
    } catch (error) {
      console.error('获取下一个时间点失败:', error);
      return null;
    }
  };

  // 获取当前应该处理的时间点
  const getCurrentTimeSlot = (plan) => {
    try {
      const timeArray = Array.isArray(plan.time_of_day) ? plan.time_of_day : [plan.time_of_day];
      if (timeArray.length === 0) return null;
      
      // 如果计划中已经有当前时间点，使用它
      if (plan.current_time_slot) {
        console.log('🔍 使用计划中已有的当前时间点:', plan.current_time_slot);
        return plan.current_time_slot;
      }
      
      // 否则基于当前时间计算
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      // 找到下一个待处理的时间点
      for (let i = 0; i < timeArray.length; i++) {
        const timeStr = timeArray[i];
        const [hours, minutes] = timeStr.split(':').map(Number);
        const doseTime = hours * 60 + minutes;
        
        // 如果当前时间还没到这个时间点，或者刚过这个时间点（20分钟内），返回这个时间点
        if (currentTime <= doseTime + 20) {
          const timeSlot = {
            time: timeStr,
            index: i,
            isOverdue: currentTime > doseTime,
            isCurrent: currentTime >= doseTime && currentTime <= doseTime + 20
          };
          console.log('🔍 基于当前时间计算的时间点:', timeSlot);
          return timeSlot;
        }
      }
      
      // 如果所有时间点都过了，返回第一个（作为默认值）
      const defaultSlot = {
        time: timeArray[0],
        index: 0,
        isOverdue: false,
        isCurrent: true
      };
      console.log('🔍 返回默认时间点:', defaultSlot);
      return defaultSlot;
    } catch (error) {
      console.error('获取当前时间点失败:', error);
      return null;
    }
  };

  // 检查今天的用药计划状态
  const getTodayPlanStatus = (plan) => {
    const timeArray = Array.isArray(plan.time_of_day) ? plan.time_of_day : [plan.time_of_day];
    const totalDoses = timeArray.length;
    const takenCountToday = plan.taken_count_today || 0;
    const skippedCountToday = plan.skipped_count_today || 0;
    const processedCount = takenCountToday + skippedCountToday;
    
    // 计划完成状态：所有时间点都已处理（服用或跳过）
    if (processedCount >= totalDoses) {
      return {
        status: 'completed',
        text: t('medication.todayPlanCompleted'),
        color: '#2196F3',
        icon: 'check-circle'
      };
    } else if (processedCount > 0) {
      return {
        status: 'in_progress',
        text: `${t('medication.inProgress')} (${takenCountToday}/${totalDoses})`,
        color: '#FF9800',
        icon: 'clock'
      };
    } else {
      return {
        status: 'pending',
        text: t('medication.todayPlanPending'),
        color: '#4CAF50',
        icon: 'play'
      };
    }
  };

  // 检查今天的用药计划是否已完成（保持兼容性）
  const isTodayPlanCompleted = (plan) => {
    const status = getTodayPlanStatus(plan);
    return status.status === 'completed';
  };

  // 计算用药计划的依从性
  const calculateCompliance = (plan) => {
    try {
      // 获取今天的日期
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // 计算今天应该服用的次数
      const timeArray = Array.isArray(plan.time_of_day) ? plan.time_of_day : [plan.time_of_day];
      const totalDoses = timeArray.length;
      
      if (totalDoses === 0) return 0;
      
      // 检查今天是否已经服用过
      const hasTakenToday = plan.last_taken && 
        new Date(plan.last_taken).toISOString().split('T')[0] === todayStr;
      
      // 如果今天没有服用过，依从性为0%
      if (!hasTakenToday) {
        return 0;
      }
      
      // 获取今天实际服用的次数和跳过的次数
      const takenCountToday = plan.taken_count_today || 0;
      const skippedCountToday = plan.skipped_count_today || 0;
      
      // 计算已处理的次数（服用 + 跳过）
      const processedCount = takenCountToday + skippedCountToday;
      
      // 基于实际服用次数计算依从性（不包括跳过的）
      if (takenCountToday > 0) {
        const compliance = Math.round((takenCountToday / totalDoses) * 100);
        // 减少日志输出，避免重复打印
        if (Math.random() < 0.1) { // 只输出10%的日志，减少噪音
          console.log(`📊 依从性计算: ${takenCountToday}/${totalDoses} = ${compliance}%`);
        }
        return Math.min(100, compliance); // 确保不超过100%
      }
      
      return 0;
    } catch (error) {
      console.error('计算依从性失败:', error);
      return 0;
    }
  };

  const getComplianceColor = (compliance) => {
    if (compliance >= 90) return '#4CAF50';
    if (compliance >= 80) return '#FF9800';
    if (compliance >= 70) return '#F57C00';
    return '#F44336';
  };

  const renderTodayMedications = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            {t('common.todayMedications')}
          </Text>
          <View style={styles.headerRight}>
          <Chip mode="outlined" textStyle={styles.chipText}>
              {medicationData.todayMedications.length} {t('common.medications')}
            </Chip>
            <Chip 
              mode="outlined" 
              textStyle={styles.reminderChip}
              style={styles.reminderChip}
              icon="alarm"
            >
              💊 {t('medication.medicationReminderEnabled')}
          </Chip>
          </View>
        </View>
        
                {/* 用药依从性统计 */}
        {medicationData.medicationPlans.length > 0 && (
          <View style={styles.complianceSummary}>
            <Text style={styles.complianceSummaryTitle}>{t('medication.todayComplianceSummary')}</Text>
            <View style={styles.complianceStats}>
              <View style={styles.complianceStat}>
                <Text style={styles.complianceStatNumber}>
                  {medicationData.medicationPlans.reduce((total, plan) => total + (plan.taken_count_today || 0), 0)}
        </Text>
                <Text style={styles.complianceStatLabel}>{t('medication.taken')}</Text>
              </View>
              <View style={styles.complianceStat}>
                <Text style={styles.complianceStatNumber}>
                  {medicationData.medicationPlans.reduce((total, plan) => {
                    const totalDoses = Array.isArray(plan.time_of_day) ? plan.time_of_day.length : 1;
                    const takenCount = plan.taken_count_today || 0;
                    const skippedCount = plan.skipped_count_today || 0;
                    return total + (totalDoses - takenCount - skippedCount);
                  }, 0)}
                </Text>
                <Text style={styles.complianceStatLabel}>{t('medication.pending')}</Text>
              </View>
              <View style={styles.complianceStat}>
                <Text style={styles.complianceStatNumber}>
                  {medicationData.medicationPlans.reduce((total, plan) => total + (plan.skipped_count_today || 0), 0)}
                </Text>
                <Text style={styles.complianceStatLabel}>{t('medication.skipped')}</Text>
              </View>
            </View>
          </View>
        )}
        
        {medicationData.medicationPlans.length > 0 ? (
          medicationData.todayMedications.map((medication) => (
          <View key={`${medication.id}-${forceUpdate}`} style={styles.medicationItem}>
            <View style={styles.medicationInfo}>
              <View style={styles.medicationHeader}>
                <Text variant="titleMedium" style={styles.medicationName}>
                  {medication.name}
                </Text>
                
                {/* 显示今日计划状态 */}
                {(() => {
                  // 查找对应的用药计划
                  const plan = medicationData.medicationPlans.find(p => 
                    p.medication?.name === medication.name || 
                    p.medication_name === medication.name
                  );
                  
                  if (plan) {
                    const todayStatus = getTodayPlanStatus(plan);
                    return (
                      <Chip 
                        style={[styles.statusChip, styles.elevatedChip, { backgroundColor: todayStatus.color }]}
                        contentStyle={styles.statusChipContent}
                        textStyle={styles.statusChipText}
                        compact={true}
                        icon={todayStatus.icon}
                      >
                        {todayStatus.text}
                      </Chip>
                    );
                  } else {
                    // 如果没有找到计划，显示原始状态
                    return (
                <Chip 
                  style={[styles.statusChip, styles.elevatedChip, { backgroundColor: getStatusColor(medication.status) }]}
                  contentStyle={styles.statusChipContent}
                  textStyle={styles.statusChipText}
                  compact={true}
                >
                  {getStatusText(medication.status)}
                </Chip>
                    );
                  }
                })()}
              </View>
              
              <Text style={styles.medicationDetails}>
                {medication.dosage} · {medication.category} · {(() => {
                  // 直接使用 medication.id 查找对应的用药计划
                  const plan = medicationData.medicationPlans.find(p => p.id === medication.id);
                  
                  if (plan && plan.current_time_slot) {
                    // 显示当前时间点
                    return plan.current_time_slot.time;
                  } else {
                    // 如果没有找到计划或时间点，显示原始时间
                    return medication.time;
                  }
                })()}
              </Text>
              
              <Text style={styles.medicationInstructions}>
                {medication.instructions}
              </Text>
            </View>
            
            {/* 多次用药的时间点操作 */}
            {medication.timeArray && medication.timeArray.length > 1 ? (
              <View style={styles.timeSlotsContainer}>
                <Text style={styles.timeSlotsTitle}>今日用药时间：</Text>
                {medication.timeArray.map((timeSlot, index) => (
                  <View key={index} style={styles.timeSlotItem}>
                    <View style={styles.timeSlotInfo}>
                      <Text style={styles.timeSlotTime}>{timeSlot.time}</Text>
                      <Chip 
                        style={[styles.timeSlotStatus, { backgroundColor: getStatusColor(timeSlot.status) }]}
                        textStyle={styles.timeSlotStatusText}
                        compact={true}
                      >
                        {getStatusText(timeSlot.status)}
                      </Chip>
                    </View>
                    
                    {timeSlot.status === 'pending' && (
                      <View style={styles.timeSlotActions}>
                <Button
                  mode="contained"
                          onPress={() => markAsTaken(medication.id, timeSlot.time)}
                          style={[styles.timeSlotButton, styles.takeButton]}
                          labelStyle={styles.timeSlotButtonText}
                >
                  Take
                </Button>
                <Button
                  mode="outlined"
                          onPress={() => skipMedication(medication.id, timeSlot.time)}
                          style={[styles.timeSlotButton, styles.skipButton]}
                          labelStyle={styles.timeSlotButtonText}
                >
                  {t('medication.skip')}
                </Button>
              </View>
            )}
          </View>
        ))}
              </View>
            ) : (
              /* 单次用药的操作按钮 */
              renderSingleMedicationButtons(medication)
            )}
          </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={48} color="#ccc" style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateText}>
              {t('medication.noMedicationPlans')}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {t('medication.contactDoctorForPlan')}
            </Text>
            <Text style={styles.developmentNote}>
              💡 用药计划功能正在开发中，请稍后再试
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Chat')}
              style={styles.contactDoctorButton}
              icon="message"
            >
              {t('common.contactDoctor')}
            </Button>


          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderMedicationPlans = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            {t('common.medicationPlan')}
          </Text>
          <Chip mode="outlined" textStyle={styles.chipText}>
            {t('common.planMadeByDoctor')}
          </Chip>
        </View>
        
        {medicationData.medicationPlans.length > 0 ? (
          medicationData.medicationPlans.map((plan) => (
                        // 使用 forceUpdate 确保重新渲染
            <View key={`${plan.id}-${forceUpdate}`} style={styles.planItem}>
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Text variant="titleMedium" style={styles.planName}>
                    {plan.medication?.name || plan.medication_name || plan.name || '未知药物'}
                </Text>
                <Text style={styles.planDetails}>
                    {plan.dosage || '未知剂量'} · {plan.frequency || '未知频次'} · {(() => {
                      if (Array.isArray(plan.time_of_day)) {
                        // 显示当前时间点和剩余时间点
                        if (plan.current_time_slot) {
                          const currentIndex = plan.current_time_slot.index;
                          const remainingTimes = plan.time_of_day.slice(currentIndex);
                          console.log('🔍 Medication Plans 时间显示:', {
                            planName: plan.medication?.name,
                            currentTimeSlot: plan.current_time_slot,
                            currentIndex,
                            remainingTimes,
                            allTimes: plan.time_of_day
                          });
                          return remainingTimes.join(', ');
                        } else {
                          console.log('🔍 Medication Plans 没有当前时间点，显示所有时间:', plan.time_of_day);
                          return plan.time_of_day.join(', ');
                        }
                      } else {
                        return plan.time_of_day || '未知时间';
                      }
                    })()}
                </Text>
                

                
                <Text style={styles.planDate}>
                    {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '未知开始日期'} - {plan.end_date ? new Date(plan.end_date).toLocaleDateString() : t('common.longTerm')}
                </Text>
              </View>
              
              <Chip 
                style={[styles.statusChip, styles.elevatedChip, { backgroundColor: plan.status === 'active' ? '#4CAF50' : '#9E9E9E' }]}
                contentStyle={styles.statusChipContent}
                textStyle={styles.statusChipText}
                compact={true}
              >
                {plan.status === 'active' ? t('common.active') : t('common.stopped')}
              </Chip>
            </View>
            
            <View style={styles.complianceContainer}>
              <ComplianceDisplay plan={plan} />
            </View>
          </View>
        ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateText}>
              {t('medication.noMedicationPlans')}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {t('medication.contactDoctorForPlan')}
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Chat')}
              style={styles.contactDoctorButton}
              icon="message"
            >
              {t('common.contactDoctor')}
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            {t('common.medicationReminder')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('common.managePlanAndReminder')}
          </Text>
        </View>

        {renderTodayMedications()}
        {renderMedicationPlans()}

      </ScrollView>
      

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#333333',
  },
  chipText: {
    fontSize: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  sectionNote: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  medicationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationInfo: {
    marginBottom: 12,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicationName: {
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  takeButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    borderColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  completedStatus: {
    marginTop: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  statusChip: {
    height: 36,
    minWidth: 76,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  elevatedChip: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  statusChipContent: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  statusChipText: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 22,
    includeFontPadding: false,
  },
  planItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  planInfo: {
    flex: 1,
  },
  planName: {
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  planDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  planDate: {
    fontSize: 12,
    color: '#888888',
  },


  complianceContainer: {
    marginTop: 8,
  },
  complianceLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  complianceBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 4,
  },
  complianceProgress: {
    height: '100%',
    borderRadius: 4,
  },
  complianceStats: {
    fontSize: 12,
    color: '#888888',
  },
  complianceDetails: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  contactDoctorButton: {
    marginTop: 20,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderChip: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  complianceSummary: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  complianceSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  complianceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  complianceStat: {
    alignItems: 'center',
  },
  complianceStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  complianceStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  // 时间点样式
  timeSlotsContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  timeSlotsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  timeSlotItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeSlotInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeSlotStatus: {
    height: 24,
  },
  timeSlotStatusText: {
    fontSize: 10,
    color: '#fff',
  },
  timeSlotActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timeSlotButton: {
    flex: 1,
    height: 36,
  },
  timeSlotButtonText: {
    fontSize: 12,
  },
});

// 依从性显示组件 - 避免重复计算
const ComplianceDisplay = React.memo(({ plan }) => {
  const { t } = useTranslation();
  
  // 缓存计算结果
  const complianceData = React.useMemo(() => {
    try {
      // 获取今天的日期
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // 计算今天应该服用的次数
      const timeArray = Array.isArray(plan.time_of_day) ? plan.time_of_day : [plan.time_of_day];
      const totalDoses = timeArray.length;
      
      if (totalDoses === 0) return { compliance: 0, color: '#F44336', taken: 0, skipped: 0, missed: 0 };
      
      // 检查今天是否已经服用过
      const hasTakenToday = plan.last_taken && 
        new Date(plan.last_taken).toISOString().split('T')[0] === todayStr;
      
      // 如果今天没有服用过，依从性为0%
      if (!hasTakenToday) {
        return { compliance: 0, color: '#F44336', taken: 0, skipped: 0, missed: totalDoses };
      }
      
      // 获取今天实际服用的次数和跳过的次数
      const takenCountToday = plan.taken_count_today || 0;
      const skippedCountToday = plan.skipped_count_today || 0;
      
      // 基于实际服用次数计算依从性（不包括跳过的）
      if (takenCountToday > 0) {
        const compliance = Math.round((takenCountToday / totalDoses) * 100);
        const color = compliance >= 90 ? '#4CAF50' : 
                     compliance >= 80 ? '#FF9800' : 
                     compliance >= 70 ? '#F57C00' : '#F44336';
        
        // 只在必要时输出日志，减少噪音
        if (Math.random() < 0.05) { // 只输出5%的日志
          console.log(`📊 依从性计算: ${takenCountToday}/${totalDoses} = ${compliance}%`);
        }
        
        return {
          compliance: Math.min(100, compliance),
          color,
          taken: takenCountToday,
          skipped: skippedCountToday,
          missed: Math.max(0, totalDoses - takenCountToday - skippedCountToday)
        };
      }
      
      return { compliance: 0, color: '#F44336', taken: 0, skipped: skippedCountToday, missed: totalDoses };
    } catch (error) {
      console.error('计算依从性失败:', error);
      return { compliance: 0, color: '#F44336', taken: 0, skipped: 0, missed: 0 };
    }
  }, [plan.time_of_day, plan.last_taken, plan.taken_count_today, plan.skipped_count_today]);
  
  return (
    <>
      <Text style={styles.complianceLabel}>
          {t('medication.compliance')}: {complianceData.compliance}%
      </Text>
      <View style={styles.complianceBar}>
        <View 
          style={[
            styles.complianceProgress, 
            { 
                width: `${complianceData.compliance}%`,
                backgroundColor: complianceData.color
            }
          ]} 
        />
      </View>
      <Text style={styles.complianceDetails}>
        {t('medication.taken')}: {complianceData.taken}/{Array.isArray(plan.time_of_day) ? plan.time_of_day.length : 1} · {t('medication.skipped')}: {complianceData.skipped} · {t('medication.missed')}: {complianceData.missed}
      </Text>
    </>
  );
});

export default MedicationScreen; 