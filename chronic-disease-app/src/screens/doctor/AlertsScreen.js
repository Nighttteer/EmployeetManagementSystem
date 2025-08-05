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
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

// 导入图表组件
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import StatsCard from '../../components/StatsCard';

import { API_BASE_URL } from '../../services/api';

const AlertsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  
  // 获取认证信息
  const { isAuthenticated, user, role, token } = useSelector(state => state.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, handled, dismissed
  const [filterPriority, setFilterPriority] = useState('all'); // all, critical, high, medium, low
  const [showStats, setShowStats] = useState(true);


  // 系统定期分析患者数据生成的告警
  const [alertsData, setAlertsData] = useState({
    doctorId: 1, // 当前登录医生ID
    lastAnalysisTime: '2024-01-15T10:30:00Z', // 最后分析时间
    analysisInterval: '每3天', // 分析频率
    dataRange: '最近3天', // 分析数据范围
    stats: {
      total: 6,
      pending: 3, 
      handled: 1,
      dismissed: 2,
      critical: 1,
      high: 2,
      medium: 1,
      low: 2
    },
    alerts: [
      {
        id: 1,
        patientId: 1,
        patientName: '张三',
        patientAge: 65,
        doctorId: 1,
        assignedAt: '2023-12-01T00:00:00Z',
        type: 'threshold_exceeded',
        title: '血压异常警报',
        message: '系统分析患者最近3天血压数据，发现收缩压持续偏高',
        priority: 'critical',
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z',
        // 系统分析的数据范围
        analysisData: {
          dataRange: '2024-01-12 至 2024-01-15',
          analysisType: '3天数据趋势分析',
          patientEntries: [
            { date: '2024-01-13', value: '175/92', time: '08:30' },
            { date: '2024-01-14', value: '178/94', time: '09:15' },
            { date: '2024-01-15', value: '180/95', time: '10:25' }
          ],
          trend: '连续上升',
          avgValue: '177.7/93.7'
        },
        relatedMetric: '血压',
        value: '180/95 mmHg',
        threshold: '< 140/90 mmHg',
        thresholdSetBy: '医生设定'
      },
      {
        id: 2,
        patientId: 2,
        patientName: '李四',
        patientAge: 58,
        doctorId: 1,
        assignedAt: '2023-11-15T00:00:00Z',
        type: 'missed_medication',
        title: '连续漏服药物',
        message: '系统检测患者最近3天用药依从性下降，连续2天未记录服药',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-15T09:15:00Z',
        // 系统分析的用药数据
        analysisData: {
          dataRange: '2024-01-13 至 2024-01-15',
          analysisType: '用药依从性分析',
          expectedDoses: 3, // 3天应服用次数
          recordedDoses: 1, // 实际记录次数
          complianceRate: '33.3%', // 依从性
          missedPattern: '连续漏服',
          lastTaken: '2024-01-13 08:00'
        },
        medicationName: '氨氯地平片',
        dosage: '5mg',
        frequency: '每日一次',
        missedDoses: 2,
        consecutiveMissed: true
      },
      {
        id: 3,
        patientId: 3,
        patientName: '王五',
        patientAge: 72,
        doctorId: 1,
        assignedAt: '2023-10-20T00:00:00Z',
        type: 'improvement_trend',
        title: '血糖下降改善',
        message: '系统分析患者最近3天血糖数据，发现平均值8.00mmol/L，呈下降趋势',
        priority: 'low',
        status: 'pending',
        createdAt: '2024-01-14T16:45:00Z',
        handledBy: null,
        handledAt: null,
        // 系统分析的血糖数据
        analysisData: {
          dataRange: '2024-01-12 至 2024-01-14',
          analysisType: '血糖趋势分析',
          patientEntries: [
            { date: '2024-01-12', value: 8.2, type: '餐后2小时' },
            { date: '2024-01-13', value: 8.0, type: '空腹' },
            { date: '2024-01-14', value: 7.8, type: '餐后' }
          ],
          avgValue: 8.00,
          trend: '持续下降',
          exceedsTarget: true,
          targetRange: '4.4-7.0'
        },
        relatedMetric: '血糖',
        targetRange: '4.4-7.0 mmol/L',
        trendDirection: 'up'
      },
      {
        id: 4,
        patientId: 4,
        patientName: '赵六',
        patientAge: 60,
        doctorId: 1,
        assignedAt: '2023-09-05T00:00:00Z',
        type: 'patient_inactivity',
        title: '患者活动异常',
        message: '系统检测患者最近3天数据上传活跃度异常，仅1次记录',
        priority: 'low',
        status: 'pending',
        createdAt: '2024-01-14T14:20:00Z',
        // 系统分析的活跃度数据
        analysisData: {
          dataRange: '2024-01-12 至 2024-01-14',
          analysisType: '患者活跃度分析',
          expectedEntries: 9, // 3天预期记录数
          actualEntries: 1, // 实际记录数
          activityRate: '11.1%',
          lastActive: '2024-01-11 22:30',
          inactiveDays: 3
        },
        expectedFrequency: '每日数据上传',
        lastDataSync: '2024-01-11T22:30:00Z'
      },
      {
        id: 5,
        patientId: 1,
        patientName: '张三',
        patientAge: 65,
        doctorId: 1,
        assignedAt: '2023-12-01T00:00:00Z',
        type: 'threshold_exceeded',
        title: '心率异常告警',
        message: '系统分析患者3天心率数据，运动状态下110bpm属正常范围',
        priority: 'high',
        status: 'dismissed',
        createdAt: '2024-01-13T11:30:00Z',
        dismissedBy: '当前医生',
        dismissedAt: '2024-01-13T12:00:00Z',
        dismissReason: '患者APP显示运动状态，心率正常',
        // 系统分析的心率数据
        analysisData: {
          dataRange: '2024-01-11 至 2024-01-13',
          analysisType: '心率异常检测',
          patientEntries: [
            { date: '2024-01-11', value: 72, context: '静息' },
            { date: '2024-01-12', value: 85, context: '餐后' },
            { date: '2024-01-13', value: 110, context: '运动后' }
          ],
          contextAnalysis: '运动状态下心率正常',
          riskLevel: '低风险'
        },
        relatedMetric: '心率',
        normalRange: '60-100 bpm',
        threshold: '< 100 bpm (静息状态)'
      },
      {
        id: 6,
        patientId: 5,
        patientName: '钱七',
        patientAge: 55,
        doctorId: 1,
        assignedAt: '2023-08-10T00:00:00Z',
        type: 'medication_side_effect',
        title: '用药反应报告',
        message: '系统检测患者最近3天症状报告，发现用药后轻微不适',
        priority: 'low',
        status: 'dismissed',
        createdAt: '2024-01-12T09:15:00Z',
        dismissedBy: '当前医生',
        dismissedAt: '2024-01-12T10:30:00Z',
        dismissReason: '已电话随访，轻微反应，继续观察',
        // 系统分析的症状数据
        analysisData: {
          dataRange: '2024-01-10 至 2024-01-12',
          analysisType: '副作用监测分析',
          symptomReports: [
            { date: '2024-01-10', symptoms: '无', medication: '氨氯地平片' },
            { date: '2024-01-11', symptoms: '轻微头晕', medication: '氨氯地平片' },
            { date: '2024-01-12', symptoms: '头晕，想吐', medication: '氨氯地平片' }
          ],
          pattern: '服药后轻微副作用',
          severity: '可耐受',
          recommendation: '继续观察'
        },
        medicationName: '氨氯地平片',
        sideEffectType: '常见副作用',
        followUpNeeded: false
      }
    ]
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // 检查认证状态
      if (!isAuthenticated || !token || !user) {
        console.error('用户未认证，无法获取告警数据');
        console.log('使用模拟数据...');
  
        setLoading(false);
        return;
      }

      console.log('🔐 用户认证信息:', { 
        isAuthenticated, 
        userId: user?.id, 
        role, 
        hasToken: !!token 
      });
      
      // 系统每3天自动分析患者数据联动流程：
      // 1. 查询医患关系表(DoctorPatientRelation)获取当前医生的患者
      // 2. 从健康指标表(HealthMetric)抓取患者最近3天数据
      // 3. 从用药提醒表(MedicationReminder)分析用药依从性
      // 4. 分析数据趋势，生成告警写入Alert表
      // 5. 查询Alert表获取告警推送医生端
      
      // 实际API调用 - 从数据库获取告警数据
      const doctorId = user.id || alertsData.doctorId;
      const apiUrl = `${API_BASE_URL.replace('/api', '')}/api/health/alerts/doctor/${doctorId}/`;
      
      console.log('📡 API请求:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('从数据库获取告警数据:', result);
        
        if (result.success && result.data) {
          // 更新告警数据
          setAlertsData(prev => ({
            ...prev,
            alerts: result.data.alerts,
            stats: result.data.stats,
            lastAnalysisTime: result.data.lastAnalysisTime,
            dataSource: result.data.dataSource
          }));
          
          console.log(`成功获取 ${result.data.alerts.length} 条数据库告警数据`);
          console.log(`数据来源: ${result.dataSource}`);
        }
        
        // 处理告警数据
  
      } else {
        console.error('获取告警数据失败:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('错误详情:', errorText);
        // 降级使用模拟数据
        console.log('降级使用模拟数据...');
  
      }
      
      setLoading(false);
    } catch (error) {
      console.error('获取数据库告警数据失败:', error);
      console.error('错误类型:', error.name);
      console.error('错误消息:', error.message);
      // 降级使用模拟数据
      console.log('使用模拟数据...');

      setLoading(false);
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

  // 获取优先级文本
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'critical': return '危急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
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

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return t('alerts.pending');
      case 'handled': return t('alerts.handled');
      case 'dismissed': return t('alerts.dismissed');
      default: return t('alerts.unknown');
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
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  // 处理告警
  const handleAlert = (alertId) => {
    Alert.alert(
      t('alerts.handleAlert'),
      t('alerts.selectHandlingMethod'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('alerts.markAsHandled'), 
          onPress: () => markAsHandled(alertId) 
        },
        { 
          text: t('alerts.dismissAlert'), 
          onPress: () => dismissAlert(alertId) 
        }
      ]
    );
  };

  const markAsHandled = (alertId) => {
    // 模拟处理告警
    console.log('处理告警:', alertId);
  };

  const dismissAlert = (alertId) => {
    // 模拟忽略告警
    console.log('忽略告警:', alertId);
  };

  // 渲染告警卡片
  const renderAlertCard = ({ item: alert }) => (
    <TouchableOpacity onPress={() => navigation.navigate('AlertDetails', { alert })}>
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
                  {alert.title}
                </Text>

              </View>
              <Text style={styles.patientName}>
                {alert.patientName} · {alert.patientAge}岁 · 我的患者
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
          
          <Text style={styles.alertMessage}>{alert.message}</Text>


          
          {/* 告警详细信息 */}
          {alert.relatedMetric && (
            <View style={styles.alertDetails}>
              <Text style={styles.detailLabel}>相关指标:</Text>
              <Text style={styles.detailValue}>
                {alert.relatedMetric}: {alert.value}
              </Text>
            </View>
          )}
          
          {alert.medicationName && (
            <View style={styles.alertDetails}>
              <Text style={styles.detailLabel}>相关药物:</Text>
              <Text style={styles.detailValue}>
                {alert.medicationName} (漏服{alert.missedDoses}次)
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

  // 渲染统计数据
  const renderStats = () => {
    const priorityData = [
      { label: '危急', value: alertsData.stats.critical },
      { label: '高', value: alertsData.stats.high },
      { label: '中', value: alertsData.stats.medium },
      { label: '低', value: alertsData.stats.low }
    ];

    const statusData = [
      { label: t('alerts.pending'), value: alertsData.stats.pending, color: '#FF5722' },
      { label: t('alerts.handled'), value: alertsData.stats.handled, color: '#4CAF50' },
      { label: t('alerts.dismissed'), value: alertsData.stats.dismissed, color: '#9E9E9E' }
    ];

    return (
      <View>
        {/* 统计卡片 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              title={t('alerts.totalAlerts')}
              value={alertsData.stats.total.toString()}
              icon="warning"
              color="#FF5722"
              style={styles.statCard}
            />
            <StatsCard
              title={t('alerts.pending')}
              value={alertsData.stats.pending.toString()}
              icon="alert-circle"
              color="#F57C00"
              style={styles.statCard}
            />
          </View>
          
          <View style={styles.statsRow}>
            <StatsCard
              title={t('alerts.handled')}
              value={alertsData.stats.handled.toString()}
              icon="checkmark-circle"
              color="#4CAF50"
              style={styles.statCard}
            />
            <StatsCard
              title={t('alerts.criticalAlerts')}
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
          {t('alerts.pending')} ({alertsData.stats.pending})
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
          {t('alerts.handled')} ({alertsData.stats.handled})
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
          已忽略 ({alertsData.stats.dismissed})
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
          全部
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
          危急
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
          高
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
          中
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
          低
        </Chip>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('alerts.loadingAlerts')}</Text>
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
          系统分析数据库患者数据并推送 · 共{new Set(alertsData.alerts.map(alert => alert.patientId)).size}位患者 · 数据来源: {alertsData.dataSource || '健康指标表+用药记录表'}
        </Text>
      </View>

      <Searchbar
        placeholder="搜索患者姓名或告警内容..."
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
                暂无异常告警
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                系统分析患者数据正常，暂无异常趋势需要关注
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
  },
  statusFilterChip: {
    minWidth: 80,
    marginRight: 6,
    marginBottom: 8,
    height: 32,
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    borderWidth: 1,
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
  },
  selectedStatusChipText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  // 优先级筛选芯片样式
  priorityFilterChipText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  selectedPriorityChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  selectedPriorityChipText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  selectedCriticalChip: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
    borderWidth: 1,
  },
  selectedCriticalChipText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  selectedHighChip: {
    backgroundColor: '#FFF3E0',
    borderColor: '#F57C00',
    borderWidth: 1,
  },
  selectedHighChipText: {
    color: '#F57C00',
    fontWeight: '600',
  },
  selectedMediumChip: {
    backgroundColor: '#E3F2FD',
    borderColor: '#1976D2',
    borderWidth: 1,
  },
  selectedMediumChipText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  selectedLowChip: {
    backgroundColor: '#E8F5E8',
    borderColor: '#388E3C',
    borderWidth: 1,
  },
  selectedLowChipText: {
    color: '#388E3C',
    fontWeight: '600',
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
  },
  patientName: {
    fontSize: 14,
    color: '#666',
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
  },
  actionButton: {
    height: 32,
  },
  handledBy: {
    fontSize: 12,
    color: '#4CAF50',
    fontStyle: 'italic',
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