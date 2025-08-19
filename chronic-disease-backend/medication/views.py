from django.shortcuts import render
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from accounts.models import User
from .models import Medication, MedicationPlan, MedicationReminder
from .serializers import (
    MedicationSerializer, 
    MedicationPlanSerializer, 
    MedicationReminderSerializer,
    MedicationPlanCreateSerializer
)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def patient_medication_plans(request):
    """
    患者查看自己的用药计划
    
    Allow patients to view their own medication plans.
    """
    user = request.user
    
    if not user.is_patient:
        return Response(
            {"error": "只有患者可以查看自己的用药计划"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 获取患者的用药计划
    plans = MedicationPlan.objects.filter(
        patient=user,
        status='active'
    ).order_by('-created_at')
    
    # 支持按状态筛选
    plan_status = request.query_params.get('status')
    if plan_status:
        plans = plans.filter(status=plan_status)
    
    serializer = MedicationPlanSerializer(plans, many=True)
    return Response({
        'plans': serializer.data,
        'total': plans.count()
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def medication_list(request):
    """
    获取药品列表

    List active medications with optional filtering by category and a
    text search across name fields. Authentication required to reduce
    surface for automated scraping.
    """
    medications = Medication.objects.filter(is_active=True)
    
    # 支持按类别筛选
    category = request.query_params.get('category')
    if category:
        medications = medications.filter(category=category)
    
    # 支持搜索
    search = request.query_params.get('search')
    if search:
        medications = medications.filter(
            Q(name__icontains=search) |
            Q(generic_name__icontains=search) |
            Q(brand_name__icontains=search)
        )
    
    serializer = MedicationSerializer(medications, many=True)
    return Response(serializer.data)


class MedicationPlanViewSet(APIView):
    """
    用药计划视图集合

    Medication plan view set handling listing, creation, update, and
    deletion. Restricted to doctors; patients cannot manage plans.

    Authorization model:
    - Access limited to plans owned by the requesting doctor
    - Patient target must exist and be a patient role when specified
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, patient_id=None):
        """
        获取用药计划列表

        List medication plans for the current doctor. If `patient_id` is
        provided, further filter by the target patient.
        """
        user = request.user
        
        if not user.is_doctor:
            return Response(
                {"error": "只有医生可以查看用药计划"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if patient_id:
            # 获取特定患者的用药计划
            try:
                patient = User.objects.get(id=patient_id, role='patient')
                # 医生端显示该病人的所有用药计划（包括其他医生开的）
                # 这样医生可以了解病人的完整用药情况
                plans = MedicationPlan.objects.filter(
                    patient=patient
                ).order_by('-created_at')
            except User.DoesNotExist:
                return Response(
                    {"error": "患者不存在"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # 获取医生的所有用药计划
            plans = MedicationPlan.objects.filter(
                doctor=user
            ).order_by('-created_at')
        
        # 支持按状态筛选
        plan_status = request.query_params.get('status')
        if plan_status:
            plans = plans.filter(status=plan_status)
        
        serializer = MedicationPlanSerializer(plans, many=True)
        return Response({
            'plans': serializer.data,
            'total': plans.count()
        })
    
    def post(self, request, patient_id=None):
        """
        创建用药计划

        Create a medication plan as the current doctor. The doctor field
        is enforced from the authenticated user to avoid spoofing.
        """
        user = request.user
        
        if not user.is_doctor:
            return Response(
                {"error": "只有医生可以创建用药计划"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data.copy()
        data['doctor'] = user.id
        
        if patient_id:
            data['patient'] = patient_id
        
        serializer = MedicationPlanCreateSerializer(data=data)
        if serializer.is_valid():
            plan = serializer.save()
            response_serializer = MedicationPlanSerializer(plan)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, patient_id=None, plan_id=None):
        """
        更新用药计划

        Update a medication plan owned by the current doctor. Partial
        updates are supported.
        """
        user = request.user
        
        if not user.is_doctor:
            return Response(
                {"error": "只有医生可以修改用药计划"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            plan = MedicationPlan.objects.get(
                id=plan_id,
                doctor=user
            )
        except MedicationPlan.DoesNotExist:
            return Response(
                {"error": "用药计划不存在"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = MedicationPlanCreateSerializer(plan, data=request.data, partial=True)
        if serializer.is_valid():
            plan = serializer.save()
            response_serializer = MedicationPlanSerializer(plan)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, patient_id=None, plan_id=None):
        """
        删除用药计划

        Delete a medication plan owned by the current doctor.
        """
        user = request.user
        
        if not user.is_doctor:
            return Response(
                {"error": "只有医生可以删除用药计划"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            plan = MedicationPlan.objects.get(
                id=plan_id,
                doctor=user
            )
            plan.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MedicationPlan.DoesNotExist:
            return Response(
                {"error": "用药计划不存在"},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def medication_plan_stats(request, patient_id=None):
    """
    获取用药计划统计信息

    Provide aggregate statistics for plans under the current doctor with
    optional restriction to a specific patient. Includes last-30-day
    compliance rate and per-category counts.
    """
    user = request.user
    
    if not user.is_doctor:
        return Response(
            {"error": "只有医生可以查看统计信息"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # 基础查询
    base_query = MedicationPlan.objects.filter(doctor=user)
    if patient_id:
        base_query = base_query.filter(patient_id=patient_id)
    
    # 统计数据
    stats = {
        'total_plans': base_query.count(),
        'active_plans': base_query.filter(status='active').count(),
        'completed_plans': base_query.filter(status='completed').count(),
        'stopped_plans': base_query.filter(status='stopped').count(),
    }
    
    # 依从性统计
    reminders = MedicationReminder.objects.filter(
        plan__in=base_query,
        reminder_time__gte=timezone.now() - timedelta(days=30)
    )
    
    total_reminders = reminders.count()
    taken_reminders = reminders.filter(status='taken').count()
    
    if total_reminders > 0:
        stats['compliance_rate'] = round((taken_reminders / total_reminders) * 100, 2)
    else:
        stats['compliance_rate'] = 0
    
    # 按药品类型统计
    category_stats = base_query.values(
        'medication__category'
    ).annotate(
        count=Count('id')
    ).order_by('-count')
    
    stats['by_category'] = list(category_stats)
    
    return Response(stats)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_plan_status(request, plan_id):
    """
    更新用药计划状态

    Update the status of a medication plan owned by the current doctor
    and append a structured status history record for auditability.
    """
    user = request.user
    
    if not user.is_doctor:
        return Response(
            {"error": "只有医生可以更新用药计划状态"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        plan = MedicationPlan.objects.get(id=plan_id, doctor=user)
        new_status = request.data.get('status')
        reason = request.data.get('reason')
        
        if new_status not in dict(MedicationPlan.STATUS_CHOICES):
            return Response(
                {"error": "无效的状态值"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 记录状态变更历史
        from .models import MedicationStatusHistory
        old_status = plan.status
        
        # 创建状态变更历史记录
        if old_status != new_status:
            MedicationStatusHistory.objects.create(
                plan=plan,
                changed_by=user,
                from_status=old_status,
                to_status=new_status,
                reason=reason.strip() if reason else None
            )
        
        plan.status = new_status
        plan.save()
        
        serializer = MedicationPlanSerializer(plan)
        return Response(serializer.data)
        
    except MedicationPlan.DoesNotExist:
        return Response(
            {"error": "用药计划不存在"},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_medication_history(request, patient_id):
    """
    获取患者的用药历史记录

    Return a flattened, reverse-chronological list of medication plan
    status changes for a patient managed by the current doctor.
    """
    user = request.user
    
    if not user.is_doctor:
        return Response(
            {"error": "只有医生可以查看用药历史"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # 获取该医生管理的患者的用药计划
        plans = MedicationPlan.objects.filter(
            patient_id=patient_id,
            doctor=user
        ).prefetch_related('status_history__changed_by', 'medication')
        
        history_records = []
        
        for plan in plans:
            # 添加状态变更历史
            for history in plan.status_history.all():
                history_records.append({
                    'id': f'history_{history.id}',
                    'type': 'status_change',
                    'plan_id': plan.id,
                    'medication_name': plan.medication.name,
                    'medication_id': plan.medication.id,
                    'dosage': plan.dosage,
                    'frequency': plan.get_frequency_display(),
                    'from_status': history.get_from_status_display(),
                    'to_status': history.get_to_status_display(),
                    'reason': history.reason,
                    'notes': history.notes,
                    'changed_by': history.changed_by.name,
                    'created_at': history.created_at,
                    'action_time': history.created_at
                })
        
        # 按时间倒序排序
        history_records.sort(key=lambda x: x['action_time'], reverse=True)
        
        return Response({
            'history': history_records,
            'total': len(history_records)
        })
        
    except Exception as e:
        return Response(
            {"error": f"获取用药历史失败: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


