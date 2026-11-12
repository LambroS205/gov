import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, Modal, Input, message, Space, Tag } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  QrcodeOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
  FileDoneOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { queueApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function Kiosk() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ticketModal, setTicketModal] = useState(null);
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');

  const services = [
    {
      type: 'HO_TICH',
      code: 'A',
      title: 'HỘ TỊCH & KHAI SINH',
      desc: 'Đăng ký khai sinh, kết hôn, khai tử, xác nhận tình trạng hôn nhân',
      icon: <SafetyCertificateOutlined style={{ fontSize: 44, color: '#b91c1c' }} />,
      color: '#b91c1c',
      bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      border: '#fca5a5',
      counter: 'Quầy số 1',
    },
    {
      type: 'CHUNG_THUC',
      code: 'B',
      title: 'CHỨNG THỰC & CHỮ KÝ',
      desc: 'Chứng thực bản sao từ bản chính, chứng thực chữ ký, hợp đồng giao dịch',
      icon: <FileDoneOutlined style={{ fontSize: 44, color: '#d97706' }} />,
      color: '#d97706',
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      border: '#fcd34d',
      counter: 'Quầy số 2',
    },
    {
      type: 'DIA_CHINH',
      code: 'C',
      title: 'ĐỊA CHÍNH & NHÀ ĐẤT',
      desc: 'Đăng ký biến động quyền sử dụng đất, cấp giấy phép xây dựng nhà ở riêng lẻ',
      icon: <HomeOutlined style={{ fontSize: 44, color: '#0284c7' }} />,
      color: '#0284c7',
      bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      border: '#7dd3fc',
      counter: 'Quầy số 3',
    },
    {
      type: 'LAO_DONG_TBXH',
      code: 'D',
      title: 'CHÍNH SÁCH XÃ HỘI & BTXH',
      desc: 'Hưởng chế độ người có công, bảo trợ xã hội, mai táng phí, hồ sơ việc làm',
      icon: <HeartOutlined style={{ fontSize: 44, color: '#15803d' }} />,
      color: '#15803d',
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      border: '#86efac',
      counter: 'Quầy số 4',
    },
  ];

  const handleTakeTicket = async (counterType) => {
    setLoading(true);
    try {
      const res = await queueApi.takeTicket({
        counter_type: counterType,
        citizen_name: citizenName.trim() || undefined,
        citizen_phone: citizenPhone.trim() || undefined,
      });

      if (res?.data) {
        setTicketModal(res.data);
        message.success(`Lấy số thành công: ${res.data.ticket_number}`);
        setCitizenName('');
        setCitizenPhone('');
      }
    } catch (err) {
      message.error(err?.message || 'Có lỗi khi lấy số thứ tự');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HEADER KIOSK */}
      <div
        style={{
          background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
          borderRadius: 20,
          padding: '20px 32px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(185, 28, 28, 0.3)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
            }}
          >
            ⭐
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fde68a', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ỦY BAN NHÂN DÂN PHƯỜNG YÊN BÁI — HỆ THỐNG MỘT CỬA ĐIỆN TỬ
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginTop: 2 }}>
              KIOSK TỰ PHỤC VỤ — BỐC SỐ THỨ TỰ TỰ ĐỘNG
            </div>
          </div>
        </div>

        <Space size="middle">
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/tra-cuu')}
            style={{ borderRadius: 10, fontWeight: 600 }}
          >
            Về Cổng DVC
          </Button>
          <Button
            size="large"
            type="primary"
            onClick={() => navigate('/goi-so')}
            style={{
              background: '#f59e0b',
              borderColor: '#f59e0b',
              color: '#000',
              fontWeight: 700,
              borderRadius: 10,
            }}
          >
            Màn hình gọi số 📢
          </Button>
        </Space>
      </div>

      {/* THÔNG TIN NHẬP NHANH (TÙY CHỌN) */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          marginBottom: 24,
          background: '#ffffff',
        }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>
            💡 <strong style={{ color: '#1e293b' }}>Thông tin công dân (Tùy chọn):</strong> Nhập họ tên/SĐT để in trực tiếp trên phiếu và nhận tin nhắn thông báo tiến độ.
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', maxWidth: 600 }}>
            <Input
              prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Họ và tên công dân"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              style={{ width: 240, borderRadius: 8 }}
            />
            <Input
              prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Số điện thoại liên hệ"
              value={citizenPhone}
              onChange={(e) => setCitizenPhone(e.target.value)}
              style={{ width: 200, borderRadius: 8 }}
            />
          </div>
        </div>
      </Card>

      {/* DANH SÁCH 4 NÚT LĨNH VỰC BẤM CẢM ỨNG LỚN */}
      <div style={{ flex: 1 }}>
        <Row gutter={[20, 20]}>
          {services.map((s) => (
            <Col xs={24} sm={12} key={s.type}>
              <Card
                hoverable
                onClick={() => !loading && handleTakeTicket(s.type)}
                style={{
                  height: '100%',
                  borderRadius: 20,
                  border: `2px solid ${s.border}`,
                  background: s.bg,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  padding: 12,
                }}
                bodyStyle={{
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  minHeight: 220,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ background: '#fff', padding: 14, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      {s.icon}
                    </div>
                    <Tag
                      color={s.color}
                      style={{
                        fontSize: 14,
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontWeight: 800,
                      }}
                    >
                      {s.counter}
                    </Tag>
                  </div>

                  <Title level={3} style={{ color: s.color, marginTop: 18, marginBottom: 8, fontWeight: 800 }}>
                    {s.title}
                  </Title>
                  <Text style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>
                    {s.desc}
                  </Text>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                    Mã số: <strong>{s.code}xxx</strong>
                  </span>
                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    style={{
                      background: s.color,
                      borderColor: s.color,
                      borderRadius: 12,
                      fontWeight: 800,
                      height: 48,
                      padding: '0 28px',
                      fontSize: 16,
                      boxShadow: `0 4px 14px ${s.color}55`,
                    }}
                  >
                    BẤM LẤY SỐ 👉
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* FOOTER HƯỚNG DẪN */}
      <div style={{ textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 13 }}>
        © 2026 UBND Phường Yên Bái — Hệ thống tiếp nhận và trả kết quả thủ tục hành chính tập trung. Sau khi lấy phiếu, xin mời Quý công dân ngồi chờ tại hàng ghế và chú ý theo dõi màn hình LCD.
      </div>

      {/* MODAL IN PHIẾU BỐC SỐ THỨ TỰ */}
      {ticketModal && (
        <Modal
          open={!!ticketModal}
          onCancel={() => setTicketModal(null)}
          footer={[
            <Button key="close" size="large" onClick={() => setTicketModal(null)}>
              Đóng (Tự đóng sau 10s)
            </Button>,
            <Button
              key="print"
              type="primary"
              size="large"
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
              style={{ background: '#b91c1c', borderColor: '#b91c1c', fontWeight: 700 }}
            >
              In Phiếu Thứ Tự
            </Button>,
          ]}
          width={420}
          centered
        >
          <div
            id="print-ticket"
            style={{
              padding: '24px 16px',
              textAlign: 'center',
              fontFamily: 'monospace, sans-serif',
              color: '#000',
              background: '#ffffff',
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>
              UBND PHƯỜNG YÊN BÁI
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              BỘ PHẬN TIẾP NHẬN & TRẢ KẾT QUẢ MỘT CỬA
            </div>
            <div style={{ borderBottom: '1px dashed #000', margin: '12px 0' }} />

            <div style={{ fontSize: 13, textTransform: 'uppercase', fontWeight: 700, color: '#b91c1c' }}>
              PHIẾU BỐC SỐ THỨ TỰ
            </div>

            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                color: '#b91c1c',
                letterSpacing: 2,
                margin: '12px 0 6px 0',
                lineHeight: 1,
              }}
            >
              {ticketModal.ticket_number}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
              {ticketModal.service_name}
            </div>

            {ticketModal.citizen_name && (
              <div style={{ fontSize: 12, marginBottom: 4 }}>
                Công dân: <strong>{ticketModal.citizen_name}</strong>
              </div>
            )}

            <div style={{ fontSize: 12, color: '#475569' }}>
              Thời gian lấy: {dayjs(ticketModal.created_at).format('HH:mm:ss DD/MM/YYYY')}
            </div>

            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fde047',
                borderRadius: 8,
                padding: '8px 12px',
                margin: '14px 0',
                fontSize: 12,
                fontWeight: 600,
                color: '#854d0e',
              }}
            >
              ⏳ Số người đang chờ trước bạn: <strong>{ticketModal.waiting_ahead} người</strong>
              <br />
              Dự kiến chờ khoảng: ~{ticketModal.estimated_wait_minutes} phút
            </div>

            <div style={{ margin: '14px 0', display: 'flex', justifyContent: 'center' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=95x95&margin=2&data=${encodeURIComponent(
                  window.location.origin + '/gov/tra-cuu'
                )}`}
                alt="QR tra cứu"
                style={{ width: 85, height: 85, border: '1px solid #cbd5e1', borderRadius: 4 }}
              />
            </div>

            <div style={{ fontSize: 10, fontStyle: 'italic', color: '#64748b' }}>
              * Quý công dân vui lòng giữ phiếu và chú ý nghe loa gọi số tại Quầy Một cửa.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

