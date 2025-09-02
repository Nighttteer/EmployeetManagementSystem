from django.db import models
from django.conf import settings
from accounts.models import User


class Medication(models.Model):
    """
    用药信息：系统中预设药品列表

    Master catalog of medications with safety profiles and basic
    categorization for downstream filtering and analytics.
    """
    # 基本信息
    name = models.CharField('药品名称', max_length=200)
    unit = models.CharField('剂量单位', max_length=20)  # mg, ml, 片, 粒等
    instructions = models.TextField('用法说明', blank=True, null=True)
    
    # 药品分类
    CATEGORY_CHOICES = [
        ('antihypertensive', '降压药'),
        ('hypoglycemic', '降糖药'),
        ('lipid_lowering', '降脂药'),
        ('anticoagulant', '抗凝药'),
        ('diuretic', '利尿剂'),
        ('beta_blocker', 'β受体阻滞剂'),
        ('ace_inhibitor', 'ACE抑制剂'),
        ('other', '其他'),
    ]
    category = models.CharField('药品分类', max_length=30, choices=CATEGORY_CHOICES, default='other')
    
    # 药品详情
    generic_name = models.CharField('通用名', max_length=200, blank=True, null=True)
    brand_name = models.CharField('商品名', max_length=200, blank=True, null=True)
    manufacturer = models.CharField('生产厂家', max_length=200, blank=True, null=True)
    specification = models.CharField('规格', max_length=100, blank=True, null=True)  # 例如: 5mg/片
    
    # 安全信息
    contraindications = models.TextField('禁忌症', blank=True, null=True)
    side_effects = models.TextField('副作用', blank=True, null=True)
    interactions = models.TextField('药物相互作用', blank=True, null=True)
    
    # 状态
    is_active = models.BooleanField('启用状态', default=True)
    is_prescription = models.BooleanField('处方药', default=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='创建者')
    
    class Meta:
        db_table = 'medication'
        verbose_name = '药品信息'
        verbose_name_plural = '药品信息'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.unit})"


class MedicationPlan(models.Model):
    """
    用药计划：某位医生为某患者制定的计划

    Prescribed medication plan authored by a doctor for a patient.
    Includes frequency, timing, lifecycle status, and monitoring notes.
    """
    FREQUENCY_CHOICES = settings.MEDICATION_FREQUENCIES
    TIME_CHOICES = settings.MEDICATION_TIMES
    
    # 基本信息
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medication_plans', verbose_name='患者')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prescribed_plans', verbose_name='医生')
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name='plans', verbose_name='药品')
    
    # 用药方案
    dosage = models.FloatField('剂量')
    frequency = models.CharField('频次', max_length=10, choices=FREQUENCY_CHOICES)
    time_of_day = models.JSONField('服药时间', default=list, help_text='服药时间列表，如 ["08:00", "20:00"]')
    
    # 用药周期
    start_date = models.DateField('开始日期')
    end_date = models.DateField('结束日期', null=True, blank=True)
    duration_days = models.PositiveIntegerField('持续天数', null=True, blank=True)
    
    # 特殊说明
    special_instructions = models.TextField('特殊说明', blank=True, null=True)
    dietary_requirements = models.TextField('饮食要求', blank=True, null=True)
    
    # 状态管理
    STATUS_CHOICES = [
        ('active', '进行中'),
        ('completed', '已完成'),
        ('stopped', '已停药'),
        ('paused', '已暂停'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    
    # 监测要求
    requires_monitoring = models.BooleanField('需要监测', default=False)
    monitoring_notes = models.TextField('监测说明', blank=True, null=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'medication_plan'
        verbose_name = '用药计划'
        verbose_name_plural = '用药计划'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', 'status']),
            models.Index(fields=['doctor', 'created_at']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.patient.name} - {self.medication.name} - {self.get_frequency_display()}"
    
    @property
    def is_active(self):
        """判断用药计划是否处于活跃状态 / Determine plan active window and status."""
        from datetime import date
        today = date.today()
        return (self.status == 'active' and 
                self.start_date <= today and 
                (self.end_date is None or self.end_date >= today))
    
    def get_daily_doses(self):
        """获取每日剂量数 / Return expected daily dose count from frequency code."""
        frequency_mapping = {
            'QD': 1, 'BID': 2, 'TID': 3, 'QID': 4,
            'Q12H': 2, 'Q8H': 3, 'Q6H': 4, 'PRN': 0
        }
        return frequency_mapping.get(self.frequency, 1)


class MedicationReminder(models.Model):
    """
    用药提醒记录：系统生成的提醒记录，用于统计依从率

    Reminder instances used to compute adherence metrics and support
    patient notifications.
    """
    STATUS_CHOICES = [
        ('pending', '待服用'),
        ('taken', '已服用'),
        ('missed', '已错过'),
        ('skipped', '已跳过'),
    ]
    
    # 关联信息
    plan = models.ForeignKey(MedicationPlan, on_delete=models.CASCADE, related_name='reminders', verbose_name='用药计划')
    
    # 提醒时间
    reminder_time = models.DateTimeField('提醒时间')
    scheduled_time = models.TimeField('计划服药时间')
    
    # 状态跟踪
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    confirm_time = models.DateTimeField('确认时间', null=True, blank=True)
    
    # 剂量信息
    dosage_taken = models.FloatField('实际服用剂量', null=True, blank=True)
    
    # 备注
    notes = models.TextField('备注', blank=True, null=True)
    side_effects_reported = models.TextField('副作用报告', blank=True, null=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'medication_reminder'
        verbose_name = '用药提醒'
        verbose_name_plural = '用药提醒'
        ordering = ['-reminder_time']
        indexes = [
            models.Index(fields=['plan', 'reminder_time']),
            models.Index(fields=['status', 'reminder_time']),
            models.Index(fields=['reminder_time']),
        ]
    
    def __str__(self):
        return f"{self.plan.patient.name} - {self.plan.medication.name} - {self.reminder_time.strftime('%Y-%m-%d %H:%M')}"
    
    @property
    def is_overdue(self):
        """判断是否已经超时 / True if 30 minutes past reminder when still pending."""
        from django.utils import timezone
        from datetime import timedelta
        
        if self.status != 'pending':
            return False
        
        # 超过提醒时间30分钟视为超时
        overdue_time = self.reminder_time + timedelta(minutes=30)
        return timezone.now() > overdue_time


class MedicationStock(models.Model):
    """
    药品库存管理（可选功能）

    Optional stock management to track personal medication inventory and
    anticipate resupply needs.
    """
    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medication_stocks', verbose_name='患者')
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name='stocks', verbose_name='药品')
    
    # 库存信息
    current_quantity = models.PositiveIntegerField('当前数量')
    unit = models.CharField('单位', max_length=20)  # 盒、瓶、片等
    
    # 有效期管理
    expiry_date = models.DateField('有效期', null=True, blank=True)
    batch_number = models.CharField('批次号', max_length=50, blank=True, null=True)
    
    # 库存阈值
    low_stock_threshold = models.PositiveIntegerField('低库存阈值', default=10)
    
    # 采购信息
    purchase_date = models.DateField('采购日期', null=True, blank=True)
    purchase_price = models.DecimalField('采购价格', max_digits=10, decimal_places=2, null=True, blank=True)
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'medication_stock'
        verbose_name = '药品库存'
        verbose_name_plural = '药品库存'
        unique_together = ['patient', 'medication']
        indexes = [
            models.Index(fields=['patient', 'current_quantity']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.patient.name} - {self.medication.name} - 库存:{self.current_quantity}{self.unit}"
    
    @property
    def is_low_stock(self):
        """判断是否库存不足 / Compare current quantity against threshold."""
        return self.current_quantity <= self.low_stock_threshold
    
    @property
    def is_expired(self):
        """判断是否已过期 / True if expiry_date is before today."""
        from datetime import date
        return self.expiry_date and self.expiry_date < date.today()
    
    @property
    def days_until_expiry(self):
        """距离过期天数 / Days remaining until expiry (0 if past)."""
        if not self.expiry_date:
            return None
        from datetime import date
        delta = self.expiry_date - date.today()
        return delta.days if delta.days > 0 else 0


class MedicationStatusHistory(models.Model):
    """
    用药状态变更历史记录

    Audit trail for plan status changes, attributed to a user with
    timestamps and optional freeform notes.
    """
    STATUS_CHOICES = [
        ('active', '进行中'),
        ('completed', '已完成'),
        ('stopped', '已停药'),
        ('paused', '已暂停'),
    ]
    
    # 关联信息
    plan = models.ForeignKey(MedicationPlan, on_delete=models.CASCADE, related_name='status_history', verbose_name='用药计划')
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='操作人')
    
    # 状态变更信息
    from_status = models.CharField('原状态', max_length=20, choices=STATUS_CHOICES)
    to_status = models.CharField('新状态', max_length=20, choices=STATUS_CHOICES)
    
    # 变更原因和备注
    reason = models.TextField('变更原因', blank=True, null=True)
    notes = models.TextField('附加说明', blank=True, null=True)
    
    # 时间戳
    created_at = models.DateTimeField('变更时间', auto_now_add=True)
    
    class Meta:
        db_table = 'medication_status_history'
        verbose_name = '用药状态变更历史'
        verbose_name_plural = '用药状态变更历史'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['plan', 'created_at']),
            models.Index(fields=['changed_by', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.plan.patient.name} - {self.plan.medication.name} - {self.get_from_status_display()} → {self.get_to_status_display()}"
