import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import CustomButton from '../../components/CustomButton';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo 区域 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>{t('welcome.appShortName')}</Text>
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            {t('welcome.appTitle')}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {t('welcome.appSubtitle')}
          </Text>
        </View>

        {/* 特性介绍 */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>{t('welcome.healthDataRecording')}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>💊</Text>
            <Text style={styles.featureText}>{t('welcome.medicationReminder')}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👨‍⚕️</Text>
            <Text style={styles.featureText}>{t('welcome.doctorGuidance')}</Text>
          </View>
        </View>

        {/* 按钮区域 */}
        <View style={styles.buttonContainer}>
          <CustomButton
            title={t('auth.login')}
            onPress={() => navigation.navigate('Login')}
            size="large"
            style={styles.loginButton}
          />
          <CustomButton
            title={t('welcome.registerAccount')}
            onPress={() => navigation.navigate('Register')}
            mode="outlined"
            size="large"
            style={styles.registerButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.1,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2E86AB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 26,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 48,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  loginButton: {
    marginBottom: 16,
  },
  registerButton: {
    marginBottom: 16,
  },
});

export default WelcomeScreen; 