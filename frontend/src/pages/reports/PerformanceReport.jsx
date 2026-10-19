import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Typography,
  Row,
  Col,
  Progress,
  Space,
  Statistic,
  Alert,
} from 'antd';
import {
  DownloadOutlined,
  BarChartOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  PieChartOutlined,
  UserOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { reportsApi } from '../../api/client';

const { Title, Text } = Typography;

export default function PerformanceReport() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.performance();
      setData(res?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    window.open(reportsApi.getExportUrl(), '_blank');
  };

  // Tính toán dữ liệu thống kê tổng hợp từ danh sách cán bộ
  const officers = data?.officers || [];
  const totalAssigned = officers.reduce((sum, o) => sum + Number(o.total_assigned || 0), 0);
  const totalCompleted = officers.reduce((sum, o) => sum + Number(o.total_completed || 0), 0);
  const totalOnTime = officers.reduce((sum, o) => sum + Number(o.on_time_count || 0), 0);
  const totalOverdue = officers.reduce((sum, o) => sum + Number(o.overdue_count || 0), 0);
  const totalProcessing = officers.reduce((sum, o) => sum + Number(o.currently_processing || 0), 0);

  const overallOnTimeRate = totalCompleted > 0 ? ((totalOnTime / totalCompleted) * 100).toFixed(1) : 100.0;

  // Dữ liệu biểu đồ tròn tỷ lệ giải quyết
  const pieData = [
    { name: 'Đúng hạn', value: totalOnTime || 1, color: '#16a34a' },
    { name: 'Quá hạn', value: totalOverdue, color: '#dc2626' },
    { name: 'Đang xử lý', value: totalProcessing, color: '#0284c7' },
  ].filter((item) => item.value > 0);

  // Dữ liệu biểu đồ cột so sánh giữa các cán bộ
  const barData = officers.map((o) => ({
    name: o.full_name?.split(' ').slice(-2).join(' ') || o.full_name, // Lấy tên ngắn gọn
    fullName: o.full_name,
    'Đã giao': Number(o.total_assigned || 0),
    'Hoàn thành': Number(o.total_completed || 0),
    'Đúng hạn': Number(o.on_time_count || 0),
  }));

  const officerColumns = [
    {
      title: 'Họ và tên Cán bộ',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{t}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.dept_name}</div>
        </div>
      ),
    },
    {
      title: 'Hồ sơ được giao',
      dataIndex: 'total_assigned',
      key: 'total_assigned',
      align: 'center',
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: 'Đang xử lý',
      dataIndex: 'currently_processing',
      key: 'currently_processing',
      align: 'center',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Đã hoàn thành',
      dataIndex: 'total_completed',
      key: 'total_completed',
      align: 'center',
      render: (v) => <Tag color="green">{v}</Tag>,
    },
    {
      title: 'Đúng hạn',
      dataIndex: 'on_time_count',
      key: 'on_time_count',
      align: 'center',
      render: (v) => <span style={{ color: '#16a34a', fontWeight: 700 }}>{v}</span>,
    },
    {
      title: 'Quá hạn',
      dataIndex: 'overdue_count',
      key: 'overdue_count',
      align: 'center',
      render: (v) => (
        <span style={{ color: Number(v) > 0 ? '#dc2626' : '#64748b', fontWeight: Number(v) > 0 ? 800 : 400 }}>
          {v}
        </span>
      ),
    },
    {
      title: 'Tỉ lệ đúng hạn (KPI)',
      dataIndex: 'on_time_rate',
      key: 'on_time_rate',
      render: (rate) => {
        const val = Number(rate || 100);
        return (
          <div style={{ width: 140 }}>
            <Progress
              percent={val}
              size="small"
              strokeColor={val >= 95 ? '#16a34a' : val >= 80 ? '#f59e0b' : '#dc2626'}
              format={(p) => `${p}%`}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div>
      {/* Tiêu đề & Công cụ */}
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
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#7f1d1d' }}>
            Báo cáo Hiệu suất & Chỉ số Phục vụ Hành chính (KPI)
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Đánh giá tiến độ giải quyết TTHC, tỷ lệ đúng hạn của cán bộ theo Bộ chỉ số Quyết định 766/QĐ-TTg
          </Text>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportCsv}
            style={{ background: '#15803d', borderColor: '#15803d', fontWeight: 600 }}
          >
            Xuất dữ liệu Excel / CSV (UTF-8)
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchReport}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
            <Statistic
              title="Tổng hồ sơ đã phân công"
              value={totalAssigned}
              prefix={<UserOutlined style={{ color: '#0369a1' }} />}
              valueStyle={{ color: '#0369a1', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
            <Statistic
              title="Đã giải quyết hoàn thành"
              value={totalCompleted}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              valueStyle={{ color: '#16a34a', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
            <Statistic
              title="Tỷ lệ giải quyết đúng hạn"
              value={overallOnTimeRate}
              suffix="%"
              prefix={<ThunderboltOutlined style={{ color: '#d97706' }} />}
              valueStyle={{ color: Number(overallOnTimeRate) >= 95 ? '#16a34a' : '#d97706', fontWeight: 800 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
            <Statistic
              title="Hồ sơ đang xử lý trong hạn"
              value={totalProcessing}
              prefix={<ClockCircleOutlined style={{ color: '#7c3aed' }} />}
              valueStyle={{ color: '#7c3aed', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ trực quan */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        {/* Biểu đồ Tròn: Phân bổ tiến độ giải quyết */}
        <Col xs={24} md={10}>
          <Card
            bordered={false}
            title={
              <span style={{ fontWeight: 700, color: '#7f1d1d' }}>
                <PieChartOutlined /> Cơ cấu tiến độ xử lý hồ sơ
              </span>
            }
            style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Biểu đồ Cột: Hiệu suất theo cán bộ thụ lý */}
        <Col xs={24} md={14}>
          <Card
            bordered={false}
            title={
              <span style={{ fontWeight: 700, color: '#7f1d1d' }}>
                <BarChartOutlined /> Khối lượng xử lý theo từng Chuyên viên
              </span>
            }
            style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}
          >
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="Đã giao" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Hoàn thành" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Đúng hạn" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Bảng chi tiết cán bộ */}
      <Card
        bordered={false}
        title={<span style={{ fontWeight: 700, color: '#7f1d1d' }}>Bảng theo dõi KPI chi tiết từng cán bộ công chức</span>}
        style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
      >
        <Table
          columns={officerColumns}
          dataSource={officers}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
}
