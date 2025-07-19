#!/usr/bin/env python
import os
import sys
import django

# 配置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from communication.models import Message, Conversation
from accounts.models import User
from django.db.models import Q

def check_messages_and_conversations():
    print("=== 检查消息和会话数据 ===")
    
    # 检查最近的消息
    print("\n=== 最近的消息 ===")
    recent_messages = Message.objects.all().order_by('-sent_at')[:10]
    if recent_messages:
        for msg in recent_messages:
            conversation_id = getattr(msg, 'conversation_id', None)
            print(f"ID: {msg.id}")
            print(f"  发送者: {msg.sender.name} ({msg.sender.role})")
            print(f"  接收者: {msg.recipient.name} ({msg.recipient.role})")
            print(f"  内容: {msg.content[:50]}...")
            print(f"  发送时间: {msg.sent_at}")
            print(f"  已读: {msg.is_read}")
            print(f"  会话ID: {conversation_id}")
            print("-" * 50)
    else:
        print("没有找到任何消息")
    
    # 检查最近的会话
    print("\n=== 最近的会话 ===")
    recent_conversations = Conversation.objects.all().order_by('-last_message_at')[:10]
    if recent_conversations:
        for conv in recent_conversations:
            participants = list(conv.participants.all())
            participant_names = [p.name for p in participants]
            message_count = conv.messages.count()
            print(f"会话ID: {conv.id}")
            print(f"  参与者: {participant_names}")
            print(f"  最后消息时间: {conv.last_message_at}")
            print(f"  消息数: {message_count}")
            print(f"  状态: {conv.status}")
            print("-" * 50)
    else:
        print("没有找到任何会话")
    
    # 检查消息与会话的关联
    print("\n=== 消息与会话关联检查 ===")
    messages_without_conversation = Message.objects.filter(conversation__isnull=True)
    print(f"没有关联会话的消息数: {messages_without_conversation.count()}")
    
    if messages_without_conversation.exists():
        print("没有关联会话的消息:")
        for msg in messages_without_conversation[:5]:
            print(f"  消息ID: {msg.id}, 发送者: {msg.sender.name}, 接收者: {msg.recipient.name}")
    
    # 检查未读消息统计
    print("\n=== 未读消息统计 ===")
    total_unread = Message.objects.filter(is_read=False).count()
    print(f"总未读消息数: {total_unread}")
    
    # 按接收者统计未读消息
    users_with_unread = User.objects.filter(received_messages__is_read=False).distinct()
    for user in users_with_unread:
        unread_count = user.received_messages.filter(is_read=False).count()
        print(f"  {user.name} ({user.role}): {unread_count} 条未读消息")

if __name__ == '__main__':
    check_messages_and_conversations() 