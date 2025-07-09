from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model

from .models import User, UserProfile, SMSVerificationCode
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserProfileUpdateSerializer, UserExtendedProfileSerializer,
    PasswordChangeSerializer, PasswordResetSerializer, UserListSerializer,
    SendSMSCodeSerializer, VerifySMSCodeSerializer, UserRegistrationWithSMSSerializer
)
from .sms_service import send_verification_code_sms

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """用户注册"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # 生成JWT令牌
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': '注册成功',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(TokenObtainPairView):
    """用户登录"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # 生成JWT令牌
            refresh = RefreshToken.for_user(user)
            
            # 更新最后登录IP
            user.last_login_ip = self.get_client_ip(request)
            user.save(update_fields=['last_login_ip'])
            
            return Response({
                'message': '登录成功',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        """获取客户端IP地址"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserProfileView(generics.RetrieveUpdateAPIView):
    """用户资料查看和更新"""
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserProfileSerializer
        return UserProfileUpdateSerializer


class UserExtendedProfileView(generics.RetrieveUpdateAPIView):
    """用户扩展资料管理"""
    serializer_class = UserExtendedProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class PasswordChangeView(generics.CreateAPIView):
    """密码修改"""
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': '密码修改成功'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(generics.CreateAPIView):
    """密码重置请求"""
    serializer_class = PasswordResetSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # TODO: 发送重置邮件
            # 这里应该生成重置令牌并发送邮件
            
            return Response({
                'message': '密码重置邮件已发送，请查收'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientListView(generics.ListAPIView):
    """患者列表（医生端使用）"""
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if not user.is_doctor:
            return User.objects.none()
        
        # 获取该医生管理的患者
        from health.models import DoctorPatientRelation
        patient_relations = DoctorPatientRelation.objects.filter(
            doctor=user, status='active'
        ).select_related('patient')
        
        patient_ids = [relation.patient.id for relation in patient_relations]
        
        # 如果没有绑定关系，则返回所有患者（根据业务需求调整）
        if not patient_ids:
            return User.objects.filter(role='patient', is_active=True)
        
        return User.objects.filter(id__in=patient_ids, is_active=True)


class DoctorListView(generics.ListAPIView):
    """医生列表"""
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return User.objects.filter(role='doctor', is_active=True).order_by('-created_at')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """用户登出"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({'message': '登出成功'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard_view(request):
    """用户仪表板数据"""
    user = request.user
    
    dashboard_data = {
        'user': UserProfileSerializer(user).data,
        'stats': {}
    }
    
    if user.is_patient:
        # 患者仪表板数据
        from health.models import HealthMetric, Alert
        from medication.models import MedicationPlan, MedicationReminder
        
        # 最近的健康指标
        recent_metrics = HealthMetric.objects.filter(patient=user).order_by('-measured_at')[:5]
        
        # 活跃告警
        active_alerts = Alert.objects.filter(patient=user, status='pending').count()
        
        # 今日用药计划
        from datetime import date
        today = date.today()
        today_reminders = MedicationReminder.objects.filter(
            plan__patient=user,
            reminder_time__date=today,
            status='pending'
        ).count()
        
        dashboard_data['stats'] = {
            'recent_metrics_count': recent_metrics.count(),
            'active_alerts_count': active_alerts,
            'today_medication_count': today_reminders,
            'profile_completion': user.get_full_profile_completion()
        }
        
    elif user.is_doctor:
        # 医生仪表板数据
        from health.models import DoctorPatientRelation, Alert
        
        # 管理的患者数量
        patients_count = DoctorPatientRelation.objects.filter(
            doctor=user, status='active'
        ).count()
        
        # 待处理告警
        pending_alerts = Alert.objects.filter(
            assigned_doctor=user, status='pending'
        ).count()
        
        dashboard_data['stats'] = {
            'patients_count': patients_count,
            'pending_alerts_count': pending_alerts,
        }
    
    return Response(dashboard_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def verify_token(request):
    """验证JWT令牌"""
    return Response({
        'valid': True,
        'user': UserProfileSerializer(request.user).data
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request):
    """上传头像"""
    if 'avatar' not in request.FILES:
        return Response({'error': '请选择头像文件'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    user.avatar = request.FILES['avatar']
    user.save()
    
    return Response({
        'message': '头像上传成功',
        'avatar_url': user.avatar.url if user.avatar else None
    })


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def delete_avatar(request):
    """删除头像"""
    user = request.user
    if user.avatar:
        user.avatar.delete()
        user.avatar = None
        user.save()
    
    return Response({'message': '头像删除成功'})


# SMS验证相关API视图
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_sms_code(request):
    """发送SMS验证码"""
    serializer = SendSMSCodeSerializer(data=request.data)
    if serializer.is_valid():
        phone = serializer.validated_data['phone']
        purpose = serializer.validated_data['purpose']
        
        # 获取客户端IP
        client_ip = get_client_ip(request)
        
        # 创建验证码
        verification_code = SMSVerificationCode.create_verification_code(
            phone=phone,
            purpose=purpose,
            ip_address=client_ip
        )
        
        # 发送短信
        success, message = send_verification_code_sms(phone, verification_code.code, purpose)
        
        if success:
            return Response({
                'message': '验证码发送成功',
                'expires_at': verification_code.expires_at.isoformat(),
                'phone': phone
            }, status=status.HTTP_200_OK)
        else:
            # 如果短信发送失败，删除验证码记录
            verification_code.delete()
            return Response({
                'error': f'短信发送失败: {message}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_sms_code(request):
    """验证SMS验证码"""
    serializer = VerifySMSCodeSerializer(data=request.data)
    if serializer.is_valid():
        return Response({
            'message': '验证码验证成功',
            'phone': serializer.validated_data['phone']
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserRegistrationWithSMSView(generics.CreateAPIView):
    """带SMS验证的用户注册"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationWithSMSSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # 生成JWT令牌
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': '注册成功',
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def sms_verification_stats(request):
    """SMS验证统计信息（仅用于调试）"""
    from django.utils import timezone
    from datetime import timedelta
    
    # 获取今日统计
    today = timezone.now().date()
    today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    stats = {
        'today_total': SMSVerificationCode.objects.filter(
            created_at__gte=today_start
        ).count(),
        'today_used': SMSVerificationCode.objects.filter(
            created_at__gte=today_start,
            is_used=True
        ).count(),
        'today_expired': SMSVerificationCode.objects.filter(
            created_at__gte=today_start,
            expires_at__lt=timezone.now(),
            is_used=False
        ).count(),
        'recent_codes': SMSVerificationCode.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
    }
    
    return Response(stats, status=status.HTTP_200_OK)


def get_client_ip(request):
    """获取客户端IP地址"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
