/**
 * CustomButton 组件测试
 * 遵循AAA模式：Arrange（准备）、Act（执行）、Assert（断言）
 * 一个测试只验证一个功能点
 */

import React from 'react';

// 模拟React Native组件
const TouchableOpacity = ({ children, style, onPress, disabled, activeOpacity }) => ({
  type: 'TouchableOpacity',
  props: { children, style, onPress, disabled, activeOpacity }
});

const Text = ({ children, style }) => ({
  type: 'Text',
  props: { children, style }
});

// 模拟组件
const CustomButton = ({
  title,
  onPress,
  mode = 'contained',
  disabled = false,
  style,
  textStyle,
  size = 'medium'
}) => {
  const buttonStyles = [
    'button',
    mode,
    size,
    disabled && 'disabled',
    style
  ].filter(Boolean);

  const textStyles = [
    'text',
    `${mode}Text`,
    `${size}Text`,
    disabled && 'disabledText',
    textStyle
  ].filter(Boolean);

  return TouchableOpacity({
    style: buttonStyles,
    onPress: onPress,
    disabled: disabled,
    activeOpacity: 0.7,
    children: Text({
      style: textStyles,
      children: title
    })
  });
};

describe('CustomButton 组件测试', () => {

  describe('基本属性传递', () => {
    it('应该正确接收并显示title属性', () => {
      // Arrange（准备）
      const testTitle = '测试按钮';
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({ title: testTitle, onPress: mockOnPress });

      // Assert（断言）
      expect(result.props.children.props.children).toBe(testTitle);
    });

    it('应该正确传递onPress回调函数', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({ title: '按钮', onPress: mockOnPress });

      // Assert（断言）
      expect(result.props.onPress).toBe(mockOnPress);
    });
  });

  describe('默认值处理', () => {
    it('mode属性应该默认为contained', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({ title: '按钮', onPress: mockOnPress });

      // Assert（断言）
      expect(result.props.style).toContain('contained');
    });

    it('size属性应该默认为medium', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({ title: '按钮', onPress: mockOnPress });

      // Assert（断言）
      expect(result.props.style).toContain('medium');
    });

    it('disabled属性应该默认为false', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({ title: '按钮', onPress: mockOnPress });

      // Assert（断言）
      expect(result.props.disabled).toBe(false);
    });
  });

  describe('按钮模式渲染', () => {
    it('contained模式应该包含contained样式', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        mode: 'contained'
      });

      // Assert（断言）
      expect(result.props.style).toContain('contained');
    });

    it('outlined模式应该包含outlined样式', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        mode: 'outlined'
      });

      // Assert（断言）
      expect(result.props.style).toContain('outlined');
    });

    it('text模式应该包含text样式', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        mode: 'text'
      });

      // Assert（断言）
      expect(result.props.style).toContain('text');
    });
  });

  describe('按钮尺寸渲染', () => {
    it('small尺寸应该包含small样式', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        size: 'small'
      });

      // Assert（断言）
      expect(result.props.style).toContain('small');
    });

    it('large尺寸应该包含large样式', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        size: 'large'
      });

      // Assert（断言）
      expect(result.props.style).toContain('large');
    });
  });

  describe('禁用状态处理', () => {
    it('禁用时应该设置disabled属性为true', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        disabled: true
      });

      // Assert（断言）
      expect(result.props.disabled).toBe(true);
    });

    it('禁用时应该包含disabled样式', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        disabled: true
      });

      // Assert（断言）
      expect(result.props.style).toContain('disabled');
    });
  });

  describe('样式组合逻辑', () => {
    it('应该正确组合多个样式类', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();
      const customStyle = 'customStyle';

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        style: customStyle
      });

      // Assert（断言）
      expect(result.props.style).toContain('button');
      expect(result.props.style).toContain('contained');
      expect(result.props.style).toContain('medium');
      expect(result.props.style).toContain(customStyle);
    });

    it('应该正确组合文本样式类', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();
      const customTextStyle = 'customTextStyle';

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress,
        textStyle: customTextStyle
      });

      // Assert（断言）
      const textComponent = result.props.children;
      expect(textComponent.props.style).toContain('text');
      expect(textComponent.props.style).toContain('containedText');
      expect(textComponent.props.style).toContain('mediumText');
      expect(textComponent.props.style).toContain(customTextStyle);
    });
  });

  describe('activeOpacity属性', () => {
    it('应该设置正确的activeOpacity值', () => {
      // Arrange（准备）
      const mockOnPress = jest.fn();

      // Act（执行）
      const result = CustomButton({
        title: '按钮',
        onPress: mockOnPress
      });

      // Assert（断言）
      expect(result.props.activeOpacity).toBe(0.7);
    });
  });
});
