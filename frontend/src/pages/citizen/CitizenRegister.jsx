import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Select, Checkbox, Row, Col, Space } from 'antd';
import {
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  LockOutlined,
  MailOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function CitizenRegister() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { register } = useCitizenAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleFinish = async (values) => {
    setLoading(true);
    setErrorMsg('');
    const success = await register({
      full_name: values.full_name,
      cccd_number: values.cccd_number,
      phone_number: values.phone_number,
      password: values.password,
      email: values.email || '',
      gender: values.gender || 'NAM',
      address: values.address || '',
    });
    setLoading(false);
    if (success) {
      navigate('/cong-dan');
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
          maxWidth: 620,
          borderRadius: 20,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)',
          border: '1.5px solid rgba(245, 158, 11, 0.35)',
          background: 'rgba(255, 255, 255, 0.98)',
        }}
        bodyStyle={{ padding: '36px 32px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', letterSpacing: '0.8px', marginBottom: 8 }}>
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            <div style={{ fontSize: 10, color: '#d97706', fontWeight: 600, letterSpacing: '0.4px', marginTop: 1 }}>
              Độc lập - Tự do - Hạnh phúc
            </div>
          </div>

          <Title level={3} style={{ margin: '0 0 4px 0', color: '#7f1d1d', fontWeight: 800 }}>
            ĐĂNG KÝ TÀI KHOẢN CÔNG DÂN
          </Title>
          <Text style={{ fontSize: 13, color: '#b45309', fontWeight: 600 }}>
            Hệ thống Một cửa điện tử & Quản trị Hành chính Số Phường Yên Bái
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

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ gender: 'NAM' }}
          requiredMark="optional"
        >
          <Form.Item
            name="full_name"
            label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Họ và tên (theo CCCD)</span>}
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#b91c1c' }} />}
              placeholder="Ví dụ: Nguyễn Văn An"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="cccd_number"
                label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Số CCCD (12 chữ số)</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập số CCCD' },
                  { pattern: /^\d{12}$/, message: 'Số CCCD phải gồm đúng 12 chữ số' },
                ]}
              >
                <Input
                  prefix={<IdcardOutlined style={{ color: '#b91c1c' }} />}
                  placeholder="0150..."
                  maxLength={12}
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="phone_number"
                label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Số điện thoại chính chủ</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^0\d{9}$/, message: 'Số điện thoại gồm 10 số bắt đầu bằng 0' },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#b91c1c' }} />}
                  placeholder="09..."
                  maxLength={10}
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="password"
                label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Mật khẩu</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 8, message: 'Mật khẩu phải có tối thiểu 8 ký tự' },
                  {
                    validator: (_, value) => {
                      if (!value || (/[a-zA-Z]/.test(value) && /[0-9]/.test(value))) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu phải bao gồm cả chữ và số'));
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
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="confirm_password"
                label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Nhập lại mật khẩu</span>}
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng nhập lại mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#b91c1c' }} />}
                  placeholder="Khớp với mật khẩu trên"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={14}>
              <Form.Item
                name="email"
                label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Email nhận thông báo (Không bắt buộc)</span>}
                rules={[{ type: 'email', message: 'Địa chỉ email không hợp lệ' }]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#b91c1c' }} />}
                  placeholder="congdan@gmail.com"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={10}>
              <Form.Item
                name="gender"
                label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Giới tính</span>}
              >
                <Select size="large" style={{ borderRadius: 8 }}>
                  <Option value="NAM">Nam</Option>
                  <Option value="NU">Nữ</Option>
                  <Option value="KHAC">Khác</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label={<span style={{ fontWeight: 600, color: '#450a0a' }}>Địa chỉ thường trú / Nơi ở hiện tại</span>}
          >
            <Input
              prefix={<HomeOutlined style={{ color: '#b91c1c' }} />}
              placeholder="Số nhà, đường phố, TDP, Phường Yên Bái"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="terms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('Vui lòng đồng ý với điều khoản sử dụng')),
              },
            ]}
          >
            <Checkbox style={{ fontSize: 12, color: '#475569' }}>
              Tôi cam đoan các thông tin kê khai trên là hoàn toàn chính xác và đồng ý với Quy chế xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP của Chính phủ.
            </Checkbox>
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
            Tạo tài khoản & Kích hoạt ngay
          </Button>
        </Form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Space>
            <span style={{ color: '#64748b', fontSize: 13 }}>Đã có tài khoản?</span>
            <Link to="/cong-dan/dang-nhap" style={{ color: '#b91c1c', fontWeight: 700, fontSize: 13 }}>
              Đăng nhập ngay
            </Link>
          </Space>
        </div>

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
          <span>Hệ thống tự động liên kết các hồ sơ cũ có cùng số CCCD sau khi đăng ký</span>
        </div>
      </Card>
    </div>
  );
}
