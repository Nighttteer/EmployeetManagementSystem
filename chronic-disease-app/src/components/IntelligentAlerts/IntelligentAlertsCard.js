/**
 * 智能异常提醒卡片组件
 * 显示智能提醒的概览信息
 */
import React, { useState, useEffect } from 'react';
import {View,StyleSheet,TouchableOpacity,Alert,RefreshControl,FlatList} from 'react-native';
import {Card,Text,Button,ActivityIndicator,Chip,Badge,Avatar} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import intelligentAlertService from '../../services/intelligentAlertService';

const IntelligentAlertsCard = ({ 
  navigation, 
  patientId = null, 
  onAlertPress = null,
  showHeader = true,
  maxItems = 5 
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertsData, setAlertsData] = useState(null);

  useEffect(() => {
    loadIntelligentAlerts();
  }, [patientId]);

  const loadIntelligentAlerts = async () => {
    try {
      setLoading(true);
      const params = patientId ? { patient_id: patientId, days: 7 } : { days: 7 };
      const data = await intelligentAlertService.getIntelligentAlerts(params);
      setAlertsData(data);
    } catch (error) {
      console.error('加载智能提醒失败:', error);
      Alert.alert('错误', '加载智能提醒失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIntelligentAlerts();
    setRefreshing(false);
  };

  const handleGenerateAlerts = async () => {
    try {
      Alert.alert(
        '生成智能提醒',
        '确定要重新分析并生成智能提醒吗？这可能需要几分钟时间。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确定',
            onPress: async () => {
              try {
                setLoading(true);
                await intelligentAlertService.generateIntelligentAlerts(patientId);
                Alert.alert('成功', '智能提醒生成完成');
                await loadIntelligentAlerts();
              } catch (error) {
                Alert.alert('错误', '生成智能提醒失败');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('生成智能提醒失败:', error);
    }
  };

  const handleAlertPress = (alert) => {
    if (onAlertPress) {
      onAlertPress(alert);
    } else if (navigation) {
      navigation.navigate('AlertDetail', { alertId: alert.id });
    }
  };

  const renderAlertItem = ({ item: alert }) => (
    <TouchableOpacity
      style={styles.alertItem}
      onPress={() => handleAlertPress(alert)}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          <Ionicons
            name={intelligentAlertService.getAlertTypeIcon(alert.alert_type)}
            size={20}
            color={intelligentAlertService.getPriorityColor(alert.priority)}
          />
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle} numberOfLines={1}>
            {alert.title}
          </Text>
          <Text style={styles.alertTime}>
            {intelligentAlertService.formatTime(alert.created_at)}
          </Text>
        </View>
        <View style={styles.alertBadge}>
          <Chip
            mode="outlined"
            compact
            textStyle={[
              styles.priorityText,
              { color: intelligentAlertService.getPriorityColor(alert.priority) }
            ]}
            style={[
              styles.priorityChip,
              { borderColor: intelligentAlertService.getPriorityColor(alert.priority) }
            ]}
          >
            {intelligentAlertService.getPriorityText(alert.priority)}
          </Chip>
        </View>
      </View>
      <Text style={styles.alertMessage} numberOfLines={2}>
        {alert.message}
      </Text>
      {alert.patient && (
        <View style={styles.patientInfo}>
          <Avatar.Text
            size={24}
            label={alert.patient.name?.charAt(0) || 'P'}
            style={styles.patientAvatar}
          />
          <Text style={styles.patientName}>
            {alert.patient.name || '未知患者'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderStats = () => {
    if (!alertsData?.stats) return null;

    const { stats } = alertsData;
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>总计</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#F44336' }]}>
            {stats.by_priority.critical}
          </Text>
          <Text style={styles.statLabel}>危急</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>
            {stats.by_priority.high}
          </Text>
          <Text style={styles.statLabel}>高</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>待处理</Text>
        </View>
      </View>
    );
  };

  if (loading && !alertsData) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>正在分析智能提醒...</Text>
        </Card.Content>
      </Card>
    );
  }

  const alerts = alertsData?.alerts || [];
  const displayAlerts = maxItems ? alerts.slice(0, maxItems) : alerts;

  return (
    <Card style={styles.card}>
      {showHeader && (
        <Card.Content style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="bar-chart" size={24} color="#2196F3" />
            <Text style={styles.title}>智能异常提醒</Text>
            {alertsData?.stats?.pending > 0 && (
              <Badge style={styles.badge}>
                {alertsData.stats.pending}
              </Badge>
            )}
          </View>
          <Button
            mode="outlined"
            compact
            onPress={handleGenerateAlerts}
            disabled={loading}
            style={styles.generateButton}
          >
            重新分析
          </Button>
        </Card.Content>
      )}

      <Card.Content>
        {renderStats()}
        
        {displayAlerts.length > 0 ? (
          <FlatList
            data={displayAlerts}
            renderItem={renderAlertItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.emptyTitle}>{t('alerts.noAbnormalAlerts')}</Text>
            <Text style={styles.emptySubtitle}>
              {patientId ? '该患者目前没有需要关注的异常情况' : '所有患者情况正常'}
            </Text>
          </View>
        )}

        {maxItems && alerts.length > maxItems && (
          <Button
            mode="text"
            onPress={() => navigation?.navigate('IntelligentAlerts')}
            style={styles.viewAllButton}
          >
            查看全部 {alerts.length} 条提醒
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  badge: {
    marginLeft: 8,
    backgroundColor: '#F44336',
  },
  generateButton: {
    borderColor: '#2196F3',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  alertItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  alertBadge: {
    // 优先级标签的样式
  },
  priorityChip: {
    height: 24,
  },
  priorityText: {
    fontSize: 10,
  },
  alertMessage: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginLeft: 44,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 44,
  },
  patientAvatar: {
    backgroundColor: '#E3F2FD',
  },
  patientName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
  },
  viewAllButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
});

export default IntelligentAlertsCard;