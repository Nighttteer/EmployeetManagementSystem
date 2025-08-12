#!/usr/bin/env python
"""
快速修复用户密码脚本
"""
import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User

def fix_user_password():
    """修复测试用户密码"""
    try:
        # 查找用户
        user = User.objects.get(phone='+8613800138001')
        print(f"找到用户: {user.name} ({user.role})")
        
        # 重置密码
        user.set_password('test123456')
        user.save()
        
        # 验证密码
        if user.check_password('test123456'):
            print("✅ 密码重置成功！")
            print(f"用户信息:")
            print(f"  - 姓名: {user.name}")
            print(f"  - 手机: {user.phone}")
            print(f"  - 角色: {user.role}")
            print(f"  - 用户名: {user.username}")
            print(f"  - 邮箱: {user.email}")
            print(f"  - 激活状态: {user.is_active}")
            print(f"  - 新密码: test123456")
        else:
            print("❌ 密码重置失败")
            
    except User.DoesNotExist:
        print("❌ 用户不存在")
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == '__main__':
    fix_user_password()
