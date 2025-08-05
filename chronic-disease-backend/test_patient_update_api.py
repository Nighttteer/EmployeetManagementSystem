#!/usr/bin/env python
"""
测试患者更新API端点
验证URL路由和API功能是否正常工作
"""
import os
import sys
import django
import requests

# 配置Django环境
project_root = os.path.dirname(__file__)
sys.path.append(project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import DoctorPatientRelation

def test_patient_update_api():
    """测试患者信息更新API"""
    print("🔬 测试患者更新API端点")
    print("=" * 50)
    
    try:
        # 1. 查找医生和患者
        doctor = User.objects.filter(role='doctor').first()
        if not doctor:
            print("❌ 没有找到医生用户")
            return False
        
        # 获取医生管理的患者
        relation = DoctorPatientRelation.objects.filter(
            doctor=doctor,
            status='active'
        ).select_related('patient').first()
        
        if not relation:
            print("❌ 医生没有管理的患者")
            return False
        
        patient = relation.patient
        print(f"👨‍⚕️ 测试医生: {doctor.name} (ID: {doctor.id})")
        print(f"👤 测试患者: {patient.name} (ID: {patient.id})")
        print(f"📊 当前疾病状态: {patient.chronic_diseases}")
        print(f"🎯 当前风险等级: {patient.get_disease_risk_level()}")
        
        # 2. 模拟API请求
        # 假设Django服务在本地8000端口运行
        base_url = "http://127.0.0.1:8000"
        api_url = f"{base_url}/api/accounts/patients/{patient.id}/update/"
        
        print(f"\n🌐 测试API端点: {api_url}")
        
        # 首先测试GET请求（获取患者信息）
        try:
            print("📥 测试GET请求...")
            response = requests.get(api_url, timeout=5)
            print(f"   状态码: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ GET请求成功")
                patient_data = response.json()
                print(f"   📋 返回数据: {patient_data.get('name', 'N/A')}")
            else:
                print(f"   ❌ GET请求失败: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"   ⚠️ 无法连接到服务器 (请确保Django开发服务器正在运行): {e}")
            print("   💡 请运行: python manage.py runserver 0.0.0.0:8000")
            
        # 3. 测试URL路由解析
        print("\n🔧 测试Django URL路由解析...")
        from django.urls import reverse
        from django.test import Client
        
        # 使用Django测试客户端
        client = Client()
        
        # 创建一个临时认证用户（模拟医生登录）
        client.force_login(doctor)
        
        # 测试GET请求
        response = client.get(f"/api/accounts/patients/{patient.id}/update/")
        print(f"   GET状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ URL路由解析成功")
            
            # 测试PUT请求（更新患者疾病信息）
            test_data = {
                'name': patient.name,
                'chronic_diseases': ['diabetes', 'hypertension']  # 测试中风险疾病
            }
            
            response = client.put(
                f"/api/accounts/patients/{patient.id}/update/",
                data=test_data,
                content_type='application/json'
            )
            
            print(f"   PUT状态码: {response.status_code}")
            
            if response.status_code == 200:
                print("   ✅ 患者信息更新成功")
                
                # 验证更新结果
                patient.refresh_from_db()
                new_risk = patient.get_disease_risk_level()
                print(f"   📊 更新后疾病: {patient.chronic_diseases}")
                print(f"   🎯 更新后风险: {new_risk}")
                
                if new_risk == 'medium':
                    print("   ✅ 风险等级更新正确")
                else:
                    print(f"   ⚠️ 风险等级可能不正确，预期'medium'，实际'{new_risk}'")
                    
            else:
                print(f"   ❌ 患者信息更新失败: {response.content.decode()}")
                
        else:
            print(f"   ❌ URL路由解析失败: {response.content.decode()}")
            
        return True
        
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    test_patient_update_api()