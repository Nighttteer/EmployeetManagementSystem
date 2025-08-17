"""
pytest配置文件 - 全局fixtures和测试配置
"""
import os
import pytest
import django
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, date
from rest_framework.test import APIClient

# 确保Django环境配置
def pytest_configure(config):
    """配置pytest和Django环境"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.test_settings')
    django.setup()

# ============= 基础Fixtures =============

@pytest.fixture
def user_model():
    """用户模型fixture"""
    return get_user_model()

@pytest.fixture
def api_client():
    """API客户端fixture"""
    return APIClient()

# ============= 用户相关Fixtures =============

@pytest.fixture
def admin_user(db, user_model):
    """管理员用户"""
    return user_model.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='testpass123',
        name='系统管理员',
        role='admin',
        phone='+8613800138000',
        is_staff=True,
        is_superuser=True
    )

@pytest.fixture
def doctor_user(db, user_model):
    """医生用户"""
    return user_model.objects.create_user(
        username='doctor01',
        email='doctor@test.com',
        password='testpass123',
        name='张医生',
        role='doctor',
        phone='+8613800138001',
        age=45,
        gender='male',
        license_number='DOC-2024-001',
        department='心内科',
        title='主任医师',
        specialization='高血压、糖尿病管理'
    )

@pytest.fixture
def patient_user(db, user_model):
    """患者用户"""
    return user_model.objects.create_user(
        username='patient01',
        email='patient@test.com',
        password='testpass123',
        name='李患者',
        role='patient',
        phone='+8613800138002',
        age=55,
        gender='female',
        height=165.0,
        blood_type='A',
        chronic_diseases=['hypertension', 'diabetes']
    )

@pytest.fixture
def patient_user_healthy(db, user_model):
    """健康的患者用户"""
    return user_model.objects.create_user(
        username='patient02',
        email='patient2@test.com',
        password='testpass123',
        name='王健康',
        role='patient',
        phone='+8613800138003',
        age=30,
        gender='male',
        height=175.0,
        blood_type='B',
        chronic_diseases=[]  # 无慢性疾病
    )

# ============= 认证客户端Fixtures =============

@pytest.fixture
def authenticated_admin_client(api_client, admin_user):
    """已认证的管理员API客户端"""
    api_client.force_authenticate(user=admin_user)
    return api_client

@pytest.fixture
def authenticated_doctor_client(api_client, doctor_user):
    """已认证的医生API客户端"""
    api_client.force_authenticate(user=doctor_user)
    return api_client

@pytest.fixture
def authenticated_patient_client(api_client, patient_user):
    """已认证的患者API客户端"""
    api_client.force_authenticate(user=patient_user)
    return api_client

# ============= 业务数据Fixtures =============

@pytest.fixture
def doctor_patient_relation(db, doctor_user, patient_user):
    """医患关系"""
    from health.models import DoctorPatientRelation
    return DoctorPatientRelation.objects.create(
        doctor=doctor_user,
        patient=patient_user,
        is_primary=True,
        status='active'
    )

@pytest.fixture
def sample_medication(db, doctor_user):
    """示例药品"""
    from medication.models import Medication
    return Medication.objects.create(
        name='阿司匹林肠溶片',
        unit='片',
        category='anticoagulant',
        generic_name='阿司匹林',
        brand_name='拜阿司匹林',
        specification='100mg/片',
        instructions='餐后服用，多饮水',
        created_by=doctor_user
    )

@pytest.fixture
def medication_plan(db, doctor_user, patient_user, sample_medication):
    """用药计划"""
    from medication.models import MedicationPlan
    return MedicationPlan.objects.create(
        patient=patient_user,
        doctor=doctor_user,
        medication=sample_medication,
        dosage=100.0,
        frequency='QD',
        time_of_day=['08:00'],
        start_date=date.today(),
        end_date=date.today() + timedelta(days=30),
        status='active'
    )

@pytest.fixture
def health_metric(db, patient_user, doctor_user):
    """健康指标记录"""
    from health.models import HealthMetric
    return HealthMetric.objects.create(
        patient=patient_user,
        measured_by=doctor_user,
        metric_type='blood_pressure',
        systolic=140,
        diastolic=90,
        measured_at=timezone.now(),
        note='门诊测量'
    )

@pytest.fixture
def alert(db, patient_user, doctor_user, health_metric):
    """健康告警"""
    from health.models import Alert
    return Alert.objects.create(
        patient=patient_user,
        assigned_doctor=doctor_user,
        alert_type='threshold_exceeded',
        title='血压异常告警',
        message='患者血压140/90，超出正常范围',
        related_metric=health_metric,
        priority='high'
    )

@pytest.fixture
def conversation(db, doctor_user, patient_user):
    """医患对话"""
    from communication.models import Conversation
    conversation = Conversation.objects.create(
        title='日常咨询',
        conversation_type='consultation',
        created_by=patient_user
    )
    conversation.participants.add(doctor_user, patient_user)
    return conversation

@pytest.fixture
def message(db, doctor_user, patient_user, conversation):
    """消息"""
    from communication.models import Message
    return Message.objects.create(
        sender=patient_user,
        recipient=doctor_user,
        conversation=conversation,
        message_type='text',
        content='医生您好，我想咨询一下血压的问题',
        priority='normal'
    )

# ============= 时间相关Fixtures =============

@pytest.fixture
def freeze_time():
    """冻结时间fixture - 用于时间相关测试"""
    from unittest.mock import patch
    with patch('django.utils.timezone.now') as mock_now:
        mock_now.return_value = timezone.make_aware(datetime(2024, 1, 15, 10, 0, 0))
        yield mock_now

# ============= 测试数据清理 =============

@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """
    为所有测试启用数据库访问
    避免需要在每个测试上添加@pytest.mark.django_db
    """
    pass

# ============= 测试标记配置 =============

def pytest_collection_modifyitems(config, items):
    """自动为测试添加标记"""
    for item in items:
        # 根据测试文件路径自动添加标记
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        
        # 根据测试名称添加功能标记
        if "auth" in item.name.lower():
            item.add_marker(pytest.mark.auth)
        elif "doctor" in item.name.lower():
            item.add_marker(pytest.mark.doctor)
        elif "patient" in item.name.lower():
            item.add_marker(pytest.mark.patient)
        elif "health" in item.name.lower():
            item.add_marker(pytest.mark.health)
        elif "medication" in item.name.lower():
            item.add_marker(pytest.mark.medication)
        elif "communication" in item.name.lower():
            item.add_marker(pytest.mark.communication)
        elif "alert" in item.name.lower():
            item.add_marker(pytest.mark.alert)
