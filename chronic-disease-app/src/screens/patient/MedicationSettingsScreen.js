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

const MedicationSettingsScreen = ({ navigation }) => {
  const [preferences, setPreferences] = useState({
    enabled: true,
    sound: true,
    vibration: true,
    advanceMinutes: 5,
    repeatInterval: 15,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  });

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerType, setTimePickerType] = useState('start');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await medicationReminderService.getReminderPreferences();
      setPreferences(prev => ({ ...prev, ...savedPreferences }));
    } catch (error) {
      console.error('加载偏好设置失败:', error);
    }
  };

  const savePreferences = async () => {
    try {
      await medicationReminderService.setReminderPreferences(preferences);
      Alert.alert('成功', '设置已保存');
    } catch (error) {
      console.error('保存偏好设置失败:', error);
      Alert.alert('错误', '保存设置失败');
    }
  };

  const toggleSwitch = (key) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleQuietHours = () => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled,
      },
    }));
  };

  const updateAdvanceMinutes = (value) => {
    const minutes = parseInt(value) || 0;
    setPreferences(prev => ({
      ...prev,
      advanceMinutes: Math.max(0, Math.min(60, minutes)),
    }));
  };

  const updateRepeatInterval = (value) => {
    const interval = parseInt(value) || 15;
    setPreferences(prev => ({
      ...prev,
      repeatInterval: Math.max(5, Math.min(60, interval)),
    }));
  };

  const showTimePickerModal = (type) => {
    setTimePickerType(type);
    setShowTimePicker(true);
  };

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
            用药提醒设置
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            自定义您的用药提醒偏好
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
            保存设置
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