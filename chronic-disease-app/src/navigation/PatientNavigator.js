import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 患者端屏幕导入
import PatientHomeScreen from '../screens/patient/PatientHomeScreen';
import HealthDataScreen from '../screens/patient/HealthDataScreen';
import MedicationScreen from '../screens/patient/MedicationScreen';
import MessagesScreen from '../screens/patient/MessagesScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';

// 详情页面
import DataEntryScreen from '../screens/patient/DataEntryScreen';
import HealthTrendsScreen from '../screens/patient/HealthTrendsScreen';
import ChatScreen from '../screens/patient/ChatScreen';

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
        name="MessagesMain" 
        component={MessagesScreen}
        options={{ title: '消息' }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: '与医生对话' }}
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
        component={ProfileScreen}
        options={{ tabBarLabel: '个人档案' }}
      />
    </Tab.Navigator>
  );
};

export default PatientNavigator; 