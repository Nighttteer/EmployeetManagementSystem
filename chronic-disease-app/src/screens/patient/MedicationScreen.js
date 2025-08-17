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
import i18n from 'i18next';

const MedicationScreen = ({ navigation }) => {
  const { t, ready, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const [refreshing, setRefreshing] = useState(false);
  const [i18nReady, setI18nReady] = useState(false);

  // 获取模拟用药数据的函数
  const getMedicationData = () => {
    // 检查用户是否有用药计划
    const hasMedicationPlans = false; // 新患者默认没有用药计划
    
    if (hasMedicationPlans) {
      // 如果有用药计划，返回完整的用药数据
      return {
        todayMedications: [
          {
            id: 1,
            name: 'Amlodipine Tablets',
            dosage: '5mg',
            time: '08:00',
            status: 'pending',
            taken: false,
            category: t('common.antihypertensive'),
            instructions: t('common.afterBreakfast'),
            sideEffects: t('common.maycauseDizzinessSwelling'),
          },
          {
            id: 2,
            name: 'Metformin Tablets',
            dosage: '500mg',
            time: '12:30',
            status: 'pending',
            taken: false,
            category: t('common.antidiabetic'),
            instructions: t('common.withMeals'),
            sideEffects: t('common.maycauseGastrointestinalDiscomfort'),
          },
        ],
        medicationPlans: [
          {
            id: 1,
            name: 'Amlodipine Tablets',
            dosage: '5mg',
            frequency: t('common.onceDaily'),
            timeOfDay: t('common.afterBreakfastShort'),
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
            name: 'Metformin Tablets',
            dosage: '500mg',
            frequency: t('common.twiceDaily'),
            timeOfDay: t('common.withMealsShort'),
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
            name: 'Nifedipine Tablets',
            dosage: '10mg',
            frequency: t('common.thriceDaily'),
            startDate: '2023-06-01',
            endDate: '2023-12-31',
            reason: t('common.replacedDueToPoorControl'),
            compliance: 78,
          },
        ],
      };
    } else {
      // 如果没有用药计划，返回空数据
      return {
        todayMedications: [],
        medicationPlans: [],
        medicationHistory: []
      };
    }
  };

  const loadMedicationData = async () => {
    try {
      // 这里应该调用API获取真实的用药数据
      // 目前使用模拟数据
      const data = getMedicationData();
      setMedicationData(data);
      console.log('✅ 用药数据加载完成:', data.todayMedications.length, '个今日用药');
    } catch (error) {
      console.error('❌ 加载用药数据失败:', error);
    }
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

  // 初始化用药数据 - 延迟初始化避免翻译问题
  const [medicationData, setMedicationData] = useState({
    todayMedications: [],
    medicationPlans: [],
    medicationHistory: []
  });

  // 监听语言变化
  useEffect(() => {
    if (ready && i18n.isInitialized) {
      setI18nReady(true);
      console.log(`🌍 病人端用药管理界面语言: ${i18n.language}`);
    }
  }, [ready, i18n.isInitialized, i18n.language]);

  // 监听Redux语言状态变化
  useEffect(() => {
    if (currentLanguage && i18n.language !== currentLanguage) {
      console.log(`🔄 同步语言状态: Redux=${currentLanguage}, i18n=${i18n.language}`);
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  // 等待国际化系统准备就绪
  useEffect(() => {
    if (ready && t && typeof t === 'function') {
      console.log('🌍 国际化系统已准备就绪');
      console.log('🌍 当前语言:', i18n.language);
      console.log('🌍 测试翻译:', t('common.medicationReminder'));
      setI18nReady(true);
      loadMedicationData();
      setupNotifications();
    } else {
      console.log('❌ 国际化系统未准备就绪');
      setI18nReady(false);
    }
  }, [ready, t]);

  // 等待国际化系统准备就绪
  if (!i18nReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text>正在加载国际化资源...</Text>
      </View>
    );
  }

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
    Alert.alert(t('common.success'), t('medication.medicationRecorded'));
  };

  const skipMedication = (medicationId) => {
    Alert.alert(
      t('medication.skipMedication'),
      t('medication.confirmSkipMedication'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            setMedicationData(prev => ({
              ...prev,
              todayMedications: prev.todayMedications.map(med =>
                med.id === medicationId
                  ? { ...med, status: 'skipped' }
                  : med
              ),
            }));
            Alert.alert(t('common.success'), t('medication.medicationSkipped'));
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
      case 'taken': return t('common.taken');
      case 'pending': return t('common.pending');
      case 'skipped': return t('common.skipped');
      default: return t('common.unknown');
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
            {t('common.todayMedications')}
          </Text>
          <Chip mode="outlined" textStyle={styles.chipText}>
            {medicationData.todayMedications.length} {t('common.medications')}
          </Chip>
        </View>
        
        {medicationData.todayMedications.length > 0 ? (
          medicationData.todayMedications.map((medication) => (
            <View key={medication.id} style={styles.medicationItem}>
              <View style={styles.medicationInfo}>
                <View style={styles.medicationHeader}>
                  <Text variant="titleMedium" style={styles.medicationName}>
                    {medication.name}
                  </Text>
                  <Chip 
                    style={[styles.statusChip, styles.elevatedChip, { backgroundColor: getStatusColor(medication.status) }]}
                    contentStyle={styles.statusChipContent}
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
                    {t('common.taken')}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => skipMedication(medication.id)}
                    style={[styles.actionButton, styles.skipButton]}
                    labelStyle={styles.skipButtonText}
                  >
                    {t('medication.skip')}
                  </Button>
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={48} color="#ccc" style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateText}>
              {t('medication.noMedicationPlans')}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {t('medication.contactDoctorForPlan')}
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Chat')}
              style={styles.contactDoctorButton}
              icon="message"
            >
              {t('common.contactDoctor')}
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderMedicationPlans = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            {t('common.medicationPlan')}
          </Text>
          <Chip mode="outlined" textStyle={styles.chipText}>
            {t('common.planMadeByDoctor')}
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
                    {plan.startDate} - {plan.endDate || t('common.longTerm')}
                  </Text>
                </View>
                
                <Chip 
                  style={[styles.statusChip, styles.elevatedChip, { backgroundColor: plan.status === 'active' ? '#4CAF50' : '#9E9E9E' }]}
                  contentStyle={styles.statusChipContent}
                  textStyle={styles.statusChipText}
                  compact={true}
                >
                  {plan.status === 'active' ? t('common.active') : t('common.stopped')}
                </Chip>
              </View>
              
              <View style={styles.complianceContainer}>
                <Text style={styles.complianceLabel}>
                  {t('medication.compliance')}: {plan.compliance}%
                </Text>
                <View style={styles.complianceBar}>
                  <View 
                    style={[
                      styles.complianceProgress, 
                      { 
                        width: `${plan.compliance}%`,
                        backgroundColor: plan.compliance >= 80 ? '#4CAF50' : plan.compliance >= 60 ? '#FF9800' : '#F44336'
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.complianceDetails}>
                  {t('medication.taken')}: {plan.takenDoses}/{plan.totalDoses} · {t('medication.missed')}: {plan.missedDoses}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateText}>
              {t('medication.noMedicationPlans')}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {t('medication.contactDoctorForPlan')}
            </Text>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Chat')}
              style={styles.contactDoctorButton}
              icon="message"
            >
              {t('common.contactDoctor')}
            </Button>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderMedicationHistory = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            {t('medication.medicationHistory')}
          </Text>
          <Chip mode="outlined" textStyle={styles.chipText}>
            {medicationData.medicationHistory.length} {t('common.records')}
          </Chip>
        </View>
        
        {medicationData.medicationHistory.length > 0 ? (
          medicationData.medicationHistory.map((history) => (
            <View key={history.id} style={styles.historyItem}>
              <Text style={styles.historyName}>
                {history.name} ({history.dosage})
              </Text>
              <Text style={styles.historyDetails}>
                {history.frequency} · {history.compliance}% {t('medication.compliance')}
              </Text>
              <Text style={styles.historyDate}>
                {history.startDate} - {history.endDate}
              </Text>
              <Text style={styles.historyReason}>
                {t('medication.discontinuationReason')}: {history.reason}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#ccc" style={styles.emptyStateIcon} />
            <Text style={styles.emptyStateText}>
              {t('medication.noHistory')}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {t('medication.historyWillShowAfterStart')}
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
            {t('common.medicationReminder')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('common.managePlanAndReminder')}
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
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  sectionNote: {
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  takeButton: {
    backgroundColor: '#4CAF50',
  },
  skipButton: {
    borderColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  skipButtonText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  statusChip: {
    height: 36,
    minWidth: 76,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  elevatedChip: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 1,
  },
  statusChipContent: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  statusChipText: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 22,
    includeFontPadding: false,
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
  complianceDetails: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
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
  historyDate: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  contactDoctorButton: {
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

export default MedicationScreen; 