#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为张三创建一年的健康测试数据
包含所有健康指标：血压、血糖、心率、体重、尿酸、血脂
所有主要指标每天记录一次
"""

import os
import sys
import django
import random
from datetime import datetime, timedelta, time
from decimal import Decimal

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import HealthMetric

def create_zhangsan_yearly_data():
    """为张三创建一年的健康数据"""
    
    # 查找或创建张三用户
    try:
        zhangsan = User.objects.get(name='张三')
        print(f"找到用户：{zhangsan.name} (ID: {zhangsan.id})")
    except User.DoesNotExist:
        # 创建张三用户
        zhangsan = User.objects.create(
            phone='+8613800138000',
            name='张三',
            role='patient',
            age=45,
            gender='male'
        )
        print(f"创建新用户：{zhangsan.name} (ID: {zhangsan.id})")
    
    # 清除张三的旧健康数据
    old_count = HealthMetric.objects.filter(patient=zhangsan).count()
    if old_count > 0:
        HealthMetric.objects.filter(patient=zhangsan).delete()
        print(f"清除了 {old_count} 条旧数据")
    
    # 生成最近4个月的数据（从当前日期往前推4个月）
    end_date = datetime.now()
    start_date = end_date - timedelta(days=120)  # 4个月前
    
    # 基础健康参数（会有轻微波动）
    base_systolic = 125      # 收缩压基准值
    base_diastolic = 82      # 舒张压基准值
    base_glucose = 6.0       # 血糖基准值 (mmol/L)
    base_heart_rate = 75     # 心率基准值
    base_weight = 70.0       # 体重基准值 (kg)
    base_uric_acid = 350     # 尿酸基准值 (μmol/L)
    base_cholesterol = 4.8   # 总胆固醇基准值 (mmol/L)
    base_hdl = 1.2          # 高密度脂蛋白基准值
    base_ldl = 2.8          # 低密度脂蛋白基准值
    base_triglyceride = 1.5  # 甘油三酯基准值
    
    created_count = 0
    current_date = start_date
    
    print("开始生成数据...")
    
    while current_date <= end_date:
        # 每天生成一次数据
        # 随机选择测量时间（早上8-10点之间）
        measure_hour = random.randint(8, 10)
        measure_minute = random.randint(0, 59)
        measure_time = time(measure_hour, measure_minute)
        measure_datetime = datetime.combine(current_date.date(), measure_time)
        
        # 添加一些季节性和趋势性变化
        days_from_start = (current_date - start_date).days
        
        # 模拟夏季血压略低，冬季略高的季节性变化
        seasonal_factor = 0.98 + 0.04 * abs(days_from_start % 120 - 60) / 60
        
        # 模拟体重缓慢下降趋势（健康管理效果）
        weight_trend_factor = 1.0 - 0.001 * days_from_start  # 每天轻微下降
        
        # 模拟血糖控制改善趋势
        glucose_trend_factor = 1.0 - 0.002 * days_from_start  # 血糖控制改善
        
        # 生成血压数据（每天都有）
        systolic = int(base_systolic * seasonal_factor + random.gauss(0, 8))
        diastolic = int(base_diastolic * seasonal_factor + random.gauss(0, 5))
        
        # 确保合理范围
        systolic = max(100, min(160, systolic))
        diastolic = max(60, min(100, diastolic))
        
        HealthMetric.objects.create(
            patient=zhangsan,
            measured_by=zhangsan,
            metric_type='blood_pressure',
            systolic=systolic,
            diastolic=diastolic,
            measured_at=measure_datetime,
            note=f'自动生成测试数据 - 血压'
        )
        created_count += 1
        
        # 生成血糖数据（每天都有）
        glucose = base_glucose * glucose_trend_factor + random.gauss(0, 0.8)
        glucose = max(3.5, min(12.0, round(glucose, 1)))
        
        HealthMetric.objects.create(
            patient=zhangsan,
            measured_by=zhangsan,
            metric_type='blood_glucose',
            blood_glucose=glucose,
            measured_at=measure_datetime + timedelta(minutes=5),
            note=f'自动生成测试数据 - 血糖'
        )
        created_count += 1
        
        # 生成心率数据（每天都有）
        heart_rate = int(base_heart_rate + random.gauss(0, 8))
        heart_rate = max(50, min(120, heart_rate))
        
        HealthMetric.objects.create(
            patient=zhangsan,
            measured_by=zhangsan,
            metric_type='heart_rate',
            heart_rate=heart_rate,
            measured_at=measure_datetime + timedelta(minutes=10),
            note=f'自动生成测试数据 - 心率'
        )
        created_count += 1
        
        # 生成体重数据（每天都有）
        weight = base_weight * weight_trend_factor + random.gauss(0, 1.5)
        weight = max(50.0, min(100.0, round(weight, 1)))
        
        HealthMetric.objects.create(
            patient=zhangsan,
            measured_by=zhangsan,
            metric_type='weight',
            weight=weight,
            measured_at=measure_datetime + timedelta(minutes=15),
            note=f'自动生成测试数据 - 体重'
        )
        created_count += 1
        
        # 生成尿酸数据（每周1次）
        if current_date.weekday() == 0:  # 每周一生成尿酸数据
            uric_acid = base_uric_acid + random.gauss(0, 50)
            uric_acid = max(200, min(600, int(uric_acid)))
            
            HealthMetric.objects.create(
                patient=zhangsan,
                measured_by=zhangsan,
                metric_type='uric_acid',
                uric_acid=uric_acid,
                measured_at=measure_datetime + timedelta(minutes=20),
                note=f'自动生成测试数据 - 尿酸'
            )
            created_count += 1
        
        # 生成血脂数据（每月1次）
        if current_date.day == 15:  # 每月15号生成血脂数据
            cholesterol = base_cholesterol + random.gauss(0, 0.5)
            hdl = base_hdl + random.gauss(0, 0.2)
            ldl = base_ldl + random.gauss(0, 0.4)
            triglyceride = base_triglyceride + random.gauss(0, 0.3)
            
            # 确保合理范围
            cholesterol = max(3.0, min(8.0, round(cholesterol, 1)))
            hdl = max(0.8, min(2.5, round(hdl, 1)))
            ldl = max(1.5, min(5.0, round(ldl, 1)))
            triglyceride = max(0.5, min(4.0, round(triglyceride, 1)))
            
            HealthMetric.objects.create(
                patient=zhangsan,
                measured_by=zhangsan,
                metric_type='lipids',
                lipids_total=cholesterol,
                hdl=hdl,
                ldl=ldl,
                triglyceride=triglyceride,
                measured_at=measure_datetime + timedelta(minutes=25),
                note=f'自动生成测试数据 - 血脂'
            )
            created_count += 1
        
        # 下一天
        current_date += timedelta(days=1)
        
        # 进度提示
        if created_count % 100 == 0:
            print(f"已生成 {created_count} 条记录...")
    
    print(f"\n✅ 数据生成完成！")
    print(f"📊 为用户 {zhangsan.name} 创建了 {created_count} 条健康记录")
    print(f"📅 时间范围：{start_date.date()} 到 {end_date.date()}")
    
    # 统计各类型数据数量
    bp_count = HealthMetric.objects.filter(patient=zhangsan, metric_type='blood_pressure').count()
    bg_count = HealthMetric.objects.filter(patient=zhangsan, metric_type='blood_glucose').count()
    hr_count = HealthMetric.objects.filter(patient=zhangsan, metric_type='heart_rate').count()
    weight_count = HealthMetric.objects.filter(patient=zhangsan, metric_type='weight').count()
    ua_count = HealthMetric.objects.filter(patient=zhangsan, metric_type='uric_acid').count()
    lipids_count = HealthMetric.objects.filter(patient=zhangsan, metric_type='lipids').count()
    
    print(f"\n📈 数据统计：")
    print(f"   血压记录：{bp_count} 条（每天1次）")
    print(f"   血糖记录：{bg_count} 条（每天1次）")
    print(f"   心率记录：{hr_count} 条（每天1次）")
    print(f"   体重记录：{weight_count} 条（每天1次）")
    print(f"   尿酸记录：{ua_count} 条（每周1次）")
    print(f"   血脂记录：{lipids_count} 条（每月1次）")
    print(f"   时间范围：{start_date.date()} 到 {end_date.date()}（最近4个月）")
    
    print(f"\n🎯 现在可以在应用中查看张三的完整健康趋势图表了！")

if __name__ == '__main__':
    create_zhangsan_yearly_data() 