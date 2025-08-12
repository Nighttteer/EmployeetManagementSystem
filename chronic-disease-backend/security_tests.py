#!/usr/bin/env python3
"""
安全测试脚本
检查常见的Web应用安全漏洞
"""
import os
import sys
import django
import requests
import json
from datetime import datetime

# Django设置
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from rest_framework_simplejwt.tokens import RefreshToken


class SecurityTester:
    """安全测试类"""
    
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
        
    def log_test(self, test_name, passed, details=""):
        """记录测试结果"""
        result = {
            "test": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
    
    def test_authentication_bypass(self):
        """测试认证绕过"""
        print("\n🔐 测试认证绕过...")
        
        # 1. 未认证访问受保护端点
        protected_endpoints = [
            "/api/health/patients/",
            "/api/health/alerts/", 
            "/api/health/metrics/",
            "/api/medication/plans/"
        ]
        
        for endpoint in protected_endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}")
                if response.status_code == 200:
                    self.log_test(
                        f"认证绕过检查 - {endpoint}",
                        False,
                        f"未认证用户可访问受保护端点，状态码: {response.status_code}"
                    )
                else:
                    self.log_test(
                        f"认证绕过检查 - {endpoint}",
                        True,
                        f"正确拒绝未认证访问，状态码: {response.status_code}"
                    )
            except Exception as e:
                self.log_test(
                    f"认证绕过检查 - {endpoint}",
                    False,
                    f"测试异常: {str(e)}"
                )
    
    def test_authorization_bypass(self):
        """测试权限绕过"""
        print("\n🔑 测试权限绕过...")
        
        try:
            # 创建测试用户
            patient = User.objects.filter(role='patient').first()
            if not patient:
                self.log_test("权限绕过检查", False, "缺少测试患者用户")
                return
            
            # 获取患者token
            refresh = RefreshToken.for_user(patient)
            patient_token = str(refresh.access_token)
            
            # 患者尝试访问医生功能
            headers = {'Authorization': f'Bearer {patient_token}'}
            
            doctor_endpoints = [
                "/api/health/patients/",  # 患者列表
                "/api/health/dashboard/",  # 医生仪表盘
            ]
            
            for endpoint in doctor_endpoints:
                try:
                    response = requests.get(f"{self.base_url}{endpoint}", headers=headers)
                    if response.status_code == 200:
                        self.log_test(
                            f"权限绕过检查 - {endpoint}",
                            False,
                            f"患者可访问医生功能，状态码: {response.status_code}"
                        )
                    else:
                        self.log_test(
                            f"权限绕过检查 - {endpoint}",
                            True,
                            f"正确拒绝越权访问，状态码: {response.status_code}"
                        )
                except Exception as e:
                    self.log_test(
                        f"权限绕过检查 - {endpoint}",
                        False,
                        f"测试异常: {str(e)}"
                    )
                    
        except Exception as e:
            self.log_test("权限绕过检查", False, f"测试设置失败: {str(e)}")
    
    def test_input_validation(self):
        """测试输入验证"""
        print("\n📝 测试输入验证...")
        
        # SQL注入测试
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "1' OR '1'='1",
            "<script>alert('xss')</script>",
            "../../etc/passwd",
            "{{7*7}}",  # 模板注入
            "admin'/**/UNION/**/SELECT/**/password/**/FROM/**/users--"
        ]
        
        for payload in malicious_inputs:
            try:
                # 测试登录端点
                response = requests.post(f"{self.base_url}/api/accounts/login/", json={
                    "phone_number": payload,
                    "password": "test"
                })
                
                # 检查是否有异常响应或错误信息泄露
                if response.status_code == 500:
                    self.log_test(
                        f"输入验证 - SQL注入防护",
                        False,
                        f"可能存在SQL注入漏洞，payload: {payload[:20]}..."
                    )
                elif "error" in response.text.lower() and "sql" in response.text.lower():
                    self.log_test(
                        f"输入验证 - 错误信息泄露",
                        False,
                        f"错误信息可能泄露系统信息"
                    )
                else:
                    self.log_test(
                        f"输入验证 - 恶意输入处理",
                        True,
                        f"正确处理恶意输入"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"输入验证测试",
                    False,
                    f"测试异常: {str(e)}"
                )
    
    def test_data_exposure(self):
        """测试数据泄露"""
        print("\n🔍 测试数据泄露...")
        
        # 测试敏感信息泄露
        test_endpoints = [
            "/api/accounts/users/",
            "/api/health/patients/999999/",  # 不存在的患者ID
            "/api/health/alerts/999999/",    # 不存在的预警ID
        ]
        
        for endpoint in test_endpoints:
            try:
                response = requests.get(f"{self.base_url}{endpoint}")
                
                # 检查响应中是否包含敏感信息
                sensitive_keywords = [
                    "password", "secret", "key", "token",
                    "database", "sql", "error", "exception"
                ]
                
                response_text = response.text.lower()
                exposed_data = [kw for kw in sensitive_keywords if kw in response_text]
                
                if exposed_data:
                    self.log_test(
                        f"数据泄露检查 - {endpoint}",
                        False,
                        f"可能泄露敏感信息: {', '.join(exposed_data)}"
                    )
                else:
                    self.log_test(
                        f"数据泄露检查 - {endpoint}",
                        True,
                        "未发现明显的敏感信息泄露"
                    )
                    
            except Exception as e:
                self.log_test(
                    f"数据泄露检查 - {endpoint}",
                    False,
                    f"测试异常: {str(e)}"
                )
    
    def test_rate_limiting(self):
        """测试速率限制"""
        print("\n⏱️ 测试速率限制...")
        
        # 快速发送多个请求
        login_endpoint = f"{self.base_url}/api/accounts/login/"
        
        for i in range(10):
            try:
                response = requests.post(login_endpoint, json={
                    "phone_number": "+8613800138000",
                    "password": "wrong_password"
                })
                
                if response.status_code == 429:  # Too Many Requests
                    self.log_test(
                        "速率限制检查",
                        True,
                        f"在第{i+1}次请求时触发速率限制"
                    )
                    return
                    
            except Exception as e:
                self.log_test(
                    "速率限制检查",
                    False,
                    f"测试异常: {str(e)}"
                )
                return
        
        self.log_test(
            "速率限制检查",
            False,
            "未检测到速率限制机制"
        )
    
    def test_cors_configuration(self):
        """测试CORS配置"""
        print("\n🌐 测试CORS配置...")
        
        try:
            headers = {
                'Origin': 'http://malicious-site.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            
            response = requests.options(f"{self.base_url}/api/accounts/login/", headers=headers)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            if cors_headers['Access-Control-Allow-Origin'] == '*':
                self.log_test(
                    "CORS配置检查",
                    False,
                    "CORS配置过于宽松，允许所有源访问"
                )
            else:
                self.log_test(
                    "CORS配置检查",
                    True,
                    f"CORS配置相对安全: {cors_headers['Access-Control-Allow-Origin']}"
                )
                
        except Exception as e:
            self.log_test(
                "CORS配置检查",
                False,
                f"测试异常: {str(e)}"
            )
    
    def generate_report(self):
        """生成测试报告"""
        print("\n" + "="*50)
        print("🛡️  安全测试报告")
        print("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for r in self.test_results if r['passed'])
        failed_tests = total_tests - passed_tests
        
        print(f"总测试数: {total_tests}")
        print(f"通过: {passed_tests}")
        print(f"失败: {failed_tests}")
        print(f"通过率: {passed_tests/total_tests*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ 失败的测试:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"  - {result['test']}: {result['details']}")
        
        # 保存详细报告
        with open('security_test_report.json', 'w', encoding='utf-8') as f:
            json.dump(self.test_results, f, ensure_ascii=False, indent=2)
        
        print(f"\n📄 详细报告已保存到: security_test_report.json")
    
    def run_all_tests(self):
        """运行所有安全测试"""
        print("🛡️  开始安全测试...")
        
        self.test_authentication_bypass()
        self.test_authorization_bypass()
        self.test_input_validation()
        self.test_data_exposure()
        self.test_rate_limiting()
        self.test_cors_configuration()
        
        self.generate_report()


if __name__ == "__main__":
    tester = SecurityTester()
    tester.run_all_tests()
