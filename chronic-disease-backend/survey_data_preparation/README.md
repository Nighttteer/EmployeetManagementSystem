# Intelligent Test Data Generation System

This is an algorithm-based intelligent test data generation system that provides authentic, diverse test data for the chronic disease application backend.

## 🎯 System Features

### ✨ Algorithm-Driven Intelligence
- **Personalized Data Generation**: Dynamically generates data based on patient age, gender, health status, and other characteristics
- **Physiological Principles**: Considers circadian rhythms, seasonal effects, stress factors, and other real physiological phenomena
- **Disease Risk Assessment**: Dynamically calculates various disease risks and generates corresponding health indicators
- **No Fixed Patterns**: Each run produces different, more realistic test data

### 🔬 Scientific Data Models
- **Blood Pressure Data**: Considers age, gender, disease risk, stress, diurnal variation, seasonal effects
- **Heart Rate Data**: Based on age, activity level, stress, circadian rhythm
- **Weight Data**: Considers long-term trends, activity level, seasonal changes
- **Blood Glucose Data**: Based on disease risk, post-meal timing, activity level, stress factors

## 📁 File Structure

```
survey_data_preparation/
├── unified_test_data_manager.py    # Unified test data manager (main script)
└── README.md                       # This documentation

chronic-disease-backend/
├── health/management/commands/
│   └── create_test_data.py        # Django management command: intelligent health data generation
└── manage.py                       # Django management script
```

## 🚀 Quick Start

### 1. One-Click Complete Setup (Recommended)
```bash
cd chronic-disease-backend
python survey_data_preparation/unified_test_data_manager.py
```
This will automatically execute:
- Clear database
- Create complete users (3 doctors + 8 patients)
- Generate intelligent health data (30 days)
- Run intelligent alert analysis
- Set up 5-level risk assessment system
- Verify data integrity

### 2. Step-by-Step Execution
```bash
# Step 1: Create users
python survey_data_preparation/unified_test_data_manager.py full

# Step 2: Generate health data
python manage.py create_test_data --days 30

# Step 3: Run intelligent analysis
python survey_data_preparation/unified_test_data_manager.py analyze
```

## 🎨 Intelligent Data Generation Algorithms

### Patient Characteristic Analysis
```python
# Dynamically calculate patient characteristics
- Basic health level: Based on age, gender
- Stress level: Consider age-related stress factors
- Activity level: Based on age and random factors
- Disease risk: Dynamically calculate various disease risks
- Seasonal effects: Consider health impacts of winter, summer, spring, autumn
```

### Data Generation Examples
```python
# Blood pressure generation algorithm
base_systolic = 110 + (age - 30) * 0.5
+ Disease risk impact (+20 when hypertension risk > 0.6)
+ Stress impact (stress level * 15)
+ Diurnal variation (+10 in morning/evening, -5 at other times)
+ Seasonal effects (+5 in winter, -3 in summer)
+ Random fluctuation (-8 to +8)

# Heart rate generation algorithm
base_hr = 80 - (age - 30) * 0.3
+ Activity level impact ((1 - activity level) * 20)
+ Stress impact (stress level * 15)
+ Diurnal variation (+10 in morning, -15 at night)
+ Random fluctuation (-10 to +10)
```

## 📊 Generated Data Types

### Health Indicators
- **Blood Pressure**: Systolic/diastolic, considering diurnal and seasonal changes
- **Heart Rate**: Based on activity and stress levels
- **Weight**: Long-term trends + short-term fluctuations
- **Blood Glucose**: Post-meal effects + disease risk

### Data Volume
- Each patient generates 4 health indicators daily
- Default generation: 30 days
- 8 patients × 4 indicators × 30 days = 960 health records

## 🔧 Usage Methods

### Interactive Mode
```bash
python survey_data_preparation/unified_test_data_manager.py
```

### Command Line Mode

#### Basic Data Management
```bash
# Check status
python unified_test_data_manager.py status

# Clear database
python unified_test_data_manager.py clear

# Create users
python unified_test_data_manager.py basic      # 3 doctors + 3 patients
python unified_test_data_manager.py full       # 3 doctors + 8 patients
```

#### Intelligent Data Generation
```bash
# Use Django management command to generate data
python manage.py create_test_data --days 30           # Generate 30 days of data
python manage.py create_test_data --days 7 --patients 1  # Generate 7 days for 1 patient

# Run intelligent analysis
python unified_test_data_manager.py analyze
```

#### Advanced Features
```bash
# Set up 5-level risk system
python unified_test_data_manager.py risk5

# Verify data integrity
python unified_test_data_manager.py validate

# Export data
python unified_test_data_manager.py export json
python unified_test_data_manager.py export csv
```

## 📋 Test Accounts

### Doctor Accounts
- **Dr. Li**: +8613800138001 / test123456
- **Dr. Wang**: +8613800138021 / test123456  
- **Dr. Zhang**: +8613800138022 / test123456

### Patient Accounts
- **Zhang San**: +8613800138000 / test123456
- **Li Si**: +8613800138002 / test123456
- **Wang Wu**: +8613800138003 / test123456
- **Zhao Liu**: +8613800138004 / test123456
- **Liu Qi**: +8613800138005 / test123456
- **Chen Ba**: +8613800138006 / test123456
- **Sun Jiu**: +8613800138007 / test123456
- **Zhou Shi**: +8613800138008 / test123456

## 🎯 5-Level Risk Assessment System

The system automatically sets up 5 risk states:

1. **Unassessed** (unassessed): Doctor has not yet assessed
2. **Healthy** (healthy): No chronic diseases
3. **Low Risk** (low): Arthritis, migraines, etc.
4. **Medium Risk** (medium): Diabetes, hypertension, etc.
5. **High Risk** (high): Cancer, heart disease, etc.

## 🔬 Technical Architecture

### Core Components
- **Patient Characteristic Analyzer**: Dynamically analyzes patient characteristics
- **Health Data Generator**: Generates personalized data based on algorithms
- **Seasonal Factor Calculator**: Considers seasonal impacts on health
- **Disease Risk Assessor**: Dynamically calculates disease risks

### Algorithm Features
- **Personalization**: Each patient has unique health patterns
- **Authenticity**: Data generation based on physiological principles
- **Diversity**: Each run produces different data
- **Correlation**: Reasonable correlations between different health indicators

## 📈 Data Quality Assurance

### Data Range Control
- Blood pressure: Systolic 90-200 mmHg, Diastolic 60-120 mmHg
- Heart rate: 45-120 bpm
- Weight: 40-120 kg
- Blood glucose: 3.5-15.0 mmol/L

### Physiological Reasonableness
- Circadian rhythm: Higher blood pressure and heart rate in the morning
- Seasonal effects: Slightly higher blood pressure in winter, increased activity in summer
- Age correlation: Slight changes in baseline blood pressure and heart rate with age
- Stress impact: Increased blood pressure and heart rate under stress

## ⚠️ Important Notes

1. **Environment Requirements**: Ensure Django environment is properly configured
2. **Database Permissions**: Ensure sufficient database operation permissions
3. **Data Safety**: Database clearing operations are irreversible, use with caution
4. **Backup Recommendations**: Please backup important data in advance

## 🆘 Common Issues

### Q: Runtime error "ModuleNotFoundError"
A: Ensure you are running in the `chronic-disease-backend` directory

### Q: Database connection failure
A: Check database configuration in Django settings file

### Q: 5-level risk system setup failure
A: Ensure sufficient patient users are created first (at least 5)

### Q: Slow data generation
A: This is normal, the algorithm needs to calculate personalized parameters for each patient

## 🎉 System Advantages

1. **High Authenticity**: Based on physiological principles, data closer to real situations
2. **Personalization**: Each patient has unique health patterns
3. **Intelligence**: Automatically analyzes patient characteristics and generates corresponding data
4. **Scalability**: Easy to add new health indicators and algorithms
5. **Consistency**: Reasonable medical correlations between data

## 📞 Technical Support

If you have issues, please check:
1. Django environment configuration
2. Database connection status
3. Model field definitions
4. Dependency package installation status

---

**Note**: The data generated by this system is for testing purposes only and should not be used for clinical diagnosis or medical decision-making.
