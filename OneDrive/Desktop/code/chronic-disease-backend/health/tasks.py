"""
同步任务 - 分析患者数据并生成告警
"""
from django.utils import timezone
from datetime import timedelta
from accounts.models import User
from health.alert_analysis_service import AlertAnalysisService
from health.models import Alert
import logging

logger = logging.getLogger(__name__)
def analyze_all_doctors_patients():
    """
    每3天自动分析所有医生的患者数据
    
    执行时间: 每天凌晨2点检查，如果距离上次分析超过3天则执行
    """
    try:
        logger.info("🏥 开始执行定时患者数据分析任务...")
        
        # 获取所有活跃的医生
        doctors = User.objects.filter(role='doctor', is_active=True)
        total_alerts = 0
        analyzed_doctors = 0
        
        alert_service = AlertAnalysisService()
        
        for doctor in doctors:
            try:
                # 检查该医生是否需要分析（距离上次分析超过3天）
                last_analysis = Alert.objects.filter(
                    assigned_doctor=doctor,
                    created_at__gte=timezone.now() - timedelta(days=3)
                ).first()
                
                if not last_analysis:
                    # 执行分析
                    logger.info(f"分析医生 {doctor.name} 的患者数据...")
                    generated_alerts = alert_service.analyze_and_generate_alerts(doctor.id)
                    total_alerts += len(generated_alerts)
                    analyzed_doctors += 1
                    
                    logger.info(f"医生 {doctor.name}: 生成 {len(generated_alerts)} 个告警")
                else:
                    logger.info(f"医生 {doctor.name}: 距离上次分析不足3天，跳过")
                    
            except Exception as e:
                logger.error(f"分析医生 {doctor.name} 数据时出错: {str(e)}")
                continue
        
        logger.info(f"✅ 定时分析完成: 分析 {analyzed_doctors} 位医生，生成 {total_alerts} 个告警")
        
        return {
            'success': True,
            'analyzed_doctors': analyzed_doctors,
            'total_alerts': total_alerts,
            'analysis_time': timezone.now().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"定时分析任务失败: {str(exc)}")
        return {
            'success': False,
            'error': str(exc)
        }


def analyze_single_doctor_patients(doctor_id):
    """
    分析单个医生的患者数据
    
    用途: 手动触发或特定事件触发
    """
    try:
        logger.info(f"🔍 开始分析医生ID {doctor_id} 的患者数据...")
        
        doctor = User.objects.get(id=doctor_id, role='doctor')
        alert_service = AlertAnalysisService()
        
        generated_alerts = alert_service.analyze_and_generate_alerts(doctor_id)
        
        logger.info(f"✅ 分析完成: 医生 {doctor.name} 生成 {len(generated_alerts)} 个告警")
        
        return {
            'success': True,
            'doctor_name': doctor.name,
            'generated_alerts': len(generated_alerts),
            'analysis_time': timezone.now().isoformat()
        }
        
    except User.DoesNotExist:
        error_msg = f"未找到医生ID: {doctor_id}"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg}
    except Exception as e:
        error_msg = f"分析医生 {doctor_id} 数据失败: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg}


def _real_time_health_data_analysis_core(patient_id, metric_type):
    """
    实时健康数据分析核心逻辑
    
    触发时机: 患者提交健康数据后立即执行
    用途: 检测危急情况，立即生成告警
    """
    try:
        logger.info(f"🚨 实时分析患者ID {patient_id} 的 {metric_type} 数据...")
        
        from accounts.models import User
        from health.models import HealthMetric, DoctorPatientRelation
        from datetime import timedelta
        
        patient = User.objects.get(id=patient_id, role='patient')
        
        # 获取患者的医生
        doctor_relations = DoctorPatientRelation.objects.filter(
            patient=patient, 
            status='active'
        )
        
        if not doctor_relations.exists():
            logger.warning(f"患者 {patient.name} 没有分配医生，跳过实时分析")
            return {'success': False, 'error': '患者未分配医生'}
        
        # 获取最新的健康数据
        latest_metric = HealthMetric.objects.filter(
            patient=patient,
            metric_type=metric_type
        ).order_by('-measured_at').first()
        
        if not latest_metric:
            return {'success': False, 'error': '未找到最新健康数据'}
        
        generated_alerts = []
        alert_service = AlertAnalysisService()
        
        # 为每个医生检查是否需要生成紧急告警
        for relation in doctor_relations:
            doctor = relation.doctor
            
            # 检查是否为危急情况
            is_critical = False
            alert_message = ""
            
            if metric_type == 'blood_pressure' and latest_metric.systolic:
                if latest_metric.systolic > 180 or latest_metric.diastolic > 110:
                    is_critical = True
                    alert_message = f"患者血压危急：{latest_metric.systolic}/{latest_metric.diastolic}mmHg"
            elif metric_type == 'blood_glucose' and latest_metric.blood_glucose:
                if latest_metric.blood_glucose > 15.0 or latest_metric.blood_glucose < 3.0:
                    is_critical = True
                    alert_message = f"患者血糖异常：{latest_metric.blood_glucose}mmol/L"
            elif metric_type == 'heart_rate' and latest_metric.heart_rate:
                if latest_metric.heart_rate > 120 or latest_metric.heart_rate < 50:
                    is_critical = True
                    alert_message = f"患者心率异常：{latest_metric.heart_rate}bpm"
            
            if is_critical:
                # 创建紧急告警
                alert = Alert.objects.create(
                    patient=patient,
                    assigned_doctor=doctor,
                    alert_type='threshold_exceeded',
                    title='紧急健康异常',
                    message=f'患者 {patient.name} {alert_message}，请立即关注！',
                    priority='critical',
                    status='pending',
                    related_metric=latest_metric
                )
                
                generated_alerts.append(alert)
                logger.warning(f"🚨 生成紧急告警: {alert_message}")
        
        return {
            'success': True,
            'patient_name': patient.name,
            'metric_type': metric_type,
            'is_critical': len(generated_alerts) > 0,
            'generated_alerts': len(generated_alerts),
            'analysis_time': timezone.now().isoformat()
        }
        
    except User.DoesNotExist:
        error_msg = f"未找到患者ID: {patient_id}"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg}
    except Exception as e:
        error_msg = f"实时分析患者 {patient_id} 数据失败: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg}


def real_time_health_data_analysis(patient_id, metric_type):
    """
    实时健康数据分析 - 同步版本
    
    触发时机: 患者提交健康数据后立即执行
    用途: 检测危急情况，立即生成告警
    """
    return _real_time_health_data_analysis_core(patient_id, metric_type)


def cleanup_old_alerts():
    """
    清理过期告警
    
    执行时间: 每周执行一次
    清理规则: 删除30天前已处理的告警
    """
    try:
        logger.info("🧹 开始清理过期告警...")
        
        cutoff_date = timezone.now() - timedelta(days=30)
        
        # 删除30天前已处理的告警
        deleted_count = Alert.objects.filter(
            status__in=['handled', 'dismissed'],
            handled_at__lt=cutoff_date
        ).delete()[0]
        
        logger.info(f"✅ 清理完成: 删除 {deleted_count} 条过期告警")
        
        return {
            'success': True,
            'deleted_count': deleted_count,
            'cleanup_time': timezone.now().isoformat()
        }
        
    except Exception as e:
        error_msg = f"清理过期告警失败: {str(e)}"
        logger.error(error_msg)
        return {'success': False, 'error': error_msg}


