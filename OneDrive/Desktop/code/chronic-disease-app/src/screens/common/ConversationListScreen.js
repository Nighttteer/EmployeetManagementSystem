import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';

/**
 * 会话列表界面主组件
 * 
 * 主要功能：
 * - 加载和显示用户的所有会话
 * - 处理会话点击导航到聊天界面
 * - 管理会话列表的加载状态和刷新
 * - 显示会话统计信息
 * 
 * @param {Object} navigation - 导航对象，用于页面跳转
 * @returns {JSX.Element} 会话列表界面组件
 */
const ConversationListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // 基础状态管理
  const [conversations, setConversations] = useState([]);  // 会话列表数组
  const [loading, setLoading] = useState(true);            // 首次加载状态指示器
  const [refreshing, setRefreshing] = useState(false);     // 下拉刷新状态
  
  // 会话统计信息
  const [stats, setStats] = useState({
    total_conversations: 0,  // 总会话数量
    unread_count: 0,         // 总未读消息数量
  });
  
  // 从Redux store获取当前用户信息
  const { user } = useSelector(state => state.auth);

  /**
   * 页面焦点效果钩子
   * 每次页面获得焦点时，自动加载会话列表和统计信息
   * 确保用户从其他页面返回时能看到最新数据
   */
  useFocusEffect(
    useCallback(() => {
      loadConversations();  // 加载会话列表
      loadStats();          // 加载统计信息
    }, [])
  );

  /**
   * 加载会话列表
   * 从API获取用户的会话列表，支持刷新和首次加载两种模式
   * 
   * @param {boolean} refresh - 是否为刷新操作，默认为false
   */
  const loadConversations = async (refresh = false) => {
    try {
      // 根据操作类型设置不同的加载状态
      if (refresh) {
        setRefreshing(true);  // 下拉刷新状态
      } else {
        setLoading(true);     // 首次加载状态
      }

      // 调用API获取会话列表
      const response = await api.get('/communication/conversations/');
      
      if (response.data.results) {
        setConversations(response.data.results);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
      Alert.alert(t('common.error'), t('chat.loadConversationsFailed'));
    } finally {
      // 无论成功还是失败，都要重置加载状态
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * 加载会话统计信息
   * 获取总会话数和总未读消息数等统计数据
   */
  const loadStats = async () => {
    try {
      const response = await api.get('/communication/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  /**
   * 打开聊天界面
   * 导航到聊天界面，传递会话ID和聊天对象信息
   * 
   * @param {Object} conversation - 会话对象，包含会话ID和参与者信息
   */
  const openChat = (conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUser: conversation.other_participant,
    });
  };

  /**
   * 开始新聊天
   * 导航到用户搜索界面，让用户选择聊天对象
   */
  const startNewChat = () => {
    navigation.navigate('UserSearch');
  };

  /**
   * 格式化时间显示
   * 根据时间距离现在的时间差，显示相对时间或具体日期
   * 
   * @param {string} timestamp - ISO格式的时间戳字符串
   * @returns {string} 格式化后的时间字符串
   */
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return t('time.today');                    // 今天
    } else if (diffDays === 2) {
      return t('time.yesterday');                // 昨天
    } else if (diffDays <= 7) {
      return t('time.daysAgo', { days: diffDays - 1 }); // X天前
    } else {
      // 超过7天显示具体日期
      return date.toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-US', {
        month: '2-digit',
        day: '2-digit',
      });
    }
  };

  /**
   * 渲染单个会话项
   * 显示会话的头像、名称、角色、最后消息和时间
   * 
   * @param {Object} item - 会话数据对象
   * @returns {JSX.Element} 会话项组件
   */
  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => openChat(item)}
      activeOpacity={0.7}
    >
      {/* 头像容器，包含头像和未读消息徽章 */}
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatar,
          item.other_participant?.role === 'doctor' ? styles.doctorAvatar : styles.patientAvatar
        ]}>
          <Ionicons 
            name={item.other_participant?.role === 'doctor' ? 'medical' : 'person'} 
            size={24} 
            color="#fff" 
          />
        </View>
        {/* 未读消息数量徽章 */}
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unread_count > 99 ? '99+' : item.unread_count}
            </Text>
          </View>
        )}
      </View>
      
      {/* 会话内容区域 */}
      <View style={styles.conversationContent}>
        {/* 会话头部：名称和时间 */}
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName} numberOfLines={1}>
            {item.other_participant?.name || t('chat.unknownUser')}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(item.last_message_at)}
          </Text>
        </View>
        
        {/* 会话主体：角色标签和最后消息 */}
        <View style={styles.conversationBody}>
          <Text style={styles.roleText}>
            {item.other_participant?.role === 'doctor' ? t('auth.doctor') : t('auth.patient')}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.last_message ? item.last_message.content : t('chat.noMessages')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * 渲染空状态界面
   * 当没有会话时显示，包含图标、提示文字和开始聊天按钮
   * 
   * @returns {JSX.Element} 空状态组件
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={styles.emptyStateText}>{t('chat.noConversations')}</Text>
      <Text style={styles.emptyStateSubtext}>{t('chat.clickToStartNewChat')}</Text>
      <TouchableOpacity style={styles.startChatButton} onPress={startNewChat}>
        <Text style={styles.startChatButtonText}>{t('chat.startChat')}</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * 渲染统计信息头部
   * 显示总会话数和未读消息数的统计卡片
   * 
   * @returns {JSX.Element} 统计信息头部组件
   */
  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.total_conversations}</Text>
        <Text style={styles.statLabel}>{t('chat.totalConversations')}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, styles.unreadValue]}>
          {stats.unread_count}
        </Text>
        <Text style={styles.statLabel}>{t('chat.unreadMessages')}</Text>
      </View>
    </View>
  );

  // 首次加载时显示加载界面
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('navigation.messages')}</Text>
          <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 主界面：显示会话列表
  return (
    <SafeAreaView style={styles.container}>
      {/* 页面头部：标题和新建聊天按钮 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('navigation.messages')}</Text>
        <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 会话列表 */}
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item, index) => item?.id?.toString() || `conversation-${index}`}
        style={styles.conversationsList}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadConversations(true)}
            colors={['#007AFF']}
          />
        }
        ListHeaderComponent={conversations.length > 0 ? renderHeader : null}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

/**
 * 样式定义
 * 包含会话列表界面的所有UI样式，按功能模块分组
 * 
 * 主要样式组：
 * - 容器和布局样式
 * - 头部样式
 * - 会话项样式
 * - 头像和徽章样式
 * - 统计信息样式
 * - 空状态和加载样式
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  newChatButton: {
    padding: 8,
  },
  conversationsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorAvatar: {
    backgroundColor: '#007AFF',
  },
  patientAvatar: {
    backgroundColor: '#34C759',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  conversationBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  unreadValue: {
    color: '#FF3B30',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  startChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  startChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

/**
 * 导出会话列表界面组件
 * 作为默认导出，供其他模块使用
 */
export default ConversationListScreen; 