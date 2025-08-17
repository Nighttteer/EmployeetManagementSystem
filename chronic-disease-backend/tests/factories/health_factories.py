"""
健康数据相关工厂
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from django.utils import timezone
from datetime import datetime, timedelta, date

from health.models import HealthMetric, Alert, ThresholdSetting, MedicalHistory
from .user_factories import DoctorFactory, PatientFactory

fake = Faker('zh_CN')

class HealthMetricFactory(DjangoModelFactory):
    """健康指标工厂"""
    class Meta:
        model = HealthMetric
        skip_postgeneration_save = True
    
    patient = factory.SubFactory(PatientFactory)
    measured_by = factory.SubFactory(DoctorFactory)
    measured_at = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())
    note = factory.Faker('text', max_nb_chars=100)

class BloodPressureFactory(HealthMetricFactory):
    """血压指标工厂"""
    metric_type = 'blood_pressure'
    systolic = factory.Faker('random_int', min=90, max=180)
    diastolic = factory.Faker('random_int', min=60, max=110)

class BloodGlucoseFactory(HealthMetricFactory):
    """血糖指标工厂"""
    metric_type = 'blood_glucose'
    blood_glucose = factory.Faker('pyfloat', left_digits=2, right_digits=1, positive=True, min_value=3.5, max_value=15.0)

class HeartRateFactory(HealthMetricFactory):
    """心率指标工厂"""
    metric_type = 'heart_rate'
    heart_rate = factory.Faker('random_int', min=50, max=120)

class WeightFactory(HealthMetricFactory):
    """体重指标工厂"""
    metric_type = 'weight'
    weight = factory.Faker('pyfloat', left_digits=2, right_digits=1, positive=True, min_value=40.0, max_value=120.0)

class AlertFactory(DjangoModelFactory):
    """健康告警工厂"""
    class Meta:
        model = Alert
        skip_postgeneration_save = True
    
    patient = factory.SubFactory(PatientFactory)
    assigned_doctor = factory.SubFactory(DoctorFactory)
    alert_type = factory.Faker('random_element', elements=[
        'threshold_exceeded', 'missed_medication', 'abnormal_trend', 'system_notification'
    ])
    title = factory.Faker('sentence', nb_words=4)
    message = factory.Faker('text', max_nb_chars=200)
    priority = factory.Faker('random_element', elements=['low', 'medium', 'high', 'critical'])
    status = 'pending'
    created_at = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())

class ThresholdExceededAlertFactory(AlertFactory):
    """阈值超标告警工厂"""
    alert_type = 'threshold_exceeded'
    title = '血压异常告警'
    message = '患者血压超出正常范围，请及时关注'
    priority = 'high'
    related_metric = factory.SubFactory(BloodPressureFactory)

class ThresholdSettingFactory(DjangoModelFactory):
    """阈值设置工厂"""
    class Meta:
        model = ThresholdSetting
        skip_postgeneration_save = True
    
    metric_type = factory.Faker('random_element', elements=[
        'blood_pressure', 'blood_glucose', 'heart_rate', 'weight', 'uric_acid', 'lipids'
    ])
    name = factory.LazyAttribute(lambda obj: f"{obj.metric_type}阈值设置")
    min_value = factory.Faker('pyfloat', left_digits=3, right_digits=1, positive=True, min_value=50.0, max_value=100.0)
    max_value = factory.Faker('pyfloat', left_digits=3, right_digits=1, positive=True, min_value=120.0, max_value=200.0)
    created_by = factory.SubFactory(DoctorFactory)
    is_active = True

class MedicalHistoryFactory(DjangoModelFactory):
    """病历记录工厂"""
    class Meta:
        model = MedicalHistory
        skip_postgeneration_save = True
    
    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorFactory)
    title = factory.Faker('sentence', nb_words=3)
    content = factory.Faker('text', max_nb_chars=500)
    history_type = factory.Faker('random_element', elements=[
        'follow_up', 'examination', 'diagnosis', 'treatment', 'note'
    ])
    occurred_date = factory.Faker('date_this_year')

class FollowUpHistoryFactory(MedicalHistoryFactory):
    """随访记录工厂"""
    history_type = 'follow_up'
    title = '定期随访'
    content = factory.Faker('text', max_nb_chars=300)
