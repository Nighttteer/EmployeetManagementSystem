"""
SMS Service Module - 短信服务模块
Demo version - Only outputs SMS content to console

【答辩重点】这个模块体现了完整的软件工程思维：
1. 设计模式应用：工厂模式、策略模式、模板方法模式
2. 分层架构：用户调用层 → 业务逻辑层 → 工厂层 → 服务实现层
3. 扩展性强：易于添加新的短信服务提供商
4. 用户体验好：智能验证码提取、环境自适应输出

【完整流程】前端输入确认 → 后端处理 → 结果返回
【Complete Flow】Frontend Input → Backend Processing → Result Return
"""

# ============================================================================
# 【Complete Flow Description】- Complete frontend to backend interaction process
# ============================================================================
"""
【Complete Flow: Frontend Input → Backend Processing → Result Return】

Step 1: 【Frontend Input】User enters phone number and clicks send verification code
Step 2: 【API Call】Frontend calls backend API endpoint
Step 3: 【User Request】Backend receives request, calls convenience function
Step 4: 【SMSManager】Manager handles business logic, selects message template
Step 5: 【Factory Pattern】Get concrete SMS service through factory
Step 6: 【DemoSMSService】Demo service handles SMS sending logic
Step 7: 【Console Output】Display result in console (development environment)
Step 8: 【Result Return】Return success status and message to frontend
Step 9: 【Frontend Confirmation】Frontend shows success, user enters verification code
Step 10: 【Verification】User submits code, backend verifies
【Production Flow】Step 6 will be replaced with real SMS service, sending to user's phone
"""

import logging
from typing import Tuple
import os

logger = logging.getLogger(__name__)


# ============================================================================
# 【Design Pattern 1: Template Method Pattern】- Define a unified interface for SMS services
# ============================================================================
class BaseSMSService:
    """
    Abstract base class: Define the interface that all SMS services must implement
    
    Technical Highlight: Use abstract base class to ensure interface consistency
    Extension Point: Add new SMS services by inheriting this class and implementing the send_sms method
    """
    
    def send_sms(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        Send SMS message - Abstract method for sending SMS
        
        Args:
            phone: Phone number (including country code) - 手机号（包含国家区号）
            message: SMS message content - 短信内容
            
        Returns:
            (success: bool, message: str) - Return tuple: (success, message)
            
        Design Principle: Force subclasses to implement this method to ensure interface consistency
        """
        raise NotImplementedError("Subclasses must implement send_sms method")


# ============================================================================
# 【Design Pattern 2: Strategy Pattern】- Specific SMS service implementations
# ============================================================================
class DemoSMSService(BaseSMSService):
    """
    Demo SMS service: Use for development environment, simulate real SMS sending
    
    Application Scenario: Development testing phase, no real SMS service needed
    Technical Highlight: Intelligent verification code extraction, environment-adaptive output, colorful console display
    """
    
    def send_sms(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        Simulate SMS sending: Output colored information to console, intelligent extraction of verification code
        
        User Experience: Colored output, structured information, verification code highlighted
        Compatibility: Automatically detect if terminal supports colored output
        """
        # 【Step 6: DemoSMSService】Demo service handles SMS sending logic
        # 【Flow 6: DemoSMSService】Demo service handles SMS sending logic
        
        # 【Technical Highlight 1: Environment-adaptive】Check if colored output is supported
        supports_color = os.environ.get('TERM') is not None and os.environ.get('TERM') != 'dumb'
        
        if supports_color:
            # 【User Experience 1: Colored output】Support colored terminal
            print("\n" + "="*80)
            print("📱 SMS Verification Code Sent (Simulated)")
            print("="*80)
            print(f"📞 Sent to: {phone}")
            print(f"💬 SMS Content: {message}")
            print("="*80)
            
            # 【Technical Highlight 2: Intelligent verification code extraction】Automatically identify verification code from message
            if "验证码是" in message:
                # Smartly locate verification code position
                code_start = message.find("验证码是") + 4
                code_end = message.find("，", code_start)
                if code_end == -1:
                    code_end = message.find("，5分钟内有效")
                if code_end == -1:
                    code_end = len(message)
                
                verification_code = message[code_start:code_end].strip()
                # 【User Experience 2: Highlighted verification code】Yellow background highlights verification code
                print(f"🔐 Verification Code: \033[1;33;40m{verification_code}\033[0m")
                print(f"⏰ Valid for: 5 minutes")
                print("="*80)
                print("💡 Note: This is a simulation environment, verification code is for testing only")
                print("="*80 + "\n")
            else:
                print("="*80 + "\n")
        else:
            # 【Compatibility Design】Use normal output if colored output is not supported
            print("\n" + "="*80)
            print("📱 SMS Verification Code Sent (Simulated)")
            print("="*80)
            print(f"📞 Sent to: {phone}")
            print(f"💬 SMS Content: {message}")
            
            # Verification code extraction in normal mode
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
        
        # 【Logging】Log all operations for debugging and auditing
        logger.info(f"📱 [Simulated SMS] Sent to {phone}: {message}")
        
        # 【Step 7: Console Output】Display result in console (development environment)
        # 【Flow 7: Console Output】Display result in console (development environment)
        return True, "SMS sent successfully (simulated)"


# ============================================================================
# 【Design Pattern 3: Factory Pattern】- Responsible for creating different SMS service instances
# ============================================================================
class SMSServiceFactory:
    """
    SMS service factory: Responsible for creating and managing different SMS services
    
    Design Advantage: Decouple service creation and use, easy to extend new services
    Extension Point: Add new SMS services by registering in the _services dictionary
    """
    
    # 【Service Registry】All available SMS services
    _services = {
        'demo': DemoSMSService,  # Demo service
        # 【Extension Example】Future can add:
        # 'aliyun': AliyunSMSService,    # Aliyun SMS service
        # 'tencent': TencentSMSService,  # Tencent Cloud SMS service
        # 'huawei': HuaweiSMSService,    # Huawei Cloud SMS service
    }
    
    @classmethod
    def get_service(cls, service_type: str = None) -> BaseSMSService:
        """
        Get SMS service instance
        
        Args:
            service_type: Service type (currently only supports 'demo') - 服务类型
            
        Returns:
            SMS service instance - SMS服务实例
            
        Design Advantage: Unified service acquisition interface, hides creation details
        """
        # Current version fixed to return demo service
        # 【Extensibility】Future can choose different services based on configuration or environment variables
        return cls._services['demo']()


# ============================================================================
# 【Business Logic Layer】- Encapsulate SMS related business logic
# ============================================================================
class SMSManager:
    """
    SMS manager: Encapsulate SMS sending business logic
    
    Separation of Duties: Business logic separated from implementation
    Complete Functionality: Supports verification code sending and custom message sending
    """
    
    def __init__(self, service_type: str = None):
        """
        Initialize SMS manager
        
        Dependency Injection: Get concrete SMS service through factory pattern
        Extensibility: Can specify which SMS service to use
        """
        # 【Step 5: Factory Pattern】Get concrete SMS service through factory
        # 【Flow 5: Factory Pattern】Get concrete SMS service through factory
        self.service = SMSServiceFactory.get_service(service_type)
    
    def send_verification_code(self, phone: str, code: str, purpose: str = 'register') -> Tuple[bool, str]:
        """
        Send verification code SMS
        
        Args:
            phone: Phone number - 手机号
            code: Verification code - 验证码
            purpose: Purpose ('register', 'login', 'reset_password', 'change_phone') - 用途
            
        Returns:
            (success: bool, message: str) - 返回元组：(是否成功, 消息)
            
        Business Feature: Supports multiple verification scenarios, message templated
        Security Design: Includes security reminders and validity information
        """
        # 【Step 4: SMSManager】Manager handles business logic, selects message template
        # 【Flow 4: SMSManager】Manager handles business logic, selects message template
        message_templates = {
            'register': f'【Chronic Disease Management System】Your registration verification code is {code}, valid for 5 minutes, please do not share.',
            'login': f'【Chronic Disease Management System】Your login verification code is {code}, valid for 5 minutes, please do not share.',
            'reset_password': f'【Chronic Disease Management System】Your password reset verification code is {code}, valid for 5 minutes, please do not share.',
            'change_phone': f'【Chronic Disease Management System】Your phone number change verification code is {code}, valid for 5 minutes, please do not share.',
        }
        
        # 【Error Handling】If purpose is not in templates, use default template
        message = message_templates.get(purpose, f'【Chronic Disease Management System】Your verification code is {code}, valid for 5 minutes.')
        
        # 【Step 4: SMSManager】Manager calls concrete SMS service to send message
        # 【Flow 4: SMSManager】Manager calls concrete SMS service to send message
        return self.service.send_sms(phone, message)
    
    def send_custom_message(self, phone: str, message: str) -> Tuple[bool, str]:
        """
        Send custom SMS message
        
        Args:
            phone: Phone number - 手机号
            message: SMS message content - 短信内容
            
        Returns:
            (success: bool, message: str) - 返回元组：(是否成功, 消息)
            
        Functional Extension: Supports sending SMS messages with any content, not limited to verification codes
        """
        # 【Step 4: SMSManager】Manager calls concrete SMS service to send message
        # 【Flow 4: SMSManager】Manager calls concrete SMS service to send message
        return self.service.send_sms(phone, message)


# ============================================================================
# 【Global Instance】- Provide convenient access
# ============================================================================
# 【Singleton Pattern】Global SMS manager instance to avoid duplicate creation
sms_manager = SMSManager()


# ============================================================================
# 【Convenient Functions】- Simplify user calls, provide friendly API interfaces
# ============================================================================
def send_verification_code_sms(phone: str, code: str, purpose: str = 'register') -> Tuple[bool, str]:
    """
    Convenient function: Send verification code SMS
    
    API Design: Provide simple and easy-to-use function interfaces
    Usage Example: success, message = send_verification_code_sms("+8613800138000", "123456", "register")
    """
    # 【Step 3: User Request】Backend receives request, calls convenience function
    # 【Flow 3: User Request】Backend receives request, calls convenience function
    return sms_manager.send_verification_code(phone, code, purpose)


def send_custom_sms(phone: str, message: str) -> Tuple[bool, str]:
    """
    Convenient function: Send custom SMS message
    
    API Design: Provide simple and easy-to-use function interfaces
    Usage Example: success, message = send_custom_sms("+8613800138000", "Your appointment has been confirmed")
    """
    # 【Step 3: User Request】Backend receives request, calls convenience function
    # 【Flow 3: User Request】Backend receives request, calls convenience function
    return sms_manager.send_custom_message(phone, message)


