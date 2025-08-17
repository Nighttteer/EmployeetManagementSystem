"""
测试数据工厂
使用factory_boy创建测试数据
"""
from .user_factories import UserFactory, AdminFactory, DoctorFactory, PatientFactory
from .health_factories import (
    HealthMetricFactory,
    BloodPressureFactory,
    BloodGlucoseFactory,
    HeartRateFactory,
    WeightFactory,
    AlertFactory,
    ThresholdExceededAlertFactory,
    ThresholdSettingFactory,
    MedicalHistoryFactory,
    FollowUpHistoryFactory
)
from .medication_factories import (
    MedicationFactory,
    MedicationPlanFactory,
    ActiveMedicationPlanFactory,
    CompletedMedicationPlanFactory,
    MedicationReminderFactory,
    TakenReminderFactory,
    MissedReminderFactory,
    MedicationStockFactory,
    LowStockFactory,
    ExpiredStockFactory
)
from .communication_factories import (
    ConversationFactory,
    MessageFactory,
    TextMessageFactory,
    ImageMessageFactory,
    AudioMessageFactory,
    UrgentMessageFactory,
    ReadMessageFactory,
    MessageTemplateFactory,
    ReminderTemplateFactory,
    GreetingTemplateFactory,
    NotificationLogFactory,
    MedicationReminderNotificationFactory,
    HealthAlertNotificationFactory,
    SentNotificationFactory,
    ReadNotificationFactory
)

__all__ = [
    # 用户工厂
    'UserFactory', 'AdminFactory', 'DoctorFactory', 'PatientFactory',
    
    # 健康数据工厂
    'HealthMetricFactory', 'BloodPressureFactory', 'BloodGlucoseFactory', 'HeartRateFactory', 'WeightFactory',
    'AlertFactory', 'ThresholdExceededAlertFactory', 'ThresholdSettingFactory', 
    'MedicalHistoryFactory', 'FollowUpHistoryFactory',
    
    # 用药管理工厂
    'MedicationFactory', 'MedicationPlanFactory', 'ActiveMedicationPlanFactory', 'CompletedMedicationPlanFactory',
    'MedicationReminderFactory', 'TakenReminderFactory', 'MissedReminderFactory',
    'MedicationStockFactory', 'LowStockFactory', 'ExpiredStockFactory',
    
    # 沟通工厂
    'ConversationFactory', 'MessageFactory', 'TextMessageFactory', 'ImageMessageFactory',
    'AudioMessageFactory', 'UrgentMessageFactory', 'ReadMessageFactory',
    'MessageTemplateFactory', 'ReminderTemplateFactory', 'GreetingTemplateFactory',
    'NotificationLogFactory', 'MedicationReminderNotificationFactory', 
    'HealthAlertNotificationFactory', 'SentNotificationFactory', 'ReadNotificationFactory',
]
