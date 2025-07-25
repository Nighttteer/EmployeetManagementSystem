#!/usr/bin/env python3
"""
测试SMS验证码修复
"""
import os
import sys
import django
import requests
import json
from datetime import datetime

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

# 导入Django模型
from accounts.models import SMSVerificationCode, User

# API配置
BASE_URL = "http://10.132.115.2:8000/api"
TEST_PHONE = "+8613800138000"  # 使用新的测试手机号

def test_sms_verification_fix():
    """测试SMS验证码修复"""
    print("🧪 测试SMS验证码修复...")
    
    # 1. 清理旧的验证码记录
    print("\n1. 清理旧的验证码记录...")
    SMSVerificationCode.objects.filter(phone=TEST_PHONE).delete()
    print(f"   已清理 {TEST_PHONE} 的旧验证码")
    
    # 2. 发送验证码
    print("\n2. 发送验证码...")
    response = requests.post(f"{BASE_URL}/auth/sms/send/", {
        "phone": TEST_PHONE,
        "purpose": "register"
    })
    
    if response.status_code == 200:
        print("   ✅ 验证码发送成功")
        print(f"   响应: {response.json()}")
        
        # 从数据库获取验证码
        verification = SMSVerificationCode.objects.filter(phone=TEST_PHONE).first()
        if verification:
            print(f"   📱 生成的验证码: {verification.code}")
            print(f"   📊 验证码状态: is_used={verification.is_used}, is_verified={verification.is_verified}")
            
            # 3. 验证验证码（不应该标记为已使用）
            print("\n3. 验证验证码...")
            verify_response = requests.post(f"{BASE_URL}/auth/sms/verify/", {
                "phone": TEST_PHONE,
                "code": verification.code,
                "purpose": "register"
            })
            
            if verify_response.status_code == 200:
                print("   ✅ 验证码验证成功")
                
                # 检查验证码状态
                verification.refresh_from_db()
                print(f"   📊 验证后状态: is_used={verification.is_used}, is_verified={verification.is_verified}")
                
                if verification.is_used:
                    print("   ❌ 问题：验证码在验证时被标记为已使用")
                    return False
                else:
                    print("   ✅ 正确：验证码验证时没有被标记为已使用")
                
                # 4. 测试注册（应该成功并标记验证码为已使用）
                print("\n4. 测试注册...")
                register_response = requests.post(f"{BASE_URL}/auth/register/sms/", {
                    "username": "testuser123",
                    "email": "test@example.com",
                    "password": "TestPass123!",
                    "password_confirm": "TestPass123!",
                    "name": "测试用户",
                    "role": "patient",
                    "phone": TEST_PHONE,
                    "sms_code": verification.code,
                    "age": 25,
                    "gender": "male"
                })
                
                if register_response.status_code == 201:
                    print("   ✅ 注册成功")
                    
                    # 检查验证码状态
                    verification.refresh_from_db()
                    print(f"   📊 注册后状态: is_used={verification.is_used}, is_verified={verification.is_verified}")
                    
                    if verification.is_used:
                        print("   ✅ 正确：验证码在注册成功后被标记为已使用")
                        
                        # 检查用户是否创建成功
                        user = User.objects.filter(phone=TEST_PHONE).first()
                        if user:
                            print(f"   ✅ 用户创建成功: {user.name} ({user.email})")
                            
                            # 清理测试数据
                            print("\n5. 清理测试数据...")
                            user.delete()
                            verification.delete()
                            print("   ✅ 测试数据清理完成")
                            
                            return True
                        else:
                            print("   ❌ 用户创建失败")
                            return False
                    else:
                        print("   ❌ 问题：验证码在注册后没有被标记为已使用")
                        return False
                else:
                    print(f"   ❌ 注册失败: {register_response.status_code}")
                    print(f"   错误信息: {register_response.text}")
                    return False
            else:
                print(f"   ❌ 验证码验证失败: {verify_response.status_code}")
                print(f"   错误信息: {verify_response.text}")
                return False
        else:
            print("   ❌ 无法获取验证码")
            return False
    else:
        print(f"   ❌ 验证码发送失败: {response.status_code}")
        print(f"   错误信息: {response.text}")
        return False

if __name__ == "__main__":
    try:
        success = test_sms_verification_fix()
        if success:
            print("\n🎉 SMS验证码修复测试通过！")
        else:
            print("\n❌ SMS验证码修复测试失败！")
    except Exception as e:
        print(f"\n💥 测试出错: {e}")
        import traceback
        traceback.print_exc() 