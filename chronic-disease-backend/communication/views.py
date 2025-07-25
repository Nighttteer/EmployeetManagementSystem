from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Max
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, Http404
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
import os
import re
import mimetypes
from pathlib import Path

from .models import Message, Conversation, MessageTemplate, NotificationLog
from .serializers import (
    MessageSerializer, MessageCreateSerializer, ConversationSerializer,
    ConversationCreateSerializer, MessageTemplateSerializer,
    ChatHistorySerializer, UserBasicSerializer
)
from accounts.models import User
from accounts.serializers import UserListSerializer


class MessagePagination(PageNumberPagination):
    """消息分页"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ConversationPagination(PageNumberPagination):
    """会话分页"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class MessageListCreateView(generics.ListCreateAPIView):
    """消息列表和创建"""
    serializer_class = MessageSerializer
    pagination_class = MessagePagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取当前用户相关的消息"""
        user = self.request.user
        conversation_id = self.request.query_params.get('conversation_id')
        
        if conversation_id:
            # 获取指定会话的消息
            conversation = get_object_or_404(Conversation, id=conversation_id)
            if not conversation.participants.filter(id=user.id).exists():
                return Message.objects.none()
            return conversation.messages.all()
        
        # 获取用户的所有消息
        return Message.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by('-sent_at')
    
    def get_serializer_class(self):
        """根据请求方法返回不同的序列化器"""
        if self.request.method == 'POST':
            return MessageCreateSerializer
        return MessageSerializer
    
    def perform_create(self, serializer):
        """创建消息时设置发送者"""
        serializer.save(sender=self.request.user)


class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """消息详情、更新和删除"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """只能访问自己发送或接收的消息"""
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(recipient=user)
        )
    
    def perform_update(self, serializer):
        """只允许发送者更新消息"""
        if serializer.instance.sender != self.request.user:
            raise permissions.PermissionDenied("只能编辑自己发送的消息")
        serializer.save()
    
    def perform_destroy(self, instance):
        """只允许发送者删除消息"""
        if instance.sender != self.request.user:
            raise permissions.PermissionDenied("只能删除自己发送的消息")
        instance.delete()


class ConversationListCreateView(generics.ListCreateAPIView):
    """会话列表和创建"""
    serializer_class = ConversationSerializer
    pagination_class = ConversationPagination
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取当前用户参与的会话"""
        return Conversation.objects.filter(
            participants=self.request.user
        ).order_by('-last_message_at', '-updated_at')
    
    def get_serializer_class(self):
        """根据请求方法返回不同的序列化器"""
        if self.request.method == 'POST':
            return ConversationCreateSerializer
        return ConversationSerializer


class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """会话详情、更新和删除"""
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """只能访问自己参与的会话"""
        return Conversation.objects.filter(
            participants=self.request.user
        )
    
    def perform_destroy(self, instance):
        """只允许创建者删除会话"""
        if instance.created_by != self.request.user:
            raise permissions.PermissionDenied("只能删除自己创建的会话")
        instance.delete()


class MessageMarkAsReadView(APIView):
    """标记消息为已读"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, message_id):
        """标记单个消息为已读"""
        message = get_object_or_404(Message, id=message_id, recipient=request.user)
        message.mark_as_read()
        
        return Response({
            'message': '消息已标记为已读',
            'message_id': message_id,
            'read_at': message.read_at
        })


class ConversationMarkAsReadView(APIView):
    """标记会话中的所有消息为已读"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, conversation_id):
        """标记会话中的所有未读消息为已读"""
        conversation = get_object_or_404(Conversation, id=conversation_id)
        
        # 验证用户是否为会话参与者
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {'error': '您不是该会话的参与者'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 标记所有未读消息为已读
        unread_messages = conversation.messages.filter(
            recipient=request.user,
            is_read=False
        )
        
        count = unread_messages.count()
        for message in unread_messages:
            message.mark_as_read()
        
        return Response({
            'message': f'已标记{count}条消息为已读',
            'conversation_id': conversation_id,
            'marked_count': count
        })


class UserSearchView(generics.ListAPIView):
    """用户搜索（用于选择聊天对象）"""
    serializer_class = UserBasicSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """搜索用户"""
        user = self.request.user
        search_query = self.request.query_params.get('search', '').strip()
        
        print(f"[DEBUG] 搜索用户: 当前用户={user.name}({user.role}), 搜索词='{search_query}'")
        
        if not search_query:
            print("[DEBUG] 搜索词为空，返回空结果")
            return User.objects.none()
        
        # 根据用户角色过滤可以联系的用户
        queryset = User.objects.exclude(id=user.id).filter(is_active=True)
        
        if user.is_patient:
            # 患者只能搜索医生
            queryset = queryset.filter(role='doctor')
            print(f"[DEBUG] 患者搜索医生，医生总数: {queryset.count()}")
        elif user.is_doctor:
            # 医生可以搜索患者
            queryset = queryset.filter(role='patient')
            print(f"[DEBUG] 医生搜索患者，患者总数: {queryset.count()}")
        
        # 按姓名和手机号搜索
        search_filter = Q(name__icontains=search_query) | Q(phone__icontains=search_query)
        queryset = queryset.filter(search_filter)
        
        print(f"[DEBUG] 搜索结果数量: {queryset.count()}")
        
        # 添加排序，修复分页警告
        queryset = queryset.order_by('name', 'id')
        
        # 打印搜索结果（仅用于调试）
        results_preview = queryset[:10]
        for result in results_preview:
            print(f"[DEBUG] 搜索结果: {result.name} ({result.phone}) - {result.role}")
        
        return queryset


class MessageTemplateListView(generics.ListAPIView):
    """消息模板列表"""
    serializer_class = MessageTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取适用于当前用户角色的模板"""
        user = self.request.user
        return MessageTemplate.objects.filter(
            is_active=True,
            applicable_roles__icontains=user.role
        ).order_by('category', 'name')


class SendQuickMessageView(APIView):
    """发送快速消息（使用模板）"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """发送快速消息"""
        template_id = request.data.get('template_id')
        recipient_id = request.data.get('recipient_id')
        context = request.data.get('context', {})
        
        # 验证模板
        template = get_object_or_404(MessageTemplate, id=template_id, is_active=True)
        
        # 验证接收者
        recipient = get_object_or_404(User, id=recipient_id)
        
        # 验证角色权限
        if request.user.role not in template.applicable_roles.split(','):
            return Response(
                {'error': '您没有使用此模板的权限'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 渲染消息内容
        content = template.render_content(context)
        
        # 创建消息
        message_data = {
            'recipient': recipient.id,
            'content': content,
            'message_type': 'text',
            'tags': f'template:{template.id}'
        }
        
        serializer = MessageCreateSerializer(
            data=message_data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            message = serializer.save()
            template.increment_usage()
            
            return Response({
                'message': '消息发送成功',
                'message_id': message.id,
                'content': content
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatStatsView(APIView):
    """聊天统计信息"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """获取聊天统计信息"""
        user = request.user
        
        # 总会话数
        total_conversations = Conversation.objects.filter(
            participants=user
        ).count()
        
        # 未读消息数
        unread_count = Message.objects.filter(
            recipient=user,
            is_read=False
        ).count()
        
        # 最近7天的消息数
        from datetime import datetime, timedelta
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_messages = Message.objects.filter(
            Q(sender=user) | Q(recipient=user),
            sent_at__gte=seven_days_ago
        ).count()
        
        # 活跃会话数（最近7天有消息的会话）
        active_conversations = Conversation.objects.filter(
            participants=user,
            last_message_at__gte=seven_days_ago
        ).count()
        
        return Response({
            'total_conversations': total_conversations,
            'unread_count': unread_count,
            'recent_messages': recent_messages,
            'active_conversations': active_conversations
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_conversation_between_users(request, user_id):
    """获取与指定用户的会话"""
    current_user = request.user
    other_user = get_object_or_404(User, id=user_id)
    
    # 查找两个用户之间的会话
    conversation = Conversation.objects.filter(
        participants=current_user
    ).filter(
        participants=other_user
    ).annotate(
        participant_count=Count('participants')
    ).filter(
        participant_count=2
    ).first()
    
    if conversation:
        serializer = ConversationSerializer(
            conversation,
            context={'request': request}
        )
        return Response(serializer.data)
    
    return Response({
        'message': '未找到与该用户的会话',
        'other_user': {
            'id': other_user.id,
            'name': other_user.name,
            'role': other_user.role
        }
    }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_conversation_with_user(request, user_id):
    """与指定用户开始新会话"""
    current_user = request.user
    other_user = get_object_or_404(User, id=user_id)
    
    # 检查是否已存在会话
    existing_conversation = Conversation.objects.filter(
        participants=current_user
    ).filter(
        participants=other_user
    ).annotate(
        participant_count=Count('participants')
    ).filter(
        participant_count=2
    ).first()
    
    if existing_conversation:
        serializer = ConversationSerializer(
            existing_conversation,
            context={'request': request}
        )
        return Response({
            'message': '会话已存在',
            'conversation': serializer.data
        })
    
    # 创建新会话
    conversation = Conversation.objects.create(
        title=f"{current_user.name} 与 {other_user.name}",
        created_by=current_user,
        conversation_type='consultation' if current_user.is_doctor or other_user.is_doctor else 'general'
    )
    conversation.participants.set([current_user, other_user])
    
    serializer = ConversationSerializer(
        conversation,
        context={'request': request}
    )
    
    return Response({
        'message': '会话创建成功',
        'conversation': serializer.data
    }, status=status.HTTP_201_CREATED)

# 音频文件服务视图
@api_view(['GET'])
@permission_classes([])  # 移除认证要求，允许匿名访问
def serve_audio_file(request, file_path):
    """
    提供音频文件服务，确保正确的HTTP头设置，特别针对iOS AVFoundation
    """
    try:
        # 构建完整的文件路径
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        
        # 检查文件是否存在
        if not os.path.exists(full_path):
            raise Http404("音频文件不存在")
        
        # 获取文件信息
        file_size = os.path.getsize(full_path)
        file_ext = Path(full_path).suffix.lower()
        
        # 设置正确的MIME类型
        mime_type = settings.AUDIO_FILE_TYPES.get(file_ext[1:], 'audio/mpeg')
        
        # 处理Range请求（支持音频流式播放）
        range_header = request.META.get('HTTP_RANGE', '').strip()
        
        if range_header:
            # 解析Range头
            range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
            if range_match:
                start = int(range_match.group(1))
                end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
                
                # 验证范围
                if start >= file_size:
                    return HttpResponse(status=416)  # Requested Range Not Satisfiable
                
                end = min(end, file_size - 1)
                length = end - start + 1
                
                # 读取指定范围的数据
                with open(full_path, 'rb') as f:
                    f.seek(start)
                    content = f.read(length)
                
                # 创建部分内容响应
                response = HttpResponse(content, status=206, content_type=mime_type)
                response['Content-Range'] = f'bytes {start}-{end}/{file_size}'
                response['Content-Length'] = length
            else:
                return HttpResponse(status=400)  # Bad Request
        else:
            # 完整文件请求
            with open(full_path, 'rb') as f:
                content = f.read()
            
            response = HttpResponse(content, content_type=mime_type)
            response['Content-Length'] = file_size
        
        # 设置必要的HTTP头（针对iOS AVFoundation优化）
        response['Accept-Ranges'] = 'bytes'
        response['Cache-Control'] = 'public, max-age=86400'  # 24小时缓存
        response['Last-Modified'] = timezone.now().strftime('%a, %d %b %Y %H:%M:%S GMT')
        
        # 设置CORS头
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Range, Accept-Ranges, Content-Range'
        response['Access-Control-Expose-Headers'] = 'Content-Range, Accept-Ranges, Content-Length'
        
        # 设置额外的音频相关头
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        
        return response
        
    except Exception as e:
        return Response(
            {'error': f'音频文件访问失败: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
