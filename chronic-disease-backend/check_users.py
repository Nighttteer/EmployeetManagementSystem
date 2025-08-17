#!/usr/bin/env python
import os
import sys
import django

# 配置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User

def check_users():
    # 获取所有用户
    users = User.objects.all()
    
    # 按角色分组
    doctors = User.objects.filter(role='doctor')
    patients = User.objects.filter(role='patient')
    
    # 测试搜索"张"
    zhang_users = User.objects.filter(name__icontains='张')
    
    # 测试搜索"李"
    li_users = User.objects.filter(name__icontains='李')
    
    # 测试搜索手机号
    phone_users = User.objects.filter(phone__icontains='138')

if __name__ == '__main__':
    check_users() 