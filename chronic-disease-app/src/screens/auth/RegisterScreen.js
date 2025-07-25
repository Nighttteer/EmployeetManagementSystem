import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  RadioButton, 
  Divider,
  HelperText,
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { register } from '../../store/slices/authSlice';
import { USER_ROLES } from '../../utils/dataModels';
import CountryCodePicker from '../../components/CountryCodePicker';
import { DEFAULT_COUNTRY, COUNTRY_CODES, getPhoneValidationError, getCountryByCode } from '../../utils/countryCodes';
import { authAPI } from '../../services/api';

const RegisterScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.PATIENT, // 默认为患者
    phone: '',
    countryCode: DEFAULT_COUNTRY.code, // 默认为中国
    age: '',
    gender: 'male',
    smsCode: '' // SMS验证码
  });

  // 验证状态
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  
  // SMS验证码相关状态
  const [smsCodeSent, setSmsCodeSent] = useState(false);
  const [smsCodeSending, setSmsCodeSending] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsCodeVerified, setSmsCodeVerified] = useState(false);

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
        [field]: null
      }));
    }
  };

  // 倒计时功能
  React.useEffect(() => {
    let interval;
    if (smsCountdown > 0) {
      interval = setInterval(() => {
        setSmsCountdown(prev => prev - 1);
      }, 1000);
    } else if (smsCountdown === 0) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [smsCountdown]);

  // 发送SMS验证码
  const handleSendSmsCode = async () => {
    // 验证手机号
    const phoneError = getPhoneValidationError(formData.phone.trim(), formData.countryCode);
    if (phoneError) {
      setErrors(prev => ({ ...prev, phone: phoneError }));
      Alert.alert('手机号错误', phoneError);
      return;
    }

    setSmsCodeSending(true);
    try {
      const fullPhone = `${formData.countryCode}${formData.phone.trim()}`;
      await authAPI.sendSMSCode({
        phone: fullPhone,
        purpose: 'register'
      });
      
      setSmsCodeSent(true);
      setSmsCountdown(60); // 60秒倒计时
      Alert.alert('发送成功', '验证码已发送到您的手机，请注意查收');
    } catch (error) {
      console.error('发送验证码失败:', error);
      Alert.alert('发送失败', error.response?.data?.message || '验证码发送失败，请重试');
    } finally {
      setSmsCodeSending(false);
    }
  };

  // 验证SMS验证码
  const handleVerifySmsCode = async () => {
    if (!formData.smsCode || formData.smsCode.length !== 6) {
      setErrors(prev => ({ ...prev, smsCode: t('auth.enterSixDigitCode') }));
      return;
    }

    try {
      const fullPhone = `${formData.countryCode}${formData.phone.trim()}`;
      await authAPI.verifySMSCode({
        phone: fullPhone,
        code: formData.smsCode,
        purpose: 'register'
      });
      
      setSmsCodeVerified(true);
      Alert.alert(t('auth.verificationSuccess'), t('auth.phoneVerified'));
    } catch (error) {
      console.error('验证码验证失败:', error);
              setErrors(prev => ({ ...prev, smsCode: error.response?.data?.message || t('auth.verificationCodeError') }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};

    // 姓名验证
    if (!formData.name.trim()) {
      newErrors.name = t('auth.enterName');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('auth.nameMinLength');
    }

    // 邮箱验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = t('auth.enterEmail');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('auth.enterValidEmail');
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = t('auth.enterPassword');
    } else if (formData.password.length < 8) {
      newErrors.password = t('auth.passwordMinLength');
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.confirmPassword');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordMismatch');
    }

    // 手机号验证
    const phoneError = getPhoneValidationError(formData.phone.trim(), formData.countryCode);
    if (phoneError) {
      newErrors.phone = phoneError;
    }

    // 年龄验证
    if (!formData.age) {
      newErrors.age = t('auth.enterAge');
    } else {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 120) {
        newErrors.age = t('auth.validAge');
      }
    }

    // SMS验证码验证
    if (!smsCodeVerified) {
      if (!formData.smsCode) {
        newErrors.smsCode = t('auth.enterVerificationCode');
      } else if (formData.smsCode.length !== 6) {
        newErrors.smsCode = t('auth.sixDigitCode');
      } else if (!/^\d{6}$/.test(formData.smsCode)) {
        newErrors.smsCode = t('auth.codeNumericOnly');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交注册
  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert(t('auth.formValidationFailed'), t('auth.checkAndFillInfo'));
      return;
    }

    if (!smsCodeVerified) {
      Alert.alert(t('auth.verifyPhoneFirst'), t('auth.enterCodeAndVerify'));
      return;
    }

    setIsLoading(true);

    try {
      // 准备注册数据
      const registerData = {
        username: formData.email.trim().toLowerCase(), // 使用邮箱作为用户名
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        password_confirm: formData.confirmPassword,
        role: formData.role,
        phone: `${formData.countryCode}${formData.phone.trim()}`, // 包含国家区号
        age: parseInt(formData.age),
        gender: formData.gender,
        sms_code: formData.smsCode // 添加SMS验证码
      };

      // 调用带SMS验证的注册API
      const response = await authAPI.registerWithSMS(registerData);
      
      if (response.data) {
        // 保存token到Redux store和SecureStore
        const userData = response.data;
        
        // 保存token到SecureStore
        await SecureStore.setItemAsync('authToken', userData.tokens.access);
        await SecureStore.setItemAsync('userRole', userData.user.role);
        
        // 更新Redux状态
        dispatch({
          type: 'auth/register/fulfilled',
          payload: {
            token: userData.tokens.access,
            user: userData.user,
            role: userData.user.role
          }
        });
        
        Alert.alert(
          t('auth.registerSuccess'),
          t('auth.welcomeToSystem', { role: getRoleDisplayName(formData.role) }),
          [
            {
              text: t('auth.startUsing'),
              onPress: () => {
                console.log('注册成功，用户信息：', response.data);
                // 根据角色导航到相应的主页面
                if (formData.role === USER_ROLES.PATIENT) {
                  navigation.replace('PatientMain');
                } else if (formData.role === USER_ROLES.DOCTOR) {
                  navigation.replace('DoctorMain');
                } else {
                  navigation.replace('AuthStack');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('注册失败:', error);
      console.error('错误详情:', error.response?.data);
      
      // 更详细的错误信息处理
      let errorMessage = t('auth.registerFailed');
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // 处理字段验证错误
        if (typeof errorData === 'object' && !errorData.message && !errorData.error) {
          const fieldErrors = [];
          
          // 字段名称映射
          const fieldNameMap = {
            'email': t('auth.email'),
            'password': t('auth.password'),
            'username': t('auth.username'),
            'phone': t('auth.phone'),
            'name': t('auth.name'),
            'age': t('auth.age'),
            'sms_code': t('auth.verificationCode'),
            'password_confirm': t('auth.confirmPassword')
          };
          
          Object.keys(errorData).forEach(field => {
            const fieldName = fieldNameMap[field] || field;
            const errors = Array.isArray(errorData[field]) ? errorData[field] : [errorData[field]];
            
            errors.forEach(error => {
              // 优化常见错误提示
              let friendlyError = error;
              
              if (error.includes('已存在') || error.includes('already exists')) {
                friendlyError = `${fieldName}已被使用，请更换`;
              } else if (error.includes('密码长度太短')) {
                friendlyError = '密码至少需要8个字符';
              } else if (error.includes('格式无效') || error.includes('invalid format')) {
                friendlyError = `${fieldName}格式不正确`;
              }
              
              fieldErrors.push(`• ${friendlyError}`);
            });
          });
          
          errorMessage = fieldErrors.join('\n');
        } else {
          errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('注册失败', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取角色显示名称
  const getRoleDisplayName = (role) => {
    switch (role) {
      case USER_ROLES.PATIENT:
        return t('auth.patient');
      case USER_ROLES.DOCTOR:
        return t('auth.doctor');
      case USER_ROLES.ADMIN:
        return t('auth.admin');
      default:
        return t('auth.unknown');
    }
  };

  // 渲染角色选择
  const renderRoleSelection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>{t('auth.selectRole')}</Text>
        <Text style={styles.cardSubtitle}>{t('auth.selectYourIdentity')}</Text>
        
        <View style={styles.roleContainer}>
          <View style={styles.roleOption}>
            <RadioButton
              value={USER_ROLES.PATIENT}
              status={formData.role === USER_ROLES.PATIENT ? 'checked' : 'unchecked'}
              onPress={() => updateField('role', USER_ROLES.PATIENT)}
            />
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>{t('auth.patient')}</Text>
              <Text style={styles.roleDescription}>{t('auth.patientDescription')}</Text>
            </View>
          </View>

          <View style={styles.roleOption}>
            <RadioButton
              value={USER_ROLES.DOCTOR}
              status={formData.role === USER_ROLES.DOCTOR ? 'checked' : 'unchecked'}
              onPress={() => updateField('role', USER_ROLES.DOCTOR)}
            />
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>{t('auth.doctor')}</Text>
              <Text style={styles.roleDescription}>{t('auth.doctorDescription')}</Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // 渲染性别选择
  const renderGenderSelection = () => (
    <View style={styles.genderContainer}>
      <Text style={styles.inputLabel}>性别</Text>
      <View style={styles.genderOptions}>
        <Chip
          mode={formData.gender === 'male' ? 'flat' : 'outlined'}
          selected={formData.gender === 'male'}
          onPress={() => updateField('gender', 'male')}
          style={[styles.genderChip, formData.gender === 'male' && styles.selectedChip]}
        >
          男
        </Chip>
        <Chip
          mode={formData.gender === 'female' ? 'flat' : 'outlined'}
          selected={formData.gender === 'female'}
          onPress={() => updateField('gender', 'female')}
          style={[styles.genderChip, formData.gender === 'female' && styles.selectedChip]}
        >
          女
        </Chip>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 页面标题 */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.registerTitle')}</Text>
            <Text style={styles.subtitle}>{t('auth.joinSystem')}</Text>
          </View>

          {/* 角色选择 */}
          {renderRoleSelection()}

          {/* 基本信息 */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>{t('auth.basicInfo')}</Text>
              
              {/* 姓名 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('auth.name')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder={t('auth.enterRealName')}
                  mode="outlined"
                  error={!!errors.name}
                />
                {errors.name && <HelperText type="error">{errors.name}</HelperText>}
              </View>

              {/* 邮箱 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('auth.email')} *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => updateField('email', value)}
                  placeholder={t('auth.enterEmail')}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={!!errors.email}
                />
                {errors.email && <HelperText type="error">{errors.email}</HelperText>}
              </View>

              {/* 手机号 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>手机号 *</Text>
                <View style={styles.phoneInputContainer}>
                  <CountryCodePicker
                    selectedCountry={selectedCountry}
                    onCountrySelect={(country) => {
                      setSelectedCountry(country);
                      updateField('countryCode', country.code);
                      // 清除手机号，因为格式可能不同
                      updateField('phone', '');
                      // 重置SMS验证状态
                      setSmsCodeSent(false);
                      setSmsCodeVerified(false);
                      updateField('smsCode', '');
                    }}
                    style={styles.countryPicker}
                  />
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={formData.phone}
                    onChangeText={(value) => {
                      updateField('phone', value);
                      // 手机号改变时重置SMS验证状态
                      if (smsCodeSent) {
                        setSmsCodeSent(false);
                        setSmsCodeVerified(false);
                        updateField('smsCode', '');
                      }
                    }}
                    placeholder={selectedCountry.placeholder}
                    mode="outlined"
                    keyboardType="phone-pad"
                    maxLength={selectedCountry.phoneLength}
                    error={!!errors.phone}
                  />
                </View>
                {errors.phone ? (
                  <HelperText type="error">{errors.phone}</HelperText>
                ) : (
                  <HelperText type="info">
                    示例：{selectedCountry.example}
                  </HelperText>
                )}
              </View>

              {/* SMS验证码 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>短信验证码 *</Text>
                <View style={styles.smsInputContainer}>
                  <TextInput
                    style={[styles.input, styles.smsInput]}
                    value={formData.smsCode}
                    onChangeText={(value) => updateField('smsCode', value)}
                    placeholder="请输入6位验证码"
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={6}
                    error={!!errors.smsCode}
                    disabled={smsCodeVerified}
                  />
                  <View style={styles.smsButtons}>
                    <Button
                      mode="outlined"
                      onPress={handleSendSmsCode}
                      loading={smsCodeSending}
                      disabled={smsCodeSending || smsCountdown > 0 || !formData.phone.trim()}
                      style={styles.smsButton}
                      compact
                    >
                      {smsCountdown > 0 ? `${smsCountdown}s` : (smsCodeSent ? '重新发送' : '发送验证码')}
                    </Button>
                    
                    {smsCodeSent && !smsCodeVerified && (
                      <Button
                        mode="contained"
                        onPress={handleVerifySmsCode}
                        disabled={!formData.smsCode || formData.smsCode.length !== 6}
                        style={styles.verifyButton}
                        compact
                      >
                        验证
                      </Button>
                    )}
                  </View>
                </View>
                
                {errors.smsCode ? (
                  <HelperText type="error">{errors.smsCode}</HelperText>
                ) : smsCodeVerified ? (
                  <HelperText type="info" style={styles.successText}>
                    ✓ 手机号验证通过
                  </HelperText>
                ) : smsCodeSent ? (
                  <HelperText type="info">
                    验证码已发送，请查收短信
                  </HelperText>
                ) : (
                  <HelperText type="info">
                    请先输入手机号，然后点击发送验证码
                  </HelperText>
                )}
              </View>

              {/* 年龄和性别 */}
              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>年龄 *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.age}
                    onChangeText={(value) => updateField('age', value)}
                    placeholder="年龄"
                    mode="outlined"
                    keyboardType="numeric"
                    maxLength={3}
                    error={!!errors.age}
                  />
                  {errors.age && <HelperText type="error">{errors.age}</HelperText>}
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  {renderGenderSelection()}
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* 密码设置 */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>密码设置</Text>
              
              {/* 密码 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>密码 *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(value) => updateField('password', value)}
                  placeholder="请输入密码（至少8位）"
                  mode="outlined"
                  secureTextEntry
                  error={!!errors.password}
                />
                {errors.password && <HelperText type="error">{errors.password}</HelperText>}
              </View>

              {/* 确认密码 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>确认密码 *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateField('confirmPassword', value)}
                  placeholder="请再次输入密码"
                  mode="outlined"
                  secureTextEntry
                  error={!!errors.confirmPassword}
                />
                {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}
              </View>
            </Card.Content>
          </Card>

          {/* 注册按钮 */}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.registerButton}
            contentStyle={styles.registerButtonContent}
          >
            {isLoading ? '注册中...' : '创建账户'}
          </Button>

          {/* 登录链接 */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginLinkText}>已有账户？</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              labelStyle={styles.loginLinkButton}
            >
              立即登录
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  roleContainer: {
    marginTop: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  roleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    fontSize: 16,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  countryPicker: {
    height: 56,
    borderRadius: 8,
    marginRight: 8,
    minWidth: 120,
    maxWidth: 140,
  },
  phoneInput: {
    flex: 1,
  },
  smsInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  smsInput: {
    flex: 1,
  },
  smsButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  smsButton: {
    minWidth: 100,
  },
  verifyButton: {
    minWidth: 100,
  },
  successText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  genderContainer: {
    marginTop: 0,
  },
  genderOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  genderChip: {
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: '#6200ea',
  },
  registerButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  registerButtonContent: {
    paddingVertical: 12,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 16,
    color: '#666',
  },
  loginLinkButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen; 