"""
pytest配置文件
"""
import os
import sys
import pytest
import django
from django.conf import settings
from django.test import TestCase
from django.core.management import call_command
from django.db import transaction

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')

# 确保项目根目录在Python路径中
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Django设置
django.setup()

# 在Django设置完成后导入DRF组件
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

@pytest.fixture(scope='session')
def django_db_setup():
    """数据库设置"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }

@pytest.fixture
def api_client():
    """API客户端"""
    return APIClient()

@pytest.fixture
def authenticated_client(api_client, test_user):
    """已认证的API客户端"""
    refresh = RefreshToken.for_user(test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client

@pytest.fixture
def test_user():
    """测试用户"""
    from accounts.models import User
    return User.objects.create_user(
        username='testuser',
        email='testuser@example.com',
        name='测试用户',
        phone='+8613800138000',
        role='patient',
        chronic_diseases=['diabetes']
    )

@pytest.fixture
def test_doctor():
    """测试医生"""
    from accounts.models import User
    return User.objects.create_user(
        username='testdoctor',
        email='testdoctor@example.com',
        name='测试医生',
        phone='+8613800138001',
        role='doctor'
    )

@pytest.fixture
def test_patient():
    """测试患者"""
    from accounts.models import User
    return User.objects.create_user(
        username='testpatient',
        email='testpatient@example.com',
        name='测试患者',
        phone='+8613800138002',
        role='patient',
        chronic_diseases=['hypertension']
    )

@pytest.fixture
def doctor_patient_relation(test_doctor, test_patient):
    """医患关系"""
    from health.models import DoctorPatientRelation
    return DoctorPatientRelation.objects.create(
        doctor=test_doctor,
        patient=test_patient,
        risk_level='medium'
    )
