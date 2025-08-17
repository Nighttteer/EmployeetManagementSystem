#!/usr/bin/env python
"""
测试验证脚本
验证测试框架是否正确设置
"""
import os
import sys
import django
from pathlib import Path

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.test_settings')
django.setup()

def check_test_structure():
    """检查测试目录结构"""
    print("检查测试目录结构...")
    
    required_dirs = [
        'tests',
        'tests/unit',
        'tests/integration', 
        'tests/factories',
        'tests/utils'
    ]
    
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            print(f"✓ {dir_path}")
        else:
            print(f"✗ {dir_path} - 缺失")
            return False
    
    return True

def check_test_files():
    """检查测试文件"""
    print("\n检查测试文件...")
    
    required_files = [
        'tests/conftest.py',
        'tests/__init__.py',
        'tests/unit/test_accounts.py',
        'tests/unit/test_health.py',
        'tests/unit/test_medication.py',
        'tests/unit/test_communication.py',
        'tests/integration/test_api_auth.py',
        'tests/integration/test_health_workflow.py',
        'tests/factories/user_factories.py',
        'tests/factories/health_factories.py',
        'tests/factories/medication_factories.py',
        'tests/factories/communication_factories.py',
        'tests/utils/test_helpers.py'
    ]
    
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✓ {file_path}")
        else:
            print(f"✗ {file_path} - 缺失")
            return False
    
    return True

def check_imports():
    """检查关键导入"""
    print("\n检查关键导入...")
    
    try:
        import pytest
        print("✓ pytest")
    except ImportError:
        print("✗ pytest - 未安装")
        return False
    
    try:
        import factory
        print("✓ factory_boy")
    except ImportError:
        print("✗ factory_boy - 未安装")
        return False
    
    try:
        from rest_framework.test import APIClient
        print("✓ DRF APIClient")
    except ImportError:
        print("✗ Django REST Framework - 未安装")
        return False
    
    return True

def check_factories():
    """检查数据工厂"""
    print("\n检查数据工厂...")
    
    try:
        from tests.factories import UserFactory, DoctorFactory, PatientFactory
        print("✓ 用户工厂")
        
        from tests.factories import HealthMetricFactory, AlertFactory
        print("✓ 健康数据工厂")
        
        from tests.factories import MedicationFactory, MedicationPlanFactory
        print("✓ 用药管理工厂")
        
        from tests.factories import MessageFactory, ConversationFactory
        print("✓ 沟通工厂")
        
        return True
    except ImportError as e:
        print(f"✗ 工厂导入失败: {e}")
        return False

def check_fixtures():
    """检查fixtures"""
    print("\n检查fixtures...")
    
    try:
        from tests.conftest import (
            user_model, api_client, 
            doctor_user, patient_user,
            authenticated_doctor_client, authenticated_patient_client
        )
        print("✓ 基础fixtures")
        return True
    except ImportError as e:
        print(f"✗ fixtures导入失败: {e}")
        return False

def run_sample_test():
    """运行示例测试"""
    print("\n运行示例测试...")
    
    try:
        from tests.factories import UserFactory
        
        # 创建测试用户
        user = UserFactory()
        print(f"✓ 创建测试用户: {user.name}")
        
        # 测试用户属性
        assert user.email is not None
        assert user.role in ['patient', 'doctor', 'admin']
        print("✓ 用户属性验证通过")
        
        return True
    except Exception as e:
        print(f"✗ 示例测试失败: {e}")
        return False

def main():
    """主函数"""
    print("=" * 50)
    print("慢性病管理系统测试框架验证")
    print("=" * 50)
    
    checks = [
        check_test_structure,
        check_test_files,
        check_imports,
        check_factories,
        check_fixtures,
        run_sample_test
    ]
    
    all_passed = True
    for check in checks:
        if not check():
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("✓ 所有检查通过！测试框架设置正确。")
        print("\n可以开始运行测试了:")
        print("  pytest                    # 运行所有测试")
        print("  python run_tests.py       # 使用测试脚本")
        print("  pytest -m unit           # 只运行单元测试")
        print("  pytest --coverage        # 生成覆盖率报告")
    else:
        print("✗ 有检查失败，请修复后重试。")
        return 1
    
    print("=" * 50)
    return 0

if __name__ == '__main__':
    sys.exit(main())
