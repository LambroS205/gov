import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography, Row, Col, Progress, Space, Spin } from 'antd';
import {
  DownloadOutlined,
  BarChartOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
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
    window.open('/api/v1/reports/export', '_blank');
  };

  const officerColumns = [
    {
      title: 'Họ và tên Cán bộ',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (t, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{t}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{r.dept_name}</div>
        </div>
      ),
    },
    {
      title: 'Hồ sơ được giao',
      dataIndex: 'total_assigned',
      key: 'total_assigned',
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: 'Đang xử lý',
      dataIndex: 'currently_processing',
      key: 'currently_processing',
      render: (v) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Đã hoàn thành',
      dataIndex: 'total_completed',
      key: 'total_completed',
      render: (v) => <Tag color="green">{v}</Tag>,
    },
    {
      title: 'Đúng hạn',
      dataIndex: 'on_time_count',
      key: 'on_time_count',
      render: (v) => <span style={{ color: '#10b981', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Quá hạn',
      dataIndex: 'overdue_count',
      key: 'overdue_count',
      render: (v) => (
        <span style={{ color: Number(v) > 0 ? '#ef4444' : '#64748b', fontWeight: Number(v) > 0 ? 700 : 400 }}>
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
              status={val >= 95 ? 'success' : val >= 80 ? 'normal' : 'exception'}
              format={(p) => `${p}%`}
            />
          </div>
        );
      },
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
              Báo cáo Hiệu suất & Chỉ số Phục vụ Hành chính (KPI)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Đánh giá tiến độ giải quyết thủ tục hành chính, mức độ hoàn thành đúng hạn của cán bộ và phòng ban
            </Text>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportCsv}
              style={{ background: '#10b981', borderColor: '#10b981', fontWeight: 600 }}
            >
              Xuất dữ liệu Excel / CSV
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchReport}>
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={officerColumns}
          dataSource={data?.officers || []}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
}
