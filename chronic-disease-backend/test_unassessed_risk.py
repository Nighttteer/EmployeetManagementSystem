#!/usr/bin/env python
"""
测试5级疾病风险评估系统
包含：未评估、健康、低风险、中风险、高风险
确保正确区分"未评估"（医生未评估）和"健康"（医生已评估但无疾病）状态
"""
import os
import sys
import django

# 配置Django环境
project_root = os.path.dirname(__file__)
sys.path.append(project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import DoctorPatientRelation

def test_unassessed_risk_system():
    """测试5级风险评估系统"""
    print("🔬 测试5级疾病风险评估系统")
    print("=" * 50)
    print("💡 风险等级: 未评估 → 健康 → 低风险 → 中风险 → 高风险")
    print("=" * 50)
    
    try:
        # 1. 查找医生
        doctor = User.objects.filter(role='doctor').first()
        if not doctor:
            print("❌ 没有找到医生用户")
            return
        
        print(f"👨‍⚕️ 测试医生: {doctor.name} (ID: {doctor.id})")
        
        # 2. 获取医生的患者
        relations = DoctorPatientRelation.objects.filter(
            doctor=doctor, 
            status='active'
        ).select_related('patient')
        
        print(f"📋 管理患者总数: {relations.count()}")
        print()
        
        # 3. 测试不同风险状态
        risk_counts = {'unassessed': 0, 'healthy': 0, 'low': 0, 'medium': 0, 'high': 0}
        
        for relation in relations:
            patient = relation.patient
            risk_level = patient.get_disease_risk_level()
            risk_counts[risk_level] += 1
            
            # 显示患者信息
            diseases_info = "无疾病记录" if not patient.chronic_diseases else f"{len(patient.chronic_diseases)}种疾病: {', '.join(patient.chronic_diseases)}"
            print(f"👤 {patient.name:8} | {risk_level:10} | {diseases_info}")
        
        print()
        print("📊 风险分布统计:")
        print(f"   未评估: {risk_counts['unassessed']:2}人 ({risk_counts['unassessed']/len(relations)*100:.1f}%)")
        print(f"   健康:   {risk_counts['healthy']:2}人 ({risk_counts['healthy']/len(relations)*100:.1f}%)")
        print(f"   低风险: {risk_counts['low']:2}人 ({risk_counts['low']/len(relations)*100:.1f}%)")
        print(f"   中风险: {risk_counts['medium']:2}人 ({risk_counts['medium']/len(relations)*100:.1f}%)")
        print(f"   高风险: {risk_counts['high']:2}人 ({risk_counts['high']/len(relations)*100:.1f}%)")
        
        print()
        print("✅ 风险评估测试完成!")
        
        # 4. 测试单个患者的风险等级方法
        print("\n🔬 测试风险评估逻辑:")
        
        # 测试无疾病患者
        test_patient = relations.first().patient if relations.exists() else None
        if test_patient:
            original_diseases = test_patient.chronic_diseases
            
            # 测试未评估状态 (None)
            test_patient.chronic_diseases = None
            test_patient.save()
            print(f"   未评估患者 {test_patient.name}: {test_patient.get_disease_risk_level()}")
            
            # 测试健康状态 (空列表)
            test_patient.chronic_diseases = []
            test_patient.save()
            print(f"   健康患者 {test_patient.name}: {test_patient.get_disease_risk_level()}")
            
            # 测试高风险疾病
            test_patient.chronic_diseases = ['cancer', 'heart_disease']  
            test_patient.save()
            print(f"   癌症+心脏病患者 {test_patient.name}: {test_patient.get_disease_risk_level()}")
            
            # 测试中风险疾病
            test_patient.chronic_diseases = ['diabetes', 'hypertension']
            test_patient.save()
            print(f"   糖尿病+高血压患者 {test_patient.name}: {test_patient.get_disease_risk_level()}")
            
            # 测试低风险疾病
            test_patient.chronic_diseases = ['arthritis', 'migraine']
            test_patient.save()
            print(f"   关节炎+偏头痛患者 {test_patient.name}: {test_patient.get_disease_risk_level()}")
            
            # 恢复原始数据
            test_patient.chronic_diseases = original_diseases
            test_patient.save()
            print(f"   恢复原始数据: {test_patient.name}: {test_patient.get_disease_risk_level()}")
        
    except Exception as e:
        print(f"❌ 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_unassessed_risk_system()