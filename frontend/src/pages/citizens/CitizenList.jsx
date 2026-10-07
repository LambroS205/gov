import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Modal,
  Form,
  Row,
  Col,
  message,
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { citizensApi, areasApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function CitizenList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState(null);
  const [residenceType, setResidenceType] = useState(null);
  const [search, setSearch] = useState('');

  // Modal thêm / sửa công dân
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCitizen, setEditingCitizen] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    fetchCitizens();
  }, [page, pageSize, areaId, residenceType]);

  const fetchAreas = async () => {
    try {
      const res = await areasApi.list();
      setAreas(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCitizens = async () => {
    setLoading(true);
    try {
      const res = await citizensApi.list({
        page,
        pageSize,
        area_id: areaId || undefined,
        residence_type: residenceType || undefined,
        search: search || undefined,
      });
      setData(res?.data?.items || []);
      setTotal(res?.data?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (citizen = null) => {
    setEditingCitizen(citizen);
    form.resetFields();
    if (citizen) {
      form.setFieldsValue({
        ...citizen,
        date_of_birth: citizen.date_of_birth ? dayjs(citizen.date_of_birth).format('YYYY-MM-DD') : undefined,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingCitizen) {
        await citizensApi.update(editingCitizen.id, values);
        message.success('Cập nhật thông tin công dân thành công');
      } else {
        await citizensApi.create(values);
        message.success('Thêm mới công dân vào quản lý nhân khẩu thành công');
      }
      setModalOpen(false);
      fetchCitizens();
    } catch {
      // Toast error từ interceptor
    } finally {
      setSubmitting(false);
    }
  };

  const residenceTypeConfig = {
    THUONG_TRU: { label: 'Thường trú', color: 'green' },
    TAM_TRU: { label: 'Tạm trú', color: 'orange' },
    TAM_VANG: { label: 'Tạm vắng', color: 'red' },
  };

  const columns = [
    {
      title: 'Số CCCD (Nghị định 13)',
      dataIndex: 'cccd_number',
      key: 'cccd_number',
      width: 170,
      render: (text) => <strong style={{ color: '#0f172a' }}>{text}</strong>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 180,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>
            {record.gender === 'NAM' ? 'Nam' : 'Nữ'} &bull;{' '}
            {record.date_of_birth ? dayjs(record.date_of_birth).format('DD/MM/YYYY') : '---'}
          </div>
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone_number',
      key: 'phone_number',
      width: 140,
    },
    {
      title: 'Tổ dân phố & Số hộ',
      key: 'area',
      render: (_, record) => (
        <div>
          <div>{record.area_name || '---'}</div>
          {record.household_number && (
            <div style={{ fontSize: 11, color: '#64748b' }}>Hộ: {record.household_number}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Địa chỉ thường trú',
      dataIndex: 'permanent_address',
      key: 'permanent_address',
      ellipsis: true,
    },
    {
      title: 'Cư trú',
      dataIndex: 'residence_type',
      key: 'residence_type',
      width: 120,
      render: (t) => (
        <Tag color={residenceTypeConfig[t]?.color}>{residenceTypeConfig[t]?.label || t}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenModal(record)}
        >
          Sửa
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
              Quản lý Dân cư & Danh bạ Nhân khẩu
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Cơ sở dữ liệu dân cư cấp phường tuân thủ bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP
            </Text>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => handleOpenModal(null)}
              style={{ background: 'var(--primary-blue)', fontWeight: 600 }}
            >
              Thêm nhân khẩu mới
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchCitizens}>
              Làm mới
            </Button>
          </Space>
        </div>

        {/* Lọc & Tìm kiếm */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10}>
            <Input
              placeholder="Tìm theo Tên công dân, CCCD, SĐT, Số hộ..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => {
                setPage(1);
                fetchCitizens();
              }}
              allowClear
            />
          </Col>

          <Col xs={12} sm={7}>
            <Select
              placeholder="Lọc theo Tổ dân phố"
              style={{ width: '100%' }}
              value={areaId}
              onChange={(val) => setAreaId(val)}
              allowClear
            >
              {areas.map((a) => (
                <Select.Option key={a.id} value={a.id}>
                  {a.area_name}
                </Select.Option>
              ))}
            </Select>
          </Col>

          <Col xs={12} sm={7}>
            <Select
              placeholder="Lọc loại cư trú"
              style={{ width: '100%' }}
              value={residenceType}
              onChange={(val) => setResidenceType(val)}
              allowClear
            >
              <Select.Option value="THUONG_TRU">Thường trú</Select.Option>
              <Select.Option value="TAM_TRU">Tạm trú</Select.Option>
              <Select.Option value="TAM_VANG">Tạm vắng</Select.Option>
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
            showTotal: (total) => `Tổng số ${total} nhân khẩu`,
          }}
          scroll={{ x: 900 }}
        />
      </Card>

      {/* Modal Thêm / Chỉnh sửa công dân */}
      <Modal
        title={editingCitizen ? 'Chỉnh sửa thông tin công dân' : 'Thêm công dân mới vào danh bạ'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="cccd_number"
                label="Số Căn cước công dân"
                rules={[
                  { required: true, message: 'Vui lòng nhập số CCCD' },
                  { pattern: /^[0-9]{9,12}$/, message: 'CCCD gồm 9-12 chữ số' },
                ]}
              >
                <Input placeholder="Nhập 12 số CCCD" disabled={!!editingCitizen} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="full_name"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input placeholder="Ví dụ: NGUYỄN VĂN AN" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="date_of_birth" label="Ngày sinh (YYYY-MM-DD)">
                <Input type="date" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="gender" label="Giới tính" initialValue="NAM">
                <Select>
                  <Select.Option value="NAM">Nam</Select.Option>
                  <Select.Option value="NU">Nữ</Select.Option>
                  <Select.Option value="KHAC">Khác</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="phone_number" label="Số điện thoại">
                <Input placeholder="0988xxxxxx" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="residential_area_id" label="Tổ dân phố">
                <Select placeholder="Chọn tổ dân phố...">
                  {areas.map((a) => (
                    <Select.Option key={a.id} value={a.id}>
                      {a.area_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item name="household_number" label="Số hộ khẩu / Mã hộ">
                <Input placeholder="HK-TDP1-001" />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item name="residence_type" label="Loại cư trú" initialValue="THUONG_TRU">
                <Select>
                  <Select.Option value="THUONG_TRU">Thường trú</Select.Option>
                  <Select.Option value="TAM_TRU">Tạm trú</Select.Option>
                  <Select.Option value="TAM_VANG">Tạm vắng</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="permanent_address" label="Địa chỉ thường trú">
                <Input placeholder="Số nhà, đường phố, tổ dân phố, phường..." />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="occupation" label="Nghề nghiệp">
                <Input placeholder="Kinh doanh, kỹ sư, công chức..." />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="email" label="Email liên hệ">
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button onClick={() => setModalOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingCitizen ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
