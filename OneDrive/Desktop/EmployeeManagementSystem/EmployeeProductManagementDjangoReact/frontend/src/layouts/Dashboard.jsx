import React from 'react';
import { Layout, Menu, Button, Space, message } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  TeamOutlined,
  ProjectOutlined,
  BellOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const Dashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.is_superuser;
  const isEmployer = user?.role === 'employer';

  // 根据用户类型获取菜单项
  const getMenuItems = () => {
    const items = [];

    // 超级管理员可以看到所有菜单
    if (isAdmin) {
      items.push({
        key: 'employers',
        icon: <TeamOutlined />,
        label: 'Employer Management',
      });
    }

    // 超级管理员和普通雇主可以看到员工管理
    if (isAdmin || isEmployer) {
      items.push({
        key: 'employees',
        icon: <UserOutlined />,
        label: 'Employee Management',
      });
    }

    // 所有用户都可以看到项目和通知
    items.push(
      {
        key: 'projects',
        icon: <ProjectOutlined />,
        label: 'Project Management',
      },
      {
        key: 'notifications',
        icon: <BellOutlined />,
        label: 'Notifications',
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
      }
    );

    return items;
  };

  const handleMenuClick = ({ key }) => {
    navigate(`/dashboard/${key}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    message.success('Logout successfully');
    navigate('/login');
  };

  // 获取默认选中的菜单项
  const getDefaultSelectedKey = () => {
    if (isAdmin) return 'employers';
    if (isEmployer) return 'employees';
    return 'projects';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div style={{ 
          height: '32px', 
          margin: '16px', 
          color: 'white',
          textAlign: 'center',
          fontSize: '18px'
        }}>
          Management System
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[getDefaultSelectedKey()]}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 16px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          <Space>
            <span>Welcome, {user?.username || 'User'}</span>
            <Button 
              type="link" 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;