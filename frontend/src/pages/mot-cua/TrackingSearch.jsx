import React, { useState } from 'react';
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
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { applicationsApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function TrackingSearch() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Feedback State
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // VietQR Modal State
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
      // Refresh dữ liệu
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fdf6f0 0%, #f8fafc 100%)',
        padding: '36px 16px',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Thanh điều hướng trên cùng */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/login')}
            style={{ color: 'var(--gov-red)', fontWeight: 600, padding: 0 }}
          >
            Đăng nhập cán bộ
          </Button>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            Cổng Thông tin Dịch vụ Công UBND Phường
          </div>
        </div>

        {/* Header Quốc huy / UBND Phường */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', letterSpacing: '0.8px', marginBottom: 8 }}>
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            <div style={{ fontSize: 10, color: '#d97706', fontWeight: 600, letterSpacing: '0.4px', marginTop: 1 }}>
              Độc lập - Tự do - Hạnh phúc
            </div>
          </div>

          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
              border: '2px solid #f59e0b',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              marginBottom: 10,
              boxShadow: '0 6px 16px rgba(185, 28, 28, 0.35)',
            }}
          >
            ⭐
          </div>
          <Title level={3} style={{ margin: '0 0 4px 0', color: '#7f1d1d', fontWeight: 800 }}>
            CỔNG TRA CỨU TIẾN ĐỘ HỒ SƠ DỊCH VỤ CÔNG QUỐC GIA
          </Title>
          <Text style={{ color: '#b45309', fontSize: 13, fontWeight: 600 }}>
            Ủy ban Nhân dân Phường Yên Bái • Hệ thống Một cửa điện tử liên thông
          </Text>
        </div>

        {/* Khung tìm kiếm */}
        <Card
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: '0 10px 25px -5px rgba(185, 28, 28, 0.08)',
            marginBottom: 24,
            border: '1.5px solid #fed7aa',
            background: '#ffffff',
          }}
          bodyStyle={{ padding: 28 }}
        >
          <Title level={5} style={{ margin: '0 0 12px 0', color: '#7f1d1d', fontWeight: 700 }}>
            Tra cứu trực tuyến theo Mã hồ sơ (hoặc số Căn cước công dân)
          </Title>

          <Space.Compact style={{ width: '100%' }} size="large">
            <Input
              placeholder="Ví dụ: 000.00.00.H49-261005-0001 hoặc số CCCD 01509..."
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
              Tra cứu tiến độ
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
            💡 Mẹo: Quý công dân có thể quét mã QR in trên <strong>Giấy tiếp nhận hồ sơ và hẹn trả kết quả</strong> để tra cứu nhanh trên điện thoại di động.
          </div>
        </Card>

        {/* Kết quả tra cứu */}
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
                bodyStyle={{ padding: 28 }}
              >
                {/* Header Hồ sơ */}
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

                {/* Thông tin chính */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
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
                      marginBottom: 24,
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
                          <Tag color="success">Đã thanh toán (Biên lai: {app.receipt_number})</Tag>
                        ) : (
                          <Tag color="error">Chưa thanh toán</Tag>
                        )}
                      </span>
                    </div>

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
                        Thanh toán trực tuyến (VietQR MB Bank)
                      </Button>
                    )}
                  </div>
                )}

                {/* Thanh tiến độ các bước */}
                <Title level={5} style={{ marginBottom: 18, color: '#7f1d1d' }}>Quy trình xử lý hồ sơ Một cửa</Title>
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
                  style={{ marginBottom: 30 }}
                />

                {/* KHỐI ĐÁNH GIÁ MỨC ĐỘ HÀI LÒNG CỦA CÔNG DÂN (CSAT) NẾU HỒ SƠ ĐÃ HOÀN THÀNH */}
                {app.status === 'HOAN_THANH' && (
                  <div
                    style={{
                      marginTop: 24,
                      marginBottom: 24,
                      padding: 20,
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      borderRadius: 12,
                      border: '1.5px solid #f59e0b',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <SmileOutlined style={{ fontSize: 20, color: '#d97706' }} />
                      <span style={{ fontWeight: 700, color: '#78350f', fontSize: 15 }}>
                        KHẢO SÁT MỨC ĐỘ HÀI LÒNG CỦA CÔNG DÂN (Bộ chỉ số Quyết định 766/QĐ-TTg)
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
                          ✓ Cảm ơn Quý công dân đã đóng góp ý kiến nâng cao chất lượng phục vụ của UBND Phường Yên Bái!
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: 13, color: '#450a0a', marginBottom: 10 }}>
                          Để nâng cao chất lượng phục vụ của cơ quan hành chính nhà nước, xin Quý công dân vui lòng đánh giá mức độ hài lòng về quá trình giải quyết thủ tục này:
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontWeight: 600 }}>Mức độ hài lòng:</span>
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
                          placeholder="Ý kiến góp ý thêm về thái độ cán bộ, thời gian giải quyết..."
                          value={ratingComment}
                          onChange={(e) => setRatingComment(e.target.value)}
                          style={{ marginBottom: 12, borderRadius: 8 }}
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

                {/* Nhật ký chi tiết */}
                <Title level={5} style={{ marginBottom: 14, color: '#7f1d1d' }}>Lịch sử luân chuyển hồ sơ</Title>
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

        {/* Modal VietQR MB Bank cho công dân quét thanh toán */}
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
                <div>Ngân hàng thụ hưởng: <strong>MB Bank (Ngân hàng TMCP Quân Đội)</strong></div>
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
