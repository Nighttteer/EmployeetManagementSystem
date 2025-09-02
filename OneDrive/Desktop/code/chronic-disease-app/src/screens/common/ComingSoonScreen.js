import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const ComingSoonScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { title = t('common.comingSoon') } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={title} />
      </Appbar.Header>
      
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          🚧 {t('common.comingSoon')}
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {t('common.featureInDevelopment')}
        </Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          {t('common.back')}
        </Button>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    marginTop: 16,
  },
});

export default ComingSoonScreen; 