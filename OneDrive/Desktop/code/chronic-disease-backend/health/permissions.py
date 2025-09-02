"""
健康模块权限控制工具

Permission utilities for the health module.

This module centralizes access control logic around the doctor–patient
relationship to ensure least-privilege data access:

- Patients: can only access their own records
- Doctors: can only access records for actively bound patients
- Others: denied by default

Using a shared utility reduces risk of inconsistent authorization rules
across different views and endpoints.
"""
from django.http import Http404
from .models import DoctorPatientRelation
from accounts.models import User


def get_doctor_patient_ids(doctor):
    """
    获取医生负责的患者ID列表

    Return the list of active patient IDs under the specified doctor.

    Args:
        doctor: Doctor user object.

    Returns:
        list[int]: Patient ID list.
    """
    patient_relations = DoctorPatientRelation.objects.filter(
        doctor=doctor, status='active'
    )
    return [relation.patient.id for relation in patient_relations]


def verify_doctor_patient_access(doctor, patient_id):
    """
    验证医生是否有权访问指定患者的数据

    Verify whether the given doctor is authorized to access the target
    patient. Authorization requires an active doctor–patient relation.

    Args:
        doctor: Doctor user object.
        patient_id: Target patient ID.

    Returns:
        User: Patient object on success.

    Raises:
        Http404: If the doctor is not authorized or the patient does not exist.
    """
    try:
        patient = User.objects.get(id=patient_id, role='patient')
        DoctorPatientRelation.objects.get(
            doctor=doctor, patient=patient, status='active'
        )
        return patient
    except (User.DoesNotExist, DoctorPatientRelation.DoesNotExist):
        raise Http404("无权访问该患者的数据")


def check_patient_data_access(user, patient_id=None):
    """
    检查用户是否有权访问患者数据

    Determine whether the current user is authorized to access data for
    the specified patient. Behavior by role:

    - Patient: can only access own data (id must match)
    - Doctor: can access managed patients (validated via relationship)
    - Others: access denied

    Args:
        user: Current authenticated user.
        patient_id: Optional target patient ID.

    Returns:
        tuple[bool, Optional[User]]: (has_access, patient_obj if resolved)
    """
    if user.is_patient:
        # 患者只能访问自己的数据
        if patient_id and int(patient_id) != user.id:
            return False, None
        return True, user
    elif user.is_doctor:
        # 医生只能访问其负责患者的数据
        if patient_id:
            try:
                patient = verify_doctor_patient_access(user, patient_id)
                return True, patient
            except Http404:
                return False, None
        return True, None
    else:
        # 其他角色无权访问
        return False, None