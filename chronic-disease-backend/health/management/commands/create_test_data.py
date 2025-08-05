"""
创建测试数据命令
为智能告警系统创建测试用的患者数据

使用方法:
python manage.py create_test_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from accounts.models import User
from health.models import HealthMetric, DoctorPatientRelation, Alert
from medication.models import Medication, MedicationPlan, MedicationReminder


class Command(BaseCommand):
    help = '创建智能告警系统的测试数据'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clean',
            action='store_true',
            help='清除现有测试数据',
        )
    
    def handle(self, *args, **options):
        if options['clean']:
            self._clean_test_data()
        
        self.stdout.write(
            self.style.SUCCESS('🏥 开始创建智能告警系统测试数据...')
        )
        
        # 1. 创建医生用户
        doctor = self._create_doctor()
        
        # 2. 创建患者用户
        patients = self._create_patients()
        
        # 3. 建立医患关系
        self._create_doctor_patient_relations(doctor, patients)
        
        # 4. 创建健康指标数据
        self._create_health_metrics(patients)
        
        # 5. 创建用药数据
        self._create_medication_data(doctor, patients)
        
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('✅ 测试数据创建完成！'))
        self.stdout.write(f'👨‍⚕️ 创建医生: {doctor.name} (ID: {doctor.id})')
        self.stdout.write(f'👥 创建患者: {len(patients)} 位')
        self.stdout.write(f'📊 健康数据: 已为每位患者创建最近3天的血压、血糖数据')
        self.stdout.write(f'💊 用药数据: 已创建用药计划和提醒记录')
        self.stdout.write('='*50)
        
        self.stdout.write('\n🔍 现在可以运行数据分析:')
        self.stdout.write(f'   python manage.py analyze_patient_data --doctor-id {doctor.id} --verbose')
    
    def _clean_test_data(self):
        """清除测试数据"""
        self.stdout.write('🧹 清除现有测试数据...')
        
        # 删除告警
        Alert.objects.all().delete()
        
        # 删除用药数据
        MedicationReminder.objects.all().delete()
        MedicationPlan.objects.all().delete()
        
        # 删除健康数据
        HealthMetric.objects.all().delete()
        
        # 删除医患关系
        DoctorPatientRelation.objects.all().delete()
        
        # 删除测试用户（保留超级用户）
        User.objects.filter(is_superuser=False).delete()
        
        self.stdout.write('✅ 测试数据已清除')
    
    def _create_doctor(self):
        """创建测试医生"""
        # 使用phone字段去重，与unified_test_data_manager.py保持一致
        doctor, created = User.objects.get_or_create(
            phone='13800138000',
            defaults={
                'username': 'doctor_test',
                'email': 'doctor@test.com',
                'name': '张医生',
                'role': 'doctor',
                'age': 45,
                'gender': 'male',
                'license_number': 'DOC20240001',
                'department': '心血管内科',
                'title': '主治医师',
                'specialization': '高血压、糖尿病诊治',
                'is_active': True,
            }
        )
        
        if created:
            doctor.set_password('test123456')
            doctor.save()
            self.stdout.write(f'✅ 创建医生: {doctor.name}')
        else:
            self.stdout.write(f'ℹ️  医生已存在: {doctor.name}')
        
        return doctor
    
    def _create_patients(self):
        """创建测试患者"""
        patients_data = [
            {
                'email': 'zhangsan@test.com',
                'username': 'zhangsan',
                'name': '张三',
                'age': 45,
                'gender': 'male',
                'phone': '+8613800138000',
                'height': 170.0,
                'blood_type': 'A',
            },
            {
                'email': 'lisi@test.com',
                'username': 'lisi', 
                'name': '李四',
                'age': 52,
                'gender': 'male',
                'phone': '+8613800138002',
                'height': 175.0,
                'blood_type': 'B',
            },
            {
                'email': 'wangwu@test.com',
                'username': 'wangwu',
                'name': '王五',
                'age': 72,
                'gender': 'male', 
                'phone': '+8613800138003',
                'height': 168.0,
                'blood_type': 'O',
            }
        ]
        
        patients = []
        for data in patients_data:
            # 使用phone字段去重，与unified_test_data_manager.py保持一致
            patient, created = User.objects.get_or_create(
                phone=data['phone'],
                defaults={**data, 'role': 'patient', 'is_active': True}
            )
            
            if created:
                patient.set_password('test123456')
                patient.save()
                self.stdout.write(f'✅ 创建患者: {patient.name}')
            else:
                self.stdout.write(f'ℹ️  患者已存在: {patient.name}')
            
            patients.append(patient)
        
        return patients
    
    def _create_doctor_patient_relations(self, doctor, patients):
        """创建医患关系"""
        for patient in patients:
            relation, created = DoctorPatientRelation.objects.get_or_create(
                doctor=doctor,
                patient=patient,
                defaults={
                    'is_primary': True,
                    'status': 'active',
                    'notes': f'{patient.name}的主治医生'
                }
            )
            
            if created:
                self.stdout.write(f'✅ 建立医患关系: {doctor.name} -> {patient.name}')
    
    def _create_health_metrics(self, patients):
        """创建健康指标数据"""
        now = timezone.now()
        
        for patient in patients:
            self.stdout.write(f'📊 为患者 {patient.name} 创建健康数据...')
            
            # 为每个患者创建最近3天的数据
            for day in range(3):
                date = now - timedelta(days=day)
                # day=0是今天，day=1是昨天，day=2是前天
                # 要让数据呈上升趋势，需要前天<昨天<今天
                # 所以使用 (2-day) 让前天对应0，昨天对应1，今天对应2
                trend_day = 2 - day
                
                # 血压数据 (模拟不同血压情况)
                if patient.name == '张三':
                    # 张三血压正常且稳定
                    systolic = 125 + trend_day
                    diastolic = 78 + trend_day
                elif patient.name == '李四':
                    # 李四血压偏高且上升
                    systolic = 145 + trend_day * 5  # 前天145→昨天150→今天155
                    diastolic = 92 + trend_day * 2
                else:  # 王五
                    # 王五血压稍高但改善
                    systolic = 148 - trend_day * 2  # 前天148→昨天146→今天144(下降)
                    diastolic = 90 - trend_day
                
                HealthMetric.objects.create(
                    patient=patient,
                    measured_by=patient,
                    metric_type='blood_pressure',
                    systolic=systolic,
                    diastolic=diastolic,
                    measured_at=date,
                    note=f'患者自测血压 - 第{3-day}天'
                )
                
                # 血糖数据
                if patient.name == '张三':
                    # 张三血糖正常且稳定
                    glucose = 6.2 + trend_day * 0.1  # 前天6.2→昨天6.3→今天6.4
                elif patient.name == '李四':
                    # 李四血糖偏高且上升
                    glucose = 7.5 + trend_day * 0.3  # 前天7.5→昨天7.8→今天8.1
                else:  # 王五
                    # 王五血糖偏高但改善
                    glucose = 8.2 - trend_day * 0.2  # 前天8.2→昨天8.0→今天7.8(下降)
                
                HealthMetric.objects.create(
                    patient=patient,
                    measured_by=patient,
                    metric_type='blood_glucose',
                    blood_glucose=glucose,
                    measured_at=date - timedelta(hours=2),
                    note='空腹血糖'
                )
                
                # 心率数据
                if patient.name == '张三':
                    heart_rate = 68 + trend_day * 1  # 前天68→昨天69→今天70
                elif patient.name == '李四':
                    heart_rate = 72 + trend_day * 2  # 前天72→昨天74→今天76
                else:  # 王五
                    heart_rate = 76 - trend_day * 1  # 前天76→昨天75→今天74(改善)
                HealthMetric.objects.create(
                    patient=patient,
                    measured_by=patient,
                    metric_type='heart_rate',
                    heart_rate=heart_rate,
                    measured_at=date - timedelta(hours=1),
                    note='晨起心率'
                )
    
    def _create_medication_data(self, doctor, patients):
        """创建用药数据"""
        # 创建药品
        medications = [
            {
                'name': '硝苯地平缓释片',
                'category': 'antihypertensive',
                'unit': 'mg',
                'specification': '30mg/片'
            },
            {
                'name': '二甲双胍片',
                'category': 'hypoglycemic', 
                'unit': 'mg',
                'specification': '500mg/片'
            },
            {
                'name': '阿司匹林肠溶片',
                'category': 'anticoagulant',
                'unit': 'mg', 
                'specification': '100mg/片'
            }
        ]
        
        created_medications = []
        for med_data in medications:
            medication, created = Medication.objects.get_or_create(
                name=med_data['name'],
                defaults=med_data
            )
            created_medications.append(medication)
            
            if created:
                self.stdout.write(f'💊 创建药品: {medication.name}')
        
        # 为患者创建用药计划
        now = timezone.now()
        
        for patient in patients:
            self.stdout.write(f'📋 为患者 {patient.name} 创建用药计划...')
            
            # 每个患者2-3种药物
            patient_medications = created_medications[:2] if patient.name == '王阿姨' else created_medications
            
            for medication in patient_medications:
                plan = MedicationPlan.objects.create(
                    patient=patient,
                    doctor=doctor,
                    medication=medication,
                    dosage=1.0,
                    frequency='BID',  # 每日两次
                    time_of_day=['08:00', '20:00'],
                    start_date=now.date() - timedelta(days=7),
                    status='active',
                    special_instructions=f'{medication.name}饭后服用'
                )
                
                # 创建最近3天的用药提醒记录
                for day in range(3):
                    date = now - timedelta(days=day)
                    
                    for time_str in plan.time_of_day:
                        hour, minute = map(int, time_str.split(':'))
                        reminder_time = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                        
                        # 模拟用药依从性
                        if patient.name == '李大爷':
                            # 李大爷依从性差，经常漏服
                            status = 'missed' if day == 0 and time_str == '20:00' else ('taken' if day > 0 else 'missed')
                        elif patient.name == '王阿姨':
                            # 王阿姨依从性好
                            status = 'taken'
                        else:
                            # 陈叔叔依从性一般
                            status = 'taken' if day > 0 or time_str == '08:00' else 'missed'
                        
                        MedicationReminder.objects.create(
                            plan=plan,
                            reminder_time=reminder_time,
                            scheduled_time=reminder_time.time(),
                            status=status,
                            confirm_time=reminder_time + timedelta(minutes=10) if status == 'taken' else None,
                            notes='患者APP确认' if status == 'taken' else '未按时服药'
                        )