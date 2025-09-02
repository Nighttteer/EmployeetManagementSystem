"""
pytest配置文件 - 设置Django测试环境
"""
import os
import sys
import django
import pytest
from django.conf import settings

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

# 导入Django测试工具
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

@pytest.fixture
def api_client():
    """创建API客户端"""
    return APIClient()

@pytest.fixture
def test_doctor(db):
    """创建测试医生用户"""
    user = User.objects.create_user(
        username='test_doctor',
        phone='13800138001',
        password='testpass123',
        role='doctor',
        name='测试医生',
        email='doctor@test.com'
    )
    return user

@pytest.fixture
def test_patient(db):
    """创建测试病人用户"""
    user = User.objects.create_user(
        username='test_patient',
        phone='13800138002',
        password='testpass123',
        role='patient',
        name='测试病人',
        email='patient@test.com'
    )
    return user

@pytest.fixture
def authenticated_doctor_client(test_doctor):
    """创建已认证的医生客户端（独立实例，避免与其他客户端共享状态）"""
    client = APIClient()
    client.force_authenticate(user=test_doctor)
    return client

@pytest.fixture
def authenticated_patient_client(test_patient):
    """创建已认证的病人客户端（独立实例，避免与其他客户端共享状态）"""
    client = APIClient()
    client.force_authenticate(user=test_patient)
    return client

@pytest.fixture
def doctor_token(test_doctor):
    """生成医生JWT令牌"""
    refresh = RefreshToken.for_user(test_doctor)
    return str(refresh.access_token)

@pytest.fixture
def patient_token(test_patient):
    """生成病人JWT令牌"""
    refresh = RefreshToken.for_user(test_patient)
    return str(refresh.access_token)
