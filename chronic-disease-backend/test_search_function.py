#!/usr/bin/env python3
"""
快速测试用户搜索功能
"""
import os
import django
from django.test import Client
import json

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User

def test_search_functionality():
    """测试搜索功能"""
    print("🔍 测试用户搜索功能...")
    
    # 1. 检查用户数据
    print("\n1. 检查用户数据:")
    doctors = User.objects.filter(role='doctor', is_active=True)
    patients = User.objects.filter(role='patient', is_active=True)
    
    print(f"   活跃医生数量: {doctors.count()}")
    print(f"   活跃患者数量: {patients.count()}")
    
    if doctors.count() == 0 or patients.count() == 0:
        print("   ⚠️  没有足够的测试用户，正在创建...")
        create_test_users()
        doctors = User.objects.filter(role='doctor', is_active=True)
        patients = User.objects.filter(role='patient', is_active=True)
    
    # 显示用户列表
    print("\n   医生列表:")
    for doctor in doctors:
        print(f"     - {doctor.name} ({doctor.phone})")
    
    print("\n   患者列表:")
    for patient in patients:
        print(f"     - {patient.name} ({patient.phone})")
    
    # 2. 测试搜索API
    print("\n2. 测试搜索API:")
    client = Client()
    
    # 测试患者搜索医生
    if patients.exists():
        patient = patients.first()
        client.force_login(patient)
        
        # 测试各种搜索词
        search_terms = ['李', '医生', '13800138001', '+86138']
        
        for term in search_terms:
            print(f"\n   患者搜索 '{term}':")
            response = client.get('/api/communication/users/search/', {'search': term})
            print(f"     状态码: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = json.loads(response.content)
                    print(f"     结果数量: {len(data)}")
                    for user in data:
                        print(f"       - {user['name']} ({user.get('phone', 'N/A')})")
                except:
                    print(f"     响应内容: {response.content}")
            else:
                print(f"     错误: {response.content}")
    
    # 测试医生搜索患者
    if doctors.exists():
        doctor = doctors.first()
        client.force_login(doctor)
        
        # 测试各种搜索词
        search_terms = ['张', '患者', '13800138000', '+86138']
        
        for term in search_terms:
            print(f"\n   医生搜索 '{term}':")
            response = client.get('/api/communication/users/search/', {'search': term})
            print(f"     状态码: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = json.loads(response.content)
                    print(f"     结果数量: {len(data)}")
                    for user in data:
                        print(f"       - {user['name']} ({user.get('phone', 'N/A')})")
                except:
                    print(f"     响应内容: {response.content}")
            else:
                print(f"     错误: {response.content}")
    
    print("\n✅ 搜索功能测试完成！")

def create_test_users():
    """创建基本测试用户"""
    print("创建测试用户...")
    
    # 创建医生
    if not User.objects.filter(phone='+8613800138001').exists():
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
            specialization='心血管疾病',
            is_active=True
        )
        print(f"✅ 创建医生: {doctor.name} ({doctor.phone})")
    
    # 创建患者
    if not User.objects.filter(phone='+8613800138000').exists():
        patient = User.objects.create_user(
            username='patient01',
            email='patient@test.com',
            password='123456',
            name='张三',
            role='patient',
            phone='+8613800138000',
            age=45,
            gender='male',
            height=175.0,
            blood_type='A+',
            is_active=True
        )
        print(f"✅ 创建患者: {patient.name} ({patient.phone})")
    
    # 创建更多测试用户
    users_to_create = [
        {
            'username': 'patient02',
            'email': 'patient2@test.com',
            'password': '123456',
            'name': '李四',
            'role': 'patient',
            'phone': '+8613800138002',
            'age': 38,
            'gender': 'female',
            'height': 165.0,
            'blood_type': 'B+',
            'is_active': True
        },
        {
            'username': 'doctor02',
            'email': 'doctor2@test.com',
            'password': '123456',
            'name': '王医生',
            'role': 'doctor',
            'phone': '+8613800138011',
            'age': 42,
            'gender': 'male',
            'license_number': 'DOC002',
            'department': '心内科',
            'title': '副主任医师',
            'specialization': '心血管疾病',
            'is_active': True
        },
    ]
    
    for user_data in users_to_create:
        if not User.objects.filter(phone=user_data['phone']).exists():
            user = User.objects.create_user(**user_data)
            print(f"✅ 创建用户: {user.name} ({user.phone}) - {user.role}")

if __name__ == '__main__':
    test_search_functionality() 