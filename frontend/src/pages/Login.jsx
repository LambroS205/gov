import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space, Divider, Tag } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined, BankOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    const success = await login(values.username, values.password);
    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác');
    }
  };

  // Quick fill tài khoản mẫu
  const fillAccount = (username) => {
    form.setFieldsValue({
      username,
      password: 'Admin@123',
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #2a0405 0%, #3b0709 35%, #450a0a 70%, #7f1d1d 100%)',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background circles - Tông vàng ánh kim & đỏ cờ */}
      <div
        style={{
          position: 'absolute',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%)',
          top: -120,
          right: -100,
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(185, 28, 28, 0.25) 0%, transparent 70%)',
          bottom: -60,
          left: -60,
          filter: 'blur(45px)',
        }}
      />

      <Card
        style={{
          width: '100%',
          maxWidth: 490,
          borderRadius: 20,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(245, 158, 11, 0.25)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
        }}
        bodyStyle={{ padding: '36px 32px' }}
      >
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {/* Quốc hiệu Tiêu ngữ */}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', letterSpacing: '0.8px', marginBottom: 12 }}>
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            <div style={{ fontSize: 10, color: '#d97706', fontWeight: 600, letterSpacing: '0.5px', marginTop: 1 }}>
              Độc lập - Tự do - Hạnh phúc
            </div>
          </div>

          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
              border: '2px solid #f59e0b',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              marginBottom: 12,
              boxShadow: '0 8px 20px rgba(185, 28, 28, 0.4), 0 0 12px rgba(245, 158, 11, 0.3)',
            }}
          >
            ⭐
          </div>
          <Title level={3} style={{ margin: '0 0 4px 0', color: '#7f1d1d', fontWeight: 800 }}>
            UBND PHƯỜNG YÊN BÁI
          </Title>
          <Text style={{ fontSize: 13, color: '#b45309', fontWeight: 600, letterSpacing: '0.4px' }}>
            HỆ THỐNG MỘT CỬA ĐIỆN TỬ & QUẢN TRỊ HÀNH CHÍNH SỐ
          </Text>
        </div>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 20, borderRadius: 8, borderColor: '#fecaca', background: '#fef2f2' }}
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleFinish} requiredMark={false}>
          <Form.Item
            name="username"
            label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Tên đăng nhập cán bộ</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#b91c1c' }} />}
              placeholder="Ví dụ: admin, motcua_lan, lanhdao_hai"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Mật khẩu công vụ</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#b91c1c' }} />}
              placeholder="Nhập mật khẩu an toàn"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{
              height: 48,
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 15,
              background: 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)',
              border: '1px solid #7f1d1d',
              boxShadow: '0 4px 14px rgba(185, 28, 28, 0.4)',
              marginTop: 8,
            }}
          >
            Đăng nhập hệ thống hành chính
          </Button>
        </Form>

        {/* Nút đăng nhập nhanh cho các vai trò kiểm thử */}
        <Divider style={{ margin: '20px 0 16px 0', fontSize: 12, color: '#94a3b8' }}>
          Tài khoản mẫu kiểm thử công vụ
        </Divider>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          <Tag
            color="red"
            style={{ cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
            onClick={() => fillAccount('admin')}
          >
            👑 Quản trị viên (admin)
          </Tag>
          <Tag
            color="orange"
            style={{ cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
            onClick={() => fillAccount('motcua_lan')}
          >
            📥 Một cửa (motcua_lan)
          </Tag>
          <Tag
            color="volcano"
            style={{ cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
            onClick={() => fillAccount('chuyenvien_tuan')}
          >
            📋 Chuyên viên (chuyenvien_tuan)
          </Tag>
          <Tag
            color="gold"
            style={{ cursor: 'pointer', padding: '4px 8px', fontWeight: 600 }}
            onClick={() => fillAccount('lanhdao_hai')}
          >
            ✍️ Lãnh đạo ký số (lanhdao_hai)
          </Tag>
        </div>
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#64748b' }}>
          Mật khẩu mặc định: <code style={{ fontWeight: 700, color: '#b91c1c' }}>Admin@123</code>
        </div>

        <Divider style={{ margin: '18px 0 14px 0' }} />

        {/* Nút dành cho công dân */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button
            type="primary"
            icon={<UserOutlined />}
            onClick={() => navigate('/cong-dan/dang-nhap')}
            style={{
              borderRadius: 8,
              fontWeight: 700,
              background: '#b91c1c',
              borderColor: '#7f1d1d',
              height: 40,
            }}
          >
            Đăng nhập Tài khoản Công dân
          </Button>
          <Button
            type="default"
            icon={<SearchOutlined style={{ color: '#b91c1c' }} />}
            onClick={() => navigate('/tra-cuu')}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              color: '#b91c1c',
              borderColor: '#fca5a5',
              background: '#fef2f2',
            }}
          >
            Dành cho Công dân: Tra cứu tiến độ hồ sơ
          </Button>
        </div>

        {/* Thông tin an toàn */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 12,
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 11,
            color: '#94a3b8',
          }}
        >
          <SafetyCertificateOutlined style={{ color: '#15803d' }} />
          <span>Hệ thống đạt tiêu chuẩn An toàn thông tin Cấp độ 2 (Nghị định 85/2016/NĐ-CP)</span>
        </div>
      </Card>
    </div>
  );
}
