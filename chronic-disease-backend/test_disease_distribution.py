#!/usr/bin/env python
"""
测试疾病分布统计
"""
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User

def test_disease_distribution():
    """测试疾病分布统计"""
    
    # 获取所有患者
    patients = User.objects.filter(role='patient')
    
    if not patients.exists():
        print("❌ 没有找到患者用户")
        return
    
    print("📊 患者疾病分布:")
    risk_stats = {'high': 0, 'medium': 0, 'low': 0}
    
    for patient in patients:
        diseases = patient.chronic_diseases or []
        risk_level = patient.get_disease_risk_level()
        risk_stats[risk_level] += 1
        
        print(f"  {patient.name}: {diseases} -> {risk_level}风险")
    
    print(f"\n🎯 风险统计:")
    print(f"  高风险: {risk_stats['high']} 人")
    print(f"  中风险: {risk_stats['medium']} 人") 
    print(f"  低风险: {risk_stats['low']} 人")
    
    # 测试医生仪表板API
    print(f"\n🔍 测试医生仪表板API...")
    try:
        from health.doctor_dashboard_views import doctor_dashboard_stats
        from rest_framework.test import APIRequestFactory
        
        doctor = User.objects.get(id=98)
        factory = APIRequestFactory()
        request = factory.get('/api/health/doctor/98/dashboard/')
        request.user = doctor
        
        response = doctor_dashboard_stats(request, 98)
        
        if response.status_code == 200:
            data = response.data['data']
            risk_dist = data['patientRiskDistribution']
            
            print("✅ API返回成功!")
            print("📈 API返回的风险分布:")
            for item in risk_dist:
                print(f"  {item['label']}: {item['value']} 人")
        else:
            print(f"❌ API返回错误: {response.status_code}")
            print(f"错误信息: {response.data}")
            
    except Exception as e:
        print(f"❌ API测试失败: {str(e)}")

if __name__ == '__main__':
    test_disease_distribution()