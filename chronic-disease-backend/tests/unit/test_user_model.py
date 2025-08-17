"""
用户模型单元测试
测试用户创建、密码加密、token生成等核心功能
"""
import pytest
from django.test import TestCase
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserProfile, SMSVerificationCode
from tests.factories import UserFactory, PatientFactory, DoctorFactory


class TestUserModel(TestCase):
    """用户模型测试"""
    
    def setUp(self):
        """测试前准备"""
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'name': '测试用户',
            'password': 'testpassword123',
            'role': 'patient',
            'phone': '13800138000',
            'age': 30,
            'gender': 'male'
        }
    
    def test_user_creation_success(self):
        """测试用户成功创建"""
        # Arrange & Act
        user = User.objects.create_user(**self.user_data)
        
        # Assert
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, '测试用户')
        self.assertEqual(user.role, 'patient')
        self.assertTrue(user.is_patient)
        self.assertFalse(user.is_doctor)
        self.assertFalse(user.is_admin)
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)
    
    def test_password_encryption(self):
        """测试密码加密存储"""
        # Arrange & Act
        user = User.objects.create_user(**self.user_data)
        
        # Assert - 密码不是明文存储
        self.assertNotEqual(user.password, 'testpassword123')
        # 在测试环境中使用MD5哈希，所以格式不同
        self.assertTrue(len(user.password) > 10)  # 确保密码被哈希
        
        # Assert - 可以验证密码
        self.assertTrue(check_password('testpassword123', user.password))
        self.assertFalse(check_password('wrongpassword', user.password))
    
    def test_user_authentication(self):
        """测试用户认证"""
        # Arrange
        user = User.objects.create_user(**self.user_data)
        
        # Act & Assert - 正确密码认证成功
        authenticated_user = authenticate(
            username='test@example.com', 
            password='testpassword123'
        )
        self.assertEqual(authenticated_user, user)
        
        # Act & Assert - 错误密码认证失败
        failed_auth = authenticate(
            username='test@example.com', 
            password='wrongpassword'
        )
        self.assertIsNone(failed_auth)
    
    def test_token_generation(self):
        """测试JWT Token生成"""
        # Arrange
        user = User.objects.create_user(**self.user_data)
        
        # Act
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Assert
        self.assertIsNotNone(str(refresh))
        self.assertIsNotNone(str(access_token))
        
        # JWT token应该有三个部分，用.分隔
        refresh_parts = str(refresh).split('.')
        access_parts = str(access_token).split('.')
        
        self.assertEqual(len(refresh_parts), 3)
        self.assertEqual(len(access_parts), 3)
        
        # 验证token包含用户ID
        self.assertEqual(refresh['user_id'], user.id)
    
    def test_email_unique_constraint(self):
        """测试邮箱唯一性约束"""
        # Arrange
        User.objects.create_user(**self.user_data)
        
        # Act & Assert
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                username='testuser2',
                email='test@example.com',  # 重复邮箱
                name='测试用户2',
                password='testpassword123'
            )
    
    def test_user_role_properties(self):
        """测试用户角色属性"""
        # Test patient role
        patient_data = self.user_data.copy()
        patient_data['role'] = 'patient'
        patient = User.objects.create_user(**patient_data)
        self.assertTrue(patient.is_patient)
        self.assertFalse(patient.is_doctor)
        self.assertFalse(patient.is_admin)
        
        # Test doctor role
        doctor_data = self.user_data.copy()
        doctor_data['email'] = 'doctor@example.com'
        doctor_data['username'] = 'doctor'
        doctor_data['role'] = 'doctor'
        doctor = User.objects.create_user(**doctor_data)
        self.assertFalse(doctor.is_patient)
        self.assertTrue(doctor.is_doctor)
        self.assertFalse(doctor.is_admin)
        
        # Test admin role
        admin_data = self.user_data.copy()
        admin_data['email'] = 'admin@example.com'
        admin_data['username'] = 'admin'
        admin_data['role'] = 'admin'
        admin = User.objects.create_user(**admin_data)
        self.assertFalse(admin.is_patient)
        self.assertFalse(admin.is_doctor)
        self.assertTrue(admin.is_admin)
    
    def test_profile_completion_calculation(self):
        """测试资料完整度计算"""
        # Arrange - 创建基本用户（缺少一些字段）
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            name='测试用户',
            password='testpassword123',
            role='patient'
            # 缺少 phone, age, gender, height, blood_type
        )
        
        # Act & Assert - 初始完整度较低
        completion = user.get_full_profile_completion()
        self.assertLess(completion, 50)
        
        # Act - 填写更多信息
        user.phone = '13800138000'
        user.age = 30
        user.gender = 'male'
        user.height = 170.0
        user.blood_type = 'A'
        
        # Assert - 完整度提高
        completion = user.get_full_profile_completion()
        self.assertEqual(completion, 100)
    
    def test_disease_risk_level_calculation(self):
        """测试疾病风险等级计算"""
        # Test unassessed (None) - 需要手动设置
        user = PatientFactory()
        user.chronic_diseases = None
        user.save()
        self.assertEqual(user.get_disease_risk_level(), 'unassessed')
        
        # Test healthy (empty list)
        user.chronic_diseases = []
        user.save()
        self.assertEqual(user.get_disease_risk_level(), 'healthy')
        
        # Test low risk
        user.chronic_diseases = ['arthritis']
        user.save()
        self.assertEqual(user.get_disease_risk_level(), 'low')
        
        # Test medium risk
        user.chronic_diseases = ['diabetes']
        user.save()
        self.assertEqual(user.get_disease_risk_level(), 'medium')
        
        # Test high risk
        user.chronic_diseases = ['cancer']
        user.save()
        self.assertEqual(user.get_disease_risk_level(), 'high')
        
        # Test multiple diseases (high risk wins)
        user.chronic_diseases = ['arthritis', 'diabetes', 'cancer']
        user.save()
        self.assertEqual(user.get_disease_risk_level(), 'high')
        
        # Test non-patient user
        doctor = DoctorFactory()
        self.assertEqual(doctor.get_disease_risk_level(), 'unassessed')
    
    def test_user_str_representation(self):
        """测试用户字符串表示"""
        # Arrange
        user = User.objects.create_user(**self.user_data)
        
        # Act & Assert
        expected_str = "测试用户 (患者)"
        self.assertEqual(str(user), expected_str)
    
    def test_profile_completeness_auto_update(self):
        """测试资料完整度自动更新"""
        # Arrange
        user = User.objects.create_user(**self.user_data)
        
        # Act - 保存用户会自动更新is_profile_complete
        user.save()
        
        # Assert - 根据完整度设置标志
        completion = user.get_full_profile_completion()
        if completion >= 80:
            self.assertTrue(user.is_profile_complete)
        else:
            self.assertFalse(user.is_profile_complete)


class TestUserProfile(TestCase):
    """用户资料扩展模型测试"""
    
    def test_profile_auto_creation(self):
        """测试UserProfile自动创建"""
        # Arrange & Act
        user = UserFactory()
        
        # Assert - UserProfile应该自动创建
        self.assertTrue(hasattr(user, 'profile'))
        self.assertIsInstance(user.profile, UserProfile)
        self.assertEqual(user.profile.user, user)
    
    def test_profile_default_values(self):
        """测试UserProfile默认值"""
        # Arrange & Act
        user = UserFactory()
        profile = user.profile
        
        # Assert
        self.assertTrue(profile.notification_enabled)
        self.assertTrue(profile.reminder_enabled)
        self.assertFalse(profile.data_sharing_consent)
        self.assertIsNotNone(profile.created_at)
        self.assertIsNotNone(profile.updated_at)
    
    def test_profile_str_representation(self):
        """测试UserProfile字符串表示"""
        # Arrange
        user = UserFactory(name='张三')
        profile = user.profile
        
        # Act & Assert
        expected_str = "张三的资料"
        self.assertEqual(str(profile), expected_str)


class TestSMSVerificationCode(TestCase):
    """SMS验证码模型测试"""
    
    def setUp(self):
        """测试前准备"""
        self.phone = '13800138000'
        self.purpose = 'register'
    
    def test_code_generation(self):
        """测试验证码生成"""
        # Act
        code = SMSVerificationCode.generate_code()
        
        # Assert
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())
    
    def test_verification_code_creation(self):
        """测试验证码创建"""
        # Act
        sms_code = SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose,
            ip_address='192.168.1.1'
        )
        
        # Assert
        self.assertEqual(sms_code.phone, self.phone)
        self.assertEqual(sms_code.purpose, self.purpose)
        self.assertEqual(len(sms_code.code), 6)
        self.assertFalse(sms_code.is_used)
        self.assertFalse(sms_code.is_expired)
        self.assertTrue(sms_code.is_valid)
        self.assertEqual(sms_code.ip_address, '192.168.1.1')
        self.assertEqual(sms_code.attempt_count, 0)
    
    def test_code_expiration(self):
        """测试验证码过期"""
        # Arrange
        sms_code = SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose
        )
        
        # Act - 修改过期时间到过去
        past_time = timezone.now() - timedelta(minutes=10)
        sms_code.expires_at = past_time
        sms_code.save()
        
        # Assert
        self.assertTrue(sms_code.is_expired)
        self.assertFalse(sms_code.is_valid)
    
    def test_code_verification_success(self):
        """测试验证码验证成功"""
        # Arrange
        sms_code = SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose
        )
        
        # Act
        success, message = SMSVerificationCode.verify_code(
            phone=self.phone,
            code=sms_code.code,
            purpose=self.purpose
        )
        
        # Assert
        self.assertTrue(success)
        self.assertEqual(message, '验证成功')
        
        # Refresh from database
        sms_code.refresh_from_db()
        self.assertTrue(sms_code.is_used)
        self.assertTrue(sms_code.is_verified)
        self.assertIsNotNone(sms_code.used_at)
    
    def test_code_verification_wrong_code(self):
        """测试错误验证码"""
        # Arrange
        SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose
        )
        
        # Act
        success, message = SMSVerificationCode.verify_code(
            phone=self.phone,
            code='000000',  # 错误验证码
            purpose=self.purpose
        )
        
        # Assert
        self.assertFalse(success)
        self.assertEqual(message, '验证码错误')
    
    def test_code_verification_expired(self):
        """测试过期验证码验证"""
        # Arrange
        sms_code = SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose
        )
        
        # 设置为过期
        past_time = timezone.now() - timedelta(minutes=10)
        sms_code.expires_at = past_time
        sms_code.save()
        
        # Act
        success, message = SMSVerificationCode.verify_code(
            phone=self.phone,
            code=sms_code.code,
            purpose=self.purpose
        )
        
        # Assert
        self.assertFalse(success)
        self.assertEqual(message, '验证码已过期')
    
    def test_attempt_limit(self):
        """测试验证尝试次数限制"""
        # Arrange
        sms_code = SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose
        )
        
        # Act - 多次错误尝试
        for _ in range(3):
            SMSVerificationCode.verify_code(
                phone=self.phone,
                code='000000',  # 错误验证码
                purpose=self.purpose
            )
        
        # 刷新数据
        sms_code.refresh_from_db()
        
        # Act - 再次尝试（即使用正确验证码）
        success, message = SMSVerificationCode.verify_code(
            phone=self.phone,
            code=sms_code.code,
            purpose=self.purpose
        )
        
        # Assert
        self.assertFalse(success)
        self.assertEqual(message, '验证失败次数过多，请重新获取')
    
    def test_old_codes_invalidation(self):
        """测试旧验证码失效"""
        # Arrange - 创建第一个验证码
        old_code = SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose
        )
        
        # Act - 创建新验证码
        new_code = SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose
        )
        
        # Assert - 旧验证码应该被标记为已使用
        old_code.refresh_from_db()
        self.assertTrue(old_code.is_used)
        self.assertFalse(new_code.is_used)
    
    def test_sms_code_str_representation(self):
        """测试SMS验证码字符串表示"""
        # Arrange
        sms_code = SMSVerificationCode.create_verification_code(
            phone=self.phone,
            purpose=self.purpose
        )
        
        # Act & Assert
        expected_str = f"{self.phone} - {sms_code.code} (注册验证)"
        self.assertEqual(str(sms_code), expected_str)


class TestUserModelIntegration(TestCase):
    """用户模型集成测试"""
    
    def test_user_with_profile_creation_workflow(self):
        """测试用户创建完整流程"""
        # Arrange
        user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'name': '测试用户',
            'password': 'testpassword123',
            'role': 'patient',
            'phone': '13800138000'
        }
        
        # Act - 创建用户
        user = User.objects.create_user(**user_data)
        
        # Assert - 用户和资料都应该存在
        self.assertIsNotNone(user.id)
        self.assertTrue(hasattr(user, 'profile'))
        
        # Act - 更新用户资料
        user.profile.allergies = '花生过敏'
        user.profile.notification_enabled = False
        user.profile.save()
        
        # Assert - 资料更新成功
        user.refresh_from_db()
        self.assertEqual(user.profile.allergies, '花生过敏')
        self.assertFalse(user.profile.notification_enabled)
    
    def test_sms_verification_workflow(self):
        """测试SMS验证完整流程"""
        phone = '13800138000'
        
        # Step 1: 创建验证码
        sms_code = SMSVerificationCode.create_verification_code(
            phone=phone,
            purpose='register'
        )
        
        # Step 2: 验证码验证
        success, message = SMSVerificationCode.verify_code(
            phone=phone,
            code=sms_code.code,
            purpose='register'
        )
        
        # Step 3: 创建用户
        if success:
            user = User.objects.create_user(
                username='smsuser',
                email='sms@example.com',
                name='SMS用户',
                password='testpassword123',
                phone=phone,
                is_verified=True  # 已验证手机号
            )
        
        # Assert
        self.assertTrue(success)
        self.assertTrue(user.is_verified)
        self.assertEqual(user.phone, phone)


# 使用pytest的测试用例
@pytest.mark.django_db
class TestUserModelWithPytest:
    """使用pytest的用户模型测试"""
    
    def test_user_factory_creation(self):
        """测试使用Factory创建用户"""
        # Act
        user = UserFactory()
        
        # Assert
        assert user.id is not None
        assert user.email is not None
        assert user.name is not None
        assert hasattr(user, 'profile')
    
    def test_patient_factory_creation(self):
        """测试患者Factory"""
        # Act
        patient = PatientFactory(chronic_diseases=['diabetes'])
        
        # Assert
        assert patient.is_patient
        assert patient.chronic_diseases == ['diabetes']
        assert patient.get_disease_risk_level() == 'medium'
    
    def test_doctor_factory_creation(self):
        """测试医生Factory"""
        # Act
        doctor = DoctorFactory()
        
        # Assert
        assert doctor.is_doctor
        assert doctor.license_number is not None
        assert doctor.department is not None
        assert doctor.specialization is not None
    
    def test_multiple_users_with_factories(self):
        """测试批量创建用户"""
        # Act
        patients = PatientFactory.create_batch(5)
        doctors = DoctorFactory.create_batch(3)
        
        # Assert
        assert len(patients) == 5
        assert len(doctors) == 3
        assert all(p.is_patient for p in patients)
        assert all(d.is_doctor for d in doctors)
    
    @pytest.mark.parametrize("role,expected_property", [
        ('patient', 'is_patient'),
        ('doctor', 'is_doctor'),
        ('admin', 'is_admin'),
    ])
    def test_user_role_properties_parametrized(self, role, expected_property):
        """参数化测试用户角色属性"""
        # Act
        user = UserFactory(role=role)
        
        # Assert
        assert getattr(user, expected_property)
    
    @pytest.mark.parametrize("diseases,expected_risk", [
        (None, 'unassessed'),
        ([], 'healthy'),
        (['arthritis'], 'low'),
        (['diabetes'], 'medium'),
        (['cancer'], 'high'),
        (['arthritis', 'diabetes', 'cancer'], 'high'),
    ])
    def test_disease_risk_calculation_parametrized(self, diseases, expected_risk):
        """参数化测试疾病风险计算"""
        # Act
        patient = PatientFactory()
        patient.chronic_diseases = diseases
        patient.save()
        
        # Assert
        assert patient.get_disease_risk_level() == expected_risk
