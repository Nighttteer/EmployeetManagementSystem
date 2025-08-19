"""
SMS Service Module
Demo version - Only outputs SMS content to console
"""
import logging
from typing import Tuple
import os

logger = logging.getLogger(__name__)


class BaseSMSService:
    """Base SMS Service Class"""
    
    def send_sms(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        Send SMS message
        
        Args:
            phone: Phone number (including country code)
            message: SMS message content
            
        Returns:
            (success: bool, message: str)
        """
        raise NotImplementedError("Subclasses must implement send_sms method")


class DemoSMSService(BaseSMSService):
    """Demo SMS Service (Development Environment)"""
    
    def send_sms(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        Simulate SMS sending (highlight verification code in console)
        """
        # Check if color output is supported
        supports_color = os.environ.get('TERM') is not None and os.environ.get('TERM') != 'dumb'
        
        if supports_color:
            # Color output
            print("\n" + "="*80)
            print("📱 SMS Verification Code Sent (Simulated)")
            print("="*80)
            print(f"📞 Sent to: {phone}")
            print(f"💬 SMS Content: {message}")
            print("="*80)
            
            # Extract and highlight verification code
            if "验证码是" in message:
                code_start = message.find("验证码是") + 4
                code_end = message.find("，", code_start)
                if code_end == -1:
                    code_end = message.find("，5分钟内有效")
                if code_end == -1:
                    code_end = len(message)
                
                verification_code = message[code_start:code_end].strip()
                print(f"🔐 Verification Code: \033[1;33;40m{verification_code}\033[0m")
                print(f"⏰ Valid for: 5 minutes")
                print("="*80)
                print("💡 Note: This is a simulation environment, verification code is for testing only")
                print("="*80 + "\n")
            else:
                print("="*80 + "\n")
        else:
            # Plain output (no color support)
            print("\n" + "="*80)
            print("📱 SMS Verification Code Sent (Simulated)")
            print("="*80)
            print(f"📞 Sent to: {phone}")
            print(f"💬 SMS Content: {message}")
            
            # Extract verification code
            if "验证码是" in message:
                code_start = message.find("验证码是") + 4
                code_end = message.find("，", code_start)
                if code_end == -1:
                    code_end = message.find("，5分钟内有效")
                if code_end == -1:
                    code_end = len(message)
                
                verification_code = message[code_start:code_end].strip()
                print(f"🔐 Verification Code: {verification_code}")
                print(f"⏰ Valid for: 5 minutes")
            
            print("💡 Note: This is a simulation environment, verification code is for testing only")
            print("="*80 + "\n")
        
        # Also log to logger
        logger.info(f"📱 [Simulated SMS] Sent to {phone}: {message}")
        
        return True, "SMS sent successfully (simulated)"


class SMSServiceFactory:
    """SMS Service Factory Class"""
    
    _services = {
        'demo': DemoSMSService,
    }
    
    @classmethod
    def get_service(cls, service_type: str = None) -> BaseSMSService:
        """
        Get SMS service instance
        
        Args:
            service_type: Service type (currently only supports 'demo')
            
        Returns:
            SMS service instance
        """
        # Always return demo service
        return cls._services['demo']()


class SMSManager:
    """SMS Manager"""
    
    def __init__(self, service_type: str = None):
        self.service = SMSServiceFactory.get_service(service_type)
    
    def send_verification_code(self, phone: str, code: str, purpose: str = 'register') -> Tuple[bool, str]:
        """
        Send verification code SMS
        
        Args:
            phone: Phone number
            code: Verification code
            purpose: Purpose ('register', 'login', 'reset_password')
            
        Returns:
            (success: bool, message: str)
        """
        # Generate different SMS content based on purpose
        message_templates = {
            'register': f'【Chronic Disease Management System】Your registration verification code is {code}, valid for 5 minutes, please do not share.',
            'login': f'【Chronic Disease Management System】Your login verification code is {code}, valid for 5 minutes, please do not share.',
            'reset_password': f'【Chronic Disease Management System】Your password reset verification code is {code}, valid for 5 minutes, please do not share.',
            'change_phone': f'【Chronic Disease Management System】Your phone number change verification code is {code}, valid for 5 minutes, please do not share.',
        }
        
        message = message_templates.get(purpose, f'【Chronic Disease Management System】Your verification code is {code}, valid for 5 minutes.')
        
        return self.service.send_sms(phone, message)
    
    def send_custom_message(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        Send custom SMS message
        
        Args:
            phone: Phone number
            message: SMS message content
            
        Returns:
            (success: bool, message: str)
        """
        return self.service.send_sms(phone, message)


# Global SMS manager instance
sms_manager = SMSManager()


def send_verification_code_sms(phone: str, code: str, purpose: str = 'register') -> Tuple[bool, str]:
    """
    Convenience function: Send verification code SMS
    """
    return sms_manager.send_verification_code(phone, code, purpose)


def send_custom_sms(phone: str, message: str) -> Tuple[bool, str]:
    """
    Convenience function: Send custom SMS message
    """
    return sms_manager.send_custom_message(phone, message) 