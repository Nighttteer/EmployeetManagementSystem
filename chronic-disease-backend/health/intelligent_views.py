"""
智能提醒相关的API视图

Intelligent alerts API views. These endpoints provide filtered listings
and generation of intelligent alerts for doctors based on recent health
metrics and medication adherence patterns.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from .alert_analysis_service import AlertAnalysisService

# 创建服务实例
intelligent_alert_service = AlertAnalysisService()
from .models import Alert
from .serializers import AlertSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def intelligent_alerts(request):
    """
    获取医生的智能提醒列表

    List intelligent alerts for the current doctor with optional filters
    by patient, priority, type, and a sliding window (days).
    """
    user = request.user
    
    if not user.is_doctor:
        return Response(
            {"error": "只有医生可以查看智能提醒"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 获取查询参数
    patient_id = request.query_params.get('patient_id')
    priority = request.query_params.get('priority')
    alert_type = request.query_params.get('type')
    days = int(request.query_params.get('days', 7))  # 默认查看最近7天
    
    # 构建查询条件
    queryset = Alert.objects.filter(
        assigned_doctor=user,
        created_at__gte=timezone.now() - timedelta(days=days)
    ).order_by('-created_at')
    
    if patient_id:
        queryset = queryset.filter(patient_id=patient_id)
    
    if priority:
        queryset = queryset.filter(priority=priority)
    
    if alert_type:
        queryset = queryset.filter(alert_type=alert_type)
    
    # 序列化数据
    serializer = AlertSerializer(queryset, many=True)
    
    # 计算统计信息
    stats = {
        'total': queryset.count(),
        'pending': queryset.filter(status='pending').count(),
        'handled': queryset.filter(status='handled').count(),
        'by_priority': {
            'critical': queryset.filter(priority='critical').count(),
            'high': queryset.filter(priority='high').count(),
            'medium': queryset.filter(priority='medium').count(),
            'low': queryset.filter(priority='low').count(),
        },
        'by_type': {
            'missed_medication': queryset.filter(alert_type='missed_medication').count(),
            'threshold_exceeded': queryset.filter(alert_type='threshold_exceeded').count(),
            'abnormal_trend': queryset.filter(alert_type='abnormal_trend').count(),
            'system_notification': queryset.filter(alert_type='system_notification').count(),
        }
    }
    
    return Response({
        'alerts': serializer.data,
        'stats': stats,
        'generated_at': timezone.now()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_intelligent_alerts(request):
    """
    手动触发智能提醒生成

    Trigger the analysis service to generate alerts for all patients
    managed by the current doctor.
    """
    user = request.user
    
    if not user.is_doctor:
        return Response(
            {"error": "只有医生可以生成智能提醒"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    patient_id = request.data.get('patient_id')
    
    try:
        # 为医生的所有患者生成提醒（新的服务不支持单独分析特定患者）
        alerts = intelligent_alert_service.analyze_and_generate_alerts(user.id)
        
        return Response({
            'message': f'成功生成 {len(alerts)} 条智能提醒',
            'alerts_count': len(alerts),
            'generated_at': timezone.now()
        })
        
    except Exception as e:
        return Response(
            {"error": f"生成智能提醒失败: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def patient_risk_analysis(request):
    """
    获取病人风险分析报告

    Return a simplified risk analysis summary for a specific patient
    constructed from the doctor's alert dataset.
    """
    user = request.user
    
    if not user.is_doctor:
        return Response(
            {"error": "只有医生可以查看风险分析"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    patient_id = request.query_params.get('patient_id')
    if not patient_id:
        return Response(
            {"error": "需要提供病人ID"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # 使用新的告警获取方法
        alert_data = intelligent_alert_service.get_doctor_alerts(user.id)
        
        # 筛选特定患者的数据
        patient_alerts = [
            alert for alert in alert_data.get('alerts', []) 
            if alert.get('patientId') == int(patient_id)
        ]
        
        analysis_result = {
            'patient_id': int(patient_id),
            'alerts': patient_alerts,
            'risk_level': 'medium',  # 简化的风险等级
            'total_alerts': len(patient_alerts),
            'analysis_time': timezone.now()
        }
        
        return Response(analysis_result)
        
    except Exception as e:
        return Response(
            {"error": f"获取风险分析失败: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def handle_alert(request, alert_id):
    """
    处理告警

    Mark an alert as handled by the assigned doctor with optional notes
    and action description.
    """
    user = request.user
    
    if not user.is_doctor:
        return Response(
            {"error": "只有医生可以处理告警"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        alert = Alert.objects.get(
            id=alert_id,
            assigned_doctor=user
        )
        
        action_taken = request.data.get('action_taken', '')
        notes = request.data.get('notes', '')
        
        alert.status = 'handled'
        alert.handled_at = timezone.now()
        alert.handled_by = user
        alert.action_taken = action_taken
        alert.notes = notes
        alert.save()
        
        return Response({
            'message': '告警处理成功',
            'alert_id': alert_id,
            'handled_at': alert.handled_at
        })
        
    except Alert.DoesNotExist:
        return Response(
            {"error": "告警不存在或无权限处理"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"处理告警失败: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )