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

const ImagePreviewModal = ({ visible, imageUrl, onClose }) => {
  const images = imageUrl ? [{ url: imageUrl }] : [];

  const renderHeader = () => (
    <SafeAreaView style={styles.header}>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );

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
      <StatusBar hidden={true} />
      <View style={styles.container}>
        <ImageViewer
          imageUrls={images}
          enableSwipeDown={true}
          onSwipeDown={onClose}
          renderHeader={renderHeader}
          renderFooter={renderFooter}
          backgroundColor="rgba(0, 0, 0, 0.9)"
          enablePreload={true}
          saveToLocalByLongPress={false}
          onClick={() => {
            // 点击图片时的处理
          }}
          onDoubleClick={() => {
            // 双击图片时的处理
          }}
          style={styles.imageViewer}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  footerContent: {
    alignItems: 'center',
  },
  doneButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewer: {
    flex: 1,
  },
});

export default ImagePreviewModal; 