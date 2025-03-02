import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import EmployerForm from './EmployerForm';

const EmployerList = () => {
  const navigate = useNavigate();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/users/', {
        params: {
          role: 'employer'
        }
      });
      setEmployers(response.data);
    } catch (error) {
      message.error('获取雇主列表失败');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setSelectedEmployer(null);
    setModalVisible(true);
  };

  const handleEdit = (employer) => {
    setSelectedEmployer(employer);
    setModalVisible(true);
  };

  const handleDelete = async (employerId) => {
    try {
      await axios.delete(`/users/${employerId}/`);
      message.success('删除成功');
      fetchEmployers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleFormSuccess = () => {
    setModalVisible(false);
    fetchEmployers();
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'Name',
      key: 'name',
    },
    {
      title: 'Department',
      dataIndex: 'Department',
      key: 'department',
    },
    {
      title: 'Phone',
      dataIndex: 'Phone',
      key: 'phone',
    },
    {
      title: 'Address',
      dataIndex: 'Address',
      key: 'address',
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => navigate(`/dashboard/employers/${record.EmployerID}/profile`)}>
            View Profile
          </Button>
          <Button type="link" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.EmployerID)}>
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
          Add Employer
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={employers}
        loading={loading}
        rowKey="EmployerID"
      />
      <Modal
        title={selectedEmployer ? 'Edit Employer' : 'Add Employer'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <EmployerForm
          employer={selectedEmployer}
          onSuccess={handleFormSuccess}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default EmployerList;