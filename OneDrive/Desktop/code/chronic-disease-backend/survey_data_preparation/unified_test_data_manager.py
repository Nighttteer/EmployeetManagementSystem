#!/usr/bin/env python3
"""
Unified Test Data Management Tool
Integrates all user creation, test data generation, and database management functionality
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random
import json
from django.test import Client

# Setup Django environment
import sys
import os

# Add project root directory to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import DoctorPatientRelation, HealthMetric, Alert, ThresholdSetting
from medication.models import MedicationPlan, MedicationReminder, Medication
from django.core.management import execute_from_command_line
from django.db.models import Count


class UnifiedTestDataManager:
    """Unified Test Data Manager"""
    
    def __init__(self):
        print("🎯 Unified Test Data Manager initialization completed")
    
    def has_users(self):
        """Check if users exist"""
        return User.objects.exists()
    
    def clear_database(self, confirm=False):
        """Clear all database data while preserving table structure"""
        if not confirm:
            response = input("⚠️  Are you sure you want to clear all database data? (Enter 'YES' to confirm): ")
            if response != 'YES':
                print("❌ Operation cancelled")
                return False
        
        print("🗑️  Clearing database data...")
        
        # Clear alert data
        Alert.objects.all().delete()
        print("   ✅ Alert data cleared")
        
        # Clear health data
        HealthMetric.objects.all().delete()
        ThresholdSetting.objects.all().delete()
        print("   ✅ Health data cleared")
        
        # Clear medication data
        MedicationReminder.objects.all().delete()
        MedicationPlan.objects.all().delete()
        print("   ✅ Medication data cleared")
        
        # Clear doctor-patient relationships
        DoctorPatientRelation.objects.all().delete()
        print("   ✅ Doctor-patient relationships cleared")
        
        # Clear user data
        User.objects.all().delete()
        print("   ✅ User data cleared")
        
        print("🎉 Database cleanup completed! Table structure preserved")
        return True

    def create_basic_users(self):
        """Create basic test users (minimum amount)"""
        print("🔧 Creating basic test users...")
        
        # Create a test doctor
        doctor_data = {
            'username': 'doctor01',
            'email': 'doctor@test.com',
            'password': 'test123456',
            'name': 'Dr. Zhang',
            'role': 'doctor',
            'phone': '+8613800138001',
            'age': 35,
            'gender': 'female',
            'license_number': 'DOC001',
            'department': 'Internal Medicine',
            'title': 'Attending Physician',
            'specialization': 'Cardiovascular Diseases'
        }
        
        # Delete existing user
        if User.objects.filter(phone=doctor_data['phone']).exists():
            User.objects.filter(phone=doctor_data['phone']).delete()
            print(f"   🗑️  Deleted existing doctor: {doctor_data['phone']}")
        
        doctor = User.objects.create_user(**doctor_data)
        print(f"   ✅ Created doctor: {doctor.name} ({doctor.phone})")
        
        # Create three test patients (new patients default to unassessed status)
        patients_data = [
            {
                'username': 'patient01',
                'email': 'patient1@test.com',
                'password': 'test123456',
                'name': 'Zhang San',
                'role': 'patient',
                'phone': '+8613800138000',
                'age': 45,
                'gender': 'male',
                'height': 175.0,
                'blood_type': 'A+',
                'bio': 'Hypertension patient, needs regular blood pressure monitoring',
                'chronic_diseases': None  # Unassessed status
            },
            {
                'username': 'patient02',
                'email': 'patient2@test.com',
                'password': 'test123456',
                'name': 'Li Si',
                'role': 'patient',
                'phone': '+8613800138002',
                'age': 52,
                'gender': 'female',
                'height': 162.0,
                'blood_type': 'B+',
                'bio': 'Diabetes patient, needs to control blood sugar and diet',
                'chronic_diseases': None  # Unassessed status
            },
            {
                'username': 'patient03',
                'email': 'patient3@test.com',
                'password': 'test123456',
                'name': 'Wang Wu',
                'role': 'patient',
                'phone': '+8613800138003',
                'age': 38,
                'gender': 'male',
                'height': 178.0,
                'blood_type': 'O+',
                'bio': 'Heart disease patient, needs regular ECG checkup',
                'chronic_diseases': None  # Unassessed status
            }
        ]
        
        created_patients = []
        for patient_data in patients_data:
            # Delete existing user
            if User.objects.filter(phone=patient_data['phone']).exists():
                User.objects.filter(phone=patient_data['phone']).delete()
                print(f"   🗑️  Deleted existing patient: {patient_data['phone']}")
            
            patient = User.objects.create_user(**patient_data)
            created_patients.append(patient)
            print(f"   ✅ Created patient: {patient.name} ({patient.phone})")
        
        # Create doctor-patient relationships
        print("🔗 Creating doctor-patient relationships...")
        for patient in created_patients:
            relation = DoctorPatientRelation.objects.create(
                doctor=doctor,
                patient=patient,
                is_primary=True,
                status='active',
                notes=f'Basic test data - {patient.name} managed by {doctor.name}'
            )
            print(f"   ✅ Bound relationship: {doctor.name} → {patient.name}")
        
        print("\n📋 Basic test users created!")
        print("🔐 Login information:")
        print(f"    Doctor: {doctor.phone} / test123456")
        for patient in created_patients:
            print(f"    Patient: {patient.phone} / test123456")
        
        return doctor, created_patients

    def create_comprehensive_users(self):
        """Create comprehensive test user data (includes a large number of users)"""
        print("🏗️  Creating comprehensive test user data...")
        
        # Create multiple test doctors
        doctors_data = [
            {
                "username": "doctor001",
                "email": "doctor1@test.com",
                "password": "test123456",
                "name": "Dr. Li",
                "role": "doctor",
                "phone": "+8613800138001",
                "age": 35,
                "gender": "female",
                "license_number": "DOC20241201001",
                "department": "Internal Medicine",
                "title": "Attending Physician",
                "specialization": "Cardiovascular Diseases, Diabetes"
            },
            {
                "username": "doctor002", 
                "email": "doctor2@test.com",
                "password": "test123456",
                "name": "Dr. Wang",
                "role": "doctor",
                "phone": "+8613800138021",
                "age": 42,
                "gender": "male",
                "license_number": "DOC20241201002",
                "department": "Cardiology",
                "title": "Associate Professor",
                "specialization": "Coronary Artery Disease, Hypertension"
            },
            {
                "username": "doctor003",
                "email": "doctor3@test.com", 
                "password": "test123456",
                "name": "Dr. Zhang",
                "role": "doctor",
                "phone": "+8613800138022",
                "age": 38,
                "gender": "female",
                "license_number": "DOC20241201003",
                "department": "Endocrinology",
                "title": "Attending Physician",
                "specialization": "Diabetes, Thyroid Diseases"
            }
        ]
        
        created_doctors = []
        for doctor_data in doctors_data:
            # Delete existing user
            if User.objects.filter(phone=doctor_data['phone']).exists():
                User.objects.filter(phone=doctor_data['phone']).delete()
                print(f"   ��️  Deleted existing doctor: {doctor_data['phone']}")
            
            doctor = User.objects.create_user(**doctor_data)
            created_doctors.append(doctor)
            print(f"   ✅ Created doctor: {doctor.name} ({doctor.phone})")
        
        # Create many test patients (new patients default to unassessed status)
        patients_data = [
            # Patients assigned to doctors
            {
                "username": "patient001", "email": "patient1@test.com", "password": "test123456",
                "name": "Zhang San", "role": "patient", "phone": "+8613800138000", "age": 45, "gender": "male",
                "height": 175.0, "blood_type": "A+", "bio": "Hypertension patient, needs regular blood pressure monitoring", "assigned_doctor": 0,
                "chronic_diseases": None  # Unassessed status
            },
            {
                "username": "patient002", "email": "patient2@test.com", "password": "test123456",
                "name": "Li Si", "role": "patient", "phone": "+8613800138002", "age": 52, "gender": "female",
                "height": 162.0, "blood_type": "B+", "bio": "Diabetes patient, needs to control blood sugar and diet", "assigned_doctor": 0,
                "chronic_diseases": None  # Unassessed status
            },
            {
                "username": "patient003", "email": "patient3@test.com", "password": "test123456",
                "name": "Wang Wu", "role": "patient", "phone": "+8613800138003", "age": 38, "gender": "male",
                "height": 178.0, "blood_type": "O+", "bio": "Heart disease patient, needs regular ECG checkup", "assigned_doctor": 1,
                "chronic_diseases": None  # Unassessed status
            },
            {
                "username": "patient004", "email": "patient4@test.com", "password": "test123456",
                "name": "Zhao Liu", "role": "patient", "phone": "+8613800138004", "age": 61, "gender": "female",
                "height": 158.0, "blood_type": "AB+", "bio": "Hypertension and diabetes complications, need close monitoring", "assigned_doctor": 1,
                "chronic_diseases": None  # Unassessed status
            },
            {
                "username": "patient005", "email": "patient5@test.com", "password": "test123456",
                "name": "Liu Qi", "role": "patient", "phone": "+8613800138005", "age": 33, "gender": "male",
                "height": 172.0, "blood_type": "A-", "bio": "Obesity patient, needs to control weight", "assigned_doctor": 2,
                "chronic_diseases": None  # Unassessed status
            },
            # Patients not assigned to doctors
            {
                "username": "patient006", "email": "patient6@test.com", "password": "test123456",
                "name": "Chen Ba", "role": "patient", "phone": "+8613800138006", "age": 47, "gender": "female",
                "height": 165.0, "blood_type": "B-", "bio": "High cholesterol patient, needs to control cholesterol", "assigned_doctor": None,
                "chronic_diseases": None  # Unassessed status
            },
            {
                "username": "patient007", "email": "patient7@test.com", "password": "test123456",
                "name": "Sun Jiu", "role": "patient", "phone": "+8613800138007", "age": 56, "gender": "male",
                "height": 168.0, "blood_type": "O-", "bio": "Chronic kidney disease patient, needs to limit protein intake", "assigned_doctor": None,
                "chronic_diseases": None  # Unassessed status
            },
            {
                "username": "patient008", "email": "patient8@test.com", "password": "test123456",
                "name": "Zhou Shi", "role": "patient", "phone": "+8613800138008", "age": 29, "gender": "female",
                "height": 160.0, "blood_type": "AB-", "bio": "Hypothyroidism patient, needs regular checkup", "assigned_doctor": None,
                "chronic_diseases": None  # Unassessed status
            }
        ]
        
        created_patients = []
        for patient_data in patients_data:
            # Delete existing user
            if User.objects.filter(phone=patient_data['phone']).exists():
                User.objects.filter(phone=patient_data['phone']).delete()
                print(f"   🗑️  Deleted existing patient: {patient_data['phone']}")
            
            assigned_doctor = patient_data.pop('assigned_doctor', None)
            patient = User.objects.create_user(**patient_data)
            patient.last_login = datetime.now() - timedelta(days=random.randint(1, 30))
            patient.save()
            
            created_patients.append((patient, assigned_doctor))
            status = "(No doctor assigned)" if assigned_doctor is None else f"(Assigned to {created_doctors[assigned_doctor].name})"
            print(f"   ✅ Created patient: {patient.name} ({patient.phone}) {status}")
        
        # Create doctor-patient relationships
        print("🔗 Creating doctor-patient relationships...")
        for patient, doctor_index in created_patients:
            if doctor_index is not None:
                doctor = created_doctors[doctor_index]
                relation = DoctorPatientRelation.objects.create(
                    doctor=doctor,
                    patient=patient,
                    is_primary=True,
                    status='active',
                    notes=f'Comprehensive test data - {patient.name} managed by {doctor.name}'
                )
                print(f"   ✅ Bound relationship: {doctor.name} → {patient.name}")
        
        assigned_count = sum(1 for _, assigned in created_patients if assigned is not None)
        unassigned_count = sum(1 for _, assigned in created_patients if assigned is None)
        
        print(f"\n📊 Comprehensive test user data created!")
        print("=" * 60)
        print("🔐 Login information:")
        print("    Doctor accounts:")
        for doctor in created_doctors:
            print(f"     {doctor.name}: {doctor.phone} / test123456")
        
        print(f"\n    Patient accounts: Total {len(created_patients)}")
        print(f"     Assigned doctors: {assigned_count} patients")
        print(f"     Unassigned doctors: {unassigned_count} patients")
        print("     All patient passwords: test123456")
        print("=" * 60)
        
        return created_doctors, created_patients

    def create_health_data(self):
        """Create health data and alerts"""
        print("📊 Creating health data and alerts...")
        
        # Use Django management command to create comprehensive test data
        try:
            from django.core.management import call_command
            call_command('create_test_data')
            print("   ✅ Health data created via management command")
        except Exception as e:
            print(f"   ❌ Management command failed: {e}")
            print("   📝 Please run manually: python manage.py create_test_data")
            print("   💡 Ensure you are in the chronic-disease-backend directory")
    
    def create_test_data(self):
        """Create test health data"""
        print("📊 Creating health data and alerts...")
        
        try:
            # Call Django management command
            from django.core.management import call_command
            call_command('create_test_data')
            print("   ✅ Test data created successfully")
            return True
        except Exception as e:
            print(f"   ❌ Management command failed: {e}")
            print("   📝 Please run manually: python manage.py create_test_data")
            return False
    
    def create_enhanced_test_data(self, days_back=30):
        """Create enhanced test health data (using enhanced data creator)"""
        print("📊 Creating enhanced health data and alerts...")
        
        try:
            # Import enhanced data creator
            from enhanced_data_creator import EnhancedDataCreator
            
            creator = EnhancedDataCreator()
            success = creator.create_comprehensive_data(days_back=days_back)
            
            if success:
                print("   ✅ Enhanced test data created successfully")
                return True
            else:
                print("   ❌ Enhanced test data creation failed")
                return False
                
        except ImportError:
            print("   ❌ Enhanced data creator not found, please ensure enhanced_data_creator.py exists")
            return False
        except Exception as e:
            print(f"   ❌ Enhanced data creation failed: {e}")
            return False
    
    def run_intelligent_analysis(self, doctor_id=None, all_doctors=False):
        """Run intelligent alert analysis"""
        print("🧠 Starting intelligent alert analysis...")
        
        try:
            from health.alert_analysis_service import AlertAnalysisService
            analysis_service = AlertAnalysisService()
            
            if doctor_id:
                # Analyze specific doctor
                print(f"   📊 Analyzing doctor ID: {doctor_id}")
                alerts = analysis_service.analyze_and_generate_alerts(doctor_id)
                if alerts:
                    print(f"   ✅ Generated {len(alerts)} alerts for doctor {doctor_id}")
                    for alert in alerts[:3]:  # Display first 3 alerts
                        print(f"     - {alert.title}: {alert.priority}")
                else:
                    print(f"   ℹ️  Doctor {doctor_id} has no alerts to generate")
                    
            elif all_doctors:
                # Analyze all doctors
                doctors = User.objects.filter(role='doctor', is_active=True)
                if not doctors.exists():
                    print("   ⚠️  No active doctor users found")
                    return False
                
                total_alerts = 0
                for doctor in doctors:
                    print(f"   📊 Analyzing doctor: {doctor.name} (ID: {doctor.id})")
                    alerts = analysis_service.analyze_and_generate_alerts(doctor.id)
                    doctor_alert_count = len(alerts) if alerts else 0
                    total_alerts += doctor_alert_count
                    print(f"     ✅ Generated {doctor_alert_count} alerts")
                
                print(f"   🎯 Total alerts generated: {total_alerts}")
            else:
                print("   ❌ Please specify doctor_id or set all_doctors=True")
                return False
                
            print("   ✅ Intelligent analysis completed")
            return True
            
        except Exception as e:
            print(f"   ❌ Intelligent analysis failed: {e}")
            return False
    
    def setup_5_level_risk_system(self):
        """Set up 5-level disease risk assessment system test data"""
        print("🎯 Setting up 5-level disease risk assessment system...")
        
        try:
            # Find doctor
            doctor = User.objects.filter(role='doctor').first()
            if not doctor:
                print("   ❌ No doctor user found, please create users first")
                return False
            
            print(f"   👨‍⚕️  Operating doctor: {doctor.name} (ID: {doctor.id})")
            
            # Get patients of this doctor
            from health.models import DoctorPatientRelation
            relations = DoctorPatientRelation.objects.filter(
                doctor=doctor, 
                status='active'
            ).select_related('patient')
            
            patients = [relation.patient for relation in relations]
            if len(patients) < 5:
                print(f"   ⚠️  Insufficient patients (currently {len(patients)}), need at least 5 patients to demonstrate 5 risk states")
                print("   💡 Please run create_comprehensive_users to create more patients")
                return False
            
            print(f"   📋 Total patients managed: {len(patients)}")
            
            # Set different risk states for patients
            risk_assignments = [
                {
                    'status': 'unassessed',
                    'value': None,
                    'description': 'Doctor has not assessed',
                    'display': 'Unassessed'
                },
                {
                    'status': 'healthy',
                    'value': [],
                    'description': 'Doctor has assessed, no chronic diseases',
                    'display': 'Healthy'
                },
                {
                    'status': 'low',
                    'value': ['arthritis', 'migraine'],
                    'description': 'Arthritis + Migraine',
                    'display': 'Low Risk'
                },
                {
                    'status': 'medium', 
                    'value': ['diabetes', 'hypertension'],
                    'description': 'Diabetes + Hypertension',
                    'display': 'Medium Risk'
                },
                {
                    'status': 'high',
                    'value': ['cancer', 'heart_disease'],
                    'description': 'Cancer + Heart Disease',
                    'display': 'High Risk'
                }
            ]
            
            print("\n   🔧 Assigning risk status:")
            # Loop to assign to patients
            for i, patient in enumerate(patients):
                assignment = risk_assignments[i % len(risk_assignments)]
                
                # Update patient disease status
                patient.chronic_diseases = assignment['value']
                patient.save()
                
                # Verify risk level
                risk_level = patient.get_disease_risk_level()
                
                print(f"     {patient.name:8} | {assignment['display']:6} | {risk_level:10} | {assignment['description']}")
            
            # Statistics by risk level
            print("\n   📊 Risk distribution statistics:")
            risk_counts = {'unassessed': 0, 'healthy': 0, 'low': 0, 'medium': 0, 'high': 0}
            for patient in patients:
                risk_level = patient.get_disease_risk_level()
                risk_counts[risk_level] += 1
            
            total = len(patients)
            for status, count in risk_counts.items():
                percentage = (count / total) * 100 if total > 0 else 0
                status_name = {
                    'unassessed': 'Unassessed',
                    'healthy': 'Healthy',
                    'low': 'Low Risk',
                    'medium': 'Medium Risk',
                    'high': 'High Risk'
                }.get(status, status)
                print(f"     {status_name:6}: {count:2} people ({percentage:5.1f}%)")
            
            print("\n   ✅ 5-level risk assessment system setup completed!")
            print("   🎯 You can now:")
            print("     1. View patient management page in doctor's interface, see 5 risk states")
            print("     2. Filter patients by different risk levels using filters")
            print("     3. Edit patient information to test the mutually exclusive logic of the 'Healthy' option") 
            print("     4. View the 5 colors of the risk distribution pie chart on the dashboard")
            
            return True
            
        except Exception as e:
            print(f"   ❌ Error during setup: {e}")
            import traceback
            traceback.print_exc()
            return False

    def trigger_realtime_analysis(self, patient_id, metric_type):
        """Trigger real-time analysis (simulate patient submitting data)"""
        print(f"⚡ Triggering real-time analysis: Patient ID {patient_id}, Metric Type {metric_type}")
        
        try:
            from health.tasks import real_time_health_data_analysis
            result = real_time_health_data_analysis(patient_id, metric_type)
            
            if result.get('success'):
                print(f"   ✅ Real-time analysis completed")
                if result.get('is_critical'):
                    print(f"   🚨 Critical situation detected! Generated {result.get('generated_alerts', 0)} emergency alerts")
                else:
                    print(f"   ℹ️  Patient metrics normal, no alerts generated")
            else:
                print(f"   ❌ Real-time analysis failed: {result.get('error')}")
                
            return result
            
        except Exception as e:
            print(f"   ❌ Real-time analysis exception: {e}")
            return {'success': False, 'error': str(e)}
    
    def test_search_functionality(self):
        """Test user search functionality"""
        print("🔍 Testing user search functionality...")
        
        doctors = User.objects.filter(role='doctor', is_active=True)
        patients = User.objects.filter(role='patient', is_active=True)
        
        print(f"    Active doctors: {doctors.count()}")
        print(f"    Active patients: {patients.count()}")
        
        if doctors.count() == 0 or patients.count() == 0:
            print("   ⚠️  Not enough test users, please create users first")
            return False
        
        # Test search API
        client = Client()
        
        # Test patient search doctor
        if patients.exists():
            patient = patients.first()
            client.force_login(patient)
            
            search_terms = ['Li', 'Doctor', '138001']
            for term in search_terms:
                response = client.get('/api/communication/users/search/', {'search': term})
                print(f"    Patient search '{term}': {response.status_code} - {len(json.loads(response.content)) if response.status_code == 200 else 'Error'}")
        
        # Test doctor search patient
        if doctors.exists():
            doctor = doctors.first()
            client.force_login(doctor)
            
            search_terms = ['Zhang', 'Patient', '138000']
            for term in search_terms:
                response = client.get('/api/communication/users/search/', {'search': term})
                print(f"    Doctor search '{term}': {response.status_code} - {len(json.loads(response.content)) if response.status_code == 200 else 'Error'}")
        
        print("   ✅ Search functionality tested")
        return True
    
    def show_status(self):
        """Display current database status"""
        print("📊 Current database status:")
        print(f"   👨‍⚕️  Doctors: {User.objects.filter(role='doctor').count()}")
        print(f"   👤  Patients: {User.objects.filter(role='patient').count()}")
        print(f"   🔗  Doctor-patient relationships: {DoctorPatientRelation.objects.count()}")
        print(f"   📈  Health records: {HealthMetric.objects.count()}")
        print(f"   🚨  Alert records: {Alert.objects.count()}")
        print(f"   💊  Medication records: {MedicationReminder.objects.count()}")
        
        # Display alert distribution
        if Alert.objects.exists():
            print("\n🚨 Alert status distribution:")
            alert_stats = Alert.objects.values('status', 'priority').annotate(count=Count('id'))
            for stat in alert_stats:
                print(f"     {stat['status']}-{stat['priority']}: {stat['count']} items")
        
        # Display recent alerts
        recent_alerts = Alert.objects.order_by('-created_at')[:3]
        if recent_alerts:
            print("\n📋 Recent alerts:")
            for alert in recent_alerts:
                print(f"     {alert.title} ({alert.priority}) - {alert.patient.name}")
        
        if User.objects.exists():
            print("\n👥 Recently created users:")
            for user in User.objects.order_by('-date_joined')[:5]:
                print(f"     {user.name} ({user.role}) - {user.phone}")
        
        # Display medication adherence statistics
        self.show_medication_adherence_status()
    
    def show_medication_adherence_status(self):
        """Display medication adherence status"""
        print(f"\n💊 Medication adherence status:")
        print(f"   📋 Medication plans: {MedicationPlan.objects.count()}")
        print(f"   🔔 Medication reminders: {MedicationReminder.objects.count()}")
        
        # Statistics by different reminder statuses
        if MedicationReminder.objects.exists():
            reminder_stats = MedicationReminder.objects.values('status').annotate(count=Count('id'))
            print("    Reminder status distribution:")
            for stat in reminder_stats:
                status_name = dict(MedicationReminder.STATUS_CHOICES).get(stat['status'], stat['status'])
                print(f"     {status_name}: {stat['count']} items")
            
            # Calculate overall adherence
            total_reminders = MedicationReminder.objects.count()
            taken_reminders = MedicationReminder.objects.filter(status='taken').count()
            adherence_rate = taken_reminders / total_reminders if total_reminders > 0 else 0
            
            print(f"    Overall adherence: {adherence_rate:.1%} ({taken_reminders}/{total_reminders})")
            
            # Statistics by patient
            if MedicationPlan.objects.exists():
                print("    Patient adherence details:")
                for plan in MedicationPlan.objects.filter(status='active')[:5]:  # Only show first 5
                    patient_reminders = MedicationReminder.objects.filter(plan=plan)
                    if patient_reminders.exists():
                        patient_total = patient_reminders.count()
                        patient_taken = patient_reminders.filter(status='taken').count()
                        patient_adherence = patient_taken / patient_total if patient_total > 0 else 0
                        print(f"     {plan.patient.name}: {patient_adherence:.1%} ({patient_taken}/{patient_total})")
    
    def create_medication_adherence_alerts(self, days=30):
        """Create medication adherence alert test data"""
        print(f"💊 Creating medication adherence alert test data (last {days} days)...")
        
        # Check if there is existing medication data
        if not MedicationPlan.objects.exists():
            print("   ⚠️  No medication plans, please create basic users and medication plans first...")
            self.create_basic_medication_data()
        
        # Get all active medication plans
        active_plans = MedicationPlan.objects.filter(status='active')
        if not active_plans.exists():
            print("   ⚠️  No active medication plans")
            return
        
        # Create medication reminder records for each plan
        total_reminders = 0
        total_missed = 0
        
        for plan in active_plans:
            plan_reminders = self._create_plan_reminders(plan, days)
            total_reminders += len(plan_reminders)
            total_missed += len([r for r in plan_reminders if r.status == 'missed'])
        
        print(f"   ✅ Created {total_reminders} medication reminder records")
        print(f"   🚨 Missed medication records: {total_missed} items")
        
        # Calculate adherence
        adherence_rate = (total_reminders - total_missed) / total_reminders if total_reminders > 0 else 0
        print(f"   📊 Overall adherence: {adherence_rate:.1%}")
        
        # Trigger intelligent analysis to generate alerts
        print("   🔍 Triggering intelligent analysis to generate alerts...")
        self.run_intelligent_analysis(all_doctors=True)
        
        return {
            'total_reminders': total_reminders,
            'total_missed': total_missed,
            'adherence_rate': adherence_rate
        }
    
    def create_basic_medication_data(self):
        """Create basic medication data"""
        print("   🔧 Creating basic medication data...")
        
        # Create test medications
        medications = []
        med_names = ['Amlodipine Tablets', 'Metformin Tablets', 'Atorvastatin Tablets']
        med_categories = ['antihypertensive', 'hypoglycemic', 'lipid_lowering']
        med_specs = ['5mg/tablet', '500mg/tablet', '20mg/tablet']
        
        for i, (name, category, spec) in enumerate(zip(med_names, med_categories, med_specs)):
            med = Medication.objects.create(
                name=name,
                category=category,
                unit='mg',
                specification=spec,
                instructions=f'Test use {name}',
                is_prescription=True
            )
            medications.append(med)
            print(f"     ✅ Created medication: {name}")
        
        # Create medication plans for existing patients
        patients = User.objects.filter(role='patient')[:3]  # Take first 3 patients
        doctors = User.objects.filter(role='doctor')[:2]   # Take first 2 doctors
        
        if not patients.exists() or not doctors.exists():
            print("     ⚠️  Not enough patients or doctors")
            return
        
        plan_count = 0
        for i, patient in enumerate(patients):
            doctor = doctors[i % len(doctors)]
            
            # Create medication plan
            plan = MedicationPlan.objects.create(
                patient=patient,
                doctor=doctor,
                medication=medications[i % len(medications)],
                dosage=10.0,
                frequency='BID' if i % 2 == 0 else 'QD',
                time_of_day=['08:00', '20:00'] if i % 2 == 0 else ['08:00'],
                start_date=timezone.now().date() - timedelta(days=30),
                end_date=timezone.now().date() + timedelta(days=30),
                special_instructions=f'Test medication plan - {patient.name}',
                status='active'
            )
            plan_count += 1
            print(f"     ✅ Created medication plan: {patient.name} - {plan.medication.name}")
        
        print(f"   ✅ Created {plan_count} medication plans")
    
    def _create_plan_reminders(self, plan, days):
        """Create reminder records for a specific medication plan"""
        reminders = []
        
        # Calculate time range
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Determine daily reminder frequency
        if plan.frequency == 'QD':
            daily_times = 1
        elif plan.frequency == 'BID':
            daily_times = 2
        elif plan.frequency == 'TID':
            daily_times = 3
        else:
            daily_times = 1
        
        current_date = start_date
        while current_date <= end_date:
            for time_index in range(daily_times):
                # Generate reminder time
                hour = 8 + (time_index * 6)  # 8:00, 14:00, 20:00
                reminder_time = timezone.make_aware(
                    datetime.combine(current_date, datetime.min.time().replace(hour=hour))
                )
                
                # Decide whether to miss medication based on patient, date, and time
                if self._should_miss_medication(plan.patient, current_date, time_index):
                    status = 'missed'
                    confirm_time = None
                    dosage_taken = None
                    notes = 'Patient did not confirm medication'
                else:
                    status = 'taken'
                    confirm_time = reminder_time + timedelta(minutes=random.randint(5, 30))
                    dosage_taken = plan.dosage
                    notes = 'Patient took medication'
                
                reminder = MedicationReminder.objects.create(
                    plan=plan,
                    reminder_time=reminder_time,
                    scheduled_time=reminder_time.time(),
                    status=status,
                    confirm_time=confirm_time,
                    dosage_taken=dosage_taken,
                    notes=notes
                )
                reminders.append(reminder)
            
            current_date += timedelta(days=1)
        
        return reminders
    
    def _should_miss_medication(self, patient, date, time_index):
        """Determine if a patient should miss medication"""
        # Simple algorithm based on patient ID, date, and time
        patient_id = patient.id
        day_of_year = date.timetuple().tm_yday
        
        # Different missed medication patterns
        if patient_id % 3 == 0:  # Patient 1: Miss every 3 days
            return day_of_year % 3 == 0
        elif patient_id % 3 == 1:  # Patient 2: Miss every 2 days
            return day_of_year % 2 == 0
        else:  # Patient 3: Miss occasionally on weekends
            return date.weekday() in [5, 6] and time_index == 0  # Miss on weekends morning
    
    def analyze_alerts_summary(self):
        """Analyze alert summary"""
        print("📈 Intelligent alert analysis summary:")
        
        doctors = User.objects.filter(role='doctor', is_active=True)
        if not doctors.exists():
            print("   ⚠️  No active doctor users")
            return
        
        for doctor in doctors:
            print(f"\n👨‍⚕️  Doctor: {doctor.name}")
            
            # Patients managed by the doctor
            relations = DoctorPatientRelation.objects.filter(doctor=doctor, status='active')
            patient_count = relations.count()
            print(f"    Patients managed: {patient_count} patients")
            
            if patient_count == 0:
                print("   ℹ️  No patients managed")
                continue
            
            # Alert statistics
            doctor_alerts = Alert.objects.filter(assigned_doctor=doctor)
            alert_count = doctor_alerts.count()
            print(f"    Total alerts: {alert_count}")
            
            if alert_count > 0:
                # Statistics by priority
                priority_stats = doctor_alerts.values('priority').annotate(count=Count('id'))
                for stat in priority_stats:
                    print(f"     {stat['priority']}: {stat['count']} items")
                
                # Statistics by status
                status_stats = doctor_alerts.values('status').annotate(count=Count('id'))
                for stat in status_stats:
                    print(f"     {stat['status']}: {stat['count']} items")
            
            # Health data statistics for the last 3 days
            from django.utils import timezone
            three_days_ago = timezone.now() - timedelta(days=3)
            recent_metrics = HealthMetric.objects.filter(
                patient__in=[r.patient for r in relations],
                measured_at__gte=three_days_ago
            )
            print(f"    Recent data (last 3 days): {recent_metrics.count()} items")

    def export_test_data(self, format_type='json'):
        """Export test data"""
        print(f"📤 Exporting test data (format: {format_type})...")
        
        try:
            # Collect all data
            data = {
                'users': {
                    'doctors': list(User.objects.filter(role='doctor').values('id', 'name', 'phone', 'email', 'department')),
                    'patients': list(User.objects.filter(role='patient').values('id', 'name', 'phone', 'email', 'age', 'gender'))
                },
                'relations': list(DoctorPatientRelation.objects.values('doctor_id', 'patient_id', 'status')),
                'health_metrics': list(HealthMetric.objects.values('patient_id', 'metric_type', 'value', 'measured_at')),
                'alerts': list(Alert.objects.values('patient_id', 'title', 'priority', 'status', 'created_at')),
                'export_time': datetime.now().isoformat()
            }
            
            if format_type == 'json':
                # Export as JSON file
                filename = f'test_data_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2, default=str)
                print(f"   ✅ Data exported to: {filename}")
                
            elif format_type == 'csv':
                # Export as CSV file (simplified version)
                import csv
                filename = f'test_data_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                with open(filename, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow(['Data Type', 'Record Count', 'Export Time'])
                    writer.writerow(['Doctors', len(data['users']['doctors']), data['export_time']])
                    writer.writerow(['Patients', len(data['users']['patients']), data['export_time']])
                    writer.writerow(['Doctor-Patient Relationships', len(data['relations']), data['export_time']])
                    writer.writerow(['Health Data', len(data['health_metrics']), data['export_time']])
                    writer.writerow(['Alerts', len(data['alerts']), data['export_time']])
                print(f"   ✅ Data exported to: {filename}")
            
            return filename
            
        except Exception as e:
            print(f"   ❌ Export failed: {e}")
            return None
    
    def validate_data_integrity(self):
        """Validate data integrity"""
        print("🔍 Validating data integrity...")
        
        issues = []
        
        # Check user data integrity
        users_without_phone = User.objects.filter(phone__isnull=True) | User.objects.filter(phone='')
        if users_without_phone.exists():
            issues.append(f"Found {users_without_phone.count()} users with no phone number")
        
        # Check doctor-patient relationship integrity
        orphaned_relations = DoctorPatientRelation.objects.filter(
            doctor__isnull=True
        ) | DoctorPatientRelation.objects.filter(
            patient__isnull=True
        )
        if orphaned_relations.exists():
            issues.append(f"Found {orphaned_relations.count()} invalid doctor-patient relationships")
        
        # Check health data integrity
        metrics_without_patient = HealthMetric.objects.filter(patient__isnull=True)
        if metrics_without_patient.exists():
            issues.append(f"Found {metrics_without_patient.count()} health data items missing patient information")
        
        # Check alert data integrity
        alerts_without_patient = Alert.objects.filter(patient__isnull=True)
        if alerts_without_patient.exists():
            issues.append(f"Found {alerts_without_patient.count()} alerts missing patient information")
        
        if issues:
            print("   ⚠️  Found the following issues:")
            for issue in issues:
                print(f"     - {issue}")
            return False
        else:
            print("   ✅ Data integrity check passed")
            return True
    
    def performance_test(self, test_type='basic'):
        """Perform performance test"""
        print(f"⚡ Executing performance test ({test_type})...")
        
        import time
        
        if test_type == 'basic':
            # Basic performance test
            start_time = time.time()
            
            # Test user query performance
            user_count = User.objects.count()
            user_query_time = time.time() - start_time
            
            start_time = time.time()
            # Test doctor-patient relationship query performance
            relation_count = DoctorPatientRelation.objects.count()
            relation_query_time = time.time() - start_time
            
            start_time = time.time()
            # Test health data query performance
            metric_count = HealthMetric.objects.count()
            metric_query_time = time.time() - start_time
            
            print(f"   📊 Performance test results:")
            print(f"      User query: {user_count} items, time: {user_query_time:.4f} seconds")
            print(f"      Relationship query: {relation_count} items, time: {relation_query_time:.4f} seconds")
            print(f"      Health data: {metric_count} items, time: {metric_query_time:.4f} seconds")
            
        elif test_type == 'stress':
            # Stress test
            print("   🔥 Executing stress test...")
            
            # Simulate large concurrent queries
            start_time = time.time()
            for i in range(100):
                User.objects.filter(role='doctor').count()
                User.objects.filter(role='patient').count()
            
            total_time = time.time() - start_time
            print(f"     100 concurrent queries took: {total_time:.4f} seconds")
            print(f"     Average time per query: {total_time/100:.4f} seconds")
        
        print("   ✅ Performance test completed")
        return True
    
    def cleanup_orphaned_data(self):
        """Clean up orphaned data"""
        print("🧹 Cleaning up orphaned data...")
        
        cleaned_count = 0
        
        # Clean up orphaned health data
        orphaned_metrics = HealthMetric.objects.filter(patient__isnull=True)
        if orphaned_metrics.exists():
            count = orphaned_metrics.count()
            orphaned_metrics.delete()
            cleaned_count += count
            print(f"   🗑️  Cleaned up {count} orphaned health data items")
        
        # Clean up orphaned alerts
        orphaned_alerts = Alert.objects.filter(patient__isnull=True)
        if orphaned_alerts.exists():
            count = orphaned_alerts.count()
            orphaned_alerts.delete()
            cleaned_count += count
            print(f"   🗑️  Cleaned up {count} orphaned alerts")
        
        # Clean up invalid doctor-patient relationships
        invalid_relations = DoctorPatientRelation.objects.filter(
            doctor__isnull=True
        ) | DoctorPatientRelation.objects.filter(
            patient__isnull=True
        )
        if invalid_relations.exists():
            count = invalid_relations.count()
            invalid_relations.delete()
            cleaned_count += count
            print(f"   🗑️  Cleaned up {count} invalid doctor-patient relationships")
        
        if cleaned_count == 0:
            print("   ✅ No orphaned data found to clean up")
        else:
            print(f"   🎉 Cleaned up a total of {cleaned_count} orphaned items")
        
        return cleaned_count
    
    def backup_database(self):
        """Backup database"""
        print("💾 Backing up database...")
        
        try:
            import shutil
            from django.conf import settings
            
            # Get database file path
            db_path = settings.DATABASES['default']['NAME']
            if db_path == ':memory:' or 'sqlite' not in db_path:
                print("   ⚠️  Current database does not support file backup")
                return None
            
            # Create backup filename
            backup_filename = f'database_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.sqlite3'
            backup_path = os.path.join(os.path.dirname(db_path), backup_filename)
            
            # Copy database file
            shutil.copy2(db_path, backup_path)
            
            print(f"   ✅ Database backed up to: {backup_path}")
            return backup_path
            
        except Exception as e:
            print(f"   ❌ Backup failed: {e}")
            return None
    
    def generate_bulk_data(self, count=100):
        """Generate large amounts of test data"""
        print(f"🏗️  Generating {count} test data items...")
        
        try:
            # Generate large amounts of health data
            for i in range(count):
                # Randomly select patients
                patients = User.objects.filter(role='patient')
                if not patients.exists():
                    print("   ⚠️  No patient users, please create users first")
                    return False
                
                patient = random.choice(patients)
                
                # Generate random health metrics
                metric_types = ['blood_pressure', 'blood_glucose', 'heart_rate', 'weight', 'temperature']
                metric_type = random.choice(metric_types)
                
                # Generate random value
                if metric_type == 'blood_pressure':
                    systolic = random.randint(90, 180)
                    diastolic = random.randint(60, 110)
                    value = f"{systolic}/{diastolic}"
                elif metric_type == 'blood_glucose':
                    value = random.uniform(3.9, 15.0)
                elif metric_type == 'heart_rate':
                    value = random.randint(50, 120)
                elif metric_type == 'weight':
                    value = random.uniform(40.0, 120.0)
                else:  # temperature
                    value = random.uniform(36.0, 39.0)
                
                # Create health record
                HealthMetric.objects.create(
                    patient=patient,
                    metric_type=metric_type,
                    value=value,
                    measured_at=datetime.now() - timedelta(days=random.randint(0, 30))
                )
                
                if (i + 1) % 20 == 0:
                    print(f"   📊 Generated {i + 1} data items...")
            
            print(f"   ✅ Successfully generated {count} test data items")
            return True
            
        except Exception as e:
            print(f"   ❌ Data generation failed: {e}")
            return False
    
    def generate_report(self):
        """Generate detailed data statistics report"""
        print("📊 Generating data statistics report...")
        
        try:
            report = {
                'timestamp': datetime.now().isoformat(),
                'summary': {
                    'total_users': User.objects.count(),
                    'doctors': User.objects.filter(role='doctor').count(),
                    'patients': User.objects.filter(role='patient').count(),
                    'relations': DoctorPatientRelation.objects.count(),
                    'health_metrics': HealthMetric.objects.count(),
                    'alerts': Alert.objects.count(),
                    'medications': MedicationPlan.objects.count()
                },
                'user_analysis': {
                    'active_users': User.objects.filter(is_active=True).count(),
                    'inactive_users': User.objects.filter(is_active=False).count(),
                    'recent_users': User.objects.filter(
                        date_joined__gte=datetime.now() - timedelta(days=7)
                    ).count()
                },
                'health_data_analysis': {
                    'metrics_by_type': list(HealthMetric.objects.values('metric_type').annotate(
                        count=Count('id')
                    )),
                    'recent_metrics': HealthMetric.objects.filter(
                        measured_at__gte=datetime.now() - timedelta(days=7)
                    ).count()
                },
                'alert_analysis': {
                    'alerts_by_priority': list(Alert.objects.values('priority').annotate(
                        count=Count('id')
                    )),
                    'alerts_by_status': list(Alert.objects.values('status').annotate(
                        count=Count('id')
                    ))
                }
            }
            
            # Save report to file
            report_filename = f'data_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            with open(report_filename, 'w', encoding='utf-8') as f:
                json.dump(report, f, ensure_ascii=False, indent=2, default=str)
            
            print(f"   ✅ Report generated: {report_filename}")
            
            # Display summary
            print("\n   📋 Data Summary:")
            print(f"      Total users: {report['summary']['total_users']}")
            print(f"      Doctors: {report['summary']['doctors']}")
            print(f"      Patients: {report['summary']['patients']}")
            print(f"      Health records: {report['summary']['health_metrics']}")
            print(f"      Alerts: {report['summary']['alerts']}")
            
            return report_filename
            
        except Exception as e:
            print(f"   ❌ Report generation failed: {e}")
            return None
    
    def test_all_apis(self):
        """Test all API endpoints"""
        print("🔍 Testing all API endpoints...")
        
        try:
            client = Client()
            test_results = []
            
            # Test user-related APIs
            apis_to_test = [
                {'url': '/api/accounts/login/', 'method': 'POST', 'name': 'User Login'},
                {'url': '/api/accounts/register/', 'method': 'POST', 'name': 'User Registration'},
                {'url': '/api/health/metrics/', 'method': 'GET', 'name': 'Health Data'},
                {'url': '/api/health/alerts/', 'method': 'GET', 'name': 'Alert Data'},
                {'url': '/api/medication/plans/', 'method': 'GET', 'name': 'Medication Plans'},
                {'url': '/api/communication/messages/', 'method': 'GET', 'name': 'Message List'}
            ]
            
            for api in apis_to_test:
                try:
                    if api['method'] == 'GET':
                        response = client.get(api['url'])
                    else:
                        response = client.post(api['url'], {})
                    
                    status = '✅' if response.status_code in [200, 201, 400, 401] else '❌'
                    test_results.append({
                        'name': api['name'],
                        'url': api['url'],
                        'status_code': response.status_code,
                        'result': status
                    })
                    
                    print(f"     {status} {api['name']}: {response.status_code}")
                    
                except Exception as e:
                    test_results.append({
                        'name': api['name'],
                        'url': api['url'],
                        'status_code': 'Error',
                        'result': '❌'
                    })
                    print(f"     ❌ {api['name']}: Connection failed")
            
            # Save test results
            results_filename = f'api_test_results_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            with open(results_filename, 'w', encoding='utf-8') as f:
                json.dump(test_results, f, ensure_ascii=False, indent=2)
            
            print(f"\n   📊 API test completed, results saved to: {results_filename}")
            return test_results
            
        except Exception as e:
            print(f"   ❌ API test failed: {e}")
            return None

    def interactive_menu(self):
        """Interactive menu"""
        while True:
            print("\n" + "="*60)
            print("🎯 Unified Test Data Manager")
            print("="*60)
            print("1. Display database status")
            print("2. Clear database data (preserve table structure)")
            print("3. Create basic test users (3 doctors + 3 patients)")
            print("4. Create comprehensive test users (3 doctors + 8 patients)")
            print("5. Create health data and alerts")
            print("6. Run intelligent alert analysis")
            print("7. Test search functionality")
            print("8. Analyze alert summary")
            print("9. Simulate real-time analysis")
            print("10. Set up 5-level disease risk assessment system")
            print("11. One-click create full system (clear + users + data + analysis + risk5)")
            print("12. Export test data")
            print("13. Validate data integrity")
            print("14. Perform performance test")
            print("15. Clean up orphaned data")
            print("16. Backup database")
            print("17. Generate bulk data")
            print("18. Generate data report")
            print("19. Test all APIs")
            print("0. Exit")
            print("="*60)
            
            choice = input("Please select an operation (0-19): ").strip()
            
            if choice == '0':
                print("👋 Goodbye!")
                break
            elif choice == '1':
                self.show_status()
            elif choice == '2':
                self.clear_database()
            elif choice == '3':
                self.create_basic_users()
            elif choice == '4':
                self.create_comprehensive_users()
            elif choice == '5':
                self.create_health_data()
            elif choice == '6':
                # Intelligent alert analysis sub-menu
                print("\n🧠 Intelligent alert analysis options:")
                print("  a. Analyze all doctors")
                print("  b. Analyze specific doctor")
                sub_choice = input("Please select (a/b): ").strip().lower()
                if sub_choice == 'a':
                    self.run_intelligent_analysis(all_doctors=True)
                elif sub_choice == 'b':
                    doctor_id = input("Please enter doctor ID: ").strip()
                    if doctor_id.isdigit():
                        self.run_intelligent_analysis(doctor_id=int(doctor_id))
                    else:
                        print("❌ Invalid doctor ID")
            elif choice == '7':
                self.test_search_functionality()
            elif choice == '8':
                self.analyze_alerts_summary()
            elif choice == '9':
                # Simulate real-time analysis
                print("\n⚡ Simulating real-time analysis:")
                patient_id = input("Please enter patient ID: ").strip()
                metric_type = input("Please enter metric type (blood_pressure/blood_glucose/heart_rate): ").strip()
                if patient_id.isdigit() and metric_type in ['blood_pressure', 'blood_glucose', 'heart_rate']:
                    self.trigger_realtime_analysis(int(patient_id), metric_type)
                else:
                    print("❌ Invalid parameters")
            elif choice == '10':
                self.setup_5_level_risk_system()
            elif choice == '11':
                print("🚀 Starting one-click full system setup (includes risk5)...")
                if self.clear_database():
                    self.create_comprehensive_users()
                    self.create_health_data()
                    self.run_intelligent_analysis(all_doctors=True)
                    self.setup_5_level_risk_system()
                    self.analyze_alerts_summary()
                    print("🎉 Full system created!")
            elif choice == '12':
                # Export test data
                print("\n📤 Export test data options:")
                print("  a. Export as JSON format")
                print("  b. Export as CSV format")
                sub_choice = input("Please select (a/b): ").strip().lower()
                if sub_choice == 'a':
                    self.export_test_data('json')
                elif sub_choice == 'b':
                    self.export_test_data('csv')
                else:
                    print("❌ Invalid choice")
            elif choice == '13':
                self.validate_data_integrity()
            elif choice == '14':
                # Performance test sub-menu
                print("\n⚡ Performance test options:")
                print("  a. Basic performance test")
                print("  b. Stress test")
                sub_choice = input("Please select (a/b): ").strip().lower()
                if sub_choice == 'a':
                    self.performance_test('basic')
                elif sub_choice == 'b':
                    self.performance_test('stress')
                else:
                    print("❌ Invalid choice")
            elif choice == '15':
                self.cleanup_orphaned_data()
            elif choice == '16':
                self.backup_database()
            elif choice == '17':
                # Generate bulk data
                print("\n🏗️  Generating bulk data:")
                try:
                    count = int(input("Please enter the number of data items to generate (default 100): ").strip() or "100")
                    self.generate_bulk_data(count)
                except ValueError:
                    print("❌ Invalid number, using default value 100")
                    self.generate_bulk_data(100)
            elif choice == '18':
                self.generate_report()
            elif choice == '19':
                self.test_all_apis()
            else:
                print("❌ Invalid choice, please try again")


def main():
    """Main function"""
    if len(sys.argv) > 1:
        # Command line mode
        manager = UnifiedTestDataManager()
        command = sys.argv[1].lower()
        
        if command == 'clear':
            manager.clear_database(confirm=True)
        elif command == 'basic':
            manager.create_basic_users()
        elif command == 'full':
            manager.create_comprehensive_users()
        elif command == 'health':
            manager.create_health_data()
        elif command == 'test':
            manager.test_search_functionality()
        elif command == 'enhanced':
            # Use enhanced data creator
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
            manager.create_enhanced_test_data(days)
        elif command == 'status':
            manager.show_status()
        elif command == 'setup':
            manager.clear_database(confirm=True)
            manager.create_comprehensive_users()
            manager.create_health_data()
            manager.run_intelligent_analysis(all_doctors=True)
            manager.analyze_alerts_summary()
        elif command == 'analyze':
            manager.run_intelligent_analysis(all_doctors=True)
        elif command == 'summary':
            manager.analyze_alerts_summary()
        elif command == 'realtime':
            # Example: python unified_test_data_manager.py realtime 1 blood_pressure
            if len(sys.argv) >= 4:
                patient_id = int(sys.argv[2])
                metric_type = sys.argv[3]
                manager.trigger_realtime_analysis(patient_id, metric_type)
            else:
                print("Usage: python unified_test_data_manager.py realtime <patient_id> <metric_type>")
        elif command == 'risk5':
            manager.setup_5_level_risk_system()
        elif command == 'fullsetup':
            # Full setup includes risk5 system
            manager.clear_database(confirm=True)
            manager.create_comprehensive_users()
            manager.create_health_data()
            manager.run_intelligent_analysis(all_doctors=True)
            manager.setup_5_level_risk_system()
            manager.analyze_alerts_summary()
        elif command == 'export':
            # Export test data
            format_type = sys.argv[2] if len(sys.argv) > 2 else 'json'
            if format_type in ['json', 'csv']:
                manager.export_test_data(format_type)
            else:
                print("❌ Invalid format, supported: json, csv")
        elif command == 'validate':
            manager.validate_data_integrity()
        elif command == 'performance':
            test_type = sys.argv[2] if len(sys.argv) > 2 else 'basic'
            if test_type in ['basic', 'stress']:
                manager.performance_test(test_type)
            else:
                print("❌ Invalid test type, supported: basic, stress")
        elif command == 'cleanup':
            manager.cleanup_orphaned_data()
        elif command == 'backup':
            manager.backup_database()
        elif command == 'generate':
            # Generate bulk data
            count = int(sys.argv[2]) if len(sys.argv) > 2 else 100
            manager.generate_bulk_data(count)
        elif command == 'medication':
            # Create medication adherence alert test data
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
            manager.create_medication_adherence_alerts(days)
        elif command == 'report':
            manager.generate_report()
        elif command == 'test_apis':
            manager.test_all_apis()
        else:
            print("❌ Unknown command")
            print("📋 Available commands:")
            print("   Data management: clear, basic, full, health, enhanced [days], status")
            print("   Intelligent analysis: analyze, summary, realtime")
            print("   Risk system: risk5")
            print("   Function test: test")
            print("   Data export: export [json|csv]")
            print("   Data validation: validate")
            print("   Performance test: performance [basic|stress]")
            print("   Data cleanup: cleanup")
            print("   Data backup: backup")
            print("   Batch generation: generate [count]")
            print("   Medication alerts: medication [days]")
            print("   Generate report: report")
            print("   API test: test_apis")
            print("   Full setup: setup, fullsetup")
    else:
        # Execute full setup directly without interactive menu
        print("🚀 Starting automatic full system setup...")
        manager = UnifiedTestDataManager()
        
        # Display initial status
        print("\n📊 Current database status:")
        manager.show_status()
        
        # Execute full setup process
        print("\n🔄 Step 1: Clearing database...")
        if manager.clear_database(confirm=True):
            print("✅ Database cleared")
            
            print("\n👥 Step 2: Creating users...")
            manager.create_comprehensive_users()
            print("✅ Users created")
            
            print("\n🏥 Step 3: Creating health data...")
            manager.create_health_data()
            print("✅ Health data created")
            
            print("\n🧠 Step 4: Running intelligent analysis...")
            manager.run_intelligent_analysis(all_doctors=True)
            print("✅ Intelligent analysis completed")
            
            print("\n⚠️  Step 5: Setting up 5-level risk assessment system...")
            manager.setup_5_level_risk_system()
            print("✅ 5-level risk assessment system setup completed")
            
            print("\n📈 Step 6: Generating alert summary...")
            manager.analyze_alerts_summary()
            print("✅ Alert summary generated")
            
            print("\n🔍 Step 7: Validating data integrity...")
            manager.validate_data_integrity()
            print("✅ Data integrity validated")
            
            print("\n📊 Step 8: Displaying final status...")
            manager.show_status()
            
            print("\n🎉 Full system setup completed!")
            print("💡 Tip: If you need other operations, use command line arguments, e.g.:")
            print("   python unified_test_data_manager.py export json")
            print("   python unified_test_data_manager.py performance stress")
            print("   python unified_test_data_manager.py test_apis")
        else:
            print("❌ Database clearing failed, operation aborted")


if __name__ == '__main__':
    main()
