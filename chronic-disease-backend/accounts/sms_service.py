"""
SMS短信服务模块
演示版本 - 仅在控制台输出短信内容
"""
import logging
from typing import Tuple

logger = logging.getLogger(__name__)


class BaseSMSService:
    """SMS服务基类"""
    
    def send_sms(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        发送短信
        
        Args:
            phone: 手机号码（包含国际区号）
            message: 短信内容
            
        Returns:
            (success: bool, message: str)
        """
        raise NotImplementedError("子类必须实现send_sms方法")


class DemoSMSService(BaseSMSService):
    """演示用SMS服务（开发环境）"""
    
    def send_sms(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        模拟发送短信（仅在控制台输出）
        """
        logger.info(f"📱 [模拟SMS] 发送到 {phone}: {message}")
        print(f"📱 [模拟SMS] 发送到 {phone}: {message}")
        return True, "短信发送成功（模拟）"


class SMSServiceFactory:
    """SMS服务工厂类"""
    
    _services = {
        'demo': DemoSMSService,
    }
    
    @classmethod
    def get_service(cls, service_type: str = None) -> BaseSMSService:
        """
        获取SMS服务实例
        
        Args:
            service_type: 服务类型 (目前只支持 'demo')
            
        Returns:
            SMS服务实例
        """
        # 始终返回演示服务
        return cls._services['demo']()


class SMSManager:
    """SMS管理器"""
    
    def __init__(self, service_type: str = None):
        self.service = SMSServiceFactory.get_service(service_type)
    
    def send_verification_code(self, phone: str, code: str, purpose: str = 'register') -> Tuple[bool, str]:
        """
        发送验证码短信
        
        Args:
            phone: 手机号码
            code: 验证码
            purpose: 用途 ('register', 'login', 'reset_password')
            
        Returns:
            (success: bool, message: str)
        """
        # 根据用途生成不同的短信内容
        message_templates = {
            'register': f'【慢性病管理系统】您的注册验证码是 {code}，5分钟内有效，请勿泄露。',
            'login': f'【慢性病管理系统】您的登录验证码是 {code}，5分钟内有效，请勿泄露。',
            'reset_password': f'【慢性病管理系统】您的密码重置验证码是 {code}，5分钟内有效，请勿泄露。',
            'change_phone': f'【慢性病管理系统】您的手机号更换验证码是 {code}，5分钟内有效，请勿泄露。',
        }
        
        message = message_templates.get(purpose, f'【慢性病管理系统】您的验证码是 {code}，5分钟内有效。')
        
        return self.service.send_sms(phone, message)
    
    def send_custom_message(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        发送自定义短信
        
        Args:
            phone: 手机号码
            message: 短信内容
            
        Returns:
            (success: bool, message: str)
        """
        return self.service.send_sms(phone, message)


# 全局SMS管理器实例
sms_manager = SMSManager()


def send_verification_code_sms(phone: str, code: str, purpose: str = 'register') -> Tuple[bool, str]:
    """
    便捷函数：发送验证码短信
    """
    return sms_manager.send_verification_code(phone, code, purpose)


def send_custom_sms(phone: str, message: str) -> Tuple[bool, str]:
    """
    便捷函数：发送自定义短信
    """
    return sms_manager.send_custom_message(phone, message) 