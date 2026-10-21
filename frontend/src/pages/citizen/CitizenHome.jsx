import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Alert,
  Spin,
} from 'antd';
import {
  FolderOpenOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FormOutlined,
  NotificationOutlined,
  RightOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  CreditCardOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import { citizenPortalApi } from '../../api/portalClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function CitizenHome() {
  const { citizen } = useCitizenAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await citizenPortalApi.summary();
      if (res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusTags = {
    CHO_TIEP_NHAN: { label: 'Chờ tiếp nhận', color: 'orange' },
    DANG_XU_LY: { label: 'Đang thụ lý', color: 'blue' },
    CHO_KY_DUYET: { label: 'Chờ ký duyệt', color: 'purple' },
    DA_KY_SO: { label: 'Đã ký số', color: 'cyan' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'green' },
    TRA_LAI: { label: 'Yêu cầu bổ sung', color: 'volcano' },
    TU_CHOI: { label: 'Từ chối', color: 'red' },
  };

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'dossier_code',
      key: 'dossier_code',
      render: (code, record) => (
        <Space orientation="vertical" size={2}>
          <a
            onClick={() => navigate(`/cong-dan/ho-so/${record.id}`)}
            style={{ fontWeight: 700, color: '#b91c1c' }}
          >
            {code}
          </a>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Hẹn trả: {record.appointment_date ? dayjs(record.appointment_date).format('DD/MM/YYYY') : '—'}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Tên thủ tục hành chính',
      dataIndex: 'proc_name',
      key: 'proc_name',
      render: (name) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submit_date',
      key: 'submit_date',
      render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Trạng thái giải quyết',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const conf = statusTags[status] || { label: status, color: 'default' };
        return <Tag color={conf.color} style={{ fontWeight: 600 }}>{conf.label}</Tag>;
      },
    },
    {
      title: 'Lệ phí',
      key: 'fee',
      render: (_, r) => {
        const fee = parseFloat(r.fee_amount || 0);
        if (fee <= 0) return <Tag color="green">Miễn phí</Tag>;
        if (r.payment_status === 'DA_THANH_TOAN') {
          return (
            <Tag color="success">
              Đã nộp ({fee.toLocaleString('vi-VN')} đ)
            </Tag>
          );
        }
        return (
          <Tag color="warning">
            Chưa nộp ({fee.toLocaleString('vi-VN')} đ)
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/cong-dan/ho-so/${record.id}`)}
          style={{ color: '#b91c1c', fontWeight: 600 }}
        >
          Chi tiết →
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu Cổng Công dân..." />
      </div>
    );
  }

  const appStats = data?.application_stats || {};
  const cplStats = data?.complaint_stats || {};

  return (
    <div>
      {/* 1. Hero Banner Chào mừng */}
      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)',
          color: '#ffffff',
          marginBottom: 20,
          border: '1px solid #f59e0b',
          boxShadow: '0 8px 24px rgba(185, 28, 28, 0.25)',
        }}
        bodyStyle={{ padding: '24px 28px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <div style={{ fontSize: 13, color: '#fde68a', fontWeight: 600, marginBottom: 4 }}>
              CỔNG DỊCH VỤ CÔNG ĐIỆN TỬ CẤP PHƯỜNG
            </div>
            <Title level={2} style={{ color: '#ffffff', margin: '0 0 6px 0', fontWeight: 800 }}>
              Xin chào, {citizen?.full_name}!
            </Title>
            <Space split={<span style={{ color: '#fca5a5' }}>•</span>} size="small" style={{ fontSize: 13, color: '#fee2e2' }}>
              <span>Số CCCD: <strong>{citizen?.cccd_number}</strong></span>
              <span>Số điện thoại: <strong>{citizen?.phone_number}</strong></span>
              {citizen?.phone_verified_at ? (
                <Tag color="success">✓ Đã xác thực SĐT</Tag>
              ) : (
                <Tag color="warning">Chưa xác thực SĐT</Tag>
              )}
            </Space>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Space wrap>
              <Button
                type="primary"
                size="large"
                icon={<FormOutlined />}
                onClick={() => navigate('/tra-cuu')}
                style={{
                  background: '#f59e0b',
                  borderColor: '#d97706',
                  color: '#7f1d1d',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                }}
              >
                Nộp hồ sơ DVC
              </Button>
              <Button
                size="large"
                icon={<NotificationOutlined />}
                onClick={() => navigate('/tra-cuu')}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  color: '#ffffff',
                  fontWeight: 600,
                }}
              >
                Gửi phản ánh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Cảnh báo chưa xác thực SĐT nếu có */}
      {!citizen?.phone_verified_at && (
        <Alert
          message="Khuyến nghị an toàn: Xác thực số điện thoại của bạn"
          description={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span>
                Xác thực số điện thoại bằng mã OTP giúp tự động liên kết các phản ánh hiện trường trước đây và bảo đảm quyền riêng tư khi tra cứu.
              </span>
              <Button
                type="primary"
                size="small"
                onClick={() => navigate('/cong-dan/tai-khoan')}
                style={{ background: '#b91c1c', borderColor: '#7f1d1d' }}
              >
                Xác thực ngay qua OTP
              </Button>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 20, borderRadius: 12, border: '1px solid #fed7aa' }}
        />
      )}

      {/* 2. Các thẻ thống kê tiến độ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}
            onClick={() => navigate('/cong-dan/ho-so')}
            bodyStyle={{ padding: 16 }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, color: '#64748b' }}>Tổng hồ sơ</span>}
              value={appStats.total || 0}
              valueStyle={{ color: '#1e293b', fontWeight: 800 }}
              prefix={<FolderOpenOutlined style={{ color: '#64748b', fontSize: 18 }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}
            onClick={() => navigate('/cong-dan/ho-so?status=DANG_XU_LY')}
            bodyStyle={{ padding: 16 }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, color: '#0369a1' }}>Đang thụ lý</span>}
              value={appStats.dang_xu_ly || 0}
              valueStyle={{ color: '#0284c7', fontWeight: 800 }}
              prefix={<ClockCircleOutlined style={{ color: '#0284c7', fontSize: 18 }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}
            onClick={() => navigate('/cong-dan/ho-so?status=HOAN_THANH')}
            bodyStyle={{ padding: 16 }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, color: '#15803d' }}>Đã có kết quả</span>}
              value={appStats.hoan_thanh || 0}
              valueStyle={{ color: '#16a34a', fontWeight: 800 }}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a', fontSize: 18 }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}
            onClick={() => navigate('/cong-dan/ho-so?status=TRA_LAI')}
            bodyStyle={{ padding: 16 }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, color: '#b45309' }}>Yêu cầu bổ sung</span>}
              value={appStats.tra_lai || 0}
              valueStyle={{ color: '#d97706', fontWeight: 800 }}
              prefix={<ExclamationCircleOutlined style={{ color: '#d97706', fontSize: 18 }} />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={8} lg={5}>
          <Card
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}
            onClick={() => navigate('/cong-dan/phan-anh')}
            bodyStyle={{ padding: 16 }}
          >
            <Statistic
              title={<span style={{ fontSize: 12, color: '#7c3aed' }}>Phản ánh hiện trường</span>}
              value={cplStats.total || 0}
              valueStyle={{ color: '#8b5cf6', fontWeight: 800 }}
              prefix={<NotificationOutlined style={{ color: '#8b5cf6', fontSize: 18 }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. Danh sách hồ sơ gần đây */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, color: '#7f1d1d', fontSize: 15 }}>
              <FileTextOutlined style={{ marginRight: 8, color: '#b91c1c' }} />
              Hồ sơ nộp gần đây nhất của bạn
            </span>
            <Button
              type="link"
              onClick={() => navigate('/cong-dan/ho-so')}
              style={{ color: '#b91c1c', fontWeight: 600, padding: 0 }}
            >
              Xem tất cả ({appStats.total || 0}) <RightOutlined />
            </Button>
          </div>
        }
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)', marginBottom: 20 }}
      >
        <Table
          columns={columns}
          dataSource={data?.recent_applications || []}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'Bạn chưa có hồ sơ nào trên hệ thống' }}
          scroll={{ x: 750 }}
        />
      </Card>
    </div>
  );
}
