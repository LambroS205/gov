import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Typography, Space, Modal, Form, Input, InputNumber, Row, Col, message } from 'antd';
import { BankOutlined, PlusOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { areasApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

export default function AreaManagement() {
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchAreas();
  }, []);

  const fetchAreas = async () => {
    setLoading(true);
    try {
      const res = await areasApi.list();
      setAreas(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (area = null) => {
    setEditingArea(area);
    form.resetFields();
    if (area) {
      form.setFieldsValue(area);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingArea) {
        await areasApi.update(editingArea.id, values);
        message.success('Cập nhật thông tin tổ dân phố thành công');
      } else {
        await areasApi.create(values);
        message.success('Thêm mới tổ dân phố thành công');
      }
      setModalOpen(false);
      fetchAreas();
    } catch {
      // Toast error từ interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã địa bàn',
      dataIndex: 'area_code',
      key: 'area_code',
      width: 120,
      render: (t) => <strong>{t}</strong>,
    },
    {
      title: 'Tên Tổ dân phố',
      dataIndex: 'area_name',
      key: 'area_name',
      render: (t) => <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{t}</span>,
    },
    {
      title: 'Tổ trưởng / Phụ trách',
      dataIndex: 'manager_name',
      key: 'manager_name',
      render: (t, r) => (
        <div>
          <div>{t || 'Chưa cập nhật'}</div>
          {r.manager_phone && <div style={{ fontSize: 11, color: '#64748b' }}>SĐT: {r.manager_phone}</div>}
        </div>
      ),
    },
    {
      title: 'Số hộ gia đình',
      dataIndex: 'total_households',
      key: 'total_households',
      render: (n) => <strong>{Number(n || 0).toLocaleString()} hộ</strong>,
    },
    {
      title: 'Nhân khẩu thực tế',
      dataIndex: 'actual_residents',
      key: 'actual_residents',
      render: (n, r) => (
        <span>
          <strong>{n}</strong> / {r.total_residents || 0} người
        </span>
      ),
    },
    {
      title: 'Mô tả địa bàn',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenModal(record)}
        >
          Sửa
        </Button>
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
              Quản lý Tổ Dân phố & Hạ tầng Địa bàn
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Danh mục các tổ dân phố, số hộ gia đình và cán bộ phụ trách cơ sở tại UBND Phường Yên Bái
            </Text>
          </div>

          <Space>
            {hasRole(['ADMIN']) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenModal(null)}
                style={{ background: 'var(--primary-blue)', fontWeight: 600 }}
              >
                Thêm tổ dân phố
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={fetchAreas}>
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={areas}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal Thêm / Sửa Tổ dân phố */}
      <Modal
        title={editingArea ? 'Chỉnh sửa thông tin tổ dân phố' : 'Thêm mới tổ dân phố'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="area_code"
                label="Mã tổ dân phố"
                rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
              >
                <Input placeholder="Ví dụ: TDP-06" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="area_name"
                label="Tên tổ dân phố"
                rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
              >
                <Input placeholder="Ví dụ: Tổ dân phố số 6" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manager_name" label="Họ tên Tổ trưởng">
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="manager_phone" label="Số điện thoại Tổ trưởng">
                <Input placeholder="0912xxxxxx" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="total_households" label="Tổng số hộ gia đình">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="total_residents" label="Tổng số nhân khẩu quy hoạch">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Đặc điểm khu vực">
                <Input.TextArea rows={2} placeholder="Khu vực thương mại, ven sông, tập thể..." />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setModalOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingArea ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
