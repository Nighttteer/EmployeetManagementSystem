import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Switch, Platform } from 'react-native';
import { 
  Text, 
  Avatar, 
  Card, 
  List, 
  Button, 
  Divider,
  Dialog,
  Portal,
  Paragraph,
  IconButton,
  Surface,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { logoutUser } from '../../store/slices/authSlice';

const SettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, role } = useSelector((state) => state.auth);
  
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // 监听用户信息变化，确保界面能正确更新
  useEffect(() => {
    console.log('SettingsScreen 用户信息更新:', user);
    console.log('SettingsScreen 用户姓名:', user?.name);
    console.log('SettingsScreen 用户姓:', user?.first_name);
    console.log('SettingsScreen 用户名:', user?.last_name);
    // 强制重新渲染
    setRefreshKey(prev => prev + 1);
  }, [user]);

  // 监听导航焦点变化，确保从编辑页面返回时能更新
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('SettingsScreen 获得焦点，检查用户信息更新');
      setRefreshKey(prev => prev + 1);
    });

    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  const confirmLogout = () => {
    dispatch(logoutUser());
    setLogoutDialogVisible(false);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'patient':
        return t('auth.patient');
      case 'doctor':
        return t('auth.doctor');
      default:
        return 'User';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 用户信息卡片 */}
        <Card style={styles.userCard}>
          <Card.Content style={styles.userInfo}>
            <Avatar.Text 
              size={80} 
              label={getInitials(`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name)}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text variant="headlineSmall" style={styles.userName}>
                {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || '用户'}
              </Text>
              <Text variant="bodyMedium" style={styles.userRole}>
                {getRoleDisplayName(role)}
              </Text>
              <Text variant="bodySmall" style={styles.userPhone}>
                {user?.phone}
              </Text>

            </View>
            <IconButton 
              icon="pencil" 
              size={24}
              onPress={() => navigation.navigate('EditProfile')}
            />
          </Card.Content>
        </Card>

        {/* 个人设置 */}
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.personalSettings')}
          </Text>
          
          <List.Item
            title={t('settings.editProfile')}
            description={t('settings.editProfileDesc')}
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          
          <Divider />
          
          <List.Item
            title={t('settings.changePassword')}
            description={t('settings.changePasswordDesc')}
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          
          <Divider />
          
          <List.Item
            title={t('settings.privacySettings')}
            description={t('settings.privacySettingsDesc')}
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PrivacySettings')}
          />
        </Surface>

        {/* 应用设置 */}
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.appSettings')}
          </Text>
          
          <List.Item
            title={t('settings.notifications')}
            description={t('settings.notificationsDesc')}
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                color={theme.colors.primary}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title={t('settings.languageSettings')}
            description={t('settings.languageSettingsDesc')}
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('LanguageSettings')}
          />
          
          <Divider />
          
        </Surface>

        {/* 健康设置 (仅患者显示) */}
        {role === 'patient' && (
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.healthSettings')}
            </Text>
            
            <List.Item
              title={t('settings.healthGoals')}
              description={t('settings.healthGoalsDesc')}
              left={(props) => <List.Icon {...props} icon="target" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('HealthGoals')}
            />
            
            <Divider />
            
            <List.Item
              title={t('settings.reminderSettings')}
              description={t('settings.reminderSettingsDesc')}
              left={(props) => <List.Icon {...props} icon="alarm" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('ReminderSettings')}
            />
            
            <Divider />
            
                      <List.Item
            title={t('health.dataExport')}
            description={t('settings.dataExportDesc')}
              left={(props) => <List.Icon {...props} icon="download" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('DataExport')}
            />
          </Surface>
        )}

        {/* 医生设置 (仅医生显示) */}
        {role === 'doctor' && (
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.doctorSettings')}
            </Text>
            
                      <List.Item
            title={t('settings.medicalInfo')}
            description={t('settings.medicalInfoDesc')}
              left={(props) => <List.Icon {...props} icon="medical-bag" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('MedicalInfo')}
            />
            
            <Divider />
            
            <List.Item
              title={t('doctor.workingHours')}
              description={t('doctor.workingHoursDesc')}
              left={(props) => <List.Icon {...props} icon="clock" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('WorkingHours')}
            />
            

          </Surface>
        )}

        {/* 帮助和反馈 */}
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('settings.helpAndFeedback')}
          </Text>
          
          <List.Item
            title={t('settings.faq')}
            description={t('settings.faqDesc')}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('FAQ')}
          />
          
          <Divider />
          
          <List.Item
            title={t('settings.feedback')}
            description={t('settings.feedbackDesc')}
            left={(props) => <List.Icon {...props} icon="message-text" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Feedback')}
          />
          
          <Divider />
          
          <List.Item
            title={t('settings.about')}
            description={t('settings.aboutDesc')}
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('About')}
          />
        </Surface>

        {/* 退出登录按钮 */}
        <View style={styles.logoutContainer}>
          <Button 
            mode="contained" 
            onPress={handleLogout}
            icon="logout"
            style={styles.logoutButton}
            buttonColor={theme.colors.error}
          >
            {t('auth.logout')}
          </Button>
        </View>
      </ScrollView>

      {/* 退出登录确认对话框 */}
      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
          <Dialog.Title>{t('settings.confirmLogout')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{t('settings.confirmLogoutMessage')}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>{t('common.cancel')}</Button>
            <Button onPress={confirmLogout} mode="contained" buttonColor={theme.colors.error}>
              {t('common.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
    margin: 16,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    color: '#999',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    padding: 16,
    paddingBottom: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    marginTop: 16,
  },
});

export default SettingsScreen; 