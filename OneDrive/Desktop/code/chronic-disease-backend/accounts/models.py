from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings


class User(AbstractUser):
    """
    用户统一模型：包括患者、医生、管理员
    基于用户提供的数据库架构设计

    Unified user model covering patient, doctor, and admin roles.

    Security notes:
    - `USERNAME_FIELD` is set to `email` to reduce ambiguity.
    - Passwords are hashed via Django auth pipeline; never stored in plaintext.
    - `last_login_ip` helps with audit and suspicious activity review.
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
    chronic_diseases = models.JSONField('慢性疾病列表', blank=True, null=True, default=None, help_text='存储患者的慢性疾病ID列表。None=未评估，[]=健康，[diseases]=有疾病')
    
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
        """计算用户资料完整度 / Compute a simple profile completion score (0-100)."""
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
    
    def get_disease_risk_level(self):
        """
        根据患者的慢性疾病计算风险等级
        返回: 'unassessed', 'healthy', 'low', 'medium', 'high'

        Compute a coarse-grained disease risk classification using the
        presence of specific chronic disease identifiers.
        """
        if not self.is_patient:
            return 'unassessed'
        
        # 如果chronic_diseases字段为None，说明医生还没有进行疾病评估
        if self.chronic_diseases is None:
            return 'unassessed'
        
        # 如果chronic_diseases是空列表[]，说明医生已评估但患者没有疾病
        if len(self.chronic_diseases) == 0:
            return 'healthy'
        
        # 疾病风险分类（基于医学严重程度和生活质量影响）
        high_risk_diseases = [
            'cancer',           # 癌症 - 生命威胁
            'heart_disease',    # 心脏病 - 心血管风险
            'copd',            # 慢性阻塞性肺病 - 呼吸系统严重疾病
            'multiple_sclerosis', # 多发性硬化症 - 神经系统退行性疾病
            'parkinson',       # 帕金森病 - 神经退行性疾病
            'dementia',        # 痴呆症 - 认知功能严重衰退
            'alzheimer',       # 阿尔茨海默病 - 认知功能严重衰退
            'cystic_fibrosis', # 囊性纤维化 - 遗传性严重疾病
            'sickle_cell'      # 镰状细胞病 - 遗传性血液疾病
        ]
        
        medium_risk_diseases = [
            'diabetes',        # 糖尿病 - 代谢性疾病，需要持续管理
            'hypertension',    # 高血压 - 心血管危险因素
            'asthma',          # 哮喘 - 慢性呼吸系统疾病
            'epilepsy',        # 癫痫 - 神经系统疾病
            'crohn',           # 克罗恩病 - 炎症性肠病
            'ulcerative_colitis', # 溃疡性结肠炎 - 炎症性肠病
            'endometriosis',   # 子宫内膜异位症 - 妇科慢性疾病
            'hiv_aids',        # 艾滋病 - 免疫系统疾病
            'mood_disorder',   # 情绪障碍 - 精神健康问题
            'narcolepsy'       # 嗜睡症 - 睡眠障碍
        ]
        
        # 低风险疾病（其他未列出的疾病自动归为低风险）
        # 包括：arthritis, fibromyalgia, migraine 等
        
        # 检查高风险疾病
        if any(disease in high_risk_diseases for disease in self.chronic_diseases):
            return 'high'
        
        # 检查中风险疾病
        if any(disease in medium_risk_diseases for disease in self.chronic_diseases):
            return 'medium'
        
        # 有疾病但都是低风险的，或者没有疾病
        return 'low'
    
    def save(self, *args, **kwargs):
        # 自动更新资料完整度状态 / Auto-update profile completeness flag
        completion = self.get_full_profile_completion()
        self.is_profile_complete = completion >= 80
        super().save(*args, **kwargs)


class UserProfile(models.Model):
    """
    用户资料扩展模型（可选）

    Optional extension of user profile for preferences and clinical
    summary fields. Created automatically on user creation.
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

#SMS CAPTCHA model
class SMSVerificationCode(models.Model):
    """
    SMS验证码模型

    SMS verification code entity with basic anti-abuse controls:
    - Expiration window (default 5 minutes)
    - Attempt counter with an upper bound
    - Mark-as-used semantics to prevent replay
    """
    phone = models.CharField('手机号', max_length=20)
    code = models.CharField('验证码', max_length=6)
    purpose = models.CharField('用途', max_length=20, choices=[
        ('register', '注册验证'),
        ('login', '登录验证'),
        ('reset_password', '重置密码'),
        ('change_phone', '更换手机号'),
    ], default='register')
    
    # Status Management
    is_used = models.BooleanField('是否已使用', default=False)
    is_verified = models.BooleanField('是否已验证', default=False)
    
    # timestamp
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
        """检查验证码是否过期 / True if current time is past expiry."""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """检查验证码是否有效（未使用且未过期） / Convenience validity check."""
        return not self.is_used and not self.is_expired
    
    def mark_as_used(self):
        """标记验证码为已使用 / Mark code as used and verified with timestamp."""
        from django.utils import timezone
        self.is_used = True
        self.is_verified = True
        self.used_at = timezone.now()
        self.save(update_fields=['is_used', 'is_verified', 'used_at'])
    
    def increment_attempt(self):
        """增加验证尝试次数 / Increment and persist attempt counter."""
        self.attempt_count += 1
        self.save(update_fields=['attempt_count'])
    
    @classmethod
    def generate_code(cls):
        """生成6位随机验证码 / Generate a 6-digit numeric code as string."""
        import random
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    @classmethod
    def create_verification_code(cls, phone, purpose='register', ip_address=None):
        """
        创建新的验证码

        Issue a new SMS code after invalidating prior unused codes for
        the same phone/purpose pair. Codes expire in 5 minutes.
        """
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
        """
        验证验证码

        Validate a code for the given phone/purpose with expiration and
        attempt controls. Marks the code as used on success.
        """
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
