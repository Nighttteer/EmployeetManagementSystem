/**
 * 编辑个人资料页面组件
 * 
 * 功能特性：
 * - 编辑用户基本信息（姓名、邮箱、电话、地址等）
 * - 支持紧急联系人信息编辑
 * - 表单验证和错误处理
 * - 保存确认对话框
 * - 与Redux状态同步更新
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Appbar,
  Portal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile, fetchUserProfile } from '../../store/slices/userSlice';
import { updateAuthUser } from '../../store/slices/authSlice';
import { useTranslation } from 'react-i18next';

/**
 * 编辑个人资料页面主组件
 * 
 * 主要功能：
 * - 加载和显示当前用户信息
 * - 提供表单编辑界面
 * - 处理表单提交和保存
 * - 同步更新Redux状态
 * - 显示保存确认对话框
 * 
 * @param {Object} navigation - 导航对象，用于页面返回
 * @returns {JSX.Element} 编辑个人资料页面组件
 */
const EditProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  // 表单数据状态，从Redux store中的用户信息初始化
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',        // 姓
    lastName: user?.last_name || '',          // 名
    email: user?.email || '',                 // 邮箱
    phone: user?.phone || '',                 // 电话
    address: user?.address || '',             // 地址
    dateOfBirth: user?.date_of_birth || '',  // 出生日期
    emergencyContact: user?.emergency_contact || '', // 紧急联系人
  });
  
  // 界面状态管理
  const [loading, setLoading] = useState(false);           // 保存中状态
  const [saveDialogVisible, setSaveDialogVisible] = useState(false); // 保存确认对话框显示状态

  /**
   * 处理保存按钮点击
   * 显示保存确认对话框
   */
  const handleSave = () => {
    setSaveDialogVisible(true);
  };

  /**
   * 确认保存用户信息
   * 调用API更新用户信息，同步更新Redux状态
   */
  const confirmSave = async () => {
    setLoading(true);
    try {
      // 调用API更新用户信息
      const result = await dispatch(updateUserProfile(formData)).unwrap();
      console.log('保存用户信息:', formData);
      console.log('API返回结果:', result);
      
      // 同步更新auth slice中的用户信息
      const updatedUserData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        date_of_birth: formData.dateOfBirth,
        emergency_contact: formData.emergencyContact,
        // 清除name字段，确保使用first_name和last_name
        name: undefined,
      };
      console.log('更新auth slice的用户信息:', updatedUserData);
      dispatch(updateAuthUser(updatedUserData));
      
      // 重新获取用户信息以确保数据同步
      try {
        await dispatch(fetchUserProfile());
      } catch (error) {
        console.error('重新获取用户信息失败:', error);
      }
      
      Alert.alert(t('common.success'), t('profile.profileUpdated'));
      navigation.goBack();
    } catch (error) {
      console.error('更新用户信息失败:', error);
      Alert.alert('错误', '更新失败，请重试');
    } finally {
      setLoading(false);
      setSaveDialogVisible(false);
    }
  };

  /**
   * 更新表单字段值
   * 
   * @param {string} field - 字段名
   * @param {string} value - 字段值
   */
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 页面头部导航栏 */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.editProfile')} />
        <Appbar.Action icon="check" onPress={handleSave} />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        {/* 基本信息编辑卡片 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              基本信息
            </Text>
            
            {/* 姓名字段 */}
            <TextInput
              label="姓"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="名"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              style={styles.input}
              mode="outlined"
            />
            
            {/* 联系信息字段 */}
            <TextInput
              label="邮箱"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="email-address"
            />
            
            <TextInput
              label="电话"
              value={formData.phone}
              onChangeText={(text) => updateField('phone', text)}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />
            
            {/* 地址和日期字段 */}
            <TextInput
              label="地址"
              value={formData.address}
              onChangeText={(text) => updateField('address', text)}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              label="出生日期"
              value={formData.dateOfBirth}
              onChangeText={(text) => updateField('dateOfBirth', text)}
              style={styles.input}
              mode="outlined"
              placeholder="YYYY-MM-DD"
            />
            
            {/* 紧急联系人字段 */}
            <TextInput
              label={t('profile.emergencyContact')}
              value={formData.emergencyContact}
              onChangeText={(text) => updateField('emergencyContact', text)}
              style={styles.input}
              mode="outlined"
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* 保存确认对话框 */}
      <Portal>
        <Dialog visible={saveDialogVisible} onDismiss={() => setSaveDialogVisible(false)}>
          <Dialog.Title>{t('profile.saveChanges')}</Dialog.Title>
          <Dialog.Content>
            <Paragraph>{t('profile.confirmSaveChanges')}</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSaveDialogVisible(false)}>{t('common.cancel')}</Button>
            <Button onPress={confirmSave} loading={loading} mode="contained">
              {t('common.save')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

/**
 * 样式定义
 * 包含编辑个人资料页面的所有UI样式
 * 
 * 主要样式组：
 * - 容器和布局样式
 * - 卡片样式
 * - 表单输入样式
 * - 按钮样式
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    marginBottom: 16,
  },
});

/**
 * 导出编辑个人资料页面组件
 * 作为默认导出，供其他模块使用
 */
export default EditProfileScreen; 