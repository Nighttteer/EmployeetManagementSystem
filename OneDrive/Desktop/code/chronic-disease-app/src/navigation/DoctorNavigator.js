import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// 医生端屏幕导入
import DashboardScreen from '../screens/doctor/DashboardScreen';
import PatientsListScreen from '../screens/doctor/PatientsListScreen';
import AlertsScreen from '../screens/doctor/AlertsScreen';
import DoctorMessagesScreen from '../screens/doctor/DoctorMessagesScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';

// 详情页面
import PatientDetailsScreen from '../screens/doctor/PatientDetailsScreen';
import AlertDetailsScreen from '../screens/doctor/AlertDetailsScreen';
import MedicationPlanScreen from '../screens/doctor/MedicationPlanScreen';
import AddMedicationScreen from '../screens/doctor/AddMedicationScreen';
import AddPatientScreen from '../screens/doctor/AddPatientScreen';
import DiseaseDistributionScreen from '../screens/doctor/DiseaseDistributionScreen';

// 聊天相关屏幕
import ConversationListScreen from '../screens/common/ConversationListScreen';
import ChatScreen from '../screens/common/ChatScreen';
import UserSearchScreen from '../screens/common/UserSearchScreen';

// 设置相关屏幕
import EditProfileScreen from '../screens/common/EditProfileScreen';
import AboutScreen from '../screens/common/AboutScreen';
import ComingSoonScreen from '../screens/common/ComingSoonScreen';
import LanguageSettingsScreen from '../screens/common/LanguageSettingsScreen';
import EditPatientScreen from '../screens/doctor/EditPatientScreen';
import MedicalInfoScreen from '../screens/doctor/MedicalInfoScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 仪表板堆栈导航
const DashboardStack = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="DashboardMain" 
        component={DashboardScreen}
        options={{ title: t('navigation.dashboard'), headerShown: false }}
      />
      <Stack.Screen 
        name="DiseaseDistribution" 
        component={DiseaseDistributionScreen}
        options={{ title: t('doctor.diseaseDistribution'), headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 患者管理堆栈导航
const PatientsStack = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PatientsListMain" 
        component={PatientsListScreen}
        options={{ title: t('patients.patientList'), headerShown: false }}
      />
      {/* 路由别名：病人管理 */}
      <Stack.Screen 
        name="PatientManagement" 
        component={PatientsListScreen}
        options={{ title: t('patients.patientList'), headerShown: false }}
      />
      <Stack.Screen 
        name="AddPatient" 
        component={AddPatientScreen}
        options={{ title: t('patients.addPatient'), headerShown: false }}
      />
      <Stack.Screen 
        name="PatientDetails" 
        component={PatientDetailsScreen}
        options={{ title: t('patients.patientDetails'), headerShown: false }}
      />
      <Stack.Screen 
        name="EditPatient" 
        component={EditPatientScreen}
        options={{ title: t('screen.editPatientInfo'), headerShown: false }}
      />
      <Stack.Screen 
        name="MedicationPlan" 
        component={MedicationPlanScreen}
        options={{ title: t('medication.medicationPlan') }}
      />
      <Stack.Screen 
        name="AddMedication" 
        component={AddMedicationScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// 告警堆栈导航
const AlertsStack = () => {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AlertsMain" 
        component={AlertsScreen}
        options={{ title: t('navigation.alerts'), headerShown: false }}
      />
      <Stack.Screen 
        name="AlertDetails" 
        component={AlertDetailsScreen}
        options={{ title: t('doctor.alertDetails') }}
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
        options={{ title: t('chat.selectPatient'), headerShown: false }}
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
        component={DoctorProfileScreen}
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
        name="MedicalInfo" 
        component={MedicalInfoScreen}
        options={{ title: t('doctor.medicalInfo'), headerShown: false }}
        initialParams={{ title: t('doctor.medicalInfo') }}
      />
      <Stack.Screen 
        name="WorkingHours" 
        component={ComingSoonScreen}
        options={{ title: t('doctor.workingHours'), headerShown: false }}
        initialParams={{ title: t('doctor.workingHours') }}
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

const DoctorNavigator = () => {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
                              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
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
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack}
        options={{ tabBarLabel: t('navigation.dashboard') }}
      />
      <Tab.Screen 
        name="Patients" 
        component={PatientsStack}
        options={{ tabBarLabel: t('navigation.patients') }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsStack}
        options={{ 
          tabBarLabel: t('navigation.alerts'),
          // 可以在这里显示未处理告警数量的徽章
        }}
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

export default DoctorNavigator; 