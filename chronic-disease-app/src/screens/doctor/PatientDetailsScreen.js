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
  Avatar,
  List,
  IconButton,
  Menu,
  Divider,
  Dialog,
  Portal,
  Checkbox
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// 导入图表组件
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';
import StatsCard from '../../components/StatsCard';
import { api } from '../../services/api';

const PatientDetailsScreen = ({ route, navigation }) => {
  const { patient } = route.params;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, health, medication, history
  const [menuVisible, setMenuVisible] = useState(false);
  const [editDiseases, setEditDiseases] = useState(false);

  // 慢性疾病列表
  const chronicDiseases = [
    { id: 'alzheimer', name: '阿尔茨海默病' },
    { id: 'arthritis', name: '关节炎' },
    { id: 'asthma', name: '哮喘' },
    { id: 'cancer', name: '癌症' },
    { id: 'copd', name: '慢性阻塞性肺病（COPD）' },
    { id: 'crohn', name: '克罗恩病' },
    { id: 'cystic_fibrosis', name: '囊性纤维化' },
    { id: 'dementia', name: '痴呆症' },
    { id: 'diabetes', name: '糖尿病' },
    { id: 'endometriosis', name: '子宫内膜异位症' },
    { id: 'epilepsy', name: '癫痫' },
    { id: 'fibromyalgia', name: '纤维肌痛' },
    { id: 'heart_disease', name: '心脏病' },
    { id: 'hypertension', name: '高血压' },
    { id: 'hiv_aids', name: '艾滋病毒/艾滋病' },
    { id: 'migraine', name: '偏头痛' },
    { id: 'mood_disorder', name: '心境障碍（躁郁症、循环性情感症和抑郁症）' },
    { id: 'multiple_sclerosis', name: '多发性硬化症' },
    { id: 'narcolepsy', name: '嗜睡症' },
    { id: 'parkinson', name: '帕金森病' },
    { id: 'sickle_cell', name: '镰状细胞性贫血症' },
    { id: 'ulcerative_colitis', name: '溃疡性结肠炎' }
  ];

  // 模拟患者详细数据
  const [patientData, setPatientData] = useState({
    basicInfo: {
      id: patient.id,
      name: patient.name || '张三',
      age: patient.age || 65,
      gender: patient.gender || 'male',
      phone: patient.phone || '+86 138-0013-8000',
      address: '北京市朝阳区xxx街道xxx号',
      emergencyContact: '李四',
      emergencyPhone: '+86 139-0013-8001',
      bloodType: 'A型',
      height: 170,
      weight: 75,
      riskLevel: patient.risk_level || 'medium',
      lastVisit: '2024-01-15',
      registeredDate: '2023-03-15',
      diseases: [
        'hypertension',
        'diabetes',
        'heart_disease'
      ]
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
        name: '氨氯地平片',
        dosage: '5mg',
        frequency: '每日一次',
        time: '早餐后',
        startDate: '2023-03-15',
        status: 'active',
        compliance: 85
      },
      {
        id: 2,
        name: '二甲双胍片',
        dosage: '500mg',
        frequency: '每日两次',
        time: '餐后',
        startDate: '2023-06-01',
        status: 'active',
        compliance: 92
      }
    ],
    alerts: [
      {
        id: 1,
        type: 'blood_pressure',
        message: '血压偏高，建议调整用药',
        date: '2024-01-15',
        status: 'pending'
      },
      {
        id: 2,
        type: 'medication',
        message: '用药依从性良好',
        date: '2024-01-14',
        status: 'info'
      }
    ],
    medicalHistory: [
      {
        id: 1,
        date: '2024-01-15',
        type: 'consultation',
        title: '定期复查',
        description: '血压控制情况良好，继续现有治疗方案',
        doctor: 'Dr. 陈医生'
      },
      {
        id: 2,
        date: '2024-01-10',
        type: 'lab_result',
        title: '血常规检查',
        description: '各项指标正常',
        doctor: 'Dr. 李医生'
      }
    ]
  });

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  };

  // 开始与患者聊天
  const startChatWithPatient = async (patient) => {
    try {
      setLoading(true);
      
      // 检查是否已存在会话
      const conversationResponse = await api.get(
        `/communication/conversations/with-user/${patient.id}/`
      );
      
      if (conversationResponse.data) {
        // 已存在会话，直接打开
        navigation.navigate('Chat', {
          conversationId: conversationResponse.data.id,
          otherUser: {
            id: patient.id,
            name: patient.name,
            role: 'patient'
          },
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // 会话不存在，创建新会话
        try {
          const createResponse = await api.post(
            `/communication/conversations/start-with-user/${patient.id}/`
          );
          
          if (createResponse.data.conversation) {
            navigation.navigate('Chat', {
              conversationId: createResponse.data.conversation.id,
              otherUser: {
                id: patient.id,
                name: patient.name,
                role: 'patient'
              },
            });
          }
        } catch (createError) {
          console.error('创建会话失败:', createError);
          Alert.alert('错误', '创建会话失败');
        }
      } else {
        console.error('检查会话失败:', error);
        Alert.alert('错误', '检查会话失败');
      }
    } finally {
      setLoading(false);
    }
  };

  // 更新患者疾病记录
  const updatePatientDiseases = (diseaseId, isChecked) => {
    setPatientData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        diseases: isChecked 
          ? [...prev.basicInfo.diseases, diseaseId]
          : prev.basicInfo.diseases.filter(id => id !== diseaseId)
      }
    }));
  };

  // 获取疾病名称
  const getDiseaseName = (diseaseId) => {
    const disease = chronicDiseases.find(d => d.id === diseaseId);
    return disease ? disease.name : diseaseId;
  };

  // 获取风险等级颜色
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

  // 评估健康状态
  const getHealthStatus = (value, type) => {
    switch (type) {
      case 'bloodPressure':
        if (value >= 140) return { status: 'high', color: '#F44336', text: '偏高' };
        if (value >= 120) return { status: 'normal', color: '#FF9800', text: '正常偏高' };
        return { status: 'normal', color: '#4CAF50', text: '正常' };
      case 'bloodGlucose':
        if (value >= 7.0) return { status: 'high', color: '#F44336', text: '偏高' };
        if (value >= 6.1) return { status: 'normal', color: '#FF9800', text: '正常偏高' };
        return { status: 'normal', color: '#4CAF50', text: '正常' };
      case 'heartRate':
        if (value >= 100 || value <= 60) return { status: 'abnormal', color: '#F44336', text: '异常' };
        return { status: 'normal', color: '#4CAF50', text: '正常' };
      default:
        return { status: 'normal', color: '#4CAF50', text: '正常' };
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
                {patientData.basicInfo.age}岁 · {patientData.basicInfo.gender === 'male' ? '男' : '女'} · {patientData.basicInfo.bloodType}
              </Text>
              <Text style={styles.patientMeta}>
                身高: {patientData.basicInfo.height}cm · 体重: {patientData.basicInfo.weight}kg
              </Text>
            </View>
            <Chip 
              style={[styles.riskChip, { 
                backgroundColor: getRiskLevelColor(patientData.basicInfo.riskLevel) 
              }]}
              textStyle={styles.riskChipText}
              compact={true}
            >
              {getRiskLevelText(patientData.basicInfo.riskLevel)}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* 关键指标统计 */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <StatsCard
            title="血压"
            value={`${patientData.healthMetrics.latest.bloodPressure.systolic}/${patientData.healthMetrics.latest.bloodPressure.diastolic}`}
            subtitle="mmHg"
            icon="heart"
            color={getHealthStatus(patientData.healthMetrics.latest.bloodPressure.systolic, 'bloodPressure').color}
            style={styles.statCard}
          />
          <StatsCard
            title="血糖"
            value={patientData.healthMetrics.latest.bloodGlucose.value.toString()}
            subtitle="mmol/L"
            icon="water"
            color={getHealthStatus(patientData.healthMetrics.latest.bloodGlucose.value, 'bloodGlucose').color}
            style={styles.statCard}
          />
        </View>
        
        <View style={styles.statsRow}>
          <StatsCard
            title="心率"
            value={patientData.healthMetrics.latest.heartRate.value.toString()}
            subtitle="bpm"
            icon="pulse"
            color={getHealthStatus(patientData.healthMetrics.latest.heartRate.value, 'heartRate').color}
            style={styles.statCard}
          />
          <StatsCard
            title="体重"
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
          <Text variant="titleMedium" style={styles.sectionTitle}>联系信息</Text>
          <List.Item
            title="手机号码"
            description={patientData.basicInfo.phone}
            left={(props) => <List.Icon {...props} icon="phone" />}
          />
          <List.Item
            title="地址"
            description={patientData.basicInfo.address}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
          />
          <List.Item
            title="紧急联系人"
            description={`${patientData.basicInfo.emergencyContact} (${patientData.basicInfo.emergencyPhone})`}
            left={(props) => <List.Icon {...props} icon="account-alert" />}
          />
        </Card.Content>
      </Card>

      {/* 疾病记录 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              疾病记录
            </Text>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => setEditDiseases(true)}
            />
          </View>
          
          <View style={styles.diseaseList}>
            {patientData.basicInfo.diseases.length > 0 ? (
              patientData.basicInfo.diseases.map((diseaseId) => (
                <Chip
                  key={diseaseId}
                  style={styles.diseaseChip}
                  textStyle={styles.diseaseChipText}
                  icon="medical-bag"
                >
                  {getDiseaseName(diseaseId)}
                </Chip>
              ))
            ) : (
              <Text style={styles.noDiseases}>暂无疾病记录</Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* 最近告警 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>最近告警</Text>
            <Button mode="text" onPress={() => navigation.navigate('Alerts')}>
              查看全部
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
            title="血压趋势"
            height={220}
            yAxisLabel="mmHg"
            xAxisLabel="日期"
            series={[
              {
                name: '收缩压',
                data: patientData.healthMetrics.trends.bloodPressure.systolic,
                color: '#F44336'
              },
              {
                name: '舒张压',
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
            title="血糖趋势"
            height={200}
            color="#FF9800"
            yAxisLabel="mmol/L"
            xAxisLabel="日期"
          />
        </Card.Content>
      </Card>

      {/* 心率趋势 */}
      <Card style={styles.card}>
        <Card.Content>
          <LineChart
            data={patientData.healthMetrics.trends.heartRate}
            title="心率趋势"
            height={200}
            color="#2196F3"
            yAxisLabel="bpm"
            xAxisLabel="日期"
          />
        </Card.Content>
      </Card>
    </View>
  );

  // 渲染用药信息
  const renderMedication = () => (
    <View>
      {patientData.medications.map((medication) => (
        <Card key={medication.id} style={styles.card}>
          <Card.Content>
            <View style={styles.medicationHeader}>
              <View style={styles.medicationInfo}>
                <Text variant="titleMedium" style={styles.medicationName}>
                  {medication.name}
                </Text>
                <Text style={styles.medicationDetails}>
                  {medication.dosage} · {medication.frequency} · {medication.time}
                </Text>
                <Text style={styles.medicationDate}>
                  开始日期: {medication.startDate}
                </Text>
              </View>
              <Chip 
                style={[styles.statusChip, { 
                  backgroundColor: medication.status === 'active' ? '#4CAF50' : '#9E9E9E' 
                }]}
                textStyle={styles.statusChipText}
                compact={true}
              >
                {medication.status === 'active' ? '进行中' : '已停止'}
              </Chip>
            </View>
            
            <View style={styles.complianceContainer}>
              <Text style={styles.complianceLabel}>依从性: {medication.compliance}%</Text>
              <View style={styles.complianceBar}>
                <View 
                  style={[styles.complianceProgress, { 
                    width: `${medication.compliance}%`,
                    backgroundColor: medication.compliance >= 80 ? '#4CAF50' : medication.compliance >= 60 ? '#FF9800' : '#F44336'
                  }]} 
                />
              </View>
            </View>
          </Card.Content>
        </Card>
      ))}
      
      <Button 
        mode="contained" 
        icon="plus"
        onPress={() => navigation.navigate('MedicationPlan', { patient: patientData.basicInfo })}
        style={styles.addButton}
      >
        添加用药计划
      </Button>
    </View>
  );

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
                {record.type === 'consultation' ? '复查' : '检查'}
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
          概览
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'health' && styles.activeTab]}
        onPress={() => setActiveTab('health')}
      >
        <Text style={[styles.tabText, activeTab === 'health' && styles.activeTabText]}>
          健康数据
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'medication' && styles.activeTab]}
        onPress={() => setActiveTab('medication')}
      >
        <Text style={[styles.tabText, activeTab === 'medication' && styles.activeTabText]}>
          用药信息
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'history' && styles.activeTab]}
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
          病史记录
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
          <Text style={styles.loadingText}>加载患者数据...</Text>
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
          患者详情
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
          <Menu.Item onPress={() => {}} title="编辑信息" />
          <Menu.Item 
            onPress={() => {
              setMenuVisible(false);
              startChatWithPatient(patient);
            }} 
            title="发送消息" 
          />
          <Divider />
          <Menu.Item onPress={() => {}} title="生成报告" />
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

      {/* 疾病编辑对话框 */}
      <Portal>
        <Dialog
          visible={editDiseases}
          onDismiss={() => setEditDiseases(false)}
          style={styles.dialog}
        >
          <Dialog.Title>编辑疾病记录</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogDescription}>
              请勾选患者的慢性疾病：
            </Text>
            <ScrollView style={styles.diseaseScrollView}>
              {chronicDiseases.map((disease) => (
                <View key={disease.id} style={styles.diseaseItem}>
                  <Checkbox
                    status={patientData.basicInfo.diseases.includes(disease.id) ? 'checked' : 'unchecked'}
                    onPress={() => {
                      const isChecked = patientData.basicInfo.diseases.includes(disease.id);
                      updatePatientDiseases(disease.id, !isChecked);
                    }}
                  />
                  <Text style={styles.diseaseItemText}>{disease.name}</Text>
                </View>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDiseases(false)}>取消</Button>
            <Button 
              mode="contained" 
              onPress={() => {
                setEditDiseases(false);
                // 这里可以添加保存到服务器的逻辑
              }}
            >
              保存
            </Button>
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
});

export default PatientDetailsScreen; 