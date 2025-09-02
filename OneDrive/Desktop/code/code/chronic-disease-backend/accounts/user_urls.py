from django.urls import path
from . import views

# 用户相关的API路由（不包含认证相关）
urlpatterns = [
    # 用户资料
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/extended/', views.UserExtendedProfileView.as_view(), name='extended_profile'),
    path('profile/avatar/', views.upload_avatar, name='upload_avatar'),
    path('profile/avatar/delete/', views.delete_avatar, name='delete_avatar'),
    
    # 密码管理
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('password/reset/request/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/', views.PasswordResetView.as_view(), name='password_reset_confirm'),
    
    # 仪表板
    path('dashboard/', views.user_dashboard_view, name='dashboard'),
    
    # 用户健康数据相关
    path('health-trends/', views.user_health_trends, name='user_health_trends'),
    path('health-metrics/', views.user_health_metrics, name='user_health_metrics'),
    path('medication-plan/', views.user_medication_plan, name='user_medication_plan'),
    path('medication-confirmation/', views.user_medication_confirmation, name='user_medication_confirmation'),
] 