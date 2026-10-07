import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Tag, Modal, Form, Input, message } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  FormOutlined,
  AuditOutlined,
  TeamOutlined,
  AlertOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  KeyOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../api/client';
import dayjs from 'dayjs';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm] = Form.useForm();
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleLabels = {
    ADMIN: { label: 'Quản trị viên', color: 'red' },
    MOT_CUA: { label: 'Cán bộ Một cửa', color: 'blue' },
    CHUYEN_VIEN: { label: 'Chuyên viên thụ lý', color: 'cyan' },
    LANH_DAO: { label: 'Lãnh đạo UBND Phường', color: 'gold' },
    VAN_THU: { label: 'Văn thư số', color: 'purple' },
  };

  const userRole = roleLabels[user?.role] || { label: user?.role, color: 'default' };

  // Menu định tuyến hệ thống
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng quan hệ thống',
    },
    {
      key: 'sub-mot-cua',
      icon: <FileTextOutlined />,
      label: 'Một cửa & Tiếp nhận',
      children: [
        { key: '/applications', label: 'Danh sách hồ sơ TTHC' },
        { key: '/applications/create', label: 'Tiếp nhận hồ sơ mới' },
        { key: '/tra-cuu', label: 'Tra cứu tiến độ hồ sơ' },
      ],
    },
    {
      key: 'sub-chuyen-mon',
      icon: <FormOutlined />,
      label: 'Xử lý chuyên môn',
      children: [
        { key: '/processing/queue', label: 'Hàng đợi thụ lý' },
        { key: '/approval/pending', label: 'Hồ sơ chờ phê duyệt', hidden: !hasRole(['ADMIN', 'LANH_DAO']) },
      ].filter((i) => !i.hidden),
    },
    {
      key: 'sub-dan-cu',
      icon: <TeamOutlined />,
      label: 'Quản lý Dân cư',
      children: [
        { key: '/citizens', label: 'Danh bạ nhân khẩu' },
        { key: '/areas', label: 'Tổ dân phố & Địa bàn' },
      ],
    },
    {
      key: '/complaints',
      icon: <AlertOutlined />,
      label: 'Phản ánh - Kiến nghị',
    },
    {
      key: 'sub-bao-cao',
      icon: <BarChartOutlined />,
      label: 'Báo cáo & Thống kê',
      children: [
        { key: '/reports/performance', label: 'Chỉ số hiệu suất (KPI)' },
        { key: '/reports/procedures', label: 'Thống kê theo thủ tục' },
      ],
    },
    {
      key: 'sub-quan-tri',
      icon: <SettingOutlined />,
      label: 'Quản trị hệ thống',
      hidden: !hasRole(['ADMIN']),
      children: [
        { key: '/admin/users', label: 'Quản lý Cán bộ công chức' },
        { key: '/admin/procedures', label: 'Danh mục Thủ tục hành chính' },
        { key: '/admin/departments', label: 'Đơn vị / Phòng ban' },
        { key: '/admin/audit-logs', label: 'Nhật ký kiểm toán (Audit)' },
      ],
    },
  ].filter((item) => !item.hidden);

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleChangePassword = async (values) => {
    setSubmittingPassword(true);
    try {
      await authApi.changePassword(values);
      message.success('Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới');
      setIsPasswordModalOpen(false);
      passwordForm.resetFields();
    } catch {
      // Đã thông báo lỗi trong interceptor
    } finally {
      setSubmittingPassword(false);
    }
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: (
          <div>
            <div style={{ fontWeight: 600 }}>{user?.full_name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{user?.dept_name}</div>
          </div>
        ),
      },
      { type: 'divider' },
      {
        key: 'tracking',
        icon: <SearchOutlined />,
        label: 'Tra cứu tiến độ hồ sơ',
        onClick: () => navigate('/tra-cuu'),
      },
      {
        key: 'password',
        icon: <KeyOutlined />,
        label: 'Đổi mật khẩu',
        onClick: () => setIsPasswordModalOpen(true),
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        danger: true,
        label: 'Đăng xuất khỏi hệ thống',
        onClick: logout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar điều hướng */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={260}
        style={{
          boxShadow: '3px 0 12px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? 0 : '0 16px',
            gap: 12,
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            background: 'linear-gradient(180deg, rgba(69, 10, 10, 0.6) 0%, rgba(41, 4, 5, 0.8) 100%)',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
              border: '1.5px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              boxShadow: '0 2px 10px rgba(245, 158, 11, 0.4)',
              flexShrink: 0,
            }}
          >
            ⭐
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ color: '#ffffff', fontWeight: 800, fontSize: 13, letterSpacing: '0.3px', lineHeight: 1.2 }}>
                UBND PHƯỜNG YÊN BÁI
              </div>
              <div style={{ color: '#fde68a', fontSize: 11, fontWeight: 500, letterSpacing: '0.4px', marginTop: 2, lineHeight: 1.2 }}>
                Một cửa & Dịch vụ Công Số
              </div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['sub-mot-cua', 'sub-chuyen-mon']}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ marginTop: 8 }}
        />
      </Sider>

      <Layout>
        {/* Header trên cùng */}
        <Header
          style={{
            background: 'var(--bg-header)',
            backdropFilter: 'blur(10px)',
            borderBottom: '2px solid #fed7aa',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            height: 68,
            minHeight: 68,
            lineHeight: 'normal',
          }}
        >
          <div className="header-container">
            <div className="header-left">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: 18,
                  color: '#b91c1c',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: 'rgba(185, 28, 28, 0.08)',
                  border: '1px solid rgba(185, 28, 28, 0.15)',
                  flexShrink: 0,
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
              <div className="header-title-box">
                <div className="header-title">
                  <BankOutlined style={{ fontSize: 18, color: '#b91c1c', flexShrink: 0 }} />
                  <span>HỆ THỐNG MỘT CỬA ĐIỆN TỬ VÀ QUẢN TRỊ HÀNH CHÍNH SỐ</span>
                </div>
                <div className="header-motto">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập • Tự do • Hạnh phúc
                </div>
              </div>
            </div>

            <Space size="large" align="center" style={{ flexShrink: 0 }}>
              <div className="header-system-info">
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.3, fontWeight: 500 }}>
                  Hôm nay, {dayjs().format('dddd, DD/MM/YYYY')}
                </div>
                <Tag color="red" style={{ margin: '3px 0 0 0', fontSize: 11, fontWeight: 600, lineHeight: '18px' }}>
                  Cấp độ 2 • An toàn thông tin
                </Tag>
              </div>

              <Dropdown menu={userMenu} placement="bottomRight" arrow>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    padding: '5px 14px',
                    borderRadius: 24,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <Avatar
                    style={{
                      background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
                      border: '1px solid #f59e0b',
                      verticalAlign: 'middle',
                      flexShrink: 0,
                    }}
                    icon={<UserOutlined />}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#7f1d1d', lineHeight: 1.2 }}>
                      {user?.full_name}
                    </div>
                    <Tag
                      color="gold"
                      style={{
                        margin: '2px 0 0 0',
                        fontSize: 10,
                        padding: '0 4px',
                        fontWeight: 600,
                        width: 'fit-content',
                        lineHeight: '16px',
                      }}
                    >
                      {userRole.label}
                    </Tag>
                  </div>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>

        {/* Nội dung trang */}
        <Content
          style={{
            margin: '20px 24px',
            minHeight: 280,
          }}
        >
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </Content>
      </Layout>

      {/* Modal Đổi mật khẩu */}
      <Modal
        title="Đổi mật khẩu tài khoản cán bộ"
        open={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="old_password"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
          >
            <Input.Password placeholder="Nhập mật khẩu đang dùng" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="Mật khẩu mới (Tối thiểu 8 ký tự)"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải có từ 8 ký tự trở lên' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới an toàn" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Xác nhận mật khẩu mới"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
            <Button onClick={() => setIsPasswordModalOpen(false)}>Hủy bỏ</Button>
            <Button type="primary" htmlType="submit" loading={submittingPassword}>
              Cập nhật mật khẩu
            </Button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
}
