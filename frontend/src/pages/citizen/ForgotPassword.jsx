import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Steps, Result, Space, Tag } from 'antd';
import {
  IdcardOutlined,
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { citizenAuthApi } from '../../api/portalClient';

const { Title, Text, Paragraph } = Typography;

export default function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [phoneInfo, setPhoneInfo] = useState({ phone: '', masked: '', demoCode: null });
  const navigate = useNavigate();
  const [formStep1] = Form.useForm();
  const [formStep2] = Form.useForm();

  // Bước 1: Yêu cầu OTP
  const handleRequestOtp = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await citizenAuthApi.forgotPassword({ identifier: values.identifier });
      if (res?.data) {
        setPhoneInfo({
          phone: res.data.phone_number || values.identifier,
          masked: res.data.phone_masked || values.identifier,
          demoCode: res.data.demo_code || null,
        });
        setCurrentStep(1);
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Có lỗi khi gửi yêu cầu mã OTP');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Nhập OTP & Đặt lại mật khẩu
  const handleResetPassword = async (values) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await citizenAuthApi.resetPassword({
        phone_number: phoneInfo.phone,
        otp_code: values.otp_code,
        new_password: values.new_password,
      });
      setCurrentStep(2);
    } catch (err) {
      setErrorMsg(err?.message || 'Mã OTP hoặc thông tin không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 40%, #991b1b 75%, #b91c1c 100%)',
        padding: '32px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 20,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          background: 'rgba(255, 255, 255, 0.98)',
        }}
        bodyStyle={{ padding: '36px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ margin: '0 0 4px 0', color: '#7f1d1d', fontWeight: 800 }}>
            KHÔI PHỤC MẬT KHẨU
          </Title>
          <Text style={{ fontSize: 13, color: '#b45309', fontWeight: 600 }}>
            Ủy ban Nhân dân Phường Yên Bái
          </Text>
        </div>

        <Steps
          current={currentStep}
          size="small"
          style={{ marginBottom: 28 }}
          items={[
            { title: 'Thông tin' },
            { title: 'Xác thực OTP' },
            { title: 'Hoàn tất' },
          ]}
        />

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            style={{ marginBottom: 20, borderRadius: 8, borderColor: '#fecaca', background: '#fef2f2' }}
          />
        )}

        {/* BƯỚC 1: NHẬP CCCD / SĐT */}
        {currentStep === 0 && (
          <Form form={formStep1} layout="vertical" onFinish={handleRequestOtp}>
            <Paragraph style={{ color: '#475569', fontSize: 13, marginBottom: 20 }}>
              Vui lòng nhập Số CCCD hoặc Số điện thoại đã đăng ký để hệ thống gửi mã xác thực OTP.
            </Paragraph>

            <Form.Item
              name="identifier"
              label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Số CCCD hoặc Số điện thoại</span>}
              rules={[{ required: true, message: 'Vui lòng nhập số CCCD hoặc SĐT' }]}
            >
              <Input
                prefix={<IdcardOutlined style={{ color: '#b91c1c' }} />}
                placeholder="Ví dụ: 015088006677 hoặc 0966554433"
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
                marginTop: 8,
              }}
            >
              Tiếp tục gửi mã OTP
            </Button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <Link to="/cong-dan/dang-nhap" style={{ color: '#64748b', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeftOutlined /> Quay lại Đăng nhập
              </Link>
            </div>
          </Form>
        )}

        {/* BƯỚC 2: NHẬP MÃ OTP & MẬT KHẨU MỚI */}
        {currentStep === 1 && (
          <Form form={formStep2} layout="vertical" onFinish={handleResetPassword}>
            <Alert
              message={`Mã OTP đã được gửi đến số điện thoại: ${phoneInfo.masked}`}
              type="info"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
            />

            {phoneInfo.demoCode && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Tag
                  color="warning"
                  style={{ cursor: 'pointer', padding: '6px 14px', fontSize: 12, borderRadius: 6, fontWeight: 700 }}
                  onClick={() => formStep2.setFieldsValue({ otp_code: phoneInfo.demoCode })}
                >
                  🔔 [Môi trường thử nghiệm] Mã OTP của bạn là: <strong>{phoneInfo.demoCode}</strong> (Bấm để điền)
                </Tag>
              </div>
            )}

            <Form.Item
              name="otp_code"
              label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Mã OTP (6 chữ số)</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập mã OTP' },
                { pattern: /^\d{6}$/, message: 'Mã OTP gồm đúng 6 chữ số' },
              ]}
            >
              <Input
                prefix={<KeyOutlined style={{ color: '#b91c1c' }} />}
                placeholder="123456"
                maxLength={6}
                size="large"
                style={{ borderRadius: 8, letterSpacing: '4px', textAlign: 'center', fontSize: 18, fontWeight: 700 }}
              />
            </Form.Item>

            <Form.Item
              name="new_password"
              label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Mật khẩu mới</span>}
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 8, message: 'Mật khẩu phải có tối thiểu 8 ký tự' },
                {
                  validator: (_, value) => {
                    if (!value || (/[a-zA-Z]/.test(value) && /[0-9]/.test(value))) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu phải có cả chữ và số'));
                  },
                },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#b91c1c' }} />}
                placeholder="Tối thiểu 8 ký tự (chữ + số)"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              name="confirm_password"
              label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Xác nhận mật khẩu mới</span>}
              dependencies={['new_password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#b91c1c' }} />}
                placeholder="Khớp với mật khẩu mới trên"
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
                marginTop: 8,
              }}
            >
              Xác thực OTP & Đổi mật khẩu
            </Button>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button type="link" onClick={() => setCurrentStep(0)} style={{ color: '#64748b', fontSize: 13 }}>
                ← Gửi lại mã hoặc đổi số điện thoại
              </Button>
            </div>
          </Form>
        )}

        {/* BƯỚC 3: KẾT QUẢ THÀNH CÔNG */}
        {currentStep === 2 && (
          <Result
            status="success"
            title={<span style={{ color: '#15803d', fontWeight: 800 }}>ĐẶT LẠI MẬT KHẨU THÀNH CÔNG</span>}
            subTitle="Mật khẩu tài khoản công dân của bạn đã được cập nhật an toàn. Bạn có thể sử dụng mật khẩu mới này để đăng nhập ngay."
            extra={[
              <Button
                type="primary"
                key="login"
                size="large"
                onClick={() => navigate('/cong-dan/dang-nhap')}
                style={{
                  height: 44,
                  borderRadius: 8,
                  fontWeight: 700,
                  background: '#b91c1c',
                  borderColor: '#7f1d1d',
                  padding: '0 28px',
                }}
              >
                Đăng nhập Cổng Công dân ngay
              </Button>,
            ]}
          />
        )}
      </Card>
    </div>
  );
}
