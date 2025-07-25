import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { store } from './src/store/store';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/notifications';
import './src/config/i18n'; // 初始化国际化

// 自定义主题
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E86AB',
    secondary: '#A23B72',
    surface: '#ffffff',
    background: '#f8f9fa',
    onBackground: '#333333',
    onSurface: '#333333',
  },
  roundness: 12,
};

export default function App() {
  useEffect(() => {
    // 初始化推送通知服务
    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
      } catch (error) {
        console.error('推送通知初始化失败:', error);
      }
    };

    initializeNotifications();

    // 清理函数
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PaperProvider theme={theme}>
          <StatusBar style="auto" />
          <AppNavigator />
        </PaperProvider>
      </ReduxProvider>
    </SafeAreaProvider>
  );
}
