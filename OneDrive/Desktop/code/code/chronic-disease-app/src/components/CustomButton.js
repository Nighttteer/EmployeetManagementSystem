import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const CustomButton = ({ 
  title, 
  onPress, 
  mode = 'contained', 
  disabled = false, 
  style,
  textStyle,
  size = 'medium' // 'small', 'medium', 'large'
}) => {
  const buttonStyles = [
    styles.button,
    styles[mode],
    styles[size],
    disabled && styles.disabled,
    style
  ];

  const textStyles = [
    styles.text,
    styles[`${mode}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyles}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 按钮尺寸（适老化设计：较大的点击区域）
  small: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  medium: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  large: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    minHeight: 64,
  },
  // 按钮模式
  contained: {
    backgroundColor: '#2E86AB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2E86AB',
  },
  text: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: '#cccccc',
    elevation: 0,
    shadowOpacity: 0,
  },
  // 文字样式（适老化设计：较大字号）
  text: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 16,
  },
  mediumText: {
    fontSize: 18,
  },
  largeText: {
    fontSize: 20,
  },
  containedText: {
    color: '#ffffff',
  },
  outlinedText: {
    color: '#2E86AB',
  },
  textText: {
    color: '#2E86AB',
  },
  disabledText: {
    color: '#999999',
  },
});

export default CustomButton; 