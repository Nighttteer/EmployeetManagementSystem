import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const PatientDetailsScreen = () => {
  return (
    <View style={styles.container}>
      <Text>患者详情功能开发中...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PatientDetailsScreen; 