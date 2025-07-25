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
  Modal,
  TextInput,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import * as Notifications from 'expo-notifications';

const MedicationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // 模拟用药数据
  const [medicationData, setMedicationData] = useState({
    todayMedications: [
      {
        id: 1,
        name: '氨氯地平片',
        dosage: '5mg',
        time: '08:00',
        status: 'pending',
        taken: false,
        category: '降压药',
        instructions: '早餐后服用',
        sideEffects: '可能引起头晕、水肿',
      },
      {
        id: 2,
        name: '二甲双胍片',
        dosage: '500mg',
        time: '12:30',
        status: 'pending',
        taken: false,
        category: '降糖药',
        instructions: '餐中服用',
        sideEffects: '可能引起胃肠道不适',
      },
      {
        id: 3,
        name: '阿司匹林肠溶片',
        dosage: '100mg',
        time: '20:00',
        status: 'pending',
        taken: false,
        category: '抗凝药',
        instructions: '晚餐后服用',
        sideEffects: '可能引起胃部不适',
      },
    ],
    medicationPlans: [
      {
        id: 1,
        name: '氨氯地平片',
        dosage: '5mg',
        frequency: '每日一次',
        timeOfDay: '早餐后',
        startDate: '2024-01-01',
        endDate: null,
        status: 'active',
        compliance: 85,
        totalDoses: 30,
        takenDoses: 25,
        missedDoses: 5,
      },
      {
        id: 2,
        name: '二甲双胍片',
        dosage: '500mg',
        frequency: '每日两次',
        timeOfDay: '餐中',
        startDate: '2024-01-01',
        endDate: null,
        status: 'active',
        compliance: 92,
        totalDoses: 60,
        takenDoses: 55,
        missedDoses: 5,
      },
    ],
    medicationHistory: [
      {
        id: 1,
        name: '硝苯地平片',
        dosage: '10mg',
        frequency: '每日三次',
        startDate: '2023-06-01',
        endDate: '2023-12-31',
        reason: '血压控制不佳，更换为氨氯地平',
        compliance: 78,
      },
    ],
  });

  useEffect(() => {
    loadMedicationData();
    setupNotifications();
  }, []);

  const loadMedicationData = async () => {
    // 这里应该调用API获取真实的用药数据
    console.log('加载用药数据');
  };

  const setupNotifications = async () => {
    // 请求通知权限
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('权限不足', '需要通知权限来发送用药提醒');
      return;
    }

    // 设置通知处理器
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicationData();
    setRefreshing(false);
  };

  const markAsTaken = (medicationId) => {
    setMedicationData(prev => ({
      ...prev,
      todayMedications: prev.todayMedications.map(med =>
        med.id === medicationId
          ? { ...med, status: 'taken', taken: true }
          : med
      ),
    }));
    Alert.alert('成功', '已记录服药');
  };

  const skipMedication = (medicationId) => {
    Alert.alert(
      '跳过服药',
      '确定要跳过这次服药吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            setMedicationData(prev => ({
              ...prev,
              todayMedications: prev.todayMedications.map(med =>
                med.id === medicationId
                  ? { ...med, status: 'skipped' }
                  : med
              ),
            }));
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
      case 'taken': return '已服用';
      case 'pending': return '待服用';
      case 'skipped': return '已跳过';
      default: return '未知';
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
            今日用药
          </Text>
          <Chip mode="outlined" textStyle={styles.chipText}>
            {medicationData.todayMedications.filter(m => m.status === 'pending').length} 个待服用
          </Chip>
        </View>
        
        <Text style={styles.sectionNote}>
                        {t('medication.planMadeByDoctor')}
        </Text>
        
        {medicationData.todayMedications.map((medication) => (
          <View key={medication.id} style={styles.medicationItem}>
            <View style={styles.medicationInfo}>
              <View style={styles.medicationHeader}>
                <Text variant="titleMedium" style={styles.medicationName}>
                  {medication.name}
                </Text>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(medication.status) }]}
                  textStyle={styles.statusChipText}
                  compact={true}
                >
                  {getStatusText(medication.status)}
                </Chip>
              </View>
              
              <Text style={styles.medicationDetails}>
                {medication.dosage} · {medication.category} · {medication.time}
              </Text>
              
              <Text style={styles.medicationInstructions}>
                {medication.instructions}
              </Text>
            </View>
            
            {medication.status === 'pending' && (
              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={() => markAsTaken(medication.id)}
                  style={[styles.actionButton, styles.takeButton]}
                  labelStyle={styles.actionButtonText}
                >
                  已服用
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => skipMedication(medication.id)}
                  style={[styles.actionButton, styles.skipButton]}
                  labelStyle={styles.skipButtonText}
                >
                  跳过
                </Button>
              </View>
            )}
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderMedicationPlans = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            {t('medication.medicationPlan')}
          </Text>
          <Chip mode="outlined" textStyle={styles.chipText}>
            由医生制定
          </Chip>
        </View>
        
        {medicationData.medicationPlans.length > 0 ? (
          medicationData.medicationPlans.map((plan) => (
            <View key={plan.id} style={styles.planItem}>
            <View style={styles.planHeader}>
              <View style={styles.planInfo}>
                <Text variant="titleMedium" style={styles.planName}>
                  {plan.name}
                </Text>
                <Text style={styles.planDetails}>
                  {plan.dosage} · {plan.frequency} · {plan.timeOfDay}
                </Text>
                <Text style={styles.planDate}>
                  {plan.startDate} - {plan.endDate || '持续服用'}
                </Text>
              </View>
              
              <Chip 
                style={[styles.statusChip, { backgroundColor: plan.status === 'active' ? '#4CAF50' : '#9E9E9E' }]}
                textStyle={styles.statusChipText}
                compact={true}
              >
                {plan.status === 'active' ? '进行中' : '已停止'}
              </Chip>
            </View>
            
            <View style={styles.complianceContainer}>
              <Text style={styles.complianceLabel}>
                依从性: {plan.compliance}%
              </Text>
              <View style={styles.complianceBar}>
                <View 
                  style={[
                    styles.complianceProgress, 
                    { 
                      width: `${plan.compliance}%`,
                      backgroundColor: getComplianceColor(plan.compliance)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.complianceStats}>
                {plan.takenDoses}/{plan.totalDoses} 次 (漏服 {plan.missedDoses} 次)
              </Text>
            </View>
          </View>
        ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              暂无用药计划
            </Text>
            <Text style={styles.emptyStateSubtext}>
              请联系您的医生制定用药计划
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderMedicationHistory = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.cardTitle}>
          用药历史
        </Text>
        
        {medicationData.medicationHistory.length > 0 ? (
          medicationData.medicationHistory.map((history) => (
          <View key={history.id} style={styles.historyItem}>
            <View style={styles.historyHeader}>
              <Text variant="titleMedium" style={styles.historyName}>
                {history.name}
              </Text>
              <Text style={styles.historyCompliance}>
                依从性: {history.compliance}%
              </Text>
            </View>
            
            <Text style={styles.historyDetails}>
              {history.dosage} · {history.frequency}
            </Text>
            <Text style={styles.historyPeriod}>
              {history.startDate} - {history.endDate}
            </Text>
            <Text style={styles.historyReason}>
              停药原因: {history.reason}
            </Text>
          </View>
        ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              暂无用药历史
            </Text>
            <Text style={styles.emptyStateSubtext}>
              开始用药后将显示历史记录
            </Text>
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
            用药提醒
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            管理您的用药计划和提醒
          </Text>
        </View>

        {renderTodayMedications()}
        {renderMedicationPlans()}
        {renderMedicationHistory()}
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
  },
  sectionNote: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
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
  },
  takeButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    borderColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 14,
  },
  skipButtonText: {
    color: '#F44336',
    fontSize: 14,
  },
  statusChip: {
    height: 24,
  },
  statusChipText: {
    fontSize: 10,
    color: '#fff',
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
  historyItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyName: {
    fontWeight: 'bold',
    color: '#333333',
  },
  historyCompliance: {
    fontSize: 14,
    color: '#666666',
  },
  historyDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  historyPeriod: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 2,
  },
  historyReason: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});

export default MedicationScreen; 