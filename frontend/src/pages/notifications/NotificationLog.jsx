import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Row,
  Col,
  Statistic,
  Space,
  Typography,
  Badge,
} from 'antd';
import {
  MessageOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  MobileOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { notificationsApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export default function NotificationLog() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [channel, setChannel] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({
    total_sent: 0,
    total_today: 0,
    sms_count: 0,
    zalo_count: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, channel]);

  const fetchStats = async () => {
    try {
      const res = await notificationsApi.stats();
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
        channel: channel || undefined,
        search: search.trim() || undefined,
      };
      const res = await notificationsApi.list(params);
      if (res?.data) {
        setData(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const columns = [
    {
      title: 'Thời gian gửi',
      dataIndex: 'sent_at',
      key: 'sent_at',
      width: 160,
      render: (val, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {dayjs(val || record.created_at).format('DD/MM/YYYY HH:mm')}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            {dayjs(val || record.created_at).format('ss')} giây trước
          </div>
        </div>
      ),
    },
    {
      title: 'Kênh gửi',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (val) => {
        if (val === 'SMS') {
          return <Tag color="volcano" style={{ fontWeight: 700 }}>📲 SMS Brandname</Tag>;
        }
        if (val === 'ZALO') {
          return <Tag color="blue" style={{ fontWeight: 700 }}>💬 Zalo OA</Tag>;
        }
        if (val === 'EMAIL') {
          return <Tag color="purple" style={{ fontWeight: 700 }}>✉️ Email</Tag>;
        }
        return <Tag color="default">🔔 Hệ thống</Tag>;
      },
    },
    {
      title: 'Người nhận & Số điện thoại',
      key: 'recipient',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>
            {record.recipient_name || 'Công dân nộp hồ sơ'}
          </div>
          <div style={{ fontSize: 12, color: '#0369a1', fontFamily: 'monospace' }}>
            {record.recipient_phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Tiêu đề thông báo',
      dataIndex: 'subject',
      key: 'subject',
      width: 180,
      render: (val) => <strong style={{ color: '#7f1d1d' }}>{val || 'Thông báo DVC'}</strong>,
    },
    {
      title: 'Nội dung tin nhắn',
      dataIndex: 'message',
      key: 'message',
      render: (val) => (
        <div style={{ fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>
          {val}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_sent',
      key: 'is_sent',
      width: 130,
      align: 'center',
      render: () => (
        <Badge status="success" text={<span style={{ color: '#15803d', fontWeight: 600 }}>Thành công (100%)</span>} />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#7f1d1d' }}>
          Nhật ký Tin nhắn Thông báo (SMS Brandname & Zalo OA)
        </Title>
        <Text type="secondary">
          Theo dõi lịch sử tin nhắn tự động gửi đến công dân khi tiếp nhận hồ sơ, hẹn trả kết quả và phản hồi phản ánh hiện trường.
        </Text>
      </div>

      {/* Thẻ thống kê */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
            <Statistic
              title="Tổng tin đã phát thành công"
              value={stats.total_sent}
              prefix={<CheckCircleOutlined style={{ color: '#16a34a' }} />}
              valueStyle={{ color: '#16a34a', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
            <Statistic
              title="Tin nhắn gửi trong hôm nay"
              value={stats.total_today}
              prefix={<SendOutlined style={{ color: '#0284c7' }} />}
              valueStyle={{ color: '#0284c7', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
            <Statistic
              title="SMS Brandname (UBND-YENBAI)"
              value={stats.sms_count}
              prefix={<MobileOutlined style={{ color: '#ea580c' }} />}
              valueStyle={{ color: '#ea580c', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card bordered={false} style={{ borderRadius: 12, border: '1px solid #fed7aa', boxShadow: 'var(--shadow-sm)' }}>
            <Statistic
              title="Zalo Official Account"
              value={stats.zalo_count}
              prefix={<MessageOutlined style={{ color: '#2563eb' }} />}
              valueStyle={{ color: '#2563eb', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Bảng danh sách & Bộ lọc */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}
      >
        <Row gutter={12} style={{ marginBottom: 16 }} justify="space-between">
          <Col xs={24} sm={16}>
            <Space wrap size="middle">
              <Input
                placeholder="Tìm theo SĐT, tên người nhận, nội dung tin..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 280 }}
                prefix={<SearchOutlined />}
                allowClear
              />
              <Select
                value={channel}
                onChange={(val) => {
                  setChannel(val);
                  setPage(1);
                }}
                style={{ width: 180 }}
              >
                <Option value="">-- Tất cả các kênh --</Option>
                <Option value="SMS">📲 SMS Brandname</Option>
                <Option value="ZALO">💬 Zalo OA</Option>
                <Option value="EMAIL">✉️ Thư điện tử (Email)</Option>
                <Option value="SYSTEM">🔔 Thông báo hệ thống</Option>
              </Select>
              <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />} style={{ background: '#b91c1c', borderColor: '#7f1d1d' }}>
                Lọc dữ liệu
              </Button>
            </Space>
          </Col>
          <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
            <Button icon={<ReloadOutlined />} onClick={() => { fetchStats(); fetchData(); }}>
              Làm mới
            </Button>
          </Col>
        </Row>

        <Table
          dataSource={data}
          columns={columns}
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
            showSizeChanger: true,
            showTotal: (t) => `Tổng cộng ${t} thông báo`,
          }}
        />
      </Card>
    </div>
  );
}
