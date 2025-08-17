import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言资源
import zh from '../locales/zh.json';
import en from '../locales/en.json';

// 验证JSON语法
try {
  // 尝试解析JSON，如果有语法错误会抛出异常
  JSON.parse(JSON.stringify(zh));
  JSON.parse(JSON.stringify(en));
  console.log('✅ JSON语法验证通过');
} catch (error) {
  console.error('❌ JSON语法错误:', error);
}

// 验证资源是否正确加载
console.log('📚 资源加载验证:');
console.log('  中文资源:', typeof zh, Object.keys(zh).length);
console.log('  英文资源:', typeof en, Object.keys(en).length);
console.log('  中文doctor命名空间:', zh.doctor ? Object.keys(zh.doctor) : '未找到');
console.log('  中文common命名空间:', zh.common ? Object.keys(zh.common) : '未找到');
console.log('  中文health命名空间:', zh.health ? Object.keys(zh.health) : '未找到');

// 初始化i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // React Native兼容性
    resources: {
      zh: { translation: zh },
      en: { translation: en }
    },
    lng: 'en', // 默认使用英文
    fallbackLng: 'en', // 回退语言
    debug: false, // 关闭调试，减少日志
    
    interpolation: {
      escapeValue: false, // React已经处理了XSS防护
    },
    
    // React相关配置
    react: {
      useSuspense: false, // React Native中禁用Suspense
    },
    
    // 添加缺失键的处理
    missingKeyHandler: (lng, ns, key, res) => {
      console.log(`🔍 缺失键: ${lng}.${ns}.${key}`);
      
      // 尝试从当前语言资源获取
      const currentLang = lng === 'zh' ? zh : en;
      const keys = key.split('.');
      let current = currentLang;
      
      // 逐层查找嵌套键值
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          console.log(`❌ 在路径 ${keys.slice(0, keys.indexOf(k) + 1).join('.')} 中找不到键 ${k}`);
          break;
        }
      }
      
      if (current && typeof current === 'string') {
        console.log(`✅ 找到翻译: ${key} = ${current}`);
        return current;
      }
      
      // 如果当前语言没有找到，尝试从回退语言获取
      const fallbackLang = lng === 'zh' ? en : zh;
      current = fallbackLang;
      
      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          break;
        }
      }
      
      if (current && typeof current === 'string') {
        console.log(`✅ 从回退语言找到翻译: ${key} = ${current}`);
        return current;
      }
      
      // 如果所有尝试都失败，返回一个友好的默认消息而不是键名
      console.log(`❌ 无法找到键值: ${key}`);
      if (lng === 'zh') {
        return '翻译缺失';
      } else {
        return 'Translation Missing';
      }
    },
    
    // 添加键存在性检查
    keySeparator: '.',
    nsSeparator: ':',
    
    // 添加资源加载完成回调
    initImmediate: false,
    
    // 添加语言切换回调
    languageChanged: (lng) => {
      console.log(`🌍 语言已切换到: ${lng}`);
    },
    
    // 添加资源加载回调
    loaded: (loaded) => {
      console.log('📚 翻译资源加载完成:', Object.keys(loaded));
      console.log('📚 中文资源键数量:', Object.keys(zh).length);
      console.log('📚 英文资源键数量:', Object.keys(en).length);
      
      // 验证关键键是否存在
      console.log('🔍 验证关键键:');
      console.log('  doctor.diseaseDistribution:', zh.doctor?.diseaseDistribution);
      console.log('  common.patients:', zh.common?.patients);
      console.log('  common.highAttention:', zh.common?.highAttention);
      console.log('  common.normal:', zh.common?.normal);
      console.log('  health.healthSummary:', zh.health?.healthSummary);
      console.log('  health.totalRecords:', zh.health?.totalRecords);
      
      // 测试国际化系统是否正常工作
      console.log('🧪 测试国际化系统:');
      console.log('  doctor.diseaseDistribution:', i18n.t('doctor.diseaseDistribution'));
      console.log('  common.normal:', i18n.t('common.normal'));
      console.log('  health.healthSummary:', i18n.t('health.healthSummary'));
      
      // 直接测试嵌套键值查找
      console.log('🔍 直接测试嵌套键值:');
      const testKeys = [
        'health.charts',
        'health.noDataForCharts', 
        'health.addData',
        'health.thisWeek',
        'health.thisMonth',
        'health.thisQuarter',
        'health.thisYear',
        'health.healthData',
        'health.healthSummary',
        'health.totalRecords',
        'health.thisWeekRecords',
        'health.overallStatus',
        'health.lastMeasurement',
        'health.weeklyStats'
      ];
      
      testKeys.forEach(key => {
        const keys = key.split('.');
        let current = zh;
        let found = true;
        
        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) {
            current = current[k];
          } else {
            found = false;
            break;
          }
        }
        
        if (found && typeof current === 'string') {
          console.log(`  ✅ ${key}: ${current}`);
        } else {
          console.log(`  ❌ ${key}: 未找到`);
        }
      });
    },
    
    // 添加错误回调
    failedLoading: (lng, ns, msg) => {
      console.error(`❌ 翻译资源加载失败: ${lng}.${ns} - ${msg}`);
    }
  });

// 测试国际化系统是否正常工作
export const testI18n = () => {
  console.log('🧪 测试国际化系统...');
  console.log('🌍 当前语言:', i18n.language);
  console.log('🌍 可用语言:', i18n.languages);
  console.log('🌍 资源:', Object.keys(i18n.options.resources));
  
  // 测试关键键值
  const testKeys = [
    'doctor.diseaseDistribution',
    'common.patients',
    'common.highAttention',
    'common.normal'
  ];
  
  testKeys.forEach(key => {
    const result = i18n.t(key);
    console.log(`🔍 ${key}: ${result}`);
  });
  
  return true;
};

// 在初始化完成后运行测试
setTimeout(() => {
  testI18n();
}, 1000);

// 切换语言的辅助函数
export const changeLanguage = async (language) => {
  try {
    console.log(`🔄 正在切换语言到: ${language}`);
    
    // 验证语言是否支持
    if (!['zh', 'en'].includes(language)) {
      throw new Error(`不支持的语言: ${language}`);
    }
    
    // 验证翻译资源是否存在
    const resources = i18n.options.resources[language];
    if (!resources || !resources.translation) {
      throw new Error(`语言 ${language} 的翻译资源不存在`);
    }
    
    await i18n.changeLanguage(language);
    console.log(`✅ 语言切换成功: ${language}`);
    return true;
  } catch (error) {
    console.error('❌ 切换语言失败:', error);
    return false;
  }
};

// 获取当前语言
export const getCurrentLanguage = () => {
  const currentLang = i18n.language;
  console.log(`🌍 当前语言: ${currentLang}`);
  return currentLang;
};

// 获取支持的语言列表
export const getSupportedLanguages = () => ({
  zh: { name: '中文', nativeName: '中文' },
  en: { name: 'English', nativeName: 'English' }
});

// 验证翻译键是否存在
export const hasTranslationKey = (key, language = null) => {
  const lang = language || i18n.language;
  const resources = i18n.options.resources[lang];
  
  if (!resources || !resources.translation) {
    console.warn(`⚠️ 语言 ${lang} 的翻译资源不存在`);
    return false;
  }
  
  // 递归检查键是否存在
  const keys = key.split('.');
  let current = resources.translation;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      console.warn(`⚠️ 翻译键不存在: ${lang}.${key}`);
      return false;
    }
  }
  
  return true;
};

// 获取翻译键的值
export const getTranslationValue = (key, language = null) => {
  const lang = language || i18n.language;
  const resources = i18n.options.resources[lang];
  
  if (!resources || !resources.translation) {
    return null;
  }
  
  const keys = key.split('.');
  let current = resources.translation;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      return null;
    }
  }
  
  return current;
};

// 调试函数：列出所有可用的翻译键
export const listAvailableKeys = (language = null) => {
  const lang = language || i18n.language;
  const resources = i18n.options.resources[lang];
  
  if (!resources || !resources.translation) {
    console.warn(`⚠️ 语言 ${lang} 的翻译资源不存在`);
    return [];
  }
  
  const keys = [];
  const traverse = (obj, prefix = '') => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          traverse(obj[key], fullKey);
        } else {
          keys.push(fullKey);
        }
      }
    }
  };
  
  traverse(resources.translation);
  return keys;
};

export default i18n; 