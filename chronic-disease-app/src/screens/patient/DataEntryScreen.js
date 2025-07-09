import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { Text, TextInput, Button, Card, Divider, SegmentedButtons, Chip } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import { addHealthData } from '../../store/slices/userSlice';
import { 
  HealthMetric, 
  METRIC_TYPES, 
  HEALTH_METRIC_FIELDS,
  evaluateHealthStatus,
  getStatusColor,
  getStatusText
} from '../../utils/dataModels';

const DataEntryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [selectedMetricType, setSelectedMetricType] = useState(METRIC_TYPES.BLOOD_PRESSURE);
  const [metricData, setMetricData] = useState({});
  const [notes, setNotes] = useState('');

  // 获取当前选中指标的配置
  const currentConfig = HEALTH_METRIC_FIELDS[selectedMetricType];

  // 指标类型选择按钮
  const metricTypeButtons = [
    { value: METRIC_TYPES.BLOOD_PRESSURE, label: '血压' },
    { value: METRIC_TYPES.BLOOD_GLUCOSE, label: '血糖' },
    { value: METRIC_TYPES.HEART_RATE, label: '心率' },
    { value: METRIC_TYPES.WEIGHT, label: '体重' },
    { value: METRIC_TYPES.URIC_ACID, label: '尿酸' },
    { value: METRIC_TYPES.LIPIDS, label: '血脂' }
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

  // 提交数据
  const handleSubmit = () => {
    // 检查是否有数据输入
    const hasData = Object.values(metricData).some(value => value !== null && value !== undefined);
    if (!hasData) {
      Alert.alert('提示', '请至少输入一个指标数据');
      return;
    }

    // 创建健康指标对象
    const healthMetric = new HealthMetric({
      metric_type: selectedMetricType,
      ...metricData,
      note: notes,
      measured_by: 1, // 当前用户ID，实际应从认证状态获取
      patient_id: 1   // 患者ID，实际应从认证状态获取
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

    // 显示状态提示
    Alert.alert(
      '数据已保存',
      `当前指标状态：${statusText}`,
      [
        {
          text: '确定',
          onPress: () => {
            dispatch(addHealthData(healthMetric));
            navigation.goBack();
          }
        }
      ]
    );
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
          placeholder={`请输入${currentConfig.labels[field]}`}
          mode="outlined"
        />
        {/* 显示正常范围提示 */}
        <Text style={styles.rangeHint}>
          正常范围: {currentConfig.validations[field]?.min || 0} - {currentConfig.validations[field]?.max || '无限制'} {currentConfig.units[field]}
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 页面标题 */}
        <Text style={styles.title}>健康数据录入</Text>
        <Text style={styles.subtitle}>请选择要录入的健康指标类型</Text>

        {/* 指标类型选择器 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>选择指标类型</Text>
            {renderMetricTypeSelector()}
          </Card.Content>
        </Card>

        {/* 数据输入区域 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>
              录入 {metricTypeButtons.find(b => b.value === selectedMetricType)?.label} 数据
            </Text>
            <Divider style={styles.divider} />
            {renderInputFields()}
          </Card.Content>
        </Card>

        {/* 备注输入 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>备注信息</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="记录特殊情况、症状或其他备注..."
              multiline
              numberOfLines={3}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        {/* 提交按钮 */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          保存健康数据
        </Button>

        {/* 取消按钮 */}
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          contentStyle={styles.cancelButtonContent}
        >
          取消
        </Button>
      </ScrollView>
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
});

export default DataEntryScreen; 