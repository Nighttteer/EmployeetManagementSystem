# Command Summary

This document summarizes all available commands for the test data management system.

## 🚀 Quick Start Commands

### One-Click Complete Setup
```bash
# Automatically execute complete system setup
python survey_data_preparation/unified_test_data_manager.py
```

### Basic Setup
```bash
# Quick setup with minimal users
python survey_data_preparation/quick_setup.py

# Clean up test data
python survey_data_preparation/quick_setup.py cleanup
```

## 📊 Data Management Commands

### User Management
```bash
# Create basic users (3 doctors + 3 patients)
python unified_test_data_manager.py basic

# Create comprehensive users (3 doctors + 8 patients)
python unified_test_data_manager.py full

# Clear all database data
python unified_test_data_manager.py clear
```

### Health Data Generation
```bash
# Generate health data using Django management command
python manage.py create_test_data --days 30
python manage.py create_test_data --days 7 --patients 1

# Generate enhanced health data
python unified_test_data_manager.py enhanced 30
```

### Intelligent Analysis
```bash
# Run intelligent alert analysis for all doctors
python unified_test_data_manager.py analyze

# Run analysis for specific doctor
python unified_test_data_manager.py analyze 1

# Generate alert summary
python unified_test_data_manager.py summary
```

## 🎯 Special Feature Commands

### 5-Level Risk Assessment System
```bash
# Set up 5-level risk assessment system
python unified_test_data_manager.py risk5
```

### Real-time Analysis Simulation
```bash
# Simulate real-time analysis for specific patient and metric
python unified_test_data_manager.py realtime 1 blood_pressure
python unified_test_data_manager.py realtime 2 blood_glucose
```

### Medication Adherence Testing
```bash
# Create medication adherence alert test data
python unified_test_data_manager.py medication 30

# Test medication alert system
python survey_data_preparation/test_medication_alerts.py
```

## 🔍 Testing and Validation Commands

### Function Testing
```bash
# Test search functionality
python unified_test_data_manager.py test

# Test all APIs
python unified_test_data_manager.py test_apis

# Test enhanced data creator
python survey_data_preparation/test_enhanced_data.py
```

### Data Validation
```bash
# Validate data integrity
python unified_test_data_manager.py validate

# Check database status
python unified_test_data_manager.py status

# Analyze alerts summary
python unified_test_data_manager.py summary
```

## 📤 Export and Backup Commands

### Data Export
```bash
# Export data as JSON
python unified_test_data_manager.py export json

# Export data as CSV
python unified_test_data_manager.py export csv
```

### Database Operations
```bash
# Backup database
python unified_test_data_manager.py backup

# Clean up orphaned data
python unified_test_data_manager.py cleanup

# Generate bulk test data
python unified_test_data_manager.py generate 100
```

## 📈 Performance and Analysis Commands

### Performance Testing
```bash
# Basic performance test
python unified_test_data_manager.py performance basic

# Stress test
python unified_test_data_manager.py performance stress
```

### Report Generation
```bash
# Generate data report
python unified_test_data_manager.py report
```

## 🎮 Interactive Mode

### Start Interactive Menu
```bash
python survey_data_preparation/unified_test_data_manager.py
```

Interactive menu options:
1. Display database status
2. Clear database data
3. Create basic test users
4. Create comprehensive test users
5. Create health data and alerts
6. Run intelligent alert analysis
7. Test search functionality
8. Analyze alert summary
9. Simulate real-time analysis
10. Set up 5-level risk assessment system
11. One-click create full system
12. Export test data
13. Validate data integrity
14. Perform performance test
15. Clean up orphaned data
16. Backup database
17. Generate bulk data
18. Generate data report
19. Test all APIs
0. Exit

## 🔧 Advanced Usage Examples

### Complete System Setup with Risk Assessment
```bash
# Full setup including 5-level risk system
python unified_test_data_manager.py fullsetup
```

### Custom Data Generation
```bash
# Generate 60 days of data for specific patient
python manage.py create_test_data --days 60 --patients 3

# Generate enhanced data for last 14 days
python unified_test_data_manager.py enhanced 14
```

### Testing Specific Features
```bash
# Test medication alerts with 7 days of data
python unified_test_data_manager.py medication 7

# Test real-time analysis for heart rate
python unified_test_data_manager.py realtime 1 heart_rate

# Test API endpoints
python unified_test_data_manager.py test_apis
```

## 📋 Command Categories

### Data Creation
- `basic`, `full`, `enhanced` - User and data creation
- `health`, `medication` - Specific data type generation

### Analysis and Testing
- `analyze`, `summary`, `realtime` - Intelligent analysis
- `test`, `test_apis` - Function testing
- `validate` - Data validation

### System Management
- `clear`, `cleanup` - Data management
- `backup`, `export` - Data operations
- `performance` - System testing

### Special Features
- `risk5` - Risk assessment system
- `fullsetup` - Complete system setup

## ⚠️ Important Notes

1. **Environment**: Ensure you are in the `chronic-disease-backend` directory
2. **Dependencies**: Django environment must be properly configured
3. **Data Safety**: Clear operations are irreversible
4. **Backup**: Always backup important data before testing

## 🆘 Troubleshooting

### Common Issues
- **ModuleNotFoundError**: Check directory and Django setup
- **Database errors**: Verify database configuration
- **Permission errors**: Check file and database permissions

### Getting Help
- Use `python unified_test_data_manager.py status` to check system state
- Use `python unified_test_data_manager.py validate` to check data integrity
- Check Django logs for detailed error information
