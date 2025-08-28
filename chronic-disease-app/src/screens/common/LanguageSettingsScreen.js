/**
 * 语言设置页面组件
 * 
 * 功能特性：
 * - 支持多语言切换（中文、英文）
 * - 显示当前语言信息
 * - 语言切换确认对话框
 * - 语言图标和国旗显示
 * - 与Redux状态同步管理
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

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

/**
 * 语言设置页面主组件
 * 
 * 主要功能：
 * - 初始化语言设置
 * - 显示支持的语言列表
 * - 处理语言切换操作
 * - 显示语言切换确认对话框
 * - 错误处理和用户提示
 * 
 * @param {Object} navigation - 导航对象，用于页面返回
 * @returns {JSX.Element} 语言设置页面组件
 */
const LanguageSettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  
  // 从Redux store获取语言相关状态
  const currentLanguage = useSelector(selectCurrentLanguage);           // 当前选中的语言
  const supportedLanguages = useSelector(selectSupportedLanguages);     // 支持的语言列表
  const isLoading = useSelector(selectLanguageLoading);                 // 加载状态
  const error = useSelector(selectLanguageError);                       // 错误信息
  
  // 本地状态管理
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);  // 当前选中的语言
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);    // 确认对话框显示状态
  const [pendingLanguage, setPendingLanguage] = useState(null);               // 待确认的语言

  /**
   * 组件挂载时初始化语言设置
   * 从本地存储或默认设置加载语言配置
   */
  useEffect(() => {
    dispatch(initializeLanguage());
  }, [dispatch]);

  /**
   * 同步当前语言状态
   * 当Redux store中的语言状态变化时，更新本地状态
   */
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  /**
   * 处理语言切换错误
   * 显示错误提示并清除错误状态
   */
  useEffect(() => {
    if (error) {
      Alert.alert(t('common.error'), error, [
        { text: t('common.confirm'), onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [error, t, dispatch]);

  /**
   * 处理语言选择
   * 如果选择的是当前语言则不做操作，否则显示确认对话框
   * 
   * @param {string} languageCode - 选中的语言代码
   */
  const handleLanguageSelect = (languageCode) => {
    if (languageCode === currentLanguage) {
      return; // 如果选择的是当前语言，不做任何操作
    }
    
    setSelectedLanguage(languageCode);
    setPendingLanguage(languageCode);
    setConfirmDialogVisible(true);
  };

  /**
   * 确认语言切换
   * 调用Redux action切换语言，显示重启提示
   */
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

  /**
   * 取消语言切换
   * 关闭确认对话框，恢复之前选择的语言
   */
  const cancelLanguageChange = () => {
    setConfirmDialogVisible(false);
    setSelectedLanguage(currentLanguage); // 恢复之前的选择
    setPendingLanguage(null);
  };

  /**
   * 获取语言对应的图标名称
   * 
   * @param {string} languageCode - 语言代码
   * @returns {string} 图标名称
   */
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

  /**
   * 获取语言对应的国旗表情符号
   * 
   * @param {string} languageCode - 语言代码
   * @returns {string} 国旗表情符号
   */
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

  /**
   * 渲染单个语言选项
   * 显示语言名称、描述、国旗和选择状态
   * 
   * @param {string} languageCode - 语言代码
   * @param {Object} languageInfo - 语言信息对象
   * @returns {JSX.Element} 语言选项组件
   */
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

  /**
   * 渲染当前语言信息卡片
   * 显示当前选中的语言和国旗
   * 
   * @returns {JSX.Element} 当前语言信息卡片
   */
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

  // 加载状态显示
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
      {/* 页面头部导航栏 */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.languageSettings')} />
      </Appbar.Header>
      
      <ScrollView style={styles.content}>
        {/* 页面标题和说明 */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            {t('language.selectLanguage')}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t('language.choosePreferredLanguage')}
          </Text>
        </View>

        {/* 当前语言信息 */}
        {renderCurrentLanguageInfo()}

        {/* 可选语言列表 */}
        <View style={styles.languagesList}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('language.availableLanguages')}
          </Text>
          
          {Object.entries(supportedLanguages).map(([code, info]) =>
            renderLanguageOption(code, info)
          )}
        </View>

        {/* 语言切换说明信息 */}
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

      {/* 语言切换确认对话框 */}
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

/**
 * 样式定义
 * 包含语言设置页面的所有UI样式，按功能模块分组
 * 
 * 主要样式组：
 * - 容器和布局样式
 * - 头部样式
 * - 当前语言卡片样式
 * - 语言选项样式
 * - 信息卡片样式
 * - 加载状态样式
 */
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

/**
 * 导出语言设置页面组件
 * 作为默认导出，供其他模块使用
 */
export default LanguageSettingsScreen; 