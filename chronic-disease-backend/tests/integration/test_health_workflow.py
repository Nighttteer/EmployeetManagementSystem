"""
健康管理业务流程集成测试
测试完整的健康数据管理流程
"""
import pytest
from django.urls import reverse
from rest_framework import status
from datetime import date, timedelta

from health.models import HealthMetric, Alert, DoctorPatientRelation
from tests.factories import DoctorFactory, PatientFactory

@pytest.mark.integration
@pytest.mark.health
class TestHealthDataWorkflow:
    """健康数据管理工作流程测试"""
    
    def test_complete_health_monitoring_workflow(self, api_client):
        """测试完整的健康监测工作流程"""
        # 1. 创建医生和患者
        doctor = DoctorFactory()
        patient = PatientFactory(chronic_diseases=['hypertension'])
        
        # 2. 建立医患关系
        relation = DoctorPatientRelation.objects.create(
            doctor=doctor,
            patient=patient,
            is_primary=True,
            status='active'
        )
        
        # 3. 患者录入健康数据
        api_client.force_authenticate(user=patient)
        
        health_data = {
            'metric_type': 'blood_pressure',
            'systolic': 160,
            'diastolic': 95,
            'measured_at': '2024-01-15T10:00:00Z',
            'note': '家庭自测血压'
        }
        
        url = reverse('health:health-metrics-list')
        response = api_client.post(url, health_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        
        # 4. 验证健康指标已创建
        metric = HealthMetric.objects.get(id=response.data['id'])
        assert metric.systolic == 160
        assert metric.diastolic == 95
        assert metric.patient == patient
        
        # 5. 系统应该自动生成告警（如果有阈值设置）
        # 这里可以检查是否生成了告警
        
        # 6. 医生查看告警
        api_client.force_authenticate(user=doctor)
        
        alerts_url = reverse('health:alerts-list')
        response = api_client.get(alerts_url)
        
        assert response.status_code == status.HTTP_200_OK
        
        # 7. 医生处理告警
        if response.data['results']:
            alert_id = response.data['results'][0]['id']
            handle_data = {
                'status': 'handled',
                'action_taken': '已联系患者，建议调整用药',
                'notes': '血压偏高，需要密切监测'
            }
            
            handle_url = reverse('health:alerts-detail', kwargs={'pk': alert_id})
            response = api_client.patch(handle_url, handle_data, format='json')
            
            assert response.status_code == status.HTTP_200_OK
    
    def test_patient_health_data_entry(self, authenticated_patient_client, patient_user):
        """测试患者健康数据录入"""
        # 录入血压数据
        bp_data = {
            'metric_type': 'blood_pressure',
            'systolic': 130,
            'diastolic': 80,
            'measured_at': '2024-01-15T08:00:00Z'
        }
        
        url = reverse('health:health-metrics-list')
        response = authenticated_patient_client.post(url, bp_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['systolic'] == 130
        assert response.data['diastolic'] == 80
        
        # 录入血糖数据
        bg_data = {
            'metric_type': 'blood_glucose',
            'blood_glucose': 6.5,
            'measured_at': '2024-01-15T09:00:00Z',
            'note': '餐前血糖'
        }
        
        response = authenticated_patient_client.post(url, bg_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['blood_glucose'] == 6.5
    
    def test_doctor_view_patient_health_data(self, authenticated_doctor_client, doctor_user):
        """测试医生查看患者健康数据"""
        # 创建患者和健康数据
        patient = PatientFactory()
        
        # 建立医患关系
        DoctorPatientRelation.objects.create(
            doctor=doctor_user,
            patient=patient,
            status='active'
        )
        
        # 创建健康指标
        HealthMetric.objects.create(
            patient=patient,
            measured_by=doctor_user,
            metric_type='blood_pressure',
            systolic=140,
            diastolic=90,
            measured_at='2024-01-15T10:00:00Z'
        )
        
        # 医生查看患者列表
        patients_url = reverse('health:doctor-patients')
        response = authenticated_doctor_client.get(patients_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) > 0
        
        # 医生查看特定患者的健康数据
        patient_id = patient.id
        patient_health_url = reverse('health:patient-health-data', kwargs={'patient_id': patient_id})
        response = authenticated_doctor_client.get(patient_health_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) > 0

@pytest.mark.integration
@pytest.mark.health
class TestAlertManagement:
    """告警管理测试"""
    
    def test_alert_creation_and_handling(self, authenticated_doctor_client, doctor_user):
        """测试告警创建和处理"""
        patient = PatientFactory()
        
        # 建立医患关系
        DoctorPatientRelation.objects.create(
            doctor=doctor_user,
            patient=patient,
            status='active'
        )
        
        # 创建健康指标（高血压）
        metric = HealthMetric.objects.create(
            patient=patient,
            measured_by=doctor_user,
            metric_type='blood_pressure',
            systolic=180,
            diastolic=100,
            measured_at='2024-01-15T10:00:00Z'
        )
        
        # 手动创建告警（通常由系统自动创建）
        alert = Alert.objects.create(
            patient=patient,
            assigned_doctor=doctor_user,
            alert_type='threshold_exceeded',
            title='血压严重超标',
            message='患者血压180/100，需要立即处理',
            related_metric=metric,
            priority='critical'
        )
        
        # 医生查看告警列表
        alerts_url = reverse('health:alerts-list')
        response = authenticated_doctor_client.get(alerts_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) > 0
        
        # 医生处理告警
        handle_data = {
            'status': 'handled',
            'action_taken': '已电话联系患者，建议立即就医',
            'notes': '血压过高，有危险'
        }
        
        alert_url = reverse('health:alerts-detail', kwargs={'pk': alert.id})
        response = authenticated_doctor_client.patch(alert_url, handle_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'handled'
        
        # 验证告警已处理
        alert.refresh_from_db()
        assert alert.status == 'handled'
        assert alert.handled_by == doctor_user
        assert alert.handled_at is not None
    
    def test_patient_view_alerts(self, authenticated_patient_client, patient_user):
        """测试患者查看告警"""
        # 创建告警
        Alert.objects.create(
            patient=patient_user,
            alert_type='system_notification',
            title='健康提醒',
            message='请记得按时测量血压',
            priority='low'
        )
        
        # 患者查看自己的告警
        url = reverse('health:patient-alerts')
        response = authenticated_patient_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) > 0

@pytest.mark.integration
@pytest.mark.health
class TestHealthDataAnalysis:
    """健康数据分析测试"""
    
    def test_health_trend_analysis(self, authenticated_doctor_client, doctor_user):
        """测试健康趋势分析"""
        patient = PatientFactory()
        
        # 建立医患关系
        DoctorPatientRelation.objects.create(
            doctor=doctor_user,
            patient=patient,
            status='active'
        )
        
        # 创建一系列血压数据（显示下降趋势）
        dates = [date.today() - timedelta(days=i) for i in range(7, 0, -1)]
        systolic_values = [160, 155, 150, 145, 140, 135, 130]
        
        for i, (test_date, systolic) in enumerate(zip(dates, systolic_values)):
            HealthMetric.objects.create(
                patient=patient,
                measured_by=doctor_user,
                metric_type='blood_pressure',
                systolic=systolic,
                diastolic=85,
                measured_at=f'{test_date}T10:00:00Z'
            )
        
        # 获取趋势分析
        analysis_url = reverse('health:health-trend-analysis', kwargs={'patient_id': patient.id})
        response = authenticated_doctor_client.get(analysis_url, {'metric_type': 'blood_pressure'})
        
        assert response.status_code == status.HTTP_200_OK
        assert 'trend' in response.data
        assert 'data_points' in response.data
        assert len(response.data['data_points']) == 7
    
    def test_health_summary_report(self, authenticated_doctor_client, doctor_user):
        """测试健康总结报告"""
        patient = PatientFactory()
        
        # 建立医患关系
        DoctorPatientRelation.objects.create(
            doctor=doctor_user,
            patient=patient,
            status='active'
        )
        
        # 创建多种类型的健康数据
        HealthMetric.objects.create(
            patient=patient,
            measured_by=doctor_user,
            metric_type='blood_pressure',
            systolic=140,
            diastolic=90,
            measured_at='2024-01-15T10:00:00Z'
        )
        
        HealthMetric.objects.create(
            patient=patient,
            measured_by=doctor_user,
            metric_type='blood_glucose',
            blood_glucose=7.0,
            measured_at='2024-01-15T11:00:00Z'
        )
        
        # 获取健康总结
        summary_url = reverse('health:health-summary', kwargs={'patient_id': patient.id})
        response = authenticated_doctor_client.get(summary_url)
        
        assert response.status_code == status.HTTP_200_OK
        assert 'patient_info' in response.data
        assert 'latest_metrics' in response.data
        assert 'alert_summary' in response.data
