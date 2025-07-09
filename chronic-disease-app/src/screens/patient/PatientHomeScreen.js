import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Dimensions,
  Alert
} from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { fetchUserProfile } from '../../store/slices/userSlice';
import CustomCard from '../../components/CustomCard';

const { width } = Dimensions.get('window');

const PatientHomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, medicationPlan, loading } = useSelector((state) => state.user);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // 页面加载时获取用户数据
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchUserProfile());
    setRefreshing(false);
  };

  const getTodayMedications = () => {
    if (!medicationPlan) return [];
    // 获取今日需要服用的药物
    const today = new Date().toDateString();
    return medicationPlan.filter(med => {
      // 简化逻辑，实际应根据用药计划的时间安排
      return med.isActive;
    }).slice(0, 3); // 显示最多3个
  };

  const getHealthStatus = () => {
    // 简化的健康状态评估
    if (!profile?.lastHealthMetrics) return '暂无数据';
    
    const { bloodPressure, bloodSugar } = profile.lastHealthMetrics;
    
    if (bloodPressure?.systolic > 140 || bloodSugar?.value > 7.0) {
      return '需要关注';
    } else if (bloodPressure?.systolic > 130 || bloodSugar?.value > 6.1) {
      return '轻微偏高';
    } else {
      return '状态良好';
    }
  };

  const todayMedications = getTodayMedications();
  const healthStatus = getHealthStatus();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 问候语 */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.greeting}>
            {user?.name ? `您好，${user.name}` : '您好'}
          </Text>
          <Text variant="bodyLarge" style={styles.subGreeting}>
            今天是{new Date().toLocaleDateString('zh-CN', { 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </Text>
        </View>

        {/* 健康状态概览 */}
        <CustomCard
          title="健康状态"
          subtitle={`当前状态：${healthStatus}`}
          content={
            <View style={styles.healthOverview}>
              <View style={styles.healthMetric}>
                <Ionicons name="heart" size={24} color="#e74c3c" />
                <Text style={styles.metricLabel}>血压</Text>
                <Text style={styles.metricValue}>
                  {profile?.lastHealthMetrics?.bloodPressure ? 
                    `${profile.lastHealthMetrics.bloodPressure.systolic}/${profile.lastHealthMetrics.bloodPressure.diastolic}` : 
                    '-- / --'
                  }
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Ionicons name="water" size={24} color="#3498db" />
                <Text style={styles.metricLabel}>血糖</Text>
                <Text style={styles.metricValue}>
                  {profile?.lastHealthMetrics?.bloodSugar?.value || '--'} mmol/L
                </Text>
              </View>
              <View style={styles.healthMetric}>
                <Ionicons name="fitness" size={24} color="#2ecc71" />
                <Text style={styles.metricLabel}>体重</Text>
                <Text style={styles.metricValue}>
                  {profile?.lastHealthMetrics?.weight || '--'} kg
                </Text>
              </View>
            </View>
          }
          onPress={() => navigation.navigate('HealthData')}
        />

        {/* 今日用药 */}
        <CustomCard
          title="今日用药"
          subtitle={`${todayMedications.length}种药物待服用`}
          content={
            <View style={styles.medicationList}>
              {todayMedications.length > 0 ? (
                todayMedications.map((med, index) => (
                  <View key={index} style={styles.medicationItem}>
                    <View style={styles.medicationInfo}>
                      <Text style={styles.medicationName}>{med.name}</Text>
                      <Text style={styles.medicationDosage}>{med.dosage}</Text>
                    </View>
                    <Text style={styles.medicationTime}>
                      {med.nextTime || '待安排'}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noMedicationText}>今日暂无用药安排</Text>
              )}
            </View>
          }
          onPress={() => navigation.navigate('Medication')}
        />

        {/* 最新医生建议 */}
        <CustomCard
          title="医生建议"
          subtitle="最新的健康指导"
          content={
            <View style={styles.adviceContainer}>
              <Text style={styles.adviceText}>
                {profile?.lastAdvice || '暂无新的医生建议，请保持良好的生活习惯。'}
              </Text>
              <Text style={styles.adviceTime}>
                {profile?.lastAdviceTime ? 
                  new Date(profile.lastAdviceTime).toLocaleDateString('zh-CN') : 
                  ''
                }
              </Text>
            </View>
          }
          onPress={() => navigation.navigate('Messages')}
        />

        {/* 快捷操作 */}
        <CustomCard
          title="快捷操作"
          content={
            <View style={styles.quickActions}>
              <View style={styles.actionRow}>
                <CustomActionButton
                  icon="add-circle"
                  title="录入数据"
                  onPress={() => navigation.navigate('HealthData', {
                    screen: 'DataEntry'
                  })}
                />
                <CustomActionButton
                  icon="trending-up"
                  title="查看趋势"
                  onPress={() => navigation.navigate('HealthData', {
                    screen: 'HealthTrends'
                  })}
                />
              </View>
              <View style={styles.actionRow}>
                <CustomActionButton
                  icon="chatbubble"
                  title="联系医生"
                  onPress={() => navigation.navigate('Messages')}
                />
                <CustomActionButton
                  icon="person"
                  title="个人档案"
                  onPress={() => navigation.navigate('Profile')}
                />
              </View>
            </View>
          }
        />
      </ScrollView>

      {/* 悬浮操作按钮 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('HealthData', {
          screen: 'DataEntry'
        })}
        label="录入数据"
      />
    </SafeAreaView>
  );
};

// 快捷操作按钮组件
const CustomActionButton = ({ icon, title, onPress }) => (
  <CustomCard
    title={title}
    icon={<Ionicons name={icon} size={28} color="#2E86AB" />}
    onPress={onPress}
    style={styles.actionButton}
    titleStyle={styles.actionButtonTitle}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 18,
    color: '#666666',
  },
  healthOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  healthMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  medicationList: {
    paddingVertical: 4,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  medicationDosage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  medicationTime: {
    fontSize: 14,
    color: '#2E86AB',
    fontWeight: '500',
  },
  noMedicationText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 16,
  },
  adviceContainer: {
    paddingVertical: 4,
  },
  adviceText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 8,
  },
  adviceTime: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
  },
  quickActions: {
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
    margin: 4,
    paddingVertical: 8,
  },
  actionButtonTitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2E86AB',
  },
});

export default PatientHomeScreen; 