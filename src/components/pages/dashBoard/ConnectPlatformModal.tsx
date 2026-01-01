import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, message } from 'antd';
import { LinkOutlined, YoutubeOutlined, CodeOutlined, BookOutlined } from '@ant-design/icons';
import axios from 'axios';

interface ConnectPlatformModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ConnectPlatformModal: React.FC<ConnectPlatformModalProps> = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [platform, setPlatform] = useState('leetcode');

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/platform/connect', {
        platform: values.platform,
        value: values.value
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      message.success(`${values.platform} connected successfully!`);
      onSuccess();
      onClose();
      form.resetFields();
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || 'Failed to connect platform');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Connect Learning Platform"
      open={visible}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ platform: 'leetcode' }}>
        <Form.Item name="platform" label="Select Platform">
          <Select onChange={(val) => setPlatform(val)}>
            <Select.Option value="leetcode"><CodeOutlined /> LeetCode</Select.Option>
            <Select.Option value="hackerrank"><CodeOutlined /> HackerRank</Select.Option>
            <Select.Option value="udemy"><BookOutlined /> Udemy</Select.Option>
            <Select.Option value="youtube"><YoutubeOutlined /> YouTube Playlist</Select.Option>
             <Select.Option value="coursera"><BookOutlined /> Coursera</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item 
          name="value" 
          label={platform === 'youtube' ? "Playlist URL" : "Username/Profile URL"}
          rules={[{ required: true, message: 'Please enter a value' }]}
        >
          <Input 
             prefix={<LinkOutlined />} 
             placeholder={platform === 'youtube' ? "https://youtube.com/playlist?list=..." : "e.g. johndoe"} 
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Connect
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConnectPlatformModal;
