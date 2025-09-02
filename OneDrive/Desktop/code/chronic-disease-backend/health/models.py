from django.db import models
from django.conf import settings
from accounts.models import User


class HealthMetric(models.Model):
    """
    健康指标记录：每次患者或医生录入的健康数据
    基于用户提供的数据库架构设计

    Health metric entry recorded per measurement event. Includes common
    vitals and labs with timestamps and authorship fields.
    """
    METRIC_TYPE_CHOICES = settings.HEALTH_METRIC_TYPES
    
    # 基本信息
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='health_metrics', verbose_name='患者')
    measured_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='measured_metrics', verbose_name='录入者')
    last_modified_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='modified_metrics', null=True, blank=True, verbose_name='最后修改者')
    
    # 指标类型
    metric_type = models.CharField('指标类型', max_length=50, choices=METRIC_TYPE_CHOICES, blank=True, null=True)
    
    # 血压相关
    systolic = models.IntegerField('收缩压(mmHg)', null=True, blank=True)
    diastolic = models.IntegerField('舒张压(mmHg)', null=True, blank=True)
    
    # 其他生理指标
    heart_rate = models.IntegerField('心率(bpm)', null=True, blank=True)
    blood_glucose = models.FloatField('血糖(mmol/L)', null=True, blank=True)
    uric_acid = models.FloatField('尿酸(μmol/L)', null=True, blank=True)
    weight = models.FloatField('体重(kg)', null=True, blank=True)
    
    # 血脂四项
    lipids_total = models.FloatField('总胆固醇', null=True, blank=True)
    hdl = models.FloatField('高密度脂蛋白', null=True, blank=True)
    ldl = models.FloatField('低密度脂蛋白', null=True, blank=True)
    triglyceride = models.FloatField('甘油三酯', null=True, blank=True)
    
    # 时间戳
    measured_at = models.DateTimeField('测量时间')
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    # 备注
    note = models.TextField('备注', blank=True, null=True)
    
    class Meta:
        db_table = 'health_metric'
        verbose_name = '健康指标记录'
        verbose_name_plural = '健康指标记录'
        ordering = ['-measured_at']
        indexes = [
            models.Index(fields=['patient', 'measured_at']),
            models.Index(fields=['metric_type', 'measured_at']),
            models.Index(fields=['measured_at']),
        ]
    
    def __str__(self):
        return f"{self.patient.name} - {self.get_metric_type_display()} - {self.measured_at.strftime('%Y-%m-%d')}"
    
    def get_primary_value(self):
        """
        获取该指标的主要值

        Return the primary value depending on `metric_type`. For blood
        pressure, returns a "systolic/diastolic" string if both exist.
        """
        if self.metric_type == 'blood_pressure':
            return f"{self.systolic}/{self.diastolic}" if self.systolic and self.diastolic else None
        elif self.metric_type == 'blood_glucose':
            return self.blood_glucose
        elif self.metric_type == 'heart_rate':
            return self.heart_rate
        elif self.metric_type == 'weight':
            return self.weight
        elif self.metric_type == 'uric_acid':
            return self.uric_acid
        elif self.metric_type == 'lipids':
            return self.lipids_total
        return None


class HealthRecord(models.Model):
    """
    健康档案：汇总性病人资料，由医生定期维护

    Consolidated longitudinal patient health record maintained by
    doctors, complementing per-event `HealthMetric` entries.
    """
    patient = models.OneToOneField(User, on_delete=models.CASCADE, related_name='health_record', verbose_name='患者')
    
    # 健康概况
    summary = models.TextField('健康概况汇总', blank=True, null=True)
    diagnosis = models.TextField('医生诊断信息', blank=True, null=True)
    allergies = models.TextField('过敏史', blank=True, null=True)
    history = models.TextField('既往病史', blank=True, null=True)
    
    # 基本信息
    blood_type = models.CharField('血型', max_length=10, blank=True, null=True)
    smoking_status = models.CharField('吸烟状况', max_length=20, blank=True, null=True)
    family_history = models.TextField('家族史', blank=True, null=True)
    
    # 时间戳
    last_updated = models.DateTimeField('最后更新时间', auto_now=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        db_table = 'health_record'
        verbose_name = '健康档案'
        verbose_name_plural = '健康档案'
    
    def __str__(self):
        return f"{self.patient.name}的健康档案"


class ThresholdSetting(models.Model):
    """
    指标预警阈值设定（系统级默认或医生个性化设置）

    Alert threshold configuration, system-wide defaults or doctor-level
    personalization to tailor sensitivity by demographics and conditions.
    """
    METRIC_TYPE_CHOICES = settings.HEALTH_METRIC_TYPES
    GENDER_CHOICES = settings.GENDER_CHOICES
    
    # 指标配置
    metric_type = models.CharField('指标类型', max_length=50, choices=METRIC_TYPE_CHOICES)
    min_value = models.FloatField('最低警戒值', null=True, blank=True)
    max_value = models.FloatField('最高警戒值', null=True, blank=True)
    
    # 个性化配置
    gender = models.CharField('性别', max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    age_range = models.CharField('年龄范围', max_length=20, null=True, blank=True)  # 例如: "18-65"
    disease_type = models.CharField('疾病类型', max_length=100, null=True, blank=True)
    
    # 创建信息
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='配置者')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    is_active = models.BooleanField('是否启用', default=True)
    
    # 描述信息
    name = models.CharField('阈值名称', max_length=100)
    description = models.TextField('描述', blank=True, null=True)
    
    class Meta:
        db_table = 'threshold_setting'
        verbose_name = '预警阈值设定'
        verbose_name_plural = '预警阈值设定'
        indexes = [
            models.Index(fields=['metric_type', 'is_active']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.get_metric_type_display()}"


class DoctorAdvice(models.Model):
    """
    医生建议记录：医生向患者提供的建议反馈

    Doctor-to-patient advice entity with optional linkage to a triggering
    health metric. Supports priority and read tracking.
    """
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_advice', verbose_name='患者')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_advice', verbose_name='医生')
    
    # 建议内容
    content = models.TextField('建议内容')
    advice_time = models.DateTimeField('建议时间', auto_now_add=True)
    
    # 关联的健康指标（可选）
    related_metric = models.ForeignKey(HealthMetric, on_delete=models.SET_NULL, null=True, blank=True, 
                                     related_name='related_advice', verbose_name='相关异常指标')
    
    # 建议类型和优先级
    ADVICE_TYPE_CHOICES = [
        ('general', '一般建议'),
        ('medication', '用药建议'),
        ('lifestyle', '生活方式'),
        ('diet', '饮食建议'),
        ('exercise', '运动建议'),
        ('urgent', '紧急建议'),
    ]
    advice_type = models.CharField('建议类型', max_length=20, choices=ADVICE_TYPE_CHOICES, default='general')
    
    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '紧急'),
    ]
    priority = models.CharField('优先级', max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # 状态跟踪
    is_read = models.BooleanField('已读', default=False)
    read_at = models.DateTimeField('阅读时间', null=True, blank=True)
    
    class Meta:
        db_table = 'doctor_advice'
        verbose_name = '医生建议'
        verbose_name_plural = '医生建议'
        ordering = ['-advice_time']
        indexes = [
            models.Index(fields=['patient', 'advice_time']),
            models.Index(fields=['doctor', 'advice_time']),
            models.Index(fields=['priority', 'advice_time']),
        ]
    
    def __str__(self):
        return f"Dr.{self.doctor.name} -> {self.patient.name}: {self.content[:50]}..."


class MedicalHistory(models.Model):
    """
    医疗病历记录：用于 Patient Details -> Medical History 的真实数据

    独立于 DoctorAdvice，结构更贴近病历卡片展示（标题/类型/内容/日期）。
    """
    HISTORY_TYPE_CHOICES = [
        ('follow_up', 'Follow-up'),
        ('examination', 'Examination'),
        ('diagnosis', 'Diagnosis'),
        ('treatment', 'Treatment'),
        ('note', 'Note'),
    ]

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medical_histories', verbose_name='患者')
    doctor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_medical_histories', verbose_name='创建医生')
    title = models.CharField('标题', max_length=200)
    content = models.TextField('内容')
    history_type = models.CharField('类型', max_length=32, choices=HISTORY_TYPE_CHOICES, default='note')
    occurred_date = models.DateField('发生日期')

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'medical_history'
        verbose_name = '病历记录'
        verbose_name_plural = '病历记录'
        ordering = ['-occurred_date', '-created_at']
        indexes = [
            models.Index(fields=['patient', 'occurred_date']),
            models.Index(fields=['history_type', 'occurred_date']),
        ]

    def __str__(self):
        return f"{self.title} - {self.patient.name} ({self.occurred_date})"


class DoctorPatientRelation(models.Model):
    """
    医患绑定关系（可选，用于医生筛选所管理患者）

    Binding relation used by permission utilities to scope doctor access
    to their patients (active relations only).
    """
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='patients', verbose_name='医生')
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctors', verbose_name='患者')
    
    # 关系信息
    created_at = models.DateTimeField('建立时间', auto_now_add=True)
    is_primary = models.BooleanField('主治医生', default=False)
    status = models.CharField('状态', max_length=20, choices=[
        ('active', '活跃'),
        ('inactive', '不活跃'),
        ('transferred', '已转诊'),
    ], default='active')
    
    # 备注
    notes = models.TextField('备注', blank=True, null=True)
    
    class Meta:
        db_table = 'doctor_patient_relation'
        verbose_name = '医患关系'
        verbose_name_plural = '医患关系'
        unique_together = ['doctor', 'patient']
        indexes = [
            models.Index(fields=['doctor', 'status']),
            models.Index(fields=['patient', 'status']),
        ]
    
    def __str__(self):
        return f"Dr.{self.doctor.name} - {self.patient.name}"


class Alert(models.Model):
    """
    健康告警模型

    Health alert entity generated by analysis (thresholds, trends,
    adherence) with status/priorities and handling metadata.
    """
    ALERT_TYPES = [
        ('threshold_exceeded', '阈值超标'),
        ('missed_medication', '漏服药物'),
        ('abnormal_trend', '异常趋势'),
        ('system_notification', '系统通知'),
    ]
    
    STATUS_CHOICES = settings.ALERT_STATUS_CHOICES
    
    # 基本信息
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alerts', verbose_name='患者')
    assigned_doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_alerts', 
                                      null=True, blank=True, verbose_name='分配医生')
    
    # 告警内容
    alert_type = models.CharField('告警类型', max_length=30, choices=ALERT_TYPES)
    title = models.CharField('告警标题', max_length=200)
    message = models.TextField('告警内容')
    
    # 关联数据
    related_metric = models.ForeignKey(HealthMetric, on_delete=models.CASCADE, null=True, blank=True,
                                     related_name='alerts', verbose_name='相关指标')
    
    # 状态管理
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField('优先级', max_length=10, choices=[
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('critical', '危急'),
    ], default='medium')
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    handled_at = models.DateTimeField('处理时间', null=True, blank=True)
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='handled_alerts', verbose_name='处理人')
    
    # 处理记录
    action_taken = models.TextField('处理措施', blank=True, null=True)
    notes = models.TextField('处理备注', blank=True, null=True)
    
    class Meta:
        db_table = 'alert'
        verbose_name = '健康告警'
        verbose_name_plural = '健康告警'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['assigned_doctor', 'status']),
            models.Index(fields=['priority', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.patient.name} - {self.title}"
