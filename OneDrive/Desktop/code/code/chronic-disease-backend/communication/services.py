"""
通信模块服务层
提供会话查找、消息处理等业务逻辑
"""
from django.db.models import Q, Count
from .models import Conversation, Message
from accounts.models import User


class ConversationService:
    """会话服务类"""
    
    @staticmethod
    def find_conversation_between_users(user1, user2):
        """
        查找两个用户之间的会话
        
        Args:
            user1: 第一个用户
            user2: 第二个用户
            
        Returns:
            Conversation对象或None
        """
        if not user1 or not user2:
            return None
        
        # 方法1：使用annotate查询（推荐）
        try:
            conversation = Conversation.objects.filter(
                participants=user1
            ).filter(
                participants=user2
            ).annotate(
                participant_count=Count('participants')
            ).filter(
                participant_count=2
            ).first()
            
            if conversation:
                return conversation
        except Exception:
            pass
        
        # 方法2：备选查询方法
        try:
            # 获取user1参与的所有会话
            user1_conversations = Conversation.objects.filter(participants=user1)
            
            # 找到同时包含user2的会话
            for conv in user1_conversations:
                if (conv.participants.filter(id=user2.id).exists() and 
                    conv.participants.count() == 2):
                    return conv
        except Exception:
            pass
        
        # 方法3：最后备选方案
        try:
            # 使用更简单的查询
            conversations = Conversation.objects.filter(
                participants__in=[user1, user2]
            ).distinct()
            
            for conv in conversations:
                participants = list(conv.participants.all())
                if (len(participants) == 2 and 
                    user1 in participants and 
                    user2 in participants):
                    return conv
        except Exception:
            pass
        
        return None
    
    @staticmethod
    def get_or_create_conversation(user1, user2, conversation_type='consultation'):
        """
        获取或创建两个用户之间的会话
        
        Args:
            user1: 第一个用户
            user2: 第二个用户
            conversation_type: 会话类型
            
        Returns:
            (Conversation, created) 元组
        """
        # 首先尝试查找现有会话
        existing_conversation = ConversationService.find_conversation_between_users(user1, user2)
        
        if existing_conversation:
            return existing_conversation, False
        
        # 创建新会话
        title = f"{user1.name} 与 {user2.name}"
        
        # 确定会话类型
        if not conversation_type:
            if hasattr(user1, 'is_doctor') and user1.is_doctor or hasattr(user2, 'is_doctor') and user2.is_doctor:
                conversation_type = 'consultation'
            else:
                conversation_type = 'general'
        
        conversation = Conversation.objects.create(
            title=title,
            created_by=user1,
            conversation_type=conversation_type
        )
        
        # 添加参与者
        conversation.participants.set([user1, user2])
        
        return conversation, True
    
    @staticmethod
    def update_conversation_last_message(conversation, message):
        """
        更新会话的最后消息时间
        
        Args:
            conversation: 会话对象
            message: 消息对象
        """
        if conversation and message:
            conversation.last_message_at = message.sent_at
            conversation.save(update_fields=['last_message_at'])


class MessageService:
    """消息服务类"""
    
    @staticmethod
    def create_message_with_conversation(sender, recipient, content, message_type='text', 
                                       attachment=None, reply_to=None, **kwargs):
        """
        创建消息并自动处理会话
        
        Args:
            sender: 发送者
            recipient: 接收者
            content: 消息内容
            message_type: 消息类型
            attachment: 附件
            reply_to: 回复的消息
            **kwargs: 其他参数
            
        Returns:
            Message对象
        """
        from .models import Message
        
        # 获取或创建会话
        conversation, created = ConversationService.get_or_create_conversation(
            sender, recipient
        )
        
        # 创建消息
        message_data = {
            'sender': sender,
            'recipient': recipient,
            'conversation': conversation,
            'message_type': message_type,
            'content': content,
            'reply_to': reply_to,
            **kwargs
        }
        
        if attachment:
            message_data['attachment'] = attachment
        
        message = Message.objects.create(**message_data)
        
        # 更新会话的最后消息时间
        ConversationService.update_conversation_last_message(conversation, message)
        
        return message
