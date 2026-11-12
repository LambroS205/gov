import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Tag, Typography, Button, Spin, Badge, Space } from 'antd';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  QrcodeOutlined,
  SoundOutlined,
  BankOutlined,
  UserOutlined,
  StarFilled,
} from '@ant-design/icons';
import { publicBoardApi } from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function PublicBoard() {
  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState(null);
  const [currentTime, setCurrentTime] = useState(dayjs().format('HH:mm:ss'));
  const [currentDate, setCurrentDate] = useState(dayjs().format('dddd, [ngày] DD/MM/YYYY'));
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cập nhật đồng hồ thời gian thực mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('HH:mm:ss'));
      setCurrentDate(dayjs().format('dddd, [ngày] DD/MM/YYYY'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tự động làm mới dữ liệu mỗi 15 giây
  useEffect(() => {
    fetchBoardData();
    const interval = setInterval(fetchBoardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchBoardData = async () => {
    try {
      const res = await publicBoardApi.getBoard();
      if (res?.data) {
        setBoardData(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu bảng công khai:', err);
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

  const statusMap = {
    CHO_TIEP_NHAN: { label: 'Chờ tiếp nhận', color: 'orange' },
    DANG_XU_LY: { label: 'Đang thụ lý', color: 'blue' },
    CHO_KY_DUYET: { label: 'Chờ ký duyệt', color: 'purple' },
    DA_KY_SO: { label: 'Đã ký số', color: 'cyan' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'green' },
    TRA_LAI: { label: 'Bổ sung hồ sơ', color: 'red' },
  };

  const columns = [
    {
      title: 'Mã hồ sơ',
      dataIndex: 'dossier_code',
      key: 'dossier_code',
      width: 170,
      render: (code) => (
        <span style={{ fontWeight: 800, color: '#b91c1c', fontSize: 14 }}>
          {code}
        </span>
      ),
    },
    {
      title: 'Thủ tục hành chính',
      dataIndex: 'proc_name',
      key: 'proc_name',
      ellipsis: true,
      render: (name) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{name}</span>,
    },
    {
      title: 'Công dân (đã bảo mật)',
      dataIndex: 'citizen_name_masked',
      key: 'citizen_name_masked',
      width: 150,
      render: (name) => <span style={{ color: '#334155', fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Hạn trả kết quả',
      dataIndex: 'appointment_date',
      key: 'appointment_date',
      width: 130,
      render: (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (st) => (
        <Tag color={statusMap[st]?.color || 'default'} style={{ fontWeight: 700, padding: '3px 8px' }}>
          {statusMap[st]?.label || st}
        </Tag>
      ),
    },
  ];

  const m = boardData?.metrics || {};

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #450a0a 0%, #1e1b4b 100%)',
        color: '#ffffff',
        padding: '16px 24px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 1. HEADER BẢNG CÔNG KHAI */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 16,
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
              border: '2px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.5)',
            }}
          >
            ⭐
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fde68a', letterSpacing: '1px', textTransform: 'uppercase' }}>
              ỦY BAN NHÂN DÂN PHƯỜNG YÊN BÁI — THÀNH PHỐ YÊN BÁI
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
              BẢNG CÔNG KHAI TIẾN ĐỘ THỦ TỤC HÀNH CHÍNH & HÀNG ĐỢI MỘT CỬA
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fef08a', fontFamily: 'monospace', lineHeight: 1.1 }}>
              {currentTime}
            </div>
            <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, marginTop: 2 }}>
              {currentDate}
            </div>
          </div>

          <Space>
            <Button
              shape="circle"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchBoardData}
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', color: '#fff' }}
              title="Làm mới dữ liệu"
            />
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

      {/* 2. CHỈ SỐ KPI CHÍNH */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(185, 28, 28, 0.8) 0%, rgba(127, 29, 29, 0.9) 100%)',
              border: '1px solid rgba(254, 202, 202, 0.3)',
              borderRadius: 14,
              padding: '14px 18px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ fontSize: 12, color: '#fecaca', fontWeight: 600, textTransform: 'uppercase' }}>
              Tiếp nhận hôm nay
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>{m.today_received ?? 0}</span>
              <span style={{ fontSize: 12, color: '#fde68a' }}>hồ sơ mới</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.8) 0%, rgba(180, 83, 9, 0.9) 100%)',
              border: '1px solid rgba(254, 240, 138, 0.3)',
              borderRadius: 14,
              padding: '14px 18px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ fontSize: 12, color: '#fef3c7', fontWeight: 600, textTransform: 'uppercase' }}>
              Đã hoàn thành tháng này
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>{m.month_completed ?? 0}</span>
              <span style={{ fontSize: 12, color: '#fef08a' }}>kết quả trả</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(21, 128, 61, 0.8) 0%, rgba(20, 83, 45, 0.9) 100%)',
              border: '1px solid rgba(187, 247, 208, 0.3)',
              borderRadius: 14,
              padding: '14px 18px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ fontSize: 12, color: '#bbf7d0', fontWeight: 600, textTransform: 'uppercase' }}>
              Tỷ lệ giải quyết đúng hạn
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>{m.on_time_rate ?? 100}%</span>
              <span style={{ fontSize: 12, color: '#86efac' }}>Đạt chuẩn ISO</span>
            </div>
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(3, 105, 161, 0.8) 0%, rgba(12, 74, 110, 0.9) 100%)',
              border: '1px solid rgba(186, 230, 253, 0.3)',
              borderRadius: 14,
              padding: '14px 18px',
              boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ fontSize: 12, color: '#bae6fd', fontWeight: 600, textTransform: 'uppercase' }}>
              Mức độ hài lòng của dân
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, color: '#ffffff' }}>
                {m.csat_score ?? 5.0} <span style={{ fontSize: 18, color: '#facc15' }}>★</span>
              </span>
              <span style={{ fontSize: 12, color: '#7dd3fc' }}>5.0 thang điểm</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* 3. NỘI DUNG CHÍNH: HÀNG ĐỢI QUẦY & DANH SÁCH HỒ SƠ */}
      <Row gutter={[16, 16]} style={{ flex: 1 }}>
        {/* CỘT TRÁI (65%): BẢNG TIẾN ĐỘ HỒ SƠ VỪA GIẢI QUYẾT */}
        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#7f1d1d', fontWeight: 800, fontSize: 15, textTransform: 'uppercase' }}>
                  📋 TIẾN ĐỘ GIẢI QUYẾT HỒ SƠ GẦN ĐÂY
                </span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  * Tên công dân được che mờ theo Nghị định 13/2023/NĐ-CP
                </span>
              </div>
            }
            style={{
              borderRadius: 14,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            bodyStyle={{ flex: 1, padding: 0 }}
          >
            <Table
              dataSource={boardData?.recent_dossiers || []}
              columns={columns}
              rowKey="dossier_code"
              pagination={false}
              size="middle"
              loading={loading}
              locale={{ emptyText: 'Chưa có hồ sơ phát sinh hôm nay' }}
            />
          </Card>
        </Col>

        {/* CỘT PHẢI (35%): SỐ THỨ TỰ ĐANG GỌI TẠI CÁC QUẦY */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
            <Card
              bordered={false}
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#b91c1c', fontWeight: 800, fontSize: 15, textTransform: 'uppercase' }}>
                    📢 SỐ THỨ TỰ ĐANG GỌI PHỤC VỤ
                  </span>
                  <Badge count={`Đang chờ: ${m.waiting_queue ?? 0}`} style={{ backgroundColor: '#f59e0b' }} />
                </div>
              }
              style={{
                borderRadius: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1, 2, 3, 4].map((counterNum) => {
                  const counterTicket = (boardData?.active_counters || []).find((t) => t.counter_no === counterNum);
                  const counterNames = {
                    1: 'Quầy 1: Hộ tịch & Khai sinh',
                    2: 'Quầy 2: Chứng thực & Chữ ký',
                    3: 'Quầy 3: Địa chính & Đất đai',
                    4: 'Quầy 4: Lao động - TB&XH',
                  };

                  return (
                    <div
                      key={counterNum}
                      style={{
                        background: counterTicket ? '#fffbeb' : '#f8fafc',
                        border: counterTicket ? '1.5px solid #f59e0b' : '1px dashed #cbd5e1',
                        borderRadius: 10,
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>
                          {counterNames[counterNum]}
                        </div>
                        {counterTicket ? (
                          <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>
                            {counterTicket.citizen_name_masked || 'Đang phục vụ'}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                            Sẵn sàng đón tiếp công dân
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        {counterTicket ? (
                          <div
                            style={{
                              fontSize: 26,
                              fontWeight: 900,
                              color: '#b91c1c',
                              fontFamily: 'monospace',
                              lineHeight: 1,
                            }}
                          >
                            {counterTicket.ticket_number}
                          </div>
                        ) : (
                          <span style={{ fontSize: 18, color: '#cbd5e1', fontWeight: 800 }}>---</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* QUÉT QR TRA CỨU BẰNG ĐIỆN THOẠI */}
            <Card
              bordered={false}
              style={{
                borderRadius: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#fff',
                textAlign: 'center',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              bodyStyle={{ padding: 18 }}
            >
              <div style={{ color: '#fde68a', fontWeight: 700, fontSize: 14, marginBottom: 8, textTransform: 'uppercase' }}>
                📱 Tra cứu tiến độ trên điện thoại
              </div>
              <div
                style={{
                  background: '#ffffff',
                  padding: 8,
                  borderRadius: 10,
                  display: 'inline-block',
                  margin: '6px 0',
                }}
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=2&data=${encodeURIComponent(
                    window.location.origin + '/gov/tra-cuu'
                  )}`}
                  alt="QR Cổng Tra cứu DVC"
                  style={{ width: 100, height: 100, display: 'block' }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                Bật camera quét mã để tra cứu hoặc nộp hồ sơ DVC trực tuyến
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* 4. FOOTER: BĂNG CHỮ CHẠY THÔNG BÁO */}
      <div
        style={{
          marginTop: 14,
          background: 'rgba(0, 0, 0, 0.4)',
          borderTop: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontSize: 12,
          color: '#fef08a',
        }}
      >
        <span style={{ fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', flexShrink: 0 }}>
          🔔 THÔNG BÁO:
        </span>
        <marquee style={{ flex: 1, fontWeight: 500 }}>
          {boardData?.announcement ||
            'Chào mừng Quý công dân đến làm việc tại UBND Phường Yên Bái. Giờ tiếp dân: Buổi sáng 7h30 - 11h30; Buổi chiều 13h30 - 17h00 từ Thứ Hai đến Thứ Sáu. Mọi ý kiến phản ánh xin liên hệ đường dây nóng 0216.3852.xxx.'}
        </marquee>
      </div>
    </div>
  );
}

