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
  Divider,
  TextInput
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// 导入图表组件
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';
import StatsCard from '../../components/StatsCard';
import { api, medicationAPI, patientsAPI } from '../../services/api';
import reportService from '../../services/reportService';
import { resolvePatientRiskLevel, getRiskColor as getUnifiedRiskColor, getRiskText as getUnifiedRiskText } from '../../utils/riskUtils';

const PatientDetailsScreen = ({ route, navigation }) => {
  const { patient } = route.params || {};
  const { t, ready } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, health, medication, history
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(patient); // 跟踪最新的患者信息
  const [realMedicationPlans, setRealMedicationPlans] = useState([]); // 真实的用药计划数据
  const [medicationStatsMap, setMedicationStatsMap] = useState({}); // 计划ID -> 依从率

  // 等待国际化系统准备就绪
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>正在加载国际化资源...</Text>
      </View>
    );
  }

  // 检查导航状态
  useEffect(() => {
    console.log('🔍 检查导航状态:');
    console.log('  - 当前路由参数:', route.params);
    console.log('  - 可以返回:', navigation.canGoBack());
    console.log('  - 导航状态:', navigation.getState());
  }, [route.params, navigation]);

  // 安全的t函数包装器
  const safeT = (key, options) => {
    if (typeof t !== 'function') {
      console.error('❌ t函数未定义，使用默认值:', key);
      // 返回默认值或键名
      return key.includes('health.high') ? '高' :
             key.includes('health.normal') ? '正常' :
             key.includes('health.normalHigh') ? '正常偏高' :
             key.includes('health.abnormal') ? '异常' :
             key.includes('health.height') ? '身高' :
             key.includes('health.weight') ? '体重' :
             key.includes('health.bloodPressure') ? '血压' :
             key.includes('health.bloodGlucose') ? '血糖' :
             key.includes('health.heartRate') ? '心率' :
             key.includes('health.bloodPressureTrend') ? '血压趋势' :
             key.includes('health.bloodGlucoseTrend') ? '血糖趋势' :
             key.includes('health.heartRateTrend') ? '心率趋势' :
             key.includes('health.systolicBP') ? '收缩压' :
             key.includes('health.diastolicBP') ? '舒张压' :
             key.includes('health.lifestyle') ? '生活方式' :
             key.includes('screen.healthData') ? '健康数据' :
             key.includes('patients.diseaseStatus.healthy') ? '健康' :
             key.includes('patients.diseaseStatus.healthyDescription') ? '患者无慢性疾病，身体健康' :
             key.includes('common.date') ? '日期' :
             key.includes('medication.frequency.onceDaily') ? '每日一次' :
             key.includes('medication.frequency.twiceDaily') ? '每日两次' :
             key.includes('medication.frequency.threeTimesDaily') ? '每日三次' :
             key.includes('medication.frequency.fourTimesDaily') ? '每日四次' :
             key.includes('medication.frequency.every12Hours') ? '每12小时一次' :
             key.includes('medication.frequency.every8Hours') ? '每8小时一次' :
             key.includes('medication.frequency.every6Hours') ? '每6小时一次' :
             key.includes('medication.frequency.asNeeded') ? '按需服用' :
             key.includes('medication.notSet') ? '未设置' :
             key.includes('medication.active') ? '进行中' :
             key.includes('medication.paused') ? '暂停' :
             key.includes('medication.stopped') ? '已停止' :
             key.includes('medication.completed') ? '已完成' :
             key.includes('common.unknown') ? '未知' :
             key.includes('patients.diseaseStatus.unevaluated') ? '未评估' :
             key.includes('patients.diseaseStatus.unevaluatedDescription') ? '患者疾病状态尚未评估' :
             key.includes('patients.diseaseCount') ? `${options?.count || 0}种慢性疾病` :
             key.includes('patients.diseaseStatus.dataError') ? '数据错误' :
             key.includes('patients.contactInfo') ? '联系信息' :
             key.includes('patients.phoneNumber') ? '电话号码' :
             key.includes('common.address') ? '地址' :
             key.includes('patients.emergencyContact') ? '紧急联系人' :
             key.includes('patients.diseaseRecord') ? '疾病记录' :
             key.includes('medication.unknownMedicine') ? '未知药物' :
             key.includes('medication.startDate') ? '开始日期' :
             key.includes('medication.compliance') ? '依从性' :
             key.includes('medication.addMedicationPlan') ? '添加用药计划' :
             key.includes('screen.overview') ? '概览' :
             key.includes('screen.medicationInfo') ? '用药信息' :
             key.includes('screen.medicalHistory') ? '病史记录' :
             key.includes('screen.loadingPatientData') ? '正在加载患者数据...' :
             key.includes('screen.patientDetails') ? '患者详情' :
             key.includes('common.edit') ? '编辑' :
             key.includes('doctor.generateReport') ? '生成报告' :
             key.includes('common.error') ? '错误' :
             key.includes('report.generateReportFailed') ? '生成报告失败' :
             key.includes('common.yearsOld') ? '岁' :
             key.includes('common.male') ? '男' :
             key.includes('common.female') ? '女' :
             key.includes('patients.followUp') ? '随访' :
             key.includes('patients.examination') ? '检查' :
             key.includes('medication.medication') ? '用药' :
             key.includes('common.note') ? '备注' :
             key.includes('patients.saveAdviceFailed') ? '保存建议失败' :
             key.includes('common.confirm') ? '确认' :
             key.includes('patients.deleteAdviceConfirm') ? '确认删除该建议吗？' :
             key.includes('common.cancel') ? '取消' :
             key.includes('common.delete') ? '删除' :
             key.includes('patients.deleteAdviceFailed') ? '删除建议失败' :
             key.includes('patients.doctor') ? '医生' :
             key.includes('patients.noAdvice') ? '暂无建议' :
             key.includes('patients.addAdvice') ? '新增建议' :
             key.includes('common.create') ? '新增' :
             key.includes('patients.adviceType') ? '建议类型' :
             key.includes('common.content') ? '内容' :
             key.includes('common.save') ? '保存' :
             key.includes('medication.noMedicationPlans') ? '暂无用药计划' :
             key.includes('medication.contactDoctorForPlan') ? '请联系医生制定用药计划' :
             key;
    }
    try {
      return t(key, options);
    } catch (error) {
      console.error('❌ t函数调用失败:', error, 'key:', key);
      return key; // 返回键名作为回退
    }
  };

  // 慢性疾病列表（延迟初始化，确保国际化系统准备好）
  const chronicDiseases = [
    { id: 'alzheimer', name: safeT('diseases.alzheimer') },
    { id: 'arthritis', name: safeT('diseases.arthritis') },
    { id: 'asthma', name: safeT('diseases.asthma') },
    { id: 'cancer', name: safeT('diseases.cancer') },
    { id: 'copd', name: safeT('diseases.copd') },
    { id: 'crohn', name: safeT('diseases.crohn') },
    { id: 'cystic_fibrosis', name: safeT('diseases.cysticFibrosis') },
    { id: 'dementia', name: safeT('diseases.dementia') },
    { id: 'diabetes', name: safeT('diseases.diabetes') },
    { id: 'endometriosis', name: safeT('diseases.endometriosis') },
    { id: 'epilepsy', name: safeT('diseases.epilepsy') },
    { id: 'fibromyalgia', name: safeT('diseases.fibromyalgia') },
    { id: 'heart_disease', name: safeT('diseases.heartDisease') },
    { id: 'hypertension', name: safeT('diseases.hypertension') },
    { id: 'hiv_aids', name: safeT('diseases.hivAids') },
    { id: 'migraine', name: safeT('diseases.migraine') },
    { id: 'mood_disorder', name: safeT('diseases.moodDisorder') },
    { id: 'multiple_sclerosis', name: safeT('diseases.multipleSclerosis') },
    { id: 'narcolepsy', name: safeT('diseases.narcolepsy') },
    { id: 'parkinson', name: safeT('diseases.parkinson') },
    { id: 'sickle_cell', name: safeT('diseases.sickleCell') },
    { id: 'ulcerative_colitis', name: safeT('diseases.ulcerativeColitis') }
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
    medications: [], // 移除硬编码，使用真实API数据
    alerts: [], // 移除硬编码，使用真实API数据
    medicalHistory: [] // 移除硬编码，使用真实API数据
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
      // 获取患者基本信息，包括最新的疾病列表
      const response = await api.get(`/accounts/patients/${patient.id}/update/`);
      if (response.data) {
        // 更新患者基本信息，特别是chronic_diseases和计算后的风险等级
        const updatedPatientInfo = {
          ...currentPatient,
          chronic_diseases: response.data.chronic_diseases,
          // 风险等级不再从后端字段覆盖，统一由疾病列表推断，保持前后页面一致
          risk_level: resolvePatientRiskLevel({ chronic_diseases: response.data.chronic_diseases })
        };
        
        // 更新本地状态，触发重新渲染
        setCurrentPatient(updatedPatientInfo);
        
        // 同时更新navigation的参数，这样返回时患者列表也会显示正确信息
        navigation.setParams({ patient: updatedPatientInfo });
        
  
      }
    } catch (error) {
      console.error('获取患者基本信息失败:', error);
    }
  };

  // 兼容旧代码：移除本地硬编码的风险判断，统一走 riskUtils

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
        

      } else {
        console.error('❌ API返回失败:', response.data);
      }

      // 加载真实的用药数据
      try {
        const medicationResponse = await medicationAPI.getMedicationPlans(patient.id);
        
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
        
        setRealMedicationPlans(plans);
        console.log('👨‍⚕️ 医生端获取的用药计划:', plans);
        console.log('👨‍⚕️ 医生端用药计划详情:', plans.map(plan => ({
          id: plan.id,
          name: plan.medication?.name,
          status: plan.status,
          time_of_day: plan.time_of_day,
          frequency: plan.frequency,
          dosage: plan.dosage
        })));

        // 加载依从性统计，构建 planId -> compliance_rate 映射
        try {
          const statsRes = await medicationAPI.getMedicationStats(patient.id);
          const statsData = statsRes?.data || {};
          const map = {};
          if (Array.isArray(statsData.plans)) {
            statsData.plans.forEach(p => {
              if (p && p.id !== undefined && p.compliance_rate !== undefined) map[p.id] = p.compliance_rate;
            });
          }
          if (Array.isArray(statsData.results)) {
            statsData.results.forEach(p => {
              const pid = p.id ?? p.plan_id;
              if (pid !== undefined && p.compliance_rate !== undefined) map[pid] = p.compliance_rate;
            });
          }
          if (statsData.compliance_by_plan && typeof statsData.compliance_by_plan === 'object') {
            Object.entries(statsData.compliance_by_plan).forEach(([k, v]) => {
              const pid = Number(k);
              if (!Number.isNaN(pid)) map[pid] = v;
            });
          }
          setMedicationStatsMap(map);
        } catch (statsErr) {
          console.warn('⚠️ 加载依从性统计失败:', statsErr?.message);
          setMedicationStatsMap({});
        }
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
            {safeT('patients.diseaseStatus.unevaluated')}
          </Chip>
          <Text style={styles.diseaseStatusDescription}>
            {safeT('patients.diseaseStatus.unevaluatedDescription')}
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
            {safeT('patients.diseaseStatus.healthy')}
          </Chip>
          <Text style={styles.diseaseStatusDescription}>
            {safeT('patients.diseaseStatus.healthyDescription')}
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
            {safeT('patients.diseaseCount', { count: patientDiseases.length })}
          </Text>
        </>
      );
    }
    
    // 异常状态
    return (
      <Text style={styles.noDiseases}>
        {safeT('patients.diseaseStatus.dataError')}
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
      Alert.alert(safeT('common.error'), safeT('report.generateReportFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 获取风险等级颜色（5级风险系统）
  const getRiskLevelColor = (level) => getUnifiedRiskColor(level);

  // 获取风险等级文本（5级风险系统）
  const getRiskLevelText = (level) => getUnifiedRiskText(level, t);

  // 获取健康指标状态
  const getHealthStatus = (type, value) => {
    switch (type) {
      case 'bloodPressure':
        if (value >= 140) return { status: 'high', color: '#F44336', text: safeT('health.high') };
        if (value >= 120) return { status: 'normal', color: '#FF9800', text: safeT('health.normalHigh') };
        return { status: 'normal', color: '#4CAF50', text: safeT('health.normal') };
      case 'bloodGlucose':
        if (value >= 7.0) return { status: 'high', color: '#F44336', text: safeT('health.high') };
        if (value >= 6.1) return { status: 'normal', color: '#FF9800', text: safeT('health.normalHigh') };
        return { status: 'normal', color: '#4CAF50', text: safeT('health.normal') };
      case 'heartRate':
        if (value >= 100 || value <= 60) return { status: 'abnormal', color: '#F44336', text: safeT('health.abnormal') };
        return { status: 'normal', color: '#4CAF50', text: safeT('health.normal') };
      default:
        return { status: 'normal', color: '#4CAF50', text: safeT('health.normal') };
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
                {patientData.basicInfo.age}{safeT('common.yearsOld')} · {patientData.basicInfo.gender === 'male' ? safeT('common.male') : safeT('common.female')} · {patientData.basicInfo.bloodType}
              </Text>
              <Text style={styles.basicInfoText}>
                {safeT('health.height')}: {patientData.basicInfo.height}cm · {safeT('health.weight')}: {patientData.basicInfo.weight}kg
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
            title={safeT('health.bloodPressure')}
            value={`${patientData.healthMetrics.latest.bloodPressure.systolic}/${patientData.healthMetrics.latest.bloodPressure.diastolic}`}
            subtitle="mmHg"
            icon="heart"
            color={getHealthStatus('bloodPressure', patientData.healthMetrics.latest.bloodPressure.systolic).color}
            style={styles.statCard}
          />
          <StatsCard
            title={safeT('health.bloodGlucose')}
            value={patientData.healthMetrics.latest.bloodGlucose.value.toString()}
            subtitle="mmol/L"
            icon="water"
            color={getHealthStatus('bloodGlucose', patientData.healthMetrics.latest.bloodGlucose.value).color}
            style={styles.statCard}
          />
        </View>
        
        <View style={styles.statsRow}>
          <StatsCard
            title={safeT('health.heartRate')}
            value={patientData.healthMetrics.latest.heartRate.value.toString()}
            subtitle="bpm"
            icon="pulse"
            color={getHealthStatus('heartRate', patientData.healthMetrics.latest.heartRate.value).color}
            style={styles.statCard}
          />
          <StatsCard
            title={safeT('health.weight')}
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
                          <Text variant="titleMedium" style={styles.sectionTitle}>{safeT('patients.contactInfo')}</Text>
          <List.Item
                              title={safeT('patients.phoneNumber')}
            description={patientData.basicInfo.phone}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <List.Item
                              title={safeT('common.address')}
            description={patientData.basicInfo.address}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
          />
          <List.Item
                              title={safeT('patients.emergencyContact')}
            description={`${patientData.basicInfo.emergencyContact} (${patientData.basicInfo.emergencyPhone})`}
            left={(props) => <List.Icon {...props} icon="account-alert" />}
          />
        </Card.Content>
      </Card>

      {/* 疾病记录 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {safeT('patients.diseaseRecord')}
          </Text>
          
          <View style={styles.diseaseList}>
            {renderPatientDiseases()}
          </View>
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
            title={safeT('health.bloodPressureTrend')}
            height={220}
            yAxisLabel="mmHg"
            xAxisLabel={safeT('common.date')}
            series={[
              {
                name: safeT('health.systolicBP'),
                data: patientData.healthMetrics.trends.bloodPressure.systolic,
                color: '#F44336'
              },
              {
                name: safeT('health.diastolicBP'),
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
            title={safeT('health.bloodGlucoseTrend')}
            height={200}
            color="#FF9800"
            yAxisLabel="mmol/L"
            xAxisLabel={safeT('common.date')}
          />
        </Card.Content>
      </Card>

      {/* 心率趋势 */}
      <Card style={styles.card}>
        <Card.Content>
          <LineChart
            data={patientData.healthMetrics.trends.heartRate}
            title={safeT('health.heartRateTrend')}
            height={200}
            color="#2196F3"
            yAxisLabel="bpm"
            xAxisLabel={safeT('common.date')}
          />
        </Card.Content>
      </Card>
    </View>
  );

  // 格式化用药频次显示
  const getFrequencyDisplay = (frequency) => {
    const frequencyMap = {
      'QD': safeT('medication.frequency.onceDaily'),
      'BID': safeT('medication.frequency.twiceDaily'),
      'TID': safeT('medication.frequency.threeTimesDaily'),
      'QID': safeT('medication.frequency.fourTimesDaily'),
      'Q12H': safeT('medication.frequency.every12Hours'),
      'Q8H': safeT('medication.frequency.every8Hours'),
      'Q6H': safeT('medication.frequency.every6Hours'),
      'PRN': safeT('medication.frequency.asNeeded')
    };
    return frequencyMap[frequency] || frequency || safeT('medication.notSet');
  };

  // 格式化用药时间显示
  const getTimeDisplay = (timeOfDay) => {
    if (!timeOfDay) return safeT('medication.notSet');
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
      case 'active': return safeT('medication.active');
      case 'paused': return safeT('medication.paused');
      case 'stopped': return safeT('medication.stopped');
      case 'completed': return safeT('medication.completed');
      default: return safeT('common.unknown');
    }
  };

  // 计算用药计划的依从性（不再硬编码，缺失则显示“—”）
  const getPlanCompliance = (plan) => {
    if (!plan) return null;
    if (plan.compliance_rate !== undefined && plan.compliance_rate !== null) {
      return Math.round(plan.compliance_rate);
    }
    if (medicationStatsMap && medicationStatsMap[plan.id] !== undefined) {
      return Math.round(medicationStatsMap[plan.id]);
    }
    return null;
  };

    // 渲染用药信息
  const renderMedication = () => {
    return (
      <View>
        {/* 用药计划列表 */}
        {realMedicationPlans && realMedicationPlans.length > 0 ? (
          realMedicationPlans
            .filter(plan => plan.medication && ['active', 'paused', 'stopped'].includes(plan.status))
            .map((plan) => {
              const compliance = getPlanCompliance(plan);
              
              return (
                <Card key={plan.id} style={styles.card}>
                  <Card.Content>
                    <View style={styles.medicationHeader}>
                      <View style={styles.medicationInfo}>
                        <Text variant="titleMedium" style={styles.medicationName}>
                          {plan.medication?.name || safeT('medication.unknownMedicine')}
                        </Text>
                        <Text style={styles.medicationDetails}>
                          {plan.dosage}{plan.medication?.unit || 'mg'} · {getFrequencyDisplay(plan.frequency)} · {getTimeDisplay(plan.time_of_day)}
                        </Text>
                        <Text style={styles.medicationDate}>
                          {safeT('medication.startDate')}: {new Date(plan.start_date).toLocaleDateString()}
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
                      <Text style={styles.complianceLabel}>{safeT('medication.compliance')}: {compliance}%</Text>
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
          /* 空状态显示 */
          <View style={styles.noDataContainer}>
            <Ionicons name="medical-outline" size={48} color="#ccc" style={styles.emptyStateIcon} />
            <Text style={styles.noDataText}>{safeT('medication.noMedicationPlans')}</Text>
            <Text style={styles.noDataSubtext}>{safeT('medication.contactDoctorForPlan')}</Text>
          </View>
        )}
        
        {/* 添加用药计划按钮 - 始终显示 */}
        <Button 
          mode="contained" 
          icon="plus"
          onPress={() => navigation.navigate('MedicationPlan', { patient: currentPatient })}
          style={styles.addButton}
        >
          {safeT('medication.addMedicationPlan')}
        </Button>
      </View>
    );
  };

  // 建议类型映射
  const adviceTypeText = (advice_type) => {
    switch (advice_type) {
      case 'follow_up':
      case 'general':
        return safeT('patients.followUp') || 'Follow-up';
      case 'examination':
        return safeT('patients.examination') || 'Examination';
      case 'medication':
        return safeT('medication.medication') || 'Medication';
      case 'lifestyle':
        return safeT('health.lifestyle') || 'Lifestyle';
      default:
        return safeT('common.note') || 'Note';
    }
  };

  // 加载患者建议列表
  const [adviceList, setAdviceList] = useState([]);
  const loadPatientAdvice = async () => {
    try {
      const res = await patientsAPI.getPatientAdvice(currentPatient.id);
      if (res.data && res.data.success) {
        setAdviceList(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setAdviceList(res.data);
      }
    } catch (e) {
      console.error('加载建议失败:', e);
      setAdviceList([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && currentPatient?.id) {
      loadPatientAdvice();
    }
  }, [activeTab, currentPatient?.id]);

  // 渲染建议（替代硬编码病史）
  const [editingAdvice, setEditingAdvice] = useState(null);
  const [adviceEditorVisible, setAdviceEditorVisible] = useState(false);
  const [adviceForm, setAdviceForm] = useState({ content: '', advice_type: 'general' });

  const openCreateAdvice = () => {
    setEditingAdvice(null);
    setAdviceForm({ content: '', advice_type: 'general' });
    setAdviceEditorVisible(true);
  };

  const openEditAdvice = (item) => {
    setEditingAdvice(item);
    setAdviceForm({ content: item.content || '', advice_type: item.advice_type || 'general' });
    setAdviceEditorVisible(true);
  };

  const saveAdvice = async () => {
    try {
      if (!currentPatient?.id) return;
      if (editingAdvice) {
        await patientsAPI.updatePatientAdvice(editingAdvice.id, adviceForm);
      } else {
        await patientsAPI.createPatientAdvice(currentPatient.id, adviceForm);
      }
      setAdviceEditorVisible(false);
      await loadPatientAdvice();
    } catch (e) {
      console.error('保存建议失败:', e);
      Alert.alert(safeT('common.error'), safeT('patients.saveAdviceFailed') || '保存建议失败');
    }
  };

  const deleteAdvice = async (item) => {
    Alert.alert(safeT('common.confirm'), safeT('patients.deleteAdviceConfirm') || '确认删除该建议吗？', [
      { text: safeT('common.cancel') },
      { text: safeT('common.delete'), style: 'destructive', onPress: async () => {
        try {
          await patientsAPI.deletePatientAdvice(item.id);
          await loadPatientAdvice();
        } catch (e) {
          console.error('删除建议失败:', e);
          Alert.alert(safeT('common.error'), safeT('patients.deleteAdviceFailed') || '删除建议失败');
        }
      }}
    ]);
  };

  const renderHistory = () => (
    <View>
      {adviceList.map((item) => (
        <Card key={item.id} style={styles.card}>
          <Card.Content>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <Text variant="titleMedium" style={styles.historyTitle}>
                  {item.title || adviceTypeText(item.advice_type)}
                </Text>
                <Text style={styles.historyDate}>{(item.advice_time && new Date(item.advice_time).toLocaleDateString()) || ''}</Text>
                <Text style={styles.historyDoctor}>{safeT('patients.doctor') || '医生'}: {item.doctor_name || ''}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Chip style={styles.typeChip} textStyle={{ fontSize: 12 }}>
                  {adviceTypeText(item.advice_type)}
                </Chip>
                {/* 仅医生端显示编辑/删除 */}
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  <Button mode="text" onPress={() => openEditAdvice(item)}>{safeT('common.edit')}</Button>
                  <Button mode="text" onPress={() => deleteAdvice(item)}>{safeT('common.delete')}</Button>
                </View>
              </View>
            </View>
            <Text style={styles.historyDescription}>{item.content}</Text>
          </Card.Content>
        </Card>
      ))}
      {adviceList.length === 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyText}>{safeT('patients.noAdvice')}</Text>
          </Card.Content>
        </Card>
      )}
      {/* 新增建议（仅医生端显示按钮） */}
      <Button mode="contained" icon="plus" style={{ margin: 16 }} onPress={openCreateAdvice}>
        {safeT('patients.addAdvice') || '新增建议'}
      </Button>

      {/* 弹窗编辑器 */}
      {adviceEditorVisible && (
        <Card style={[styles.card, { margin: 16 }]}> 
          <Card.Content>
            <Text style={styles.historyTitle}>{editingAdvice ? (safeT('common.edit') || '编辑') : (safeT('common.create') || '新增')}</Text>
            <View style={{ height: 8 }} />
            <Text>{safeT('patients.adviceType') || '类型'}</Text>
            <View style={{ height: 8 }} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['general','medication','lifestyle','examination','follow_up'].map(tp => (
                <Chip key={tp} selected={adviceForm.advice_type===tp} onPress={() => setAdviceForm({ ...adviceForm, advice_type: tp })}>
                  {adviceTypeText(tp)}
                </Chip>
              ))}
            </View>
            <View style={{ height: 12 }} />
            <Text>{safeT('common.content') || '内容'}</Text>
            <View style={{ height: 8 }} />
            <TextInput
              multiline
              numberOfLines={4}
              mode="outlined"
              value={adviceForm.content}
              onChangeText={(v) => setAdviceForm({ ...adviceForm, content: v })}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <Button onPress={() => setAdviceEditorVisible(false)}>{safeT('common.cancel')}</Button>
              <Button onPress={saveAdvice}>{safeT('common.save')}</Button>
            </View>
          </Card.Content>
        </Card>
      )}
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
          {safeT('screen.overview')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'health' && styles.activeTab]}
        onPress={() => setActiveTab('health')}
      >
        <Text style={[styles.tabText, activeTab === 'health' && styles.activeTabText]}>
          {safeT('screen.healthData')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'medication' && styles.activeTab]}
        onPress={() => setActiveTab('medication')}
      >
        <Text style={[styles.tabText, activeTab === 'medication' && styles.activeTabText]}>
          {safeT('screen.medicationInfo')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          {safeT('screen.medicalHistory')}
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
          <Text style={styles.loadingText}>{safeT('screen.loadingPatientData')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 自定义头部 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          activeOpacity={0.6}
          onPress={() => {
            try {
              const originTab = route.params?.originTab;
              console.log('🔙 后退键被点击，originTab:', originTab);
              
              if (originTab && originTab !== 'Patients') {
                // 如果有特定的返回目标，导航到那里
                console.log('📍 导航到指定页面:', originTab);
                navigation.navigate(originTab);
              } else {
                // 否则尝试返回上一页
                console.log('⬅️ 执行 goBack()');
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  // 如果不能返回，导航到患者列表
                  console.log('🔄 无法返回，导航到患者列表');
                  navigation.navigate('Patients');
                }
              }
            } catch (error) {
              console.error('❌ 后退导航失败:', error);
              // 如果所有导航都失败，尝试重置到患者列表
              try {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Patients' }],
                });
              } catch (resetError) {
                console.error('❌ 重置导航也失败:', resetError);
              }
            }
          }}
          onLongPress={() => {
            // 长按作为备用方案，强制返回患者列表
            console.log('🔙 后退键长按，强制返回患者列表');
            try {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Patients' }],
              });
            } catch (error) {
              console.error('❌ 长按导航也失败:', error);
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {safeT('screen.patientDetails')}
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
              navigation.navigate('EditPatient', { 
                patient: patientData.basicInfo,
                onSaved: (updatedPatient) => {
                  // 收到编辑页回传后，统一更新本页状态与路由参数
                  setCurrentPatient(updatedPatient);
                  navigation.setParams({ patient: updatedPatient });
                }
              });
            }} 
            title={safeT('common.edit')} 
          />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              handleGenerateReport();
            }} 
            title={safeT('doctor.generateReport')} 
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
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  addButton: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  basicInfoText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default PatientDetailsScreen; 