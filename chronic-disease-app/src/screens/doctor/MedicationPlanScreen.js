import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  ActivityIndicator, 
  Chip,
  List,
  IconButton,
  TextInput,
  Menu,
  Divider,
  FAB,
  Portal,
  Dialog
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 导入图表组件
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';
import PieChart from '../../components/Charts/PieChart';
import StatsCard from '../../components/StatsCard';

const MedicationPlanScreen = ({ route, navigation }) => {
  const { patient } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // current, history, analytics
  const [addMedicationVisible, setAddMedicationVisible] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);

  // 模拟用药计划数据
  const [medicationData, setMedicationData] = useState({
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

  useEffect(() => {
    loadMedicationData();
  }, []);

  const loadMedicationData = async () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicationData();
    setRefreshing(false);
  };

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
  const handleMedicationAction = (medication, action) => {
    Alert.alert(
      '确认操作',
      `确定要${action === 'pause' ? '暂停' : action === 'stop' ? '停止' : '恢复'}「${medication.name}」的用药计划吗？`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定', 
          onPress: () => {
            console.log(`${action} medication:`, medication.id);
            // 这里实现具体的操作逻辑
          }
        }
      ]
    );
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
            icon="trending-up"
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
      {medicationData.currentMedications.map((medication) => (
        <Card key={medication.id} style={styles.card}>
          <Card.Content>
            <View style={styles.medicationHeader}>
              <View style={styles.medicationInfo}>
                <Text variant="titleMedium" style={styles.medicationName}>
                  {medication.name}
                </Text>
                <Text style={styles.genericName}>{medication.genericName}</Text>
                <Text style={styles.medicationDetails}>
                  {medication.dosage} · {medication.frequencyText} · {medication.timeText}
                </Text>
                <Text style={styles.medicationCategory}>
                  {medication.categoryText} · 开始日期: {medication.startDate}
                </Text>
              </View>
              
              <View style={styles.medicationStatus}>
                <Chip 
                  style={[styles.statusChip, { 
                    backgroundColor: getStatusColor(medication.status) 
                  }]}
                  textStyle={styles.statusChipText}
                  compact={true}
                >
                  {getStatusText(medication.status)}
                </Chip>
                <Text style={[styles.complianceText, { 
                  color: getComplianceColor(medication.compliance) 
                }]}>
                  依从性: {medication.compliance}%
                </Text>
              </View>
            </View>

            {/* 依从性进度条 */}
            <View style={styles.complianceContainer}>
              <View style={styles.complianceBar}>
                <View 
                  style={[styles.complianceProgress, { 
                    width: `${medication.compliance}%`,
                    backgroundColor: getComplianceColor(medication.compliance)
                  }]} 
                />
              </View>
              <Text style={styles.complianceDetails}>
                已服用: {medication.takenDoses}/{medication.totalDoses} 次 · 
                漏服: {medication.missedDoses} 次
              </Text>
            </View>

            {/* 特殊说明 */}
            {medication.specialInstructions && (
              <View style={styles.instructionsContainer}>
                <Ionicons name="information-circle" size={16} color="#FF9800" />
                <Text style={styles.instructionsText}>
                  {medication.specialInstructions}
                </Text>
              </View>
            )}

            {/* 操作按钮 */}
            <View style={styles.actionButtons}>
              <Button 
                mode="outlined" 
                compact 
                onPress={() => setSelectedMedication(medication)}
                style={styles.actionButton}
              >
                编辑
              </Button>
              <Button 
                mode="outlined" 
                compact 
                onPress={() => handleMedicationAction(medication, 'pause')}
                style={styles.actionButton}
              >
                暂停
              </Button>
              <Button 
                mode="outlined" 
                compact 
                onPress={() => handleMedicationAction(medication, 'stop')}
                style={styles.actionButton}
              >
                停止
              </Button>
            </View>

            {/* 最近服药信息 */}
            <View style={styles.recentInfo}>
              <Text style={styles.recentText}>
                上次服药: {medication.lastTaken}
              </Text>
              <Text style={styles.recentText}>
                下次提醒: {medication.nextReminder}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  // 渲染用药历史
  const renderMedicationHistory = () => (
    <View>
      {medicationData.medicationHistory.map((medication) => (
        <Card key={medication.id} style={styles.card}>
          <Card.Content>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <Text variant="titleMedium" style={styles.medicationName}>
                  {medication.name}
                </Text>
                <Text style={styles.historyDetails}>
                  {medication.dosage} · {medication.frequency}
                </Text>
                <Text style={styles.historyPeriod}>
                  {medication.startDate} - {medication.endDate}
                </Text>
                <Text style={styles.historyReason}>
                  停药原因: {medication.reason}
                </Text>
              </View>
              
              <View style={styles.historyStatus}>
                <Chip 
                  style={[styles.statusChip, { 
                    backgroundColor: getStatusColor(medication.status) 
                  }]}
                  textStyle={styles.statusChipText}
                  compact={true}
                >
                  已停止
                </Chip>
                <Text style={styles.complianceText}>
                  依从性: {medication.compliance}%
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

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
          onPress={() => setAddMedicationVisible(true)}
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
        onPress={() => setAddMedicationVisible(true)}
      />

      {/* 添加用药对话框 */}
      <Portal>
        <Dialog visible={addMedicationVisible} onDismiss={() => setAddMedicationVisible(false)}>
          <Dialog.Title>添加用药计划</Dialog.Title>
          <Dialog.Content>
            <Text>添加用药计划功能开发中...</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddMedicationVisible(false)}>取消</Button>
            <Button onPress={() => setAddMedicationVisible(false)}>确定</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  card: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
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
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    fontSize: 16,
  },
  scheduleChip: {
    height: 32,
    minWidth: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
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
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  genericName: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  medicationCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  medicationStatus: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  statusChip: {
    marginBottom: 4,
    alignSelf: 'flex-end',
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
  complianceText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  complianceContainer: {
    marginBottom: 12,
  },
  complianceBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  complianceProgress: {
    height: '100%',
    borderRadius: 4,
  },
  complianceDetails: {
    fontSize: 12,
    color: '#666',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 12,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    marginLeft: 8,
    height: 32,
    marginBottom: 4,
    minWidth: 60,
  },
  recentInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  recentText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
    marginRight: 12,
  },
  historyDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  historyPeriod: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  historyReason: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 2,
  },
  historyStatus: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});

export default MedicationPlanScreen; 