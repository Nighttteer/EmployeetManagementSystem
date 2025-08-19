import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言资源
import zh from '../locales/zh.json';
import en from '../locales/en.json';

// 初始化i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // React Native兼容性
    resources: {
      zh: { translation: zh },
      en: { translation: en }
    },
    lng: 'zh', // 默认使用中文
    fallbackLng: 'en', // 回退语言
    debug: false, // 关闭调试
    
    interpolation: {
      escapeValue: false, // React已经处理了XSS防护
    },
    
    // React相关配置
    react: {
      useSuspense: false, // React Native中禁用Suspense
    },
    
    // 简化缺失键的处理
    missingKeyHandler: (lng, ns, key, res) => {
      // 静默处理，不输出日志
      return key;
    },
    
    // 快速初始化
    initImmediate: true,
    
    // 移除复杂的回调
    loaded: (loaded) => {
      console.log('✅ 国际化资源加载完成');
    }
  });

// 简化的语言切换函数
export const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.error('语言切换失败:', error);
    return false;
  }
};

// 获取当前语言
export const getCurrentLanguage = () => i18n.language;

// 获取支持的语言列表
export const getSupportedLanguages = () => ({
  zh: { name: '中文', nativeName: '中文' },
  en: { name: 'English', nativeName: 'English' }
});

export default i18n; 