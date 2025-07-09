#!/usr/bin/env python3
"""
慢性病管理系统API测试脚本
"""
import requests
import json
import time

# API基础URL
BASE_URL = "http://127.0.0.1:8000/api"

def test_api_root():
    """测试API根端点"""
    print("🔍 测试API根端点...")
    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print("✅ API根端点正常")
            print(f"📄 响应内容: {response.json()}")
            return True
        else:
            print(f"❌ API根端点异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 连接失败: {e}")
        return False

def test_user_registration():
    """测试用户注册"""
    print("\n🔍 测试用户注册...")
    
    # 测试患者注册
    patient_data = {
        "username": "testpatient",
        "email": "patient@test.com",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "name": "测试患者",
        "role": "patient",
        "phone": "13800138000",
        "age": 45,
        "gender": "male",
        "height": 175.0,
        "blood_type": "A+"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register/", json=patient_data)
        if response.status_code == 201:
            print("✅ 患者注册成功")
            data = response.json()
            print(f"📄 用户信息: {data['user']['name']} - {data['user']['role']}")
            return data['tokens']['access']
        else:
            print(f"❌ 患者注册失败: {response.status_code}")
            print(f"📄 错误信息: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 注册请求失败: {e}")
        return None

def test_user_login():
    """测试用户登录"""
    print("\n🔍 测试用户登录...")
    
    login_data = {
        "email": "patient@test.com",
        "password": "testpass123",
        "role": "patient"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if response.status_code == 200:
            print("✅ 用户登录成功")
            data = response.json()
            print(f"📄 用户信息: {data['user']['name']} - {data['user']['role']}")
            return data['tokens']['access']
        else:
            print(f"❌ 用户登录失败: {response.status_code}")
            print(f"📄 错误信息: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 登录请求失败: {e}")
        return None

def test_authenticated_endpoints(token):
    """测试需要认证的端点"""
    print("\n🔍 测试需要认证的端点...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # 测试用户资料
    try:
        response = requests.get(f"{BASE_URL}/auth/profile/", headers=headers)
        if response.status_code == 200:
            print("✅ 用户资料获取成功")
            data = response.json()
            print(f"📄 用户资料: {data['name']} - 资料完整度: {data['profile_completion']}%")
        else:
            print(f"❌ 用户资料获取失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 用户资料请求失败: {e}")
    
    # 测试仪表板
    try:
        response = requests.get(f"{BASE_URL}/auth/dashboard/", headers=headers)
        if response.status_code == 200:
            print("✅ 仪表板数据获取成功")
            data = response.json()
            print(f"📄 仪表板统计: {data['stats']}")
        else:
            print(f"❌ 仪表板数据获取失败: {response.status_code}")
    except Exception as e:
        print(f"❌ 仪表板请求失败: {e}")

def test_doctor_registration():
    """测试医生注册"""
    print("\n🔍 测试医生注册...")
    
    doctor_data = {
        "username": "testdoctor",
        "email": "doctor@test.com",
        "password": "testpass123",
        "password_confirm": "testpass123",
        "name": "测试医生",
        "role": "doctor",
        "phone": "13800138001",
        "age": 35,
        "gender": "female",
        "license_number": "DOC20241201001",
        "department": "内科",
        "title": "主治医师",
        "specialization": "心血管疾病、糖尿病"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register/", json=doctor_data)
        if response.status_code == 201:
            print("✅ 医生注册成功")
            data = response.json()
            print(f"📄 医生信息: {data['user']['name']} - {data['user']['department']}")
            return data['tokens']['access']
        else:
            print(f"❌ 医生注册失败: {response.status_code}")
            print(f"📄 错误信息: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 医生注册请求失败: {e}")
        return None

def main():
    """主测试函数"""
    print("🏥 慢性病管理系统API测试开始")
    print("=" * 50)
    
    # 等待服务器启动
    print("⏳ 等待服务器启动...")
    time.sleep(3)
    
    # 测试API根端点
    if not test_api_root():
        print("❌ API服务器未启动，测试终止")
        return
    
    # 测试用户注册
    patient_token = test_user_registration()
    if patient_token:
        # 测试认证端点
        test_authenticated_endpoints(patient_token)
    
    # 测试用户登录
    login_token = test_user_login()
    if login_token:
        print("✅ 登录令牌获取成功")
    
    # 测试医生注册
    doctor_token = test_doctor_registration()
    if doctor_token:
        print("✅ 医生账户创建成功")
    
    print("\n" + "=" * 50)
    print("🎉 API测试完成")
    print("📊 系统状态: 后端API服务正常运行")
    print("🔗 API根地址: http://127.0.0.1:8000/api/")
    print("🔗 管理后台: http://127.0.0.1:8000/admin/")

if __name__ == "__main__":
    main() 