#!/usr/bin/env python
"""
数据转换脚本：将time_of_day从字符串格式转换为JSON数组格式
"""
import os
import sys
import django
import json

# 设置Django环境
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from medication.models import MedicationPlan

def convert_time_of_day():
    """转换time_of_day数据格式"""
    
    # 时间映射：从旧的字符串格式转换为具体时间
    time_mapping = {
        'before_breakfast': ['07:00'],
        'after_breakfast': ['08:00'],
        'before_lunch': ['11:30'],
        'after_lunch': ['13:00'],
        'before_dinner': ['17:30'],
        'after_dinner': ['19:00'],
        'bedtime': ['22:00'],
        'empty_stomach': ['06:00'],
        # 如果已经是时间格式，保持原样
    }
    
    plans = MedicationPlan.objects.all()
    updated_count = 0
    
    for plan in plans:
        old_time = plan.time_of_day
        new_time = None
        
        if old_time in time_mapping:
            # 转换旧的字符串格式
            new_time = json.dumps(time_mapping[old_time])
            print(f"转换计划 {plan.id}: {old_time} -> {time_mapping[old_time]}")
        elif old_time and ':' in str(old_time):
            # 如果已经是时间格式，转换为数组
            if isinstance(old_time, str) and old_time.startswith('['):
                # 已经是JSON格式，跳过
                continue
            else:
                new_time = json.dumps([str(old_time)])
                print(f"转换计划 {plan.id}: {old_time} -> [{old_time}]")
        else:
            # 未知格式，使用默认值
            new_time = json.dumps(['08:00'])
            print(f"转换计划 {plan.id}: {old_time} (未知) -> ['08:00']")
        
        if new_time:
            # 直接更新数据库
            MedicationPlan.objects.filter(id=plan.id).update(time_of_day=new_time)
            updated_count += 1
    
    print(f"总共转换了 {updated_count} 个用药计划的时间数据")

if __name__ == '__main__':
    print("开始转换time_of_day数据...")
    convert_time_of_day()
    print("数据转换完成！")