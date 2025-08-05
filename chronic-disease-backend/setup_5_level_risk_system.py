#!/usr/bin/env python
"""
设置5级疾病风险评估系统
确保数据库中有各种状态的患者用于测试：
1. 未评估 (chronic_diseases = None)
2. 健康 (chronic_diseases = [])  
3. 低风险 (低风险疾病)
4. 中风险 (中风险疾病)
5. 高风险 (高风险疾病)
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

def setup_5_level_risk_system():
    """设置5级风险评估系统的测试数据"""
    print("🔧 设置5级疾病风险评估系统")
    print("=" * 60)
    
    try:
        # 查找医生
        doctor = User.objects.filter(role='doctor').first()
        if not doctor:
            print("❌ 没有找到医生用户")
            return
        
        print(f"👨‍⚕️ 操作医生: {doctor.name} (ID: {doctor.id})")
        
        # 获取该医生的患者
        relations = DoctorPatientRelation.objects.filter(
            doctor=doctor, 
            status='active'
        ).select_related('patient')
        
        patients = [relation.patient for relation in relations]
        if not patients:
            print("❌ 该医生没有管理的患者")
            return
        
        print(f"📋 管理患者总数: {len(patients)}")
        print()
        
        # 设置不同风险状态的患者
        risk_assignments = [
            {
                'status': '未评估',
                'value': None,
                'description': '医生尚未评估'
            },
            {
                'status': '健康',
                'value': [],
                'description': '医生已评估，无慢性疾病'
            },
            {
                'status': '低风险',
                'value': ['arthritis', 'migraine'],
                'description': '关节炎 + 偏头痛'
            },
            {
                'status': '中风险', 
                'value': ['diabetes', 'hypertension'],
                'description': '糖尿病 + 高血压'
            },
            {
                'status': '高风险',
                'value': ['cancer', 'heart_disease'],
                'description': '癌症 + 心脏病'
            }
        ]
        
        # 按顺序分配给患者
        for i, patient in enumerate(patients):
            assignment = risk_assignments[i % len(risk_assignments)]
            
            # 更新患者疾病状态
            patient.chronic_diseases = assignment['value']
            patient.save()
            
            # 验证风险等级
            risk_level = patient.get_disease_risk_level()
            
            print(f"👤 {patient.name:10} | {assignment['status']:6} | {risk_level:10} | {assignment['description']}")
        
        print()
        print("📊 风险分布统计:")
        
        # 统计各风险等级
        risk_counts = {'unassessed': 0, 'healthy': 0, 'low': 0, 'medium': 0, 'high': 0}
        for patient in patients:
            risk_level = patient.get_disease_risk_level()
            risk_counts[risk_level] += 1
        
        total = len(patients)
        for status, count in risk_counts.items():
            percentage = (count / total) * 100 if total > 0 else 0
            print(f"   {status:10}: {count:2}人 ({percentage:5.1f}%)")
        
        print()
        print("✅ 5级风险评估系统设置完成!")
        print()
        print("🎯 现在您可以:")
        print("   1. 在医生端查看患者管理页面，看到不同风险状态")
        print("   2. 编辑患者信息，测试'健康'选项的互斥逻辑") 
        print("   3. 查看仪表板风险分布饼图的5种颜色")
        
    except Exception as e:
        print(f"❌ 设置过程中出现错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    setup_5_level_risk_system()