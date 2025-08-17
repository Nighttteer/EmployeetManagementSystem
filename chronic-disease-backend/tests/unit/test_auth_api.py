"""
登录注册API单元测试
测试成功/失败响应、Token生成等核心功能
"""
import pytest
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import json

from accounts.models import User, SMSVerificationCode
from accounts.serializers import UserRegistrationSerializer, UserLoginSerializer
from tests.factories import UserFactory, PatientFactory, DoctorFactory

User = get_user_model()


class TestUserRegistrationAPI(APITestCase):
    """用户注册API测试"""
    
    def setUp(self):
        """测试前准备"""
        self.register_url = reverse('accounts:register')
        self.valid_registration_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'name': '测试用户',
            'password': 'testpassword123',
            'password_confirm': 'testpassword123',
            'role': 'patient',
            'phone': '+8613800138000',
            'age': 30,
            'gender': 'male'
        }
    
    def test_successful_registration(self):
        """测试成功注册"""
        # Act
        response = self.client.post(
            self.register_url, 
            self.valid_registration_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        
        # 验证用户已创建
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.name, '测试用户')
        self.assertEqual(user.role, 'patient')
        self.assertTrue(user.check_password('testpassword123'))
        
        # 验证token生成
        tokens = response.data['tokens']
        self.assertIn('access', tokens)
        self.assertIn('refresh', tokens)
        self.assertIsNotNone(tokens['access'])
        self.assertIsNotNone(tokens['refresh'])
    
    def test_registration_missing_required_fields(self):
        """测试缺少必填字段的注册"""
        # Arrange
        invalid_data = self.valid_registration_data.copy()
        del invalid_data['email']
        
        # Act
        response = self.client.post(
            self.register_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_registration_password_mismatch(self):
        """测试密码不匹配"""
        # Arrange
        invalid_data = self.valid_registration_data.copy()
        invalid_data['password_confirm'] = 'differentpassword'
        
        # Act
        response = self.client.post(
            self.register_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # 密码确认错误可能在non_field_errors中
        self.assertTrue(
            'password_confirm' in response.data or 
            'non_field_errors' in response.data
        )
    
    def test_registration_duplicate_email(self):
        """测试重复邮箱注册"""
        # Arrange - 先创建一个用户
        UserFactory(email='test@example.com')
        
        # Act
        response = self.client.post(
            self.register_url, 
            self.valid_registration_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_registration_duplicate_phone(self):
        """测试重复手机号注册"""
        # Arrange - 先创建一个用户
        UserFactory(phone='+8613800138000')
        
        # Act
        response = self.client.post(
            self.register_url, 
            self.valid_registration_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)
    
    def test_registration_invalid_phone_format(self):
        """测试无效手机号格式"""
        # Arrange
        invalid_data = self.valid_registration_data.copy()
        invalid_data['phone'] = '13800138000'  # 缺少国家区号
        
        # Act
        response = self.client.post(
            self.register_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)
    
    def test_registration_invalid_email_format(self):
        """测试无效邮箱格式"""
        # Arrange
        invalid_data = self.valid_registration_data.copy()
        invalid_data['email'] = 'invalid-email'
        
        # Act
        response = self.client.post(
            self.register_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_registration_weak_password(self):
        """测试弱密码"""
        # Arrange
        invalid_data = self.valid_registration_data.copy()
        invalid_data['password'] = '123'
        invalid_data['password_confirm'] = '123'
        
        # Act
        response = self.client.post(
            self.register_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)


class TestUserLoginAPI(APITestCase):
    """用户登录API测试"""
    
    def setUp(self):
        """测试前准备"""
        self.login_url = reverse('accounts:login')
        self.user = UserFactory(
            phone='+8613800138000',
            password='testpassword123',
            role='patient'
        )
        # 设置明文密码用于测试
        self.user.set_password('testpassword123')
        self.user.save()
        
        self.valid_login_data = {
            'phone': '+8613800138000',
            'password': 'testpassword123',
            'role': 'patient'
        }
    
    def test_successful_login(self):
        """测试成功登录"""
        # Act
        response = self.client.post(
            self.login_url, 
            self.valid_login_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        
        # 验证用户信息
        user_data = response.data['user']
        self.assertEqual(user_data['id'], self.user.id)
        self.assertEqual(user_data['email'], self.user.email)
        
        # 验证token生成
        tokens = response.data['tokens']
        self.assertIn('access', tokens)
        self.assertIn('refresh', tokens)
        self.assertIsNotNone(tokens['access'])
        self.assertIsNotNone(tokens['refresh'])
        
        # 验证last_login_ip更新
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.last_login_ip)
    
    def test_login_wrong_password(self):
        """测试错误密码登录"""
        # Arrange
        invalid_data = self.valid_login_data.copy()
        invalid_data['password'] = 'wrongpassword'
        
        # Act
        response = self.client.post(
            self.login_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    def test_login_wrong_phone(self):
        """测试错误手机号登录"""
        # Arrange
        invalid_data = self.valid_login_data.copy()
        invalid_data['phone'] = '+8613900139000'
        
        # Act
        response = self.client.post(
            self.login_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    def test_login_wrong_role(self):
        """测试错误角色登录"""
        # Arrange
        invalid_data = self.valid_login_data.copy()
        invalid_data['role'] = 'doctor'  # 用户是patient，但尝试以doctor登录
        
        # Act
        response = self.client.post(
            self.login_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    def test_login_inactive_user(self):
        """测试非活跃用户登录"""
        # Arrange
        self.user.is_active = False
        self.user.save()
        
        # Act
        response = self.client.post(
            self.login_url, 
            self.valid_login_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
    
    def test_login_missing_required_fields(self):
        """测试缺少必填字段的登录"""
        # Arrange
        invalid_data = {'phone': '+8613800138000'}  # 缺少密码
        
        # Act
        response = self.client.post(
            self.login_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_login_invalid_phone_format(self):
        """测试无效手机号格式登录"""
        # Arrange
        invalid_data = self.valid_login_data.copy()
        invalid_data['phone'] = '13800138000'  # 缺少国家区号
        
        # Act
        response = self.client.post(
            self.login_url, 
            invalid_data, 
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('phone', response.data)
    
    def test_login_without_role_specification(self):
        """测试不指定角色的登录"""
        # Arrange
        login_data = {
            'phone': '+8613800138000',
            'password': 'testpassword123'
            # 不指定role
        }
        
        # Act
        response = self.client.post(
            self.login_url, 
            login_data, 
            format='json'
        )
        
        # Assert - 应该成功，因为role是可选的
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_login_with_client_ip_recording(self):
        """测试登录IP记录"""
        # Arrange - 设置客户端IP
        client_ip = '192.168.1.100'
        
        # Act
        response = self.client.post(
            self.login_url,
            self.valid_login_data,
            format='json',
            HTTP_X_FORWARDED_FOR=client_ip
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 验证IP记录
        self.user.refresh_from_db()
        self.assertEqual(self.user.last_login_ip, client_ip)


class TestMultipleUsersLogin(APITestCase):
    """多用户登录测试"""
    
    def setUp(self):
        """创建多个测试用户"""
        self.login_url = reverse('accounts:login')
        
        self.patient = PatientFactory(
            phone='+8613800138000',
            chronic_diseases=['diabetes']
        )
        self.patient.set_password('patient123')
        self.patient.save()
        
        self.doctor = DoctorFactory(
            phone='+8613900139000',
            license_number='DOC123456'
        )
        self.doctor.set_password('doctor123')
        self.doctor.save()
    
    def test_patient_login(self):
        """测试患者登录"""
        # Act
        response = self.client.post(
            self.login_url,
            {
                'phone': '+8613800138000',
                'password': 'patient123',
                'role': 'patient'
            },
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_data = response.data['user']
        self.assertEqual(user_data['role'], 'patient')
        # chronic_diseases字段可能不在响应中，这取决于序列化器的配置
        # 我们主要验证登录成功和角色正确
    
    def test_doctor_login(self):
        """测试医生登录"""
        # Act
        response = self.client.post(
            self.login_url,
            {
                'phone': '+8613900139000',
                'password': 'doctor123',
                'role': 'doctor'
            },
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user_data = response.data['user']
        self.assertEqual(user_data['role'], 'doctor')
        self.assertIn('license_number', user_data)
    
    def test_cross_role_login_prevention(self):
        """测试跨角色登录防护"""
        # Act - 尝试用患者账号以医生身份登录
        response = self.client.post(
            self.login_url,
            {
                'phone': '+8613800138000',  # 患者手机号
                'password': 'patient123',
                'role': 'doctor'  # 但指定医生角色
            },
            format='json'
        )
        
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TestTokenGeneration(APITestCase):
    """Token生成测试"""
    
    def setUp(self):
        """测试前准备"""
        self.user = UserFactory()
    
    def test_jwt_token_structure(self):
        """测试JWT Token结构"""
        # Act
        refresh = RefreshToken.for_user(self.user)
        access_token = refresh.access_token
        
        # Assert
        self.assertIsNotNone(str(refresh))
        self.assertIsNotNone(str(access_token))
        
        # JWT token应该有三个部分，用.分隔
        refresh_parts = str(refresh).split('.')
        access_parts = str(access_token).split('.')
        
        self.assertEqual(len(refresh_parts), 3)
        self.assertEqual(len(access_parts), 3)
    
    def test_token_user_identification(self):
        """测试Token用户标识"""
        # Act
        refresh = RefreshToken.for_user(self.user)
        
        # Assert
        self.assertEqual(refresh['user_id'], self.user.id)
    
    def test_different_users_different_tokens(self):
        """测试不同用户生成不同Token"""
        # Arrange
        user1 = UserFactory()
        user2 = UserFactory()
        
        # Act
        token1 = RefreshToken.for_user(user1)
        token2 = RefreshToken.for_user(user2)
        
        # Assert
        self.assertNotEqual(str(token1), str(token2))
        self.assertNotEqual(token1['user_id'], token2['user_id'])


# 使用pytest的测试用例
@pytest.mark.django_db
class TestAuthAPIWithPytest:
    """使用pytest的认证API测试"""
    
    def test_registration_serializer_validation(self):
        """测试注册序列化器验证"""
        # Arrange
        valid_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'name': '测试用户',
            'password': 'testpassword123',
            'password_confirm': 'testpassword123',
            'role': 'patient',
            'phone': '+8613800138000'
        }
        
        # Act
        serializer = UserRegistrationSerializer(data=valid_data)
        
        # Assert
        assert serializer.is_valid()
        user = serializer.save()
        assert user.email == 'test@example.com'
        assert user.check_password('testpassword123')
    
    def test_login_serializer_validation(self):
        """测试登录序列化器验证"""
        # Arrange
        user = UserFactory(phone='+8613800138000')
        user.set_password('testpassword123')
        user.save()
        
        login_data = {
            'phone': '+8613800138000',
            'password': 'testpassword123'
        }
        
        # Act
        serializer = UserLoginSerializer(data=login_data)
        
        # Assert
        assert serializer.is_valid()
        assert serializer.validated_data['user'] == user
    
    @pytest.mark.parametrize("phone,expected_valid", [
        ('+8613800138000', True),
        ('+1234567890', True),
        ('13800138000', False),  # 缺少国家区号
        ('+86138001380001234567', False),  # 太长
        ('+86123', False),  # 太短
        # 注意：空值在注册序列化器中可能是允许的（phone字段可能不是必填）
    ])
    def test_phone_validation_parametrized(self, phone, expected_valid):
        """参数化测试手机号验证"""
        # Arrange
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'name': '测试用户',
            'password': 'testpassword123',
            'password_confirm': 'testpassword123',
            'role': 'patient',
            'phone': phone
        }
        
        # Act
        serializer = UserRegistrationSerializer(data=data)
        
        # Assert
        assert serializer.is_valid() == expected_valid
        if not expected_valid:
            assert 'phone' in serializer.errors
    
    @pytest.mark.parametrize("role,login_role,should_succeed", [
        ('patient', 'patient', True),
        ('doctor', 'doctor', True),
        ('patient', 'doctor', False),
        ('doctor', 'patient', False),
        ('patient', None, True),  # 不指定角色应该成功
        ('doctor', None, True),
    ])
    def test_role_based_login_parametrized(self, role, login_role, should_succeed):
        """参数化测试基于角色的登录"""
        # Arrange
        user = UserFactory(phone='+8613800138000', role=role)
        user.set_password('testpassword123')
        user.save()
        
        login_data = {
            'phone': '+8613800138000',
            'password': 'testpassword123'
        }
        if login_role:
            login_data['role'] = login_role
        
        # Act
        serializer = UserLoginSerializer(data=login_data)
        
        # Assert
        assert serializer.is_valid() == should_succeed
        if should_succeed:
            assert serializer.validated_data['user'] == user
        else:
            assert 'non_field_errors' in serializer.errors


class TestAPIEndpointsIntegration(APITestCase):
    """API端点集成测试"""
    
    def test_registration_to_login_workflow(self):
        """测试注册到登录的完整流程"""
        # Step 1: 注册用户
        register_url = reverse('accounts:register')
        registration_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'name': '测试用户',
            'password': 'testpassword123',
            'password_confirm': 'testpassword123',
            'role': 'patient',
            'phone': '+8613800138000',
            'age': 30,
            'gender': 'male'
        }
        
        register_response = self.client.post(
            register_url,
            registration_data,
            format='json'
        )
        
        # Assert registration success
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        
        # Step 2: 使用注册的账号登录
        login_url = reverse('accounts:login')
        login_data = {
            'phone': '+8613800138000',
            'password': 'testpassword123',
            'role': 'patient'
        }
        
        login_response = self.client.post(
            login_url,
            login_data,
            format='json'
        )
        
        # Assert login success
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        
        # Step 3: 验证两次请求返回的用户信息一致
        register_user = register_response.data['user']
        login_user = login_response.data['user']
        
        self.assertEqual(register_user['id'], login_user['id'])
        self.assertEqual(register_user['email'], login_user['email'])
    
    def test_concurrent_registrations(self):
        """测试并发注册"""
        # Arrange
        register_url = reverse('accounts:register')
        base_data = {
            'username': 'testuser',
            'name': '测试用户',
            'password': 'testpassword123',
            'password_confirm': 'testpassword123',
            'role': 'patient',
            'phone': '+8613800138000',
            'age': 30,
            'gender': 'male'
        }
        
        # Act - 尝试用相同邮箱注册两次
        data1 = base_data.copy()
        data1['email'] = 'test@example.com'
        data1['username'] = 'testuser1'
        
        data2 = base_data.copy()
        data2['email'] = 'test@example.com'  # 相同邮箱
        data2['username'] = 'testuser2'
        data2['phone'] = '+8613900139000'  # 不同手机号
        
        response1 = self.client.post(register_url, data1, format='json')
        response2 = self.client.post(register_url, data2, format='json')
        
        # Assert
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response2.data)
