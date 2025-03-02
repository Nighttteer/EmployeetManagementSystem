from django.db import models
from django.conf import settings

# Create your models here.

class Notification(models.Model):
    NotificationID = models.AutoField(primary_key=True)
    Message = models.TextField()
    DateSent = models.DateTimeField(auto_now_add=True)
    NotificationType = models.CharField(max_length=20, choices=[
        ('urgent', 'Urgent'),
        ('important', 'Important'),
        ('info', 'Info')
    ])
    Sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_notifications'
    )
    Recipients = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='received_notifications',
        through='NotificationRecipient'
    )

    def __str__(self):
        return f"{self.NotificationType} - {self.DateSent}"

    class Meta:
        ordering = ['-DateSent']

class NotificationRecipient(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE)
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    read = models.BooleanField(default=False)
    read_date = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['notification', 'recipient']
