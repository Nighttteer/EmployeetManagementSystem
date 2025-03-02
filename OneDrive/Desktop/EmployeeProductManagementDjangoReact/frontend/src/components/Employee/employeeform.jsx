import React from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import axios from '../../utils/axios';

const { Option } = Select;

const EmployeeForm = ({ employee, onSuccess, onCancel }) => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    try {
      const userData = {
        username: values.username,
        name: values.name,
        phone: values.phone,
        address: values.address,
        role: values.role,
        department: values.department,
        password: values.password
      };

      if (employee) {
        await axios.put(`/users/${employee.id}/`, userData);
        message.success('员工信息更新成功');
      } else {
        await axios.post('/users/', userData);
        message.success('员工添加成功');
      }
      onSuccess();
    } catch (error) {
      console.error('Operation failed:', error.response?.data);
      message.error('操作失败: ' + (error.response?.data?.detail || '未知错误'));
    }
  };

  const ROLE_OPTIONS = [
    { label: '员工', value: 'employee' },
    { label: '主管', value: 'employer' },
  ];

  const DEPARTMENT_OPTIONS = [
    { label: '人力资源', value: 'HR' },
    { label: '技术部', value: 'IT' },
    { label: '财务部', value: 'Finance' },
    { label: '市场部', value: 'Marketing' },
    { label: '运营部', value: 'Operations' }
  ];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={employee}
      onFinish={onFinish}
    >
      <Form.Item
        name="name"
        label="姓名"
        rules={[{ required: true, message: '请输入员工姓名' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="phone"
        label="电话"
        rules={[
          { required: true, message: '请输入电话号码' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="address"
        label="地址"
        rules={[{ required: true, message: '请输入地址' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="department"
        label="部门"
        rules={[{ required: true, message: '请选择部门' }]}
      >
        <Select>
          {DEPARTMENT_OPTIONS.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="role"
        label="角色"
        rules={[{ required: true, message: '请选择角色' }]}
      >
        <Select>
          {ROLE_OPTIONS.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>


          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password />
          </Form.Item>


      <Form.Item>
        <Button type="primary" htmlType="submit">
          {employee ? '更新' : '添加'}
        </Button>
        <Button onClick={onCancel} style={{ marginLeft: 8 }}>
          取消
        </Button>
      </Form.Item>
    </Form>
  );
};

export default EmployeeForm;