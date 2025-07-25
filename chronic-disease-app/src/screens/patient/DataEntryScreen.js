import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Divider, SegmentedButtons, Chip, IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addHealthData, submitHealthMetrics } from '../../store/slices/userSlice';
import { 
  HealthMetric, 
  METRIC_TYPES, 
  HEALTH_METRIC_FIELDS,
  evaluateHealthStatus,
  getStatusColor,
  getStatusText
} from '../../utils/dataModels';

const DataEntryScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.user);
  
  const [selectedMetricType, setSelectedMetricType] = useState(METRIC_TYPES.BLOOD_PRESSURE);
  const [metricData, setMetricData] = useState({});
  const [notes, setNotes] = useState('');
  
  // 时间选择相关状态
  const [measurementTime, setMeasurementTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // 获取当前选中指标的配置
  const currentConfig = HEALTH_METRIC_FIELDS[selectedMetricType];

  // 指标类型选择按钮
  const metricTypeButtons = [
    { value: METRIC_TYPES.BLOOD_PRESSURE, label: t('health.bloodPressure') },
    { value: METRIC_TYPES.BLOOD_GLUCOSE, label: t('health.bloodGlucose') },
    { value: METRIC_TYPES.HEART_RATE, label: t('health.heartRate') },
    { value: METRIC_TYPES.WEIGHT, label: t('health.weight') },
    { value: METRIC_TYPES.URIC_ACID, label: t('health.uricAcid') },
    { value: METRIC_TYPES.LIPIDS, label: t('health.lipids') }
  ];

  // 更新指标数据
  const updateMetricField = (field, value) => {
    setMetricData(prev => ({
      ...prev,
      [field]: value ? parseFloat(value) : null
    }));
  };

  // 切换指标类型时重置数据
  const handleMetricTypeChange = (type) => {
    setSelectedMetricType(type);
    setMetricData({});
  };

  // 处理日期选择
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || measurementTime;
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      // 保持时间部分不变，只更新日期
      const newDateTime = new Date(measurementTime);
      newDateTime.setFullYear(currentDate.getFullYear());
      newDateTime.setMonth(currentDate.getMonth());
      newDateTime.setDate(currentDate.getDate());
      setMeasurementTime(newDateTime);
    }
  };

  // 处理时间选择
  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || measurementTime;
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      // 保持日期部分不变，只更新时间
      const newDateTime = new Date(measurementTime);
      newDateTime.setHours(currentTime.getHours());
      newDateTime.setMinutes(currentTime.getMinutes());
      setMeasurementTime(newDateTime);
    }
  };

  // 格式化显示时间
  const formatDate = (date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 提交数据
  const handleSubmit = async () => {
    // 检查是否有数据输入
    const hasData = Object.values(metricData).some(value => value !== null && value !== undefined);
    if (!hasData) {
      Alert.alert('提示', '请至少输入一个指标数据');
      return;
    }

    // 创建健康指标对象
    const healthMetric = new HealthMetric({
      id: `temp_${Date.now()}`, // 生成临时ID
      metric_type: selectedMetricType,
      ...metricData,
      note: notes,
      measured_at: measurementTime.toISOString(),
      measured_by: user?.id || 1,
      patient_id: user?.id || 1
    });

    // 验证数据
    const validation = healthMetric.validate();
    if (!validation.valid) {
      Alert.alert('数据验证失败', validation.errors.join('\n'));
      return;
    }

    // 评估健康状态
    const healthStatus = evaluateHealthStatus(healthMetric);
    const statusText = getStatusText(healthStatus);

    try {
      // 提交到后端API
      const result = await dispatch(submitHealthMetrics(healthMetric.toSerializable()));
      
      if (submitHealthMetrics.fulfilled.match(result)) {
        // 成功提交到后端后，也更新本地状态
        dispatch(addHealthData(result.payload));
        
        Alert.alert(
          '数据已成功保存',
          `测量时间：${formatDate(measurementTime)} ${formatTime(measurementTime)}\n当前指标状态：${statusText}`,
          [
            {
              text: '确定',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        // 如果后端提交失败，先保存到本地
        dispatch(addHealthData(healthMetric.toSerializable()));
        
        Alert.alert(
          '数据已保存到本地',
          `网络连接问题，数据已保存到本地，稍后会自动同步到服务器。\n\n测量时间：${formatDate(measurementTime)} ${formatTime(measurementTime)}\n当前指标状态：${statusText}`,
          [
            {
              text: '确定',
              onPress: () => {
                navigation.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('数据提交错误:', error);
      
      // 提交失败时也保存到本地
      dispatch(addHealthData(healthMetric.toSerializable()));
      
      Alert.alert(
        '数据已保存到本地',
        `服务器连接失败，数据已保存到本地，稍后会自动同步。\n\n错误信息：${error.message || '未知错误'}`,
        [
          {
            text: '确定',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    }
  };

  // 渲染输入字段
  const renderInputFields = () => {
    return currentConfig.fields.map(field => (
      <View key={field} style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {currentConfig.labels[field]} ({currentConfig.units[field]})
        </Text>
        <TextInput
          style={styles.input}
          value={metricData[field]?.toString() || ''}
          onChangeText={(value) => updateMetricField(field, value)}
          keyboardType="numeric"
          placeholder={t('health.enterValue', { field: currentConfig.labels[field] })}
          mode="outlined"
        />
        {/* 显示正常范围提示 */}
        <Text style={styles.rangeHint}>
          {t('health.normalRange')}: {currentConfig.validations[field]?.min || 0} - {currentConfig.validations[field]?.max || t('health.unlimited')} {currentConfig.units[field]}
        </Text>
      </View>
    ));
  };

  // 渲染指标类型选择器
  const renderMetricTypeSelector = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
        {metricTypeButtons.map(button => (
          <Chip
            key={button.value}
            mode={selectedMetricType === button.value ? 'flat' : 'outlined'}
            selected={selectedMetricType === button.value}
            onPress={() => handleMetricTypeChange(button.value)}
            style={[
              styles.chip,
              selectedMetricType === button.value && styles.selectedChip
            ]}
            textStyle={styles.chipText}
          >
            {button.label}
          </Chip>
        ))}
      </ScrollView>
    );
  };

  // 渲染时间选择器
  const renderTimeSelector = () => {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>测量时间</Text>
          <View style={styles.timeContainer}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>{t('health.date')}：</Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.timeButton}
                contentStyle={styles.timeButtonContent}
              >
                {formatDate(measurementTime)}
              </Button>
              <IconButton
                icon="calendar"
                size={20}
                onPress={() => setShowDatePicker(true)}
              />
            </View>
            
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>{t('health.time')}：</Text>
              <Button
                mode="outlined"
                onPress={() => setShowTimePicker(true)}
                style={styles.timeButton}
                contentStyle={styles.timeButtonContent}
              >
                {formatTime(measurementTime)}
              </Button>
              <IconButton
                icon="clock"
                size={20}
                onPress={() => setShowTimePicker(true)}
              />
            </View>
          </View>
          
          {/* 快速选择按钮 */}
          <View style={styles.quickSelectContainer}>
            <Text style={styles.quickSelectLabel}>{t('health.quickSelect')}：</Text>
            <Button
              mode="text"
              onPress={() => setMeasurementTime(new Date())}
              style={styles.quickSelectButton}
            >
              {t('health.now')}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 页面标题 */}
        <Text style={styles.title}>{t('health.dataEntry')}</Text>
        <Text style={styles.subtitle}>{t('health.selectMetricType')}</Text>

        {/* 指标类型选择器 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('health.selectMetricType')}</Text>
            {renderMetricTypeSelector()}
          </Card.Content>
        </Card>

        {/* 数据输入区域 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>
              {t('health.enterDataFor', { type: metricTypeButtons.find(b => b.value === selectedMetricType)?.label })}
            </Text>
            <Divider style={styles.divider} />
            {renderInputFields()}
          </Card.Content>
        </Card>

        {/* 备注输入 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>{t('health.notes')}</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('health.notesPlaceholder')}
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        {/* 时间选择器 */}
        {renderTimeSelector()}

        {/* 提交按钮 */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          {t('health.saveHealthData')}
        </Button>

        {/* 取消按钮 */}
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          contentStyle={styles.cancelButtonContent}
        >
          {t('common.cancel')}
        </Button>
      </ScrollView>

      {/* 日期选择器 */}
      {showDatePicker && (
        <DateTimePicker
          value={measurementTime}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* 时间选择器 */}
      {showTimePicker && (
        <DateTimePicker
          value={measurementTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  selectedChip: {
    backgroundColor: '#6200ea',
  },
  chipText: {
    fontSize: 16,
  },
  divider: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    fontSize: 18,
    backgroundColor: '#fff',
  },
  rangeHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  notesInput: {
    fontSize: 18,
    backgroundColor: '#fff',
    minHeight: 80,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 12,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    marginBottom: 16,
  },
  cancelButtonContent: {
    paddingVertical: 8,
  },
  timeContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
    color: '#333',
  },
  timeButton: {
    flex: 1,
    backgroundColor: '#fff',
  },
  timeButtonContent: {
    paddingVertical: 8,
  },
  quickSelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  quickSelectLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
    color: '#333',
  },
  quickSelectButton: {
    fontSize: 18,
    color: '#6200ea',
  },
});

export default DataEntryScreen; 