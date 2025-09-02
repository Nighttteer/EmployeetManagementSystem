/**
 * 图片预览弹窗组件
 * 
 * 功能特性：
 * - 全屏图片预览和缩放
 * - 支持手势操作（拖拽、缩放、滑动关闭）
 * - 自定义头部和底部操作按钮
 * - 半透明黑色背景
 * - 状态栏自动隐藏
 * - 支持点击和双击事件处理
 * 
 * @author 医疗测试应用开发团队
 * @version 1.0.0
 */

import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { Ionicons } from '@expo/vector-icons';

/**
 * 图片预览弹窗组件
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.visible - 控制弹窗显示/隐藏
 * @param {string} props.imageUrl - 要预览的图片URL
 * @param {Function} props.onClose - 关闭弹窗的回调函数
 * @returns {JSX.Element} 图片预览弹窗组件
 */
const ImagePreviewModal = ({ visible, imageUrl, onClose }) => {
  // 将单个图片URL转换为ImageViewer需要的格式
  const images = imageUrl ? [{ url: imageUrl }] : [];

  /**
   * 渲染弹窗头部
   * 包含关闭按钮，位于屏幕顶部
   * 
   * @returns {JSX.Element} 头部组件
   */
  const renderHeader = () => (
    <SafeAreaView style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );

  /**
   * 渲染弹窗底部
   * 包含完成按钮，位于屏幕底部
   * 
   * @returns {JSX.Element} 底部组件
   */
  const renderFooter = () => (
    <SafeAreaView style={styles.footer}>
      <View style={styles.footerContent}>
        <TouchableOpacity onPress={onClose} style={styles.doneButton}>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 隐藏状态栏，提供全屏体验 */}
      <StatusBar hidden={true} />
      
      {/* 弹窗容器 */}
      <View style={styles.container}>
        <ImageViewer
          imageUrls={images}                    // 图片数据数组
          enableSwipeDown={true}                // 启用向下滑动关闭
          onSwipeDown={onClose}                 // 向下滑动时的回调
          renderHeader={renderHeader}            // 自定义头部渲染函数
          renderFooter={renderFooter}            // 自定义底部渲染函数
          backgroundColor="rgba(0, 0, 0, 0.9)"  // 半透明黑色背景
          enablePreload={true}                  // 启用图片预加载
          saveToLocalByLongPress={false}        // 禁用长按保存到本地
          onClick={() => {
            // 点击图片时的处理逻辑
            // 可以在这里添加点击事件处理
          }}
          onDoubleClick={() => {
            // 双击图片时的处理逻辑
            // 可以在这里添加双击事件处理
          }}
          style={styles.imageViewer}            // 自定义样式
        />
      </View>
    </Modal>
  );
};

// 组件样式定义
const styles = StyleSheet.create({
  // 弹窗容器样式
  container: {
    flex: 1,                                    // 占据全屏
    backgroundColor: 'rgba(0, 0, 0, 0.9)',     // 半透明黑色背景
  },
  
  // 头部区域样式
  header: {
    position: 'absolute',                        // 绝对定位
    top: 0,                                     // 顶部对齐
    left: 0,                                    // 左侧对齐
    right: 0,                                   // 右侧对齐
    zIndex: 1000,                               // 层级，确保在最上层
    paddingTop: 10,                             // 顶部内边距
    paddingHorizontal: 20,                      // 水平内边距
    paddingBottom: 10,                          // 底部内边距
  },
  
  // 关闭按钮样式
  closeButton: {
    alignSelf: 'flex-end',                      // 右对齐
    width: 40,                                  // 按钮宽度
    height: 40,                                 // 按钮高度
    borderRadius: 20,                           // 圆形按钮
    backgroundColor: 'rgba(0, 0, 0, 0.5)',     // 半透明黑色背景
    justifyContent: 'center',                   // 垂直居中
    alignItems: 'center',                       // 水平居中
  },
  
  // 底部区域样式
  footer: {
    position: 'absolute',                        // 绝对定位
    bottom: 0,                                  // 底部对齐
    left: 0,                                    // 左侧对齐
    right: 0,                                   // 右侧对齐
    zIndex: 1000,                               // 层级，确保在最上层
    paddingBottom: 10,                          // 底部内边距
    paddingHorizontal: 20,                      // 水平内边距
  },
  
  // 底部内容容器样式
  footerContent: {
    alignItems: 'center',                       // 水平居中
  },
  
  // 完成按钮样式
  doneButton: {
    width: 50,                                  // 按钮宽度
    height: 50,                                 // 按钮高度
    borderRadius: 25,                           // 圆形按钮
    backgroundColor: 'rgba(0, 0, 0, 0.5)',     // 半透明黑色背景
    justifyContent: 'center',                   // 垂直居中
    alignItems: 'center',                       // 水平居中
  },
  
  // 图片查看器样式
  imageViewer: {
    flex: 1,                                    // 占据剩余空间
  },
});

export default ImagePreviewModal; 