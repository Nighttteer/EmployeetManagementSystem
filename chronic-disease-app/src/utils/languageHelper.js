import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../config/i18n';

/**
 * 快速切换到英文
 */
export const switchToEnglish = async () => {
  try {
    await i18n.changeLanguage('en');
    await AsyncStorage.setItem('app_language', 'en');
    console.log('✅ 已切换到英文');
    return true;
  } catch (error) {
    console.error('❌ 切换到英文失败:', error);
    return false;
  }
};

/**
 * 快速切换到中文
 */
export const switchToChinese = async () => {
  try {
    await i18n.changeLanguage('zh');
    await AsyncStorage.setItem('app_language', 'zh');
    console.log('✅ 已切换到中文');
    return true;
  } catch (error) {
    console.error('❌ 切换到中文失败:', error);
    return false;
  }
};

/**
 * 获取当前语言
 */
export const getCurrentLanguage = () => {
  return i18n.language;
};

/**
 * 清除保存的语言设置（将使用默认英文）
 */
export const clearLanguagePreference = async () => {
  try {
    await AsyncStorage.removeItem('app_language');
    await i18n.changeLanguage('en');
    console.log('✅ 已清除语言偏好设置，使用默认英文');
    return true;
  } catch (error) {
    console.error('❌ 清除语言偏好设置失败:', error);
    return false;
  }
};

/**
 * 检查翻译键是否存在
 */
export const checkTranslationKey = (key, language = null) => {
  const lang = language || i18n.language;
  return i18n.exists(key, { lng: lang });
};

/**
 * 强制刷新翻译
 */
export const refreshTranslations = async () => {
  try {
    await i18n.reloadResources();
    console.log('✅ 翻译资源已刷新');
    return true;
  } catch (error) {
    console.error('❌ 刷新翻译资源失败:', error);
    return false;
  }
};
