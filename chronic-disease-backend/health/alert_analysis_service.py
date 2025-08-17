"""
智能告警分析服务
基于数据库中的真实患者数据进行分析并生成告警
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Q, Avg, Count
from accounts.models import User
from health.models import HealthMetric, Alert, DoctorPatientRelation, ThresholdSetting
from medication.models import MedicationReminder, MedicationPlan


class AlertTemplates:
    """告警模板类 - 支持中文和英文"""
    
    @staticmethod
    def get_alert_content(alert_type, language='zh', **kwargs):
        """
        获取告警内容模板
        
        Args:
            alert_type: 告警类型
            language: 语言 ('zh' 或 'en')
            **kwargs: 模板变量
        """
        templates = {
            'blood_pressure_anomaly': {
                'zh': {
                    'title': '血压异常警报',
                    'message': f'系统分析患者最近3天血压数据，发现收缩压持续偏高(平均{{value}}mmHg)'
                },
                'en': {
                    'title': 'Blood Pressure Anomaly Alert',
                    'message': f'System analyzed patient blood pressure data for the past 3 days and found sustained high systolic pressure (average {{value}}mmHg)'
                }
            },
            'heart_rate_alert': {
                'zh': {
                    'title': '心率异常告警',
                    'message': f'患者心率{{value}}bpm，超出正常范围'
                },
                'en': {
                    'title': 'Heart Rate Alert',
                    'message': f'Patient heart rate {{value}}bpm exceeds normal range'
                }
            },
            'missed_medication': {
                'zh': {
                    'title': '用药依从性异常',
                    'message': f'系统检测患者最近3天{{medication_name}}依从性下降至{{compliance_rate}}%'
                },
                'en': {
                    'title': 'Medication Compliance Alert',
                    'message': f'System detected decreased medication adherence for {{medication_name}} over the past 3 days, compliance rate: {{compliance_rate}}%'
                }
            },
            'patient_inactivity': {
                'zh': {
                    'title': '患者活动异常',
                    'message': '系统检测患者最近3天数据上传活跃度异常，仅1次记录'
                },
                'en': {
                    'title': 'Patient Activity Anomaly',
                    'message': 'System detected abnormal data upload activity over the past 3 days, only 1 record'
                }
            },
            'glucose_high_rising': {
                'zh': {
                    'title': '血糖偏高且上升 ↗',
                    'message': f'系统分析患者最近3天血糖数据，发现平均值{{value}}mmol/L偏高，且呈上升趋势(+{{trend}})'
                },
                'en': {
                    'title': 'Glucose High and Rising ↗',
                    'message': f'System analyzed patient glucose data for the past 3 days, found average {{value}}mmol/L is high and showing rising trend (+{{trend}})'
                }
            },
            'glucose_high_falling': {
                'zh': {
                    'title': '血糖偏高但改善中 ↘',
                    'message': f'系统分析患者最近3天血糖数据，发现平均值{{value}}mmol/L偏高，但呈下降改善趋势(-{{trend}})'
                },
                'en': {
                    'title': 'Glucose High but Improving ↘',
                    'message': f'System analyzed patient glucose data for the past 3 days, found average {{value}}mmol/L is high but showing improving trend (-{{trend}})'
                }
            },
            'glucose_high_stable': {
                'zh': {
                    'title': '血糖持续偏高 →',
                    'message': f'系统分析患者最近3天血糖数据，发现平均值{{value}}mmol/L持续偏高'
                },
                'en': {
                    'title': 'Glucose Continuously High →',
                    'message': f'System analyzed patient glucose data for the past 3 days, found average {{value}}mmol/L to be continuously high'
                }
            },
            'glucose_normal_rising': {
                'zh': {
                    'title': '血糖上升趋势 ↗',
                    'message': f'系统分析患者最近3天血糖数据，发现平均值{{value}}mmol/L，呈明显上升趋势(+{{trend}})'
                },
                'en': {
                    'title': 'Glucose Rising Trend ↗',
                    'message': f'System analyzed patient glucose data for the past 3 days, found average {{value}}mmol/L showing clear rising trend (+{{trend}})'
                }
            }
        }
        
        if alert_type not in templates:
            # 默认返回中文
            return {
                'title': f'告警类型: {alert_type}',
                'message': '系统检测到异常情况，请及时处理'
            }
        
        template = templates[alert_type].get(language, templates[alert_type]['zh'])
        
        # 格式化消息模板
        try:
            formatted_message = template['message'].format(**kwargs)
        except KeyError:
            # 如果格式化失败，返回原始消息
            formatted_message = template['message']
        
        return {
            'title': template['title'],
            'message': formatted_message
        }


class AlertAnalysisService:
    """告警分析服务 - 每3天分析患者数据生成告警"""
    
    def __init__(self, language='zh'):
        self.analysis_days = 3  # 分析最近3天数据
        self.language = language  # 当前语言设置
        
    def analyze_and_generate_alerts(self, doctor_id):
        """
        分析医生管理的患者数据并生成告警
        
        数据流程:
        1. 查询DoctorPatientRelation获取医生的患者
        2. 从HealthMetric表获取患者最近3天数据
        3. 从MedicationReminder表分析用药依从性
        4. 分析趋势和异常，生成Alert记录
        """
        try:
            doctor = User.objects.get(id=doctor_id, role='doctor')
            
            # 1. 获取医生管理的患者
            patient_relations = DoctorPatientRelation.objects.filter(
                doctor=doctor, 
                status='active'
            ).select_related('patient')
            
            patients = [relation.patient for relation in patient_relations]
            print(f"医生 {doctor.name} 管理 {len(patients)} 位患者")
            
            # 2. 分析每个患者的数据
            generated_alerts = []
            for patient in patients:
                patient_alerts = self._analyze_patient_data(patient, doctor)
                generated_alerts.extend(patient_alerts)
            
            print(f"总共生成 {len(generated_alerts)} 个告警")
            return generated_alerts
            
        except User.DoesNotExist:
            print(f"未找到医生ID: {doctor_id}")
            return []
        except Exception as e:
            print(f"分析过程出错: {str(e)}")
            return []
    
    def _analyze_patient_data(self, patient, doctor):
        """分析单个患者的数据"""
        alerts = []
        
        # 分析时间范围：最近3天
        end_date = timezone.now()
        start_date = end_date - timedelta(days=self.analysis_days)
        
        print(f"分析患者 {patient.name} 从 {start_date.date()} 到 {end_date.date()} 的数据")
        
        # 1. 分析健康指标数据
        health_alerts = self._analyze_health_metrics(patient, doctor, start_date, end_date)
        alerts.extend(health_alerts)
        
        # 2. 分析用药依从性
        medication_alerts = self._analyze_medication_compliance(patient, doctor, start_date, end_date)
        alerts.extend(medication_alerts)
        
        # 3. 分析数据活跃度
        activity_alerts = self._analyze_patient_activity(patient, doctor, start_date, end_date)
        alerts.extend(activity_alerts)
        
        return alerts
    
    def _analyze_health_metrics(self, patient, doctor, start_date, end_date):
        """分析健康指标数据"""
        alerts = []
        
        # 获取患者最近3天的健康指标
        metrics = HealthMetric.objects.filter(
            patient=patient,
            measured_at__gte=start_date,
            measured_at__lte=end_date
        ).order_by('measured_at')
        
        if not metrics.exists():
            return alerts
        
        # 分析血压趋势
        bp_alerts = self._analyze_blood_pressure_trend(patient, doctor, metrics)
        alerts.extend(bp_alerts)
        
        # 分析血糖趋势  
        bg_alerts = self._analyze_blood_glucose_trend(patient, doctor, metrics)
        alerts.extend(bg_alerts)
        
        # 分析心率异常
        hr_alerts = self._analyze_heart_rate_anomaly(patient, doctor, metrics)
        alerts.extend(hr_alerts)
        
        return alerts
    
    def _analyze_blood_pressure_trend(self, patient, doctor, metrics):
        """分析血压趋势"""
        alerts = []
        
        # 获取血压数据
        bp_metrics = metrics.filter(
            metric_type='blood_pressure',
            systolic__isnull=False,
            diastolic__isnull=False
        ).order_by('measured_at')
        
        if bp_metrics.count() < 2:
            return alerts
        
        # 分析趋势
        bp_values = list(bp_metrics.values('measured_at', 'systolic', 'diastolic', 'note'))
        
        # 检查是否持续偏高
        high_bp_count = 0
        total_systolic = 0
        for bp in bp_values:
            if bp['systolic'] > 140:  # 收缩压阈值
                high_bp_count += 1
            total_systolic += bp['systolic']
        
        avg_systolic = total_systolic / len(bp_values)
        
        # 如果连续偏高或平均值超标，生成告警
        if high_bp_count >= 2 or avg_systolic > 140:
            alert_data = {
                'dataRange': f"{bp_values[0]['measured_at'].strftime('%Y-%m-%d')} 至 {bp_values[-1]['measured_at'].strftime('%Y-%m-%d')}",
                'analysisType': '3天血压趋势分析',
                'patientEntries': [
                    {
                        'date': bp['measured_at'].strftime('%Y-%m-%d'),
                        'value': f"{bp['systolic']}/{bp['diastolic']}",
                        'time': bp['measured_at'].strftime('%H:%M'),
                        'note': bp['note'] or ''
                    } for bp in bp_values
                ],
                'trend': '持续偏高' if high_bp_count >= 2 else '平均值超标',
                'avgValue': f"{avg_systolic:.1f}/{sum(bp['diastolic'] for bp in bp_values)/len(bp_values):.1f}"
            }
            
            # 创建告警记录
            alert_content = AlertTemplates.get_alert_content(
                'blood_pressure_anomaly', 
                self.language, 
                value=f"{avg_systolic:.1f}"
            )
            
            alert = Alert.objects.create(
                patient=patient,
                assigned_doctor=doctor,
                alert_type='blood_pressure_anomaly',
                title=alert_content['title'],
                message=alert_content['message'],
                priority='critical' if avg_systolic > 160 else 'high',
                status='pending'
            )
            
            alerts.append({
                'alert': alert,
                'analysis_data': alert_data
            })
            
            print(f"生成血压告警: {patient.name} - 平均收缩压 {avg_systolic:.1f}mmHg")
        
        return alerts
    
    def _analyze_blood_glucose_trend(self, patient, doctor, metrics):
        """分析血糖趋势"""
        alerts = []
        
        # 获取血糖数据
        bg_metrics = metrics.filter(
            metric_type='blood_glucose',
            blood_glucose__isnull=False
        ).order_by('measured_at')
        
        if bg_metrics.count() < 2:
            return alerts
        
        # 分析趋势
        bg_values = list(bg_metrics.values('measured_at', 'blood_glucose', 'note'))
        avg_glucose = sum(bg['blood_glucose'] for bg in bg_values) / len(bg_values)
        
        # 计算真实趋势方向
        first_value = bg_values[0]['blood_glucose']
        last_value = bg_values[-1]['blood_glucose']
        trend_direction = last_value - first_value
        
        # 判断趋势类型
        is_rising = trend_direction > 0.2  # 上升超过0.2mmol/L
        is_falling = trend_direction < -0.2  # 下降超过0.2mmol/L
        
        # 判断血糖水平
        is_high = avg_glucose > 7.0  # 血糖偏高
        is_very_high = avg_glucose > 10.0  # 血糖很高
        
        # 分别处理不同情况
        alert_created = False
        
        # 情况1：血糖高（无论趋势如何）
        if is_high:
            if is_rising:
                # 血糖高且上升 - 最严重
                alert_type = 'glucose_high_rising'
                title = '血糖偏高且上升 ↗'
                message = f'系统分析患者最近3天血糖数据，发现平均值{avg_glucose:.2f}mmol/L偏高，且呈上升趋势(+{abs(trend_direction):.1f})'
                priority = 'critical' if is_very_high else 'high'
                trend_text = '↗ 上升'
                trend_symbol = '↗'
                trend_direction_text = 'rising'
            elif is_falling:
                # 血糖高但下降 - 改善中
                alert_type = 'glucose_high_falling'
                title = '血糖偏高但改善中 ↘'
                message = f'系统分析患者最近3天血糖数据，发现平均值{avg_glucose:.2f}mmol/L偏高，但呈下降改善趋势(-{abs(trend_direction):.1f})'
                priority = 'medium'
                trend_text = '↘ 下降'
                trend_symbol = '↘'
                trend_direction_text = 'falling'
            else:
                # 血糖高且稳定
                alert_type = 'glucose_high_stable'
                title = '血糖持续偏高 →'
                message = f'系统分析患者最近3天血糖数据，发现平均值{avg_glucose:.2f}mmol/L持续偏高'
                priority = 'high' if is_very_high else 'medium'
                trend_text = '→ 稳定'
                trend_symbol = '→'
                trend_direction_text = 'stable'
            alert_created = True
        
        # 情况2：血糖正常但上升趋势（需要预警）
        elif is_rising and avg_glucose > 6.0:  # 接近上限且上升
            alert_type = 'glucose_normal_rising'
            title = '血糖上升趋势 ↗'
            message = f'系统分析患者最近3天血糖数据，发现平均值{avg_glucose:.2f}mmol/L，呈明显上升趋势(+{abs(trend_direction):.1f})'
            priority = 'medium'
            trend_text = '↗ 上升'
            trend_symbol = '↗'
            trend_direction_text = 'rising'
            alert_created = True
        
        if alert_created:
            alert_data = {
                'dataRange': f"{bg_values[0]['measured_at'].strftime('%Y-%m-%d')} 至 {bg_values[-1]['measured_at'].strftime('%Y-%m-%d')}",
                'analysisType': '血糖趋势分析',
                'patientEntries': [
                    {
                        'date': bg['measured_at'].strftime('%Y-%m-%d'),
                        'value': bg['blood_glucose'],
                        'type': bg['note'] or '未标注'
                    } for bg in bg_values
                ],
                'avgValue': round(avg_glucose, 2),
                'trend': trend_text,
                'trendSymbol': trend_symbol,
                'trendDirectionText': trend_direction_text,
                'exceedsTarget': is_high,
                'targetRange': '4.4-7.0',
                'trendDirection': round(trend_direction, 2),
                'trendDirectionAbs': round(abs(trend_direction), 2),
                'firstValue': round(first_value, 2),
                'lastValue': round(last_value, 2),
                'isRising': is_rising,
                'isFalling': is_falling,
                'isStable': not is_rising and not is_falling
            }
            
            # 创建告警记录
            alert_content = AlertTemplates.get_alert_content(
                alert_type, 
                self.language, 
                value=f"{avg_glucose:.2f}",
                trend=f"{abs(trend_direction):.1f}"
            )
            
            alert = Alert.objects.create(
                patient=patient,
                assigned_doctor=doctor,
                alert_type=alert_type,
                title=alert_content['title'],
                message=alert_content['message'],
                priority=priority,
                status='pending'
            )
            
            alerts.append({
                'alert': alert,
                'analysis_data': alert_data
            })
            
            print(f"生成血糖告警: {patient.name} - {title} (平均值{avg_glucose:.2f}mmol/L, 趋势{trend_direction:+.2f})")
        
        return alerts
    
    def _analyze_heart_rate_anomaly(self, patient, doctor, metrics):
        """分析心率异常"""
        alerts = []
        
        # 获取心率数据
        hr_metrics = metrics.filter(
            metric_type='heart_rate',
            heart_rate__isnull=False
        ).order_by('measured_at')
        
        if not hr_metrics.exists():
            return alerts
        
        # 检查异常心率
        hr_values = list(hr_metrics.values('measured_at', 'heart_rate', 'note'))
        
        for hr in hr_values:
            # 如果心率超过100且备注不是运动状态
            if hr['heart_rate'] > 100:
                note = hr['note'] or ''
                is_exercise = any(keyword in note.lower() for keyword in ['运动', '散步', '锻炼', '活动'])
                
                if not is_exercise:
                    # 生成心率异常告警
                    alert_content = AlertTemplates.get_alert_content(
                        'heart_rate_alert', 
                        self.language, 
                        value=f"{hr['heart_rate']}"
                    )
                    
                    alert = Alert.objects.create(
                        patient=patient,
                        assigned_doctor=doctor,
                        alert_type='heart_rate_alert',
                        title=alert_content['title'],
                        message=alert_content['message'],
                        priority='high',
                        status='pending'
                    )
                    
                    alerts.append({
                        'alert': alert,
                        'analysis_data': {
                            'heart_rate': hr['heart_rate'],
                            'measured_at': hr['measured_at'],
                            'note': note
                        }
                    })
        
        return alerts
    
    def _analyze_medication_compliance(self, patient, doctor, start_date, end_date):
        """分析用药依从性"""
        alerts = []
        
        # 获取患者的用药计划
        active_plans = MedicationPlan.objects.filter(
            patient=patient,
            status='active',
            start_date__lte=end_date.date()
        )
        
        # 如果患者没有用药计划，直接返回空列表
        if not active_plans.exists():
            print(f"患者 {patient.name} 没有用药计划，跳过用药依从性分析")
            return alerts
        
        print(f"患者 {patient.name} 有 {active_plans.count()} 个用药计划，开始分析依从性")
        
        for plan in active_plans:
            # 获取最近3天的用药提醒记录
            reminders = MedicationReminder.objects.filter(
                plan=plan,
                reminder_time__gte=start_date,
                reminder_time__lte=end_date
            )
            
            if not reminders.exists():
                print(f"用药计划 {plan.medication.name} 在分析期间内没有提醒记录")
                continue
            
            # 计算依从性
            total_reminders = reminders.count()
            taken_reminders = reminders.filter(status='taken').count()
            compliance_rate = (taken_reminders / total_reminders) * 100 if total_reminders > 0 else 0
            
            print(f"用药计划 {plan.medication.name}: 总提醒 {total_reminders}, 已服用 {taken_reminders}, 依从性 {compliance_rate:.1f}%")
            
            # 如果依从性低于70%，生成告警
            if compliance_rate < 70:
                missed_count = total_reminders - taken_reminders
                
                alert_data = {
                    'dataRange': f"{start_date.strftime('%Y-%m-%d')} 至 {end_date.strftime('%Y-%m-%d')}",
                    'analysisType': '用药依从性分析',
                    'expectedDoses': total_reminders,
                    'recordedDoses': taken_reminders,
                    'complianceRate': f"{compliance_rate:.1f}%",
                    'missedPattern': '连续漏服' if missed_count >= 2 else '偶尔漏服',
                    'medicationName': plan.medication.name
                }
                
                alert = Alert.objects.create(
                    patient=patient,
                    assigned_doctor=doctor,
                    alert_type='missed_medication',
                    title=AlertTemplates.get_alert_content('missed_medication', self.language)['title'],
                    message=AlertTemplates.get_alert_content(
                        'missed_medication', 
                        self.language, 
                        medication_name=plan.medication.name,
                        compliance_rate=f"{compliance_rate:.1f}"
                    )['message'],
                    priority='high' if compliance_rate < 50 else 'medium',
                    status='pending'
                )
                
                alerts.append({
                    'alert': alert,
                    'analysis_data': alert_data
                })
                
                print(f"生成用药告警: {patient.name} - {plan.medication.name} 依从性 {compliance_rate:.1f}%")
            else:
                print(f"用药计划 {plan.medication.name} 依从性良好 ({compliance_rate:.1f}%)，无需告警")
        
        return alerts
    
    def _analyze_patient_activity(self, patient, doctor, start_date, end_date):
        """分析患者数据活跃度"""
        alerts = []
        
        # 统计患者最近3天的数据记录数
        health_metrics_count = HealthMetric.objects.filter(
            patient=patient,
            measured_at__gte=start_date,
            measured_at__lte=end_date
        ).count()
        
        # 检查患者是否有用药计划
        has_medication_plan = MedicationPlan.objects.filter(
            patient=patient,
            status='active',
            start_date__lte=end_date.date()
        ).exists()
        
        medication_records_count = 0
        if has_medication_plan:
            # 只有在患者有用药计划的情况下才计算用药记录
            medication_records_count = MedicationReminder.objects.filter(
                plan__patient=patient,
                reminder_time__gte=start_date,
                reminder_time__lte=end_date,
                status='taken'
            ).count()
            print(f"患者 {patient.name} 有用药计划，用药记录数: {medication_records_count}")
        else:
            print(f"患者 {patient.name} 没有用药计划，跳过用药记录统计")
        
        total_entries = health_metrics_count + medication_records_count
        
        # 根据患者是否有用药计划调整预期记录数
        if has_medication_plan:
            expected_entries = self.analysis_days * 3  # 有用药计划：预期每天至少3条记录
        else:
            expected_entries = self.analysis_days * 2  # 无用药计划：预期每天至少2条记录（健康指标）
        
        activity_rate = (total_entries / expected_entries) * 100 if expected_entries > 0 else 0
        
        print(f"患者 {patient.name} 活跃度分析: 健康记录 {health_metrics_count}, 用药记录 {medication_records_count}, 总计 {total_entries}, 预期 {expected_entries}, 活跃度 {activity_rate:.1f}%")
        
        # 如果活跃度低于30%，生成告警
        if activity_rate < 30:
            alert_data = {
                'dataRange': f"{start_date.strftime('%Y-%m-%d')} 至 {end_date.strftime('%Y-%m-%d')}",
                'analysisType': '患者活跃度分析',
                'expectedEntries': expected_entries,
                'actualEntries': total_entries,
                'activityRate': f"{activity_rate:.1f}%",
                'healthRecords': health_metrics_count,
                'medicationRecords': medication_records_count,
                'hasMedicationPlan': has_medication_plan
            }
            
            alert = Alert.objects.create(
                patient=patient,
                assigned_doctor=doctor,
                alert_type='patient_inactivity',
                title=AlertTemplates.get_alert_content('patient_inactivity', self.language)['title'],
                message=AlertTemplates.get_alert_content('patient_inactivity', self.language)['message'],
                priority='low',
                status='pending'
            )
            
            alerts.append({
                'alert': alert,
                'analysis_data': alert_data
            })
            
            print(f"生成活跃度告警: {patient.name} - 活跃度 {activity_rate:.1f}%")
        else:
            print(f"患者 {patient.name} 活跃度良好 ({activity_rate:.1f}%)，无需告警")
        
        return alerts
    
    def get_doctor_alerts(self, doctor_id):
        """获取医生的所有告警"""
        try:
            alerts = Alert.objects.filter(
                assigned_doctor_id=doctor_id
            ).select_related('patient').order_by('-created_at')
            
            # 统计数据
            stats = {
                'total': alerts.count(),
                'pending': alerts.filter(status='pending').count(),
                'handled': alerts.filter(status='handled').count(),
                'dismissed': alerts.filter(status='dismissed').count(),
                'critical': alerts.filter(priority='critical').count(),
                'high': alerts.filter(priority='high').count(),
                'medium': alerts.filter(priority='medium').count(),
                'low': alerts.filter(priority='low').count(),
            }
            
            # 序列化告警数据
            alerts_data = []
            for alert in alerts:
                alerts_data.append({
                    'id': alert.id,
                    'patientId': alert.patient.id,
                    'patientName': alert.patient.name,
                    'patientAge': alert.patient.age or 0,
                    'type': alert.alert_type,
                    'title': alert.title,
                    'message': alert.message,
                    'priority': alert.priority,
                    'status': alert.status,
                    'createdAt': alert.created_at.isoformat(),
                    'handledAt': alert.handled_at.isoformat() if alert.handled_at else None,
                    'handledBy': alert.handled_by.name if alert.handled_by else None,
                    'notes': alert.notes or '',
                })
            
            return {
                'alerts': alerts_data,
                'stats': stats,
                'lastAnalysisTime': timezone.now().isoformat(),
                'dataSource': 'database'
            }
            
        except Exception as e:
            print(f"获取医生告警数据失败: {str(e)}")
            return {
                'alerts': [],
                'stats': {},
                'error': str(e)
            }


# 使用示例
def create_alert_service_with_language(language='zh'):
    """
    创建指定语言的告警分析服务
    
    Args:
        language: 语言设置 ('zh' 或 'en')
    
    Returns:
        AlertAnalysisService: 配置了语言的告警分析服务
    """
    return AlertAnalysisService(language=language)


# 示例用法
if __name__ == "__main__":
    # 创建中文告警服务
    zh_service = create_alert_service_with_language('zh')
    
    # 创建英文告警服务
    en_service = create_alert_service_with_language('en')
    
    # 测试模板
    print("中文告警模板:")
    zh_content = AlertTemplates.get_alert_content('blood_pressure_anomaly', 'zh', value='160.0')
    print(f"标题: {zh_content['title']}")
    print(f"消息: {zh_content['message']}")
    
    print("\n英文告警模板:")
    en_content = AlertTemplates.get_alert_content('blood_pressure_anomaly', 'en', value='160.0')
    print(f"Title: {en_content['title']}")
    print(f"Message: {en_content['message']}")