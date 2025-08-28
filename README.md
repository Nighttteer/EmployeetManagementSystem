# Chronic Disease Management System - Django Backend

## 🚀 **Project Overview**

This is a Django + Django REST Framework based backend API for a chronic disease management system, providing comprehensive data services for React Native mobile applications.

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

- **Framework**: Django 5.2.3
- **API**: Django REST Framework 3.16.0
- **Authentication**: Django REST Framework SimpleJWT
- **CORS**: django-cors-headers
- **Database**: SQLite (Development) / PostgreSQL (Production Recommended)
- **Image Processing**: Pillow

## ⚡ **Quick Start**

### 1. Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (Linux/Mac)
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Database Migration
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

### 5. Start Server
```bash
python manage.py runserver
```

After server startup, access:
- API root endpoint: `http://127.0.0.1:8000/api/`
- Admin backend: `http://127.0.0.1:8000/admin/`

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

### Common Issue Resolution

#### **Issue 1: Cannot access backend from mobile device**
**Solution:**
1. Ensure using `0.0.0.0:8000` to start server
2. Check firewall settings
3. Confirm mobile device and computer are on same network

#### **Issue 2: CORS errors**
**Solution:**
1. Check CORS_ALLOWED_ORIGINS configuration
2. Ensure frontend URL is in allowed list
3. Restart Django server

#### **Issue 3: Network connection timeout**
**Solution:**
1. Check if IP address is correct
2. Confirm port 8000 is not occupied
3. Test network connectivity: `ping <your-ip>`

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

🎯 **Intelligent management system backend designed for chronic disease patients and medical personnel** 