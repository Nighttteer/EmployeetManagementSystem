import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const AudioTest = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);

  // 测试音频URL列表
  const testAudioUrls = [
    {
      name: '测试音频1 (本地)',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
    },
    {
      name: '测试音频2 (MP3)',
      url: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav'
    },
    {
      name: '测试音频3 (M4A)',
      url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
    }
  ];

  const playTestAudio = async (audioUrl) => {
    try {
      console.log('=== 测试音频播放 ===');
      console.log('音频URL:', audioUrl);

      // 停止当前播放
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }

      // 设置音频模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('音频模式设置完成');

      // 创建音频对象
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        (status) => {
          console.log('播放状态:', status);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setSound(null);
          }
          if (status.error) {
            console.error('播放错误:', status.error);
            setIsPlaying(false);
            setSound(null);
            Alert.alert('播放错误', status.error);
          }
        }
      );

      setSound(newSound);
      setIsPlaying(true);
      console.log('音频播放开始');

    } catch (error) {
      console.error('测试音频播放失败:', error);
      Alert.alert('播放失败', `错误: ${error.message}`);
      setIsPlaying(false);
      setSound(null);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>音频播放测试</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          状态: {isPlaying ? '播放中' : '未播放'}
        </Text>
      </View>

      {testAudioUrls.map((audio, index) => (
        <TouchableOpacity
          key={index}
          style={styles.testButton}
          onPress={() => playTestAudio(audio.url)}
          disabled={isPlaying}
        >
          <Ionicons 
            name="play-circle" 
            size={24} 
            color={isPlaying ? "#ccc" : "#007AFF"} 
          />
          <Text style={[styles.buttonText, isPlaying && styles.disabledText]}>
            {audio.name}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.stopButton, !isPlaying && styles.disabledButton]}
        onPress={stopAudio}
        disabled={!isPlaying}
      >
        <Ionicons name="stop-circle" size={24} color="#ff4444" />
        <Text style={styles.stopButtonText}>停止播放</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>调试信息:</Text>
        <Text style={styles.infoText}>• 检查控制台输出</Text>
        <Text style={styles.infoText}>• 确认网络连接</Text>
        <Text style={styles.infoText}>• 检查音频权限</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  disabledText: {
    color: '#ccc',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff4444',
    justifyContent: 'center',
  },
  disabledButton: {
    borderColor: '#ccc',
  },
  stopButtonText: {
    fontSize: 16,
    color: '#ff4444',
    marginLeft: 10,
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#e8f4ff',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default AudioTest; 