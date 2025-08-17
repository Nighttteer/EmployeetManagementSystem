from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, SMSVerificationCode


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    User registration serializer.
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'name', 'role', 'phone', 'age', 'gender',
            # 医生相关字段
            'license_number', 'department', 'title', 'specialization',
            # 患者相关字段
            'height', 'blood_type', 'smoking_status'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'name': {'required': True},
        }
    
    def validate(self, attrs):
        """
        Ensure the password confirmation matches the provided password.

        Returns:
            dict: Validated attributes when the password pair is consistent.
        Raises:
            serializers.ValidationError: If the two passwords do not match.
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("密码确认不匹配")
        return attrs
    
    def validate_email(self, value):
        """
        Enforce uniqueness on email addresses.

        Using unique emails reduces ambiguity during authentication and
        supports security notifications to a single, verified channel.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("邮箱已被注册")
        return value
    
    def validate_username(self, value):
        """
        Enforce uniqueness on username to prevent collisions.
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("用户名已存在")
        return value
    
    def validate_phone(self, value):
        """
        验证手机号格式（支持国际化）

        Validate phone number format (international/E.164-like):
        - Must start with '+' and contain digits only thereafter
        - Typical international length between 7 and 15 digits
        - Must be unique if provided
        """
        if not value:
            return value
        
        # 基本格式检查：应该以+开头，后面跟数字
        if not value.startswith('+'):
            raise serializers.ValidationError("手机号应包含国家区号（以+开头）")
        
        # 移除+号后应该都是数字
        phone_digits = value[1:]
        if not phone_digits.isdigit():
            raise serializers.ValidationError("手机号格式无效")
        
        # 长度检查（国际手机号通常在7-15位之间）
        if len(phone_digits) < 7 or len(phone_digits) > 15:
            raise serializers.ValidationError("手机号长度无效")
        
        # 检查是否已被使用
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("该手机号已被注册")
        
        return value
    
    def create(self, validated_data):
        """
        Create a new user using Django's `create_user` to ensure the
        password is hashed via the configured password hasher.

        Steps:
        1) Remove confirmation field (not persisted)
        2) Pop raw password from payload
        3) Delegate to `User.objects.create_user` to perform safe hashing
        """
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    用户登录序列化器 - 支持手机号登录

    User login serializer with phone-based authentication.

    Flow:
    - Validate E.164-like phone format
    - Resolve user by phone
    - Verify password hash using `check_password`
    - Optionally enforce role match when provided

    Security notes:
    - Error messages are intentionally generic to avoid disclosing which
      part of the credential pair failed (mitigates user enumeration).
    - Users must be active to proceed with login.
    """
    phone = serializers.CharField(required=True, help_text="手机号（包含国家区号）")
    password = serializers.CharField(required=True, write_only=True)
    role = serializers.ChoiceField(choices=[('patient', '患者'), ('doctor', '医生')], required=False)
    
    def validate_phone(self, value):
        """
        验证手机号格式

        Validate the phone number format using a simplified E.164 check.
        """
        if not value:
            raise serializers.ValidationError("手机号不能为空")
        
        # 基本格式检查：应该以+开头，后面跟数字
        if not value.startswith('+'):
            raise serializers.ValidationError("手机号应包含国家区号（以+开头）")
        
        # 移除+号后应该都是数字
        phone_digits = value[1:]
        if not phone_digits.isdigit():
            raise serializers.ValidationError("手机号格式无效")
        
        # 长度检查（国际手机号通常在7-15位之间）
        if len(phone_digits) < 7 or len(phone_digits) > 15:
            raise serializers.ValidationError("手机号长度无效")
        
        return value
    
    def validate(self, attrs):
        """
        Authenticate user by phone + password and optionally by role.

        Adds the authenticated `user` object to `attrs` when successful.
        """
        phone = attrs.get('phone')
        password = attrs.get('password')
        role = attrs.get('role')
        
        if phone and password:
            # Resolve the user by phone. Keep error responses generic
            # to avoid leaking which part failed.
            try:
                user = User.objects.get(phone=phone)
            except User.DoesNotExist:
                raise serializers.ValidationError('手机号或密码错误')
            
            # Verify password hash
            if not user.check_password(password):
                raise serializers.ValidationError('手机号或密码错误')
            
            if not user.is_active:
                raise serializers.ValidationError('账户已被禁用')
            
            # Optional role check for multi-tenant UX separation
            if role and user.role != role:
                raise serializers.ValidationError('角色不匹配')
                
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('必须提供手机号和密码')


class UserProfileSerializer(serializers.ModelSerializer):
    """
    用户资料序列化器

    User profile serializer.

    Includes a derived field `profile_completion` to indicate how much
    of the optional profile has been filled. This enables progressive
    onboarding and UX nudges without exposing sensitive internals.
    """
    profile_completion = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'name', 'role', 'phone', 'age', 'gender',
            'avatar', 'bio', 'address', 'emergency_contact', 'emergency_phone',
            'license_number', 'department', 'title', 'specialization',
            'height', 'blood_type', 'smoking_status',
            'is_verified', 'is_profile_complete', 'profile_completion',
            'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'created_at', 'updated_at', 'last_login']
    
    def get_profile_completion(self, obj):
        """Compute and return profile completion percentage/score."""
        return obj.get_full_profile_completion()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    用户资料更新序列化器

    Serializer for updating user profile data with light role-aware
    validation (e.g., doctors should maintain key professional fields).
    """
    
    class Meta:
        model = User
        fields = [
            'name', 'phone', 'age', 'gender', 'avatar', 'bio', 'address',
            'emergency_contact', 'emergency_phone',
            # 医生相关字段
            'license_number', 'department', 'title', 'specialization',
            # 患者相关字段
            'height', 'blood_type', 'smoking_status'
        ]
    
    def validate(self, attrs):
        """
        Apply role-aware validation rules for profile completeness.
        """
        user = self.instance
        
        # 根据用户角色验证必填字段
        if user.is_doctor:
            required_fields = ['license_number', 'department', 'specialization']
            for field in required_fields:
                if field in attrs and not attrs[field]:
                    raise serializers.ValidationError(f"医生用户必须填写{self.fields[field].label}")
        
        return attrs


class UserExtendedProfileSerializer(serializers.ModelSerializer):
    """
    用户扩展资料序列化器

    Extended profile serializer for less frequently edited attributes
    such as allergies, medical history, and consent preferences.
    """
    
    class Meta:
        model = UserProfile
        fields = [
            'allergies', 'medical_history', 'family_history', 'current_medications',
            'notification_enabled', 'reminder_enabled', 'data_sharing_consent',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PasswordChangeSerializer(serializers.Serializer):
    """
    密码修改序列化器

    Password change serializer.

    Security notes:
    - The old password is verified using `check_password`.
    - The new password is persisted via `set_password`, ensuring the
      password is hashed and never stored in plaintext.
    - New password must pass Django's password validators.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate_old_password(self, value):
        """Validate that the provided old password matches the account."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("原密码不正确")
        return value
    
    def validate(self, attrs):
        """Ensure the new password is confirmed correctly."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("新密码确认不匹配")
        return attrs
    
    def save(self):
        """
        Persist the new password securely using `set_password`.
        Returns the updated user instance.
        """
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    密码重置请求序列化器（发送验证码）

    Password reset request serializer (send SMS verification code).

    Process:
    - Validate phone format
    - Ensure the phone exists in the system
    - Rate-limiting and code issuance are handled in the corresponding view
      and the SMS code model utilities.
    """
    phone = serializers.CharField(required=True, max_length=20)
    
    def validate_phone(self, value):
        """
        验证手机号格式

        Validate phone format and existence for reset flow safety.
        """
        if not value:
            raise serializers.ValidationError("手机号不能为空")
        
        # 基本格式检查：应该以+开头，后面跟数字
        if not value.startswith('+'):
            raise serializers.ValidationError("手机号应包含国家区号（以+开头）")
        
        # 移除+号后应该都是数字
        phone_digits = value[1:]
        if not phone_digits.isdigit():
            raise serializers.ValidationError("手机号格式无效")
        
        # 长度检查（国际手机号通常在7-15位之间）
        if len(phone_digits) < 7 or len(phone_digits) > 15:
            raise serializers.ValidationError("手机号长度无效")
        
        # 检查用户是否存在
        if not User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("该手机号未注册")
        
        return value


class PasswordResetSerializer(serializers.Serializer):
    """
    密码重置序列化器（基于SMS验证码）

    Password reset serializer (SMS-based verification).

    Security notes:
    - Confirms the verification code validity (length, digits, not expired,
      not over-attempted, and not used).
    - Uses `set_password` to safely hash the new password.
    - Marks the verification code as used to prevent replay.
    """
    phone = serializers.CharField(required=True, max_length=20)
    code = serializers.CharField(required=True, max_length=6)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True, write_only=True)
    
    def validate_phone(self, value):
        """
        验证手机号格式

        Validate phone format and ensure a user exists for the number.
        """
        if not value:
            raise serializers.ValidationError("手机号不能为空")
        
        # 基本格式检查：应该以+开头，后面跟数字
        if not value.startswith('+'):
            raise serializers.ValidationError("手机号应包含国家区号（以+开头）")
        
        # 移除+号后应该都是数字
        phone_digits = value[1:]
        if not phone_digits.isdigit():
            raise serializers.ValidationError("手机号格式无效")
        
        # 长度检查（国际手机号通常在7-15位之间）
        if len(phone_digits) < 7 or len(phone_digits) > 15:
            raise serializers.ValidationError("手机号长度无效")
        
        # 检查用户是否存在
        if not User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("该手机号未注册")
        
        return value
    
    def validate_code(self, value):
        """
        验证验证码格式

        Validate verification code shape (6 numeric digits).
        """
        if not value or len(value) != 6:
            raise serializers.ValidationError("验证码必须是6位数字")
        
        if not value.isdigit():
            raise serializers.ValidationError("验证码必须是数字")
        
        return value
    
    def validate(self, attrs):
        """
        Cross-field validation for password confirmation and SMS code
        verification. On success, the corresponding code object is
        attached as a private attribute for later consumption in `save`.
        """
        # 验证密码确认
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("密码确认不匹配")
        
        # 验证SMS验证码
        phone = attrs.get('phone')
        code = attrs.get('code')
        
        if phone and code:
            try:
                verification = SMSVerificationCode.objects.get(
                    phone=phone,
                    code=code,
                    purpose='reset_password',
                    is_used=False
                )
                
                if verification.is_expired:
                    raise serializers.ValidationError("验证码已过期")
                
                if verification.attempt_count >= 3:
                    raise serializers.ValidationError("验证失败次数过多，请重新获取")
                
                attrs['_verification_code'] = verification
                
            except SMSVerificationCode.DoesNotExist:
                # 增加尝试次数
                try:
                    verification = SMSVerificationCode.objects.get(
                        phone=phone,
                        purpose='reset_password',
                        is_used=False
                    )
                    verification.increment_attempt()
                except SMSVerificationCode.DoesNotExist:
                    pass
                
                raise serializers.ValidationError("验证码错误或已失效")
        
        return attrs
    
    def save(self):
        """
        Set the new password for the user identified by phone and mark
        the verification code as used to prevent replay attacks.
        """
        phone = self.validated_data['phone']
        new_password = self.validated_data['new_password']
        verification_code = self.validated_data['_verification_code']
        
        # 获取用户并更新密码
        user = User.objects.get(phone=phone)
        user.set_password(new_password)
        user.save()
        
        # 标记验证码为已使用
        verification_code.mark_as_used()
        
        return user


class UserListSerializer(serializers.ModelSerializer):
    """
    用户列表序列化器（用于医生查看患者列表等）

    Lightweight projection of user data for list views, including a
    computed `risk_level` for patients to support triage and dashboards.
    """
    risk_level = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'role', 'phone', 'age', 'gender',
            'avatar', 'is_profile_complete', 'created_at', 'last_login',
            'chronic_diseases', 'risk_level'  # 添加疾病和风险等级字段
        ]
        read_only_fields = fields
    
    def get_risk_level(self, obj):
        """
        计算并返回患者的风险等级

        Compute and return the patient's risk level. For non-patient
        roles, return a sentinel such as 'unassessed'.
        """
        if obj.role != 'patient':
            return 'unassessed'
        return obj.get_disease_risk_level() 

# SMS验证相关序列化器
class SendSMSCodeSerializer(serializers.Serializer):
    """
    发送SMS验证码序列化器

    Serializer responsible for validating phone and purpose before
    issuing an SMS verification code. Additional rate-limiting checks
    (per minute and per day) help mitigate abuse.
    """
    phone = serializers.CharField(required=True, max_length=20)
    purpose = serializers.ChoiceField(
        choices=[
            ('register', '注册验证'),
            ('login', '登录验证'),
            ('reset_password', '重置密码'),
            ('change_phone', '更换手机号'),
        ],
        default='register'
    )
    
    def validate_phone(self, value):
        """
        验证手机号格式

        Validate phone format using a simplified E.164 check.
        """
        if not value:
            raise serializers.ValidationError("手机号不能为空")
        
        # 基本格式检查：应该以+开头，后面跟数字
        if not value.startswith('+'):
            raise serializers.ValidationError("手机号应包含国家区号（以+开头）")
        
        # 移除+号后应该都是数字
        phone_digits = value[1:]
        if not phone_digits.isdigit():
            raise serializers.ValidationError("手机号格式无效")
        
        # 长度检查（国际手机号通常在7-15位之间）
        if len(phone_digits) < 7 or len(phone_digits) > 15:
            raise serializers.ValidationError("手机号长度无效")
        
        return value
    
    def validate(self, attrs):
        """
        Enforce rate limits for code issuance:
        - At most once per minute
        - Up to 10 times per day
        """
        phone = attrs.get('phone')
        purpose = attrs.get('purpose')
        
        # 检查发送频率限制
        from django.utils import timezone
        from datetime import timedelta
        
        # 检查1分钟内是否已发送过验证码
        one_minute_ago = timezone.now() - timedelta(minutes=1)
        recent_codes = SMSVerificationCode.objects.filter(
            phone=phone,
            purpose=purpose,
            created_at__gte=one_minute_ago
        ).count()
        
        if recent_codes > 0:
            raise serializers.ValidationError("请等待1分钟后再次发送验证码")
        
        # 检查每日发送限制
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_codes = SMSVerificationCode.objects.filter(
            phone=phone,
            purpose=purpose,
            created_at__gte=today_start
        ).count()
        
        if today_codes >= 10:
            raise serializers.ValidationError("今日发送次数已达上限")
        
        return attrs


class VerifySMSCodeSerializer(serializers.Serializer):
    """
    验证SMS验证码序列化器

    Validate a supplied code for a given phone and purpose without
    marking the code as used (useful for pre-check flows such as
    registration prior to persistence).
    """
    phone = serializers.CharField(required=True, max_length=20)
    code = serializers.CharField(required=True, max_length=6)
    purpose = serializers.ChoiceField(
        choices=[
            ('register', '注册验证'),
            ('login', '登录验证'),
            ('reset_password', '重置密码'),
            ('change_phone', '更换手机号'),
        ],
        default='register'
    )
    
    def validate_phone(self, value):
        """
        验证手机号格式

        Validate phone format using a simplified E.164 check.
        """
        if not value:
            raise serializers.ValidationError("手机号不能为空")
        
        # 基本格式检查：应该以+开头，后面跟数字
        if not value.startswith('+'):
            raise serializers.ValidationError("手机号应包含国家区号（以+开头）")
        
        # 移除+号后应该都是数字
        phone_digits = value[1:]
        if not phone_digits.isdigit():
            raise serializers.ValidationError("手机号格式无效")
        
        # 长度检查（国际手机号通常在7-15位之间）
        if len(phone_digits) < 7 or len(phone_digits) > 15:
            raise serializers.ValidationError("手机号长度无效")
        
        return value
    
    def validate_code(self, value):
        """
        验证验证码格式

        Validate verification code shape (6 numeric digits).
        """
        if not value or len(value) != 6:
            raise serializers.ValidationError("验证码必须是6位数字")
        
        if not value.isdigit():
            raise serializers.ValidationError("验证码必须是数字")
        
        return value
    
    def validate(self, attrs):
        """
        Check that the code exists, is not expired or over-attempted,
        and remains unused. Attach the code object for downstream use.
        """
        phone = attrs.get('phone')
        code = attrs.get('code')
        purpose = attrs.get('purpose')
        
        # 验证验证码但不标记为已使用（在注册时才标记）
        try:
            verification = SMSVerificationCode.objects.get(
                phone=phone,
                code=code,
                purpose=purpose,
                is_used=False
            )
            
            if verification.is_expired:
                raise serializers.ValidationError('验证码已过期')
            
            if verification.attempt_count >= 3:
                raise serializers.ValidationError('验证失败次数过多，请重新获取')
                
            # 只验证不标记为已使用
            attrs['verification_code'] = verification
            
        except SMSVerificationCode.DoesNotExist:
            raise serializers.ValidationError('验证码错误')
        
        return attrs


class UserRegistrationWithSMSSerializer(serializers.ModelSerializer):
    """
    带SMS验证的用户注册序列化器

    User registration serializer with SMS verification.

    Process:
    - Validate user core fields and phone format
    - Enforce per-role uniqueness for phone numbers (a phone can be used
      by one patient and one doctor at most)
    - Validate SMS code and mark it as used after successful creation
    - Create user via `create_user` to hash password securely
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    sms_code = serializers.CharField(write_only=True, max_length=6)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 'sms_code',
            'name', 'role', 'phone', 'age', 'gender',
            # 医生相关字段
            'license_number', 'department', 'title', 'specialization',
            # 患者相关字段
            'height', 'blood_type', 'smoking_status'
        ]
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'name': {'required': True},
            'phone': {'required': True},
        }
    
    def validate(self, attrs):
        """
        Cross-field checks for password confirmation, per-role phone
        uniqueness, and SMS code validity with attempt and expiry checks.
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("密码确认不匹配")
        
        # 验证手机号按角色的唯一性（一个手机号最多只能有一个医生端和患者端）
        phone = attrs.get('phone')
        role = attrs.get('role')
        
        if phone and role:
            existing_user = User.objects.filter(phone=phone, role=role).first()
            if existing_user:
                role_name = "医生" if role == "doctor" else "患者"
                raise serializers.ValidationError(f"该手机号已注册{role_name}账号")
        
        # 验证SMS验证码（注册时才标记为已使用）
        sms_code = attrs.get('sms_code')
        
        if phone and sms_code:
            try:
                verification = SMSVerificationCode.objects.get(
                    phone=phone,
                    code=sms_code,
                    purpose='register',
                    is_used=False
                )
                
                if verification.is_expired:
                    raise serializers.ValidationError("验证码已过期")
                
                if verification.attempt_count >= 3:
                    raise serializers.ValidationError("验证失败次数过多，请重新获取")
                
                # 保存验证码对象，在create方法中标记为已使用
                attrs['_verification_code'] = verification
                
            except SMSVerificationCode.DoesNotExist:
                raise serializers.ValidationError("验证码错误或已失效")
        
        return attrs
    
    def validate_email(self, value):
        """Ensure email uniqueness for account integrity."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("邮箱已被注册")
        return value
    
    def validate_username(self, value):
        """Ensure username uniqueness to avoid collisions."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("用户名已存在")
        return value
    
    def validate_phone(self, value):
        """
        验证手机号格式（支持国际化）

        Validate E.164-like phone pattern and length bounds.
        """
        if not value:
            raise serializers.ValidationError("手机号不能为空")
        
        # 基本格式检查：应该以+开头，后面跟数字
        if not value.startswith('+'):
            raise serializers.ValidationError("手机号应包含国家区号（以+开头）")
        
        # 移除+号后应该都是数字
        phone_digits = value[1:]
        if not phone_digits.isdigit():
            raise serializers.ValidationError("手机号格式无效")
        
        # 长度检查（国际手机号通常在7-15位之间）
        if len(phone_digits) < 7 or len(phone_digits) > 15:
            raise serializers.ValidationError("手机号长度无效")
        
        return value
    
    def validate_sms_code(self, value):
        """
        验证SMS验证码格式

        Validate that the SMS code is 6 digits and numeric.
        """
        if not value or len(value) != 6:
            raise serializers.ValidationError("验证码必须是6位数字")
        
        if not value.isdigit():
            raise serializers.ValidationError("验证码必须是数字")
        
        return value
    
    def create(self, validated_data):
        """
        Create a new user and mark the SMS code as used after successful
        persistence to prevent code reuse.
        """
        validated_data.pop('password_confirm')
        validated_data.pop('sms_code')  # 移除SMS验证码，不保存到用户模型
        verification_code = validated_data.pop('_verification_code', None)  # 获取验证码对象
        password = validated_data.pop('password')
        
        # 创建用户
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        # 用户创建成功后才标记验证码为已使用
        if verification_code:
            verification_code.mark_as_used()
        
        return user


class PatientUpdateSerializer(serializers.ModelSerializer):
    """
    患者信息更新序列化器（专门用于医生更新患者信息）

    Serializer dedicated to doctor-mediated updates of patient profiles,
    including chronic disease lists. Applies shape validation on
    `chronic_diseases` and logs before/after states in the view layer.
    """
    
    class Meta:
        model = User
        fields = [
            'name', 'age', 'gender', 'phone', 'address',
            'emergency_contact', 'emergency_phone',
            'height', 'blood_type', 'smoking_status',
            'chronic_diseases'  # 支持疾病信息更新
        ]
        extra_kwargs = {
            'name': {'required': False},
            'age': {'required': False},
            'gender': {'required': False},
            'phone': {'required': False},
            'chronic_diseases': {'required': False, 'allow_null': True},
        }
    
    def validate_chronic_diseases(self, value):
        """
        验证chronic_diseases字段

        Validate that `chronic_diseases` is either:
        - None (meaning unassessed), or
        - A list of allowed disease identifiers.

        Raises an explicit validation error for unknown identifiers to
        maintain data quality.
        """
        # 允许None（未评估）、空列表（健康）或疾病ID列表
        if value is None:
            return value  # 未评估状态
        
        if isinstance(value, list):
            # 验证疾病ID是否有效（可选，根据需要实现）
            valid_diseases = [
                'alzheimer', 'arthritis', 'asthma', 'cancer', 'copd', 
                'crohn', 'cystic_fibrosis', 'dementia', 'diabetes', 
                'endometriosis', 'epilepsy', 'fibromyalgia', 'heart_disease', 
                'hypertension', 'hiv_aids', 'migraine', 'mood_disorder', 
                'multiple_sclerosis', 'narcolepsy', 'parkinson', 
                'sickle_cell', 'ulcerative_colitis'
            ]
            
            for disease in value:
                if disease not in valid_diseases:
                    raise serializers.ValidationError(f"无效的疾病ID: {disease}")
            
            return value
        
        raise serializers.ValidationError("chronic_diseases必须是None或疾病ID列表")
    
    def update(self, instance, validated_data):
        """
        更新患者信息

        Update patient fields from validated input. The view is
        responsible for logging before/after comparisons and computing
        risk level changes post-update.
        """
        # 记录更新前的状态（用于日志）
        old_diseases = instance.chronic_diseases
        
        # 执行更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # 记录日志
        new_diseases = instance.chronic_diseases

        
        return instance 