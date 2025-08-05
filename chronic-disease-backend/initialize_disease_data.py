#!/usr/bin/env python
"""
为现有患者初始化疾病数据
"""
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User

def initialize_disease_data():
    """为现有患者添加疾病数据"""
    
    patients = User.objects.filter(role='patient')
    
    if not patients.exists():
        print("❌ 没有找到患者用户")
        return
    
    # 疾病分配方案
    disease_assignments = [
        {
            'name_pattern': '张三',
            'diseases': ['diabetes', 'hypertension'],  # 中风险
            'risk_level': 'medium'
        },
        {
            'name_pattern': '李四',
            'diseases': ['heart_disease', 'diabetes'],  # 高风险（心脏病）
            'risk_level': 'high'
        },
        {
            'name_pattern': '王五',
            'diseases': ['arthritis', 'migraine'],  # 低风险
            'risk_level': 'low'
        },
        {
            'name_pattern': '赵六',
            'diseases': ['cancer', 'hypertension'],  # 高风险（癌症）
            'risk_level': 'high'
        },
        {
            'name_pattern': '钱七',
            'diseases': ['asthma', 'epilepsy'],  # 中风险
            'risk_level': 'medium'
        },
        {
            'name_pattern': '孙八',
            'diseases': ['fibromyalgia'],  # 低风险
            'risk_level': 'low'
        }
    ]
    
    updated_count = 0
    
    for patient in patients:
        # 查找匹配的疾病分配
        assignment = None
        for assign in disease_assignments:
            if assign['name_pattern'] in patient.name:
                assignment = assign
                break
        
        # 如果没有找到特定分配，给一个默认的
        if not assignment:
            # 根据患者ID分配不同疾病
            patient_id = patient.id
            if patient_id % 3 == 0:
                assignment = {'diseases': ['diabetes', 'hypertension'], 'risk_level': 'medium'}
            elif patient_id % 3 == 1:
                assignment = {'diseases': ['arthritis'], 'risk_level': 'low'}
            else:
                assignment = {'diseases': ['heart_disease'], 'risk_level': 'high'}
        
        # 更新患者疾病信息
        if not patient.chronic_diseases:  # 只为没有疾病数据的患者添加
            patient.chronic_diseases = assignment['diseases']
            patient.save()
            
            print(f"✅ 更新患者 {patient.name}: {assignment['diseases']} (风险: {assignment['risk_level']})")
            updated_count += 1
        else:
            print(f"⏭️  跳过患者 {patient.name}: 已有疾病数据 {patient.chronic_diseases}")
    
    print(f"\n📊 疾病数据初始化完成!")
    print(f"   更新患者数: {updated_count}")
    print(f"   总患者数: {patients.count()}")
    
    # 显示统计
    risk_stats = {'high': 0, 'medium': 0, 'low': 0}
    for patient in patients:
        risk_level = patient.get_disease_risk_level()
        risk_stats[risk_level] += 1
    
    print(f"\n🎯 风险分布统计:")
    print(f"   高风险: {risk_stats['high']} 人")
    print(f"   中风险: {risk_stats['medium']} 人") 
    print(f"   低风险: {risk_stats['low']} 人")

if __name__ == '__main__':
    initialize_disease_data()