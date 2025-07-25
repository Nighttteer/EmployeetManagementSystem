import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

// 导入语言资源
import zh from '../locales/zh.json';
import en from '../locales/en.json';

// 支持的语言
const SUPPORTED_LANGUAGES = {
  zh: { name: '中文', nativeName: '中文' },
  en: { name: 'English', nativeName: 'English' }
};

// 获取设备默认语言
const getDeviceLanguage = () => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const deviceLanguage = locales[0].languageCode;
    return SUPPORTED_LANGUAGES[deviceLanguage] ? deviceLanguage : 'en';
  }
  return 'en'; // 默认英文
};

// 语言检测器
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      // 优先从AsyncStorage获取保存的语言设置
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
        callback(savedLanguage);
        return;
      }
      
      // 如果没有保存的语言设置，使用设备语言
      const deviceLanguage = getDeviceLanguage();
      callback(deviceLanguage);
    } catch (error) {
      console.warn('语言检测失败，使用默认语言', error);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (language) => {
    try {
      await AsyncStorage.setItem('app_language', language);
    } catch (error) {
      console.warn('保存语言设置失败', error);
    }
  }
};

// 初始化i18n
i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // React Native兼容性
    resources: {
      zh: { translation: zh },
      en: { translation: en }
    },
    fallbackLng: 'en', // 回退语言
    debug: __DEV__, // 开发模式下启用调试
    
    interpolation: {
      escapeValue: false, // React已经处理了XSS防护
    },
    
    // 检测选项
    detection: {
      order: ['asyncStorage', 'navigator'],
      caches: ['asyncStorage'],
    },
    
    // React相关配置
    react: {
      useSuspense: false, // React Native中禁用Suspense
    }
  });

// 切换语言的辅助函数
export const changeLanguage = async (language) => {
  if (SUPPORTED_LANGUAGES[language]) {
    try {
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('app_language', language);
      return true;
    } catch (error) {
      console.error('切换语言失败:', error);
      return false;
    }
  }
  return false;
};

// 获取当前语言
export const getCurrentLanguage = () => i18n.language;

// 获取支持的语言列表
export const getSupportedLanguages = () => SUPPORTED_LANGUAGES;

// 检查是否为RTL语言（本应用暂不支持RTL）
export const isRTL = () => false;

export default i18n; 