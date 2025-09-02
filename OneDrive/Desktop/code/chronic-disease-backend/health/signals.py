"""
Django信号处理器 - 实现患者数据提交后的自动触发分析
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from health.models import HealthMetric
from medication.models import MedicationReminder
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=HealthMetric)
def trigger_health_data_analysis(sender, instance, created, **kwargs):
    """
    患者提交健康数据后自动触发分析
    
    触发时机: 患者在APP中填写健康数据并保存到数据库后
    执行逻辑: 立即检查是否为危急情况，如果是则生成紧急告警
    """
    if created:  # 只处理新创建的记录
        logger.info(f"📊 患者 {instance.patient.name} 提交了新的健康数据: {instance.metric_type}")
        
        try:
            # 直接同步执行实时分析
            from health.tasks import real_time_health_data_analysis
            result = real_time_health_data_analysis(
                patient_id=instance.patient.id,
                metric_type=instance.metric_type
            )
            
            if result.get('success'):
                logger.info(f"✅ 已完成患者 {instance.patient.name} 的实时数据分析")
                if result.get('is_critical') and result.get('generated_alerts', 0) > 0:
                    logger.warning(f"🚨 为患者 {instance.patient.name} 生成了 {result.get('generated_alerts')} 个紧急告警")
            else:
                logger.warning(f"⚠️ 分析结果: {result.get('error', '未知错误')}")
            
        except Exception as e:
            logger.error(f"触发实时分析失败: {str(e)}")


@receiver(post_save, sender=MedicationReminder)
def trigger_medication_compliance_check(sender, instance, created, **kwargs):
    """
    患者用药记录更新后检查依从性
    
    触发时机: 患者在APP中确认服药或系统检测到漏服
    执行逻辑: 检查最近的用药依从性，如果连续漏服则生成告警
    """
    if not created and instance.status in ['taken', 'missed']:
        logger.info(f"💊 患者 {instance.plan.patient.name} 用药状态更新: {instance.status}")
        
        try:
            # 检查是否需要生成用药依从性告警
            from datetime import timedelta
            from django.utils import timezone
            from health.models import Alert, DoctorPatientRelation
            
            patient = instance.plan.patient
            medication_name = instance.plan.medication.name
            
            # 检查最近3天的用药记录
            recent_reminders = MedicationReminder.objects.filter(
                plan=instance.plan,
                reminder_time__gte=timezone.now() - timedelta(days=3)
            ).order_by('-reminder_time')[:6]  # 最近6次提醒
            
            # 计算连续漏服次数
            consecutive_missed = 0
            for reminder in recent_reminders:
                if reminder.status == 'missed':
                    consecutive_missed += 1
                else:
                    break
            
            # 如果连续漏服3次或以上，生成告警
            if consecutive_missed >= 3:
                # 获取患者的医生
                doctor_relations = DoctorPatientRelation.objects.filter(
                    patient=patient,
                    status='active'
                )
                
                for relation in doctor_relations:
                    # 检查是否已有相似的告警（避免重复）
                    existing_alert = Alert.objects.filter(
                        patient=patient,
                        assigned_doctor=relation.doctor,
                        alert_type='missed_medication',
                        status='pending',
                        created_at__gte=timezone.now() - timedelta(hours=24)
                    ).filter(message__contains=medication_name).first()
                    
                    if not existing_alert:
                        # 创建用药依从性告警
                        Alert.objects.create(
                            patient=patient,
                            assigned_doctor=relation.doctor,
                            alert_type='missed_medication',
                            title='用药依从性警报',
                            message=f'患者 {patient.name} 连续{consecutive_missed}次未按时服用{medication_name}，依从性严重下降',
                            priority='high',
                            status='pending'
                        )
                        
                        logger.warning(f"🚨 生成用药依从性告警: {patient.name} - {medication_name}")
            
        except Exception as e:
            logger.error(f"检查用药依从性失败: {str(e)}")


def setup_signals():
    """
    设置信号处理器
    
    在Django应用启动时调用此函数来注册信号处理器
    """
    logger.info("📡 健康数据信号处理器已注册")
    logger.info("   - HealthMetric数据提交后自动触发实时分析")
    logger.info("   - MedicationReminder状态更新后检查依从性")