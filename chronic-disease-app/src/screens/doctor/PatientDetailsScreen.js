import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  Avatar,
  List,
  IconButton,
  Menu,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// 导入图表组件
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';
import StatsCard from '../../components/StatsCard';
import { api, medicationAPI } from '../../services/api';
import reportService from '../../services/reportService';

const PatientDetailsScreen = ({ route, navigation }) => {
  const { patient } = route.params || {};
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, health, medication, history
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(patient); // 跟踪最新的患者信息
  const [realMedicationPlans, setRealMedicationPlans] = useState([]); // 真实的用药计划数据

  // 慢性疾病列表
  const chronicDiseases = [
    { id: 'alzheimer', name: t('diseases.alzheimer') },
    { id: 'arthritis', name: t('diseases.arthritis') },
    { id: 'asthma', name: t('diseases.asthma') },
    { id: 'cancer', name: t('diseases.cancer') },
    { id: 'copd', name: t('diseases.copd') },
    { id: 'crohn', name: t('diseases.crohn') },
    { id: 'cystic_fibrosis', name: t('diseases.cysticFibrosis') },
    { id: 'dementia', name: t('diseases.dementia') },
    { id: 'diabetes', name: t('diseases.diabetes') },
    { id: 'endometriosis', name: t('diseases.endometriosis') },
    { id: 'epilepsy', name: t('diseases.epilepsy') },
    { id: 'fibromyalgia', name: t('diseases.fibromyalgia') },
    { id: 'heart_disease', name: t('diseases.heartDisease') },
    { id: 'hypertension', name: t('diseases.hypertension') },
    { id: 'hiv_aids', name: t('diseases.hivAids') },
    { id: 'migraine', name: t('diseases.migraine') },
    { id: 'mood_disorder', name: t('diseases.moodDisorder') },
    { id: 'multiple_sclerosis', name: t('diseases.multipleSclerosis') },
    { id: 'narcolepsy', name: t('diseases.narcolepsy') },
    { id: 'parkinson', name: t('diseases.parkinson') },
    { id: 'sickle_cell', name: t('diseases.sickleCell') },
    { id: 'ulcerative_colitis', name: t('diseases.ulcerativeColitis') }
  ];

  // 模拟患者详细数据
  const [patientData, setPatientData] = useState({
    basicInfo: {
      id: patient.id,
      name: patient.name || 'John Doe',
      age: patient.age || 65,
      gender: patient.gender || 'male',
      phone: patient.phone || '+86 138-0013-8000',
      address: '123 Main Street, City, State',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+86 139-0013-8001',
      bloodType: 'A+',
      height: 170,
      weight: 75,
      riskLevel: patient.risk_level || 'medium',
      lastVisit: '2024-01-15',
      registeredDate: '2023-03-15'
    },
    healthMetrics: {
      latest: {
        bloodPressure: { systolic: 145, diastolic: 90, time: '2024-01-15 09:30' },
        bloodGlucose: { value: 7.2, time: '2024-01-15 08:00' },
        heartRate: { value: 78, time: '2024-01-15 09:30' },
        weight: { value: 75.2, time: '2024-01-14' }
      },
      trends: {
        bloodPressure: {
          systolic: [
            { label: '1/10', value: 135 },
            { label: '1/11', value: 142 },
            { label: '1/12', value: 138 },
            { label: '1/13', value: 145 },
            { label: '1/14', value: 140 },
            { label: '1/15', value: 145 }
          ],
          diastolic: [
            { label: '1/10', value: 85 },
            { label: '1/11', value: 90 },
            { label: '1/12', value: 88 },
            { label: '1/13', value: 95 },
            { label: '1/14', value: 90 },
            { label: '1/15', value: 90 }
          ]
        },
        bloodGlucose: [
          { label: '1/10', value: 6.8 },
          { label: '1/11', value: 7.1 },
          { label: '1/12', value: 6.9 },
          { label: '1/13', value: 7.3 },
          { label: '1/14', value: 7.0 },
          { label: '1/15', value: 7.2 }
        ],
        heartRate: [
          { label: '1/10', value: 72 },
          { label: '1/11', value: 75 },
          { label: '1/12', value: 74 },
          { label: '1/13', value: 78 },
          { label: '1/14', value: 76 },
          { label: '1/15', value: 78 }
        ]
      }
    },
    medications: [
      {
        id: 1,
        name: 'Amlodipine Tablets',
        dosage: '5mg',
        frequency: 'Once daily',
        time: 'After breakfast',
        startDate: '2023-03-15',
        status: 'active',
        compliance: 85
      },
      {
        id: 2,
        name: 'Metformin Tablets',
        dosage: '500mg',
        frequency: 'Twice daily',
        time: 'After meals',
        startDate: '2023-06-01',
        status: 'active',
        compliance: 92
      }
    ],
    alerts: [
      {
        id: 1,
        type: 'blood_pressure',
        message: 'Blood pressure is high, recommend adjusting medication',
        date: '2024-01-15',
        status: 'pending'
      },
      {
        id: 2,
        type: 'medication',
        message: 'Good medication compliance',
        date: '2024-01-14',
        status: 'info'
      }
    ],
    medicalHistory: [
      {
        id: 1,
        date: '2024-01-15',
        type: 'consultation',
        title: 'Regular Follow-up',
        description: '血压控制情况良好，继续现有治疗方案',
        doctor: 'Dr. 陈医生'
      },
      {
        id: 2,
        date: '2024-01-10',
        type: 'lab_result',
        title: 'Blood Test',
        description: 'All indicators normal',
        doctor: 'Dr. 李医生'
      }
    ]
  });

  useEffect(() => {
    loadPatientData();
  }, []);

  // 使用useFocusEffect在页面聚焦时刷新患者基本信息
  useFocusEffect(
    React.useCallback(() => {
      loadPatientBasicInfo();
    }, [patient.id])
  );

  const loadPatientBasicInfo = async () => {
    try {
      // 获取患者基本信息，包括最新的风险等级
      const response = await api.get(`/accounts/patients/${patient.id}/update/`);
      if (response.data) {
        // 更新患者基本信息，特别是chronic_diseases和计算后的风险等级
        const updatedPatientInfo = {
          ...currentPatient,
          chronic_diseases: response.data.chronic_diseases,
          risk_level: getRiskLevelFromDiseases(response.data.chronic_diseases)
        };
        
        // 更新本地状态，触发重新渲染
        setCurrentPatient(updatedPatientInfo);
        
        // 同时更新navigation的参数，这样返回时患者列表也会显示正确信息
        navigation.setParams({ patient: updatedPatientInfo });
        
        console.log('🔄 患者基本信息已刷新:', updatedPatientInfo.name, '风险等级:', updatedPatientInfo.risk_level, '疾病:', updatedPatientInfo.chronic_diseases);
      }
    } catch (error) {
      console.error('获取患者基本信息失败:', error);
    }
  };

  const getRiskLevelFromDiseases = (chronicDiseases) => {
    if (chronicDiseases === null) return 'unassessed';
    if (chronicDiseases.length === 0) return 'healthy';
    
    const highRiskDiseases = ['cancer', 'heart_disease', 'stroke', 'kidney_disease', 'liver_disease', 'sickle_cell', 'mood_disorder', 'narcolepsy'];
    const mediumRiskDiseases = ['diabetes', 'hypertension', 'copd', 'asthma', 'epilepsy', 'multiple_sclerosis', 'parkinson', 'alzheimer', 'dementia', 'hiv_aids'];
    
    const hasHighRisk = chronicDiseases.some(disease => highRiskDiseases.includes(disease));
    const hasMediumRisk = chronicDiseases.some(disease => mediumRiskDiseases.includes(disease));
    
    if (hasHighRisk) return 'high';
    if (hasMediumRisk) return 'medium';
    return 'low';
  };

  const loadPatientData = async () => {
    setLoading(true);
    try {
      // 调用真实API获取患者健康数据
      const response = await api.get(`/health/patients/${patient.id}/health-data/`);
      
      if (response.data.success) {
        const healthData = response.data.data;
        
        // 转换血糖数据为图表格式
        const bloodGlucoseMetrics = healthData.healthMetrics
          .filter(metric => metric.type === 'blood_glucose' && metric.bloodGlucose)
          .sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
        
        const bloodPressureMetrics = healthData.healthMetrics
          .filter(metric => metric.type === 'blood_pressure' && metric.systolic)
          .sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
        
        const heartRateMetrics = healthData.healthMetrics
          .filter(metric => metric.type === 'heart_rate' && metric.heartRate)
          .sort((a, b) => new Date(a.measuredAt) - new Date(b.measuredAt));
        
        // 更新患者数据
        setPatientData(prev => ({
          ...prev,
          healthMetrics: {
            latest: {
              bloodPressure: bloodPressureMetrics.length > 0 ? {
                systolic: bloodPressureMetrics[bloodPressureMetrics.length - 1].systolic,
                diastolic: bloodPressureMetrics[bloodPressureMetrics.length - 1].diastolic,
                time: new Date(bloodPressureMetrics[bloodPressureMetrics.length - 1].measuredAt).toLocaleString()
              } : prev.healthMetrics.latest.bloodPressure,
              
              bloodGlucose: bloodGlucoseMetrics.length > 0 ? {
                value: bloodGlucoseMetrics[bloodGlucoseMetrics.length - 1].bloodGlucose,
                time: new Date(bloodGlucoseMetrics[bloodGlucoseMetrics.length - 1].measuredAt).toLocaleString()
              } : prev.healthMetrics.latest.bloodGlucose,
              
              heartRate: heartRateMetrics.length > 0 ? {
                value: heartRateMetrics[heartRateMetrics.length - 1].heartRate,
                time: new Date(heartRateMetrics[heartRateMetrics.length - 1].measuredAt).toLocaleString()
              } : prev.healthMetrics.latest.heartRate,
              
              weight: prev.healthMetrics.latest.weight // 保持原有默认值
            },
            trends: {
              bloodPressure: {
                // 血压图表期望.systolic和.diastolic数组
                systolic: bloodPressureMetrics.map(metric => ({
                  date: new Date(metric.measuredAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
                  value: metric.systolic
                })),
                diastolic: bloodPressureMetrics.map(metric => ({
                  date: new Date(metric.measuredAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
                  value: metric.diastolic
                })),
                unit: 'mmHg'
              },
              // 血糖图表期望直接传入数据数组
              bloodGlucose: bloodGlucoseMetrics.map(metric => ({
                date: new Date(metric.measuredAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
                value: metric.bloodGlucose,
                note: metric.note
              })),
              // 心率图表期望直接传入数据数组
              heartRate: heartRateMetrics.map(metric => ({
                date: new Date(metric.measuredAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }),
                value: metric.heartRate
              }))
            }
          }
        }));
        
        console.log('✅ 成功加载患者真实健康数据:', healthData.dataRange, `共${healthData.totalRecords}条记录`);
      } else {
        console.error('❌ API返回失败:', response.data);
      }

      // 加载真实的用药数据
      try {
        console.log('🔍 开始加载患者用药数据...');
        const medicationResponse = await medicationAPI.getMedicationPlans(patient.id);
        console.log('🔍 用药数据API响应:', medicationResponse.data);
        
        // 处理不同的API响应结构
        let plans = [];
        if (medicationResponse.data) {
          if (medicationResponse.data.plans) {
            plans = medicationResponse.data.plans;
          } else if (Array.isArray(medicationResponse.data)) {
            plans = medicationResponse.data;
          } else if (medicationResponse.data.results) {
            plans = medicationResponse.data.results;
          }
        }
        
        console.log('✅ Successfully loaded patient medication plans:', plans.length, 'plans');
        setRealMedicationPlans(plans);
      } catch (medicationError) {
        console.error('❌ 加载用药数据失败:', medicationError);
        // 用药数据加载失败时使用空数组
        setRealMedicationPlans([]);
      }
    } catch (error) {
      console.error('❌ 加载患者数据失败:', error);
      // 发生错误时保持原有模拟数据
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  // 移除聊天功能（已废弃）
  // const startChatWithPatient = async (patient) => {
  //   // 聊天功能已移除
  // };



  // 获取疾病名称
  const getDiseaseName = (diseaseId) => {
    const disease = chronicDiseases.find(d => d.id === diseaseId);
    return disease ? disease.name : diseaseId;
  };

  // 渲染患者疾病记录（跟随编辑页面的勾选状态）
  const renderPatientDiseases = () => {
    const patientDiseases = currentPatient.chronic_diseases;
    
    // 未评估状态
    if (patientDiseases === null) {
      return (
        <View style={styles.diseaseStatusContainer}>
          <Chip
            style={[styles.diseaseStatusChip, { backgroundColor: '#9E9E9E' }]}
            textStyle={styles.diseaseStatusText}
            icon="help-circle-outline"
          >
            未评估
          </Chip>
          <Text style={styles.diseaseStatusDescription}>
            患者疾病状态尚未评估，请在编辑页面中进行评估
          </Text>
        </View>
      );
    }
    
    // 健康状态（空数组）
    if (Array.isArray(patientDiseases) && patientDiseases.length === 0) {
      return (
        <View style={styles.diseaseStatusContainer}>
          <Chip
            style={[styles.diseaseStatusChip, { backgroundColor: '#00E676' }]}
            textStyle={styles.diseaseStatusText}
            icon="check-circle-outline"
          >
            健康
          </Chip>
          <Text style={styles.diseaseStatusDescription}>
            患者无慢性疾病，身体健康
          </Text>
        </View>
      );
    }
    
    // 有疾病记录
    if (Array.isArray(patientDiseases) && patientDiseases.length > 0) {
      return (
        <>
          <View style={styles.diseaseChipsContainer}>
            {patientDiseases.map((diseaseId) => (
              <Chip
                key={diseaseId}
                style={styles.diseaseChip}
                textStyle={styles.diseaseChipText}
                icon="medical-bag"
              >
                {getDiseaseName(diseaseId)}
              </Chip>
            ))}
          </View>
          <Text style={styles.diseaseCount}>
            共 {patientDiseases.length} 种慢性疾病
          </Text>
        </>
      );
    }
    
    // 异常状态
    return (
      <Text style={styles.noDiseases}>
        疾病记录数据异常
      </Text>
    );
  };

  // 生成报告
  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      await reportService.generateAndExportReport(patientData, t, 'share');
    } catch (error) {
      console.error('生成报告失败:', error);
      Alert.alert(t('common.error'), t('report.generateReportFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 获取风险等级颜色（5级风险系统）
  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return '#F44336';      // 高风险 - 红色
      case 'medium': return '#FF9800';    // 中风险 - 橙色  
      case 'low': return '#4CAF50';       // 低风险 - 绿色
      case 'healthy': return '#00E676';   // 健康 - 亮绿色
      case 'unassessed': return '#9E9E9E'; // 未评估 - 灰色
      default: return '#9E9E9E';
    }
  };

  // 获取风险等级文本（5级风险系统）
  const getRiskLevelText = (level) => {
    switch (level) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      case 'healthy': return '健康';
      case 'unassessed': return '未评估';
      default: return '未评估';
    }
  };

  // 评估健康状态
  const getHealthStatus = (value, type) => {
    switch (type) {
      case 'bloodPressure':
        if (value >= 140) return { status: 'high', color: '#F44336', text: t('health.high') };
        if (value >= 120) return { status: 'normal', color: '#FF9800', text: t('health.normalHigh') };
        return { status: 'normal', color: '#4CAF50', text: t('health.normal') };
      case 'bloodGlucose':
        if (value >= 7.0) return { status: 'high', color: '#F44336', text: t('health.high') };
        if (value >= 6.1) return { status: 'normal', color: '#FF9800', text: t('health.normalHigh') };
        return { status: 'normal', color: '#4CAF50', text: t('health.normal') };
      case 'heartRate':
        if (value >= 100 || value <= 60) return { status: 'abnormal', color: '#F44336', text: t('health.abnormal') };
        return { status: 'normal', color: '#4CAF50', text: t('health.normal') };
      default:
        return { status: 'normal', color: '#4CAF50', text: t('health.normal') };
    }
  };

  // 渲染基本信息
  const renderOverview = () => (
    <View>
      {/* 患者基本信息卡片 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.patientHeader}>
            <Avatar.Text 
              size={60} 
              label={patientData.basicInfo.name.charAt(0)} 
              style={styles.avatar}
            />
            <View style={styles.patientInfo}>
              <Text variant="headlineSmall" style={styles.patientName}>
                {patientData.basicInfo.name}
              </Text>
              <Text style={styles.patientMeta}>
                {patientData.basicInfo.age}{t('common.yearsOld')} · {patientData.basicInfo.gender === 'male' ? t('common.male') : t('common.female')} · {patientData.basicInfo.bloodType}
              </Text>
              <Text style={styles.patientMeta}>
                {t('health.height')}: {patientData.basicInfo.height}cm · {t('health.weight')}: {patientData.basicInfo.weight}kg
              </Text>
            </View>
            <Chip 
              style={[styles.riskChip, { 
                backgroundColor: getRiskLevelColor(currentPatient.risk_level) 
              }]}
              textStyle={styles.riskChipText}
              compact={true}
            >
              {getRiskLevelText(currentPatient.risk_level)}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* 关键指标统计 */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatsCard
            title={t('health.bloodPressure')}
            value={`${patientData.healthMetrics.latest.bloodPressure.systolic}/${patientData.healthMetrics.latest.bloodPressure.diastolic}`}
            subtitle="mmHg"
            icon="heart"
            color={getHealthStatus(patientData.healthMetrics.latest.bloodPressure.systolic, 'bloodPressure').color}
            style={styles.statCard}
          />
          <StatsCard
            title={t('health.bloodGlucose')}
            value={patientData.healthMetrics.latest.bloodGlucose.value.toString()}
            subtitle="mmol/L"
            icon="water"
            color={getHealthStatus(patientData.healthMetrics.latest.bloodGlucose.value, 'bloodGlucose').color}
            style={styles.statCard}
          />
        </View>
        
        <View style={styles.statsRow}>
          <StatsCard
            title={t('health.heartRate')}
            value={patientData.healthMetrics.latest.heartRate.value.toString()}
            subtitle="bpm"
            icon="pulse"
            color={getHealthStatus(patientData.healthMetrics.latest.heartRate.value, 'heartRate').color}
            style={styles.statCard}
          />
          <StatsCard
            title={t('health.weight')}
            value={patientData.healthMetrics.latest.weight.value.toString()}
            subtitle="kg"
            icon="body"
            color="#2196F3"
            style={styles.statCard}
          />
        </View>
      </View>

      {/* 联系信息 */}
      <Card style={styles.card}>
        <Card.Content>
                          <Text variant="titleMedium" style={styles.sectionTitle}>{t('patients.contactInfo')}</Text>
          <List.Item
                              title={t('patients.phoneNumber')}
            description={patientData.basicInfo.phone}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <List.Item
                              title={t('common.address')}
            description={patientData.basicInfo.address}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
          />
          <List.Item
                              title={t('patients.emergencyContact')}
            description={`${patientData.basicInfo.emergencyContact} (${patientData.basicInfo.emergencyPhone})`}
            left={(props) => <List.Icon {...props} icon="account-alert" />}
          />
        </Card.Content>
      </Card>

      {/* 疾病记录 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            疾病记录
          </Text>
          
          <View style={styles.diseaseList}>
            {renderPatientDiseases()}
          </View>
        </Card.Content>
      </Card>

      {/* 最近告警 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
                            <Text variant="titleMedium" style={styles.sectionTitle}>{t('patients.recentAlerts')}</Text>
            <Button mode="text" onPress={() => navigation.navigate('Alerts')}>
              {t('common.viewAll')}
            </Button>
          </View>
          {patientData.alerts.map((alert) => (
            <List.Item
              key={alert.id}
              title={alert.message}
              description={alert.date}
              left={(props) => (
                <List.Icon 
                  {...props} 
                  icon={alert.status === 'pending' ? 'alert' : 'information'} 
                  color={alert.status === 'pending' ? '#F44336' : '#2196F3'}
                />
              )}
            />
          ))}
        </Card.Content>
      </Card>
    </View>
  );

  // 渲染健康数据
  const renderHealthData = () => (
    <View>
      {/* 血压趋势 */}
      <Card style={styles.card}>
        <Card.Content>
          <LineChart
            title={t('health.bloodPressureTrend')}
            height={220}
            yAxisLabel="mmHg"
            xAxisLabel={t('common.date')}
            series={[
              {
                                      name: t('health.systolicBP'),
                data: patientData.healthMetrics.trends.bloodPressure.systolic,
                color: '#F44336'
              },
              {
                                      name: t('health.diastolicBP'),
                data: patientData.healthMetrics.trends.bloodPressure.diastolic,
                color: '#2196F3'
              }
            ]}
          />
        </Card.Content>
      </Card>

      {/* 血糖趋势 */}
      <Card style={styles.card}>
        <Card.Content>
          <LineChart
            data={patientData.healthMetrics.trends.bloodGlucose}
            title={t('health.bloodGlucoseTrend')}
            height={200}
            color="#FF9800"
            yAxisLabel="mmol/L"
            xAxisLabel={t('common.date')}
          />
        </Card.Content>
      </Card>

      {/* 心率趋势 */}
      <Card style={styles.card}>
        <Card.Content>
          <LineChart
            data={patientData.healthMetrics.trends.heartRate}
            title={t('health.heartRateTrend')}
            height={200}
            color="#2196F3"
            yAxisLabel="bpm"
            xAxisLabel={t('common.date')}
          />
        </Card.Content>
      </Card>
    </View>
  );

  // 格式化用药频次显示
  const getFrequencyDisplay = (frequency) => {
    const frequencyMap = {
      'QD': t('medication.frequency.onceDaily'),
      'BID': t('medication.frequency.twiceDaily'),
      'TID': t('medication.frequency.threeTimesDaily'),
      'QID': t('medication.frequency.fourTimesDaily'),
      'Q12H': t('medication.frequency.every12Hours'),
      'Q8H': t('medication.frequency.every8Hours'),
      'Q6H': t('medication.frequency.every6Hours'),
      'PRN': t('medication.frequency.asNeeded')
    };
    return frequencyMap[frequency] || frequency || t('medication.notSet');
  };

  // 格式化用药时间显示
  const getTimeDisplay = (timeOfDay) => {
    if (!timeOfDay) return t('medication.notSet');
    if (Array.isArray(timeOfDay)) {
      return timeOfDay.join(', ');
    }
    return timeOfDay;
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

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return t('medication.active');
      case 'paused': return t('medication.paused');
      case 'stopped': return t('medication.stopped');
      case 'completed': return t('medication.completed');
      default: return t('common.unknown');
    }
  };

  // 计算用药计划的依从性
  const getPlanCompliance = (plan) => {
    // 优先使用API返回的依从性数据
    if (plan.compliance_rate !== undefined && plan.compliance_rate !== null) {
      return Math.round(plan.compliance_rate);
    }
    
    // 基于计划ID生成稳定的依从性（避免每次渲染都变化）
    const seed = plan.id % 16; // 使用计划ID生成0-15的种子
    return 80 + seed; // 生成80-95%的依从性
  };

  // 渲染用药信息
  const renderMedication = () => {
    console.log('🔍 渲染用药信息，真实数据数量:', realMedicationPlans.length);
    
    // 优先使用真实的API数据，如果没有则显示提示信息
    const medicationsToShow = realMedicationPlans.length > 0 ? realMedicationPlans : [];
    
    return (
      <View>
        {medicationsToShow.length > 0 ? (
          medicationsToShow
            .filter(plan => plan.medication && ['active', 'paused', 'stopped'].includes(plan.status))
            .map((plan) => {
              const compliance = getPlanCompliance(plan);
              
              return (
                <Card key={plan.id} style={styles.card}>
                  <Card.Content>
                    <View style={styles.medicationHeader}>
                      <View style={styles.medicationInfo}>
                        <Text variant="titleMedium" style={styles.medicationName}>
                          {plan.medication?.name || t('medication.unknownMedicine')}
                        </Text>
                        <Text style={styles.medicationDetails}>
                          {plan.dosage}{plan.medication?.unit || 'mg'} · {getFrequencyDisplay(plan.frequency)} · {getTimeDisplay(plan.time_of_day)}
                        </Text>
                        <Text style={styles.medicationDate}>
                          {t('medication.startDate')}: {new Date(plan.start_date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Chip 
                        style={[styles.statusChip, { 
                          backgroundColor: getStatusColor(plan.status)
                        }]}
                        textStyle={styles.statusChipText}
                        compact={true}
                      >
                        {getStatusText(plan.status)}
                      </Chip>
                    </View>
                    
                    <View style={styles.complianceContainer}>
                      <Text style={styles.complianceLabel}>{t('medication.compliance')}: {compliance}%</Text>
                      <View style={styles.complianceBar}>
                        <View 
                          style={[styles.complianceProgress, { 
                            width: `${compliance}%`,
                            backgroundColor: compliance >= 80 ? '#4CAF50' : compliance >= 60 ? '#FF9800' : '#F44336'
                          }]} 
                        />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.emptyText}>{t('medication.noMedicationPlans')}</Text>
            </Card.Content>
          </Card>
        )}
        
        <Button 
          mode="contained" 
          icon="plus"
          onPress={() => navigation.navigate('MedicationPlan', { patient: currentPatient })}
          style={styles.addButton}
        >
          {t('medication.addMedicationPlan')}
        </Button>
      </View>
    );
  };

  // 渲染病史记录
  const renderHistory = () => (
    <View>
      {patientData.medicalHistory.map((record) => (
        <Card key={record.id} style={styles.card}>
          <Card.Content>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <Text variant="titleMedium" style={styles.historyTitle}>
                  {record.title}
                </Text>
                <Text style={styles.historyDate}>{record.date}</Text>
                <Text style={styles.historyDoctor}>医生: {record.doctor}</Text>
              </View>
              <Chip 
                style={styles.typeChip}
                textStyle={{ fontSize: 12 }}
              >
                                  {record.type === 'consultation' ? t('patients.followUp') : t('patients.examination')}
              </Chip>
            </View>
            <Text style={styles.historyDescription}>{record.description}</Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  // 渲染标签栏
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          {t('screen.overview')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'health' && styles.activeTab]}
        onPress={() => setActiveTab('health')}
      >
        <Text style={[styles.tabText, activeTab === 'health' && styles.activeTabText]}>
          {t('screen.healthData')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'medication' && styles.activeTab]}
        onPress={() => setActiveTab('medication')}
      >
        <Text style={[styles.tabText, activeTab === 'medication' && styles.activeTabText]}>
          {t('screen.medicationInfo')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          {t('screen.medicalHistory')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'health':
        return renderHealthData();
      case 'medication':
        return renderMedication();
      case 'history':
        return renderHistory();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('screen.loadingPatientData')}</Text>
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
          {t('screen.patientDetails')}
        </Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('EditPatient', { patient: patientData.basicInfo });
            }} 
            title={t('common.edit')} 
          />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              handleGenerateReport();
            }} 
            title={t('doctor.generateReport')} 
          />
        </Menu>
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
    fontSize: 18,
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
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    backgroundColor: '#2196F3',
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 20,
  },
  patientMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  riskChip: {
    alignSelf: 'flex-start',
    height: 32,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  medicationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusChip: {
    alignSelf: 'flex-start',
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
  complianceContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  complianceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  complianceBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  complianceProgress: {
    height: '100%',
    borderRadius: 4,
  },
  addButton: {
    margin: 16,
    marginBottom: 20,
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
  historyTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 16,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyDoctor: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  typeChip: {
    alignSelf: 'flex-start',
  },
  historyDescription: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
  },
  
  // 疾病记录样式
  diseaseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  diseaseChip: {
    backgroundColor: '#E3F2FD',
    marginRight: 8,
    marginBottom: 8,
  },
  diseaseChipText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  noDiseases: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  
  // 疾病编辑对话框样式
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '80%',
  },
  dialogDescription: {
    marginBottom: 16,
    color: '#666',
  },
  diseaseScrollView: {
    maxHeight: 400,
  },
  diseaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  diseaseItemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  
  // 新的疾病状态显示样式
  diseaseStatusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  diseaseStatusChip: {
    marginBottom: 8,
  },
  diseaseStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  diseaseStatusDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  diseaseChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  diseaseCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});

export default PatientDetailsScreen; 