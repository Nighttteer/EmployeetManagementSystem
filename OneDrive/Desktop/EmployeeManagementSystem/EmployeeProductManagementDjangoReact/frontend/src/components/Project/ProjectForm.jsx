import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Select, Button, message } from 'antd';
import axios from '../../utils/axios';
import moment from 'moment';

const { Option } = Select;

const ProjectForm = ({ project, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [employers, setEmployers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchEmployers();
    fetchEmployees();
  }, []);
  // 监听 project 变化，更新表单值
  useEffect(() => {
    if (project) {
      form.setFieldsValue({
        ...project,
        StartDate: moment(project.StartDate),
        EndDate: moment(project.EndDate),
        members: project.members?.map(member => member.employee),
      });
    } else {
      form.resetFields();  // 如果没有 project，重置表单
    }
  }, [project, form]);

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

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = {
        ...values,
        StartDate: values.StartDate.format('YYYY-MM-DD'),
        EndDate: values.EndDate.format('YYYY-MM-DD'),
        member_ids: values.members  // 使用 member_ids 字段
      };

      if (project) {
        await axios.put(`/projects/${project.ProjectID}/`, formData);
        message.success('Project updated successfully');
      } else {
        await axios.post('/projects/', formData);
        message.success('Project created successfully');
      }
      onSuccess();
    } catch (error) {
      message.error('Operation failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
    setLoading(false);
  };
  // 只有雇主可以创建/编辑项目
  if (user.role !== 'employer') {
    return <div>You do not have permission to perform this operation</div>;
  }
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        name="ProjectName"
        label="Project Name"
        rules={[{ required: true, message: 'Please enter project name' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="StartDate"
        label="Start Date"
        rules={[{ required: true, message: 'Please select start date' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="EndDate"
        label="End Date"
        rules={[{ required: true, message: 'Please select end date' }]}
      >
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="Status"
        label="Status"
        rules={[{ required: true, message: 'Please select status' }]}
      >
        <Select>
          <Option value="active">In Progress</Option>
          <Option value="pending">Pending</Option>
          <Option value="completed">Completed</Option>
        </Select>
      </Form.Item>
      <Form.Item
        name="employer"
        label="Project Owner"
        rules={[{ required: true, message: 'Please select project owner' }]}
      >
        <Select>
          {employers.map(employer => (
            <Option key={employer.id} value={employer.id}>
              {employer.name} ({employer.department})
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        name="manager"
        label="Project Manager"
        rules={[{ required: true, message: 'Please select project manager' }]}
      >
        <Select>
          {employees.map(employee => (
            <Option key={employee.id} value={employee.id}>
              {employee.name} ({employee.department})
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        name="members"
        label="Project Members"
        rules={[{ required: true, message: 'Please select project members' }]}
      >
        <Select mode="multiple" placeholder="Select project members">
          {employees.map(employee => (
            <Option key={employee.id} value={employee.id}>
              {employee.name} ({employee.department})
            </Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {project ? 'Update' : 'Create'}
        </Button>
        <Button onClick={onCancel} style={{ marginLeft: 8 }}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProjectForm;