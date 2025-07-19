import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 患者端屏幕导入
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import HealthDataScreen from '../screens/patient/HealthDataScreen';
import MedicationScreen from '../screens/patient/MedicationScreen';
import MedicationSettingsScreen from '../screens/patient/MedicationSettingsScreen';
import MessagesScreen from '../screens/patient/MessagesScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';

// 详情页面
import DataEntryScreen from '../screens/patient/DataEntryScreen';
import HealthTrendsScreen from '../screens/patient/HealthTrendsScreen';

// 聊天相关屏幕
import ConversationListScreen from '../screens/common/ConversationListScreen';
import ChatScreen from '../screens/common/ChatScreen';
import UserSearchScreen from '../screens/common/UserSearchScreen';

// 设置相关屏幕
import EditProfileScreen from '../screens/common/EditProfileScreen';
import AboutScreen from '../screens/common/AboutScreen';
import ComingSoonScreen from '../screens/common/ComingSoonScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 健康数据堆栈导航
const HealthDataStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HealthDataMain" 
        component={HealthDataScreen}
        options={{ title: '健康数据' }}
      />
      <Stack.Screen 
        name="DataEntry" 
        component={DataEntryScreen}
        options={{ title: '录入数据' }}
      />
      <Stack.Screen 
        name="HealthTrends" 
        component={HealthTrendsScreen}
        options={{ title: '健康趋势' }}
      />
    </Stack.Navigator>
  );
};

// 消息堆栈导航
const MessagesStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ConversationList" 
        component={ConversationListScreen}
        options={{ title: '消息', headerShown: false }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: '聊天', headerShown: false }}
      />
      <Stack.Screen 
        name="UserSearch" 
        component={UserSearchScreen}
        options={{ title: '选择医生', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 设置堆栈导航
const ProfileStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: '个人中心', headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: '编辑个人信息', headerShown: false }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ title: '关于应用', headerShown: false }}
      />
      {/* 占位页面 */}
      <Stack.Screen 
        name="ChangePassword" 
        component={ComingSoonScreen}
        options={{ title: '修改密码', headerShown: false }}
        initialParams={{ title: '修改密码' }}
      />
      <Stack.Screen 
        name="PrivacySettings" 
        component={ComingSoonScreen}
        options={{ title: '隐私设置', headerShown: false }}
        initialParams={{ title: '隐私设置' }}
      />
      <Stack.Screen 
        name="LanguageSettings" 
        component={ComingSoonScreen}
        options={{ title: '语言设置', headerShown: false }}
        initialParams={{ title: '语言设置' }}
      />
      <Stack.Screen 
        name="DataSync" 
        component={ComingSoonScreen}
        options={{ title: '数据同步', headerShown: false }}
        initialParams={{ title: '数据同步' }}
      />
      <Stack.Screen 
        name="HealthGoals" 
        component={ComingSoonScreen}
        options={{ title: '健康目标', headerShown: false }}
        initialParams={{ title: '健康目标' }}
      />
      <Stack.Screen 
        name="ReminderSettings" 
        component={MedicationSettingsScreen}
        options={{ title: '用药提醒设置', headerShown: false }}
      />
      <Stack.Screen 
        name="DataExport" 
        component={ComingSoonScreen}
        options={{ title: '数据导出', headerShown: false }}
        initialParams={{ title: '数据导出' }}
      />
      <Stack.Screen 
        name="FAQ" 
        component={ComingSoonScreen}
        options={{ title: '常见问题', headerShown: false }}
        initialParams={{ title: '常见问题' }}
      />
      <Stack.Screen 
        name="Feedback" 
        component={ComingSoonScreen}
        options={{ title: '意见反馈', headerShown: false }}
        initialParams={{ title: '意见反馈' }}
      />
    </Stack.Navigator>
  );
};

const PatientNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'HealthData':
              iconName = focused ? 'fitness' : 'fitness-outline';
              break;
            case 'Medication':
              iconName = focused ? 'medical' : 'medical-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Profile':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2E86AB',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={PatientHomeScreen}
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen 
        name="HealthData" 
        component={HealthDataStack}
        options={{ tabBarLabel: '健康数据' }}
      />
      <Tab.Screen 
        name="Medication" 
        component={MedicationScreen}
        options={{ tabBarLabel: '用药提醒' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStack}
        options={{ tabBarLabel: '消息' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ tabBarLabel: '设置' }}
      />
    </Tab.Navigator>
  );
};

export default PatientNavigator; 