import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  Typography,
  Steps,
  Timeline,
  Tag,
  Divider,
  Alert,
  Spin,
  Space,
  Rate,
  Modal,
  Form,
  Select,
  Upload,
  Tabs,
  Row,
  Col,
  Result,
  Badge,
  message,
} from 'antd';
import {
  SearchOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BankOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  SmileOutlined,
  SafetyCertificateOutlined,
  FormOutlined,
  NotificationOutlined,
  FieldTimeOutlined,
  UploadOutlined,
  PictureOutlined,
  SendOutlined,
  CompassOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  applicationsApi,
  complaintsApi,
  proceduresApi,
  publicUploadApi,
  resolveFileUrl,
} from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function TrackingSearch() {
  const [activeTab, setActiveTab] = useState('track');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  // ==================== TAB 1: TRA CỨU HỒ SƠ ====================
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [qrApp, setQrApp] = useState(null);

  const handleSearch = async () => {
    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập Mã hồ sơ hoặc Số CCCD để tra cứu');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setResults(null);
    try {
      const res = await applicationsApi.track(code.trim());
      if (res?.data && res.data.length > 0) {
        setResults(res.data);
      } else {
        setErrorMsg('Không tìm thấy thông tin hồ sơ phù hợp trên hệ thống');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Không tìm thấy hồ sơ với mã hoặc số CCCD đã nhập');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFeedback = async (appId) => {
    setSubmittingRating(true);
    try {
      await applicationsApi.submitFeedback(appId, {
        satisfaction_score: ratingScore,
        satisfaction_comment: ratingComment,
      });
      message.success('Cảm ơn Quý công dân đã gửi đánh giá chất lượng phục vụ!');
      handleSearch();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStepCurrent = (status) => {
    switch (status) {
      case 'CHO_TIEP_NHAN':
        return 0;
      case 'DANG_XU_LY':
        return 1;
      case 'CHO_KY_DUYET':
        return 2;
      case 'DA_KY_SO':
        return 3;
      case 'HOAN_THANH':
        return 4;
      default:
        return 0;
    }
  };

  const statusConfig = {
    CHO_TIEP_NHAN: { label: 'Chờ tiếp nhận', color: 'orange' },
    DANG_XU_LY: { label: 'Đang xử lý', color: 'blue' },
    CHO_KY_DUYET: { label: 'Chờ ký duyệt', color: 'purple' },
    DA_KY_SO: { label: 'Đã ký số', color: 'cyan' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'green' },
    TRA_LAI: { label: 'Yêu cầu bổ sung', color: 'red' },
  };

  // ==================== TAB 2: NỘP HỒ SƠ TRỰC TUYẾN ====================
  const [onlineForm] = Form.useForm();
  const [procedures, setProcedures] = useState([]);
  const [selectedProc, setSelectedProc] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [onlineDocuments, setOnlineDocuments] = useState([]);
  const [submittingOnline, setSubmittingOnline] = useState(false);
  const [onlineSuccessData, setOnlineSuccessData] = useState(null);

  useEffect(() => {
    proceduresApi
      .list({ is_active: 1 })
      .then((res) => {
        if (res?.data) setProcedures(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleProcChange = (procId) => {
    const found = procedures.find((p) => p.id === procId);
    setSelectedProc(found || null);
  };

  const handleUploadDoc = async ({ file, onSuccess, onError }) => {
    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'documents');

    try {
      const res = await publicUploadApi.upload(formData);
      if (res?.data) {
        setOnlineDocuments((prev) => [
          ...prev,
          {
            document_name: res.data.document_name || file.name,
            file_path: res.data.file_path,
            file_size: res.data.file_size,
            mime_type: res.data.mime_type,
          },
        ]);
        message.success(`Đã tải lên tệp: ${file.name}`);
        onSuccess('ok');
      }
    } catch (err) {
      message.error(`Không thể tải tệp lên: ${err?.message || 'Lỗi kết nối'}`);
      onError(err);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmitOnline = async (values) => {
    setSubmittingOnline(true);
    try {
      const payload = {
        procedure_id: values.procedure_id,
        citizen_name: values.citizen_name,
        citizen_id_number: values.citizen_id_number,
        citizen_phone: values.citizen_phone,
        citizen_address: values.citizen_address,
        notes: values.notes || '',
        documents: onlineDocuments,
      };

      const res = await applicationsApi.createPublic(payload);
      if (res?.data) {
        setOnlineSuccessData(res.data);
        onlineForm.resetFields();
        setOnlineDocuments([]);
        setSelectedProc(null);
        message.success('Nộp hồ sơ trực tuyến thành công!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingOnline(false);
    }
  };

  // ==================== TAB 3: GỬI PHẢN ÁNH HIỆN TRƯỜNG ====================
  const [complaintForm] = Form.useForm();
  const [complaintPhotos, setComplaintPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccessCode, setComplaintSuccessCode] = useState('');

  const handleUploadPhoto = async ({ file, onSuccess, onError }) => {
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'complaints');

    try {
      const res = await publicUploadApi.upload(formData);
      if (res?.data) {
        setComplaintPhotos((prev) => [...prev, res.data.file_path]);
        message.success(`Đã tải lên ảnh hiện trường: ${file.name}`);
        onSuccess('ok');
      }
    } catch (err) {
      message.error(`Không thể tải ảnh: ${err?.message || 'Lỗi kết nối'}`);
      onError(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmitComplaint = async (values) => {
    setSubmittingComplaint(true);
    try {
      const payload = {
        citizen_name: values.citizen_name,
        citizen_phone: values.citizen_phone,
        citizen_cccd: values.citizen_cccd || '',
        category: values.category,
        location: values.location,
        title: values.title,
        description: values.description,
        photo_paths: complaintPhotos,
      };

      const res = await complaintsApi.createPublic(payload);
      if (res?.data) {
        setComplaintSuccessCode(res.data.complaint_code);
        complaintForm.resetFields();
        setComplaintPhotos([]);
        message.success('Đã gửi phản ánh hiện trường tới UBND Phường thành công!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // ==================== TAB 4: TRA CỨU PHẢN ÁNH ====================
  const [complaintSearchQuery, setComplaintSearchQuery] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintResults, setComplaintResults] = useState(null);
  const [complaintError, setComplaintError] = useState('');

  const handleSearchComplaint = async () => {
    if (!complaintSearchQuery.trim()) {
      setComplaintError('Vui lòng nhập Mã phản ánh (PAKN-...) hoặc Số điện thoại người gửi');
      return;
    }

    setComplaintLoading(true);
    setComplaintError('');
    setComplaintResults(null);
    try {
      const res = await complaintsApi.track(complaintSearchQuery.trim());
      if (res?.data && res.data.length > 0) {
        setComplaintResults(res.data);
      } else {
        setComplaintError('Không tìm thấy phản ánh phù hợp với thông tin đã nhập');
      }
    } catch (err) {
      setComplaintError(err?.message || 'Không tìm thấy phản ánh trên hệ thống');
    } finally {
      setComplaintLoading(false);
    }
  };

  const categoryNames = {
    RAC_THAI: 'Rác thải & Môi trường',
    TRAT_TU_DO_THI: 'Trật tự đô thị & Vỉa hè',
    HA_TANG_GIAO_THONG: 'Hạ tầng giao thông & Đường sá',
    DAT_DAI_XAY_DUNG: 'Đất đai & Trật tự xây dựng',
    AN_NINH_TRAT_TU: 'An ninh trật tự & Tiếng ồn',
    KHAC: 'Lĩnh vực khác',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fdf6f0 0%, #f8fafc 100%)',
        padding: '28px 16px',
      }}
    >
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Thanh điều hướng trên cùng */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ color: '#b91c1c', fontWeight: 600, padding: 0, fontSize: 14 }}
          >
            {user ? 'Quay lại hệ thống quản trị' : 'Quay lại trang chủ'}
          </Button>

          <Space size="middle">
            {user ? (
              <Tag color="volcano" style={{ margin: 0, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                👤 {user.full_name} ({user.role})
              </Tag>
            ) : (
              <Button
                type="text"
                size="small"
                onClick={() => navigate('/login')}
                style={{ color: '#64748b', fontSize: 13 }}
              >
                Đăng nhập cán bộ
              </Button>
            )}
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Cổng Dịch vụ công & Phản ánh Hiện trường Phường Yên Bái
            </div>
          </Space>
        </div>

        {/* Header Quốc hiệu / Tiêu đề */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', letterSpacing: '0.8px', marginBottom: 6 }}>
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            <div style={{ fontSize: 10, color: '#d97706', fontWeight: 600, letterSpacing: '0.4px', marginTop: 1 }}>
              Độc lập - Tự do - Hạnh phúc
            </div>
          </div>

          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
              border: '2px solid #f59e0b',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 8,
              boxShadow: '0 6px 16px rgba(185, 28, 28, 0.3)',
            }}
          >
            ⭐
          </div>
          <Title level={3} style={{ margin: '0 0 4px 0', color: '#7f1d1d', fontWeight: 800 }}>
            CỔNG DỊCH VỤ CÔNG & PHẢN ÁNH ĐIỆN TỬ
          </Title>
          <Text style={{ color: '#b45309', fontSize: 13, fontWeight: 600 }}>
            Ủy ban Nhân dân Phường Yên Bái • Tỉnh Yên Bái
          </Text>
        </div>

        {/* NAVIGATION TABS */}
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.08)',
            marginBottom: 24,
            border: '1.5px solid #fed7aa',
            background: '#ffffff',
          }}
          bodyStyle={{ padding: '16px 24px' }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            size="large"
            items={[
              {
                key: 'track',
                label: (
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    <SearchOutlined /> Tra cứu hồ sơ Một cửa
                  </span>
                ),
              },
              {
                key: 'submit',
                label: (
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    <FormOutlined /> Nộp hồ sơ DVC trực tuyến
                  </span>
                ),
              },
              {
                key: 'complaint_create',
                label: (
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    <NotificationOutlined /> Gửi phản ánh hiện trường
                  </span>
                ),
              },
              {
                key: 'complaint_track',
                label: (
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    <FieldTimeOutlined /> Tra cứu phản ánh
                  </span>
                ),
              },
            ]}
          />
        </Card>

        {/* ============================================================== */}
        {/* NỘI DUNG TAB 1: TRA CỨU HỒ SƠ MỘT CỬA */}
        {/* ============================================================== */}
        {activeTab === 'track' && (
          <div>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.08)',
                marginBottom: 24,
                border: '1.5px solid #fed7aa',
                background: '#ffffff',
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Title level={5} style={{ margin: '0 0 12px 0', color: '#7f1d1d', fontWeight: 700 }}>
                Tra cứu tiến độ hồ sơ theo Mã hồ sơ hoặc Số Căn cước công dân
              </Title>

              <Space.Compact style={{ width: '100%' }} size="large">
                <Input
                  placeholder="Ví dụ: MC-20261014-0012 hoặc số CCCD 01509..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onPressEnter={handleSearch}
                  prefix={<QrcodeOutlined style={{ color: '#b91c1c' }} />}
                  style={{ borderRadius: '8px 0 0 8px' }}
                />
                <Button
                  type="primary"
                  onClick={handleSearch}
                  loading={loading}
                  icon={<SearchOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                    borderColor: '#7f1d1d',
                    padding: '0 28px',
                    fontWeight: 700,
                    borderRadius: '0 8px 8px 0',
                  }}
                >
                  Tra cứu
                </Button>
              </Space.Compact>

              {errorMsg && (
                <Alert
                  message={errorMsg}
                  type="warning"
                  showIcon
                  style={{ marginTop: 16, borderRadius: 8, borderColor: '#fde68a', background: '#fffbeb' }}
                />
              )}

              <div style={{ marginTop: 12, fontSize: 12, color: '#64748b' }}>
                💡 Quý công dân có thể quét mã QR in trên <strong>Giấy tiếp nhận hồ sơ và hẹn trả kết quả</strong> để tra cứu nhanh.
              </div>
            </Card>

            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" tip="Đang tra cứu dữ liệu từ hệ thống Hành chính Số..." />
              </div>
            )}

            {results &&
              results.map((app) => {
                const currentStep = getStepCurrent(app.status);
                const feeNumber = Number(app.fee_amount || 0);

                return (
                  <Card
                    key={app.id}
                    bordered={false}
                    style={{
                      borderRadius: 16,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                      marginBottom: 20,
                      border: '1px solid #fed7aa',
                    }}
                    bodyStyle={{ padding: 24 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: 16,
                        marginBottom: 20,
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>MÃ HỒ SƠ QUỐC GIA</Text>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#b91c1c' }}>
                          {app.dossier_code}
                        </div>
                      </div>
                      <div>
                        <Tag
                          color={statusConfig[app.status]?.color}
                          style={{ fontSize: 14, padding: '4px 12px', fontWeight: 700 }}
                        >
                          {statusConfig[app.status]?.label || app.status}
                        </Tag>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Thủ tục hành chính:</Text>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{app.proc_name}</div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Người nộp hồ sơ:</Text>
                        <div style={{ fontWeight: 600 }}>{app.citizen_name}</div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Thời gian tiếp nhận:</Text>
                        <div>{dayjs(app.submit_date).format('DD/MM/YYYY HH:mm')}</div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>Hẹn trả kết quả:</Text>
                        <div style={{ color: '#b91c1c', fontWeight: 700 }}>
                          {dayjs(app.appointment_date).format('DD/MM/YYYY HH:mm')}
                        </div>
                      </div>
                    </div>

                    {/* Thanh toán Lệ phí nếu có */}
                    {feeNumber > 0 && (
                      <div
                        style={{
                          background: '#fffdf5',
                          border: '1px solid #fde68a',
                          borderRadius: 10,
                          padding: '12px 16px',
                          marginBottom: 20,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600 }}>Lệ phí TTHC: </span>
                          <strong style={{ color: '#b91c1c', fontSize: 15 }}>
                            {feeNumber.toLocaleString('vi-VN')} VNĐ
                          </strong>
                          <span style={{ marginLeft: 8 }}>
                            {app.payment_status === 'DA_THANH_TOAN' ? (
                              <Tag color="success">Đã thanh toán (Số BL: {app.receipt_number})</Tag>
                            ) : (
                              <Tag color="error">Chưa thanh toán</Tag>
                            )}
                          </span>
                        </div>

                        <Space>
                          {app.payment_status === 'DA_THANH_TOAN' && app.receipt_url && (
                            <Button
                              type="default"
                              icon={<PrinterOutlined />}
                              size="small"
                              onClick={() => window.open(resolveFileUrl(app.receipt_url), '_blank')}
                              style={{ borderColor: '#b91c1c', color: '#b91c1c', fontWeight: 600 }}
                            >
                              Xem & In Biên lai điện tử
                            </Button>
                          )}

                          {app.payment_status !== 'DA_THANH_TOAN' && (
                            <Button
                              type="primary"
                              icon={<DollarOutlined />}
                              size="small"
                              onClick={() => setQrApp(app)}
                              style={{
                                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                                borderColor: '#f59e0b',
                                fontWeight: 600,
                              }}
                            >
                              Thanh toán VietQR MB Bank
                            </Button>
                          )}
                        </Space>
                      </div>
                    )}

                    <Title level={5} style={{ marginBottom: 16, color: '#7f1d1d' }}>Quy trình xử lý Một cửa</Title>
                    <Steps
                      current={currentStep}
                      status={app.status === 'TRA_LAI' ? 'error' : 'process'}
                      items={[
                        { title: 'Tiếp nhận' },
                        { title: 'Thẩm định' },
                        { title: 'Trình ký' },
                        { title: 'Ký số điện tử' },
                        { title: 'Trả kết quả' },
                      ]}
                      style={{ marginBottom: 24 }}
                    />

                    {/* TÀI LIỆU KẾT QUẢ ĐÃ KÝ SỐ CHO CÔNG DÂN TẢI VỀ */}
                    {app.documents && app.documents.length > 0 && (
                      <div
                        style={{
                          marginTop: 16,
                          marginBottom: 20,
                          padding: '14px 18px',
                          background: '#f0fdf4',
                          borderRadius: 12,
                          border: '1.5px solid #86efac',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <SafetyCertificateOutlined style={{ fontSize: 18, color: '#16a34a' }} />
                          <span style={{ fontWeight: 700, color: '#166534', fontSize: 14 }}>
                            TÀI LIỆU & KẾT QUẢ GIẢI QUYẾT ĐÃ KÝ SỐ CHÍNH THỨC
                          </span>
                        </div>

                        <Space direction="vertical" style={{ width: '100%' }}>
                          {app.documents.map((doc) => (
                            <div
                              key={doc.id || doc.file_path}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#ffffff',
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: '1px solid #bbf7d0',
                                flexWrap: 'wrap',
                                gap: 8,
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{doc.document_name}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                  {doc.is_signed == 1 ? (
                                    <Tag color="green" style={{ margin: 0 }}>Đã ký số điện tử hợp lệ</Tag>
                                  ) : (
                                    <Tag color="blue" style={{ margin: 0 }}>Tài liệu hồ sơ</Tag>
                                  )}
                                </div>
                              </div>

                              <Button
                                type="primary"
                                icon={<FileTextOutlined />}
                                size="small"
                                onClick={() => window.open(resolveFileUrl(doc.file_path), '_blank')}
                                style={{ background: '#16a34a', borderColor: '#16a34a', fontWeight: 600 }}
                              >
                                Xem / Tải văn bản kết quả
                              </Button>
                            </div>
                          ))}
                        </Space>
                      </div>
                    )}

                    {/* ĐÁNH GIÁ HÀI LÒNG CSAT */}
                    {app.status === 'HOAN_THANH' && (
                      <div
                        style={{
                          marginTop: 20,
                          marginBottom: 20,
                          padding: 18,
                          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                          borderRadius: 12,
                          border: '1.5px solid #f59e0b',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <SmileOutlined style={{ fontSize: 18, color: '#d97706' }} />
                          <span style={{ fontWeight: 700, color: '#78350f', fontSize: 14 }}>
                            KHẢO SÁT MỨC ĐỘ HÀI LÒNG CỦA CÔNG DÂN (Quyết định 766/QĐ-TTg)
                          </span>
                        </div>

                        {app.satisfaction_score ? (
                          <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #fed7aa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span>Mức độ bạn đã đánh giá:</span>
                              <Rate disabled defaultValue={app.satisfaction_score} style={{ color: '#d97706' }} />
                            </div>
                            {app.satisfaction_comment && (
                              <div style={{ fontStyle: 'italic', color: '#64748b', marginTop: 4 }}>
                                "{app.satisfaction_comment}"
                              </div>
                            )}
                            <div style={{ color: '#15803d', fontWeight: 600, fontSize: 12, marginTop: 6 }}>
                              ✓ Cảm ơn Quý công dân đã gửi đánh giá chất lượng phục vụ!
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: 13, color: '#450a0a', marginBottom: 8 }}>
                              Xin Quý công dân vui lòng đánh giá mức độ hài lòng về quá trình giải quyết thủ tục này:
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                              <Rate value={ratingScore} onChange={setRatingScore} style={{ color: '#d97706' }} />
                              <span style={{ color: '#b45309', fontWeight: 600 }}>
                                {ratingScore === 5 && 'Rất hài lòng'}
                                {ratingScore === 4 && 'Hài lòng'}
                                {ratingScore === 3 && 'Bình thường'}
                                {ratingScore === 2 && 'Chưa hài lòng'}
                                {ratingScore === 1 && 'Rất không hài lòng'}
                              </span>
                            </div>
                            <TextArea
                              rows={2}
                              placeholder="Ý kiến góp ý thêm về thái độ phục vụ..."
                              value={ratingComment}
                              onChange={(e) => setRatingComment(e.target.value)}
                              style={{ marginBottom: 10, borderRadius: 8 }}
                            />
                            <Button
                              type="primary"
                              onClick={() => handleSendFeedback(app.id)}
                              loading={submittingRating}
                              style={{
                                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                                borderColor: '#7f1d1d',
                                fontWeight: 700,
                              }}
                            >
                              Gửi đánh giá phục vụ
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    <Title level={5} style={{ marginBottom: 12, color: '#7f1d1d' }}>Lịch sử luân chuyển hồ sơ</Title>
                    <Timeline
                      items={(app.workflow || []).map((wf) => ({
                        children: (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                              {wf.comment || wf.action}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              {dayjs(wf.created_at).format('DD/MM/YYYY HH:mm')}
                            </div>
                          </div>
                        ),
                      }))}
                    />
                  </Card>
                );
              })}
          </div>
        )}

        {/* ============================================================== */}
        {/* NỘI DUNG TAB 2: NỘP HỒ SƠ DVC TRỰC TUYẾN */}
        {/* ============================================================== */}
        {activeTab === 'submit' && (
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.08)',
              border: '1.5px solid #fed7aa',
              background: '#ffffff',
            }}
            bodyStyle={{ padding: 28 }}
          >
            {onlineSuccessData ? (
              <Result
                status="success"
                title="NỘP HỒ SƠ DỊCH VỤ CÔNG TRỰC TUYẾN THÀNH CÔNG!"
                subTitle={
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 16, color: '#1e293b' }}>
                      Mã hồ sơ của Quý khách: <strong style={{ color: '#b91c1c', fontSize: 20 }}>{onlineSuccessData.dossier_code}</strong>
                    </div>
                    <div style={{ marginTop: 6, color: '#475569' }}>
                      Thủ tục: <strong>{onlineSuccessData.proc_name}</strong>
                    </div>
                    <div style={{ marginTop: 4, color: '#475569' }}>
                      Hẹn trả kết quả dự kiến: <strong style={{ color: '#15803d' }}>{dayjs(onlineSuccessData.appointment_date).format('DD/MM/YYYY HH:mm')}</strong>
                    </div>
                    <Alert
                      message="📲 Hệ thống đã tự động gửi tin nhắn SMS Brandname xác nhận tiếp nhận đến số điện thoại Quý khách."
                      type="info"
                      showIcon
                      style={{ marginTop: 16, textAlign: 'left', borderRadius: 8 }}
                    />
                  </div>
                }
                extra={[
                  <Button
                    type="primary"
                    key="trackNow"
                    onClick={() => {
                      setCode(onlineSuccessData.dossier_code);
                      setOnlineSuccessData(null);
                      setActiveTab('track');
                      applicationsApi.track(onlineSuccessData.dossier_code).then((r) => setResults(r?.data || null));
                    }}
                    style={{ background: '#b91c1c', borderColor: '#7f1d1d', fontWeight: 700 }}
                  >
                    Xem tiến độ hồ sơ ngay
                  </Button>,
                  <Button
                    key="submitAnother"
                    onClick={() => setOnlineSuccessData(null)}
                  >
                    Nộp thêm hồ sơ khác
                  </Button>,
                ]}
              />
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <Title level={4} style={{ color: '#7f1d1d', margin: 0, fontWeight: 700 }}>
                    ĐĂNG KÝ HỒ SƠ DỊCH VỤ CÔNG TRỰC TUYẾN (24/7)
                  </Title>
                  <Text type="secondary">
                    Công dân có thể nộp hồ sơ trực tuyến bất kỳ lúc nào, không cần trực tiếp đến Bộ phận Một cửa.
                  </Text>
                </div>

                <Form form={onlineForm} layout="vertical" onFinish={handleSubmitOnline}>
                  <Row gutter={16}>
                    <Col xs={24}>
                      <Form.Item
                        name="procedure_id"
                        label={<span style={{ fontWeight: 600 }}>Thủ tục hành chính yêu cầu</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn thủ tục hành chính' }]}
                      >
                        <Select
                          showSearch
                          placeholder="-- Chọn thủ tục hành chính cấp Phường --"
                          optionFilterProp="children"
                          onChange={handleProcChange}
                          size="large"
                        >
                          {procedures.map((proc) => (
                            <Option key={proc.id} value={proc.id}>
                              [{proc.proc_code}] {proc.proc_name} ({proc.processing_days} ngày • {Number(proc.fee_amount) > 0 ? `${Number(proc.fee_amount).toLocaleString('vi-VN')} đ` : 'Miễn phí'})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {selectedProc && (
                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0', fontSize: 13 }}>
                      <div>⏱️ Thời hạn giải quyết: <strong>{selectedProc.processing_days} ngày làm việc</strong></div>
                      <div>💰 Phí / Lệ phí: <strong>{Number(selectedProc.fee_amount) > 0 ? `${Number(selectedProc.fee_amount).toLocaleString('vi-VN')} VNĐ` : 'Miễn lệ phí'}</strong></div>
                      {selectedProc.required_documents && (
                        <div style={{ marginTop: 4, color: '#475569' }}>
                          📋 Thành phần hồ sơ cần có: {selectedProc.required_documents}
                        </div>
                      )}
                    </div>
                  )}

                  <Title level={5} style={{ color: '#7f1d1d', marginTop: 12, marginBottom: 12 }}>
                    Thông tin người nộp hồ sơ
                  </Title>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="citizen_name"
                        label="Họ và tên công dân"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                      >
                        <Input placeholder="Ví dụ: NGUYỄN VĂN AN" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="citizen_id_number"
                        label="Số Căn cước công dân (12 số)"
                        rules={[
                          { required: true, message: 'Vui lòng nhập số CCCD' },
                          { pattern: /^[0-9]{12}$/, message: 'Số CCCD phải gồm đúng 12 chữ số' },
                        ]}
                      >
                        <Input placeholder="Ví dụ: 015094001234" maxLength={12} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="citizen_phone"
                        label="Số điện thoại di động (để nhận SMS hẹn trả)"
                        rules={[
                          { required: true, message: 'Vui lòng nhập số điện thoại' },
                          { pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại không hợp lệ' },
                        ]}
                      >
                        <Input placeholder="Ví dụ: 0987654321" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="citizen_address"
                        label="Địa chỉ thường trú"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                      >
                        <Input placeholder="Ví dụ: Số 24 đường Điện Biên, Tổ dân phố 3, Phường Yên Bái" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item name="notes" label="Ghi chú / Yêu cầu cụ thể">
                    <TextArea rows={2} placeholder="Nội dung yêu cầu chi tiết (nếu có)..." />
                  </Form.Item>

                  <Form.Item label={<span style={{ fontWeight: 600 }}>Tệp tài liệu đính kèm (Scan, Ảnh chụp giấy tờ)</span>}>
                    <Upload customRequest={handleUploadDoc} showUploadList={false}>
                      <Button icon={<UploadOutlined />} loading={uploadingDoc} size="large">
                        Chọn tệp đính kèm (Ảnh chụp, PDF...)
                      </Button>
                    </Upload>

                    {onlineDocuments.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        {onlineDocuments.map((doc, idx) => (
                          <Tag
                            key={idx}
                            closable
                            onClose={() => setOnlineDocuments(onlineDocuments.filter((_, i) => i !== idx))}
                            color="blue"
                            style={{ padding: '4px 8px', marginBottom: 4 }}
                          >
                            📄 {doc.document_name}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submittingOnline}
                    icon={<SendOutlined />}
                    size="large"
                    block
                    style={{
                      background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                      borderColor: '#7f1d1d',
                      fontWeight: 700,
                      height: 48,
                      marginTop: 10,
                    }}
                  >
                    GỬI HỒ SƠ DỊCH VỤ CÔNG TRỰC TUYẾN
                  </Button>
                </Form>
              </div>
            )}
          </Card>
        )}

        {/* ============================================================== */}
        {/* NỘI DUNG TAB 3: GỬI PHẢN ÁNH HIỆN TRƯỜNG */}
        {/* ============================================================== */}
        {activeTab === 'complaint_create' && (
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.08)',
              border: '1.5px solid #fed7aa',
              background: '#ffffff',
            }}
            bodyStyle={{ padding: 28 }}
          >
            {complaintSuccessCode ? (
              <Result
                status="success"
                title="GỬI PHẢN ÁNH HIỆN TRƯỜNG THÀNH CÔNG!"
                subTitle={
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 16, color: '#1e293b' }}>
                      Mã phản ánh của Quý công dân: <strong style={{ color: '#b91c1c', fontSize: 20 }}>{complaintSuccessCode}</strong>
                    </div>
                    <div style={{ marginTop: 6, color: '#475569' }}>
                      UBND Phường Yên Bái đã tiếp nhận thông tin và chuyển đến lực lượng chức năng kiểm tra, xử lý ngay.
                    </div>
                    <Alert
                      message="Quý công dân vui lòng lưu lại Mã phản ánh để tra cứu kết quả xử lý tại Tab 'Tra cứu phản ánh'."
                      type="info"
                      showIcon
                      style={{ marginTop: 16, textAlign: 'left', borderRadius: 8 }}
                    />
                  </div>
                }
                extra={[
                  <Button
                    type="primary"
                    key="trackComplaint"
                    onClick={() => {
                      setComplaintSearchQuery(complaintSuccessCode);
                      setComplaintSuccessCode('');
                      setActiveTab('complaint_track');
                      complaintsApi.track(complaintSuccessCode).then((r) => setComplaintResults(r?.data || null));
                    }}
                    style={{ background: '#b91c1c', borderColor: '#7f1d1d', fontWeight: 700 }}
                  >
                    Tra cứu tiến độ phản ánh này
                  </Button>,
                  <Button key="sendAnother" onClick={() => setComplaintSuccessCode('')}>
                    Gửi phản ánh khác
                  </Button>,
                ]}
              />
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <Title level={4} style={{ color: '#7f1d1d', margin: 0, fontWeight: 700 }}>
                    TIẾP NHẬN PHẢN ÁNH - KIẾN NGHỊ HIỆN TRƯỜNG (ĐÔ THỊ THÔNG MINH)
                  </Title>
                  <Text type="secondary">
                    Phản ánh các vấn đề trật tự đô thị, rác thải môi trường, đường sá hư hỏng trực tiếp đến lãnh đạo UBND Phường.
                  </Text>
                </div>

                <Form form={complaintForm} layout="vertical" onFinish={handleSubmitComplaint}>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="category"
                        label={<span style={{ fontWeight: 600 }}>Lĩnh vực phản ánh</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực' }]}
                        initialValue="RAC_THAI"
                      >
                        <Select size="large">
                          <Option value="RAC_THAI">🗑️ Rác thải & Vệ sinh môi trường</Option>
                          <Option value="TRAT_TU_DO_THI">🚶 Trật tự đô thị & Lấn chiếm vỉa hè</Option>
                          <Option value="HA_TANG_GIAO_THONG">🚧 Hạ tầng giao thông & Đường sá</Option>
                          <Option value="DAT_DAI_XAY_DUNG">🏗️ Đất đai & Trật tự xây dựng</Option>
                          <Option value="AN_NINH_TRAT_TU">📢 An ninh trật tự & Tiếng ồn</Option>
                          <Option value="KHAC">📌 Lĩnh vực khác</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="location"
                        label={<span style={{ fontWeight: 600 }}>Địa điểm / Vị trí xảy ra sự việc</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập địa điểm' }]}
                      >
                        <Input prefix={<CompassOutlined />} placeholder="Ví dụ: Ngã ba đường Điện Biên - Đinh Tiên Hoàng, TDP 2" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="title"
                    label={<span style={{ fontWeight: 600 }}>Tiêu đề phản ánh ngắn gọn</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                  >
                    <Input placeholder="Ví dụ: Rác thải sinh hoạt ứ đọng nhiều ngày tại đầu ngõ 12" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label={<span style={{ fontWeight: 600 }}>Chi tiết nội dung phản ánh</span>}
                    rules={[{ required: true, message: 'Vui lòng nhập nội dung chi tiết' }]}
                  >
                    <TextArea rows={3} placeholder="Mô tả cụ thể hiện trạng, thời gian phát sinh, mức độ ảnh hưởng đến đời sống nhân dân..." />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="citizen_name"
                        label="Họ và tên người phản ánh"
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                      >
                        <Input placeholder="Ví dụ: TRẦN VĂN AN" size="large" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="citizen_phone"
                        label="Số điện thoại người gửi (để nhận kết quả)"
                        rules={[
                          { required: true, message: 'Vui lòng nhập số điện thoại' },
                          { pattern: /^(0[3|5|7|8|9])[0-9]{8}$/, message: 'Số điện thoại không hợp lệ' },
                        ]}
                      >
                        <Input placeholder="Ví dụ: 0912345678" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label={<span style={{ fontWeight: 600 }}>Ảnh chụp hiện trường vụ việc</span>}>
                    <Upload customRequest={handleUploadPhoto} showUploadList={false} accept="image/*">
                      <Button icon={<PictureOutlined />} loading={uploadingPhoto} size="large">
                        Chụp ảnh / Tải ảnh hiện trường (Tối đa 3 ảnh)
                      </Button>
                    </Upload>

                    {complaintPhotos.length > 0 && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                        {complaintPhotos.map((path, idx) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            <img
                              src={resolveFileUrl(path)}
                              alt="Hiện trường"
                              style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
                            />
                            <Button
                              type="primary"
                              danger
                              size="small"
                              shape="circle"
                              onClick={() => setComplaintPhotos(complaintPhotos.filter((_, i) => i !== idx))}
                              style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, minWidth: 20, fontSize: 10, padding: 0 }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submittingComplaint}
                    icon={<SendOutlined />}
                    size="large"
                    block
                    style={{
                      background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                      borderColor: '#7f1d1d',
                      fontWeight: 700,
                      height: 48,
                      marginTop: 10,
                    }}
                  >
                    GỬI PHẢN ÁNH ĐẾN UBND PHƯỜNG
                  </Button>
                </Form>
              </div>
            )}
          </Card>
        )}

        {/* ============================================================== */}
        {/* NỘI DUNG TAB 4: TRA CỨU PHẢN ÁNH HIỆN TRƯỜNG */}
        {/* ============================================================== */}
        {activeTab === 'complaint_track' && (
          <div>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.08)',
                marginBottom: 24,
                border: '1.5px solid #fed7aa',
                background: '#ffffff',
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Title level={5} style={{ margin: '0 0 12px 0', color: '#7f1d1d', fontWeight: 700 }}>
                Tra cứu tiến độ giải quyết Phản ánh - Kiến nghị
              </Title>

              <Space.Compact style={{ width: '100%' }} size="large">
                <Input
                  placeholder="Nhập Mã phản ánh (Ví dụ: PAKN-20261014-001) hoặc Số điện thoại"
                  value={complaintSearchQuery}
                  onChange={(e) => setComplaintSearchQuery(e.target.value)}
                  onPressEnter={handleSearchComplaint}
                  prefix={<FieldTimeOutlined style={{ color: '#b91c1c' }} />}
                  style={{ borderRadius: '8px 0 0 8px' }}
                />
                <Button
                  type="primary"
                  onClick={handleSearchComplaint}
                  loading={complaintLoading}
                  icon={<SearchOutlined />}
                  style={{
                    background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                    borderColor: '#7f1d1d',
                    padding: '0 28px',
                    fontWeight: 700,
                    borderRadius: '0 8px 8px 0',
                  }}
                >
                  Tra cứu
                </Button>
              </Space.Compact>

              {complaintError && (
                <Alert
                  message={complaintError}
                  type="warning"
                  showIcon
                  style={{ marginTop: 16, borderRadius: 8, borderColor: '#fde68a', background: '#fffbeb' }}
                />
              )}
            </Card>

            {complaintLoading && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" tip="Đang tra cứu dữ liệu phản ánh hiện trường..." />
              </div>
            )}

            {complaintResults &&
              complaintResults.map((c) => {
                const statusTags = {
                  MOI: { color: 'orange', text: 'Mới tiếp nhận - Chờ xử lý' },
                  DANG_XU_LY: { color: 'blue', text: 'Đang phối hợp xử lý hiện trường' },
                  DA_XU_LY: { color: 'green', text: 'Đã xử lý & Khắc phục hoàn tất' },
                };

                return (
                  <Card
                    key={c.id}
                    bordered={false}
                    style={{
                      borderRadius: 16,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
                      marginBottom: 20,
                      border: '1px solid #fed7aa',
                    }}
                    bodyStyle={{ padding: 24 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>MÃ PHẢN ÁNH</Text>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#b91c1c' }}>
                          {c.complaint_code}
                        </div>
                      </div>
                      <Tag color={statusTags[c.status]?.color || 'default'} style={{ fontSize: 13, padding: '4px 12px', fontWeight: 700 }}>
                        {statusTags[c.status]?.text || c.status}
                      </Tag>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#475569' }}>
                        Lĩnh vực: <strong>{categoryNames[c.category] || c.category}</strong> • Địa điểm: <strong>{c.location}</strong>
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                        Thời gian gửi: {dayjs(c.created_at).format('DD/MM/YYYY HH:mm')}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#64748b', marginBottom: 4 }}>NỘI DUNG PHẢN ÁNH:</div>
                      <div style={{ color: '#334155', fontSize: 13, whiteSpace: 'pre-wrap' }}>{c.description}</div>

                      {c.photo_paths && c.photo_paths.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                          {c.photo_paths.map((p, idx) => (
                            <img
                              key={idx}
                              src={resolveFileUrl(p)}
                              alt="Ảnh phản ánh"
                              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                              onClick={() => window.open(resolveFileUrl(p), '_blank')}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* KẾT QUẢ XỬ LÝ CỦA UBND PHƯỜNG */}
                    {c.status === 'DA_XU_LY' ? (
                      <div
                        style={{
                          background: '#f0fdf4',
                          border: '1.5px solid #86efac',
                          borderRadius: 10,
                          padding: 16,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                          <CheckCircleOutlined /> KẾT QUẢ XỬ LÝ CHÍNH THỨC CỦA UBND PHƯỜNG YÊN BÁI
                        </div>
                        <div style={{ fontSize: 13, color: '#166534', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {c.response || 'Đã kiểm tra, xử lý và khắc phục hiện trường dứt điểm.'}
                        </div>
                        <div style={{ fontSize: 11, color: '#15803d', marginTop: 6 }}>
                          Cán bộ thụ lý: <strong>{c.assigned_name || 'Bộ phận chuyên môn'}</strong> • Phản hồi lúc: {c.responded_at ? dayjs(c.responded_at).format('DD/MM/YYYY HH:mm') : 'Mới đây'}
                        </div>

                        {c.resolved_photo_paths && c.resolved_photo_paths.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 6 }}>
                              Ảnh hiện trường sau khi đã xử lý / khắc phục:
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {c.resolved_photo_paths.map((rp, idx) => (
                                <img
                                  key={idx}
                                  src={resolveFileUrl(rp)}
                                  alt="Sau xử lý"
                                  style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #86efac', cursor: 'pointer' }}
                                  onClick={() => window.open(resolveFileUrl(rp), '_blank')}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert
                        message="Đang tiến hành xử lý"
                        description={`Hồ sơ đang được chuyển đến cán bộ phụ trách (${c.assigned_name || 'Đang điều phối'}) để kiểm tra, xử lý tại thực địa.`}
                        type="info"
                        showIcon
                        style={{ borderRadius: 8 }}
                      />
                    )}
                  </Card>
                );
              })}
          </div>
        )}

        {/* Modal VietQR MB Bank */}
        {qrApp && (
          <Modal
            title="Thanh toán trực tuyến lệ phí Dịch vụ Công qua VietQR"
            open={!!qrApp}
            onCancel={() => setQrApp(null)}
            footer={[
              <Button key="close" onClick={() => setQrApp(null)}>Đóng</Button>,
            ]}
          >
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontWeight: 700, color: '#b91c1c', fontSize: 15, marginBottom: 8 }}>
                MÃ VIETQR THANH TOÁN CHÍNH THỨC
              </div>
              <img
                src={`https://img.vietqr.io/image/mbbank-0869162534-compact2.png?amount=${Number(qrApp.fee_amount)}&addInfo=LP%20${qrApp.dossier_code}&accountName=UBND%20PHUONG%20YEN%20BAI`}
                alt="VietQR MB Bank 0869162534"
                style={{ width: 240, height: 240, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <div style={{ textAlign: 'left', background: '#f8fafc', padding: 12, borderRadius: 8, marginTop: 12, fontSize: 12, border: '1px solid #e2e8f0' }}>
                <div>Ngân hàng: <strong>MB Bank (Ngân hàng TMCP Quân Đội)</strong></div>
                <div>Số tài khoản: <strong style={{ color: '#b91c1c', fontSize: 13 }}>0869162534</strong></div>
                <div>Chủ tài khoản: <strong>UBND PHUONG YEN BAI</strong></div>
                <div>Số tiền: <strong style={{ color: '#15803d' }}>{Number(qrApp.fee_amount).toLocaleString('vi-VN')} VNĐ</strong></div>
                <div>Nội dung CK: <strong style={{ color: '#b45309' }}>LP {qrApp.dossier_code}</strong></div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
