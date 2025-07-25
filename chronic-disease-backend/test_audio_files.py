#!/usr/bin/env python
"""
音频文件测试脚本
用于检查音频文件是否正确上传和存储
"""

import os
import sys
import django
from pathlib import Path

# 设置Django环境
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from django.conf import settings
from communication.models import Message
from accounts.models import User

def check_audio_files():
    """检查音频文件状态"""
    print("=== 音频文件检查 ===")
    
    # 检查媒体目录
    media_root = settings.MEDIA_ROOT
    print(f"媒体目录: {media_root}")
    print(f"媒体目录存在: {os.path.exists(media_root)}")
    
    # 检查消息附件目录
    attachment_dir = os.path.join(media_root, 'message_attachments')
    print(f"附件目录: {attachment_dir}")
    print(f"附件目录存在: {os.path.exists(attachment_dir)}")
    
    if os.path.exists(attachment_dir):
        files = os.listdir(attachment_dir)
        print(f"附件目录中的文件数量: {len(files)}")
        for file in files:
            file_path = os.path.join(attachment_dir, file)
            file_size = os.path.getsize(file_path)
            print(f"  - {file} ({file_size} bytes)")
    
    # 检查数据库中的音频消息
    print("\n=== 数据库中的音频消息 ===")
    audio_messages = Message.objects.filter(message_type='audio')
    print(f"音频消息数量: {audio_messages.count()}")
    
    for msg in audio_messages:
        print(f"消息ID: {msg.id}")
        print(f"  发送者: {msg.sender}")
        print(f"  接收者: {msg.recipient}")
        print(f"  附件路径: {msg.attachment}")
        print(f"  附件类型: {msg.attachment_type}")
        print(f"  发送时间: {msg.sent_at}")
        
        if msg.attachment:
            full_path = os.path.join(media_root, str(msg.attachment))
            print(f"  完整路径: {full_path}")
            print(f"  文件存在: {os.path.exists(full_path)}")
            if os.path.exists(full_path):
                file_size = os.path.getsize(full_path)
                print(f"  文件大小: {file_size} bytes")
        print()

def test_audio_url():
    """测试音频URL构建"""
    print("=== 音频URL测试 ===")
    
    # 模拟音频文件路径
    test_paths = [
        'message_attachments/audio.m4a',
        '/media/message_attachments/audio.m4a',
        'media/message_attachments/audio.m4a',
    ]
    
    base_url = 'http://localhost:8000/api'
    
    for path in test_paths:
        # 模拟前端处理逻辑
        clean_path = path.replace('/media/', '')
        audio_url = f"{base_url}/communication/audio/{clean_path}"
        print(f"原始路径: {path}")
        print(f"处理后路径: {clean_path}")
        print(f"完整URL: {audio_url}")
        print()

if __name__ == '__main__':
    check_audio_files()
    test_audio_url() 