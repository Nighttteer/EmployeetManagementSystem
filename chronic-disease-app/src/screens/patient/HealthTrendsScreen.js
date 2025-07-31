import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { 
  Text, 
  Card, 
  SegmentedButtons, 
  Button, 
  Chip,
  Portal,
  Modal,
  DataTable
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from '../../components/Charts';
import { fetchHealthTrends } from '../../store/slices/userSlice';
import { 
  METRIC_TYPES, 
  evaluateHealthStatus,
  getStatusColor,
  getStatusText
} from '../../utils/dataModels';

const { width } = Dimensions.get('window');

const HealthTrendsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { healthMetrics, healthTrends, loading } = useSelector((state) => state.user);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState(METRIC_TYPES.BLOOD_PRESSURE);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);

  // 组件挂载时自动加载数据
  useEffect(() => {
    console.log('HealthTrendsScreen 组件挂载，开始加载数据');
    loadTrendsData();
  }, []);

  // 当selectedPeriod改变时重新加载数据
  useEffect(() => {
    if (selectedPeriod) {
      console.log('HealthTrendsScreen 时间段改变，重新加载数据:', selectedPeriod);
      loadTrendsData();
    }
  }, [selectedPeriod]);

  // 处理趋势数据
  const processTrendsData = () => {
    if (!healthMetrics || healthMetrics.length === 0) {
      return {};
    }

    // 根据选定时间段过滤数据
    const filterDate = new Date();
    switch (selectedPeriod) {
      case 'week':
        filterDate.setDate(filterDate.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(filterDate.getMonth() - 1);
        break;
      case 'quarter':
        filterDate.setMonth(filterDate.getMonth() - 3);
        break;
      case 'year':
        filterDate.setFullYear(filterDate.getFullYear() - 1);
        break;
    }

    const filteredMetrics = healthMetrics.filter(metric => 
      new Date(metric.measured_at) >= filterDate
    );

    // 按指标类型分组并处理数据
    const processed = {};
    
    Object.values(METRIC_TYPES).forEach(metricType => {
      const typeMetrics = filteredMetrics
        .filter(metric => metric.metric_type === metricType)
        .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at));
      
      if (typeMetrics.length === 0) {
        processed[metricType.toLowerCase().replace('_', '')] = {
          data: [],
          trend: 'stable',
          average: {},
          goal: {},
          progress: 0
        };
        return;
      }

      const data = typeMetrics.map(metric => ({
        date: metric.measured_at,
        ...extractMetricValues(metric, metricType)
      }));

      // 计算平均值
      const average = calculateAverage(typeMetrics, metricType);
      
      // 计算趋势
      const trend = calculateTrend(typeMetrics, metricType);
      
      // 设置目标值（示例值）
      const goal = getGoalValues(metricType);
      
      // 计算进度
      const progress = calculateProgress(average, goal, metricType);

      processed[metricType.toLowerCase().replace('_', '')] = {
        data,
        trend,
        average,
        goal,
        progress
      };
    });

    return processed;
  };

  // 提取指标值
  const extractMetricValues = (metric, metricType) => {
    switch (metricType) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        return { 
          systolic: metric.systolic || 0, 
          diastolic: metric.diastolic || 0 
        };
      case METRIC_TYPES.BLOOD_GLUCOSE:
        return { glucose: metric.blood_glucose || metric.glucose || 0 };
      case METRIC_TYPES.WEIGHT:
        return { weight: metric.weight || 0 };
      case METRIC_TYPES.HEART_RATE:
        return { heartRate: metric.heart_rate || metric.heartRate || 0 };
      default:
        return {};
    }
  };

  // 计算平均值
  const calculateAverage = (metrics, metricType) => {
    if (metrics.length === 0) return {};
    
    switch (metricType) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        const avgSystolic = metrics.reduce((sum, m) => sum + (m.systolic || 0), 0) / metrics.length;
        const avgDiastolic = metrics.reduce((sum, m) => sum + (m.diastolic || 0), 0) / metrics.length;
        return { 
          systolic: Math.round(avgSystolic), 
          diastolic: Math.round(avgDiastolic) 
        };
      case METRIC_TYPES.BLOOD_GLUCOSE:
        const avgGlucose = metrics.reduce((sum, m) => sum + (m.blood_glucose || m.glucose || 0), 0) / metrics.length;
        return { glucose: parseFloat(avgGlucose.toFixed(1)) };
      case METRIC_TYPES.WEIGHT:
        const avgWeight = metrics.reduce((sum, m) => sum + (m.weight || 0), 0) / metrics.length;
        return { weight: parseFloat(avgWeight.toFixed(1)) };
      case METRIC_TYPES.HEART_RATE:
        const avgHeartRate = metrics.reduce((sum, m) => sum + (m.heart_rate || 0), 0) / metrics.length;
        return { heartRate: Math.round(avgHeartRate) };
      default:
        return {};
    }
  };

  // 计算趋势
  const calculateTrend = (metrics, metricType) => {
    if (metrics.length < 2) return 'stable';
    
    let firstValue, lastValue;
    
    switch (metricType) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        firstValue = metrics[0].systolic || 0;
        lastValue = metrics[metrics.length - 1].systolic || 0;
        break;
      case METRIC_TYPES.BLOOD_GLUCOSE:
        firstValue = metrics[0].blood_glucose || metrics[0].glucose || 0;
        lastValue = metrics[metrics.length - 1].blood_glucose || metrics[metrics.length - 1].glucose || 0;
        break;
      case METRIC_TYPES.WEIGHT:
        firstValue = metrics[0].weight || 0;
        lastValue = metrics[metrics.length - 1].weight || 0;
        break;
      case METRIC_TYPES.HEART_RATE:
        firstValue = metrics[0].heart_rate || 0;
        lastValue = metrics[metrics.length - 1].heart_rate || 0;
        break;
      default:
        return 'stable';
    }
    
    const difference = lastValue - firstValue;
    const percentChange = Math.abs(difference) / firstValue * 100;
    
    if (percentChange < 5) return 'stable';
    
    // 对于血压、血糖、体重，下降是好的
    if ([METRIC_TYPES.BLOOD_PRESSURE, METRIC_TYPES.BLOOD_GLUCOSE, METRIC_TYPES.WEIGHT].includes(metricType)) {
      return difference > 0 ? 'worsening' : 'improving';
    }
    
    return difference > 0 ? 'increasing' : 'decreasing';
  };

  // 获取目标值
  const getGoalValues = (metricType) => {
    switch (metricType) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        return { systolic: 120, diastolic: 80 };
      case METRIC_TYPES.BLOOD_GLUCOSE:
        return { glucose: 5.5 };
      case METRIC_TYPES.WEIGHT:
        return { weight: 65.0 }; // 应该根据用户资料计算
      case METRIC_TYPES.HEART_RATE:
        return { heartRate: 72 };
      default:
        return {};
    }
  };

  // 计算进度
  const calculateProgress = (average, goal, metricType) => {
    if (!average || !goal) return 0;
    
    switch (metricType) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        if (average.systolic && goal.systolic) {
          const diff = Math.abs(average.systolic - goal.systolic);
          return Math.max(0, 100 - (diff / goal.systolic * 100));
        }
        break;
      case METRIC_TYPES.BLOOD_GLUCOSE:
        if (average.glucose && goal.glucose) {
          const diff = Math.abs(average.glucose - goal.glucose);
          return Math.max(0, 100 - (diff / goal.glucose * 100));
        }
        break;
      case METRIC_TYPES.WEIGHT:
        if (average.weight && goal.weight) {
          const diff = Math.abs(average.weight - goal.weight);
          return Math.max(0, 100 - (diff / goal.weight * 100));
        }
        break;
      case METRIC_TYPES.HEART_RATE:
        if (average.heartRate && goal.heartRate) {
          const diff = Math.abs(average.heartRate - goal.heartRate);
          return Math.max(0, 100 - (diff / goal.heartRate * 100));
        }
        break;
    }
    return 0;
  };

  // 获取处理后的趋势数据
  const trendsData = processTrendsData();

  const periodButtons = [
    { value: 'week', label: t('health.thisWeek') },
    { value: 'month', label: t('health.thisMonth') },
    { value: 'quarter', label: t('health.thisQuarter') },
    { value: 'year', label: t('health.thisYear') }
  ];

  const metricButtons = [
    { 
      value: METRIC_TYPES.BLOOD_PRESSURE, 
      label: t('health.bloodPressure'), 
      icon: 'heart',
      color: '#e74c3c' 
    },
    { 
      value: METRIC_TYPES.BLOOD_GLUCOSE, 
      label: t('health.bloodGlucose'), 
      icon: 'water',
      color: '#3498db' 
    },
    { 
      value: METRIC_TYPES.WEIGHT, 
      label: t('health.weight'), 
      icon: 'fitness',
      color: '#2ecc71' 
    },
    { 
      value: METRIC_TYPES.HEART_RATE, 
      label: t('health.heartRate'), 
      icon: 'pulse',
      color: '#9b59b6' 
    }
  ];

  useEffect(() => {
    loadTrendsData();
  }, [selectedPeriod, selectedMetric]);

  const loadTrendsData = async () => {
    try {
      console.log('HealthTrendsScreen 开始加载趋势数据，时间段:', selectedPeriod);
      await dispatch(fetchHealthTrends(selectedPeriod));
    } catch (error) {
      console.error('加载趋势数据失败:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrendsData();
    setRefreshing(false);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
        case 'improving': return { name: 'arrow-down', color: '#4CAF50' };
        case 'stable': return { name: 'remove', color: '#2196F3' };
        case 'worsening': return { name: 'arrow-up', color: '#F44336' };
      default: return { name: 'remove', color: '#9E9E9E' };
    }
  };

  const formatMetricValue = (type, values) => {
    switch (type) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        return `${values.systolic}/${values.diastolic} mmHg`;
      case METRIC_TYPES.BLOOD_GLUCOSE:
        return `${values.glucose} mmol/L`;
      case METRIC_TYPES.WEIGHT:
        return `${values.weight} kg`;
      case METRIC_TYPES.HEART_RATE:
        return `${values.heartRate} bpm`;
      default:
        return JSON.stringify(values);
    }
  };

  const getCurrentMetricData = () => {
    const metricKey = selectedMetric.toLowerCase().replace('_', '');
    return trendsData[metricKey] || trendsData.bloodPressure;
  };

  const prepareChartData = () => {
    const data = getCurrentMetricData();
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      return { series: [] };
    }

    const labels = data.data.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    let series = [];

    switch (selectedMetric) {
      case METRIC_TYPES.BLOOD_PRESSURE:
        series = [
          {
            name: t('health.systolic'),
            data: data.data.map(item => item.systolic || 0),
            color: '#e74c3c',
          },
          {
            name: t('health.diastolic'),
            data: data.data.map(item => item.diastolic || 0),
            color: '#3498db',
          }
        ];
        break;
      case METRIC_TYPES.BLOOD_GLUCOSE:
        series = [{
          name: t('health.bloodGlucose'),
          data: data.data.map(item => item.glucose || 0),
          color: '#3498db',
        }];
        break;
      case METRIC_TYPES.WEIGHT:
        series = [{
          name: t('health.weight'),
          data: data.data.map(item => item.weight || 0),
          color: '#2ecc71',
        }];
        break;
      case METRIC_TYPES.HEART_RATE:
        series = [{
          name: t('health.heartRate'),
          data: data.data.map(item => item.heartRate || 0),
          color: '#9b59b6',
        }];
        break;
      default:
        series = [];
        break;
    }

    return { labels, series };
  };

  const showAnalysisModal = () => {
    const data = getCurrentMetricData();
    setModalContent({
      type: 'analysis',
      data: data
    });
    setShowModal(true);
  };

  const showGoalsModal = () => {
    const data = getCurrentMetricData();
    setModalContent({
      type: 'goals',
      data: data
    });
    setShowModal(true);
  };

  const renderMetricSelector = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.cardTitle}>
          {t('health.selectMetric')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.metricChips}>
            {metricButtons.map(metric => (
              <Chip
                key={metric.value}
                mode={selectedMetric === metric.value ? 'flat' : 'outlined'}
                selected={selectedMetric === metric.value}
                onPress={() => setSelectedMetric(metric.value)}
                style={[
                  styles.metricChip,
                  selectedMetric === metric.value && { backgroundColor: metric.color }
                ]}
                textStyle={[
                  styles.chipText,
                  selectedMetric === metric.value && { color: 'white' }
                ]}
                icon={() => (
                  <Ionicons 
                    name={metric.icon} 
                    size={16} 
                    color={selectedMetric === metric.value ? 'white' : '#666'} 
                  />
                )}
              >
                {metric.label}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );

  const renderTrendChart = () => {
    const chartData = prepareChartData();
    const metricData = getCurrentMetricData();
    const trendIcon = getTrendIcon(metricData.trend);
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {metricButtons.find(m => m.value === selectedMetric)?.label} {t('health.trends')}
            </Text>
            <View style={styles.trendIndicator}>
              <Ionicons 
                name={trendIcon.name} 
                size={20} 
                color={trendIcon.color} 
              />
              <Text style={[styles.trendText, { color: trendIcon.color }]}>
                {t(`health.trend.${metricData.trend}`)}
              </Text>
            </View>
          </View>
          
          <LineChart
            series={chartData.series}
            width={width - 64}
            height={220}
            showPoints={true}
            showGrid={true}
            style={styles.chart}
          />
          
          <View style={styles.chartActions}>
            <Button 
              mode="outlined" 
              onPress={showAnalysisModal}
              style={styles.actionButton}
            >
              {t('health.detailedAnalysis')}
            </Button>
            {metricData.goal && (
              <Button 
                mode="outlined" 
                onPress={showGoalsModal}
                style={styles.actionButton}
              >
                {t('health.viewGoals')}
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderStatisticsCard = () => {
    const data = getCurrentMetricData();
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.cardTitle}>
            {t('health.statistics')}
          </Text>
          
          <View style={styles.statisticsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('health.average')}</Text>
              <Text style={styles.statValue}>
                {formatMetricValue(selectedMetric, data.average)}
              </Text>
            </View>
            
            {data.bestReading && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('health.bestReading')}</Text>
                <Text style={styles.statValue}>
                  {formatMetricValue(selectedMetric, data.bestReading)}
                </Text>
                <Text style={styles.statDate}>{data.bestReading.date}</Text>
              </View>
            )}
            
            {data.worstReading && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('health.worstReading')}</Text>
                <Text style={styles.statValue}>
                  {formatMetricValue(selectedMetric, data.worstReading)}
                </Text>
                <Text style={styles.statDate}>{data.worstReading.date}</Text>
              </View>
            )}
            
            {data.goal && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('health.goal')}</Text>
                <Text style={styles.statValue}>
                  {formatMetricValue(selectedMetric, data.goal)}
                </Text>
                <Text style={styles.statProgress}>
                  {data.progress}% {t('health.completed')}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderModal = () => {
    if (!modalContent) return null;

    return (
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {modalContent.type === 'analysis' ? (
            <View>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                {t('health.detailedAnalysis')}
              </Text>
              <Text style={styles.modalText}>
                {t('health.analysisDescription', { 
                  metric: metricButtons.find(m => m.value === selectedMetric)?.label,
                  period: periodButtons.find(p => p.value === selectedPeriod)?.label
                })}
              </Text>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>{t('health.date')}</DataTable.Title>
                  <DataTable.Title>{t('health.values')}</DataTable.Title>
                  <DataTable.Title>{t('health.status')}</DataTable.Title>
                </DataTable.Header>
                {modalContent.data.data.slice(-5).map((item, index) => (
                  <DataTable.Row key={index}>
                    <DataTable.Cell>{item.date}</DataTable.Cell>
                    <DataTable.Cell>
                      {formatMetricValue(selectedMetric, item)}
                    </DataTable.Cell>
                    <DataTable.Cell>{t('health.status.normal')}</DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </View>
          ) : (
            <View>
              <Text variant="headlineSmall" style={styles.modalTitle}>
                {t('health.healthGoals')}
              </Text>
              <Text style={styles.modalText}>
                {t('health.goalsDescription')}
              </Text>
              {modalContent.data.goal && (
                <View style={styles.goalContainer}>
                  <Text style={styles.goalLabel}>
                    {t('health.currentGoal')}:
                  </Text>
                  <Text style={styles.goalValue}>
                    {formatMetricValue(selectedMetric, modalContent.data.goal)}
                  </Text>
                  <Text style={styles.goalProgress}>
                    {t('health.progress')}: {modalContent.data.progress}%
                  </Text>
                </View>
              )}
            </View>
          )}
          <Button 
            mode="contained" 
            onPress={() => setShowModal(false)}
            style={styles.modalButton}
          >
            {t('common.close')}
          </Button>
        </Modal>
      </Portal>
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
        {/* 页面标题 */}
        <Text variant="headlineMedium" style={styles.title}>
          {t('health.healthTrends')}
        </Text>

        {/* 时间段选择 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {t('health.timePeriod')}
            </Text>
            <SegmentedButtons
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              buttons={periodButtons}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* 指标选择器 */}
        {renderMetricSelector()}

        {/* 趋势图表 */}
        {renderTrendChart()}

        {/* 统计数据 */}
        {renderStatisticsCard()}


      </ScrollView>

      {/* 模态框 */}
      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#333',
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  metricChips: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  metricChip: {
    marginRight: 12,
    marginVertical: 4,
  },
  chipText: {
    fontSize: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  chartActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statDate: {
    fontSize: 12,
    color: '#999',
  },
  statProgress: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  goalContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  goalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  goalProgress: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  modalButton: {
    marginTop: 16,
  },
});

export default HealthTrendsScreen; 