/**
 * 患者用药设置页面组件
 * 
 * 功能特性：
 * - 管理用药提醒偏好设置
 * - 支持提醒开关、声音、震动配置
 * - 提前提醒时间和重复间隔设置
 * - 静音时段配置（夜间免打扰）
 * - 实时保存和加载用户偏好
 * - 多语言国际化支持
 * - 用户友好的设置界面
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import {
  Text,
  Card,
  List,
  Button,
  Divider,
  TextInput,
  Portal,
  Modal,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import medicationReminderService from '../../services/medicationReminder';

/**
 * 患者用药设置页面主组件
 * 
 * 主要功能：
 * - 管理用药提醒的各种设置选项
 * - 处理用户偏好的保存和加载
 * - 提供直观的设置界面
 * - 支持静音时段配置
 * - 实时更新设置状态
 * 
 * @param {Object} navigation - 导航对象，用于页面跳转
 * @returns {JSX.Element} 患者用药设置页面组件
 */
const MedicationSettingsScreen = ({ navigation }) => {
  // 用药提醒偏好设置状态
  const [preferences, setPreferences] = useState({
    enabled: true,                    // 是否启用用药提醒
    sound: true,                      // 是否启用声音提醒
    vibration: true,                  // 是否启用震动提醒
    advanceMinutes: 5,                // 提前提醒时间（分钟）
    repeatInterval: 15,               // 重复提醒间隔（分钟）
    quietHours: {
      enabled: false,                 // 是否启用静音时段
      startTime: '22:00',             // 静音开始时间
      endTime: '08:00',               // 静音结束时间
    },
  });

  // 时间选择器状态
  const [showTimePicker, setShowTimePicker] = useState(false);     // 时间选择器显示状态
  const [timePickerType, setTimePickerType] = useState('start');   // 当前编辑的时间类型

  /**
   * 组件加载时加载用户偏好设置
   */
  useEffect(() => {
    loadPreferences();
  }, []);

  /**
   * 加载用户偏好设置
   * 从本地存储或服务中获取保存的设置
   */
  const loadPreferences = async () => {
    try {
      const savedPreferences = await medicationReminderService.getReminderPreferences();
      setPreferences(prev => ({ ...prev, ...savedPreferences }));
    } catch (error) {
      console.error('加载偏好设置失败:', error);
    }
  };

  /**
   * 保存用户偏好设置
   * 将当前设置保存到本地存储或服务中
   */
  const savePreferences = async () => {
    try {
      await medicationReminderService.setReminderPreferences(preferences);
      Alert.alert('成功', '设置已保存');
    } catch (error) {
      console.error('保存偏好设置失败:', error);
      Alert.alert('错误', '保存设置失败');
    }
  };

  /**
   * 切换开关状态
   * 处理布尔类型设置的开关操作
   * 
   * @param {string} key - 要切换的设置键名
   */
  const toggleSwitch = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * 切换静音时段开关
   * 启用或禁用静音时段功能
   */
  const toggleQuietHours = () => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled,
      },
    }));
  };

  /**
   * 更新提前提醒时间
   * 设置用药提醒的提前时间，范围0-60分钟
   * 
   * @param {string} value - 输入的分钟数
   */
  const updateAdvanceMinutes = (value) => {
    const minutes = parseInt(value) || 0;
    setPreferences(prev => ({
      ...prev,
      advanceMinutes: Math.max(0, Math.min(60, minutes)),
    }));
  };

  /**
   * 更新重复提醒间隔
   * 设置重复提醒的时间间隔，范围5-60分钟
   * 
   * @param {string} value - 输入的分钟数
   */
  const updateRepeatInterval = (value) => {
    const interval = parseInt(value) || 15;
    setPreferences(prev => ({
      ...prev,
      repeatInterval: Math.max(5, Math.min(60, interval)),
    }));
  };

  /**
   * 显示时间选择器模态框
   * 打开时间选择器用于设置静音时段
   * 
   * @param {string} type - 时间类型：'start' 或 'end'
   */
  const showTimePickerModal = (type) => {
    setTimePickerType(type);
    setShowTimePicker(true);
  };

  /**
   * 处理时间选择器的确认事件
   * 更新静音时段的开始或结束时间
   * 
   * @param {string} time - 选择的时间字符串 (HH:mm)
   */
  const handleTimeChange = (time) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [timePickerType === 'start' ? 'startTime' : 'endTime']: time,
      },
    }));
    setShowTimePicker(false);
  };

  /**
   * 发送测试通知
   * 用于验证本地通知功能是否正常工作
   */
  const testNotification = async () => {
    try {
      await medicationReminderService.scheduleLocalNotification(
        '测试用药提醒',
        '这是一条测试通知',
        { type: 'test' },
        5
      );
      Alert.alert('成功', '测试通知将在5秒后发送');
    } catch (error) {
      console.error('发送测试通知失败:', error);
      Alert.alert('错误', '发送测试通知失败');
    }
  };



  /**
   * 清除所有已安排的用药提醒
   * 提供一个确认对话框
   */
  const clearAllReminders = async () => {
    Alert.alert(
      '清除所有提醒',
      '确定要清除所有已安排的用药提醒吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationReminderService.clearAllReminders();
              Alert.alert('成功', '所有提醒已清除');
            } catch (error) {
              console.error('清除提醒失败:', error);
              Alert.alert('错误', '清除提醒失败');
            }
          },
        },
      ]
    );
  };

  /**
   * 渲染基本设置卡片
   * 包含提醒开关、声音、震动配置
   * 
   * @returns {JSX.Element} 基本设置卡片
   */
  const renderGeneralSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.cardTitle}>
          基本设置
        </Text>
        
        <List.Item
          title="启用用药提醒"
          description="开启或关闭所有用药提醒"
          left={(props) => <List.Icon {...props} icon="bell" />}
          right={() => (
            <Switch
              value={preferences.enabled}
              onValueChange={() => toggleSwitch('enabled')}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="提醒声音"
          description="播放提醒声音"
          left={(props) => <List.Icon {...props} icon="volume-high" />}
          right={() => (
            <Switch
              value={preferences.sound}
              onValueChange={() => toggleSwitch('sound')}
              disabled={!preferences.enabled}
            />
          )}
        />
        
        <Divider />
        
        <List.Item
          title="震动提醒"
          description="发送震动提醒"
          left={(props) => <List.Icon {...props} icon="vibrate" />}
          right={() => (
            <Switch
              value={preferences.vibration}
              onValueChange={() => toggleSwitch('vibration')}
              disabled={!preferences.enabled}
            />
          )}
        />
      </Card.Content>
    </Card>
  );

  /**
   * 渲染时间设置卡片
   * 包含提前提醒时间、重复间隔设置
   * 
   * @returns {JSX.Element} 时间设置卡片
   */
  const renderTimingSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.cardTitle}>
          时间设置
        </Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>提前提醒时间（分钟）</Text>
          <TextInput
            mode="outlined"
            value={preferences.advanceMinutes.toString()}
            onChangeText={updateAdvanceMinutes}
            keyboardType="numeric"
            style={styles.input}
            disabled={!preferences.enabled}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>重复间隔（分钟）</Text>
          <TextInput
            mode="outlined"
            value={preferences.repeatInterval.toString()}
            onChangeText={updateRepeatInterval}
            keyboardType="numeric"
            style={styles.input}
            disabled={!preferences.enabled}
          />
        </View>
      </Card.Content>
    </Card>
  );

  /**
   * 渲染静音时段设置卡片
   * 包含静音时段开关和时间选择器
   * 
   * @returns {JSX.Element} 静音时段设置卡片
   */
  const renderQuietHoursSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.cardTitle}>
          静音时段
        </Text>
        
        <List.Item
          title="启用静音时段"
          description="在指定时间段内不发送提醒"
          left={(props) => <List.Icon {...props} icon="moon" />}
          right={() => (
            <Switch
              value={preferences.quietHours.enabled}
              onValueChange={toggleQuietHours}
              disabled={!preferences.enabled}
            />
          )}
        />
        
        {preferences.quietHours.enabled && (
          <>
            <Divider />
            
            <List.Item
              title="开始时间"
              description={preferences.quietHours.startTime}
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
              onPress={() => showTimePickerModal('start')}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            
            <Divider />
            
            <List.Item
              title="结束时间"
              description={preferences.quietHours.endTime}
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
              onPress={() => showTimePickerModal('end')}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </>
        )}
      </Card.Content>
    </Card>
  );

  /**
   * 渲染测试设置卡片
   * 包含发送测试通知和清除所有提醒按钮
   * 
   * @returns {JSX.Element} 测试设置卡片
   */
  const renderTestSettings = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleLarge" style={styles.cardTitle}>
          测试设置
        </Text>
        
        <Button
          mode="contained"
          onPress={testNotification}
          style={styles.testButton}
          disabled={!preferences.enabled}
        >
          发送测试通知
        </Button>
        
        <Button
          mode="outlined"
          onPress={clearAllReminders}
          style={styles.clearButton}
          textColor="#F44336"
        >
          清除所有提醒
        </Button>
      </Card.Content>
    </Card>
  );

  /**
   * 渲染时间选择器模态框
   * 用于选择静音时段的开始或结束时间
   * 
   * @returns {JSX.Element} 时间选择器模态框
   */
  const renderTimePickerModal = () => (
    <Portal>
      <Modal
        visible={showTimePicker}
        onDismiss={() => setShowTimePicker(false)}
        contentContainerStyle={styles.modalContainer}
      >
        <Text variant="titleLarge" style={styles.modalTitle}>
          选择{timePickerType === 'start' ? '开始' : '结束'}时间
        </Text>
        
        <View style={styles.timePickerContainer}>
          {/* 这里可以集成时间选择器组件 */}
          <Text style={styles.timePickerText}>
            当前时间: {preferences.quietHours[timePickerType === 'start' ? 'startTime' : 'endTime']}
          </Text>
          
          <Button
            mode="contained"
            onPress={() => handleTimeChange('12:00')}
            style={styles.timeButton}
          >
            12:00
          </Button>
          
          <Button
            mode="contained"
            onPress={() => handleTimeChange('22:00')}
            style={styles.timeButton}
          >
            22:00
          </Button>
          
          <Button
            mode="contained"
            onPress={() => handleTimeChange('08:00')}
            style={styles.timeButton}
          >
            08:00
          </Button>
        </View>
        
        <Button
          mode="outlined"
          onPress={() => setShowTimePicker(false)}
          style={styles.cancelButton}
        >
          取消
        </Button>
      </Modal>
    </Portal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            {t('medication.medicationSettings')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('medication.medicationSettingsDesc')}
          </Text>
        </View>

        {renderGeneralSettings()}
        {renderTimingSettings()}
        {renderQuietHoursSettings()}
        {renderTestSettings()}

        <View style={styles.saveButtonContainer}>
          <Button
            mode="contained"
            onPress={savePreferences}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {t('common.save')}
          </Button>
        </View>
      </ScrollView>

      {renderTimePickerModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
  },
  testButton: {
    marginBottom: 12,
  },
  clearButton: {
    borderColor: '#F44336',
  },
  saveButtonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 24,
    borderRadius: 12,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
  },
  timePickerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timePickerText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  timeButton: {
    marginBottom: 8,
    width: 120,
  },
  cancelButton: {
    marginTop: 16,
  },
});

export default MedicationSettingsScreen; 