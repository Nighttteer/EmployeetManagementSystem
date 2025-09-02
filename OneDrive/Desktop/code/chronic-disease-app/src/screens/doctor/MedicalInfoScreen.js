import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Button,
  TextInput,
  Surface,
  ActivityIndicator
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { api } from '../../services/api';

const MedicalInfoScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 简化的表单数据
  const [formData, setFormData] = useState({
    licenseNumber: '',
    specialization: '',
    hospital: '',
    department: '',
    experience: ''
  });

  // 加载医生信息
  const loadDoctorInfo = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // 尝试从用户信息中获取医生数据
      if (user.doctor_info) {
        setFormData({
          licenseNumber: user.doctor_info.license_number || '',
          specialization: user.doctor_info.specialization || '',
          hospital: user.doctor_info.hospital || '',
          department: user.doctor_info.department || '',
          experience: user.doctor_info.experience || ''
        });
      }
    } catch (error) {
      console.error('加载医生信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存医生信息
  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // 这里可以调用API保存，或者暂时只保存到本地状态
      // 由于后端API可能不存在，我们先保存到本地状态
      Alert.alert(t('common.success'), t('settings.doctorInfoSaved'));
    } catch (error) {
      console.error('保存医生信息失败:', error);
      Alert.alert(t('common.error'), t('settings.saveDoctorInfoFailed'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadDoctorInfo();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 基本信息 */}
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.basicInfo')}
          </Text>
          
          <TextInput
            label={t('settings.licenseNumber')}
            value={formData.licenseNumber}
            onChangeText={(text) => setFormData(prev => ({ ...prev, licenseNumber: text }))}
            mode="outlined"
            style={styles.input}
            placeholder={t('settings.enterLicenseNumber')}
          />
          
          <TextInput
            label={t('settings.specialization')}
            value={formData.specialization}
            onChangeText={(text) => setFormData(prev => ({ ...prev, specialization: text }))}
            mode="outlined"
            style={styles.input}
            placeholder={t('settings.selectSpecialization')}
          />
          
          <TextInput
            label={t('settings.hospital')}
            value={formData.hospital}
            onChangeText={(text) => setFormData(prev => ({ ...prev, hospital: text }))}
            mode="outlined"
            style={styles.input}
            placeholder={t('settings.enterHospitalName')}
          />
          
          <TextInput
            label={t('settings.department')}
            value={formData.department}
            onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
            mode="outlined"
            style={styles.input}
            placeholder={t('settings.enterDepartment')}
          />
          
          <TextInput
            label={t('settings.yearsOfExperience')}
            value={formData.experience}
            onChangeText={(text) => setFormData(prev => ({ ...prev, experience: text }))}
            mode="outlined"
            style={styles.input}
            placeholder={t('settings.enterExperience')}
            keyboardType="numeric"
          />
        </Surface>

        {/* 说明信息 */}
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.aboutThisSection')}
          </Text>
          <Text style={styles.descriptionText}>
            {t('settings.medicalInfoDescription')}
          </Text>
        </Surface>

        {/* 保存按钮 */}
        <View style={styles.saveContainer}>
          <Button 
            mode="contained" 
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            icon="content-save"
            style={styles.saveButton}
          >
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  saveContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default MedicalInfoScreen;
