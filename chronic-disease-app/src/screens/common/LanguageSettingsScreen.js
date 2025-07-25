import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  List, 
  Button, 
  RadioButton,
  Appbar,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import {
  switchLanguage,
  initializeLanguage,
  selectCurrentLanguage,
  selectSupportedLanguages,
  selectLanguageLoading,
  selectLanguageError,
  clearError
} from '../../store/slices/languageSlice';

const LanguageSettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  const currentLanguage = useSelector(selectCurrentLanguage);
  const supportedLanguages = useSelector(selectSupportedLanguages);
  const isLoading = useSelector(selectLanguageLoading);
  const error = useSelector(selectLanguageError);
  
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState(null);

  useEffect(() => {
    // 初始化语言设置
    dispatch(initializeLanguage());
  }, [dispatch]);

  useEffect(() => {
    // 同步选中的语言
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    // 处理错误
    if (error) {
      Alert.alert(t('common.error'), error, [
        { text: t('common.confirm'), onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [error, t, dispatch]);

  const handleLanguageSelect = (languageCode) => {
    if (languageCode === currentLanguage) {
      return; // 如果选择的是当前语言，不做任何操作
    }
    
    setSelectedLanguage(languageCode);
    setPendingLanguage(languageCode);
    setConfirmDialogVisible(true);
  };

  const confirmLanguageChange = async () => {
    setConfirmDialogVisible(false);
    
    if (pendingLanguage) {
      try {
        await dispatch(switchLanguage(pendingLanguage)).unwrap();
        Alert.alert(
          t('language.languageChanged'),
          t('language.restartRequired'),
          [{ text: t('common.confirm') }]
        );
      } catch (error) {
        console.error('切换语言失败:', error);
        setSelectedLanguage(currentLanguage); // 恢复之前的选择
      } finally {
        setPendingLanguage(null);
      }
    }
  };

  const cancelLanguageChange = () => {
    setConfirmDialogVisible(false);
    setSelectedLanguage(currentLanguage); // 恢复之前的选择
    setPendingLanguage(null);
  };

  const getLanguageIcon = (languageCode) => {
    switch (languageCode) {
      case 'zh':
        return 'flag';
      case 'en':
        return 'flag-outline';
      default:
        return 'language';
    }
  };

  const getLanguageFlag = (languageCode) => {
    switch (languageCode) {
      case 'zh':
        return '🇨🇳';
      case 'en':
        return '🇺🇸';
      default:
        return '🌐';
    }
  };

  const renderLanguageOption = (languageCode, languageInfo) => (
    <Card key={languageCode} style={styles.languageCard}>
      <List.Item
        title={languageInfo.nativeName}
        description={languageInfo.name}
        left={() => (
          <View style={styles.languageFlag}>
            <Text style={styles.flagEmoji}>{getLanguageFlag(languageCode)}</Text>
          </View>
        )}
        right={() => (
          <RadioButton
            value={languageCode}
            status={selectedLanguage === languageCode ? 'checked' : 'unchecked'}
            onPress={() => handleLanguageSelect(languageCode)}
            disabled={isLoading}
          />
        )}
        onPress={() => handleLanguageSelect(languageCode)}
        style={[
          styles.languageItem,
          selectedLanguage === languageCode && styles.selectedLanguageItem
        ]}
        disabled={isLoading}
      />
    </Card>
  );

  const renderCurrentLanguageInfo = () => (
    <Card style={styles.currentLanguageCard}>
      <Card.Content>
        <View style={styles.currentLanguageContent}>
          <View style={styles.currentLanguageIcon}>
            <Text style={styles.currentFlagEmoji}>
              {getLanguageFlag(currentLanguage)}
            </Text>
          </View>
          <View style={styles.currentLanguageInfo}>
            <Text variant="titleMedium" style={styles.currentLanguageTitle}>
              {t('language.currentLanguage')}
            </Text>
            <Text variant="bodyLarge" style={styles.currentLanguageName}>
              {supportedLanguages[currentLanguage]?.nativeName}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading && !currentLanguage) {
    return (
      <SafeAreaView style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={t('language.selectLanguage')} />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.languageSettings')} />
      </Appbar.Header>
      
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('language.selectLanguage')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('language.choosePreferredLanguage')}
          </Text>
        </View>

        {renderCurrentLanguageInfo()}

        <View style={styles.languagesList}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('language.availableLanguages')}
          </Text>
          
          {Object.entries(supportedLanguages).map(([code, info]) =>
            renderLanguageOption(code, info)
          )}
        </View>

        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoContent}>
              <Ionicons name="information-circle" size={24} color="#2196F3" />
              <Text variant="bodyMedium" style={styles.infoText}>
                {t('language.restartRequiredInfo')}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* 确认对话框 */}
      <Portal>
        <Dialog visible={confirmDialogVisible} onDismiss={cancelLanguageChange}>
          <Dialog.Title>{t('language.languageChanged')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              {t('language.confirmLanguageSwitch', { 
                language: supportedLanguages[pendingLanguage]?.nativeName 
              })}
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelLanguageChange}>
              {t('common.cancel')}
            </Button>
            <Button 
              mode="contained" 
              onPress={confirmLanguageChange}
              loading={isLoading}
              disabled={isLoading}
            >
              {t('common.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    lineHeight: 22,
  },
  currentLanguageCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  currentLanguageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLanguageIcon: {
    marginRight: 16,
  },
  currentFlagEmoji: {
    fontSize: 32,
  },
  currentLanguageInfo: {
    flex: 1,
  },
  currentLanguageTitle: {
    color: '#666',
    marginBottom: 4,
  },
  currentLanguageName: {
    fontWeight: 'bold',
    color: '#333',
  },
  languagesList: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  languageCard: {
    marginBottom: 8,
    elevation: 1,
  },
  languageItem: {
    paddingVertical: 8,
  },
  selectedLanguageItem: {
    backgroundColor: '#e3f2fd',
  },
  languageFlag: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  flagEmoji: {
    fontSize: 24,
  },
  infoCard: {
    margin: 16,
    backgroundColor: '#e3f2fd',
    elevation: 1,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: '#1976d2',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});

export default LanguageSettingsScreen; 