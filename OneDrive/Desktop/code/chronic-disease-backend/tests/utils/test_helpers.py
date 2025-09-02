"""
测试辅助工具函数
提供常用的测试数据创建和验证功能
"""
import random
from datetime import datetime, timedelta
from django.contrib.auth import get_user_model
from health.models import HealthMetric, ThresholdSetting
from medication.models import Medication, MedicationPlan
from communication.models import Conversation

User = get_user_model()

class TestDataFactory:
    """测试数据工厂类"""
    
    @staticmethod
    def create_test_user(role='patient', **kwargs):
        """创建测试用户"""
        phone = f"13800138{random.randint(100, 999)}"
        username = f"test_{role}_{random.randint(100, 999)}"
        
        user_data = {
            'username': username,
            'phone': phone,
            'password': 'testpass123',
            'role': role,
            'name': f'测试{role}',
            'email': f'{username}@test.com'
        }
        user_data.update(kwargs)
        
        return User.objects.create_user(**user_data)
    
    @staticmethod
    def create_test_medication(**kwargs):
        """创建测试药品"""
        medication_data = {
            'name': f'测试药品{random.randint(100, 999)}',
            'category': 'antihypertensive',
            'unit': 'mg',
            'specification': '10mg/片'
        }
        medication_data.update(kwargs)
        
        return Medication.objects.create(**medication_data)
    
    @staticmethod
    def create_test_medication_plan(doctor, patient, medication, **kwargs):
        """创建测试用药计划"""
        plan_data = {
            'medication': medication,
            'patient': patient,
            'doctor': doctor,
            'dosage': 10.0,
            'frequency': 'BID',
            'time_of_day': ['08:00', '20:00'],
            'start_date': datetime.now().date(),
            'end_date': (datetime.now() + timedelta(days=30)).date(),
            'special_instructions': '饭后服用'
        }
        plan_data.update(kwargs)
        
        return MedicationPlan.objects.create(**plan_data)
    
    @staticmethod
    def create_test_health_metric(patient, **kwargs):
        """创建测试健康指标"""
        metric_data = {
            'patient': patient,
            'metric_type': 'blood_pressure',
            'systolic': 120,
            'diastolic': 80,
            'measured_at': datetime.now()
        }
        metric_data.update(kwargs)
        
        return HealthMetric.objects.create(**metric_data)
    
    @staticmethod
    def create_test_threshold_setting(**kwargs):
        """创建测试阈值设置"""
        rule_data = {
            'metric_type': 'blood_pressure',
            'min_value': 90,
            'max_value': 140,
            'name': '血压阈值',
            'description': '测试用血压阈值'
        }
        rule_data.update(kwargs)
        
        return ThresholdSetting.objects.create(**rule_data)
    
    @staticmethod
    def create_test_conversation(patient, doctor, **kwargs):
        """创建测试对话"""
        conversation_data = {
            'title': f'测试对话{random.randint(100, 999)}'
        }
        conversation_data.update(kwargs)
        
        conversation = Conversation.objects.create(**conversation_data)
        conversation.participants.add(patient, doctor)
        return conversation

class TestAssertions:
    """测试断言辅助类"""
    
    @staticmethod
    def assert_user_has_role(user, expected_role):
        """断言用户具有指定角色"""
        assert user.role == expected_role, f"用户角色应该是 {expected_role}，实际是 {user.role}"
    
    @staticmethod
    def assert_health_metric_in_range(metric, min_value, max_value):
        """断言健康指标在指定范围内"""
        if hasattr(metric, 'systolic') and hasattr(metric, 'diastolic'):
            # 血压指标
            assert min_value <= metric.systolic <= max_value, f"收缩压应该在 {min_value}-{max_value} 范围内"
            assert min_value <= metric.diastolic <= max_value, f"舒张压应该在 {min_value}-{max_value} 范围内"
        elif hasattr(metric, 'blood_glucose'):
            # 血糖指标
            assert min_value <= metric.blood_glucose <= max_value, f"血糖应该在 {min_value}-{max_value} 范围内"
        elif hasattr(metric, 'heart_rate'):
            # 心率指标
            assert min_value <= metric.heart_rate <= max_value, f"心率应该在 {min_value}-{max_value} 范围内"
    
    @staticmethod
    def assert_medication_plan_valid(plan):
        """断言用药计划有效"""
        assert plan.medication is not None, "用药计划必须有药品"
        assert plan.patient is not None, "用药计划必须有病人"
        assert plan.doctor is not None, "用药计划必须有医生"
        assert plan.dosage, "用药计划必须有剂量"
        assert plan.frequency, "用药计划必须有频次"
        assert plan.time_of_day, "用药计划必须有时间安排"
        assert plan.start_date, "用药计划必须有开始日期"
    
    @staticmethod
    def assert_message_valid(message):
        """断言消息有效"""
        assert message.sender is not None, "消息必须有发送者"
        assert message.conversation is not None, "消息必须有对话"
        assert message.content, "消息必须有内容"
        assert message.message_type, "消息必须有类型"

class TestDataCleanup:
    """测试数据清理类"""
    
    @staticmethod
    def cleanup_test_users():
        """清理测试用户"""
        User.objects.filter(username__startswith='test_').delete()
    
    @staticmethod
    def cleanup_test_medications():
        """清理测试药品"""
        Medication.objects.filter(name__startswith='测试药品').delete()
    
    @staticmethod
    def cleanup_test_health_metrics():
        """清理测试健康指标"""
        HealthMetric.objects.filter(patient__username__startswith='test_').delete()
    
    @staticmethod
    def cleanup_all_test_data():
        """清理所有测试数据"""
        TestDataCleanup.cleanup_test_users()
        TestDataCleanup.cleanup_test_medications()
        TestDataCleanup.cleanup_test_health_metrics()
        # 其他清理操作...
