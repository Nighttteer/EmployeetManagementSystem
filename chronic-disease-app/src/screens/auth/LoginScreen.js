import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { loginUser } from '../../store/slices/authSlice';
import CustomButton from '../../components/CustomButton';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    userType: 'patient', // 'patient' 或 'doctor'
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async () => {
    // 验证输入
    if (!formData.phone.trim()) {
      Alert.alert(t('common.warning'), t('auth.enterPhone'));
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert(t('common.warning'), t('auth.enterPassword'));
      return;
    }

    try {
      const result = await dispatch(loginUser({
        phone: formData.phone,
        password: formData.password,
        userType: formData.userType
      }));

      if (loginUser.fulfilled.match(result)) {
        // 登录成功，导航会由AppNavigator自动处理
      } else {
        // 提供详细的错误信息
        let errorTitle = t('auth.loginFailed');
        let errorMessage = result.payload || t('auth.checkCredentials');
        
        // 根据错误类型提供具体建议
        if (typeof result.payload === 'string') {
          if (result.payload.includes('网络')) {
            errorMessage += '\n\n建议检查：\n• 网络连接是否正常\n• 后端服务是否启动\n• API地址是否正确';
          } else if (result.payload.includes('密码') || result.payload.includes('用户')) {
            errorMessage += '\n\n建议检查：\n• 手机号格式是否正确\n• 密码是否正确\n• 用户类型是否匹配';
          } else if (result.payload.includes('500') || result.payload.includes('服务器')) {
            errorMessage += '\n\n建议检查：\n• 后端服务器是否正常运行\n• 数据库连接是否正常\n• 查看服务器日志';
          }
        }
        
        Alert.alert(errorTitle, errorMessage);
      }
    } catch (error) {
      console.error('登录异常:', error);
      
      Alert.alert(
        t('auth.loginFailed'), 
        `网络连接失败\n\n错误信息: ${error.message}\n\n建议：\n• 检查网络连接\n• 确认后端服务运行\n• 查看控制台日志`
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="headlineLarge" style={styles.title}>
                {t('auth.login')}
              </Text>
            </View>
            <Text variant="bodyLarge" style={styles.subtitle}>
              {t('auth.welcomeBack')}
            </Text>
          </View>

          <View style={styles.form}>
            {/* 用户类型选择 */}
            <View style={styles.userTypeContainer}>
              <Text variant="titleMedium" style={styles.label}>
                {t('auth.selectUserType')}
              </Text>
              <SegmentedButtons
                value={formData.userType}
                onValueChange={(value) => handleInputChange('userType', value)}
                buttons={[
                  {
                    value: 'patient',
                    label: t('auth.patient'),
                    icon: 'account',
                  },
                  {
                    value: 'doctor',
                    label: t('auth.doctor'),
                    icon: 'doctor',
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* 手机号输入 */}
            <View style={styles.inputContainer}>
              <TextInput
                label={t('auth.phone')}
                value={formData.phone}
                onChangeText={(text) => handleInputChange('phone', text)}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="phone-pad"
                placeholder={t('auth.phonePlaceholder')}
                left={<TextInput.Icon icon="phone" />}
              />
            </View>

            {/* 密码输入 */}
            <View style={styles.inputContainer}>
              <TextInput
                label={t('auth.password')}
                value={formData.password}
                onChangeText={(text) => handleInputChange('password', text)}
                mode="outlined"
                secureTextEntry={!showPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"} 
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            </View>

            {/* 错误信息显示 */}
            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}

            {/* 登录按钮 */}
            <CustomButton
              title={loading ? t('auth.loggingIn') : t('auth.login')}
              onPress={handleLogin}
              disabled={loading}
              size="large"
              style={styles.loginButton}
            />

            {/* 快速测试按钮 */}
            <View style={styles.quickTestContainer}>
              <Text style={styles.quickTestTitle}>{t('auth.quickTest')}</Text>
              <View style={styles.quickTestButtons}>
                <TouchableOpacity 
                  style={styles.quickTestButton}
                  onPress={() => {
                    setFormData({
                      phone: '+8613800138000',
                      password: 'test123456',
                      userType: 'patient'
                    });
                  }}
                >
                  <Text style={styles.quickTestButtonText}>{t('auth.patientLogin')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickTestButton}
                  onPress={() => {
                    setFormData({
                      phone: '+8613800138001',
                      password: 'test123456',
                      userType: 'doctor'
                    });
                  }}
                >
                  <Text style={styles.quickTestButtonText}>{t('auth.doctorLogin')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 忘记密码链接 */}
            <CustomButton
              title={t('auth.forgotPassword')}
              onPress={() => navigation.navigate('ForgotPassword')}
              mode="text"
              style={styles.forgotButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.noAccount')}
            </Text>
            <CustomButton
              title={t('auth.registerNow')}
              onPress={() => navigation.navigate('Register')}
              mode="text"
              style={styles.registerLink}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    flex: 1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  userTypeContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    color: '#333333',
    marginBottom: 12,
    fontWeight: '600',
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    fontSize: 18,
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  forgotButton: {
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 16,
    color: '#666666',
  },
  registerLink: {
    marginLeft: 8,
  },
  quickTestContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickTestTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickTestButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickTestButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickTestButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default LoginScreen; 