#!/usr/bin/env python
"""
测试患者列表API - 验证健康状态标签数据
"""

import os
import sys
import django
from django.test import Client
import json

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Django设置
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_patient_list_api():
    """测试患者列表API是否返回正确的健康状态数据"""
    print("🔬 测试患者列表API - 健康状态标签")
    print("=" * 50)
    
    try:
        # 获取测试医生
        doctor = User.objects.filter(role='doctor').first()
        if not doctor:
            print("❌ 没有找到医生用户")
            return
        
        print(f"👨‍⚕️ 测试医生: {doctor.name} (ID: {doctor.id})")
        
        # 创建API客户端并设置认证
        client = APIClient()
        refresh = RefreshToken.for_user(doctor)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # 测试患者列表API
        print(f"\n🌐 测试API端点: /api/auth/patients/")
        response = client.get('/api/auth/patients/')
        
        print(f"   状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ 患者列表API请求成功")
            
            # 解析响应数据
            data = response.json() if hasattr(response, 'json') else response.data
            
            if isinstance(data, list):
                patients = data
            elif isinstance(data, dict) and 'results' in data:
                patients = data['results']
            else:
                patients = data
            
            print(f"📊 返回患者数量: {len(patients) if isinstance(patients, list) else 'N/A'}")
            
            if isinstance(patients, list) and len(patients) > 0:
                print("\n📋 患者健康状态信息:")
                for i, patient in enumerate(patients[:5]):  # 只显示前5个患者
                    print(f"   患者 {i+1}: {patient.get('name', 'Unknown')}")
                    print(f"      ID: {patient.get('id')}")
                    print(f"      疾病状态: {patient.get('chronic_diseases')}")
                    print(f"      风险等级: {patient.get('risk_level')}")
                    print(f"      年龄: {patient.get('age')}")
                    print(f"      性别: {patient.get('gender')}")
                    print()
                
                # 检查必要字段
                sample_patient = patients[0]
                required_fields = ['id', 'name', 'chronic_diseases', 'risk_level']
                missing_fields = [field for field in required_fields if field not in sample_patient]
                
                if missing_fields:
                    print(f"⚠️  缺少字段: {missing_fields}")
                else:
                    print("✅ 所有必要字段都存在")
                
                # 统计风险等级分布
                risk_levels = {}
                for patient in patients:
                    risk = patient.get('risk_level', 'unknown')
                    risk_levels[risk] = risk_levels.get(risk, 0) + 1
                
                print(f"\n📊 风险等级分布:")
                for risk, count in risk_levels.items():
                    print(f"   {risk}: {count}人")
                
            else:
                print("⚠️  返回的患者列表为空或格式异常")
                print(f"   数据格式: {type(data)}")
                print(f"   数据内容: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}...")
                
        else:
            print(f"❌ 患者列表API请求失败")
            print(f"   错误信息: {response.data if hasattr(response, 'data') else response.content}")
    
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_patient_list_api()