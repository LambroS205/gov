import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Button, Input, Select, Space, Row, Col, Modal } from 'antd';
import { AuditOutlined, SearchOutlined, ReloadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { auditApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function AuditLogViewer() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [action, setAction] = useState(null);
  const [resourceType, setResourceType] = useState(null);
  const [search, setSearch] = useState('');

  const [selectedLog, setSelectedLog] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize, action, resourceType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await auditApi.list({
        page,
        pageSize,
        action: action || undefined,
        resource_type: resourceType || undefined,
        search: search || undefined,
      });
      setLogs(res?.data?.items || []);
      setTotal(res?.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = (record) => {
    setSelectedLog(record);
    setModalOpen(true);
  };

  const actionTags = {
    LOGIN_SUCCESS: { label: 'Đăng nhập thành công', color: 'green' },
    LOGIN_FAILED: { label: 'Đăng nhập thất bại', color: 'red' },
    LOGOUT: { label: 'Đăng xuất', color: 'default' },
    CREATE_APPLICATION: { label: 'Tiếp nhận hồ sơ', color: 'blue' },
    ASSIGN_APPLICATION: { label: 'Phân công chuyên viên', color: 'geekblue' },
    PROCESS_APPLICATION: { label: 'Thẩm định hồ sơ', color: 'orange' },
    SUBMIT_APPROVAL: { label: 'Trình ký Lãnh đạo', color: 'purple' },
    APPROVE_SIGN: { label: 'Phê duyệt Ký số', color: 'gold' },
    COMPLETE_APPLICATION: { label: 'Hoàn thành hồ sơ', color: 'cyan' },
    REJECT_APPLICATION: { label: 'Trả lại hồ sơ', color: 'volcano' },
    VIEW_UNMASKED_CITIZEN_DATA: { label: 'Xem số CCCD đầy đủ (NĐ 13)', color: 'magenta' },
    VIEW_UNMASKED_CITIZEN_PROFILE: { label: 'Xem hồ sơ CCCD (NĐ 13)', color: 'magenta' },
    CREATE_CITIZEN: { label: 'Thêm công dân', color: 'blue' },
    UPDATE_CITIZEN: { label: 'Cập nhật công dân', color: 'orange' },
    CREATE_COMPLAINT: { label: 'Gửi phản ánh', color: 'blue' },
    RESPOND_COMPLAINT: { label: 'Phản hồi kiến nghị', color: 'green' },
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (t) => dayjs(t).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 220,
      render: (act) => (
        <Tag color={actionTags[act]?.color || 'blue'}>{actionTags[act]?.label || act}</Tag>
      ),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 180,
      render: (name) => <strong>{name || 'Khách / Hệ thống'}</strong>,
    },
    {
      title: 'Tài nguyên',
      key: 'resource',
      width: 180,
      render: (_, r) => (
        <div>
          <Tag>{r.resource_type}</Tag>
          <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{r.resource_id}</span>
        </div>
      ),
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 130,
      render: (ip) => <code style={{ fontSize: 11 }}>{ip}</code>,
    },
    {
      title: 'Chi tiết',
      key: 'detail',
      width: 90,
      render: (_, record) => (
        <Button size="small" onClick={() => handleOpenDetail(record)}>
          Xem
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
              Nhật ký Kiểm toán Hệ thống (Immutable Audit Trail)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Ghi vết bất biến 100% các hành động nghiệp vụ, xác thực danh tính và truy cập dữ liệu theo Nghị định 85/2016/NĐ-CP & Nghị định 13/2023/NĐ-CP
            </Text>
          </div>

          <Button icon={<ReloadOutlined />} onClick={fetchLogs}>
            Làm mới
          </Button>
        </div>

        {/* Lọc */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10}>
            <Input
              placeholder="Tìm theo tên cán bộ, mã hồ sơ, IP..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => {
                setPage(1);
                fetchLogs();
              }}
              allowClear
            />
          </Col>

          <Col xs={12} sm={7}>
            <Select
              placeholder="Lọc loại hành động"
              style={{ width: '100%' }}
              value={action}
              onChange={(val) => setAction(val)}
              allowClear
            >
              <Select.Option value="LOGIN_SUCCESS">Đăng nhập thành công</Select.Option>
              <Select.Option value="CREATE_APPLICATION">Tiếp nhận hồ sơ</Select.Option>
              <Select.Option value="APPROVE_SIGN">Phê duyệt ký số</Select.Option>
              <Select.Option value="VIEW_UNMASKED_CITIZEN_DATA">Xem số CCCD đầy đủ (NĐ 13)</Select.Option>
            </Select>
          </Col>

          <Col xs={12} sm={7}>
            <Select
              placeholder="Lọc loại tài nguyên"
              style={{ width: '100%' }}
              value={resourceType}
              onChange={(val) => setResourceType(val)}
              allowClear
            >
              <Select.Option value="APPLICATION">Hồ sơ TTHC</Select.Option>
              <Select.Option value="CITIZEN">Dân cư / CCCD</Select.Option>
              <Select.Option value="USER">Cán bộ / Đăng nhập</Select.Option>
              <Select.Option value="COMPLAINT">Phản ánh kiến nghị</Select.Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={logs}
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
            showTotal: (total) => `Tổng số ${total} bản ghi kiểm toán`,
          }}
          scroll={{ x: 950 }}
        />
      </Card>

      {/* Modal Xem chi tiết bản ghi Audit */}
      <Modal
        title={`Chi tiết Bản ghi Nhật ký Kiểm toán #${selectedLog?.id}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={650}
      >
        {selectedLog && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div>Hành động: <strong>{selectedLog.action}</strong></div>
              <div>Người thực hiện: <strong>{selectedLog.user_name}</strong></div>
              <div>Thời gian: {dayjs(selectedLog.created_at).format('DD/MM/YYYY HH:mm:ss')}</div>
              <div>IP / Trình duyệt: <code>{selectedLog.ip_address}</code> - {selectedLog.user_agent}</div>
            </div>

            {selectedLog.old_state && (
              <div style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 600 }}>Dữ liệu trước thay đổi (Old State):</Text>
                <pre
                  style={{
                    background: '#f8fafc',
                    padding: 10,
                    borderRadius: 6,
                    fontSize: 12,
                    maxHeight: 150,
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(selectedLog.old_state, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_state && (
              <div>
                <Text style={{ fontWeight: 600 }}>Dữ liệu sau thay đổi (New State):</Text>
                <pre
                  style={{
                    background: '#f8fafc',
                    padding: 10,
                    borderRadius: 6,
                    fontSize: 12,
                    maxHeight: 180,
                    overflow: 'auto',
                  }}
                >
                  {JSON.stringify(selectedLog.new_state, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
