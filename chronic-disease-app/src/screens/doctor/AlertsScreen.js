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
import { Ionicons } from '@expo/vector-icons';

// 导入图表组件
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import StatsCard from '../../components/StatsCard';

const AlertsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, handled, dismissed
  const [filterPriority, setFilterPriority] = useState('all'); // all, critical, high, medium, low
  const [showStats, setShowStats] = useState(true);

  // 模拟告警数据
  const [alertsData, setAlertsData] = useState({
    stats: {
      total: 24,
      pending: 8,
      handled: 14,
      dismissed: 2,
      critical: 3,
      high: 5,
      medium: 10,
      low: 6
    },
    alerts: [
      {
        id: 1,
        patientId: 1,
        patientName: '张三',
        patientAge: 65,
        type: 'threshold_exceeded',
        title: '血压异常警报',
        message: '收缩压达到180mmHg，超出安全阈值',
        priority: 'critical',
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z',
        relatedMetric: '血压',
        value: '180/95 mmHg',
        threshold: '< 140/90 mmHg'
      },
      {
        id: 2,
        patientId: 2,
        patientName: '李四',
        patientAge: 58,
        type: 'missed_medication',
        title: '漏服药物提醒',
        message: '患者已连续2天未按时服用降压药',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-15T09:15:00Z',
        medicationName: '氨氯地平片',
        missedDoses: 4
      },
      {
        id: 3,
        patientId: 3,
        patientName: '王五',
        patientAge: 72,
        type: 'abnormal_trend',
        title: '血糖异常趋势',
        message: '血糖值持续上升，近7天平均值偏高',
        priority: 'medium',
        status: 'handled',
        createdAt: '2024-01-14T16:45:00Z',
        handledBy: 'Dr. 陈医生',
        handledAt: '2024-01-15T08:20:00Z',
        relatedMetric: '血糖',
        trendDirection: 'up'
      },
      {
        id: 4,
        patientId: 4,
        patientName: '赵六',
        patientAge: 60,
        type: 'system_notification',
        title: '定期复查提醒',
        message: '患者需要进行季度血脂检查',
        priority: 'low',
        status: 'pending',
        createdAt: '2024-01-14T14:20:00Z',
        dueDate: '2024-01-20',
        checkupType: '血脂检查'
      },
      {
        id: 5,
        patientId: 1,
        patientName: '张三',
        patientAge: 65,
        type: 'threshold_exceeded',
        title: '心率异常',
        message: '心率过快，达到110bpm',
        priority: 'high',
        status: 'dismissed',
        createdAt: '2024-01-13T11:30:00Z',
        dismissedBy: 'Dr. 李医生',
        dismissedAt: '2024-01-13T12:00:00Z',
        dismissReason: '患者刚运动完毕，属正常现象'
      }
    ]
  });

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
      case 'pending': return '待处理';
      case 'handled': return '已处理';
      case 'dismissed': return '已忽略';
      default: return '未知';
    }
  };

  // 获取告警类型图标
  const getAlertIcon = (type) => {
    switch (type) {
      case 'threshold_exceeded': return 'warning';
      case 'missed_medication': return 'medical';
      case 'abnormal_trend': return 'trending-up';
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
      '处理告警',
      '请选择处理方式',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '标记已处理', 
          onPress: () => markAsHandled(alertId) 
        },
        { 
          text: '忽略告警', 
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
                {alert.patientName} · {alert.patientAge}岁
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
                处理
              </Button>
            )}
            
            {alert.status === 'handled' && alert.handledBy && (
              <Text style={styles.handledBy}>
                已处理 by {alert.handledBy}
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
      { label: '待处理', value: alertsData.stats.pending, color: '#FF5722' },
      { label: '已处理', value: alertsData.stats.handled, color: '#4CAF50' },
      { label: '已忽略', value: alertsData.stats.dismissed, color: '#9E9E9E' }
    ];

    return (
      <View>
        {/* 统计卡片 */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              title="总告警"
              value={alertsData.stats.total.toString()}
              icon="warning"
              color="#FF5722"
              style={styles.statCard}
            />
            <StatsCard
              title="待处理"
              value={alertsData.stats.pending.toString()}
              icon="alert-circle"
              color="#F57C00"
              style={styles.statCard}
            />
          </View>
          
          <View style={styles.statsRow}>
            <StatsCard
              title="已处理"
              value={alertsData.stats.handled.toString()}
              icon="checkmark-circle"
              color="#4CAF50"
              style={styles.statCard}
            />
            <StatsCard
              title="危急告警"
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
                title="告警优先级分布"
                height={180}
                color={['#D32F2F', '#F57C00', '#1976D2', '#388E3C']}
                yAxisLabel="告警数量"
              />
            </Card.Content>
          </Card>

          <Card style={styles.chartCard}>
            <Card.Content>
              <PieChart
                data={statusData}
                title="告警状态分布"
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
      <Text style={styles.filterTitle}>状态筛选</Text>
      <View style={styles.filtersContainer}>
        <Chip 
          selected={filterStatus === 'all'} 
          onPress={() => setFilterStatus('all')}
          style={styles.filterChip}
        >
          全部 ({alertsData.stats.total})
        </Chip>
        <Chip 
          selected={filterStatus === 'pending'} 
          onPress={() => setFilterStatus('pending')}
          style={styles.filterChip}
        >
          待处理 ({alertsData.stats.pending})
        </Chip>
        <Chip 
          selected={filterStatus === 'handled'} 
          onPress={() => setFilterStatus('handled')}
          style={styles.filterChip}
        >
          已处理 ({alertsData.stats.handled})
        </Chip>
      </View>

      <Text style={styles.filterTitle}>优先级筛选</Text>
      <View style={styles.filtersContainer}>
        <Chip 
          selected={filterPriority === 'all'} 
          onPress={() => setFilterPriority('all')}
          style={styles.filterChip}
        >
          全部
        </Chip>
        <Chip 
          selected={filterPriority === 'critical'} 
          onPress={() => setFilterPriority('critical')}
          style={[styles.filterChip, { backgroundColor: filterPriority === 'critical' ? '#D32F2F' : undefined }]}
        >
          危急
        </Chip>
        <Chip 
          selected={filterPriority === 'high'} 
          onPress={() => setFilterPriority('high')}
          style={[styles.filterChip, { backgroundColor: filterPriority === 'high' ? '#F57C00' : undefined }]}
        >
          高
        </Chip>
        <Chip 
          selected={filterPriority === 'medium'} 
          onPress={() => setFilterPriority('medium')}
          style={styles.filterChip}
        >
          中
        </Chip>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>加载告警数据...</Text>
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
            告警中心
          </Text>
          <TouchableOpacity onPress={() => setShowStats(!showStats)}>
            <Ionicons 
              name={showStats ? 'stats-chart' : 'stats-chart-outline'} 
              size={24} 
              color="#2196F3" 
            />
          </TouchableOpacity>
        </View>
        <Text variant="bodyMedium" style={styles.subtitle}>
          实时监控患者健康状况
        </Text>
      </View>

      <Searchbar
        placeholder="搜索患者或告警内容..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={[
          ...(showStats ? ['stats', 'filters'] : ['filters']),
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              暂无告警
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              当前没有符合条件的告警信息
            </Text>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  searchBar: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    margin: 0,
    marginHorizontal: 4,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    paddingBottom: 120, // 增加底部padding避免被底部导航遮挡
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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