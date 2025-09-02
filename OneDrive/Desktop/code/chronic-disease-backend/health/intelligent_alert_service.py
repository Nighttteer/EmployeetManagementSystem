"""
智能异常提醒服务
结合用药服从性和健康指标进行智能分析和提醒
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Avg, Q
from django.conf import settings
from typing import List, Dict, Tuple, Optional

from .models import Alert, HealthMetric, ThresholdSetting
from accounts.models import User

# 延迟导入medication模块以避免循环导入
def get_medication_models():
    """延迟导入medication模块"""
    try:
        from medication.models import MedicationReminder, MedicationPlan
        return MedicationReminder, MedicationPlan
    except ImportError:
        return None, None


class IntelligentAlertService:
    """智能异常提醒服务类"""
    
    def __init__(self):
        self.alert_rules = {
            'medication_adherence': {
                'critical': 0.5,  # 依从性低于50%
                'high': 0.7,      # 依从性低于70%
                'medium': 0.85    # 依从性低于85%
            },
            'consecutive_missed': {
                'critical': 3,    # 连续漏服3次
                'high': 2,        # 连续漏服2次
                'medium': 1       # 连续漏服1次但有其他风险因素
            },
            'health_deterioration': {
                'trend_days': 7,   # 分析最近7天趋势
                'threshold_multiplier': 1.2  # 阈值倍数
            }
        }

    def analyze_patient_alerts(self, patient_id: int, doctor_id: int) -> List[Dict]:
        """
        分析单个病人的智能提醒
        
        Args:
            patient_id: 病人ID
            doctor_id: 医生ID
            
        Returns:
            List[Dict]: 生成的提醒列表
        """
        try:
            patient = User.objects.get(id=patient_id, role='patient')
            doctor = User.objects.get(id=doctor_id, role='doctor')
            
            alerts = []
            
            # 1. 分析用药依从性
            medication_alerts = self._analyze_medication_adherence(patient, doctor)
            alerts.extend(medication_alerts)
            
            # 2. 分析健康指标异常趋势
            health_alerts = self._analyze_health_trends(patient, doctor)
            alerts.extend(health_alerts)
            
            # 3. 分析关联风险（用药依从性 + 健康指标恶化）
            correlation_alerts = self._analyze_correlation_risks(patient, doctor)
            alerts.extend(correlation_alerts)
            
            # 4. 分析长期趋势预警
            trend_alerts = self._analyze_long_term_trends(patient, doctor)
            alerts.extend(trend_alerts)
            
            return alerts
            
        except User.DoesNotExist:
            return []
        except Exception as e:
            print(f"分析病人提醒时出错: {e}")
            return []

    def _analyze_medication_adherence(self, patient: User, doctor: User) -> List[Dict]:
        """分析用药依从性相关提醒"""
        alerts = []
        
        # 获取最近30天的用药记录
        recent_date = timezone.now() - timedelta(days=30)
        
        # 获取medication模型
        MedicationReminder, MedicationPlan = get_medication_models()
        if not MedicationReminder or not MedicationPlan:
            return []  # 如果medication模块不可用，返回空列表
        
        # 按用药计划分析依从性
        plans = MedicationPlan.objects.filter(
            patient=patient,
            doctor=doctor,
            status='active'
        )
        
        for plan in plans:
            reminders = MedicationReminder.objects.filter(
                plan=plan,
                reminder_time__gte=recent_date
            )
            
            if not reminders.exists():
                continue
                
            total_reminders = reminders.count()
            taken_reminders = reminders.filter(status='taken').count()
            missed_reminders = reminders.filter(status='missed').count()
            
            # 计算依从性
            adherence_rate = taken_reminders / total_reminders if total_reminders > 0 else 0
            
            # 分析连续漏服情况
            consecutive_missed = self._get_consecutive_missed_count(reminders)
            
            # 生成依从性相关提醒
            priority = self._get_adherence_priority(adherence_rate, consecutive_missed)
            
            if priority:
                alert_data = {
                    'patient': patient,
                    'assigned_doctor': doctor,
                    'alert_type': 'missed_medication',
                    'priority': priority,
                    'title': f'{patient.name} - {plan.medication.name}用药依从性异常',
                    'message': self._generate_adherence_message(
                        plan, adherence_rate, consecutive_missed, missed_reminders
                    ),
                    'metadata': {
                        'medication_plan_id': plan.id,
                        'adherence_rate': adherence_rate,
                        'consecutive_missed': consecutive_missed,
                        'total_reminders': total_reminders,
                        'missed_count': missed_reminders
                    }
                }
                alerts.append(alert_data)
        
        return alerts

    def _analyze_health_trends(self, patient: User, doctor: User) -> List[Dict]:
        """分析健康指标趋势异常"""
        alerts = []
        
        # 分析最近的健康指标趋势
        analysis_period = timezone.now() - timedelta(days=self.alert_rules['health_deterioration']['trend_days'])
        
        # 获取患者的健康指标数据
        metrics = HealthMetric.objects.filter(
            patient=patient,
            measured_at__gte=analysis_period
        ).order_by('metric_type', 'measured_at')
        
        # 按指标类型分组分析
        metrics_by_type = {}
        for metric in metrics:
            if metric.metric_type not in metrics_by_type:
                metrics_by_type[metric.metric_type] = []
            metrics_by_type[metric.metric_type].append(metric)
        
        for metric_type, metric_list in metrics_by_type.items():
            if len(metric_list) < 3:  # 至少需要3个数据点
                continue
                
            trend_alert = self._analyze_metric_trend(metric_type, metric_list, patient, doctor)
            if trend_alert:
                alerts.append(trend_alert)
        
        return alerts

    def _analyze_correlation_risks(self, patient: User, doctor: User) -> List[Dict]:
        """分析用药依从性与健康指标恶化的关联风险"""
        alerts = []
        
        # 获取最近的依从性数据
        recent_date = timezone.now() - timedelta(days=14)
        
        # 获取medication模型
        MedicationReminder, MedicationPlan = get_medication_models()
        if not MedicationReminder or not MedicationPlan:
            return []  # 如果medication模块不可用，返回空列表
        
        # 计算整体依从性
        recent_reminders = MedicationReminder.objects.filter(
            plan__patient=patient,
            plan__doctor=doctor,
            reminder_time__gte=recent_date
        )
        
        if recent_reminders.exists():
            total_reminders = recent_reminders.count()
            taken_reminders = recent_reminders.filter(status='taken').count()
            overall_adherence = taken_reminders / total_reminders
            
            # 同时获取最近的健康指标
            recent_metrics = HealthMetric.objects.filter(
                patient=patient,
                measured_at__gte=recent_date
            ).order_by('-measured_at')
            
            # 检查是否存在依从性差且健康指标恶化的情况
            if overall_adherence < 0.8 and recent_metrics.exists():
                deteriorated_metrics = []
                
                for metric in recent_metrics[:5]:  # 检查最近5条记录
                    status = self._evaluate_metric_status(metric, patient)
                    if status in ['warning', 'danger']:
                        deteriorated_metrics.append(metric)
                
                if deteriorated_metrics:
                    alert_data = {
                        'patient': patient,
                        'assigned_doctor': doctor,
                        'alert_type': 'abnormal_trend',
                        'priority': 'high',
                        'title': f'{patient.name} - 用药依从性差且健康指标恶化',
                        'message': f'患者近期用药依从性为{overall_adherence:.1%}，'
                                 f'同时检测到{len(deteriorated_metrics)}项健康指标异常，'
                                 f'建议及时干预调整治疗方案。',
                        'metadata': {
                            'adherence_rate': overall_adherence,
                            'abnormal_metrics': [m.metric_type for m in deteriorated_metrics],
                            'correlation_risk': True
                        }
                    }
                    alerts.append(alert_data)
        
        return alerts

    def _analyze_long_term_trends(self, patient: User, doctor: User) -> List[Dict]:
        """分析长期趋势预警"""
        alerts = []
        
        # 分析最近3个月的趋势
        long_term_date = timezone.now() - timedelta(days=90)
        
        # 获取长期健康数据
        long_term_metrics = HealthMetric.objects.filter(
            patient=patient,
            measured_at__gte=long_term_date
        ).order_by('metric_type', 'measured_at')
        
        # 获取medication模型
        MedicationReminder, MedicationPlan = get_medication_models()
        if not MedicationReminder or not MedicationPlan:
            return []  # 如果medication模块不可用，返回空列表
        
        # 获取长期用药依从性
        long_term_reminders = MedicationReminder.objects.filter(
            plan__patient=patient,
            plan__doctor=doctor,
            reminder_time__gte=long_term_date
        )
        
        if long_term_reminders.exists():
            # 按月分析依从性趋势
            monthly_adherence = self._calculate_monthly_adherence(long_term_reminders)
            
            # 检查依从性是否有恶化趋势
            if len(monthly_adherence) >= 2:
                trend = self._calculate_trend(monthly_adherence)
                
                if trend < -0.1:  # 依从性下降超过10%
                    alert_data = {
                        'patient': patient,
                        'assigned_doctor': doctor,
                        'alert_type': 'abnormal_trend',
                        'priority': 'medium',
                        'title': f'{patient.name} - 长期用药依从性下降趋势',
                        'message': f'患者最近3个月用药依从性呈下降趋势，'
                                 f'月度依从性分别为：{", ".join([f"{rate:.1%}" for rate in monthly_adherence])}，'
                                 f'建议关注并采取干预措施。',
                        'metadata': {
                            'trend_type': 'long_term_adherence_decline',
                            'monthly_rates': monthly_adherence,
                            'trend_slope': trend
                        }
                    }
                    alerts.append(alert_data)
        
        return alerts

    def _get_consecutive_missed_count(self, reminders) -> int:
        """计算连续漏服次数"""
        recent_reminders = reminders.order_by('-reminder_time')[:10]
        consecutive_count = 0
        
        for reminder in recent_reminders:
            if reminder.status == 'missed':
                consecutive_count += 1
            else:
                break
                
        return consecutive_count

    def _get_adherence_priority(self, adherence_rate: float, consecutive_missed: int) -> Optional[str]:
        """根据依从性率和连续漏服次数确定优先级"""
        rules = self.alert_rules
        
        # 连续漏服优先级判断
        if consecutive_missed >= rules['consecutive_missed']['critical']:
            return 'critical'
        elif consecutive_missed >= rules['consecutive_missed']['high']:
            return 'high'
        
        # 依从性率优先级判断
        if adherence_rate <= rules['medication_adherence']['critical']:
            return 'critical'
        elif adherence_rate <= rules['medication_adherence']['high']:
            return 'high'
        elif adherence_rate <= rules['medication_adherence']['medium']:
            return 'medium'
        
        return None

    def _generate_adherence_message(self, plan, adherence_rate: float, 
                                  consecutive_missed: int, missed_count: int) -> str:
        """生成依从性提醒消息"""
        medication_name = plan.medication.name
        patient_name = plan.patient.name
        
        message = f'患者{patient_name}的{medication_name}用药依从性为{adherence_rate:.1%}'
        
        if consecutive_missed > 0:
            message += f'，连续漏服{consecutive_missed}次'
        
        if missed_count > 0:
            message += f'，近30天共漏服{missed_count}次'
        
        # 添加建议
        if adherence_rate < 0.5:
            message += '。建议立即联系患者，重新评估治疗方案。'
        elif adherence_rate < 0.7:
            message += '。建议加强患者教育，考虑调整用药方案。'
        else:
            message += '。建议关注并提醒患者按时用药。'
        
        return message

    def _analyze_metric_trend(self, metric_type: str, metric_list: List, 
                            patient: User, doctor: User) -> Optional[Dict]:
        """分析单个指标的趋势"""
        if len(metric_list) < 3:
            return None
        
        # 提取数值进行趋势分析
        values = []
        for metric in metric_list:
            if metric_type == 'blood_pressure':
                values.append(metric.systolic)  # 使用收缩压
            elif metric_type == 'blood_glucose':
                values.append(metric.blood_glucose)
            elif metric_type == 'heart_rate':
                values.append(metric.heart_rate)
            elif metric_type == 'weight':
                values.append(metric.weight)
            elif metric_type == 'uric_acid':
                values.append(metric.uric_acid)
        
        if not values:
            return None
        
        # 计算趋势
        trend = self._calculate_trend(values)
        latest_value = values[-1]
        
        # 获取阈值设置
        threshold = self._get_patient_threshold(patient, metric_type)
        
        # 判断是否需要提醒
        is_trending_up = trend > 0.1  # 上升趋势
        is_above_threshold = self._is_above_threshold(latest_value, threshold, metric_type)
        
        if is_trending_up and is_above_threshold:
            priority = 'high' if latest_value > threshold.get('danger', float('inf')) else 'medium'
            
            return {
                'patient': patient,
                'assigned_doctor': doctor,
                'alert_type': 'abnormal_trend',
                'priority': priority,
                'title': f'{patient.name} - {metric_type}异常趋势',
                'message': f'患者{metric_type}呈上升趋势，最新值为{latest_value}，'
                         f'已超出正常范围，建议及时调整治疗方案。',
                'metadata': {
                    'metric_type': metric_type,
                    'trend_slope': trend,
                    'latest_value': latest_value,
                    'threshold_exceeded': True
                }
            }
        
        return None

    def _calculate_trend(self, values: List[float]) -> float:
        """计算趋势斜率"""
        if len(values) < 2:
            return 0
        
        x = list(range(len(values)))
        y = values
        
        # 简单线性回归计算斜率
        n = len(values)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(x[i] ** 2 for i in range(n))
        
        if n * sum_x2 - sum_x * sum_x == 0:
            return 0
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        return slope

    def _calculate_monthly_adherence(self, reminders) -> List[float]:
        """计算月度依从性"""
        monthly_data = {}
        
        for reminder in reminders:
            month_key = reminder.reminder_time.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {'total': 0, 'taken': 0}
            
            monthly_data[month_key]['total'] += 1
            if reminder.status == 'taken':
                monthly_data[month_key]['taken'] += 1
        
        # 计算每月依从性率
        monthly_rates = []
        for month in sorted(monthly_data.keys()):
            data = monthly_data[month]
            rate = data['taken'] / data['total'] if data['total'] > 0 else 0
            monthly_rates.append(rate)
        
        return monthly_rates

    def _evaluate_metric_status(self, metric: HealthMetric, patient: User) -> str:
        """评估健康指标状态"""
        # 这里可以复用现有的evaluateHealthStatus函数逻辑
        # 简化版本，实际应该调用前端的evaluateHealthStatus函数
        return 'normal'  # 临时返回，需要实现具体逻辑

    def _get_patient_threshold(self, patient: User, metric_type: str) -> Dict:
        """获取患者的个性化阈值设置"""
        # 查找个性化阈值设置
        threshold_setting = ThresholdSetting.objects.filter(
            created_by__in=patient.doctors.all(),
            metric_type=metric_type,
            is_active=True
        ).first()
        
        if threshold_setting:
            return {
                'warning': threshold_setting.min_value,
                'danger': threshold_setting.max_value
            }
        
        # 返回默认阈值
        default_thresholds = {
            'blood_pressure': {'warning': 140, 'danger': 180},
            'blood_glucose': {'warning': 7.0, 'danger': 11.0},
            'heart_rate': {'warning': 100, 'danger': 120},
        }
        
        return default_thresholds.get(metric_type, {'warning': 0, 'danger': 0})

    def _is_above_threshold(self, value: float, threshold: Dict, metric_type: str) -> bool:
        """判断是否超出阈值"""
        warning_threshold = threshold.get('warning', float('inf'))
        return value >= warning_threshold

    def generate_alerts_for_all_patients(self, doctor_id: int) -> List[Dict]:
        """为医生的所有病人生成智能提醒"""
        try:
            doctor = User.objects.get(id=doctor_id, role='doctor')
            
            # 获取医生负责的患者（基于医患关系表）
            from .models import DoctorPatientRelation
            patient_relations = DoctorPatientRelation.objects.filter(
                doctor=doctor, status='active'
            ).select_related('patient')
            patients = [relation.patient for relation in patient_relations]
            
            all_alerts = []
            
            for patient in patients:
                patient_alerts = self.analyze_patient_alerts(patient.id, doctor_id)
                all_alerts.extend(patient_alerts)
            
            # 创建数据库记录
            self._create_alert_records(all_alerts)
            
            return all_alerts
            
        except User.DoesNotExist:
            return []
        except Exception as e:
            print(f"生成所有病人提醒时出错: {e}")
            return []

    def _create_alert_records(self, alerts_data: List[Dict]) -> None:
        """创建告警记录到数据库"""
        for alert_data in alerts_data:
            # 检查是否已存在相似的未处理告警
            existing_alert = Alert.objects.filter(
                patient=alert_data['patient'],
                alert_type=alert_data['alert_type'],
                status='pending',
                created_at__gte=timezone.now() - timedelta(hours=24)
            ).first()
            
            if not existing_alert:
                Alert.objects.create(**alert_data)


# 实例化服务
intelligent_alert_service = IntelligentAlertService()