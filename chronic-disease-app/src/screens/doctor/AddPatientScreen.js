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
import { useNavigation } from '@react-navigation/native';
import { searchUnassignedPatients, bindPatientToDoctor } from '../../store/slices/patientsSlice';

const AddPatientScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { unassignedPatients, loading, error } = useSelector((state) => state.patients);
  const { user } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatients, setSelectedPatients] = useState([]);

  useEffect(() => {
    // 组件加载时搜索所有未分配的患者
    dispatch(searchUnassignedPatients(''));
  }, [dispatch]);

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
      Alert.alert('提示', '请选择至少一个患者');
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
          '添加成功',
          `成功添加了 ${selectedPatients.length} 名患者`,
          [
            {
              text: '确定',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          '部分添加失败',
          `成功添加了 ${selectedPatients.length - failedBindings.length} 名患者，${failedBindings.length} 名患者添加失败`,
          [
            {
              text: '确定',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('添加患者失败:', error);
      Alert.alert('添加失败', '添加患者时发生错误');
    }
  };

  // 获取患者风险级别颜色
  const getRiskColor = (patient) => {
    const conditions = patient.bio?.toLowerCase() || '';
    if (conditions.includes('高血压') || conditions.includes('糖尿病') || conditions.includes('心脏病')) {
      return '#f44336';
    } else if (conditions.includes('肥胖') || conditions.includes('血脂')) {
      return '#ff9800';
    } else {
      return '#4caf50';
    }
  };

  // 获取患者风险级别文本
  const getRiskText = (patient) => {
    const conditions = patient.bio?.toLowerCase() || '';
    if (conditions.includes('高血压') || conditions.includes('糖尿病') || conditions.includes('心脏病')) {
      return '高风险';
    } else if (conditions.includes('肥胖') || conditions.includes('血脂')) {
      return '中风险';
    } else {
      return '低风险';
    }
  };

  // 渲染患者卡片
  const renderPatientCard = ({ item: patient }) => {
    const isSelected = selectedPatients.some(p => p.id === patient.id);
    const riskColor = getRiskColor(patient);
    const riskText = getRiskText(patient);

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
              size={50}
              label={patient.name?.charAt(0) || '患'}
              style={styles.avatar}
            />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientDetail}>
                {patient.age}岁 • {patient.gender === 'male' ? '男' : '女'}
              </Text>
              <Text style={styles.patientDetail}>
                手机: {patient.phone}
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
        {searchQuery ? '未找到匹配的患者' : '暂无未分配的患者'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? '请尝试其他搜索条件' : '所有患者都已分配医生'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="添加患者" />
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
          placeholder="搜索患者姓名、手机号或症状..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />

        {selectedPatients.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedText}>
              已选择 {selectedPatients.length} 名患者
            </Text>
            <Button
              mode="contained"
              onPress={handleAddPatients}
              disabled={loading}
              style={styles.addButton}
            >
              {loading ? <ActivityIndicator size="small" color="#fff" /> : '添加患者'}
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

        {loading && !unassignedPatients.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>正在搜索患者...</Text>
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
  patientDetail: {
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
  },
  riskText: {
    color: '#fff',
    fontSize: 12,
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