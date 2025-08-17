"""
沟通相关工厂
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from django.utils import timezone

from communication.models import Conversation, Message, MessageTemplate, NotificationLog
from .user_factories import DoctorFactory, PatientFactory

fake = Faker('zh_CN')

class ConversationFactory(DjangoModelFactory):
    """对话工厂"""
    class Meta:
        model = Conversation
        skip_postgeneration_save = True
    
    title = factory.Faker('sentence', nb_words=3)
    description = factory.Faker('text', max_nb_chars=100)
    status = 'active'
    conversation_type = factory.Faker('random_element', elements=[
        'consultation', 'follow_up', 'emergency', 'general'
    ])
    created_by = factory.SubFactory(PatientFactory)
    
    @factory.post_generation
    def participants(self, create, extracted, **kwargs):
        """添加对话参与者"""
        if not create:
            return
        
        if extracted:
            for participant in extracted:
                self.participants.add(participant)
        else:
            # 默认添加创建者和一个医生
            doctor = DoctorFactory()
            self.participants.add(self.created_by, doctor)

class MessageFactory(DjangoModelFactory):
    """消息工厂"""
    class Meta:
        model = Message
        skip_postgeneration_save = True
    
    sender = factory.SubFactory(PatientFactory)
    recipient = factory.SubFactory(DoctorFactory)
    conversation = factory.SubFactory(ConversationFactory)
    message_type = 'text'
    content = factory.Faker('text', max_nb_chars=200)
    priority = 'normal'
    is_read = False
    
    @factory.post_generation
    def set_conversation_participants(self, create, extracted, **kwargs):
        """确保发送者和接收者在对话中"""
        if create and self.conversation:
            self.conversation.participants.add(self.sender, self.recipient)

class TextMessageFactory(MessageFactory):
    """文本消息工厂"""
    message_type = 'text'
    content = factory.Faker('sentence', nb_words=10)

class ImageMessageFactory(MessageFactory):
    """图片消息工厂"""
    message_type = 'image'
    content = '发送了一张图片'
    attachment_type = 'image/jpeg'

class AudioMessageFactory(MessageFactory):
    """语音消息工厂"""
    message_type = 'audio'
    content = '发送了一段语音'
    attachment_type = 'audio/m4a'

class UrgentMessageFactory(MessageFactory):
    """紧急消息工厂"""
    priority = 'urgent'
    content = factory.Faker('random_element', elements=[
        '患者血压异常，请及时查看',
        '用药后出现不良反应',
        '需要紧急咨询医生'
    ])

class ReadMessageFactory(MessageFactory):
    """已读消息工厂"""
    is_read = True
    read_at = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())

class MessageTemplateFactory(DjangoModelFactory):
    """消息模板工厂"""
    class Meta:
        model = MessageTemplate
        skip_postgeneration_save = True
    
    name = factory.Faker('sentence', nb_words=3)
    content = factory.Faker('text', max_nb_chars=200)
    category = factory.Faker('random_element', elements=[
        'greeting', 'reminder', 'instruction', 'follow_up', 'emergency', 'general'
    ])
    applicable_roles = 'doctor,patient'
    is_active = True
    created_by = factory.SubFactory(DoctorFactory)
    usage_count = factory.Faker('random_int', min=0, max=100)

class ReminderTemplateFactory(MessageTemplateFactory):
    """提醒模板工厂"""
    category = 'reminder'
    name = '用药提醒模板'
    content = '亲爱的{patient_name}，请记得按时服用{medication_name}。'
    variables = {'patient_name': '患者姓名', 'medication_name': '药品名称'}

class GreetingTemplateFactory(MessageTemplateFactory):
    """问候模板工厂"""
    category = 'greeting'
    name = '问候模板'
    content = '您好{patient_name}，我是您的主治医生{doctor_name}，有什么可以帮助您的吗？'

class NotificationLogFactory(DjangoModelFactory):
    """通知日志工厂"""
    class Meta:
        model = NotificationLog
        skip_postgeneration_save = True
    
    recipient = factory.SubFactory(PatientFactory)
    title = factory.Faker('sentence', nb_words=4)
    content = factory.Faker('text', max_nb_chars=200)
    notification_type = factory.Faker('random_element', elements=[
        'medication_reminder', 'health_alert', 'appointment_reminder', 
        'doctor_advice', 'system_update'
    ])
    channel = factory.Faker('random_element', elements=['push', 'sms', 'email', 'in_app'])
    status = 'pending'

class MedicationReminderNotificationFactory(NotificationLogFactory):
    """用药提醒通知工厂"""
    notification_type = 'medication_reminder'
    title = '用药提醒'
    content = '该服用您的药物了，请按时服用。'
    channel = 'push'

class HealthAlertNotificationFactory(NotificationLogFactory):
    """健康告警通知工厂"""
    notification_type = 'health_alert'
    title = '健康异常提醒'
    content = '您的健康指标出现异常，请关注。'
    channel = 'push'
    status = 'sent'

class SentNotificationFactory(NotificationLogFactory):
    """已发送通知工厂"""
    status = 'sent'
    sent_at = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())

class ReadNotificationFactory(NotificationLogFactory):
    """已读通知工厂"""
    status = 'read'
    sent_at = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())
    delivered_at = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())
    read_at = factory.Faker('date_time_this_month', tzinfo=timezone.get_current_timezone())
