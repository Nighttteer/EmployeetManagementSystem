from rest_framework import serializers
from django.utils import timezone
from .models import HealthMetric, HealthRecord, ThresholdSetting, DoctorAdvice, Alert
from accounts.models import User


class HealthMetricSerializer(serializers.ModelSerializer):
    """健康指标序列化器"""
    measured_by_name = serializers.CharField(source='measured_by.name', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    
    class Meta:
        model = HealthMetric
        fields = [
            'id', 'patient', 'measured_by', 'last_modified_by',
            'metric_type', 'systolic', 'diastolic', 'heart_rate',
            'blood_glucose', 'uric_acid', 'weight', 'lipids_total',
            'hdl', 'ldl', 'triglyceride', 'measured_at', 'updated_at',
            'note', 'measured_by_name', 'patient_name'
        ]
        read_only_fields = ['id', 'updated_at', 'measured_by_name', 'patient_name']
    
    def validate_measured_at(self, value):
        """验证测量时间"""
        if value > timezone.now():
            raise serializers.ValidationError("测量时间不能是未来时间")
        return value
    
    def validate(self, attrs):
        """验证健康指标数据"""
        metric_type = attrs.get('metric_type')
        
        # 根据指标类型验证相应字段
        if metric_type == 'blood_pressure':
            if not attrs.get('systolic') or not attrs.get('diastolic'):
                raise serializers.ValidationError("血压指标需要输入收缩压和舒张压")
            if attrs.get('systolic') <= attrs.get('diastolic'):
                raise serializers.ValidationError("收缩压应该大于舒张压")
        
        elif metric_type == 'blood_glucose':
            if not attrs.get('blood_glucose'):
                raise serializers.ValidationError("血糖指标需要输入血糖值")
        
        elif metric_type == 'heart_rate':
            if not attrs.get('heart_rate'):
                raise serializers.ValidationError("心率指标需要输入心率值")
        
        elif metric_type == 'weight':
            if not attrs.get('weight'):
                raise serializers.ValidationError("体重指标需要输入体重值")
        
        elif metric_type == 'uric_acid':
            if not attrs.get('uric_acid'):
                raise serializers.ValidationError("尿酸指标需要输入尿酸值")
        
        elif metric_type == 'lipids':
            if not attrs.get('lipids_total'):
                raise serializers.ValidationError("血脂指标需要输入总胆固醇值")
        
        return attrs


class HealthRecordSerializer(serializers.ModelSerializer):
    """健康档案序列化器"""
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    
    class Meta:
        model = HealthRecord
        fields = [
            'id', 'patient', 'summary', 'diagnosis', 'allergies',
            'history', 'blood_type', 'smoking_status', 'family_history',
            'last_updated', 'created_at', 'patient_name'
        ]
        read_only_fields = ['id', 'last_updated', 'created_at', 'patient_name']


class ThresholdSettingSerializer(serializers.ModelSerializer):
    """预警阈值设定序列化器"""
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    
    class Meta:
        model = ThresholdSetting
        fields = [
            'id', 'metric_type', 'min_value', 'max_value', 'gender',
            'age_range', 'disease_type', 'created_by', 'created_at',
            'is_active', 'name', 'description', 'created_by_name'
        ]
        read_only_fields = ['id', 'created_at', 'created_by_name']


class DoctorAdviceSerializer(serializers.ModelSerializer):
    """医生建议序列化器"""
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    related_metric_info = serializers.SerializerMethodField()
    
    class Meta:
        model = DoctorAdvice
        fields = [
            'id', 'patient', 'doctor', 'content', 'advice_time',
            'related_metric', 'advice_type', 'priority', 'is_read',
            'read_at', 'patient_name', 'doctor_name', 'related_metric_info'
        ]
        read_only_fields = ['id', 'advice_time', 'patient_name', 'doctor_name']
    
    def get_related_metric_info(self, obj):
        """获取相关指标信息"""
        if obj.related_metric:
            return {
                'metric_type': obj.related_metric.metric_type,
                'measured_at': obj.related_metric.measured_at,
                'primary_value': obj.related_metric.get_primary_value()
            }
        return None


class AlertSerializer(serializers.ModelSerializer):
    """健康告警序列化器"""
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    assigned_doctor_name = serializers.CharField(source='assigned_doctor.name', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.name', read_only=True)
    related_metric_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Alert
        fields = [
            'id', 'patient', 'assigned_doctor', 'alert_type', 'title',
            'message', 'related_metric', 'status', 'priority', 'created_at',
            'handled_at', 'handled_by', 'action_taken', 'notes',
            'patient_name', 'assigned_doctor_name', 'handled_by_name',
            'related_metric_info'
        ]
        read_only_fields = ['id', 'created_at', 'patient_name', 'assigned_doctor_name', 'handled_by_name']
    
    def get_related_metric_info(self, obj):
        """获取相关指标信息"""
        if obj.related_metric:
            return {
                'metric_type': obj.related_metric.metric_type,
                'measured_at': obj.related_metric.measured_at,
                'primary_value': obj.related_metric.get_primary_value()
            }
        return None


class HealthMetricCreateSerializer(serializers.ModelSerializer):
    """健康指标创建序列化器（简化版）"""
    
    class Meta:
        model = HealthMetric
        fields = [
            'metric_type', 'systolic', 'diastolic', 'heart_rate',
            'blood_glucose', 'uric_acid', 'weight', 'lipids_total',
            'hdl', 'ldl', 'triglyceride', 'measured_at', 'note'
        ]
    
    def validate_measured_at(self, value):
        """验证测量时间"""
        if value > timezone.now():
            raise serializers.ValidationError("测量时间不能是未来时间")
        return value
    
    def create(self, validated_data):
        """创建健康指标记录"""
        request = self.context.get('request')
        user = request.user
        
        # 设置患者和测量者
        validated_data['patient'] = user
        validated_data['measured_by'] = user
        
        return super().create(validated_data)


class HealthTrendsSerializer(serializers.Serializer):
    """健康趋势数据序列化器"""
    metric_type = serializers.CharField()
    period = serializers.CharField()
    data_points = serializers.ListField(
        child=serializers.DictField()
    )
    average_value = serializers.FloatField(allow_null=True)
    trend_direction = serializers.CharField()  # 'up', 'down', 'stable'
    status = serializers.CharField()  # 'normal', 'warning', 'danger' 