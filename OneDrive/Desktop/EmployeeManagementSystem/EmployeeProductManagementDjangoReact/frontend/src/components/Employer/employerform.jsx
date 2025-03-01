import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import axios from '../../utils/axios';

const EmployerForm = ({ employer, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const userData = {
        name: values.Name,
        phone: values.Phone,
        address: values.Address,
        role: 'employer',
        department: values.Department,
        username: values.Username,
        password: values.Password
      };

      if (employer) {
        await axios.put(`/users/${employer.id}/`, userData);
        message.success('雇主信息更新成功');
      } else {
        await axios.post('/users/', userData);
        message.success('雇主添加成功');
      }
      onSuccess();
    } catch (error) {
      message.error('操作失败: ' + (error.response?.data?.detail || '未知错误'));
    }
    setLoading(false);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={employer}
      onFinish={onFinish}
    >
      <Form.Item
        name="Name"
        label="姓名"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="Department"
        label="部门"
        rules={[{ required: true, message: '请输入部门' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="Phone"
        label="电话"
        rules={[{ required: true, message: '请输入电话号码' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="Address"
        label="地址"
        rules={[{ required: true, message: '请输入地址' }]}
      >
        <Input />
      </Form.Item>

          <Form.Item
            name="Username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="Password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password />
          </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {employer ? '更新' : '添加'}
        </Button>
        <Button onClick={onCancel} style={{ marginLeft: 8 }}>
          取消
        </Button>
      </Form.Item>
    </Form>
  );
};

export default EmployerForm;