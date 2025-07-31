from django.urls import path
from . import views

app_name = 'medication'

urlpatterns = [
    # 测试接口
    path('test/', views.test_medication_api, name='test_medication_api'),
    
    # 药品列表
    path('medications/', views.medication_list, name='medication_list'),
    
    # 用药计划管理 - 全局
    path('plans/', views.MedicationPlanViewSet.as_view(), name='plans_list'),
    path('plans/stats/', views.medication_plan_stats, name='plans_stats'),
    
    # 用药计划管理 - 特定患者
    path('patients/<int:patient_id>/plans/', views.MedicationPlanViewSet.as_view(), name='patient_plans'),
    path('patients/<int:patient_id>/plans/stats/', views.medication_plan_stats, name='patient_plans_stats'),
    path('patients/<int:patient_id>/plans/<int:plan_id>/', views.MedicationPlanViewSet.as_view(), name='plan_detail'),
    path('patients/<int:patient_id>/history/', views.get_medication_history, name='medication_history'),
    
    # 用药计划状态管理
    path('plans/<int:plan_id>/status/', views.update_plan_status, name='update_plan_status'),
] 