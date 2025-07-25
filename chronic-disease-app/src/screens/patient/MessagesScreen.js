import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  List, 
  Searchbar,
  FAB,
  Button,
  Chip,
  Avatar,
  Badge
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

const MessagesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // 模拟对话数据
  const [conversations, setConversations] = useState([
    {
      id: 1,
      doctorId: 'doctor_001',
      doctorName: '张医生',
      doctorSpecialty: '内分泌科',
      lastMessage: '您的血糖控制得不错，继续保持。记得按时服药。',
      lastMessageTime: '2024-01-15 14:30',
      unreadCount: 2,
      isOnline: true,
      avatar: null,
      status: 'active'
    },
    {
      id: 2,
      doctorId: 'doctor_002',
      doctorName: '李医生',
      doctorSpecialty: '心血管科',
      lastMessage: '下次复查时间建议安排在下周三。',
      lastMessageTime: '2024-01-14 16:45',
      unreadCount: 0,
      isOnline: false,
      avatar: null,
      status: 'active'
    },
    {
      id: 3,
      doctorId: 'doctor_003',
      doctorName: '王医生',
      doctorSpecialty: '营养科',
      lastMessage: '饮食计划已经为您调整，请查看附件。',
      lastMessageTime: '2024-01-13 10:20',
      unreadCount: 1,
      isOnline: true,
      avatar: null,
      status: 'active'
    },
    {
      id: 4,
      doctorId: 'doctor_004',
      doctorName: '赵医生',
      doctorSpecialty: '康复科',
      lastMessage: '运动计划执行得如何？有什么不适吗？',
      lastMessageTime: '2024-01-12 09:15',
      unreadCount: 0,
      isOnline: false,
      avatar: null,
      status: 'archived'
    }
  ]);

  const filterButtons = [
    { value: 'all', label: t('messages.all') },
    { value: 'unread', label: t('messages.unread') },
    { value: 'active', label: t('messages.active') }
  ];

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    // 这里应该调用API获取真实的对话数据
    console.log('加载对话列表');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const getFilteredConversations = () => {
    let filtered = conversations;

    // 应用搜索过滤
    if (searchQuery.trim()) {
      filtered = filtered.filter(conv =>
        conv.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.doctorSpecialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 应用状态过滤
    switch (selectedFilter) {
      case 'unread':
        filtered = filtered.filter(conv => conv.unreadCount > 0);
        break;
      case 'active':
        filtered = filtered.filter(conv => conv.status === 'active');
        break;
      default:
        break;
    }

    return filtered;
  };

  const formatTime = (timeString) => {
    const messageTime = new Date(timeString);
    const now = new Date();
    const diffInHours = Math.floor((now - messageTime) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));
      return diffInMinutes < 1 ? t('messages.justNow') : t('messages.minutesAgo', { count: diffInMinutes });
    } else if (diffInHours < 24) {
      return t('messages.hoursAgo', { count: diffInHours });
    } else {
      return messageTime.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const openChat = (conversation) => {
    // 标记为已读
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );

    // 导航到聊天界面
    navigation.navigate('ChatScreen', {
      doctorId: conversation.doctorId,
      doctorName: conversation.doctorName,
      conversationId: conversation.id
    });
  };

  const startNewChat = () => {
    // 导航到医生搜索界面
    navigation.navigate('UserSearch');
  };

  const archiveConversation = (conversationId) => {
    Alert.alert(
      t('messages.archiveConversation'),
      t('messages.archiveConfirmation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('messages.archive'),
          onPress: () => {
            setConversations(prev =>
              prev.map(conv =>
                conv.id === conversationId
                  ? { ...conv, status: 'archived' }
                  : conv
              )
            );
          }
        }
      ]
    );
  };

  const renderConversationItem = ({ item }) => (
    <Card style={styles.conversationCard}>
      <List.Item
        title={item.doctorName}
        description={
          <View style={styles.messagePreview}>
            <Text numberOfLines={2} style={styles.lastMessage}>
              {item.lastMessage}
            </Text>
            <View style={styles.messageInfo}>
              <Chip mode="outlined" compact style={styles.specialtyChip}>
                {item.doctorSpecialty}
              </Chip>
              <Text style={styles.messageTime}>{formatTime(item.lastMessageTime)}</Text>
            </View>
          </View>
        }
        left={(props) => (
          <View style={styles.avatarContainer}>
            <Avatar.Text 
              size={50} 
              label={item.doctorName.charAt(0)} 
              style={styles.avatar}
            />
            {item.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
        )}
        right={(props) => (
          <View style={styles.conversationMeta}>
            {item.unreadCount > 0 && (
              <Badge style={styles.unreadBadge}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Badge>
            )}
            <Button
              mode="text"
              onPress={() => archiveConversation(item.id)}
              style={styles.archiveButton}
            >
              <Ionicons name="archive-outline" size={16} color="#666" />
            </Button>
          </View>
        )}
        onPress={() => openChat(item)}
        style={styles.listItem}
      />
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? t('messages.noMatchingConversations') : t('messages.noConversations')}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? t('messages.tryDifferentKeywords')
          : t('messages.startFirstConversation')
        }
      </Text>
      {!searchQuery && (
        <Button
          mode="contained"
          onPress={startNewChat}
          style={styles.startChatButton}
        >
          {t('messages.findDoctor')}
        </Button>
      )}
    </View>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      {filterButtons.map(filter => (
        <Chip
          key={filter.value}
          mode={selectedFilter === filter.value ? 'flat' : 'outlined'}
          selected={selectedFilter === filter.value}
          onPress={() => setSelectedFilter(filter.value)}
          style={styles.filterChip}
        >
          {filter.label}
        </Chip>
      ))}
    </View>
  );

  const filteredConversations = getFilteredConversations();
  const unreadTotal = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* 页面标题和统计 */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          {t('messages.messages')}
        </Text>
        <View style={styles.statsContainer}>
          <Chip mode="outlined" icon="chatbubble">
            {conversations.length} {t('messages.conversations')}
          </Chip>
          {unreadTotal > 0 && (
            <Chip mode="flat" icon="notifications" style={styles.unreadChip}>
              {unreadTotal} {t('messages.unread')}
            </Chip>
          )}
        </View>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('messages.searchConversations')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* 过滤器 */}
      {renderFilterChips()}

      {/* 对话列表 */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        style={styles.conversationsList}
        contentContainerStyle={
          filteredConversations.length === 0 ? styles.emptyListContainer : null
        }
      />

      {/* 浮动操作按钮 */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={startNewChat}
        label={t('messages.newChat')}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadChip: {
    marginLeft: 8,
    backgroundColor: '#ff4444',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  filterChip: {
    marginRight: 8,
  },
  conversationsList: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  conversationCard: {
    marginHorizontal: 16,
    marginVertical: 4,
    elevation: 1,
  },
  listItem: {
    paddingVertical: 8,
  },
  messagePreview: {
    marginTop: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  specialtyChip: {
    height: 24,
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  avatar: {
    backgroundColor: '#2196F3',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationMeta: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
  },
  unreadBadge: {
    backgroundColor: '#ff4444',
    color: 'white',
    marginBottom: 4,
  },
  archiveButton: {
    minWidth: 0,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  startChatButton: {
    minWidth: 150,
  },
  emptyListContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default MessagesScreen; 