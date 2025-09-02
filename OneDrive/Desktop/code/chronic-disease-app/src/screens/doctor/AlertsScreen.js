/**
 * 医生告警管理页面组件
 * 
 * 功能特性：
 * - 显示系统智能生成的健康告警
 * - 支持告警状态管理（待处理、已处理、已忽略）
 * - 按优先级和状态筛选告警
 * - 告警统计图表和趋势分析
 * - 支持告警处理操作
 * - 多语言国际化支持
 * - 实时数据刷新和降级处理
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  ActivityIndicator, 
  Chip,
  Searchbar,
  Avatar,
  Badge
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPatientsList } from '../../store/slices/patientsSlice';
import { Ionicons } from '@expo/vector-icons';

// 导入图表组件
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import StatsCard from '../../components/StatsCard';

import { API_BASE_URL, messagesAPI } from '../../services/api';

/**
 * 医生告警管理页面主组件
 * 
 * 主要功能：
 * - 管理和显示健康告警信息
 * - 处理告警状态变更
 * - 提供告警统计和可视化
 * - 支持告警搜索和筛选
 * - 智能告警生成和管理
 * - 告警跳转和导航处理
 * 
 * @param {Object} navigation - 导航对象，用于页面跳转
 * @returns {JSX.Element} 医生告警管理页面组件
 */
const AlertsScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  
  // 界面状态管理
  const [loading, setLoading] = useState(true);                    // 首次加载状态
  const [refreshing, setRefreshing] = useState(false);             // 下拉刷新状态
  const [searchQuery, setSearchQuery] = useState('');              // 搜索关键词
  const [filterStatus, setFilterStatus] = useState('all');         // 状态筛选：all, pending, handled, dismissed
  const [filterPriority, setFilterPriority] = useState('all');     // 优先级筛选：all, critical, high, medium, low
  const [showStats, setShowStats] = useState(true);               // 是否显示统计信息
  
  // 从Redux store获取认证信息和患者数据
  const { isAuthenticated, user, role, token } = useSelector(state => state.auth);
  const { patientsList } = useSelector(state => state.patients);

  /**
   * 根据告警类型获取国际化的标题和消息
   * 支持多种告警类型的本地化显示
   * 
   * @param {Object} alert - 告警对象
   * @returns {Object} 包含本地化标题和消息的对象
   */
  const getLocalizedAlertContent = (alert) => {
    const type = alert?.type || '';
    const patientName = alert?.patientName || '';
    const patientAge = alert?.patientAge || '';
    
    console.log('🔍 告警数据:', { type, title: alert.title, message: alert.message, relatedMetric: alert.relatedMetric });
    
    // 首先检查是否有预定义的键值（在alerts.cardContent命名空间中）
    if (alert.title && alert.title.includes('_')) {
      const titleKey = `alerts.cardContent.${alert.title}`;
      const messageKey = `alerts.cardContent.${alert.message}`;
      
      console.log('🔍 尝试使用预定义键值:', { titleKey, messageKey });
      console.log('🔍 当前语言:', i18n.language);
      console.log('🔍 可用命名空间:', Object.keys(i18n.options.resources[i18n.language]?.translation || {}));
      
      try {
        const localizedTitle = t(titleKey);
        const localizedMessage = t(messageKey, { value: alert.value || '', name: patientName, age: patientAge });
        
        console.log('🔍 国际化结果:', { localizedTitle, localizedMessage });
        console.log('🔍 原始键值:', { titleKey, messageKey });
        
        // 如果国际化成功，返回本地化内容
        if (localizedTitle !== titleKey && localizedMessage !== messageKey) {
          console.log('✅ 使用预定义键值成功');
          return {
            title: localizedTitle,
            message: localizedMessage
          };
        } else {
          console.log('❌ 预定义键值国际化失败，回退到类型匹配');
          console.log('❌ 标题键值:', titleKey, '结果:', localizedTitle);
          console.log('❌ 消息键值:', messageKey, '结果:', localizedMessage);
        }
      } catch (e) {
        console.log('❌ 预定义键值国际化异常:', e);
        // 国际化键值不存在，使用类型匹配
      }
    }
    
    // 如果没有预定义键值或国际化失败，使用类型匹配
    console.log('🔍 使用类型匹配:', type);
    switch (type) {
      case 'threshold_exceeded':
        // 优先使用relatedMetric判断
        if (alert.relatedMetric === 'bloodPressure' || alert.relatedMetric === '血压') {
          return {
            title: t('alerts.cardContent.bloodPressureAlert'),
            message: t('alerts.cardContent.bloodPressureMessage')
          };
        } else if (alert.relatedMetric === 'heartRate' || alert.relatedMetric === '心率') {
          return {
            title: t('alerts.cardContent.heartRateAlert'),
            message: t('alerts.cardContent.bloodPressureMessage')
          };
        } else if (alert.relatedMetric === 'glucose' || alert.relatedMetric === '血糖') {
          return {
            title: t('alerts.cardContent.glucose_high_alert'),
            message: t('alerts.cardContent.glucose_high_message', { value: alert.value || '8.40mmol/L' })
          };
        }
        
        // 如果relatedMetric缺失，根据标题内容进行智能判断
        if (alert.title && typeof alert.title === 'string') {
          if (alert.title.includes('血压')) {
            return {
              title: t('alerts.cardContent.blood_pressure_anomaly_alert'),
              message: t('alerts.cardContent.blood_pressure_anomaly_message', { value: alert.value || '160.0mmHg' })
            };
          } else if (alert.title.includes('血糖')) {
            return {
              title: t('alerts.cardContent.glucose_high_alert'),
              message: t('alerts.cardContent.glucose_high_message', { value: alert.value || '8.40mmol/L' })
            };
          } else if (alert.title.includes('心率')) {
            return {
              title: t('alerts.cardContent.heart_rate_alert'),
              message: t('alerts.cardContent.heart_rate_message')
            };
          }
        }
        
        // 如果所有判断都失败，使用通用的阈值超标键值
        return {
          title: t('alerts.cardContent.thresholdExceeded'),
          message: t('alerts.cardContent.thresholdExceededMessage', { 
            name: patientName || '患者',
            value: alert.value || '100/150mmHg'
          })
        };
        
      case 'missed_medication':
        return {
          title: t('alerts.cardContent.missedMedicationAlert'),
          message: t('alerts.cardContent.missedMedicationMessage')
        };
        
      case 'improvement_trend':
        if (alert.relatedMetric === 'glucose' || alert.relatedMetric === '血糖') {
          return {
            title: t('alerts.cardContent.glucoseImprovementAlert'),
            message: t('alerts.cardContent.glucoseImprovementMessage')
          };
        }
        break;
        
      case 'glucose_high':
        return {
          title: t('alerts.cardContent.glucose_high_alert'),
          message: t('alerts.cardContent.glucose_high_message', { value: alert.value || '8.40mmol/L' })
        };
        
      case 'glucose_high_stable':
        return {
          title: t('alerts.cardContent.glucose_high_alert'),
          message: t('alerts.cardContent.glucose_high_message', { value: alert.value || '8.40mmol/L' })
        };
        
      case 'glucose_high_falling':
        return {
          title: t('alerts.cardContent.glucose_high_falling'),
          message: t('alerts.cardContent.glucose_high_falling_message', { 
            value: alert.value || '9.10mmol/L',
            trend: alert.trend || '-0.5'
          })
        };
        
      case 'glucose_high_rising':
        return {
          title: t('alerts.cardContent.glucose_high_rising'),
          message: t('alerts.cardContent.glucose_high_rising_message', { 
            value: alert.value || '9.10mmol/L',
            trend: alert.trend || '+0.5'
          })
        };
        
      case 'glucose_normal_rising':
        return {
          title: t('alerts.cardContent.glucose_normal_rising'),
          message: t('alerts.cardContent.glucose_normal_rising_message', { 
            value: alert.value || '6.50mmol/L',
            trend: alert.trend || '+0.3'
          })
        };
        
      case 'abnormal_trend':
        return {
          title: t('alerts.cardContent.abnormalTrendAlert'),
          message: t('alerts.cardContent.abnormalTrendMessage', { 
            metric: alert.relatedMetric || '健康指标',
            trend: alert.trend || '异常'
          })
        };
        
      case 'worsening_trend':
        return {
          title: t('alerts.cardContent.worseningTrendAlert'),
          message: t('alerts.cardContent.worseningTrendMessage', { 
            metric: alert.relatedMetric || '健康指标',
            trend: alert.trend || '恶化'
          })
        };
        
      case 'system_notification':
        return {
          title: t('alerts.cardContent.systemNotificationAlert'),
          message: t('alerts.cardContent.systemNotificationMessage')
        };
        
      case 'blood_pressure_anomaly':
        return {
          title: t('alerts.cardContent.blood_pressure_anomaly_alert'),
          message: t('alerts.cardContent.blood_pressure_anomaly_message', { value: alert.value || '160.0mmHg' })
        };
        
      case 'heart_rate_alert':
        return {
          title: t('alerts.cardContent.heart_rate_alert'),
          message: t('alerts.cardContent.heart_rate_message')
        };
        
      case 'patient_inactivity':
        return {
          title: t('alerts.cardContent.patientInactivityAlert'),
          message: t('alerts.cardContent.patientInactivityMessage')
        };
        
      case 'medication_side_effect':
        return {
          title: t('alerts.cardContent.medicationSideEffectAlert'),
          message: t('alerts.cardContent.medicationSideEffectMessage')
        };
        
      case 'new_patient':
        return {
          title: t('alerts.cardContent.newPatientEvaluationAlert'),
          message: t('alerts.cardContent.newPatientEvaluationMessage', { name: patientName, age: patientAge })
        };
        
      case 'high_risk':
        return {
          title: t('alerts.cardContent.highRiskPatientAlert'),
          message: t('alerts.cardContent.highRiskPatientMessage', { name: patientName })
        };
        
      case 'medium_risk':
        return {
          title: t('alerts.cardContent.mediumRiskPatientAlert'),
          message: t('alerts.cardContent.mediumRiskPatientMessage', { name: patientName })
        };
        
      case 'elderly_care':
        return {
          title: t('alerts.cardContent.elderlyPatientAlert'),
          message: t('alerts.cardContent.elderlyPatientMessage', { name: patientName, age: patientAge })
        };
        
      case 'chronic_disease':
        if (alert.relatedMetric === 'hypertension' || alert.relatedMetric === '高血压') {
          return {
            title: t('alerts.cardContent.hypertensionAlert'),
            message: t('alerts.cardContent.hypertensionMessage', { name: patientName })
          };
        } else if (alert.relatedMetric === 'diabetes' || alert.relatedMetric === '糖尿病') {
          return {
            title: t('alerts.cardContent.diabetesAlert'),
            message: t('alerts.cardContent.diabetesMessage', { name: patientName })
          };
        } else if (alert.relatedMetric === 'heart_disease' || alert.relatedMetric === '心脏病') {
          return {
            title: t('alerts.cardContent.heartDiseaseAlert'),
            message: t('alerts.cardContent.heartDiseaseMessage', { name: patientName })
          };
        }
        break;
        
      default:
        // 如果没有匹配的类型，尝试使用通用的国际化键值
        if (alert.title && typeof alert.title === 'string') {
          const titleKey = `alerts.cardContent.${alert.title}`;
          const messageKey = `alerts.cardContent.${alert.message}`;
          
          try {
            const localizedTitle = t(titleKey);
            const localizedMessage = t(messageKey, { 
              name: patientName, 
              age: patientAge,
              value: alert.value || ''
            });
            
            // 如果国际化成功，返回本地化内容
            if (localizedTitle !== titleKey && localizedMessage !== messageKey) {
              console.log('✅ 使用通用键值成功');
              return {
                title: localizedTitle,
                message: localizedMessage
              };
            } else {
              console.log('❌ 通用键值国际化失败，回退到原始');
            }
                } catch (e) {
        // 通用国际化键值不存在
      }
        }
        
        // 如果所有国际化都失败，返回原始的标题和消息
        console.log('❌ 所有国际化失败，返回原始');
        return {
          title: alert.title,
          message: alert.message
        };
    }
    
    // 如果没有匹配的类型，返回原始的标题和消息
    console.log('❌ 没有匹配的类型，返回原始');
    return {
      title: alert.title,
      message: alert.message
    };
  };

  // 系统定期分析患者数据生成的告警
  const [alertsData, setAlertsData] = useState({
    doctorId: null,                    // 当前登录医生ID
    lastAnalysisTime: null,            // 最后分析时间
    analysisInterval: null,            // 分析频率
    dataRange: null,                   // 分析数据范围
    stats: {
      total: 0,                        // 总告警数
      pending: 0,                      // 待处理告警数
      handled: 0,                      // 已处理告警数
      dismissed: 0,                    // 已忽略告警数
      critical: 0,                     // 严重告警数
      high: 0,                         // 高优先级告警数
      medium: 0,                       // 中优先级告警数
      low: 0                           // 低优先级告警数
    },
    alerts: [],                        // 告警列表，从后端动态获取
    dataSource: null                   // 数据来源
  });

  useEffect(() => {
    // 组件加载时的初始化逻辑
    if (user && user.role === 'doctor') {
      loadAlerts();
      // 主动获取患者列表数据，确保告警跳转时能正确匹配
      if (!patientsList || patientsList.length === 0) {
        console.log('🔄 AlertsScreen: 主动获取患者列表数据');
        dispatch(fetchPatientsList());
      }
    }
  }, [user, dispatch]);

  // 监听患者数据变化，当有新患者时自动分析
  useEffect(() => {
    if (patientsList && patientsList.length > 0) {
      console.log('🔄 AlertsScreen: 患者列表数据已加载，检查是否需要为新病人生成告警');
      // 添加防抖，避免频繁调用
      const timeoutId = setTimeout(() => {
        checkAndGenerateAlertsForNewPatients();
      }, 1000); // 延迟1秒，确保数据稳定
      
      return () => clearTimeout(timeoutId);
    }
  }, [patientsList]); // 只依赖 patientsList

  // 当患者列表数据加载完成后，重新检查告警中的患者匹配
  useEffect(() => {
    if (patientsList && patientsList.length > 0 && alertsData.alerts.length > 0) {
      console.log('🔄 AlertsScreen: 患者列表和告警数据都已加载，告警可以正确匹配患者信息');
      // 告警数据本来就存在，现在患者列表也加载完成，告警应该能正确显示
    }
  }, [patientsList]); // 只依赖 patientsList，避免 alertsData.alerts 变化时重复触发

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // 检查认证状态
      if (!isAuthenticated || !token || !user) {
        console.error('用户未认证，无法获取告警数据');
        setLoading(false);
        return;
      }
      
      console.log('🔄 开始从后端API获取告警数据...');
      
      // 实际API调用 - 从数据库获取告警数据
      const doctorId = user.id || alertsData.doctorId;
      const currentLanguage = i18n.language || 'en'; // 获取当前语言设置
      const apiUrl = `${API_BASE_URL.replace('/api', '')}/api/health/alerts/doctor/${doctorId}/?language=${currentLanguage}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ 成功从后端API获取告警数据');
          
          // 去重处理：基于告警ID、患者ID、类型和创建时间进行去重
          const uniqueAlerts = result.data.alerts.reduce((acc, current) => {
            const existingAlert = acc.find(alert => 
              alert.id === current.id || 
              (alert.patientId === current.patientId && 
               alert.type === current.type && 
               alert.createdAt === current.createdAt)
            );
            
            if (!existingAlert) {
              acc.push(current);
            } else {
              console.log('🔄 发现重复告警，跳过:', {
                id: current.id,
                patientId: current.patientId,
                type: current.type,
                title: current.title
              });
            }
            
            return acc;
          }, []);
          
          console.log(`🔄 去重后告警数量: ${uniqueAlerts.length} (原始: ${result.data.alerts.length})`);
          
          // 更新告警数据
          setAlertsData(prev => ({
            ...prev,
            doctorId: doctorId,
            alerts: uniqueAlerts,
            stats: result.data.stats || recalculateStats(uniqueAlerts),
            lastAnalysisTime: result.data.lastAnalysisTime,
            analysisInterval: result.data.analysisInterval,
            dataRange: result.data.dataRange,
            dataSource: result.data.dataSource || '后端数据库'
          }));
        } else {
          console.log('⚠️ 后端API返回数据格式异常，使用降级方案');
          // 使用降级方案：生成基础告警数据
          await generateFallbackAlerts();
        }
      } else {
        console.error('获取告警数据失败:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        
        // 使用降级方案：生成基础告警数据
        console.log('🔄 使用降级方案生成基础告警数据');
        await generateFallbackAlerts();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取数据库告警数据失败:', error);
      
      // 使用降级方案：生成基础告警数据
      console.log('🔄 使用降级方案生成基础告警数据');
      await generateFallbackAlerts();
      
      setLoading(false);
    }
  };

  // 降级方案：当后端API失败时生成基础告警数据
  const generateFallbackAlerts = async () => {
    console.log('🔄 生成降级告警数据...');
    
    try {
      // 等待患者列表加载完成
      if (!patientsList || patientsList.length === 0) {
        console.log('⏳ 等待患者列表加载...');
        return;
      }
      
      // 为每个患者生成基础告警
      const fallbackAlerts = [];
      let alertId = 1;
      
      patientsList.forEach(patient => {
        // 生成新患者评估告警
        fallbackAlerts.push({
          id: alertId++,
          patientId: patient.id,
          patientName: patient.name,
          patientAge: patient.age,
          doctorId: user.id,
          type: 'new_patient',
          title: '新患者评估提醒',
          message: `新患者${patient.name}（${patient.age}岁）已加入系统，建议进行初步健康评估`,
          priority: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
          relatedMetric: '新患者评估',
          isSystemGenerated: true
        });
        
        // 如果有慢性疾病，生成疾病相关告警
        if (patient.chronic_diseases && patient.chronic_diseases.length > 0) {
          patient.chronic_diseases.forEach(disease => {
            fallbackAlerts.push({
              id: alertId++,
              patientId: patient.id,
              patientName: patient.name,
              patientAge: patient.age,
              doctorId: user.id,
              type: 'chronic_disease',
              title: `${disease}患者监测提醒`,
              message: `患者${patient.name}患有${disease}，建议定期监测相关指标`,
              priority: 'high',
              status: 'pending',
              createdAt: new Date().toISOString(),
              relatedMetric: disease,
              isSystemGenerated: true
            });
          });
        }
      });
      
      console.log(`✅ 生成了 ${fallbackAlerts.length} 个降级告警`);
      
      // 更新告警数据
      setAlertsData(prev => ({
        ...prev,
        doctorId: user.id,
        alerts: fallbackAlerts,
        stats: recalculateStats(fallbackAlerts),
        lastAnalysisTime: new Date().toISOString(),
        analysisInterval: '实时生成',
        dataRange: '当前数据',
        dataSource: '前端降级生成'
      }));
      
    } catch (error) {
      console.error('生成降级告警失败:', error);
    }
  };





  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  // 获取过滤后的告警
  const getFilteredAlerts = () => {
    let filtered = alertsData.alerts;

    // 按状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === filterStatus);
    }

    // 按优先级过滤
    if (filterPriority !== 'all') {
      filtered = filtered.filter(alert => alert.priority === filterPriority);
    }

    // 按搜索关键词过滤
    if (searchQuery) {
      filtered = filtered.filter(alert => 
        alert.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      // 优先级排序
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const statusOrder = { pending: 0, handled: 1, dismissed: 2 };
      
      return priorityOrder[a.priority] - priorityOrder[b.priority] ||
             statusOrder[a.status] - statusOrder[b.status] ||
             new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#1976D2';
      case 'low': return '#388E3C';
      default: return '#757575';
    }
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF5722';
      case 'handled': return '#4CAF50';
      case 'dismissed': return '#9E9E9E';
      default: return '#757575';
    }
  };

  // 获取优先级文本
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'critical': return t('common.critical');
      case 'high': return t('common.high');
      case 'medium': return t('common.medium');
      case 'low': return t('common.low');
      default: return t('common.unknown');
    }
  };

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return t('common.pending');
      case 'handled': return t('common.handled');
      case 'dismissed': return t('common.dismissed');
      default: return t('common.unknown');
    }
  };

  // 获取告警类型图标
  const getAlertIcon = (type) => {
    switch (type) {
      case 'threshold_exceeded': return 'warning';
      case 'missed_medication': return 'medical';
      case 'abnormal_trend': return 'arrow-up';
      // 新的血糖趋势类型
      case 'glucose_high_rising': return 'trending-up';
      case 'glucose_high_falling': return 'trending-down';
      case 'glucose_high_stable': return 'remove';
      case 'glucose_normal_rising': return 'arrow-up';
      // 其他趋势类型
      case 'improvement_trend': return 'trending-down';
      case 'worsening_trend': return 'trending-up';
      case 'system_notification': return 'notifications';
      default: return 'alert-circle';
    }
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return t('common.yesterday');
    } else if (diffDays < 7) {
      return t('common.daysAgo', { count: diffDays });
    } else {
      return date.toLocaleDateString();
    }
  };

  // 处理告警
  const handleAlert = (alertId) => {
    Alert.alert(
      t('common.handleAlert'),
      t('common.selectHandlingMethod'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.markAsHandled'), 
          onPress: () => markAsHandled(alertId) 
        },
        { 
          text: t('common.dismissAlert'), 
          onPress: () => dismissAlert(alertId) 
        }
      ]
    );
  };

  // 重新计算统计数据
  const recalculateStats = (alerts) => {
    const stats = {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      handled: alerts.filter(a => a.status === 'handled').length,
      dismissed: alerts.filter(a => a.status === 'dismissed').length,
      critical: alerts.filter(a => a.priority === 'critical').length,
      high: alerts.filter(a => a.priority === 'high').length,
      medium: alerts.filter(a => a.priority === 'medium').length,
      low: alerts.filter(a => a.priority === 'low').length
    };
    
    return stats;
  };

  const markAsHandled = (alertId) => {
    
    // 更新告警状态为已处理
    setAlertsData(prevData => {
      const updatedAlerts = prevData.alerts.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'handled',
              handledBy: t('alerts.systemTexts.currentDoctor'),
              handledAt: new Date().toISOString(),
              handledMethod: t('alerts.systemTexts.doctorHandled')
            }
          : alert
      );
      
      return {
        ...prevData,
        alerts: updatedAlerts,
        stats: recalculateStats(updatedAlerts)
      };
    });
    
    Alert.alert(
      t('common.success'), 
      t('medication.alertHandledSuccessfully')
    );
  };

  const dismissAlert = (alertId) => {
    
    // 更新告警状态为已忽略
    setAlertsData(prevData => {
      const updatedAlerts = prevData.alerts.map(alert => 
        alert.id === alertId 
          ? { 
              ...alert, 
              status: 'dismissed',
              dismissedBy: t('alerts.systemTexts.currentDoctor'),
              dismissedAt: new Date().toISOString(),
              dismissReason: t('alerts.systemTexts.doctorJudgmentNoNeed')
            }
          : alert
      );
      
      return {
        ...prevData,
        alerts: updatedAlerts,
        stats: recalculateStats(updatedAlerts)
      };
    });
    
    Alert.alert(
      t('common.success'), 
      t('medication.alertDismissedSuccessfully')
    );
  };

  // 根据慢性疾病计算风险等级
  const getRiskLevelFromDiseases = (chronicDiseases) => {
    if (!chronicDiseases || chronicDiseases.length === 0) {
      return 'healthy';
    }

    const highRiskDiseases = ['heart_disease', 'stroke', 'kidney_disease'];
    const mediumRiskDiseases = ['hypertension', 'diabetes', 'hyperlipidemia'];
    const lowRiskDiseases = ['arthritis', 'osteoporosis'];

    // 检查是否有高风险疾病
    const hasHighRisk = chronicDiseases.some(disease => 
      highRiskDiseases.includes(disease)
    );
    if (hasHighRisk) return 'high';

    // 检查是否有中风险疾病
    const hasMediumRisk = chronicDiseases.some(disease => 
      mediumRiskDiseases.includes(disease)
    );
    if (hasMediumRisk) {
      // 如果有多个中风险疾病，升级为高风险
      const mediumRiskCount = chronicDiseases.filter(disease => 
        mediumRiskDiseases.includes(disease)
      ).length;
      return mediumRiskCount >= 2 ? 'high' : 'medium';
    }

    // 检查是否有低风险疾病
    const hasLowRisk = chronicDiseases.some(disease => 
      lowRiskDiseases.includes(disease)
    );
    if (hasLowRisk) return 'low';

    return 'healthy';
  };

  // 智能检查并为新病人生成告警（避免重复生成）
  const checkAndGenerateAlertsForNewPatients = () => {
    if (!patientsList || patientsList.length === 0) return;

    console.log('🔍 checkAndGenerateAlertsForNewPatients 开始检查，当前告警数量:', alertsData.alerts.length);
    
    const newAlerts = [];
    let nextAlertId = Math.max(...alertsData.alerts.map(a => a.id), 0) + 1;

    patientsList.forEach(patient => {
      // 检查是否已经为此患者生成过基础告警（更精确的检查）
      const existingAlerts = alertsData.alerts.filter(alert => 
        alert.patientId === patient.id && 
        (alert.type === 'chronic_disease' || alert.type === 'risk_assessment' || alert.type === 'age_alert' || alert.type === 'welcome' || alert.type === 'new_patient')
      );
      
      console.log(`🔍 患者 ${patient.name} (ID: ${patient.id}) 的现有告警:`, existingAlerts.length);
      
      // 检查是否是新患者（最近7天内添加）且还没有基础告警
      const isNewPatient = patient.created_at && 
        new Date(patient.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // 更智能的检查：只有真正的新患者且没有相关告警时才生成
      const shouldGenerate = (isNewPatient || !patient.created_at) && existingAlerts.length === 0;
      
      if (shouldGenerate) {
        console.log(`✅ 开始为新患者 ${patient.name} 生成基础告警`);
        
        // 为新患者生成欢迎/评估提醒（优先级最高）
        const welcomeAlert = generateWelcomeAlert(patient, nextAlertId++);
        if (welcomeAlert) {
          newAlerts.push(welcomeAlert);
        }
        
        // 基于患者慢性疾病生成告警
        if (patient.chronic_diseases && patient.chronic_diseases.length > 0) {
          patient.chronic_diseases.forEach(disease => {
            const alert = generateDiseaseAlert(patient, disease, nextAlertId++);
            if (alert) {
              newAlerts.push(alert);
            }
          });
        }

        // 基于风险等级生成告警
        const riskLevel = getRiskLevelFromDiseases(patient.chronic_diseases);
        if (riskLevel === 'high' || riskLevel === 'medium') {
          const riskAlert = generateRiskAlert(patient, riskLevel, nextAlertId++);
          if (riskAlert) {
            newAlerts.push(riskAlert);
          }
        }

        // 基于年龄生成告警（老年患者）
        if (patient.age >= 65) {
          const ageAlert = generateAgeAlert(patient, nextAlertId++);
          if (ageAlert) {
            newAlerts.push(ageAlert);
          }
        }
      } else {
        console.log(`⏭️ 跳过患者 ${patient.name}，原因:`, {
          isNewPatient,
          existingAlertsCount: existingAlerts.length,
          hasCreatedAt: !!patient.created_at
        });
      }
    });

    // 如果有新生成的告警，更新状态
    if (newAlerts.length > 0) {
      console.log(`🆕 为新病人生成了 ${newAlerts.length} 个基础告警`);
      
      // 确保新生成的告警不与现有告警重复
      const allAlerts = [...alertsData.alerts, ...newAlerts];
      const uniqueAlerts = allAlerts.reduce((acc, current) => {
        const existingAlert = acc.find(alert => 
          alert.id === current.id || 
          (alert.patientId === current.patientId && 
           alert.type === current.type && 
           alert.createdAt === current.createdAt)
        );
        
        if (!existingAlert) {
          acc.push(current);
        } else {
          console.log('🔄 新生成的告警与现有告警重复，跳过:', {
            id: current.id,
            patientId: current.patientId,
            type: current.type,
            title: current.title
          });
        }
        
        return acc;
      }, []);
      
      setAlertsData(prevData => ({
        ...prevData,
        alerts: uniqueAlerts,
        stats: recalculateStats(uniqueAlerts)
      }));
    } else {
      console.log('✅ 所有患者都已有关联的告警，无需生成新告警');
    }
  };

  // 基于疾病生成告警
  const generateDiseaseAlert = (patient, disease, alertId) => {
    const diseaseAlertMap = {
      'hypertension': {
        title: '高血压患者监测提醒',
        message: `新患者${patient.name}患有高血压，建议定期监测血压并制定治疗方案`,
        priority: 'high',
        type: 'chronic_disease'
      },
      'diabetes': {
        title: '糖尿病患者监测提醒', 
        message: `新患者${patient.name}患有糖尿病，建议监测血糖并制定用药计划`,
        priority: 'high',
        type: 'chronic_disease'
      },
      'heart_disease': {
        title: '心脏病患者关注提醒',
        message: `新患者${patient.name}患有心脏病，需要重点关注心血管健康`,
        priority: 'critical',
        type: 'chronic_disease'
      }
    };

    const alertConfig = diseaseAlertMap[disease];
    if (!alertConfig) return null;

    return {
      id: alertId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      doctorId: 1,
      assignedAt: new Date().toISOString(),
      type: alertConfig.type,
      title: alertConfig.title,
      message: alertConfig.message,
      priority: alertConfig.priority,
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedMetric: disease,
      isSystemGenerated: true
    };
  };

  // 基于风险等级生成告警
  const generateRiskAlert = (patient, riskLevel, alertId) => {
    if (riskLevel === 'high') {
      return {
        id: alertId,
        patientId: patient.id,
        patientName: patient.name,
        patientAge: patient.age,
        doctorId: 1,
        assignedAt: new Date().toISOString(),
        type: 'high_risk',
        title: '高风险患者关注提醒',
        message: `新患者${patient.name}被评估为高风险等级，建议立即制定详细的治疗和监测计划`,
        priority: 'critical',
        status: 'pending',
        createdAt: new Date().toISOString(),
        relatedMetric: '风险评估',
        isSystemGenerated: true
      };
    } else if (riskLevel === 'medium') {
      return {
        id: alertId,
        patientId: patient.id,
        patientName: patient.name,
        patientAge: patient.age,
        doctorId: 1,
        assignedAt: new Date().toISOString(),
        type: 'medium_risk',
        title: '中风险患者监测提醒',
        message: `新患者${patient.name}被评估为中风险等级，建议定期随访和健康监测`,
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        relatedMetric: '风险评估',
        isSystemGenerated: true
      };
    }
    return null;
  };

  // 基于年龄生成告警
  const generateAgeAlert = (patient, alertId) => {
    return {
      id: alertId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      doctorId: 1,
      assignedAt: new Date().toISOString(),
      type: 'elderly_care',
      title: '老年患者关怀提醒',
      message: `新患者${patient.name}已${patient.age}岁，属于老年患者群体，建议加强健康监测和预防保健`,
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedMetric: '年龄',
      isSystemGenerated: true
    };
  };

  // 为新患者生成欢迎/评估提醒
  const generateWelcomeAlert = (patient, alertId) => {
    return {
      id: alertId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      doctorId: 1,
      assignedAt: new Date().toISOString(),
      type: 'new_patient',
      title: '新患者评估提醒',
      message: `新患者${patient.name}（${patient.age}岁）已加入系统，建议进行初步健康评估和制定个性化健康管理计划`,
      priority: 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
      relatedMetric: '新患者评估',
      isSystemGenerated: true
    };
  };

  // 从告警解析出精确患者（尽量与 Redux 列表对齐）
  const resolvePatientFromAlert = (alertObj) => {
    if (!alertObj) {
      console.log('❌ resolvePatientFromAlert: 告警对象为空');
      return null;
    }
    
    console.log('🔍 resolvePatientFromAlert 开始解析:', {
      alertPatientId: alertObj.patientId,
      alertPatientName: alertObj.patientName,
      patientsListLength: patientsList?.length || 0,
      patientsListIds: patientsList?.map(p => ({ id: p.id, name: p.name })) || []
    });
    
    // 如果患者列表为空，记录警告但不主动获取（应该在组件加载时获取）
    if (!patientsList || patientsList.length === 0) {
      console.log('⚠️ 患者列表为空，告警无法正确匹配患者信息');
      // 返回告警中的基本信息，等待患者列表加载完成
      return {
        id: alertObj.patientId,
        name: alertObj.patientName,
        age: alertObj.patientAge
      };
    }
    
    // 首先尝试通过 patientId 精确匹配
    if (alertObj.patientId && Array.isArray(patientsList)) {
      const byId = patientsList.find(p => p.id === alertObj.patientId);
      if (byId) {
        console.log('✅ 通过ID精确匹配成功:', { 
          alertId: alertObj.patientId, 
          matchedPatient: { id: byId.id, name: byId.name, age: byId.age } 
        });
        return byId;
      } else {
        console.log('❌ 通过ID匹配失败:', { 
          alertId: alertObj.patientId, 
          availableIds: patientsList.map(p => p.id) 
        });
      }
    }
    
    // 如果 patientId 匹配失败，尝试通过名称精确匹配
    if (alertObj.patientName && Array.isArray(patientsList)) {
      const byName = patientsList.find(p => p.name === alertObj.patientName);
      if (byName) {
        console.log('✅ 通过名称精确匹配成功:', { 
          alertName: alertObj.patientName, 
          matchedPatient: { id: byName.id, name: byName.name, age: byName.age } 
        });
        return byName;
      } else {
        console.log('❌ 通过名称匹配失败:', { 
          alertName: alertObj.patientName, 
          availableNames: patientsList.map(p => p.name) 
        });
      }
    }
    
    // 如果都匹配失败，记录详细信息并返回告警中的基本信息
    console.log('⚠️ 所有匹配方式都失败，使用告警中的基本信息:', {
      fallbackPatient: {
        id: alertObj.patientId,
        name: alertObj.patientName,
        age: alertObj.patientAge
      }
    });
    
    const fallbackPatient = {
      id: alertObj.patientId,
      name: alertObj.patientName,
      age: alertObj.patientAge
    };
    
    return fallbackPatient;
  };

  // 告警点击跳转规则
  const handleAlertPress = async (alert) => {
    try {
      console.log('🔍 handleAlertPress 开始处理告警:', {
        alertId: alert.id,
        alertType: alert.type,
        alertPatientId: alert.patientId,
        alertPatientName: alert.patientName,
        patientsListLength: patientsList?.length || 0
      });
      
      const type = (alert?.type || '').toLowerCase();
      const isEvaluation = type.includes('new_patient') || type.includes('high_risk') || type.includes('medium_risk') || type.includes('chronic_disease');
      const isNumeric = type.includes('threshold') || type.includes('blood_pressure') || type.includes('glucose') || type.includes('heart') || type.includes('trend');
      const isMedication = type.includes('medication') || type.includes('adherence') || type.includes('missed');

      console.log('🔍 告警类型判断:', { type, isEvaluation, isNumeric, isMedication });

      // 确保使用正确的患者信息
      const resolvedPatient = resolvePatientFromAlert(alert);
      console.log('🔍 解析后的患者信息:', resolvedPatient);

      if (isEvaluation || isNumeric) {
        // 使用解析后的患者信息，如果没有则使用告警中的信息
        const patient = resolvedPatient || { 
          id: alert.patientId, 
          name: alert.patientName,
          age: alert.patientAge
        };
        
        console.log('🔍 准备导航到患者详情:', { 
          patient, 
          originTab: 'Alerts',
          navigationTarget: 'Patients.PatientDetails'
        });

        navigation.navigate('Patients', { 
          screen: 'PatientDetails', 
          params: { patient, originTab: 'Alerts' } 
        });
        return;
      }

      if (isMedication) {
        // 确保使用正确的患者ID
        const patientId = resolvedPatient?.id || alert.patientId;
        const patientName = resolvedPatient?.name || alert.patientName;
        

        
        let conversationId = null;
        try {
          const conv = await messagesAPI.getConversationWithUser(patientId);
          conversationId = conv?.data?.id;
        } catch (err) {
          if (err?.response?.status === 404) {
            const created = await messagesAPI.startConversationWithUser(patientId);
            conversationId = created?.data?.conversation?.id;
          } else {
            throw err;
          }
        }

        if (!conversationId) {
          Alert.alert(t('common.error'), t('chat.createConversationFailed'));
          return;
        }

        const medName = alert?.medicationName || alert?.medication?.name || t('medication.unknownMedicine');
        const content = `检测到您未按时服用${medName}，请尽快按医嘱服用。如有不适请及时联系医生。`;

        try {
          await messagesAPI.sendMessage({ conversation: conversationId, content });
        } catch (sendErr) {
          try { await messagesAPI.sendMessage({ conversation_id: conversationId, content }); } catch (_) {}
        }

        navigation.navigate('Messages', {
          screen: 'Chat',
          params: {
            conversationId,
            otherUser: { 
              id: patientId, 
              name: patientName, 
              role: 'patient' 
            },
            returnTo: 'Alerts',
          },
        });
        return;
      }

      // 其它类型默认进入告警详情
      navigation.navigate('AlertDetails', { alert });
    } catch (e) {
      console.error('处理告警点击失败:', e);
      Alert.alert(t('common.error'), t('common.operationFailed'));
    }
  };

  // 渲染告警卡片
  const renderAlertCard = ({ item: alert }) => {
    // 获取国际化的告警内容
    const localizedContent = getLocalizedAlertContent(alert);
    
    return (
      <TouchableOpacity onPress={() => handleAlertPress(alert)}>
        <Card style={[styles.alertCard, { 
          borderLeftColor: getPriorityColor(alert.priority),
          borderLeftWidth: 4 
        }]}>
          <Card.Content>
            <View style={styles.alertHeader}>
              <View style={styles.alertInfo}>
                <View style={styles.alertTitleRow}>
                  <Ionicons 
                    name={getAlertIcon(alert.type)} 
                    size={20} 
                    color={getPriorityColor(alert.priority)} 
                  />
                  <Text variant="titleMedium" style={styles.alertTitle}>
                    {localizedContent.title}
                  </Text>

                </View>
                <Text style={styles.patientName}>
                  {alert.patientName} · {alert.patientAge}{t('common.yearsOld')} · {t('common.myPatient')}
                </Text>
              </View>
              
              <View style={styles.alertBadges}>
                <Chip 
                  textStyle={styles.priorityChipText}
                  style={[styles.priorityChip, { 
                    backgroundColor: getPriorityColor(alert.priority) 
                  }]}
                  compact={true}
                >
                  {getPriorityText(alert.priority)}
                </Chip>
                <Chip 
                  textStyle={styles.statusChipText}
                  style={[styles.statusChip, { 
                    backgroundColor: getStatusColor(alert.status) 
                  }]}
                  compact={true}
                >
                  {getStatusText(alert.status)}
                </Chip>
              </View>
            </View>
            
            <Text style={styles.alertMessage}>{localizedContent.message}</Text>


            
            {/* 告警详细信息 - 隐藏relatedMetric显示 */}
            {/* {alert.relatedMetric && (
              <View style={styles.alertDetails}>
                <Text style={styles.detailLabel}>{t('alerts.relatedMetric')}:</Text>
                <Text style={styles.detailValue}>
                  {t(`alerts.metrics.${alert.relatedMetric.toLowerCase()}`) || alert.relatedMetric}: {alert.value}
                </Text>
              </View>
            )} */}
            
            {alert.medicationName && (
              <View style={styles.alertDetails}>
                <Text style={styles.detailLabel}>{t('alerts.commonTexts.relatedMedicine')}:</Text>
                <Text style={styles.detailValue}>
                  {alert.medicationName} ({t('alerts.commonTexts.missedDosesCount', { count: alert.missedDoses })})
                </Text>
              </View>
            )}
            
            <View style={styles.alertFooter}>
              <Text style={styles.alertTime}>{formatTime(alert.createdAt)}</Text>
              
              {alert.status === 'pending' && (
                <Button 
                  mode="contained" 
                  compact 
                  onPress={() => handleAlert(alert.id)}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  labelStyle={styles.actionButtonLabel}
                >
                  {t('alerts.handle')}
                </Button>
              )}
              
              {alert.status === 'handled' && alert.handledBy && (
                <Text style={styles.handledBy}>
                  {t('alerts.handledBy', { handler: alert.handledBy })}
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // 渲染统计数据
  const renderStats = () => {
    const priorityData = [
      { label: t('common.critical'), value: alertsData.stats.critical },
      { label: t('common.high'), value: alertsData.stats.high },
      { label: t('common.medium'), value: alertsData.stats.medium },
      { label: t('common.low'), value: alertsData.stats.low }
    ];

    const statusData = [
      { label: t('common.pending'), value: alertsData.stats.pending, color: '#FF5722' },
      { label: t('common.handled'), value: alertsData.stats.handled, color: '#4CAF50' },
      { label: t('common.dismissed'), value: alertsData.stats.dismissed, color: '#9E9E9E' }
    ];

    return (
      <View>
        {/* 统计卡片 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              title={t('common.totalAlerts')}
              value={alertsData.stats.total.toString()}
              icon="warning"
              color="#FF5722"
              style={styles.statCard}
            />
            <StatsCard
              title={t('common.pending')}
              value={alertsData.stats.pending.toString()}
              icon="alert-circle"
              color="#F57C00"
              style={styles.statCard}
            />
          </View>
          
          <View style={styles.statsRow}>
            <StatsCard
              title={t('common.handled')}
              value={alertsData.stats.handled.toString()}
              icon="checkmark-circle"
              color="#4CAF50"
              style={styles.statCard}
            />
            <StatsCard
              title={t('common.criticalAlerts')}
              value={alertsData.stats.critical.toString()}
              icon="flash"
              color="#D32F2F"
              style={styles.statCard}
            />
          </View>
        </View>

        {/* 图表 */}
        <View style={styles.chartsContainer}>
          <Card style={styles.chartCard}>
            <Card.Content>
              <BarChart
                data={priorityData}
                title={t('alerts.alertPriorityDistribution')}
                height={180}
                color={['#D32F2F', '#F57C00', '#1976D2', '#388E3C']}
                yAxisLabel={t('alerts.alertCount')}
              />
            </Card.Content>
          </Card>

          <Card style={styles.chartCard}>
            <Card.Content>
              <PieChart
                data={statusData}
                title={t('alerts.alertStatusDistribution')}
                height={200}
              />
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  };

  // 渲染过滤器
  const renderFilters = () => (
    <View>
      <Text style={styles.filterTitle}>{t('alerts.statusFilter')}</Text>
      <View style={styles.statusFiltersContainer}>
        <Chip 
          mode="outlined"
          onPress={() => setFilterStatus('all')}
          style={[
            styles.statusFilterChip,
            filterStatus === 'all' && styles.selectedStatusChip
          ]}
          textStyle={[
            styles.statusFilterChipText,
            filterStatus === 'all' && styles.selectedStatusChipText
          ]}
        >
          {t('alerts.all')} ({alertsData.stats.total})
        </Chip>
        <Chip 
          mode="outlined"
          onPress={() => setFilterStatus('pending')}
          style={[
            styles.statusFilterChip,
            filterStatus === 'pending' && styles.selectedStatusChip
          ]}
          textStyle={[
            styles.statusFilterChipText,
            filterStatus === 'pending' && styles.selectedStatusChipText
          ]}
        >
          {t('common.pending')} ({alertsData.stats.pending})
        </Chip>
        <Chip 
          mode="outlined"
          onPress={() => setFilterStatus('handled')}
          style={[
            styles.statusFilterChip,
            filterStatus === 'handled' && styles.selectedStatusChip
          ]}
          textStyle={[
            styles.statusFilterChipText,
            filterStatus === 'handled' && styles.selectedStatusChipText
          ]}
        >
          {t('common.handled')} ({alertsData.stats.handled})
        </Chip>
        <Chip 
          mode="outlined"
          onPress={() => setFilterStatus('dismissed')}
          style={[
            styles.statusFilterChip,
            filterStatus === 'dismissed' && styles.selectedStatusChip
          ]}
          textStyle={[
            styles.statusFilterChipText,
            filterStatus === 'dismissed' && styles.selectedStatusChipText
          ]}
        >
          {t('common.dismissed')} ({alertsData.stats.dismissed})
        </Chip>
      </View>

      <Text style={styles.filterTitle}>{t('alerts.priorityFilter')}</Text>
      <View style={styles.filtersContainer}>
        <Chip 
          mode="outlined"
          onPress={() => setFilterPriority('all')}
          style={[
            styles.filterChip,
            filterPriority === 'all' && styles.selectedPriorityChip
          ]}
          textStyle={[
            styles.priorityFilterChipText,
            filterPriority === 'all' && styles.selectedPriorityChipText
          ]}
        >
          {t('alerts.all')}
        </Chip>
        <Chip 
          mode="outlined"
          onPress={() => setFilterPriority('critical')}
          style={[
            styles.filterChip,
            filterPriority === 'critical' && styles.selectedCriticalChip
          ]}
          textStyle={[
            styles.priorityFilterChipText,
            filterPriority === 'critical' && styles.selectedCriticalChipText
          ]}
        >
          {t('common.critical')}
        </Chip>
        <Chip 
          mode="outlined"
          onPress={() => setFilterPriority('high')}
          style={[
            styles.filterChip,
            filterPriority === 'high' && styles.selectedHighChip
          ]}
          textStyle={[
            styles.priorityFilterChipText,
            filterPriority === 'high' && styles.selectedHighChipText
          ]}
        >
          {t('common.high')}
        </Chip>
        <Chip 
          mode="outlined"
          onPress={() => setFilterPriority('medium')}
          style={[
            styles.filterChip,
            filterPriority === 'medium' && styles.selectedMediumChip
          ]}
          textStyle={[
            styles.priorityFilterChipText,
            filterPriority === 'medium' && styles.selectedMediumChipText
          ]}
        >
          {t('common.medium')}
        </Chip>
        <Chip 
          mode="outlined"
          onPress={() => setFilterPriority('low')}
          style={[
            styles.filterChip,
            filterPriority === 'low' && styles.selectedLowChip
          ]}
          textStyle={[
            styles.priorityFilterChipText,
            filterPriority === 'low' && styles.selectedLowChipText
          ]}
        >
          {t('common.low')}
        </Chip>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredAlerts = getFilteredAlerts();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('navigation.alerts')}
          </Text>
          <TouchableOpacity onPress={() => setShowStats(!showStats)}>
            <Ionicons 
              name={showStats ? 'bar-chart' : 'bar-chart-outline'} 
              size={24} 
              color="#2196F3" 
            />
          </TouchableOpacity>
        </View>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t('common.systemAnalysisAndPush')} · {t('common.totalPatients', { count: new Set(alertsData.alerts.map(alert => alert.patientId)).size })} · {t('common.dataSource')}: {alertsData.dataSource || t('common.healthAndMedicationTables')}
        </Text>
      </View>

      <Searchbar
        placeholder={t('common.searchPatientsOrAlerts')}
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={[
          ...(showStats ? ['stats'] : []),
          'filters',
          ...filteredAlerts
        ]}
        renderItem={({ item, index }) => {
          if (item === 'stats') {
            return renderStats();
          }
          if (item === 'filters') {
            return renderFilters();
          }
          return renderAlertCard({ item });
        }}
        keyExtractor={(item, index) => 
          typeof item === 'string' ? item : item.id.toString()
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          filteredAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                {t('common.noAbnormalAlerts')}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                {t('common.patientDataNormalNoTrends')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    margin: 0,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  chartsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chartCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  statusFiltersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterChip: {
    marginRight: 6,
    marginBottom: 8,
    height: 32,
    minWidth: 60,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusFilterChip: {
    minWidth: 80,
    marginRight: 6,
    marginBottom: 8,
    height: 32,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedStatusChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  statusFilterChipText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selectedStatusChipText: {
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  // 优先级筛选芯片样式
  priorityFilterChipText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selectedPriorityChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  selectedPriorityChipText: {
    color: '#2196F3',
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selectedCriticalChip: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  selectedCriticalChipText: {
    color: '#D32F2F',
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selectedHighChip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#F57C00',
    borderWidth: 1,
  },
  selectedHighChipText: {
    color: '#F57C00',
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selectedMediumChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
    borderWidth: 1,
  },
  selectedMediumChipText: {
    color: '#1976D2',
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  selectedLowChip: {
    backgroundColor: '#E8F5E8',
    borderColor: '#388E3C',
    borderWidth: 1,
  },
  selectedLowChipText: {
    color: '#388E3C',
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  listContainer: {
    paddingBottom: 80,
    flexGrow: 1,
    paddingTop: 8,
  },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
    marginRight: 12,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
    flexWrap: 'wrap',
    textAlignVertical: 'center',
  },
  patientName: {
    fontSize: 14,
    color: '#666',
    textAlignVertical: 'center',
  },
  alertBadges: {
    alignItems: 'flex-end',
    minWidth: 120,
    maxWidth: 120,
  },
  priorityChip: {
    height: 32,
    marginBottom: 6,
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  statusChip: {
    height: 32,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
    textAlignVertical: 'center',
  },
  alertDetails: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    flex: 1,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
    textAlignVertical: 'center',
  },
  actionButton: {
    height: 28,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonContent: {
    height: 28,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 8,
    margin: 0,
  },
  actionButtonLabel: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginVertical: 0,
    paddingVertical: 0,
  },
  handledBy: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
    textAlign: 'right',
    textAlignVertical: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 80,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },


  });
  
export default AlertsScreen; 