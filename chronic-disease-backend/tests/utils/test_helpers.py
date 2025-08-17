"""
测试辅助工具函数
"""
import json
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()

def create_test_user(role='patient', **kwargs):
    """创建测试用户的辅助函数"""
    defaults = {
        'username': f'test_{role}_{timezone.now().timestamp()}',
        'email': f'test_{role}@example.com',
        'password': 'testpass123',
        'name': f'测试{role}',
        'role': role,
        'is_active': True,
        'is_verified': True
    }
    defaults.update(kwargs)
    
    password = defaults.pop('password')
    user = User.objects.create(**defaults)
    user.set_password(password)
    user.save()
    
    return user

def authenticate_user(api_client: APIClient, user: User):
    """为API客户端认证用户"""
    api_client.force_authenticate(user=user)
    return api_client

def create_health_metric_data(metric_type='blood_pressure', **kwargs):
    """创建健康指标测试数据"""
    base_data = {
        'measured_at': timezone.now().isoformat(),
        'note': '测试数据'
    }
    
    if metric_type == 'blood_pressure':
        base_data.update({
            'metric_type': 'blood_pressure',
            'systolic': 120,
            'diastolic': 80
        })
    elif metric_type == 'blood_glucose':
        base_data.update({
            'metric_type': 'blood_glucose',
            'blood_glucose': 5.5
        })
    elif metric_type == 'heart_rate':
        base_data.update({
            'metric_type': 'heart_rate',
            'heart_rate': 72
        })
    elif metric_type == 'weight':
        base_data.update({
            'metric_type': 'weight',
            'weight': 70.0
        })
    
    base_data.update(kwargs)
    return base_data

def create_medication_plan_data(**kwargs):
    """创建用药计划测试数据"""
    base_data = {
        'dosage': 100.0,
        'frequency': 'BID',
        'time_of_day': ['08:00', '20:00'],
        'start_date': date.today().isoformat(),
        'end_date': (date.today() + timedelta(days=30)).isoformat(),
        'special_instructions': '餐后服用',
        'status': 'active'
    }
    
    base_data.update(kwargs)
    return base_data

def create_message_data(message_type='text', **kwargs):
    """创建消息测试数据"""
    base_data = {
        'message_type': message_type,
        'priority': 'normal'
    }
    
    if message_type == 'text':
        base_data['content'] = '这是一条测试消息'
    elif message_type == 'image':
        base_data['content'] = '发送了一张图片'
    elif message_type == 'audio':
        base_data['content'] = '发送了一段语音'
    
    base_data.update(kwargs)
    return base_data

def assert_response_success(response, expected_status=200):
    """断言响应成功"""
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}. Response: {response.data}"

def assert_response_error(response, expected_status=400):
    """断言响应错误"""
    assert response.status_code == expected_status, f"Expected {expected_status}, got {response.status_code}. Response: {response.data}"

def assert_field_in_response(response, field_name):
    """断言响应中包含指定字段"""
    assert field_name in response.data, f"Field '{field_name}' not found in response: {response.data}"

def assert_field_value(response, field_name, expected_value):
    """断言响应中字段的值"""
    assert response.data[field_name] == expected_value, f"Expected {field_name}={expected_value}, got {response.data[field_name]}"

def assert_pagination_response(response):
    """断言分页响应格式"""
    assert 'count' in response.data
    assert 'next' in response.data
    assert 'previous' in response.data
    assert 'results' in response.data
    assert isinstance(response.data['results'], list)

def create_time_series_data(model_factory, days=7, **factory_kwargs):
    """创建时间序列测试数据"""
    objects = []
    for i in range(days):
        test_date = timezone.now() - timedelta(days=i)
        obj = model_factory(created_at=test_date, **factory_kwargs)
        objects.append(obj)
    return objects

def mock_datetime(target_datetime):
    """模拟日期时间的上下文管理器"""
    from unittest.mock import patch
    return patch('django.utils.timezone.now', return_value=target_datetime)

def extract_ids_from_response(response):
    """从响应中提取ID列表"""
    if 'results' in response.data:
        return [item['id'] for item in response.data['results']]
    elif isinstance(response.data, list):
        return [item['id'] for item in response.data]
    else:
        return [response.data['id']] if 'id' in response.data else []

def compare_dict_subset(actual, expected_subset):
    """比较字典子集"""
    for key, expected_value in expected_subset.items():
        assert key in actual, f"Key '{key}' not found in actual data"
        assert actual[key] == expected_value, f"Expected {key}={expected_value}, got {actual[key]}"

class TestDataMixin:
    """测试数据混入类"""
    
    @staticmethod
    def create_test_health_metrics(patient, count=5):
        """创建测试健康指标数据"""
        from tests.factories import HealthMetricFactory
        metrics = []
        for i in range(count):
            metric = HealthMetricFactory(
                patient=patient,
                measured_at=timezone.now() - timedelta(days=i)
            )
            metrics.append(metric)
        return metrics
    
    @staticmethod
    def create_test_medication_plans(patient, doctor, count=3):
        """创建测试用药计划"""
        from tests.factories import MedicationPlanFactory
        plans = []
        for i in range(count):
            plan = MedicationPlanFactory(
                patient=patient,
                doctor=doctor,
                start_date=date.today() - timedelta(days=i*10)
            )
            plans.append(plan)
        return plans
    
    @staticmethod
    def create_test_alerts(patient, doctor, count=3):
        """创建测试告警"""
        from tests.factories import AlertFactory
        alerts = []
        for i in range(count):
            alert = AlertFactory(
                patient=patient,
                assigned_doctor=doctor,
                created_at=timezone.now() - timedelta(hours=i)
            )
            alerts.append(alert)
        return alerts
