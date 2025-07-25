#!/usr/bin/env python
"""
测试音频文件HTTP头设置
用于验证iOS AVFoundation错误-11850的解决方案
"""

import os
import sys
import django
from pathlib import Path

# 设置Django环境
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from communication.views import serve_audio_file
from communication.models import Message
import json

User = get_user_model()

def test_audio_file_headers():
    """测试音频文件的HTTP头设置"""
    print("=== 音频文件HTTP头测试 ===")
    
    # 创建测试请求
    factory = RequestFactory()
    
    # 查找一个音频消息
    audio_message = Message.objects.filter(
        message_type='audio',
        attachment__isnull=False
    ).first()
    
    if not audio_message:
        print("❌ 未找到音频消息")
        return
    
    print(f"✅ 找到音频消息: {audio_message.id}")
    print(f"音频文件路径: {audio_message.attachment}")
    
    # 构建文件路径
    file_path = str(audio_message.attachment).replace('/media/', '')
    print(f"处理后的文件路径: {file_path}")
    
    # 创建测试用户（如果不存在）
    test_user, created = User.objects.get_or_create(
        username='test_audio_user',
        defaults={
            'email': 'test@example.com',
            'name': '测试用户',
            'role': 'patient'
        }
    )
    
    # 创建请求
    request = factory.get(f'/api/communication/audio/{file_path}')
    request.user = test_user
    
    # 测试Range请求
    print("\n=== 测试Range请求 ===")
    request.META['HTTP_RANGE'] = 'bytes=0-1023'
    
    try:
        response = serve_audio_file(request, file_path)
        print(f"状态码: {response.status_code}")
        print(f"Content-Type: {response.get('Content-Type')}")
        print(f"Content-Length: {response.get('Content-Length')}")
        print(f"Accept-Ranges: {response.get('Accept-Ranges')}")
        print(f"Content-Range: {response.get('Content-Range')}")
        print(f"Cache-Control: {response.get('Cache-Control')}")
        print(f"Access-Control-Allow-Origin: {response.get('Access-Control-Allow-Origin')}")
        print(f"Access-Control-Allow-Headers: {response.get('Access-Control-Allow-Headers')}")
        print(f"Access-Control-Expose-Headers: {response.get('Access-Control-Expose-Headers')}")
        
        if response.status_code == 206:
            print("✅ Range请求处理正确")
        else:
            print("❌ Range请求处理异常")
            
    except Exception as e:
        print(f"❌ Range请求测试失败: {e}")
    
    # 测试完整文件请求
    print("\n=== 测试完整文件请求 ===")
    request = factory.get(f'/api/communication/audio/{file_path}')
    request.user = test_user
    
    try:
        response = serve_audio_file(request, file_path)
        print(f"状态码: {response.status_code}")
        print(f"Content-Type: {response.get('Content-Type')}")
        print(f"Content-Length: {response.get('Content-Length')}")
        print(f"Accept-Ranges: {response.get('Accept-Ranges')}")
        print(f"Cache-Control: {response.get('Cache-Control')}")
        print(f"Last-Modified: {response.get('Last-Modified')}")
        
        if response.status_code == 200:
            print("✅ 完整文件请求处理正确")
        else:
            print("❌ 完整文件请求处理异常")
            
    except Exception as e:
        print(f"❌ 完整文件请求测试失败: {e}")
    
    # 测试OPTIONS请求（CORS预检）
    print("\n=== 测试OPTIONS请求 ===")
    request = factory.options(f'/api/communication/audio/{file_path}')
    request.user = test_user
    request.META['HTTP_ORIGIN'] = 'http://localhost:3000'
    
    try:
        response = serve_audio_file(request, file_path)
        print(f"状态码: {response.status_code}")
        print(f"Access-Control-Allow-Origin: {response.get('Access-Control-Allow-Origin')}")
        print(f"Access-Control-Allow-Methods: {response.get('Access-Control-Allow-Methods')}")
        print(f"Access-Control-Allow-Headers: {response.get('Access-Control-Allow-Headers')}")
        
    except Exception as e:
        print(f"❌ OPTIONS请求测试失败: {e}")

def check_audio_files():
    """检查音频文件是否存在"""
    print("\n=== 音频文件检查 ===")
    
    from django.conf import settings
    
    # 查找所有音频消息
    audio_messages = Message.objects.filter(
        message_type='audio',
        attachment__isnull=False
    )
    
    print(f"找到 {audio_messages.count()} 个音频消息")
    
    for msg in audio_messages:
        file_path = str(msg.attachment)
        full_path = os.path.join(settings.MEDIA_ROOT, file_path.replace('/media/', ''))
        
        if os.path.exists(full_path):
            file_size = os.path.getsize(full_path)
            print(f"✅ {file_path} - {file_size} bytes")
        else:
            print(f"❌ {file_path} - 文件不存在")

if __name__ == '__main__':
    check_audio_files()
    test_audio_file_headers()
    print("\n=== 测试完成 ===") 