# Chronic Disease Management System - React Native App

A cross-platform mobile application designed for chronic disease patients and doctors, supporting health data management, medication reminders, doctor-patient communication, and more.

## Features

### Patient Features
- **Health Metrics Entry** - Blood pressure, blood glucose, heart rate, weight, and other health data input
- **Health Trend Charts** - Historical data visualization
- **Medication Reminders** - Smart medication reminders and confirmation
- **Doctor Recommendations** - Real-time health guidance from doctors
- **Doctor-Patient Communication** - Online chat consultation with doctors
- **Personal Profile** - View and manage personal health records

### Doctor Features
- **Patient List Management** - View and manage assigned patient information
- **Alert Processing** - Handle patient health anomaly alerts
- **Remote Communication** - Real-time chat with patients
- **Medication Plan Creation** - Create and adjust medication plans for patients
- **Recommendation Sending** - Send health management advice to patients

## Tech Stack

- **Frontend Framework**: React Native + Expo
- **Navigation**: React Navigation v6
- **State Management**: Redux Toolkit
- **UI Components**: React Native Paper
- **Network Requests**: Axios
- **Push Notifications**: Expo Notifications
- **Charts**: React Native Chart Kit
- **Chat UI**: React Native Gifted Chat
- **Secure Storage**: Expo Secure Store

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── CustomButton.js
│   ├── CustomCard.js
│   └── ...
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── patient/        # Patient screens
│   └── doctor/         # Doctor screens
├── navigation/         # Navigation configuration
│   ├── AppNavigator.js
│   ├── PatientNavigator.js
│   └── DoctorNavigator.js
├── store/              # Redux state management
│   ├── store.js
│   └── slices/
├── services/           # API and services
│   ├── api.js
│   └── notifications.js
└── utils/              # Utility functions
    └── helpers.js
```

## Installation and Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Install Dependencies
```bash
cd chronic-disease-app
npm install
```

### Run the Project
```bash
# Start development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web browser
npm run web
```

## Configuration

### Backend API Configuration
Modify the backend API address in `src/services/api.js`:
```javascript
const BASE_URL = 'https://your-django-backend.com/api';
```

### Push Notification Configuration
Configure Expo project ID in `src/services/notifications.js`:
```javascript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id',
});
```

## Django Backend Integration

### Required API Endpoints
The backend should provide the following RESTful API endpoints:

#### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/validate-token/` - Validate token
- `POST /api/auth/refresh/` - Refresh token

#### User Management
- `GET /api/user/profile/` - Get user profile
- `PATCH /api/user/profile/` - Update user profile
- `POST /api/user/health-metrics/` - Submit health metrics
- `GET /api/user/health-trends/` - Get health trends

#### Patient Management (Doctor Side)
- `GET /api/doctor/patients/` - Get patient list
- `GET /api/doctor/patients/{id}/` - Get patient details
- `PUT /api/doctor/patients/{id}/medication-plan/` - Update medication plan

#### Alert Management
- `GET /api/alerts/` - Get alert list
- `PATCH /api/alerts/{id}/` - Process alerts

#### Messaging
- `GET /api/messages/conversations/` - Get conversation list
- `POST /api/messages/conversations/{id}/messages/` - Send messages

#### Push Notifications
- `POST /api/notifications/register-token/` - Register push token

### Authentication Mechanism
The app uses JWT tokens for authentication:
1. Get token after successful login
2. Store token in Expo SecureStore
3. Automatically add token to headers for each API request
4. Clear token and redirect to login page when expired

## Accessibility Features

- **Large Font Sizes** - Minimum 16sp, suitable for elderly users
- **High Contrast** - Dark text on light background
- **Large Button Sizes** - Minimum 48dp height with adequate spacing
- **Clean Interface** - Reduce complex elements and distractions
- **Clear Navigation** - Use familiar icons and terminology
- **Error Tolerance** - Provide confirmation for important operations

## Development and Debugging

### Using Expo Development Tools
- Scan QR code to run on real devices
- Hot reload for quick preview
- Remote debugging for JavaScript code

### State Management Debugging
Use Redux DevTools to view state changes:
```javascript
// Already configured in store.js
```

### Network Debugging
Use Flipper or proxy tools to view API requests.

## Building and Publishing

### Android Build
```bash
# Using EAS Build service
npx eas build -p android --profile production
```

### iOS Build
```bash
# Using EAS Build service (requires Apple Developer account)
npx eas build -p ios --profile production
```

## Important Notes

1. **Push notifications only work on real devices**
2. **Need to configure correct API addresses and authentication**
3. **iOS builds require Apple Developer account**
4. **Follow App Store review guidelines**

## Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Submit a Pull Request

## License

MIT License

## Contact

For questions or suggestions, please contact the development team.

---

# Quick Start Guide

## 1. Clone the Project
```bash
git clone <repository-url>
cd chronic-disease-app
```

## 2. Install Dependencies
```bash
npm install
```

## 3. Configure Backend API
Edit `src/services/api.js` and set the correct backend address.

## 4. Start Development Server
```bash
npm start
```

## 5. Test on Device
Use Expo Go app to scan QR code, or run in simulator.

You can now start developing and testing the application! 