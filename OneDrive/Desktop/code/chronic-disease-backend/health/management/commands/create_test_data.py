#!/usr/bin/env python3
"""
Django管理命令：创建测试健康数据和告警
使用方法: python manage.py create_test_data [--days 30] [--patients 0]
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from accounts.models import User
from health.models import HealthMetric, Alert, DoctorPatientRelation
from medication.models import MedicationPlan, MedicationReminder
import random
import math
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
        
        # 基于患者特征生成个性化数据模式
        patient_profile = self._analyze_patient_profile(patient)
        
        for day in range(days_back):
            date = timezone.now() - timedelta(days=day)
            
            # 生成血压数据（考虑昼夜变化和趋势）
            bp_metrics = self._generate_blood_pressure(patient_profile, day, date)
            created_metrics.extend(bp_metrics)
            
            # 生成心率数据（考虑活动和压力因素）
            hr_metrics = self._generate_heart_rate(patient_profile, day, date)
            created_metrics.extend(hr_metrics)
            
            # 生成体重数据（考虑长期趋势和短期波动）
            weight_metrics = self._generate_weight(patient_profile, day, date)
            created_metrics.extend(weight_metrics)
            
            # 生成血糖数据（考虑饮食和用药影响）
            bg_metrics = self._generate_blood_glucose(patient_profile, day, date)
            created_metrics.extend(bg_metrics)
            

        
        self.stdout.write(f'   ✅ 为 {patient.name} 创建了 {len(created_metrics)} 条健康记录')
        return created_metrics

    def _analyze_patient_profile(self, patient):
        """分析患者特征，生成个性化数据模式"""
        profile = {
            'patient': patient,  # 添加患者引用
            'age': patient.age or 45,
            'gender': patient.gender or 'male',
            'base_health': self._calculate_base_health(patient),
            'stress_level': self._calculate_stress_level(patient),
            'activity_level': self._calculate_activity_level(patient),
            'disease_patterns': self._identify_disease_patterns(patient),
            'seasonal_factors': self._calculate_seasonal_factors(),
            'random_variation': random.uniform(0.8, 1.2)
        }
        return profile

    def _calculate_base_health(self, patient):
        """计算基础健康水平"""
        # 基于年龄、性别和基本信息计算
        age_factor = max(0.5, 1.0 - (patient.age or 45) / 100)
        gender_factor = 1.1 if patient.gender == 'female' else 1.0
        
        # 随机健康基础值
        base = random.uniform(0.6, 1.0)
        return base * age_factor * gender_factor

    def _calculate_stress_level(self, patient):
        """计算压力水平"""
        # 基于患者特征和随机因素
        base_stress = random.uniform(0.3, 0.8)
        
        # 年龄相关压力
        if patient.age and patient.age > 50:
            base_stress += 0.2
        
        # 随机波动
        daily_variation = random.uniform(-0.1, 0.1)
        return max(0.1, min(1.0, base_stress + daily_variation))

    def _calculate_activity_level(self, patient):
        """计算活动水平"""
        # 基于年龄和随机因素
        if patient.age and patient.age > 60:
            base_activity = random.uniform(0.3, 0.6)
        elif patient.age and patient.age > 40:
            base_activity = random.uniform(0.5, 0.8)
        else:
            base_activity = random.uniform(0.7, 1.0)
        
        return base_activity

    def _identify_disease_patterns(self, patient):
        """识别疾病模式"""
        patterns = {
            'hypertension_risk': random.uniform(0.1, 0.9),
            'diabetes_risk': random.uniform(0.1, 0.9),
            'heart_disease_risk': random.uniform(0.1, 0.9),
            'obesity_risk': random.uniform(0.1, 0.9)
        }
        
        # 基于患者信息调整风险
        if patient.age and patient.age > 50:
            patterns['hypertension_risk'] += 0.2
            patterns['heart_disease_risk'] += 0.2
        
        return patterns

    def _calculate_seasonal_factors(self):
        """计算季节性因素"""
        current_month = timezone.now().month
        
        # 季节性健康影响
        if current_month in [12, 1, 2]:  # 冬季
            return {'temperature': -2, 'blood_pressure': 5, 'activity': -0.2}
        elif current_month in [6, 7, 8]:  # 夏季
            return {'temperature': 2, 'blood_pressure': -3, 'activity': 0.1}
        else:  # 春秋季
            return {'temperature': 0, 'blood_pressure': 0, 'activity': 0}

    def _generate_blood_pressure(self, profile, day, date):
        """生成血压数据"""
        metrics = []
        
        # 基础血压值（考虑年龄和性别）
        base_systolic = 110 + (profile['age'] - 30) * 0.5
        base_diastolic = 70 + (profile['age'] - 30) * 0.3
        
        # 疾病风险影响
        if profile['disease_patterns']['hypertension_risk'] > 0.6:
            base_systolic += 20
            base_diastolic += 15
        
        # 压力影响
        stress_effect = profile['stress_level'] * 15
        
        # 昼夜变化（早晨和晚上血压较高）
        hour = date.hour
        if hour in [6, 7, 8, 19, 20, 21]:
            circadian_effect = 10
        else:
            circadian_effect = -5
        
        # 季节性影响
        seasonal_effect = profile['seasonal_factors']['blood_pressure']
        
        # 随机波动
        random_variation = random.uniform(-8, 8)
        
        # 计算最终值
        systolic = int(base_systolic + stress_effect + circadian_effect + seasonal_effect + random_variation)
        diastolic = int(base_diastolic + stress_effect * 0.6 + circadian_effect * 0.6 + seasonal_effect * 0.6 + random_variation * 0.6)
        
        # 确保在合理范围内
        systolic = max(90, min(200, systolic))
        diastolic = max(60, min(120, diastolic))
        
        # 创建记录
        metric = HealthMetric.objects.create(
            patient=profile['patient'],
            metric_type='blood_pressure',
            systolic=systolic,
            diastolic=diastolic,
            measured_at=date,
            measured_by=profile['patient'],
            note=f'智能生成血压数据 - 第{day+1}天'
        )
        metrics.append(metric)
        
        return metrics

    def _generate_heart_rate(self, profile, day, date):
        """生成心率数据"""
        metrics = []
        
        # 基础心率（考虑年龄和活动水平）
        base_hr = 80 - (profile['age'] - 30) * 0.3
        base_hr = max(50, min(100, base_hr))
        
        # 活动水平影响
        activity_effect = (1 - profile['activity_level']) * 20
        
        # 压力影响
        stress_effect = profile['stress_level'] * 15
        
        # 昼夜变化
        hour = date.hour
        if hour in [6, 7, 8]:  # 早晨
            circadian_effect = 10
        elif hour in [22, 23, 0, 1]:  # 夜间
            circadian_effect = -15
        else:
            circadian_effect = 0
        
        # 随机波动
        random_variation = random.uniform(-10, 10)
        
        # 计算最终值
        heart_rate = int(base_hr + activity_effect + stress_effect + circadian_effect + random_variation)
        heart_rate = max(45, min(120, heart_rate))
        
        # 创建记录
        metric = HealthMetric.objects.create(
            patient=profile['patient'],
            metric_type='heart_rate',
            heart_rate=heart_rate,
            measured_at=date,
            measured_by=profile['patient'],
            note=f'智能生成心率数据 - 第{day+1}天'
        )
        metrics.append(metric)
        
        return metrics

    def _generate_weight(self, profile, day, date):
        """生成体重数据"""
        metrics = []
        
        # 基础体重（考虑年龄、性别和身高）
        base_weight = 65 + (profile['age'] - 30) * 0.3
        if profile['gender'] == 'male':
            base_weight += 10
        
        # 长期趋势（模拟体重变化）
        trend_factor = math.sin(day / 30 * 2 * math.pi) * 2  # 周期性变化
        
        # 活动水平影响
        activity_effect = (1 - profile['activity_level']) * 3
        
        # 季节性影响
        seasonal_effect = profile['seasonal_factors']['activity'] * 2
        
        # 随机波动
        random_variation = random.uniform(-1, 1)
        
        # 计算最终值
        weight = base_weight + trend_factor + activity_effect + seasonal_effect + random_variation
        weight = max(40, min(120, weight))
        
        # 创建记录
        metric = HealthMetric.objects.create(
            patient=profile['patient'],
            metric_type='weight',
            weight=round(weight, 1),
            measured_at=date,
            measured_by=profile['patient'],
            note=f'智能生成体重数据 - 第{day+1}天'
        )
        metrics.append(metric)
        
        return metrics

    def _generate_blood_glucose(self, profile, day, date):
        """生成血糖数据"""
        metrics = []
        
        # 基础血糖值
        base_glucose = 5.0
        
        # 疾病风险影响
        if profile['disease_patterns']['diabetes_risk'] > 0.6:
            base_glucose += 3.0
        
        # 昼夜变化（餐后血糖较高）
        hour = date.hour
        if hour in [8, 12, 18]:  # 餐后时间
            meal_effect = 2.0
        else:
            meal_effect = 0
        
        # 活动水平影响
        activity_effect = (1 - profile['activity_level']) * 1.5
        
        # 压力影响
        stress_effect = profile['stress_level'] * 1.0
        
        # 随机波动
        random_variation = random.uniform(-0.5, 0.5)
        
        # 计算最终值
        glucose = base_glucose + meal_effect + activity_effect + stress_effect + random_variation
        glucose = max(3.5, min(15.0, glucose))
        
        # 创建记录
        metric = HealthMetric.objects.create(
            patient=profile['patient'],
            metric_type='blood_glucose',
            blood_glucose=round(glucose, 1),
            measured_at=date,
            measured_by=profile['patient'],
            note=f'智能生成血糖数据 - 第{day+1}天'
        )
        metrics.append(metric)
        
        return metrics



    def _create_medication_data(self, patient, days_back):
        """为患者创建用药数据"""
        self.stdout.write(f'   💊 创建用药数据...')
        
        # 这里可以创建用药计划和提醒
        # 暂时返回空列表，因为用药数据创建逻辑比较复杂
        self.stdout.write(f'   ⚠️  用药数据创建功能待完善')
        return []

    def _create_trend_alerts(self, patient, days_back):
        """为患者创建趋势告警"""
        self.stdout.write(f'   🚨 创建趋势告警...')
        
        alerts = []
        
        # 获取患者最近的健康数据
        recent_metrics = HealthMetric.objects.filter(
            patient=patient,
            measured_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('measured_at')
        
        if recent_metrics.count() < 3:
            self.stdout.write(f'   ℹ️  {patient.name} 数据不足，跳过趋势告警')
            return alerts
        
        # 检查血压趋势
        bp_metrics = recent_metrics.filter(metric_type='blood_pressure')
        if bp_metrics.count() >= 3:
            # 检查是否有连续高血压
            high_bp_count = 0
            for metric in bp_metrics:
                if metric.systolic >= 140 or metric.diastolic >= 90:
                    high_bp_count += 1
                else:
                    high_bp_count = 0
                
                if high_bp_count >= 3:
                    # 创建连续高血压告警
                    alert = Alert.objects.create(
                        patient=patient,
                        title='连续高血压告警',
                        description=f'患者 {patient.name} 连续3天血压偏高，建议及时就医',
                        alert_type='trend',
                        priority='high',
                        status='pending',
                        notes=f'基于最近{days_back}天数据趋势分析'
                    )
                    alerts.append(alert)
                    self.stdout.write(f'   🚨 为 {patient.name} 创建连续高血压告警')
                    break
        
        # 检查血糖趋势
        bg_metrics = recent_metrics.filter(metric_type='blood_glucose')
        if bg_metrics.count() >= 3:
            # 检查是否有连续高血糖
            high_bg_count = 0
            for metric in bg_metrics:
                if metric.blood_glucose >= 7.0:
                    high_bg_count += 1
                else:
                    high_bg_count = 0
                
                if high_bg_count >= 3:
                    # 创建连续高血糖告警
                    alert = Alert.objects.create(
                        patient=patient,
                        title='连续高血糖告警',
                        description=f'患者 {patient.name} 连续3天血糖偏高，建议调整饮食和用药',
                        alert_type='trend',
                        priority='medium',
                        status='pending',
                        notes=f'基于最近{days_back}天数据趋势分析'
                    )
                    alerts.append(alert)
                    self.stdout.write(f'   🚨 为 {patient.name} 创建连续高血糖告警')
                    break
        
        return alerts
