import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { useTranslation } from 'react-i18next';
import { fetchPatientsList, setSearchQuery } from '../../store/slices/patientsSlice';
import { resolvePatientRiskLevel, getRiskColor as getUnifiedRiskColor, getRiskText as getUnifiedRiskText } from '../../utils/riskUtils';
import { api } from '../../services/api';


const PatientsListScreen = ({ navigation }) => {
  const { t } = useTranslation();
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
  const [chatLoading, setChatLoading] = useState(false);
  

  


  
  useEffect(() => {
    // 组件加载时获取患者列表
    dispatch(fetchPatientsList());
  }, [dispatch]);

  // 使用useFocusEffect在页面聚焦时刷新患者列表
  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchPatientsList());
    }, [dispatch])
  );
  
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

  // 开始与患者聊天
  const startChatWithPatient = async (patient) => {
    try {
      setChatLoading(true);
      
      // 检查是否已存在会话
      const conversationResponse = await api.get(
        `/communication/conversations/with-user/${patient.id}/`
      );
      
      if (conversationResponse.data) {
        // 已存在会话，跳转到Messages tab并打开聊天
        navigation.navigate('Messages', {
          screen: 'Chat',
          params: {
            conversationId: conversationResponse.data.id,
            otherUser: {
              id: patient.id,
              name: patient.name,
              role: 'patient'
            },
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
            // 创建成功，跳转到Messages tab并打开聊天
            navigation.navigate('Messages', {
              screen: 'Chat',
              params: {
                conversationId: createResponse.data.conversation.id,
                otherUser: {
                  id: patient.id,
                  name: patient.name,
                  role: 'patient'
                },
              },
            });
          }
        } catch (createError) {
          console.error('创建会话失败:', createError);
          Alert.alert(t('common.error'), t('chat.createConversationFailed'));
        }
      } else {
        console.error('检查会话失败:', error);
        Alert.alert(t('common.error'), t('chat.checkConversationFailed'));
      }
    } finally {
      setChatLoading(false);
    }
  };
  
  // 过滤患者（5级风险系统）
  const getFilteredPatients = () => {
    // 确保始终使用数组
    const sourceList = searchQuery ? filteredPatients : patientsList;
    const patients = Array.isArray(sourceList) ? sourceList : [];
    
    switch (filterType) {
      case 'unassessed':
        return patients.filter(patient => resolvePatientRiskLevel(patient) === 'unassessed');
      case 'healthy':
        return patients.filter(patient => resolvePatientRiskLevel(patient) === 'healthy');
      case 'low':
        return patients.filter(patient => resolvePatientRiskLevel(patient) === 'low');
      case 'medium':
        return patients.filter(patient => resolvePatientRiskLevel(patient) === 'medium');
      case 'high':
        return patients.filter(patient => resolvePatientRiskLevel(patient) === 'high');
      default:
        return patients;
    }
  };
  
  
  // 格式化最后活跃时间
  const formatLastActive = (dateString) => {
    if (!dateString) return t('patients.neverActive');
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return t('patients.yesterday');
    } else if (diffDays < 7) {
      return t('patients.daysAgo', { days: diffDays });
    } else if (diffDays < 30) {
      return t('patients.weeksAgo', { weeks: Math.ceil(diffDays / 7) });
    } else {
      return t('patients.monthsAgo', { months: Math.ceil(diffDays / 30) });
    }
  };
  
  // 渲染患者卡片
  const renderPatientCard = ({ item: patient }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PatientDetails', { patient, originTab: 'Patients' })}>
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
                {patient.name || t('patients.unknownPatient')}
              </Text>
              <Text variant="bodySmall" style={styles.patientDetails}>
                {patient.age}{t('patients.yearsOld')} • {patient.gender === 'male' ? t('common.male') : t('common.female')}
              </Text>
              <Text variant="bodySmall" style={styles.patientPhone}>
                {patient.phone || t('patients.noPhoneProvided')}
              </Text>
            </View>
            <Chip 
              style={[styles.riskChip, { 
                backgroundColor: getUnifiedRiskColor(resolvePatientRiskLevel(patient)) 
              }]}
              textStyle={styles.riskChipText}
              compact={true}
            >
              {getUnifiedRiskText(resolvePatientRiskLevel(patient), t)}
            </Chip>
          </View>
          
          <View style={styles.patientMeta}>
            <Text variant="bodySmall" style={styles.metaText}>
              {t('common.lastActive') || 'Last Active'}: {formatLastActive(patient.last_login)}
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
              onPress={() => startChatWithPatient(patient)}
              style={styles.actionButton}
              loading={chatLoading}
              disabled={chatLoading}
            >
              {chatLoading ? t('patients.connecting') : t('patients.chat')}
            </Button>
            <Button 
              mode="outlined" 
              compact 
              onPress={() => navigation.navigate('PatientDetails', { patient })}
              style={styles.actionButton}
            >
              {t('patients.details')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
  
  // 渲染过滤器（5级风险系统）
  const renderFilters = () => {
    // 确保 patients 始终是一个数组
    const patients = Array.isArray(patientsList) ? patientsList : [];
    
    return (
      <View style={styles.filtersContainer}>
        <Chip 
          onPress={() => setFilterType('all')}
          style={[
            styles.filterChip, 
            filterType === 'all' && styles.selectedFilterChip
          ]}
          textStyle={filterType === 'all' ? styles.selectedFilterText : {}}
        >
          {t('common.all')} ({patients.length})
        </Chip>
        <Chip 
          onPress={() => setFilterType('unassessed')}
          style={[
            styles.filterChip, 
            filterType === 'unassessed' && { ...styles.selectedFilterChip, backgroundColor: '#9E9E9E' }
          ]}
          textStyle={filterType === 'unassessed' ? styles.selectedFilterText : {}}
        >
          {t('common.unassessed')} ({patients.filter(p => resolvePatientRiskLevel(p) === 'unassessed').length})
        </Chip>
        <Chip 
          onPress={() => setFilterType('healthy')}
          style={[
            styles.filterChip, 
            filterType === 'healthy' && { ...styles.selectedFilterChip, backgroundColor: '#00E676' }
          ]}
          textStyle={filterType === 'healthy' ? styles.selectedFilterText : {}}
        >
          {t('common.healthy')} ({patients.filter(p => resolvePatientRiskLevel(p) === 'healthy').length})
        </Chip>
        <Chip 
          onPress={() => setFilterType('low')}
          style={[
            styles.filterChip, 
            filterType === 'low' && { ...styles.selectedFilterChip, backgroundColor: '#4CAF50' }
          ]}
          textStyle={filterType === 'low' ? styles.selectedFilterText : {}}
        >
          {t('common.lowRisk')} ({patients.filter(p => resolvePatientRiskLevel(p) === 'low').length})
        </Chip>
        <Chip 
          onPress={() => setFilterType('medium')}
          style={[
            styles.filterChip, 
            filterType === 'medium' && { ...styles.selectedFilterChip, backgroundColor: '#FF9800' }
          ]}
          textStyle={filterType === 'medium' ? styles.selectedFilterText : {}}
        >
          {t('common.mediumRisk')} ({patients.filter(p => resolvePatientRiskLevel(p) === 'medium').length})
        </Chip>
        <Chip 
          onPress={() => setFilterType('high')}
          style={[
            styles.filterChip, 
            filterType === 'high' && { ...styles.selectedFilterChip, backgroundColor: '#F44336' }
          ]}
          textStyle={filterType === 'high' ? styles.selectedFilterText : {}}
        >
          {t('common.highRisk')} ({patients.filter(p => resolvePatientRiskLevel(p) === 'high').length})
        </Chip>
      </View>
    );
  };
  
  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        {t('patients.noPatients')}
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        {t('patients.noManagedPatients')}
      </Text>
    </View>
  );
  
  // 渲染加载状态
  if (loading && (!patientsList || patientsList.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('patients.loadingPatients')}</Text>
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
            {t('common.loadFailed')}
          </Text>
          <Text variant="bodyMedium" style={styles.errorSubtitle}>
            {error}
          </Text>
          <Button 
            mode="contained" 
            onPress={() => dispatch(fetchPatientsList())}
            style={styles.retryButton}
          >
            {t('common.retry')}
          </Button>
        </View>
      </SafeAreaView>
    );
  }
  
  const filteredData = getFilteredPatients();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text variant="headlineMedium" style={styles.title}>
              {t('patients.patientManagement')}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {t('patients.managePatientHealth')}
            </Text>
          </View>

        </View>
      </View>
      
      <Searchbar
        placeholder={t('patients.searchPatientPlaceholder')}
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
    paddingBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  languageButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 16,
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  searchBar: {
    margin: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterChip: {
    marginRight: 8,
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  selectedFilterText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120, // 增加底部padding避免被FAB遮挡
  },
  patientCard: {
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  patientPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
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
  patientMeta: {
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  patientActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
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
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

});

export default PatientsListScreen; 