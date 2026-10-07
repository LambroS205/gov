import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Button, Space, Modal, List, Avatar } from 'antd';
import { BankOutlined, ReloadOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { departmentsApi } from '../../api/client';

const { Title, Text } = Typography;

export default function DepartmentManagement() {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentsApi.list();
      setDepartments(res?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (record) => {
    try {
      const res = await departmentsApi.get(record.id);
      setSelectedDept(res?.data || record);
      setDetailModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    {
      title: 'Mã phòng ban',
      dataIndex: 'dept_code',
      key: 'dept_code',
      width: 170,
      render: (t) => <strong>{t}</strong>,
    },
    {
      title: 'Tên phòng ban / Đơn vị',
      dataIndex: 'dept_name',
      key: 'dept_name',
      render: (t) => <span style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>{t}</span>,
    },
    {
      title: 'Chức năng, nhiệm vụ',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Số cán bộ trực thuộc',
      dataIndex: 'total_officers',
      key: 'total_officers',
      width: 180,
      render: (n) => <Tag color="blue">{n} cán bộ</Tag>,
    },
    {
      title: 'Danh sách cán bộ',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Button
          size="small"
          icon={<TeamOutlined />}
          onClick={() => handleOpenDetail(record)}
        >
          Xem nhân sự
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
              Cơ cấu Tổ chức & Phòng ban UBND Phường Yên Bái
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Danh mục các phòng ban chuyên môn, văn phòng HĐND-UBND và bộ phận Một cửa
            </Text>
          </div>

          <Button icon={<ReloadOutlined />} onClick={fetchDepartments}>
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Modal Xem nhân sự phòng ban */}
      <Modal
        title={`Danh sách nhân sự: ${selectedDept?.dept_name}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
      >
        <List
          itemLayout="horizontal"
          dataSource={selectedDept?.officers || []}
          locale={{ emptyText: 'Chưa có cán bộ nào trực thuộc phòng ban này' }}
          renderItem={(user) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1652f0' }} />}
                title={<strong>{user.full_name}</strong>}
                description={
                  <div>
                    <div>Tài khoản: <code>{user.username}</code> &bull; Vai trò: <Tag color="blue">{user.role}</Tag></div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      SĐT: {user.phone_number || '---'} &bull; Email: {user.email || '---'}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
