import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Dropdown,
  Avatar,
  Badge,
  Space,
  Typography,
  Tag,
  Drawer,
} from 'antd';
import {
  HomeOutlined,
  FolderOpenOutlined,
  CommentOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  MenuOutlined,
  FormOutlined,
  SearchOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useCitizenAuth } from '../contexts/CitizenAuthContext';
import { citizenPortalApi } from '../api/portalClient';

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

export default function CitizenLayout() {
  const { citizen, logout } = useCitizenAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    citizenPortalApi
      .summary()
      .then((res) => {
        if (res?.data?.notification_count) {
          setUnreadNotifications(res.data.notification_count);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const navItems = [
    {
      key: '/cong-dan',
      icon: <HomeOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/cong-dan/ho-so',
      icon: <FolderOpenOutlined />,
      label: 'Hồ sơ của tôi',
    },
    {
      key: '/cong-dan/phan-anh',
      icon: <CommentOutlined />,
      label: 'Phản ánh của tôi',
    },
    {
      key: '/cong-dan/thong-bao',
      icon: (
        <Badge count={unreadNotifications} size="small" offset={[6, -2]}>
          <BellOutlined />
        </Badge>
      ),
      label: 'Thông báo',
    },
    {
      key: '/tra-cuu',
      icon: <FormOutlined />,
      label: 'Nộp hồ sơ trực tuyến',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    setMobileMenuOpen(false);
  };

  const userMenuItems = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 700, color: '#7f1d1d', fontSize: 14 }}>
            {citizen?.full_name}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            CCCD: {citizen?.cccd_number ? `${citizen.cccd_number.slice(0, 4)}****${citizen.cccd_number.slice(-4)}` : ''}
          </div>
          {citizen?.phone_verified_at ? (
            <Tag color="success" style={{ marginTop: 4, fontSize: 11 }}>
              ✓ Đã xác thực SĐT
            </Tag>
          ) : (
            <Tag color="warning" style={{ marginTop: 4, fontSize: 11 }}>
              Chưa xác thực SĐT
            </Tag>
          )}
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: '/cong-dan/tai-khoan',
      icon: <UserOutlined />,
      label: 'Hồ sơ & Đổi mật khẩu',
      onClick: () => navigate('/cong-dan/tai-khoan'),
    },
    {
      key: '/tra-cuu',
      icon: <SearchOutlined />,
      label: 'Cổng tra cứu DVC công cộng',
      onClick: () => navigate('/tra-cuu'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined style={{ color: '#dc2626' }} />,
      label: <span style={{ color: '#dc2626', fontWeight: 600 }}>Đăng xuất</span>,
      onClick: () => {
        logout();
        navigate('/cong-dan/dang-nhap');
      },
    },
  ];

  // Xác định active key của menu
  let currentKey = location.pathname;
  if (currentKey.startsWith('/cong-dan/ho-so')) currentKey = '/cong-dan/ho-so';
  else if (currentKey.startsWith('/cong-dan/phan-anh')) currentKey = '/cong-dan/phan-anh';
  else if (currentKey.startsWith('/cong-dan/thong-bao')) currentKey = '/cong-dan/thong-bao';
  else if (currentKey.startsWith('/cong-dan/tai-khoan')) currentKey = '';

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* 1. Quốc hiệu Tiêu ngữ chuẩn Nhà nước */}
      <div
        style={{
          background: '#7f1d1d',
          color: '#fef3c7',
          padding: '6px 16px',
          fontSize: 11,
          textAlign: 'center',
          letterSpacing: '0.6px',
          fontWeight: 600,
          borderBottom: '1px solid #b45309',
        }}
      >
        <span>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — ĐỘC LẬP - TỰ DO - HẠNH PHÚC</span>
        <span style={{ marginLeft: 16, color: '#fde68a', display: 'inline-block' }}>
          • CỔNG DỊCH VỤ CÔNG & HÀNH CHÍNH SỐ UBND PHƯỜNG YÊN BÁI
        </span>
      </div>

      {/* 2. Header chính của Cổng Công dân */}
      <Header
        style={{
          background: '#ffffff',
          padding: '0 24px',
          height: 68,
          lineHeight: '68px',
          borderBottom: '1px solid #f1f5f9',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Logo & Tiêu đề */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          onClick={() => navigate('/cong-dan')}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
              border: '2px solid #f59e0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 4px 10px rgba(185, 28, 28, 0.3)',
            }}
          >
            ⭐
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#7f1d1d', lineHeight: 1.2 }}>
              CỔNG CÔNG DÂN
            </div>
            <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600, letterSpacing: '0.3px' }}>
              UBND Phường Yên Bái
            </div>
          </div>
        </div>

        {/* Menu Điều hướng Desktop */}
        <div style={{ flex: 1, maxWidth: 620, margin: '0 24px', display: 'none' }} className="desktop-menu-wrapper">
          <Menu
            mode="horizontal"
            selectedKeys={[currentKey]}
            items={navItems}
            onClick={handleMenuClick}
            style={{
              borderBottom: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          />
        </div>

        <style>{`
          @media (min-width: 900px) {
            .desktop-menu-wrapper { display: block !important; }
            .mobile-menu-trigger { display: none !important; }
          }
        `}</style>

        {/* User Info & Actions */}
        <Space size="middle">
          {citizen ? (
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: 24,
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                }}
              >
                <Avatar
                  style={{
                    backgroundColor: '#b91c1c',
                    color: '#ffffff',
                    fontWeight: 700,
                  }}
                >
                  {citizen.full_name?.charAt(0) || 'C'}
                </Avatar>
                <div style={{ display: 'none', textAlign: 'left' }} className="desktop-menu-wrapper">
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#450a0a', lineHeight: 1.2 }}>
                    {citizen.full_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#991b1b' }}>
                    Tài khoản công dân
                  </div>
                </div>
              </div>
            </Dropdown>
          ) : (
            <Space>
              <Button type="primary" onClick={() => navigate('/cong-dan/dang-nhap')}>
                Đăng nhập
              </Button>
            </Space>
          )}

          {/* Nút Hamburger menu Mobile */}
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 20, color: '#7f1d1d' }} />}
            className="mobile-menu-trigger"
            onClick={() => setMobileMenuOpen(true)}
          />
        </Space>
      </Header>

      {/* Drawer menu Mobile */}
      <Drawer
        title="Menu Cổng Dịch vụ công dân"
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '16px', background: '#fef2f2', borderBottom: '1px solid #fee2e2' }}>
          <div style={{ fontWeight: 700, color: '#7f1d1d', fontSize: 15 }}>
            {citizen?.full_name}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            CCCD: {citizen?.cccd_number}
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          items={navItems}
          onClick={handleMenuClick}
          style={{ borderRight: 'none' }}
        />
        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9' }}>
          <Button
            danger
            block
            icon={<LogoutOutlined />}
            onClick={() => {
              setMobileMenuOpen(false);
              logout();
              navigate('/cong-dan/dang-nhap');
            }}
          >
            Đăng xuất
          </Button>
        </div>
      </Drawer>

      {/* 3. Nội dung trang con */}
      <Content style={{ padding: '24px 16px', maxWidth: 1120, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>

      {/* 4. Footer chuẩn Cổng Dịch vụ công Cấp Phường */}
      <Footer
        style={{
          background: '#ffffff',
          borderTop: '1px solid #f1f5f9',
          padding: '24px 16px',
          color: '#64748b',
          fontSize: 13,
          textAlign: 'center',
          marginTop: 'auto',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ fontWeight: 700, color: '#7f1d1d', fontSize: 14, marginBottom: 4 }}>
            ỦY BAN NHÂN DÂN PHƯỜNG YÊN BÁI • THÀNH PHỐ YÊN BÁI
          </div>
          <div>
            Bộ phận Tiếp nhận & Trả kết quả Một cửa: Số 123 Đường Nguyễn Thái Học, TP. Yên Bái
          </div>
          <div style={{ marginTop: 4 }}>
            Tổng đài hỗ trợ công dân: <strong>0216.3852.123</strong> — Email:{' '}
            <a href="mailto:motcua.yenbai@yenbai.gov.vn" style={{ color: '#b91c1c' }}>
              motcua.yenbai@yenbai.gov.vn
            </a>
          </div>
          <div
            style={{
              marginTop: 12,
              paddingTop: 8,
              borderTop: '1px dashed #e2e8f0',
              fontSize: 11,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <SafetyCertificateOutlined style={{ color: '#15803d' }} />
            <span>
              Hệ thống đáp ứng Tiêu chuẩn An toàn thông tin Cấp độ 2 (NĐ 85/2016) & Đề án 06 Quốc gia
            </span>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
