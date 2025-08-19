#!/usr/bin/env python3
"""
增强的健康数据创建脚本
创建能够触发各种报警的真实健康数据
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random
import json

# 添加项目根目录到Python路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import HealthMetric, Alert, ThresholdSetting, DoctorPatientRelation

from django.utils import timezone


class EnhancedDataCreator:
    """增强的健康数据创建器"""
    
    def __init__(self):
        print("🎯 增强健康数据创建器初始化完成")
        
        # 定义各种健康指标的阈值和异常值
        self.thresholds = {
            'blood_pressure': {
                'normal': {'systolic': (90, 140), 'diastolic': (60, 90)},
                'warning': {'systolic': (140, 160), 'diastolic': (90, 100)},
                'danger': {'systolic': (160, 200), 'diastolic': (100, 120)},
                'critical': {'systolic': (200, 250), 'diastolic': (120, 150)}
            },
            'blood_glucose': {
                'normal': (3.9, 7.0),
                'warning': (7.0, 11.0),
                'danger': (11.0, 15.0),
                'critical': (15.0, 25.0)
            },
            'heart_rate': {
                'normal': (60, 100),
                'warning': (100, 120),
                'danger': (120, 150),
                'critical': (150, 200)
            },
            'weight': {
                'normal': (45, 80),
                'warning': (80, 100),
                'danger': (100, 120),
                'critical': (120, 150)
            },
            'uric_acid': {
                'normal': (150, 420),
                'warning': (420, 500),
                'danger': (500, 600),
                'critical': (600, 800)
            },
            'lipids': {
                'normal': {'total': (3.1, 5.7), 'hdl': (1.0, 1.6), 'ldl': (2.1, 3.4), 'triglyceride': (0.4, 1.7)},
                'warning': {'total': (5.7, 6.5), 'hdl': (0.9, 1.0), 'ldl': (3.4, 4.1), 'triglyceride': (1.7, 2.3)},
                'danger': {'total': (6.5, 8.0), 'hdl': (0.8, 0.9), 'ldl': (4.1, 5.0), 'triglyceride': (2.3, 4.0)},
                'critical': {'total': (8.0, 10.0), 'hdl': (0.6, 0.8), 'ldl': (5.0, 7.0), 'triglyceride': (4.0, 6.0)}
            }
        }
    
    def create_realistic_health_data(self, patient, days_back=30):
        """为患者创建真实的健康数据，包含各种异常情况"""
        print(f"📊 为患者 {patient.name} 创建健康数据...")
        
        created_metrics = []
        
        # 为每个患者创建不同模式的健康数据
        patient_pattern = self._get_patient_pattern(patient)
        
        for day in range(days_back, -1, -1):
            date = timezone.now() - timedelta(days=day)
            
            # 每天创建1-3条记录
            records_per_day = random.randint(1, 3)
            
            for record in range(records_per_day):
                # 随机选择指标类型（根据HealthMetric模型支持的字段）
                metric_type = random.choice(['blood_pressure', 'blood_glucose', 'heart_rate', 'weight', 'uric_acid', 'lipids'])
                
                # 根据患者模式生成数据
                metric_data = self._generate_metric_data(metric_type, patient_pattern, date)
                
                if metric_data:
                    # 创建健康记录
                    health_metric = HealthMetric.objects.create(
                        patient=patient,
                        measured_by=patient,  # 患者自己测量
                        metric_type=metric_type,
                        **metric_data,
                        measured_at=date + timedelta(hours=random.randint(0, 23)),
                        note=self._generate_note(metric_type, metric_data)
                    )
                    
                    created_metrics.append(health_metric)
                    
                    # 检查是否需要创建阈值超标告警
                    if self._should_create_threshold_alert(metric_type, metric_data):
                        self._create_threshold_alert(patient, health_metric, metric_type, metric_data)
        
        print(f"   ✅ 创建了 {len(created_metrics)} 条健康记录")
        return created_metrics
    
    def _get_patient_pattern(self, patient):
        """根据患者特征确定健康数据模式"""
        # 基于患者ID生成不同的模式，确保可重现性
        random.seed(patient.id)
        
        patterns = ['healthy', 'hypertension', 'diabetes', 'cardiac', 'mixed']
        pattern = random.choice(patterns)
        
        # 重置随机种子
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
        elif metric_type == 'uric_acid':
            return self._generate_uric_acid(patient_pattern, date)
        elif metric_type == 'lipids':
            return self._generate_lipids(patient_pattern, date)
        
        return None
    
    def _generate_blood_pressure(self, pattern, date):
        """生成血压数据"""
        if pattern == 'healthy':
            # 健康模式：大部分正常，偶尔偏高
            if random.random() < 0.8:
                systolic = random.randint(100, 135)
                diastolic = random.randint(65, 85)
            else:
                systolic = random.randint(135, 145)
                diastolic = random.randint(85, 95)
        elif pattern == 'hypertension':
            # 高血压模式：大部分偏高，偶尔正常
            if random.random() < 0.7:
                systolic = random.randint(140, 180)
                diastolic = random.randint(90, 110)
            else:
                systolic = random.randint(120, 140)
                diastolic = random.randint(80, 90)
        else:
            # 其他模式：混合
            if random.random() < 0.6:
                systolic = random.randint(110, 150)
                diastolic = random.randint(70, 95)
            else:
                systolic = random.randint(150, 170)
                diastolic = random.randint(95, 105)
        
        return {
            'systolic': systolic,
            'diastolic': diastolic
        }
    
    def _generate_blood_glucose(self, pattern, date):
        """生成血糖数据"""
        if pattern == 'diabetes':
            # 糖尿病模式：大部分偏高
            if random.random() < 0.8:
                glucose = random.uniform(8.0, 18.0)
            else:
                glucose = random.uniform(6.0, 8.0)
        elif pattern == 'healthy':
            # 健康模式：大部分正常
            if random.random() < 0.9:
                glucose = random.uniform(4.0, 7.0)
            else:
                glucose = random.uniform(7.0, 8.5)
        else:
            # 其他模式：混合
            if random.random() < 0.7:
                glucose = random.uniform(4.5, 7.5)
            else:
                glucose = random.uniform(7.5, 10.0)
        
        return {'blood_glucose': round(glucose, 1)}
    
    def _generate_heart_rate(self, pattern, date):
        """生成心率数据"""
        if pattern == 'cardiac':
            # 心脏问题模式：心率不稳定
            if random.random() < 0.6:
                heart_rate = random.randint(110, 140)
            else:
                heart_rate = random.randint(50, 70)
        elif pattern == 'healthy':
            # 健康模式：心率稳定
            if random.random() < 0.9:
                heart_rate = random.randint(65, 95)
            else:
                heart_rate = random.randint(95, 105)
        else:
            # 其他模式：混合
            if random.random() < 0.8:
                heart_rate = random.randint(70, 100)
            else:
                heart_rate = random.randint(100, 115)
        
        return {'heart_rate': heart_rate}
    
    def _generate_weight(self, pattern, date):
        """生成体重数据"""
        base_weight = 65.0  # 基础体重
        
        if pattern == 'healthy':
            # 健康模式：体重稳定
            variation = random.uniform(-2.0, 2.0)
        else:
            # 其他模式：体重可能有变化
            variation = random.uniform(-5.0, 5.0)
        
        weight = base_weight + variation
        return {'weight': round(weight, 1)}
    
    def _generate_uric_acid(self, pattern, date):
        """生成尿酸数据"""
        if pattern == 'healthy':
            # 健康模式：尿酸正常
            if random.random() < 0.9:
                uric_acid = random.uniform(150, 420)  # 正常范围：150-420 μmol/L
            else:
                uric_acid = random.uniform(420, 500)  # 偶尔偏高
        else:
            # 其他模式：尿酸可能偏高
            if random.random() < 0.7:
                uric_acid = random.uniform(420, 600)  # 偏高
            else:
                uric_acid = random.uniform(150, 420)  # 偶尔正常
        
        return {'uric_acid': round(uric_acid, 1)}
    
    def _generate_lipids(self, pattern, date):
        """生成血脂数据"""
        if pattern == 'healthy':
            # 健康模式：血脂正常
            if random.random() < 0.9:
                lipids_total = random.uniform(3.1, 5.7)  # 总胆固醇正常范围
                hdl = random.uniform(1.0, 1.6)          # HDL正常范围
                ldl = random.uniform(2.1, 3.4)          # LDL正常范围
                triglyceride = random.uniform(0.4, 1.7)  # 甘油三酯正常范围
            else:
                # 偶尔偏高
                lipids_total = random.uniform(5.7, 6.5)
                hdl = random.uniform(0.9, 1.0)
                ldl = random.uniform(3.4, 4.1)
                triglyceride = random.uniform(1.7, 2.3)
        else:
            # 其他模式：血脂可能异常
            if random.random() < 0.6:
                # 血脂异常
                lipids_total = random.uniform(5.7, 8.0)
                hdl = random.uniform(0.8, 1.0)
                ldl = random.uniform(3.4, 5.0)
                triglyceride = random.uniform(1.7, 4.0)
            else:
                # 偶尔正常
                lipids_total = random.uniform(3.1, 5.7)
                hdl = random.uniform(1.0, 1.6)
                ldl = random.uniform(2.1, 3.4)
                triglyceride = random.uniform(0.4, 1.7)
        
        return {
            'lipids_total': round(lipids_total, 2),
            'hdl': round(hdl, 2),
            'ldl': round(ldl, 2),
            'triglyceride': round(triglyceride, 2)
        }
    

    
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
        elif metric_type == 'uric_acid':
            uric_acid = metric_data.get('uric_acid', 0)
            return uric_acid > 420  # 尿酸正常上限
        elif metric_type == 'lipids':
            lipids_total = metric_data.get('lipids_total', 0)
            hdl = metric_data.get('hdl', 0)
            ldl = metric_data.get('ldl', 0)
            triglyceride = metric_data.get('triglyceride', 0)
            return (lipids_total > 5.7 or hdl < 1.0 or ldl > 3.4 or triglyceride > 1.7)
        
        return False
    
    def _create_threshold_alert(self, patient, health_metric, metric_type, metric_data):
        """创建阈值超标告警"""
        # 获取患者的医生
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
            message = f'患者{patient.name}血压异常：{metric_data["systolic"]}/{metric_data["diastolic"]}mmHg，超出正常范围'
            priority = 'critical' if metric_data['systolic'] > 180 else 'high'
        elif metric_type == 'blood_glucose':
            title = '血糖异常警报'
            message = f'患者{patient.name}血糖异常：{metric_data["blood_glucose"]}mmol/L，超出正常范围'
            priority = 'critical' if metric_data['blood_glucose'] > 15.0 else 'high'
        elif metric_type == 'heart_rate':
            title = '心率异常警报'
            message = f'患者{patient.name}心率异常：{metric_data["heart_rate"]}bpm，超出正常范围'
            priority = 'critical' if metric_data['heart_rate'] > 150 else 'high'
        elif metric_type == 'weight':
            title = '体重异常警报'
            message = f'患者{patient.name}体重异常：{metric_data["weight"]}kg，超出正常范围'
            priority = 'medium'
        elif metric_type == 'uric_acid':
            title = '尿酸异常警报'
            message = f'患者{patient.name}尿酸异常：{metric_data["uric_acid"]}μmol/L，超出正常范围'
            priority = 'high'
        elif metric_type == 'lipids':
            title = '血脂异常警报'
            message = f'患者{patient.name}血脂异常：总胆固醇{metric_data["lipids_total"]}mmol/L，HDL{metric_data["hdl"]}mmol/L，LDL{metric_data["ldl"]}mmol/L，甘油三酯{metric_data["triglyceride"]}mmol/L'
            priority = 'high'
        else:
            title = '健康指标异常'
            message = f'患者{patient.name}{metric_type}异常'
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
            print(f"   🚨 创建{priority}优先级告警: {title}")
    
    def _generate_note(self, metric_type, metric_data):
        """生成健康记录备注"""
        notes = {
            'blood_pressure': [
                '晨起测量',
                '服药后测量',
                '运动后测量',
                '睡前测量',
                '静息状态测量'
            ],
            'blood_glucose': [
                '空腹测量',
                '餐后2小时',
                '睡前测量',
                '运动前测量',
                '感觉不适时测量'
            ],
            'heart_rate': [
                '静息状态',
                '轻度活动后',
                '测量前休息5分钟',
                '连续测量3次取平均',
                '感觉心跳异常时测量'
            ],
            'weight': [
                '晨起空腹',
                '每周固定时间',
                '运动后测量',
                '饮食调整后测量',
                '定期监测体重变化'
            ],
            'uric_acid': [
                '空腹测量',
                '避免高嘌呤食物后测量',
                '定期监测尿酸水平',
                '痛风发作时测量',
                '用药后监测'
            ],
            'lipids': [
                '空腹12小时后测量',
                '避免高脂食物后测量',
                '定期血脂检查',
                '用药后监测',
                '饮食调整后测量'
            ]
        }
        
        note_list = notes.get(metric_type, ['常规测量'])
        return random.choice(note_list)
    

    

    
    def create_trend_alerts(self, patient, days_back=30):
        """创建趋势异常告警"""
        print(f"📈 为患者 {patient.name} 创建趋势告警...")
        
        # 获取患者的医生
        doctor_relations = DoctorPatientRelation.objects.filter(
            patient=patient,
            status='active'
        ).first()
        
        if not doctor_relations:
            print(f"     ⚠️ 患者 {patient.name} 没有关联的医生，跳过趋势告警创建")
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
        
        print(f"   ✅ 创建了 {len(created_alerts)} 个趋势告警")
        return created_alerts
    
    def create_comprehensive_data(self, days_back=30):
        """创建完整的健康数据"""
        print("🏗️ 开始创建完整的健康数据...")
        
        # 获取所有患者
        patients = User.objects.filter(role='patient', is_active=True)
        
        if not patients.exists():
            print("❌ 没有找到患者用户，请先创建用户")
            return False
        
        total_metrics = 0
        total_alerts = 0
        
        for patient in patients:
            print(f"\n👤 处理患者: {patient.name}")
            
            # 创建健康数据
            metrics = self.create_realistic_health_data(patient, days_back)
            total_metrics += len(metrics)
            
            # 创建趋势告警
            trend_alerts = self.create_trend_alerts(patient, days_back)
            total_alerts += len(trend_alerts)
        
        print(f"\n🎉 数据创建完成！")
        print(f"📊 总计:")
        print(f"   健康记录: {total_metrics} 条")
        print(f"   趋势告警: {total_alerts} 个")
        
        return True


def main():
    """主函数"""
    creator = EnhancedDataCreator()
    
    # 创建30天的健康数据
    success = creator.create_comprehensive_data(days_back=30)
    
    if success:
        print("\n✅ 增强健康数据创建完成！")
        print("🎯 现在您可以:")
        print("   1. 查看各种类型的健康告警")
        print("   2. 测试阈值超标检测")
        print("   3. 查看趋势分析")
        print("   4. 测试健康数据录入功能")
    else:
        print("\n❌ 数据创建失败")


if __name__ == '__main__':
    main()
