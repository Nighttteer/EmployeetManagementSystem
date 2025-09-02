from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Medication, MedicationPlan, MedicationReminder

User = get_user_model()


class MedicationSerializer(serializers.ModelSerializer):
    """药品序列化器"""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Medication
        fields = [
            'id', 'name', 'unit', 'instructions', 'category', 'category_display',
            'generic_name', 'brand_name', 'manufacturer', 'specification',
            'contraindications', 'side_effects', 'interactions',
            'is_active', 'is_prescription'
        ]


class PatientBasicSerializer(serializers.ModelSerializer):
    """患者基本信息序列化器"""
    class Meta:
        model = User
        fields = ['id', 'name', 'phone', 'email']


class DoctorBasicSerializer(serializers.ModelSerializer):
    """医生基本信息序列化器"""
    class Meta:
        model = User
        fields = ['id', 'name', 'phone', 'email']


class MedicationPlanSerializer(serializers.ModelSerializer):
    """用药计划序列化器（查看）"""
    medication = MedicationSerializer(read_only=True)
    patient = PatientBasicSerializer(read_only=True)
    doctor = DoctorBasicSerializer(read_only=True)
    # 暂时移除display字段，避免FieldError
    # frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    # time_of_day_display = serializers.CharField(source='get_time_of_day_display', read_only=True)
    # status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    daily_doses = serializers.IntegerField(source='get_daily_doses', read_only=True)
    
    class Meta:
        model = MedicationPlan
        fields = [
            'id', 'medication', 'patient', 'doctor',
            'dosage', 'frequency', 
            'time_of_day',
            'start_date', 'end_date', 'duration_days',
            'special_instructions', 'dietary_requirements',
            'status', 'requires_monitoring', 'monitoring_notes',
            'is_active', 'daily_doses', 'created_at', 'updated_at'
        ]


class MedicationPlanCreateSerializer(serializers.ModelSerializer):
    """用药计划序列化器（创建/更新）"""
    
    class Meta:
        model = MedicationPlan
        fields = [
            'patient', 'doctor', 'medication',
            'dosage', 'frequency', 'time_of_day',
            'start_date', 'end_date', 'duration_days',
            'special_instructions', 'dietary_requirements',
            'status', 'requires_monitoring', 'monitoring_notes'
        ]
    
    def validate(self, data):
        """验证数据"""
        # 验证患者角色
        patient = data.get('patient')
        if patient and not patient.is_patient:
            raise serializers.ValidationError("指定的用户不是患者")
        
        # 验证医生角色
        doctor = data.get('doctor')
        if doctor and not doctor.is_doctor:
            raise serializers.ValidationError("指定的用户不是医生")
        
        # 验证日期
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError("结束日期不能早于开始日期")
        
        return data


class MedicationReminderSerializer(serializers.ModelSerializer):
    """用药提醒序列化器"""
    plan = MedicationPlanSerializer(read_only=True)
    # 暂时移除display字段，避免FieldError
    # status_display = serializers.CharField(source='get_status_display', read_only=True)
    medication_name = serializers.CharField(source='plan.medication.name', read_only=True)
    patient_name = serializers.CharField(source='plan.patient.name', read_only=True)
    
    class Meta:
        model = MedicationReminder
        fields = [
            'id', 'plan', 'reminder_time', 'scheduled_time',
            'status', 'confirm_time',
            'dosage_taken', 'notes', 'side_effects_reported',
            'medication_name', 'patient_name', 'created_at', 'updated_at'
        ]


class MedicationComplianceSerializer(serializers.Serializer):
    """用药依从性统计序列化器"""
    plan_id = serializers.IntegerField()
    medication_name = serializers.CharField()
    patient_name = serializers.CharField()
    total_reminders = serializers.IntegerField()
    taken_count = serializers.IntegerField()
    missed_count = serializers.IntegerField()
    compliance_rate = serializers.FloatField()
    last_taken = serializers.DateTimeField(allow_null=True)


class MedicationStatsSerializer(serializers.Serializer):
    """用药统计信息序列化器"""
    total_plans = serializers.IntegerField()
    active_plans = serializers.IntegerField()
    completed_plans = serializers.IntegerField()
    stopped_plans = serializers.IntegerField()
    compliance_rate = serializers.FloatField()
    by_category = serializers.ListField(child=serializers.DictField()) 