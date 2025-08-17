import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Card, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../services/api';
import CountryCodePicker from '../../components/CountryCodePicker';

const ForgotPasswordScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // 状态管理
  const [step, setStep] = useState(1); // 1: 手机号验证, 2: 验证码输入, 3: 设置新密码
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+86');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // 错误状态
  const [errors, setErrors] = useState({});
  
  // 验证手机号格式
  const validatePhone = (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    if (!cleanPhone) return t('auth.phoneRequired');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) return t('auth.phoneFormatError');
    if (!/^\d+$/.test(cleanPhone)) return t('auth.phoneNumericOnly');
    return null;
  };
  
  // 验证密码强度
  const validatePassword = (password) => {
    if (!password) return t('auth.passwordRequired');
    if (password.length < 8) return t('auth.passwordTooShort');
    return null;
  };
  
  // 发送验证码
  const sendVerificationCode = async () => {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setErrors({ phone: phoneError });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const fullPhone = countryCode + phone.replace(/\s+/g, '');
      const response = await fetch(`${API_BASE_URL}/auth/password/reset/request/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhone,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCodeSent(true);
        setStep(2);
        startCountdown();
        Alert.alert(t('auth.codeSent'), t('auth.checkSmsCode'));
      } else {
        setErrors({ general: data.error || data.phone?.[0] || t('auth.sendCodeFailed') });
      }
    } catch (error) {
      setErrors({ general: t('auth.networkError') });
    } finally {
      setLoading(false);
    }
  };
  
  // 开始倒计时
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // 验证验证码
  const verifyCode = () => {
    if (!code || code.length !== 6) {
      setErrors({ code: t('auth.codeRequired') });
      return;
    }
    
    setErrors({});
    setStep(3);
  };
  
  // 重置密码
  const resetPassword = async () => {
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: t('auth.passwordMismatch') });
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const fullPhone = countryCode + phone.replace(/\s+/g, '');
      const response = await fetch(`${API_BASE_URL}/auth/password/reset/confirm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhone,
          code: code,
          new_password: newPassword,
          new_password_confirm: confirmPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(
          t('auth.passwordResetSuccess'),
          t('auth.passwordResetSuccess'),
          [
            {
              text: t('common.confirm'),
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        const errorMsg = data.error || data.non_field_errors?.[0] || t('auth.passwordResetFailed');
        setErrors({ general: errorMsg });
      }
    } catch (error) {
      setErrors({ general: t('auth.networkError') });
    } finally {
      setLoading(false);
    }
  };
  
  // 返回上一步
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    } else {
      navigation.goBack();
    }
  };
  
  // 步骤1：手机号验证
  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineMedium" style={styles.stepTitle}>
        {t('auth.forgotPassword')}
      </Text>
      <Text variant="bodyMedium" style={styles.stepDescription}>
        {t('auth.enterRegisteredPhone')}
      </Text>
      
      <View style={styles.phoneContainer}>
        <CountryCodePicker
          value={countryCode}
          onValueChange={setCountryCode}
          style={styles.countryPicker}
        />
        <TextInput
          mode="outlined"
          label={t('auth.phoneNumber')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          autoFocus
          error={!!errors.phone}
          style={styles.phoneInput}
        />
      </View>
      
      {errors.phone && (
        <HelperText type="error" visible={!!errors.phone}>
          {errors.phone}
        </HelperText>
      )}
      
      <Button
        mode="contained"
        onPress={sendVerificationCode}
        loading={loading}
        disabled={loading}
        style={styles.submitButton}
      >
        {t('auth.sendCode')}
      </Button>
    </View>
  );
  
  // 步骤2：验证码输入
  const renderCodeStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineMedium" style={styles.stepTitle}>
        {t('auth.verifyPhone')}
      </Text>
      <Text variant="bodyMedium" style={styles.stepDescription}>
        {t('auth.codeSentTo')} {countryCode} {phone}
      </Text>
      
      <TextInput
        mode="outlined"
        label={t('auth.verificationCode')}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        error={!!errors.code}
        style={styles.input}
      />
      
      {errors.code && (
        <HelperText type="error" visible={!!errors.code}>
          {errors.code}
        </HelperText>
      )}
      
      <View style={styles.codeActions}>
        <Button
          mode="text"
          onPress={sendVerificationCode}
          disabled={countdown > 0 || loading}
          loading={loading}
        >
          {countdown > 0 ? t('auth.resendWithCountdown', { countdown }) : t('auth.resend')}
        </Button>
      </View>
      
      <Button
        mode="contained"
        onPress={verifyCode}
        disabled={code.length !== 6}
        style={styles.submitButton}
      >
        {t('auth.nextStep')}
      </Button>
    </View>
  );
  
  // 步骤3：设置新密码
  const renderPasswordStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineMedium" style={styles.stepTitle}>
        {t('auth.setNewPassword')}
      </Text>
      <Text variant="bodyMedium" style={styles.stepDescription}>
        {t('auth.setNewPasswordDesc')}
      </Text>
      
      <TextInput
        mode="outlined"
        label={t('auth.newPassword')}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoFocus
        error={!!errors.password}
        style={styles.input}
      />
      
      {errors.password && (
        <HelperText type="error" visible={!!errors.password}>
          {errors.password}
        </HelperText>
      )}
      
      <TextInput
        mode="outlined"
        label={t('auth.confirmNewPassword')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={!!errors.confirmPassword}
        style={styles.input}
      />
      
      {errors.confirmPassword && (
        <HelperText type="error" visible={!!errors.confirmPassword}>
          {errors.confirmPassword}
        </HelperText>
      )}
      
      <Button
        mode="contained"
        onPress={resetPassword}
        loading={loading}
        disabled={loading || !newPassword || !confirmPassword}
        style={styles.submitButton}
      >
        {t('auth.confirmModify')}
      </Button>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.card}>
            <Card.Content>
              {/* 步骤指示器 */}
              <View style={styles.stepIndicator}>
                {[1, 2, 3].map((stepNum) => (
                  <View
                    key={stepNum}
                    style={[
                      styles.stepDot,
                      stepNum === step && styles.stepDotActive,
                      stepNum < step && styles.stepDotCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepDotText,
                        (stepNum === step || stepNum < step) && styles.stepDotTextActive,
                      ]}
                    >
                      {stepNum}
                    </Text>
                  </View>
                ))}
              </View>
              
              {/* 错误提示 */}
              {errors.general && (
                <HelperText type="error" visible={!!errors.general}>
                  {errors.general}
                </HelperText>
              )}
              
              {/* 渲染当前步骤 */}
              {step === 1 && renderPhoneStep()}
              {step === 2 && renderCodeStep()}
              {step === 3 && renderPasswordStep()}
            </Card.Content>
          </Card>
          
          {/* 返回按钮 */}
          <View style={styles.footer}>
            <Button
              mode="text"
              onPress={goBack}
              style={styles.backButton}
            >
              {step === 1 ? t('auth.backToLogin') : t('auth.previousStep')}
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#2196F3',
  },
  stepDotCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666666',
  },
  stepDotTextActive: {
    color: '#ffffff',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 8,
  },
  countryPicker: {
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
  },
  input: {
    width: '100%',
    marginBottom: 8,
  },
  codeActions: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButton: {
    width: '100%',
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
  },
  backButton: {
    marginTop: 16,
  },
});

export default ForgotPasswordScreen; 