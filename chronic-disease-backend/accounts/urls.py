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
    path('password/reset/', views.PasswordResetView.as_view(), name='password_reset'),
    
    # 用户列表
    path('patients/', views.PatientListView.as_view(), name='patient_list'),
    path('doctors/', views.DoctorListView.as_view(), name='doctor_list'),
    
    # 仪表板
    path('dashboard/', views.user_dashboard_view, name='dashboard'),
    
    # SMS验证相关
    path('sms/send/', views.send_sms_code, name='send_sms_code'),
    path('sms/verify/', views.verify_sms_code, name='verify_sms_code'),
    path('sms/stats/', views.sms_verification_stats, name='sms_verification_stats'),
    path('register/sms/', views.UserRegistrationWithSMSView.as_view(), name='register_with_sms'),
] 