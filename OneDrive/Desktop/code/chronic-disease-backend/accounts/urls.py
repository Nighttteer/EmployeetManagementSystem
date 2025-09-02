from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'accounts'

urlpatterns = [
    # 认证相关
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', views.verify_token, name='verify_token'),
    
    # 用户资料
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/extended/', views.UserExtendedProfileView.as_view(), name='extended_profile'),
    path('profile/avatar/', views.upload_avatar, name='upload_avatar'),
    path('profile/avatar/delete/', views.delete_avatar, name='delete_avatar'),
    
    # 密码管理
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('password/reset/request/', views.PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password/reset/confirm/', views.PasswordResetView.as_view(), name='password_reset_confirm'),
    
    # 用户列表
    path('patients/', views.PatientListView.as_view(), name='patient_list'),
    path('patients/create/', views.PatientCreateView.as_view(), name='patient_create'),
    path('patients/<int:pk>/update/', views.PatientUpdateView.as_view(), name='patient_update'),
    # 兼容历史路径：允许 /accounts/ 前缀下访问相同视图（已由根 urls 挂载），此处无需重复定义
    path('patients/unassigned/', views.UnassignedPatientsView.as_view(), name='unassigned_patients'),
    path('patients/bind-doctor/', views.DoctorPatientBindView.as_view(), name='bind_doctor'),
    path('doctors/', views.DoctorListView.as_view(), name='doctor_list'),
    
    # 仪表板
    path('dashboard/', views.user_dashboard_view, name='dashboard'),
    
    # SMS验证相关
    path('sms/send/', views.send_sms_code, name='send_sms_code'),
    path('sms/verify/', views.verify_sms_code, name='verify_sms_code'),
    path('sms/stats/', views.sms_verification_stats, name='sms_verification_stats'),
    path('register/sms/', views.UserRegistrationWithSMSView.as_view(), name='register_with_sms'),
    
    # 用户健康数据相关
    path('health-trends/', views.user_health_trends, name='user_health_trends'),
    path('health-metrics/', views.user_health_metrics, name='user_health_metrics'),
    path('medication-plan/', views.user_medication_plan, name='user_medication_plan'),
    path('medication-confirmation/', views.user_medication_confirmation, name='user_medication_confirmation'),
] 