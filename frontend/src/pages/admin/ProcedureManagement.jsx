import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Row,
  Col,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { proceduresApi } from '../../api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ProcedureManagement() {
  const [loading, setLoading] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProc, setEditingProc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    setLoading(true);
    try {
      const res = await proceduresApi.list({ active_only: 0 });
      setProcedures(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (proc = null) => {
    setEditingProc(proc);
    form.resetFields();
    if (proc) {
      form.setFieldsValue({
        ...proc,
        required_documents_text: Array.isArray(proc.required_documents)
          ? proc.required_documents.join('\n')
          : '',
      });
    } else {
      form.setFieldsValue({
        field_type: 'HO_TICH',
        processing_days: 1,
        fee_amount: 0,
        is_active: 1,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        required_documents: values.required_documents_text
          ? values.required_documents_text.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      delete payload.required_documents_text;

      if (editingProc) {
        await proceduresApi.update(editingProc.id, payload);
        message.success('Cập nhật thủ tục hành chính thành công');
      } else {
        await proceduresApi.create(payload);
        message.success('Tạo mới thủ tục hành chính thành công');
      }
      setModalOpen(false);
      fetchProcedures();
    } catch {
      // Toast error từ interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Mã TTHC',
      dataIndex: 'proc_code',
      key: 'proc_code',
      width: 140,
      render: (t) => <strong>{t}</strong>,
    },
    {
      title: 'Tên thủ tục hành chính',
      dataIndex: 'proc_name',
      key: 'proc_name',
      render: (t) => <span style={{ fontWeight: 600 }}>{t}</span>,
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field_type',
      key: 'field_type',
      width: 150,
      render: (f) => <Tag color="blue">{f}</Tag>,
    },
    {
      title: 'Thời hạn giải quyết',
      dataIndex: 'processing_days',
      key: 'processing_days',
      width: 140,
      render: (d) => `${d} ngày làm việc`,
    },
    {
      title: 'Lệ phí (VNĐ)',
      dataIndex: 'fee_amount',
      key: 'fee_amount',
      width: 150,
      render: (fee) => (
        <span style={{ fontWeight: 600, color: '#c5221f' }}>
          {Number(fee).toLocaleString('vi-VN')} đ
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (a) => (
        <Tag color={a === 1 ? 'green' : 'default'}>{a === 1 ? 'Áp dụng' : 'Tạm dừng'}</Tag>
      ),
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
              Danh mục Thủ tục Hành chính Cấp Phường
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Cấu hình quy chuẩn TTHC, số ngày xử lý hẹn trả, lệ phí và thành phần hồ sơ bắt buộc
            </Text>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal(null)}
              style={{ background: 'var(--primary-blue)', fontWeight: 600 }}
            >
              Thêm thủ tục mới
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchProcedures}>
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={procedures}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Modal Thêm / Sửa TTHC */}
      <Modal
        title={editingProc ? `Chỉnh sửa TTHC [${editingProc.proc_code}]` : 'Thêm thủ tục hành chính mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="proc_code"
                label="Mã thủ tục quốc gia"
                rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
              >
                <Input placeholder="TTHC-HT-05" />
              </Form.Item>
            </Col>

            <Col span={14}>
              <Form.Item
                name="field_type"
                label="Lĩnh vực thủ tục"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="HO_TICH">Hộ tịch</Select.Option>
                  <Select.Option value="CHUNG_THUC">Chứng thực</Select.Option>
                  <Select.Option value="DIA_CHINH">Địa chính - Xây dựng</Select.Option>
                  <Select.Option value="LAO_DONG_TBXH">Lao động - Thương binh & Xã hội</Select.Option>
                  <Select.Option value="TU_PHAP">Tư pháp khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="proc_name"
                label="Tên thủ tục hành chính"
                rules={[{ required: true, message: 'Vui lòng nhập tên TTHC' }]}
              >
                <Input placeholder="Ví dụ: Đăng ký khai tử lưu động" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="processing_days"
                label="Thời hạn giải quyết (ngày làm việc)"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={90} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="fee_amount" label="Mức thu lệ phí (VNĐ)" rules={[{ required: true }]}>
                <InputNumber min={0} step={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="required_documents_text"
                label="Thành phần hồ sơ bắt buộc (Mỗi giấy tờ nhập 1 dòng)"
              >
                <TextArea
                  rows={4}
                  placeholder="Tờ khai theo mẫu&#10;Bản sao CCCD&#10;Giấy tờ chứng minh khác..."
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="is_active" label="Trạng thái áp dụng">
                <Select>
                  <Select.Option value={1}>Đang áp dụng tiếp nhận</Select.Option>
                  <Select.Option value={0}>Tạm dừng tiếp nhận</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setModalOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingProc ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
