// 全局测试设置
// import 'react-native-gesture-handler/jestSetup'; // 注释掉，因为可能没有安装这个包

// 设置开发环境标志
global.__DEV__ = true;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // 保留 error 和 warn 以便调试
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Mock fetch
global.fetch = jest.fn();

// Mock FormData
global.FormData = jest.fn(() => ({
  append: jest.fn(),
}));

// Mock XMLHttpRequest
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn(),
  setRequestHeader: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(() => Promise.resolve([])),
}));

// Mock Redux store
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => {
    // 提供默认的store状态
    const mockState = {
      auth: {
        user: null,
        loading: false,
        error: null,
        isAuthenticated: false,
      },
      language: {
        currentLanguage: 'zh',
      },
      alerts: {
        alerts: [],
        loading: false,
      },
      patients: {
        patients: [],
        selectedPatient: null,
      },
      medication: {
        plans: [],
        reminders: [],
      },
    };
    return selector(mockState);
  }),
  useDispatch: jest.fn(() => jest.fn()),
  Provider: ({ children }) => children,
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      // 提供一些常用的翻译
      const translations = {
        'common.warning': '警告',
        'common.error': '错误',
        'auth.enterPhone': '请输入手机号',
        'auth.enterPassword': '请输入密码',
        'auth.login': '登录',
        'auth.loginFailed': '登录失败',
        'auth.checkCredentials': '请检查用户名和密码',
        'auth.patient': '患者',
        'auth.doctor': '医生',
        'auth.selectUserType': '选择用户类型',
        'auth.phone': '手机号',
        'auth.password': '密码',
        'auth.welcomeBack': '欢迎回来',
        'auth.loggingIn': '登录中...',
        'auth.quickTest': '快速测试',
        'auth.patientLogin': '患者登录',
        'auth.doctorLogin': '医生登录',
        'auth.forgotPassword': '忘记密码',
        'auth.noAccount': '还没有账号？',
        'auth.registerNow': '立即注册',
        'auth.phonePlaceholder': '请输入手机号',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'zh',
      changeLanguage: jest.fn(),
    },
  }),
  Trans: ({ children }) => children,
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock Expo modules
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  Circle: 'Circle',
  Line: 'Line',
  Text: 'SvgText',
}));

// Mock Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: (obj) => obj.ios || obj.default,
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock react-native-paper TextInput.Icon
jest.mock('react-native-paper', () => {
  const RNPaper = jest.requireActual('react-native-paper');
  return {
    ...RNPaper,
    TextInput: {
      ...RNPaper.TextInput,
      Icon: 'TextInputIcon',
    },
  };
});

// 清理函数
if (typeof afterEach !== 'undefined') {
  afterEach(() => {
    jest.clearAllMocks();
  });
}