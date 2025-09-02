import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';

import { checkAuthToken } from '../store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import PatientNavigator from './PatientNavigator';
import DoctorNavigator from './DoctorNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, role, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    // 应用启动时检查是否有有效的认证token
    dispatch(checkAuthToken());
  }, [dispatch]);

  // 显示加载屏幕
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // 未认证用户显示登录/注册流程
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          // 已认证用户根据角色显示相应导航
          <>
            {role === 'patient' ? (
              <Stack.Screen name="PatientApp" component={PatientNavigator} />
            ) : role === 'doctor' ? (
              <Stack.Screen name="DoctorApp" component={DoctorNavigator} />
            ) : (
              // 角色未知时显示登录页面
              <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 