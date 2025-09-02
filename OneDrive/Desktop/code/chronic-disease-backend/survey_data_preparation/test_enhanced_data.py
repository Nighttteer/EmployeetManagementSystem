#!/usr/bin/env python3
"""
Test Enhanced Data Creator
Test the enhanced data generation functionality
"""

import os
import sys
import django

# Add project root to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'chronic_disease_backend.settings')
django.setup()

from enhanced_data_creator import EnhancedDataCreator


def test_enhanced_data():
    """Test enhanced data creation"""
    print("🧪 Testing enhanced data creator...")
    
    creator = EnhancedDataCreator()
    
    # Test basic data creation
    print("📊 Testing basic data creation...")
    success = creator.create_basic_data(days_back=7)
    if success:
        print("✅ Basic data creation test passed")
    else:
        print("❌ Basic data creation test failed")
    
    # Test comprehensive data creation
    print("📊 Testing comprehensive data creation...")
    success = creator.create_comprehensive_data(days_back=7)
    if success:
        print("✅ Comprehensive data creation test passed")
    else:
        print("❌ Comprehensive data creation test failed")
    
    # Test specific patient data creation
    print("📊 Testing specific patient data creation...")
    from accounts.models import User
    patients = User.objects.filter(role='patient')[:2]
    if patients.exists():
        for patient in patients:
            success = creator.create_patient_data(patient.id, days_back=3)
            if success:
                print(f"✅ Patient {patient.name} data creation test passed")
            else:
                print(f"❌ Patient {patient.name} data creation test failed")
    else:
        print("⚠️  No patients found for testing")
    
    print("🎉 Enhanced data creator test completed!")


if __name__ == '__main__':
    test_enhanced_data()
