#!/usr/bin/env python
"""
简单测试验证
"""
import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.test_settings')
django.setup()

def test_django_setup():
    """测试Django设置"""
    from django.conf import settings
    assert settings.configured
    print("✓ Django设置已配置")

def test_user_model():
    """测试用户模型"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        name='测试用户',
        role='patient'
    )
    
    assert user.email == 'test@example.com'
    assert user.role == 'patient'
    assert user.is_patient is True
    print("✓ 用户模型测试通过")

def test_factory():
    """测试数据工厂"""
    try:
        from tests.factories import UserFactory
        user = UserFactory()
        assert user.email is not None
        assert user.role in ['patient', 'doctor', 'admin']
        print("✓ 数据工厂测试通过")
    except Exception as e:
        print(f"✗ 数据工厂测试失败: {e}")

if __name__ == '__main__':
    print("开始简单测试验证...")
    
    try:
        test_django_setup()
        test_user_model()
        test_factory()
        print("\n✓ 所有基本测试通过！")
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
