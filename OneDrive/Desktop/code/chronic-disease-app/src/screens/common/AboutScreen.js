/**
 * 关于页面组件
 * 
 * 功能特性：
 * - 显示应用基本信息（名称、描述、版本）
 * - 展示应用功能特色列表
 * - 显示开发团队信息
 * - 版权信息展示
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

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

/**
 * 关于页面主组件
 * 
 * 主要功能：
 * - 展示应用版本和构建信息
 * - 介绍应用的核心功能特性
 * - 显示开发团队和版权信息
 * 
 * @param {Object} navigation - 导航对象，用于页面返回
 * @returns {JSX.Element} 关于页面组件
 */
const AboutScreen = ({ navigation }) => {
  const { t } = useTranslation();
  
  // 应用版本信息
  const appVersion = '1.0.0';    // 应用版本号
  const buildNumber = '1';        // 构建编号

  return (
    <SafeAreaView style={styles.container}>
      {/* 页面头部导航栏 */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={t('settings.about')} />
      </Appbar.Header>
      
      <ScrollView style={styles.scrollView}>
        {/* 应用信息卡片 - 显示应用图标、名称、描述和版本 */}
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

        {/* 功能特色卡片 - 展示应用的主要功能特性 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('about.features')}
            </Text>
            {/* 健康数据追踪功能 */}
            <List.Item
              title={t('about.healthDataTracking')}
              description={t('about.healthDataTrackingDesc')}
              left={(props) => <List.Icon {...props} icon="chart-line" />}
            />
            <Divider />
            {/* 用药提醒功能 */}
            <List.Item
              title={t('about.medicationReminder')}
              description={t('about.medicationReminderDesc')}
              left={(props) => <List.Icon {...props} icon="pill" />}
            />
            <Divider />
            {/* 医患沟通功能 */}
            <List.Item
              title={t('about.doctorPatientCommunication')}
              description={t('about.doctorPatientCommunicationDesc')}
              left={(props) => <List.Icon {...props} icon="chat" />}
            />
            <Divider />
            {/* 健康警报功能 */}
            <List.Item
              title={t('about.healthAlerts')}
              description={t('about.healthAlertsDesc')}
              left={(props) => <List.Icon {...props} icon="alert-circle" />}
            />
          </Card.Content>
        </Card>

        {/* 开发团队卡片 - 显示开发团队信息和版权 */}
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

/**
 * 样式定义
 * 包含关于页面的所有UI样式，按功能模块分组
 * 
 * 主要样式组：
 * - 容器和布局样式
 * - 卡片样式
 * - 应用信息样式
 * - 功能特色样式
 * - 团队信息样式
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

/**
 * 导出关于页面组件
 * 作为默认导出，供其他模块使用
 */
export default AboutScreen; 