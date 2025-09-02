#!/usr/bin/env python3
"""
Enhanced Health Data Creation Script
Creates realistic health data that can trigger various alerts
"""
import os
import sys
import django
from datetime import datetime, timedelta
import random
import json

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from accounts.models import User
from health.models import HealthMetric, Alert, ThresholdSetting, DoctorPatientRelation

from django.utils import timezone


class EnhancedDataCreator:
    """Enhanced Health Data Creator"""
    
    def __init__(self):
        print("🎯 Enhanced Health Data Creator initialization completed")
        
        # Define thresholds and abnormal values for various health metrics
        self.thresholds = {
            'blood_pressure': {
                'normal': {'systolic': (90, 140), 'diastolic': (60, 90)},
                'warning': {'systolic': (140, 160), 'diastolic': (90, 100)},
                'danger': {'systolic': (160, 200), 'diastolic': (100, 120)},
                'critical': {'systolic': (200, 250), 'diastolic': (120, 150)}
            },
            'blood_glucose': {
                'normal': (3.9, 7.0),
                'warning': (7.0, 11.0),
                'danger': (11.0, 15.0),
                'critical': (15.0, 25.0)
            },
            'heart_rate': {
                'normal': (60, 100),
                'warning': (100, 120),
                'danger': (120, 150),
                'critical': (150, 200)
            },
            'weight': {
                'normal': (45, 80),
                'warning': (80, 100),
                'danger': (100, 120),
                'critical': (120, 150)
            },
            'uric_acid': {
                'normal': (150, 420),
                'warning': (420, 500),
                'danger': (500, 600),
                'critical': (600, 800)
            },
            'lipids': {
                'normal': {'total': (3.1, 5.7), 'hdl': (1.0, 1.6), 'ldl': (2.1, 3.4), 'triglyceride': (0.4, 1.7)},
                'warning': {'total': (5.7, 6.5), 'hdl': (0.9, 1.0), 'ldl': (3.4, 4.1), 'triglyceride': (1.7, 2.3)},
                'danger': {'total': (6.5, 8.0), 'hdl': (0.8, 0.9), 'ldl': (4.1, 5.0), 'triglyceride': (2.3, 4.0)},
                'critical': {'total': (8.0, 10.0), 'hdl': (0.6, 0.8), 'ldl': (5.0, 7.0), 'triglyceride': (4.0, 6.0)}
            }
        }
    
    def create_realistic_health_data(self, patient, days_back=30):
        """Create realistic health data for a patient, including various abnormal situations"""
        print(f"📊 Creating health data for patient {patient.name}...")
        
        created_metrics = []
        
        # Create different patterns of health data for each patient
        patient_pattern = self._get_patient_pattern(patient)
        
        for day in range(days_back, -1, -1):
            date = timezone.now() - timedelta(days=day)
            
            # Create 1-3 records per day
            records_per_day = random.randint(1, 3)
            
            for record in range(records_per_day):
                # Randomly select metric type (based on HealthMetric model supported fields)
                metric_type = random.choice(['blood_pressure', 'blood_glucose', 'heart_rate', 'weight', 'uric_acid', 'lipids'])
                
                # Generate data based on patient pattern
                metric_data = self._generate_metric_data(metric_type, patient_pattern, date)
                
                if metric_data:
                    # Create health record
                    health_metric = HealthMetric.objects.create(
                        patient=patient,
                        measured_by=patient,  # Patient measures themselves
                        metric_type=metric_type,
                        **metric_data,
                        measured_at=date + timedelta(hours=random.randint(0, 23)),
                        note=self._generate_note(metric_type, metric_data)
                    )
                    
                    created_metrics.append(health_metric)
                    
                    # Check if threshold alert needs to be created
                    if self._should_create_threshold_alert(metric_type, metric_data):
                        self._create_threshold_alert(patient, health_metric, metric_type, metric_data)
        
        print(f"   ✅ Created {len(created_metrics)} health records")
        return created_metrics
    
    def _get_patient_pattern(self, patient):
        """Determine health data pattern based on patient characteristics"""
        # Generate different patterns based on patient ID for reproducibility
        random.seed(patient.id)
        
        patterns = ['healthy', 'hypertension', 'diabetes', 'cardiac', 'mixed']
        pattern = random.choice(patterns)
        
        # Reset random seed
        random.seed()
        
        return pattern
    
    def _generate_metric_data(self, metric_type, patient_pattern, date):
        """Generate data based on metric type and patient pattern"""
        if metric_type == 'blood_pressure':
            return self._generate_blood_pressure(patient_pattern, date)
        elif metric_type == 'blood_glucose':
            return self._generate_blood_glucose(patient_pattern, date)
        elif metric_type == 'heart_rate':
            return self._generate_heart_rate(patient_pattern, date)
        elif metric_type == 'weight':
            return self._generate_weight(patient_pattern, date)
        elif metric_type == 'uric_acid':
            return self._generate_uric_acid(patient_pattern, date)
        elif metric_type == 'lipids':
            return self._generate_lipids(patient_pattern, date)
        
        return None
    
    def _generate_blood_pressure(self, pattern, date):
        """Generate blood pressure data"""
        if pattern == 'healthy':
            # Healthy pattern: mostly normal, occasionally high
            if random.random() < 0.8:
                systolic = random.randint(100, 135)
                diastolic = random.randint(65, 85)
            else:
                systolic = random.randint(135, 145)
                diastolic = random.randint(85, 95)
        elif pattern == 'hypertension':
            # Hypertension pattern: mostly high, occasionally normal
            if random.random() < 0.7:
                systolic = random.randint(140, 180)
                diastolic = random.randint(90, 110)
            else:
                systolic = random.randint(120, 140)
                diastolic = random.randint(80, 90)
        else:
            # Other patterns: mixed
            if random.random() < 0.6:
                systolic = random.randint(110, 150)
                diastolic = random.randint(70, 95)
            else:
                systolic = random.randint(150, 170)
                diastolic = random.randint(95, 105)
        
        return {
            'systolic': systolic,
            'diastolic': diastolic
        }
    
    def _generate_blood_glucose(self, pattern, date):
        """Generate blood glucose data"""
        if pattern == 'diabetes':
            # Diabetes pattern: mostly high
            if random.random() < 0.8:
                glucose = random.uniform(8.0, 18.0)
            else:
                glucose = random.uniform(6.0, 8.0)
        elif pattern == 'healthy':
            # Healthy pattern: mostly normal
            if random.random() < 0.9:
                glucose = random.uniform(4.0, 7.0)
            else:
                glucose = random.uniform(7.0, 8.5)
        else:
            # Other patterns: mixed
            if random.random() < 0.7:
                glucose = random.uniform(4.5, 7.5)
            else:
                glucose = random.uniform(7.5, 10.0)
        
        return {'blood_glucose': round(glucose, 1)}
    
    def _generate_heart_rate(self, pattern, date):
        """Generate heart rate data"""
        if pattern == 'cardiac':
            # Cardiac issue pattern: unstable heart rate
            if random.random() < 0.6:
                heart_rate = random.randint(110, 140)
            else:
                heart_rate = random.randint(50, 70)
        elif pattern == 'healthy':
            # Healthy pattern: stable heart rate
            if random.random() < 0.9:
                heart_rate = random.randint(65, 95)
            else:
                heart_rate = random.randint(95, 105)
        else:
            # Other patterns: mixed
            if random.random() < 0.8:
                heart_rate = random.randint(70, 100)
            else:
                heart_rate = random.randint(100, 115)
        
        return {'heart_rate': heart_rate}
    
    def _generate_weight(self, pattern, date):
        """Generate weight data"""
        base_weight = 65.0  # Base weight
        
        if pattern == 'healthy':
            # Healthy pattern: stable weight
            variation = random.uniform(-2.0, 2.0)
        else:
            # Other patterns: weight may vary
            variation = random.uniform(-5.0, 5.0)
        
        weight = base_weight + variation
        return {'weight': round(weight, 1)}
    
    def _generate_uric_acid(self, pattern, date):
        """Generate uric acid data"""
        if pattern == 'healthy':
            # Healthy pattern: normal uric acid
            if random.random() < 0.9:
                uric_acid = random.uniform(150, 420)  # Normal range: 150-420 μmol/L
            else:
                uric_acid = random.uniform(420, 500)  # Occasionally high
        else:
            # Other patterns: uric acid may be high
            if random.random() < 0.7:
                uric_acid = random.uniform(420, 600)  # High
            else:
                uric_acid = random.uniform(150, 420)  # Occasionally normal
        
        return {'uric_acid': round(uric_acid, 1)}
    
    def _generate_lipids(self, pattern, date):
        """Generate lipid data"""
        if pattern == 'healthy':
            # Healthy pattern: normal lipids
            if random.random() < 0.9:
                lipids_total = random.uniform(3.1, 5.7)  # Normal total cholesterol range
                hdl = random.uniform(1.0, 1.6)          # Normal HDL range
                ldl = random.uniform(2.1, 3.4)          # Normal LDL range
                triglyceride = random.uniform(0.4, 1.7)  # Normal triglyceride range
            else:
                # Occasionally high
                lipids_total = random.uniform(5.7, 6.5)
                hdl = random.uniform(0.9, 1.0)
                ldl = random.uniform(3.4, 4.1)
                triglyceride = random.uniform(1.7, 2.3)
        else:
            # Other patterns: lipids may be abnormal
            if random.random() < 0.6:
                # Abnormal lipids
                lipids_total = random.uniform(5.7, 8.0)
                hdl = random.uniform(0.8, 1.0)
                ldl = random.uniform(3.4, 5.0)
                triglyceride = random.uniform(1.7, 4.0)
            else:
                # Occasionally normal
                lipids_total = random.uniform(3.1, 5.7)
                hdl = random.uniform(1.0, 1.6)
                ldl = random.uniform(2.1, 3.4)
                triglyceride = random.uniform(0.4, 1.7)
        
        return {
            'lipids_total': round(lipids_total, 2),
            'hdl': round(hdl, 2),
            'ldl': round(ldl, 2),
            'triglyceride': round(triglyceride, 2)
        }
    

    
    def _should_create_threshold_alert(self, metric_type, metric_data):
        """Determine if a threshold alert needs to be created"""
        if metric_type == 'blood_pressure':
            systolic = metric_data.get('systolic', 0)
            diastolic = metric_data.get('diastolic', 0)
            return systolic > 160 or diastolic > 100
        elif metric_type == 'blood_glucose':
            glucose = metric_data.get('blood_glucose', 0)
            return glucose > 11.0 or glucose < 3.5
        elif metric_type == 'heart_rate':
            heart_rate = metric_data.get('heart_rate', 0)
            return heart_rate > 120 or heart_rate < 50
        elif metric_type == 'uric_acid':
            uric_acid = metric_data.get('uric_acid', 0)
            return uric_acid > 420  # Normal upper limit for uric acid
        elif metric_type == 'lipids':
            lipids_total = metric_data.get('lipids_total', 0)
            hdl = metric_data.get('hdl', 0)
            ldl = metric_data.get('ldl', 0)
            triglyceride = metric_data.get('triglyceride', 0)
            return (lipids_total > 5.7 or hdl < 1.0 or ldl > 3.4 or triglyceride > 1.7)
        
        return False
    
    def _create_threshold_alert(self, patient, health_metric, metric_type, metric_data):
        """Create a threshold alert"""
        # Get the patient's doctor
        doctor_relations = DoctorPatientRelation.objects.filter(
            patient=patient,
            status='active'
        ).first()
        
        if not doctor_relations:
            return
        
        doctor = doctor_relations.doctor
        
        # Generate alert content based on metric type
        if metric_type == 'blood_pressure':
            title = 'Blood Pressure Alert'
            message = f'Patient {patient.name} has abnormal blood pressure: {metric_data["systolic"]}/{metric_data["diastolic"]}mmHg, exceeding normal range'
            priority = 'critical' if metric_data['systolic'] > 180 else 'high'
        elif metric_type == 'blood_glucose':
            title = 'Blood Glucose Alert'
            message = f'Patient {patient.name} has abnormal blood glucose: {metric_data["blood_glucose"]}mmol/L, exceeding normal range'
            priority = 'critical' if metric_data['blood_glucose'] > 15.0 else 'high'
        elif metric_type == 'heart_rate':
            title = 'Heart Rate Alert'
            message = f'Patient {patient.name} has abnormal heart rate: {metric_data["heart_rate"]}bpm, exceeding normal range'
            priority = 'critical' if metric_data['heart_rate'] > 150 else 'high'
        elif metric_type == 'weight':
            title = 'Weight Alert'
            message = f'Patient {patient.name} has abnormal weight: {metric_data["weight"]}kg, exceeding normal range'
            priority = 'medium'
        elif metric_type == 'uric_acid':
            title = 'Uric Acid Alert'
            message = f'Patient {patient.name} has abnormal uric acid: {metric_data["uric_acid"]}μmol/L, exceeding normal range'
            priority = 'high'
        elif metric_type == 'lipids':
            title = 'Lipid Alert'
            message = f'Patient {patient.name} has abnormal lipids: Total Cholesterol {metric_data["lipids_total"]}mmol/L, HDL {metric_data["hdl"]}mmol/L, LDL {metric_data["ldl"]}mmol/L, Triglyceride {metric_data["triglyceride"]}mmol/L'
            priority = 'high'
        else:
            title = 'Health Metric Alert'
            message = f'Patient {patient.name} has abnormal {metric_type}'
            priority = 'medium'
        
        # Check if a similar alert already exists (to avoid duplicates)
        existing_alert = Alert.objects.filter(
            patient=patient,
            assigned_doctor=doctor,
            alert_type='threshold_exceeded',
            status='pending',
            created_at__gte=timezone.now() - timedelta(hours=6)
        ).first()
        
        if not existing_alert:
            Alert.objects.create(
                patient=patient,
                assigned_doctor=doctor,
                alert_type='threshold_exceeded',
                title=title,
                message=message,
                priority=priority,
                status='pending',
                related_metric=health_metric
            )
            print(f"   🚨 Created {priority} priority alert: {title}")
    
    def _generate_note(self, metric_type, metric_data):
        """Generate health record note"""
        notes = {
            'blood_pressure': [
                'Morning measurement',
                'After medication',
                'After exercise',
                'Before bed',
                'Resting state measurement'
            ],
            'blood_glucose': [
                'Fasting measurement',
                '2 hours after meal',
                'Before bed',
                'Before exercise',
                'When feeling unwell'
            ],
            'heart_rate': [
                'Resting state',
                'After light activity',
                'Rest for 5 minutes before measurement',
                'Average of 3 consecutive measurements',
                'When feeling abnormal'
            ],
            'weight': [
                'Morning fasting',
                'Fixed time weekly',
                'After exercise',
                'After diet adjustment',
                'Regularly monitor weight changes'
            ],
            'uric_acid': [
                'Fasting measurement',
                'Measure after avoiding high-purine foods',
                'Regularly monitor uric acid levels',
                'When gout attack occurs',
                'Monitor after medication'
            ],
            'lipids': [
                'Measure after 12 hours fasting',
                'After avoiding high-fat foods',
                'Regular lipid check',
                'Monitor after medication',
                'After diet adjustment'
            ]
        }
        
        note_list = notes.get(metric_type, ['Regular measurement'])
        return random.choice(note_list)
    

    

    
    def create_trend_alerts(self, patient, days_back=30):
        """Create trend alerts"""
        print(f"📈 Creating trend alerts for patient {patient.name}...")
        
        # Get the patient's doctor
        doctor_relations = DoctorPatientRelation.objects.filter(
            patient=patient,
            status='active'
        ).first()
        
        if not doctor_relations:
            print(f"     ⚠️ Patient {patient.name} has no associated doctor, skipping trend alert creation")
            return []
        
        doctor = doctor_relations.doctor
        
        # Create trend alerts
        trend_alerts = [
            {
                'title': 'Blood Pressure Continues to Rise',
                'message': f'Patient {patient.name} has been experiencing high blood pressure for the last 7 days, suggest adjusting treatment plan',
                'priority': 'high',
                'alert_type': 'abnormal_trend'
            },
            {
                'title': 'Blood Glucose Control Unstable',
                'message': f'Patient {patient.name} has unstable blood glucose levels, need to strengthen monitoring',
                'priority': 'medium',
                'alert_type': 'abnormal_trend'
            },
            {
                'title': 'Weight Continues to Increase',
                'message': f'Patient {patient.name} has been experiencing weight gain for 3 weeks, suggest adjusting diet and exercise',
                'priority': 'medium',
                'alert_type': 'abnormal_trend'
            }
        ]
        
        created_alerts = []
        for alert_data in trend_alerts:
            if random.random() < 0.6:  # 60% probability to create trend alert
                alert = Alert.objects.create(
                    patient=patient,
                    assigned_doctor=doctor,
                    alert_type=alert_data['alert_type'],
                    title=alert_data['title'],
                    message=alert_data['message'],
                    priority=alert_data['priority'],
                    status='pending'
                )
                created_alerts.append(alert)
        
        print(f"   ✅ Created {len(created_alerts)} trend alerts")
        return created_alerts
    
    def create_comprehensive_data(self, days_back=30):
        """Create comprehensive health data"""
        print("🏗️ Starting comprehensive health data creation...")
        
        # Get all patients
        patients = User.objects.filter(role='patient', is_active=True)
        
        if not patients.exists():
            print("❌ No patient users found, please create users first")
            return False
        
        total_metrics = 0
        total_alerts = 0
        
        for patient in patients:
            print(f"\n👤 Processing patient: {patient.name}")
            
            # Create health data
            metrics = self.create_realistic_health_data(patient, days_back)
            total_metrics += len(metrics)
            
            # Create trend alerts
            trend_alerts = self.create_trend_alerts(patient, days_back)
            total_alerts += len(trend_alerts)
        
        print(f"\n🎉 Data creation completed!")
        print(f"📊 Summary:")
        print(f"   Health records: {total_metrics} records")
        print(f"   Trend alerts: {total_alerts} alerts")
        
        return True


def main():
    """Main function"""
    creator = EnhancedDataCreator()
    
    # Create 30 days of health data
    success = creator.create_comprehensive_data(days_back=30)
    
    if success:
        print("\n✅ Enhanced health data creation completed!")
        print("🎯 You can now:")
        print("   1. View various types of health alerts")
        print("   2. Test threshold alert detection")
        print("   3. View trend analysis")
        print("   4. Test health data entry functionality")
    else:
        print("\n❌ Data creation failed")


if __name__ == '__main__':
    main()
