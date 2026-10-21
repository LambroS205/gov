import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Row,
  Col,
  Space,
  Typography,
  Drawer,
  Image,
  Descriptions,
  Alert,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { citizenPortalApi, resolveFileUrl } from '../../api/portalClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function MyComplaints() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');

  // Drawer xem chi tiết
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [page, pageSize, status, category]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await citizenPortalApi.complaints({
        page,
        pageSize,
        status: status || undefined,
        category: category || undefined,
        search: search.trim() || undefined,
      });
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const categories = {
    RAC_THAI: { label: 'Rác thải & Vệ sinh môi trường', color: 'green' },
    LAN_CHIEM: { label: 'Lấn chiếm lòng lề đường / Vỉa hè', color: 'orange' },
    AN_NINH: { label: 'An ninh trật tự & Tiếng ồn', color: 'red' },
    DIEN_NUOC: { label: 'Sự cố điện nước chiếu sáng', color: 'cyan' },
    GIAO_THONG: { label: 'Hạ tầng giao thông & Đường sá', color: 'blue' },
    MOI_TRUONG: { label: 'Ô nhiễm môi trường', color: 'lime' },
    KHAC: { label: 'Lĩnh vực khác', color: 'default' },
  };

  const statuses = {
    MOI: { label: 'Mới gửi', color: 'gold' },
    DANG_XU_LY: { label: 'Đang xử lý', color: 'blue' },
    DA_XU_LY: { label: 'Đã giải quyết & Phản hồi', color: 'green' },
    DONG: { label: 'Đã đóng', color: 'default' },
  };

  const columns = [
    {
      title: 'Mã phản ánh',
      dataIndex: 'complaint_code',
      key: 'complaint_code',
      render: (code, record) => (
        <a
          onClick={() => {
            setSelectedComplaint(record);
            setDrawerOpen(true);
          }}
          style={{ fontWeight: 700, color: '#b91c1c' }}
        >
          {code}
        </a>
      ),
    },
    {
      title: 'Tiêu đề & Nội dung phản ánh',
      key: 'title',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.title}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Địa điểm: {r.location || '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => {
        const conf = categories[cat] || { label: cat, color: 'default' };
        return <Tag color={conf.color}>{conf.label}</Tag>;
      },
    },
    {
      title: 'Thời gian gửi',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Trạng thái xử lý',
      dataIndex: 'status',
      key: 'status',
      render: (st) => {
        const conf = statuses[st] || { label: st, color: 'default' };
        return <Tag color={conf.color} style={{ fontWeight: 600 }}>{conf.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedComplaint(record);
            setDrawerOpen(true);
          }}
          style={{ color: '#b91c1c', borderColor: '#b91c1c' }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: '#7f1d1d', fontWeight: 800 }}>
            PHẢN ÁNH HIỆN TRƯỜNG CỦA TÔI
          </Title>
          <Text style={{ color: '#64748b', fontSize: 13 }}>
            Theo dõi phản ánh đô thị, môi trường, an ninh và kết quả xử lý từ UBND Phường
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate('/tra-cuu')}
          style={{
            background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
            borderColor: '#7f1d1d',
            fontWeight: 700,
            borderRadius: 8,
          }}
        >
          Gửi phản ánh mới
        </Button>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}
        bodyStyle={{ padding: 20 }}
      >
        <form onSubmit={handleSearchSubmit} style={{ marginBottom: 20 }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={10} md={8}>
              <Input
                placeholder="Tìm kiếm mã, tiêu đề, vị trí..."
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={7} md={5}>
              <Select
                placeholder="Lĩnh vực"
                value={category}
                onChange={(val) => {
                  setCategory(val);
                  setPage(1);
                }}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="">Tất cả lĩnh vực</Option>
                {Object.keys(categories).map((k) => (
                  <Option key={k} value={k}>
                    {categories[k].label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={7} md={5}>
              <Select
                placeholder="Trạng thái"
                value={status}
                onChange={(val) => {
                  setStatus(val);
                  setPage(1);
                }}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="">Tất cả trạng thái</Option>
                <Option value="MOI">Mới gửi</Option>
                <Option value="DANG_XU_LY">Đang xử lý</Option>
                <Option value="DA_XU_LY">Đã giải quyết</Option>
              </Select>
            </Col>
            <Col xs={24} sm={24} md={6}>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} style={{ background: '#b91c1c' }}>
                  Tìm kiếm
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setSearch('');
                    setStatus('');
                    setCategory('');
                    setPage(1);
                  }}
                >
                  Làm mới
                </Button>
              </Space>
            </Col>
          </Row>
        </form>

        <Table
          columns={columns}
          dataSource={items}
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
            showTotal: (tot) => `Tổng cộng ${tot} phản ánh`,
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: 'Chưa có phản ánh - kiến nghị nào' }}
        />
      </Card>

      {/* Drawer xem chi tiết phản ánh */}
      <Drawer
        title={<span style={{ color: '#7f1d1d', fontWeight: 700 }}>Chi tiết phản ánh hiện trường</span>}
        placement="right"
        width={560}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedComplaint && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                MÃ PHẢN ÁNH: <strong style={{ color: '#b91c1c', fontSize: 15 }}>{selectedComplaint.complaint_code}</strong>
              </div>
              <Title level={4} style={{ margin: '4px 0 8px 0', color: '#1e293b' }}>
                {selectedComplaint.title}
              </Title>
              <Space wrap>
                <Tag color={statuses[selectedComplaint.status]?.color || 'default'} style={{ fontWeight: 600 }}>
                  {statuses[selectedComplaint.status]?.label || selectedComplaint.status}
                </Tag>
                <Tag color={categories[selectedComplaint.category]?.color || 'default'}>
                  {categories[selectedComplaint.category]?.label || selectedComplaint.category}
                </Tag>
              </Space>
            </div>

            <Descriptions column={1} bordered size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Thời gian gửi">
                {selectedComplaint.created_at ? dayjs(selectedComplaint.created_at).format('DD/MM/YYYY HH:mm') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí xảy ra">
                {selectedComplaint.location || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung phản ánh">
                {selectedComplaint.description}
              </Descriptions.Item>
            </Descriptions>

            {/* Ảnh hiện trường gửi lên */}
            {selectedComplaint.photo_paths && selectedComplaint.photo_paths.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, color: '#450a0a', marginBottom: 8 }}>
                  Ảnh hiện trường phản ánh ban đầu:
                </div>
                <Image.PreviewGroup>
                  <Space wrap size="small">
                    {selectedComplaint.photo_paths.map((p, idx) => (
                      <Image
                        key={idx}
                        width={90}
                        height={90}
                        src={resolveFileUrl(p)}
                        style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}

            {/* Kết quả phản hồi của UBND Phường */}
            {selectedComplaint.response ? (
              <Alert
                message={
                  <span style={{ fontWeight: 700, color: '#15803d' }}>
                    ✓ Kết quả xử lý từ UBND Phường Yên Bái
                  </span>
                }
                description={
                  <div>
                    <Paragraph style={{ margin: '8px 0', color: '#1e293b' }}>
                      {selectedComplaint.response}
                    </Paragraph>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Cán bộ xử lý: <strong>{selectedComplaint.assigned_name || 'Đội trật tự đô thị Phường'}</strong>
                      {selectedComplaint.responded_at && (
                        <span> — Ngày xử lý: {dayjs(selectedComplaint.responded_at).format('DD/MM/YYYY HH:mm')}</span>
                      )}
                    </div>

                    {/* Ảnh thực tế kết quả sau xử lý */}
                    {selectedComplaint.resolved_photo_paths && selectedComplaint.resolved_photo_paths.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginBottom: 6 }}>
                          Ảnh hiện trường sau khi giải quyết:
                        </div>
                        <Image.PreviewGroup>
                          <Space wrap size="small">
                            {selectedComplaint.resolved_photo_paths.map((rp, idx) => (
                              <Image
                                key={idx}
                                width={85}
                                height={85}
                                src={resolveFileUrl(rp)}
                                style={{ objectFit: 'cover', borderRadius: 8, border: '2px solid #86efac' }}
                              />
                            ))}
                          </Space>
                        </Image.PreviewGroup>
                      </div>
                    )}
                  </div>
                }
                type="success"
                showIcon
                style={{ borderRadius: 12, border: '1px solid #86efac' }}
              />
            ) : (
              <Alert
                message="Đang được tiếp nhận và xử lý"
                description="Bộ phận chuyên môn UBND Phường đang cử cán bộ kiểm tra hiện trường và sẽ có phản hồi sớm nhất."
                type="info"
                showIcon
                style={{ borderRadius: 12 }}
              />
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
