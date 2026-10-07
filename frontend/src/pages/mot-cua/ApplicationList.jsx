import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Select, Tag, Space, Typography, Row, Col, Tooltip } from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsApi, proceduresApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ApplicationList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [status, setStatus] = useState(null);
  const [fieldType, setFieldType] = useState(null);
  const [slaFilter, setSlaFilter] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [search, setSearch] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, [page, pageSize, status, fieldType, slaFilter, paymentStatus]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await applicationsApi.list({
        page,
        pageSize,
        status: status || undefined,
        field_type: fieldType || undefined,
        sla_filter: slaFilter || undefined,
        payment_status: paymentStatus || undefined,
        search: search || undefined,
      });
      setData(res?.data?.items || []);
      setTotal(res?.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchApplications();
  };

  const statusConfig = {
    CHO_TIEP_NHAN: { label: 'Chờ tiếp nhận', color: 'orange' },
    DANG_XU_LY: { label: 'Đang xử lý', color: 'blue' },
    CHO_KY_DUYET: { label: 'Chờ ký duyệt', color: 'purple' },
    DA_KY_SO: { label: 'Đã ký số', color: 'cyan' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'green' },
    TRA_LAI: { label: 'Trả lại', color: 'red' },
    TU_CHOI: { label: 'Từ chối', color: 'default' },
  };

  const channelConfig = {
    TRUC_TIEP: { label: 'Trực tiếp', color: 'gold' },
    TRUC_TUYEN: { label: 'Trực tuyến', color: 'red' },
  };

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'dossier_code',
      key: 'dossier_code',
      width: 220,
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
      ellipsis: true,
    },
    {
      title: 'Công dân nộp',
      dataIndex: 'citizen_name',
      key: 'citizen_name',
      width: 170,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>CCCD: {record.citizen_id_number}</div>
        </div>
      ),
    },
    {
      title: 'Kênh nộp',
      dataIndex: 'submit_channel',
      key: 'submit_channel',
      width: 110,
      render: (c) => <Tag color={channelConfig[c]?.color}>{channelConfig[c]?.label || c}</Tag>,
    },
    {
      title: 'Hạn xử lý (SLA)',
      key: 'dates',
      width: 180,
      render: (_, record) => {
        let slaBadge = null;
        if (record.sla_status === 'OVERDUE') {
          slaBadge = <span className="badge-sla-overdue">🔴 Quá hạn</span>;
        } else if (record.sla_status === 'WARNING') {
          slaBadge = <span className="badge-sla-warning pulse-gold">🟡 Sắp đến hạn</span>;
        } else if (record.status !== 'HOAN_THANH') {
          slaBadge = <span className="badge-sla-normal">🟢 Đúng hạn</span>;
        }
        return (
          <div style={{ fontSize: 12 }}>
            <div>Nộp: {dayjs(record.submit_date).format('DD/MM/YYYY')}</div>
            <div>
              Hạn: <strong>{dayjs(record.appointment_date).format('DD/MM/YYYY')}</strong>
            </div>
            {slaBadge && <div style={{ marginTop: 2 }}>{slaBadge}</div>}
          </div>
        );
      },
    },
    {
      title: 'Lệ phí TTHC',
      key: 'fee',
      width: 140,
      render: (_, record) => {
        const feeNumber = Number(record.fee_amount || 0);
        if (feeNumber === 0) {
          return <Tag color="default">Miễn phí</Tag>;
        }
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#b91c1c', fontSize: 12 }}>
              {feeNumber.toLocaleString('vi-VN')} đ
            </div>
            {record.payment_status === 'DA_THANH_TOAN' ? (
              <Tag color="success" style={{ fontSize: 10, padding: '0 4px' }}>Đã thu</Tag>
            ) : (
              <Tag color="error" style={{ fontSize: 10, padding: '0 4px' }}>Chưa thu</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Cán bộ thụ lý',
      dataIndex: 'handler_name',
      key: 'handler_name',
      width: 150,
      render: (name) => name || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa phân công</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s) => <Tag color={statusConfig[s]?.color}>{statusConfig[s]?.label || s}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          ghost
          icon={<EyeOutlined />}
          onClick={() => navigate(`/applications/${record.id}`)}
          style={{ borderColor: 'var(--gov-red)', color: 'var(--gov-red)' }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        bordered={false}
        style={{ borderRadius: 14, marginBottom: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
      >
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
            <Title level={4} style={{ margin: 0, fontWeight: 800, color: '#7f1d1d' }}>
              Danh sách Hồ sơ Thủ tục Hành chính Một cửa
            </Title>
            <span style={{ color: '#78350f', fontSize: 13 }}>
              Hệ thống Tiếp nhận, luân chuyển và theo dõi toàn bộ hồ sơ TTHC của UBND Phường Yên Bái
            </span>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/applications/create')}
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                borderColor: '#7f1d1d',
                fontWeight: 700,
                borderRadius: 8,
              }}
            >
              Tiếp nhận hồ sơ mới
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchApplications}>
              Làm mới
            </Button>
          </Space>
        </div>

        {/* Bộ lọc và Tìm kiếm */}
        <Row gutter={[12, 12]} style={{ marginBottom: 18 }}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Tìm theo Mã hồ sơ, Tên công dân, CCCD, SĐT..."
              prefix={<SearchOutlined style={{ color: '#b91c1c' }} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>

          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Lọc trạng thái"
              style={{ width: '100%' }}
              value={status}
              onChange={(val) => setStatus(val)}
              allowClear
            >
              <Select.Option value="CHO_TIEP_NHAN">Chờ tiếp nhận</Select.Option>
              <Select.Option value="DANG_XU_LY">Đang xử lý</Select.Option>
              <Select.Option value="CHO_KY_DUYET">Chờ ký duyệt</Select.Option>
              <Select.Option value="DA_KY_SO">Đã ký số</Select.Option>
              <Select.Option value="HOAN_THANH">Đã hoàn thành</Select.Option>
              <Select.Option value="TRA_LAI">Trả lại / Bổ sung</Select.Option>
            </Select>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <Select
              placeholder="Cảnh báo hạn xử lý (SLA)"
              style={{ width: '100%' }}
              value={slaFilter}
              onChange={(val) => setSlaFilter(val)}
              allowClear
            >
              <Select.Option value="WARNING">🟡 Sắp đến hạn (&le; 24 giờ)</Select.Option>
              <Select.Option value="OVERDUE">🔴 Đã quá hạn xử lý</Select.Option>
              <Select.Option value="NORMAL">🟢 Còn hạn an toàn</Select.Option>
            </Select>
          </Col>

          <Col xs={12} sm={8} md={4}>
            <Select
              placeholder="Tình trạng nộp phí"
              style={{ width: '100%' }}
              value={paymentStatus}
              onChange={(val) => setPaymentStatus(val)}
              allowClear
            >
              <Select.Option value="CHUA_THANH_TOAN">Chưa nộp lệ phí</Select.Option>
              <Select.Option value="DA_THANH_TOAN">Đã thu lệ phí</Select.Option>
              <Select.Option value="MIEN_PHI">Miễn phí thủ tục</Select.Option>
            </Select>
          </Col>

          <Col xs={12} sm={8} md={3}>
            <Select
              placeholder="Lĩnh vực"
              style={{ width: '100%' }}
              value={fieldType}
              onChange={(val) => setFieldType(val)}
              allowClear
            >
              <Select.Option value="HO_TICH">Hộ tịch</Select.Option>
              <Select.Option value="CHUNG_THUC">Chứng thực</Select.Option>
              <Select.Option value="DIA_CHINH">Địa chính</Select.Option>
              <Select.Option value="LAO_DONG_TBXH">Lao động TBXH</Select.Option>
            </Select>
          </Col>

          <Col xs={24} sm={24} md={2}>
            <Button
              type="primary"
              onClick={handleSearch}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                borderColor: '#7f1d1d',
                fontWeight: 600,
              }}
            >
              Tìm
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
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
            showTotal: (total) => `Tổng số ${total} hồ sơ`,
            showSizeChanger: true,
          }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
}
