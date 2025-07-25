#!/usr/bin/env python
"""
测试音频文件服务端点
"""

import requests
import json

def test_audio_endpoint():
    """测试音频文件服务端点"""
    base_url = "http://10.132.115.2:8000"
    
    # 测试音频文件路径
    audio_path = "message_attachments/audio.m4a"
    
    print("=== 测试音频文件服务端点 ===")
    print(f"基础URL: {base_url}")
    print(f"音频路径: {audio_path}")
    
    # 测试音频文件服务端点
    audio_url = f"{base_url}/api/communication/audio/{audio_path}"
    print(f"音频服务URL: {audio_url}")
    
    try:
        # 测试HEAD请求
        print("\n--- 测试HEAD请求 ---")
        response = requests.head(audio_url)
        print(f"状态码: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content-Length: {response.headers.get('Content-Length')}")
        print(f"Accept-Ranges: {response.headers.get('Accept-Ranges')}")
        print(f"Cache-Control: {response.headers.get('Cache-Control')}")
        print(f"Access-Control-Allow-Origin: {response.headers.get('Access-Control-Allow-Origin')}")
        
        # 测试Range请求
        print("\n--- 测试Range请求 ---")
        headers = {'Range': 'bytes=0-1023'}
        response = requests.get(audio_url, headers=headers)
        print(f"状态码: {response.status_code}")
        print(f"Content-Range: {response.headers.get('Content-Range')}")
        print(f"Content-Length: {response.headers.get('Content-Length')}")
        
        # 测试完整文件请求
        print("\n--- 测试完整文件请求 ---")
        response = requests.get(audio_url)
        print(f"状态码: {response.status_code}")
        print(f"文件大小: {len(response.content)} bytes")
        
        if response.status_code == 200:
            print("✅ 音频文件服务端点工作正常")
        else:
            print("❌ 音频文件服务端点有问题")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ 请求失败: {e}")
    
    # 对比原始媒体文件URL
    print("\n=== 对比原始媒体文件URL ===")
    original_url = f"{base_url}/media/{audio_path}"
    print(f"原始媒体URL: {original_url}")
    
    try:
        response = requests.head(original_url)
        print(f"状态码: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content-Length: {response.headers.get('Content-Length')}")
        print(f"Accept-Ranges: {response.headers.get('Accept-Ranges')}")
        
    except requests.exceptions.RequestException as e:
        print(f"❌ 原始媒体文件请求失败: {e}")

if __name__ == '__main__':
    test_audio_endpoint() 