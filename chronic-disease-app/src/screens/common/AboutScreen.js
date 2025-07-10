import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
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

const AboutScreen = ({ navigation }) => {
  const appVersion = '1.0.0';
  const buildNumber = '1';
  
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@healthcareapp.com');
  };
  
  const handleWebsite = () => {
    Linking.openURL('https://www.healthcareapp.com');
  };
  
  const handlePrivacyPolicy = () => {
    Linking.openURL('https://www.healthcareapp.com/privacy');
  };
  
  const handleTermsOfService = () => {
    Linking.openURL('https://www.healthcareapp.com/terms');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="关于应用" />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        {/* 应用信息卡片 */}
        <Card style={styles.card}>
          <Card.Content style={styles.appInfo}>
            <Avatar.Icon size={80} icon="medical-bag" style={styles.appIcon} />
            <Text variant="headlineSmall" style={styles.appName}>
              慢性病管理系统
            </Text>
            <Text variant="bodyMedium" style={styles.appDescription}>
              专业的慢性病管理和医患沟通平台
            </Text>
            <Text variant="bodySmall" style={styles.version}>
              版本 {appVersion} (Build {buildNumber})
            </Text>
          </Card.Content>
        </Card>

        {/* 功能特色 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              功能特色
            </Text>
            <List.Item
              title="健康数据追踪"
              description="记录和追踪各项健康指标"
              left={(props) => <List.Icon {...props} icon="chart-line" />}
            />
            <Divider />
            <List.Item
              title="用药提醒"
              description="智能用药提醒和管理"
              left={(props) => <List.Icon {...props} icon="pill" />}
            />
            <Divider />
            <List.Item
              title="医患沟通"
              description="安全的医患在线沟通"
              left={(props) => <List.Icon {...props} icon="chat" />}
            />
            <Divider />
            <List.Item
              title="健康告警"
              description="异常数据智能告警"
              left={(props) => <List.Icon {...props} icon="alert-circle" />}
            />
          </Card.Content>
        </Card>

        {/* 联系我们 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              联系我们
            </Text>
            <List.Item
              title="技术支持"
              description="support@healthcareapp.com"
              left={(props) => <List.Icon {...props} icon="email" />}
              onPress={handleEmailSupport}
            />
            <Divider />
            <List.Item
              title="官方网站"
              description="www.healthcareapp.com"
              left={(props) => <List.Icon {...props} icon="web" />}
              onPress={handleWebsite}
            />
          </Card.Content>
        </Card>

        {/* 法律信息 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              法律信息
            </Text>
            <List.Item
              title="隐私政策"
              description="查看我们的隐私政策"
              left={(props) => <List.Icon {...props} icon="shield-account" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handlePrivacyPolicy}
            />
            <Divider />
            <List.Item
              title="服务条款"
              description="查看服务条款"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleTermsOfService}
            />
          </Card.Content>
        </Card>

        {/* 开发团队 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              开发团队
            </Text>
            <Text variant="bodyMedium" style={styles.teamInfo}>
              本应用由专业的医疗健康技术团队开发，致力于为慢性病患者提供更好的健康管理服务。
            </Text>
            <Text variant="bodySmall" style={styles.copyright}>
              © 2024 慢性病管理系统. 保留所有权利。
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