#!/usr/bin/env python3
"""
Test Medication Alert System
Test the medication adherence alert functionality
"""

import os
import sys
import django

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from medication.models import MedicationPlan, MedicationReminder
from health.models import Alert
from accounts.models import User


def test_medication_alerts():
    """Test medication alert system"""
    print("💊 Testing medication alert system...")
    
    # Check if medication plans exist
    plans = MedicationPlan.objects.filter(status='active')
    if not plans.exists():
        print("⚠️  No active medication plans found")
        return False
    
    print(f"📋 Found {plans.count()} active medication plans")
    
    # Check medication reminders
    reminders = MedicationReminder.objects.all()
    print(f"🔔 Found {reminders.count()} medication reminders")
    
    # Check alerts
    alerts = Alert.objects.filter(alert_type='medication_adherence')
    print(f"🚨 Found {alerts.count()} medication adherence alerts")
    
    # Test alert generation for missed medications
    missed_reminders = reminders.filter(status='missed')
    if missed_reminders.exists():
        print(f"⚠️  Found {missed_reminders.count()} missed medication reminders")
        
        # Show details of missed medications
        for reminder in missed_reminders[:3]:
            print(f"   - {reminder.plan.patient.name}: {reminder.plan.medication.name}")
    else:
        print("✅ No missed medication reminders found")
    
    # Test alert generation for low adherence
    total_reminders = reminders.count()
    taken_reminders = reminders.filter(status='taken').count()
    
    if total_reminders > 0:
        adherence_rate = taken_reminders / total_reminders
        print(f"📊 Medication adherence rate: {adherence_rate:.1%}")
        
        if adherence_rate < 0.8:
            print("⚠️  Low adherence rate detected, should generate alerts")
        else:
            print("✅ Good adherence rate")
    
    print("🎉 Medication alert system test completed!")
    return True


def create_test_medication_data():
    """Create test medication data for testing"""
    print("🔧 Creating test medication data...")
    
    # Check if users exist
    doctors = User.objects.filter(role='doctor')
    patients = User.objects.filter(role='patient')
    
    if not doctors.exists() or not patients.exists():
        print("❌ No doctors or patients found")
        return False
    
    # Create test medication
    from medication.models import Medication
    medication = Medication.objects.create(
        name='Test Medication',
        category='test',
        unit='mg',
        specification='10mg/tablet',
        instructions='Test medication for alert testing',
        is_prescription=False
    )
    
    # Create medication plan
    plan = MedicationPlan.objects.create(
        patient=patients.first(),
        medication=medication,
        dosage=10,
        frequency='QD',
        time_of_day=['08:00'],
        start_date='2024-01-01',
        end_date='2024-12-31',
        special_instructions='Test plan for alert testing',
        status='active'
    )
    
    # Create medication reminders
    from django.utils import timezone
    from datetime import timedelta
    
    for i in range(7):
        date = timezone.now().date() - timedelta(days=i)
        reminder = MedicationReminder.objects.create(
            plan=plan,
            scheduled_time=timezone.make_aware(
                timezone.datetime.combine(date, timezone.datetime.min.time().replace(hour=8))
            ),
            status='missed' if i % 3 == 0 else 'taken',
            notes='Test reminder'
        )
    
    print("✅ Test medication data created")
    return True


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'create':
        create_test_medication_data()
    else:
        test_medication_alerts()
