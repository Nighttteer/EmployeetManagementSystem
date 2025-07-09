#!/usr/bin/env python3
"""
测试手机号角色限制功能：一个手机号最多只能有一个医生端和患者端
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
TEST_PHONE = "+8613800138001"  # 使用新的测试手机号

def get_verification_code(phone):
    """获取验证码"""
    # 发送验证码
    response = requests.post(f"{BASE_URL}/auth/sms/send/", {
        "phone": phone,
        "purpose": "register"
    })
    
    if response.status_code == 200:
        # 从数据库获取验证码
        verification = SMSVerificationCode.objects.filter(phone=phone).first()
        if verification:
            return verification.code
    return None

def register_user(phone, role, username_suffix):
    """注册用户"""
    code = get_verification_code(phone)
    if not code:
        return False, "无法获取验证码"
    
    response = requests.post(f"{BASE_URL}/auth/register/sms/", {
        "username": f"testuser{username_suffix}",
        "email": f"test{username_suffix}@example.com",
        "password": "TestPass123!",
        "password_confirm": "TestPass123!",
        "name": f"测试{role}用户",
        "role": role,
        "phone": phone,
        "sms_code": code,
        "age": 25,
        "gender": "male"
    })
    
    if response.status_code == 201:
        return True, response.json()
    else:
        return False, response.json()

def test_phone_role_validation():
    """测试手机号角色限制功能"""
    print("🧪 测试手机号角色限制功能...")
    
    # 清理旧数据
    print("\n1. 清理旧数据...")
    User.objects.filter(phone=TEST_PHONE).delete()
    SMSVerificationCode.objects.filter(phone=TEST_PHONE).delete()
    print(f"   已清理 {TEST_PHONE} 的旧数据")
    
    # 测试1：注册患者账号
    print("\n2. 测试注册患者账号...")
    success, result = register_user(TEST_PHONE, "patient", "patient1")
    if success:
        print("   ✅ 患者账号注册成功")
        patient_user = User.objects.filter(phone=TEST_PHONE, role="patient").first()
        print(f"   📝 患者用户: {patient_user.name} ({patient_user.email})")
    else:
        print(f"   ❌ 患者账号注册失败: {result}")
        return False
    
    # 测试2：用同一个手机号注册医生账号（应该成功）
    print("\n3. 测试用同一手机号注册医生账号...")
    success, result = register_user(TEST_PHONE, "doctor", "doctor1")
    if success:
        print("   ✅ 医生账号注册成功")
        doctor_user = User.objects.filter(phone=TEST_PHONE, role="doctor").first()
        print(f"   📝 医生用户: {doctor_user.name} ({doctor_user.email})")
    else:
        print(f"   ❌ 医生账号注册失败: {result}")
        return False
    
    # 测试3：尝试注册第二个患者账号（应该失败）
    print("\n4. 测试注册第二个患者账号（应该失败）...")
    success, result = register_user(TEST_PHONE, "patient", "patient2")
    if not success:
        print("   ✅ 正确阻止了第二个患者账号注册")
        print(f"   📝 错误信息: {result}")
    else:
        print("   ❌ 错误：允许了第二个患者账号注册")
        return False
    
    # 测试4：尝试注册第二个医生账号（应该失败）
    print("\n5. 测试注册第二个医生账号（应该失败）...")
    success, result = register_user(TEST_PHONE, "doctor", "doctor2")
    if not success:
        print("   ✅ 正确阻止了第二个医生账号注册")
        print(f"   📝 错误信息: {result}")
    else:
        print("   ❌ 错误：允许了第二个医生账号注册")
        return False
    
    # 验证最终状态
    print("\n6. 验证最终状态...")
    patient_count = User.objects.filter(phone=TEST_PHONE, role="patient").count()
    doctor_count = User.objects.filter(phone=TEST_PHONE, role="doctor").count()
    total_count = User.objects.filter(phone=TEST_PHONE).count()
    
    print(f"   📊 该手机号的患者账号数: {patient_count}")
    print(f"   📊 该手机号的医生账号数: {doctor_count}")
    print(f"   📊 该手机号的总账号数: {total_count}")
    
    if patient_count == 1 and doctor_count == 1 and total_count == 2:
        print("   ✅ 验证通过：一个手机号有且仅有一个患者和一个医生账号")
        
        # 清理测试数据
        print("\n7. 清理测试数据...")
        User.objects.filter(phone=TEST_PHONE).delete()
        SMSVerificationCode.objects.filter(phone=TEST_PHONE).delete()
        print("   ✅ 测试数据清理完成")
        
        return True
    else:
        print("   ❌ 验证失败：账号数量不符合预期")
        return False

if __name__ == "__main__":
    try:
        success = test_phone_role_validation()
        if success:
            print("\n🎉 手机号角色限制功能测试通过！")
        else:
            print("\n❌ 手机号角色限制功能测试失败！")
    except Exception as e:
        print(f"\n💥 测试出错: {e}")
        import traceback
        traceback.print_exc() 