from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from .models import HealthMetric, HealthRecord, ThresholdSetting, DoctorAdvice, Alert
from .serializers import (
    HealthMetricSerializer, HealthMetricCreateSerializer,
    HealthRecordSerializer, ThresholdSettingSerializer,
    DoctorAdviceSerializer, AlertSerializer, HealthTrendsSerializer
)


class HealthMetricListCreateView(generics.ListCreateAPIView):
    """健康指标记录列表和创建视图"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取用户的健康指标记录"""
        user = self.request.user
        if user.is_patient:
            return HealthMetric.objects.filter(patient=user)
        elif user.is_doctor:
            # 医生可以查看所有患者的数据
            return HealthMetric.objects.all()
        return HealthMetric.objects.none()
    
    def get_serializer_class(self):
        """根据操作类型选择序列化器"""
        if self.request.method == 'POST':
            return HealthMetricCreateSerializer
        return HealthMetricSerializer
    
    def perform_create(self, serializer):
        """创建健康指标记录"""
        user = self.request.user
        serializer.save(patient=user, measured_by=user)


class HealthMetricDetailView(generics.RetrieveUpdateDestroyAPIView):
    """健康指标记录详情视图"""
    serializer_class = HealthMetricSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取用户的健康指标记录"""
        user = self.request.user
        if user.is_patient:
            return HealthMetric.objects.filter(patient=user)
        elif user.is_doctor:
            return HealthMetric.objects.all()
        return HealthMetric.objects.none()
    
    def perform_update(self, serializer):
        """更新健康指标记录"""
        serializer.save(last_modified_by=self.request.user)


class HealthRecordView(generics.RetrieveUpdateAPIView):
    """健康档案视图"""
    serializer_class = HealthRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """获取或创建健康档案"""
        user = self.request.user
        record, created = HealthRecord.objects.get_or_create(patient=user)
        return record


class DoctorAdviceListView(generics.ListCreateAPIView):
    """医生建议列表视图"""
    serializer_class = DoctorAdviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取相关的医生建议"""
        user = self.request.user
        if user.is_patient:
            return DoctorAdvice.objects.filter(patient=user)
        elif user.is_doctor:
            return DoctorAdvice.objects.filter(doctor=user)
        return DoctorAdvice.objects.none()
    
    def perform_create(self, serializer):
        """创建医生建议"""
        user = self.request.user
        if user.is_doctor:
            serializer.save(doctor=user)


class AlertListView(generics.ListAPIView):
    """健康告警列表视图"""
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取相关的健康告警"""
        user = self.request.user
        if user.is_patient:
            return Alert.objects.filter(patient=user)
        elif user.is_doctor:
            return Alert.objects.filter(assigned_doctor=user)
        return Alert.objects.none()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def health_dashboard(request):
    """健康仪表板数据"""
    user = request.user
    
    if not user.is_patient:
        return Response(
            {"error": "只有患者可以查看健康仪表板"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 获取最近的健康指标
    recent_metrics = HealthMetric.objects.filter(
        patient=user,
        measured_at__gte=timezone.now() - timedelta(days=30)
    ).order_by('-measured_at')[:10]
    
    # 获取未读建议
    unread_advice = DoctorAdvice.objects.filter(
        patient=user,
        is_read=False
    ).count()
    
    # 获取活跃告警
    active_alerts = Alert.objects.filter(
        patient=user,
        status='pending'
    ).count()
    
    # 准备响应数据
    response_data = {
        'recent_metrics': HealthMetricSerializer(recent_metrics, many=True).data,
        'unread_advice_count': unread_advice,
        'active_alerts_count': active_alerts,
        'last_measurement': recent_metrics.first().measured_at if recent_metrics.exists() else None,
    }
    
    return Response(response_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def health_trends(request):
    """健康趋势数据"""
    user = request.user
    
    if not user.is_patient:
        return Response(
            {"error": "只有患者可以查看健康趋势"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 获取参数
    metric_type = request.query_params.get('metric_type', 'blood_pressure')
    period = request.query_params.get('period', '30days')  # 默认30天
    
    # 解析时间段
    period_mapping = {
        '7days': 7,
        '30days': 30,
        '90days': 90,
        '365days': 365,
        'week': 7,
        'month': 30,
        'quarter': 90,
        'year': 365
    }
    
    try:
        if period in period_mapping:
            period_days = period_mapping[period]
        else:
            # 尝试直接解析数字
            period_days = int(period)
    except ValueError:
        period_days = 30  # 默认30天
    
    # 获取时间范围内的数据
    start_date = timezone.now() - timedelta(days=period_days)
    metrics = HealthMetric.objects.filter(
        patient=user,
        measured_at__gte=start_date
    ).order_by('measured_at')
    
    # 按指标类型分组
    metrics_by_type = {}
    for metric in metrics:
        if metric.metric_type not in metrics_by_type:
            metrics_by_type[metric.metric_type] = []
        metrics_by_type[metric.metric_type].append(metric)
    
    # 准备响应数据
    response_data = {
        'period': period,
        'period_days': period_days,
        'metrics': {},
        'summary': {
            'total_records': metrics.count(),
            'types_count': len(metrics_by_type),
            'date_range': {
                'start': start_date.isoformat(),
                'end': timezone.now().isoformat()
            }
        }
    }
    
    # 处理每种指标类型的数据
    for metric_type, type_metrics in metrics_by_type.items():
        data_points = []
        for metric in type_metrics:
            data_points.append({
                'id': metric.id,
                'date': metric.measured_at.strftime('%Y-%m-%d'),
                'time': metric.measured_at.strftime('%H:%M'),
                'datetime': metric.measured_at.isoformat(),
                'value': metric.get_primary_value(),
                'note': metric.note,
                'metric_type': metric.metric_type,
                # 包含所有相关字段
                'systolic': getattr(metric, 'systolic', None),
                'diastolic': getattr(metric, 'diastolic', None),
                'blood_glucose': getattr(metric, 'blood_glucose', None),
                'glucose': getattr(metric, 'blood_glucose', None),  # 兼容性
                'heart_rate': getattr(metric, 'heart_rate', None),
                'weight': getattr(metric, 'weight', None),
                'uric_acid': getattr(metric, 'uric_acid', None),
                'lipids_total': getattr(metric, 'lipids_total', None),
                'hdl': getattr(metric, 'hdl', None),
                'ldl': getattr(metric, 'ldl', None),
                'triglyceride': getattr(metric, 'triglyceride', None),
            })
    
        # 计算统计信息
        if data_points:
            # 对于血压，使用收缩压作为主要值进行计算
            if metric_type == 'blood_pressure':
                values = [point['systolic'] for point in data_points if point['systolic'] is not None]
            else:
                values = [point['value'] for point in data_points if point['value'] is not None]
            
            if values:
                average_value = sum(values) / len(values)
                min_value = min(values)
                max_value = max(values)
            
                # 趋势分析
                if len(values) >= 2:
                    first_value = values[0]
                    last_value = values[-1]
                    change = last_value - first_value
                    percent_change = (change / first_value * 100) if first_value != 0 else 0
                    
                    if abs(percent_change) < 5:
                        trend_direction = 'stable'
                    elif change > 0:
                        trend_direction = 'increasing'
                    else:
                        trend_direction = 'decreasing'
                else:
                    trend_direction = 'stable'
                    percent_change = 0
            else:
                average_value = None
                min_value = None
                max_value = None
                trend_direction = 'stable'
                percent_change = 0
        else:
            average_value = None
            min_value = None
            max_value = None
            trend_direction = 'stable'
            percent_change = 0
    
        response_data['metrics'][metric_type] = {
            'data_points': data_points,
            'statistics': {
                'count': len(data_points),
                'average': average_value,
                'min': min_value,
                'max': max_value,
                'trend': trend_direction,
                'percent_change': round(percent_change, 2)
            }
        }
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_advice_read(request, advice_id):
    """标记建议为已读"""
    user = request.user
    
    try:
        advice = DoctorAdvice.objects.get(id=advice_id, patient=user)
        advice.is_read = True
        advice.read_at = timezone.now()
        advice.save()
        
        return Response({"message": "建议已标记为已读"})
    except DoctorAdvice.DoesNotExist:
        return Response(
            {"error": "建议不存在或无权限"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def handle_alert(request, alert_id):
    """处理健康告警"""
    user = request.user
    
    if not user.is_doctor:
        return Response(
            {"error": "只有医生可以处理告警"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        alert = Alert.objects.get(id=alert_id, assigned_doctor=user)
        
        action_taken = request.data.get('action_taken', '')
        notes = request.data.get('notes', '')
        
        alert.status = 'handled'
        alert.handled_at = timezone.now()
        alert.handled_by = user
        alert.action_taken = action_taken
        alert.notes = notes
        alert.save()
        
        return Response({"message": "告警处理完成"})
    except Alert.DoesNotExist:
        return Response(
            {"error": "告警不存在或无权限"},
            status=status.HTTP_404_NOT_FOUND
        )
