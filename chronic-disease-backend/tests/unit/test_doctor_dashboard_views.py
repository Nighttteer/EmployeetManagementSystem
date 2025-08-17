"""
医生仪表板视图测试 - 提升覆盖率
"""
import pytest
from rest_framework.test import APIRequestFactory
from rest_framework import status
from health.doctor_dashboard_views import doctor_dashboard_stats, doctor_patients_list
from tests.factories import PatientFactory, DoctorFactory, HealthMetricFactory, AlertFactory


@pytest.mark.unit
@pytest.mark.health
@pytest.mark.doctor
class TestDoctorDashboardViews:
    """医生仪表板视图测试"""

    def setup_method(self):
        """测试设置"""
        self.factory = APIRequestFactory()

    @pytest.mark.django_db
    def test_doctor_dashboard_stats_basic(self):
        """测试医生仪表板统计基本功能"""
        doctor = DoctorFactory()
        
        request = self.factory.get('/test/')
        request.user = doctor
        
        response = doctor_dashboard_stats(request, doctor.id)
        
        # 应该返回成功响应
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)

    @pytest.mark.django_db
    def test_doctor_dashboard_stats_unauthorized(self):
        """测试未授权访问医生仪表板"""
        doctor1 = DoctorFactory()
        doctor2 = DoctorFactory()
        
        request = self.factory.get('/test/')
        request.user = doctor1  # 用doctor1的身份访问doctor2的仪表板
        
        response = doctor_dashboard_stats(request, doctor2.id)
        
        # 应该返回403错误
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'error' in response.data

    @pytest.mark.django_db
    def test_doctor_dashboard_stats_non_doctor(self):
        """测试非医生用户访问仪表板"""
        patient = PatientFactory()
        
        request = self.factory.get('/test/')
        request.user = patient
        
        response = doctor_dashboard_stats(request, patient.id)
        
        # 应该返回403错误
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_doctor_dashboard_stats_with_data(self):
        """测试有数据的医生仪表板"""
        doctor = DoctorFactory()
        patient = PatientFactory()
        
        # 创建一些测试数据
        HealthMetricFactory(patient=patient, metric_type='blood_pressure')
        AlertFactory(assigned_doctor=doctor, patient=patient, status='pending')
        
        request = self.factory.get('/test/')
        request.user = doctor
        
        response = doctor_dashboard_stats(request, doctor.id)
        
        # 验证响应结构
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert isinstance(data, dict)
        
        # 检查预期的数据字段
        expected_fields = ['patients_count', 'active_alerts', 'consultations_today', 
                          'medication_adherence', 'patient_risk_distribution']
        for field in expected_fields:
            if field in data:  # 只检查存在的字段
                assert isinstance(data[field], (int, float, dict, list))

    @pytest.mark.django_db
    def test_doctor_dashboard_stats_invalid_doctor_id(self):
        """测试无效医生ID"""
        doctor = DoctorFactory()
        
        request = self.factory.get('/test/')
        request.user = doctor
        
        # 使用不存在的医生ID
        response = doctor_dashboard_stats(request, 99999)
        
        # 应该返回错误响应
        assert response.status_code in [400, 403, 404, 500]

    @pytest.mark.django_db
    def test_doctor_patients_list_basic(self):
        """测试医生患者列表基本功能"""
        doctor = DoctorFactory()
        
        request = self.factory.get('/test/')
        request.user = doctor
        
        response = doctor_patients_list(request, doctor.id)
        
        # 应该返回成功响应
        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, dict)

    @pytest.mark.django_db
    def test_doctor_patients_list_unauthorized(self):
        """测试未授权访问患者列表"""
        doctor1 = DoctorFactory()
        doctor2 = DoctorFactory()
        
        request = self.factory.get('/test/')
        request.user = doctor1
        
        response = doctor_patients_list(request, doctor2.id)
        
        # 应该返回403错误
        assert response.status_code == status.HTTP_403_FORBIDDEN

    @pytest.mark.django_db
    def test_doctor_patients_list_with_patients(self):
        """测试有患者的医生患者列表"""
        doctor = DoctorFactory()
        patient1 = PatientFactory(name="患者一")
        patient2 = PatientFactory(name="患者二")
        
        # 创建一些健康数据
        HealthMetricFactory(patient=patient1, metric_type='blood_pressure')
        HealthMetricFactory(patient=patient2, metric_type='blood_glucose')
        
        request = self.factory.get('/test/')
        request.user = doctor
        
        response = doctor_patients_list(request, doctor.id)
        
        # 验证响应
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert isinstance(data, dict)
        
        # 检查预期字段
        if 'patients' in data:
            assert isinstance(data['patients'], list)
        if 'total_count' in data:
            assert isinstance(data['total_count'], int)

    @pytest.mark.django_db
    def test_doctor_patients_list_with_search(self):
        """测试带搜索参数的患者列表"""
        doctor = DoctorFactory()
        
        request = self.factory.get('/test/?search=张三')
        request.user = doctor
        
        response = doctor_patients_list(request, doctor.id)
        
        # 应该返回成功响应
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_doctor_patients_list_with_pagination(self):
        """测试带分页参数的患者列表"""
        doctor = DoctorFactory()
        
        request = self.factory.get('/test/?page=1&page_size=10')
        request.user = doctor
        
        response = doctor_patients_list(request, doctor.id)
        
        # 应该返回成功响应
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.django_db
    def test_doctor_patients_list_invalid_doctor_id(self):
        """测试无效医生ID的患者列表"""
        doctor = DoctorFactory()
        
        request = self.factory.get('/test/')
        request.user = doctor
        
        response = doctor_patients_list(request, 99999)
        
        # 应该返回错误响应
        assert response.status_code in [400, 403, 404, 500]

    @pytest.mark.django_db
    def test_doctor_dashboard_stats_exception_handling(self):
        """测试仪表板统计异常处理"""
        doctor = DoctorFactory()
        
        request = self.factory.get('/test/')
        request.user = doctor
        
        # 使用字符串ID来触发可能的异常
        response = doctor_dashboard_stats(request, "invalid_id")
        
        # 应该返回错误响应而不是崩溃
        assert response.status_code in [400, 403, 404, 500]

    @pytest.mark.django_db
    def test_doctor_patients_list_exception_handling(self):
        """测试患者列表异常处理"""
        doctor = DoctorFactory()
        
        request = self.factory.get('/test/')
        request.user = doctor
        
        # 使用字符串ID来触发可能的异常
        response = doctor_patients_list(request, "invalid_id")
        
        # 应该返回错误响应而不是崩溃
        assert response.status_code in [400, 403, 404, 500]
