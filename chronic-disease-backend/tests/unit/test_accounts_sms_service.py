"""
accounts应用SMS服务测试
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from io import StringIO
import sys

from accounts.sms_service import (
    BaseSMSService,
    DemoSMSService,
    SMSServiceFactory,
    SMSManager,
    sms_manager,
    send_verification_code_sms,
    send_custom_sms
)

@pytest.mark.unit
@pytest.mark.auth
class TestBaseSMSService:
    """SMS服务基类测试"""

    def test_base_service_not_implemented(self):
        """测试基类方法未实现异常"""
        service = BaseSMSService()
        
        with pytest.raises(NotImplementedError) as exc_info:
            service.send_sms("+8613800138000", "测试消息")
        
        assert "子类必须实现send_sms方法" in str(exc_info.value)


@pytest.mark.unit
@pytest.mark.auth
class TestDemoSMSService:
    """演示SMS服务测试"""

    def setup_method(self):
        """每个测试方法前的设置"""
        self.service = DemoSMSService()

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_sms_with_color_support(self, mock_stdout):
        """测试支持彩色输出的短信发送"""
        with patch.dict(os.environ, {'TERM': 'xterm'}):
            success, message = self.service.send_sms("+8613800138000", "测试短信内容")
        
        # 验证返回值
        assert success is True
        assert message == "短信发送成功（模拟）"
        
        # 验证输出内容
        output = mock_stdout.getvalue()
        assert "📱 SMS验证码发送（模拟）" in output
        assert "+8613800138000" in output
        assert "测试短信内容" in output
        # 对于非验证码消息，彩色输出模式下没有提示信息，只有分隔线
        assert "=" * 80 in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_sms_without_color_support(self, mock_stdout):
        """测试不支持彩色输出的短信发送"""
        with patch.dict(os.environ, {'TERM': 'dumb'}):
            success, message = self.service.send_sms("+8613800138000", "测试短信内容")
        
        # 验证返回值
        assert success is True
        assert message == "短信发送成功（模拟）"
        
        # 验证输出内容
        output = mock_stdout.getvalue()
        assert "📱 SMS验证码发送（模拟）" in output
        assert "+8613800138000" in output
        assert "测试短信内容" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_verification_code_with_color(self, mock_stdout):
        """测试发送验证码短信（彩色输出）"""
        verification_message = "【慢性病管理系统】您的验证码是 123456，5分钟内有效。"
        
        with patch.dict(os.environ, {'TERM': 'xterm'}):
            success, message = self.service.send_sms("+8613800138000", verification_message)
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "🔐 验证码:" in output
        assert "123456" in output
        assert "⏰ 有效期: 5分钟" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_verification_code_without_color(self, mock_stdout):
        """测试发送验证码短信（无彩色输出）"""
        verification_message = "【慢性病管理系统】您的验证码是 654321，5分钟内有效。"
        
        with patch.dict(os.environ, {'TERM': 'dumb'}):
            success, message = self.service.send_sms("+8613800138000", verification_message)
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "🔐 验证码: 654321" in output
        assert "⏰ 有效期: 5分钟" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_verification_code_with_comma_separator(self, mock_stdout):
        """测试带逗号分隔符的验证码提取"""
        verification_message = "【慢性病管理系统】您的验证码是 789012，请在5分钟内使用。"
        
        with patch.dict(os.environ, {'TERM': 'xterm'}):
            success, message = self.service.send_sms("+8613800138000", verification_message)
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "789012" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_verification_code_with_validity_text(self, mock_stdout):
        """测试带有效期文本的验证码提取"""
        verification_message = "【慢性病管理系统】您的验证码是 456789，5分钟内有效，请勿泄露。"
        
        with patch.dict(os.environ, {'TERM': 'xterm'}):
            success, message = self.service.send_sms("+8613800138000", verification_message)
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "456789" in output

    @patch('sys.stdout', new_callable=StringIO)
    @patch('accounts.sms_service.logger')
    def test_logging_functionality(self, mock_logger, mock_stdout):
        """测试日志记录功能"""
        phone = "+8613800138000"
        message = "测试日志记录"
        
        self.service.send_sms(phone, message)
        
        # 验证日志记录
        mock_logger.info.assert_called_once_with(f"📱 [模拟SMS] 发送到 {phone}: {message}")

    @patch('sys.stdout', new_callable=StringIO)
    def test_no_term_environment(self, mock_stdout):
        """测试没有TERM环境变量的情况"""
        with patch.dict(os.environ, {}, clear=True):
            success, message = self.service.send_sms("+8613800138000", "测试消息")
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "📱 SMS验证码发送（模拟）" in output


@pytest.mark.unit
@pytest.mark.auth
class TestSMSServiceFactory:
    """SMS服务工厂类测试"""

    def test_get_demo_service(self):
        """测试获取演示服务"""
        service = SMSServiceFactory.get_service('demo')
        assert isinstance(service, DemoSMSService)

    def test_get_service_without_type(self):
        """测试不指定类型获取服务"""
        service = SMSServiceFactory.get_service()
        assert isinstance(service, DemoSMSService)

    def test_get_service_with_invalid_type(self):
        """测试使用无效类型获取服务"""
        # 由于当前实现总是返回demo服务，这个测试验证这个行为
        service = SMSServiceFactory.get_service('invalid')
        assert isinstance(service, DemoSMSService)

    def test_services_registry(self):
        """测试服务注册表"""
        assert 'demo' in SMSServiceFactory._services
        assert SMSServiceFactory._services['demo'] == DemoSMSService


@pytest.mark.unit
@pytest.mark.auth
class TestSMSManager:
    """SMS管理器测试"""

    def setup_method(self):
        """每个测试方法前的设置"""
        self.manager = SMSManager()

    def test_manager_initialization(self):
        """测试管理器初始化"""
        assert isinstance(self.manager.service, DemoSMSService)

    def test_manager_with_service_type(self):
        """测试指定服务类型的管理器"""
        manager = SMSManager('demo')
        assert isinstance(manager.service, DemoSMSService)

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_register_verification_code(self, mock_stdout):
        """测试发送注册验证码"""
        phone = "+8613800138000"
        code = "123456"
        
        success, message = self.manager.send_verification_code(phone, code, 'register')
        
        assert success is True
        assert message == "短信发送成功（模拟）"
        
        output = mock_stdout.getvalue()
        assert "注册验证码是 123456" in output
        assert phone in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_login_verification_code(self, mock_stdout):
        """测试发送登录验证码"""
        phone = "+8613800138000"
        code = "654321"
        
        success, message = self.manager.send_verification_code(phone, code, 'login')
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "登录验证码是 654321" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_reset_password_verification_code(self, mock_stdout):
        """测试发送密码重置验证码"""
        phone = "+8613800138000"
        code = "789012"
        
        success, message = self.manager.send_verification_code(phone, code, 'reset_password')
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "密码重置验证码是 789012" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_change_phone_verification_code(self, mock_stdout):
        """测试发送手机号更换验证码"""
        phone = "+8613800138000"
        code = "456789"
        
        success, message = self.manager.send_verification_code(phone, code, 'change_phone')
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "手机号更换验证码是 456789" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_unknown_purpose_verification_code(self, mock_stdout):
        """测试发送未知用途验证码"""
        phone = "+8613800138000"
        code = "111222"
        
        success, message = self.manager.send_verification_code(phone, code, 'unknown_purpose')
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "您的验证码是 111222" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_custom_message(self, mock_stdout):
        """测试发送自定义消息"""
        phone = "+8613800138000"
        custom_message = "这是一条自定义短信内容"
        
        success, message = self.manager.send_custom_message(phone, custom_message)
        
        assert success is True
        assert message == "短信发送成功（模拟）"
        
        output = mock_stdout.getvalue()
        assert custom_message in output
        assert phone in output

    def test_message_templates_completeness(self):
        """测试消息模板的完整性"""
        expected_purposes = ['register', 'login', 'reset_password', 'change_phone']
        
        for purpose in expected_purposes:
            success, _ = self.manager.send_verification_code("+8613800138000", "123456", purpose)
            assert success is True


@pytest.mark.unit
@pytest.mark.auth
class TestGlobalSMSManager:
    """全局SMS管理器测试"""

    def test_global_sms_manager_instance(self):
        """测试全局SMS管理器实例"""
        assert isinstance(sms_manager, SMSManager)
        assert isinstance(sms_manager.service, DemoSMSService)


@pytest.mark.unit
@pytest.mark.auth
class TestConvenienceFunctions:
    """便捷函数测试"""

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_verification_code_sms_function(self, mock_stdout):
        """测试发送验证码短信便捷函数"""
        phone = "+8613800138000"
        code = "999888"
        
        success, message = send_verification_code_sms(phone, code, 'register')
        
        assert success is True
        assert message == "短信发送成功（模拟）"
        
        output = mock_stdout.getvalue()
        assert "注册验证码是 999888" in output
        assert phone in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_verification_code_sms_default_purpose(self, mock_stdout):
        """测试默认用途的验证码短信便捷函数"""
        phone = "+8613800138000"
        code = "777666"
        
        success, message = send_verification_code_sms(phone, code)
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "注册验证码是 777666" in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_send_custom_sms_function(self, mock_stdout):
        """测试发送自定义短信便捷函数"""
        phone = "+8613800138000"
        custom_message = "便捷函数测试消息"
        
        success, message = send_custom_sms(phone, custom_message)
        
        assert success is True
        assert message == "短信发送成功（模拟）"
        
        output = mock_stdout.getvalue()
        assert custom_message in output
        assert phone in output


@pytest.mark.unit
@pytest.mark.auth
class TestEdgeCases:
    """边界情况测试"""

    def setup_method(self):
        """每个测试方法前的设置"""
        self.service = DemoSMSService()

    @patch('sys.stdout', new_callable=StringIO)
    def test_empty_phone_number(self, mock_stdout):
        """测试空手机号"""
        success, message = self.service.send_sms("", "测试消息")
        
        assert success is True
        assert message == "短信发送成功（模拟）"

    @patch('sys.stdout', new_callable=StringIO)
    def test_empty_message(self, mock_stdout):
        """测试空消息"""
        success, message = self.service.send_sms("+8613800138000", "")
        
        assert success is True
        assert message == "短信发送成功（模拟）"

    @patch('sys.stdout', new_callable=StringIO)
    def test_long_phone_number(self, mock_stdout):
        """测试超长手机号"""
        long_phone = "+86" + "1" * 20
        success, message = self.service.send_sms(long_phone, "测试消息")
        
        assert success is True
        output = mock_stdout.getvalue()
        assert long_phone in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_long_message(self, mock_stdout):
        """测试超长消息"""
        long_message = "测试" * 100
        success, message = self.service.send_sms("+8613800138000", long_message)
        
        assert success is True
        output = mock_stdout.getvalue()
        assert long_message in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_special_characters_in_phone(self, mock_stdout):
        """测试手机号中的特殊字符"""
        special_phone = "+86-138-0013-8000"
        success, message = self.service.send_sms(special_phone, "测试消息")
        
        assert success is True
        output = mock_stdout.getvalue()
        assert special_phone in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_special_characters_in_message(self, mock_stdout):
        """测试消息中的特殊字符"""
        special_message = "测试消息 @#$%^&*()_+-=[]{}|;':\",./<>?"
        success, message = self.service.send_sms("+8613800138000", special_message)
        
        assert success is True
        output = mock_stdout.getvalue()
        assert special_message in output

    @patch('sys.stdout', new_callable=StringIO)
    def test_unicode_characters(self, mock_stdout):
        """测试Unicode字符"""
        unicode_message = "测试消息 🎉📱💬🔐⏰💡"
        success, message = self.service.send_sms("+8613800138000", unicode_message)
        
        assert success is True
        output = mock_stdout.getvalue()
        assert "🎉📱💬🔐⏰💡" in output
