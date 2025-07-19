#!/usr/bin/env python
import os
import sys
import django

# 配置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User

def check_users():
    print("=== 检查用户数据 ===")
    
    # 获取所有用户
    users = User.objects.all()
    print(f"数据库中总用户数: {users.count()}")
    
    # 按角色分组
    doctors = User.objects.filter(role='doctor')
    patients = User.objects.filter(role='patient')
    
    print(f"医生用户数: {doctors.count()}")
    print(f"患者用户数: {patients.count()}")
    
    print("\n=== 所有用户列表 ===")
    for user in users:
        print(f"ID: {user.id}")
        print(f"  姓名: {user.name}")
        print(f"  用户名: {user.username}")
        print(f"  手机: {user.phone}")
        print(f"  角色: {user.role}")
        print(f"  是否激活: {user.is_active}")
        print("-" * 30)
    
    print("\n=== 搜索测试 ===")
    # 测试搜索"张"
    zhang_users = User.objects.filter(name__icontains='张')
    print(f"包含'张'的用户: {zhang_users.count()}")
    for user in zhang_users:
        print(f"  - {user.name} ({user.role})")
    
    # 测试搜索"李"
    li_users = User.objects.filter(name__icontains='李')
    print(f"包含'李'的用户: {li_users.count()}")
    for user in li_users:
        print(f"  - {user.name} ({user.role})")
    
    # 测试搜索手机号
    phone_users = User.objects.filter(phone__icontains='138')
    print(f"包含'138'的用户: {phone_users.count()}")
    for user in phone_users:
        print(f"  - {user.name} ({user.phone}) ({user.role})")

if __name__ == '__main__':
    check_users() 