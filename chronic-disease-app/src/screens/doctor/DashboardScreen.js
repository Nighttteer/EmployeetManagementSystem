import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Button,
  ActivityIndicator,
  Chip,
  Avatar,
  List
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

// 导入图表组件
import LineChart from '../../components/Charts/LineChart';
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import StatsCard from '../../components/StatsCard';
import { api } from '../../services/api';

const DashboardScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('year');
  
  // 获取认证信息
  const { isAuthenticated, user, role, token } = useSelector(state => state.auth);

  // 模拟数据
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPatients: 127,
      activeAlerts: 8,
      todayConsultations: 15,
      medicationCompliance: 85,
    },
    trends: {
      patientGrowth: 12,
      alertReduction: -5,
      consultationIncrease: 8,
      complianceImprovement: 3,
    },
    patientRiskDistribution: [
      { label: '未评估', value: 0, color: '#9E9E9E' },
      { label: '健康', value: 0, color: '#00E676' },
      { label: '低风险', value: 0, color: '#4CAF50' },
      { label: '中风险', value: 0, color: '#FF9800' },
      { label: '高风险', value: 0, color: '#F44336' }
    ],
    alertTypes: [
      { label: '血压异常', value: 5 },
      { label: '血糖超标', value: 2 },
      { label: '用药提醒', value: 1 }
    ],
    weeklyConsultations: [
      { label: '周一', value: 12 },
      { label: '周二', value: 18 },
      { label: '周三', value: 15 },
      { label: '周四', value: 22 },
      { label: '周五', value: 20 },
      { label: '周六', value: 8 },
      { label: '周日', value: 5 }
    ],
    bloodPressureTrend: [
      { label: '1月', value: 135 },
      { label: '2月', value: 132 },
      { label: '3月', value: 128 },
      { label: '4月', value: 125 },
      { label: '5月', value: 130 },
      { label: '6月', value: 127 }
    ]
  });

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 检查认证状态
      if (!isAuthenticated || !token || !user) {
        console.error('用户未认证，使用模拟数据');
        setLoading(false);
        return;
      }

      console.log('🔐 用户认证信息:', { 
        isAuthenticated, 
        userId: user?.id, 
        role, 
        hasToken: !!token 
      });
      
      // 调用真实的医生端仪表板API
      const doctorId = user.id;
      const response = await api.get(`/health/doctor/${doctorId}/dashboard/`);
      
      if (response.data.success) {
        const apiData = response.data.data;
        
        setDashboardData(prev => ({
          ...prev,
          stats: apiData.stats,
          trends: apiData.trends,
          patientRiskDistribution: apiData.patientRiskDistribution,
          // 保留一些模拟数据用于图表显示
          alertTypes: prev.alertTypes,
          weeklyConsultations: prev.weeklyConsultations,
          bloodPressureTrend: prev.bloodPressureTrend
        }));
        
        console.log('✅ 成功加载医生端仪表板真实数据:', apiData.summary.dataSource);
        console.log('📊 数据摘要:', apiData.summary.analysisRange);
      } else {
        console.error('❌ API返回失败:', response.data);
      }
    } catch (error) {
      console.error('❌ 加载仪表板数据失败:', error);
      console.error('错误详情:', error.response?.data);
      // 保持原有模拟数据作为后备
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getRiskLevelText = (level) => {
    switch (level) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return '未评估';
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>加载仪表板数据...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 标题区域 */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('navigation.dashboard')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('dashboard.patientHealthOverview')}
          </Text>
        </View>

        {/* 时间范围选择 */}
        <View style={styles.timeRangeContainer}>
          <Chip 
            selected={timeRange === 'week'} 
            onPress={() => setTimeRange('week')}
            style={styles.timeChip}
          >
            {t('dashboard.thisWeek')}
          </Chip>
          <Chip 
            selected={timeRange === 'month'} 
            onPress={() => setTimeRange('month')}
            style={styles.timeChip}
          >
            {t('dashboard.thisMonth')}
          </Chip>
          <Chip 
            selected={timeRange === 'year'} 
            onPress={() => setTimeRange('year')}
            style={styles.timeChip}
          >
            {t('dashboard.thisYear')}
          </Chip>
        </View>

        {/* 关键指标卡片 - 重新设计布局 */}
        <View style={styles.statsContainer}>
          {/* 第一行：患者总数 */}
          <View style={styles.singleStatRow}>
            <Card style={styles.mainStatCard}>
              <Card.Content style={styles.mainStatContent}>
                <TouchableOpacity
                  style={styles.mainStatTouchable}
                  onPress={() => navigation.navigate('DiseaseDistribution')}
                  activeOpacity={0.7}
                >
                  <View style={styles.mainStatHeader}>
                    <View style={styles.mainStatIconContainer}>
                      <Ionicons name="people" size={32} color="#2196F3" />
                    </View>
                    <View style={styles.mainStatTextContainer}>
                      <Text style={styles.mainStatTitle}>{t('dashboard.totalPatients')}</Text>
                      <Text style={styles.mainStatValue}>
                        {dashboardData.stats.totalPatients}
                      </Text>
                      <View style={styles.mainStatTrend}>
                        <Ionicons name="arrow-up" size={16} color="#4CAF50" />
                        <Text style={styles.mainStatTrendText}>
                          +{dashboardData.trends.patientGrowth}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.clickIndicator}>
                      <Ionicons name="chevron-forward" size={20} color="#2196F3" />
                    </View>
                  </View>
                  <Text style={styles.clickHint}>{t('dashboard.clickToViewDiseaseDistribution')}</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </View>

          {/* 第二行：三个小统计卡片 */}
          <View style={styles.statsRow}>
            <Card style={styles.smallStatCard}>
              <Card.Content style={styles.smallStatContent}>
                <View style={styles.smallStatIconContainer}>
                  <Ionicons name="warning" size={24} color="#FF5722" />
                </View>
                <Text style={styles.smallStatValue}>
                  {dashboardData.stats.activeAlerts}
                </Text>
                <Text style={styles.smallStatTitle}>{t('dashboard.activeAlerts')}</Text>
                <View style={styles.smallStatTrend}>
                  <Ionicons name="arrow-down" size={12} color="#4CAF50" />
                  <Text style={styles.smallStatTrendText}>
                    {dashboardData.trends.alertReduction}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.smallStatCard}>
              <Card.Content style={styles.smallStatContent}>
                <View style={styles.smallStatIconContainer}>
                  <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.smallStatValue}>
                  {dashboardData.stats.todayConsultations}
                </Text>
                <Text style={styles.smallStatTitle}>{t('dashboard.todayConsultations')}</Text>
                <View style={styles.smallStatTrend}>
                  <Ionicons name="arrow-up" size={12} color="#4CAF50" />
                  <Text style={styles.smallStatTrendText}>
                    +{dashboardData.trends.consultationIncrease}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.smallStatCard}>
              <Card.Content style={styles.smallStatContent}>
                <View style={styles.smallStatIconContainer}>
                  <Ionicons name="medical" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.smallStatValue}>
                  {dashboardData.stats.medicationCompliance}%
                </Text>
                <Text style={styles.smallStatTitle}>{t('dashboard.medicationCompliance')}</Text>
                <View style={styles.smallStatTrend}>
                  <Ionicons name="arrow-up" size={12} color="#4CAF50" />
                  <Text style={styles.smallStatTrendText}>
                    +{dashboardData.trends.complianceImprovement}%
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        </View>

        {/* 患者风险分布 */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>{t('dashboard.patientRiskDistribution')}</Text>
            <PieChart
              data={dashboardData.patientRiskDistribution}
              height={200}
            />
          </Card.Content>
        </Card>

        {/* 告警类型分布 */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>{t('dashboard.alertTypeDistribution')}</Text>
            <BarChart
              data={dashboardData.alertTypes}
              height={180}
              color="#FF5722"
              yAxisLabel={t('dashboard.alertCount')}
            />
          </Card.Content>
        </Card>




      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 120,
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
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  timeChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  
  // 新的统计卡片样式
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  singleStatRow: {
    marginBottom: 16,
  },
  mainStatCard: {
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  mainStatContent: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  mainStatTouchable: {
    flex: 1,
  },
  mainStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clickIndicator: {
    marginLeft: 12,
  },
  clickHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  mainStatIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  mainStatTextContainer: {
    flex: 1,
  },
  mainStatTitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  mainStatValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  mainStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainStatTrendText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  
  // 小统计卡片样式
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  smallStatCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  smallStatContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 120,
  },
  smallStatIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  smallStatTitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  smallStatTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallStatTrendText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 2,
  },
  
  // 图表卡片样式
  chartCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  // 列表卡片样式
  listCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  
  // 患者活动项样式
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  patientAvatar: {
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  patientDescription: {
    fontSize: 14,
    color: '#666',
  },
  patientMeta: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  riskChip: {
    height: 32,
    marginBottom: 4,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  visitTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  
  // 操作按钮样式
  actionsCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
});

export default DashboardScreen; 