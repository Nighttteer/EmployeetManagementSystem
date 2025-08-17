from django.contrib import admin
from .models import Message, Conversation, MessageTemplate, NotificationLog


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """消息管理"""
    list_display = ['id', 'sender', 'recipient', 'message_type', 'content', 'is_read', 'sent_at', 'priority']
    list_filter = ['message_type', 'is_read', 'priority', 'sent_at', 'sender__role', 'recipient__role']
    search_fields = ['content', 'sender__name', 'recipient__name']
    readonly_fields = ['sent_at', 'read_at']
    date_hierarchy = 'sent_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('sender', 'recipient', 'conversation')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    """会话管理"""
    list_display = ['id', 'title', 'conversation_type', 'status', 'created_by', 'participants_count', 'last_message_at', 'created_at']
    list_filter = ['conversation_type', 'status', 'created_at', 'last_message_at']
    search_fields = ['title', 'description', 'created_by__name']
    readonly_fields = ['created_at', 'updated_at', 'last_message_at']
    date_hierarchy = 'created_at'
    
    def participants_count(self, obj):
        return obj.participants.count()
    participants_count.short_description = '参与者数量'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by')


@admin.register(MessageTemplate)
class MessageTemplateAdmin(admin.ModelAdmin):
    """消息模板管理"""
    list_display = ['name', 'category', 'applicable_roles', 'is_active', 'usage_count', 'created_by', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'content', 'created_by__name']
    readonly_fields = ['usage_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    """通知日志管理"""
    list_display = ['id', 'recipient', 'title', 'notification_type', 'channel', 'status', 'created_at']
    list_filter = ['notification_type', 'channel', 'status', 'created_at']
    search_fields = ['title', 'content', 'recipient__name']
    readonly_fields = ['created_at', 'sent_at', 'delivered_at', 'read_at']
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('recipient')
