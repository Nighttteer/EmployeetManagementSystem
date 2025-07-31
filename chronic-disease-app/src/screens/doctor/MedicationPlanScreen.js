import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
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
  List,
  IconButton,
  Menu,
  Divider,
  FAB
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 导入图表组件
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';
import PieChart from '../../components/Charts/PieChart';
import StatsCard from '../../components/StatsCard';
import { medicationAPI } from '../../services/api';

const MedicationPlanScreen = ({ route, navigation }) => {
  const { patient } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // current, history, analytics
  
  // 用药计划数据
  const [medicationPlans, setMedicationPlans] = useState([]);
  const [medicationStats, setMedicationStats] = useState({});
  const [medicationHistory, setMedicationHistory] = useState([]);
  
  // 频次选项
  const frequencyOptions = [
    { value: 'QD', label: '一日一次' },
    { value: 'BID', label: '一日二次' },
    { value: 'TID', label: '一日三次' },
    { value: 'QID', label: '一日四次' },
    { value: 'Q12H', label: '12小时' },
    { value: 'Q8H', label: '8小时' },
    { value: 'Q6H', label: '6小时' },
    { value: 'PRN', label: '必要时' }
  ];

  // 显示文本映射
  const getCategoryDisplay = (category) => {
    if (!category) return '未分类';
    const categoryMap = {
      'antihypertensive': '降压药',
      'hypoglycemic': '降糖药',
      'lipid_lowering': '降脂药',
      'anticoagulant': '抗凝药',
      'diuretic': '利尿剂',
      'beta_blocker': 'β受体阻滞剂',
      'ace_inhibitor': 'ACE抑制剂',
      'other': '其他'
    };
    return categoryMap[category] || category;
  };

  const getFrequencyDisplay = (frequency) => {
    if (!frequency) return '未设定';
    const freq = frequencyOptions.find(f => f.value === frequency);
    return freq ? freq.label : frequency;
  };

  const getTimeDisplay = (time) => {
    if (!time) return '未设定';
    
    // 处理时间数组格式
    if (Array.isArray(time)) {
      return time.join(', ');
    }
    
    // 兼容旧的字符串格式
    if (typeof time === 'string') {
      return time;
    }
    
    return '未设定';
  };

  // 数据加载函数
  const loadData = async () => {
    if (!patient?.id) return;
    
    try {
      setLoading(true);
      
      // 首先测试API连接
      console.log('🔍 测试medication API连接...');
      const testResponse = await medicationAPI.testConnection();
      console.log('✅ API测试成功:', testResponse.data);
      
      const [plansResponse, statsResponse] = await Promise.all([
        medicationAPI.getMedicationPlans(patient.id),
        medicationAPI.getMedicationStats(patient.id)
      ]);
      
      setMedicationPlans(plansResponse.data.plans || []);
      setMedicationStats(statsResponse.data || {});
    } catch (error) {
      console.error('加载用药数据失败:', error);
      console.error('错误详情:', error.response?.data);
      Alert.alert('错误', `加载数据失败: ${error.response?.data?.error_message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 加载用药历史
  const loadMedicationHistory = async () => {
    if (!patient?.id) return;
    
    try {
      const historyResponse = await medicationAPI.getMedicationHistory(patient.id);
      setMedicationHistory(historyResponse.data.history || []);
    } catch (error) {
      console.error('加载用药历史失败:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    // 如果当前在历史标签页，也刷新历史数据
    if (activeTab === 'history') {
      await loadMedicationHistory();
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [patient?.id]);

  // 当切换到历史标签页时，加载历史数据
  useEffect(() => {
    if (activeTab === 'history' && medicationHistory.length === 0) {
      loadMedicationHistory();
    }
  }, [activeTab]);

  // 导航到添加用药页面
  const navigateToAddMedication = () => {
    navigation.navigate('AddMedication', {
      patient: patient,
      editingPlan: null
    });
  };

  // 导航到编辑用药页面
  const navigateToEditMedication = (plan) => {
    navigation.navigate('AddMedication', {
      patient: patient,
      editingPlan: plan
    });
  };

  const deleteMedicationPlan = (plan) => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${plan.medication?.name || '该药品'} 的用药计划吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationAPI.deleteMedicationPlan(patient.id, plan.id);
              Alert.alert('成功', '用药计划已删除');
              loadData();
            } catch (error) {
              console.error('删除用药计划失败:', error);
              Alert.alert('错误', '删除失败，请重试');
            }
          }
        }
      ]
    );
  };

  // 模拟用药计划数据（备用，现在使用真实数据）
  const [medicationData] = useState({
    stats: {
      activePlans: 5,
      totalCompliance: 87,
      todayReminders: 8,
      weeklyAverage: 92
    },
    currentMedications: [
      {
        id: 1,
        name: '氨氯地平片',
        genericName: 'Amlodipine',
        dosage: '5mg',
        frequency: 'QD',
        frequencyText: '每日一次',
        timeOfDay: 'after_breakfast',
        timeText: '早餐后',
        startDate: '2023-03-15',
        endDate: null,
        duration: null,
        status: 'active',
        compliance: 85,
        specialInstructions: '避免与柚子汁同服',
        category: 'antihypertensive',
        categoryText: '降压药',
        lastTaken: '2024-01-15 08:30',
        nextReminder: '2024-01-16 08:00',
        totalDoses: 305,
        takenDoses: 259,
        missedDoses: 46
      },
      {
        id: 2,
        name: '二甲双胍片',
        genericName: 'Metformin',
        dosage: '500mg',
        frequency: 'BID',
        frequencyText: '每日两次',
        timeOfDay: 'after_meals',
        timeText: '餐后',
        startDate: '2023-06-01',
        endDate: null,
        duration: null,
        status: 'active',
        compliance: 92,
        specialInstructions: '随餐服用，减少胃肠道不适',
        category: 'hypoglycemic',
        categoryText: '降糖药',
        lastTaken: '2024-01-15 19:30',
        nextReminder: '2024-01-16 08:00',
        totalDoses: 456,
        takenDoses: 419,
        missedDoses: 37
      },
      {
        id: 3,
        name: '阿司匹林肠溶片',
        genericName: 'Aspirin',
        dosage: '100mg',
        frequency: 'QD',
        frequencyText: '每日一次',
        timeOfDay: 'after_dinner',
        timeText: '晚餐后',
        startDate: '2023-08-01',
        endDate: null,
        duration: null,
        status: 'active',
        compliance: 78,
        specialInstructions: '肠溶片，不可咀嚼',
        category: 'anticoagulant',
        categoryText: '抗凝药',
        lastTaken: '2024-01-14 20:00',
        nextReminder: '2024-01-15 20:00',
        totalDoses: 167,
        takenDoses: 130,
        missedDoses: 37
      }
    ],
    medicationHistory: [
      {
        id: 4,
        name: '硝苯地平缓释片',
        dosage: '30mg',
        frequency: 'QD',
        startDate: '2023-01-01',
        endDate: '2023-03-14',
        reason: '换药治疗',
        status: 'discontinued',
        compliance: 76
      }
    ],
    complianceHistory: [
      { label: '1/9', value: 85 },
      { label: '1/10', value: 88 },
      { label: '1/11', value: 82 },
      { label: '1/12', value: 90 },
      { label: '1/13', value: 87 },
      { label: '1/14', value: 92 },
      { label: '1/15', value: 89 }
    ],
    categoryDistribution: [
      { label: '降压药', value: 2, color: '#F44336' },
      { label: '降糖药', value: 1, color: '#FF9800' },
      { label: '抗凝药', value: 1, color: '#2196F3' }
    ],
    todaySchedule: [
      { time: '08:00', medication: '氨氯地平片', status: 'taken' },
      { time: '08:00', medication: '二甲双胍片', status: 'taken' },
      { time: '12:30', medication: '二甲双胍片', status: 'pending' },
      { time: '20:00', medication: '阿司匹林肠溶片', status: 'pending' }
    ]
  });

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'stopped': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '进行中';
      case 'paused': return '已暂停';
      case 'stopped': return '已停止';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  // 获取依从性颜色
  const getComplianceColor = (compliance) => {
    if (compliance >= 90) return '#4CAF50';
    if (compliance >= 80) return '#FF9800';
    if (compliance >= 70) return '#F57C00';
    return '#F44336';
  };

  // 获取药物类别颜色
  const getCategoryColor = (category) => {
    switch (category) {
      case 'antihypertensive': return '#F44336';
      case 'hypoglycemic': return '#FF9800';
      case 'anticoagulant': return '#2196F3';
      case 'lipid_lowering': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  // 处理用药状态改变
  const handleMedicationAction = async (plan, action) => {
    let newStatus;
    if (action === 'pause') newStatus = 'paused';
    else if (action === 'stop') newStatus = 'stopped'; 
    else if (action === 'resume') newStatus = 'active';
    else return;

    // 暂停和停止需要填写备注
    if (action === 'pause' || action === 'stop') {
      const actionText = action === 'pause' ? '暂停' : '停止';
      
      Alert.prompt(
        `${actionText}用药`,
        `请填写${actionText}「${plan.medication?.name || '未知药品'}」的原因：`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定',
            onPress: async (reason) => {
              if (!reason || reason.trim() === '') {
                Alert.alert('提示', '请填写备注信息');
                return;
              }
              try {
                await medicationAPI.updatePlanStatus(plan.id, newStatus, reason.trim());
                await loadData();
                // 如果当前在历史标签页，也刷新历史数据
                if (activeTab === 'history') {
                  await loadMedicationHistory();
                }
              } catch (error) {
                console.error('状态更新失败:', error);
                Alert.alert('操作失败', '网络错误，请重试');
              }
            }
          }
        ],
        'plain-text',
        '',
        'default'
      );
    } else {
      // 恢复不需要备注
      try {
        await medicationAPI.updatePlanStatus(plan.id, newStatus);
        await loadData();
        // 如果当前在历史标签页，也刷新历史数据
        if (activeTab === 'history') {
          await loadMedicationHistory();
        }
      } catch (error) {
        console.error('状态更新失败:', error);
        Alert.alert('操作失败', '网络错误，请重试');
      }
    }
  };

  // 渲染当前用药
  const renderCurrentMedications = () => (
    <View>
      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatsCard
            title="活跃计划"
            value={medicationData.stats.activePlans.toString()}
            icon="medical"
            color="#4CAF50"
            style={styles.statCard}
          />
          <StatsCard
            title="总体依从性"
            value={`${medicationData.stats.totalCompliance}%`}
            icon="analytics"
            color={getComplianceColor(medicationData.stats.totalCompliance)}
            style={styles.statCard}
          />
        </View>
        
        <View style={styles.statsRow}>
          <StatsCard
            title="今日提醒"
            value={medicationData.stats.todayReminders.toString()}
            subtitle="次"
            icon="notifications"
            color="#2196F3"
            style={styles.statCard}
          />
          <StatsCard
            title="周平均依从性"
            value={`${medicationData.stats.weeklyAverage}%`}
            icon="arrow-up"
            color="#FF9800"
            style={styles.statCard}
          />
        </View>
      </View>

      {/* 今日用药安排 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>今日用药安排</Text>
          {medicationData.todaySchedule.map((item, index) => (
            <List.Item
              key={index}
              title={item.medication}
              description={item.time}
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon={item.status === 'taken' ? 'check-circle' : 'clock'} 
                  color={item.status === 'taken' ? '#4CAF50' : '#FF9800'}
                />
              )}
              right={(props) => (
                <Chip 
                  style={[styles.scheduleChip, { 
                    backgroundColor: item.status === 'taken' ? '#4CAF50' : '#FF9800' 
                  }]}
                  textStyle={styles.scheduleChipText}
                  compact={true}
                >
                  {item.status === 'taken' ? '已服用' : '待服用'}
                </Chip>
              )}
            />
          ))}
        </Card.Content>
      </Card>

      {/* 用药列表 */}
      {medicationPlans.filter(plan => {
        // 显示所有有medication对象的计划（包括active, paused, stopped状态）
        // 只排除completed状态，因为那些已经完成治疗
        const validStatus = ['active', 'paused', 'stopped'].includes(plan.status);
        const hasMedication = plan.medication;
        return validStatus && hasMedication;
      }).map((plan) => (
        <Card key={plan.id} style={styles.card}>
          <Card.Content>
            <View style={styles.medicationHeader}>
              <View style={styles.medicationInfo}>
                <Text variant="titleMedium" style={styles.medicationName}>
                  {plan.medication?.name || '未知药品'}
                </Text>
                {plan.medication?.generic_name && (
                  <Text style={styles.genericName}>{plan.medication?.generic_name}</Text>
                )}
                <Text style={styles.medicationDetails}>
                  {plan.dosage}{plan.medication?.unit || 'mg'} · {getFrequencyDisplay(plan.frequency)} · {getTimeDisplay(plan.time_of_day)}
                </Text>
                <Text style={styles.medicationCategory}>
                  {getCategoryDisplay(plan.medication?.category)} · 开始日期: {new Date(plan.start_date).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.medicationStatus}>
                <Chip 
                  style={[styles.statusChip, { 
                    backgroundColor: getStatusColor(plan.status) 
                  }]}
                  textStyle={styles.statusChipText}
                  compact={true}
                >
                  {getStatusText(plan.status)}
                </Chip>
                <Text style={[styles.complianceText, { 
                  color: getComplianceColor(85) 
                }]}>
                  依从性: 85%
                </Text>
              </View>
            </View>

            {/* 依从性进度条 */}
            <View style={styles.complianceContainer}>
              <View style={styles.complianceBar}>
                <View 
                  style={[styles.complianceProgress, { 
                    width: `85%`,
                    backgroundColor: getComplianceColor(85)
                  }]} 
                />
              </View>
              <Text style={styles.complianceDetails}>
                已服用: 25/30 次 · 漏服: 5 次
              </Text>
            </View>

            {/* 特殊说明 */}
            {plan.special_instructions && (
              <View style={styles.instructionsContainer}>
                <Ionicons name="information-circle" size={16} color="#FF9800" />
                <Text style={styles.instructionsText}>
                  {plan.special_instructions}
                </Text>
              </View>
            )}

            {/* 操作按钮 */}
            <View style={styles.actionButtons}>
              <Button 
                mode="outlined" 
                compact 
                onPress={() => navigateToEditMedication(plan)}
                style={styles.actionButton}
              >
                编辑
              </Button>
              
              {/* 根据状态显示不同的操作按钮 */}
              {plan.status === 'active' && (
                <>
                  <Button 
                    mode="outlined" 
                    compact 
                    onPress={() => handleMedicationAction(plan, 'pause')}
                    style={[styles.actionButton, { borderColor: '#FF9800' }]}
                    textColor="#FF9800"
                  >
                    暂停
                  </Button>
                  <Button 
                    mode="outlined" 
                    compact 
                    onPress={() => handleMedicationAction(plan, 'stop')}
                    style={[styles.actionButton, { borderColor: '#F44336' }]}
                    textColor="#F44336"
                  >
                    停止
                  </Button>
                </>
              )}
              
              {plan.status === 'paused' && (
                <>
                  <Button 
                    mode="outlined" 
                    compact 
                    onPress={() => handleMedicationAction(plan, 'resume')}
                    style={[styles.actionButton, { borderColor: '#4CAF50' }]}
                    textColor="#4CAF50"
                  >
                    恢复
                  </Button>
                  <Button 
                    mode="outlined" 
                    compact 
                    onPress={() => handleMedicationAction(plan, 'stop')}
                    style={[styles.actionButton, { borderColor: '#F44336' }]}
                    textColor="#F44336"
                  >
                    停止
                  </Button>
                </>
              )}
              
              {plan.status === 'stopped' && (
                <Button 
                  mode="outlined" 
                  compact 
                  onPress={() => handleMedicationAction(plan, 'resume')}
                  style={[styles.actionButton, { borderColor: '#4CAF50' }]}
                  textColor="#4CAF50"
                >
                  恢复
                </Button>
              )}
              
              {plan.status === 'completed' && (
                <Text style={[styles.completedText, { color: '#9E9E9E', fontSize: 12 }]}>
                  治疗已完成
                </Text>
              )}
            </View>

            {/* 最近服药信息 */}
            <View style={styles.recentInfo}>
              <Text style={styles.recentText}>
                上次服药: 无记录
              </Text>
              <Text style={styles.recentText}>
                下次提醒: 无提醒
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  // 渲染用药历史
  const renderMedicationHistory = () => {
    if (medicationHistory.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无用药历史记录</Text>
        </View>
      );
    }

    return (
      <View>
        {medicationHistory.map((record) => (
          <Card key={record.id} style={styles.card}>
            <Card.Content>
              <View style={styles.historyHeader}>
                <View style={styles.historyInfo}>
                  <Text variant="titleMedium" style={styles.medicationName}>
                    {record.medication_name}
                  </Text>
                  <Text style={styles.historyDetails}>
                    {record.dosage}mg · {record.frequency}
                  </Text>
                  <Text style={styles.historyAction}>
                    {record.from_status} → {record.to_status}
                  </Text>
                  {record.reason && (
                    <Text style={styles.historyReason}>
                      原因: {record.reason}
                    </Text>
                  )}
                  <Text style={styles.historyTime}>
                    时间: {new Date(record.created_at).toLocaleString('zh-CN')}
                  </Text>
                  <Text style={styles.historyDoctor}>
                    操作人: {record.changed_by}
                  </Text>
                </View>
                
                <View style={styles.historyStatus}>
                  <Chip 
                    style={[styles.statusChip, { 
                      backgroundColor: record.to_status === 'stopped' ? '#F44336' : 
                                      record.to_status === 'paused' ? '#FF9800' : '#4CAF50'
                    }]}
                    textStyle={styles.statusChipText}
                    compact={true}
                  >
                    {record.to_status}
                  </Chip>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  // 渲染统计分析
  const renderAnalytics = () => (
    <View>
      {/* 依从性趋势 */}
      <Card style={styles.card}>
        <Card.Content>
          <LineChart
            data={medicationData.complianceHistory}
            title="7天依从性趋势"
            height={200}
            color="#4CAF50"
            yAxisLabel="依从性 (%)"
            xAxisLabel="日期"
          />
        </Card.Content>
      </Card>

      {/* 药物类别分布 */}
      <Card style={styles.card}>
        <Card.Content>
          <PieChart
            data={medicationData.categoryDistribution}
            title="药物类别分布"
            height={220}
          />
        </Card.Content>
      </Card>

      {/* 服药时间分布 */}
      <Card style={styles.card}>
        <Card.Content>
          <BarChart
            data={[
              { label: '早餐后', value: 2 },
              { label: '午餐后', value: 1 },
              { label: '晚餐后', value: 2 },
              { label: '睡前', value: 0 }
            ]}
            title="服药时间分布"
            height={180}
            color="#2196F3"
            yAxisLabel="药物数量"
          />
        </Card.Content>
      </Card>
    </View>
  );

  // 渲染标签栏
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'current' && styles.activeTab]}
        onPress={() => setActiveTab('current')}
      >
        <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
          当前用药
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          用药历史
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
        onPress={() => setActiveTab('analytics')}
      >
        <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
          统计分析
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'current':
        return renderCurrentMedications();
      case 'history':
        return renderMedicationHistory();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderCurrentMedications();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>加载用药数据...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 自定义头部 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          用药计划 {patient && `- ${patient.name}`}
        </Text>
        <IconButton
          icon="plus"
          onPress={navigateToAddMedication}
        />
      </View>

      {renderTabs()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>

      {/* 添加用药按钮 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={navigateToAddMedication}
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    color: '#333',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
  },
  scheduleChip: {
    marginLeft: 8,
  },
  scheduleChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  genericName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  medicationCategory: {
    fontSize: 12,
    color: '#999',
  },
  medicationStatus: {
    alignItems: 'flex-end',
  },
  statusChip: {
    marginBottom: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  complianceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  complianceContainer: {
    marginBottom: 12,
  },
  complianceBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 4,
  },
  complianceProgress: {
    height: '100%',
    borderRadius: 3,
  },
  complianceDetails: {
    fontSize: 12,
    color: '#666',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  instructionsText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#E65100',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    minWidth: 70,
  },
  completedText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  recentInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  recentText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyInfo: {
    flex: 1,
    marginRight: 12,
  },
  historyDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  historyAction: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '500',
    marginBottom: 4,
  },
  historyReason: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  historyTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  historyDoctor: {
    fontSize: 12,
    color: '#666',
  },
  historyStatus: {
    alignItems: 'flex-end',
  },
});

export default MedicationPlanScreen;