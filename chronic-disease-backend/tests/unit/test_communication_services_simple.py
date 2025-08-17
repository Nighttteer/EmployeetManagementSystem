"""
Communication services 简化测试
"""
import pytest
from communication.services import ConversationService, MessageService
from tests.factories import PatientFactory, DoctorFactory, ConversationFactory, MessageFactory


@pytest.mark.unit
@pytest.mark.communication
class TestConversationServiceSimple:
    """会话服务简化测试"""

    @pytest.mark.django_db
    def test_find_conversation_between_users_basic(self):
        """测试查找用户间会话基本功能"""
        user1 = PatientFactory()
        user2 = DoctorFactory()
        
        # 创建会话
        conversation = ConversationFactory()
        conversation.participants.set([user1, user2])
        
        # 查找会话
        found_conversation = ConversationService.find_conversation_between_users(user1, user2)
        
        assert found_conversation is not None
        assert found_conversation == conversation

    @pytest.mark.django_db
    def test_find_conversation_with_none_users(self):
        """测试无效用户的情况"""
        user1 = PatientFactory()
        
        result = ConversationService.find_conversation_between_users(user1, None)
        assert result is None
        
        result = ConversationService.find_conversation_between_users(None, user1)
        assert result is None

    @pytest.mark.django_db
    def test_get_or_create_conversation_new(self):
        """测试创建新会话"""
        user1 = PatientFactory(name="张三")
        user2 = DoctorFactory(name="李医生")
        
        conversation, created = ConversationService.get_or_create_conversation(user1, user2)
        
        assert created
        assert conversation is not None
        assert conversation.participants.count() == 2

    @pytest.mark.django_db
    def test_get_or_create_conversation_existing(self):
        """测试获取现有会话"""
        user1 = PatientFactory()
        user2 = DoctorFactory()
        
        # 先创建会话
        existing_conversation = ConversationFactory()
        existing_conversation.participants.set([user1, user2])
        
        conversation, created = ConversationService.get_or_create_conversation(user1, user2)
        
        assert not created
        assert conversation == existing_conversation

    @pytest.mark.django_db
    def test_update_conversation_last_message(self):
        """测试更新会话最后消息时间"""
        conversation = ConversationFactory()
        message = MessageFactory(conversation=conversation)
        
        ConversationService.update_conversation_last_message(conversation, message)
        
        conversation.refresh_from_db()
        assert conversation.last_message_at == message.sent_at


@pytest.mark.unit
@pytest.mark.communication
class TestMessageServiceSimple:
    """消息服务简化测试"""

    @pytest.mark.django_db
    def test_create_message_with_conversation_basic(self):
        """测试创建消息的基本功能"""
        sender = PatientFactory(name="发送者")
        recipient = DoctorFactory(name="接收者")
        content = "测试消息内容"
        
        message = MessageService.create_message_with_conversation(
            sender=sender,
            recipient=recipient,
            content=content,
            message_type='text'
        )
        
        assert message is not None
        assert message.sender == sender
        assert message.recipient == recipient
        assert message.content == content
        assert message.conversation is not None

    @pytest.mark.django_db
    def test_create_message_with_existing_conversation(self):
        """测试在现有会话中创建消息"""
        sender = PatientFactory()
        recipient = DoctorFactory()
        
        # 先创建会话
        existing_conversation = ConversationFactory()
        existing_conversation.participants.set([sender, recipient])
        
        message = MessageService.create_message_with_conversation(
            sender=sender,
            recipient=recipient,
            content="新消息",
            message_type='text'
        )
        
        assert message.conversation == existing_conversation

    @pytest.mark.django_db
    def test_create_message_with_attachment(self):
        """测试创建带附件的消息"""
        sender = PatientFactory()
        recipient = DoctorFactory()
        
        message = MessageService.create_message_with_conversation(
            sender=sender,
            recipient=recipient,
            content="图片消息",
            message_type='image',
            attachment='test_image.jpg'
        )
        
        assert message.message_type == 'image'
        assert message.attachment == 'test_image.jpg'
