#!/usr/bin/env python3
"""
一键快速设置脚本 - 最简单的完整系统设置
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

from unified_test_data_manager import UnifiedTestDataManager
from enhanced_data_creator import EnhancedDataCreator

def quick_setup():
    """一键快速设置完整系统"""
    print("🚀 开始一键快速设置...")
    print("=" * 60)
    
    manager = UnifiedTestDataManager()
    data_creator = EnhancedDataCreator()
    
    # 步骤1：清除现有数据
    print("📋 步骤 1/7: 清除现有数据")
    manager.clear_database(confirm=True)
    
    # 步骤2：创建完整用户数据
    print("\n📋 步骤 2/7: 创建用户数据")
    doctors, patients = manager.create_comprehensive_users()
    
    # 步骤3：为所有患者分配医生（确保5级风险系统有足够患者）
    print("\n📋 步骤 3/7: 优化医患关系分配")
    from health.models import DoctorPatientRelation
    from accounts.models import User
    
    # 获取未分配医生的患者
    unassigned_patients = User.objects.filter(role='patient').exclude(
        id__in=DoctorPatientRelation.objects.values_list('patient_id', flat=True)
    )
    
    # 将未分配的患者分配给第一个医生
    if unassigned_patients.exists() and doctors:
        first_doctor = doctors[0]
        for patient in unassigned_patients:
            DoctorPatientRelation.objects.create(
                doctor=first_doctor,
                patient=patient,
                is_primary=True,
                status='active',
                notes=f'快速设置 - {patient.name}由{first_doctor.name}管理'
            )
            print(f"   ✅ 补充分配: {first_doctor.name} → {patient.name}")
    
    # 步骤4：创建增强的健康数据（包含各种报警）
    print("\n📋 步骤 4/7: 创建增强健康数据")
    print("   🎯 创建能够触发各种报警的真实健康数据...")
    success = data_creator.create_comprehensive_data(days_back=30)
    if not success:
        print("   ⚠️ 健康数据创建失败，但继续其他步骤")
    
    # 步骤5：运行智能分析
    print("\n📋 步骤 5/7: 运行智能分析")
    manager.run_intelligent_analysis(all_doctors=True)
    
    # 步骤6：设置5级风险系统
    print("\n📋 步骤 6/7: 设置5级风险系统")
    success = manager.setup_5_level_risk_system()
    if not success:
        print("   ⚠️  5级风险系统设置失败，但其他功能正常")
    
    # 步骤7：显示最终状态
    print("\n📋 步骤 7/7: 显示系统状态")
    manager.show_status()
    
    print("\n" + "=" * 60)
    print("🎉 一键设置完成！")
    print("=" * 60)
    print("🔐 测试账号信息:")
    print("   医生账号:")
    for doctor in doctors:
        print(f"     {doctor.name}: {doctor.phone} / test123456")
    
    print(f"\n   患者账号: 所有患者密码都是 test123456")
    print("   详细患者列表请运行: python survey_data_preparation/unified_test_data_manager.py status")
    
    print("\n💡 下一步建议:")
    print("   1. 登录医生端查看患者管理")
    print("   2. 查看各种类型的健康告警")
    print("   3. 测试阈值超标检测功能")
    print("   4. 查看趋势分析和用药依从性")
    print("   5. 测试5级风险分类功能")
    
    return True

if __name__ == '__main__':
    quick_setup()
