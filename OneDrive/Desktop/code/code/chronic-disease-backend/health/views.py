from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

# 注意：智能提醒相关的视图在intelligent_views.py中定义
# 在urls.py中直接导入使用，这里不需要重复导入
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta
from .models import HealthMetric, HealthRecord, ThresholdSetting, DoctorAdvice, Alert
from .serializers import (
    HealthMetricSerializer, HealthMetricCreateSerializer,
    HealthRecordSerializer, ThresholdSettingSerializer,
    DoctorAdviceSerializer, AlertSerializer, HealthTrendsSerializer
)
from .permissions import get_doctor_patient_ids, verify_doctor_patient_access, check_patient_data_access


class HealthMetricListCreateView(generics.ListCreateAPIView):
    """
    健康指标记录列表和创建视图

    List and create health metric records.

    Authorization model:
    - Patients: list/create their own metrics
    - Doctors: list metrics of actively managed patients only

    Security notes:
    - Creation sets both `patient` and `measured_by` to the authenticated
      user, preventing spoofing of ownership via request payload.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Access to users' health indicator records (role-aware)."""
        user = self.request.user
        if user.is_patient:
            return HealthMetric.objects.filter(patient=user)
        elif user.is_doctor:
            # Doctors can only view data on the patients for whom they are responsible
            patient_ids = get_doctor_patient_ids(user)
            return HealthMetric.objects.filter(patient_id__in=patient_ids)
        return HealthMetric.objects.none()
    
    def get_serializer_class(self):
        """根据操作类型选择序列化器 / Choose serializer by method."""
        if self.request.method == 'POST':
            return HealthMetricCreateSerializer
        return HealthMetricSerializer
    
    def perform_create(self, serializer):
        """创建健康指标记录 / Persist a new metric for the current user."""
        user = self.request.user
        health_metric = serializer.save(patient=user, measured_by=user)
        
        # 如果是病人输入的数据，立即进行警告检测
        if user.role == 'patient':
            try:
                # 获取病人的主治医生
                from health.models import DoctorPatientRelation
                doctor_relation = DoctorPatientRelation.objects.filter(
                    patient=user,
                    status='active',
                    is_primary=True
                ).first()
                
                if doctor_relation:
                    # 导入并调用即时警告检测服务
                    from health.alert_analysis_service import AlertAnalysisService
                    alert_service = AlertAnalysisService()
                    
                    # 异步执行警告检测（避免阻塞响应）
                    import threading
                    def run_alert_analysis():
                        try:
                            alerts = alert_service.analyze_single_health_metric(
                                health_metric, user, doctor_relation.doctor
                            )
                            if alerts:
                                print(f"🚨 为患者 {user.name} 生成了 {len(alerts)} 个即时警告")
                        except Exception as e:
                            print(f"❌ 即时警告检测失败: {str(e)}")
                    
                    # 启动后台线程执行警告检测
                    analysis_thread = threading.Thread(target=run_alert_analysis)
                    analysis_thread.daemon = True
                    analysis_thread.start()
                    
                    print(f"✅ 已启动患者 {user.name} 的健康数据即时警告检测")
                else:
                    print(f"⚠️ 患者 {user.name} 没有主治医生，跳过即时警告检测")
                    
            except Exception as e:
                print(f"❌ 启动即时警告检测失败: {str(e)}")
                # 不影响数据保存，只记录错误


class HealthMetricDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    健康指标记录详情视图

    Retrieve, update, or delete a single health metric record subject to
    role-based access control.

    Security notes:
    - Updates stamp `last_modified_by` to support auditability.
    - Queryset is filtered by role to prevent insecure direct object access.
    """
    serializer_class = HealthMetricSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取用户的健康指标记录 / Role-scoped queryset for safety."""
        user = self.request.user
        if user.is_patient:
            return HealthMetric.objects.filter(patient=user)
        elif user.is_doctor:
            # 医生只能查看其负责患者的数据
            patient_ids = get_doctor_patient_ids(user)
            return HealthMetric.objects.filter(patient_id__in=patient_ids)
        return HealthMetric.objects.none()
    
    def perform_update(self, serializer):
        """更新健康指标记录 / Tag modifier for audit trails."""
        serializer.save(last_modified_by=self.request.user)


class HealthRecordView(generics.RetrieveUpdateAPIView):
    """
    健康档案视图

    Retrieve or update a consolidated patient health record, with access
    enforced via shared permission utilities.
    """
    serializer_class = HealthRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """获取或创建健康档案 / Enforce access and return/create record."""
        user = self.request.user
        patient_id = self.kwargs.get('patient_id')
        
        # 使用权限检查工具
        has_access, patient = check_patient_data_access(user, patient_id)
        if not has_access:
            from django.http import Http404
            raise Http404("无权访问健康档案")
        
        if user.is_doctor and not patient_id:
            from django.http import Http404
            raise Http404("医生必须指定患者ID")
        
        # 获取或创建健康档案
        target_patient = patient if patient else user
        record, created = HealthRecord.objects.get_or_create(patient=target_patient)
        return record


class DoctorAdviceListView(generics.ListCreateAPIView):
    """
    医生建议列表视图

    List and create doctor advice records.

    Security notes:
    - Patients: only see advice addressed to them
    - Doctors: may list their own authored advice and set `doctor` upon create
    """
    serializer_class = DoctorAdviceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取相关的医生建议 / Role-scoped listing."""
        user = self.request.user
        if user.is_patient:
            return DoctorAdvice.objects.filter(patient=user)
        elif user.is_doctor:
            return DoctorAdvice.objects.filter(doctor=user)
        return DoctorAdvice.objects.none()
    
    def perform_create(self, serializer):
        """创建医生建议 / Attribute current doctor as author."""
        user = self.request.user
        if user.is_doctor:
            serializer.save(doctor=user)


class AlertListView(generics.ListAPIView):
    """
    健康告警列表视图

    List health alerts relevant to the current user (patient or doctor).
    """
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """获取相关的健康告警 / Role-scoped listing of alerts."""
        user = self.request.user
        if user.is_patient:
            return Alert.objects.filter(patient=user)
        elif user.is_doctor:
            return Alert.objects.filter(assigned_doctor=user)
        return Alert.objects.none()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def health_dashboard(request):
    """
    健康仪表板数据

    Patient dashboard aggregates recent metrics, unread advice count,
    and active alerts within the last 30 days.
    """
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


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def patient_advice(request, patient_id):
    """
    患者建议列表/创建接口
    GET: 返回指定患者的所有建议（患者看自己的；医生看自己管理的患者）
    POST: 医生为该患者新增建议（自动绑定 doctor 和 patient）
    """
    user = request.user
    has_access, _ = check_patient_data_access(user, patient_id)
    if not has_access:
        # 隐藏权限细节，返回404
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        qs = DoctorAdvice.objects.filter(patient_id=patient_id).order_by('-advice_time')
        serializer = DoctorAdviceSerializer(qs, many=True)
        return Response({'success': True, 'data': serializer.data})

    # POST
    if not getattr(user, 'is_doctor', False):
        return Response({'detail': '只有医生可以创建建议'}, status=status.HTTP_403_FORBIDDEN)

    payload = request.data.copy()
    payload['patient'] = int(patient_id)
    payload['doctor'] = user.id
    serializer = DoctorAdviceSerializer(data=payload)
    if serializer.is_valid():
        instance = serializer.save()
        return Response({'success': True, 'data': DoctorAdviceSerializer(instance).data}, status=status.HTTP_201_CREATED)
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def advice_detail(request, advice_id):
    """
    医生编辑/删除建议；仅作者医生可操作。
    """
    user = request.user
    try:
        advice = DoctorAdvice.objects.get(id=advice_id)
    except DoctorAdvice.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        if not getattr(user, 'is_doctor', False) or advice.doctor_id != user.id:
            return Response({'detail': '无权限编辑'}, status=status.HTTP_403_FORBIDDEN)
        serializer = DoctorAdviceSerializer(advice, data=request.data, partial=True)
        if serializer.is_valid():
            instance = serializer.save()
            return Response({'success': True, 'data': DoctorAdviceSerializer(instance).data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    if not getattr(user, 'is_doctor', False) or advice.doctor_id != user.id:
        return Response({'detail': '无权限删除'}, status=status.HTTP_403_FORBIDDEN)
    advice.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def doctor_dashboard(request):
    """
    医生端仪表板数据

    Provide high-level KPIs for the doctor: patient count, pending
    alerts, 7-day medication compliance, risk distribution, and recent
    patient activity.
    """
    user = request.user
    
    if user.role != 'doctor':
        return Response(
            {"error": "只有医生可以查看医生仪表板"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    from .models import DoctorPatientRelation
    from medication.models import MedicationReminder
    
    # 1. 患者总人数 - 该医生管理的活跃患者
    patient_relations = DoctorPatientRelation.objects.filter(
        doctor=user,
        status='active'
    )
    total_patients = patient_relations.count()
    
    # 获取患者ID列表
    patient_ids = list(patient_relations.values_list('patient_id', flat=True))
    
    # 2. 活跃告警 - 待处理的告警数量
    active_alerts = Alert.objects.filter(
        assigned_doctor=user,
        status='pending'
    ).count()
    
    # 3. 今日咨询 - 模拟数据（因为没有咨询表）
    today_consultations = 0  # 暂时为0，后续可以从就诊记录获取
    
    # 4. 药物依从性 - 计算最近7天的用药依从率
    from datetime import timedelta
    seven_days_ago = timezone.now() - timedelta(days=7)
    
    if patient_ids:
        # 最近7天的用药提醒
        total_reminders = MedicationReminder.objects.filter(
            plan__patient_id__in=patient_ids,
            reminder_time__gte=seven_days_ago
        ).count()
        
        # 已确认的用药记录
        confirmed_reminders = MedicationReminder.objects.filter(
            plan__patient_id__in=patient_ids,
            reminder_time__gte=seven_days_ago,
            status='taken'
        ).count()
        
        # 计算依从率
        medication_compliance = round(
            (confirmed_reminders / total_reminders * 100) if total_reminders > 0 else 0,
            1
        )
    else:
        medication_compliance = 0
    
    # 5. 风险分布统计
    if patient_ids:
        # 获取患者的最新健康指标进行风险评估
        from collections import defaultdict
        risk_distribution = defaultdict(int)
        
        for patient_id in patient_ids:
            # 获取最近的血压和血糖数据
            recent_bp = HealthMetric.objects.filter(
                patient_id=patient_id,
                metric_type='blood_pressure'
            ).order_by('-measured_at').first()
            
            recent_bg = HealthMetric.objects.filter(
                patient_id=patient_id,
                metric_type='blood_glucose'
            ).order_by('-measured_at').first()
            
            # 简单的风险评估逻辑
            risk_level = 'low'
            if recent_bp and (recent_bp.systolic >= 140 or recent_bp.diastolic >= 90):
                risk_level = 'high'
            elif recent_bg and recent_bg.blood_glucose >= 7.0:
                risk_level = 'high'
            elif (recent_bp and (recent_bp.systolic >= 130 or recent_bp.diastolic >= 80)) or \
                 (recent_bg and recent_bg.blood_glucose >= 6.1):
                risk_level = 'medium'
            
            risk_distribution[risk_level] += 1
        
        patient_risk_distribution = [
            { 'label': '高风险', 'value': risk_distribution['high'], 'color': '#F44336' },
            { 'label': '中风险', 'value': risk_distribution['medium'], 'color': '#FF9800' },
            { 'label': '低风险', 'value': risk_distribution['low'], 'color': '#4CAF50' }
        ]
    else:
        patient_risk_distribution = [
            { 'label': '高风险', 'value': 0, 'color': '#F44336' },
            { 'label': '中风险', 'value': 0, 'color': '#FF9800' },
            { 'label': '低风险', 'value': 0, 'color': '#4CAF50' }
        ]
    
    # 6. 告警类型分布
    alert_types_stats = Alert.objects.filter(
        assigned_doctor=user
    ).values('alert_type').annotate(count=Count('id'))
    
    alert_types = []
    for stat in alert_types_stats:
        type_name = {
            'threshold_exceeded': '指标异常',
            'missed_medication': '用药提醒',
            'abnormal_trend': '趋势异常',
            'system_notification': '系统通知'
        }.get(stat['alert_type'], stat['alert_type'])
        
        alert_types.append({
            'label': type_name,
            'value': stat['count']
        })
    
    # 7. 最近患者活动 - 获取最近有健康数据更新的患者
    recent_patients = []
    if patient_ids:
        recent_metrics = HealthMetric.objects.filter(
            patient_id__in=patient_ids
        ).select_related('patient').order_by('-measured_at')[:5]
        
        for metric in recent_metrics:
            # 简单的风险评估
            risk_level = 'low'
            condition = '正常'
            
            if metric.metric_type == 'blood_pressure' and metric.systolic:
                if metric.systolic >= 140:
                    risk_level = 'high'
                    condition = '血压偏高'
                elif metric.systolic >= 130:
                    risk_level = 'medium'
                    condition = '血压偏高'
            elif metric.metric_type == 'blood_glucose' and metric.blood_glucose:
                if metric.blood_glucose >= 7.0:
                    risk_level = 'high'
                    condition = '血糖偏高'
                elif metric.blood_glucose >= 6.1:
                    risk_level = 'medium'
                    condition = '血糖偏高'
            
            # 计算时间差
            time_diff = timezone.now() - metric.measured_at
            if time_diff.days > 0:
                last_visit = f'{time_diff.days}天前'
            elif time_diff.seconds > 3600:
                last_visit = f'{time_diff.seconds // 3600}小时前'
            else:
                last_visit = f'{time_diff.seconds // 60}分钟前'
            
            recent_patients.append({
                'id': metric.patient.id,
                'name': metric.patient.name,
                'age': metric.patient.age or 0,
                'riskLevel': risk_level,
                'lastVisit': last_visit,
                'condition': condition
            })
    
    # 准备响应数据
    response_data = {
        'stats': {
            'totalPatients': total_patients,
            'activeAlerts': active_alerts,
            'todayConsultations': today_consultations,
            'medicationCompliance': medication_compliance,
        },
        'trends': {
            'patientGrowth': 0,  # 需要历史数据计算
            'alertReduction': 0,  # 需要历史数据计算
            'consultationIncrease': 0,  # 需要历史数据计算
            'complianceImprovement': 0,  # 需要历史数据计算
        },
        'patientRiskDistribution': patient_risk_distribution,
        'alertTypes': alert_types,
        'recentPatients': recent_patients,
        'dataSource': 'database',
        'lastUpdated': timezone.now().isoformat()
    }
    
    return Response(response_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def health_trends(request):
    """
    健康趋势数据

    Return time-series metrics for the authenticated patient across a
    requested time window, with basic trend analysis summary.
    """
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
    """标记建议为已读 / Mark a doctor advice as read by the patient."""
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
    """处理健康告警 / Handle an alert by the assigned doctor."""
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
