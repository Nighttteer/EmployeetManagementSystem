"""
Locust 性能测试配置
测试慢病管理系统的主要API端点性能
"""
from locust import HttpUser, task, between
import json
import random


class ChronicDiseaseUser(HttpUser):
    """慢病管理系统用户行为模拟"""
    
    wait_time = between(1, 3)  # 用户操作间隔1-3秒
    
    def on_start(self):
        """测试开始时的初始化"""
        self.login()
    
    def login(self):
        """用户登录"""
        # 使用测试用户登录
        response = self.client.post("/api/accounts/login/", json={
            "phone_number": "+8613800138000",
            "password": "test_password"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access')
            self.client.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
        else:
            print(f"登录失败: {response.status_code}")
    
    @task(3)
    def view_patient_list(self):
        """查看患者列表 - 高频操作"""
        self.client.get("/api/health/patients/", 
                       name="患者列表")
    
    @task(5)
    def view_alerts(self):
        """查看预警列表 - 最高频操作"""
        self.client.get("/api/health/alerts/", 
                       name="预警列表")
    
    @task(2)
    def view_patient_detail(self):
        """查看患者详情"""
        # 模拟查看患者ID 1-10的详情
        patient_id = random.randint(1, 10)
        self.client.get(f"/api/health/patients/{patient_id}/",
                       name="患者详情")
    
    @task(2)
    def create_health_metric(self):
        """创建健康指标数据"""
        data = {
            "metric_type": random.choice(["blood_pressure", "blood_glucose", "heart_rate"]),
            "value": {
                "systolic": random.randint(110, 140),
                "diastolic": random.randint(70, 90)
            },
            "notes": "性能测试数据"
        }
        
        self.client.post("/api/health/metrics/", 
                        json=data,
                        name="创建健康指标")
    
    @task(1)
    def resolve_alert(self):
        """解决预警 - 低频但重要操作"""
        # 模拟解决预警ID 1-20
        alert_id = random.randint(1, 20)
        self.client.patch(f"/api/health/alerts/{alert_id}/",
                         json={"is_resolved": True},
                         name="解决预警")
    
    @task(1)
    def view_health_trends(self):
        """查看健康趋势"""
        self.client.get("/api/health/trends/",
                       name="健康趋势")


class DoctorUser(ChronicDiseaseUser):
    """医生用户行为模拟"""
    
    weight = 3  # 医生用户权重
    
    def login(self):
        """医生登录"""
        response = self.client.post("/api/accounts/login/", json={
            "phone_number": "+8613800138001",  # 医生测试账号
            "password": "test_password"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access')
            self.client.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
    
    @task(4)
    def manage_alerts(self):
        """医生管理预警 - 核心功能"""
        self.client.get("/api/health/alerts/?status=unresolved",
                       name="医生-未解决预警")
    
    @task(2)
    def view_dashboard(self):
        """查看医生仪表盘"""
        self.client.get("/api/health/dashboard/",
                       name="医生仪表盘")


class PatientUser(ChronicDiseaseUser):
    """患者用户行为模拟"""
    
    weight = 7  # 患者用户权重（患者更多）
    
    def login(self):
        """患者登录"""
        # 使用不同的患者测试账号
        patient_phone = f"+861380013800{random.randint(2, 9)}"
        response = self.client.post("/api/accounts/login/", json={
            "phone_number": patient_phone,
            "password": "test_password"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('access')
            self.client.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
    
    @task(5)
    def record_health_data(self):
        """患者记录健康数据 - 高频操作"""
        metrics = [
            {
                "metric_type": "blood_pressure",
                "value": {
                    "systolic": random.randint(110, 140),
                    "diastolic": random.randint(70, 90)
                }
            },
            {
                "metric_type": "blood_glucose", 
                "value": {
                    "glucose": round(random.uniform(4.0, 7.0), 1)
                }
            },
            {
                "metric_type": "heart_rate",
                "value": {
                    "rate": random.randint(60, 100)
                }
            }
        ]
        
        metric = random.choice(metrics)
        self.client.post("/api/health/metrics/",
                        json=metric,
                        name="患者-记录健康数据")
    
    @task(2)
    def view_my_health_trends(self):
        """查看个人健康趋势"""
        self.client.get("/api/health/my-trends/",
                       name="患者-健康趋势")
    
    @task(1)
    def check_medications(self):
        """查看用药计划"""
        self.client.get("/api/medication/my-plans/",
                       name="患者-用药计划")


# 性能测试场景配置
class StressTestUser(HttpUser):
    """压力测试用户"""
    
    wait_time = between(0.1, 0.5)  # 更短的等待时间，增加压力
    
    @task
    def rapid_api_calls(self):
        """快速API调用"""
        endpoints = [
            "/api/health/patients/",
            "/api/health/alerts/", 
            "/api/health/metrics/",
        ]
        
        endpoint = random.choice(endpoints)
        self.client.get(endpoint, name=f"压力测试-{endpoint}")


# 运行命令示例:
# 基础性能测试: locust -f locustfile.py --host=http://localhost:8000
# 压力测试: locust -f locustfile.py StressTestUser --host=http://localhost:8000
# Web UI: locust -f locustfile.py --host=http://localhost:8000 --web-host=0.0.0.0
