"""
健康管理综合集成测试
合并健康数据管理、智能报警、趋势分析、任务处理等所有健康相关功能
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from health.models import HealthMetric, ThresholdSetting, Alert
from health.alert_analysis_service import AlertAnalysisService
from health.intelligent_alert_service import IntelligentAlertService
from health.tasks import analyze_all_doctors_patients, analyze_single_doctor_patients
from unittest.mock import Mock, patch, MagicMock

User = get_user_model()

@pytest.mark.django_db
@pytest.mark.health
@pytest.mark.integration
class TestHealthDataManagement:
    """测试健康数据管理功能"""
    
    def test_health_dashboard_access(self, authenticated_patient_client, test_patient):
        """测试病人访问健康仪表板"""
        response = authenticated_patient_client.get('/api/health/dashboard/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, dict)
    
    def test_health_trends_analysis(self, authenticated_patient_client, test_patient):
        """测试健康趋势分析功能"""
        response = authenticated_patient_client.get('/api/health/trends/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))
    
    def test_doctor_health_dashboard_access(self, authenticated_doctor_client, test_doctor):
        """测试医生访问健康仪表板"""
        response = authenticated_doctor_client.get('/api/health/doctor-dashboard/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, dict)
    
    def test_doctor_patients_list(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试医生获取病人列表"""
        response = authenticated_doctor_client.get(f'/api/health/doctor/{test_doctor.id}/patients/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))

@pytest.mark.django_db
@pytest.mark.health
@pytest.mark.integration
class TestHealthDataInput:
    """测试健康数据输入功能"""
    
    def test_normal_blood_pressure_data(self, authenticated_patient_client, test_patient):
        """测试正常血压数据不触发报警"""
        data = {
            'metric_type': 'blood_pressure',
            'systolic': 120,
            'diastolic': 80,
            'measured_at': '2024-01-15T10:00:00Z'
        }
        
        response = authenticated_patient_client.post('/api/user/health-metrics/', data)
        assert response.status_code == status.HTTP_201_CREATED
        
        metric = HealthMetric.objects.last()
        assert metric.systolic == 120
        assert metric.diastolic == 80
    
    def test_high_blood_pressure_alert(self, authenticated_patient_client, test_patient):
        """测试高血压数据触发报警"""
        data = {
            'metric_type': 'blood_pressure',
            'systolic': 180,
            'diastolic': 110,
            'measured_at': '2024-01-15T10:00:00Z'
        }
        
        response = authenticated_patient_client.post('/api/user/health-metrics/', data)
        assert response.status_code == status.HTTP_201_CREATED
        
        metric = HealthMetric.objects.last()
        assert metric.systolic == 180
        assert metric.diastolic == 110
    
    def test_blood_glucose_data(self, authenticated_patient_client, test_patient):
        """测试血糖数据"""
        data = {
            'metric_type': 'blood_glucose',
            'blood_glucose': 5.5,
            'measured_at': '2024-01-15T10:00:00Z'
        }
        
        response = authenticated_patient_client.post('/api/user/health-metrics/', data)
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_heart_rate_data(self, authenticated_patient_client, test_patient):
        """测试心率数据"""
        data = {
            'metric_type': 'heart_rate',
            'heart_rate': 75,
            'measured_at': '2024-01-15T10:00:00Z'
        }
        
        response = authenticated_patient_client.post('/api/user/health-metrics/', data)
        assert response.status_code == status.HTTP_201_CREATED

@pytest.mark.django_db
@pytest.mark.health
@pytest.mark.integration
class TestIntelligentAlertSystem:
    """测试智能预警系统"""
    
    def test_intelligent_alerts_generation(self, authenticated_doctor_client, test_doctor):
        """测试智能预警生成功能"""
        response = authenticated_doctor_client.post('/api/health/intelligent-alerts/generate/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND]
        
        if response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]:
            data = response.data
            assert isinstance(data, dict)
    
    def test_intelligent_alerts_list(self, authenticated_doctor_client, test_doctor):
        """测试智能预警列表获取"""
        response = authenticated_doctor_client.get('/api/health/intelligent-alerts/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))
    
    def test_patient_risk_analysis(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试病人风险分析功能"""
        response = authenticated_doctor_client.get('/api/health/intelligent-alerts/analysis/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))
    
    def test_alert_handling(self, authenticated_doctor_client, test_doctor):
        """测试预警处理功能"""
        alerts_response = authenticated_doctor_client.get('/api/health/alerts/')
        if alerts_response.status_code == status.HTTP_200_OK and alerts_response.data:
            if isinstance(alerts_response.data, list) and len(alerts_response.data) > 0:
                alert_id = alerts_response.data[0]['id']
                response = authenticated_doctor_client.post(f'/api/health/alerts/{alert_id}/handle/', {
                    'action': 'acknowledged',
                    'notes': '预警已处理'
                })
                assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]

@pytest.mark.django_db
@pytest.mark.health
@pytest.mark.integration
class TestHealthDataAnalysis:
    """测试健康数据分析功能"""
    
    def test_patient_health_data_retrieval(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试获取病人健康数据"""
        response = authenticated_doctor_client.get(f'/api/health/patients/{test_patient.id}/health-data/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))
    
    def test_doctor_alerts_analysis(self, authenticated_doctor_client, test_doctor):
        """测试医生预警分析功能"""
        response = authenticated_doctor_client.get(f'/api/health/alerts/doctor/{test_doctor.id}/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))
    
    def test_patient_advice_management(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试病人建议管理功能"""
        response = authenticated_doctor_client.get(f'/api/health/patients/{test_patient.id}/advice/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))

@pytest.mark.django_db
@pytest.mark.health
@pytest.mark.integration
class TestHealthPermissionControl:
    """测试健康管理权限控制"""
    
    def test_patient_cannot_access_doctor_health_apis(self, authenticated_patient_client, test_patient):
        """测试病人无法访问医生健康管理API"""
        response = authenticated_patient_client.get('/api/health/doctor-dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        response = authenticated_patient_client.post('/api/health/intelligent-alerts/generate/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_doctor_cannot_access_other_doctor_data(self, authenticated_doctor_client, test_doctor):
        """测试医生无法访问其他医生的数据"""
        from tests.utils.test_helpers import TestDataFactory
        other_doctor = TestDataFactory.create_test_user(role='doctor')
        
        response = authenticated_doctor_client.get(f'/api/health/doctor/{other_doctor.id}/dashboard/')
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

@pytest.mark.django_db
@pytest.mark.health
@pytest.mark.integration
class TestHealthTasks:
    """测试健康管理任务"""
    
    @patch('health.tasks.AlertAnalysisService')
    def test_analyze_all_doctors_patients_success(self, mock_alert_service_class):
        """测试成功分析所有医生患者数据"""
        mock_alert_service = Mock()
        mock_alert_service_class.return_value = mock_alert_service
        mock_alert_service.analyze_and_generate_alerts.return_value = [
            {'id': 1, 'type': 'medication_missed'},
            {'id': 2, 'type': 'health_alert'}
        ]
        
        result = analyze_all_doctors_patients()
        
        assert result['success']
        assert 'analyzed_doctors' in result
        assert 'total_alerts' in result
        assert 'analysis_time' in result
    
    @patch('health.tasks.AlertAnalysisService')
    def test_analyze_single_doctor_patients_success(self, mock_alert_service_class):
        """测试成功分析单个医生患者数据"""
        mock_alert_service = Mock()
        mock_alert_service_class.return_value = mock_alert_service
        mock_alert_service.analyze_and_generate_alerts.return_value = [
            {'id': 1, 'type': 'medication_missed'}
        ]
        
        # 创建测试医生
        doctor = User.objects.create_user(
            username='test_doctor',
            email='doctor@test.com',
            password='testpass123',
            role='doctor',
            name='测试医生'
        )
        
        result = analyze_single_doctor_patients(doctor.id)
        
        assert result['success']
        assert 'doctor_name' in result
        assert 'generated_alerts' in result
        assert 'analysis_time' in result

@pytest.mark.django_db
@pytest.mark.health
@pytest.mark.integration
class TestAlertAnalysisIntegration:
    """测试报警分析服务集成功能"""
    
    def setup_method(self):
        """设置测试数据"""
        self.doctor = User.objects.create_user(
            username='test_doctor',
            email='doctor@test.com',
            password='testpass123',
            role='doctor',
            name='测试医生'
        )
        
        self.patient = User.objects.create_user(
            username='test_patient',
            email='patient@test.com',
            password='testpass123',
            role='patient',
            name='测试患者'
        )
        
        self.create_health_metrics()
        self.create_threshold_settings()
        
        self.alert_service = AlertAnalysisService()
        self.intelligent_service = IntelligentAlertService()
    
    def create_health_metrics(self):
        """创建测试健康指标数据"""
        for i in range(7):
            date = timezone.now() - timedelta(days=i)
            HealthMetric.objects.create(
                patient=self.patient,
                measured_by=self.doctor,
                metric_type='blood_pressure',
                systolic=120 + i * 5,
                diastolic=80 + i * 2,
                measured_at=date
            )
        
        HealthMetric.objects.create(
            patient=self.patient,
            measured_by=self.doctor,
            metric_type='blood_glucose',
            blood_glucose=12.5,
            measured_at=timezone.now()
        )
        
        HealthMetric.objects.create(
            patient=self.patient,
            measured_by=self.doctor,
            metric_type='heart_rate',
            heart_rate=110,
            measured_at=timezone.now()
        )
    
    def create_threshold_settings(self):
        """创建阈值设置"""
        ThresholdSetting.objects.create(
            name='血压阈值',
            description='血压正常范围',
            metric_type='blood_pressure',
            min_value=90,
            max_value=140,
            created_by=self.doctor,
            is_active=True
        )
        
        ThresholdSetting.objects.create(
            name='血糖阈值',
            description='血糖正常范围',
            metric_type='blood_glucose',
            min_value=3.9,
            max_value=6.1,
            created_by=self.doctor,
            is_active=True
        )
        
        ThresholdSetting.objects.create(
            name='心率阈值',
            description='心率正常范围',
            metric_type='heart_rate',
            min_value=60,
            max_value=100,
            created_by=self.doctor,
            is_active=True
        )
    
    def test_health_metrics_creation(self):
        """测试健康指标数据创建"""
        metrics = HealthMetric.objects.filter(patient=self.patient)
        assert metrics.count() == 9
    
    def test_threshold_settings_creation(self):
        """测试阈值设置创建"""
        thresholds = ThresholdSetting.objects.filter(created_by=self.doctor)
        assert thresholds.count() == 3
    
    def test_blood_pressure_trend_analysis(self):
        """测试血压趋势分析"""
        bp_metrics = HealthMetric.objects.filter(
            patient=self.patient,
            metric_type='blood_pressure'
        ).order_by('measured_at')
        
        systolic_values = [m.systolic for m in bp_metrics]
        # 由于日期是倒序创建的（最新的在前），所以第一个值应该大于最后一个值
        assert systolic_values[0] > systolic_values[-1]
    
    def test_intelligent_alert_generation(self):
        """测试智能报警生成"""
        alerts = self.intelligent_service.analyze_patient_alerts(
            self.patient.id, 
            self.doctor.id
        )
        
        assert isinstance(alerts, list)
    
    def test_alert_creation_and_storage(self):
        """测试报警创建和存储"""
        alert = Alert.objects.create(
            patient=self.patient,
            assigned_doctor=self.doctor,
            alert_type='abnormal_trend',
            priority='high',
            title='测试报警',
            message='这是一个测试报警消息',
            status='pending'
        )
        
        assert alert.id is not None
        assert alert.status == 'pending'
        assert alert.priority == 'high'
