/**
 * 编辑患者信息页面组件
 * 
 * 功能特性：
 * - 编辑患者基本个人信息
 * - 管理患者慢性疾病列表
 * - 表单验证和错误处理
 * - 支持健康状态标记
 * - 实时风险等级计算
 * - 多语言支持
 * - 数据同步和状态管理
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
  TouchableOpacity
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Checkbox,
  ActivityIndicator,
  Appbar,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { resolvePatientRiskLevel } from '../../utils/riskUtils';

/**
 * 编辑患者信息页面主组件
 * 
 * 主要功能：
 * - 加载和显示患者现有信息
 * - 提供表单编辑界面
 * - 处理慢性疾病选择
 * - 表单验证和提交
 * - 更新患者风险等级
 * - 数据同步和导航
 * 
 * @param {Object} route - 路由参数对象
 * @param {Object} route.params.patient - 要编辑的患者信息
 * @param {Object} navigation - 导航对象
 * @returns {JSX.Element} 编辑患者信息页面组件
 */
const EditPatientScreen = ({ route, navigation }) => {
  const { patient } = route.params || {};
  const { t } = useTranslation();
  
  // 界面状态管理
  const [loading, setLoading] = useState(false);  // 保存中状态
  const [errors, setErrors] = useState({});       // 表单错误信息

  // 表单数据状态，从患者信息初始化
  const [formData, setFormData] = useState({
    name: patient?.name || '',                    // 患者姓名
    age: patient?.age?.toString() || '',          // 年龄
    gender: patient?.gender || 'male',            // 性别
    phone: patient?.phone || '',                  // 电话号码
    address: patient?.address || '',              // 地址
    emergencyContact: patient?.emergencyContact || '', // 紧急联系人
    emergencyPhone: patient?.emergencyPhone || '',     // 紧急联系电话
    height: patient?.height?.toString() || '',    // 身高
    weight: patient?.weight?.toString() || '',    // 体重
    bloodType: patient?.bloodType || '',          // 血型
    diseases: patient?.chronic_diseases === null ? [] : (patient?.chronic_diseases || []) // 慢性疾病列表
  });

  // 慢性疾病选项列表（健康选项在最前面）
  const chronicDiseases = [
    { id: 'healthy', name: '健康（无慢性疾病）', isHealthy: true },  // 健康状态选项
    { id: 'alzheimer', name: t('diseases.alzheimer') },              // 阿尔茨海默病
    { id: 'arthritis', name: t('diseases.arthritis') },              // 关节炎
    { id: 'asthma', name: t('diseases.asthma') },                    // 哮喘
    { id: 'cancer', name: t('diseases.cancer') },                    // 癌症
    { id: 'copd', name: t('diseases.copd') },                        // 慢性阻塞性肺疾病
    { id: 'crohn', name: t('diseases.crohn') },                      // 克罗恩病
    { id: 'cystic_fibrosis', name: t('diseases.cysticFibrosis') },   // 囊性纤维化
    { id: 'dementia', name: t('diseases.dementia') },                // 痴呆症
    { id: 'diabetes', name: t('diseases.diabetes') },                // 糖尿病
    { id: 'endometriosis', name: t('diseases.endometriosis') },      // 子宫内膜异位症
    { id: 'epilepsy', name: t('diseases.epilepsy') },                // 癫痫
    { id: 'fibromyalgia', name: t('diseases.fibromyalgia') },        // 纤维肌痛
    { id: 'heart_disease', name: t('diseases.heartDisease') },       // 心脏病
    { id: 'hypertension', name: t('diseases.hypertension') },        // 高血压
    { id: 'hiv_aids', name: t('diseases.hivAids') },                 // HIV/艾滋病
    { id: 'migraine', name: t('diseases.migraine') },                // 偏头痛
    { id: 'mood_disorder', name: t('diseases.moodDisorder') },       // 情绪障碍
    { id: 'multiple_sclerosis', name: t('diseases.multipleSclerosis') }, // 多发性硬化症
    { id: 'narcolepsy', name: t('diseases.narcolepsy') },            // 发作性睡病
    { id: 'parkinson', name: t('diseases.parkinson') },              // 帕金森病
    { id: 'sickle_cell', name: t('diseases.sickleCell') },           // 镰状细胞病
    { id: 'ulcerative_colitis', name: t('diseases.ulcerativeColitis') } // 溃疡性结肠炎
  ];

  /**
   * 表单验证函数
   * 检查必填字段和格式验证，返回验证结果
   * 
   * @returns {boolean} 验证是否通过
   */
  const validateForm = () => {
    const newErrors = {};

    // 姓名验证：必填
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired');
    }

    // 电话号码验证：必填且格式正确
    if (!formData.phone.trim()) {
      newErrors.phone = t('validation.phoneRequired');
    } else if (!/^[+]?[\d\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = t('validation.phoneInvalid');
    }

    // 紧急联系人验证：必填
    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = t('validation.emergencyContactRequired');
    }

    // 紧急联系电话验证：必填
    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = t('validation.emergencyPhoneRequired');
    }

    // 身高验证：范围检查（100-250cm）
    if (formData.height && (parseFloat(formData.height) < 100 || parseFloat(formData.height) > 250)) {
      newErrors.height = t('validation.heightInvalid');
    }

    // 体重验证：范围检查（30-300kg）
    if (formData.weight && (parseFloat(formData.weight) < 30 || parseFloat(formData.weight) > 300)) {
      newErrors.weight = t('validation.weightInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // 切换疾病选择
  const toggleDisease = (diseaseId) => {
    setFormData(prev => {
      if (diseaseId === 'healthy') {
        // 如果选择"健康"，清空所有其他疾病选择
        return {
          ...prev,
          diseases: prev.diseases.includes('healthy') ? [] : ['healthy']
        };
      } else {
        // 如果选择其他疾病，自动取消"健康"选项
        const newDiseases = prev.diseases.filter(id => id !== 'healthy');
        
        if (newDiseases.includes(diseaseId)) {
          // 取消选择该疾病
          return {
            ...prev,
            diseases: newDiseases.filter(id => id !== diseaseId)
          };
        } else {
          // 添加该疾病
          return {
            ...prev,
            diseases: [...newDiseases, diseaseId]
          };
        }
      }
    });
  };

  // 保存患者信息
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(t('common.error'), t('validation.pleaseFixErrors'));
      return;
    }

    setLoading(true);
    try {
      // 处理疾病数据：将"健康"选项转换为空数组
      let processedDiseases;
      if (formData.diseases.includes('healthy')) {
        processedDiseases = []; // 健康状态 = 空数组
      } else {
        processedDiseases = formData.diseases.filter(id => id !== 'healthy'); // 移除可能的健康选项
      }

      const updateData = {
        ...formData,
        chronic_diseases: processedDiseases  // 使用后端字段名
      };
      delete updateData.diseases; // 删除前端使用的字段名

      console.log('🔄 更新患者疾病信息:', {
        patientId: patient.id,
        diseases: processedDiseases,
        riskLevel: processedDiseases.length === 0 ? 'healthy' : 'needs_assessment'
      });
      
      // 调用真实API更新患者信息
      const response = await api.put(`/accounts/patients/${patient.id}/update/`, updateData);
      
      if (response.data.success) {
        // 计算统一风险等级并回传给上级页面，确保卡片与详情一致
        const updatedPatient = {
          ...patient,
          chronic_diseases: processedDiseases,
          risk_level: resolvePatientRiskLevel({ chronic_diseases: processedDiseases })
        };

        Alert.alert(
          t('common.success'),
          '患者疾病信息已更新',
          [
            {
              text: t('common.confirm'),
              onPress: () => {
                if (route.params && typeof route.params.onSaved === 'function') {
                  try { route.params.onSaved(updatedPatient); } catch (_) {}
                }
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        throw new Error(response.data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新患者信息失败:', error);
      Alert.alert(t('common.error'), error.message || t('screen.updatePatientInfoFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('screen.editPatientInfo')} />
        <Appbar.Action
          icon="check"
          onPress={handleSave}
          disabled={loading}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* 基本信息 */}
        <Card style={styles.section}>
          <Card.Title
            title={t('screen.basicInfo')}
            left={(props) => <Ionicons name="person" size={24} color="#2E86AB" />}
          />
          <Card.Content>
            <TextInput
              label={t('common.name')}
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              error={!!errors.name}
              style={styles.input}
              mode="outlined"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <View style={styles.row}>
              <TextInput
                label={t('common.age')}
                value={formData.age}
                onChangeText={(value) => updateField('age', value)}
                keyboardType="numeric"
                style={[styles.input, styles.halfInput]}
                mode="outlined"
              />
              
              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>{t('auth.gender')}</Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    style={[styles.genderOption, formData.gender === 'male' && styles.selectedGender]}
                    onPress={() => updateField('gender', 'male')}
                  >
                    <Text style={[styles.genderText, formData.gender === 'male' && styles.selectedGenderText]}>
                      {t('common.male')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderOption, formData.gender === 'female' && styles.selectedGender]}
                    onPress={() => updateField('gender', 'female')}
                  >
                    <Text style={[styles.genderText, formData.gender === 'female' && styles.selectedGenderText]}>
                      {t('common.female')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TextInput
              label={t('auth.phone')}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              keyboardType="phone-pad"
              error={!!errors.phone}
              style={styles.input}
              mode="outlined"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            <TextInput
              label={t('common.address')}
              value={formData.address}
              onChangeText={(value) => updateField('address', value)}
              multiline
              numberOfLines={2}
              style={styles.input}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        {/* 紧急联系人 */}
        <Card style={styles.section}>
          <Card.Title
            title={t('screen.emergencyContact')}
            left={(props) => <Ionicons name="call" size={24} color="#2E86AB" />}
          />
          <Card.Content>
            <TextInput
              label={t('screen.emergencyContactName')}
              value={formData.emergencyContact}
              onChangeText={(value) => updateField('emergencyContact', value)}
              error={!!errors.emergencyContact}
              style={styles.input}
              mode="outlined"
            />
            {errors.emergencyContact && <Text style={styles.errorText}>{errors.emergencyContact}</Text>}

            <TextInput
              label={t('screen.emergencyContactPhone')}
              value={formData.emergencyPhone}
              onChangeText={(value) => updateField('emergencyPhone', value)}
              keyboardType="phone-pad"
              error={!!errors.emergencyPhone}
              style={styles.input}
              mode="outlined"
            />
            {errors.emergencyPhone && <Text style={styles.errorText}>{errors.emergencyPhone}</Text>}
          </Card.Content>
        </Card>

        {/* 身体信息 */}
        <Card style={styles.section}>
          <Card.Title
            title={t('screen.physicalInfo')}
            left={(props) => <Ionicons name="fitness" size={24} color="#2E86AB" />}
          />
          <Card.Content>
            <View style={styles.row}>
              <TextInput
                label={t('health.height')}
                value={formData.height}
                onChangeText={(value) => updateField('height', value)}
                keyboardType="numeric"
                error={!!errors.height}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                right={<TextInput.Affix text="cm" />}
              />
              <TextInput
                label={t('health.weight')}
                value={formData.weight}
                onChangeText={(value) => updateField('weight', value)}
                keyboardType="numeric"
                error={!!errors.weight}
                style={[styles.input, styles.halfInput]}
                mode="outlined"
                right={<TextInput.Affix text="kg" />}
              />
            </View>
            {(errors.height || errors.weight) && (
              <Text style={styles.errorText}>
                {errors.height || errors.weight}
              </Text>
            )}

            <TextInput
              label={t('screen.bloodType')}
              value={formData.bloodType}
              onChangeText={(value) => updateField('bloodType', value)}
              style={styles.input}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        {/* 慢性疾病 */}
        <Card style={styles.section}>
          <Card.Title
            title={t('screen.chronicDiseases')}
            left={(props) => <Ionicons name="medical" size={24} color="#2E86AB" />}
          />
          <Card.Content>
            <Text style={styles.diseasesDescription}>
              {t('screen.selectPatientDiseases')}
            </Text>
            {chronicDiseases.map((disease) => (
              <View 
                key={disease.id} 
                style={[
                  styles.diseaseItem,
                  disease.isHealthy && styles.healthyOption
                ]}
              >
                <Checkbox
                  status={formData.diseases.includes(disease.id) ? 'checked' : 'unchecked'}
                  onPress={() => toggleDisease(disease.id)}
                  color={disease.isHealthy ? '#00E676' : undefined}
                />
                <Text 
                  style={[
                    styles.diseaseText,
                    disease.isHealthy && styles.healthyText
                  ]}
                >
                  {disease.name}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
          >
            {loading ? t('common.saving') : t('common.save')}
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 8,
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  genderContainer: {
    flex: 1,
    marginLeft: 8,
  },
  genderLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  genderOptions: {
    flexDirection: 'row',
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  selectedGender: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  genderText: {
    color: '#666',
    fontSize: 14,
  },
  selectedGenderText: {
    color: 'white',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 12,
  },
  diseasesDescription: {
    color: '#666',
    marginBottom: 16,
    fontSize: 14,
  },
  diseaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  healthyOption: {
    backgroundColor: '#E8F5E8',
    marginVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00E676',
  },
  diseaseText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  healthyText: {
    color: '#00C853',
    fontWeight: '600',
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    paddingVertical: 8,
  },
});

export default EditPatientScreen;