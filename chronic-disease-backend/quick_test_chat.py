#!/usr/bin/env python3
"""
快速测试聊天功能
"""
import os
import django
import requests
import json

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from django.test import Client

def test_chat_functionality():
    """快速测试聊天功能"""
    print("🔧 开始测试聊天功能...")
    
    # 1. 检查用户数据
    print("\n1. 检查用户数据:")
    doctors = User.objects.filter(role='doctor')
    patients = User.objects.filter(role='patient')
    
    print(f"   医生数量: {doctors.count()}")
    print(f"   患者数量: {patients.count()}")
    
    for doctor in doctors:
        print(f"   医生: {doctor.name} ({doctor.phone})")
    
    for patient in patients:
        print(f"   患者: {patient.name} ({patient.phone})")
    
    # 2. 创建基本用户（如果没有）
    if doctors.count() == 0:
        print("\n2. 创建测试医生...")
        doctor = User.objects.create_user(
            username='doctor01',
            email='doctor@test.com',
            password='123456',
            name='李医生',
            role='doctor',
            phone='+8613800138001',
            age=35,
            gender='female',
            license_number='DOC001',
            department='内科',
            title='主治医师',
            specialization='心血管疾病'
        )
        print(f"   ✅ 创建医生: {doctor.name} ({doctor.phone})")
    
    if patients.count() == 0:
        print("\n3. 创建测试患者...")
        patient = User.objects.create_user(
            username='patient01',
            email='patient1@test.com',
            password='123456',
            name='张三',
            role='patient',
            phone='+8613800138000',
            age=45,
            gender='male',
            height=175.0,
            blood_type='A+',
        )
        print(f"   ✅ 创建患者: {patient.name} ({patient.phone})")
    
    # 3. 测试API
    print("\n4. 测试搜索API:")
    client = Client()
    
    # 模拟医生登录
    doctor = User.objects.filter(role='doctor').first()
    if doctor:
        client.force_login(doctor)
        
        # 测试搜索患者
        response = client.get('/api/communication/users/search/', {'search': '张'})
        print(f"   医生搜索患者 - 状态码: {response.status_code}")
        if response.status_code == 200:
            data = json.loads(response.content)
            print(f"   搜索结果: {len(data)} 个用户")
            for user in data:
                print(f"     - {user['name']} ({user['role']})")
        else:
            print(f"   错误: {response.content}")
    
    # 模拟患者登录
    patient = User.objects.filter(role='patient').first()
    if patient:
        client.force_login(patient)
        
        # 测试搜索医生
        response = client.get('/api/communication/users/search/', {'search': '李'})
        print(f"   患者搜索医生 - 状态码: {response.status_code}")
        if response.status_code == 200:
            data = json.loads(response.content)
            print(f"   搜索结果: {len(data)} 个用户")
            for user in data:
                print(f"     - {user['name']} ({user['role']})")
        else:
            print(f"   错误: {response.content}")
    
    print("\n✅ 测试完成！")
    print("\n📋 使用说明:")
    print("1. 启动后端服务: python manage.py runserver")
    print("2. 启动前端应用: npm start")
    print("3. 登录测试账户:")
    print("   - 医生: +8613800138001 / 123456")
    print("   - 患者: +8613800138000 / 123456")
    print("4. 在前端测试搜索功能")

if __name__ == '__main__':
    test_chat_functionality() 