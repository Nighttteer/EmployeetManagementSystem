from django.urls import path
from . import views

app_name = 'health'

urlpatterns = [
    # 健康指标相关
    path('metrics/', views.HealthMetricListCreateView.as_view(), name='metric_list_create'),
    path('metrics/<int:pk>/', views.HealthMetricDetailView.as_view(), name='metric_detail'),
    
    # 健康档案
    path('record/', views.HealthRecordView.as_view(), name='health_record'),
    
    # 医生建议
    path('advice/', views.DoctorAdviceListView.as_view(), name='advice_list'),
    path('advice/<int:advice_id>/read/', views.mark_advice_read, name='mark_advice_read'),
    
    # 健康告警
    path('alerts/', views.AlertListView.as_view(), name='alert_list'),
    path('alerts/<int:alert_id>/handle/', views.handle_alert, name='handle_alert'),
    
    # 仪表板和趋势
    path('dashboard/', views.health_dashboard, name='health_dashboard'),
    path('trends/', views.health_trends, name='health_trends'),
] 