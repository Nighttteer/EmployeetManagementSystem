#!/usr/bin/env python3
"""
Django管理命令：创建测试健康数据和告警
使用方法: python manage.py create_test_data [--days 30] [--patients 0]
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

from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from health.models import HealthMetric, Alert, DoctorPatientRelation
from medication.models import MedicationPlan, MedicationReminder
import random
from datetime import timedelta


class Command(BaseCommand):
    help = '创建测试健康数据和告警'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='创建多少天的数据（默认30天）'
        )
        parser.add_argument(
            '--patients',
            type=int,
            default=0,
            help='指定患者数量（0表示所有患者）'
        )

    def handle(self, *args, **options):
        days_back = options['days']
        patient_count = options['patients']
        
        self.stdout.write(
            self.style.SUCCESS(f'🎯 开始创建测试健康数据和告警（{days_back}天）...')
        )
        
        # 获取患者
        if patient_count > 0:
            patients = User.objects.filter(role='patient', is_active=True)[:patient_count]
        else:
            patients = User.objects.filter(role='patient', is_active=True)
        
        if not patients.exists():
            self.stdout.write(
                self.style.ERROR('❌ 没有找到患者用户，请先创建用户')
            )
            return
        
        self.stdout.write(f'✅ 找到 {patients.count()} 个患者用户')
        
        total_metrics = 0
        total_alerts = 0
        total_medications = 0
        
        for patient in patients:
            self.stdout.write(f'\n👤 处理患者: {patient.name}')
            
            # 创建健康数据
            metrics = self._create_health_data(patient, days_back)
            total_metrics += len(metrics)
            
            # 创建用药数据
            medications = self._create_medication_data(patient, days_back)
            total_medications += len(medications)
            
            # 创建趋势告警
            trend_alerts = self._create_trend_alerts(patient, days_back)
            total_alerts += len(trend_alerts)
        
        self.stdout.write(f'\n🎉 数据创建完成！')
        self.stdout.write(f'📊 总计:')
        self.stdout.write(f'   健康记录: {total_metrics} 条')
        self.stdout.write(f'   用药计划: {total_medications} 个')
        self.stdout.write(f'   趋势告警: {total_alerts} 个')
        
        self.stdout.write(
            self.style.SUCCESS('\n✅ 测试数据创建完成！')
        )

    def _create_health_data(self, patient, days_back):
        """为患者创建健康数据"""
        self.stdout.write(f'   📊 创建健康数据...')
        
        created_metrics = []
        patient_pattern = self._get_patient_pattern(patient)
        
        for day in range(days_back, -1, -1):
            date = timezone.now() - timedelta(days=day)
            
            # 每天创建1-3条记录
            records_per_day = random.randint(1, 3)
            
            for record in range(records_per_day):
                # 随机选择指标类型
                metric_type = random.choice(['blood_pressure', 'blood_glucose', 'heart_rate', 'weight', 'temperature'])
                
                # 根据患者模式生成数据
                metric_data = self._generate_metric_data(metric_type, patient_pattern, date)
                
                if metric_data:
                    # 创建健康记录
                    health_metric = HealthMetric.objects.create(
                        patient=patient,
                        metric_type=metric_type,
                        **metric_data,
                        measured_at=date + timedelta(hours=random.randint(0, 23)),
                        note=self._generate_note(metric_type, metric_data)
                    )
                    
                    created_metrics.append(health_metric)
                    
                    # 检查是否需要创建阈值超标告警
                    if self._should_create_threshold_alert(metric_type, metric_data):
                        self._create_threshold_alert(patient, health_metric, metric_type, metric_data)
        
        self.stdout.write(f'     ✅ 创建了 {len(created_metrics)} 条健康记录')
        return created_metrics

    def _get_patient_pattern(self, patient):
        """根据患者特征确定健康数据模式"""
        random.seed(patient.id)
        patterns = ['healthy', 'hypertension', 'diabetes', 'cardiac', 'mixed']
        pattern = random.choice(patterns)
        random.seed()
        return pattern

    def _generate_metric_data(self, metric_type, patient_pattern, date):
        """根据指标类型和患者模式生成数据"""
        if metric_type == 'blood_pressure':
            return self._generate_blood_pressure(patient_pattern, date)
        elif metric_type == 'blood_glucose':
            return self._generate_blood_glucose(patient_pattern, date)
        elif metric_type == 'heart_rate':
            return self._generate_heart_rate(patient_pattern, date)
        elif metric_type == 'weight':
            return self._generate_weight(patient_pattern, date)
        elif metric_type == 'temperature':
            return self._generate_temperature(patient_pattern, date)
        return None

    def _generate_blood_pressure(self, pattern, date):
        """生成血压数据"""
        if pattern == 'healthy':
            if random.random() < 0.8:
                systolic = random.randint(100, 135)
                diastolic = random.randint(65, 85)
            else:
                systolic = random.randint(135, 145)
                diastolic = random.randint(85, 95)
        elif pattern == 'hypertension':
            if random.random() < 0.7:
                systolic = random.randint(140, 180)
                diastolic = random.randint(90, 110)
            else:
                systolic = random.randint(120, 140)
                diastolic = random.randint(80, 90)
        else:
            if random.random() < 0.6:
                systolic = random.randint(110, 150)
                diastolic = random.randint(70, 95)
            else:
                systolic = random.randint(150, 170)
                diastolic = random.randint(95, 105)
        
        return {
            'systolic': systolic,
            'diastolic': diastolic,
            'value': f"{systolic}/{diastolic}"
        }

    def _generate_blood_glucose(self, pattern, date):
        """生成血糖数据"""
        if pattern == 'diabetes':
            if random.random() < 0.8:
                glucose = random.uniform(8.0, 18.0)
            else:
                glucose = random.uniform(6.0, 8.0)
        elif pattern == 'healthy':
            if random.random() < 0.9:
                glucose = random.uniform(4.0, 7.0)
            else:
                glucose = random.uniform(7.0, 8.5)
        else:
            if random.random() < 0.7:
                glucose = random.uniform(4.5, 7.5)
            else:
                glucose = random.uniform(7.5, 10.0)
        
        return {'blood_glucose': round(glucose, 1), 'value': round(glucose, 1)}

    def _generate_heart_rate(self, pattern, date):
        """生成心率数据"""
        if pattern == 'cardiac':
            if random.random() < 0.6:
                heart_rate = random.randint(110, 140)
            else:
                heart_rate = random.randint(50, 70)
        elif pattern == 'healthy':
            if random.random() < 0.9:
                heart_rate = random.randint(65, 95)
            else:
                heart_rate = random.randint(95, 105)
        else:
            if random.random() < 0.8:
                heart_rate = random.randint(70, 100)
            else:
                heart_rate = random.randint(100, 115)
        
        return {'heart_rate': heart_rate, 'value': heart_rate}

    def _generate_weight(self, pattern, date):
        """生成体重数据"""
        base_weight = 65.0
        if pattern == 'healthy':
            variation = random.uniform(-2.0, 2.0)
        else:
            variation = random.uniform(-5.0, 5.0)
        
        weight = base_weight + variation
        return {'weight': round(weight, 1), 'value': round(weight, 1)}

    def _generate_temperature(self, pattern, date):
        """生成体温数据"""
        if pattern == 'healthy':
            if random.random() < 0.95:
                temp = random.uniform(36.2, 37.2)
            else:
                temp = random.uniform(37.2, 37.8)
        else:
            if random.random() < 0.9:
                temp = random.uniform(36.0, 37.5)
            else:
                temp = random.uniform(37.5, 39.0)
        
        return {'temperature': round(temp, 1), 'value': round(temp, 1)}

    def _should_create_threshold_alert(self, metric_type, metric_data):
        """判断是否需要创建阈值超标告警"""
        if metric_type == 'blood_pressure':
            systolic = metric_data.get('systolic', 0)
            diastolic = metric_data.get('diastolic', 0)
            return systolic > 160 or diastolic > 100
        elif metric_type == 'blood_glucose':
            glucose = metric_data.get('blood_glucose', 0)
            return glucose > 11.0 or glucose < 3.5
        elif metric_type == 'heart_rate':
            heart_rate = metric_data.get('heart_rate', 0)
            return heart_rate > 120 or heart_rate < 50
        elif metric_type == 'temperature':
            temp = metric_data.get('temperature', 0)
            return temp > 38.0
        return False

    def _create_threshold_alert(self, patient, health_metric, metric_type, metric_data):
        """创建阈值超标告警"""
        doctor_relations = DoctorPatientRelation.objects.filter(
            patient=patient,
            status='active'
        ).first()
        
        if not doctor_relations:
            return
        
        doctor = doctor_relations.doctor
        
        # 根据指标类型生成告警内容
        if metric_type == 'blood_pressure':
            title = '血压异常警报'
            message = f'患者{patient.name}血压异常：{metric_data["value"]}mmHg，超出正常范围'
            priority = 'critical' if metric_data['systolic'] > 180 else 'high'
        elif metric_type == 'blood_glucose':
            title = '血糖异常警报'
            message = f'患者{patient.name}血糖异常：{metric_data["value"]}mmol/L，超出正常范围'
            priority = 'critical' if metric_data['blood_glucose'] > 15.0 else 'high'
        elif metric_type == 'heart_rate':
            title = '心率异常警报'
            message = f'患者{patient.name}心率异常：{metric_data["value"]}bpm，超出正常范围'
            priority = 'critical' if metric_data['heart_rate'] > 150 else 'high'
        elif metric_type == 'temperature':
            title = '体温异常警报'
            message = f'患者{patient.name}体温异常：{metric_data["value"]}°C，可能发烧'
            priority = 'high'
        else:
            title = '健康指标异常'
            message = f'患者{patient.name}{metric_type}异常：{metric_data["value"]}'
            priority = 'medium'
        
        # 检查是否已有相似告警（避免重复）
        existing_alert = Alert.objects.filter(
            patient=patient,
            assigned_doctor=doctor,
            alert_type='threshold_exceeded',
            status='pending',
            created_at__gte=timezone.now() - timedelta(hours=6)
        ).first()
        
        if not existing_alert:
            Alert.objects.create(
                patient=patient,
                assigned_doctor=doctor,
                alert_type='threshold_exceeded',
                title=title,
                message=message,
                priority=priority,
                status='pending',
                related_metric=health_metric
            )
            self.stdout.write(f'     🚨 创建{priority}优先级告警: {title}')

    def _generate_note(self, metric_type, metric_data):
        """生成健康记录备注"""
        notes = {
            'blood_pressure': ['晨起测量', '服药后测量', '运动后测量', '睡前测量', '静息状态测量'],
            'blood_glucose': ['空腹测量', '餐后2小时', '睡前测量', '运动前测量', '感觉不适时测量'],
            'heart_rate': ['静息状态', '轻度活动后', '测量前休息5分钟', '连续测量3次取平均', '感觉心跳异常时测量'],
            'weight': ['晨起空腹', '每周固定时间', '运动后测量', '饮食调整后测量', '定期监测体重变化'],
            'temperature': ['腋下测量', '口腔测量', '感觉发热时测量', '每日固定时间', '感冒症状时测量']
        }
        
        note_list = notes.get(metric_type, ['常规测量'])
        return random.choice(note_list)

    def _create_medication_data(self, patient, days_back):
        """创建用药数据，包含依从性问题"""
        self.stdout.write(f'   💊 创建用药数据...')
        
        medication_plans = []
        
        if random.random() < 0.7:  # 70%的患者有用药计划
            plan = MedicationPlan.objects.create(
                patient=patient,
                medication_name='降压药' if random.random() < 0.5 else '降糖药',
                dosage='1片',
                frequency='once_daily',
                start_date=timezone.now() - timedelta(days=days_back),
                status='active'
            )
            medication_plans.append(plan)
            
            # 创建用药提醒记录
            self._create_medication_reminders(patient, plan, days_back)
        
        self.stdout.write(f'     ✅ 创建了 {len(medication_plans)} 个用药计划')
        return medication_plans

    def _create_medication_reminders(self, patient, plan, days_back):
        """创建用药提醒记录，包含依从性问题"""
        reminders_created = 0
        missed_count = 0
        
        for day in range(days_back, -1, -1):
            date = timezone.now() - timedelta(days=day)
            
            # 模拟依从性问题
            if random.random() < 0.85:  # 85%的依从性
                MedicationReminder.objects.create(
                    patient=patient,
                    medication_plan=plan,
                    scheduled_time=date.replace(hour=8, minute=0, second=0, microsecond=0),
                    taken_time=date.replace(hour=8, minute=random.randint(0, 30), second=0, microsecond=0),
                    status='taken',
                    note='按时服药'
                )
                reminders_created += 1
            else:
                MedicationReminder.objects.create(
                    patient=patient,
                    medication_plan=plan,
                    scheduled_time=date.replace(hour=8, minute=0, second=0, microsecond=0),
                    status='missed',
                    note='忘记服药'
                )
                missed_count += 1
        
        self.stdout.write(f'       📊 依从性: {reminders_created}/{reminders_created + missed_count} ({reminders_created/(reminders_created + missed_count)*100:.1f}%)')

    def _create_trend_alerts(self, patient, days_back):
        """创建趋势异常告警"""
        self.stdout.write(f'   📈 创建趋势告警...')
        
        doctor_relations = DoctorPatientRelation.objects.filter(
            patient=patient,
            status='active'
        ).first()
        
        if not doctor_relations:
            return []
        
        doctor = doctor_relations.doctor
        
        # 创建趋势异常告警
        trend_alerts = [
            {
                'title': '血压持续偏高趋势',
                'message': f'患者{patient.name}最近7天血压持续偏高，建议调整治疗方案',
                'priority': 'high',
                'alert_type': 'abnormal_trend'
            },
            {
                'title': '血糖控制不稳定',
                'message': f'患者{patient.name}血糖波动较大，需要加强监测',
                'priority': 'medium',
                'alert_type': 'abnormal_trend'
            },
            {
                'title': '体重持续增加',
                'message': f'患者{patient.name}体重连续3周增加，建议调整饮食和运动',
                'priority': 'medium',
                'alert_type': 'abnormal_trend'
            }
        ]
        
        created_alerts = []
        for alert_data in trend_alerts:
            if random.random() < 0.6:  # 60%概率创建趋势告警
                alert = Alert.objects.create(
                    patient=patient,
                    assigned_doctor=doctor,
                    alert_type=alert_data['alert_type'],
                    title=alert_data['title'],
                    message=alert_data['message'],
                    priority=alert_data['priority'],
                    status='pending'
                )
                created_alerts.append(alert)
        
        self.stdout.write(f'     ✅ 创建了 {len(created_alerts)} 个趋势告警')
        return created_alerts


# 如果直接运行此脚本，则执行数据创建
if __name__ == '__main__':
    print("🎯 直接运行测试数据创建脚本...")
    print("💡 建议使用: python manage.py create_test_data")
    
    # 创建命令实例并执行
    command = Command()
    command.handle()
