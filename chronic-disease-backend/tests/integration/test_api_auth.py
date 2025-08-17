"""
认证API集成测试
测试用户注册、登录、权限验证等功能
"""
import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import SMSVerificationCode
from tests.factories import UserFactory, DoctorFactory, PatientFactory

User = get_user_model()

@pytest.mark.integration
@pytest.mark.api
@pytest.mark.auth
class TestUserRegistrationAPI:
    """用户注册API测试"""
    
    def test_register_patient_success(self, api_client):
        """测试患者注册成功"""
        # 首先创建验证码
        phone = '+8613800138001'
        verification = SMSVerificationCode.create_verification_code(phone, 'register')
        
        registration_data = {
            'username': 'newpatient',
            'email': 'newpatient@test.com',
            'password': 'testpass123',
            'name': '新患者',
            'role': 'patient',
            'phone': phone,
            'age': 30,
            'gender': 'male',
            'verification_code': verification.code
        }
        
        url = reverse('accounts:register')
        response = api_client.post(url, registration_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'access_token' in response.data
        assert 'refresh_token' in response.data
        
        # 验证用户已创建
        user = User.objects.get(email='newpatient@test.com')
        assert user.role == 'patient'
        assert user.is_verified is True
    
    def test_register_doctor_success(self, api_client):
        """测试医生注册成功"""
        phone = '+8613800138002'
        verification = SMSVerificationCode.create_verification_code(phone, 'register')
        
        registration_data = {
            'username': 'newdoctor',
            'email': 'newdoctor@test.com',
            'password': 'testpass123',
            'name': '新医生',
            'role': 'doctor',
            'phone': phone,
            'license_number': 'DOC-2024-999',
            'department': '内科',
            'verification_code': verification.code
        }
        
        url = reverse('accounts:register')
        response = api_client.post(url, registration_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        user = User.objects.get(email='newdoctor@test.com')
        assert user.role == 'doctor'
        assert user.license_number == 'DOC-2024-999'
    
    def test_register_invalid_verification_code(self, api_client):
        """测试无效验证码注册失败"""
        registration_data = {
            'username': 'testuser',
            'email': 'test@test.com',
            'password': 'testpass123',
            'name': '测试用户',
            'phone': '+8613800138003',
            'verification_code': '000000'  # 无效验证码
        }
        
        url = reverse('accounts:register')
        response = api_client.post(url, registration_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_register_duplicate_email(self, api_client):
        """测试重复邮箱注册失败"""
        # 先创建一个用户
        UserFactory(email='existing@test.com')
        
        phone = '+8613800138004'
        verification = SMSVerificationCode.create_verification_code(phone, 'register')
        
        registration_data = {
            'username': 'testuser2',
            'email': 'existing@test.com',  # 重复邮箱
            'password': 'testpass123',
            'name': '测试用户',
            'phone': phone,
            'verification_code': verification.code
        }
        
        url = reverse('accounts:register')
        response = api_client.post(url, registration_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST

@pytest.mark.integration
@pytest.mark.api
@pytest.mark.auth
class TestUserLoginAPI:
    """用户登录API测试"""
    
    def test_login_success(self, api_client):
        """测试登录成功"""
        user = UserFactory(email='test@example.com')
        user.set_password('testpass123')
        user.save()
        
        login_data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        
        url = reverse('accounts:login')
        response = api_client.post(url, login_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.data
        assert 'refresh_token' in response.data
        assert response.data['user']['email'] == 'test@example.com'
    
    def test_login_wrong_password(self, api_client):
        """测试错误密码登录失败"""
        user = UserFactory(email='test@example.com')
        user.set_password('correctpass')
        user.save()
        
        login_data = {
            'email': 'test@example.com',
            'password': 'wrongpass'
        }
        
        url = reverse('accounts:login')
        response = api_client.post(url, login_data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_nonexistent_user(self, api_client):
        """测试不存在用户登录失败"""
        login_data = {
            'email': 'nonexistent@example.com',
            'password': 'testpass123'
        }
        
        url = reverse('accounts:login')
        response = api_client.post(url, login_data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_login_inactive_user(self, api_client):
        """测试未激活用户登录失败"""
        user = UserFactory(email='inactive@example.com', is_active=False)
        user.set_password('testpass123')
        user.save()
        
        login_data = {
            'email': 'inactive@example.com',
            'password': 'testpass123'
        }
        
        url = reverse('accounts:login')
        response = api_client.post(url, login_data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.integration
@pytest.mark.api
@pytest.mark.auth
class TestTokenRefreshAPI:
    """Token刷新API测试"""
    
    def test_refresh_token_success(self, api_client):
        """测试刷新token成功"""
        user = UserFactory()
        user.set_password('testpass123')
        user.save()
        
        # 先登录获取token
        login_data = {
            'email': user.email,
            'password': 'testpass123'
        }
        
        login_response = api_client.post(
            reverse('accounts:login'), 
            login_data, 
            format='json'
        )
        
        refresh_token = login_response.data['refresh_token']
        
        # 使用refresh token获取新的access token
        refresh_data = {
            'refresh': refresh_token
        }
        
        url = reverse('token_refresh')
        response = api_client.post(url, refresh_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
    
    def test_refresh_invalid_token(self, api_client):
        """测试无效refresh token"""
        refresh_data = {
            'refresh': 'invalid_token'
        }
        
        url = reverse('token_refresh')
        response = api_client.post(url, refresh_data, format='json')
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

@pytest.mark.integration
@pytest.mark.api
@pytest.mark.auth
class TestSMSVerificationAPI:
    """SMS验证码API测试"""
    
    def test_send_verification_code(self, api_client):
        """测试发送验证码"""
        sms_data = {
            'phone': '+8613800138001',
            'purpose': 'register'
        }
        
        url = reverse('accounts:send_sms')
        response = api_client.post(url, sms_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'message' in response.data
        
        # 验证验证码已创建
        verification = SMSVerificationCode.objects.get(
            phone='+8613800138001',
            purpose='register',
            is_used=False
        )
        assert verification is not None
    
    def test_verify_code_success(self, api_client):
        """测试验证验证码成功"""
        phone = '+8613800138002'
        verification = SMSVerificationCode.create_verification_code(phone, 'register')
        
        verify_data = {
            'phone': phone,
            'code': verification.code,
            'purpose': 'register'
        }
        
        url = reverse('accounts:verify_sms')
        response = api_client.post(url, verify_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['valid'] is True
    
    def test_verify_wrong_code(self, api_client):
        """测试验证错误验证码"""
        phone = '+8613800138003'
        SMSVerificationCode.create_verification_code(phone, 'register')
        
        verify_data = {
            'phone': phone,
            'code': '000000',  # 错误验证码
            'purpose': 'register'
        }
        
        url = reverse('accounts:verify_sms')
        response = api_client.post(url, verify_data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['valid'] is False

@pytest.mark.integration
@pytest.mark.api
@pytest.mark.auth
class TestAuthenticationRequired:
    """需要认证的API测试"""
    
    def test_access_protected_endpoint_without_auth(self, api_client):
        """测试未认证访问受保护端点"""
        url = reverse('accounts:profile')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_access_protected_endpoint_with_auth(self, authenticated_patient_client):
        """测试已认证访问受保护端点"""
        url = reverse('accounts:profile')
        response = authenticated_patient_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'email' in response.data
    
    def test_access_doctor_endpoint_as_patient(self, authenticated_patient_client):
        """测试患者访问医生专用端点"""
        url = reverse('health:doctor-dashboard')
        response = authenticated_patient_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_access_doctor_endpoint_as_doctor(self, authenticated_doctor_client):
        """测试医生访问医生专用端点"""
        url = reverse('health:doctor-dashboard')
        response = authenticated_doctor_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
