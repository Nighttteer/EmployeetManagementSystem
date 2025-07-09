import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

const DoctorProfileScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          个人中心
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          医生个人中心功能开发中...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
});

export default DoctorProfileScreen; 