"""
医生仪表板API
提供医生端统计数据，替换前端硬编码的模拟数据
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Q, Avg
from datetime import timedelta, datetime

from accounts.models import User
from .models import HealthMetric, Alert, DoctorPatientRelation
from medication.models import MedicationReminder


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doctor_dashboard_stats(request, doctor_id):
    """
    医生仪表板统计数据API
    
    API路径: /api/health/doctor/{doctor_id}/dashboard/
    
    返回数据:
    - 患者总人数
    - 活跃告警数量
    - 今日咨询（暂时返回模拟数据，待建立咨询记录表）
    - 药物依从性统计
    - 患者风险分布
    """
    try:
        # 验证医生身份
        if request.user.id != int(doctor_id) or request.user.role != 'doctor':
            return Response({
                'error': '无权限访问其他医生的仪表板数据'
            }, status=status.HTTP_403_FORBIDDEN)
        
        doctor = User.objects.get(id=doctor_id, role='doctor')
        
        # 1. 患者总人数 - 从DoctorPatientRelation表查询
        total_patients = DoctorPatientRelation.objects.filter(
            doctor=doctor,
            status='active'
        ).count()
        
        # 2. 活跃告警 - 从Alert表查询
        active_alerts = Alert.objects.filter(
            assigned_doctor=doctor,
            status='pending'
        ).count()
        
        # 获取该医生管理的患者ID列表
        patient_ids = list(DoctorPatientRelation.objects.filter(
            doctor=doctor,
            status='active'
        ).values_list('patient_id', flat=True))
        
        # 3. 今日咨询 - 基于今日数据提交估算
        today = timezone.now().date()
        today_submissions = HealthMetric.objects.filter(
            patient_id__in=patient_ids,
            measured_at__date=today
        ).values('patient').distinct().count() if patient_ids else 0
        
        # 4. 药物依从性 - 从MedicationReminder表计算
        # 获取最近30天的用药记录
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # 该医生患者的用药提醒记录
        medication_reminders = MedicationReminder.objects.filter(
            plan__patient_id__in=patient_ids,
            reminder_time__gte=thirty_days_ago
        ) if patient_ids else MedicationReminder.objects.none()
        
        total_reminders = medication_reminders.count()
        confirmed_reminders = medication_reminders.filter(
            status__in=['confirmed', 'taken']
        ).count()
        
        medication_compliance = round(
            (confirmed_reminders / total_reminders * 100) if total_reminders > 0 else 0, 1
        )
        
        # 5. 患者风险分布
        # 基于患者勾选的慢性疾病计算风险分布
        patient_relations = DoctorPatientRelation.objects.filter(
            doctor=doctor,
            status='active'
        ).select_related('patient')
        
        risk_distribution = {'unassessed': 0, 'healthy': 0, 'low': 0, 'medium': 0, 'high': 0}
        
        for relation in patient_relations:
            patient = relation.patient
            
            # 根据患者的慢性疾病计算风险等级
            risk_level = patient.get_disease_risk_level()
            risk_distribution[risk_level] += 1
        
        # 6. 趋势数据（对比上月）
        last_month = timezone.now() - timedelta(days=30)
        
        # 患者增长趋势
        patients_last_month = DoctorPatientRelation.objects.filter(
            doctor=doctor,
            status='active',
            created_at__lt=last_month
        ).count()
        
        patient_growth = total_patients - patients_last_month
        
        # 告警减少趋势
        alerts_last_month = Alert.objects.filter(
            assigned_doctor=doctor,
            status='pending',
            created_at__lt=last_month
        ).count()
        
        alert_change = active_alerts - alerts_last_month
        
        # 构建响应数据
        dashboard_data = {
            'stats': {
                'totalPatients': total_patients,
                'activeAlerts': active_alerts,
                'todayConsultations': today_submissions,  # 基于今日数据提交估算
                'medicationCompliance': medication_compliance,
            },
            'trends': {
                'patientGrowth': patient_growth,
                'alertReduction': -alert_change,  # 负数表示减少
                'consultationIncrease': max(0, today_submissions - 5),  # 简单估算
                'complianceImprovement': round(medication_compliance - 80, 1),  # 假设基准80%
            },
            'patientRiskDistribution': [
                { 'label': '未评估', 'value': risk_distribution['unassessed'], 'color': '#9E9E9E' },
                { 'label': '健康', 'value': risk_distribution['healthy'], 'color': '#00E676' },
                { 'label': '低风险', 'value': risk_distribution['low'], 'color': '#4CAF50' },
                { 'label': '中风险', 'value': risk_distribution['medium'], 'color': '#FF9800' },
                { 'label': '高风险', 'value': risk_distribution['high'], 'color': '#F44336' }
            ],
            'summary': {
                'dataSource': 'DoctorPatientRelation + Alert + HealthMetric + MedicationReminder',
                'lastUpdated': timezone.now().isoformat(),
                'analysisRange': '最近30天数据分析'
            }
        }
        
        return Response({
            'success': True,
            'data': dashboard_data,
            'message': f'成功获取医生 {doctor.name} 的仪表板数据'
        })
        
    except User.DoesNotExist:
        return Response({
            'error': '医生不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except ValueError:
        return Response({
            'error': '无效的医生ID'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'获取仪表板数据失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def doctor_patients_list(request, doctor_id):
    """
    获取医生管理的患者列表
    
    API路径: /api/health/doctor/{doctor_id}/patients/
    """
    try:
        # 验证医生身份
        if request.user.id != int(doctor_id) or request.user.role != 'doctor':
            return Response({
                'error': '无权限访问其他医生的患者数据'
            }, status=status.HTTP_403_FORBIDDEN)
        
        doctor = User.objects.get(id=doctor_id, role='doctor')
        
        # 获取医生管理的患者
        patient_relations = DoctorPatientRelation.objects.filter(
            doctor=doctor,
            status='active'
        ).select_related('patient').order_by('-created_at')
        
        patients_data = []
        for relation in patient_relations:
            patient = relation.patient
            
            # 获取患者最新的健康数据
            latest_metric = HealthMetric.objects.filter(
                patient=patient
            ).order_by('-measured_at').first()
            
            # 获取患者的告警数量
            active_alerts_count = Alert.objects.filter(
                patient=patient,
                status='pending'
            ).count()
            
            # 评估风险等级
            if active_alerts_count >= 3:
                risk_level = 'high'
            elif active_alerts_count >= 1:
                risk_level = 'medium'
            else:
                risk_level = 'low'
            
            patients_data.append({
                'id': patient.id,
                'name': patient.name,
                'age': patient.age or 0,
                'gender': patient.gender or 'unknown',
                'phone': patient.phone,
                'risk_level': risk_level,
                'active_alerts': active_alerts_count,
                'last_visit': latest_metric.measured_at.isoformat() if latest_metric else None,
                'relationship_created': relation.created_at.isoformat(),
                'notes': relation.notes or ''
            })
        
        return Response({
            'success': True,
            'data': {
                'patients': patients_data,
                'total_count': len(patients_data),
                'doctor_name': doctor.name
            },
            'message': f'获取到 {len(patients_data)} 位患者数据'
        })
        
    except User.DoesNotExist:
        return Response({
            'error': '医生不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'获取患者列表失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)