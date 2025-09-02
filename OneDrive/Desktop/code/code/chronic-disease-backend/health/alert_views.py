"""
告警相关API视图
基于真实数据库数据的告警系统

Alert-related API views backed by real database entities. These endpoints
enforce doctor-only operations where appropriate and return structured
payloads suitable for dashboards and detail pages.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.utils import timezone

from .alert_analysis_service import AlertAnalysisService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_doctor_alerts(request, doctor_id):
    """
    获取医生的告警数据
    
    API路径: /api/alerts/doctor/{doctor_id}/
    
    数据流程 / Data flow:
    1. 验证医生身份
    2. 从Alert表查询该医生的告警
    3. 返回告警列表和统计数据
    """
    try:
        # 验证请求的医生是否为当前登录用户
        if request.user.id != int(doctor_id) or request.user.role != 'doctor':
            return Response({
                'error': '无权限访问其他医生的告警数据'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 获取语言参数，默认为中文
        language = request.GET.get('language', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'  # 如果不支持的语言，默认使用中文
        
        # 使用告警分析服务获取数据，传递语言参数
        alert_service = AlertAnalysisService(language=language)
        alert_data = alert_service.get_doctor_alerts(doctor_id)
        
        if 'error' in alert_data:
            return Response({
                'error': alert_data['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': True,
            'data': alert_data,
            'message': f'获取到 {len(alert_data["alerts"])} 条告警数据',
            'dataSource': '数据库: Alert表 + HealthMetric表 + MedicationReminder表',
            'language': language
        })
        
    except ValueError:
        return Response({
            'error': '无效的医生ID'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'获取告警数据失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_patient_data(request, doctor_id):
    """
    手动触发患者数据分析
    
    API路径: /api/alerts/doctor/{doctor_id}/analyze/
    
    数据分析流程 / Analysis pipeline:
    1. 查询DoctorPatientRelation获取医生的患者
    2. 从HealthMetric表获取患者最近3天数据
    3. 从MedicationReminder表分析用药依从性
    4. 分析趋势和异常，生成Alert记录
    5. 返回分析结果
    """
    try:
        # 验证医生身份
        if request.user.id != int(doctor_id) or request.user.role != 'doctor':
            return Response({
                'error': '无权限执行数据分析'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 获取语言参数，默认为中文
        language = request.data.get('language', request.GET.get('language', 'zh'))
        if language not in ['zh', 'en']:
            language = 'zh'  # 如果不支持的语言，默认使用中文
        
        # 执行数据分析，传递语言参数
        alert_service = AlertAnalysisService(language=language)
        generated_alerts = alert_service.analyze_and_generate_alerts(doctor_id)
        
        # 返回分析结果
        return Response({
            'success': True,
            'message': f'数据分析完成，生成 {len(generated_alerts)} 个告警',
            'generatedAlerts': len(generated_alerts),
            'analysisTime': timezone.now().isoformat(),
            'dataSource': '分析数据: HealthMetric表 + MedicationReminder表 + DoctorPatientRelation表',
            'language': language
        })
        
    except ValueError:
        return Response({
            'error': '无效的医生ID'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'数据分析失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def handle_alert(request, alert_id):
    """
    处理告警 - 标记为已处理或已忽略
    
    API路径: /api/alerts/{alert_id}/handle/
    """
    try:
        from .models import Alert
        
        alert = Alert.objects.get(id=alert_id)
        
        # 验证权限 / Ensure the alert belongs to the current doctor
        if alert.assigned_doctor != request.user:
            return Response({
                'error': '无权限处理此告警'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # 获取处理参数
        action = request.data.get('action')  # 'handled' 或 'dismissed'
        notes = request.data.get('notes', '')
        
        if action not in ['handled', 'dismissed']:
            return Response({
                'error': '无效的处理动作'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 更新告警状态 / Persist handling outcome with metadata
        alert.status = action
        alert.handled_at = timezone.now()
        alert.handled_by = request.user
        alert.notes = notes
        alert.save()
        
        return Response({
            'success': True,
            'message': f'告警已{action}',
            'alert': {
                'id': alert.id,
                'status': alert.status,
                'handledAt': alert.handled_at.isoformat(),
                'handledBy': alert.handled_by.name,
                'notes': alert.notes
            }
        })
        
    except Alert.DoesNotExist:
        return Response({
            'error': '告警不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'处理告警失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_health_data(request, patient_id):
    """
    获取患者的健康数据详情 - 用于告警详情展示
    
    API路径: /api/patients/{patient_id}/health-data/
    """
    try:
        from .models import HealthMetric
        from medication.models import MedicationReminder
        from datetime import timedelta
        
        # 获取最近7天的数据 / Restrict the timeframe to last 7 days
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        
        # 健康指标数据
        health_metrics = HealthMetric.objects.filter(
            patient_id=patient_id,
            measured_at__gte=start_date
        ).order_by('-measured_at')
        
        # 用药记录数据
        medication_records = MedicationReminder.objects.filter(
            plan__patient_id=patient_id,
            reminder_time__gte=start_date
        ).select_related('plan__medication').order_by('-reminder_time')
        
        # 序列化数据
        health_data = []
        for metric in health_metrics:
            health_data.append({
                'id': metric.id,
                'type': metric.metric_type,
                'value': metric.get_primary_value(),
                'measuredAt': metric.measured_at.isoformat(),
                'note': metric.note or '',
                'systolic': metric.systolic,
                'diastolic': metric.diastolic,
                'heartRate': metric.heart_rate,
                'bloodGlucose': metric.blood_glucose,
            })
        
        medication_data = []
        for record in medication_records:
            medication_data.append({
                'id': record.id,
                'medicationName': record.plan.medication.name,
                'status': record.status,
                'scheduledTime': record.scheduled_time.strftime('%H:%M'),
                'reminderTime': record.reminder_time.isoformat(),
                'confirmTime': record.confirm_time.isoformat() if record.confirm_time else None,
                'notes': record.notes or '',
                'sideEffects': record.side_effects_reported or '',
            })
        
        return Response({
            'success': True,
            'data': {
                'healthMetrics': health_data,
                'medicationRecords': medication_data,
                'dataRange': f'{start_date.date()} 至 {end_date.date()}',
                'totalRecords': len(health_data) + len(medication_data)
            },
            'dataSource': 'HealthMetric表 + MedicationReminder表'
        })
        
    except Exception as e:
        return Response({
            'error': f'获取患者数据失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def immediate_alert_analysis(request, patient_id):
    """
    对患者的最新健康数据进行即时警告检测
    
    API路径: /api/alerts/patient/{patient_id}/immediate-analysis/
    
    功能说明:
    1. 获取患者最近24小时内的健康数据
    2. 对每条数据进行即时异常检测
    3. 生成相应的警告记录
    4. 返回检测结果
    
    请求参数:
    - metric_type: 指标类型（可选，不传则分析所有类型）
    - language: 语言设置（默认中文）
    """
    try:
        from accounts.models import User
        from .models import HealthMetric
        from datetime import timedelta
        
        # 验证患者存在
        try:
            patient = User.objects.get(id=patient_id, role='patient')
        except User.DoesNotExist:
            return Response({
                'error': '患者不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # 获取语言参数
        language = request.data.get('language', 'zh')
        if language not in ['zh', 'en']:
            language = 'zh'
        
        # 获取指标类型参数
        metric_type = request.data.get('metric_type')
        
        # 获取最近24小时内的健康数据
        end_date = timezone.now()
        start_date = end_date - timedelta(hours=24)
        
        health_metrics_query = HealthMetric.objects.filter(
            patient=patient,
            measured_at__gte=start_date
        )
        
        if metric_type:
            health_metrics_query = health_metrics_query.filter(metric_type=metric_type)
        
        health_metrics = health_metrics_query.order_by('-measured_at')
        
        if not health_metrics.exists():
            return Response({
                'success': True,
                'message': '没有找到需要分析的健康数据',
                'data': {
                    'analyzedMetrics': 0,
                    'generatedAlerts': 0,
                    'dataRange': f'{start_date.strftime("%Y-%m-%d %H:%M")} 至 {end_date.strftime("%Y-%m-%d %H:%M")}'
                }
            })
        
        # 获取患者的主治医生
        from .models import DoctorPatientRelation
        doctor_relation = DoctorPatientRelation.objects.filter(
            patient=patient,
            status='active',
            is_primary=True
        ).first()
        
        if not doctor_relation:
            return Response({
                'error': '患者没有主治医生，无法生成警告'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 执行即时警告检测
        alert_service = AlertAnalysisService(language=language)
        total_alerts = []
        
        for metric in health_metrics:
            try:
                alerts = alert_service.analyze_single_health_metric(
                    metric, patient, doctor_relation.doctor
                )
                total_alerts.extend(alerts)
            except Exception as e:
                print(f"❌ 分析指标 {metric.id} 失败: {str(e)}")
                continue
        
        # 统计结果
        alert_stats = {}
        for alert in total_alerts:
            priority = alert.priority
            alert_stats[priority] = alert_stats.get(priority, 0) + 1
        
        return Response({
            'success': True,
            'message': f'即时警告检测完成，分析了 {health_metrics.count()} 条数据，生成了 {len(total_alerts)} 个警告',
            'data': {
                'analyzedMetrics': health_metrics.count(),
                'generatedAlerts': len(total_alerts),
                'alertStats': alert_stats,
                'dataRange': f'{start_date.strftime("%Y-%m-%d %H:%M")} 至 {end_date.strftime("%Y-%m-%d %H:%M")}',
                'metricType': metric_type or 'all',
                'language': language
            }
        })
        
    except Exception as e:
        return Response({
            'error': f'即时警告检测失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# 兼容旧版本的视图函数
@csrf_exempt
@require_http_methods(["GET"])
def doctor_alerts_legacy(request, doctor_id):
    """
    兼容旧版本的告警API (非DRF)
    """
    try:
        alert_service = AlertAnalysisService()
        alert_data = alert_service.get_doctor_alerts(doctor_id)
        
        return JsonResponse({
            'success': True,
            'alerts': alert_data['alerts'],
            'stats': alert_data['stats'],
            'message': '数据来源: 数据库真实数据'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)