#!/usr/bin/env python
"""
国际化手机号功能测试脚本
"""
import os
import sys
import django
from django.conf import settings

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.serializers import UserRegistrationSerializer
from accounts.models import User


def test_international_phone_validation():
    """测试国际化手机号验证"""
    
    print("🧪 测试国际化手机号验证功能...")
    print("=" * 50)
    
    # 测试数据
    test_cases = [
        # 格式：(手机号, 是否应该有效, 描述)
        ("+8613800138000", True, "中国手机号"),
        ("+12025551234", True, "美国手机号"),
        ("+447700123456", True, "英国手机号"),
        ("+8109012345678", True, "日本手机号"),
        ("+6581234567", True, "新加坡手机号"),
        ("13800138000", False, "缺少国家区号"),
        ("+86", False, "只有区号没有号码"),
        ("+86138001380001234", False, "号码过长"),
        ("+86138ab138000", False, "包含非数字字符"),
        ("++8613800138000", False, "多个+号"),
        ("+1234", False, "号码过短"),
    ]
    
    success_count = 0
    total_count = len(test_cases)
    
    for phone, should_be_valid, description in test_cases:
        print(f"\n📱 测试：{description}")
        print(f"   手机号：{phone}")
        
        # 创建测试数据
        test_data = {
            'username': f'testuser_{phone.replace("+", "").replace(" ", "")}',
            'email': f'test_{phone.replace("+", "").replace(" ", "")}@example.com',
            'name': '测试用户',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'phone': phone,
            'role': 'patient',
            'age': 30,
            'gender': 'male'
        }
        
        serializer = UserRegistrationSerializer(data=test_data)
        is_valid = serializer.is_valid()
        
        if is_valid == should_be_valid:
            print(f"   ✅ 通过：验证结果符合预期")
            success_count += 1
        else:
            print(f"   ❌ 失败：验证结果不符合预期")
            if not is_valid:
                print(f"   错误信息：{serializer.errors}")
    
    print(f"\n" + "=" * 50)
    print(f"📊 测试结果：{success_count}/{total_count} 测试通过")
    
    if success_count == total_count:
        print("🎉 所有测试通过！")
        return True
    else:
        print("⚠️  部分测试失败")
        return False


def test_phone_uniqueness():
    """测试手机号唯一性"""
    
    print("\n🔒 测试手机号唯一性...")
    print("=" * 50)
    
    # 清理测试数据
    User.objects.filter(username__startswith='testuser_unique').delete()
    
    test_phone = "+8613900139000"
    
    # 第一次创建用户
    test_data_1 = {
        'username': 'testuser_unique_1',
        'email': 'test_unique_1@example.com',
        'name': '测试用户1',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
        'phone': test_phone,
        'role': 'patient',
        'age': 30,
        'gender': 'male'
    }
    
    serializer_1 = UserRegistrationSerializer(data=test_data_1)
    if serializer_1.is_valid():
        user_1 = serializer_1.save()
        print(f"✅ 第一个用户创建成功：{user_1.username}")
    else:
        print(f"❌ 第一个用户创建失败：{serializer_1.errors}")
        return False
    
    # 第二次使用相同手机号创建用户
    test_data_2 = {
        'username': 'testuser_unique_2',
        'email': 'test_unique_2@example.com',
        'name': '测试用户2',
        'password': 'testpass123',
        'password_confirm': 'testpass123',
        'phone': test_phone,  # 相同的手机号
        'role': 'patient',
        'age': 25,
        'gender': 'female'
    }
    
    serializer_2 = UserRegistrationSerializer(data=test_data_2)
    if not serializer_2.is_valid():
        if 'phone' in serializer_2.errors:
            print(f"✅ 手机号唯一性验证通过：{serializer_2.errors['phone'][0]}")
            
            # 清理测试数据
            user_1.delete()
            return True
        else:
            print(f"❌ 手机号唯一性验证失败：应该有phone字段错误")
            user_1.delete()
            return False
    else:
        print(f"❌ 手机号唯一性验证失败：应该验证失败但实际通过了")
        user_1.delete()
        return False


def main():
    """主函数"""
    print("🏥 慢性病管理系统 - 国际化手机号功能测试")
    print("=" * 60)
    
    test_results = []
    
    # 运行测试
    test_results.append(test_international_phone_validation())
    test_results.append(test_phone_uniqueness())
    
    # 总结
    print("\n" + "=" * 60)
    print("📋 测试总结")
    print("=" * 60)
    
    passed_tests = sum(test_results)
    total_tests = len(test_results)
    
    print(f"总测试数：{total_tests}")
    print(f"通过测试：{passed_tests}")
    print(f"失败测试：{total_tests - passed_tests}")
    
    if passed_tests == total_tests:
        print("\n🎉 所有功能测试通过！国际化手机号功能正常工作。")
        return True
    else:
        print("\n⚠️  部分功能测试失败，请检查实现。")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 