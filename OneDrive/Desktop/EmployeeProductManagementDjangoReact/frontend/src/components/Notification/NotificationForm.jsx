import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message } from 'antd';
import axios from '../../utils/axios';

const { Option } = Select;
const { TextArea } = Input;

const NotificationForm = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [recipients, setRecipients] = useState([]);

  useEffect(() => {
    fetchRecipients();
  }, []);

  const fetchRecipients = async () => {
    try {
      const [employeesRes, employersRes] = await Promise.all([
        axios.get('/users/', {
          params: {
            role: 'employee'
          }
        }),
        axios.get('/users/', {
          params: {
            role: 'employer'
          }
        })
      ]);
      setRecipients([
        ...employersRes.data.map(e => ({
          value: JSON.stringify({ id: e.id, type: 'employer' }),
          label:`${e.name}-${e.username}-(Employee)`
        }))
      ]);
    } catch (error) {
      message.error('Failed to get recipient list');
    }
  };

  const onFinish = async (values) => {
    try {
      await axios.post('/notifications/', {
        Message: values.Message,
        NotificationType: values.NotificationType,
        recipients: values.recipients?.map(r => JSON.parse(r)) || []
      });
      message.success('Notification sent successfully');
      form.resetFields();
      onSuccess();
    } catch (error) {
      message.error('Send failed: ' + (error.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
    >
      <Form.Item
        name="Message"
        label="Message Content"
        rules={[{ required: true, message: 'Please enter message content' }]}
      >
        <TextArea rows={4} />
      </Form.Item>

      <Form.Item
        name="NotificationType"
        label="Notification Type"
        rules={[{ required: true, message: 'Please select notification type' }]}
      >
        <Select>
          <Option value="urgent">Urgent</Option>
          <Option value="important">Important</Option>
          <Option value="info">Normal</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="recipients"
        label="Recipients"
        help="Leave empty to send to all users"
      >
        <Select
          mode="multiple"
          placeholder="Select recipients"
          options={recipients}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Send
        </Button>
        <Button onClick={onCancel} style={{ marginLeft: 8 }}>
          Cancel
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NotificationForm;