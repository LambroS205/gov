import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tag,
  Button,
  Timeline,
  Table,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Space,
  Divider,
  Alert,
  Spin,
  Radio,
  Rate,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UserSwitchOutlined,
  CheckOutlined,
  RollbackOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  FileDoneOutlined,
  DownloadOutlined,
  QrcodeOutlined,
  DollarOutlined,
  PrinterOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsApi, usersApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [unmasked, setUnmasked] = useState(false);
  const [officers, setOfficers] = useState([]);

  // Modals thao tác luân chuyển
  const [modalAction, setModalAction] = useState(null); // 'assign', 'process', 'submitApproval', 'approve', 'complete', 'reject'
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  // Modal Thu phí / VietQR
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CHUYEN_KHOAN_QR');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // Modal In Giấy hẹn & Biên lai
  const [isPrintSlipOpen, setIsPrintSlipOpen] = useState(false);
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id, unmasked]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await applicationsApi.get(id, { unmask: unmasked ? '1' : '0' });
      setApp(res?.data || null);
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

  const handleOpenModal = (action) => {
    setModalAction(action);
    form.resetFields();
    if (action === 'assign') {
      loadOfficers();
    }
  };

  const handleExecuteAction = async (values) => {
    setActionLoading(true);
    try {
      if (modalAction === 'assign') {
        await applicationsApi.assign(id, values);
        message.success('Phân công chuyên viên thụ lý thành công');
      } else if (modalAction === 'process') {
        await applicationsApi.process(id, values);
        message.success('Cập nhật tiến độ thẩm định thành công');
      } else if (modalAction === 'submitApproval') {
        await applicationsApi.submitApproval(id, values);
        message.success('Đã trình ký Lãnh đạo UBND Phường phê duyệt');
      } else if (modalAction === 'approve') {
        await applicationsApi.approve(id, values);
        message.success('Lãnh đạo đã phê duyệt và ký số điện tử thành công');
      } else if (modalAction === 'complete') {
        await applicationsApi.complete(id, values);
        message.success('Hồ sơ đã hoàn tất và trả kết quả cho công dân');
      } else if (modalAction === 'reject') {
        await applicationsApi.reject(id, values);
        message.success('Đã trả lại hồ sơ yêu cầu bổ sung');
      }
      setModalAction(null);
      fetchDetail();
    } catch {
      // Đã có toast error từ interceptor
    } finally {
      setActionLoading(false);
    }
  };

  // Xác nhận thu phí / Lệ phí TTHC
  const handleConfirmPayment = async () => {
    setPaymentSubmitting(true);
    try {
      await applicationsApi.confirmPayment(id, {
        payment_method: paymentMethod,
        receipt_number: `BL-YB-${dayjs().format('YYMMDD')}-${Math.floor(1000 + Math.random() * 9000)}`,
      });
      message.success('Xác nhận thu lệ phí thành công! Đã cấp số biên lai điện tử');
      setIsPaymentModalOpen(false);
      fetchDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleUploadFile = async ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_name', file.name);
    formData.append('doc_type', 'HO_SO_GOC');

    try {
      await applicationsApi.uploadDoc(id, formData);
      message.success('Tải lên tài liệu đính kèm thành công');
      fetchDetail();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !app) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="Đang tải dữ liệu chi tiết hồ sơ..." />
      </div>
    );
  }

  if (!app) {
    return (
      <Card>
        <Alert message="Không tìm thấy thông tin hồ sơ" type="error" showIcon />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/applications')}>
          Quay lại danh sách
        </Button>
      </Card>
    );
  }

  const statusConfig = {
    CHO_TIEP_NHAN: { label: 'Chờ tiếp nhận', color: 'orange' },
    DANG_XU_LY: { label: 'Đang xử lý', color: 'blue' },
    CHO_KY_DUYET: { label: 'Chờ ký duyệt', color: 'purple' },
    DA_KY_SO: { label: 'Đã ký số', color: 'cyan' },
    HOAN_THANH: { label: 'Đã hoàn thành', color: 'green' },
    TRA_LAI: { label: 'Trả lại / Bổ sung', color: 'red' },
    TU_CHOI: { label: 'Từ chối', color: 'default' },
  };

  const isOverdue = app.status !== 'HOAN_THANH' && dayjs().isAfter(dayjs(app.appointment_date));
  const feeNumber = Number(app.fee_amount || 0);

  // Link tạo mã VietQR theo chuẩn Napas247 - MB Bank 0869162534
  const vietQrUrl = `https://img.vietqr.io/image/mbbank-0869162534-compact2.png?amount=${feeNumber}&addInfo=LP%20${app.dossier_code}&accountName=UBND%20PHUONG%20YEN%20BAI`;

  return (
    <div>
      {/* Thanh Tiêu đề & Điều hướng */}
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
        <Space size="middle">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/applications')} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: 'var(--gov-red)' }}>
                Hồ sơ: {app.dossier_code}
              </Title>
              <Tag color={statusConfig[app.status]?.color} style={{ fontSize: 13, padding: '2px 10px', fontWeight: 600, margin: 0 }}>
                {statusConfig[app.status]?.label || app.status}
              </Tag>
              
              {/* Traffic light SLA */}
              {app.sla_status === 'OVERDUE' && (
                <span className="badge-sla-overdue">🔴 Quá hạn {Math.abs(app.sla_remaining_hours)}h</span>
              )}
              {app.sla_status === 'WARNING' && (
                <span className="badge-sla-warning pulse-gold">🟡 Sắp đến hạn (còn {app.sla_remaining_hours}h)</span>
              )}
              {app.sla_status === 'NORMAL' && app.status !== 'HOAN_THANH' && (
                <span className="badge-sla-normal">🟢 Đúng hạn (còn {app.sla_remaining_hours}h)</span>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Thủ tục: <strong>{app.proc_name}</strong> [{app.proc_code}]
            </Text>
          </div>
        </Space>

        {/* Thanh công cụ thao tác theo quyền và trạng thái */}
        <Space wrap>
          {/* Nút In giấy hẹn TT 01/2018 */}
          <Button
            icon={<PrinterOutlined />}
            onClick={() => setIsPrintSlipOpen(true)}
            style={{ borderColor: '#d97706', color: '#b45309', fontWeight: 600 }}
          >
            In Giấy tiếp nhận & Hẹn trả (TT 01/2018)
          </Button>

          {/* Nút Thu phí / Lệ phí VietQR */}
          {feeNumber > 0 && (
            <Button
              icon={<DollarOutlined />}
              onClick={() => setIsPaymentModalOpen(true)}
              type={app.payment_status === 'DA_THANH_TOAN' ? 'default' : 'primary'}
              style={{
                background: app.payment_status === 'DA_THANH_TOAN' ? '#f0fdf4' : 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                borderColor: app.payment_status === 'DA_THANH_TOAN' ? '#86efac' : '#d97706',
                color: app.payment_status === 'DA_THANH_TOAN' ? '#166534' : '#ffffff',
                fontWeight: 600,
              }}
            >
              {app.payment_status === 'DA_THANH_TOAN' ? 'Đã thu phí (Xem biên lai)' : 'Thu lệ phí / Quét VietQR'}
            </Button>
          )}

          {/* Phân công chuyên viên */}
          {hasRole(['ADMIN', 'MOT_CUA', 'LANH_DAO']) && app.status === 'CHO_TIEP_NHAN' && (
            <Button
              type="primary"
              icon={<UserSwitchOutlined />}
              onClick={() => handleOpenModal('assign')}
              style={{ background: 'var(--gov-red)', borderColor: 'var(--gov-red)' }}
            >
              Phân công chuyên viên
            </Button>
          )}

          {/* Thẩm định & Trình ký (Chuyên viên) */}
          {hasRole(['ADMIN', 'CHUYEN_VIEN']) && app.status === 'DANG_XU_LY' && (
            <>
              <Button icon={<FileDoneOutlined />} onClick={() => handleOpenModal('process')}>
                Cập nhật thẩm định
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleOpenModal('submitApproval')}
                style={{ background: '#7e22ce', borderColor: '#7e22ce' }}
              >
                Trình ký Lãnh đạo
              </Button>
            </>
          )}

          {/* Phê duyệt & Ký số (Lãnh đạo) */}
          {hasRole(['ADMIN', 'LANH_DAO']) && app.status === 'CHO_KY_DUYET' && (
            <Button
              type="primary"
              icon={<SafetyCertificateOutlined />}
              onClick={() => handleOpenModal('approve')}
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                borderColor: '#7f1d1d',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(185, 28, 28, 0.4)',
              }}
            >
              Phê duyệt & Ký số điện tử
            </Button>
          )}

          {/* Hoàn thành & Trả kết quả (Một cửa / Văn thư) */}
          {hasRole(['ADMIN', 'MOT_CUA', 'VAN_THU']) && app.status === 'DA_KY_SO' && (
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleOpenModal('complete')}
              style={{ background: '#15803d', borderColor: '#15803d', fontWeight: 600 }}
            >
              Đóng dấu & Trả kết quả
            </Button>
          )}

          {/* Trả lại hồ sơ */}
          {['CHO_TIEP_NHAN', 'DANG_XU_LY', 'CHO_KY_DUYET'].includes(app.status) && (
            <Button danger icon={<RollbackOutlined />} onClick={() => handleOpenModal('reject')}>
              Trả lại / Bổ sung
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* CỘT TRÁI: THÔNG TIN CHI TIẾT & TÀI LIỆU */}
        <Col xs={24} lg={16}>
          {/* Thông tin hồ sơ & Công dân */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#7f1d1d' }}>Thông tin chi tiết hồ sơ TTHC</span>}
            bordered={false}
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
            extra={
              <Button
                type="link"
                size="small"
                icon={unmasked ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setUnmasked(!unmasked)}
                style={{ color: 'var(--gov-red)', fontWeight: 600 }}
              >
                {unmasked ? 'Che mờ thông tin' : 'Xem số CCCD đầy đủ (Nghị định 13)'}
              </Button>
            }
          >
            <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 2 }}>
              <Descriptions.Item label="Mã hồ sơ">
                <strong style={{ color: 'var(--gov-red)' }}>{app.dossier_code}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Kênh tiếp nhận">
                <Tag color={app.submit_channel === 'TRUC_TUYEN' ? 'red' : 'gold'}>
                  {app.submit_channel === 'TRUC_TUYEN' ? 'Trực tuyến DVC' : 'Tại quầy Một cửa'}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Họ tên công dân">{app.citizen_name}</Descriptions.Item>
              <Descriptions.Item label="Số CCCD">
                <strong>{app.citizen_id_number}</strong>
                {unmasked && <Tag color="green" style={{ marginLeft: 8 }}>Đã giải mã</Tag>}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại">{app.citizen_phone || '---'}</Descriptions.Item>
              <Descriptions.Item label="Lệ phí TTHC">
                <div>
                  <span style={{ color: '#b91c1c', fontWeight: 700 }}>
                    {feeNumber.toLocaleString('vi-VN')} VNĐ
                  </span>
                  <span style={{ marginLeft: 8 }}>
                    {app.payment_status === 'DA_THANH_TOAN' ? (
                      <Tag color="success">Đã thu (Số BL: {app.receipt_number})</Tag>
                    ) : feeNumber > 0 ? (
                      <Tag color="error">Chưa thu phí</Tag>
                    ) : (
                      <Tag color="default">Miễn phí</Tag>
                    )}
                  </span>
                </div>
              </Descriptions.Item>

              <Descriptions.Item label="Địa chỉ liên hệ" span={2}>
                {app.citizen_address || '---'}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày nộp hồ sơ">
                {dayjs(app.submit_date).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Hẹn trả kết quả">
                <span style={{ color: isOverdue ? '#ef4444' : 'inherit', fontWeight: isOverdue ? 700 : 600 }}>
                  {dayjs(app.appointment_date).format('DD/MM/YYYY HH:mm')}
                </span>
              </Descriptions.Item>

              <Descriptions.Item label="Cán bộ tiếp nhận">{app.receiver_name || 'Hệ thống DVC'}</Descriptions.Item>
              <Descriptions.Item label="Cán bộ thụ lý">{app.handler_name || 'Chưa phân công'}</Descriptions.Item>

              {app.notes && (
                <Descriptions.Item label="Ghi chú tiếp nhận" span={2}>
                  {app.notes}
                </Descriptions.Item>
              )}

              {app.rejection_reason && (
                <Descriptions.Item label="Lý do trả lại" span={2}>
                  <Alert message={app.rejection_reason} type="error" showIcon style={{ padding: '6px 12px' }} />
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Khối Đánh giá Mức độ Hài lòng của Công dân (CSAT) nếu có */}
          {app.satisfaction_score && (
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                marginBottom: 16,
                background: '#fffdf5',
                border: '1.5px solid #fde68a',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Space>
                  <span style={{ fontSize: 20 }}>⭐</span>
                  <span style={{ fontWeight: 700, color: '#92400e', fontSize: 15 }}>
                    Đánh giá mức độ hài lòng của công dân (Bộ chỉ số 766)
                  </span>
                </Space>
                <Rate disabled defaultValue={app.satisfaction_score} style={{ color: '#d97706' }} />
              </div>
              <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: 8, border: '1px solid #fed7aa' }}>
                <div style={{ fontStyle: 'italic', color: '#1e293b' }}>
                  "{app.satisfaction_comment || 'Rất hài lòng với chất lượng phục vụ'}"
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Thời gian gửi đánh giá: {dayjs(app.satisfaction_date).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>
            </Card>
          )}

          {/* Danh mục giấy tờ & Tệp đính kèm */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#7f1d1d' }}>Tài liệu & Hồ sơ số hóa đính kèm</span>}
            bordered={false}
            style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
            extra={
              <Upload showUploadList={false} customRequest={handleUploadFile}>
                <Button size="small" icon={<UploadOutlined />} style={{ borderColor: 'var(--gov-red)', color: 'var(--gov-red)' }}>
                  Tải lên tài liệu số
                </Button>
              </Upload>
            }
          >
            <Table
              dataSource={app.documents || []}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Tên tài liệu',
                  dataIndex: 'document_name',
                  key: 'document_name',
                  render: (text, record) => (
                    <div>
                      <div style={{ fontWeight: 500 }}>{text}</div>
                      {record.is_signed === 1 && (
                        <Tag color="cyan" icon={<SafetyCertificateOutlined />}>
                          Đã ký số điện tử
                        </Tag>
                      )}
                    </div>
                  ),
                },
                {
                  title: 'Loại tài liệu',
                  dataIndex: 'doc_type',
                  key: 'doc_type',
                  render: (t) => {
                    const map = {
                      HO_SO_GOC: 'Hồ sơ scan gốc',
                      KET_QUA: 'Kết quả giải quyết',
                      BIEN_BAN: 'Biên bản thẩm định',
                    };
                    return map[t] || t;
                  },
                },
                {
                  title: 'Người tải lên',
                  dataIndex: 'uploader_name',
                  key: 'uploader_name',
                },
                {
                  title: 'Thời gian',
                  dataIndex: 'uploaded_at',
                  key: 'uploaded_at',
                  render: (d) => dayjs(d).format('DD/MM/YYYY HH:mm'),
                },
                {
                  title: 'Tải về',
                  key: 'download',
                  render: (_, record) => (
                    <Button
                      type="link"
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => window.open(record.file_path, '_blank')}
                    >
                      Tải về
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* CỘT PHẢI: TIẾN ĐỘ LUÂN CHUYỂN (WORKFLOW TIMELINE) */}
        <Col xs={24} lg={8}>
          <Card
            title={<span style={{ fontWeight: 700, color: '#7f1d1d' }}>Nhật ký luân chuyển hồ sơ</span>}
            bordered={false}
            style={{ borderRadius: 12, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-color)' }}
          >
            <Timeline
              items={(app.workflow || []).map((wf) => ({
                color: wf.action === 'HOAN_THANH' ? 'green' : wf.action === 'TRA_LAI' ? 'red' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>
                      {wf.action === 'TIEP_NHAN' && '📥 Tiếp nhận hồ sơ'}
                      {wf.action === 'PHAN_CONG' && '👤 Phân công chuyên viên'}
                      {wf.action === 'THAM_DINH' && '📝 Thẩm định điều kiện'}
                      {wf.action === 'TRINH_KY' && '📤 Trình ký Lãnh đạo'}
                      {wf.action === 'KY_SO' && '✍️ Ký số kết quả'}
                      {wf.action === 'THU_PHI' && '💰 Thu phí / Lệ phí'}
                      {wf.action === 'HOAN_THANH' && '✅ Hoàn thành & Trả kết quả'}
                      {wf.action === 'TRA_LAI' && '⚠️ Trả lại yêu cầu bổ sung'}
                      {wf.action === 'DANH_GIA' && '⭐ Công dân đánh giá hài lòng'}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Thực hiện: <strong>{wf.from_user_name || 'Hệ thống / Công dân'}</strong>
                      {wf.to_user_name && ` ➔ ${wf.to_user_name}`}
                    </div>
                    {wf.comment && (
                      <div
                        style={{
                          fontSize: 12,
                          background: '#f8fafc',
                          padding: '4px 8px',
                          borderRadius: 6,
                          marginTop: 4,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {wf.comment}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {dayjs(wf.created_at).format('DD/MM/YYYY HH:mm:ss')}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* MODAL 1: THU PHÍ & MÃ VIETQR CHUẨN MB BANK 0869162534 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c' }}>
            <DollarOutlined />
            <span>Thu Phí, Lệ Phí Thủ Tục Hành Chính & Xuất Biên Lai</span>
          </div>
        }
        open={isPaymentModalOpen}
        onCancel={() => setIsPaymentModalOpen(false)}
        footer={null}
        width={580}
        destroyOnClose
      >
        <div style={{ padding: '8px 0' }}>
          <Alert
            message={`Tổng số tiền cần thu: ${feeNumber.toLocaleString('vi-VN')} VNĐ`}
            description={`Thủ tục: ${app.proc_name} • Mã hồ sơ: ${app.dossier_code}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 16 }}>
            <Text strong>Chọn hình thức thanh toán:</Text>
            <Radio.Group
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Radio.Button value="CHUYEN_KHOAN_QR" style={{ width: '50%', textAlign: 'center' }}>
                Quét mã VietQR (MB Bank)
              </Radio.Button>
              <Radio.Button value="TIEN_MAT" style={{ width: '50%', textAlign: 'center' }}>
                Tiền mặt tại quầy
              </Radio.Button>
            </Radio.Group>
          </div>

          {paymentMethod === 'CHUYEN_KHOAN_QR' && (
            <div
              style={{
                textAlign: 'center',
                padding: 16,
                background: '#fefcf8',
                borderRadius: 12,
                border: '1.5px solid #fde68a',
                marginBottom: 16,
              }}
            >
              <div style={{ fontWeight: 700, color: '#78350f', fontSize: 14, marginBottom: 8 }}>
                MÃ VIETQR THANH TOÁN DỊCH VỤ CÔNG QUỐC GIA
              </div>
              <img
                src={vietQrUrl}
                alt="VietQR MB Bank 0869162534"
                style={{
                  width: 240,
                  height: 240,
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                }}
              />
              <div style={{ marginTop: 12, fontSize: 12, color: '#450a0a', textAlign: 'left', background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid #fed7aa' }}>
                <div>Ngân hàng: <strong>MB Bank (Ngân hàng TMCP Quân Đội)</strong></div>
                <div>Số tài khoản: <strong style={{ color: '#b91c1c', fontSize: 13 }}>0869162534</strong></div>
                <div>Chủ tài khoản: <strong>UBND PHUONG YEN BAI</strong></div>
                <div>Số tiền: <strong style={{ color: '#15803d' }}>{feeNumber.toLocaleString('vi-VN')} VNĐ</strong></div>
                <div>Nội dung CK: <strong style={{ color: '#b45309' }}>LP {app.dossier_code}</strong></div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button onClick={() => setIsPaymentModalOpen(false)}>Hủy bỏ</Button>
            <Button
              type="primary"
              onClick={handleConfirmPayment}
              loading={paymentSubmitting}
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                borderColor: '#7f1d1d',
                fontWeight: 700,
              }}
            >
              Xác nhận đã thu & Cấp biên lai
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: IN GIẤY TIẾP NHẬN & HẸN TRẢ KẾT QUẢ CHUẨN THÔNG TƯ 01/2018/TT-VPCP */}
      <Modal
        title="Biểu mẫu in: Giấy tiếp nhận hồ sơ và hẹn trả kết quả (Mẫu số 01 - TT 01/2018/TT-VPCP)"
        open={isPrintSlipOpen}
        onCancel={() => setIsPrintSlipOpen(false)}
        width={780}
        footer={[
          <Button key="close" onClick={() => setIsPrintSlipOpen(false)}>Đóng</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()} style={{ background: '#b91c1c' }}>
            In Giấy Tiếp Nhận
          </Button>,
        ]}
      >
        <div className="print-document" style={{ padding: 24, background: '#ffffff', color: '#000000', fontFamily: 'Times New Roman, serif', fontSize: '13pt', lineHeight: 1.4 }}>
          {/* Header 2 cột Quốc gia */}
          <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: '48%' }}>
              <div style={{ textTransform: 'uppercase', fontSize: '11pt' }}>ỦY BAN NHÂN DÂN THÀNH PHỐ YÊN BÁI</div>
              <div style={{ textTransform: 'uppercase', fontWeight: 'bold', fontSize: '11pt' }}>UBND PHƯỜNG YÊN BÁI</div>
              <div style={{ textTransform: 'uppercase', fontSize: '10pt', fontWeight: 'bold' }}>BỘ PHẬN TIẾP NHẬN & TRẢ KẾT QUẢ</div>
              <div style={{ fontSize: '11pt', marginTop: 4 }}>Số: <strong>{app.dossier_code}</strong></div>
            </div>
            <div style={{ width: '48%' }}>
              <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '11pt' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>Độc lập - Tự do - Hạnh phúc</div>
              <div style={{ fontSize: '12pt' }}>-------------------</div>
              <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>Yên Bái, ngày {dayjs().format('DD')} tháng {dayjs().format('MM')} năm {dayjs().format('YYYY')}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '20px 0 16px 0' }}>
            <div style={{ fontWeight: 'bold', fontSize: '15pt', textTransform: 'uppercase' }}>
              GIẤY TIẾP NHẬN HỒ SƠ VÀ HẸN TRẢ KẾT QUẢ
            </div>
            <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>
              (Mã hồ sơ: {app.dossier_code})
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <p>Bộ phận Tiếp nhận và Trả kết quả UBND Phường Yên Bái tiếp nhận hồ sơ của:</p>
            <p>- Ông/Bà: <strong>{app.citizen_name}</strong>; Số định danh cá nhân / CCCD: <strong>{app.citizen_id_number}</strong></p>
            <p>- Địa chỉ thường trú: {app.citizen_address || 'Phường Yên Bái, TP Yên Bái'}</p>
            <p>- Số điện thoại liên hệ: {app.citizen_phone || '---'}</p>
            <p>- Tên thủ tục hành chính: <strong>{app.proc_name}</strong> [{app.proc_code}]</p>
            <p>- Lệ phí thủ tục: <strong>{feeNumber.toLocaleString('vi-VN')} VNĐ</strong> ({app.payment_status === 'DA_THANH_TOAN' ? 'Đã nộp' : 'Chưa nộp'})</p>
            <p>- Thời gian tiếp nhận: <strong>{dayjs(app.submit_date).format('HH:mm, [ngày] DD/MM/YYYY')}</strong></p>
            <p>- <strong>Thời gian hẹn trả kết quả: <span style={{ textDecoration: 'underline' }}>{dayjs(app.appointment_date).format('HH:mm, [ngày] DD/MM/YYYY')}</span></strong></p>
          </div>

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
            <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold' }}>NGƯỜI NỘP HỒ SƠ</div>
              <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký và ghi rõ họ tên)</div>
              <div style={{ marginTop: 60, fontWeight: 'bold' }}>{app.citizen_name}</div>
            </div>
            <div style={{ width: '45%' }}>
              <div style={{ fontWeight: 'bold' }}>CÁN BỘ TIẾP NHẬN</div>
              <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>(Ký và ghi rõ họ tên)</div>
              <div style={{ marginTop: 60, fontWeight: 'bold' }}>{app.receiver_name || user?.full_name || 'Cán bộ Một cửa'}</div>
            </div>
          </div>

          <div style={{ marginTop: 30, paddingTop: 10, borderTop: '1px dashed #999', fontSize: '10pt', fontStyle: 'italic', textAlign: 'center' }}>
            * Quý công dân có thể dùng điện thoại thông minh quét mã hồ sơ để tra cứu tiến độ xử lý trực tuyến tại: http://localhost/gov/tra-cuu
          </div>
        </div>
      </Modal>

      {/* MODAL 3: CÁC THAO TÁC LUÂN CHUYỂN HỒ SƠ */}
      <Modal
        title={
          modalAction === 'assign'
            ? 'Phân công chuyên viên thụ lý'
            : modalAction === 'process'
            ? 'Cập nhật tiến độ thẩm định'
            : modalAction === 'submitApproval'
            ? 'Trình ký Lãnh đạo UBND Phường'
            : modalAction === 'approve'
            ? 'Phê duyệt & Ký số điện tử Ban Cơ yếu'
            : modalAction === 'complete'
            ? 'Đóng dấu số & Trả kết quả'
            : 'Trả lại hồ sơ yêu cầu bổ sung'
        }
        open={!!modalAction}
        onCancel={() => setModalAction(null)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleExecuteAction} style={{ marginTop: 16 }}>
          {modalAction === 'assign' && (
            <>
              <Form.Item
                name="handler_id"
                label="Chọn chuyên viên thụ lý"
                rules={[{ required: true, message: 'Vui lòng chọn chuyên viên' }]}
              >
                <Select placeholder="Chọn cán bộ...">
                  {officers
                    .filter((u) => u.role === 'CHUYEN_VIEN' || u.role === 'MOT_CUA')
                    .map((u) => (
                      <Select.Option key={u.id} value={u.id}>
                        {u.full_name} ({u.dept_name || u.role})
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
              <Form.Item name="comment" label="Ý kiến phân công">
                <TextArea rows={2} placeholder="Nội dung giao nhiệm vụ..." />
              </Form.Item>
            </>
          )}

          {modalAction === 'process' && (
            <>
              <Form.Item name="notes" label="Ghi chú kết quả thẩm định">
                <TextArea rows={3} placeholder="Kết quả đối chiếu hồ sơ, xác minh thực địa..." />
              </Form.Item>
              <Form.Item name="comment" label="Nội dung tiến độ">
                <Input placeholder="Ví dụ: Đã hoàn thành đối chiếu bản gốc..." />
              </Form.Item>
            </>
          )}

          {modalAction === 'submitApproval' && (
            <>
              <Form.Item name="comment" label="Nội dung tờ trình">
                <TextArea
                  rows={3}
                  defaultValue="Đã thẩm định điều kiện hợp lệ theo quy định, kính trình Lãnh đạo phê duyệt kết quả."
                />
              </Form.Item>
            </>
          )}

          {modalAction === 'approve' && (
            <>
              <Alert
                message="Xác thực Ký số chuyên dùng Ban Cơ yếu Chính phủ"
                description={
                  <div>
                    Chứng thư số: <strong>{user?.certificate_serial || 'VGCA-SIMPKI-YENBAI-2026'}</strong>
                    <br />
                    Người ký: <strong>{user?.full_name}</strong>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.Item name="pin_code" label="Mã PIN Token / SIM PKI">
                <Input.Password placeholder="Nhập mã PIN để ký số" defaultValue="123456" />
              </Form.Item>
              <Form.Item name="comment" label="Ý kiến phê duyệt">
                <Input defaultValue="Đồng ý phê duyệt kết quả giải quyết TTHC." />
              </Form.Item>
            </>
          )}

          {modalAction === 'complete' && (
            <>
              <Alert
                message="Xác nhận đóng dấu số & Trả kết quả"
                description={`Lệ phí TTHC: ${feeNumber.toLocaleString('vi-VN')} VNĐ (${app.payment_status === 'DA_THANH_TOAN' ? 'Đã thu phí' : 'Cần thu tiền mặt hoặc quét VietQR'}).`}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.Item name="comment" label="Ghi chú trả kết quả">
                <Input defaultValue="Đã kiểm tra kết quả ký số và bàn giao cho công dân." />
              </Form.Item>
            </>
          )}

          {modalAction === 'reject' && (
            <>
              <Form.Item
                name="reason"
                label="Lý do trả lại / Yêu cầu bổ sung"
                rules={[{ required: true, message: 'Vui lòng nêu rõ lý do' }]}
              >
                <TextArea rows={4} placeholder="Nêu rõ căn cứ pháp lý hoặc giấy tờ còn thiếu cần bổ sung..." />
              </Form.Item>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <Button onClick={() => setModalAction(null)}>Hủy bỏ</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={actionLoading}
              style={{ background: 'var(--gov-red)', borderColor: 'var(--gov-red)' }}
            >
              Xác nhận thực hiện
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
