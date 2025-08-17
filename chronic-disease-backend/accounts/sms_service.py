"""
SMS短信服务模块
演示版本 - 仅在控制台输出短信内容
"""
import logging
from typing import Tuple
import os

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
        模拟发送短信（在控制台突出显示验证码）
        """
        # 检查是否支持彩色输出
        supports_color = os.environ.get('TERM') is not None and os.environ.get('TERM') != 'dumb'
        
        if supports_color:
            # 彩色输出
            print("\n" + "="*80)
            print("📱 SMS验证码发送（模拟）")
            print("="*80)
            print(f"📞 发送到: {phone}")
            print(f"💬 短信内容: {message}")
            print("="*80)
            
            # 提取验证码并突出显示
            if "验证码是" in message:
                code_start = message.find("验证码是") + 4
                code_end = message.find("，", code_start)
                if code_end == -1:
                    code_end = message.find("，5分钟内有效")
                if code_end == -1:
                    code_end = len(message)
                
                verification_code = message[code_start:code_end].strip()
                print(f"🔐 验证码: \033[1;33;40m{verification_code}\033[0m")
                print(f"⏰ 有效期: 5分钟")
                print("="*80)
                print("💡 提示: 这是模拟环境，验证码仅用于测试")
                print("="*80 + "\n")
            else:
                print("="*80 + "\n")
        else:
            # 普通输出（不支持彩色）
            print("\n" + "="*80)
            print("📱 SMS验证码发送（模拟）")
            print("="*80)
            print(f"📞 发送到: {phone}")
            print(f"💬 短信内容: {message}")
            
            # 提取验证码
            if "验证码是" in message:
                code_start = message.find("验证码是") + 4
                code_end = message.find("，", code_start)
                if code_end == -1:
                    code_end = message.find("，5分钟内有效")
                if code_end == -1:
                    code_end = len(message)
                
                verification_code = message[code_start:code_end].strip()
                print(f"🔐 验证码: {verification_code}")
                print(f"⏰ 有效期: 5分钟")
            
            print("💡 提示: 这是模拟环境，验证码仅用于测试")
            print("="*80 + "\n")
        
        # 同时记录到日志
        logger.info(f"📱 [模拟SMS] 发送到 {phone}: {message}")
        
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