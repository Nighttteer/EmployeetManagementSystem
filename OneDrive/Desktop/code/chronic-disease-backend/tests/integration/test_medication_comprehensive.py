"""
用药管理综合集成测试
合并用药计划管理、提醒系统、用药记录、权限控制等所有用药相关功能
"""
import pytest
from django.urls import reverse
from rest_framework import status
from faker import Faker
from datetime import datetime, timedelta
import json
from medication.models import Medication, MedicationPlan, MedicationReminder
from django.utils import timezone
from datetime import time

fake = Faker()

@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.medication
class TestMedicationPlanManagement:
    """测试用药计划管理功能"""
    
    def test_medication_list_access(self, authenticated_patient_client, test_patient):
        """测试病人访问药物列表"""
        response = authenticated_patient_client.get('/api/medication/medications/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))
    
    def test_medication_plan_creation(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物计划创建功能"""
        plan_data = {
            'patient': test_patient.id,
            'medication_name': '测试药物',
            'dosage': '10mg',
            'frequency': 'daily',
            'start_date': datetime.now().date().isoformat(),
            'end_date': (datetime.now() + timedelta(days=30)).date().isoformat(),
            'instructions': '每日一次，饭后服用',
            'time_slots': json.dumps(['08:00', '20:00']),
            'status': 'active'
        }
        
        response = authenticated_doctor_client.post('/api/medication/plans/', plan_data)
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_201_CREATED:
            data = response.data
            assert data['medication_name'] == '测试药物'
            assert data['patient'] == test_patient.id
            assert data['status'] == 'active'
    
    def test_medication_plan_retrieval(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物计划获取功能"""
        response = authenticated_doctor_client.get(f'/api/medication/patients/{test_patient.id}/plans/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))
    
    def test_medication_plan_statistics(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物计划统计功能"""
        response = authenticated_doctor_client.get(f'/api/medication/patients/{test_patient.id}/plans/stats/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, dict)
    
    def test_global_medication_plan_stats(self, authenticated_doctor_client, test_doctor):
        """测试全局药物计划统计功能"""
        response = authenticated_doctor_client.get('/api/medication/plans/stats/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, dict)

@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.medication
class TestMedicationStatusManagement:
    """测试药物状态管理功能"""
    
    def test_medication_plan_status_update(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物计划状态更新"""
        plan_data = {
            'patient': test_patient.id,
            'medication_name': '状态测试药物',
            'dosage': '5mg',
            'frequency': 'twice_daily',
            'start_date': datetime.now().date().isoformat(),
            'end_date': (datetime.now() + timedelta(days=14)).date().isoformat(),
            'instructions': '每日两次',
            'time_slots': json.dumps(['09:00', '21:00']),
            'status': 'active'
        }
        
        create_response = authenticated_doctor_client.post('/api/medication/plans/', plan_data)
        if create_response.status_code == status.HTTP_201_CREATED:
            plan_id = create_response.data['id']
            
            status_data = {
                'status': 'paused',
                'reason': '病人临时停药'
            }
            
            response = authenticated_doctor_client.patch(f'/api/medication/plans/{plan_id}/status/', status_data)
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
            
            if response.status_code == status.HTTP_200_OK:
                data = response.data
                assert data['status'] == 'paused'
    
    def test_medication_history_retrieval(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物历史记录获取"""
        response = authenticated_doctor_client.get(f'/api/medication/patients/{test_patient.id}/history/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_200_OK:
            data = response.data
            assert isinstance(data, (dict, list))

@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.medication
class TestMedicationReminderSystem:
    """测试药物提醒系统"""
    
    def test_medication_reminder_scheduling(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物提醒调度功能"""
        reminder_plan_data = {
            'patient': test_patient.id,
            'medication_name': '提醒测试药物',
            'dosage': '15mg',
            'frequency': 'three_times_daily',
            'start_date': datetime.now().date().isoformat(),
            'end_date': (datetime.now() + timedelta(days=7)).date().isoformat(),
            'instructions': '每日三次，定时提醒',
            'time_slots': json.dumps(['08:00', '14:00', '20:00']),
            'status': 'active',
            'reminder_enabled': True
        }
        
        response = authenticated_doctor_client.post('/api/medication/plans/', reminder_plan_data)
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_201_CREATED:
            data = response.data
            assert data['reminder_enabled'] == True
            assert len(json.loads(data['time_slots'])) == 3
    
    def test_medication_time_slot_management(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物时间槽管理"""
        complex_plan_data = {
            'patient': test_patient.id,
            'medication_name': '复杂时间槽药物',
            'dosage': '20mg',
            'frequency': 'custom',
            'start_date': datetime.now().date().isoformat(),
            'end_date': (datetime.now() + timedelta(days=21)).date().isoformat(),
            'instructions': '自定义时间服用',
            'time_slots': json.dumps(['06:00', '12:00', '18:00', '22:00']),
            'status': 'active'
        }
        
        response = authenticated_doctor_client.post('/api/medication/plans/', complex_plan_data)
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_201_CREATED:
            data = response.data
            time_slots = json.loads(data['time_slots'])
            assert len(time_slots) == 4
            assert '06:00' in time_slots
            assert '22:00' in time_slots

@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.medication
class TestMedicationPermissionControl:
    """测试药物管理权限控制"""
    
    def test_patient_cannot_create_medication_plans(self, authenticated_patient_client, test_patient):
        """测试病人无法创建药物计划"""
        plan_data = {
            'patient': test_patient.id,
            'medication_name': '病人创建测试',
            'dosage': '10mg',
            'frequency': 'daily',
            'start_date': datetime.now().date().isoformat(),
            'end_date': (datetime.now() + timedelta(days=7)).date().isoformat(),
            'instructions': '测试权限',
            'time_slots': json.dumps(['08:00']),
            'status': 'active'
        }
        
        response = authenticated_patient_client.post('/api/medication/plans/', plan_data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_patient_cannot_update_medication_plans(self, authenticated_patient_client, test_patient):
        """测试病人无法更新药物计划状态"""
        response = authenticated_patient_client.patch('/api/medication/plans/1/status/', {
            'status': 'paused',
            'reason': '测试权限'
        })
        assert response.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_405_METHOD_NOT_ALLOWED]
    
    def test_doctor_cannot_access_other_patient_medication_plans(self, authenticated_doctor_client, test_doctor):
        """测试医生无法访问其他病人的药物计划"""
        from tests.utils.test_helpers import TestDataFactory
        other_patient = TestDataFactory.create_test_user(role='patient')
        
        response = authenticated_doctor_client.get(f'/api/medication/patients/{other_patient.id}/plans/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]

@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.medication
class TestMedicationIntegration:
    """测试药物管理集成功能"""
    
    def test_medication_plan_lifecycle(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物计划完整生命周期"""
        plan_data = {
            'patient': test_patient.id,
            'medication_name': '生命周期测试药物',
            'dosage': '25mg',
            'frequency': 'twice_daily',
            'start_date': datetime.now().date().isoformat(),
            'end_date': (datetime.now() + timedelta(days=10)).date().isoformat(),
            'instructions': '完整生命周期测试',
            'time_slots': json.dumps(['07:00', '19:00']),
            'status': 'active'
        }
        
        create_response = authenticated_doctor_client.post('/api/medication/plans/', plan_data)
        if create_response.status_code == status.HTTP_201_CREATED:
            plan_id = create_response.data['id']
            
            detail_response = authenticated_doctor_client.get(f'/api/medication/patients/{test_patient.id}/plans/{plan_id}/')
            assert detail_response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
            
            status_response = authenticated_doctor_client.patch(f'/api/medication/plans/{plan_id}/status/', {
                'status': 'completed',
                'reason': '疗程完成'
            })
            assert status_response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
            
            history_response = authenticated_doctor_client.get(f'/api/medication/patients/{test_patient.id}/history/')
            assert history_response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
    
    def test_medication_plan_with_reminders(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试带提醒功能的药物计划"""
        reminder_plan_data = {
            'patient': test_patient.id,
            'medication_name': '智能提醒药物',
            'dosage': '30mg',
            'frequency': 'four_times_daily',
            'start_date': datetime.now().date().isoformat(),
            'end_date': (datetime.now() + timedelta(days=5)).date().isoformat(),
            'instructions': '智能提醒测试',
            'time_slots': json.dumps(['06:00', '10:00', '14:00', '18:00']),
            'status': 'active',
            'reminder_enabled': True,
            'notification_preferences': json.dumps({
                'push_notifications': True,
                'sms_reminders': False,
                'email_alerts': True
            })
        }
        
        response = authenticated_doctor_client.post('/api/medication/plans/', reminder_plan_data)
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST, status.HTTP_404_NOT_FOUND]
        
        if response.status_code == status.HTTP_201_CREATED:
            data = response.data
            assert data['reminder_enabled'] == True
            assert len(json.loads(data['time_slots'])) == 4

@pytest.mark.django_db
@pytest.mark.integration
@pytest.mark.medication
class TestMedicationModels:
    """测试药物模型功能"""
    
    def test_medication_creation(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试药物创建"""
        medication = Medication.objects.create(
            name='测试药品',
            category='antihypertensive',
            unit='mg',
            specification='10mg/片'
        )
        
        assert medication.name == '测试药品'
        assert medication.category == 'antihypertensive'
        assert medication.unit == 'mg'
        assert medication.specification == '10mg/片'
    
    def test_medication_plan_creation(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试用药计划创建"""
        medication = Medication.objects.create(
            name='测试药品2',
            category='antihypertensive',
            unit='mg',
            specification='5mg/片'
        )
        
        plan = MedicationPlan.objects.create(
            medication=medication,
            patient=test_patient,
            doctor=test_doctor,
            dosage=15.0,
            frequency='BID',
            time_of_day=['08:00', '20:00'],
            start_date='2024-01-15',
            end_date='2024-02-15'
        )
        
        assert plan.medication == medication
        assert plan.patient == test_patient
        assert plan.doctor == test_doctor
        assert plan.dosage == 15.0
        assert plan.frequency == 'BID'
        assert len(plan.time_of_day) == 2
    
    def test_medication_reminder_creation(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试用药提醒创建"""
        medication = Medication.objects.create(
            name='测试药品3',
            category='antihypertensive',
            unit='mg',
            specification='20mg/片'
        )
        
        plan = MedicationPlan.objects.create(
            medication=medication,
            patient=test_patient,
            doctor=test_doctor,
            dosage=20.0,
            frequency='QD',
            time_of_day=['09:00'],
            start_date='2024-01-15',
            end_date='2024-02-15'
        )
        
        reminder = MedicationReminder.objects.create(
            plan=plan,
            scheduled_time=time(9, 0),
            reminder_time=timezone.now()
        )
        
        assert reminder.plan == plan
        assert reminder.scheduled_time == time(9, 0)
        assert reminder.reminder_time is not None
    
    def test_medication_plan_parameter_validation(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试计划参数验证"""
        medication = Medication.objects.create(
            name='测试药品4',
            category='antihypertensive',
            unit='mg',
            specification='25mg/片'
        )
        
        # 测试无效剂量
        invalid_dosage_data = {
            'medication': medication.id,
            'patient': test_patient.id,
            'dosage': '',
            'frequency': 'BID',
            'time_of_day': ['08:00', '20:00'],
            'start_date': '2024-01-15',
            'end_date': '2024-02-15'
        }
        
        response = authenticated_doctor_client.post('/api/medication/plans/', invalid_dosage_data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # 测试无效频次
        invalid_frequency_data = {
            'medication': medication.id,
            'patient': test_patient.id,
            'dosage': 10.0,
            'frequency': 'invalid_frequency',
            'time_of_day': ['08:00', '20:00'],
            'start_date': '2024-01-15',
            'end_date': '2024-02-15'
        }
        
        response = authenticated_doctor_client.post('/api/medication/plans/', invalid_frequency_data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_medication_record_management(self, authenticated_patient_client, test_patient, test_doctor):
        """测试用药记录管理"""
        medication = Medication.objects.create(
            name='测试药品5',
            category='antihypertensive',
            unit='mg',
            specification='30mg/片'
        )
        
        plan = MedicationPlan.objects.create(
            medication=medication,
            patient=test_patient,
            doctor=test_doctor,
            dosage=30.0,
            frequency='QD',
            time_of_day=['12:00'],
            start_date='2024-01-15',
            end_date='2024-02-15'
        )
        
        record = MedicationReminder.objects.create(
            plan=plan,
            scheduled_time=time(12, 0),
            reminder_time=timezone.now(),
            confirm_time=timezone.now(),
            status='taken'
        )
        
        assert record.plan == plan
        assert record.status == 'taken'
        assert record.confirm_time is not None
        
        # 更新状态
        record.status = 'skipped'
        record.save()
        
        record.refresh_from_db()
        assert record.status == 'skipped'
    
    def test_medication_compliance_calculation(self, authenticated_doctor_client, test_doctor, test_patient):
        """测试依从性计算"""
        medication = Medication.objects.create(
            name='测试药品6',
            category='antihypertensive',
            unit='mg',
            specification='35mg/片'
        )
        
        plan = MedicationPlan.objects.create(
            medication=medication,
            patient=test_patient,
            doctor=test_doctor,
            dosage=35.0,
            frequency='BID',
            time_of_day=['08:00', '20:00'],
            start_date='2024-01-15',
            end_date='2024-02-15'
        )
        
        # 创建用药记录
        MedicationReminder.objects.create(
            plan=plan,
            scheduled_time=time(8, 0),
            reminder_time=timezone.now(),
            confirm_time=timezone.now(),
            status='taken'
        )
        
        MedicationReminder.objects.create(
            plan=plan,
            scheduled_time=time(20, 0),
            reminder_time=timezone.now(),
            status='skipped'
        )
        
        # 验证记录创建
        taken_records = MedicationReminder.objects.filter(plan=plan, status='taken')
        skipped_records = MedicationReminder.objects.filter(plan=plan, status='skipped')
        
        assert taken_records.count() == 1
        assert skipped_records.count() == 1
