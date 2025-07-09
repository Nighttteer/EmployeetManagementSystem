import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { loginUser } from '../../store/slices/authSlice';
import CustomButton from '../../components/CustomButton';

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
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
    if (!formData.username.trim()) {
      Alert.alert('提示', '请输入用户名');
      return;
    }
    if (!formData.password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    try {
      const result = await dispatch(loginUser({
        username: formData.username,
        password: formData.password,
        userType: formData.userType
      }));

      if (loginUser.fulfilled.match(result)) {
        // 登录成功，导航会由AppNavigator自动处理
      } else {
        // 登录失败
        Alert.alert('登录失败', result.payload || '请检查用户名和密码');
      }
    } catch (error) {
      Alert.alert('登录失败', '网络连接异常，请稍后重试');
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
            <Text variant="headlineLarge" style={styles.title}>
              登录
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              欢迎回来，请登录您的账号
            </Text>
          </View>

          <View style={styles.form}>
            {/* 用户类型选择 */}
            <View style={styles.userTypeContainer}>
              <Text variant="titleMedium" style={styles.label}>
                选择用户类型
              </Text>
              <SegmentedButtons
                value={formData.userType}
                onValueChange={(value) => handleInputChange('userType', value)}
                buttons={[
                  {
                    value: 'patient',
                    label: '患者',
                    icon: 'account',
                  },
                  {
                    value: 'doctor',
                    label: '医生',
                    icon: 'doctor',
                  },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* 用户名输入 */}
            <View style={styles.inputContainer}>
              <TextInput
                label="用户名"
                value={formData.username}
                onChangeText={(text) => handleInputChange('username', text)}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                left={<TextInput.Icon icon="account" />}
              />
            </View>

            {/* 密码输入 */}
            <View style={styles.inputContainer}>
              <TextInput
                label="密码"
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
              title={loading ? "登录中..." : "登录"}
              onPress={handleLogin}
              disabled={loading}
              size="large"
              style={styles.loginButton}
            />

            {/* 忘记密码链接 */}
            <CustomButton
              title="忘记密码？"
              onPress={() => navigation.navigate('ForgotPassword')}
              mode="text"
              style={styles.forgotButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              还没有账号？
            </Text>
            <CustomButton
              title="立即注册"
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
});

export default LoginScreen; 