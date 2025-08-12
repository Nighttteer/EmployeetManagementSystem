#!/usr/bin/env python
"""
直接测试登录API
"""
import requests
import json

def test_login():
    """测试登录API"""
    url = "http://localhost:8000/api/auth/login/"
    
    # 测试数据
    test_cases = [
        {
            "name": "患者张三登录",
            "data": {
                "phone": "+8613800138000",
                "password": "test123456",
                "role": "patient"
            }
        },
        {
            "name": "医生李医生登录", 
            "data": {
                "phone": "+8613800138001",
                "password": "test123456",
                "role": "doctor"
            }
        }
    ]
    
    for test_case in test_cases:
        print(f"\n🧪 测试: {test_case['name']}")
        print(f"📊 请求数据: {json.dumps(test_case['data'], ensure_ascii=False)}")
        
        try:
            response = requests.post(
                url,
                json=test_case['data'],
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"📡 响应状态: {response.status_code}")
            print(f"📋 响应头: {dict(response.headers)}")
            
            try:
                response_data = response.json()
                print(f"📦 响应数据: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
            except:
                print(f"📦 响应文本: {response.text}")
                
        except Exception as e:
            print(f"❌ 请求失败: {e}")
            
    print("\n" + "="*50)

if __name__ == '__main__':
    test_login()
