#!/usr/bin/env python
"""
修复孤立消息：将没有关联会话的消息正确关联到相应的会话
"""

import os
import django
from django.db import transaction
from django.db.models import Count

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from communication.models import Message, Conversation

def fix_orphaned_messages():
    """修复孤立的消息"""
    print("开始修复孤立的消息...")
    
    # 查找所有没有关联会话的消息
    orphaned_messages = Message.objects.filter(conversation__isnull=True).order_by('sent_at')
    
    print(f"发现 {orphaned_messages.count()} 条孤立消息")
    
    with transaction.atomic():
        for message in orphaned_messages:
            print(f"修复消息 ID: {message.id}, 发送者: {message.sender.name}, 接收者: {message.recipient.name}")
            
            participants = [message.sender, message.recipient]
            
            # 查找已存在的会话
            conversation = Conversation.objects.filter(
                participants__in=participants
            ).annotate(
                participant_count=Count('participants')
            ).filter(
                participant_count=2
            ).first()
            
            # 如果会话不存在，创建新会话
            if not conversation:
                conversation = Conversation.objects.create(
                    title=f"{message.sender.name} 与 {message.recipient.name}",
                    created_by=message.sender,
                    conversation_type='consultation' if message.sender.is_doctor or message.recipient.is_doctor else 'general',
                    last_message_at=message.sent_at
                )
                conversation.participants.set(participants)
                print(f"  创建新会话: {conversation.title}")
            else:
                # 更新会话的最后消息时间（如果这条消息更新）
                if not conversation.last_message_at or message.sent_at > conversation.last_message_at:
                    conversation.last_message_at = message.sent_at
                    conversation.save()
                print(f"  使用现有会话: {conversation.title}")
            
            # 关联消息到会话
            message.conversation = conversation
            message.save()
            print(f"  消息已关联到会话 ID: {conversation.id}")
    
    print("修复完成！")
    
    # 验证修复结果
    remaining_orphaned = Message.objects.filter(conversation__isnull=True).count()
    print(f"剩余孤立消息数: {remaining_orphaned}")
    
    # 显示会话统计
    print("\n会话统计:")
    conversations = Conversation.objects.annotate(message_count=Count('messages')).order_by('-last_message_at')
    for conv in conversations:
        participants = [p.name for p in conv.participants.all()]
        print(f"  会话 {conv.id}: {' 与 '.join(participants)} - {conv.message_count} 条消息")

if __name__ == "__main__":
    fix_orphaned_messages() 