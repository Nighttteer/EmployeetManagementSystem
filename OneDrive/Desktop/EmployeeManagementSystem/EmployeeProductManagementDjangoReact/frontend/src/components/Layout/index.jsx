import React from 'react';
import { Layout, Breadcrumb } from 'antd';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';

const { Content } = Layout;

const MainLayout = () => {
  const location = useLocation();

  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const items = [];
    let url = '';

    pathSnippets.forEach((snippet, index) => {
      url += `/${snippet}`;
      const isLast = index === pathSnippets.length - 1;

      // 自定义面包屑项的显示文本
      let title = snippet;
      if (snippet === 'employees') title = '员工管理';
      else if (snippet === 'profile') title = '员工档案';
      else if (snippet === 'new') title = '新建';
      else if (snippet === 'edit') title = '编辑';

      items.push(
        isLast ? (
          <Breadcrumb.Item key={url}>{title}</Breadcrumb.Item>
        ) : (
          <Breadcrumb.Item key={url}>
            <Link to={url}>{title}</Link>
          </Breadcrumb.Item>
        )
      );
    });

    return items;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Content style={{ margin: '16px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>
              <Link to="/">首页</Link>
            </Breadcrumb.Item>
            {getBreadcrumbItems()}
          </Breadcrumb>
          <div style={{ padding: 24, background: '#fff' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 