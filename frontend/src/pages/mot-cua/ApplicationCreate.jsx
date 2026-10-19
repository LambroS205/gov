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
  InputNumber,
  Progress,
  List,
  message,
} from 'antd';
import {
  FileAddOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  PrinterOutlined,
  ArrowLeftOutlined,
  IdcardOutlined,
  ScanOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
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

  // Chip scanning simulation state
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const navigate = useNavigate();

  // Danh sách công dân mẫu gắn chip Đề án 06
  const sampleCitizens = [
    {
      cccd: '015094001234',
      name: 'NGUYỄN VĂN AN',
      gender: 'Nam',
      dob: '15/04/1985',
      phone: '0912345678',
      address: 'Số 12 đường Đinh Tiên Hoàng, Tổ dân phố 1, Phường Yên Bái',
      origin: 'TP Yên Bái, Tỉnh Yên Bái',
    },
    {
      cccd: '015192005678',
      name: 'LÊ THỊ MAI',
      gender: 'Nữ',
      dob: '22/08/1992',
      phone: '0987654321',
      address: 'Số 45 đường Điện Biên, Tổ dân phố 3, Phường Yên Bái',
      origin: 'Huyện Trấn Yên, Tỉnh Yên Bái',
    },
    {
      cccd: '015088009999',
      name: 'TRẦN ĐÌNH TRỌNG',
      gender: 'Nam',
      dob: '05/11/1988',
      phone: '0905123987',
      address: 'Số 88 đường Hoàng Hoa Thám, Tổ dân phố 4, Phường Yên Bái',
      origin: 'TP Yên Bái, Tỉnh Yên Bái',
    },
    {
      cccd: '015195003322',
      name: 'HOÀNG THỊ THU',
      gender: 'Nữ',
      dob: '10/02/1995',
      phone: '0978112233',
      address: 'Số 102 đường Trần Phú, Tổ dân phố 2, Phường Yên Bái',
      origin: 'Thị xã Nghĩa Lộ, Tỉnh Yên Bái',
    },
  ];

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

  // Tra cứu nhanh thông tin công dân từ CCCD thủ công
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
      message.info('Chưa có thông tin công dân trong cơ sở dữ liệu địa phương. Vui lòng nhập thủ công hoặc dùng tính năng Quét chip Đề án 06');
    } finally {
      setSearchingCitizen(false);
    }
  };

  // Quét nhanh từ thẻ CCCD gắn chip (Đề án 06)
  const handleSelectCitizenChip = (citizen) => {
    setIsScanning(true);
    setScanningProgress(30);

    setTimeout(() => {
      setScanningProgress(75);
    }, 200);

    setTimeout(() => {
      setScanningProgress(100);
      setIsScanning(false);
      setScanModalOpen(false);

      form.setFieldsValue({
        citizen_id_number: citizen.cccd,
        citizen_name: citizen.name,
        citizen_phone: citizen.phone,
        citizen_address: citizen.address,
      });

      message.success(`⚡ Đã quét thành công thẻ CCCD chip của ${citizen.name}!`);
      setScanningProgress(0);
    }, 500);
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Đóng gói payload động theo từng loại thủ tục
      const dynamicPayload = {};
      if (selectedProc?.field_type === 'HO_TICH') {
        dynamicPayload.target_name = values.target_name;
        dynamicPayload.target_dob = values.target_dob;
        dynamicPayload.relationship = values.relationship;
      } else if (selectedProc?.field_type === 'CHUNG_THUC') {
        dynamicPayload.original_doc_type = values.original_doc_type;
        dynamicPayload.copy_count = values.copy_count || 1;
      } else if (selectedProc?.field_type === 'DIA_CHINH') {
        dynamicPayload.plot_number = values.plot_number;
        dynamicPayload.map_sheet = values.map_sheet;
        dynamicPayload.land_area = values.land_area;
        dynamicPayload.land_location = values.land_location;
      }

      const submitData = {
        ...values,
        dossier_payload: Object.keys(dynamicPayload).length > 0 ? dynamicPayload : null,
      };

      const res = await applicationsApi.create(submitData);
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
            copy_count: 2,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary-blue)' }}>
                2. THÔNG TIN CÔNG DÂN / TỔ CHỨC NỘP HỒ SƠ
              </div>

              {/* NÚT QUÉT CCCD GẮN CHIP ĐỀ ÁN 06 */}
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={() => setScanModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  borderColor: '#0284c7',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                }}
              >
                ⚡ Quét CCCD gắn chip (Đề án 06)
              </Button>
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

          {/* PHẦN ĐỘNG: THÔNG TIN CHI TIẾT THEO LĨNH VỰC TTHC */}
          {selectedProc && (
            <div
              style={{
                padding: 16,
                background: '#fffdf5',
                borderRadius: 8,
                border: '1px solid #fde68a',
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: '#b45309' }}>
                3. NỘI DUNG CHI TIẾT THỦ TỤC ({selectedProc.field_type})
              </div>

              {/* Lĩnh vực Hộ tịch */}
              {selectedProc.field_type === 'HO_TICH' && (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="target_name"
                      label={<span style={{ fontWeight: 600 }}>Họ tên người được đăng ký / Đối tượng liên quan</span>}
                    >
                      <Input placeholder="Ví dụ: NGUYỄN HOÀNG LONG (Con)" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item
                      name="target_dob"
                      label={<span style={{ fontWeight: 600 }}>Ngày sinh / Ngày sự kiện</span>}
                    >
                      <Input placeholder="DD/MM/YYYY" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item
                      name="relationship"
                      label={<span style={{ fontWeight: 600 }}>Mối quan hệ với người nộp</span>}
                    >
                      <Select size="large" defaultValue="CON">
                        <Select.Option value="BAN_THAN">Bản thân</Select.Option>
                        <Select.Option value="CON">Con đẻ</Select.Option>
                        <Select.Option value="VO_CHONG">Vợ / Chồng</Select.Option>
                        <Select.Option value="BO_ME">Bố / Mẹ</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {/* Lĩnh vực Chứng thực */}
              {selectedProc.field_type === 'CHUNG_THUC' && (
                <Row gutter={16}>
                  <Col xs={24} sm={16}>
                    <Form.Item
                      name="original_doc_type"
                      label={<span style={{ fontWeight: 600 }}>Loại giấy tờ gốc xuất trình</span>}
                    >
                      <Input placeholder="Ví dụ: Bản chính Thẻ CCCD, Bằng Tốt nghiệp Đại học, Giấy Đăng ký kết hôn..." size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      name="copy_count"
                      label={<span style={{ fontWeight: 600 }}>Số lượng bản sao y cần chứng thực</span>}
                    >
                      <InputNumber min={1} max={50} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {/* Lĩnh vực Địa chính / Đất đai */}
              {selectedProc.field_type === 'DIA_CHINH' && (
                <Row gutter={16}>
                  <Col xs={24} sm={6}>
                    <Form.Item
                      name="plot_number"
                      label={<span style={{ fontWeight: 600 }}>Thửa đất số</span>}
                    >
                      <Input placeholder="Ví dụ: 142" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item
                      name="map_sheet"
                      label={<span style={{ fontWeight: 600 }}>Tờ bản đồ số</span>}
                    >
                      <Input placeholder="Ví dụ: 25" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item
                      name="land_area"
                      label={<span style={{ fontWeight: 600 }}>Diện tích (m²)</span>}
                    >
                      <Input placeholder="Ví dụ: 125.5" size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={6}>
                    <Form.Item
                      name="land_location"
                      label={<span style={{ fontWeight: 600 }}>Địa chỉ thửa đất</span>}
                    >
                      <Input placeholder="Tổ dân phố 3, P. Yên Bái" size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {/* Các lĩnh vực khác */}
              {!['HO_TICH', 'CHUNG_THUC', 'DIA_CHINH'].includes(selectedProc.field_type) && (
                <Text type="secondary" style={{ fontStyle: 'italic' }}>
                  Tiếp nhận theo quy trình chuẩn cho lĩnh vực {selectedProc.field_type}.
                </Text>
              )}
            </div>
          )}

          {/* PHẦN 4: GHI CHÚ TIẾP NHẬN */}
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

      {/* MODAL MÔ PHỎNG ĐẦU ĐỌC CCCD GẮN CHIP (ĐỀ ÁN 06) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#0369a1' }}>
            <SafetyCertificateOutlined style={{ fontSize: 20 }} />
            <span>ĐẦU ĐỌC THẺ CĂN CƯỚC CÔNG DÂN GẮN CHIP (ĐỀ ÁN 06/CP)</span>
          </div>
        }
        open={scanModalOpen}
        onCancel={() => !isScanning && setScanModalOpen(false)}
        footer={null}
        width={620}
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Alert
            message="Thiết bị quét NFC / MRZ kết nối Cơ sở dữ liệu Quốc gia về Dân cư"
            description="Chọn công dân mẫu bên dưới để mô phỏng đặt thẻ CCCD vào đầu đọc. Hệ thống sẽ tự động giải mã dữ liệu chip điện tử và điền 100% biểu mẫu."
            type="info"
            showIcon
            style={{ marginBottom: 16, textAlign: 'left' }}
          />

          {isScanning && (
            <div style={{ margin: '20px 0' }}>
              <div style={{ fontWeight: 600, color: '#0369a1', marginBottom: 8 }}>
                ⚡ Đang đọc và xác thực chứng thư số chip điện tử...
              </div>
              <Progress percent={scanningProgress} status="active" strokeColor="#0284c7" />
            </div>
          )}

          <List
            itemLayout="horizontal"
            dataSource={sampleCitizens}
            renderItem={(item) => (
              <List.Item
                style={{
                  background: '#f8fafc',
                  padding: '12px 16px',
                  borderRadius: 8,
                  marginBottom: 8,
                  border: '1px solid #e2e8f0',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                actions={[
                  <Button
                    type="primary"
                    icon={<ScanOutlined />}
                    size="small"
                    loading={isScanning}
                    onClick={() => handleSelectCitizenChip(item)}
                    style={{ background: '#0284c7', borderColor: '#0284c7', fontWeight: 600 }}
                  >
                    Quét thẻ
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        background: '#e0f2fe',
                        color: '#0369a1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      <IdcardOutlined />
                    </div>
                  }
                  title={
                    <Space>
                      <strong>{item.name}</strong>
                      <Tag color="cyan">{item.gender} • {item.dob}</Tag>
                    </Space>
                  }
                  description={
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      CCCD: <code style={{ fontWeight: 700, color: '#0369a1' }}>{item.cccd}</code> • SĐT: {item.phone}
                      <div>Địa chỉ: {item.address}</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Modal>
    </div>
  );
}
