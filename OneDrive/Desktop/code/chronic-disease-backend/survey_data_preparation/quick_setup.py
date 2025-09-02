#!/usr/bin/env python3
"""
Quick Setup Script for Chronic Disease Application
Quickly sets up the basic testing environment
"""

import os
import sys
import django

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import DoctorPatientRelation
from medication.models import MedicationPlan, MedicationReminder, Medication
from health.models import HealthMetric, Alert, ThresholdSetting


def quick_setup():
    """Quick setup basic testing environment"""
    print("🚀 Starting quick setup...")
    
    # Check if users already exist
    if User.objects.exists():
        print("⚠️  Users already exist, skipping user creation")
        return
    
    print("👥 Creating basic users...")
    
    # Create a test doctor
    doctor = User.objects.create_user(
        username='test_doctor',
        email='doctor@test.com',
        password='test123456',
        name='Test Doctor',
        role='doctor',
        phone='+8613800138001',
        age=35,
        gender='female',
        license_number='DOC001',
        department='Internal Medicine',
        title='Attending Physician',
        specialization='Cardiovascular Diseases'
    )
    print(f"✅ Created doctor: {doctor.name}")
    
    # Create a test patient
    patient = User.objects.create_user(
        username='test_patient',
        email='patient@test.com',
        password='test123456',
        name='Test Patient',
        role='patient',
        phone='+8613800138000',
        age=45,
        gender='male',
        height=175.0,
        blood_type='A+',
        bio='Test patient for development'
    )
    print(f"✅ Created patient: {patient.name}")
    
    # Create doctor-patient relationship
    relation = DoctorPatientRelation.objects.create(
        doctor=doctor,
        patient=patient,
        is_primary=True,
        status='active',
        notes='Quick setup test relationship'
    )
    print(f"✅ Created relationship: {doctor.name} → {patient.name}")
    
    # Create test medication
    medication = Medication.objects.create(
        name='Test Medication',
        category='test',
        unit='mg',
        specification='10mg/tablet',
        instructions='Test medication for development',
        is_prescription=False
    )
    print(f"✅ Created medication: {medication.name}")
    
    # Create medication plan
    plan = MedicationPlan.objects.create(
        patient=patient,
        medication=medication,
        dosage=10,
        frequency='QD',
        time_of_day=['08:00'],
        start_date='2024-01-01',
        end_date='2024-12-31',
        special_instructions='Test medication plan',
        status='active'
    )
    print(f"✅ Created medication plan")
    
    print("\n🎉 Quick setup completed!")
    print("🔐 Login information:")
    print(f"   Doctor: {doctor.phone} / test123456")
    print(f"   Patient: {patient.phone} / test123456")


def cleanup():
    """Clean up test data"""
    print("🧹 Cleaning up test data...")
    
    # Delete all data
    Alert.objects.all().delete()
    HealthMetric.objects.all().delete()
    ThresholdSetting.objects.all().delete()
    MedicationReminder.objects.all().delete()
    MedicationPlan.objects.all().delete()
    Medication.objects.all().delete()
    DoctorPatientRelation.objects.all().delete()
    User.objects.all().delete()
    
    print("✅ Cleanup completed")


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'cleanup':
        cleanup()
    else:
        quick_setup()
