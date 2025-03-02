import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Spin, message, Image, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import axios from '../../utils/axios';
import pic from '../../assets/pic.jpg';
import './Profile.css';

const Profile = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/auth/profile/`);
      setUserInfo(response.data);
    } catch (error) {
      message.error('获取个人信息失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin />;
  if (!userInfo) return <div>未找到个人信息</div>;

  const handleAvatarUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      await axios.post(`/users/${userInfo.id}/upload_avatar/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      message.success('头像上传成功');
      onSuccess();
      fetchUserProfile();
    } catch (error) {
      message.error('头像上传失败');
      onError();
    }
  };

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <div className="profile-content">
          <div className="profile-info">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="ID">{userInfo.id || 1}</Descriptions.Item>
              <Descriptions.Item label="姓名">{userInfo.name || userInfo.username}</Descriptions.Item>
              <Descriptions.Item label="角色">{userInfo.role}</Descriptions.Item>
              <Descriptions.Item label="电话">{userInfo.phone || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="地址">{userInfo.address || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="部门">{userInfo.department || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="职位">{userInfo.position || '未设置'}</Descriptions.Item>
              <Descriptions.Item label="入职日期">{userInfo.hire_date || '未设置'}</Descriptions.Item>
            </Descriptions>
          </div>
          <div className="profile-picture">
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              customRequest={handleAvatarUpload}
              accept="image/*"
            >
              {userInfo.avatar ? (
                <Image
                  src={'/api/avatars/'+userInfo.avatar}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                  preview={false}
                />
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传头像</div>
                </div>
              )}
            </Upload>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;