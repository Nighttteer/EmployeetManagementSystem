import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import EmployeeForm from './EmployeeForm.jsx';

const EmployeeList = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/users/', {
        params: {
          role: 'employee'
        }
      });
      setEmployees(response.data);
    } catch (error) {
      message.error('获取员工列表失败');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    setModalVisible(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  const handleDelete = async (employeeId) => {
    try {
      await axios.delete(`/users/${employeeId}/`);
      message.success('删除成功');
      fetchEmployees();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormSuccess = () => {
    setModalVisible(false);
    fetchEmployees();
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Role',
      dataIndex: 'Role',
      key: 'role',
      render: role => role === 'employee' ? 'Employee' : 'Employer'
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => navigate(`/dashboard/employees/${record.id}/profile`)}>
            View Profile
          </Button>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleAdd}>
          Add Employee
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={employees}
        loading={loading}
        rowKey="EmployeeID"
      />
      <Modal
        title={selectedEmployee ? 'Edit Employee' : 'Add Employee'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <EmployeeForm
          employee={selectedEmployee}
          onSuccess={handleFormSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default EmployeeList;