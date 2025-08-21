#!/usr/bin/env python3
"""
测试用药依从性报警功能
验证新添加的功能是否正常工作
"""
import os
import sys
import django

# 设置Django环境
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from unified_test_data_manager import UnifiedTestDataManager

def test_medication_functionality():
    """测试用药依从性报警功能"""
    print("🧪 测试用药依从性报警功能...")
    print("=" * 60)
    
    manager = UnifiedTestDataManager()
    
    try:
        # 1. 检查当前状态
        print("📊 步骤1: 检查当前数据库状态...")
        manager.show_status()
        
        # 2. 创建基本用户（如果没有的话）
        print("\n👥 步骤2: 检查/创建基本用户...")
        if not manager.has_users():
            print("   创建基本用户...")
            manager.create_basic_users()
        else:
            print("   用户已存在，跳过创建")
        
        # 3. 创建用药依从性报警数据
        print("\n💊 步骤3: 创建用药依从性报警数据...")
        result = manager.create_medication_adherence_alerts(days=7)  # 7天数据
        
        if result:
            print(f"   ✅ 成功创建用药数据:")
            print(f"      - 总提醒记录: {result['total_reminders']}")
            print(f"      - 漏服记录: {result['total_missed']}")
            print(f"      - 依从率: {result['adherence_rate']:.1%}")
        
        # 4. 再次检查状态
        print("\n📊 步骤4: 检查更新后的状态...")
        manager.show_status()
        
        # 5. 查看报警摘要
        print("\n🚨 步骤5: 查看报警摘要...")
        manager.analyze_alerts_summary()
        
        print("\n🎉 用药依从性报警功能测试完成！")
        return True
        
    except Exception as e:
        print(f"\n❌ 测试过程中出错: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_quick_medication():
    """快速测试用药功能"""
    print("⚡ 快速测试用药依从性报警...")
    print("=" * 40)
    
    manager = UnifiedTestDataManager()
    
    try:
        # 直接创建7天的用药数据
        result = manager.create_medication_adherence_alerts(days=7)
        
        if result:
            print(f"✅ 快速测试成功!")
            print(f"   依从率: {result['adherence_rate']:.1%}")
            print(f"   应该触发报警级别: ", end="")
            
            if result['adherence_rate'] <= 0.5:
                print("🚨 危急 (critical)")
            elif result['adherence_rate'] <= 0.7:
                print("⚠️  高风险 (high)")
            elif result['adherence_rate'] <= 0.85:
                print("🔶 中等风险 (medium)")
            else:
                print("✅ 正常")
        else:
            print("❌ 快速测试失败")
            
        return True
        
    except Exception as e:
        print(f"❌ 快速测试出错: {e}")
        return False

def main():
    """主函数"""
    print("💊 用药依从性报警功能测试")
    print("=" * 60)
    
    if len(sys.argv) > 1 and sys.argv[1] == 'quick':
        # 快速测试
        success = test_quick_medication()
    else:
        # 完整测试
        success = test_medication_functionality()
    
    if success:
        print("\n🎯 测试结果: 成功")
        print("💡 提示: 使用以下命令查看详细状态:")
        print("   python unified_test_data_manager.py status")
        print("   python unified_test_data_manager.py summary")
    else:
        print("\n🎯 测试结果: 失败")
        print("💡 提示: 检查错误信息并修复问题")
    
    return success

if __name__ == '__main__':
    main()
