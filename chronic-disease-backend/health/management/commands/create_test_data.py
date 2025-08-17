"""
创建测试数据命令
为智能告警系统创建测试用的患者数据

使用方法:
python manage.py create_test_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
import hashlib
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
        parser.add_argument(
            '--patients',
            type=int,
            default=12,
            help='要创建的患者数量（默认: 12）',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='为每位患者生成最近N天的健康数据（默认: 7）',
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
        patients = self._create_patients(options.get('patients', 12))
        
        # 3. 建立医患关系
        self._create_doctor_patient_relations(doctor, patients)
        
        # 4. 创建健康指标数据
        self._create_health_metrics(patients, days=options.get('days', 7))
        
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
    
    def _stable_int(self, key, modulo: int) -> int:
        """基于MD5的稳定哈希，避免Python内置hash的随机盐导致不可复现"""
        digest = hashlib.md5(str(key).encode('utf-8')).hexdigest()
        return int(digest, 16) % max(1, modulo)

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
    
    def _create_patients(self, patients_count: int):
        """创建测试患者
        
        说明:
        - 前3位使用固定示例（便于演示趋势）
        - 其余自动生成，确保phone唯一
        """
        base_patients = [
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
                'gender': 'female',
                'phone': '+8613800138002',
                'height': 162.0,
                'blood_type': 'B',
            },
            {
                'email': 'wangwu@test.com',
                'username': 'wangwu',
                'name': '王五',
                'age': 38,
                'gender': 'male', 
                'phone': '+8613800138003',
                'height': 178.0,
                'blood_type': 'O',
            }
        ]

        # 自动扩展生成
        auto_generated = []
        next_index = 4
        while len(base_patients) + len(auto_generated) < max(3, patients_count):
            name_pool_family = ['赵', '钱', '孙', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫']
            name_pool_given = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '安', '宁', '康', '强']
            family = name_pool_family[(next_index * 3) % len(name_pool_family)]
            given = name_pool_given[(next_index * 5) % len(name_pool_given)]
            name = f'{family}{given}'
            # 使用独立前缀，避免与统一管理器创建的 patientXXX 重名
            username = f'ctd_patient{next_index:03d}'
            email = f'{username}@test.com'
            # 避免与现有前缀冲突，使用 138001381xx
            phone_suffix = 100 + next_index
            phone = f'+86138001381{phone_suffix:02d}'
            gender = 'female' if next_index % 2 == 0 else 'male'
            height = 160.0 + (next_index % 20)
            blood_types = ['A', 'B', 'O', 'AB']
            blood_type = blood_types[next_index % len(blood_types)]
            age = 25 + (next_index % 50)
            auto_generated.append({
                'email': email,
                'username': username,
                'name': name,
                'age': age,
                'gender': gender,
                'phone': phone,
                'height': height,
                'blood_type': blood_type,
            })
            next_index += 1

        patients_data = base_patients + auto_generated

        patients = []
        for data in patients_data[:patients_count]:
            # 基础三位依旧用phone去重，后续自动生成的用username去重，避免唯一性冲突
            if data['username'] in {'zhangsan', 'lisi', 'wangwu'}:
                patient, created = User.objects.get_or_create(
                    phone=data['phone'],
                    defaults={**data, 'role': 'patient', 'is_active': True}
                )
            else:
                patient, created = User.objects.get_or_create(
                    username=data['username'],
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
    
    def _create_health_metrics(self, patients, days: int = 7):
        """创建健康指标数据
        
        - 为每个患者创建最近days天的数据
        - 前3名患者保留示例特征，其余随机波动
        """
        now = timezone.now()
        
        for patient in patients:
            self.stdout.write(f'📊 为患者 {patient.name} 创建健康数据...')
            
            for day in range(days):
                date = now - timedelta(days=day)
                # 使用越靠近今天数值越高/低的趋势变量
                trend_day = (days - 1) - day
                
                # 血压
                if patient.name == '张三':
                    systolic = 125 + min(trend_day, 3)
                    diastolic = 78 + min(trend_day, 3)
                elif patient.name == '李四':
                    systolic = 145 + min(trend_day, 3) * 5
                    diastolic = 92 + min(trend_day, 3) * 2
                elif patient.name == '王五':
                    systolic = 148 - min(trend_day, 3) * 2
                    diastolic = 90 - min(trend_day, 3)
                else:
                    # 随机围绕个体基线波动
                    base_sys = 110 + self._stable_int(patient.phone, 40)  # 110-149
                    base_dia = 70 + self._stable_int(patient.username, 20)  # 70-89
                    # 轻微日内波动 + 趋势噪声
                    systolic = base_sys + ((trend_day % 4) - 1) * 2
                    diastolic = base_dia + ((trend_day % 3) - 1)
                
                HealthMetric.objects.create(
                    patient=patient,
                    measured_by=patient,
                    metric_type='blood_pressure',
                    systolic=systolic,
                    diastolic=diastolic,
                    measured_at=date,
                    note=f'患者自测血压 - 第{days - day}天'
                )
                
                # 血糖
                if patient.name == '张三':
                    glucose = 6.2 + min(trend_day, 3) * 0.1
                elif patient.name == '李四':
                    glucose = 7.5 + min(trend_day, 3) * 0.3
                elif patient.name == '王五':
                    glucose = 8.2 - min(trend_day, 3) * 0.2
                else:
                    base_glu = 5.5 + self._stable_int(patient.email, 40) / 10.0  # 5.5-9.4
                    glucose = round(base_glu + ((trend_day % 5) - 2) * 0.1, 1)
                
                HealthMetric.objects.create(
                    patient=patient,
                    measured_by=patient,
                    metric_type='blood_glucose',
                    blood_glucose=glucose,
                    measured_at=date - timedelta(hours=2),
                    note='空腹血糖'
                )
                
                # 心率
                if patient.name == '张三':
                    heart_rate = 68 + min(trend_day, 3)
                elif patient.name == '李四':
                    heart_rate = 72 + min(trend_day, 3) * 2
                elif patient.name == '王五':
                    heart_rate = 76 - min(trend_day, 3)
                else:
                    base_hr = 60 + self._stable_int(patient.name, 20)  # 60-79
                    heart_rate = base_hr + ((trend_day % 3) - 1)
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
            # 简化：60%概率3种，40%概率2种（稳定随机）
            patient_medications = created_medications if self._stable_int(patient.phone, 10) < 6 else created_medications[:2]
            
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
                
                # 创建最近N天的用药提醒记录（与健康数据天数保持一致，最少3天）
                reminder_days = max(3, 7)
                for day in range(reminder_days):
                    date = now - timedelta(days=day)
                    
                    for time_str in plan.time_of_day:
                        hour, minute = map(int, time_str.split(':'))
                        reminder_time = date.replace(hour=hour, minute=minute, second=0, microsecond=0)
                        
                        # 模拟用药依从性（随机且可复现）
                        rng_seed = self._stable_int(f"{patient.phone}-{medication.name}-{day}-{time_str}", 100)
                        if rng_seed < 70:
                            status = 'taken'  # 70%
                        elif rng_seed < 85:
                            status = 'missed'  # 15%
                        else:
                            status = 'delayed'  # 15%
                        
                        MedicationReminder.objects.create(
                            plan=plan,
                            reminder_time=reminder_time,
                            scheduled_time=reminder_time.time(),
                            status=status,
                            confirm_time=(reminder_time + timedelta(minutes=10)) if status == 'taken' else (reminder_time + timedelta(hours=1) if status == 'delayed' else None),
                            notes='患者APP确认' if status == 'taken' else ('延迟服药' if status == 'delayed' else '未按时服药')
                        )