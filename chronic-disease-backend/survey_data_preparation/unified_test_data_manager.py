#!/usr/bin/env python3
"""
统一测试数据管理工具
整合了所有用户创建、测试数据生成和数据库管理功能
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random
import json
from django.test import Client

# 设置Django环境
import sys
import os

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import DoctorPatientRelation, HealthMetric, Alert, ThresholdSetting
from medication.models import MedicationPlan, MedicationReminder, Medication
from django.core.management import execute_from_command_line
from django.db.models import Count


class UnifiedTestDataManager:
    """统一测试数据管理器"""
    
    def __init__(self):
        print("🎯 统一测试数据管理器初始化完成")
    
    def has_users(self):
        """检查是否有用户存在"""
        return User.objects.exists()
    
    def clear_database(self, confirm=False):
        """清除数据库所有数据，保留表结构"""
        if not confirm:
            response = input("⚠️  确定要清除所有数据库数据吗？(输入 'YES' 确认): ")
            if response != 'YES':
                print("❌ 操作已取消")
                return False
        
        print("🗑️  正在清除数据库数据...")
        
        # 清除告警数据
        Alert.objects.all().delete()
        print("   ✅ 清除告警数据")
        
        # 清除健康数据
        HealthMetric.objects.all().delete()
        ThresholdSetting.objects.all().delete()
        print("   ✅ 清除健康数据")
        
        # 清除用药数据
        MedicationReminder.objects.all().delete()
        MedicationPlan.objects.all().delete()
        print("   ✅ 清除用药数据")
        
        # 清除医患关系
        DoctorPatientRelation.objects.all().delete()
        print("   ✅ 清除医患关系")
        
        # 清除用户数据
        User.objects.all().delete()
        print("   ✅ 清除用户数据")
        
        print("🎉 数据库清理完成！表结构保持不变")
        return True

    def create_basic_users(self):
        """创建基本的测试用户（最少量）"""
        print("🔧 创建基本测试用户...")
        
        # 创建一个测试医生
        doctor_data = {
            'username': 'doctor01',
            'email': 'doctor@test.com',
            'password': 'test123456',
            'name': '张医生',
            'role': 'doctor',
            'phone': '+8613800138001',
            'age': 35,
            'gender': 'female',
            'license_number': 'DOC001',
            'department': '内科',
            'title': '主治医师',
            'specialization': '心血管疾病'
        }
        
        # 删除已存在的用户
        if User.objects.filter(phone=doctor_data['phone']).exists():
            User.objects.filter(phone=doctor_data['phone']).delete()
            print(f"   🗑️  删除现有医生: {doctor_data['phone']}")
        
        doctor = User.objects.create_user(**doctor_data)
        print(f"   ✅ 创建医生: {doctor.name} ({doctor.phone})")
        
        # 创建三个测试患者（新患者默认为未评估状态）
        patients_data = [
            {
                'username': 'patient01',
                'email': 'patient1@test.com',
                'password': 'test123456',
                'name': '张三',
                'role': 'patient',
                'phone': '+8613800138000',
                'age': 45,
                'gender': 'male',
                'height': 175.0,
                'blood_type': 'A+',
                'bio': '高血压患者，需要定期监测血压',
                'chronic_diseases': None  # 未评估状态
            },
            {
                'username': 'patient02',
                'email': 'patient2@test.com',
                'password': 'test123456',
                'name': '李四',
                'role': 'patient',
                'phone': '+8613800138002',
                'age': 52,
                'gender': 'female',
                'height': 162.0,
                'blood_type': 'B+',
                'bio': '糖尿病患者，需要控制血糖和饮食',
                'chronic_diseases': None  # 未评估状态
            },
            {
                'username': 'patient03',
                'email': 'patient3@test.com',
                'password': 'test123456',
                'name': '王五',
                'role': 'patient',
                'phone': '+8613800138003',
                'age': 38,
                'gender': 'male',
                'height': 178.0,
                'blood_type': 'O+',
                'bio': '心脏病患者，需要定期检查心电图',
                'chronic_diseases': None  # 未评估状态
            }
        ]
        
        created_patients = []
        for patient_data in patients_data:
            # 删除已存在的用户
            if User.objects.filter(phone=patient_data['phone']).exists():
                User.objects.filter(phone=patient_data['phone']).delete()
                print(f"   🗑️  删除现有患者: {patient_data['phone']}")
            
            patient = User.objects.create_user(**patient_data)
            created_patients.append(patient)
            print(f"   ✅ 创建患者: {patient.name} ({patient.phone})")
        
        # 创建医患关系
        print("🔗 创建医患关系...")
        for patient in created_patients:
            relation = DoctorPatientRelation.objects.create(
                doctor=doctor,
                patient=patient,
                is_primary=True,
                status='active',
                notes=f'基本测试数据 - {patient.name}由{doctor.name}管理'
            )
            print(f"   ✅ 绑定关系: {doctor.name} → {patient.name}")
        
        print("\n📋 基本测试用户创建完成！")
        print("🔐 登录信息:")
        print(f"   医生: {doctor.phone} / test123456")
        for patient in created_patients:
            print(f"   患者: {patient.phone} / test123456")
        
        return doctor, created_patients

    def create_comprehensive_users(self):
        """创建完整的测试用户数据（包含大量用户）"""
        print("🏗️  创建完整测试用户数据...")
        
        # 创建多个测试医生
        doctors_data = [
            {
                "username": "doctor001",
                "email": "doctor1@test.com",
                "password": "test123456",
                "name": "李医生",
                "role": "doctor",
                "phone": "+8613800138001",
                "age": 35,
                "gender": "female",
                "license_number": "DOC20241201001",
                "department": "内科",
                "title": "主治医师",
                "specialization": "心血管疾病、糖尿病"
            },
            {
                "username": "doctor002", 
                "email": "doctor2@test.com",
                "password": "test123456",
                "name": "王医生",
                "role": "doctor",
                "phone": "+8613800138021",
                "age": 42,
                "gender": "male",
                "license_number": "DOC20241201002",
                "department": "心血管科",
                "title": "副主任医师",
                "specialization": "冠心病、高血压"
            },
            {
                "username": "doctor003",
                "email": "doctor3@test.com", 
                "password": "test123456",
                "name": "张医生",
                "role": "doctor",
                "phone": "+8613800138022",
                "age": 38,
                "gender": "female",
                "license_number": "DOC20241201003",
                "department": "内分泌科",
                "title": "主治医师",
                "specialization": "糖尿病、甲状腺疾病"
            }
        ]
        
        created_doctors = []
        for doctor_data in doctors_data:
            # 删除已存在的用户
            if User.objects.filter(phone=doctor_data['phone']).exists():
                User.objects.filter(phone=doctor_data['phone']).delete()
                print(f"   🗑️  删除现有医生: {doctor_data['phone']}")
            
            doctor = User.objects.create_user(**doctor_data)
            created_doctors.append(doctor)
            print(f"   ✅ 创建医生: {doctor.name} ({doctor.phone})")
        
        # 创建大量测试患者（新患者默认为未评估状态）
        patients_data = [
            # 已分配医生的患者
            {
                "username": "patient001", "email": "patient1@test.com", "password": "test123456",
                "name": "张三", "role": "patient", "phone": "+8613800138000", "age": 45, "gender": "male",
                "height": 175.0, "blood_type": "A+", "bio": "高血压患者，需要定期监测血压", "assigned_doctor": 0,
                "chronic_diseases": None  # 未评估状态
            },
            {
                "username": "patient002", "email": "patient2@test.com", "password": "test123456",
                "name": "李四", "role": "patient", "phone": "+8613800138002", "age": 52, "gender": "female",
                "height": 162.0, "blood_type": "B+", "bio": "糖尿病患者，需要控制血糖和饮食", "assigned_doctor": 0,
                "chronic_diseases": None  # 未评估状态
            },
            {
                "username": "patient003", "email": "patient3@test.com", "password": "test123456",
                "name": "王五", "role": "patient", "phone": "+8613800138003", "age": 38, "gender": "male",
                "height": 178.0, "blood_type": "O+", "bio": "心脏病患者，需要定期检查心电图", "assigned_doctor": 1,
                "chronic_diseases": None  # 未评估状态
            },
            {
                "username": "patient004", "email": "patient4@test.com", "password": "test123456",
                "name": "赵六", "role": "patient", "phone": "+8613800138004", "age": 61, "gender": "female",
                "height": 158.0, "blood_type": "AB+", "bio": "高血压和糖尿病并发症，需要密切监测", "assigned_doctor": 1,
                "chronic_diseases": None  # 未评估状态
            },
            {
                "username": "patient005", "email": "patient5@test.com", "password": "test123456",
                "name": "刘七", "role": "patient", "phone": "+8613800138005", "age": 33, "gender": "male",
                "height": 172.0, "blood_type": "A-", "bio": "肥胖症患者，需要控制体重", "assigned_doctor": 2,
                "chronic_diseases": None  # 未评估状态
            },
            # 未分配医生的患者
            {
                "username": "patient006", "email": "patient6@test.com", "password": "test123456",
                "name": "陈八", "role": "patient", "phone": "+8613800138006", "age": 47, "gender": "female",
                "height": 165.0, "blood_type": "B-", "bio": "高血脂患者，需要控制胆固醇", "assigned_doctor": None,
                "chronic_diseases": None  # 未评估状态
            },
            {
                "username": "patient007", "email": "patient7@test.com", "password": "test123456",
                "name": "孙九", "role": "patient", "phone": "+8613800138007", "age": 56, "gender": "male",
                "height": 168.0, "blood_type": "O-", "bio": "慢性肾病患者，需要限制蛋白质摄入", "assigned_doctor": None,
                "chronic_diseases": None  # 未评估状态
            },
            {
                "username": "patient008", "email": "patient8@test.com", "password": "test123456",
                "name": "周十", "role": "patient", "phone": "+8613800138008", "age": 29, "gender": "female",
                "height": 160.0, "blood_type": "AB-", "bio": "甲状腺功能减退患者，需要定期检查", "assigned_doctor": None,
                "chronic_diseases": None  # 未评估状态
            }
        ]
        
        created_patients = []
        for patient_data in patients_data:
            # 删除已存在的用户
            if User.objects.filter(phone=patient_data['phone']).exists():
                User.objects.filter(phone=patient_data['phone']).delete()
                print(f"   🗑️  删除现有患者: {patient_data['phone']}")
            
            assigned_doctor = patient_data.pop('assigned_doctor', None)
            patient = User.objects.create_user(**patient_data)
            patient.last_login = datetime.now() - timedelta(days=random.randint(1, 30))
            patient.save()
            
            created_patients.append((patient, assigned_doctor))
            status = "（未分配医生）" if assigned_doctor is None else f"（分配给{created_doctors[assigned_doctor].name}）"
            print(f"   ✅ 创建患者: {patient.name} ({patient.phone}) {status}")
        
        # 创建医患关系
        print("🔗 创建医患关系...")
        for patient, doctor_index in created_patients:
            if doctor_index is not None:
                doctor = created_doctors[doctor_index]
                relation = DoctorPatientRelation.objects.create(
                    doctor=doctor,
                    patient=patient,
                    is_primary=True,
                    status='active',
                    notes=f'完整测试数据 - {patient.name}由{doctor.name}管理'
                )
                print(f"   ✅ 绑定关系: {doctor.name} → {patient.name}")
        
        assigned_count = sum(1 for _, assigned in created_patients if assigned is not None)
        unassigned_count = sum(1 for _, assigned in created_patients if assigned is None)
        
        print(f"\n📊 完整测试用户数据创建完成!")
        print("=" * 60)
        print("🔐 登录信息:")
        print("   医生账号:")
        for doctor in created_doctors:
            print(f"     {doctor.name}: {doctor.phone} / test123456")
        
        print(f"\n   患者账号: 共 {len(created_patients)} 个")
        print(f"     已分配医生: {assigned_count} 个")
        print(f"     未分配医生: {unassigned_count} 个")
        print("     所有患者密码: test123456")
        print("=" * 60)
        
        return created_doctors, created_patients

    def create_health_data(self):
        """创建健康数据和告警"""
        print("📊 创建健康数据和告警...")
        
        # 使用Django管理命令创建完整测试数据
        try:
            from django.core.management import call_command
            call_command('create_test_data')
            print("   ✅ 通过管理命令创建健康数据")
        except Exception as e:
            print(f"   ❌ 管理命令失败: {e}")
            print("   📝 请手动运行: python manage.py create_test_data")
            print("   💡 确保在 chronic-disease-backend 目录下运行")
    
    def create_test_data(self):
        """创建测试健康数据"""
        print("📊 创建健康数据和告警...")
        
        try:
            # 调用Django管理命令
            from django.core.management import call_command
            call_command('create_test_data')
            print("   ✅ 测试数据创建成功")
            return True
        except Exception as e:
            print(f"   ❌ 管理命令失败: {e}")
            print("   📝 请手动运行: python manage.py create_test_data")
            return False
    
    def create_enhanced_test_data(self, days_back=30):
        """创建增强的测试健康数据（使用增强数据创建器）"""
        print("📊 创建增强健康数据和告警...")
        
        try:
            # 导入增强数据创建器
            from enhanced_data_creator import EnhancedDataCreator
            
            creator = EnhancedDataCreator()
            success = creator.create_comprehensive_data(days_back=days_back)
            
            if success:
                print("   ✅ 增强测试数据创建成功")
                return True
            else:
                print("   ❌ 增强测试数据创建失败")
                return False
                
        except ImportError:
            print("   ❌ 增强数据创建器未找到，请确保 enhanced_data_creator.py 存在")
            return False
        except Exception as e:
            print(f"   ❌ 增强数据创建失败: {e}")
            return False
    
    def run_intelligent_analysis(self, doctor_id=None, all_doctors=False):
        """运行智能告警分析"""
        print("🧠 启动智能告警分析...")
        
        try:
            from health.alert_analysis_service import AlertAnalysisService
            analysis_service = AlertAnalysisService()
            
            if doctor_id:
                # 分析指定医生
                print(f"   📊 分析医生ID: {doctor_id}")
                alerts = analysis_service.analyze_and_generate_alerts(doctor_id)
                if alerts:
                    print(f"   ✅ 为医生 {doctor_id} 生成了 {len(alerts)} 个告警")
                    for alert in alerts[:3]:  # 显示前3个告警
                        print(f"     - {alert.title}: {alert.priority}")
                else:
                    print(f"   ℹ️  医生 {doctor_id} 没有需要生成的告警")
                    
            elif all_doctors:
                # 分析所有医生
                doctors = User.objects.filter(role='doctor', is_active=True)
                if not doctors.exists():
                    print("   ⚠️  没有找到活跃的医生用户")
                    return False
                
                total_alerts = 0
                for doctor in doctors:
                    print(f"   📊 分析医生: {doctor.name} (ID: {doctor.id})")
                    alerts = analysis_service.analyze_and_generate_alerts(doctor.id)
                    doctor_alert_count = len(alerts) if alerts else 0
                    total_alerts += doctor_alert_count
                    print(f"     ✅ 生成 {doctor_alert_count} 个告警")
                
                print(f"   🎯 总计生成 {total_alerts} 个告警")
            else:
                print("   ❌ 请指定doctor_id或设置all_doctors=True")
                return False
                
            print("   ✅ 智能分析完成")
            return True
            
        except Exception as e:
            print(f"   ❌ 智能分析失败: {e}")
            return False
    
    def setup_5_level_risk_system(self):
        """设置5级疾病风险评估系统测试数据"""
        print("🎯 设置5级疾病风险评估系统...")
        
        try:
            # 查找医生
            doctor = User.objects.filter(role='doctor').first()
            if not doctor:
                print("   ❌ 没有找到医生用户，请先创建用户")
                return False
            
            print(f"   👨‍⚕️ 操作医生: {doctor.name} (ID: {doctor.id})")
            
            # 获取该医生的患者
            from health.models import DoctorPatientRelation
            relations = DoctorPatientRelation.objects.filter(
                doctor=doctor, 
                status='active'
            ).select_related('patient')
            
            patients = [relation.patient for relation in relations]
            if len(patients) < 5:
                print(f"   ⚠️ 患者不足（当前{len(patients)}个），需要至少5个患者来演示5种风险状态")
                print("   💡 请先运行 create_comprehensive_users 创建更多患者")
                return False
            
            print(f"   📋 管理患者总数: {len(patients)}")
            
            # 设置不同风险状态的患者
            risk_assignments = [
                {
                    'status': 'unassessed',
                    'value': None,
                    'description': '医生尚未评估',
                    'display': '未评估'
                },
                {
                    'status': 'healthy',
                    'value': [],
                    'description': '医生已评估，无慢性疾病',
                    'display': '健康'
                },
                {
                    'status': 'low',
                    'value': ['arthritis', 'migraine'],
                    'description': '关节炎 + 偏头痛',
                    'display': '低风险'
                },
                {
                    'status': 'medium', 
                    'value': ['diabetes', 'hypertension'],
                    'description': '糖尿病 + 高血压',
                    'display': '中风险'
                },
                {
                    'status': 'high',
                    'value': ['cancer', 'heart_disease'],
                    'description': '癌症 + 心脏病',
                    'display': '高风险'
                }
            ]
            
            print("\n   🔧 分配风险状态:")
            # 循环分配给患者
            for i, patient in enumerate(patients):
                assignment = risk_assignments[i % len(risk_assignments)]
                
                # 更新患者疾病状态
                patient.chronic_diseases = assignment['value']
                patient.save()
                
                # 验证风险等级
                risk_level = patient.get_disease_risk_level()
                
                print(f"     {patient.name:8} | {assignment['display']:6} | {risk_level:10} | {assignment['description']}")
            
            # 统计各风险等级
            print("\n   📊 风险分布统计:")
            risk_counts = {'unassessed': 0, 'healthy': 0, 'low': 0, 'medium': 0, 'high': 0}
            for patient in patients:
                risk_level = patient.get_disease_risk_level()
                risk_counts[risk_level] += 1
            
            total = len(patients)
            for status, count in risk_counts.items():
                percentage = (count / total) * 100 if total > 0 else 0
                status_name = {
                    'unassessed': '未评估',
                    'healthy': '健康',
                    'low': '低风险',
                    'medium': '中风险',
                    'high': '高风险'
                }.get(status, status)
                print(f"     {status_name:6}: {count:2}人 ({percentage:5.1f}%)")
            
            print("\n   ✅ 5级风险评估系统设置完成!")
            print("   🎯 现在您可以:")
            print("     1. 在医生端查看患者管理页面，看到5种风险状态")
            print("     2. 使用过滤器筛选不同风险等级的患者")
            print("     3. 编辑患者信息，测试'健康'选项的互斥逻辑") 
            print("     4. 查看仪表板风险分布饼图的5种颜色")
            
            return True
            
        except Exception as e:
            print(f"   ❌ 设置过程中出现错误: {e}")
            import traceback
            traceback.print_exc()
            return False

    def trigger_realtime_analysis(self, patient_id, metric_type):
        """触发实时分析（模拟患者提交数据）"""
        print(f"⚡ 触发实时分析: 患者ID {patient_id}, 指标类型 {metric_type}")
        
        try:
            from health.tasks import real_time_health_data_analysis
            result = real_time_health_data_analysis(patient_id, metric_type)
            
            if result.get('success'):
                print(f"   ✅ 实时分析完成")
                if result.get('is_critical'):
                    print(f"   🚨 检测到危急情况！生成了 {result.get('generated_alerts', 0)} 个紧急告警")
                else:
                    print(f"   ℹ️  患者指标正常，无需生成告警")
            else:
                print(f"   ❌ 实时分析失败: {result.get('error')}")
                
            return result
            
        except Exception as e:
            print(f"   ❌ 实时分析异常: {e}")
            return {'success': False, 'error': str(e)}
    
    def test_search_functionality(self):
        """测试用户搜索功能"""
        print("🔍 测试用户搜索功能...")
        
        doctors = User.objects.filter(role='doctor', is_active=True)
        patients = User.objects.filter(role='patient', is_active=True)
        
        print(f"   活跃医生数量: {doctors.count()}")
        print(f"   活跃患者数量: {patients.count()}")
        
        if doctors.count() == 0 or patients.count() == 0:
            print("   ⚠️  没有足够的测试用户，请先创建用户")
            return False
        
        # 测试搜索API
        client = Client()
        
        # 测试患者搜索医生
        if patients.exists():
            patient = patients.first()
            client.force_login(patient)
            
            search_terms = ['李', '医生', '138001']
            for term in search_terms:
                response = client.get('/api/communication/users/search/', {'search': term})
                print(f"   患者搜索 '{term}': {response.status_code} - {len(json.loads(response.content)) if response.status_code == 200 else 'Error'}")
        
        # 测试医生搜索患者
        if doctors.exists():
            doctor = doctors.first()
            client.force_login(doctor)
            
            search_terms = ['张', '患者', '138000']
            for term in search_terms:
                response = client.get('/api/communication/users/search/', {'search': term})
                print(f"   医生搜索 '{term}': {response.status_code} - {len(json.loads(response.content)) if response.status_code == 200 else 'Error'}")
        
        print("   ✅ 搜索功能测试完成")
        return True
    
    def show_status(self):
        """显示当前数据库状态"""
        print("📊 当前数据库状态:")
        print(f"   👨‍⚕️ 医生数量: {User.objects.filter(role='doctor').count()}")
        print(f"   👤 患者数量: {User.objects.filter(role='patient').count()}")
        print(f"   🔗 医患关系: {DoctorPatientRelation.objects.count()}")
        print(f"   📈 健康记录: {HealthMetric.objects.count()}")
        print(f"   🚨 告警记录: {Alert.objects.count()}")
        print(f"   💊 用药记录: {MedicationReminder.objects.count()}")
        
        # 显示告警分布
        if Alert.objects.exists():
            print("\n🚨 告警状态分布:")
            alert_stats = Alert.objects.values('status', 'priority').annotate(count=Count('id'))
            for stat in alert_stats:
                print(f"     {stat['status']}-{stat['priority']}: {stat['count']}个")
        
        # 显示最近的告警
        recent_alerts = Alert.objects.order_by('-created_at')[:3]
        if recent_alerts:
            print("\n📋 最近的告警:")
            for alert in recent_alerts:
                print(f"     {alert.title} ({alert.priority}) - {alert.patient.name}")
        
        if User.objects.exists():
            print("\n👥 最近创建的用户:")
            for user in User.objects.order_by('-date_joined')[:5]:
                print(f"     {user.name} ({user.role}) - {user.phone}")
        
        # 显示用药依从性统计
        self.show_medication_adherence_status()
    
    def show_medication_adherence_status(self):
        """显示用药依从性状态"""
        print(f"\n💊 用药依从性状态:")
        print(f"   📋 用药计划: {MedicationPlan.objects.count()}")
        print(f"   🔔 用药提醒: {MedicationReminder.objects.count()}")
        
        # 统计不同状态的提醒
        if MedicationReminder.objects.exists():
            reminder_stats = MedicationReminder.objects.values('status').annotate(count=Count('id'))
            print("   提醒状态分布:")
            for stat in reminder_stats:
                status_name = dict(MedicationReminder.STATUS_CHOICES).get(stat['status'], stat['status'])
                print(f"     {status_name}: {stat['count']}个")
            
            # 计算总体依从性
            total_reminders = MedicationReminder.objects.count()
            taken_reminders = MedicationReminder.objects.filter(status='taken').count()
            adherence_rate = taken_reminders / total_reminders if total_reminders > 0 else 0
            
            print(f"   总体依从性: {adherence_rate:.1%} ({taken_reminders}/{total_reminders})")
            
            # 按患者统计依从性
            if MedicationPlan.objects.exists():
                print("   患者依从性详情:")
                for plan in MedicationPlan.objects.filter(status='active')[:5]:  # 只显示前5个
                    patient_reminders = MedicationReminder.objects.filter(plan=plan)
                    if patient_reminders.exists():
                        patient_total = patient_reminders.count()
                        patient_taken = patient_reminders.filter(status='taken').count()
                        patient_adherence = patient_taken / patient_total if patient_total > 0 else 0
                        print(f"     {plan.patient.name}: {patient_adherence:.1%} ({patient_taken}/{patient_total})")
    
    def create_medication_adherence_alerts(self, days=30):
        """创建用药依从性报警测试数据"""
        print(f"💊 创建用药依从性报警测试数据 (最近{days}天)...")
        
        # 检查是否有现有的用药数据
        if not MedicationPlan.objects.exists():
            print("   ⚠️  没有用药计划，先创建基本用户和用药计划...")
            self.create_basic_medication_data()
        
        # 获取所有活跃的用药计划
        active_plans = MedicationPlan.objects.filter(status='active')
        if not active_plans.exists():
            print("   ⚠️  没有活跃的用药计划")
            return
        
        # 为每个计划创建用药提醒记录
        total_reminders = 0
        total_missed = 0
        
        for plan in active_plans:
            plan_reminders = self._create_plan_reminders(plan, days)
            total_reminders += len(plan_reminders)
            total_missed += len([r for r in plan_reminders if r.status == 'missed'])
        
        print(f"   ✅ 创建了 {total_reminders} 个用药提醒记录")
        print(f"   🚨 其中漏服记录: {total_missed} 个")
        
        # 计算依从性
        adherence_rate = (total_reminders - total_missed) / total_reminders if total_reminders > 0 else 0
        print(f"   📊 总体依从性: {adherence_rate:.1%}")
        
        # 触发智能分析生成报警
        print("   🔍 触发智能分析生成报警...")
        self.run_intelligent_analysis(all_doctors=True)
        
        return {
            'total_reminders': total_reminders,
            'total_missed': total_missed,
            'adherence_rate': adherence_rate
        }
    
    def create_basic_medication_data(self):
        """创建基本的用药数据"""
        print("   🔧 创建基本用药数据...")
        
        # 创建测试药品
        medications = []
        med_names = ['氨氯地平片', '二甲双胍片', '阿托伐他汀钙片']
        med_categories = ['antihypertensive', 'hypoglycemic', 'lipid_lowering']
        med_specs = ['5mg/片', '500mg/片', '20mg/片']
        
        for i, (name, category, spec) in enumerate(zip(med_names, med_categories, med_specs)):
            med = Medication.objects.create(
                name=name,
                category=category,
                unit='mg',
                specification=spec,
                instructions=f'测试用{name}',
                is_prescription=True
            )
            medications.append(med)
            print(f"     ✅ 创建药品: {name}")
        
        # 为现有患者创建用药计划
        patients = User.objects.filter(role='patient')[:3]  # 取前3个患者
        doctors = User.objects.filter(role='doctor')[:2]   # 取前2个医生
        
        if not patients.exists() or not doctors.exists():
            print("     ⚠️  没有足够的患者或医生")
            return
        
        plan_count = 0
        for i, patient in enumerate(patients):
            doctor = doctors[i % len(doctors)]
            
            # 创建用药计划
            plan = MedicationPlan.objects.create(
                patient=patient,
                doctor=doctor,
                medication=medications[i % len(medications)],
                dosage=10.0,
                frequency='BID' if i % 2 == 0 else 'QD',
                time_of_day=['08:00', '20:00'] if i % 2 == 0 else ['08:00'],
                start_date=timezone.now().date() - timedelta(days=30),
                end_date=timezone.now().date() + timedelta(days=30),
                special_instructions=f'测试用药计划 - {patient.name}',
                status='active'
            )
            plan_count += 1
            print(f"     ✅ 创建用药计划: {patient.name} - {plan.medication.name}")
        
        print(f"   ✅ 创建了 {plan_count} 个用药计划")
    
    def _create_plan_reminders(self, plan, days):
        """为特定用药计划创建提醒记录"""
        reminders = []
        
        # 计算时间范围
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # 根据用药频次确定每日提醒次数
        if plan.frequency == 'QD':
            daily_times = 1
        elif plan.frequency == 'BID':
            daily_times = 2
        elif plan.frequency == 'TID':
            daily_times = 3
        else:
            daily_times = 1
        
        current_date = start_date
        while current_date <= end_date:
            for time_index in range(daily_times):
                # 生成提醒时间
                hour = 8 + (time_index * 6)  # 8:00, 14:00, 20:00
                reminder_time = timezone.make_aware(
                    datetime.combine(current_date, datetime.min.time().replace(hour=hour))
                )
                
                # 根据日期和患者决定是否漏服
                if self._should_miss_medication(plan.patient, current_date, time_index):
                    status = 'missed'
                    confirm_time = None
                    dosage_taken = None
                    notes = '患者未确认服药'
                else:
                    status = 'taken'
                    confirm_time = reminder_time + timedelta(minutes=random.randint(5, 30))
                    dosage_taken = plan.dosage
                    notes = '患者已服药'
                
                reminder = MedicationReminder.objects.create(
                    plan=plan,
                    reminder_time=reminder_time,
                    scheduled_time=reminder_time.time(),
                    status=status,
                    confirm_time=confirm_time,
                    dosage_taken=dosage_taken,
                    notes=notes
                )
                reminders.append(reminder)
            
            current_date += timedelta(days=1)
        
        return reminders
    
    def _should_miss_medication(self, patient, date, time_index):
        """判断患者是否应该漏服药物"""
        # 基于患者ID、日期和时间的简单算法
        patient_id = patient.id
        day_of_year = date.timetuple().tm_yday
        
        # 不同的漏服模式
        if patient_id % 3 == 0:  # 患者1: 每3天漏服一次
            return day_of_year % 3 == 0
        elif patient_id % 3 == 1:  # 患者2: 每2天漏服一次
            return day_of_year % 2 == 0
        else:  # 患者3: 周末偶尔漏服
            return date.weekday() in [5, 6] and time_index == 0  # 周末早上漏服
    
    def analyze_alerts_summary(self):
        """分析告警摘要"""
        print("📈 智能告警分析摘要:")
        
        doctors = User.objects.filter(role='doctor', is_active=True)
        if not doctors.exists():
            print("   ⚠️  没有活跃的医生用户")
            return
        
        for doctor in doctors:
            print(f"\n👨‍⚕️ 医生: {doctor.name}")
            
            # 医生管理的患者
            relations = DoctorPatientRelation.objects.filter(doctor=doctor, status='active')
            patient_count = relations.count()
            print(f"   管理患者: {patient_count} 位")
            
            if patient_count == 0:
                print("   ℹ️  没有管理的患者")
                continue
            
            # 告警统计
            doctor_alerts = Alert.objects.filter(assigned_doctor=doctor)
            alert_count = doctor_alerts.count()
            print(f"   总告警数: {alert_count}")
            
            if alert_count > 0:
                # 按优先级统计
                priority_stats = doctor_alerts.values('priority').annotate(count=Count('id'))
                for stat in priority_stats:
                    print(f"     {stat['priority']}: {stat['count']}个")
                
                # 按状态统计
                status_stats = doctor_alerts.values('status').annotate(count=Count('id'))
                for stat in status_stats:
                    print(f"     {stat['status']}: {stat['count']}个")
            
            # 最近3天的健康数据统计
            from django.utils import timezone
            three_days_ago = timezone.now() - timedelta(days=3)
            recent_metrics = HealthMetric.objects.filter(
                patient__in=[r.patient for r in relations],
                measured_at__gte=three_days_ago
            )
            print(f"   最近3天数据: {recent_metrics.count()} 条")

    def export_test_data(self, format_type='json'):
        """导出测试数据"""
        print(f"📤 导出测试数据 (格式: {format_type})...")
        
        try:
            # 收集所有数据
            data = {
                'users': {
                    'doctors': list(User.objects.filter(role='doctor').values('id', 'name', 'phone', 'email', 'department')),
                    'patients': list(User.objects.filter(role='patient').values('id', 'name', 'phone', 'email', 'age', 'gender'))
                },
                'relations': list(DoctorPatientRelation.objects.values('doctor_id', 'patient_id', 'status')),
                'health_metrics': list(HealthMetric.objects.values('patient_id', 'metric_type', 'value', 'measured_at')),
                'alerts': list(Alert.objects.values('patient_id', 'title', 'priority', 'status', 'created_at')),
                'export_time': datetime.now().isoformat()
            }
            
            if format_type == 'json':
                # 导出为JSON文件
                filename = f'test_data_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2, default=str)
                print(f"   ✅ 数据已导出到: {filename}")
                
            elif format_type == 'csv':
                # 导出为CSV文件（简化版）
                import csv
                filename = f'test_data_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                with open(filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['数据类型', '记录数', '导出时间'])
                    writer.writerow(['医生', len(data['users']['doctors']), data['export_time']])
                    writer.writerow(['患者', len(data['users']['patients']), data['export_time']])
                    writer.writerow(['医患关系', len(data['relations']), data['export_time']])
                    writer.writerow(['健康数据', len(data['health_metrics']), data['export_time']])
                    writer.writerow(['告警', len(data['alerts']), data['export_time']])
                print(f"   ✅ 数据已导出到: {filename}")
            
            return filename
            
        except Exception as e:
            print(f"   ❌ 导出失败: {e}")
            return None
    
    def validate_data_integrity(self):
        """验证数据完整性"""
        print("🔍 验证数据完整性...")
        
        issues = []
        
        # 检查用户数据完整性
        users_without_phone = User.objects.filter(phone__isnull=True) | User.objects.filter(phone='')
        if users_without_phone.exists():
            issues.append(f"发现 {users_without_phone.count()} 个用户缺少手机号")
        
        # 检查医患关系完整性
        orphaned_relations = DoctorPatientRelation.objects.filter(
            doctor__isnull=True
        ) | DoctorPatientRelation.objects.filter(
            patient__isnull=True
        )
        if orphaned_relations.exists():
            issues.append(f"发现 {orphaned_relations.count()} 个无效的医患关系")
        
        # 检查健康数据完整性
        metrics_without_patient = HealthMetric.objects.filter(patient__isnull=True)
        if metrics_without_patient.exists():
            issues.append(f"发现 {metrics_without_patient.count()} 条健康数据缺少患者信息")
        
        # 检查告警数据完整性
        alerts_without_patient = Alert.objects.filter(patient__isnull=True)
        if alerts_without_patient.exists():
            issues.append(f"发现 {alerts_without_patient.count()} 个告警缺少患者信息")
        
        if issues:
            print("   ⚠️  发现以下问题:")
            for issue in issues:
                print(f"     - {issue}")
            return False
        else:
            print("   ✅ 数据完整性检查通过")
            return True
    
    def performance_test(self, test_type='basic'):
        """性能测试"""
        print(f"⚡ 执行性能测试 ({test_type})...")
        
        import time
        
        if test_type == 'basic':
            # 基本性能测试
            start_time = time.time()
            
            # 测试用户查询性能
            user_count = User.objects.count()
            user_query_time = time.time() - start_time
            
            start_time = time.time()
            # 测试医患关系查询性能
            relation_count = DoctorPatientRelation.objects.count()
            relation_query_time = time.time() - start_time
            
            start_time = time.time()
            # 测试健康数据查询性能
            metric_count = HealthMetric.objects.count()
            metric_query_time = time.time() - start_time
            
            print(f"   📊 性能测试结果:")
            print(f"     用户查询: {user_count} 条, 耗时: {user_query_time:.4f}秒")
            print(f"     关系查询: {relation_count} 条, 耗时: {relation_query_time:.4f}秒")
            print(f"     健康数据: {metric_count} 条, 耗时: {metric_query_time:.4f}秒")
            
        elif test_type == 'stress':
            # 压力测试
            print("   🔥 执行压力测试...")
            
            # 模拟大量并发查询
            start_time = time.time()
            for i in range(100):
                User.objects.filter(role='doctor').count()
                User.objects.filter(role='patient').count()
            
            total_time = time.time() - start_time
            print(f"     100次并发查询耗时: {total_time:.4f}秒")
            print(f"     平均每次查询: {total_time/100:.4f}秒")
        
        print("   ✅ 性能测试完成")
        return True
    
    def cleanup_orphaned_data(self):
        """清理孤立数据"""
        print("🧹 清理孤立数据...")
        
        cleaned_count = 0
        
        # 清理孤立的健康数据
        orphaned_metrics = HealthMetric.objects.filter(patient__isnull=True)
        if orphaned_metrics.exists():
            count = orphaned_metrics.count()
            orphaned_metrics.delete()
            cleaned_count += count
            print(f"   🗑️  清理了 {count} 条孤立的健康数据")
        
        # 清理孤立的告警
        orphaned_alerts = Alert.objects.filter(patient__isnull=True)
        if orphaned_alerts.exists():
            count = orphaned_alerts.count()
            orphaned_alerts.delete()
            cleaned_count += count
            print(f"   🗑️  清理了 {count} 个孤立的告警")
        
        # 清理无效的医患关系
        invalid_relations = DoctorPatientRelation.objects.filter(
            doctor__isnull=True
        ) | DoctorPatientRelation.objects.filter(
            patient__isnull=True
        )
        if invalid_relations.exists():
            count = invalid_relations.count()
            invalid_relations.delete()
            cleaned_count += count
            print(f"   🗑️  清理了 {count} 个无效的医患关系")
        
        if cleaned_count == 0:
            print("   ✅ 没有发现需要清理的孤立数据")
        else:
            print(f"   🎉 总共清理了 {cleaned_count} 条孤立数据")
        
        return cleaned_count
    
    def backup_database(self):
        """备份数据库"""
        print("💾 备份数据库...")
        
        try:
            import shutil
            from django.conf import settings
            
            # 获取数据库文件路径
            db_path = settings.DATABASES['default']['NAME']
            if db_path == ':memory:' or 'sqlite' not in db_path:
                print("   ⚠️  当前数据库不支持文件备份")
                return None
            
            # 创建备份文件名
            backup_filename = f'database_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.sqlite3'
            backup_path = os.path.join(os.path.dirname(db_path), backup_filename)
            
            # 复制数据库文件
            shutil.copy2(db_path, backup_path)
            
            print(f"   ✅ 数据库已备份到: {backup_path}")
            return backup_path
            
        except Exception as e:
            print(f"   ❌ 备份失败: {e}")
            return None
    
    def generate_bulk_data(self, count=100):
        """生成大量测试数据"""
        print(f"🏗️  生成 {count} 条测试数据...")
        
        try:
            # 生成大量健康数据
            for i in range(count):
                # 随机选择患者
                patients = User.objects.filter(role='patient')
                if not patients.exists():
                    print("   ⚠️  没有患者用户，请先创建用户")
                    return False
                
                patient = random.choice(patients)
                
                # 随机生成健康指标
                metric_types = ['blood_pressure', 'blood_glucose', 'heart_rate', 'weight', 'temperature']
                metric_type = random.choice(metric_types)
                
                # 生成随机值
                if metric_type == 'blood_pressure':
                    systolic = random.randint(90, 180)
                    diastolic = random.randint(60, 110)
                    value = f"{systolic}/{diastolic}"
                elif metric_type == 'blood_glucose':
                    value = random.uniform(3.9, 15.0)
                elif metric_type == 'heart_rate':
                    value = random.randint(50, 120)
                elif metric_type == 'weight':
                    value = random.uniform(40.0, 120.0)
                else:  # temperature
                    value = random.uniform(36.0, 39.0)
                
                # 创建健康记录
                HealthMetric.objects.create(
                    patient=patient,
                    metric_type=metric_type,
                    value=value,
                    measured_at=datetime.now() - timedelta(days=random.randint(0, 30))
                )
                
                if (i + 1) % 20 == 0:
                    print(f"   📊 已生成 {i + 1} 条数据...")
            
            print(f"   ✅ 成功生成 {count} 条测试数据")
            return True
            
        except Exception as e:
            print(f"   ❌ 生成数据失败: {e}")
            return False
    
    def generate_report(self):
        """生成详细的数据统计报告"""
        print("📊 生成数据统计报告...")
        
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_users': User.objects.count(),
                    'doctors': User.objects.filter(role='doctor').count(),
                    'patients': User.objects.filter(role='patient').count(),
                    'relations': DoctorPatientRelation.objects.count(),
                    'health_metrics': HealthMetric.objects.count(),
                    'alerts': Alert.objects.count(),
                    'medications': MedicationPlan.objects.count()
                },
                'user_analysis': {
                    'active_users': User.objects.filter(is_active=True).count(),
                    'inactive_users': User.objects.filter(is_active=False).count(),
                    'recent_users': User.objects.filter(
                        date_joined__gte=datetime.now() - timedelta(days=7)
                    ).count()
                },
                'health_data_analysis': {
                    'metrics_by_type': list(HealthMetric.objects.values('metric_type').annotate(
                        count=Count('id')
                    )),
                    'recent_metrics': HealthMetric.objects.filter(
                        measured_at__gte=datetime.now() - timedelta(days=7)
                    ).count()
                },
                'alert_analysis': {
                    'alerts_by_priority': list(Alert.objects.values('priority').annotate(
                        count=Count('id')
                    )),
                    'alerts_by_status': list(Alert.objects.values('status').annotate(
                        count=Count('id')
                    ))
                }
            }
            
            # 保存报告到文件
            report_filename = f'data_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            with open(report_filename, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2, default=str)
            
            print(f"   ✅ 报告已生成: {report_filename}")
            
            # 显示摘要
            print("\n   📋 数据摘要:")
            print(f"     总用户数: {report['summary']['total_users']}")
            print(f"     医生数: {report['summary']['doctors']}")
            print(f"     患者数: {report['summary']['patients']}")
            print(f"     健康记录: {report['summary']['health_metrics']}")
            print(f"     告警数: {report['summary']['alerts']}")
            
            return report_filename
            
        except Exception as e:
            print(f"   ❌ 生成报告失败: {e}")
            return None
    
    def test_all_apis(self):
        """测试所有API端点"""
        print("🔍 测试所有API端点...")
        
        try:
            client = Client()
            test_results = []
            
            # 测试用户相关API
            apis_to_test = [
                {'url': '/api/accounts/login/', 'method': 'POST', 'name': '用户登录'},
                {'url': '/api/accounts/register/', 'method': 'POST', 'name': '用户注册'},
                {'url': '/api/health/metrics/', 'method': 'GET', 'name': '健康数据'},
                {'url': '/api/health/alerts/', 'method': 'GET', 'name': '告警数据'},
                {'url': '/api/medication/plans/', 'method': 'GET', 'name': '用药计划'},
                {'url': '/api/communication/messages/', 'method': 'GET', 'name': '消息列表'}
            ]
            
            for api in apis_to_test:
                try:
                    if api['method'] == 'GET':
                        response = client.get(api['url'])
                    else:
                        response = client.post(api['url'], {})
                    
                    status = '✅' if response.status_code in [200, 201, 400, 401] else '❌'
                    test_results.append({
                        'name': api['name'],
                        'url': api['url'],
                        'status_code': response.status_code,
                        'result': status
                    })
                    
                    print(f"     {status} {api['name']}: {response.status_code}")
                    
                except Exception as e:
                    test_results.append({
                        'name': api['name'],
                        'url': api['url'],
                        'status_code': 'Error',
                        'result': '❌'
                    })
                    print(f"     ❌ {api['name']}: 连接失败")
            
            # 保存测试结果
            results_filename = f'api_test_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            with open(results_filename, 'w', encoding='utf-8') as f:
                json.dump(test_results, f, ensure_ascii=False, indent=2)
            
            print(f"\n   📊 API测试完成，结果已保存到: {results_filename}")
            return test_results
            
        except Exception as e:
            print(f"   ❌ API测试失败: {e}")
            return None

    def interactive_menu(self):
        """交互式菜单"""
        while True:
            print("\n" + "="*60)
            print("🎯 统一测试数据管理器")
            print("="*60)
            print("1. 显示数据库状态")
            print("2. 清除数据库数据（保留表结构）")
            print("3. 创建基本测试用户（3医生+3患者）")
            print("4. 创建完整测试用户（3医生+8患者）")
            print("5. 创建健康数据和告警")
            print("6. 运行智能告警分析")
            print("7. 测试搜索功能")
            print("8. 分析告警摘要")
            print("9. 模拟实时分析")
            print("10. 设置5级风险评估系统")
            print("11. 一键创建完整系统（清除+用户+数据+分析+5级风险）")
            print("12. 导出测试数据")
            print("13. 验证数据完整性")
            print("14. 性能测试")
            print("15. 清理孤立数据")
            print("16. 备份数据库")
            print("17. 生成大量测试数据")
            print("18. 生成数据报告")
            print("19. 测试所有API")
            print("0. 退出")
            print("="*60)
            
            choice = input("请选择操作 (0-19): ").strip()
            
            if choice == '0':
                print("👋 再见！")
                break
            elif choice == '1':
                self.show_status()
            elif choice == '2':
                self.clear_database()
            elif choice == '3':
                self.create_basic_users()
            elif choice == '4':
                self.create_comprehensive_users()
            elif choice == '5':
                self.create_health_data()
            elif choice == '6':
                # 智能告警分析子菜单
                print("\n🧠 智能告警分析选项:")
                print("  a. 分析所有医生")
                print("  b. 分析指定医生")
                sub_choice = input("请选择 (a/b): ").strip().lower()
                if sub_choice == 'a':
                    self.run_intelligent_analysis(all_doctors=True)
                elif sub_choice == 'b':
                    doctor_id = input("请输入医生ID: ").strip()
                    if doctor_id.isdigit():
                        self.run_intelligent_analysis(doctor_id=int(doctor_id))
                    else:
                        print("❌ 无效的医生ID")
            elif choice == '7':
                self.test_search_functionality()
            elif choice == '8':
                self.analyze_alerts_summary()
            elif choice == '9':
                # 模拟实时分析
                print("\n⚡ 模拟实时分析:")
                patient_id = input("请输入患者ID: ").strip()
                metric_type = input("请输入指标类型 (blood_pressure/blood_glucose/heart_rate): ").strip()
                if patient_id.isdigit() and metric_type in ['blood_pressure', 'blood_glucose', 'heart_rate']:
                    self.trigger_realtime_analysis(int(patient_id), metric_type)
                else:
                    print("❌ 无效的参数")
            elif choice == '10':
                self.setup_5_level_risk_system()
            elif choice == '11':
                print("🚀 一键创建完整系统（包含5级风险）...")
                if self.clear_database():
                    self.create_comprehensive_users()
                    self.create_health_data()
                    self.run_intelligent_analysis(all_doctors=True)
                    self.setup_5_level_risk_system()
                    self.analyze_alerts_summary()
                    print("🎉 完整系统创建完成！")
            elif choice == '12':
                # 导出测试数据
                print("\n📤 导出测试数据选项:")
                print("  a. 导出为JSON格式")
                print("  b. 导出为CSV格式")
                sub_choice = input("请选择 (a/b): ").strip().lower()
                if sub_choice == 'a':
                    self.export_test_data('json')
                elif sub_choice == 'b':
                    self.export_test_data('csv')
                else:
                    print("❌ 无效选择")
            elif choice == '13':
                self.validate_data_integrity()
            elif choice == '14':
                # 性能测试子菜单
                print("\n⚡ 性能测试选项:")
                print("  a. 基本性能测试")
                print("  b. 压力测试")
                sub_choice = input("请选择 (a/b): ").strip().lower()
                if sub_choice == 'a':
                    self.performance_test('basic')
                elif sub_choice == 'b':
                    self.performance_test('stress')
                else:
                    print("❌ 无效选择")
            elif choice == '15':
                self.cleanup_orphaned_data()
            elif choice == '16':
                self.backup_database()
            elif choice == '17':
                # 生成大量测试数据
                print("\n🏗️  生成大量测试数据:")
                try:
                    count = int(input("请输入要生成的数据条数 (默认100): ").strip() or "100")
                    self.generate_bulk_data(count)
                except ValueError:
                    print("❌ 无效的数字，使用默认值100")
                    self.generate_bulk_data(100)
            elif choice == '18':
                self.generate_report()
            elif choice == '19':
                self.test_all_apis()
            else:
                print("❌ 无效选择，请重新输入")


def main():
    """主函数"""
    if len(sys.argv) > 1:
        # 命令行模式
        manager = UnifiedTestDataManager()
        command = sys.argv[1].lower()
        
        if command == 'clear':
            manager.clear_database(confirm=True)
        elif command == 'basic':
            manager.create_basic_users()
        elif command == 'full':
            manager.create_comprehensive_users()
        elif command == 'health':
            manager.create_health_data()
        elif command == 'test':
            manager.test_search_functionality()
        elif command == 'enhanced':
            # 使用增强数据创建器
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
            manager.create_enhanced_test_data(days)
        elif command == 'status':
            manager.show_status()
        elif command == 'setup':
            manager.clear_database(confirm=True)
            manager.create_comprehensive_users()
            manager.create_health_data()
            manager.run_intelligent_analysis(all_doctors=True)
            manager.analyze_alerts_summary()
        elif command == 'analyze':
            manager.run_intelligent_analysis(all_doctors=True)
        elif command == 'summary':
            manager.analyze_alerts_summary()
        elif command == 'realtime':
            # 示例: python unified_test_data_manager.py realtime 1 blood_pressure
            if len(sys.argv) >= 4:
                patient_id = int(sys.argv[2])
                metric_type = sys.argv[3]
                manager.trigger_realtime_analysis(patient_id, metric_type)
            else:
                print("使用方法: python unified_test_data_manager.py realtime <patient_id> <metric_type>")
        elif command == 'risk5':
            manager.setup_5_level_risk_system()
        elif command == 'fullsetup':
            # 完整设置包含5级风险系统
            manager.clear_database(confirm=True)
            manager.create_comprehensive_users()
            manager.create_health_data()
            manager.run_intelligent_analysis(all_doctors=True)
            manager.setup_5_level_risk_system()
            manager.analyze_alerts_summary()
        elif command == 'export':
            # 导出测试数据
            format_type = sys.argv[2] if len(sys.argv) > 2 else 'json'
            if format_type in ['json', 'csv']:
                manager.export_test_data(format_type)
            else:
                print("❌ 无效格式，支持: json, csv")
        elif command == 'validate':
            manager.validate_data_integrity()
        elif command == 'performance':
            test_type = sys.argv[2] if len(sys.argv) > 2 else 'basic'
            if test_type in ['basic', 'stress']:
                manager.performance_test(test_type)
            else:
                print("❌ 无效测试类型，支持: basic, stress")
        elif command == 'cleanup':
            manager.cleanup_orphaned_data()
        elif command == 'backup':
            manager.backup_database()
        elif command == 'generate':
            # 生成大量测试数据
            count = int(sys.argv[2]) if len(sys.argv) > 2 else 100
            manager.generate_bulk_data(count)
        elif command == 'medication':
            # 创建用药依从性报警测试数据
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
            manager.create_medication_adherence_alerts(days)
        elif command == 'report':
            manager.generate_report()
        elif command == 'test_apis':
            manager.test_all_apis()
        else:
            print("❌ 未知命令")
            print("📋 可用命令:")
            print("   数据管理: clear, basic, full, health, enhanced [days], status")
            print("   智能分析: analyze, summary, realtime")
            print("   风险系统: risk5")
            print("   功能测试: test")
            print("   数据导出: export [json|csv]")
            print("   数据验证: validate")
            print("   性能测试: performance [basic|stress]")
            print("   数据清理: cleanup")
            print("   数据备份: backup")
            print("   批量生成: generate [count]")
            print("   用药报警: medication [days]")
            print("   生成报告: report")
            print("   API测试: test_apis")
            print("   一键设置: setup, fullsetup")
    else:
        # 直接执行完整设置，无需交互
        print("🚀 开始自动执行完整系统设置...")
        manager = UnifiedTestDataManager()
        
        # 显示初始状态
        print("\n📊 当前数据库状态:")
        manager.show_status()
        
        # 执行完整设置流程
        print("\n🔄 步骤1: 清除数据库...")
        if manager.clear_database(confirm=True):
            print("✅ 数据库清除完成")
            
            print("\n👥 步骤2: 创建用户...")
            manager.create_comprehensive_users()
            print("✅ 用户创建完成")
            
            print("\n🏥 步骤3: 创建健康数据...")
            manager.create_health_data()
            print("✅ 健康数据创建完成")
            
            print("\n🧠 步骤4: 运行智能分析...")
            manager.run_intelligent_analysis(all_doctors=True)
            print("✅ 智能分析完成")
            
            print("\n⚠️  步骤5: 设置5级风险系统...")
            manager.setup_5_level_risk_system()
            print("✅ 5级风险系统设置完成")
            
            print("\n📈 步骤6: 生成告警摘要...")
            manager.analyze_alerts_summary()
            print("✅ 告警摘要生成完成")
            
            print("\n🔍 步骤7: 验证数据完整性...")
            manager.validate_data_integrity()
            print("✅ 数据完整性验证完成")
            
            print("\n📊 步骤8: 显示最终状态...")
            manager.show_status()
            
            print("\n🎉 完整系统设置完成！")
            print("💡 提示: 如需其他操作，请使用命令行参数，例如:")
            print("   python unified_test_data_manager.py export json")
            print("   python unified_test_data_manager.py performance stress")
            print("   python unified_test_data_manager.py test_apis")
        else:
            print("❌ 数据库清除失败，操作终止")


if __name__ == '__main__':
    main()
