/**
 * 提醒详情弹窗组件
 * 用于显示单个提醒的详细信息和处理功能
 * 1. 提醒详情展示
显示提醒的标题、内容、时间等基本信息
展示提醒的优先级和类型（通过不同颜色的标签）
显示患者的基本信息（姓名、年龄、性别）
 */
import React, { useState } from 'react';
import {View,StyleSheet,ScrollView,Alert} from 'react-native';
import {Modal,Portal,Text,Button,Card,TextInput,Chip,Divider} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import intelligentAlertService from '../../services/intelligentAlertService';

const AlertDetailModal = ({ 
  visible, 
  onDismiss, 
  alert, 
  onAlertHandled 
}) => {
  const [actionTaken, setActionTaken] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleAlertAction = async () => {
    if (!actionTaken.trim()) {
      Alert.alert('提示', '请填写处理措施');
      return;
    }

    try {
      setProcessing(true);
      await intelligentAlertService.handleAlert(alert.id, {
        action_taken: actionTaken,
        notes: notes
      });
      
      Alert.alert('成功', '提醒处理完成');
      onAlertHandled?.();
      onDismiss();
    } catch (error) {
      Alert.alert('错误', '处理提醒失败');
    } finally {
      setProcessing(false);
    }
  };

  const renderRecommendations = () => {
    if (!alert || alert.status !== 'pending') return null;

    const recommendations = intelligentAlertService.generateRecommendations(alert);
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>推荐措施</Text>
        <View style={styles.recommendationsContainer}>
          {recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Ionicons name="bulb-outline" size={16} color="#FF9800" />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMetadata = () => {
    if (!alert?.metadata) return null;

    const { metadata } = alert;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>详细信息</Text>
        <View style={styles.metadataContainer}>
          {metadata.adherence_rate !== undefined && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>用药依从性：</Text>
              <Text style={styles.metadataValue}>
                {(metadata.adherence_rate * 100).toFixed(1)}%
              </Text>
            </View>
          )}
          {metadata.consecutive_missed !== undefined && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>连续漏服：</Text>
              <Text style={styles.metadataValue}>{metadata.consecutive_missed}次</Text>
            </View>
          )}
          {metadata.trend_slope !== undefined && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>趋势变化：</Text>
              <Text style={[
                styles.metadataValue,
                { color: metadata.trend_slope > 0 ? '#F44336' : '#4CAF50' }
              ]}>
                {metadata.trend_slope > 0 ? '上升' : '下降'}
              </Text>
            </View>
          )}
          {metadata.latest_value !== undefined && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>最新值：</Text>
              <Text style={styles.metadataValue}>{metadata.latest_value}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!alert) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={styles.card}>
            <Card.Content>
              {/* 提醒头部信息 */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={intelligentAlertService.getAlertTypeIcon(alert.alert_type)}
                    size={32}
                    color={intelligentAlertService.getPriorityColor(alert.priority)}
                  />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.title}>{alert.title}</Text>
                  <Text style={styles.time}>
                    {intelligentAlertService.formatTime(alert.created_at)}
                  </Text>
                </View>
                <View style={styles.badges}>
                  <Chip
                    mode="outlined"
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
                  <Chip
                    mode="flat"
                    textStyle={styles.typeText}
                    style={styles.typeChip}
                  >
                    {intelligentAlertService.getAlertTypeText(alert.alert_type)}
                  </Chip>
                </View>
              </View>

              <Divider style={styles.divider} />

              {/* 提醒内容 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>提醒内容</Text>
                <Text style={styles.message}>{alert.message}</Text>
              </View>

              {/* 患者信息 */}
              {alert.patient && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>患者信息</Text>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{alert.patient.name}</Text>
                    {alert.patient.age && (
                      <Text style={styles.patientAge}>，{alert.patient.age}岁</Text>
                    )}
                    {alert.patient.gender && (
                      <Text style={styles.patientGender}>，{alert.patient.gender}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* 推荐措施 */}
              {renderRecommendations()}

              {/* 详细信息 */}
              {renderMetadata()}

              {/* 处理表单（仅待处理状态显示） */}
              {alert.status === 'pending' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>处理提醒</Text>
                  <TextInput
                    label="处理措施 *"
                    value={actionTaken}
                    onChangeText={setActionTaken}
                    mode="outlined"
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                    placeholder="请详细描述采取的处理措施..."
                  />
                  <TextInput
                    label="备注说明"
                    value={notes}
                    onChangeText={setNotes}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    style={styles.input}
                    placeholder="可添加额外的备注信息..."
                  />
                </View>
              )}

              {/* 已处理信息 */}
              {alert.status === 'handled' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>处理记录</Text>
                  <View style={styles.handledInfo}>
                    <Text style={styles.handledLabel}>处理人：</Text>
                    <Text style={styles.handledValue}>{alert.handled_by?.name || '未知'}</Text>
                  </View>
                  <View style={styles.handledInfo}>
                    <Text style={styles.handledLabel}>处理时间：</Text>
                    <Text style={styles.handledValue}>
                      {new Date(alert.handled_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                  {alert.action_taken && (
                    <View style={styles.handledInfo}>
                      <Text style={styles.handledLabel}>处理措施：</Text>
                      <Text style={styles.handledValue}>{alert.action_taken}</Text>
                    </View>
                  )}
                  {alert.notes && (
                    <View style={styles.handledInfo}>
                      <Text style={styles.handledLabel}>备注：</Text>
                      <Text style={styles.handledValue}>{alert.notes}</Text>
                    </View>
                  )}
                </View>
              )}
            </Card.Content>

            {/* 操作按钮 */}
            <Card.Actions style={styles.actions}>
              <Button onPress={onDismiss}>关闭</Button>
              {alert.status === 'pending' && (
                <Button
                  mode="contained"
                  onPress={handleAlertAction}
                  loading={processing}
                  disabled={processing}
                >
                  确认处理
                </Button>
              )}
            </Card.Actions>
          </Card>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  card: {
    // 移除默认的elevation，因为Modal已经有阴影
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  badges: {
    alignItems: 'flex-end',
  },
  priorityChip: {
    height: 32,
    marginBottom: 8,
  },
  priorityText: {
    fontSize: 12,
  },
  typeChip: {
    height: 28,
    backgroundColor: '#E3F2FD',
  },
  typeText: {
    fontSize: 11,
    color: '#2196F3',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  patientAge: {
    fontSize: 15,
    color: '#666',
  },
  patientGender: {
    fontSize: 15,
    color: '#666',
  },
  recommendationsContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  metadataContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666',
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    marginBottom: 12,
  },
  handledInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  handledLabel: {
    fontSize: 14,
    color: '#666',
    minWidth: 80,
  },
  handledValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  actions: {
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
});

export default AlertDetailModal;