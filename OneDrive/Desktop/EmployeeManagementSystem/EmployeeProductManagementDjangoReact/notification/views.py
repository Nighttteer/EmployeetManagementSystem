from django.shortcuts import render
from rest_framework import viewsets, permissions

from product.views import IsEmployerOrReadOnly
from .models import Notification, NotificationRecipient
from .serializers import NotificationSerializer
import logging
from django.db import models
from rest_framework.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

# Create your views here.

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmployerOrReadOnly]

    def get_queryset(self):
        # 获取用户可见的通知（发送的和接收的）
        user = self.request.user
        return Notification.objects.filter(
            models.Q(Sender=user) | models.Q(Recipients=user)
        ).distinct().order_by('-DateSent')

    def perform_create(self, serializer):
        logger.info(f"Creating notification with data: {self.request.data}")
        serializer.save(Sender=self.request.user)

    def perform_update(self, serializer):
        if self.get_object().Sender != self.request.user:
            raise PermissionDenied("只有发送者可以修改通知")
        serializer.save()
