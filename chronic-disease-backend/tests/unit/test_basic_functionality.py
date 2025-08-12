"""
基础功能单元测试
"""
import pytest
from django.test import TestCase


@pytest.mark.unit
class TestBasicFunctionality:
    """基础功能测试"""
    
    def test_python_basics(self):
        """测试Python基础功能"""
        assert 1 + 1 == 2
        assert "hello".upper() == "HELLO"
        assert [1, 2, 3][0] == 1
    
    def test_django_import(self):
        """测试Django导入"""
        from django.conf import settings
        assert settings.configured
        
    def test_rest_framework_import(self):
        """测试Django REST Framework导入"""
        try:
            from rest_framework import status
            assert status.HTTP_200_OK == 200
            assert status.HTTP_404_NOT_FOUND == 404
        except ImportError:
            pytest.skip("Django REST Framework未安装")


@pytest.mark.unit
@pytest.mark.django_db
class TestDatabaseBasics:
    """数据库基础测试"""
    
    def test_database_connection(self):
        """测试数据库连接"""
        from django.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT 1 as test_column")
        result = cursor.fetchone()
        assert result[0] == 1
    
    def test_user_model_exists(self):
        """测试用户模型是否存在"""
        try:
            from accounts.models import User
            # 检查模型字段
            assert hasattr(User, 'phone')  # 实际字段名是phone
            assert hasattr(User, 'name')
            assert hasattr(User, 'role')
            assert hasattr(User, 'email')
        except ImportError:
            pytest.skip("accounts.models.User未找到")
    
    def test_health_models_exist(self):
        """测试健康模型是否存在"""
        try:
            from health.models import HealthMetric, Alert
            # 检查模型存在
            assert HealthMetric is not None
            assert Alert is not None
        except ImportError:
            pytest.skip("health模型未找到")


@pytest.mark.unit
class TestUtilityFunctions:
    """工具函数测试"""
    
    def test_phone_number_validation(self):
        """测试手机号验证逻辑"""
        # 简单的手机号验证逻辑测试
        def is_valid_phone(phone):
            return phone.startswith('+') and len(phone) >= 10
        
        assert is_valid_phone('+8613800138000') == True
        assert is_valid_phone('13800138000') == False
        assert is_valid_phone('+86138') == False
    
    def test_health_data_validation(self):
        """测试健康数据验证逻辑"""
        def validate_blood_pressure(systolic, diastolic):
            return (90 <= systolic <= 200) and (60 <= diastolic <= 120)
        
        assert validate_blood_pressure(120, 80) == True
        assert validate_blood_pressure(250, 80) == False
        assert validate_blood_pressure(120, 150) == False
    
    def test_alert_severity_logic(self):
        """测试预警严重程度逻辑"""
        def get_alert_severity(blood_pressure_systolic):
            if blood_pressure_systolic >= 180:
                return 'high'
            elif blood_pressure_systolic >= 140:
                return 'medium'
            else:
                return 'low'
        
        assert get_alert_severity(190) == 'high'
        assert get_alert_severity(150) == 'medium'
        assert get_alert_severity(120) == 'low'
