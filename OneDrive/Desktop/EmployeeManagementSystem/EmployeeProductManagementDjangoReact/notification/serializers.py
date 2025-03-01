from rest_framework import serializers
from .models import Notification, NotificationRecipient
from accounts.models import User

class RecipientSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    type = serializers.CharField()  # 'employee' 或 'employer'

class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    recipients = RecipientSerializer(many=True, required=False, write_only=True)
    
    class Meta:
        model = Notification
        fields = ['NotificationID', 'Message', 'DateSent', 'NotificationType', 
                 'Sender', 'sender_name', 'recipients']
        read_only_fields = ['NotificationID', 'DateSent', 'sender_name', 'Sender']

    def get_sender_name(self, obj):
        return obj.Sender.get_full_name() or obj.Sender.username

    def create(self, validated_data):
        recipients_data = validated_data.pop('recipients', [])
        notification = super().create(validated_data)
        
        # 如果没有指定接收者，发送给所有用户
        if not recipients_data:
            # 发送给所有用户，除了发送者自己
            for user in User.objects.all():
                if user != notification.Sender:  # 不发给自己
                    NotificationRecipient.objects.create(
                        notification=notification,
                        recipient=user
                    )
        else:
            # 处理指定的接收者
            for recipient in recipients_data:
                try:
                    user = User.objects.get(id=recipient['id'])
                    if user != notification.Sender:  # 不发给自己
                        NotificationRecipient.objects.create(
                            notification=notification,
                            recipient=user
                        )
                except User.DoesNotExist:
                    continue
        
        return notification