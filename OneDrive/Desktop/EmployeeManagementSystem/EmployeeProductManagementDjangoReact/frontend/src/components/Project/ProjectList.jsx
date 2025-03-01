import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Modal, message } from 'antd';
import axios from '../../utils/axios';
import ProjectForm from './ProjectForm';
import moment from 'moment';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employers, setEmployers] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));
  const isEmployer = user?.role === 'employer';

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchEmployers();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/projects/');
      setProjects(response.data);
    } catch (error) {
      message.error('Failed to get project list');
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/users/', {
        params: {
          role: 'employee'
        }
      });
      setEmployees(response.data);
    } catch (error) {
      message.error('Failed to get employee list');
    }
  };

  const fetchEmployers = async () => {
    try {
      const response = await axios.get('/users/', {
        params: {
          role: 'employer'
        }
      });
      setEmployers(response.data);
    } catch (error) {
      message.error('Failed to get employer list');
    }
  };

  const handleDelete = async (projectId) => {
    try {
      await axios.delete(`/projects/${projectId}/`);
      message.success('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      message.error('Delete failed');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingProject(null);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    fetchProjects();
  };

  const handleView = (project) => {
    // Implementation of handleView function
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'completed':
        return 'blue';
      case 'pending':
        return 'orange';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'ProjectName',
      key: 'projectName',
    },
    {
      title: 'Start Date',
      dataIndex: 'StartDate',
      key: 'startDate',
    },
    {
      title: 'End Date',
      dataIndex: 'EndDate',
      key: 'endDate',
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'active' ? 'In Progress' :
           status === 'pending' ? 'Pending' : 'Completed'}
        </Tag>
      ),
    },
    {
      title: 'Project Owner',
      dataIndex: 'employer',
      key: 'employer_name',
      render: (employer) => (
        <span>
          <Tag key={employer}>
              {
                employers.find(e=>e.id === employer)?.username
              }
              -
              {
                employers.find(e=>e.id === employer)?.name
              }
          </Tag>
        </span>
      ),
    },
    {
      title: 'Project Manager',
      dataIndex: 'manager',
      key: 'manager',
      render: (manager) => (
        <span>
          <Tag key={manager}>
              {
                employees.find(e=>e.id === manager)?.username
              }
              -
              {
                employees.find(e=>e.id === manager)?.name
              }
          </Tag>
        </span>
      ),
    },
    {
      title: 'Project Members',
      dataIndex: 'members',
      key: 'members',
      render: (members) => (
        <span>
          {members?.map(member => (
            <Tag key={member.employee}>
              {member.employee_name} ({member.role})
            </Tag>
          ))}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {isEmployer && (
            <>
              <Button type="link" onClick={() => handleEdit(record)}>
                Edit
              </Button>
              <Button type="link" danger onClick={() => handleDelete(record.ProjectID)}>
                Delete
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {isEmployer && (
          <Button type="primary" onClick={() => setModalVisible(true)}>
            Add Project
          </Button>
        )}
      </div>
      <Table 
        columns={columns} 
        dataSource={projects}
        loading={loading}
        rowKey="ProjectID"
      />
      <Modal
        title={editingProject ? 'Edit Project' : 'Add Project'}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        destroyOnClose={true}
      >
        <ProjectForm
          key={editingProject?.ProjectID || 'new'}
          project={editingProject}
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};

export default ProjectList;