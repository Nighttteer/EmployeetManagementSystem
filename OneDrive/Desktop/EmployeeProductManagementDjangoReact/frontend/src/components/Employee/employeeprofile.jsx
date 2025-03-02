import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Tag, Spin, message } from 'antd';
import { useParams } from 'react-router-dom';
import axios from '../../utils/axios';

const EmployeeProfile = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeeProfile();
  }, [id]);

  const fetchEmployeeProfile = async () => {
    try {
      const response = await axios.get(`/users/${id}/`);
      setEmployee(response.data);
    } catch (error) {
      message.error('获取员工信息失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin />;
  if (!employee) return <div>未找到员工信息</div>;

  return (
    <div>
      <Card title="员工基本信息">
        <Descriptions bordered>
          <Descriptions.Item label="姓名">{employee.name}</Descriptions.Item>
          <Descriptions.Item label="部门">{employee.department}</Descriptions.Item>
          <Descriptions.Item label="角色">{employee.role }</Descriptions.Item>
          <Descriptions.Item label="电话">{employee.phone}</Descriptions.Item>
          <Descriptions.Item label="地址">{employee.address}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="参与的项目" style={{ marginTop: 16 }}>
        <Table
          dataSource={employee.projects}
          columns={[
            { title: '项目名称', dataIndex: 'name' },
            { title: '角色', dataIndex: 'role' },
            {
              title: '状态',
              dataIndex: 'status',
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

      {employee.managed_projects.length > 0 && (
        <Card title="管理的项目" style={{ marginTop: 16 }}>
          <Table
            dataSource={employee.managed_projects}
            columns={[
              { title: '项目名称', dataIndex: 'name' },
              {
                title: '状态',
                dataIndex: 'status',
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
      )}
    </div>
  );
};

export default EmployeeProfile;