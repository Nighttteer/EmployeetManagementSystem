"""
用药管理相关工厂
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from django.utils import timezone
from datetime import datetime, timedelta, date

from medication.models import Medication, MedicationPlan, MedicationReminder, MedicationStock
from .user_factories import DoctorFactory, PatientFactory

fake = Faker('zh_CN')

class MedicationFactory(DjangoModelFactory):
    """药品工厂"""
    class Meta:
        model = Medication
        skip_postgeneration_save = True
    
    name = factory.Faker('random_element', elements=[
        '阿司匹林肠溶片', '美托洛尔缓释片', '氨氯地平片', '二甲双胍片',
        '格列齐特缓释片', '辛伐他汀片', '缬沙坦片', '硝苯地平控释片'
    ])
    unit = factory.Faker('random_element', elements=['片', '粒', 'mg', 'ml'])
    category = factory.Faker('random_element', elements=[
        'antihypertensive', 'hypoglycemic', 'lipid_lowering', 
        'anticoagulant', 'diuretic', 'beta_blocker', 'ace_inhibitor'
    ])
    generic_name = factory.LazyAttribute(lambda obj: obj.name.split('片')[0] if '片' in obj.name else obj.name)
    specification = factory.Faker('random_element', elements=[
        '25mg/片', '50mg/片', '100mg/片', '5mg/片', '10mg/片'
    ])
    instructions = factory.Faker('random_element', elements=[
        '餐后服用', '餐前服用', '空腹服用', '睡前服用', '随餐服用'
    ])
    created_by = factory.SubFactory(DoctorFactory)
    is_active = True

class MedicationPlanFactory(DjangoModelFactory):
    """用药计划工厂"""
    class Meta:
        model = MedicationPlan
        skip_postgeneration_save = True
    
    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorFactory)
    medication = factory.SubFactory(MedicationFactory)
    dosage = factory.Faker('random_element', elements=[25.0, 50.0, 100.0, 5.0, 10.0])
    frequency = factory.Faker('random_element', elements=['QD', 'BID', 'TID', 'QID'])
    start_date = factory.LazyFunction(date.today)
    end_date = factory.LazyFunction(lambda: date.today() + timedelta(days=30))
    status = 'active'
    
    @factory.post_generation
    def time_of_day(self, create, extracted, **kwargs):
        """根据频次生成服药时间"""
        if not create:
            return
        
        frequency_times = {
            'QD': ['08:00'],
            'BID': ['08:00', '20:00'],
            'TID': ['08:00', '14:00', '20:00'],
            'QID': ['08:00', '12:00', '16:00', '20:00']
        }
        
        if extracted is not None:
            self.time_of_day = extracted
        else:
            self.time_of_day = frequency_times.get(self.frequency, ['08:00'])
        # 不需要手动save，Factory会处理

class ActiveMedicationPlanFactory(MedicationPlanFactory):
    """活跃用药计划工厂"""
    status = 'active'
    start_date = factory.LazyFunction(lambda: date.today() - timedelta(days=7))
    end_date = factory.LazyFunction(lambda: date.today() + timedelta(days=23))

class CompletedMedicationPlanFactory(MedicationPlanFactory):
    """已完成用药计划工厂"""
    status = 'completed'
    start_date = factory.LazyFunction(lambda: date.today() - timedelta(days=60))
    end_date = factory.LazyFunction(lambda: date.today() - timedelta(days=30))

class MedicationReminderFactory(DjangoModelFactory):
    """用药提醒工厂"""
    class Meta:
        model = MedicationReminder
        skip_postgeneration_save = True
    
    plan = factory.SubFactory(MedicationPlanFactory)
    reminder_time = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())
    scheduled_time = factory.Faker('time')
    status = 'pending'
    
    @factory.lazy_attribute
    def dosage_taken(self):
        """根据计划设置实际服用剂量"""
        return self.plan.dosage if self.status == 'taken' else None

class TakenReminderFactory(MedicationReminderFactory):
    """已服用提醒工厂"""
    status = 'taken'
    confirm_time = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())

class MissedReminderFactory(MedicationReminderFactory):
    """错过提醒工厂"""
    status = 'missed'
    reminder_time = factory.Faker('date_time_between', 
                                start_date='-2d', 
                                end_date='-1h',
                                tzinfo=timezone.get_current_timezone())

class MedicationStockFactory(DjangoModelFactory):
    """药品库存工厂"""
    class Meta:
        model = MedicationStock
        skip_postgeneration_save = True
    
    patient = factory.SubFactory(PatientFactory)
    medication = factory.SubFactory(MedicationFactory)
    current_quantity = factory.Faker('random_int', min=5, max=100)
    unit = factory.Faker('random_element', elements=['盒', '瓶', '片', '粒'])
    expiry_date = factory.Faker('date_between', start_date='+30d', end_date='+365d')
    low_stock_threshold = 10
    purchase_date = factory.Faker('date_this_month')

class LowStockFactory(MedicationStockFactory):
    """低库存工厂"""
    current_quantity = factory.Faker('random_int', min=1, max=5)
    
class ExpiredStockFactory(MedicationStockFactory):
    """过期库存工厂"""
    expiry_date = factory.Faker('date_between', start_date='-365d', end_date='-1d')
