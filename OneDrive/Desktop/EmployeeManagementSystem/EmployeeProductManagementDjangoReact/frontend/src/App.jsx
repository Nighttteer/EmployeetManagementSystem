import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Auth/Login.jsx';
import Dashboard from './layouts/Dashboard.jsx';
import EmployeeList from './components/Employee/EmployeeList.jsx';
import EmployeeProfile from './components/Employee/EmployeeProfile.jsx';
import ProjectList from './components/Project/ProjectList.jsx';
import NotificationList from './components/Notification/NotificationList.jsx';
import EmployerList from './components/Employer/EmployerList';
import EmployerProfile from './components/Employer/EmployerProfile';
import Profile from './components/Profile/Profile.jsx';
import { ConfigProvider } from 'antd';

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user?.token) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [user, navigate, location]);

  return user?.token ? children : null;
};

function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route path="employers" element={<EmployerList />} />
            <Route path="employers/:id/profile" element={<EmployerProfile />} />
            <Route path="employees" element={<EmployeeList />} />
            <Route path="employees/:id/profile" element={<EmployeeProfile />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="notifications" element={<NotificationList />} />
            <Route path="profile" element={<Profile />} />
            <Route index element={<Navigate to="employees" />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;