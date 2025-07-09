#!/usr/bin/env python3
"""
创建测试用户数据
"""
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User

def create_test_users():
    """创建测试用户数据"""
    print("🔧 创建测试用户数据...")
    
    # 创建测试患者
    patient_data = {
        "username": "testpatient",
        "email": "patient@test.com",
        "password": "testpass123",
        "name": "测试患者",
        "role": "patient",
        "phone": "+8613800138000",
        "age": 45,
        "gender": "male",
        "height": 175.0,
        "blood_type": "A+"
    }
    
    # 如果用户已存在，先删除
    if User.objects.filter(phone=patient_data['phone']).exists():
        User.objects.filter(phone=patient_data['phone']).delete()
        print(f"   已删除现有患者用户: {patient_data['phone']}")
    
    patient = User.objects.create_user(
        username=patient_data['username'],
        email=patient_data['email'],
        password=patient_data['password'],
        name=patient_data['name'],
        role=patient_data['role'],
        phone=patient_data['phone'],
        age=patient_data['age'],
        gender=patient_data['gender'],
        height=patient_data['height'],
        blood_type=patient_data['blood_type']
    )
    print(f"   ✅ 创建患者用户: {patient.name} ({patient.phone})")
    
    # 创建测试医生
    doctor_data = {
        "username": "testdoctor",
        "email": "doctor@test.com",
        "password": "testpass123",
        "name": "测试医生",
        "role": "doctor",
        "phone": "+8613800138001",
        "age": 35,
        "gender": "female",
        "license_number": "DOC20241201001",
        "department": "内科",
        "title": "主治医师",
        "specialization": "心血管疾病、糖尿病"
    }
    
    # 如果用户已存在，先删除
    if User.objects.filter(phone=doctor_data['phone']).exists():
        User.objects.filter(phone=doctor_data['phone']).delete()
        print(f"   已删除现有医生用户: {doctor_data['phone']}")
    
    doctor = User.objects.create_user(
        username=doctor_data['username'],
        email=doctor_data['email'],
        password=doctor_data['password'],
        name=doctor_data['name'],
        role=doctor_data['role'],
        phone=doctor_data['phone'],
        age=doctor_data['age'],
        gender=doctor_data['gender'],
        license_number=doctor_data['license_number'],
        department=doctor_data['department'],
        title=doctor_data['title'],
        specialization=doctor_data['specialization']
    )
    print(f"   ✅ 创建医生用户: {doctor.name} ({doctor.phone})")
    
    print("\n📊 测试用户数据创建完成!")
    print("=" * 50)
    print("🔐 登录信息:")
    print(f"   患者登录: 手机号 {patient_data['phone']}, 密码 {patient_data['password']}")
    print(f"   医生登录: 手机号 {doctor_data['phone']}, 密码 {doctor_data['password']}")
    print("=" * 50)

if __name__ == "__main__":
    create_test_users() 