import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language resources
import zh from '../locales/zh.json';
import en from '../locales/en.json';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // React Native兼容性
    resources: {
      zh: { translation: zh },
      en: { translation: en }
    },
    lng: 'en', // Default language
    fallbackLng: 'zh', // Fallback language
    debug: false, // Disable debug
    
    interpolation: {
      escapeValue: false, // React already handles XSS protection
    },
    
    // React configuration
    react: {
      useSuspense: false, // Disable Suspense in React Native
    },
    
    // Simplified missing key handling
    missingKeyHandler: (lng, ns, key, res) => {
      // Silent handling, no logging
      return key;
    },
    
    // Fast initialization
    initImmediate: true,
    
    // Remove complex callbacks
    loaded: (loaded) => {
      console.log('✅ Internationalization resources loaded');
    }
  });

// Simplified language switching function
export const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.error('Language switching failed:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = () => i18n.language;

// Get supported languages list
export const getSupportedLanguages = () => ({
  zh: { name: '中文', nativeName: '中文' },
  en: { name: 'English', nativeName: 'English' }
});

export default i18n; 