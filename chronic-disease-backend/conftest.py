"""
pytest配置文件 - 简化版本
避免Django测试环境冲突
"""
import os
import django
from django.conf import settings

def pytest_configure():
    """配置pytest和Django环境"""
    # 设置Django测试设置模块
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.test_settings')
    
    # 配置Django (只配置一次)
    if not settings.configured:
        django.setup()

# 全局fixtures
import pytest
from django.contrib.auth import get_user_model

@pytest.fixture
def user_model():
    """用户模型fixture"""
    return get_user_model()

@pytest.fixture
def test_doctor(db, user_model):
    """测试医生用户"""
    return user_model.objects.create_user(
        username='test_doctor',
        email='doctor@test.com',
        password='testpass123',
        name='测试医生',
        role='doctor',
        phone='+8613800138001',
        license_number='DOC-2024-001',
        department='心内科'
    )

@pytest.fixture
def test_patient(db, user_model):
    """测试病人用户"""
    return user_model.objects.create_user(
        username='test_patient',
        email='patient@test.com', 
        password='testpass123',
        name='测试病人',
        role='patient',
        phone='+8613800138002',
        age=35,
        chronic_diseases=['hypertension']
    )

@pytest.fixture
def api_client():
    """API客户端fixture"""
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def authenticated_doctor_client(api_client, test_doctor):
    """已认证的医生API客户端"""
    api_client.force_authenticate(user=test_doctor)
    return api_client

@pytest.fixture
def authenticated_patient_client(api_client, test_patient):
    """已认证的病人API客户端"""
    api_client.force_authenticate(user=test_patient)
    return api_client