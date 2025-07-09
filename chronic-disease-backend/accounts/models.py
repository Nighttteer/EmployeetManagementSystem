from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    """
    用户统一模型：包括患者、医生、管理员
    基于用户提供的数据库架构设计
    """
    ROLE_CHOICES = settings.USER_ROLES
    GENDER_CHOICES = settings.GENDER_CHOICES
    
    # 基本信息
    name = models.CharField('姓名', max_length=100)
    email = models.EmailField('邮箱', unique=True)
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField('手机号', max_length=20, blank=True, null=True)
    age = models.PositiveIntegerField('年龄', blank=True, null=True)
    gender = models.CharField('性别', max_length=10, choices=GENDER_CHOICES, default='male')
    
    # 个人资料扩展
    avatar = models.ImageField('头像', upload_to='avatars/', blank=True, null=True)
    bio = models.TextField('个人简介', blank=True, null=True)
    address = models.CharField('地址', max_length=200, blank=True, null=True)
    emergency_contact = models.CharField('紧急联系人', max_length=100, blank=True, null=True)
    emergency_phone = models.CharField('紧急联系电话', max_length=20, blank=True, null=True)
    
    # 医生相关字段
    license_number = models.CharField('执业证书号', max_length=50, blank=True, null=True)
    department = models.CharField('科室', max_length=100, blank=True, null=True)
    title = models.CharField('职称', max_length=50, blank=True, null=True)
    specialization = models.CharField('专业领域', max_length=200, blank=True, null=True)
    
    # 患者相关字段
    height = models.FloatField('身高(cm)', blank=True, null=True)
    blood_type = models.CharField('血型', max_length=10, blank=True, null=True)
    smoking_status = models.CharField('吸烟状况', max_length=20, blank=True, null=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    last_login_ip = models.GenericIPAddressField('最后登录IP', blank=True, null=True)
    
    # 账户状态
    is_verified = models.BooleanField('已验证', default=False)
    is_profile_complete = models.BooleanField('资料完整', default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'name']
    
    class Meta:
        db_table = 'user'
        verbose_name = '用户'
        verbose_name_plural = '用户'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['email']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"
    
    @property
    def is_patient(self):
        return self.role == 'patient'
    
    @property
    def is_doctor(self):
        return self.role == 'doctor'
    
    @property
    def is_admin(self):
        return self.role == 'admin'
    
    def get_full_profile_completion(self):
        """计算用户资料完整度"""
        required_fields = ['name', 'email', 'phone', 'age', 'gender']
        completed_fields = 0
        
        for field in required_fields:
            if getattr(self, field):
                completed_fields += 1
        
        # 根据角色添加额外必填字段
        if self.is_doctor:
            doctor_fields = ['license_number', 'department', 'specialization']
            for field in doctor_fields:
                if getattr(self, field):
                    completed_fields += 1
            total_fields = len(required_fields) + len(doctor_fields)
        elif self.is_patient:
            patient_fields = ['height', 'blood_type']
            for field in patient_fields:
                if getattr(self, field):
                    completed_fields += 1
            total_fields = len(required_fields) + len(patient_fields)
        else:
            total_fields = len(required_fields)
        
        return int((completed_fields / total_fields) * 100)
    
    def save(self, *args, **kwargs):
        # 自动更新资料完整度状态
        completion = self.get_full_profile_completion()
        self.is_profile_complete = completion >= 80
        super().save(*args, **kwargs)


class UserProfile(models.Model):
    """
    用户资料扩展模型（可选）
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # 健康档案摘要（对应HealthRecord表的部分功能）
    allergies = models.TextField('过敏史', blank=True, null=True)
    medical_history = models.TextField('既往病史', blank=True, null=True)
    family_history = models.TextField('家族史', blank=True, null=True)
    current_medications = models.TextField('当前用药', blank=True, null=True)
    
    # 偏好设置
    notification_enabled = models.BooleanField('启用通知', default=True)
    reminder_enabled = models.BooleanField('启用提醒', default=True)
    data_sharing_consent = models.BooleanField('数据共享同意', default=False)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'user_profile'
        verbose_name = '用户资料'
        verbose_name_plural = '用户资料'
    
    def __str__(self):
        return f"{self.user.name}的资料"


# 信号处理器：自动创建UserProfile
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """用户创建时自动创建对应的UserProfile"""
    if created:
        UserProfile.objects.create(user=instance)


class SMSVerificationCode(models.Model):
    """SMS验证码模型"""
    phone = models.CharField('手机号', max_length=20)
    code = models.CharField('验证码', max_length=6)
    purpose = models.CharField('用途', max_length=20, choices=[
        ('register', '注册验证'),
        ('login', '登录验证'),
        ('reset_password', '重置密码'),
        ('change_phone', '更换手机号'),
    ], default='register')
    
    # 状态管理
    is_used = models.BooleanField('是否已使用', default=False)
    is_verified = models.BooleanField('是否已验证', default=False)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    used_at = models.DateTimeField('使用时间', null=True, blank=True)
    expires_at = models.DateTimeField('过期时间')
    
    # 安全限制
    ip_address = models.GenericIPAddressField('发送IP', null=True, blank=True)
    attempt_count = models.PositiveIntegerField('验证尝试次数', default=0)
    
    class Meta:
        db_table = 'sms_verification_code'
        verbose_name = 'SMS验证码'
        verbose_name_plural = 'SMS验证码'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone', 'purpose', 'created_at']),
            models.Index(fields=['code', 'is_used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.phone} - {self.code} ({self.get_purpose_display()})"
    
    @property
    def is_expired(self):
        """检查验证码是否过期"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """检查验证码是否有效（未使用且未过期）"""
        return not self.is_used and not self.is_expired
    
    def mark_as_used(self):
        """标记验证码为已使用"""
        from django.utils import timezone
        self.is_used = True
        self.is_verified = True
        self.used_at = timezone.now()
        self.save(update_fields=['is_used', 'is_verified', 'used_at'])
    
    def increment_attempt(self):
        """增加验证尝试次数"""
        self.attempt_count += 1
        self.save(update_fields=['attempt_count'])
    
    @classmethod
    def generate_code(cls):
        """生成6位随机验证码"""
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    @classmethod
    def create_verification_code(cls, phone, purpose='register', ip_address=None):
        """创建新的验证码"""
        from django.utils import timezone
        from datetime import timedelta
        
        # 清理同一手机号的旧验证码
        cls.objects.filter(
            phone=phone, 
            purpose=purpose, 
            is_used=False
        ).update(is_used=True)
        
        # 创建新验证码
        code = cls.generate_code()
        expires_at = timezone.now() + timedelta(minutes=5)  # 5分钟过期
        
        return cls.objects.create(
            phone=phone,
            code=code,
            purpose=purpose,
            expires_at=expires_at,
            ip_address=ip_address
        )
    
    @classmethod
    def verify_code(cls, phone, code, purpose='register'):
        """验证验证码"""
        try:
            verification = cls.objects.get(
                phone=phone,
                code=code,
                purpose=purpose,
                is_used=False
            )
            
            if verification.is_expired:
                return False, '验证码已过期'
            
            if verification.attempt_count >= 3:
                return False, '验证失败次数过多，请重新获取'
            
            verification.mark_as_used()
            return True, '验证成功'
            
        except cls.DoesNotExist:
            # 增加尝试次数（如果验证码存在的话）
            try:
                verification = cls.objects.get(
                    phone=phone,
                    purpose=purpose,
                    is_used=False
                )
                verification.increment_attempt()
            except cls.DoesNotExist:
                pass
            
            return False, '验证码错误'
