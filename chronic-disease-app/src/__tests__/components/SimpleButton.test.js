/**
 * 简单按钮组件测试
 * 演示React组件的基础测试
 */

import React from 'react';

// 简单的按钮组件（内联定义）
const SimpleButton = ({ title, onPress, disabled = false }) => {
  return (
    <button 
      onClick={onPress} 
      disabled={disabled}
      data-testid="simple-button"
    >
      {title}
    </button>
  );
};

// 模拟React测试工具（简化版）
const mockRender = (component) => {
  // 这里只是演示概念，实际应该使用@testing-library/react
  return {
    component,
    getByTestId: (testId) => ({ textContent: 'mocked-element' }),
    getByText: (text) => ({ textContent: text })
  };
};

describe('SimpleButton 简单按钮组件测试', () => {
  
  it('应该正确定义组件', () => {
    expect(SimpleButton).toBeDefined();
    expect(typeof SimpleButton).toBe('function');
  });

  it('应该接受title属性', () => {
    const props = {
      title: '测试按钮',
      onPress: () => {}
    };
    
    // 验证组件可以接收props
    const result = SimpleButton(props);
    expect(result).toBeDefined();
    expect(result.props.children).toBe('测试按钮');
  });

  it('应该接受onPress回调函数', () => {
    const mockOnPress = jest.fn();
    const props = {
      title: '点击测试',
      onPress: mockOnPress
    };
    
    const result = SimpleButton(props);
    expect(result.props.onClick).toBe(mockOnPress);
  });

  it('应该支持disabled属性', () => {
    const props = {
      title: '禁用按钮',
      onPress: () => {},
      disabled: true
    };
    
    const result = SimpleButton(props);
    expect(result.props.disabled).toBe(true);
  });

  it('disabled属性默认为false', () => {
    const props = {
      title: '默认按钮',
      onPress: () => {}
    };
    
    const result = SimpleButton(props);
    expect(result.props.disabled).toBe(false);
  });

  it('应该渲染正确的HTML结构', () => {
    const props = {
      title: '结构测试',
      onPress: () => {}
    };
    
    const result = SimpleButton(props);
    
    // 验证是button元素
    expect(result.type).toBe('button');
    
    // 验证有正确的data-testid
    expect(result.props['data-testid']).toBe('simple-button');
    
    // 验证子元素是文本
    expect(result.props.children).toBe('结构测试');
  });
});
