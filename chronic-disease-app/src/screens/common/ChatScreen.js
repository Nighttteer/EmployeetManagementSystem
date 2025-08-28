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
  Image,
  ActionSheet,
  PanResponder,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { api } from '../../services/api';
import ImagePreviewModal from '../../components/ImagePreviewModal';
//const 是因为这个“state variable + Modify function”的绑定不会改变
// 声明常量，表示一个不可重新赋值的变量。Declare constants to represent a variable that cannot be reassigned.
const ChatScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  
  // 从路由参数中获取会话信息
  const { conversationId, otherUser, returnTo } = route.params || {};
  
  // 基础聊天状态
  const [message, setMessage] = useState('');           // 当前输入框的文本内容
  const [messages, setMessages] = useState([]);         // 消息列表数组
  const [loading, setLoading] = useState(true);         // 首次加载状态指示器
  const [sending, setSending] = useState(false);        // 消息发送中状态
  const [refreshing, setRefreshing] = useState(false);  // 下拉刷新状态
  const [page, setPage] = useState(1);                  // 当前加载的页码
  const [hasMore, setHasMore] = useState(true);         // 是否还有更多消息可加载
  
  // 引用对象
  const flatListRef = useRef(null);                     // FlatList组件的引用，用于滚动控制
  
  // 从Redux store获取当前用户信息
  const { user } = useSelector(state => state.auth);

  // 语音录制相关状态
  const [recording, setRecording] = useState(null);           // 录音对象实例
  const [isRecording, setIsRecording] = useState(false);     // 是否正在录音
  const [recordingDuration, setRecordingDuration] = useState(0); // 录音持续时间（秒）
  const [playingSound, setPlayingSound] = useState(null);    // 当前播放的音频对象
  const [playingMessageId, setPlayingMessageId] = useState(null); // 正在播放的消息ID
  const [recordingTimer, setRecordingTimer] = useState(null); // 录音计时器

  // 图片预览相关状态
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false); // 图片预览模态框显示状态
  const [previewImageUrl, setPreviewImageUrl] = useState('');           // 预览图片的URL

  /**
   * 组件挂载和会话ID变化时的副作用
   * 当会话ID存在时，加载消息并标记会话为已读
   */
  useEffect(() => {
    if (conversationId) {
      loadMessages();                    // 加载聊天消息
      markConversationAsRead();          // 标记会话为已读
    }
  }, [conversationId]);

  /**
   * 组件卸载时的清理副作用
   * 清理音频资源、录音对象和计时器，防止内存泄漏
   */
  useEffect(() => {
    return () => {
      // 清理音频资源
      if (playingSound) {
        playingSound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, []);

  const loadMessages = async (pageNumber = 1, refresh = false) => {
    // 如果没有会话ID，直接返回
    if (!conversationId) return;

    try {
      // 根据操作类型设置不同的加载状态
      if (refresh) {
        // 下拉刷新：显示刷新指示器
        setRefreshing(true);
      } else if (pageNumber === 1) {
        // 首次加载或重新加载第一页：显示主加载指示器
        setLoading(true);
      }

      // 调用API获取消息数据
      const response = await api.get(`/communication/messages/`, {
        params: {
          conversation_id: conversationId,  // 会话ID
          page: pageNumber,                 // 页码
          page_size: 20,                   // 每页消息数量
        },
      });

      // 检查API响应是否包含消息数据
      if (response.data.results) {
        if (pageNumber === 1 || refresh) {
          // 第一页或刷新：完全替换消息列表
          setMessages(response.data.results);
        } else {
          // 加载更多页：将新消息追加到现有列表末尾
          setMessages(prev => [...prev, ...response.data.results]);
        }
        
        // 更新是否还有更多页面的状态
        // !!response.data.next 将值转换为布尔值
        setHasMore(!!response.data.next);
        
        // 更新当前页码
        setPage(pageNumber);
      }
    } catch (error) {
      // 错误处理：记录错误并显示用户友好的提示
      console.error('加载消息失败:', error);
      Alert.alert(t('common.error'), t('chat.loadMessagesFailed'));
    } finally {
      // 无论成功还是失败，都要重置加载状态
      setLoading(false);      // 重置主加载状态
      setRefreshing(false);   // 重置刷新状态
    }
  };

  /**
   * 请求音频录制权限
   * 检查并请求麦克风权限，如果被拒绝则显示提示
   * 
   * @returns {Promise<boolean>} 权限是否被授予
   */
  const requestAudioPermission = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chat.permissionDenied'), t('chat.microphonePermissionRequired'));
      return false;
    }
    return true;
  };

  /**
   * 开始录制语音消息
   * 设置音频模式，创建录音实例，并启动录音计时器
   * 支持Android、iOS和Web平台的音频配置
   */
  const startRecording = async () => {
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // 开始计时器，每秒更新录音持续时间
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      setRecordingTimer(timer);

    } catch (error) {
      console.error('录制失败:', error);
      Alert.alert(t('common.error'), t('chat.recordingFailed'));
    }
  };

  /**
   * 停止录制并发送语音消息
   * 停止录音，获取音频文件URI，清理录音状态，然后发送消息
   */
  const stopRecordingAndSend = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // 清理录音相关状态
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }

      // 发送语音消息
      if (uri) {
        await sendMessage('audio', uri);
      }
    } catch (error) {
      console.error('停止录制失败:', error);
      Alert.alert(t('common.error'), t('chat.recordingFailed'));
    }
  };

  /**
   * 取消录音录制
   * 停止录音并清理所有相关状态，不发送消息
   */
  const cancelRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      setRecording(null);
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingTimer) {
        clearInterval(recordingTimer);
        setRecordingTimer(null);
      }
    } catch (error) {
      console.error('取消录制失败:', error);
    }
  };

  // 播放语音
  const playAudio = async (audioUri, messageId) => {
    try {
      console.log('=== 语音播放调试信息 ===');
      console.log('原始音频URI:', audioUri);
      console.log('消息ID:', messageId);
      console.log('当前播放状态:', playingMessageId === messageId ? '正在播放' : '未播放');
      
      // 停止当前播放
      if (playingSound) {
        await playingSound.unloadAsync();
        setPlayingSound(null);
        setPlayingMessageId(null);
      }

      // 如果点击的是正在播放的消息，就停止播放
      if (playingMessageId === messageId) {
        return;
      }

      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 构建完整的音频URI
      let fullAudioUri = audioUri;
      if (audioUri) {
        // 检查是否是媒体文件URL，如果是则转换为音频服务端点
        if (audioUri.includes('/media/message_attachments/')) {
          const baseUrl = api.defaults.baseURL || 'http://localhost:8000/api';
          // 提取文件路径部分
          const filePath = audioUri.split('/media/message_attachments/')[1];
          fullAudioUri = `${baseUrl}/communication/audio/message_attachments/${filePath}`;
        } else if (!audioUri.startsWith('http') && !audioUri.startsWith('file://')) {
          // 如果是相对路径，使用专门的音频文件服务端点
          const baseUrl = api.defaults.baseURL || 'http://localhost:8000/api';
          // 移除 /media/ 前缀，因为我们的音频服务端点会处理路径
          const cleanPath = audioUri.replace('/media/', '');
          fullAudioUri = `${baseUrl}/communication/audio/${cleanPath}`;
        }
      }

      console.log('完整音频URI:', fullAudioUri);

      // 先检查文件是否可访问（可选，如果网络较慢可以跳过）
      try {
        const response = await fetch(fullAudioUri, { method: 'HEAD' });
        console.log('文件访问状态:', response.status, response.headers.get('content-type'));
        if (!response.ok) {
          console.warn(`文件访问状态异常: ${response.status}，但继续尝试播放`);
        }
      } catch (fetchError) {
        console.warn('文件访问检查失败，但继续尝试播放:', fetchError);
        // 不阻止播放，因为某些情况下HEAD请求可能失败但文件仍然可访问
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: fullAudioUri },
        { shouldPlay: true },
        (status) => {
          console.log('播放状态更新:', status);
          if (status.didJustFinish) {
            setPlayingSound(null);
            setPlayingMessageId(null);
          }
          if (status.error) {
            console.error('播放错误:', status.error);
            setPlayingSound(null);
            setPlayingMessageId(null);
            Alert.alert(t('chat.playbackFailed'), t('chat.audioPlaybackError'));
          }
        }
      );
      
      setPlayingSound(sound);
      setPlayingMessageId(messageId);

    } catch (error) {
      console.error('=== 语音播放错误 ===');
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
      console.error('完整错误对象:', error);
      
      let errorMessage = t('chat.unableToPlayVoice');
      if (error.message.includes('Network Error')) {
        errorMessage = t('chat.networkConnectionFailed');
      } else if (error.message.includes('404')) {
        errorMessage = t('chat.voiceFileNotFound');
      } else if (error.message.includes('403')) {
        errorMessage = t('chat.noPermissionToAccessVoice');
      } else if (error.message.includes('timeout')) {
        errorMessage = t('chat.requestTimeout');
      } else {
        errorMessage = t('chat.playbackFailedWithMessage', { message: error.message });
      }
      
      Alert.alert(t('chat.playbackFailed'), errorMessage);
      setPlayingSound(null);
      setPlayingMessageId(null);
    }
  };

  /**
   * 格式化录制时间显示
   * 将秒数转换为 "分:秒" 格式，秒数不足两位时补零
   * 
   * @param {number} seconds - 录制时间（秒）
   * @returns {string} 格式化后的时间字符串，如 "1:05"
   */
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * 发送消息的核心函数
   * 支持发送文本、图片和语音消息
   * 自动处理文件上传和消息状态管理
   * 
   * @param {string} messageType - 消息类型：'text', 'image', 'audio'
   * @param {string} mediaUri - 媒体文件URI（图片或语音），文本消息时可为null
   */
  const sendMessage = async (messageType = 'text', mediaUri = null) => {
    // 验证消息内容：文本消息必须有内容，媒体消息必须有URI
    if ((!message.trim() && !mediaUri) || sending) return;

    setSending(true);

    try {
      let messageData = {
        recipient: otherUser.id,
        message_type: messageType,
      };

      if ((messageType === 'image' || messageType === 'audio') && mediaUri) {
        // 处理媒体消息：创建FormData上传文件
        const formData = new FormData();
        formData.append('recipient', otherUser.id);
        formData.append('message_type', messageType);
        
        if (messageType === 'image') {
          // 图片消息：设置图片相关参数
          formData.append('content', t('chat.sentAnImage'));
          formData.append('attachment', {
            uri: mediaUri,
            type: 'image/jpeg',
            name: 'image.jpg',
          });
        } else if (messageType === 'audio') {
          // 语音消息：设置音频相关参数
          formData.append('content', t('chat.sentAVoiceMessage'));
          formData.append('attachment', {
            uri: mediaUri,
            type: 'audio/m4a',
            name: 'audio.m4a',
          });
        }

        // 发送媒体消息（使用multipart/form-data格式）
        const response = await api.post('/communication/messages/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data) {
          // 将新消息添加到消息列表顶部
          setMessages(prev => [response.data, ...prev]);
          // 滚动到顶部显示新消息
          flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        }
      } else {
        // 处理文本消息
        const messageText = message.trim();
        messageData.content = messageText;

        // 发送文本消息
        const response = await api.post('/communication/messages/', messageData);

        if (response.data) {
          // 将新消息添加到消息列表顶部
          setMessages(prev => [response.data, ...prev]);
          // 清空输入框
          setMessage('');
          // 滚动到顶部显示新消息
          flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      Alert.alert(t('common.error'), t('chat.sendMessageFailed'));
    } finally {
      // 无论成功还是失败，都要重置发送状态
      setSending(false);
    }
  };

  const pickImage = async (useCamera = false) => {
    // 请求权限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chat.permissionDenied'), t('chat.galleryPermissionRequired'));
      return;
    }

    if (useCamera) {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert(t('chat.permissionDenied'), t('chat.cameraPermissionRequired'));
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      sendMessage('image', result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      Alert.alert(t('chat.permissionDenied'), t('chat.cameraPermissionRequired'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      sendMessage('image', result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      t('chat.selectImage'),
      t('chat.selectImageSource'),
      [
        { text: t('chat.gallery'), onPress: () => pickImage(false) },
        { text: t('chat.takePhoto'), onPress: () => takePhoto() },
        { text: t('common.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
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
    if (!item) return null;
    
    const isOwnMessage = item.sender === user?.id;
    const isImageMessage = item.message_type === 'image';
    const isAudioMessage = item.message_type === 'audio';
    const isPlaying = playingMessageId === item.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
          (isImageMessage || isAudioMessage) && styles.mediaBubble
        ]}>
          {isImageMessage && item.attachment ? (
            <TouchableOpacity onPress={() => showImagePreview(item.attachment)}>
              <Image 
                source={{ uri: item.attachment }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : isAudioMessage && item.attachment ? (
            <TouchableOpacity 
              style={styles.audioContainer}
              onPress={() => playAudio(item.attachment, item.id)}
            >
              <View style={styles.audioButton}>
                <Ionicons 
                  name={isPlaying ? "pause" : "play"} 
                  size={24} 
                  color={isOwnMessage ? "#fff" : "#007AFF"} 
                />
              </View>
              <View style={styles.audioInfo}>
                <Text style={[
                  styles.audioText,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {t('chat.voiceMessage')}
                </Text>
                <View style={[
                  styles.audioWave,
                  isOwnMessage ? styles.ownAudioWave : styles.otherAudioWave
                ]}>
                  {[...Array(8)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.audioWaveBar,
                        isOwnMessage ? styles.ownAudioWaveBar : styles.otherAudioWaveBar,
                        isPlaying && { opacity: 0.5 + Math.random() * 0.5 }
                      ]}
                    />
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content || ''}
            </Text>
          )}
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

  const showImagePreview = (imageUri) => {
    setPreviewImageUrl(imageUri);
    setImagePreviewVisible(true);
  };

  const closeImagePreview = () => {
    setImagePreviewVisible(false);
    setPreviewImageUrl('');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
      <Text style={styles.emptyStateText}>{t('chat.noMessages')}</Text>
      <Text style={styles.emptyStateSubtext}>{t('chat.sendMessageToStartConversation')}</Text>
    </View>
  );

  const renderLoadingFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>{t('chat.loadMore')}</Text>
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (returnTo) {
              navigation.navigate(returnTo);
            } else {
              navigation.goBack();
            }
          }} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {otherUser ? `与 ${otherUser.name} 的对话` : '聊天'}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
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
          <TouchableOpacity onPress={() => {
            if (returnTo) {
              navigation.navigate(returnTo);
            } else {
              navigation.goBack();
            }
          }} style={styles.backButton}>
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
          keyExtractor={(item, index) => item?.id?.toString() || `message-${index}`}
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
          <TouchableOpacity 
            onPress={showImagePicker} 
            style={styles.imageButton}
          >
            <Ionicons name="image" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPressIn={startRecording}
            onPressOut={stopRecordingAndSend}
            onLongPress={() => {}} // 防止长按菜单
            style={styles.voiceButton}
            disabled={isRecording}
          >
            <Ionicons name="mic" size={24} color={isRecording ? "#ff4444" : "#007AFF"} />
          </TouchableOpacity>
          
          {!isRecording ? (
            <>
              <TextInput
                style={styles.textInput}
                value={message}
                onChangeText={setMessage}
                placeholder={t('chat.typeMessage')}
                multiline
                maxLength={500}
                editable={!sending}
              />
              
              <TouchableOpacity 
                onPress={() => sendMessage('text')} 
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
            </>
          ) : (
            <View style={styles.recordingContainer}>
              <TouchableOpacity 
                onPress={cancelRecording}
                style={styles.cancelButton}
              >
                <Ionicons name="close" size={20} color="#ff4444" />
              </TouchableOpacity>
              
              <View style={styles.recordingInfo}>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>录制中...</Text>
                </View>
                <Text style={styles.recordingTime}>
                  {formatRecordingTime(recordingDuration)}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={stopRecordingAndSend}
                style={styles.sendVoiceButton}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      
      {/* 图片预览模态框 */}
      <ImagePreviewModal
        visible={imagePreviewVisible}
        imageUrl={previewImageUrl}
        onClose={closeImagePreview}
      />
    </SafeAreaView>
  );
};

/**
 * 样式定义
 * 包含聊天界面的所有UI样式，按功能模块分组
 * 
 * 主要样式组：
 * - 容器和布局样式
 * - 头部样式
 * - 消息列表样式
 * - 输入区域样式
 * - 按钮样式
 * - 录音相关样式
 * - 加载和空状态样式
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
  mediaBubble: {
    padding: 4,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  // 语音消息样式
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
    padding: 8,
  },
  audioButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  audioInfo: {
    flex: 1,
  },
  audioText: {
    fontSize: 14,
    marginBottom: 4,
  },
  audioWave: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  audioWaveBar: {
    width: 3,
    backgroundColor: '#ccc',
    marginRight: 2,
    borderRadius: 1.5,
  },
  ownAudioWave: {
    // 样式由audioWave继承
  },
  otherAudioWave: {
    // 样式由audioWave继承
  },
  ownAudioWaveBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    height: Math.floor(Math.random() * 15) + 5,
  },
  otherAudioWaveBar: {
    backgroundColor: '#007AFF',
    height: Math.floor(Math.random() * 15) + 5,
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
    alignItems: 'flex-end',
  },
  imageButton: {
    backgroundColor: '#e8f4ff',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#007AFF',
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
  voiceButton: {
    backgroundColor: '#e8f4ff',
    borderRadius: 20,
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  // 录制相关样式
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
  },
  cancelButton: {
    padding: 8,
    marginRight: 12,
  },
  recordingInfo: {
    flex: 1,
    alignItems: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  recordingTime: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  sendVoiceButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 8,
    marginLeft: 12,
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

/**
 * 导出聊天界面组件
 * 作为默认导出，供其他模块使用
 */
export default ChatScreen; 