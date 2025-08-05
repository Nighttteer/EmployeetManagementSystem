#!/usr/bin/env python
"""
测试用药管理API端点
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
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

def test_medication_api():
    """测试用药管理API端点"""
    print("🔬 测试用药管理API")
    print("=" * 50)
    
    try:
        # 获取测试医生和患者
        doctor = User.objects.filter(role='doctor').first()
        patient = User.objects.filter(role='patient').first()
        
        if not doctor or not patient:
            print("❌ 缺少测试用户")
            return
        
        print(f"👨‍⚕️ 测试医生: {doctor.name} (ID: {doctor.id})")
        print(f"👤 测试患者: {patient.name} (ID: {patient.id})")
        
        # 创建API客户端并设置认证
        client = APIClient()
        refresh = RefreshToken.for_user(doctor)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # 1. 测试API连接
        print(f"\n🌐 测试API连接: /api/medication/test/")
        response = client.get('/api/medication/test/')
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ API连接测试成功")
        else:
            print(f"   ❌ API连接测试失败: {response.data}")
        
        # 2. 测试获取患者用药计划
        print(f"\n📋 测试获取患者用药计划: /api/medication/patients/{patient.id}/plans/")
        response = client.get(f'/api/medication/patients/{patient.id}/plans/')
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            plans = response.json() if hasattr(response, 'json') else response.data
            print(f"   ✅ 获取用药计划成功，数量: {len(plans) if isinstance(plans, list) else 'N/A'}")
            if isinstance(plans, list) and len(plans) > 0:
                print(f"   📊 第一个计划: {plans[0].get('medication', {}).get('name', 'Unknown')}")
        else:
            print(f"   ❌ 获取用药计划失败: {response.data}")
        
        # 3. 测试获取用药统计
        print(f"\n📊 测试获取用药统计: /api/medication/patients/{patient.id}/plans/stats/")
        response = client.get(f'/api/medication/patients/{patient.id}/plans/stats/')
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            stats = response.json() if hasattr(response, 'json') else response.data
            print(f"   ✅ 获取用药统计成功")
            print(f"   📈 统计数据: {json.dumps(stats, indent=2, ensure_ascii=False)[:200]}...")
        else:
            print(f"   ❌ 获取用药统计失败: {response.data}")
        
        # 4. 首先获取或创建一个药物
        print(f"\n💊 获取药物列表: /api/medication/medications/")
        medications_response = client.get('/api/medication/medications/')
        medications = []
        if medications_response.status_code == 200:
            medications_data = medications_response.json() if hasattr(medications_response, 'json') else medications_response.data
            if isinstance(medications_data, list):
                medications = medications_data
            elif medications_data.get('results'):
                medications = medications_data['results']
            print(f"   ✅ 获取到 {len(medications)} 个药物")
        
        medication_id = None
        if medications:
            medication_id = medications[0]['id']
            print(f"   📋 使用药物: {medications[0]['name']} (ID: {medication_id})")
        else:
            print("   ⚠️  没有找到药物，尝试直接使用ID=1")
            medication_id = 1

        # 5. 测试创建用药计划
        print(f"\n💊 测试创建用药计划: /api/medication/patients/{patient.id}/plans/")
        test_plan_data = {
            "patient": patient.id,
            "doctor": doctor.id,
            "medication": medication_id,
            "dosage": 10.0,  # 数字格式
            "frequency": "BID",
            "time_of_day": ["08:00", "20:00"],
            "start_date": "2025-01-01",
            "special_instructions": "饭后服用"
        }
        response = client.post(f'/api/medication/patients/{patient.id}/plans/', test_plan_data, format='json')
        print(f"   状态码: {response.status_code}")
        if response.status_code in [201, 200]:
            print("   ✅ 创建用药计划成功")
            plan_data = response.json() if hasattr(response, 'json') else response.data
            print(f"   🆔 计划ID: {plan_data.get('id', 'N/A')}")
        else:
            print(f"   ❌ 创建用药计划失败: {response.data}")
        
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_medication_api()