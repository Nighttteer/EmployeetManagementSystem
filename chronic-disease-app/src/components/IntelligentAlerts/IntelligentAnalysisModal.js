/**
 * 智能分析详情弹窗
 * 显示某个患者的详细智能分析结果
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Card,
  ActivityIndicator,
  Chip,
  Divider
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

import intelligentAlertService from '../../services/intelligentAlertService';

const IntelligentAnalysisModal = ({ 
  visible, 
  onDismiss, 
  patientId,
  patientName
}) => {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState(null);

  useEffect(() => {
    if (visible && patientId) {
      loadPatientAnalysis();
    }
  }, [visible, patientId]);

  const loadPatientAnalysis = async () => {
    try {
      setLoading(true);
      const data = await intelligentAlertService.getPatientRiskAnalysis(patientId);
      setAnalysisData(data);
    } catch (error) {
      console.error('加载患者分析失败:', error);
      Alert.alert('错误', '加载智能分析失败');
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

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
              {/* 标题 */}
              <View style={styles.header}>
                <Ionicons name="bar-chart" size={32} color="#2196F3" />
                <View style={styles.headerText}>
                  <Text style={styles.title}>智能分析报告</Text>
                  <Text style={styles.patientName}>{patientName}</Text>
                </View>
              </View>

              <Divider style={styles.divider} />

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" />
                  <Text style={styles.loadingText}>正在分析患者数据...</Text>
                </View>
              ) : analysisData ? (
                <View>
                  {/* 综合风险评估 */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>综合风险评估</Text>
                    <View style={styles.riskAssessment}>
                      <Chip
                        mode="flat"
                        style={[
                          styles.riskChip,
                          { backgroundColor: getRiskColor(analysisData.overall_risk) }
                        ]}
                        textStyle={styles.riskChipText}
                      >
                        {getRiskText(analysisData.overall_risk)}
                      </Chip>
                      <Text style={styles.riskDescription}>
                        {analysisData.risk_description}
                      </Text>
                    </View>
                  </View>

                  {/* 用药依从性分析 */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>用药依从性分析</Text>
                    <View style={styles.adherenceContainer}>
                      <View style={styles.adherenceStats}>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>
                            {(analysisData.medication_adherence?.overall_rate * 100).toFixed(1)}%
                          </Text>
                          <Text style={styles.statLabel}>整体依从性</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={[
                            styles.statValue,
                            { color: analysisData.medication_adherence?.consecutive_missed > 0 ? '#F44336' : '#4CAF50' }
                          ]}>
                            {analysisData.medication_adherence?.consecutive_missed || 0}
                          </Text>
                          <Text style={styles.statLabel}>连续漏服</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statValue}>
                            {analysisData.medication_adherence?.missed_this_week || 0}
                          </Text>
                          <Text style={styles.statLabel}>本周漏服</Text>
                        </View>
                      </View>
                      
                      {/* 各药物依从性详情 */}
                      {analysisData.medication_adherence?.by_medication?.map((med, index) => (
                        <View key={index} style={styles.medicationItem}>
                          <Text style={styles.medicationName}>{med.name}</Text>
                          <View style={styles.medicationStats}>
                            <Text style={[
                              styles.adherenceRate,
                              { color: getAdherenceColor(med.adherence_rate) }
                            ]}>
                              {(med.adherence_rate * 100).toFixed(1)}%
                            </Text>
                            <Text style={styles.medicationNote}>
                              漏服 {med.missed_count} 次
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 健康指标趋势 */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>健康指标趋势</Text>
                    {analysisData.health_trends?.map((trend, index) => (
                      <View key={index} style={styles.trendItem}>
                        <View style={styles.trendHeader}>
                          <Text style={styles.trendName}>{trend.metric_name}</Text>
                          <Chip
                            mode="outlined"
                            compact
                            style={[
                              styles.trendChip,
                              { borderColor: getTrendColor(trend.trend_direction) }
                            ]}
                            textStyle={[
                              styles.trendChipText,
                              { color: getTrendColor(trend.trend_direction) }
                            ]}
                          >
                            {trend.trend_direction === 'up' ? '↗ 上升' : 
                             trend.trend_direction === 'down' ? '↘ 下降' : '→ 稳定'}
                          </Chip>
                        </View>
                        <Text style={styles.trendValue}>
                          最新值：{trend.latest_value} {trend.unit}
                        </Text>
                        <Text style={styles.trendDescription}>
                          {trend.analysis_description}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* 智能建议 */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>智能建议</Text>
                    <View style={styles.recommendationsContainer}>
                      {analysisData.recommendations?.map((rec, index) => (
                        <View key={index} style={styles.recommendationItem}>
                          <View style={styles.recommendationHeader}>
                            <Ionicons 
                              name={getRecommendationIcon(rec.type)} 
                              size={16} 
                              color={getRecommendationColor(rec.priority)} 
                            />
                            <Text style={[
                              styles.recommendationPriority,
                              { color: getRecommendationColor(rec.priority) }
                            ]}>
                              {rec.priority === 'high' ? '高优先级' : 
                               rec.priority === 'medium' ? '中优先级' : '低优先级'}
                            </Text>
                          </View>
                          <Text style={styles.recommendationText}>
                            {rec.content}
                          </Text>
                          {rec.expected_outcome && (
                            <Text style={styles.expectedOutcome}>
                              预期效果：{rec.expected_outcome}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* 分析时间 */}
                  <View style={styles.footer}>
                    <Text style={styles.analysisTime}>
                      分析时间：{new Date(analysisData.analyzed_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={48} color="#F44336" />
                  <Text style={styles.errorText}>无法获取智能分析数据</Text>
                </View>
              )}
            </Card.Content>

            <Card.Actions style={styles.actions}>
              <Button onPress={onDismiss}>关闭</Button>
              {analysisData && (
                <Button
                  mode="contained"
                  onPress={() => {
                    // 可以添加保存报告或分享功能
                    Alert.alert('功能开发中', '报告导出功能正在开发中');
                  }}
                >
                  导出报告
                </Button>
              )}
            </Card.Actions>
          </Card>
        </ScrollView>
      </Modal>
    </Portal>
  );

  // 辅助函数
  function getRiskColor(risk) {
    switch (risk) {
      case 'high': return '#FFEBEE';
      case 'medium': return '#FFF8E1';
      case 'low': return '#E8F5E8';
      default: return '#F5F5F5';
    }
  }

  function getRiskText(risk) {
    switch (risk) {
      case 'high': return '高风险';
      case 'medium': return '中风险';
      case 'low': return '低风险';
      default: return '未知';
    }
  }

  function getAdherenceColor(rate) {
    if (rate < 0.7) return '#F44336';
    if (rate < 0.85) return '#FF9800';
    return '#4CAF50';
  }

  function getTrendColor(direction) {
    switch (direction) {
      case 'up': return '#F44336';
      case 'down': return '#4CAF50';
      default: return '#9E9E9E';
    }
  }

  function getRecommendationIcon(type) {
    switch (type) {
      case 'medication': return 'medical';
      case 'lifestyle': return 'fitness';
              case 'monitoring': return 'bar-chart';
      default: return 'bulb';
    }
  }

  function getRecommendationColor(priority) {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      default: return '#4CAF50';
    }
  }
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  card: {
    // 移除默认的elevation
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  patientName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  riskAssessment: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  riskChip: {
    marginBottom: 8,
  },
  riskChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  riskDescription: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
  },
  adherenceContainer: {
    // 用药依从性容器样式
  },
  adherenceStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  medicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  medicationStats: {
    alignItems: 'flex-end',
  },
  adherenceRate: {
    fontSize: 14,
    fontWeight: '600',
  },
  medicationNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trendItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  trendChip: {
    height: 28,
  },
  trendChipText: {
    fontSize: 12,
  },
  trendValue: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  trendDescription: {
    fontSize: 13,
    color: '#555',
  },
  recommendationsContainer: {
    // 建议列表容器
  },
  recommendationItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationPriority: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  expectedOutcome: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
  },
  analysisTime: {
    fontSize: 12,
    color: '#999',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  actions: {
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
});

export default IntelligentAnalysisModal;