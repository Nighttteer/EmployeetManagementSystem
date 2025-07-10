import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, otherUser } = route.params || {};
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const flatListRef = useRef(null);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
      // 标记会话为已读
      markConversationAsRead();
    }
  }, [conversationId]);

  const loadMessages = async (pageNumber = 1, refresh = false) => {
    if (!conversationId) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNumber === 1) {
        setLoading(true);
      }

      const response = await api.get(`/communication/messages/`, {
        params: {
          conversation_id: conversationId,
          page: pageNumber,
          page_size: 20,
        },
      });

      if (response.data.results) {
        if (pageNumber === 1 || refresh) {
          setMessages(response.data.results);
        } else {
          setMessages(prev => [...prev, ...response.data.results]);
        }
        setHasMore(!!response.data.next);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      Alert.alert('错误', '加载消息失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    const messageText = message.trim();
    setSending(true);

    try {
      const response = await api.post('/communication/messages/', {
        recipient: otherUser.id,
        content: messageText,
        message_type: 'text',
      });

      if (response.data) {
        // 添加新消息到列表顶部
        setMessages(prev => [response.data, ...prev]);
        setMessage('');
        // 滚动到顶部
        flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Alert.alert('错误', '发送消息失败');
    } finally {
      setSending(false);
    }
  };

  const markConversationAsRead = async () => {
    if (!conversationId) return;

    try {
      await api.post(`/communication/conversations/${conversationId}/mark-read/`);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const loadMoreMessages = () => {
    if (!loading && hasMore) {
      loadMessages(page + 1);
    }
  };

  const onRefresh = () => {
    loadMessages(1, true);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.timeText,
            isOwnMessage ? styles.ownTimeText : styles.otherTimeText
          ]}>
            {formatTime(item.sent_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={styles.emptyStateText}>暂无消息</Text>
      <Text style={styles.emptyStateSubtext}>发送一条消息开始对话</Text>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>加载更多...</Text>
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {otherUser ? `与 ${otherUser.name} 的对话` : '聊天'}
          </Text>
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
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {otherUser ? otherUser.name : '聊天'}
            </Text>
            {otherUser && (
              <Text style={styles.headerSubtitle}>
                {otherUser.role === 'doctor' ? '医生' : '患者'}
              </Text>
            )}
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContainer,
            messages.length === 0 && styles.emptyContainer
          ]}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderLoadingFooter}
          ListEmptyComponent={renderEmptyState}
          inverted={messages.length > 0}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="输入消息..."
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity 
            onPress={sendMessage} 
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled
            ]}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  timeText: {
    fontSize: 12,
    marginTop: 4,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  otherTimeText: {
    color: '#666',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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
  },
});

export default ChatScreen; 