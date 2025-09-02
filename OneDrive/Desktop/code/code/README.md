# Chronic Disease Management System - Complete Guide

## 🚀 **Project Overview**

This is a complete chronic disease management system with Django backend API and React Native mobile application frontend. It supports three user roles (Patient, Doctor, Administrator) and provides health data management, medication management, doctor-patient communication, and other features.

## 📋 **Features**

### 🔐 **User Authentication System**
- JWT Token authentication
- User registration, login, logout
- Multi-role support (Patient, Doctor, Administrator)
- Encrypted password storage
- User profile management

### 🏥 **Health Data Management**
- Health metrics recording (blood pressure, blood glucose, heart rate, weight, etc.)
- Health record management
- Alert threshold settings
- Health data trend analysis
- Anomaly alert system

### 💊 **Medication Management**
- Medication information management
- Medication plan creation
- Medication reminder system
- Medication adherence tracking
- Medication inventory management

### 💬 **Doctor-Patient Communication**
- Real-time messaging system
- Doctor recommendation push
- Message template management
- Notification log recording

## 🛠 **Tech Stack**

- **Backend**: Django 5.2.3 + Django REST Framework + SQLite
- **Frontend**: React Native + Expo + Redux Toolkit
- **Authentication**: JWT Token + SMS verification
- **Database**: SQLite (development environment)

## ⚡ **Quick Start Guide**

### Step 1: Environment Setup

#### 1. Install Python (3.8+)
```bash
# Check Python version
python --version
# or
python3 --version
```

#### 2. Install Node.js (16+)
```bash
# Check Node.js version
node --version
npm --version
```

#### 3. Install Expo CLI
```bash
npm install -g @expo/cli
```

### Step 2: Start Backend Service

#### 1. Navigate to backend directory
```bash
cd chronic-disease-backend
```

#### 2. Create virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install dependencies
```bash
pip install -r requirements.txt
```

#### 4. Database migration
```bash
python manage.py makemigrations
python manage.py migrate
```

#### 5. Create test data (Important)
```bash
python survey_data_preparation/unified_test_data_manager.py
```
Select option 1 for one-click setup to automatically create test users and data.

#### 6. Create superuser (Optional)
```bash
python manage.py createsuperuser
```

#### 7. Start backend service
```bash
# Important: Use 0.0.0.0 to ensure mobile access
python manage.py runserver 0.0.0.0:8000
```

**Backend service address**: `http://0.0.0.0:8000` or `http://your-ip-address:8000`

### Step 3: Start Frontend Application

#### 1. Navigate to frontend directory
```bash
cd chronic-disease-app
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure API address
Edit the `src/services/api.js` file and modify BASE_URL:

```javascript
// Method 1: Use your computer's IP address (Recommended)
const BASE_URL = 'http://192.168.1.100:8000/api';  // Replace with your actual IP

// Method 2: Use localhost (Simulator only)
// const BASE_URL = 'http://localhost:8000/api';
```

**How to get IP address**:
- Windows: `ipconfig`
- macOS/Linux: `ifconfig` or `ip addr`

#### 4. Start Expo development server
```bash
npx expo start
```

### Step 4: Test on Mobile Device

#### Method 1: Using Expo Go App (Recommended)

1. **Download Expo Go**
   - iOS: Search "Expo Go" in App Store
   - Android: Search "Expo Go" in Google Play

2. **Connect to same network**
   - Ensure phone and computer are on the same WiFi network

3. **Scan QR code**
   - Scan the QR code displayed in terminal with Expo Go
   - Or enter the displayed URL address

#### Method 2: Using Simulator

1. **iOS Simulator** (macOS only)
   ```bash
   npx expo start --ios
   ```

2. **Android Simulator**
   ```bash
   npx expo start --android
   ```

## 📊 **Test Data Preparation**

### Automatically create test data
```bash
cd chronic-disease-backend
python survey_data_preparation/unified_test_data_manager.py
```

Select option 1 for one-click setup, which will automatically create:
- 3 doctor accounts
- 8 patient accounts
- 30 days of health data
- Medication plans and reminders
- Intelligent alert data

### Test Accounts
The system will automatically create the following test accounts:

**Doctor Account**:
- Phone: +8613800138001
- Password: test123456

**Patient Accounts**:
- Phone: +8613800138002 to +8613800138009
- Password: test123456

## 🖥️ **Local Development Environment Configuration**

### Unified IP Address Configuration

To ensure normal communication between frontend, backend, and mobile devices, please use the following unified IP address configuration:

#### **Backend Server Configuration**
```bash
# Start Django server (specify IP and port)
python manage.py runserver 0.0.0.0:8000
```

#### **Frontend React Native Configuration**
Set in `chronic-disease-app/src/services/api.js`:
```javascript
const BASE_URL = 'http://192.168.2.47:8000/api';  // Replace with your local IP
```

#### **Get Local IP Address**
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
# or
ip addr show
```

### Complete Local Development Workflow

#### **Step 1: Start Backend Service**
```bash
cd chronic-disease-backend
python manage.py runserver 0.0.0.0:8000
```

#### **Step 2: Start Frontend Development Server**
```bash
cd chronic-disease-app
npm start
```

#### **Step 3: Configure Mobile End**
1. In Expo development tools, ensure using correct IP address
2. Modify BASE_URL in API configuration file
3. Restart mobile application

### Network Configuration Check

#### **Firewall Settings**
Ensure port 8000 is open in local firewall:
```bash
# Windows (Administrator privileges)
netsh advfirewall firewall add rule name="Django Backend" dir=in action=allow protocol=TCP localport=8000

# Linux
sudo ufw allow 8000
```

#### **CORS Configuration Verification**
Confirm CORS settings in `chronic_disease_backend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",      # Expo default port
    "http://127.0.0.1:8081",
    "http://localhost:19006",     # Expo Web port
    "http://127.0.0.1:19006",
    "http://192.168.2.47:8081", # Your local IP:Expo port
    "http://192.168.2.47:19006", # Your local IP:Expo Web port
]

# Allow all sources in development environment
CORS_ALLOW_ALL_ORIGINS = DEBUG
```

## 🔧 **Troubleshooting**

### 1. Mobile cannot connect to backend
**Problem**: Mobile shows network error
**Solution**:
- Ensure using `0.0.0.0:8000` to start backend
- Check firewall settings
- Confirm phone and computer are on same network
- Update IP address in `src/services/api.js`

### 2. CORS error
**Problem**: Browser shows CORS error
**Solution**:
- Check CORS configuration in `chronic_disease_backend/settings.py`
- Restart Django server

### 3. Port already in use
**Problem**: Port 8000 is already in use
**Solution**:
```bash
# Use different port
python manage.py runserver 0.0.0.0:8001
# Then update frontend API address
```

### 4. Dependency installation failed
**Problem**: pip or npm installation failed
**Solution**:
```bash
# Update pip
pip install --upgrade pip

# Clear npm cache
npm cache clean --force
```

### 5. Test data creation failed
**Problem**: Cannot create test data
**Solution**:
```bash
# Ensure in correct directory
cd chronic-disease-backend

# Activate virtual environment
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Re-run test data creation
python survey_data_preparation/unified_test_data_manager.py
```

### 6. Expo Go cannot connect
**Problem**: Mobile cannot load app
**Solution**:
- Ensure phone and computer are on same WiFi network
- Check if firewall is blocking Expo service
- Try tunnel mode: `npx expo start --tunnel`

### 7. Cannot access backend from mobile device
**Solution:**
1. Ensure using `0.0.0.0:8000` to start server
2. Check firewall settings
3. Confirm mobile device and computer are on same network

### 8. Network connection timeout
**Solution:**
1. Check if IP address is correct
2. Confirm port 8000 is not occupied
3. Test network connectivity: `ping <your-ip>`

## 🌐 **Network Configuration**

### Development environment network settings
- **Backend address**: `http://your-ip:8000`
- **API address**: `http://your-ip:8000/api`
- **Admin panel**: `http://your-ip:8000/admin`

### Commands to get IP address
```bash
# Windows
ipconfig | findstr "IPv4"

# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Linux
ip addr show | grep "inet " | grep -v 127.0.0.1
```

## 📚 **API Documentation**

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh Token
- `GET /api/auth/verify/` - Verify Token

### User Profile
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile
- `POST /api/auth/profile/avatar/` - Upload avatar

### Dashboard
- `GET /api/auth/dashboard/` - Get user dashboard data

## 🗃 **Database Architecture**

### Core Models
1. **User** - Unified user model (Patient, Doctor, Administrator)
2. **HealthMetric** - Health metrics recording
3. **HealthRecord** - Health records
4. **ThresholdSetting** - Alert threshold settings
5. **DoctorAdvice** - Doctor recommendations
6. **Medication** - Medication information
7. **MedicationPlan** - Medication plans
8. **MedicationReminder** - Medication reminders
9. **Message** - Doctor-patient communication messages
10. **DoctorPatientRelation** - Doctor-patient relationships
11. **Alert** - Health alerts

## 🔧 **Configuration**

### Environment Variables
Create `.env` file:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1,192.168.2.47
```

### CORS Settings
Default allowed ports:
- `http://localhost:8081` (Expo)
- `http://localhost:19006` (Expo Web)
- `http://192.168.2.47:8081` (Local IP:Expo)
- `http://192.168.2.47:19006` (Local IP:Expo Web)

### JWT Settings
- Access Token validity: 1 day
- Refresh Token validity: 7 days
- Support automatic token rotation

## 📱 **Frontend Integration**

This backend API is designed for React Native applications, supporting:
- JWT authentication header: `Authorization: Bearer <token>`
- JSON data format
- File uploads (avatars, attachments)
- Paginated data
- Real-time notifications

### Mobile End Configuration Example
```javascript
// chronic-disease-app/src/services/api.js
const BASE_URL = 'http://192.168.2.47:8000/api';  // Your local IP

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## 🧪 **Testing**

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test accounts

# Run tests with pytest
pytest

# Generate test coverage report
coverage run --source='.' manage.py test
coverage report
coverage html
```

## 🚀 **Deployment Recommendations**

### Development Environment
- Use `python manage.py runserver 0.0.0.0:8000`
- Enable DEBUG mode
- Use SQLite database

### Production Environment
- Use Gunicorn + Nginx
- Disable DEBUG mode
- Use PostgreSQL database
- Configure HTTPS
- Set environment variables

---

**Note**: This is a development version for demonstration and testing only. Production environment requires additional security configuration and database setup.

🎯 **Complete chronic disease management system with Django backend and React Native frontend designed for patients and medical personnel** 