import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography, Space, Modal, Form, Input, Alert, message } from 'antd';
import {
  SafetyCertificateOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PendingApproval() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [form] = Form.useForm();

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingApps();
  }, []);

  const fetchPendingApps = async () => {
    setLoading(true);
    try {
      const res = await applicationsApi.list({
        status: 'CHO_KY_DUYET',
        pageSize: 50,
      });
      setData(res?.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSign = (record) => {
    setSelectedApp(record);
    setSignModalOpen(true);
    form.resetFields();
  };

  const handleSignConfirm = async (values) => {
    if (!selectedApp) return;
    setSigning(true);
    try {
      await applicationsApi.approve(selectedApp.id, values);
      message.success('Phê duyệt và ký số điện tử thành công');
      setSignModalOpen(false);
      fetchPendingApps();
    } catch {
      // Toast error qua interceptor
    } finally {
      setSigning(false);
    }
  };

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'dossier_code',
      key: 'dossier_code',
      render: (text, record) => (
        <a
          onClick={() => navigate(`/applications/${record.id}`)}
          style={{ fontWeight: 700, color: 'var(--gov-red)' }}
        >
          {text}
        </a>
      ),
    },
    {
      title: 'Thủ tục hành chính',
      dataIndex: 'proc_name',
      key: 'proc_name',
    },
    {
      title: 'Người yêu cầu',
      dataIndex: 'citizen_name',
      key: 'citizen_name',
      render: (t) => <span style={{ fontWeight: 600 }}>{t}</span>,
    },
    {
      title: 'Chuyên viên trình ký',
      dataIndex: 'handler_name',
      key: 'handler_name',
    },
    {
      title: 'Hạn trả kết quả',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (d) => <span style={{ fontWeight: 600 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</span>,
    },
    {
      title: 'Ký duyệt',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/applications/${record.id}`)}
          >
            Xem hồ sơ
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<SafetyCertificateOutlined />}
            style={{
              background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
              borderColor: '#7f1d1d',
              fontWeight: 700,
            }}
            onClick={() => handleOpenSign(record)}
          >
            Ký số
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Danh sách Hồ sơ Chờ Lãnh đạo Phê duyệt & Ký số
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Lãnh đạo UBND Phường: <strong>{user?.full_name}</strong> &bull; Token SIM PKI: {user?.certificate_serial || 'VGCA-SIMPKI-001928374'}
            </Text>
          </div>

          <Button icon={<ReloadOutlined />} onClick={fetchPendingApps}>
            Làm mới danh sách
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Hiện không có hồ sơ nào đang chờ ký duyệt' }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Modal Ký số Token Ban Cơ Yếu */}
      <Modal
        title="Ký số điện tử phê duyệt kết quả TTHC"
        open={signModalOpen}
        onCancel={() => setSignModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSignConfirm} style={{ marginTop: 16 }}>
          <Alert
            message="Chứng thư số chuyên dùng Chính phủ (Ban Cơ yếu)"
            description={
              <div>
                Hồ sơ: <strong>{selectedApp?.dossier_code}</strong> ({selectedApp?.proc_name})
                <br />
                Người ký: <strong>{user?.full_name}</strong> - Phó Chủ tịch UBND Phường
                <br />
                Serial: <code>{user?.certificate_serial || 'VGCA-SIMPKI-001928374'}</code>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="pin_code"
            label="Mã PIN Chữ ký số (Token / SIM PKI)"
            rules={[{ required: true, message: 'Vui lòng nhập mã PIN' }]}
            initialValue="123456"
          >
            <Input.Password placeholder="Nhập mã PIN" />
          </Form.Item>

          <Form.Item name="comment" label="Ý kiến phê duyệt" initialValue="Đồng ý phê duyệt kết quả giải quyết thủ tục hành chính.">
            <Input />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button onClick={() => setSignModalOpen(false)}>Hủy bỏ</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={signing}
              icon={<SafetyCertificateOutlined />}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderColor: '#d97706',
              }}
            >
              Ký số và phát hành kết quả
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
