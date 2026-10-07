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
  Switch,
  Row,
  Col,
  message,
} from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  KeyOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { usersApi, departmentsApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function UserManagement() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsApi.list();
      setDepartments(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    form.resetFields();
    if (user) {
      form.setFieldsValue({
        ...user,
        is_active: user.is_active === 1,
      });
    } else {
      form.setFieldsValue({
        role: 'CHUYEN_VIEN',
        is_active: true,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        await usersApi.update(editingUser.id, {
          ...values,
          is_active: values.is_active ? 1 : 0,
        });
        message.success('Cập nhật cán bộ thành công');
      } else {
        await usersApi.create(values);
        message.success('Tạo tài khoản cán bộ mới thành công (Mật khẩu mặc định: Admin@123)');
      }
      setModalOpen(false);
      fetchUsers();
    } catch {
      // Toast error qua interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = (record) => {
    Modal.confirm({
      title: 'Đặt lại mật khẩu',
      content: `Bạn có chắc muốn đặt lại mật khẩu cho cán bộ ${record.full_name} (${record.username}) về mặc định (Admin@123)?`,
      okText: 'Xác nhận đặt lại',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await usersApi.resetPassword(record.id, { password: 'Admin@123' });
          message.success(`Đã đặt lại mật khẩu của ${record.username} về "Admin@123"`);
        } catch (err) {
          console.error(err);
        }
      },
    });
  };

  const roleTags = {
    ADMIN: { label: 'Quản trị viên', color: 'red' },
    MOT_CUA: { label: 'Cán bộ Một cửa', color: 'blue' },
    CHUYEN_VIEN: { label: 'Chuyên viên thụ lý', color: 'cyan' },
    LANH_DAO: { label: 'Lãnh đạo UBND Phường', color: 'gold' },
    VAN_THU: { label: 'Văn thư số', color: 'purple' },
  };

  const columns = [
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      width: 140,
      render: (t) => <strong>{t}</strong>,
    },
    {
      title: 'Họ và tên cán bộ',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{t}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.email || '---'} {r.phone_number ? `&bull; ${r.phone_number}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: 'Đơn vị / Phòng ban',
      dataIndex: 'dept_name',
      key: 'dept_name',
      render: (t) => t || '---',
    },
    {
      title: 'Vai trò (RBAC)',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      render: (role) => <Tag color={roleTags[role]?.color}>{roleTags[role]?.label || role}</Tag>,
    },
    {
      title: 'Chứng thư số ký',
      dataIndex: 'certificate_serial',
      key: 'certificate_serial',
      width: 160,
      render: (cert) =>
        cert ? (
          <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{cert}</span>
        ) : (
          <span style={{ color: '#94a3b8', fontSize: 11 }}>Chưa cấp</span>
        ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (active) => (
        <Tag color={active === 1 ? 'green' : 'error'}>{active === 1 ? 'Hoạt động' : 'Tạm khóa'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            Sửa
          </Button>
          <Button
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            Reset MK
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
              Quản lý Cán bộ Công chức & Phân quyền Hệ thống
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Mô hình kiểm soát truy cập dựa trên vai trò (RBAC): Quản trị viên, Một cửa, Chuyên viên, Lãnh đạo, Văn thư
            </Text>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => handleOpenModal(null)}
              style={{ background: 'var(--primary-blue)', fontWeight: 600 }}
            >
              Thêm cán bộ mới
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 950 }}
        />
      </Card>

      {/* Modal Thêm / Sửa cán bộ */}
      <Modal
        title={editingUser ? `Chỉnh sửa thông tin cán bộ [${editingUser.username}]` : 'Thêm tài khoản cán bộ mới'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={650}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: 'Vui lòng nhập username' }]}
              >
                <Input placeholder="Ví dụ: nguyen_van_a" disabled={!!editingUser} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên cán bộ"
                rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="role"
                label="Vai trò (Quyền hạn)"
                rules={[{ required: true }]}
              >
                <Select>
                  <Select.Option value="MOT_CUA">Cán bộ Tiếp nhận Một cửa</Select.Option>
                  <Select.Option value="CHUYEN_VIEN">Chuyên viên thụ lý chuyên môn</Select.Option>
                  <Select.Option value="LANH_DAO">Lãnh đạo UBND Phường (Ký số)</Select.Option>
                  <Select.Option value="VAN_THU">Văn thư số Phường</Select.Option>
                  <Select.Option value="ADMIN">Quản trị viên Hệ thống</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="department_id" label="Phòng ban / Đơn vị">
                <Select placeholder="Chọn phòng ban...">
                  {departments.map((d) => (
                    <Select.Option key={d.id} value={d.id}>
                      {d.dept_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="email" label="Email công vụ">
                <Input placeholder="a.nv@yenbai.gov.vn" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="phone_number" label="Số điện thoại liên lạc">
                <Input placeholder="0912xxxxxx" />
              </Form.Item>
            </Col>

            <Col span={16}>
              <Form.Item name="certificate_serial" label="Serial Chứng thư số (Token Ban Cơ yếu / SIM PKI)">
                <Input placeholder="VGCA-TOKEN-00123456" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="is_active" label="Trạng thái tài khoản" valuePropName="checked">
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm khóa" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setModalOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingUser ? 'Lưu thay đổi' : 'Tạo cán bộ'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
