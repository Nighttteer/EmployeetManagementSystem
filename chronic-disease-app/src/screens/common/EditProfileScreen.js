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

const EditProfileScreen = ({ navigation }) => {
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
      // TODO: 实现更新用户信息的API调用
      console.log('保存用户信息:', formData);
      Alert.alert('成功', '个人信息已更新');
      navigation.goBack();
    } catch (error) {
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
        <Appbar.Content title="编辑个人信息" />
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
              label="紧急联系人"
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
          <Dialog.Title>保存更改</Dialog.Title>
          <Dialog.Content>
            <Paragraph>确定要保存这些更改吗？</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSaveDialogVisible(false)}>取消</Button>
            <Button onPress={confirmSave} loading={loading} mode="contained">
              保存
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