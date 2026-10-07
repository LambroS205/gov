import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Radio,
  Typography,
  Space,
  Row,
  Col,
  Alert,
  Divider,
  Tag,
  Modal,
  Result,
  message,
} from 'antd';
import {
  FileAddOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsApi, proceduresApi, citizensApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function ApplicationCreate() {
  const [form] = Form.useForm();
  const [procedures, setProcedures] = useState([]);
  const [selectedProc, setSelectedProc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchingCitizen, setSearchingCitizen] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    try {
      const res = await proceduresApi.list({ active_only: 1 });
      setProcedures(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcedureChange = (procId) => {
    const proc = procedures.find((p) => p.id === procId);
    setSelectedProc(proc || null);
  };

  // Tra cứu nhanh thông tin công dân từ CCCD
  const handleLookupCccd = async () => {
    const cccd = form.getFieldValue('citizen_id_number');
    if (!cccd) {
      message.warning('Vui lòng nhập số CCCD trước khi tra cứu');
      return;
    }

    setSearchingCitizen(true);
    try {
      const res = await citizensApi.searchByCccd(cccd);
      if (res?.data) {
        const c = res.data;
        form.setFieldsValue({
          citizen_name: c.full_name,
          citizen_phone: c.phone_number,
          citizen_address: c.permanent_address || c.current_address,
        });
        message.success(`Đã tìm thấy công dân: ${c.full_name} (${c.area_name || ''})`);
      }
    } catch {
      message.info('Chưa có thông tin công dân trong cơ sở dữ liệu địa phương. Vui lòng nhập thủ công');
    } finally {
      setSearchingCitizen(false);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await applicationsApi.create(values);
      if (res?.data) {
        setCreatedResult(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (createdResult) {
    return (
      <Card bordered={false} style={{ borderRadius: 14, textAlign: 'center', padding: '40px 20px', border: '1.5px solid #fed7aa' }}>
        <Result
          status="success"
          title={<span style={{ color: '#7f1d1d', fontWeight: 800 }}>Tiếp nhận hồ sơ Một cửa thành công!</span>}
          subTitle={
            <div style={{ fontSize: 15 }}>
              Mã hồ sơ Quốc gia: <Tag color="red" style={{ fontSize: 16, padding: '4px 14px', fontWeight: 800, border: '1px solid #f59e0b' }}>{createdResult.dossier_code}</Tag>
              <div style={{ marginTop: 8, color: '#64748b' }}>
                Hạn trả kết quả: <strong style={{ color: '#b91c1c' }}>{dayjs(createdResult.appointment_date).format('DD/MM/YYYY HH:mm')}</strong>
              </div>
              <div style={{ marginTop: 4, color: '#15803d', fontSize: 13, fontWeight: 500 }}>
                ✓ Đã gửi tin nhắn SMS / Zalo OA thông báo mã hồ sơ và giấy hẹn đến số điện thoại công dân
              </div>
            </div>
          }
          extra={[
            <Button
              type="primary"
              key="detail"
              onClick={() => navigate(`/applications/${createdResult.id}`)}
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                borderColor: '#7f1d1d',
                fontWeight: 700,
              }}
            >
              Xem chi tiết hồ sơ & Thu phí
            </Button>,
            <Button key="print" icon={<PrinterOutlined />} onClick={() => navigate(`/applications/${createdResult.id}`)}>
              In Giấy tiếp nhận & Hẹn trả kết quả
            </Button>,
            <Button
              key="new"
              onClick={() => {
                setCreatedResult(null);
                form.resetFields();
                setSelectedProc(null);
              }}
            >
              Tiếp nhận hồ sơ khác
            </Button>,
          ]}
        />
      </Card>
    );
  }

  return (
    <div>
      <Card
        bordered={false}
        style={{ borderRadius: 12, maxWidth: 960, margin: '0 auto', boxShadow: 'var(--shadow-sm)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/applications')} />
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Tiếp nhận Hồ sơ Thủ tục Hành chính Mới
            </Title>
            <Text style={{ color: '#64748b', fontSize: 13 }}>
              Bộ phận Tiếp nhận và Trả kết quả (Một cửa) - UBND Phường Yên Bái
            </Text>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            submit_channel: 'TRUC_TIEP',
          }}
        >
          {/* PHẦN 1: THỦ TỤC HÀNH CHÍNH */}
          <div
            style={{
              padding: 16,
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--primary-blue)' }}>
              1. THÔNG TIN THỦ TỤC HÀNH CHÍNH
            </div>

            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Form.Item
                  name="procedure_id"
                  label={<span style={{ fontWeight: 600 }}>Chọn thủ tục hành chính</span>}
                  rules={[{ required: true, message: 'Vui lòng chọn thủ tục hành chính' }]}
                >
                  <Select
                    placeholder="Tìm kiếm và chọn thủ tục..."
                    showSearch
                    optionFilterProp="children"
                    onChange={handleProcedureChange}
                    size="large"
                  >
                    {procedures.map((p) => (
                      <Select.Option key={p.id} value={p.id}>
                        [{p.proc_code}] {p.proc_name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="submit_channel"
                  label={<span style={{ fontWeight: 600 }}>Kênh tiếp nhận</span>}
                >
                  <Radio.Group buttonStyle="solid" size="large" style={{ width: '100%' }}>
                    <Radio.Button value="TRUC_TIEP" style={{ width: '50%', textAlign: 'center' }}>
                      Tại quầy
                    </Radio.Button>
                    <Radio.Button value="TRUC_TUYEN" style={{ width: '50%', textAlign: 'center' }}>
                      Cổng DVC
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            {/* Chi tiết thủ tục đã chọn */}
            {selectedProc && (
              <div
                style={{
                  background: '#ffffff',
                  padding: 14,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  marginTop: 8,
                }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Thời hạn giải quyết:</Text>
                    <div style={{ fontWeight: 600 }}>{selectedProc.processing_days} ngày làm việc</div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Phí / Lệ phí:</Text>
                    <div style={{ fontWeight: 600, color: '#c5221f' }}>
                      {Number(selectedProc.fee_amount).toLocaleString('vi-VN')} VNĐ
                    </div>
                  </Col>
                  <Col span={8}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Lĩnh vực:</Text>
                    <div><Tag color="blue">{selectedProc.field_type}</Tag></div>
                  </Col>
                </Row>

                {selectedProc.required_documents?.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                      Thành phần hồ sơ bắt buộc theo quy định:
                    </Text>
                    <ul style={{ margin: '6px 0 0 20px', fontSize: 12, color: '#475569' }}>
                      {selectedProc.required_documents.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PHẦN 2: THÔNG TIN CÔNG DÂN NỘP HỒ SƠ */}
          <div
            style={{
              padding: 16,
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 20,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--primary-blue)' }}>
              2. THÔNG TIN CÔNG DÂN / TỔ CHỨC NỘP HỒ SƠ
            </div>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="citizen_id_number"
                  label={<span style={{ fontWeight: 600 }}>Số Căn cước công dân (12 số)</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập số CCCD của công dân' },
                    { pattern: /^[0-9]{9,12}$/, message: 'Số CCCD/CMND phải từ 9 đến 12 chữ số' },
                  ]}
                >
                  <Input
                    placeholder="Nhập 12 số CCCD"
                    size="large"
                    addonAfter={
                      <Button
                        type="link"
                        size="small"
                        icon={<SearchOutlined />}
                        loading={searchingCitizen}
                        onClick={handleLookupCccd}
                      >
                        Tra cứu CSDL
                      </Button>
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="citizen_name"
                  label={<span style={{ fontWeight: 600 }}>Họ và tên người nộp</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên người nộp' }]}
                >
                  <Input placeholder="Ví dụ: NGUYỄN VĂN AN" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="citizen_phone"
                  label={<span style={{ fontWeight: 600 }}>Số điện thoại liên hệ (nhận SMS hẹn)</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                >
                  <Input placeholder="Ví dụ: 0988776655" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="citizen_address"
                  label={<span style={{ fontWeight: 600 }}>Địa chỉ thường trú / liên hệ</span>}
                >
                  <Input placeholder="Số nhà, đường/phố, tổ dân phố..." size="large" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* PHẦN 3: GHI CHÚ TIẾP NHẬN */}
          <Form.Item name="notes" label={<span style={{ fontWeight: 600 }}>Ghi chú tiếp nhận & Hồ sơ kèm theo</span>}>
            <TextArea
              rows={3}
              placeholder="Ghi nhận thành phần giấy tờ công dân nộp, yêu cầu đặc biệt..."
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button size="large" onClick={() => navigate('/applications')}>
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<CheckCircleOutlined />}
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                borderColor: '#7f1d1d',
                fontWeight: 700,
                padding: '0 32px',
                boxShadow: '0 4px 12px rgba(185, 28, 28, 0.35)',
              }}
            >
              Tiếp nhận & Cấp mã hồ sơ
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
