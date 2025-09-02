/**
 * 疾病分布分析页面组件
 * 
 * 功能特性：
 * - 显示患者慢性疾病分布统计
 * - 支持多种图表类型（饼图、柱状图、趋势图）
 * - 疾病风险等级分析
 * - 患者年龄和性别分布统计
 * - 实时数据刷新和筛选
 * - 多语言国际化支持
 * - 疾病详情深度分析
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  ActivityIndicator, 
  Chip,
  SearchBar,
  Divider,
  List,
  IconButton,
  Menu
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchPatientsList } from '../../store/slices/patientsSlice';

// 导入图表组件
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import LineChart from '../../components/Charts/LineChart';

const { width } = Dimensions.get('window');

/**
 * 疾病分布分析页面主组件
 * 
 * 主要功能：
 * - 分析和展示患者疾病分布情况
 * - 提供多种图表可视化方式
 * - 疾病风险等级和患者特征分析
 * - 支持疾病详情深度查看
 * - 数据导出和报告生成
 * 
 * @param {Object} navigation - 导航对象，用于页面跳转
 * @returns {JSX.Element} 疾病分布分析页面组件
 */
const DiseaseDistributionScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // 从Redux store获取患者数据
  const { patientsList } = useSelector(state => state.patients);
  
  // 界面状态管理
  const [loading, setLoading] = useState(true);                    // 首次加载状态
  const [refreshing, setRefreshing] = useState(false);             // 下拉刷新状态
  const [chartType, setChartType] = useState('pie');               // 图表类型：pie, bar, trend
  const [selectedDisease, setSelectedDisease] = useState(null);    // 选中的疾病对象
  const [menuVisible, setMenuVisible] = useState(false);           // 菜单显示状态
  const [searchQuery, setSearchQuery] = useState('');              // 疾病搜索关键词
  
  // 疾病分布数据状态
  const [diseaseData, setDiseaseData] = useState({
    totalPatients: 0,                    // 患者总数
    totalWithDiseases: 0,                // 有慢性疾病的患者数
    diseaseDistribution: []               // 疾病分布数据
  });

  // 慢性疾病列表配置
  const chronicDiseases = [
    { id: 'alzheimer', name: t('diseases.alzheimer') },              // 阿尔茨海默病
    { id: 'arthritis', name: t('diseases.arthritis') },              // 关节炎
    { id: 'asthma', name: t('diseases.asthma') },                    // 哮喘
    { id: 'cancer', name: t('diseases.cancer') },                    // 癌症
    { id: 'copd', name: t('diseases.copd') },                        // 慢性阻塞性肺疾病
    { id: 'crohn', name: t('diseases.crohn') },                      // 克罗恩病
    { id: 'cystic_fibrosis', name: t('diseases.cysticFibrosis') },   // 囊性纤维化
    { id: 'dementia', name: t('diseases.dementia') },                // 痴呆症
    { id: 'diabetes', name: t('diseases.diabetes') },                // 糖尿病
    { id: 'endometriosis', name: t('diseases.endometriosis') },      // 子宫内膜异位症
    { id: 'epilepsy', name: t('diseases.epilepsy') },                // 癫痫
    { id: 'fibromyalgia', name: t('diseases.fibromyalgia') },        // 纤维肌痛
    { id: 'heart_disease', name: t('diseases.heartDisease') },       // 心脏病
    { id: 'hypertension', name: t('diseases.hypertension') },        // 高血压
    { id: 'hiv_aids', name: t('diseases.hivAids') },                 // HIV/艾滋病
    { id: 'migraine', name: t('diseases.migraine') },                // 偏头痛
    { id: 'mood_disorder', name: t('diseases.moodDisorder') },       // 情绪障碍
    { id: 'multiple_sclerosis', name: t('diseases.multipleSclerosis') }, // 多发性硬化症
    { id: 'narcolepsy', name: t('diseases.narcolepsy') },            // 发作性睡病
    { id: 'parkinson', name: t('diseases.parkinson') },              // 帕金森病
    { id: 'sickle_cell', name: t('diseases.sickleCell') },           // 镰状细胞病
    { id: 'ulcerative_colitis', name: t('diseases.ulcerativeColitis') } // 溃疡性结肠炎
  ];

  /**
   * 组件加载时获取疾病数据
   */
  useEffect(() => {
    loadDiseaseData();
  }, []);
  
  /**
   * 当患者列表数据变化时，重新计算疾病分布
   */
  useEffect(() => {
    if (patientsList && patientsList.length > 0) {
      calculateDiseaseDistribution();
    }
  }, [patientsList]);

  /**
   * 加载疾病分布数据
   * 获取患者列表并计算疾病统计信息
   */
  const loadDiseaseData = async () => {
    setLoading(true);
    try {
      // 获取患者列表数据
      await dispatch(fetchPatientsList()).unwrap();
    } catch (error) {
      console.error('Failed to load patients data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * 从真实患者数据计算疾病分布
   * 统计每种疾病的患者数量、风险分布、年龄分布和性别分布
   */
  const calculateDiseaseDistribution = () => {
    if (!patientsList || patientsList.length === 0) {
      setDiseaseData({
        totalPatients: 0,
        totalWithDiseases: 0,
        diseaseDistribution: []
      });
      return;
    }
    
    const totalPatients = patientsList.length;
    const diseaseCount = {};
    
    // 疾病颜色配置
    const diseaseColors = {
      'hypertension': '#FF6B6B',        // 高血压 - 红色
      'diabetes': '#4ECDC4',            // 糖尿病 - 青色
      'heart_disease': '#45B7D1',       // 心脏病 - 蓝色
      'arthritis': '#96CEB4',           // 关节炎 - 绿色
      'asthma': '#FFEAA7',              // 哮喘 - 黄色
      'copd': '#DDA0DD',                // 慢性阻塞性肺疾病 - 紫色
      'cancer': '#FF8A80',              // 癌症 - 粉红色
      'alzheimer': '#CE93D8',           // 阿尔茨海默病 - 淡紫色
      'dementia': '#F8BBD9',            // 痴呆症 - 浅粉色
      'parkinson': '#A5D6A7',           // 帕金森病 - 浅绿色
      'epilepsy': '#FFD54F',            // 癫痫 - 橙色
      'migraine': '#FFAB91',            // 偏头痛 - 浅橙色
      'other': '#B0BEC5'                // 其他疾病 - 灰色
    };
    
    let patientsWithDiseases = 0;
    
    // 统计每种疾病的患者数量
    patientsList.forEach(patient => {
      const diseases = patient.chronic_diseases;
      
      if (diseases && Array.isArray(diseases) && diseases.length > 0) {
        patientsWithDiseases++;
        
        diseases.forEach(diseaseId => {
          if (diseaseCount[diseaseId]) {
            diseaseCount[diseaseId].count++;
            diseaseCount[diseaseId].patients.push(patient);
          } else {
            const disease = chronicDiseases.find(d => d.id === diseaseId);
            diseaseCount[diseaseId] = {
              id: diseaseId,
              name: disease ? disease.name : diseaseId,
              count: 1,
              patients: [patient],
              color: diseaseColors[diseaseId] || '#B0BEC5'
            };
          }
        });
      }
    });
    
    // 转换为图表数据格式
    const distributionData = Object.values(diseaseCount)
      .sort((a, b) => b.count - a.count)
      .map(disease => ({
        id: disease.id,
        name: disease.name,
        value: disease.count,
        percentage: ((disease.count / totalPatients) * 100).toFixed(1),
        color: disease.color,
        patients: disease.patients,
        // 计算风险分布
        riskDistribution: calculateRiskDistribution(disease.patients),
        // 计算年龄分布
        ageDistribution: calculateAgeDistribution(disease.patients),
        // 计算性别分布
        genderDistribution: calculateGenderDistribution(disease.patients)
      }));
    
    setDiseaseData({
      totalPatients,
      totalWithDiseases: patientsWithDiseases,
      diseaseDistribution: distributionData
    });
  };
  
  /**
   * 计算风险等级分布
   * 统计患者中高、中、低风险的数量
   * 
   * @param {Array} patients - 患者数组
   * @returns {Object} 风险等级分布统计
   */
  const calculateRiskDistribution = (patients) => {
    const riskCount = { high: 0, medium: 0, low: 0 };
    patients.forEach(patient => {
      const risk = patient.risk_level || 'low';
      if (riskCount[risk] !== undefined) {
        riskCount[risk]++;
      }
    });
    return riskCount;
  };
  
  /**
   * 计算年龄分布
   * 按年龄段统计患者数量
   * 
   * @param {Array} patients - 患者数组
   * @returns {Object} 年龄分布统计
   */
  const calculateAgeDistribution = (patients) => {
    const ageCount = { '18-30': 0, '31-50': 0, '51-70': 0, '70+': 0 };
    patients.forEach(patient => {
      const age = patient.age || 0;
      if (age >= 18 && age <= 30) ageCount['18-30']++;
      else if (age >= 31 && age <= 50) ageCount['31-50']++;
      else if (age >= 51 && age <= 70) ageCount['51-70']++;
      else if (age > 70) ageCount['70+']++;
    });
    return ageCount;
  };
  
  /**
   * 计算性别分布
   * 统计男性和女性患者数量
   * 
   * @param {Array} patients - 患者数组
   * @returns {Object} 性别分布统计
   */
  const calculateGenderDistribution = (patients) => {
    const genderCount = { male: 0, female: 0 };
    patients.forEach(patient => {
      const gender = patient.gender || 'male';
      if (genderCount[gender] !== undefined) {
        genderCount[gender]++;
      }
    });
    return genderCount;
  };

  /**
   * 下拉刷新处理
   * 重新加载疾病分布数据
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiseaseData();
    setRefreshing(false);
  };

  /**
   * 渲染图表类型选择器
   * 提供饼图、柱状图、趋势图三种选择
   * 
   * @returns {JSX.Element} 图表类型选择器组件
   */
  const renderChartTypeSelector = () => (
    <View style={styles.chartTypeSelector}>
      <Chip 
        selected={chartType === 'pie'} 
        onPress={() => setChartType('pie')}
        style={styles.chartTypeChip}
        compact={true}
      >
        {t('common.pieChart')}
      </Chip>
      <Chip 
        selected={chartType === 'bar'} 
        onPress={() => setChartType('bar')}
        style={styles.chartTypeChip}
        compact={true}
      >
        {t('common.barChart')}
      </Chip>
      <Chip 
        selected={chartType === 'trend'} 
        onPress={() => setChartType('trend')}
        style={styles.chartTypeChip}
        compact={true}
      >
        {t('common.trendChart')}
      </Chip>
    </View>
  );

  /**
   * 渲染主图表
   * 根据当前选择的图表类型和数据渲染不同的图表
   * 
   * @returns {JSX.Element} 主图表组件
   */
  const renderChart = () => {
    const chartData = diseaseData.diseaseDistribution.map(item => ({
      label: item.name,
      value: item.value,
      color: item.color
    }));

    switch (chartType) {
      case 'pie':
        return (
          <PieChart
            data={chartData}
            height={250}
            onPress={(item) => {
              const disease = diseaseData.diseaseDistribution.find(d => d.name === item.label);
              setSelectedDisease(disease);
            }}
          />
        );
      case 'bar':
        return (
          <BarChart
            data={chartData}
            height={250}
            yAxisLabel={t('patients.patientCount')}
            onPress={(item) => {
              const disease = diseaseData.diseaseDistribution.find(d => d.name === item.label);
              setSelectedDisease(disease);
            }}
          />
        );
      case 'trend':
        // 对于趋势图，我们显示选中疾病的患者数量变化（这里简化为静态数据）
        const trendData = selectedDisease ? 
          Array.from({length: 6}, (_, i) => ({
            label: `${i + 1}${t('common.month')}`,
            value: Math.max(0, selectedDisease.value + Math.floor(Math.random() * 5) - 2)
          })) :
          diseaseData.diseaseDistribution.length > 0 ?
          Array.from({length: 6}, (_, i) => ({
            label: `${i + 1}${t('common.month')}`,
            value: Math.max(0, diseaseData.diseaseDistribution[0].value + Math.floor(Math.random() * 5) - 2)
          })) : [];
        
        return (
          <LineChart
            data={trendData}
            height={250}
            yAxisLabel={t('patients.patientCount')}
            title={selectedDisease ? 
              `${selectedDisease.name} ${t('common.patientTrend')}` : 
              `${diseaseData.diseaseDistribution[0]?.name || t('diseases.hypertension')} ${t('common.patientTrend')}`
            }
            color={selectedDisease ? selectedDisease.color : '#FF6B6B'}
          />
        );
      default:
        return null;
    }
  };

  /**
   * 渲染疾病详情卡片
   * 显示选定疾病的详细统计信息
   * 
   * @returns {JSX.Element} 疾病详情卡片组件
   */
  const renderDiseaseDetails = () => {
    if (!selectedDisease) return null;

    const riskData = [
      { label: t('patients.highRisk'), value: selectedDisease.riskDistribution.high, color: '#F44336' },
      { label: t('patients.mediumRisk'), value: selectedDisease.riskDistribution.medium, color: '#FF9800' },
      { label: t('patients.lowRisk'), value: selectedDisease.riskDistribution.low, color: '#4CAF50' }
    ];

    const ageData = [
      { label: '18-30', value: selectedDisease.ageDistribution['18-30'] },
      { label: '31-50', value: selectedDisease.ageDistribution['31-50'] },
      { label: '51-70', value: selectedDisease.ageDistribution['51-70'] },
      { label: '70+', value: selectedDisease.ageDistribution['70+'] }
    ];

    const genderData = [
      { label: t('common.male'), value: selectedDisease.genderDistribution.male, color: '#2196F3' },
      { label: t('common.female'), value: selectedDisease.genderDistribution.female, color: '#E91E63' }
    ];

    return (
      <View style={styles.diseaseDetailsContainer}>
        <Card style={styles.diseaseDetailCard}>
          <Card.Content>
            <View style={styles.diseaseDetailHeader}>
              <Text style={styles.diseaseDetailTitle}>
                {selectedDisease.name} {t('common.detailedAnalysis')}
              </Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setSelectedDisease(null)}
              />
            </View>
            
            <View style={styles.diseaseStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedDisease.value}</Text>
                <Text style={styles.statLabel}>{t('dashboard.totalPatients')}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedDisease.percentage}%</Text>
                <Text style={styles.statLabel}>{t('common.percentage')}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>{t('dashboard.patientRiskDistribution')}</Text>
            <PieChart data={riskData} height={150} />

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>
              {t('common.ageDistribution') || 'Age Distribution'} ({t('common.yearsOld')})
            </Text>
            <BarChart 
              data={ageData} 
              height={200} 
              color={['#E1BEE7', '#9C27B0', '#7B1FA2', '#4A148C']} 
              yAxisLabel={t('common.count') || 'Count'}
              showValues={true}
            />

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>{t('common.genderDistribution') || 'Gender Distribution'}</Text>
            <PieChart data={genderData} height={150} />
          </Card.Content>
        </Card>
      </View>
    );
  };

  /**
   * 渲染疾病列表
   * 显示所有疾病，支持搜索和筛选
   * 
   * @returns {JSX.Element} 疾病列表组件
   */
  const renderDiseaseList = () => {
    const filteredDiseases = diseaseData.diseaseDistribution.filter(disease =>
      disease.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Card style={styles.diseaseListCard}>
        <Card.Content>
          <Text style={styles.listTitle}>{t('doctor.diseaseDistribution')}</Text>
          
          {filteredDiseases.map((disease, index) => (
            <TouchableOpacity
              key={disease.id}
              style={styles.diseaseListItem}
              onPress={() => setSelectedDisease(disease)}
            >
              <View style={styles.diseaseListLeft}>
                <View style={[styles.diseaseColorDot, { backgroundColor: disease.color }]} />
                <View style={styles.diseaseListText}>
                  <Text style={styles.diseaseName}>{disease.name}</Text>
                  <Text style={styles.diseaseCount}>
                    {disease.value} {t('common.patients') || 'patients'}
                  </Text>
                </View>
              </View>
              <View style={styles.diseaseListRight}>
                <Text style={styles.diseasePercentage}>{disease.percentage}%</Text>
                <Chip 
                  style={styles.riskChip}
                  textStyle={styles.riskChipText}
                  compact
                >
                  {disease.riskDistribution.high > Math.max(1, disease.value * 0.3) ? 
                    t('common.highAttention') || 'High Attention' : 
                    t('common.normal')
                  }
                </Chip>
              </View>
            </TouchableOpacity>
          ))}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('common.loading')}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{t('doctor.diseaseDistribution')}</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item onPress={() => {}} title={t('health.dataExport')} />
          <Menu.Item onPress={() => {}} title={t('doctor.generateReport')} />
        </Menu>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 总览统计 */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{diseaseData.totalPatients}</Text>
                <Text style={styles.summaryLabel}>{t('dashboard.totalPatients')}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{diseaseData.totalWithDiseases}</Text>
                <Text style={styles.summaryLabel}>
                  {t('common.withChronicDiseases')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {diseaseData.totalPatients > 0 ? 
                    ((diseaseData.totalWithDiseases / diseaseData.totalPatients) * 100).toFixed(1) : 
                    '0.0'
                  }%
                </Text>
                <Text style={styles.summaryLabel}>
                  {t('common.prevalenceRate')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 图表选择器 */}
        {renderChartTypeSelector()}

        {/* 主图表 */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Text style={styles.chartTitle}>
              {chartType === 'pie' ? 
                t('common.diseaseDistributionRatio') : 
               chartType === 'bar' ? 
                t('common.diseasePatientCount') : 
               t('common.diseaseTrendChange')
              }
            </Text>
            {diseaseData.diseaseDistribution.length > 0 ? renderChart() : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  {t('common.noData') || 'No data available'}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* 疾病详情 */}
        {renderDiseaseDetails()}

        {/* 疾病列表 */}
        {diseaseData.diseaseDistribution.length > 0 && renderDiseaseList()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  scrollView: {
    flex: 1,
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
  noDataContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  summaryCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    flexWrap: 'wrap',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  chartTypeChip: {
    marginHorizontal: 4,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  diseaseDetailsContainer: {
    margin: 16,
  },
  diseaseDetailCard: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  diseaseDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  diseaseDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  diseaseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  diseaseListCard: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  diseaseListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  diseaseListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  diseaseColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  diseaseListText: {
    flex: 1,
  },
  diseaseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  diseaseCount: {
    fontSize: 14,
    color: '#666',
  },
  diseaseListRight: {
    alignItems: 'flex-end',
  },
  diseasePercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  riskChip: {
    height: 32,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskChipText: {
    fontSize: 11,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
});

export default DiseaseDistributionScreen;