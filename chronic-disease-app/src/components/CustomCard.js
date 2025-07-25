import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text } from 'react-native-paper';

const CustomCard = ({ 
  title, 
  subtitle, 
  content, 
  icon, 
  onPress, 
  style,
  titleStyle,
  subtitleStyle,
  contentStyle,
  elevation = 2
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent onPress={onPress} activeOpacity={0.7}>
      <Card style={[styles.card, { elevation }, style]}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <View style={styles.textContainer}>
              {title && (
                <Text variant="titleMedium" style={[styles.title, titleStyle]}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text variant="bodyMedium" style={[styles.subtitle, subtitleStyle]}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          {content && (
            <View style={styles.contentContainer}>
              {typeof content === 'string' ? (
                <Text variant="bodyLarge" style={[styles.contentText, contentStyle]}>
                  {content}
                </Text>
              ) : (
                content
              )}
            </View>
          )}
        </Card.Content>
      </Card>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  contentContainer: {
    marginTop: 12,
  },
  contentText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});

export default CustomCard; 