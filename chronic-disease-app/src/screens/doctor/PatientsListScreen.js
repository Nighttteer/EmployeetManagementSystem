import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  ActivityIndicator, 
  FAB,
  Avatar,
  Chip,
  Searchbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPatientsList, setSearchQuery } from '../../store/slices/patientsSlice';
import { loginUser } from '../../store/slices/authSlice';
import * as SecureStore from 'expo-secure-store';

const PatientsListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { 
    patientsList, 
    filteredPatients, 
    searchQuery, 
    loading, 
    error 
  } = useSelector(state => state.patients);
  
  // 获取认证状态
  const { isAuthenticated, user, role, token } = useSelector(state => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, critical, stable
  const [debugMode, setDebugMode] = useState(false);
  const [debugToken, setDebugToken] = useState(null);
  
  // 检查token
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('authToken');
        const storedRole = await SecureStore.getItemAsync('userRole');
        setDebugToken(storedToken);
        console.log('🔐 存储的token:', storedToken ? storedToken.substring(0, 20) + '...' : '无');
        console.log('🔐 存储的角色:', storedRole);
      } catch (error) {
        console.error('获取token失败:', error);
      }
    };
    checkToken();
  }, []);
  
  // 快速登录医生账号
  const quickLoginDoctor = async () => {
    try {
      console.log('🔐 开始快速登录医生账号...');
      const result = await dispatch(loginUser({
        phone: '+8613800138001',
        password: '123456',
        userType: 'doctor'
      }));
      
      if (result.type === 'auth/login/fulfilled') {
        console.log('✓ 登录成功');
        // 重新获取患者列表
        dispatch(fetchPatientsList());
      } else {
        console.error('✗ 登录失败:', result.payload);
        Alert.alert('登录失败', result.payload || '未知错误');
      }
    } catch (error) {
      console.error('登录错误:', error);
      Alert.alert('登录错误', error.message);
    }
  };
  
  useEffect(() => {
    // 组件加载时获取患者列表
    console.log('🔍 PatientsListScreen 加载，开始获取患者列表...');
    console.log('🔐 认证状态:', { isAuthenticated, user: user?.name, role, hasToken: !!token });
    dispatch(fetchPatientsList());
  }, [dispatch]);
  
  // 添加调试信息
  useEffect(() => {
    console.log('📊 患者列表状态更新:', {
      patientsList: patientsList ? patientsList.length : 'null',
      filteredPatients: filteredPatients ? filteredPatients.length : 'null',
      loading,
      error,
      searchQuery
    });
  }, [patientsList, filteredPatients, loading, error, searchQuery]);
  
  // 下拉刷新
  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchPatientsList());
    setRefreshing(false);
  };
  
  // 搜索处理
  const handleSearch = (query) => {
    dispatch(setSearchQuery(query));
  };
  
  // 过滤患者
  const getFilteredPatients = () => {
    // 确保始终使用数组
    const sourceList = searchQuery ? filteredPatients : patientsList;
    const patients = Array.isArray(sourceList) ? sourceList : [];
    
    switch (filterType) {
      case 'critical':
        return patients.filter(patient => patient?.risk_level === 'high');
      case 'stable':
        return patients.filter(patient => patient?.risk_level === 'low');
      default:
        return patients;
    }
  };
  
  // 获取风险等级颜色
  const getRiskLevelColor = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };
  
  // 获取风险等级文本
  const getRiskLevelText = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
        return '高风险';
      case 'medium':
        return '中风险';
      case 'low':
        return '低风险';
      default:
        return '未评估';
    }
  };
  
  // 格式化最后活跃时间
  const formatLastActive = (dateString) => {
    if (!dateString) return '从未活跃';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      return `${Math.ceil(diffDays / 7)}周前`;
    } else {
      return `${Math.ceil(diffDays / 30)}个月前`;
    }
  };
  
  // 渲染患者卡片
  const renderPatientCard = ({ item: patient }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PatientDetails', { patient })}>
      <Card style={styles.patientCard}>
        <Card.Content>
          <View style={styles.patientHeader}>
            <Avatar.Text 
              size={50} 
              label={patient.name?.charAt(0) || 'P'} 
              style={styles.avatar}
            />
            <View style={styles.patientInfo}>
              <Text variant="titleMedium" style={styles.patientName}>
                {patient.name || '未知患者'}
              </Text>
              <Text variant="bodySmall" style={styles.patientDetails}>
                {patient.age}岁 • {patient.gender === 'male' ? '男' : '女'}
              </Text>
              <Text variant="bodySmall" style={styles.patientPhone}>
                {patient.phone || '未提供手机号'}
              </Text>
            </View>
            <View 
              style={[styles.riskBadge, { backgroundColor: getRiskLevelColor(patient.risk_level) }]}
            >
              <Text style={styles.riskBadgeText}>
                {getRiskLevelText(patient.risk_level)}
              </Text>
            </View>
          </View>
          
          <View style={styles.patientMeta}>
            <Text variant="bodySmall" style={styles.metaText}>
              最后活跃: {formatLastActive(patient.last_login)}
            </Text>
            
            {patient.bio && (
              <Text variant="bodySmall" style={styles.metaText}>
                {patient.bio}
              </Text>
            )}
          </View>
          
          <View style={styles.patientActions}>
            <Button 
              mode="outlined" 
              compact 
              onPress={() => navigation.navigate('Chat', { userId: patient.id, userName: patient.name })}
              style={styles.actionButton}
            >
              聊天
            </Button>
            <Button 
              mode="outlined" 
              compact 
              onPress={() => navigation.navigate('PatientDetails', { patient })}
              style={styles.actionButton}
            >
              详情
            </Button>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  // 渲染过滤器
  const renderFilters = () => {
    // 确保 patients 始终是一个数组
    const patients = Array.isArray(patientsList) ? patientsList : [];
    
    return (
      <View style={styles.filtersContainer}>
        <Chip 
          selected={filterType === 'all'} 
          onPress={() => setFilterType('all')}
          style={styles.filterChip}
        >
          全部 ({patients.length})
        </Chip>
        <Chip 
          selected={filterType === 'critical'} 
          onPress={() => setFilterType('critical')}
          style={styles.filterChip}
        >
          高风险 ({patients.filter(p => p.risk_level === 'high').length})
        </Chip>
        <Chip 
          selected={filterType === 'stable'} 
          onPress={() => setFilterType('stable')}
          style={styles.filterChip}
        >
          稳定 ({patients.filter(p => p.risk_level === 'low').length})
        </Chip>
      </View>
    );
  };
  
  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        暂无患者
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        您还没有管理任何患者
      </Text>
    </View>
  );
  
  // 渲染加载状态
  if (loading && (!patientsList || patientsList.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>正在加载患者列表...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // 渲染错误状态
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text variant="headlineSmall" style={styles.errorTitle}>
            加载失败
          </Text>
          <Text variant="bodyMedium" style={styles.errorSubtitle}>
            {error}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => dispatch(fetchPatientsList())}
            style={styles.retryButton}
          >
            重试
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  
  const filteredData = getFilteredPatients();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          患者管理
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          管理您的患者健康状况
        </Text>
        {/* 调试按钮 */}
        <TouchableOpacity 
          onPress={() => setDebugMode(!debugMode)}
          style={styles.debugButton}
        >
          <Text style={styles.debugButtonText}>
            {debugMode ? '隐藏调试' : '显示调试'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 调试信息 */}
      {debugMode && (
        <Card style={styles.debugCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.debugTitle}>调试信息</Text>
            <Text style={styles.debugText}>加载状态: {loading ? '加载中' : '已完成'}</Text>
            <Text style={styles.debugText}>错误信息: {error || '无错误'}</Text>
            <Text style={styles.debugText}>原始列表: {patientsList?.length || 0} 个患者</Text>
            <Text style={styles.debugText}>过滤列表: {filteredPatients?.length || 0} 个患者</Text>
            <Text style={styles.debugText}>搜索查询: {searchQuery || '无'}</Text>
            <Text style={styles.debugText}>过滤类型: {filterType}</Text>
            <Text style={styles.debugText}>最终数据: {filteredData?.length || 0} 个患者</Text>
            <Text style={styles.debugText}>--- 认证信息 ---</Text>
            <Text style={styles.debugText}>认证状态: {isAuthenticated ? '已认证' : '未认证'}</Text>
            <Text style={styles.debugText}>用户: {user?.name || '未知'}</Text>
            <Text style={styles.debugText}>角色: {role || '未知'}</Text>
            <Text style={styles.debugText}>Redux token: {token ? token.substring(0, 20) + '...' : '无'}</Text>
            <Text style={styles.debugText}>存储的token: {debugToken ? debugToken.substring(0, 20) + '...' : '无'}</Text>
            <View style={styles.debugActions}>
              <Button 
                mode="contained" 
                onPress={quickLoginDoctor}
                style={styles.debugActionButton}
                compact
              >
                快速登录医生
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => dispatch(fetchPatientsList())}
                style={styles.debugActionButton}
                compact
              >
                重新获取患者
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
      
      <Searchbar
        placeholder="搜索患者姓名或诊断..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      {renderFilters()}
      
      <FlatList
        data={filteredData}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddPatient')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  searchBar: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  patientCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  patientPhone: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  riskBadgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  patientMeta: {
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  patientActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 80,
  },
  emptyTitle: {
    fontSize: 24,
    color: '#666666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorIcon: {
    fontSize: 80,
  },
  errorTitle: {
    fontSize: 24,
    color: '#f44336',
    marginTop: 16,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  debugButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ff9800',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  debugCard: {
    margin: 16,
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  debugTitle: {
    color: '#e65100',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#bf360c',
    marginBottom: 4,
  },
  debugActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  debugActionButton: {
    flex: 1,
    height: 32,
  },
});

export default PatientsListScreen; 