#!/usr/bin/env python3
"""
测试增强数据创建器
"""
import os
import sys
import django

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from enhanced_data_creator import EnhancedDataCreator
from accounts.models import User
from health.models import HealthMetric, Alert, MedicationPlan

def test_enhanced_data_creator():
    """测试增强数据创建器"""
    print("🧪 测试增强数据创建器...")
    
    # 检查是否有患者用户
    patients = User.objects.filter(role='patient', is_active=True)
    if not patients.exists():
        print("❌ 没有找到患者用户，请先运行用户创建脚本")
        return False
    
    print(f"✅ 找到 {patients.count()} 个患者用户")
    
    # 创建增强数据创建器
    creator = EnhancedDataCreator()
    
    # 选择第一个患者进行测试
    test_patient = patients.first()
    print(f"\n👤 测试患者: {test_patient.name}")
    
    # 测试健康数据创建
    print("\n📊 测试健康数据创建...")
    try:
        metrics = creator.create_realistic_health_data(test_patient, days_back=7)
        print(f"   ✅ 成功创建 {len(metrics)} 条健康记录")
        
        # 检查是否生成了告警
        alerts = Alert.objects.filter(patient=test_patient)
        print(f"   🚨 生成了 {alerts.count()} 个告警")
        
        # 显示告警详情
        for alert in alerts[:3]:  # 显示前3个告警
            print(f"     - {alert.title} ({alert.priority})")
        
    except Exception as e:
        print(f"   ❌ 健康数据创建失败: {e}")
        return False
    
    # 测试用药数据创建
    print("\n💊 测试用药数据创建...")
    try:
        medications = creator.create_medication_data(test_patient, days_back=7)
        print(f"   ✅ 成功创建 {len(medications)} 个用药计划")
        
        # 检查用药提醒记录
        from medication.models import MedicationReminder
        reminders = MedicationReminder.objects.filter(patient=test_patient)
        print(f"   📋 创建了 {reminders.count()} 条用药提醒记录")
        
    except Exception as e:
        print(f"   ❌ 用药数据创建失败: {e}")
        return False
    
    # 测试趋势告警创建
    print("\n📈 测试趋势告警创建...")
    try:
        trend_alerts = creator.create_trend_alerts(test_patient, days_back=7)
        print(f"   ✅ 成功创建 {len(trend_alerts)} 个趋势告警")
        
    except Exception as e:
        print(f"   ❌ 趋势告警创建失败: {e}")
        return False
    
    # 显示最终统计
    print("\n📊 最终统计:")
    total_metrics = HealthMetric.objects.filter(patient=test_patient).count()
    total_alerts = Alert.objects.filter(patient=test_patient).count()
    total_medications = MedicationPlan.objects.filter(patient=test_patient).count()
    
    print(f"   健康记录: {total_metrics} 条")
    print(f"   告警数量: {total_alerts} 个")
    print(f"   用药计划: {total_medications} 个")
    
    print("\n✅ 增强数据创建器测试完成！")
    return True


if __name__ == '__main__':
    test_enhanced_data_creator()
