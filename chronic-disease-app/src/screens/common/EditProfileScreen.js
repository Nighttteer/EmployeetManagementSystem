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

const EditProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    dateOfBirth: user?.date_of_birth || '',
    emergencyContact: user?.emergency_contact || '',
  });
  
  const [loading, setLoading] = useState(false);
  const [saveDialogVisible, setSaveDialogVisible] = useState(false);

  const handleSave = () => {
    setSaveDialogVisible(true);
  };

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

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.editProfile')} />
        <Appbar.Action icon="check" onPress={handleSave} />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              基本信息
            </Text>
            
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

export default EditProfileScreen; 