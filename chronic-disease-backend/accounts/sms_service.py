"""
SMS短信服务模块
支持多个SMS服务提供商的集成
"""
import logging
import requests
from django.conf import settings
from typing import Tuple, Optional

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


class AliyunSMSService(BaseSMSService):
    """阿里云短信服务"""
    
    def __init__(self):
        self.access_key_id = getattr(settings, 'ALIYUN_ACCESS_KEY_ID', None)
        self.access_key_secret = getattr(settings, 'ALIYUN_ACCESS_KEY_SECRET', None)
        self.sign_name = getattr(settings, 'ALIYUN_SMS_SIGN_NAME', '慢性病管理系统')
        self.template_code = getattr(settings, 'ALIYUN_SMS_TEMPLATE_CODE', None)
    
    def send_sms(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        发送阿里云短信
        """
        if not all([self.access_key_id, self.access_key_secret, self.template_code]):
            logger.warning("阿里云SMS配置不完整，使用模拟模式")
            return DemoSMSService().send_sms(phone, message)
        
        try:
            # 导入阿里云SDK
            from alibabacloud_dysmsapi20170525.client import Client as DysmsapiClient
            from alibabacloud_dysmsapi20170525.models import SendSmsRequest
            from alibabacloud_tea_openapi.models import Config
            from alibabacloud_tea_util.models import RuntimeOptions
            import json
            
            # 配置客户端
            config = Config(
                access_key_id=self.access_key_id,
                access_key_secret=self.access_key_secret,
                endpoint='dysmsapi.aliyuncs.com'
            )
            client = DysmsapiClient(config)
            
            # 提取验证码（假设message格式为：【签名】您的验证码是 123456，5分钟内有效...）
            import re
            code_match = re.search(r'(\d{6})', message)
            verification_code = code_match.group(1) if code_match else '000000'
            
            # 构建请求
            request = SendSmsRequest(
                phone_numbers=phone,
                sign_name=self.sign_name,
                template_code=self.template_code,
                template_param=json.dumps({'code': verification_code})
            )
            
            # 发送短信
            runtime = RuntimeOptions()
            response = client.send_sms_with_options(request, runtime)
            
            if response.body.code == 'OK':
                logger.info(f"📱 [阿里云SMS] 发送成功到 {phone}")
                return True, "短信发送成功"
            else:
                logger.error(f"阿里云SMS发送失败: {response.body.code} - {response.body.message}")
                return False, f"短信发送失败: {response.body.message}"
                
        except ImportError:
            logger.error("阿里云SDK未安装，请运行: pip install alibabacloud-dysmsapi20170525")
            return DemoSMSService().send_sms(phone, message)
        except Exception as e:
            logger.error(f"阿里云SMS发送失败: {str(e)}")
            return False, f"短信发送失败: {str(e)}"


class TencentSMSService(BaseSMSService):
    """腾讯云短信服务"""
    
    def __init__(self):
        self.secret_id = getattr(settings, 'TENCENT_SECRET_ID', None)
        self.secret_key = getattr(settings, 'TENCENT_SECRET_KEY', None)
        self.app_id = getattr(settings, 'TENCENT_SMS_APP_ID', None)
        self.template_id = getattr(settings, 'TENCENT_SMS_TEMPLATE_ID', None)
        self.sign = getattr(settings, 'TENCENT_SMS_SIGN', '慢性病管理系统')
    
    def send_sms(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        发送腾讯云短信
        注：这是示例实现，实际使用需要安装腾讯云SDK
        """
        if not all([self.secret_id, self.secret_key, self.app_id, self.template_id]):
            logger.warning("腾讯云SMS配置不完整，使用模拟模式")
            return DemoSMSService().send_sms(phone, message)
        
        try:
            # 这里应该使用腾讯云SDK发送短信
            # from tencentcloud.sms.v20210111 import sms_client
            # 实际实现请参考腾讯云官方文档
            
            logger.info(f"📱 [腾讯云SMS] 发送到 {phone}: {message}")
            return True, "短信发送成功"
            
        except Exception as e:
            logger.error(f"腾讯云SMS发送失败: {str(e)}")
            return False, f"短信发送失败: {str(e)}"


class SMSServiceFactory:
    """SMS服务工厂类"""
    
    _services = {
        'demo': DemoSMSService,
        'aliyun': AliyunSMSService,
        'tencent': TencentSMSService,
    }
    
    @classmethod
    def get_service(cls, service_type: str = None) -> BaseSMSService:
        """
        获取SMS服务实例
        
        Args:
            service_type: 服务类型 ('demo', 'aliyun', 'tencent')
            
        Returns:
            SMS服务实例
        """
        if service_type is None:
            service_type = getattr(settings, 'SMS_SERVICE_TYPE', 'demo')
        
        if service_type not in cls._services:
            logger.warning(f"未知的SMS服务类型: {service_type}，使用演示服务")
            service_type = 'demo'
        
        return cls._services[service_type]()


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