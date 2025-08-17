#!/usr/bin/env python3
"""
统一测试数据管理工具
整合了所有用户创建、测试数据生成和数据库管理功能
"""
import os
import sys
import django
from datetime import timedelta
from django.utils import timezone
import random
import json
from django.test import Client

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import DoctorPatientRelation, HealthMetric, Alert, ThresholdSetting
from medication.models import MedicationPlan, MedicationReminder
from django.core.management import execute_from_command_line
from django.db.models import Count


class UnifiedTestDataManager:
    """统一测试数据管理器"""
    
    def __init__(self):
        print("🎯 统一测试数据管理器初始化完成")
    
    def clear_database(self, confirm=False):
        """清除数据库所有数据，保留表结构"""
        if not confirm:
            response = input("⚠️  确定要清除所有数据库数据吗？(输入 'YES' 确认): ")
            if response != 'YES':
                print("❌ 操作已取消")
                return False
        
        print("🗑️  正在清除数据库数据...")

        # 清理前确保数据库结构存在（迁移）
        try:
            from django.core.management import call_command
            print("   🔧 检查并应用数据库迁移...")
            call_command('makemigrations', 'accounts', 'health', 'medication', interactive=False, verbosity=0)
            call_command('migrate', interactive=False, verbosity=0)
            print("   ✅ 迁移完成")
        except Exception as e:
            print(f"   ⚠️  迁移检查失败（继续清理数据）: {e}")
        
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
            patient.last_login = timezone.now() - timedelta(days=random.randint(1, 30))
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
            # 支持通过环境变量配置规模
            patients_count = int(os.environ.get('TEST_PATIENTS', '12'))
            days = int(os.environ.get('TEST_DAYS', '7'))
            call_command('create_test_data', patients=patients_count, days=days)
            print(f"   ✅ 通过管理命令创建健康数据（患者: {patients_count}，天数: {days}）")
        except Exception as e:
            print(f"   ❌ 管理命令失败: {e}")
            print("   📝 请手动运行: python manage.py create_test_data")
    
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
            print("0. 退出")
            print("="*60)
            
            choice = input("请选择操作 (0-11): ").strip()
            
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
        else:
            print("❌ 未知命令")
            print("📋 可用命令:")
            print("   数据管理: clear, basic, full, health, status")
            print("   智能分析: analyze, summary, realtime")
            print("   风险系统: risk5")
            print("   功能测试: test")
            print("   一键设置: setup, fullsetup")
    else:
        # 交互模式
        manager = UnifiedTestDataManager()
        manager.interactive_menu()


if __name__ == '__main__':
    main()