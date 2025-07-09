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
import ChatScreen from '../screens/doctor/ChatScreen';
import MedicationPlanScreen from '../screens/doctor/MedicationPlanScreen';

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
        name="DoctorMessagesMain" 
        component={DoctorMessagesScreen}
        options={{ title: '消息' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: '与患者对话' }}
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
              iconName = focused ? 'person' : 'person-outline';
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
        component={DoctorProfileScreen}
        options={{ tabBarLabel: '个人中心' }}
      />
    </Tab.Navigator>
  );
};

export default DoctorNavigator; 