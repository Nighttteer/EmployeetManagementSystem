import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { logoutUser } from '../../store/slices/authSlice';

const SettingsScreen = ({ navigation }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user, role } = useSelector((state) => state.auth);
  
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);

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
        return '患者';
      case 'doctor':
        return '医生';
      default:
        return '用户';
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
              label={getInitials(user?.name || user?.first_name + ' ' + user?.last_name)}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text variant="headlineSmall" style={styles.userName}>
                {user?.name || `${user?.first_name} ${user?.last_name}`}
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
            个人设置
          </Text>
          
          <List.Item
            title="编辑个人信息"
            description="修改个人基本信息"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('EditProfile')}
          />
          
          <Divider />
          
          <List.Item
            title="修改密码"
            description="更改登录密码"
            left={(props) => <List.Icon {...props} icon="lock" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ChangePassword')}
          />
          
          <Divider />
          
          <List.Item
            title="隐私设置"
            description="管理个人隐私偏好"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('PrivacySettings')}
          />
        </Surface>

        {/* 应用设置 */}
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            应用设置
          </Text>
          
          <List.Item
            title="推送通知"
            description="接收重要提醒和消息"
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
            title="深色模式"
            description="切换应用主题"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                color={theme.colors.primary}
              />
            )}
          />
          
          <Divider />
          
          <List.Item
            title="语言设置"
            description="选择应用语言"
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('LanguageSettings')}
          />
          
          <Divider />
          
          <List.Item
            title="数据同步"
            description="同步设置和数据"
            left={(props) => <List.Icon {...props} icon="sync" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('DataSync')}
          />
        </Surface>

        {/* 健康设置 (仅患者显示) */}
        {role === 'patient' && (
          <Surface style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              健康设置
            </Text>
            
            <List.Item
              title="健康目标"
              description="设置个人健康目标"
              left={(props) => <List.Icon {...props} icon="target" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('HealthGoals')}
            />
            
            <Divider />
            
            <List.Item
              title="提醒设置"
              description="管理用药和检查提醒"
              left={(props) => <List.Icon {...props} icon="alarm" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('ReminderSettings')}
            />
            
            <Divider />
            
            <List.Item
              title="数据导出"
              description="导出健康数据"
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
              医生设置
            </Text>
            
            <List.Item
              title="执业信息"
              description="管理执业资质信息"
              left={(props) => <List.Icon {...props} icon="medical-bag" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('MedicalInfo')}
            />
            
            <Divider />
            
            <List.Item
              title="工作时间"
              description="设置可接诊时间"
              left={(props) => <List.Icon {...props} icon="clock" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('WorkingHours')}
            />
            
            <Divider />
            
            <List.Item
              title="告警设置"
              description="配置患者告警规则"
              left={(props) => <List.Icon {...props} icon="alert-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('AlertSettings')}
            />
          </Surface>
        )}

        {/* 帮助和反馈 */}
        <Surface style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            帮助和反馈
          </Text>
          
          <List.Item
            title="常见问题"
            description="查看常见问题解答"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('FAQ')}
          />
          
          <Divider />
          
          <List.Item
            title="意见反馈"
            description="提交建议和问题"
            left={(props) => <List.Icon {...props} icon="message-text" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Feedback')}
          />
          
          <Divider />
          
          <List.Item
            title="关于应用"
            description="版本信息和开发者"
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
            退出登录
          </Button>
        </View>
      </ScrollView>

      {/* 退出登录确认对话框 */}
      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
          <Dialog.Title>确认退出</Dialog.Title>
          <Dialog.Content>
            <Paragraph>您确定要退出登录吗？</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>取消</Button>
            <Button onPress={confirmLogout} mode="contained" buttonColor={theme.colors.error}>
              确认退出
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