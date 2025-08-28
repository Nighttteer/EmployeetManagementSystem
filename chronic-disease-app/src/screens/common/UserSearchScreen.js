/**
 * 用户搜索页面组件
 * 
 * 功能特性：
 * - 搜索医生或患者用户
 * - 实时搜索（输入2个字符以上开始搜索）
 * - 显示用户头像、姓名和角色
 * - 支持开始新聊天或打开现有会话
 * - 根据用户角色显示不同的搜索提示
 * - 错误处理和用户反馈
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

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
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

/**
 * 用户搜索页面主组件
 * 
 * 主要功能：
 * - 提供用户搜索界面
 * - 处理搜索逻辑和API调用
 * - 管理搜索结果和加载状态
 * - 处理用户选择和聊天启动
 * - 支持会话创建和导航
 * 
 * @param {Object} navigation - 导航对象，用于页面跳转和聊天导航
 * @returns {JSX.Element} 用户搜索页面组件
 */
const UserSearchScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');      // 搜索查询文本
  const [users, setUsers] = useState([]);                  // 搜索结果用户列表
  const [loading, setLoading] = useState(false);           // 搜索加载状态
  const [searchStarted, setSearchStarted] = useState(false); // 是否已开始搜索
  
  // 从Redux store获取当前用户信息
  const { user } = useSelector(state => state.auth);

  /**
   * 组件加载时的初始化逻辑
   * 目前为空，可根据需要添加初始化代码
   */
  useEffect(() => {
    // 组件加载时的初始化逻辑
  }, []);

  /**
   * 监听搜索查询变化
   * 当输入2个字符以上时自动开始搜索，否则清空结果
   */
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
      setSearchStarted(false);
    }
  }, [searchQuery]);

  /**
   * 搜索用户函数
   * 调用API搜索用户，支持医生和患者搜索
   */
  const searchUsers = async () => {
    setLoading(true);
    setSearchStarted(true);
    
    try {
      // 添加调试信息
      console.log('当前用户:', user);
      console.log('搜索查询:', searchQuery.trim());
      
      // 调用用户搜索API
      const response = await api.get('/communication/users/search/', {
        params: { search: searchQuery.trim() },
      });
      
      console.log('搜索响应:', response.data);
      console.log('搜索结果数量:', response.data.results?.length || 0);
      console.log('搜索结果:', response.data.results);
      
      // 处理分页响应格式，兼容不同的API响应结构
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
        Alert.alert(t('common.error'), t('userSearch.searchUsersFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 开始与用户聊天
   * 检查是否已存在会话，如果不存在则创建新会话
   * 
   * @param {Object} selectedUser - 选中的用户对象
   */
  const startChatWithUser = async (selectedUser) => {
    try {
      setLoading(true);
      
      // 检查是否已存在会话
      const conversationResponse = await api.get(
        `/communication/conversations/with-user/${selectedUser.id}/`
      );
      
      if (conversationResponse.data) {
        // 已存在会话，直接打开聊天界面
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

  /**
   * 渲染单个用户项
   * 显示用户头像、姓名、角色和导航箭头
   * 
   * @param {Object} item - 用户数据对象
   * @returns {JSX.Element} 用户项组件
   */
  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => startChatWithUser(item)}
      activeOpacity={0.7}
    >
      {/* 用户头像，根据角色使用不同颜色 */}
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
      
      {/* 用户信息区域 */}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userRole}>
          {item.role === 'doctor' ? t('auth.doctor') : t('auth.patient')}
        </Text>
      </View>
      
      {/* 导航箭头 */}
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  /**
   * 渲染空状态界面
   * 根据不同的状态显示相应的提示信息
   * 
   * @returns {JSX.Element} 空状态组件
   */
  const renderEmptyState = () => {
    if (loading) {
      // 搜索中状态
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emptyStateText}>{t('userSearch.searching')}</Text>
        </View>
      );
    }
    
    if (!searchStarted) {
      // 未开始搜索状态
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={80} color="#ccc" />
          <Text style={styles.emptyStateText}>{t('userSearch.searchUsers')}</Text>
          <Text style={styles.emptyStateSubtext}>
            {user.role === 'patient' ? t('userSearch.enterDoctorInfo') : t('userSearch.enterPatientInfo')}
          </Text>
        </View>
      );
    }
    
    if (users.length === 0) {
      // 无搜索结果状态
      return (
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={80} color="#ccc" />
          <Text style={styles.emptyStateText}>{t('userSearch.noUsersFound')}</Text>
          <Text style={styles.emptyStateSubtext}>{t('userSearch.tryOtherKeywords')}</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 页面头部 - 返回按钮和标题 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新建聊天</Text>
      </View>

      {/* 搜索区域 - 搜索输入框和清除按钮 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={user.role === 'patient' ? t('userSearch.searchDoctors') : t('userSearch.searchPatients')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {/* 清除搜索内容按钮 */}
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 用户列表 - 显示搜索结果 */}
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

/**
 * 样式定义
 * 包含用户搜索页面的所有UI样式，按功能模块分组
 * 
 * 主要样式组：
 * - 容器和布局样式
 * - 头部样式
 * - 搜索区域样式
 * - 用户列表样式
 * - 用户项样式
 * - 空状态样式
 */
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

/**
 * 导出用户搜索页面组件
 * 作为默认导出，供其他模块使用
 */
export default UserSearchScreen; 