#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
删除张三的所有健康数据记录
"""

import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import HealthMetric

def delete_zhangsan_data():
    """删除张三的所有健康数据"""
    
    try:
        # 查找张三用户
        zhangsan = User.objects.get(name='张三')
        print(f"找到用户：{zhangsan.name} (ID: {zhangsan.id})")
        
        # 统计现有数据
        old_count = HealthMetric.objects.filter(patient=zhangsan).count()
        print(f"张三现有健康数据记录数：{old_count}")
        
        if old_count > 0:
            # 删除所有健康数据
            HealthMetric.objects.filter(patient=zhangsan).delete()
            print(f"✅ 已删除张三的 {old_count} 条健康数据记录")
        else:
            print("张三没有健康数据记录")
            
    except User.DoesNotExist:
        print("❌ 未找到用户：张三")
        return
    
    # 验证删除结果
    remaining_count = HealthMetric.objects.filter(patient=zhangsan).count()
    print(f"删除后剩余记录数：{remaining_count}")
    
    if remaining_count == 0:
        print("✅ 数据删除完成，可以重新导入新数据")
    else:
        print("⚠️ 仍有数据未删除")

if __name__ == '__main__':
    delete_zhangsan_data() 