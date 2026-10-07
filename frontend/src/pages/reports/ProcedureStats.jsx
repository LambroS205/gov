import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { reportsApi } from '../../api/client';

const { Title, Text } = Typography;

export default function ProcedureStats() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.procedures();
      setData(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field_type',
      key: 'field_type',
      width: 160,
      render: (f) => <Tag color="blue">{f}</Tag>,
    },
    {
      title: 'Hạn quy định',
      dataIndex: 'processing_days',
      key: 'processing_days',
      width: 130,
      render: (d) => `${d} ngày làm việc`,
    },
    {
      title: 'Hồ sơ đã tiếp nhận',
      dataIndex: 'total_applications',
      key: 'total_applications',
      width: 150,
      render: (n) => <strong>{n} hồ sơ</strong>,
    },
    {
      title: 'Đã hoàn thành',
      dataIndex: 'completed_count',
      key: 'completed_count',
      width: 130,
      render: (n) => <Tag color="green">{n}</Tag>,
    },
    {
      title: 'Tổng lệ phí thu được',
      dataIndex: 'total_revenue',
      key: 'total_revenue',
      width: 180,
      render: (rev) => (
        <span style={{ fontWeight: 600, color: '#c5221f' }}>
          {Number(rev || 0).toLocaleString('vi-VN')} VNĐ
        </span>
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
              Thống kê Tần suất & Doanh thu theo Thủ tục Hành chính
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Tổng hợp khối lượng giao dịch và số tiền lệ phí thu được theo từng thủ tục
            </Text>
          </div>

          <Button icon={<ReloadOutlined />} onClick={fetchStats}>
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
}
