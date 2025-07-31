#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试健康趋势API是否正常工作
"""

import os
import sys
import django
import requests
import json

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import HealthMetric

def test_health_trends_api():
    """测试健康趋势API"""
    
    # 查找张三用户
    try:
        zhangsan = User.objects.get(name='张三')
        print(f"找到用户：{zhangsan.name} (ID: {zhangsan.id})")
    except User.DoesNotExist:
        print("❌ 未找到张三用户，请先运行 create_test_data_zhangsan.py")
        return
    
    # 检查张三的健康数据
    health_count = HealthMetric.objects.filter(patient=zhangsan).count()
    print(f"张三的健康数据记录数：{health_count}")
    
    if health_count == 0:
        print("❌ 张三没有健康数据，请先运行 create_test_data_zhangsan.py")
        return
    
    # 显示各类型数据统计
    for metric_type in ['blood_pressure', 'blood_glucose', 'heart_rate', 'weight', 'uric_acid', 'lipids']:
        count = HealthMetric.objects.filter(patient=zhangsan, metric_type=metric_type).count()
        print(f"  {metric_type}: {count} 条记录")
    
    print("\n🔍 测试API端点...")
    
    # 测试API端点
    base_url = "http://localhost:8000"
    
    # 首先进行登录获取token
    print("\n🔐 获取认证token...")
    login_data = {
        "phone": "+8613800138000",  # 张三的手机号（包含国家区号）
        "password": "testpass123"        # 默认密码
    }
    
    try:
        login_response = requests.post(f"{base_url}/api/auth/login/", json=login_data)
        print(f"   登录状态码: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            access_token = login_result.get('tokens', {}).get('access')
            if access_token:
                print("   ✅ 登录成功，获取到token")
                headers = {
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                }
            else:
                print("   ❌ 登录成功但未获取到token")
                return
        else:
            print(f"   ❌ 登录失败: {login_response.text}")
            return
    except Exception as e:
        print(f"   ❌ 登录请求失败: {e}")
        return
    
    # 测试1: 健康趋势API
    print("\n1. 测试 /api/user/health-trends/")
    try:
        response = requests.get(f"{base_url}/api/user/health-trends/?period=30days", headers=headers)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ API正常，返回数据：")
            print(f"   时间段: {data.get('period')}")
            print(f"   总记录数: {data.get('summary', {}).get('total_records', 0)}")
            print(f"   指标类型数: {data.get('summary', {}).get('types_count', 0)}")
            
            # 显示各指标数据
            metrics = data.get('metrics', {})
            for metric_type, metric_data in metrics.items():
                count = metric_data.get('statistics', {}).get('count', 0)
                avg = metric_data.get('statistics', {}).get('average', 0)
                print(f"     {metric_type}: {count} 条记录, 平均值: {avg}")
        else:
            print(f"   ❌ API错误: {response.text}")
    except Exception as e:
        print(f"   ❌ 请求失败: {e}")
    
    # 测试2: 健康指标API
    print("\n2. 测试 /api/user/health-metrics/")
    try:
        response = requests.get(f"{base_url}/api/user/health-metrics/", headers=headers)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ API正常，返回 {len(data)} 条记录")
        else:
            print(f"   ❌ API错误: {response.text}")
    except Exception as e:
        print(f"   ❌ 请求失败: {e}")
    
    # 测试3: 用户资料API
    print("\n3. 测试 /api/user/profile/")
    try:
        response = requests.get(f"{base_url}/api/user/profile/", headers=headers)
        print(f"   状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ API正常，用户: {data.get('name', 'Unknown')}")
        else:
            print(f"   ❌ API错误: {response.text}")
    except Exception as e:
        print(f"   ❌ 请求失败: {e}")
    
    # 测试4: 测试不同时间段
    print("\n4. 测试不同时间段")
    periods = ['week', 'month', 'quarter', 'year']
    for period in periods:
        try:
            response = requests.get(f"{base_url}/api/user/health-trends/?period={period}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                total_records = data.get('summary', {}).get('total_records', 0)
                print(f"   {period}: {total_records} 条记录")
            else:
                print(f"   {period}: 错误 - {response.status_code}")
        except Exception as e:
            print(f"   {period}: 请求失败 - {e}")
    
    print("\n📋 总结:")
    print("如果所有API都返回200状态码，说明API配置正确")
    print("现在可以在前端应用中正常使用健康趋势功能了！")

if __name__ == '__main__':
    test_health_trends_api() 