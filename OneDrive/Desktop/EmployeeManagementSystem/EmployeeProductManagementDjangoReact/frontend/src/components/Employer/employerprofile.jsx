import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Tag, Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import axios from '../../utils/axios';

const EmployerProfile = () => {
  const { id } = useParams();
  const [employer, setEmployer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployerProfile();
  }, [id]);

  const fetchEmployerProfile = async () => {
    try {
      const response = await axios.get(`/users/${id}/profile/`);
      setEmployer(response.data);
    } catch (error) {
      message.error('获取雇主信息失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin />;
  if (!employer) return <div>未找到雇主信息</div>;

  return (
    <div>
      <Card title="雇主基本信息">
        <Descriptions bordered>
          <Descriptions.Item label="姓名">{employer.Name}</Descriptions.Item>
          <Descriptions.Item label="部门">{employer.Department}</Descriptions.Item>
          <Descriptions.Item label="角色">雇主</Descriptions.Item>
          <Descriptions.Item label="邮箱">{employer.Email}</Descriptions.Item>
          <Descriptions.Item label="电话">{employer.Phone}</Descriptions.Item>
          <Descriptions.Item label="地址">{employer.Address}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="管理的项目" style={{ marginTop: 16 }}>
        <Table
          dataSource={employer.managed_projects}
          columns={[
            { 
              title: '项目名称', 
              dataIndex: 'name',
              key: 'name'
            },
            { 
              title: '开始日期', 
              dataIndex: 'start_date',
              key: 'startDate',
              render: date => date ? new Date(date).toLocaleDateString() : '-'
            },
            { 
              title: '结束日期', 
              dataIndex: 'end_date',
              key: 'endDate',
              render: date => date ? new Date(date).toLocaleDateString() : '-'
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              render: status => (
                <Tag color={
                  status === 'active' ? 'green' :
                  status === 'pending' ? 'orange' : 'red'
                }>
                  {status === 'active' ? '进行中' :
                   status === 'pending' ? '待处理' : '已完成'}
                </Tag>
              )
            }
          ]}
          rowKey="id"
        />
      </Card>

      <Card title="团队成员" style={{ marginTop: 16 }}>
        <Table
          dataSource={employer.team_members}
          columns={[
            { 
              title: '姓名', 
              dataIndex: 'Name',
              key: 'name'
            },
            { 
              title: '部门', 
              dataIndex: 'Department',
              key: 'department'
            },
            { 
              title: '职位', 
              dataIndex: 'Role',
              key: 'role',
              render: role => role === 'employee' ? '员工' : '项目经理'
            },
            { 
              title: '电话', 
              dataIndex: 'Phone',
              key: 'phone'
            }
          ]}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default EmployerProfile;