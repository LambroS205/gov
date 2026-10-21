import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Row,
  Col,
  Space,
  Typography,
  Popconfirm,
  message,
  Tooltip,
  Drawer,
  Descriptions,
  Divider,
  Spin,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  LockOutlined,
  UnlockOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  EyeOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { citizenAccountsApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function CitizenAccountManagement() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Drawer chi tiết
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, [page, pageSize, status]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await citizenAccountsApi.list({
        page,
        pageSize,
        status: status !== '' ? status : undefined,
        search: search.trim() || undefined,
      });
      if (res?.data) {
        setItems(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAccounts();
  };

  const handleOpenDetail = async (record) => {
    setSelectedCitizen(record);
    setDrawerOpen(true);
    setLoadingDetail(true);
    try {
      const res = await citizenAccountsApi.get(record.id);
      if (res?.data) {
        setSelectedCitizen(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleToggleStatus = async (record) => {
    const newStatus = record.is_active ? 0 : 1;
    try {
      await citizenAccountsApi.updateStatus(record.id, { is_active: newStatus });
      message.success(
        newStatus === 1
          ? `Đã mở khóa tài khoản cho công dân ${record.full_name}`
          : `Đã tạm khóa tài khoản của công dân ${record.full_name}`
      );
      if (selectedCitizen && selectedCitizen.id === record.id) {
        setSelectedCitizen((prev) => ({
          ...prev,
          is_active: newStatus,
          failed_attempts: newStatus === 1 ? 0 : prev.failed_attempts,
          locked_until: newStatus === 1 ? null : prev.locked_until,
        }));
      }
      fetchAccounts();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      title: 'Họ và tên công dân',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>
            <UserOutlined style={{ marginRight: 6, color: '#b91c1c' }} />
            {name}
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {r.email || 'Chưa cung cấp email'}
          </div>
        </div>
      ),
    },
    {
      title: 'Số CCCD (Bảo mật)',
      dataIndex: 'cccd_masked',
      key: 'cccd_masked',
      render: (cccd) => (
        <code style={{ fontWeight: 700, color: '#7f1d1d', background: '#fef2f2', padding: '2px 6px', borderRadius: 4 }}>
          {cccd}
        </code>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone_masked',
      key: 'phone_masked',
      render: (phone, r) => (
        <Space size={4}>
          <span>{phone}</span>
          {r.phone_verified_at ? (
            <Tag color="success" style={{ fontSize: 10 }}>✓ Đã xác thực</Tag>
          ) : (
            <Tag color="default" style={{ fontSize: 10 }}>Chưa xác thực</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Dữ liệu liên kết',
      key: 'linked_data',
      render: (_, r) => (
        <Space direction="vertical" size={2}>
          <Tag color="blue">{r.total_applications || 0} hồ sơ TTHC</Tag>
          <Tag color="purple">{r.total_complaints || 0} phản ánh</Tag>
        </Space>
      ),
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Lần đăng nhập cuối',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : <Text type="secondary">Chưa đăng nhập</Text>),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active, r) => {
        if (!active) {
          return <Tag color="error">Bị tạm khóa</Tag>;
        }
        if (r.locked_until && dayjs(r.locked_until).isAfter(dayjs())) {
          return <Tag color="warning">Khóa tạm (sai pass)</Tag>;
        }
        return <Tag color="success">Đang hoạt động</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenDetail(record)}
          >
            Chi tiết
          </Button>

          <Popconfirm
            title={
              record.is_active
                ? 'Tạm khóa tài khoản công dân này?'
                : 'Mở khóa cho tài khoản công dân này?'
            }
            description={
              record.is_active
                ? 'Công dân sẽ tạm thời không thể đăng nhập vào Cổng Dịch vụ công cho đến khi được mở khóa.'
                : 'Công dân sẽ có thể đăng nhập bình thường và số lần nhập sai mật khẩu sẽ được reset.'
            }
            onConfirm={() => handleToggleStatus(record)}
            okText={record.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
            cancelText="Hủy"
            okButtonProps={{ danger: record.is_active }}
          >
            {record.is_active ? (
              <Button size="small" danger icon={<LockOutlined />}>
                Khóa
              </Button>
            ) : (
              <Button size="small" type="primary" icon={<UnlockOutlined />} style={{ background: '#15803d', borderColor: '#166534' }}>
                Mở khóa
              </Button>
            )}
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#7f1d1d', fontWeight: 800 }}>
          QUẢN LÝ TÀI KHOẢN CÔNG DÂN
        </Title>
        <Text style={{ color: '#64748b', fontSize: 13 }}>
          Danh sách tài khoản công dân đăng ký trên Cổng Dịch vụ công & Phản ánh điện tử (Nghị định 85/2016)
        </Text>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}
        bodyStyle={{ padding: 20 }}
      >
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: 20 }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={10}>
              <Input
                placeholder="Tìm theo Tên công dân, CCCD, SĐT hoặc Email..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={6} md={6}>
              <Select
                value={status}
                onChange={(val) => {
                  setStatus(val);
                  setPage(1);
                }}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="">Tất cả trạng thái</Option>
                <Option value="1">Đang hoạt động</Option>
                <Option value="0">Bị tạm khóa</Option>
              </Select>
            </Col>
            <Col xs={24} sm={6} md={8}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} style={{ background: '#b91c1c' }}>
                  Tìm kiếm
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                    setPage(1);
                  }}
                >
                  Làm mới
                </Button>
              </Space>
            </Col>
          </Row>
        </form>

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showTotal: (tot) => `Tổng cộng ${tot} tài khoản công dân`,
          }}
          scroll={{ x: 950 }}
          locale={{ emptyText: 'Chưa có tài khoản công dân nào' }}
        />
      </Card>

      {/* Drawer Chi tiết Tài khoản */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7f1d1d' }}>
            <SafetyCertificateOutlined />
            <span>Chi tiết tài khoản công dân</span>
          </div>
        }
        placement="right"
        width={560}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {loadingDetail ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="Đang tải dữ liệu tài khoản..." />
          </div>
        ) : selectedCitizen ? (
          <div>
            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                {selectedCitizen.full_name}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                {selectedCitizen.email || 'Chưa cung cấp email'}
              </div>
              <div style={{ marginTop: 10 }}>
                {selectedCitizen.is_active ? (
                  <Tag color="success">✓ Tài khoản đang hoạt động</Tag>
                ) : (
                  <Tag color="error">✕ Tài khoản đang bị khóa</Tag>
                )}
                {selectedCitizen.phone_verified_at ? (
                  <Tag color="cyan">✓ SĐT đã xác thực</Tag>
                ) : (
                  <Tag color="default">SĐT chưa xác thực OTP</Tag>
                )}
              </div>
            </div>

            <Descriptions title="Định danh & Thông tin liên lạc" column={1} bordered size="small">
              <Descriptions.Item label="Số CCCD (bảo mật)">
                <code style={{ fontWeight: 700, color: '#7f1d1d' }}>
                  {selectedCitizen.cccd_masked || selectedCitizen.cccd_number}
                </code>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                <strong>{selectedCitizen.phone_masked || selectedCitizen.phone_number}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh & Giới tính">
                {selectedCitizen.birth_date ? dayjs(selectedCitizen.birth_date).format('DD/MM/YYYY') : '—'} 
                {selectedCitizen.gender ? ` (${selectedCitizen.gender === 'NAM' ? 'Nam' : 'Nữ'})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ khai báo">
                {selectedCitizen.address || '—'}
              </Descriptions.Item>
              {selectedCitizen.official_address && (
                <Descriptions.Item label="Địa chỉ hộ tịch (CSDL)">
                  <Text type="secondary">{selectedCitizen.official_address}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            <Descriptions title="Dữ liệu dịch vụ công liên kết" column={2} bordered size="small">
              <Descriptions.Item label="Hồ sơ TTHC đã nộp">
                <strong style={{ fontSize: 16, color: '#1d4ed8' }}>
                  {selectedCitizen.total_applications || 0}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Phản ánh hiện trường">
                <strong style={{ fontSize: 16, color: '#7e22ce' }}>
                  {selectedCitizen.total_complaints || 0}
                </strong>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="Lịch sử hoạt động hệ thống" column={1} bordered size="small">
              <Descriptions.Item label="Ngày đăng ký tài khoản">
                {selectedCitizen.created_at ? dayjs(selectedCitizen.created_at).format('DD/MM/YYYY HH:mm:ss') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Lần đăng nhập gần nhất">
                {selectedCitizen.last_login_at ? dayjs(selectedCitizen.last_login_at).format('DD/MM/YYYY HH:mm:ss') : 'Chưa đăng nhập'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ IP lần cuối">
                {selectedCitizen.last_login_ip || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Số lần nhập sai mật khẩu">
                {selectedCitizen.failed_attempts || 0} lần
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Popconfirm
                title={
                  selectedCitizen.is_active
                    ? 'Xác nhận tạm khóa tài khoản này?'
                    : 'Xác nhận mở khóa tài khoản này?'
                }
                onConfirm={() => handleToggleStatus(selectedCitizen)}
                okText={selectedCitizen.is_active ? 'Khóa' : 'Mở khóa'}
                cancelText="Hủy"
                okButtonProps={{ danger: selectedCitizen.is_active }}
              >
                {selectedCitizen.is_active ? (
                  <Button danger icon={<LockOutlined />}>
                    Khóa tài khoản
                  </Button>
                ) : (
                  <Button type="primary" icon={<UnlockOutlined />} style={{ background: '#15803d', borderColor: '#166534' }}>
                    Mở khóa tài khoản
                  </Button>
                )}
              </Popconfirm>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
