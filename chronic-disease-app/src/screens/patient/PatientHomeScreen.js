import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { 
  Text, 
  Card, 
  List, 
  Chip, 
  Button, 
  Avatar,
  IconButton,
  FAB,
  Portal,
  Dialog
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from '../../components/Charts';
import CustomCard from '../../components/CustomCard';
import { fetchUserProfile, fetchHealthTrends } from '../../store/slices/userSlice';
import { fetchTodayMedications } from '../../store/slices/medicationSlice';
import { patientsAPI, messagesAPI } from '../../services/api';
import { 
  METRIC_TYPES,
  evaluateHealthStatus,
  getStatusColor,
  getStatusText 
} from '../../utils/dataModels';

const PatientHomeScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user, profile } = useSelector((state) => state.auth);
  const { healthMetrics, loading } = useSelector((state) => state.user);
  const { todayMedications } = useSelector((state) => state.medication);
  
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [adviceList, setAdviceList] = useState([]);
  const [adviceDialogVisible, setAdviceDialogVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchUserProfile()),
        dispatch(fetchHealthTrends('week')),
        dispatch(fetchTodayMedications()) // 获取今日用药数据
      ]);
      // 加载我的医生建议
      if (user?.id) {
        const res = await patientsAPI.getPatientAdvice(user.id);
        if (res.data && res.data.success) {
          setAdviceList(res.data.data || []);
        } else if (Array.isArray(res.data)) {
          setAdviceList(res.data);
        }
      }
    } catch (error) {
      console.error('数据加载失败:', error);
    }
  };
  const openChatWithDoctor = async (doctorId, doctorName) => {
    try {
      if (!doctorId) {
        navigation.navigate('Messages');
        return;
      }
      let conversationId = null;
      try {
        const conv = await messagesAPI.getConversationWithUser(doctorId);
        conversationId = conv?.data?.id;
      } catch (err) {
        if (err?.response?.status === 404) {
          const created = await messagesAPI.startConversationWithUser(doctorId);
          conversationId = created?.data?.conversation?.id;
        } else {
          throw err;
        }
      }
      navigation.navigate('Messages', {
        screen: 'Chat',
        params: {
          conversationId,
          otherUser: { id: doctorId, name: doctorName || '', role: 'doctor' },
        },
      });
    } catch (e) {
      console.error('打开聊天失败:', e);
      navigation.navigate('Messages');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 获取今日用药信息
  const getTodayMedications = () => {
    // 从Redux store获取真实的用药数据
    return todayMedications || [];
  };

  // 计算今日服药总数量（根据具体药量）
  const getTodayMedicationCount = () => {
    const medications = getTodayMedications();
    if (medications.length === 0) return 0;
    
    // 计算所有药物的总剂量
    const totalDosage = medications.reduce((total, med) => {
      // 解析剂量字符串，提取数值
      const dosageStr = med.dosage || '0';
      const dosageMatch = dosageStr.match(/(\d+(?:\.\d+)?)/);
      const dosageValue = dosageMatch ? parseFloat(dosageMatch[1]) : 0;
      
      // 如果有次数信息，乘以次数
      const times = med.times || med.time_of_day || 1;
      const timeCount = Array.isArray(times) ? times.length : 1;
      
      return total + (dosageValue * timeCount);
    }, 0);
    
    return Math.round(totalDosage * 100) / 100; // 保留两位小数
  };

  // 获取待服用的用药数量（pending状态）
  const getPendingMedicationCount = () => {
    console.log('🔍 调试用药数据:', {
      todayMedications,
      totalCount: todayMedications?.length || 0,
      pendingCount: todayMedications?.filter(med => med.status === 'pending')?.length || 0,
      allStatuses: todayMedications?.map(med => ({ id: med.id, status: med.status, name: med.name })) || []
    });
    
    // 直接从todayMedications中获取pending状态的数量
    return todayMedications?.filter(med => med.status === 'pending')?.length || 0;
  };

  // 获取健康状态
  const getHealthStatus = () => {
    if (!healthMetrics || healthMetrics.length === 0) {
      return {
        status: t('patient.noData'),
        color: '#9E9E9E',
        level: 'no_data'
      };
    }

    // 获取最近的健康数据，过滤无效数据
    const validMetrics = healthMetrics.filter(metric => 
      metric && 
      typeof metric === 'object' && 
      metric.metric_type && 
      metric.measured_at
    );

    if (validMetrics.length === 0) {
      return {
        status: t('patient.noData'),
        color: '#9E9E9E',
        level: 'no_data'
      };
    }

    const sortedMetrics = [...validMetrics].sort((a, b) => 
      new Date(b.measured_at) - new Date(a.measured_at)
    );

    const latestMetric = sortedMetrics[0];
    
    // 确保latestMetric有效后再调用evaluateHealthStatus
    if (!latestMetric || !latestMetric.metric_type) {
      return {
        status: t('patient.noData'),
        color: '#9E9E9E',
        level: 'no_data'
      };
    }

    const healthLevel = evaluateHealthStatus(latestMetric);
    const statusText = getStatusText(healthLevel);
    const statusColor = getStatusColor(healthLevel);

    return {
      status: statusText,
      color: statusColor,
      level: healthLevel,
      lastMeasurement: latestMetric.measured_at
    };
  };

  // 处理趋势数据
  const processTrendsData = () => {
    if (!healthMetrics || healthMetrics.length === 0) {
      return [];
    }

    // 获取最近7天的数据
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentMetrics = healthMetrics.filter(metric => 
      new Date(metric.measured_at) >= oneWeekAgo
    );

    // 按指标类型分组
    const metricGroups = {
      [METRIC_TYPES.BLOOD_PRESSURE]: [],
      [METRIC_TYPES.BLOOD_GLUCOSE]: [],
      [METRIC_TYPES.WEIGHT]: [],
      [METRIC_TYPES.HEART_RATE]: []
    };

    recentMetrics.forEach(metric => {
      if (metricGroups[metric.metric_type]) {
        metricGroups[metric.metric_type].push(metric);
      }
    });

    const trendsData = [];

    // 血压趋势
    if (metricGroups[METRIC_TYPES.BLOOD_PRESSURE].length > 0) {
      const bpMetrics = metricGroups[METRIC_TYPES.BLOOD_PRESSURE]
        .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
      
      const latest = bpMetrics[bpMetrics.length - 1] || {};
      const trend = calculateTrend(bpMetrics, 'systolic');
      
      trendsData.push({
        title: t('health.bloodPressure') || '血压',
        color: '#e74c3c',
        icon: 'heart',
        series: [
          {
            name: t('health.systolic') || '收缩压',
            data: bpMetrics.map(m => ({ 
              value: m?.systolic || 0, 
              label: m?.measured_at ? new Date(m.measured_at).getDate().toString() : '--'
            })),
            color: '#e74c3c'
          },
          {
            name: t('health.diastolic') || '舒张压',
            data: bpMetrics.map(m => ({ 
              value: m?.diastolic || 0, 
              label: m?.measured_at ? new Date(m.measured_at).getDate().toString() : '--'
            })),
            color: '#c0392b'
          }
        ],
        currentValue: `${latest.systolic || '--'}/${latest.diastolic || '--'} mmHg`,
        trend: trend || 'stable'
      });
    }

    // 血糖趋势
    if (metricGroups[METRIC_TYPES.BLOOD_GLUCOSE].length > 0) {
      const bgMetrics = metricGroups[METRIC_TYPES.BLOOD_GLUCOSE]
        .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
      
      const latest = bgMetrics[bgMetrics.length - 1] || {};
      const trend = calculateTrend(bgMetrics, 'blood_glucose');
      
      trendsData.push({
        title: t('health.bloodGlucose') || '血糖',
        color: '#3498db',
        icon: 'water',
        series: [
          {
            name: t('health.bloodGlucose') || '血糖',
            data: bgMetrics.map(m => ({ 
              value: m?.blood_glucose || m?.glucose || 0, 
              label: m?.measured_at ? new Date(m.measured_at).getDate().toString() : '--'
            })),
            color: '#3498db'
          }
        ],
        currentValue: `${latest.blood_glucose || latest.glucose || '--'} mmol/L`,
        trend: trend || 'stable'
      });
    }

    // 体重趋势
    if (metricGroups[METRIC_TYPES.WEIGHT].length > 0) {
      const weightMetrics = metricGroups[METRIC_TYPES.WEIGHT]
        .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
      
      const latest = weightMetrics[weightMetrics.length - 1] || {};
      const trend = calculateTrend(weightMetrics, 'weight');
      
      trendsData.push({
        title: t('health.weight') || '体重',
        color: '#2ecc71',
        icon: 'fitness',
        series: [
          {
            name: t('health.weight') || '体重',
            data: weightMetrics.map(m => ({ 
              value: m?.weight || 0, 
              label: m?.measured_at ? new Date(m.measured_at).getDate().toString() : '--'
            })),
            color: '#2ecc71'
          }
        ],
        currentValue: `${latest.weight || '--'} kg`,
        trend: trend || 'stable'
      });
    }

    return trendsData;
  };

  // 计算趋势
  const calculateTrend = (metrics, field) => {
    if (!metrics || metrics.length < 2) return 'stable';
    
    const firstValue = metrics[0]?.[field] || 0;
    const lastValue = metrics[metrics.length - 1]?.[field] || 0;
    
    if (firstValue === 0) return 'stable';
    
    const difference = lastValue - firstValue;
    const percentChange = Math.abs(difference) / firstValue * 100;
    
    if (percentChange < 5) return 'stable';
    
    // 对于血压、血糖、体重，下降通常是好的
    if (['systolic', 'blood_glucose', 'glucose', 'weight'].includes(field)) {
      return difference > 0 ? 'worsening' : 'improving';
    }
    
    return difference > 0 ? 'increasing' : 'decreasing';
  };

  // 获取最新指标值
  const getLatestMetricValue = (metricType) => {
    if (!healthMetrics || healthMetrics.length === 0) {
      return '-- / --';
    }

    const typeMetrics = healthMetrics
      .filter(metric => metric.metric_type === metricType)
      .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at));

    if (typeMetrics.length === 0) {
      return '-- / --';
    }

    const latest = typeMetrics[0];
    
    switch (metricType) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        return `${latest.systolic || '--'}/${latest.diastolic || '--'} mmHg`;
      case METRIC_TYPES.BLOOD_GLUCOSE:
        return `${latest.blood_glucose || latest.glucose || '--'} mmol/L`;
      case METRIC_TYPES.WEIGHT:
        return `${latest.weight || '--'} kg`;
      case METRIC_TYPES.HEART_RATE:
        return `${latest.heart_rate || '--'} bpm`;
      default:
        return '-- / --';
    }
  };

  const healthStatusInfo = getHealthStatus();
  const trendsData = processTrendsData();

  const getTrendIcon = (trend) => {
          switch (trend) {
        case 'improving': return { name: 'arrow-down', color: '#4CAF50' };
        case 'stable': return { name: 'remove', color: '#2196F3' };
        case 'worsening': return { name: 'arrow-up', color: '#F44336' };
        default: return { name: 'remove', color: '#9E9E9E' };
    }
  };

  const renderTrendsChart = (trendData, index) => {
    // 防护：检查trendData是否有效
    if (!trendData || !trendData.trend || !trendData.title || !trendData.series) {
      console.warn('Invalid trend data:', trendData);
      return null;
    }

    const trendIcon = getTrendIcon(trendData.trend);
    
    return (
      <View key={index} style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <View style={styles.trendInfo}>
            <Ionicons name={trendData.icon || 'help'} size={24} color={trendData.color || '#9E9E9E'} />
            <View style={styles.trendLabels}>
              <Text style={styles.trendTitle}>{trendData.title || '未知指标'}</Text>
              <Text style={styles.trendValue}>{trendData.currentValue || '--'}</Text>
            </View>
          </View>
          <View style={styles.trendIndicator}>
            <Ionicons 
              name={trendIcon.name} 
              size={16} 
              color={trendIcon.color} 
            />
            <Text style={[styles.trendText, { color: trendIcon.color }]}>
              {t(`health.trend.${trendData.trend}`, trendData.trend)}
            </Text>
          </View>
        </View>
        
        <View style={styles.chartContainer}>
          <LineChart
            series={trendData.series || []}
            width={width - 80}
            height={120}
            showPoints={false}
            showGrid={false}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 问候语 */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.greeting}>
            {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() ? 
              t('patient.hello', { name: `${user.first_name}${user.last_name}` }) : 
              user?.name ? t('patient.hello', { name: user.name }) : t('patient.hello', { name: '' })
            }
          </Text>
          <Text variant="bodyLarge" style={styles.subGreeting}>
            {t('patient.todayIs', { 
              date: new Date().toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', { 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })
            })}
          </Text>
        </View>

        {/* 健康状态概览 */}
        <CustomCard
          title={t('patient.healthStatus')}
          subtitle={t('patient.currentStatus', { status: healthStatusInfo.status })}
          content={
            <View style={styles.healthOverview}>
              <View style={styles.healthMetric}>
                <Ionicons name="heart" size={24} color="#e74c3c" />
                <Text style={styles.metricLabel}>{t('health.bloodPressure')}</Text>
                <Text style={styles.metricValue}>
                  {getLatestMetricValue(METRIC_TYPES.BLOOD_PRESSURE)}
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Ionicons name="water" size={24} color="#3498db" />
                <Text style={styles.metricLabel}>{t('health.bloodGlucose')}</Text>
                <Text style={styles.metricValue}>
                  {getLatestMetricValue(METRIC_TYPES.BLOOD_GLUCOSE)}
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Ionicons name="fitness" size={24} color="#2ecc71" />
                <Text style={styles.metricLabel}>{t('health.weight')}</Text>
                <Text style={styles.metricValue}>
                  {getLatestMetricValue(METRIC_TYPES.WEIGHT)}
                </Text>
              </View>
            </View>
          }
          onPress={() => navigation.navigate('HealthData')}
        />

        {/* 今日用药 */}
        <CustomCard
                        title={t('patient.todayMedication')}
              subtitle={t('patient.medicationsToTake', { count: getPendingMedicationCount() })}
          content={
            <View style={styles.medicationList}>
              {todayMedications.length > 0 ? (
                <Text style={styles.medicationSummary}>
                  {t('patient.medicationSummary', { count: todayMedications.length })}
                </Text>
              ) : (
                <Text style={styles.noMedicationText}>{t('patient.noMedicationToday')}</Text>
              )}
            </View>
          }
          onPress={() => navigation.navigate('Medication')}
        />

        {/* 最新医生建议 */}
        <CustomCard
          title={t('patient.doctorAdvice')}
          subtitle={t('patient.latestHealthGuidance')}
          content={
            <View style={styles.adviceContainer}>
              {adviceList.length > 0 ? (
                <>
                  <Text style={styles.adviceText}>{adviceList[0].content}</Text>
                  <Text style={styles.adviceTime}>
                    {adviceList[0].advice_time ? new Date(adviceList[0].advice_time).toLocaleDateString('zh-CN') : ''}
                    {adviceList[0].doctor_name ? ` · ${adviceList[0].doctor_name}` : ''}
                  </Text>
                </>
              ) : (
                <Text style={styles.adviceText}>{t('patient.noNewAdvice')}</Text>
              )}
            </View>
          }
          onPress={() => setAdviceDialogVisible(true)}
        />

        {/* 健康趋势图表 */}
        <CustomCard
          title={t('health.healthTrends')} 
          subtitle={t('patient.recentTrends')}
          content={
            <View style={styles.trendsContainer}>
              {trendsData
                .filter(trendData => trendData && trendData.trend && trendData.title && trendData.series)
                .map((trendData, index) => renderTrendsChart(trendData, index))}
              
              {/* 查看更多按钮 */}
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('HealthData')}
              >
                <Text style={styles.viewMoreText}>{t('health.viewAll')}</Text>
                <Ionicons name="chevron-forward" size={16} color="#2196F3" />
              </TouchableOpacity>
            </View>
          }
        />
      </ScrollView>

      {/* 医生建议弹窗 */}
      <Portal>
        <Dialog visible={adviceDialogVisible} onDismiss={() => setAdviceDialogVisible(false)}>
          <Dialog.Title>{t('patient.doctorAdvice')}</Dialog.Title>
          <Dialog.Content>
            {adviceList.length === 0 ? (
              <Text>{t('patient.noNewAdvice')}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 280 }}>
                {adviceList.slice(0, 5).map((item) => (
                  <View key={item.id} style={{ marginBottom: 12 }}>
                    <Text style={{ fontWeight: '600', marginBottom: 4 }}>
                      {item.doctor_name ? `${t('patients.doctor')}: ${item.doctor_name}` : ''}
                    </Text>
                    <Text style={{ color: '#666', marginBottom: 6 }}>
                      {item.advice_time ? new Date(item.advice_time).toLocaleString() : ''}
                    </Text>
                    <Text style={{ lineHeight: 20 }}>{item.content}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {adviceList.length > 0 && (
              <Button onPress={() => {
                setAdviceDialogVisible(false);
                openChatWithDoctor(adviceList[0].doctor, adviceList[0].doctor_name);
              }}>
                {t('patient.contactDoctor')}
              </Button>
            )}
            <Button onPress={() => setAdviceDialogVisible(false)}>{t('common.close')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 悬浮操作按钮 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('HealthData', {
          screen: 'DataEntry'
        })}
        label={t('patient.enterData')}
      />
    </SafeAreaView>
  );
};

// 快捷操作按钮组件
const CustomActionButton = ({ icon, title, onPress }) => (
  <CustomCard
    title={title}
    icon={<Ionicons name={icon} size={28} color="#2E86AB" />}
    onPress={onPress}
    style={styles.actionButton}
    titleStyle={styles.actionButtonTitle}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 18,
    color: '#666666',
  },
  healthOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  healthMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  medicationList: {
    paddingVertical: 4,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  medicationTime: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '500',
  },
  noMedicationText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 16,
  },
  adviceContainer: {
    paddingVertical: 4,
  },
  adviceText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 8,
  },
  adviceTime: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
  },
  trendsContainer: {
    paddingVertical: 8,
  },
  trendCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendLabels: {
    marginLeft: 12,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  trendValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginTop: 2,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E86AB',
  },
});

export default PatientHomeScreen; 