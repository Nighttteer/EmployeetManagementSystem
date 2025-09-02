from django.db import models
from django.conf import settings
from accounts.models import User


class Message(models.Model):
    """
    医患沟通消息：双向消息记录

    Bidirectional message record between doctor and patient.

    Security/Privacy notes:
    - Attachments are stored via `FileField` and should be served via
      authenticated endpoints to avoid direct object reference.
    - Indexes are optimized for read/unread filtering and timeline
      queries in typical messaging UIs.
    """
    MESSAGE_TYPES = settings.MESSAGE_TYPES
    
    # 消息基本信息
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages', verbose_name='发送者')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', verbose_name='接收者')
    
    # 消息内容
    message_type = models.CharField('消息类型', max_length=20, choices=MESSAGE_TYPES, default='text')
    content = models.TextField('消息内容')
    
    # 附件信息（可选）
    attachment = models.FileField('附件', upload_to='message_attachments/', blank=True, null=True)
    attachment_type = models.CharField('附件类型', max_length=50, blank=True, null=True)
    
    # 消息状态
    is_read = models.BooleanField('已读', default=False)
    read_at = models.DateTimeField('阅读时间', null=True, blank=True)
    
    # 回复关系
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                               related_name='replies', verbose_name='回复消息')
    
    # 时间戳
    sent_at = models.DateTimeField('发送时间', auto_now_add=True)
    
    # 消息优先级
    PRIORITY_CHOICES = [
        ('low', '低'),
        ('normal', '正常'),
        ('high', '高'),
        ('urgent', '紧急'),
    ]
    priority = models.CharField('优先级', max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    # 标签（可选）
    tags = models.CharField('标签', max_length=200, blank=True, null=True)  # 用逗号分隔
    
    class Meta:
        db_table = 'message'
        verbose_name = '消息'
        verbose_name_plural = '消息'
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['sender', 'recipient', 'sent_at']),
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['sent_at']),
            models.Index(fields=['priority', 'sent_at']),
        ]
    
    def __str__(self):
        return f"{self.sender.name} -> {self.recipient.name}: {self.content[:50]}..."
    
    def mark_as_read(self):
        """标记消息为已读 / Mark message as read with timestamp."""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class Conversation(models.Model):
    """
    会话：管理医患之间的对话会话

    Conversation container for grouping related messages and computing
    per-participant unread counts and last activity timestamps.
    """
    # 会话参与者
    participants = models.ManyToManyField(User, related_name='conversations', verbose_name='参与者')
    
    # 会话信息
    title = models.CharField('会话标题', max_length=200, blank=True, null=True)
    description = models.TextField('会话描述', blank=True, null=True)
    
    # 会话状态
    STATUS_CHOICES = [
        ('active', '活跃'),
        ('archived', '已归档'),
        ('closed', '已关闭'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    
    # 会话类型
    CONVERSATION_TYPES = [
        ('consultation', '咨询'),
        ('follow_up', '随访'),
        ('emergency', '紧急'),
        ('general', '一般'),
    ]
    conversation_type = models.CharField('会话类型', max_length=20, choices=CONVERSATION_TYPES, default='general')
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('最后更新', auto_now=True)
    last_message_at = models.DateTimeField('最后消息时间', null=True, blank=True)
    
    # 创建者
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_conversations', 
                                 verbose_name='创建者')
    
    class Meta:
        db_table = 'conversation'
        verbose_name = '会话'
        verbose_name_plural = '会话'
        ordering = ['-last_message_at', '-updated_at']
        indexes = [
            models.Index(fields=['status', 'last_message_at']),
            models.Index(fields=['created_by', 'status']),
        ]
    
    def __str__(self):
        participants_names = ", ".join([p.name for p in self.participants.all()[:3]])
        return f"会话: {participants_names}"
    
    def get_last_message(self):
        """获取最后一条消息 / Return the most recent message in this conversation."""
        return self.messages.first()
    
    def get_unread_count(self, user):
        """获取指定用户的未读消息数量 / Count unread messages for a participant."""
        return self.messages.filter(recipient=user, is_read=False).count()


class MessageTemplate(models.Model):
    """
    消息模板：预设的常用消息模板

    Predefined templates for common communications to reduce typing and
    standardize phrasing. Supports basic variable interpolation.
    """
    # 基本信息
    name = models.CharField('模板名称', max_length=100)
    content = models.TextField('模板内容')
    
    # 分类
    CATEGORY_CHOICES = [
        ('greeting', '问候'),
        ('reminder', '提醒'),
        ('instruction', '指导'),
        ('follow_up', '随访'),
        ('emergency', '紧急'),
        ('general', '通用'),
    ]
    category = models.CharField('分类', max_length=20, choices=CATEGORY_CHOICES, default='general')
    
    # 适用角色
    applicable_roles = models.CharField('适用角色', max_length=50, 
                                      help_text='用逗号分隔，如: doctor,patient')
    
    # 模板变量（可选）
    variables = models.JSONField('模板变量', blank=True, null=True, 
                               help_text='JSON格式的变量定义')
    
    # 状态
    is_active = models.BooleanField('启用', default=True)
    
    # 创建信息
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='创建者')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    # 使用统计
    usage_count = models.PositiveIntegerField('使用次数', default=0)
    
    class Meta:
        db_table = 'message_template'
        verbose_name = '消息模板'
        verbose_name_plural = '消息模板'
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"
    
    def render_content(self, context=None):
        """
        渲染模板内容

        Render template content with naive variable replacement. For more
        robust templating, integrate Django templates or Jinja2.
        """
        if not context or not self.variables:
            return self.content
        
        # 简单的变量替换
        content = self.content
        for key, value in context.items():
            content = content.replace(f"{{{key}}}", str(value))
        return content
    
    def increment_usage(self):
        """增加使用次数 / Increment usage counter for analytics."""
        self.usage_count += 1
        self.save(update_fields=['usage_count'])


class NotificationLog(models.Model):
    """
    通知日志：记录系统发送的通知

    Notification audit log capturing delivery channel, status,
    timestamps, and linkage to related domain objects.

    Security/Compliance notes:
    - Helps trace message delivery in clinical workflows (e.g.,
      medication reminders, alerts).
    - Avoid storing sensitive PHI in plaintext where unnecessary; prefer
      referencing object IDs and minimize payload surface.
    """
    # 接收者
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', 
                                verbose_name='接收者')
    
    # 通知内容
    title = models.CharField('通知标题', max_length=200)
    content = models.TextField('通知内容')
    
    # 通知类型
    NOTIFICATION_TYPES = [
        ('medication_reminder', '用药提醒'),
        ('health_alert', '健康告警'),
        ('appointment_reminder', '预约提醒'),
        ('doctor_advice', '医生建议'),
        ('system_update', '系统更新'),
        ('other', '其他'),
    ]
    notification_type = models.CharField('通知类型', max_length=30, choices=NOTIFICATION_TYPES)
    
    # 发送渠道
    CHANNEL_CHOICES = [
        ('push', '推送通知'),
        ('sms', '短信'),
        ('email', '邮件'),
        ('in_app', '应用内通知'),
    ]
    channel = models.CharField('发送渠道', max_length=20, choices=CHANNEL_CHOICES, default='push')
    
    # 状态
    STATUS_CHOICES = [
        ('pending', '待发送'),
        ('sent', '已发送'),
        ('delivered', '已送达'),
        ('failed', '发送失败'),
        ('read', '已读'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    sent_at = models.DateTimeField('发送时间', null=True, blank=True)
    delivered_at = models.DateTimeField('送达时间', null=True, blank=True)
    read_at = models.DateTimeField('阅读时间', null=True, blank=True)
    
    # 关联数据
    related_object_type = models.CharField('关联对象类型', max_length=50, blank=True, null=True)
    related_object_id = models.PositiveIntegerField('关联对象ID', blank=True, null=True)
    
    # 错误信息
    error_message = models.TextField('错误信息', blank=True, null=True)
    
    class Meta:
        db_table = 'notification_log'
        verbose_name = '通知日志'
        verbose_name_plural = '通知日志'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status']),
            models.Index(fields=['notification_type', 'created_at']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.recipient.name} - {self.title}"
    
    def mark_as_read(self):
        """标记通知为已读 / Mark notification as read with timestamp."""
        if self.status != 'read':
            from django.utils import timezone
            self.status = 'read'
            self.read_at = timezone.now()
            self.save()


# 将消息与会话连接
Message.add_to_class('conversation', models.ForeignKey(
    Conversation, on_delete=models.CASCADE, related_name='messages', 
    verbose_name='会话', null=True, blank=True
))
