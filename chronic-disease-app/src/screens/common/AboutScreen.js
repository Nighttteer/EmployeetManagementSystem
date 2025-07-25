import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Appbar, 
  List, 
  Divider, 
  Button,
  Avatar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const AboutScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const appVersion = '1.0.0';
  const buildNumber = '1';
  


  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.about')} />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        {/* 应用信息卡片 */}
        <Card style={styles.card}>
          <Card.Content style={styles.appInfo}>
            <Avatar.Icon size={80} icon="medical-bag" style={styles.appIcon} />
            <Text variant="headlineSmall" style={styles.appName}>
              {t('about.appName')}
            </Text>
            <Text variant="bodyMedium" style={styles.appDescription}>
              {t('about.appDescription')}
            </Text>
            <Text variant="bodySmall" style={styles.version}>
              {t('about.version', { version: appVersion, build: buildNumber })}
            </Text>
          </Card.Content>
        </Card>

        {/* 功能特色 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('about.features')}
            </Text>
            <List.Item
              title={t('about.healthDataTracking')}
              description={t('about.healthDataTrackingDesc')}
              left={(props) => <List.Icon {...props} icon="chart-line" />}
            />
            <Divider />
            <List.Item
              title={t('about.medicationReminder')}
              description={t('about.medicationReminderDesc')}
              left={(props) => <List.Icon {...props} icon="pill" />}
            />
            <Divider />
            <List.Item
              title={t('about.doctorPatientCommunication')}
              description={t('about.doctorPatientCommunicationDesc')}
              left={(props) => <List.Icon {...props} icon="chat" />}
            />
            <Divider />
            <List.Item
              title={t('about.healthAlerts')}
              description={t('about.healthAlertsDesc')}
              left={(props) => <List.Icon {...props} icon="alert-circle" />}
            />
          </Card.Content>
        </Card>



        {/* 开发团队 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('about.developmentTeam')}
            </Text>
            <Text variant="bodyMedium" style={styles.teamInfo}>
              He Sun 2025毕业设计
            </Text>
            <Text variant="bodySmall" style={styles.copyright}>
              © 2025 He Sun. All rights reserved.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
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
  appInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appIcon: {
    marginBottom: 16,
  },
  appName: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  appDescription: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  version: {
    color: '#999',
    textAlign: 'center',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  teamInfo: {
    marginBottom: 16,
    lineHeight: 20,
    color: '#666',
  },
  copyright: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
});

export default AboutScreen; 