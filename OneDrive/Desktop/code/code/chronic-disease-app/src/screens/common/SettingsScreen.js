/**
 * 设置页面组件
 * 
 * 功能特性：
 * - 显示用户基本信息（头像、姓名、角色、电话）
 * - 个人设置管理（编辑资料、修改密码、隐私设置）
 * - 应用设置（通知、语言设置）
 * - 角色特定设置（患者健康设置、医生工作设置）
 * - 帮助和反馈功能
 * - 退出登录功能
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

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

/**
 * 设置页面主组件
 * 
 * 主要功能：
 * - 展示用户个人信息和头像
 * - 提供各种设置选项的导航
 * - 根据用户角色显示不同的设置项
 * - 处理退出登录确认
 * - 实时监听用户信息变化
 * 
 * @param {Object} navigation - 导航对象，用于页面跳转
 * @returns {JSX.Element} 设置页面组件
 */
const SettingsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, role } = useSelector((state) => state.auth);
  
  // 界面状态管理
  const [notificationEnabled, setNotificationEnabled] = useState(true);  // 通知开关状态
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false); // 退出登录对话框显示状态
  const [refreshKey, setRefreshKey] = useState(0);                      // 强制刷新键

  /**
   * 监听用户信息变化，确保界面能正确更新
   * 当用户信息更新时，强制重新渲染组件
   */
  useEffect(() => {
    console.log('SettingsScreen 用户信息更新:', user);
    console.log('SettingsScreen 用户姓名:', user?.name);
    console.log('SettingsScreen 用户姓:', user?.first_name);
    console.log('SettingsScreen 用户名:', user?.last_name);
    // 强制重新渲染
    setRefreshKey(prev => prev + 1);
  }, [user]);

  /**
   * 监听导航焦点变化，确保从编辑页面返回时能更新
   * 当页面获得焦点时，检查用户信息更新
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('SettingsScreen 获得焦点，检查用户信息更新');
      setRefreshKey(prev => prev + 1);
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * 处理退出登录按钮点击
   * 显示退出登录确认对话框
   */
  const handleLogout = () => {
    setLogoutDialogVisible(true);
  };

  /**
   * 确认退出登录
   * 调用Redux action执行退出登录操作
   */
  const confirmLogout = () => {
    dispatch(logoutUser());
    setLogoutDialogVisible(false);
  };

  /**
   * 获取角色显示名称
   * 根据用户角色返回对应的本地化名称
   * 
   * @param {string} role - 用户角色
   * @returns {string} 角色显示名称
   */
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

  /**
   * 获取用户姓名首字母
   * 用于头像显示，优先使用first_name和last_name
   * 
   * @param {string} name - 用户姓名
   * @returns {string} 姓名首字母
   */
  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 用户信息卡片 - 显示头像、姓名、角色和编辑按钮 */}
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

        {/* 个人设置区域 - 编辑资料、修改密码、隐私设置 */}
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

        {/* 应用设置区域 - 通知、语言设置等 */}
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

        {/* 健康设置区域 - 仅患者显示 */}
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

        {/* 医生设置区域 - 仅医生显示 */}
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

        {/* 帮助和反馈区域 - FAQ、反馈、关于 */}
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

/**
 * 样式定义
 * 包含设置页面的所有UI样式，按功能模块分组
 * 
 * 主要样式组：
 * - 容器和布局样式
 * - 用户信息卡片样式
 * - 设置区域样式
 * - 列表项样式
 * - 退出登录按钮样式
 */
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

/**
 * 导出设置页面组件
 * 作为默认导出，供其他模块使用
 */
export default SettingsScreen; 