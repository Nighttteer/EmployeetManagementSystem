#!/usr/bin/env python3
"""
手动创建基本测试用户
"""
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User

def create_basic_users():
    """创建基本的测试用户"""
    print("创建基本测试用户...")
    
    # 创建一个测试医生
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
            specialization='心血管疾病'
        )
        print(f"✅ 创建医生: {doctor.name} ({doctor.phone})")
    
    # 创建几个测试患者
    patients = [
        {
            'username': 'patient01',
            'email': 'patient1@test.com',
            'password': '123456',
            'name': '张三',
            'role': 'patient',
            'phone': '+8613800138000',
            'age': 45,
            'gender': 'male',
            'height': 175.0,
            'blood_type': 'A+',
        },
        {
            'username': 'patient02',
            'email': 'patient2@test.com',
            'password': '123456',
            'name': '李四',
            'role': 'patient',
            'phone': '+8613800138002',
            'age': 52,
            'gender': 'female',
            'height': 162.0,
            'blood_type': 'B+',
        },
        {
            'username': 'patient03',
            'email': 'patient3@test.com',
            'password': '123456',
            'name': '王五',
            'role': 'patient',
            'phone': '+8613800138003',
            'age': 38,
            'gender': 'male',
            'height': 178.0,
            'blood_type': 'O+',
        }
    ]
    
    for patient_data in patients:
        if not User.objects.filter(phone=patient_data['phone']).exists():
            patient = User.objects.create_user(**patient_data)
            print(f"✅ 创建患者: {patient.name} ({patient.phone})")
    
    print("\n✅ 基本测试用户创建完成！")
    print("登录信息:")
    print("医生: +8613800138001 / 123456")
    print("患者: +8613800138000 / 123456")
    print("患者: +8613800138002 / 123456")
    print("患者: +8613800138003 / 123456")

if __name__ == '__main__':
    create_basic_users() 