import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Button, Space, Empty } from 'antd';
import {
  BellOutlined,
  MessageOutlined,
  MobileOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { citizenPortalApi } from '../../api/portalClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

export default function Notifications() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    fetchNotifications();
  }, [page, pageSize]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await citizenPortalApi.notifications({ page, pageSize });
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

  const channelIcons = {
    SMS: <MobileOutlined style={{ color: '#0284c7' }} />,
    ZALO: <MessageOutlined style={{ color: '#059669' }} />,
    SYSTEM: <BellOutlined style={{ color: '#d97706' }} />,
  };

  const handleItemClick = (item) => {
    if (item.related_type === 'APPLICATION' && item.related_id) {
      navigate(`/cong-dan/ho-so/${item.related_id}`);
    } else if (item.related_type === 'COMPLAINT') {
      navigate('/cong-dan/phan-anh');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#7f1d1d', fontWeight: 800 }}>
            HỘP THƯ THÔNG BÁO CỦA TÔI
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Lịch sử tin nhắn SMS và thông báo hệ thống về tiến độ hồ sơ & phản ánh
          </Text>
        </div>

        <Button icon={<ReloadOutlined />} onClick={fetchNotifications}>
          Làm mới
        </Button>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}
        bodyStyle={{ padding: '12px 24px' }}
      >
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={items}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
            showTotal: (tot) => `Tổng cộng ${tot} thông báo`,
          }}
          locale={{
            emptyText: (
              <Empty
                description="Bạn chưa có thông báo nào"
                style={{ padding: '40px 0' }}
              />
            ),
          }}
          renderItem={(item) => {
            const isClickable = Boolean(item.related_type && item.related_id);
            return (
              <List.Item
                style={{
                  padding: '16px 12px',
                  borderRadius: 10,
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'background 0.2s',
                  borderBottom: '1px solid #f1f5f9',
                }}
                className={isClickable ? 'hoverable-notif-item' : ''}
                onClick={() => handleItemClick(item)}
                actions={
                  isClickable
                    ? [
                        <Button
                          type="link"
                          size="small"
                          style={{ color: '#b91c1c', fontWeight: 600 }}
                        >
                          Xem chi tiết <ArrowRightOutlined />
                        </Button>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      {channelIcons[item.channel] || <BellOutlined />}
                    </div>
                  }
                  title={
                    <Space wrap>
                      <strong style={{ color: '#1e293b' }}>{item.subject || 'Thông báo hệ thống'}</strong>
                      <Tag color={item.channel === 'SMS' ? 'blue' : 'green'} style={{ fontSize: 11 }}>
                        Kênh {item.channel}
                      </Tag>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>
                        {item.created_at ? dayjs(item.created_at).format('DD/MM/YYYY HH:mm') : ''}
                      </span>
                    </Space>
                  }
                  description={
                    <div style={{ color: '#475569', marginTop: 4, fontSize: 13, lineHeight: 1.5 }}>
                      {item.message}
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />

        <style>{`
          .hoverable-notif-item:hover {
            background: #fef2f2 !important;
          }
        `}</style>
      </Card>
    </div>
  );
}
