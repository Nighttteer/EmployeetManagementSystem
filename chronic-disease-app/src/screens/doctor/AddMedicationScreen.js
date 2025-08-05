import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  ActivityIndicator, 
  TextInput,
  HelperText,
  SegmentedButtons,
  Searchbar,
  Checkbox,
  Appbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { medicationAPI } from '../../services/api';

const AddMedicationScreen = ({ route, navigation }) => {
  const { patient, editingPlan } = route.params || {};
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState([]);
  const [medicationSearch, setMedicationSearch] = useState('');

  // 表单状态
  const [formData, setFormData] = useState({
    medication: null,
    dosage: '',
    frequency: 'QD',
    time_of_day: ['08:00'], // 时间数组，支持多个时间点
    start_date: new Date(),
    end_date: null,
    duration_days: '',
    special_instructions: '',
    dietary_requirements: '',
    requires_monitoring: false,
    monitoring_notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // 日期选择器状态
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState('start');
  
  // 时间选择器状态
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState(0);

  // 频次选项
  const frequencyOptions = [
    { label: t('medication.frequency.onceDaily'), value: 'QD' },
    { label: t('medication.frequency.twiceDaily'), value: 'BID' },
    { label: t('medication.frequency.threeTimesDaily'), value: 'TID' },
    { label: t('medication.frequency.fourTimesDaily'), value: 'QID' },
    { label: t('medication.frequency.every12Hours'), value: 'Q12H' },
    { label: t('medication.frequency.every8Hours'), value: 'Q8H' },
    { label: t('medication.frequency.every6Hours'), value: 'Q6H' },
    { label: t('medication.frequency.asNeeded'), value: 'PRN' },
    { label: t('medication.frequency.other'), value: 'OTHER' }
  ];
  
  // 根据频次获取建议的服药时间
  const getSuggestedTimes = (frequency) => {
    switch (frequency) {
      case 'QD': return ['08:00'];
      case 'BID': return ['08:00', '20:00'];
      case 'TID': return ['08:00', '14:00', '20:00'];
      case 'QID': return ['08:00', '12:00', '16:00', '20:00'];
      case 'Q12H': return ['08:00', '20:00'];
      case 'Q8H': return ['08:00', '16:00', '00:00'];
      case 'Q6H': return ['06:00', '12:00', '18:00', '00:00'];
      default: return ['08:00'];
    }
  };

  // 当频次改变时，自动更新服药时间
  const handleFrequencyChange = (newFrequency) => {
    const suggestedTimes = getSuggestedTimes(newFrequency);
    setFormData(prev => ({
      ...prev,
      frequency: newFrequency,
      time_of_day: suggestedTimes
    }));
  };

  // 显示文本映射
  const getCategoryDisplay = (category) => {
    if (!category) return t('medication.uncategorized');
    const categoryMap = {
      'antihypertensive': t('medication.category.antihypertensive'),
      'hypoglycemic': t('medication.category.hypoglycemic'),
      'lipid_lowering': t('medication.category.lipidLowering'),
      'anticoagulant': t('medication.category.anticoagulant'),
      'diuretic': t('medication.category.diuretic'),
      'beta_blocker': t('medication.category.betaBlocker'),
      'calcium_channel_blocker': t('medication.category.calciumChannelBlocker'),
      'ace_inhibitor': t('medication.category.aceInhibitor'),
      'antiplatelet': t('medication.category.antiplatelet'),
      'statin': t('medication.category.statin'),
      'other': t('medication.category.other')
    };
    return categoryMap[category] || category;
  };

  // 加载药品列表
  const loadMedications = async () => {
    try {
      const response = await medicationAPI.getMedications();
      setMedications(response.data || []);
    } catch (error) {
      console.error('Failed to load medications:', error);
      Alert.alert(t('common.error'), t('medication.loadMedicationsFailed'));
    }
  };

  // 初始化
  useEffect(() => {
    loadMedications();
    
    // 如果是编辑模式，加载现有数据
    if (editingPlan) {
      setFormData({
        medication: editingPlan.medication,
        dosage: editingPlan.dosage?.toString() || '',
        frequency: editingPlan.frequency || 'QD',
        time_of_day: Array.isArray(editingPlan.time_of_day) 
          ? editingPlan.time_of_day 
          : editingPlan.time_of_day 
            ? [editingPlan.time_of_day] 
            : ['08:00'],
        start_date: editingPlan.start_date ? new Date(editingPlan.start_date) : new Date(),
        end_date: editingPlan.end_date ? new Date(editingPlan.end_date) : null,
        duration_days: editingPlan.duration_days?.toString() || '',
        special_instructions: editingPlan.special_instructions || '',
        dietary_requirements: editingPlan.dietary_requirements || '',
        requires_monitoring: editingPlan.requires_monitoring || false,
        monitoring_notes: editingPlan.monitoring_notes || ''
      });
    }
  }, [editingPlan]);

  // 表单验证
  const validateForm = () => {
    const errors = {};
    
    if (!formData.medication) {
      errors.medication = t('medication.validation.selectMedication');
    }
    
    if (!formData.dosage || parseFloat(formData.dosage) <= 0) {
      errors.dosage = t('medication.validation.enterValidDosage');
    }
    
    if (!Array.isArray(formData.time_of_day) || formData.time_of_day.length === 0) {
      errors.time_of_day = t('medication.validation.setMedicationTime');
    }
    
    if (formData.duration_days && (isNaN(formData.duration_days) || parseInt(formData.duration_days) <= 0)) {
      errors.duration_days = t('medication.validation.enterValidDays');
    }
    
    if (formData.requires_monitoring && !formData.monitoring_notes.trim()) {
      errors.monitoring_notes = t('medication.validation.monitoringRequired');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存用药计划
  const saveMedicationPlan = async () => {
    if (!validateForm()) {
      Alert.alert(t('common.error'), t('medication.validation.checkRequiredFields'));
      return;
    }

    setLoading(true);
    try {
      const planData = {
        medication: formData.medication.id,
        dosage: parseFloat(formData.dosage),
        frequency: formData.frequency,
        time_of_day: formData.time_of_day,
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date ? formData.end_date.toISOString().split('T')[0] : null,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        special_instructions: formData.special_instructions,
        dietary_requirements: formData.dietary_requirements,
        requires_monitoring: formData.requires_monitoring,
        monitoring_notes: formData.monitoring_notes
      };

      if (editingPlan) {
        await medicationAPI.updatePlan(patient.id, editingPlan.id, planData);
        Alert.alert(t('common.success'), t('medication.planUpdated'), [
          { text: t('common.confirm'), onPress: () => navigation.goBack() }
        ]);
      } else {
        await medicationAPI.createPlan(patient.id, planData);
        Alert.alert(t('common.success'), t('medication.planAdded'), [
          { text: t('common.confirm'), onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to save medication plan:', error);
      Alert.alert(t('common.error'), error.response?.data?.error || t('medication.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  // 过滤药品列表
  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(medicationSearch.toLowerCase()) ||
    (med.generic_name && med.generic_name.toLowerCase().includes(medicationSearch.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={editingPlan ? t('medication.editPlan') : t('medication.addPlan')} />
        <Appbar.Action 
          icon="check" 
          onPress={saveMedicationPlan}
          disabled={loading}
        />
      </Appbar.Header>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* 药品选择 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="search" size={20} color="#2196F3" />
              <Text variant="labelLarge" style={styles.sectionTitle}>{t('medication.selectMedication')} *</Text>
            </View>
            <Searchbar
              placeholder={t('medication.searchMedicationName')}
              onChangeText={setMedicationSearch}
              value={medicationSearch}
              style={styles.searchBar}
              inputStyle={styles.searchInput}
              iconColor="#2196F3"
            />
          </View>
          
          {/* 当前选中的药品显示 */}
          {formData.medication && (
            <Card style={styles.selectedMedicationCard}>
              <Card.Content style={styles.selectedMedicationContent}>
                <View style={styles.selectedMedicationIcon}>
                  <Ionicons name="medical" size={20} color="#4CAF50" />
                </View>
                <View style={styles.selectedMedicationInfo}>
                  <Text style={styles.selectedMedicationName}>
                    {formData.medication?.name}
                  </Text>
                  {formData.medication?.generic_name && (
                    <Text style={styles.selectedGenericName}>
                      {formData.medication?.generic_name}
                    </Text>
                  )}
                  <Text style={styles.selectedMedicationSpec}>
                    {formData.medication?.specification || t('medication.unknownSpec')} • {getCategoryDisplay(formData.medication?.category)}
                  </Text>
                </View>
                <View style={styles.selectedCheckmark}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
              </Card.Content>
            </Card>
          )}
          
          {/* 药品列表 */}
          {medicationSearch && filteredMedications.length > 0 && (
            <View style={styles.medicationList}>
              {filteredMedications.slice(0, 5).map((medication) => (
                <TouchableOpacity
                  key={medication.id}
                  style={[
                    styles.medicationItem,
                    formData.medication?.id === medication.id && styles.medicationItemSelected
                  ]}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, medication }));
                    setMedicationSearch('');
                  }}
                >
                  <View style={styles.medicationItemContent}>
                    <View style={styles.medicationItemIcon}>
                      <Ionicons name="medical" size={18} color="#666" />
                    </View>
                    <View style={styles.medicationItemInfo}>
                      <Text style={styles.medicationItemName}>{medication.name}</Text>
                      {medication.generic_name && (
                        <Text style={styles.medicationItemGeneric}>{medication.generic_name}</Text>
                      )}
                      <Text style={styles.medicationItemSpec}>
                        {medication.specification || t('medication.unknownSpec')} • {getCategoryDisplay(medication.category)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {formErrors.medication && (
            <HelperText type="error" visible={true}>
              {formErrors.medication}
            </HelperText>
          )}

          {/* 基本用药信息 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="clipboard" size={20} color="#2196F3" />
              <Text variant="labelLarge" style={styles.sectionTitle}>{t('medication.medicationInfo')}</Text>
            </View>

            {/* 剂量 */}
            <View style={styles.inputContainer}>
              <TextInput
                label={`${t('medication.dosageMg')} *`}
                value={formData.dosage}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dosage: text }))}
                keyboardType="numeric"
                mode="outlined"
                style={styles.textInput}
                error={!!formErrors.dosage}
                left={<TextInput.Icon icon="pill" />}
              />
              {formErrors.dosage && (
                <HelperText type="error" visible={true}>
                  {formErrors.dosage}
                </HelperText>
              )}
            </View>

            {/* 服药频次 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('medication.frequency.title')} *</Text>
              <SegmentedButtons
                value={formData.frequency}
                onValueChange={handleFrequencyChange}
                                  buttons={[
                    { value: 'QD', label: t('medication.frequency.onceDaily') },
                    { value: 'BID', label: t('medication.frequency.twiceDaily') },
                    { value: 'TID', label: t('medication.frequency.threeTimesDaily') },
                    { value: 'QID', label: t('medication.frequency.fourTimesDaily') }
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* 服药时间 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('medication.medicationTime')} *</Text>
              <View style={styles.timeContainer}>
                {(formData.time_of_day || ['08:00']).map((time, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.timeButton}
                    onPress={() => {
                      setEditingTimeIndex(index);
                      setShowTimePicker(true);
                    }}
                  >
                    <View style={styles.timeButtonContent}>
                      <Ionicons name="time" size={18} color="#FF5722" />
                      <Text style={styles.timeButtonText}>{t('medication.timeSlot', { number: index + 1 })}</Text>
                      <Text style={styles.timeButtonValue}>{time}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#999" />
                    </View>
                  </TouchableOpacity>
                ))}

                {/* 添加/删除时间按钮 */}
                <View style={styles.timeActions}>
                  {(formData.time_of_day || []).length < 4 && (
                    <Button
                      mode="outlined"
                      icon="plus"
                      onPress={() => {
                        const currentTimes = formData.time_of_day || ['08:00'];
                        const newTimes = [...currentTimes, '12:00'];
                        setFormData(prev => ({ ...prev, time_of_day: newTimes }));
                      }}
                      style={styles.timeActionButton}
                      compact
                    >
      {t('medication.addTime')}
                    </Button>
                  )}

                  {(formData.time_of_day || []).length > 1 && (
                    <Button
                      mode="outlined"
                      icon="minus"
                      onPress={() => {
                        const currentTimes = formData.time_of_day || ['08:00'];
                        const newTimes = currentTimes.slice(0, -1);
                        setFormData(prev => ({ ...prev, time_of_day: newTimes }));
                      }}
                      style={styles.timeActionButton}
                      compact
                    >
      {t('medication.removeTime')}
                    </Button>
                  )}
                </View>
              </View>
              {formErrors.time_of_day && (
                <HelperText type="error" visible={true}>
                  {formErrors.time_of_day}
                </HelperText>
              )}
            </View>
          </View>

          {/* 用药时间 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color="#2196F3" />
              <Text variant="labelLarge" style={styles.sectionTitle}>{t('medication.medicationTiming')}</Text>
            </View>

            {/* 开始日期 */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerType('start');
                  setShowDatePicker(true);
                }}
              >
                <View style={styles.dateButtonContent}>
                  <Ionicons name="calendar-outline" size={20} color="#2196F3" />
                  <View>
                    <Text style={styles.dateButtonLabel}>{t('medication.startDate')} *</Text>
                    <Text style={styles.dateButtonValue}>
                      {formData.start_date.toLocaleDateString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </TouchableOpacity>
            </View>

            {/* 结束日期 */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerType('end');
                  setShowDatePicker(true);
                }}
              >
                <View style={styles.dateButtonContent}>
                  <Ionicons name="calendar-outline" size={20} color="#2196F3" />
                  <View>
                    <Text style={styles.dateButtonLabel}>{t('medication.endDate')}</Text>
                    <Text style={styles.dateButtonValue}>
        {formData.end_date ? formData.end_date.toLocaleDateString() : t('medication.longTerm')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </TouchableOpacity>
            </View>

            {/* 用药天数 */}
            <View style={styles.inputContainer}>
              <TextInput
                label={t('medication.durationDays')}
                value={formData.duration_days}
                onChangeText={(text) => setFormData(prev => ({ ...prev, duration_days: text }))}
                keyboardType="numeric"
                mode="outlined"
                style={styles.textInput}
                error={!!formErrors.duration_days}
                left={<TextInput.Icon icon="clock-outline" />}
                placeholder={t('medication.durationPlaceholder')}
              />
              {formErrors.duration_days && (
                <HelperText type="error" visible={true}>
                  {formErrors.duration_days}
                </HelperText>
              )}
            </View>
          </View>

          {/* 特殊说明 */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color="#2196F3" />
              <Text variant="labelLarge" style={styles.sectionTitle}>{t('medication.specialInstructions')}</Text>
            </View>

            {/* 用药说明 */}
            <View style={styles.inputContainer}>
              <TextInput
                label={t('medication.instructions')}
                value={formData.special_instructions}
                onChangeText={(text) => setFormData(prev => ({ ...prev, special_instructions: text }))}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.textAreaInput}
                left={<TextInput.Icon icon="note-text" />}
                placeholder={t('medication.instructionsPlaceholder')}
              />
            </View>

            {/* 饮食要求 */}
            <View style={styles.inputContainer}>
              <TextInput
                label={t('medication.dietaryRequirements')}
                value={formData.dietary_requirements}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dietary_requirements: text }))}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.textAreaInput}
                left={<TextInput.Icon icon="nutrition" />}
                placeholder={t('medication.dietaryPlaceholder')}
              />
            </View>

            {/* 需要监测 */}
            <View style={styles.checkboxContainer}>
              <Checkbox
                status={formData.requires_monitoring ? 'checked' : 'unchecked'}
                onPress={() => setFormData(prev => ({ 
                  ...prev, 
                  requires_monitoring: !prev.requires_monitoring 
                }))}
              />
              <Text style={styles.checkboxLabel}>{t('medication.requiresMonitoring')}</Text>
            </View>

            {/* 监测说明 */}
            {formData.requires_monitoring && (
              <View style={styles.inputContainer}>
                <TextInput
                  label={`${t('medication.monitoringNotes')} *`}
                  value={formData.monitoring_notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, monitoring_notes: text }))}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.textAreaInput}
                  error={!!formErrors.monitoring_notes}
                  left={<TextInput.Icon icon="monitor-heart" />}
                  placeholder={t('medication.monitoringPlaceholder')}
                />
                {formErrors.monitoring_notes && (
                  <HelperText type="error" visible={true}>
                    {formErrors.monitoring_notes}
                  </HelperText>
                )}
              </View>
            )}
          </View>

          {/* 底部按钮 */}
          <View style={styles.bottomActions}>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={saveMedicationPlan}
              loading={loading}
              style={styles.saveButton}
              icon={editingPlan ? "check" : "plus"}
            >
  {editingPlan ? t('medication.updatePlan') : t('medication.addPlan')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 日期选择器 */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerType === 'start' ? formData.start_date : (formData.end_date || new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              if (datePickerType === 'start') {
                setFormData(prev => ({ ...prev, start_date: selectedDate }));
              } else {
                setFormData(prev => ({ ...prev, end_date: selectedDate }));
              }
            }
          }}
        />
      )}

      {/* 时间选择器 */}
      {showTimePicker && (
        <DateTimePicker
          value={new Date(`2000-01-01T${(formData.time_of_day || ['08:00'])[editingTimeIndex] || '08:00'}:00`)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              const timeString = selectedTime.toTimeString().slice(0, 5);
              const currentTimes = formData.time_of_day || ['08:00'];
              const newTimes = [...currentTimes];
              newTimes[editingTimeIndex] = timeString;
              setFormData(prev => ({ ...prev, time_of_day: newTimes }));
            }
          }}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // 为底部按钮留空间
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    marginLeft: 8,
    color: '#2196F3',
    fontWeight: '600',
  },
  searchBar: {
    backgroundColor: '#fff',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchInput: {
    fontSize: 14,
  },
  selectedMedicationCard: {
    backgroundColor: '#E8F5E8',
    marginBottom: 16,
    elevation: 2,
  },
  selectedMedicationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  selectedMedicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedMedicationInfo: {
    flex: 1,
  },
  selectedMedicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 2,
  },
  selectedGenericName: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 2,
  },
  selectedMedicationSpec: {
    fontSize: 12,
    color: '#666',
  },
  selectedCheckmark: {
    marginLeft: 8,
  },
  medicationList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  medicationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  medicationItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  medicationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  medicationItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicationItemInfo: {
    flex: 1,
  },
  medicationItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  medicationItemGeneric: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  medicationItemSpec: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#fff',
  },
  textAreaInput: {
    backgroundColor: '#fff',
    minHeight: 80,
  },
  segmentedButtons: {
    backgroundColor: '#fff',
  },
  timeContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  timeButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  timeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  timeButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  timeButtonValue: {
    marginLeft: 'auto',
    marginRight: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
  },
  timeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  timeActionButton: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 1,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  dateButtonLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
  },
  dateButtonValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginLeft: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});

export default AddMedicationScreen;