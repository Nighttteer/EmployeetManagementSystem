import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 医生端屏幕导入
import PatientsListScreen from '../screens/doctor/PatientsListScreen';
import AlertsScreen from '../screens/doctor/AlertsScreen';
import DoctorMessagesScreen from '../screens/doctor/DoctorMessagesScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';

// 详情页面
import PatientDetailsScreen from '../screens/doctor/PatientDetailsScreen';
import AlertDetailsScreen from '../screens/doctor/AlertDetailsScreen';
import MedicationPlanScreen from '../screens/doctor/MedicationPlanScreen';
import AddPatientScreen from '../screens/doctor/AddPatientScreen';

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

// 患者管理堆栈导航
const PatientsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PatientsListMain" 
        component={PatientsListScreen}
        options={{ title: '患者列表' }}
      />
      <Stack.Screen 
        name="AddPatient" 
        component={AddPatientScreen}
        options={{ title: '添加患者', headerShown: false }}
      />
      <Stack.Screen 
        name="PatientDetails" 
        component={PatientDetailsScreen}
        options={{ title: '患者详情' }}
      />
      <Stack.Screen 
        name="MedicationPlan" 
        component={MedicationPlanScreen}
        options={{ title: '用药计划' }}
      />
    </Stack.Navigator>
  );
};

// 告警堆栈导航
const AlertsStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AlertsMain" 
        component={AlertsScreen}
        options={{ title: '告警中心' }}
      />
      <Stack.Screen 
        name="AlertDetails" 
        component={AlertDetailsScreen}
        options={{ title: '告警详情' }}
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
        options={{ title: '选择患者', headerShown: false }}
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
        component={DoctorProfileScreen}
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
        name="MedicalInfo" 
        component={ComingSoonScreen}
        options={{ title: '执业信息', headerShown: false }}
        initialParams={{ title: '执业信息' }}
      />
      <Stack.Screen 
        name="WorkingHours" 
        component={ComingSoonScreen}
        options={{ title: '工作时间', headerShown: false }}
        initialParams={{ title: '工作时间' }}
      />
      <Stack.Screen 
        name="AlertSettings" 
        component={ComingSoonScreen}
        options={{ title: '告警设置', headerShown: false }}
        initialParams={{ title: '告警设置' }}
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

const DoctorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Patients':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'warning' : 'warning-outline';
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
        name="Patients" 
        component={PatientsStack}
        options={{ tabBarLabel: '患者' }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsStack}
        options={{ 
          tabBarLabel: '告警',
          // 可以在这里显示未处理告警数量的徽章
        }}
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

export default DoctorNavigator; 