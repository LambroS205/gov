import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Divider, Tag, Space } from 'antd';
import {
  IdcardOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined,
  UserAddOutlined,
  SearchOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';

const { Title, Text, Paragraph } = Typography;

export default function CitizenLogin() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useCitizenAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    const success = await login(values.identifier, values.password);
    setLoading(false);
    if (success) {
      navigate('/cong-dan');
    } else {
      setErrorMsg('Số CCCD / Số điện thoại hoặc mật khẩu không chính xác');
    }
  };

  const fillDemoAccount = () => {
    form.setFieldsValue({
      identifier: '015088006677',
      password: 'Congdan@123',
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 40%, #991b1b 75%, #b91c1c 100%)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Hiệu ứng nền ánh vàng & cờ đỏ */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)',
          top: -120,
          right: -80,
          filter: 'blur(50px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.35) 0%, transparent 70%)',
          bottom: -80,
          left: -80,
          filter: 'blur(45px)',
        }}
      />

      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 20,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(245, 158, 11, 0.3)',
          border: '1.5px solid rgba(245, 158, 11, 0.4)',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
        }}
        bodyStyle={{ padding: '36px 32px' }}
      >
        {/* Header Quốc hiệu / Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', letterSpacing: '0.8px', marginBottom: 10 }}>
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
              boxShadow: '0 8px 20px rgba(185, 28, 28, 0.35)',
            }}
          >
            ⭐
          </div>
          <Title level={3} style={{ margin: '0 0 4px 0', color: '#7f1d1d', fontWeight: 800 }}>
            CỔNG CÔNG DÂN ĐIỆN TỬ
          </Title>
          <Text style={{ fontSize: 13, color: '#b45309', fontWeight: 600 }}>
            Ủy ban Nhân dân Phường Yên Bái
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
            name="identifier"
            label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Số CCCD hoặc Số điện thoại</span>}
            rules={[{ required: true, message: 'Vui lòng nhập Số CCCD hoặc Số điện thoại' }]}
          >
            <Input
              prefix={<IdcardOutlined style={{ color: '#b91c1c' }} />}
              placeholder="Nhập 12 số CCCD hoặc SĐT đăng ký"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontWeight: 600, color: '#450a0a' }}>Mật khẩu</span>
                <Link to="/cong-dan/quen-mat-khau" style={{ color: '#b91c1c', fontSize: 12, fontWeight: 500 }}>
                  Quên mật khẩu?
                </Link>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#b91c1c' }} />}
              placeholder="Nhập mật khẩu tài khoản"
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
              marginTop: 4,
            }}
          >
            Đăng nhập Cổng Công dân <ArrowRightOutlined />
          </Button>
        </Form>

        {/* Nút đăng nhập tài khoản mẫu demo */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Tag
            color="red"
            style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 12, borderRadius: 6, fontWeight: 600 }}
            onClick={fillDemoAccount}
          >
            👤 Nhập nhanh tài khoản mẫu: <strong>Lê Văn Cường (015088006677)</strong>
          </Tag>
        </div>

        <Divider style={{ margin: '22px 0 16px 0', fontSize: 13, color: '#94a3b8' }}>
          Chưa có tài khoản công dân?
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Button
            type="default"
            icon={<UserAddOutlined style={{ color: '#b91c1c' }} />}
            size="large"
            block
            onClick={() => navigate('/cong-dan/dang-ky')}
            style={{
              borderRadius: 8,
              fontWeight: 600,
              color: '#b91c1c',
              borderColor: '#fca5a5',
              background: '#fef2f2',
            }}
          >
            Đăng ký tài khoản công dân mới
          </Button>
        </div>

        {/* Điều hướng khác */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Space split={<span style={{ color: '#cbd5e1' }}>•</span>} size="small">
            <Link to="/tra-cuu" style={{ color: '#64748b', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <SearchOutlined /> Tra cứu ẩn danh
            </Link>
            <Link to="/login" style={{ color: '#64748b', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <BankOutlined /> Đăng nhập Cán bộ
            </Link>
          </Space>
        </div>

        {/* An toàn thông tin */}
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
          <span>Bảo mật dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP</span>
        </div>
      </Card>
    </div>
  );
}
