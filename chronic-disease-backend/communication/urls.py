from django.urls import path
from . import views

app_name = 'communication'

urlpatterns = [
    # 消息相关
    path('messages/', views.MessageListCreateView.as_view(), name='message-list-create'),
    path('messages/<int:pk>/', views.MessageDetailView.as_view(), name='message-detail'),
    path('messages/<int:message_id>/mark-read/', views.MessageMarkAsReadView.as_view(), name='message-mark-read'),
    
    # 会话相关
    path('conversations/', views.ConversationListCreateView.as_view(), name='conversation-list-create'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/mark-read/', views.ConversationMarkAsReadView.as_view(), name='conversation-mark-read'),
    path('conversations/with-user/<int:user_id>/', views.get_conversation_between_users, name='conversation-with-user'),
    path('conversations/start-with-user/<int:user_id>/', views.start_conversation_with_user, name='start-conversation-with-user'),
    
    # 用户搜索
    path('users/search/', views.UserSearchView.as_view(), name='user-search'),
    
    # 消息模板
    path('templates/', views.MessageTemplateListView.as_view(), name='message-template-list'),
    path('quick-message/', views.SendQuickMessageView.as_view(), name='send-quick-message'),
    
    # 聊天统计
    path('stats/', views.ChatStatsView.as_view(), name='chat-stats'),
    
    # 音频文件服务
    path('audio/<path:file_path>', views.serve_audio_file, name='serve-audio-file'),
] 