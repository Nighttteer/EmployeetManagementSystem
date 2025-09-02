import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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
import LanguageSettingsScreen from '../screens/common/LanguageSettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 健康数据堆栈导航
const HealthDataStack = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HealthDataMain" 
        component={HealthDataScreen}
        options={{ title: t('navigation.healthData') }}
      />
      <Stack.Screen 
        name="DataEntry" 
        component={DataEntryScreen}
        options={{ title: t('health.dataEntry') }}
      />
      <Stack.Screen 
        name="HealthTrends" 
        component={HealthTrendsScreen}
        options={{ title: t('health.trends') }}
      />
    </Stack.Navigator>
  );
};

// 消息堆栈导航
const MessagesStack = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ConversationList" 
        component={ConversationListScreen}
        options={{ title: t('navigation.messages'), headerShown: false }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: t('chat.chat'), headerShown: false }}
      />
      <Stack.Screen 
        name="UserSearch" 
        component={UserSearchScreen}
        options={{ title: t('chat.selectDoctor'), headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 设置堆栈导航
const ProfileStack = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: t('navigation.profile'), headerShown: false }}
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen}
        options={{ title: t('settings.editProfile'), headerShown: false }}
      />
      <Stack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ title: t('settings.about'), headerShown: false }}
      />
      {/* 占位页面 */}
      <Stack.Screen 
        name="ChangePassword" 
        component={ComingSoonScreen}
        options={{ title: t('settings.changePassword'), headerShown: false }}
        initialParams={{ title: t('settings.changePassword') }}
      />
      <Stack.Screen 
        name="PrivacySettings" 
        component={ComingSoonScreen}
        options={{ title: t('settings.privacySettings'), headerShown: false }}
        initialParams={{ title: t('settings.privacySettings') }}
      />
      <Stack.Screen 
        name="LanguageSettings" 
        component={LanguageSettingsScreen}
        options={{ title: t('settings.languageSettings'), headerShown: false }}
      />

      <Stack.Screen 
        name="HealthGoals" 
        component={ComingSoonScreen}
        options={{ title: t('health.healthGoals'), headerShown: false }}
        initialParams={{ title: t('health.healthGoals') }}
      />
      <Stack.Screen 
        name="ReminderSettings" 
        component={MedicationSettingsScreen}
        options={{ title: t('medication.medicationSettings'), headerShown: false }}
      />
      <Stack.Screen 
        name="DataExport" 
        component={ComingSoonScreen}
        options={{ title: t('health.dataExport'), headerShown: false }}
        initialParams={{ title: t('health.dataExport') }}
      />
      <Stack.Screen 
        name="FAQ" 
        component={ComingSoonScreen}
        options={{ title: t('settings.faq'), headerShown: false }}
        initialParams={{ title: t('settings.faq') }}
      />
      <Stack.Screen 
        name="Feedback" 
        component={ComingSoonScreen}
        options={{ title: t('settings.feedback'), headerShown: false }}
        initialParams={{ title: t('settings.feedback') }}
      />
    </Stack.Navigator>
  );
};

const PatientNavigator = () => {
  const { t } = useTranslation();
  
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
        options={{ tabBarLabel: t('navigation.home') }}
      />
      <Tab.Screen 
        name="HealthData" 
        component={HealthDataStack}
        options={{ tabBarLabel: t('navigation.healthData') }}
      />
      <Tab.Screen 
        name="Medication" 
        component={MedicationScreen}
        options={{ tabBarLabel: t('navigation.medication') }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesStack}
        options={{ tabBarLabel: t('navigation.messages') }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ tabBarLabel: t('navigation.settings') }}
      />
    </Tab.Navigator>
  );
};

export default PatientNavigator; 