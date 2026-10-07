import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography, Space, Input, Row, Col, Alert } from 'antd';
import {
  FormOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function AssignedQueue() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await applicationsApi.list({
        my_queue: '1',
        search: search || undefined,
        pageSize: 50,
      });
      setData(res?.data?.items || []);
      setTotal(res?.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    CHO_TIEP_NHAN: { label: 'Chờ tiếp nhận', color: 'orange' },
    DANG_XU_LY: { label: 'Đang thụ lý', color: 'blue' },
    CHO_KY_DUYET: { label: 'Đã trình ký', color: 'purple' },
    DA_KY_SO: { label: 'Lãnh đạo đã ký', color: 'cyan' },
    HOAN_THANH: { label: 'Đã hoàn thành', color: 'green' },
    TRA_LAI: { label: 'Cần bổ sung', color: 'red' },
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
      title: 'Công dân yêu cầu',
      dataIndex: 'citizen_name',
      key: 'citizen_name',
      render: (t) => <span style={{ fontWeight: 600 }}>{t}</span>,
    },
    {
      title: 'Hạn giải quyết (SLA)',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      render: (d, record) => {
        let slaBadge = null;
        if (record.sla_status === 'OVERDUE') {
          slaBadge = <span className="badge-sla-overdue">🔴 Quá hạn</span>;
        } else if (record.sla_status === 'WARNING') {
          slaBadge = <span className="badge-sla-warning pulse-gold">🟡 Sắp đến hạn</span>;
        } else if (record.status !== 'HOAN_THANH') {
          slaBadge = <span className="badge-sla-normal">🟢 Đúng hạn</span>;
        }
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{dayjs(d).format('DD/MM/YYYY HH:mm')}</div>
            {slaBadge && <div style={{ marginTop: 2 }}>{slaBadge}</div>}
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={statusConfig[s]?.color}>{statusConfig[s]?.label || s}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<FormOutlined />}
          onClick={() => navigate(`/applications/${record.id}`)}
        >
          Thẩm định hồ sơ
        </Button>
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
              Hàng đợi Thụ lý Hồ sơ Chuyên môn
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Cán bộ thụ lý: <strong>{user?.full_name}</strong> &bull; Đơn vị: {user?.dept_name}
            </Text>
          </div>

          <Space>
            <Input
              placeholder="Tìm mã hồ sơ hoặc tên công dân..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={fetchQueue}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={fetchQueue}>
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
