import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Descriptions,
  Alert,
  message,
} from 'antd';
import {
  AlertOutlined,
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  UserSwitchOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { complaintsApi, usersApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function ComplaintList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [status, setStatus] = useState(null);
  const [category, setCategory] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [respondModalOpen, setRespondModalOpen] = useState(false);

  const [officers, setOfficers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [createForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [respondForm] = Form.useForm();

  const { user, hasRole } = useAuth();

  useEffect(() => {
    fetchComplaints();
  }, [page, pageSize, status, category]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await complaintsApi.list({
        page,
        pageSize,
        status: status || undefined,
        category: category || undefined,
      });
      setData(res?.data?.items || []);
      setTotal(res?.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOfficers = async () => {
    try {
      const res = await usersApi.list();
      setOfficers(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetail = (record) => {
    setSelectedComplaint(record);
    setDetailModalOpen(true);
  };

  const handleCreate = async (values) => {
    setSubmitting(true);
    try {
      await complaintsApi.create(values);
      message.success('Gửi phản ánh - kiến nghị thành công');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchComplaints();
    } catch {
      // Toast error qua interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (values) => {
    if (!selectedComplaint) return;
    setSubmitting(true);
    try {
      await complaintsApi.assign(selectedComplaint.id, values);
      message.success('Điều phối cán bộ xử lý thành công');
      setAssignModalOpen(false);
      setDetailModalOpen(false);
      fetchComplaints();
    } catch {
      // Toast error qua interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (values) => {
    if (!selectedComplaint) return;
    setSubmitting(true);
    try {
      await complaintsApi.respond(selectedComplaint.id, values);
      message.success('Ghi nhận kết quả phản hồi kiến nghị thành công');
      setRespondModalOpen(false);
      setDetailModalOpen(false);
      fetchComplaints();
    } catch {
      // Toast error qua interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const categoryNames = {
    RAC_THAI: { label: 'Rác thải sinh hoạt', color: 'orange' },
    LAN_CHIEM: { label: 'Lấn chiếm lòng đường/vỉa hè', color: 'volcano' },
    AN_NINH: { label: 'An ninh trật tự', color: 'red' },
    DIEN_NUOC: { label: 'Điện nước công cộng', color: 'blue' },
    GIAO_THONG: { label: 'Giao thông đô thị', color: 'gold' },
    MOI_TRUONG: { label: 'Môi trường', color: 'green' },
    KHAC: { label: 'Khác', color: 'default' },
  };

  const statusTags = {
    MOI: <Tag color="red">Tin mới</Tag>,
    DANG_XU_LY: <Tag color="blue">Đang xử lý</Tag>,
    DA_XU_LY: <Tag color="green">Đã giải quyết</Tag>,
    DONG: <Tag color="default">Đã đóng</Tag>,
  };

  const columns = [
    {
      title: 'Mã tin báo',
      dataIndex: 'complaint_code',
      key: 'complaint_code',
      width: 150,
      render: (t, r) => (
        <a onClick={() => handleOpenDetail(r)} style={{ fontWeight: 600 }}>
          {t}
        </a>
      ),
    },
    {
      title: 'Chuyên mục',
      dataIndex: 'category',
      key: 'category',
      width: 170,
      render: (c) => <Tag color={categoryNames[c]?.color}>{categoryNames[c]?.label || c}</Tag>,
    },
    {
      title: 'Tiêu đề & Vị trí sự việc',
      key: 'title',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.title}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>📍 {r.location || 'Chưa định vị'}</div>
        </div>
      ),
    },
    {
      title: 'Người phản ánh',
      dataIndex: 'citizen_name',
      key: 'citizen_name',
      width: 150,
    },
    {
      title: 'Cán bộ phụ trách',
      dataIndex: 'assigned_name',
      key: 'assigned_name',
      width: 150,
      render: (t) => t || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa giao việc</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s) => statusTags[s] || s,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetail(r)}>
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
              Tiếp nhận & Xử lý Phản ánh - Kiến nghị Hiện trường
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Kênh tương tác trực tiếp với nhân dân về trật tự đô thị, an ninh, rác thải và hạ tầng cấp phường
            </Text>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
              style={{ background: '#c5221f', borderColor: '#c5221f', fontWeight: 600 }}
            >
              Gửi phản ánh mới
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchComplaints}>
              Làm mới
            </Button>
          </Space>
        </div>

        {/* Lọc */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: '100%' }}
              value={status}
              onChange={(val) => setStatus(val)}
              allowClear
            >
              <Select.Option value="MOI">Tin mới</Select.Option>
              <Select.Option value="DANG_XU_LY">Đang xử lý</Select.Option>
              <Select.Option value="DA_XU_LY">Đã giải quyết</Select.Option>
            </Select>
          </Col>

          <Col xs={12} sm={8}>
            <Select
              placeholder="Lọc theo chuyên mục"
              style={{ width: '100%' }}
              value={category}
              onChange={(val) => setCategory(val)}
              allowClear
            >
              <Select.Option value="RAC_THAI">Rác thải sinh hoạt</Select.Option>
              <Select.Option value="LAN_CHIEM">Lấn chiếm lòng đường/vỉa hè</Select.Option>
              <Select.Option value="AN_NINH">An ninh trật tự</Select.Option>
              <Select.Option value="DIEN_NUOC">Điện nước công cộng</Select.Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
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
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Modal Xem chi tiết Phản ánh */}
      <Modal
        title={`Chi tiết Phản ánh [${selectedComplaint?.complaint_code}]`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={720}
      >
        {selectedComplaint && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginTop: 12 }}>
              <Descriptions.Item label="Tiêu đề" span={2}>
                <strong>{selectedComplaint.title}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Chuyên mục">
                <Tag color={categoryNames[selectedComplaint.category]?.color}>
                  {categoryNames[selectedComplaint.category]?.label || selectedComplaint.category}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusTags[selectedComplaint.status]}
              </Descriptions.Item>
              <Descriptions.Item label="Người gửi">{selectedComplaint.citizen_name}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selectedComplaint.citizen_phone || '---'}</Descriptions.Item>
              <Descriptions.Item label="Vị trí xảy ra" span={2}>
                📍 {selectedComplaint.location || 'Chưa cung cấp'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian gửi" span={2}>
                {dayjs(selectedComplaint.created_at).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung phản ánh" span={2}>
                <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {selectedComplaint.description}
                </Paragraph>
              </Descriptions.Item>

              {selectedComplaint.photo_paths && (
                <Descriptions.Item label="Ảnh hiện trường ban đầu (Trước)" span={2}>
                  <Tag color="volcano">Ảnh công dân gửi</Tag>
                  <div style={{ marginTop: 6, fontStyle: 'italic', fontSize: 12, color: '#64748b' }}>
                    {selectedComplaint.photo_paths}
                  </div>
                </Descriptions.Item>
              )}

              {selectedComplaint.resolved_photo_paths && (
                <Descriptions.Item label="Ảnh minh chứng khắc phục (Sau khi xử lý)" span={2}>
                  <Tag color="success">Ảnh kết quả thực tế</Tag>
                  <div style={{ marginTop: 6, fontStyle: 'italic', fontSize: 12, color: '#15803d' }}>
                    {selectedComplaint.resolved_photo_paths}
                  </div>
                </Descriptions.Item>
              )}

              {selectedComplaint.response && (
                <Descriptions.Item label="Kết quả giải quyết" span={2}>
                  <Alert
                    message={
                      <div>
                        <strong>Phản hồi của UBND Phường:</strong>
                        <div style={{ marginTop: 4 }}>{selectedComplaint.response}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                          Xử lý lúc: {dayjs(selectedComplaint.responded_at).format('DD/MM/YYYY HH:mm')} &bull; Cán bộ: {selectedComplaint.assigned_name}
                        </div>
                      </div>
                    }
                    type="success"
                    showIcon
                  />
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Thanh công cụ xử lý */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              {hasRole(['ADMIN', 'LANH_DAO', 'MOT_CUA']) && selectedComplaint.status === 'MOI' && (
                <Button
                  type="primary"
                  icon={<UserSwitchOutlined />}
                  style={{ background: 'var(--gov-red)', borderColor: 'var(--gov-red)' }}
                  onClick={() => {
                    loadOfficers();
                    setAssignModalOpen(true);
                  }}
                >
                  Điều phối cán bộ xử lý
                </Button>
              )}

              {selectedComplaint.status !== 'DA_XU_LY' && (
                <Button
                  type="primary"
                  icon={<CommentOutlined />}
                  style={{ background: '#10b981', borderColor: '#10b981' }}
                  onClick={() => setRespondModalOpen(true)}
                >
                  Phản hồi kết quả xử lý
                </Button>
              )}

              <Button onClick={() => setDetailModalOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Tạo Phản ánh mới */}
      <Modal
        title="Gửi phản ánh - kiến nghị hiện trường"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="citizen_name" label="Họ tên người phản ánh" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item name="citizen_phone" label="Số điện thoại liên hệ" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]}>
            <Input placeholder="0988xxxxxx" />
          </Form.Item>

          <Form.Item name="category" label="Chuyên mục phản ánh" initialValue="RAC_THAI" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="RAC_THAI">Rác thải sinh hoạt / Ô nhiễm</Select.Option>
              <Select.Option value="LAN_CHIEM">Lấn chiếm lòng đường, vỉa hè</Select.Option>
              <Select.Option value="AN_NINH">An ninh trật tự khu dân cư</Select.Option>
              <Select.Option value="DIEN_NUOC">Hư hỏng điện chiếu sáng, cấp thoát nước</Select.Option>
              <Select.Option value="GIAO_THONG">An toàn giao thông</Select.Option>
              <Select.Option value="KHAC">Khác</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="title" label="Tiêu đề tin báo" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
            <Input placeholder="Ví dụ: Bãi rác tự phát đầu ngõ 12 gây ô nhiễm..." />
          </Form.Item>

          <Form.Item name="location" label="Địa điểm xảy ra" rules={[{ required: true, message: 'Vui lòng nhập vị trí' }]}>
            <Input placeholder="Số nhà, tên đường, tổ dân phố..." />
          </Form.Item>

          <Form.Item name="description" label="Nội dung chi tiết sự việc" rules={[{ required: true, message: 'Vui lòng mô tả chi tiết' }]}>
            <TextArea rows={4} placeholder="Mô tả cụ thể thời gian, hiện trạng, mức độ ảnh hưởng..." />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setCreateModalOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Gửi tin báo
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Phân công cán bộ */}
      <Modal
        title="Điều phối cán bộ / Đội trật tự xử lý"
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign} style={{ marginTop: 16 }}>
          <Form.Item name="assigned_to" label="Chọn cán bộ phụ trách" rules={[{ required: true, message: 'Vui lòng chọn cán bộ' }]}>
            <Select placeholder="Chọn cán bộ...">
              {officers.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.full_name} ({u.dept_name || u.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setAssignModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Giao việc
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Phản hồi kết quả */}
      <Modal
        title="Phản hồi kết quả xử lý phản ánh"
        open={respondModalOpen}
        onCancel={() => setRespondModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={respondForm} layout="vertical" onFinish={handleRespond} style={{ marginTop: 16 }}>
          <Form.Item
            name="response"
            label="Nội dung kết quả xử lý thực tế"
            rules={[{ required: true, message: 'Vui lòng nhập kết quả' }]}
          >
            <TextArea rows={4} placeholder="Ví dụ: Đội Quản lý trật tự đô thị đã phối hợp cùng Công ty Môi trường dọn dẹp sạch sẽ trong chiều nay..." />
          </Form.Item>
          <Form.Item
            name="resolved_photo_paths"
            label="Link ảnh hiện trường sau khi xử lý (Minh chứng trước - sau)"
          >
            <Input placeholder="Ví dụ: https://yenbai.gov.vn/uploads/pakh-after-01.jpg" />
          </Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => setRespondModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} style={{ background: '#15803d', borderColor: '#15803d' }}>
              Hoàn tất & Công khai kết quả
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
