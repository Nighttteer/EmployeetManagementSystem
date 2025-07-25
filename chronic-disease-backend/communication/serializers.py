from rest_framework import serializers
from django.utils import timezone
from django.db.models import Q
from .models import Message, Conversation, MessageTemplate, NotificationLog
from accounts.models import User
from django.db import models


class UserBasicSerializer(serializers.ModelSerializer):
    """用户基本信息序列化器（用于聊天显示）"""
    
    class Meta:
        model = User
        fields = ['id', 'name', 'role', 'avatar']
        read_only_fields = fields


class MessageSerializer(serializers.ModelSerializer):
    """消息序列化器"""
    sender_info = UserBasicSerializer(source='sender', read_only=True)
    recipient_info = UserBasicSerializer(source='recipient', read_only=True)
    reply_to_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'recipient', 'message_type', 'content',
            'attachment', 'attachment_type', 'is_read', 'read_at',
            'reply_to', 'sent_at', 'priority', 'tags',
            'sender_info', 'recipient_info', 'reply_to_info'
        ]
        read_only_fields = ['id', 'sent_at', 'sender_info', 'recipient_info', 'reply_to_info']
    
    def get_reply_to_info(self, obj):
        """获取回复消息的基本信息"""
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'content': obj.reply_to.content[:100] + '...' if len(obj.reply_to.content) > 100 else obj.reply_to.content,
                'sender_name': obj.reply_to.sender.name,
                'sent_at': obj.reply_to.sent_at
            }
        return None
    
    def validate(self, attrs):
        """验证消息数据"""
        sender = self.context['request'].user
        recipient = attrs.get('recipient')
        
        # 验证发送者和接收者不能相同
        if sender == recipient:
            raise serializers.ValidationError("不能给自己发送消息")
        
        # 验证医患关系（医生可以给任何患者发消息，患者只能给医生发消息）
        if sender.is_patient and recipient.is_patient:
            raise serializers.ValidationError("患者之间不能直接发送消息")
        
        # 验证消息内容
        content = attrs.get('content', '').strip()
        if not content and not attrs.get('attachment'):
            raise serializers.ValidationError("消息内容不能为空")
        
        return attrs


class MessageCreateSerializer(serializers.ModelSerializer):
    """消息创建序列化器"""
    
    class Meta:
        model = Message
        fields = [
            'recipient', 'message_type', 'content', 'attachment',
            'attachment_type', 'reply_to', 'priority', 'tags'
        ]
    
    def validate(self, attrs):
        """验证消息数据"""
        sender = self.context['request'].user
        recipient = attrs.get('recipient')
        
        # 验证发送者和接收者不能相同
        if sender == recipient:
            raise serializers.ValidationError("不能给自己发送消息")
        
        # 验证医患关系
        if sender.is_patient and recipient.is_patient:
            raise serializers.ValidationError("患者之间不能直接发送消息")
        
        # 验证消息内容
        content = attrs.get('content', '').strip()
        if not content and not attrs.get('attachment'):
            raise serializers.ValidationError("消息内容不能为空")
        
        return attrs
    
    def create(self, validated_data):
        """创建消息"""
        request = self.context.get('request')
        validated_data['sender'] = request.user
        
        message = Message.objects.create(**validated_data)
        
        # 更新或创建会话
        self.update_conversation(message)
        
        return message
    
    def update_conversation(self, message):
        """更新或创建会话"""
        participants = [message.sender, message.recipient]
        
        # 查找已存在的会话
        conversation = Conversation.objects.filter(
            participants__in=participants
        ).annotate(
            participant_count=models.Count('participants')
        ).filter(
            participant_count=2
        ).first()
        
        # 如果会话不存在，创建新会话
        if not conversation:
            conversation = Conversation.objects.create(
                title=f"{message.sender.name} 与 {message.recipient.name}",
                created_by=message.sender,
                conversation_type='consultation' if message.sender.is_doctor or message.recipient.is_doctor else 'general'
            )
            conversation.participants.set(participants)
        
        # 关联消息到会话
        message.conversation = conversation
        message.save()
        
        # 更新会话的最后消息时间
        conversation.last_message_at = message.sent_at
        conversation.save()


class ConversationSerializer(serializers.ModelSerializer):
    """会话序列化器"""
    participants_info = UserBasicSerializer(source='participants', many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'description', 'status', 'conversation_type',
            'created_at', 'updated_at', 'last_message_at', 'created_by',
            'participants_info', 'last_message', 'unread_count', 'other_participant'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'participants_info']
    
    def get_last_message(self, obj):
        """获取最后一条消息"""
        last_message = obj.messages.first()
        if last_message:
            return {
                'id': last_message.id,
                'content': last_message.content[:100] + '...' if len(last_message.content) > 100 else last_message.content,
                'sender_name': last_message.sender.name,
                'sent_at': last_message.sent_at,
                'is_read': last_message.is_read
            }
        return None
    
    def get_unread_count(self, obj):
        """获取当前用户的未读消息数量"""
        request = self.context.get('request')
        if request and request.user:
            return obj.messages.filter(recipient=request.user, is_read=False).count()
        return 0
    
    def get_other_participant(self, obj):
        """获取对话中的另一个参与者信息"""
        request = self.context.get('request')
        if request and request.user:
            other_participants = obj.participants.exclude(id=request.user.id)
            if other_participants.exists():
                other = other_participants.first()
                return {
                    'id': other.id,
                    'name': other.name,
                    'role': other.role,
                    'avatar': other.avatar.url if other.avatar else None
                }
        return None


class MessageTemplateSerializer(serializers.ModelSerializer):
    """消息模板序列化器"""
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'name', 'content', 'category', 'applicable_roles',
            'variables', 'is_active', 'created_by', 'created_at',
            'updated_at', 'usage_count', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'usage_count', 'created_by_name']
    
    def validate_applicable_roles(self, value):
        """验证适用角色"""
        if value:
            valid_roles = ['doctor', 'patient', 'admin']
            roles = [role.strip() for role in value.split(',')]
            for role in roles:
                if role not in valid_roles:
                    raise serializers.ValidationError(f"无效的角色: {role}")
        return value


class ConversationCreateSerializer(serializers.ModelSerializer):
    """会话创建序列化器"""
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        help_text="参与者ID列表"
    )
    
    class Meta:
        model = Conversation
        fields = [
            'title', 'description', 'conversation_type', 'participant_ids'
        ]
    
    def validate_participant_ids(self, value):
        """验证参与者ID"""
        if len(value) < 2:
            raise serializers.ValidationError("会话至少需要2个参与者")
        
        # 验证用户存在
        existing_users = User.objects.filter(id__in=value).count()
        if existing_users != len(value):
            raise serializers.ValidationError("某些用户不存在")
        
        return value
    
    def create(self, validated_data):
        """创建会话"""
        participant_ids = validated_data.pop('participant_ids')
        request = self.context.get('request')
        
        conversation = Conversation.objects.create(
            **validated_data,
            created_by=request.user
        )
        
        # 添加参与者
        participants = User.objects.filter(id__in=participant_ids)
        conversation.participants.set(participants)
        
        return conversation


class ChatHistorySerializer(serializers.Serializer):
    """聊天历史序列化器"""
    conversation_id = serializers.IntegerField()
    page = serializers.IntegerField(default=1, min_value=1)
    page_size = serializers.IntegerField(default=20, min_value=1, max_value=100)
    
    def validate_conversation_id(self, value):
        """验证会话ID"""
        request = self.context.get('request')
        
        try:
            conversation = Conversation.objects.get(id=value)
            if not conversation.participants.filter(id=request.user.id).exists():
                raise serializers.ValidationError("您不是该会话的参与者")
        except Conversation.DoesNotExist:
            raise serializers.ValidationError("会话不存在")
        
        return value 