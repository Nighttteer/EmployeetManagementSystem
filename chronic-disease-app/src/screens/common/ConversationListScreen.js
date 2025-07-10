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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../services/api';

const ConversationListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total_conversations: 0,
    unread_count: 0,
  });
  const { user } = useSelector(state => state.auth);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      loadStats();
    }, [])
  );

  const loadConversations = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get('/communication/conversations/');
      
      if (response.data.results) {
        setConversations(response.data.results);
      }
    } catch (error) {
      console.error('加载会话失败:', error);
      Alert.alert('错误', '加载会话失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/communication/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  };

  const openChat = (conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUser: conversation.other_participant,
    });
  };

  const startNewChat = () => {
    navigation.navigate('UserSearch');
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '今天';
    } else if (diffDays === 2) {
      return '昨天';
    } else if (diffDays <= 7) {
      return `${diffDays - 1}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
      });
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => openChat(item)}
      activeOpacity={0.7}
    >
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
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unread_count > 99 ? '99+' : item.unread_count}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.participantName} numberOfLines={1}>
            {item.other_participant?.name || '未知用户'}
          </Text>
          <Text style={styles.timeText}>
            {formatTime(item.last_message_at)}
          </Text>
        </View>
        
        <View style={styles.conversationBody}>
          <Text style={styles.roleText}>
            {item.other_participant?.role === 'doctor' ? '医生' : '患者'}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={2}>
            {item.last_message ? item.last_message.content : '暂无消息'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={styles.emptyStateText}>暂无会话</Text>
      <Text style={styles.emptyStateSubtext}>点击右上角开始新的对话</Text>
      <TouchableOpacity style={styles.startChatButton} onPress={startNewChat}>
        <Text style={styles.startChatButtonText}>开始聊天</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.total_conversations}</Text>
        <Text style={styles.statLabel}>总会话数</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statValue, styles.unreadValue]}>
          {stats.unread_count}
        </Text>
        <Text style={styles.statLabel}>未读消息</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>消息</Text>
          <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>消息</Text>
        <TouchableOpacity onPress={startNewChat} style={styles.newChatButton}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
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

export default ConversationListScreen; 