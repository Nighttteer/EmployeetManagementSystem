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

// 导入图表组件
import PieChart from '../../components/Charts/PieChart';
import BarChart from '../../components/Charts/BarChart';
import LineChart from '../../components/Charts/LineChart';

const { width } = Dimensions.get('window');

const DiseaseDistributionScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartType, setChartType] = useState('pie'); // pie, bar, trend
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    { id: 'mood_disorder', name: '心境障碍' },
    { id: 'multiple_sclerosis', name: '多发性硬化症' },
    { id: 'narcolepsy', name: '嗜睡症' },
    { id: 'parkinson', name: '帕金森病' },
    { id: 'sickle_cell', name: '镰状细胞性贫血症' },
    { id: 'ulcerative_colitis', name: '溃疡性结肠炎' }
  ];

  // 模拟疾病分布数据
  const [diseaseData, setDiseaseData] = useState({
    totalPatients: 127,
    totalWithDiseases: 102,
    diseaseDistribution: [
      { 
        id: 'hypertension', 
        name: '高血压', 
        value: 45, 
        percentage: 35.4,
        color: '#FF6B6B',
        riskDistribution: { high: 18, medium: 20, low: 7 },
        ageDistribution: { '18-30': 2, '31-50': 12, '51-70': 25, '70+': 6 },
        genderDistribution: { male: 24, female: 21 },
        trend: [
          { label: '1月', value: 40 },
          { label: '2月', value: 42 },
          { label: '3月', value: 43 },
          { label: '4月', value: 44 },
          { label: '5月', value: 45 },
          { label: '6月', value: 45 }
        ]
      },
      { 
        id: 'diabetes', 
        name: '糖尿病', 
        value: 38, 
        percentage: 29.9,
        color: '#4ECDC4',
        riskDistribution: { high: 15, medium: 18, low: 5 },
        ageDistribution: { '18-30': 1, '31-50': 8, '51-70': 22, '70+': 7 },
        genderDistribution: { male: 20, female: 18 },
        trend: [
          { label: '1月', value: 35 },
          { label: '2月', value: 36 },
          { label: '3月', value: 37 },
          { label: '4月', value: 37 },
          { label: '5月', value: 38 },
          { label: '6月', value: 38 }
        ]
      },
      { 
        id: 'heart_disease', 
        name: '心脏病', 
        value: 28, 
        percentage: 22.0,
        color: '#45B7D1',
        riskDistribution: { high: 20, medium: 6, low: 2 },
        ageDistribution: { '18-30': 0, '31-50': 4, '51-70': 18, '70+': 6 },
        genderDistribution: { male: 16, female: 12 },
        trend: [
          { label: '1月', value: 26 },
          { label: '2月', value: 27 },
          { label: '3月', value: 27 },
          { label: '4月', value: 28 },
          { label: '5月', value: 28 },
          { label: '6月', value: 28 }
        ]
      },
      { 
        id: 'arthritis', 
        name: '关节炎', 
        value: 22, 
        percentage: 17.3,
        color: '#96CEB4',
        riskDistribution: { high: 5, medium: 12, low: 5 },
        ageDistribution: { '18-30': 0, '31-50': 3, '51-70': 15, '70+': 4 },
        genderDistribution: { male: 8, female: 14 },
        trend: [
          { label: '1月', value: 20 },
          { label: '2月', value: 21 },
          { label: '3月', value: 21 },
          { label: '4月', value: 22 },
          { label: '5月', value: 22 },
          { label: '6月', value: 22 }
        ]
      },
      { 
        id: 'asthma', 
        name: '哮喘', 
        value: 15, 
        percentage: 11.8,
        color: '#FFEAA7',
        riskDistribution: { high: 6, medium: 7, low: 2 },
        ageDistribution: { '18-30': 3, '31-50': 5, '51-70': 6, '70+': 1 },
        genderDistribution: { male: 7, female: 8 },
        trend: [
          { label: '1月', value: 14 },
          { label: '2月', value: 14 },
          { label: '3月', value: 15 },
          { label: '4月', value: 15 },
          { label: '5月', value: 15 },
          { label: '6月', value: 15 }
        ]
      },
      { 
        id: 'copd', 
        name: '慢性阻塞性肺病', 
        value: 12, 
        percentage: 9.4,
        color: '#DDA0DD',
        riskDistribution: { high: 8, medium: 3, low: 1 },
        ageDistribution: { '18-30': 0, '31-50': 1, '51-70': 8, '70+': 3 },
        genderDistribution: { male: 8, female: 4 },
        trend: [
          { label: '1月', value: 11 },
          { label: '2月', value: 11 },
          { label: '3月', value: 12 },
          { label: '4月', value: 12 },
          { label: '5月', value: 12 },
          { label: '6月', value: 12 }
        ]
      },
      { 
        id: 'other', 
        name: '其他疾病', 
        value: 18, 
        percentage: 14.2,
        color: '#A8A8A8',
        riskDistribution: { high: 4, medium: 10, low: 4 },
        ageDistribution: { '18-30': 2, '31-50': 5, '51-70': 8, '70+': 3 },
        genderDistribution: { male: 9, female: 9 },
        trend: [
          { label: '1月', value: 17 },
          { label: '2月', value: 17 },
          { label: '3月', value: 18 },
          { label: '4月', value: 18 },
          { label: '5月', value: 18 },
          { label: '6月', value: 18 }
        ]
      }
    ]
  });

  useEffect(() => {
    loadDiseaseData();
  }, []);

  const loadDiseaseData = async () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiseaseData();
    setRefreshing(false);
  };

  const renderChartTypeSelector = () => (
    <View style={styles.chartTypeSelector}>
      <Chip 
        selected={chartType === 'pie'} 
        onPress={() => setChartType('pie')}
        style={styles.chartTypeChip}
        compact={true}
      >
        饼图
      </Chip>
      <Chip 
        selected={chartType === 'bar'} 
        onPress={() => setChartType('bar')}
        style={styles.chartTypeChip}
        compact={true}
      >
        柱状图
      </Chip>
      <Chip 
        selected={chartType === 'trend'} 
        onPress={() => setChartType('trend')}
        style={styles.chartTypeChip}
        compact={true}
      >
        趋势图
      </Chip>
    </View>
  );

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
            yAxisLabel="患者数量"
            onPress={(item) => {
              const disease = diseaseData.diseaseDistribution.find(d => d.name === item.label);
              setSelectedDisease(disease);
            }}
          />
        );
      case 'trend':
        return (
          <LineChart
            data={selectedDisease ? selectedDisease.trend : diseaseData.diseaseDistribution[0].trend}
            height={250}
            yAxisLabel="患者数量"
            title={selectedDisease ? `${selectedDisease.name}患者数量趋势` : '高血压患者数量趋势'}
            color={selectedDisease ? selectedDisease.color : '#FF6B6B'}
          />
        );
      default:
        return null;
    }
  };

  const renderDiseaseDetails = () => {
    if (!selectedDisease) return null;

    const riskData = [
      { label: '高风险', value: selectedDisease.riskDistribution.high, color: '#F44336' },
      { label: '中风险', value: selectedDisease.riskDistribution.medium, color: '#FF9800' },
      { label: '低风险', value: selectedDisease.riskDistribution.low, color: '#4CAF50' }
    ];

    const ageData = [
      { label: '18-30', value: selectedDisease.ageDistribution['18-30'] },
      { label: '31-50', value: selectedDisease.ageDistribution['31-50'] },
      { label: '51-70', value: selectedDisease.ageDistribution['51-70'] },
      { label: '70+', value: selectedDisease.ageDistribution['70+'] }
    ];

    const genderData = [
      { label: '男性', value: selectedDisease.genderDistribution.male, color: '#2196F3' },
      { label: '女性', value: selectedDisease.genderDistribution.female, color: '#E91E63' }
    ];

    return (
      <View style={styles.diseaseDetailsContainer}>
        <Card style={styles.diseaseDetailCard}>
          <Card.Content>
            <View style={styles.diseaseDetailHeader}>
              <Text style={styles.diseaseDetailTitle}>{selectedDisease.name} 详细分析</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => setSelectedDisease(null)}
              />
            </View>
            
            <View style={styles.diseaseStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedDisease.value}</Text>
                <Text style={styles.statLabel}>患者总数</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedDisease.percentage}%</Text>
                <Text style={styles.statLabel}>占比</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>风险等级分布</Text>
            <PieChart data={riskData} height={150} />

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>年龄分布（岁）</Text>
            <BarChart 
              data={ageData} 
              height={200} 
              color={['#E1BEE7', '#9C27B0', '#7B1FA2', '#4A148C']} 
              yAxisLabel="人数"
              showValues={true}
            />

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>性别分布</Text>
            <PieChart data={genderData} height={150} />
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderDiseaseList = () => {
    const filteredDiseases = diseaseData.diseaseDistribution.filter(disease =>
      disease.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <Card style={styles.diseaseListCard}>
        <Card.Content>
          <Text style={styles.listTitle}>疾病分布列表</Text>
          
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
                  <Text style={styles.diseaseCount}>{disease.value}名患者</Text>
                </View>
              </View>
              <View style={styles.diseaseListRight}>
                <Text style={styles.diseasePercentage}>{disease.percentage}%</Text>
                <Chip 
                  style={styles.riskChip}
                  textStyle={styles.riskChipText}
                  compact
                >
                  {disease.riskDistribution.high > 10 ? '高关注' : '常规'}
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
          <Text style={styles.loadingText}>加载疾病分布数据...</Text>
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
        <Text style={styles.headerTitle}>慢性疾病分布统计</Text>
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
          <Menu.Item onPress={() => {}} title="导出数据" />
          <Menu.Item onPress={() => {}} title="生成报告" />
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
                <Text style={styles.summaryLabel}>患者总数</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{diseaseData.totalWithDiseases}</Text>
                <Text style={styles.summaryLabel}>患有慢性疾病</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {((diseaseData.totalWithDiseases / diseaseData.totalPatients) * 100).toFixed(1)}%
                </Text>
                <Text style={styles.summaryLabel}>患病率</Text>
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
              {chartType === 'pie' ? '疾病分布占比' : 
               chartType === 'bar' ? '疾病患者数量' : 
               '疾病趋势变化'}
            </Text>
            {renderChart()}
          </Card.Content>
        </Card>

        {/* 疾病详情 */}
        {renderDiseaseDetails()}

        {/* 疾病列表 */}
        {renderDiseaseList()}
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
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
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