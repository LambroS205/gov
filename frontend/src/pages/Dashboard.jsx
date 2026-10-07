import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Button, Typography, Space, Spin, Alert, Tooltip as AntTooltip } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  AlertOutlined,
  DollarOutlined,
  ArrowUpOutlined,
  PlusOutlined,
  SearchOutlined,
  UsergroupAddOutlined,
  RiseOutlined,
  SmileOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, applicationsApi } from '../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const GOV_PIE_COLORS = ['#b91c1c', '#d97706', '#f59e0b', '#15803d', '#7e22ce', '#991b1b'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, chartsRes, appsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getCharts(),
        applicationsApi.list({ page: 1, pageSize: 6 }),
      ]);
      setStats(statsRes?.data || null);
      setCharts(chartsRes?.data || null);
      setRecentApps(appsRes?.data?.items || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const statusTags = {
    CHO_TIEP_NHAN: <Tag color="warning">Chờ tiếp nhận</Tag>,
    DANG_XU_LY: <Tag color="processing">Đang xử lý</Tag>,
    CHO_KY_DUYET: <Tag color="purple">Chờ ký duyệt</Tag>,
    DA_KY_SO: <Tag color="orange">Đã ký số</Tag>,
    HOAN_THANH: <Tag color="success">Hoàn thành</Tag>,
    TRA_LAI: <Tag color="error">Trả lại</Tag>,
    TU_CHOI: <Tag color="default">Từ chối</Tag>,
  };

  const paymentTags = {
    CHUA_THANH_TOAN: <Tag color="error">Chưa nộp phí</Tag>,
    DA_THANH_TOAN: <Tag color="success">Đã nộp phí</Tag>,
    MIEN_PHI: <Tag color="default">Miễn phí</Tag>,
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
      ellipsis: true,
    },
    {
      title: 'Công dân nộp',
      dataIndex: 'citizen_name',
      key: 'citizen_name',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: 'Hạn trả kết quả',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (date, record) => {
        let slaBadge = null;
        if (record.sla_status === 'OVERDUE') {
          slaBadge = <span className="badge-sla-overdue">🔴 Quá hạn</span>;
        } else if (record.sla_status === 'WARNING') {
          slaBadge = <span className="badge-sla-warning">🟡 Sắp đến hạn</span>;
        } else if (record.status !== 'HOAN_THANH') {
          slaBadge = <span className="badge-sla-normal">🟢 Đúng hạn</span>;
        }
        return (
          <Space orientation="vertical" size={2}>
            <span>{dayjs(date).format('DD/MM/YYYY HH:mm')}</span>
            {slaBadge}
          </Space>
        );
      },
    },
    {
      title: 'Lệ phí',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => paymentTags[status] || status,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => statusTags[status] || status,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu Trung tâm điều hành Hành chính Số..." />
      </div>
    );
  }

  const apps = stats?.applications || {};
  const csat = stats?.csat || {};
  const slaAlerts = stats?.sla_alerts || {};
  const complaints = stats?.complaints || {};
  const finance = stats?.finance || {};

  return (
    <div>
      {/* Banner Chào mừng & Hành động nhanh - Tông Đỏ Đô & Vàng Hoàng Gia */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3b0709 0%, #581c1c 45%, #7f1d1d 80%, #991b1b 100%)',
          borderRadius: 16,
          padding: '26px 30px',
          color: '#ffffff',
          marginBottom: 24,
          boxShadow: '0 12px 28px -6px rgba(59, 7, 9, 0.4), 0 0 0 1px rgba(245, 158, 11, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 24 }}>⭐</span>
            <Title level={3} style={{ color: '#ffffff', margin: 0, fontWeight: 800 }}>
              Trung tâm Điều hành Hành chính Số UBND Phường Yên Bái
            </Title>
          </div>
          <Text style={{ color: '#fef08a', fontSize: 13, fontWeight: 500, letterSpacing: '0.3px' }}>
            Giám sát thời gian thực quy trình Một cửa liên thông • Quản trị dữ liệu dân cư • Bộ chỉ số Quyết định 766/QĐ-TTg
          </Text>
        </div>

        <Space size="middle" style={{ zIndex: 1 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/applications/create')}
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              borderColor: '#f59e0b',
              color: '#ffffff',
              fontWeight: 700,
              borderRadius: 8,
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.5)',
            }}
          >
            Tiếp nhận hồ sơ mới
          </Button>
          <Button
            ghost
            icon={<SearchOutlined />}
            size="large"
            onClick={() => navigate('/tra-cuu')}
            style={{ borderRadius: 8, fontWeight: 600, borderColor: '#fde68a', color: '#ffffff' }}
          >
            Tra cứu công dân
          </Button>
        </Space>
      </div>

      {/* KHỐI 1: BỘ CHỈ SỐ PHỤC VỤ NGƯỜI DÂN, DOANH NGHIỆP (QĐ 766/QĐ-TTg) */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7f1d1d', fontWeight: 700 }}>
            <SafetyCertificateOutlined style={{ color: '#b91c1c', fontSize: 18 }} />
            <span>BỘ CHỈ SỐ PHỤC VỤ NGƯỜI DÂN, DOANH NGHIỆP TRONG THỰC HIỆN TTHC (Quyết định 766/QĐ-TTg)</span>
          </div>
        }
        bordered={false}
        style={{
          borderRadius: 14,
          marginBottom: 24,
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid #fed7aa',
          background: '#fffdfa',
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
            <div style={{ padding: 16, background: '#ffffff', borderRadius: 10, border: '1px solid #fed7aa', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#78350f', fontWeight: 600 }}>TỶ LỆ TIẾP NHẬN TRỰC TUYẾN</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 4px 0' }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#b91c1c' }}>
                    {apps.online_rate || 0}%
                  </span>
                  <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Đạt chỉ tiêu Tỉnh</span>
                </div>
              </div>
              <Progress percent={apps.online_rate || 0} strokeColor="#b91c1c" size="small" showInfo={false} />
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
            <div style={{ padding: 16, background: '#ffffff', borderRadius: 10, border: '1px solid #fed7aa', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#78350f', fontWeight: 600 }}>GIẢI QUYẾT ĐÚNG HẠN & TRƯỚC HẠN</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 4px 0' }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#15803d' }}>
                    {apps.on_time_rate || 100}%
                  </span>
                  <span style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>
                    ({apps.early_rate || 0}% trước hạn)
                  </span>
                </div>
              </div>
              <Progress percent={apps.on_time_rate || 100} strokeColor="#15803d" size="small" showInfo={false} />
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
            <div style={{ padding: 16, background: '#ffffff', borderRadius: 10, border: '1px solid #fed7aa', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#78350f', fontWeight: 600 }}>MỨC ĐỘ HÀI LÒNG CỦA CÔNG DÂN (CSAT)</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 4px 0' }}>
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#d97706' }}>
                    {csat.average_score || 5.0}
                  </span>
                  <span style={{ fontSize: 18, color: '#f59e0b' }}>★★★★★</span>
                  <span style={{ fontSize: 12, color: '#64748b' }}>({csat.total_ratings || 0} lượt)</span>
                </div>
              </div>
              <Progress percent={csat.satisfied_rate || 100} strokeColor="#d97706" size="small" showInfo={false} />
            </div>
          </Col>

          <Col xs={24} sm={12} lg={6} style={{ display: 'flex' }}>
            <div style={{ padding: 16, background: '#ffffff', borderRadius: 10, border: '1px solid #fed7aa', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, color: '#78350f', fontWeight: 600 }}>THANH TOÁN PHÍ/LỆ PHÍ DVC</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 4px 0' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#7f1d1d' }}>
                    {Number(finance.total_fee_collected || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 8 }}>
                <span>Đã thu: <strong style={{ color: '#15803d' }}>{finance.paid_count || 0} hồ sơ</strong></span>
                <span>Chờ nộp: <strong style={{ color: '#b91c1c' }}>{finance.unpaid_count || 0} hồ sơ</strong></span>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* KHỐI 2: CẢNH BÁO HẠN XỬ LÝ SLA (TRAFFIC LIGHT ALERTS) */}
      {(slaAlerts.warning_count > 0 || slaAlerts.overdue_count > 0) && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 8 }}>
              <Space>
                <WarningOutlined style={{ fontSize: 18, color: '#b91c1c' }} />
                <span style={{ fontWeight: 700, color: '#991b1b' }}>
                  CẢNH BÁO HẠN XỬ LÝ HỒ SƠ: Có {slaAlerts.overdue_count} hồ sơ quá hạn và {slaAlerts.warning_count} hồ sơ sắp đến hạn trong 24 giờ tới!
                </span>
              </Space>
              <Button size="small" type="primary" danger onClick={() => navigate('/processing/queue')}>
                Đến hàng đợi xử lý ngay &rarr;
              </Button>
            </div>
          }
          type="error"
          showIcon={false}
          style={{
            marginBottom: 24,
            borderRadius: 12,
            border: '1.5px solid #f87171',
            background: '#fef2f2',
            padding: '12px 18px',
          }}
        />
      )}

      {/* KHỐI 3: 6 THẺ THỐNG KÊ CHI TIẾT */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div className="stat-metric-card red" style={{ width: '100%' }}>
            <Statistic
              title={<span style={{ color: '#78350f', fontSize: 13, fontWeight: 600 }}>Tiếp nhận hôm nay</span>}
              value={apps.total_today || 0}
              valueStyle={{ color: '#b91c1c', fontWeight: 800, fontSize: 28 }}
              prefix={<FileTextOutlined />}
              suffix="hồ sơ"
            />
          </div>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div className="stat-metric-card gold" style={{ width: '100%' }}>
            <Statistic
              title={<span style={{ color: '#78350f', fontSize: 13, fontWeight: 600 }}>Đang thụ lý</span>}
              value={apps.dang_xu_ly || 0}
              valueStyle={{ color: '#d97706', fontWeight: 800, fontSize: 28 }}
              prefix={<ClockCircleOutlined />}
              suffix="hồ sơ"
            />
          </div>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div className="stat-metric-card" style={{ width: '100%' }}>
            <Statistic
              title={<span style={{ color: '#78350f', fontSize: 13, fontWeight: 600 }}>Chờ Lãnh đạo ký</span>}
              value={apps.cho_ky_duyet || 0}
              valueStyle={{ color: '#7e22ce', fontWeight: 800, fontSize: 28 }}
              prefix={<SafetyCertificateOutlined />}
              suffix="hồ sơ"
            />
          </div>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div className="stat-metric-card green" style={{ width: '100%' }}>
            <Statistic
              title={<span style={{ color: '#78350f', fontSize: 13, fontWeight: 600 }}>Đã hoàn thành</span>}
              value={apps.hoan_thanh || 0}
              valueStyle={{ color: '#15803d', fontWeight: 800, fontSize: 28 }}
              prefix={<CheckCircleOutlined />}
              suffix="hồ sơ"
            />
          </div>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div className="stat-metric-card red" style={{ width: '100%' }}>
            <Statistic
              title={<span style={{ color: '#78350f', fontSize: 13, fontWeight: 600 }}>Phản ánh mới</span>}
              value={complaints.moi || 0}
              valueStyle={{ color: '#b91c1c', fontWeight: 800, fontSize: 28 }}
              prefix={<AlertOutlined />}
              suffix="tin"
            />
          </div>
        </Col>

        <Col xs={12} sm={12} md={8} lg={4} style={{ display: 'flex' }}>
          <div className="stat-metric-card gold" style={{ width: '100%' }}>
            <Statistic
              title={<span style={{ color: '#78350f', fontSize: 13, fontWeight: 600 }}>Hồ sơ cần xử lý gấp</span>}
              value={(slaAlerts.warning_count || 0) + (slaAlerts.overdue_count || 0)}
              valueStyle={{ color: '#dc2626', fontWeight: 800, fontSize: 28 }}
              prefix={<ThunderboltOutlined />}
              suffix="hồ sơ"
            />
          </div>
        </Col>
      </Row>

      {/* BIỂU ĐỒ PHÂN TÍCH DỮ LIỆU - PHỐI MÀU ĐỎ CỜ & VÀNG KIM */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <RiseOutlined style={{ color: '#b91c1c' }} />
                <span style={{ fontWeight: 700, color: '#7f1d1d' }}>
                  Xu hướng tiếp nhận & trả kết quả 7 ngày gần nhất
                </span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 14, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
          >
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={charts?.weekly_trends || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTiepNhanGov" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorHoanThanhGov" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="tiep_nhan"
                    name="Hồ sơ tiếp nhận"
                    stroke="#b91c1c"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTiepNhanGov)"
                  />
                  <Area
                    type="monotone"
                    dataKey="hoan_thanh"
                    name="Hồ sơ hoàn thành"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHoanThanhGov)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Cơ cấu hồ sơ theo lĩnh vực TTHC */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#d97706' }} />
                <span style={{ fontWeight: 700, color: '#7f1d1d' }}>Cơ cấu theo lĩnh vực TTHC</span>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 14, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
          >
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.field_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="field"
                  >
                    {(charts?.field_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GOV_PIE_COLORS[index % GOV_PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* BẢNG HỒ SƠ MỚI TIẾP NHẬN GẦN ĐÂY */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <FileTextOutlined style={{ color: '#b91c1c' }} />
              <span style={{ fontWeight: 700, color: '#7f1d1d' }}>Hồ sơ tiếp nhận gần đây tại Bộ phận Một cửa</span>
            </Space>
            <Button
              type="link"
              onClick={() => navigate('/applications')}
              style={{ fontWeight: 600, color: '#b91c1c' }}
            >
              Xem tất cả hồ sơ &rarr;
            </Button>
          </div>
        }
        bordered={false}
        style={{ borderRadius: 14, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
      >
        <Table
          columns={columns}
          dataSource={recentApps}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 800 }}
        />
      </Card>
    </div>
  );
}
