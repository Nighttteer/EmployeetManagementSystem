import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  Avatar,
  Button,
  Chip,
  ActivityIndicator,
  Appbar,
  Divider,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeTranslation } from '../../hooks/useSafeTranslation';
import { searchUnassignedPatients, bindPatientToDoctor } from '../../store/slices/patientsSlice';
import { resolvePatientRiskLevel, getRiskColor, getRiskText } from '../../utils/riskUtils';

const AddPatientScreen = () => {
  const { t, ready } = useSafeTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { unassignedPatients, loading, error } = useSelector((state) => state.patients);
  const { user } = useSelector(state => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);

  // 等待国际化系统完全准备就绪
  if (!ready) {
    console.log('⏳ 等待国际化系统准备就绪...', { ready, tFunctionExists: typeof t === 'function' });
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text>正在加载国际化资源...</Text>
      </View>
    );
  }

  // 调试国际化系统状态
  console.log('✅ 国际化系统已准备就绪');
  console.log('🔍 t函数类型:', typeof t);
  console.log('🔍 测试关键键值:');
  console.log('  common.phone:', t('common.phone'));
  console.log('  common.yearsOld:', t('common.yearsOld'));
  console.log('  common.male:', t('common.male'));
  console.log('  common.female:', t('common.female'));

  // 使用安全的国际化Hook，无需额外的safeT函数

  useEffect(() => {
    // 组件加载时搜索所有未分配的患者
    dispatch(searchUnassignedPatients(''));
  }, [dispatch]);

  // 页面返回聚焦时，刷新数据以避免风险标签使用旧数据
  useFocusEffect(
    React.useCallback(() => {
      dispatch(searchUnassignedPatients(searchQuery || ''));
    }, [dispatch, searchQuery])
  );

  // 搜索患者
  const handleSearch = (query) => {
    setSearchQuery(query);
    dispatch(searchUnassignedPatients(query));
  };

  // 选择/取消选择患者
  const togglePatientSelection = (patient) => {
    setSelectedPatients(prev => {
      const isSelected = prev.some(p => p.id === patient.id);
      if (isSelected) {
        return prev.filter(p => p.id !== patient.id);
      } else {
        return [...prev, patient];
      }
    });
  };

  // 添加选中的患者
  const handleAddPatients = async () => {
    if (selectedPatients.length === 0) {
      Alert.alert(t('common.notice'), t('patients.pleaseSelectAtLeastOnePatient'));
      return;
    }

    try {
      // 批量绑定患者
      const bindingPromises = selectedPatients.map(patient => 
        dispatch(bindPatientToDoctor({
          patientId: patient.id,
          doctorId: user.id
        }))
      );

      const results = await Promise.all(bindingPromises);
      
      // 检查是否有失败的绑定
      const failedBindings = results.filter(result => result.type.includes('rejected'));
      
      if (failedBindings.length === 0) {
        Alert.alert(
          t('common.success'),
          t('patients.successfullyAddedPatients', { count: selectedPatients.length }),
          [
            {
              text: t('common.confirm'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          t('patients.partialAddFailed'),
          t('patients.partialAddFailedMessage', { 
            successCount: selectedPatients.length - failedBindings.length, 
            failedCount: failedBindings.length 
          }),
          [
            {
              text: t('common.confirm'),
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('添加患者失败:', error);
      Alert.alert(t('patients.addFailed'), t('patients.addPatientError'));
    }
  };

  // 获取卡片风险等级
  const getCardRiskLevel = (patient) => resolvePatientRiskLevel(patient);
  
  // 获取风险等级文本（国际化）
  const getLocalizedRiskText = (level) => {
    switch (level) {
      case 'high': return t('common.highRisk');
      case 'medium': return t('common.mediumRisk');
      case 'low': return t('common.lowRisk');
      case 'healthy': return t('common.healthy');
      default: return t('common.unassessed');
    }
  };

  // 渲染患者卡片
  const renderPatientCard = ({ item: patient }) => {
    const isSelected = selectedPatients.some(p => p.id === patient.id);
    const level = getCardRiskLevel(patient);
    const riskColor = getRiskColor(level);
    const riskText = getLocalizedRiskText(level);

    return (
      <Card 
        style={[
          styles.patientCard,
          isSelected && styles.selectedCard
        ]}
        onPress={() => togglePatientSelection(patient)}
      >
        <Card.Content>
          <View style={styles.patientHeader}>
            <Avatar.Text 
              size={40} 
              label={patient.name?.charAt(0) || t('patients.patient')}
              style={[styles.avatar, { backgroundColor: getRiskColor(level) }]}
            />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientDetails}>
                {patient.age}{t('common.yearsOld')} • {patient.gender === 'male' ? t('common.male') : t('common.female')}
              </Text>
              <Text style={styles.patientPhone}>
                {t('common.phone')}: {patient.phone}
              </Text>
              {patient.bio && (
                <Text style={styles.patientBio} numberOfLines={2}>
                  {patient.bio}
                </Text>
              )}
            </View>
            <View style={styles.patientActions}>
              <Chip
                style={[styles.riskChip, { backgroundColor: riskColor }]}
                textStyle={styles.riskText}
                compact={true}
              >
                {riskText}
              </Chip>
              <IconButton
                icon={isSelected ? "check-circle" : "plus-circle-outline"}
                iconColor={isSelected ? "#4caf50" : "#2196F3"}
                size={24}
                onPress={() => togglePatientSelection(patient)}
              />
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // 渲染空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>
        {searchQuery ? t('patients.noMatchingPatients') : t('patients.noUnassignedPatients')}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? t('patients.tryOtherSearchCriteria') : t('patients.allPatientsAssigned')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('patients.addPatient')} />
        {selectedPatients.length > 0 && (
          <Appbar.Action
            icon="check"
            onPress={handleAddPatients}
            disabled={loading}
          />
        )}
      </Appbar.Header>

      <View style={styles.content}>
        <Searchbar
          placeholder={t('patients.searchPatientPlaceholder')}
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {selectedPatients.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedText}>
              {t('patients.selectedPatients', { count: selectedPatients.length })}
            </Text>
            <Button
              mode="contained"
              onPress={handleAddPatients}
              disabled={loading}
              style={styles.addButton}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : t('patients.addPatient')}
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        {loading && !unassignedPatients.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>{t('patients.searchingPatients')}</Text>
          </View>
        ) : (
          <FlatList
            data={unassignedPatients}
            renderItem={renderPatientCard}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  selectedContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#2196F3',
  },
  divider: {
    marginVertical: 8,
  },
  listContainer: {
    paddingBottom: 20,
  },
  patientCard: {
    marginBottom: 12,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    backgroundColor: '#2196F3',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientBio: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  patientActions: {
    alignItems: 'center',
  },
  riskChip: {
    marginBottom: 8,
    height: 32,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
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
});

export default AddPatientScreen; 