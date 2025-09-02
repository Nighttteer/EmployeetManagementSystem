from django.contrib import admin
from .models import Medication, MedicationPlan, MedicationReminder, MedicationStatusHistory


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'unit', 'is_active', 'is_prescription', 'created_at']
    list_filter = ['category', 'is_active', 'is_prescription']
    search_fields = ['name', 'generic_name', 'brand_name']
    ordering = ['name']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'unit', 'category', 'is_active', 'is_prescription')
        }),
        ('详细信息', {
            'fields': ('generic_name', 'brand_name', 'manufacturer', 'specification'),
            'classes': ('collapse',)
        }),
        ('使用说明', {
            'fields': ('instructions', 'contraindications', 'side_effects', 'interactions'),
            'classes': ('collapse',)
        })
    )


@admin.register(MedicationPlan)
class MedicationPlanAdmin(admin.ModelAdmin):
    list_display = ['patient', 'medication', 'doctor', 'dosage', 'frequency', 'status', 'start_date', 'created_at']
    list_filter = ['status', 'frequency', 'requires_monitoring', 'created_at']
    search_fields = ['patient__name', 'medication__name', 'doctor__name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('patient', 'doctor', 'medication', 'status')
        }),
        ('用药方案', {
            'fields': ('dosage', 'frequency', 'time_of_day', 'start_date', 'end_date', 'duration_days')
        }),
        ('说明', {
            'fields': ('special_instructions', 'dietary_requirements'),
            'classes': ('collapse',)
        }),
        ('监测', {
            'fields': ('requires_monitoring', 'monitoring_notes'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('patient', 'doctor', 'medication')


@admin.register(MedicationReminder)
class MedicationReminderAdmin(admin.ModelAdmin):
    list_display = ['get_patient_name', 'get_medication_name', 'reminder_time', 'status', 'confirm_time']
    list_filter = ['status', 'reminder_time']
    search_fields = ['plan__patient__name', 'plan__medication__name']
    ordering = ['-reminder_time']
    
    def get_patient_name(self, obj):
        return obj.plan.patient.name
    get_patient_name.short_description = '患者'
    
    def get_medication_name(self, obj):
        return obj.plan.medication.name
    get_medication_name.short_description = '药品'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('plan__patient', 'plan__medication')


@admin.register(MedicationStatusHistory)
class MedicationStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['get_patient_name', 'get_medication_name', 'from_status', 'to_status', 'changed_by', 'created_at']
    list_filter = ['from_status', 'to_status', 'created_at']
    search_fields = ['plan__patient__name', 'plan__medication__name', 'reason', 'changed_by__name']
    readonly_fields = ['plan', 'changed_by', 'from_status', 'to_status', 'created_at']
    ordering = ['-created_at']
    
    def get_patient_name(self, obj):
        return obj.plan.patient.name
    get_patient_name.short_description = '患者'
    
    def get_medication_name(self, obj):
        return obj.plan.medication.name
    get_medication_name.short_description = '药品'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('plan__patient', 'plan__medication', 'changed_by')
