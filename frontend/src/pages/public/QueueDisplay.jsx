import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Button, Badge, Space, Tag } from 'antd';
import {
  SoundOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  NotificationOutlined,
  UserOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { queueApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function QueueDisplay() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [displayData, setDisplayData] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));
  const [currentDate, setCurrentDate] = useState(dayjs().format('dddd, [ngày] DD/MM/YYYY'));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastSpokenTicketId, setLastSpokenTicketId] = useState(null);
  const [activeCounterNum, setActiveCounterNum] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Phát âm thanh chime ding-dong bằng Web Audio API
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.8);
    } catch {
      // Bỏ qua nếu trình duyệt chặn audio context tự động
    }
  };

  // Đọc số bằng giọng nói Tiếng Việt qua Web Speech Synthesis
  const speakTicket = (ticketNumber, counterNo, citizenName) => {
    playChime();
    if (!('speechSynthesis' in window)) return;

    setTimeout(() => {
      window.speechSynthesis.cancel(); // Hủy các câu đọc dở
      // Đọc tách ký tự để rõ ràng, ví dụ "A 0 0 2"
      const formattedNum = ticketNumber.split('').join(' ');
      const text = `Xin kính mời công dân số ${formattedNum} đến quầy số ${counterNo} để làm việc`;
      
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'vi-VN';
      utter.rate = 0.95;
      utter.pitch = 1.0;

      // Ưu tiên giọng tiếng Việt nếu có trong danh sách
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VIE'));
      if (viVoice) utter.voice = viVoice;

      window.speechSynthesis.speak(utter);
    }, 400);
  };

  // Đồng hồ thời gian thực mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'));
      setCurrentDate(dayjs().format('dddd, [ngày] DD/MM/YYYY'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling dữ liệu mỗi 4 giây
  useEffect(() => {
    fetchDisplayData();
    const interval = setInterval(fetchDisplayData, 4000);
    return () => clearInterval(interval);
  }, [soundEnabled, lastSpokenTicketId]);

  const fetchDisplayData = async () => {
    try {
      const res = await queueApi.getDisplay();
      if (res?.data) {
        setDisplayData(res.data);

        // Kiểm tra xem có số mới gọi không để phát âm thanh
        const latest = res.data.latest_called;
        if (latest && latest.id !== lastSpokenTicketId) {
          setLastSpokenTicketId(latest.id);
          setActiveCounterNum(latest.counter_no);
          if (soundEnabled) {
            speakTicket(latest.ticket_number, latest.counter_no, latest.citizen_name);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi tải hàng đợi gọi số:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const counters = [
    {
      num: 1,
      title: 'QUẦY SỐ 1',
      service: 'HỘ TỊCH & KHAI SINH',
      type: 'HO_TICH',
      color: '#b91c1c',
      bg: 'linear-gradient(135deg, #450a0a 0%, #1e1b4b 100%)',
      border: '#ef4444',
    },
    {
      num: 2,
      title: 'QUẦY SỐ 2',
      service: 'CHỨNG THỰC & CHỮ KÝ',
      type: 'CHUNG_THUC',
      color: '#d97706',
      bg: 'linear-gradient(135deg, #451a03 0%, #1e1b4b 100%)',
      border: '#f59e0b',
    },
    {
      num: 3,
      title: 'QUẦY SỐ 3',
      service: 'ĐỊA CHÍNH & NHÀ ĐẤT',
      type: 'DIA_CHINH',
      color: '#0284c7',
      bg: 'linear-gradient(135deg, #082f49 0%, #1e1b4b 100%)',
      border: '#38bdf8',
    },
    {
      num: 4,
      title: 'QUẦY SỐ 4',
      service: 'CHÍNH SÁCH XÃ HỘI & BTXH',
      type: 'LAO_DONG_TBXH',
      color: '#15803d',
      bg: 'linear-gradient(135deg, #052e16 0%, #1e1b4b 100%)',
      border: '#4ade80',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#090d16',
        color: '#ffffff',
        padding: '16px 24px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* HEADER MÀN HÌNH */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: 16,
          padding: '14px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            ⭐
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fde68a', letterSpacing: '1px' }}>
              ỦY BAN NHÂN DÂN PHƯỜNG YÊN BÁI — BỘ PHẬN TIẾP NHẬN & TRẢ KẾT QUẢ
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff' }}>
              MÀN HÌNH GỌI SỐ THỨ TỰ PHỤC VỤ CÔNG DÂN
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fef08a', fontFamily: 'monospace', lineHeight: 1 }}>
              {currentTime}
            </div>
            <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 2 }}>{currentDate}</div>
          </div>

          <Space>
            <Button
              type={soundEnabled ? 'primary' : 'default'}
              icon={<SoundOutlined />}
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) speakTicket('A001', 1, '');
              }}
              style={{
                borderRadius: 8,
                background: soundEnabled ? '#15803d' : '#475569',
                borderColor: 'transparent',
                fontWeight: 700,
              }}
            >
              {soundEnabled ? 'Loa: Đang Bật' : 'Loa: Tắt'}
            </Button>

            <Button
              shape="circle"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', color: '#fff' }}
              title="Toàn màn hình TV (F11)"
            />
          </Space>
        </div>
      </div>

      {/* 4 THẺ QUẦY LỚN HIỂN THỊ SỐ ĐANG GỌI */}
      <Row gutter={[20, 20]} style={{ flex: 1 }}>
        {counters.map((c) => {
          const ticket = (displayData?.calling || []).find((t) => t.counter_no === c.num);
          const isPulsing = activeCounterNum === c.num;
          const waitingCount = displayData?.waiting_counts?.[c.type] ?? 0;

          return (
            <Col xs={24} sm={12} key={c.num} style={{ display: 'flex' }}>
              <div
                style={{
                  flex: 1,
                  background: c.bg,
                  borderRadius: 20,
                  border: isPulsing ? `3px solid #fef08a` : `2px solid ${c.border}`,
                  boxShadow: isPulsing
                    ? '0 0 35px rgba(254, 240, 138, 0.4), inset 0 0 20px rgba(254, 240, 138, 0.2)'
                    : '0 8px 30px rgba(0, 0, 0, 0.4)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Header quầy */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag
                      color={c.color}
                      style={{
                        fontSize: 16,
                        padding: '6px 16px',
                        borderRadius: 20,
                        fontWeight: 900,
                        letterSpacing: 1,
                      }}
                    >
                      {c.title}
                    </Tag>
                    <Badge
                      count={`Đang chờ: ${waitingCount}`}
                      style={{ backgroundColor: waitingCount > 0 ? '#f59e0b' : '#64748b', fontSize: 13, fontWeight: 700 }}
                    />
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginTop: 12 }}>
                    {c.service}
                  </div>
                </div>

                {/* SỐ THỨ TỰ CỠ LỚN */}
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <div style={{ fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>
                    SỐ ĐANG PHỤC VỤ
                  </div>
                  <div
                    style={{
                      fontSize: 88,
                      fontWeight: 900,
                      fontFamily: 'monospace, sans-serif',
                      color: ticket ? '#fef08a' : '#475569',
                      lineHeight: 1,
                      textShadow: ticket ? '0 0 25px rgba(254, 240, 138, 0.6)' : 'none',
                      margin: '12px 0',
                    }}
                  >
                    {ticket ? ticket.ticket_number : '---'}
                  </div>

                  <div style={{ minHeight: 28, fontSize: 16, fontWeight: 600, color: '#f1f5f9' }}>
                    {ticket ? (
                      <span>
                        <UserOutlined style={{ marginRight: 6 }} />
                        {ticket.citizen_name || 'Công dân'}
                      </span>
                    ) : (
                      <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: 14 }}>
                        Sẵn sàng tiếp đón công dân
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer quầy: Cán bộ trực */}
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 10,
                    padding: '8px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                    color: '#cbd5e1',
                  }}
                >
                  <span>Cán bộ thụ lý: <strong>{ticket?.handler_name || 'Đang trực quầy'}</strong></span>
                  {ticket?.called_at && (
                    <span>Gọi lúc: <strong>{dayjs(ticket.called_at).format('HH:mm')}</strong></span>
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* FOOTER THANH TRẠNG THÁI */}
      <div
        style={{
          marginTop: 16,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          color: '#cbd5e1',
        }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <span>⏳ Tổng công dân đang chờ: <strong style={{ color: '#f59e0b', fontSize: 16 }}>{displayData?.total_waiting ?? 0} người</strong></span>
          <span>✓ Đã phục vụ hôm nay: <strong style={{ color: '#22c55e', fontSize: 16 }}>{displayData?.total_served ?? 0} lượt</strong></span>
        </div>

        <Space>
          <Button
            size="small"
            icon={<CustomerServiceOutlined />}
            onClick={() => speakTicket('A002', 1, '')}
            style={{ borderRadius: 6 }}
          >
            Thử loa gọi số 🔊
          </Button>
          <Button
            size="small"
            type="link"
            onClick={() => navigate('/kiosk')}
            style={{ color: '#fde68a' }}
          >
            Chuyển sang Kiosk bốc số →
          </Button>
        </Space>
      </div>
    </div>
  );
}

