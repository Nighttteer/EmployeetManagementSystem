"""
健康模块URL配置
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views
from . import intelligent_views
from . import alert_views
from . import doctor_dashboard_views

router = DefaultRouter()

urlpatterns = [
    # 现有的URL（去掉重复的api/health前缀）
    path('dashboard/', views.health_dashboard, name='health_dashboard'),
    path('doctor-dashboard/', views.doctor_dashboard, name='doctor_dashboard'),
    path('trends/', views.health_trends, name='health_trends'),
    path('alerts/', views.AlertListView.as_view(), name='alert_list'),
    
    # 新增智能提醒相关API
    path('intelligent-alerts/', intelligent_views.intelligent_alerts, name='intelligent_alerts'),
    path('intelligent-alerts/generate/', intelligent_views.generate_intelligent_alerts, name='generate_intelligent_alerts'),
    path('intelligent-alerts/analysis/', intelligent_views.patient_risk_analysis, name='patient_risk_analysis'),
    
    # 基于数据库的告警API (新版本)
    path('alerts/doctor/<int:doctor_id>/', alert_views.get_doctor_alerts, name='get_doctor_alerts'),
    path('alerts/doctor/<int:doctor_id>/analyze/', alert_views.analyze_patient_data, name='analyze_patient_data'),
    path('alerts/<int:alert_id>/handle/', alert_views.handle_alert, name='handle_alert_db'),
    path('patients/<int:patient_id>/health-data/', alert_views.get_patient_health_data, name='get_patient_health_data'),
    # 患者建议（DoctorAdvice）
    path('patients/<int:patient_id>/advice/', views.patient_advice, name='patient_advice'),
    path('advice/<int:advice_id>/', views.advice_detail, name='advice_detail'),
    
    # 医生仪表板API (替换前端硬编码数据)
    path('doctor/<int:doctor_id>/dashboard/', doctor_dashboard_views.doctor_dashboard_stats, name='doctor_dashboard_stats'),
    path('doctor/<int:doctor_id>/patients/', doctor_dashboard_views.doctor_patients_list, name='doctor_patients_list'),
    
    # DRF router
    path('', include(router.urls)),
]