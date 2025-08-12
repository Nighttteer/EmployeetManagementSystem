import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  FAB, 
  Button, 
  SegmentedButtons
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from '../../components/Charts';
import { fetchHealthTrends } from '../../store/slices/userSlice';
import { 
  METRIC_TYPES, 
  evaluateHealthStatus,
  getStatusColor,
  getStatusText
} from '../../utils/dataModels';

// 工具函数：安全获取数字值
const safeNumber = (value, defaultValue = 0) => {
  const num = parseFloat(value);
  return (typeof num === 'number' && !isNaN(num) && isFinite(num)) ? num : defaultValue;
};

const HealthDataScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state?.auth || {});
  const { healthMetrics = [], healthTrends = {}, loading = false } = useSelector((state) => state?.user || {});
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState(METRIC_TYPES.BLOOD_PRESSURE);
  const [refreshKey, setRefreshKey] = useState(0);

  // 组件挂载时自动加载数据
  useEffect(() => {
    console.log('HealthDataScreen 组件挂载，开始加载数据');
    loadHealthData();
  }, []);

  // 当selectedPeriod改变时重新加载数据
  useEffect(() => {
    console.log('selectedPeriod 改变:', selectedPeriod, '重新加载数据');
    loadHealthData();
  }, [selectedPeriod, loadHealthData]);

  // 监听healthMetrics变化
  useEffect(() => {
    console.log('healthMetrics 数据变化:', healthMetrics ? healthMetrics.length : 'null');
    if (healthMetrics && healthMetrics.length > 0) {
      setRefreshKey(prev => prev + 1);
    }
  }, [healthMetrics]);

  // 监听导航焦点变化，确保从数据录入页面返回时能更新
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('页面获得焦点，重新加载数据');
      loadHealthData();
    });

    return unsubscribe;
  }, [navigation]);


  // 安全的日期格式化函数
  const safeFormatDate = (dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // 使用更简洁的日期格式
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return '';
    }
  };

  // 时间过滤函数（统一逻辑）
  const getTimeFilteredMetrics = (metrics, period) => {
    const now = new Date();
    let startTime;
    
    switch (period) {
      case 'week':
        startTime = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startTime = now.getTime() - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startTime = now.getTime() - (90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startTime = now.getTime() - (365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = now.getTime() - (30 * 24 * 60 * 60 * 1000);
    }
    
    console.log(`时间过滤 - 周期: ${period}, 范围: ${new Date(startTime).toLocaleDateString()} 到 ${now.toLocaleDateString()}`);
    
    const filteredMetrics = metrics.filter(metric => {
      const dateField = metric.measured_at || metric.datetime;
      const metricTime = new Date(dateField).getTime();
      return metricTime >= startTime && metricTime <= now.getTime();
    });
    
    console.log(`过滤结果: ${filteredMetrics.length}/${metrics.length} 条记录`);
    return filteredMetrics;
  };

  // 处理健康数据
  const processHealthData = () => {
    try {
      if (!Array.isArray(healthMetrics) || healthMetrics.length === 0) {
        console.log('健康数据为空或无效:', healthMetrics);
        return {
          summary: {
            totalRecords: 0,
            thisWeekRecords: 0,
            lastMeasurement: null,
            overallStatus: 'no_data'
          },
          recentMeasurements: [],
          weeklyStats: {}
        };
      }
    } catch (error) {
      console.error('处理健康数据时出错:', error);
      return {
        summary: {
          totalRecords: 0,
          thisWeekRecords: 0,
          lastMeasurement: null,
          overallStatus: 'error'
        },
        recentMeasurements: [],
        weeklyStats: {}
      };
    }

    // 安全的日期处理函数
    const safeDate = (dateString) => {
      try {
        if (!dateString) return new Date(0);
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? new Date(0) : date;
      } catch (error) {
        console.warn('Date parsing error:', error);
        return new Date(0);
      }
    };

    // 按日期排序，最新的在前
    const sortedMetrics = [...healthMetrics].sort((a, b) => 
      safeDate(b.measured_at || b.datetime) - safeDate(a.measured_at || a.datetime)
    );

    // 根据选择的时间周期过滤数据
    const periodFilteredMetrics = getTimeFilteredMetrics(sortedMetrics, selectedPeriod);
    
    // 计算一周前的日期（用于thisWeekRecords）
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoTime = oneWeekAgo.getTime();

    const thisWeekRecords = sortedMetrics.filter(metric => {
      const metricDate = safeDate(metric.measured_at || metric.datetime);
      return metricDate.getTime() >= oneWeekAgoTime;
    });
    
    console.log('统计信息:', {
      selectedPeriod,
      allRecords: sortedMetrics.length,
      periodRecords: periodFilteredMetrics.length,
      thisWeekRecords: thisWeekRecords.length
    });

    // 处理最近测量数据（基于选择的时间周期）
    const recentMeasurements = periodFilteredMetrics.slice(0, 10).map(metric => {
      const date = safeDate(metric.measured_at || metric.datetime);
      const values = {};
      
      // 根据指标类型提取值
      switch (metric.metric_type) {
        case METRIC_TYPES.BLOOD_PRESSURE:
          values.systolic = metric.systolic;
          values.diastolic = metric.diastolic;
          break;
        case METRIC_TYPES.BLOOD_GLUCOSE:
          values.glucose = metric.blood_glucose || metric.glucose;
          break;
        case METRIC_TYPES.WEIGHT:
          values.weight = metric.weight;
          break;
        case METRIC_TYPES.HEART_RATE:
          values.heartRate = metric.heart_rate || metric.heartRate;
          break;
        default:
          // 复制所有可能的值
          Object.assign(values, metric);
      }

      let healthStatus = 'normal';
      try {
        // 检查 metric 对象的完整性
        if (metric && metric.metric_type && typeof metric === 'object') {
          // 根据指标类型检查必要的数据是否存在
          let hasValidData = false;
          switch (metric.metric_type) {
            case METRIC_TYPES.BLOOD_PRESSURE:
              hasValidData = metric.systolic && metric.diastolic;
              break;
            case METRIC_TYPES.BLOOD_GLUCOSE:
              hasValidData = metric.blood_glucose || metric.glucose;
              break;
            case METRIC_TYPES.HEART_RATE:
              hasValidData = metric.heart_rate;
              break;
            case METRIC_TYPES.WEIGHT:
              hasValidData = metric.weight;
              break;
            case METRIC_TYPES.URIC_ACID:
              hasValidData = metric.uric_acid;
              break;
            case METRIC_TYPES.LIPIDS:
              hasValidData = metric.lipids_total;
              break;
            default:
              hasValidData = false;
          }
          
          if (hasValidData) {
            healthStatus = evaluateHealthStatus(metric);
          } else {
            console.log('指标数据不完整，跳过健康状态评估:', metric);
          }
        } else {
          console.log('无效的指标对象:', metric);
        }
      } catch (err) {
        console.warn('评估健康状态时出错:', err, '指标数据:', metric);
      }
      
      return {
        id: metric.id || Math.random(),
        type: metric.metric_type,
        values,
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5),
        status: healthStatus,
        notes: metric.note || ''
      };
    });

    // 计算每周统计
    const weeklyStats = calculateWeeklyStats(thisWeekRecords);

    let overallStatus = 'no_data';
    try {
      if (periodFilteredMetrics.length > 0) {
        const latestMetric = periodFilteredMetrics[0];
        // 检查最新指标数据的完整性
        if (latestMetric && latestMetric.metric_type && typeof latestMetric === 'object') {
          overallStatus = evaluateHealthStatus(latestMetric);
        } else {
          console.log('最新指标数据无效，使用默认状态:', latestMetric);
          overallStatus = 'normal';
        }
      }
    } catch (err) {
      console.warn('评估整体健康状态时出错:', err, '最新指标:', periodFilteredMetrics[0]);
      overallStatus = 'normal';
    }

    return {
      summary: {
        totalRecords: periodFilteredMetrics.length, // 使用根据时间周期过滤后的记录数
        thisWeekRecords: thisWeekRecords.length,
        lastMeasurement: periodFilteredMetrics.length > 0 ? (periodFilteredMetrics[0].measured_at || periodFilteredMetrics[0].datetime) : null,
        overallStatus: overallStatus
      },
      recentMeasurements,
      weeklyStats
    };
  };

  // 计算每周统计
  const calculateWeeklyStats = (weekRecords) => {
    const stats = {};
    const safeWeekRecords = Array.isArray(weekRecords) ? weekRecords : [];
    
    const metricTypes = [METRIC_TYPES.BLOOD_PRESSURE, METRIC_TYPES.BLOOD_GLUCOSE, METRIC_TYPES.WEIGHT, METRIC_TYPES.HEART_RATE];
    
    metricTypes.forEach(metricType => {
      const typeRecords = safeWeekRecords.filter(record => record && record.metric_type === metricType);
      
      if (typeRecords.length === 0) {
        stats[metricType] = null;
        return;
      }

      let average, trend;
      
      switch (metricType) {
        case METRIC_TYPES.BLOOD_PRESSURE:
          const avgSystolic = typeRecords.reduce((sum, r) => sum + (r.systolic || 0), 0) / typeRecords.length;
          const avgDiastolic = typeRecords.reduce((sum, r) => sum + (r.diastolic || 0), 0) / typeRecords.length;
          average = { systolic: Math.round(avgSystolic), diastolic: Math.round(avgDiastolic) };
          trend = calculateTrend(typeRecords, 'systolic');
          break;
        case METRIC_TYPES.BLOOD_GLUCOSE:
          const avgGlucose = typeRecords.reduce((sum, r) => sum + (r.blood_glucose || r.glucose || 0), 0) / typeRecords.length;
          average = { glucose: parseFloat(avgGlucose.toFixed(1)) };
          trend = calculateTrend(typeRecords, 'blood_glucose');
          break;
        case METRIC_TYPES.WEIGHT:
          const avgWeight = typeRecords.reduce((sum, r) => sum + (r.weight || 0), 0) / typeRecords.length;
          average = { weight: parseFloat(avgWeight.toFixed(1)) };
          trend = calculateTrend(typeRecords, 'weight');
          break;
        case METRIC_TYPES.HEART_RATE:
          const avgHeartRate = typeRecords.reduce((sum, r) => sum + (r.heart_rate || 0), 0) / typeRecords.length;
          average = { heartRate: Math.round(avgHeartRate) };
          trend = calculateTrend(typeRecords, 'heart_rate');
          break;
      }

      stats[metricType] = {
        average,
        trend,
        records: typeRecords.length
      };
    });

    return stats;
  };

  // 计算趋势
  const calculateTrend = (records, field) => {
    try {
      if (!Array.isArray(records) || records.length < 2) return 'stable';
      
      // 安全的日期处理函数
      const safeDate = (dateString) => {
        try {
          if (!dateString) return new Date(0);
          const date = new Date(dateString);
          return isNaN(date.getTime()) ? new Date(0) : date;
        } catch (error) {
          console.warn('Date parsing error in calculateTrend:', error);
          return new Date(0);
        }
      };
      
      const sortedRecords = records.sort((a, b) => safeDate(a?.measured_at || a?.datetime) - safeDate(b?.measured_at || b?.datetime));
      const firstValue = safeNumber(sortedRecords[0]?.[field], 0);
      const lastValue = safeNumber(sortedRecords[sortedRecords.length - 1]?.[field], 0);
      
      // 防止除零错误
      if (firstValue === 0) return 'stable';
      
      const difference = lastValue - firstValue;
      const percentChange = Math.abs(difference) / firstValue * 100;
      
      if (percentChange < 5) return 'stable';
      return difference > 0 ? 'increasing' : 'decreasing';
    } catch (error) {
      console.warn('计算趋势时出错:', error);
      return 'stable';
    }
  };

  // 获取处理后的健康数据
  let healthData;
  try {
    healthData = processHealthData();
  } catch (error) {
    console.error('处理健康数据时发生严重错误:', error);
    healthData = {
      summary: {
        totalRecords: 0,
        thisWeekRecords: 0,
        lastMeasurement: null,
        overallStatus: 'error'
      },
      recentMeasurements: [],
      weeklyStats: {}
    };
  }

  const periodButtons = [
    { value: 'week', label: t('health.thisWeek') },
    { value: 'month', label: t('health.thisMonth') },
    { value: 'quarter', label: t('health.thisQuarter') },
    { value: 'year', label: t('health.thisYear') }
  ];

  const metricTypeButtons = [
    { value: METRIC_TYPES.BLOOD_PRESSURE, label: t('health.bloodPressure'), icon: 'heart' },
    { value: METRIC_TYPES.BLOOD_GLUCOSE, label: t('health.bloodGlucose'), icon: 'water' },
    { value: METRIC_TYPES.WEIGHT, label: t('health.weight'), icon: 'fitness' },
    { value: METRIC_TYPES.HEART_RATE, label: t('health.heartRate'), icon: 'pulse' }
  ];

  const loadHealthData = useCallback(async () => {
    try {
      console.log('开始加载健康数据，时间段:', selectedPeriod);
      const result = await dispatch(fetchHealthTrends(selectedPeriod));
      console.log('健康数据加载结果:', result);
      
      // 强制重新渲染
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('加载健康数据失败:', error);
    }
  }, [dispatch, selectedPeriod]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHealthData();
    setRefreshing(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal': return { name: 'checkmark-circle', color: '#4CAF50' };
      case 'warning': return { name: 'warning', color: '#FF9800' };
      case 'danger': return { name: 'alert-circle', color: '#F44336' };
      default: return { name: 'help-circle', color: '#9E9E9E' };
    }
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

  const renderSummaryCard = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.cardTitle}>
          {t('health.healthSummary')}
        </Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{healthData.summary.totalRecords}</Text>
            <Text style={styles.summaryLabel}>{t('health.totalRecords')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{healthData.summary.thisWeekRecords}</Text>
            <Text style={styles.summaryLabel}>{t('health.thisWeekRecords')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <View style={styles.statusIndicator}>
              <Ionicons 
                name={getStatusIcon(healthData.summary.overallStatus).name}
                size={24}
                color={getStatusIcon(healthData.summary.overallStatus).color}
              />
            </View>
            <Text style={styles.summaryLabel}>{t('health.overallStatus')}</Text>
          </View>
        </View>
        <Text style={styles.lastMeasurement}>
          {t('health.lastMeasurement')}: {healthData.summary.lastMeasurement ? safeFormatDate(healthData.summary.lastMeasurement) : 'N/A'}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderWeeklyStatsCard = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.cardTitle}>
          {t('health.weeklyStats')}
        </Text>
        {Object.entries(healthData.weeklyStats).map(([key, stats]) => {
          const metric = metricTypeButtons.find(m => m.value === key) || 
                        metricTypeButtons.find(m => m.value.includes(key.toLowerCase()));
          if (!metric || !stats) return null;
          
          const trendIcon = getTrendIcon(stats.trend || 'stable');
          
          return (
            <View key={key} style={styles.statItem}>
              <View style={styles.statHeader}>
                <Ionicons name={metric.icon} size={20} color="#666" />
                <Text style={styles.statLabel}>{metric.label}</Text>
                <View style={styles.statTrend}>
                  <Ionicons 
                    name={trendIcon.name} 
                    size={16} 
                    color={trendIcon.color} 
                  />
                  <Text style={[styles.trendText, { color: trendIcon.color }]}>
                    {t(`health.trend.${stats.trend}`)}
                  </Text>
                </View>
              </View>
              <Text style={styles.statValue}>
                {formatMetricValue(key, stats.average)} 
                <Text style={styles.recordCount}>
                  ({stats.records} {t('health.records')})
                </Text>
              </Text>
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );



  const renderHealthCharts = () => {
    console.log('=== 图表渲染调试 ===');
    console.log('healthMetrics:', healthMetrics ? healthMetrics.length : 'null');
    console.log('selectedPeriod:', selectedPeriod);
    
    if (!healthMetrics || healthMetrics.length === 0) {
      console.log('没有健康数据，显示无数据提示');
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {t('health.charts')}
            </Text>
            <Text style={styles.noDataText}>
              {t('health.noDataForCharts')}
            </Text>
          </Card.Content>
        </Card>
      );
    }

    // 根据选择的时间段过滤数据
    const getFilteredMetrics = () => {
      if (!Array.isArray(healthMetrics) || healthMetrics.length === 0) {
        console.log('健康数据为空或无效');
        return [];
      }
      
      // 显示基本的数据信息
      console.log('=== 时间过滤调试 ===');
      console.log('总数据量:', healthMetrics.length);
      console.log('选择的时间段:', selectedPeriod);
      
      // 简化调试信息
      if (healthMetrics.length > 0) {
        const firstMetric = healthMetrics[0];
        console.log('数据字段检查:', {
          hasDateTime: !!firstMetric?.datetime,
          hasMeasuredAt: !!firstMetric?.measured_at,
          hasMetricType: !!firstMetric?.metric_type
        });
      }
      
             // 先过滤有效数据 - 修复字段名问题
       const validMetrics = healthMetrics.filter((metric, index) => {
         const hasMetric = !!metric;
         const isObject = typeof metric === 'object';
         
         // 数据可能使用 measured_at 或 datetime 字段
         const dateField = metric?.measured_at || metric?.datetime;
         const hasDateField = !!dateField;
         const hasMetricType = !!metric?.metric_type;
         const dateValid = dateField ? !isNaN(new Date(dateField).getTime()) : false;
         
         const isValid = hasMetric && isObject && hasDateField && hasMetricType && dateValid;
         
         // 只在有严重问题时记录
         if (!isValid && index === 0) {
           console.log('第一条数据被过滤，原因:', { hasDateField, hasMetricType, dateValid });
         }
         
         return isValid;
       });
      
      console.log('有效数据:', validMetrics.length, '条');
      
      if (validMetrics.length === 0) {
        return [];
      }
      
      // 检查数据的时间范围
      const dataTimeRange = validMetrics.map(m => new Date(m.measured_at).getTime());
      const earliestData = new Date(Math.min(...dataTimeRange));
      const latestData = new Date(Math.max(...dataTimeRange));
      console.log('数据时间范围:', earliestData.toLocaleDateString(), '到', latestData.toLocaleDateString());
      
      // 使用统一的时间过滤函数
      const filteredMetrics = getTimeFilteredMetrics(validMetrics, selectedPeriod);
      
      console.log('时间过滤后:', filteredMetrics.length, '条');
      
             // 如果有效数据为0，直接返回空数组
       if (validMetrics.length === 0) {
         console.log('⚠️ 没有有效数据');
         return [];
       }
      
      // 如果时间过滤后没有数据，返回所有有效数据（避免空白图表）
      if (filteredMetrics.length === 0) {
        console.log('时间过滤后无数据，返回所有有效数据');
        return validMetrics;
      }
      
      return filteredMetrics;
    };
    
    // 恢复时间段过滤功能
    const filteredMetrics = getFilteredMetrics();
    
    if (filteredMetrics.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {t('health.charts')}
            </Text>
            <Text style={styles.noDataText}>
              {t('health.noDataForCharts')}
            </Text>
          </Card.Content>
        </Card>
      );
    }

    // 按指标类型分组数据，过滤无效数据
    const metricsByType = {};
    const safeFilteredMetrics = Array.isArray(filteredMetrics) ? filteredMetrics : [];
    
    safeFilteredMetrics.forEach(metric => {
      if (!metric || typeof metric !== 'object' || !metric.metric_type) return;
      
      if (!metricsByType[metric.metric_type]) {
        metricsByType[metric.metric_type] = [];
      }
      metricsByType[metric.metric_type].push(metric);
    });
    
    // 调试信息
    console.log('=== 图表数据分组 ===');
    console.log('过滤后数据数量:', filteredMetrics.length);
    console.log('数据类型分组:', Object.keys(metricsByType));
    Object.entries(metricsByType).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.length}条`);
    });
    


    return (
              <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              {t('health.charts')} ({filteredMetrics.length}条数据)
            </Text>

          
          {/* 血压趋势图 */}
          {metricsByType.blood_pressure && metricsByType.blood_pressure.length > 0 && (
            <View style={styles.chartContainer}>
              <Text variant="titleMedium" style={styles.chartTitle}>
                {t('health.bloodPressureTrend')} ({metricsByType.blood_pressure.length}条数据)
              </Text>
              <LineChart
                series={[
                  {
                    name: 'Systolic BP',
                    color: '#FF5722',
                    data: metricsByType.blood_pressure
                      .filter(metric => {
                        const systolic = safeNumber(metric.systolic, 0);
                        const isValid = systolic > 0 && systolic < 300;
                        if (!isValid) {
                          console.log('过滤无效收缩压数据:', metric);
                        }
                        return isValid;
                      })
                      .sort((a, b) => new Date(a.measured_at || a.datetime) - new Date(b.measured_at || b.datetime))
                      .map(metric => ({
                        label: safeFormatDate(metric.measured_at || metric.datetime),
                        value: safeNumber(metric.systolic, 0)
                      }))
                  },
                  {
                    name: 'Diastolic BP',
                    color: '#2196F3',
                    data: metricsByType.blood_pressure
                      .filter(metric => {
                        const diastolic = safeNumber(metric.diastolic, 0);
                        const isValid = diastolic > 0 && diastolic < 200;
                        if (!isValid) {
                          console.log('过滤无效舒张压数据:', metric);
                        }
                        return isValid;
                      })
                      .sort((a, b) => new Date(a.measured_at || a.datetime) - new Date(b.measured_at || b.datetime))
                      .map(metric => ({
                        label: safeFormatDate(metric.measured_at || metric.datetime),
                        value: safeNumber(metric.diastolic, 0)
                      }))
                  }
                ]}
                height={200}
                yAxisLabel={t('health.pressure')}
              />
            </View>
          )}

          {/* 血糖趋势图 */}
          {metricsByType.blood_glucose && metricsByType.blood_glucose.length > 0 && (
            <View style={styles.chartContainer}>
              <Text variant="titleMedium" style={styles.chartTitle}>
                {t('health.bloodGlucoseTrend')} ({metricsByType.blood_glucose.length}条数据)
              </Text>
              <LineChart
                data={metricsByType.blood_glucose
                  .filter(metric => {
                    const glucose = safeNumber(metric.blood_glucose || metric.glucose, 0);
                    const isValid = glucose > 0 && glucose < 30;
                    if (!isValid) {
                      console.log('过滤无效血糖数据:', metric);
                    }
                    return isValid;
                  })
                  .sort((a, b) => new Date(a.measured_at || a.datetime) - new Date(b.measured_at || b.datetime))
                  .map(metric => ({
                    label: safeFormatDate(metric.measured_at || metric.datetime),
                    value: safeNumber(metric.blood_glucose || metric.glucose, 0)
                  }))}
                height={200}
                color="#4CAF50"
                yAxisLabel={t('health.glucose')}
              />
            </View>
          )}

          {/* 心率趋势图 */}
          {metricsByType.heart_rate && metricsByType.heart_rate.length > 0 && (
            <View style={styles.chartContainer}>
              <Text variant="titleMedium" style={styles.chartTitle}>
                {t('health.heartRateTrend')} ({metricsByType.heart_rate.length}条数据)
              </Text>
              <LineChart
                data={metricsByType.heart_rate
                  .filter(metric => {
                    const heartRate = safeNumber(metric.heart_rate || metric.heartRate, 0);
                    const isValid = heartRate > 30 && heartRate < 220;
                    if (!isValid) {
                      console.log('过滤无效心率数据:', metric);
                    }
                    return isValid;
                  })
                  .sort((a, b) => new Date(a.measured_at || a.datetime) - new Date(b.measured_at || b.datetime))
                  .map(metric => ({
                    label: safeFormatDate(metric.measured_at || metric.datetime),
                    value: safeNumber(metric.heart_rate || metric.heartRate, 0)
                  }))}
                height={200}
                color="#2196F3"
                yAxisLabel={t('health.heartRate')}
              />
            </View>
          )}

          {/* 体重趋势图 */}
          {metricsByType.weight && metricsByType.weight.length > 0 && (
            <View style={styles.chartContainer}>
              <Text variant="titleMedium" style={styles.chartTitle}>
                {t('health.weightTrend')} ({metricsByType.weight.length}条数据)
              </Text>
              <LineChart
                data={metricsByType.weight
                  .filter(metric => {
                    const weight = safeNumber(metric.weight, 0);
                    const isValid = weight > 20 && weight < 300;
                    if (!isValid) {
                      console.log('过滤无效体重数据:', metric);
                    }
                    return isValid;
                  })
                  .sort((a, b) => new Date(a.measured_at || a.datetime) - new Date(b.measured_at || b.datetime))
                  .map(metric => ({
                    label: safeFormatDate(metric.measured_at || metric.datetime),
                    value: safeNumber(metric.weight, 0)
                  }))}
                height={200}
                color="#9C27B0"
                yAxisLabel={t('health.weight')}
              />
            </View>
          )}


        </Card.Content>
      </Card>
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
          {t('health.healthData')}
        </Text>

        {/* 时间段选择 */}
        <Card style={styles.card}>
          <Card.Content>
            <SegmentedButtons
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              buttons={periodButtons}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* 健康数据摘要 */}
        {renderSummaryCard()}

        {/* 本周统计 */}
        {renderWeeklyStatsCard()}

        {/* 健康数据图表 */}
        {renderHealthCharts()}



      </ScrollView>

      {/* 浮动操作按钮 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('DataEntry')}
        label={t('health.addData')}
      />
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  statusIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  lastMeasurement: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  statItem: {
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    color: '#333',
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 28,
  },
  recordCount: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  chartContainer: {
    marginVertical: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginVertical: 20,
  },

});

export default HealthDataScreen; 