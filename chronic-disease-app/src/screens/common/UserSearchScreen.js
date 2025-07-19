import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { debugAuthStatus } from '../../utils/debugAuth';

const UserSearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchStarted, setSearchStarted] = useState(false);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // 组件加载时检查认证状态
    debugAuthStatus();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
      setSearchStarted(false);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    setSearchStarted(true);
    
    try {
      // 添加调试信息
      console.log('当前用户:', user);
      console.log('搜索查询:', searchQuery.trim());
      
      const response = await api.get('/communication/users/search/', {
        params: { search: searchQuery.trim() },
      });
      
      console.log('搜索响应:', response.data);
      console.log('搜索结果数量:', response.data.results?.length || 0);
      console.log('搜索结果:', response.data.results);
      
      // 处理分页响应格式
      const results = response.data.results || response.data;
      setUsers(results);
    } catch (error) {
      console.error('搜索用户失败:', error);
      console.error('错误详情:', error.response?.data);
      console.error('错误状态:', error.response?.status);
      
      if (error.response?.status === 401) {
        Alert.alert('认证失败', '请重新登录后再试');
        // 可以在这里添加跳转到登录页的逻辑
      } else {
        Alert.alert('错误', '搜索用户失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const startChatWithUser = async (selectedUser) => {
    try {
      setLoading(true);
      
      // 检查是否已存在会话
      const conversationResponse = await api.get(
        `/communication/conversations/with-user/${selectedUser.id}/`
      );
      
      if (conversationResponse.data) {
        // 已存在会话，直接打开
        navigation.replace('Chat', {
          conversationId: conversationResponse.data.id,
          otherUser: selectedUser,
        });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        // 会话不存在，创建新会话
        try {
          const createResponse = await api.post(
            `/communication/conversations/start-with-user/${selectedUser.id}/`
          );
          
          if (createResponse.data.conversation) {
            navigation.replace('Chat', {
              conversationId: createResponse.data.conversation.id,
              otherUser: selectedUser,
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

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => startChatWithUser(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.avatar,
        item.role === 'doctor' ? styles.doctorAvatar : styles.patientAvatar
      ]}>
        <Ionicons 
          name={item.role === 'doctor' ? 'medical' : 'person'} 
          size={24} 
          color="#fff" 
        />
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userRole}>
          {item.role === 'doctor' ? '医生' : '患者'}
        </Text>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyStateText}>搜索中...</Text>
        </View>
      );
    }
    
    if (!searchStarted) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={80} color="#ccc" />
          <Text style={styles.emptyStateText}>搜索用户</Text>
          <Text style={styles.emptyStateSubtext}>
            {user.role === 'patient' ? '输入医生姓名或手机号' : '输入患者姓名或手机号'}
          </Text>
        </View>
      );
    }
    
    if (users.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={80} color="#ccc" />
          <Text style={styles.emptyStateText}>未找到用户</Text>
          <Text style={styles.emptyStateSubtext}>请尝试其他搜索词</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新建聊天</Text>
        <TouchableOpacity onPress={debugAuthStatus} style={styles.debugButton}>
          <Ionicons name="bug" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>



      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={user.role === 'patient' ? '搜索医生...' : '搜索患者...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        

      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item, index) => item?.id?.toString() || `user-${index}`}
        style={styles.usersList}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : null}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  debugButton: {
    padding: 8,
  },

  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  usersList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorAvatar: {
    backgroundColor: '#007AFF',
  },
  patientAvatar: {
    backgroundColor: '#34C759',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },

});

export default UserSearchScreen; 