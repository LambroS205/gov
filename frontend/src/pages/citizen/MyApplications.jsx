import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Tooltip,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  FilePdfOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { citizenPortalApi, resolveFileUrl } from '../../api/portalClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function MyApplications() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  useEffect(() => {
    fetchApplications();
  }, [page, pageSize, status]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await citizenPortalApi.applications({
        page,
        pageSize,
        status: status || undefined,
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
    fetchApplications();
  };

  const statusConfig = {
    CHO_TIEP_NHAN: { label: 'Chờ tiếp nhận', color: 'orange' },
    DANG_XU_LY: { label: 'Đang thụ lý', color: 'blue' },
    CHO_KY_DUYET: { label: 'Chờ ký duyệt', color: 'purple' },
    DA_KY_SO: { label: 'Đã ký số', color: 'cyan' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'green' },
    TRA_LAI: { label: 'Yêu cầu bổ sung', color: 'volcano' },
    TU_CHOI: { label: 'Từ chối giải quyết', color: 'red' },
  };

  const slaConfig = {
    NORMAL: { label: 'Trong hạn', color: 'default' },
    WARNING: { label: 'Sát hạn (<= 24h)', color: 'warning' },
    OVERDUE: { label: 'Quá hạn', color: 'error' },
    COMPLETED: { label: 'Đã hoàn tất', color: 'success' },
  };

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'dossier_code',
      key: 'dossier_code',
      render: (code, record) => (
        <Space direction="vertical" size={2}>
          <a
            onClick={() => navigate(`/cong-dan/ho-so/${record.id}`)}
            style={{ fontWeight: 700, color: '#b91c1c', fontSize: 14 }}
          >
            {code}
          </a>
          <Space size={4}>
            <Tag color={record.submit_channel === 'TRUC_TUYEN' ? 'blue' : 'default'} style={{ fontSize: 10 }}>
              {record.submit_channel === 'TRUC_TUYEN' ? '🌐 Trực tuyến' : '🏢 Trực tiếp'}
            </Tag>
            {record.sla_status && slaConfig[record.sla_status] && (
              <Tag color={slaConfig[record.sla_status].color} style={{ fontSize: 10 }}>
                {slaConfig[record.sla_status].label}
              </Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Tên thủ tục hành chính',
      dataIndex: 'proc_name',
      key: 'proc_name',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Người nộp: <strong>{record.citizen_name}</strong>
          </div>
        </div>
      ),
    },
    {
      title: 'Thời gian tiếp nhận & Hẹn trả',
      key: 'dates',
      render: (_, r) => (
        <div style={{ fontSize: 12 }}>
          <div>Nộp: {r.submit_date ? dayjs(r.submit_date).format('DD/MM/YYYY HH:mm') : '—'}</div>
          <div style={{ color: '#b91c1c', fontWeight: 600 }}>
            Hẹn: {r.appointment_date ? dayjs(r.appointment_date).format('DD/MM/YYYY HH:mm') : '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái giải quyết',
      dataIndex: 'status',
      key: 'status',
      render: (st, r) => {
        const conf = statusConfig[st] || { label: st, color: 'default' };
        return (
          <Space direction="vertical" size={2}>
            <Tag color={conf.color} style={{ fontWeight: 600 }}>{conf.label}</Tag>
            {st === 'HOAN_THANH' && r.satisfaction_score && (
              <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                ⭐ Đã đánh giá: {r.satisfaction_score}/5
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Lệ phí & Biên lai',
      key: 'fee',
      render: (_, r) => {
        const fee = parseFloat(r.fee_amount || 0);
        if (fee <= 0) return <Tag color="green">Miễn phí</Tag>;
        return (
          <Space direction="vertical" size={2}>
            {r.payment_status === 'DA_THANH_TOAN' ? (
              <Tag color="success">Đã nộp ({fee.toLocaleString('vi-VN')} đ)</Tag>
            ) : (
              <Tag color="warning">Chưa nộp ({fee.toLocaleString('vi-VN')} đ)</Tag>
            )}
            {r.receipt_url && (
              <a
                href={resolveFileUrl(r.receipt_url)}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11, color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <PrinterOutlined /> In Biên lai điện tử
              </a>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/cong-dan/ho-so/${record.id}`)}
          style={{ borderColor: '#b91c1c', color: '#b91c1c' }}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#7f1d1d', fontWeight: 800 }}>
            HỒ SƠ HÀNH CHÍNH CỦA TÔI
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Tự động theo dõi tiến độ, tài liệu kết quả và biên lai theo số CCCD của bạn
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/tra-cuu')}
          style={{
            background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
            borderColor: '#7f1d1d',
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          Nộp hồ sơ DVC mới
        </Button>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}
        bodyStyle={{ padding: 20 }}
      >
        {/* Bộ lọc tìm kiếm */}
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: 20 }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={10}>
              <Input
                placeholder="Tìm kiếm theo Mã hồ sơ hoặc Tên thủ tục..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Select
                placeholder="Lọc theo trạng thái"
                value={status}
                onChange={(val) => {
                  setStatus(val);
                  setPage(1);
                  setSearchParams(val ? { status: val } : {});
                }}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="">Tất cả trạng thái</Option>
                <Option value="CHO_TIEP_NHAN">Chờ tiếp nhận</Option>
                <Option value="DANG_XU_LY">Đang thụ lý</Option>
                <Option value="CHO_KY_DUYET">Chờ ký duyệt</Option>
                <Option value="DA_KY_SO">Đã ký số</Option>
                <Option value="HOAN_THANH">Hoàn thành</Option>
                <Option value="TRA_LAI">Yêu cầu bổ sung</Option>
                <Option value="TU_CHOI">Từ chối</Option>
              </Select>
            </Col>
            <Col xs={24} sm={4} md={6}>
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
                    setSearchParams({});
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
            showTotal: (tot) => `Tổng cộng ${tot} hồ sơ`,
          }}
          scroll={{ x: 850 }}
          locale={{ emptyText: 'Không tìm thấy hồ sơ nào phù hợp' }}
        />
      </Card>
    </div>
  );
}
