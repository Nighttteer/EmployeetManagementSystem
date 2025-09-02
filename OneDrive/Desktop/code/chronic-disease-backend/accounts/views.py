from django.shortcuts import render
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from .models import User, UserProfile, SMSVerificationCode
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    UserProfileUpdateSerializer, UserExtendedProfileSerializer,
    PasswordChangeSerializer, PasswordResetRequestSerializer, PasswordResetSerializer, UserListSerializer,
    SendSMSCodeSerializer, VerifySMSCodeSerializer, UserRegistrationWithSMSSerializer,
    PatientUpdateSerializer
)
from .sms_service import send_verification_code_sms

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    用户注册

    User registration endpoint.

    Security considerations:
    - Delegates password hashing to the serializer via `create_user`.
    - Returns JWT upon successful creation to support immediate login UX.
    - Uses `AllowAny` but creation is fully validated server-side.
    """
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
    """
    用户登录

    User login endpoint backed by custom serializer validation to
    authenticate via phone + password and optional role match.

    Security considerations:
    - On success issues both refresh and access tokens (JWT SimpleJWT).
    - Records `last_login_ip` for audit/forensics.
    - Returns generic error on failure to avoid user enumeration.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        """继承兼容性：UserLoginView 继承自 TokenObtainPairView，父类可能定义了额外的参数"""
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # 生成JWT令牌
            refresh = RefreshToken.for_user(user)
            
            # 更新最后登录IP
            user.last_login_ip = self.get_client_ip(request)
            user.save(update_fields=['last_login_ip'])
            
            return Response({
                'message': '登录成功', #success
                'user': UserProfileSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        """
        获取客户端真实IP地址
        
        由于现代网络架构中用户请求通常经过代理服务器（如CDN、负载均衡器等），
        直接使用REMOTE_ADDR可能获取到的是代理服务器IP而不是真实用户IP。
        此方法优先检查HTTP_X_FORWARDED_FOR头来获取真实IP。
        
        Args:
            request: Django请求对象
            
        Returns:
            str: 客户端的真实IP地址
            
        Example:
            # 代理链: 用户IP → CDN → 负载均衡器 → 应用服务器
            # HTTP_X_FORWARDED_FOR: "192.168.1.100, 10.0.0.1, 172.16.0.1"
            # 返回: "192.168.1.100" (用户真实IP)
        """
        # 尝试从代理头中获取真实IP地址
        # HTTP_X_FORWARDED_FOR 是代理服务器传递的原始客户端IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        
        if x_forwarded_for:
            # 如果存在代理头，取第一个IP（最原始的客户端IP）
            # 格式通常是: "真实IP, 代理1IP, 代理2IP, ..."
            ip = x_forwarded_for.split(',')[0]
        else:
            # 如果没有代理头，使用直接连接的IP地址
            # 适用于本地开发或直接连接场景
            ip = request.META.get('REMOTE_ADDR')
        
        return ip


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    用户资料查看和更新

    Retrieve and update the authenticated user's profile.

    Security considerations:
    - Requires authentication; operates on `request.user`.
    - Read returns a richer projection; write uses update serializer with
      role-aware validation for doctors.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserProfileSerializer
        return UserProfileUpdateSerializer


class UserExtendedProfileView(generics.RetrieveUpdateAPIView):
    """
    用户扩展资料管理

    Manage extended profile details for the authenticated user.
    """
    serializer_class = UserExtendedProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile


class PasswordChangeView(generics.CreateAPIView):
    """
    密码修改

    Change password for the authenticated user.

    Security considerations:
    - Validates old password and applies Django validators for the new
      password.
    - Persists via `set_password` to ensure hashing.
    """
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'message': '密码修改成功'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(generics.CreateAPIView):
    """
    密码重置请求（发送验证码）

    Request a password reset code via SMS.

    Security considerations:
    - Associates issuance with client IP for observability.
    - SMS rate-limiting and attempt controls exist in serializer/model.
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone']
            
            # 获取客户端IP
            client_ip = get_client_ip(request)
            
            # 创建验证码
            verification_code = SMSVerificationCode.create_verification_code(
                phone=phone,
                purpose='reset_password',
                ip_address=client_ip
            )
            
            # 发送短信
            success, message = send_verification_code_sms(phone, verification_code.code, 'reset_password')
            
            if success:
                return Response({
                    'message': '验证码已发送，请查收短信',
                    'expires_at': verification_code.expires_at.isoformat(),
                    'phone': phone
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': f'验证码发送失败: {message}'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(generics.CreateAPIView):
    """
    密码重置确认

    Confirm password reset with an SMS code.

    Security considerations:
    - Validates code freshness and attempts; persists via `set_password`.
    - Avoids leaking user existence beyond the validated flow.
    """
    serializer_class = PasswordResetSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # 保存新密码
            user = serializer.save()
            
            return Response({
                'message': '密码重置成功，请用新密码登录',
                'user': {
                    'id': user.id,
                    'phone': user.phone,
                    'name': user.name,
                    'role': user.role
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientListView(generics.ListAPIView):
    """
    患者列表（医生端使用）

    List patients managed by the current doctor based on active
    doctor–patient relationships. Falls back to all active patients when
    no bindings exist (configurable business rule).
    """
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
            return User.objects.filter(role='patient', is_active=True).order_by('-created_at')
        
        return User.objects.filter(id__in=patient_ids, is_active=True).order_by('-created_at')


class PatientCreateView(generics.CreateAPIView):
    """
    创建患者（医生端使用）

    Create a patient account by a doctor and auto-bind the relation.

    Security considerations:
    - Requires doctor role; coerces role to 'patient' regardless of input.
    - Establishes a primary, active relation upon creation.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        user = request.user
        
        if not user.is_doctor:
            return Response({'error': '只有医生可以创建患者'}, status=status.HTTP_403_FORBIDDEN)
        
        # 确保创建的是患者角色
        data = request.data.copy()
        data['role'] = 'patient'
        
        # 创建患者
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            patient = serializer.save()
            
            # 自动建立医患关系
            from health.models import DoctorPatientRelation
            DoctorPatientRelation.objects.get_or_create(
                doctor=user,
                patient=patient,
                defaults={
                    'is_primary': True,
                    'status': 'active',
                    'notes': f'由医生 {user.name} 创建'
                }
            )
            
            return Response({
                'message': '患者创建成功',
                'patient': UserListSerializer(patient).data,
                'doctor_patient_relation': True
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UnassignedPatientsView(generics.ListAPIView):
    """
    获取未分配医生的患者列表

    Returns active patients who are not currently bound to any doctor,
    with optional search filtering.
    """
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if not user.is_doctor:
            return User.objects.none()
        
        # 获取搜索参数
        search_query = self.request.query_params.get('search', '')
        
        # 获取已分配医生的患者ID
        from health.models import DoctorPatientRelation
        assigned_patient_ids = DoctorPatientRelation.objects.filter(
            status='active'
        ).values_list('patient_id', flat=True)
        
        # 获取未分配的患者
        queryset = User.objects.filter(
            role='patient',
            is_active=True
        ).exclude(
            id__in=assigned_patient_ids
        )
        
        # 应用搜索过滤
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(phone__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(bio__icontains=search_query)
            )
        
        return queryset.order_by('-created_at')


class DoctorPatientBindView(generics.CreateAPIView):
    """
    绑定医患关系

    Bind a patient to the current doctor (self-only binding enforced).

    Security considerations:
    - Only doctors can initiate bindings.
    - Enforces self-binding to prevent privilege escalation by IDs.
    - Ensures idempotency by checking existing active relation first.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        user = request.user
        
        if not user.is_doctor:
            return Response({'error': '只有医生可以绑定患者'}, status=status.HTTP_403_FORBIDDEN)
        
        patient_id = request.data.get('patient_id')
        doctor_id = request.data.get('doctor_id')
        
        if not patient_id:
            return Response({'error': '患者ID不能为空'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证患者存在
        try:
            patient = User.objects.get(id=patient_id, role='patient', is_active=True)
        except User.DoesNotExist:
            return Response({'error': '患者不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        # 验证医生权限（只能绑定自己）
        if doctor_id and doctor_id != user.id:
            return Response({'error': '只能绑定患者到自己'}, status=status.HTTP_403_FORBIDDEN)
        
        # 检查是否已经绑定
        from health.models import DoctorPatientRelation
        existing_relation = DoctorPatientRelation.objects.filter(
            doctor=user,
            patient=patient,
            status='active'
        ).first()
        
        if existing_relation:
            return Response({'error': '该患者已经是您的患者'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 创建或更新医患关系
        relation, created = DoctorPatientRelation.objects.get_or_create(
            doctor=user,
            patient=patient,
            defaults={
                'is_primary': True,
                'status': 'active',
                'notes': f'患者由医生 {user.name} 添加'
            }
        )
        
        if not created:
            # 如果关系已存在但状态不是active，更新状态
            relation.status = 'active'
            relation.is_primary = True
            relation.notes = f'患者由医生 {user.name} 重新添加'
            relation.save()
        
        return Response({
            'message': '患者绑定成功',
            'patient': UserListSerializer(patient).data,
            'relation_id': relation.id
        }, status=status.HTTP_201_CREATED)


class DoctorListView(generics.ListAPIView):
    """
    医生列表

    List active doctors.
    """
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


# 用户健康数据相关API视图
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_health_trends(request):
    """获取用户健康趋势数据"""
    from health.views import health_trends
    # 传递原始的 Django HttpRequest 对象
    return health_trends(request._request)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def user_health_metrics(request):
    """获取或提交用户健康指标数据"""
    from health.views import HealthMetricListCreateView
    view = HealthMetricListCreateView()
    view.request = request
    view.format_kwarg = None
    
    if request.method == 'GET':
        return view.get(request)
    else:
        return view.post(request)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_medication_plan(request):
    """获取用户用药计划"""
    user = request.user
    
    if user.role != 'patient':
        return Response(
            {"error": "只有病人可以查看自己的用药计划"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # 从medication应用导入模型
        from medication.models import MedicationPlan
        
        # 获取医生为当前病人设置的所有用药计划
        plans = MedicationPlan.objects.filter(
            patient=user,
            status='active'  # 只获取活跃的计划
        ).select_related('medication', 'doctor').order_by('-created_at')
        
        # 转换为前端需要的格式
        medications = []
        for plan in plans:
            medication = {
                'id': plan.id,
                'name': plan.medication.name,
                'dosage': f"{plan.dosage} {plan.medication.unit}",
                'frequency': plan.frequency,
                'time_of_day': plan.time_of_day,
                'category': plan.medication.category,
                'instructions': plan.special_instructions or f"按医嘱服用，{plan.medication.name}",
                'start_date': plan.start_date,
                'end_date': plan.end_date,
                'status': plan.status,
                'doctor_name': plan.doctor.name,
                'requires_monitoring': plan.requires_monitoring,
                'monitoring_notes': plan.monitoring_notes,
            }
            medications.append(medication)
        
        return Response({
            'medications': medications,
            'total': len(medications),
            'message': f'找到 {len(medications)} 个用药计划'
        })
        
    except Exception as e:
        print(f"获取病人用药计划失败: {str(e)}")
        return Response({
            'medications': [],
            'message': f'获取用药计划失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def user_medication_confirmation(request):
    """确认服药"""
    user = request.user
    
    if user.role != 'patient':
        return Response(
            {"error": "只有病人可以确认服药"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        medication_id = request.data.get('medication_id')
        timestamp = request.data.get('timestamp')
        
        if not medication_id:
            return Response(
                {"error": "缺少用药计划ID"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 从medication应用导入模型
        from medication.models import MedicationPlan, MedicationReminder
        
        # 验证用药计划是否存在且属于当前病人
        try:
            plan = MedicationPlan.objects.get(
                id=medication_id,
                patient=user,
                status='active'
            )
        except MedicationPlan.DoesNotExist:
            return Response(
                {"error": "用药计划不存在或已停止"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 创建或更新用药提醒记录
        current_time = timezone.now()
        current_date = current_time.date()
        
        # 查找今天的用药提醒记录
        reminder, created = MedicationReminder.objects.get_or_create(
            plan=plan,
            reminder_time__date=current_date,
            defaults={
                'reminder_time': current_time,
                'scheduled_time': current_time.time(),
                'status': 'taken',
                'confirm_time': current_time,
                'dosage_taken': plan.dosage,
                'notes': '病人主动确认服药'
            }
        )
        
        if not created:
            # 如果记录已存在，更新状态
            reminder.status = 'taken'
            reminder.confirm_time = current_time
            reminder.dosage_taken = plan.dosage
            reminder.notes = '病人主动确认服药'
            reminder.save()
        
        return Response({
            'message': '服药记录已保存',
            'plan_id': plan.id,
            'medication_name': plan.medication.name,
            'timestamp': reminder.confirm_time,
            'status': 'taken'
        })
        
    except Exception as e:
        print(f"确认服药失败: {str(e)}")
        return Response({
            'error': f'确认服药失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientUpdateView(generics.RetrieveUpdateAPIView):
    """患者信息更新API（医生使用）"""
    serializer_class = PatientUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_doctor:
            return User.objects.none()
        
        # 只允许医生更新自己管理的患者
        from health.models import DoctorPatientRelation
        patient_ids = DoctorPatientRelation.objects.filter(
            doctor=user,
            status='active'
        ).values_list('patient_id', flat=True)
        
        return User.objects.filter(id__in=patient_ids, role='patient')
    
    def update(self, request, *args, **kwargs):
        """更新患者信息，特别处理chronic_diseases字段"""
        try:
            patient = self.get_object()
            
            # 记录更新前的状态
            old_diseases = patient.chronic_diseases
            old_risk = patient.get_disease_risk_level()
            
            # 执行更新
            response = super().update(request, *args, **kwargs)
            
            # 重新获取更新后的患者信息
            patient.refresh_from_db()
            new_risk = patient.get_disease_risk_level()
            
            # 自定义响应
            if response.status_code == 200:
                return Response({
                    'success': True,
                    'message': '患者信息更新成功',
                    'patient': {
                        'id': patient.id,
                        'name': patient.name,
                        'chronic_diseases': patient.chronic_diseases,
                        'risk_level': new_risk
                    },
                    'changes': {
                        'diseases_changed': old_diseases != patient.chronic_diseases,
                        'risk_changed': old_risk != new_risk,
                        'old_risk': old_risk,
                        'new_risk': new_risk
                    }
                })
            
            return response
            
        except Exception as e:
            return Response({
                'success': False,
                'error': f'更新患者信息失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
