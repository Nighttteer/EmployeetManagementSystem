import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Button, Modal, message, Space } from 'antd';
import axios from '../../utils/axios';
import NotificationForm from './NotificationForm';
import moment from 'moment';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));
  const isEmployer = user?.role === 'employer';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/notifications/');
      setNotifications(response.data);
    } catch (error) {
      message.error('Failed to get notification list');
    }
    setLoading(false);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleFormSuccess = () => {
    handleModalClose();
    fetchNotifications();
  };

  const getNotificationTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'urgent':
        return 'red';
      case 'important':
        return 'orange';
      case 'info':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getNotificationTypeText = (type) => {
    switch (type.toLowerCase()) {
      case 'urgent':
        return 'Urgent';
      case 'important':
        return 'Important';
      case 'info':
        return 'Normal';
      default:
        return type;
    }
  };

  const columns = [
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {isEmployer && record.Sender.id === user.id && (
            <>
              <Button type="link" onClick={() => handleEdit(record)}>
                Edit
              </Button>
              <Button type="link" danger onClick={() => handleDelete(record.NotificationID)}>
                Delete
              </Button>
            </>
          )}
          <Button type="link" onClick={() => handleView(record)}>
            View Details
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {isEmployer && (
          <Button type="primary" onClick={() => setModalVisible(true)}>
            Send Notification
          </Button>
        )}
      </div>
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={notifications}
        loading={loading}
        renderItem={(item) => (
          <List.Item>
            <Card>
              <Card.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={getNotificationTypeColor(item.NotificationType)}>
                      {getNotificationTypeText(item.NotificationType)}
                    </Tag>
                    <small>{moment(item.DateSent).format('YYYY-MM-DD HH:mm:ss')}</small>
                  </div>
                }
                description={
                  <div>
                    <p>{item.Message}</p>
                    <div style={{ marginTop: 8 }}>
                      <small>Sender: {item.sender_name}</small>
                    </div>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
      <Modal
        title="Send Notification"
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
      >
        <NotificationForm
          onSuccess={handleFormSuccess}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  );
};

export default NotificationList;