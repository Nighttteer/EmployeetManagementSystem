# 语音播放故障排除指南

## 问题描述
语音消息无法播放，点击播放按钮没有声音。

## 可能的原因和解决方案

### 1. 网络连接问题

**症状**: 播放时出现网络错误或超时
**解决方案**:
- 检查手机和电脑是否在同一网络
- 确认后端服务器正在运行
- 检查防火墙设置

**测试方法**:
```bash
# 在浏览器中访问音频文件URL
http://your-server-ip:8000/media/message_attachments/audio.m4a
```

### 2. 音频文件路径问题

**症状**: 404错误或文件不存在
**解决方案**:
- 检查音频文件是否已正确上传到服务器
- 确认文件路径是否正确
- 检查Django媒体文件配置

**检查步骤**:
1. 登录Django管理后台
2. 查看Message模型中的attachment字段
3. 确认文件路径格式正确

### 3. 音频格式兼容性问题

**症状**: 播放器无法识别音频格式
**解决方案**:
- 确保使用兼容的音频格式（M4A, MP3, WAV）
- 检查音频文件是否损坏
- 尝试重新录制语音消息

**支持的格式**:
- iOS: M4A, MP3, WAV, AAC
- Android: M4A, MP3, WAV, OGG

### 4. 权限问题

**症状**: 403错误或无权限访问
**解决方案**:
- 检查用户认证状态
- 确认音频文件权限设置
- 验证API访问权限

### 5. 设备音频设置问题

**症状**: 设备静音或音量过低
**解决方案**:
- 检查设备音量设置
- 确认应用有音频播放权限
- 检查耳机连接状态

## 调试步骤

### 步骤1: 检查控制台输出
在Expo开发工具中查看控制台输出，寻找错误信息：
```
=== 语音播放调试信息 ===
原始音频URI: /media/message_attachments/audio.m4a
消息ID: 123
当前播放状态: 未播放
完整音频URI: http://10.132.115.2:8000/media/message_attachments/audio.m4a
```

### 步骤2: 测试网络连接
使用测试组件验证音频播放功能：
```javascript
import AudioTest from '../components/AudioTest';

// 在聊天界面中添加测试按钮
<TouchableOpacity onPress={() => navigation.navigate('AudioTest')}>
  <Text>测试音频播放</Text>
</TouchableOpacity>
```

### 步骤3: 检查服务器配置
确认Django设置中的媒体文件配置：
```python
# settings.py
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# 确保音频文件的MIME类型正确
import mimetypes
mimetypes.add_type('audio/m4a', '.m4a')
mimetypes.add_type('audio/mp4', '.m4a')
mimetypes.add_type('audio/mpeg', '.mp3')
mimetypes.add_type('audio/wav', '.wav')
mimetypes.add_type('audio/aac', '.aac')
mimetypes.add_type('audio/ogg', '.ogg')

# 音频文件处理设置
AUDIO_FILE_TYPES = {
    'm4a': 'audio/mp4',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'aac': 'audio/aac',
    'ogg': 'audio/ogg',
}
```

### 步骤4: 使用专门的音频文件服务
如果遇到iOS错误-11850，使用专门的音频文件服务端点：
```python
# communication/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_audio_file(request, file_path):
    # 设置正确的HTTP头
    response = HttpResponse(content, content_type=mime_type)
    response['Accept-Ranges'] = 'bytes'
    response['Content-Length'] = len(content)
    response['Cache-Control'] = 'public, max-age=3600'
    return response
```

### 步骤4: 验证文件访问
在浏览器中直接访问音频文件URL，确认文件可访问：
```
http://your-server-ip:8000/media/message_attachments/audio.m4a
```

## 常见错误代码

### 网络错误
- **Network Error**: 网络连接失败
- **404 Not Found**: 文件不存在
- **403 Forbidden**: 权限不足
- **500 Internal Server Error**: 服务器内部错误

### iOS音频错误
- **Error -11850 (AVFoundationErrorDomain)**: 服务器配置不正确，音频文件HTTP头设置有问题
- **Error -11828**: 音频文件格式不支持
- **Error -11800**: 音频文件损坏或无法读取

### 通用音频错误
- **Audio format not supported**: 音频格式不支持
- **File corrupted**: 文件损坏
- **Permission denied**: 权限被拒绝

## 临时解决方案

### 1. 使用测试音频
如果问题持续存在，可以临时使用在线测试音频：
```javascript
const testAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';
```

### 2. 降级到文本消息
在语音播放问题解决前，建议使用文本消息进行沟通。

### 3. 重启应用
有时重启应用可以解决音频播放问题：
```bash
npx expo start --clear
```

### 4. iOS错误-11850专门解决方案
如果遇到iOS错误-11850，请按以下步骤操作：

1. **重启Django服务器**：
```bash
python manage.py runserver
```

2. **清除浏览器缓存**（如果使用Web版本）

3. **检查音频文件格式**：
   - 确保音频文件是M4A格式
   - 检查文件是否完整上传

4. **使用专门的音频服务端点**：
   - 确保使用 `/api/communication/audio/` 端点
   - 检查HTTP头设置是否正确

5. **测试音频文件访问**：
```bash
# 在浏览器中访问
http://your-server:8000/api/communication/audio/message_attachments/audio.m4a
```

## 预防措施

### 1. 音频录制设置
确保录制时使用正确的音频设置：
```javascript
const { recording } = await Audio.Recording.createAsync({
  android: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
    audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
});
```

### 2. 错误处理
添加完善的错误处理机制：
```javascript
try {
  // 音频播放代码
} catch (error) {
  console.error('播放失败:', error);
  Alert.alert('播放失败', '请稍后重试');
}
```

### 3. 用户反馈
提供清晰的用户反馈：
- 播放状态指示器
- 错误提示信息
- 重试选项

## 联系支持

如果问题仍然存在，请提供以下信息：
1. 错误日志截图
2. 设备型号和系统版本
3. 网络环境描述
4. 复现步骤

## 更新日志

- **v1.0**: 初始版本
- **v1.1**: 添加网络错误处理
- **v1.2**: 改进音频URL构建逻辑
- **v1.3**: 添加详细调试信息 