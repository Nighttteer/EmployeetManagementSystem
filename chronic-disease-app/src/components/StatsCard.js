import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  color = '#2196F3',
  backgroundColor = '#ffffff',
  trend,
  trendValue,
  onPress,
  style
}) => {
  const getTrendColor = () => {
    if (!trend) return '#666';
    return trend === 'up' ? '#4CAF50' : trend === 'down' ? '#F44336' : '#666';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove';
  };

  const CardContent = () => (
    <Card style={[styles.card, { backgroundColor }, style]}>
      <Card.Content style={styles.content}>
        {/* 图标和标题区域 */}
        <View style={styles.header}>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
              <Ionicons name={icon} size={20} color={color} />
            </View>
          )}
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </View>
        
        {/* 数值区域 */}
        <View style={styles.valueSection}>
          <Text style={[styles.value, { color }]} numberOfLines={1}>
            {value}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        
        {/* 趋势区域 */}
        {trend && (
          <View style={styles.trendSection}>
            <Ionicons 
              name={getTrendIcon()} 
              size={14} 
              color={getTrendColor()} 
            />
            {trendValue && (
              <Text style={[styles.trendValue, { color: getTrendColor() }]} numberOfLines={1}>
                {trendValue}
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={styles.touchable}>
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
  },
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 12,
    margin: 4,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  valueSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  subtitle: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  trendSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  trendValue: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default StatsCard; 