#!/usr/bin/env python
"""
重置医生密码的快速脚本
"""
import os
import sys

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')

import django
django.setup()

from accounts.models import User

def reset_doctor_password():
    """重置医生密码"""
    
    try:
        # 获取医生用户
        doctor = User.objects.get(phone='+8613800138001')
        
        # 设置新密码
        new_password = '123456'
        doctor.set_password(new_password)
        doctor.save()
        
        print(f"✓ 医生密码已重置")
        print(f"医生: {doctor.name} ({doctor.phone})")
        print(f"角色: {doctor.role}")
        print(f"新密码: {new_password}")
        
        # 验证密码
        if doctor.check_password(new_password):
            print("✓ 密码验证成功")
        else:
            print("✗ 密码验证失败")
            
    except User.DoesNotExist:
        print("✗ 医生用户不存在")
    except Exception as e:
        print(f"✗ 重置密码失败: {e}")

if __name__ == '__main__':
    reset_doctor_password() 