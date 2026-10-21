import React, { useState } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  Alert,
  Typography,
  Tag,
  Space,
  message,
  Divider,
} from 'antd';
import {
  UserOutlined,
  IdcardOutlined,
  PhoneOutlined,
  LockOutlined,
  MailOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import { citizenPortalApi } from '../../api/portalClient';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export default function Profile() {
  const { citizen, refreshCitizen } = useCitizenAuth();

  // Tab 1: Profile update
  const [profileForm] = Form.useForm();
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Tab 2: Change password
  const [passForm] = Form.useForm();
  const [changingPass, setChangingPass] = useState(false);

  // Tab 3: Phone verify
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState(null);
  const [otpForm] = Form.useForm();

  const handleUpdateProfile = async (values) => {
    setUpdatingProfile(true);
    try {
      const res = await citizenPortalApi.updateProfile(values);
      message.success(res?.message || 'Cập nhật thông tin cá nhân thành công');
      await refreshCitizen();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (values) => {
    setChangingPass(true);
    try {
      await citizenPortalApi.changePassword(values);
      message.success('Đổi mật khẩu tài khoản thành công!');
      passForm.resetFields();
    } catch (err) {
      console.error(err);
    } finally {
      setChangingPass(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    setSendingOtp(true);
    try {
      const res = await citizenPortalApi.sendPhoneOtp();
      message.success(res?.message || 'Đã gửi mã OTP đến số điện thoại');
      setOtpSent(true);
      if (res?.data?.demo_code) {
        setDemoCode(res.data.demo_code);
        otpForm.setFieldsValue({ otp_code: res.data.demo_code });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyPhone = async (values) => {
    setVerifyingOtp(true);
    try {
      await citizenPortalApi.verifyPhone({ otp_code: values.otp_code });
      message.success('Xác thực số điện thoại thành công!');
      setOtpSent(false);
      setDemoCode(null);
      await refreshCitizen();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#7f1d1d', fontWeight: 800 }}>
          HỒ SƠ CÔNG DÂN & THIẾT LẬP TÀI KHOẢN
        </Title>
        <Text style={{ color: '#64748b', fontSize: 13 }}>
          Quản lý thông tin định danh, mật khẩu bảo mật và xác minh số điện thoại
        </Text>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}
        bodyStyle={{ padding: '20px 28px' }}
      >
        <Tabs
          defaultActiveKey="profile"
          items={[
            {
              key: 'profile',
              label: (
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  <UserOutlined /> Thông tin cá nhân
                </span>
              ),
              children: (
                <div style={{ maxWidth: 650, paddingTop: 12 }}>
                  <Form
                    form={profileForm}
                    layout="vertical"
                    initialValues={{
                      full_name: citizen?.full_name,
                      cccd_number: citizen?.cccd_number,
                      phone_number: citizen?.phone_number,
                      email: citizen?.email || '',
                      gender: citizen?.gender || 'NAM',
                      address: citizen?.address || '',
                    }}
                    onFinish={handleUpdateProfile}
                  >
                    <Form.Item
                      name="full_name"
                      label={<span style={{ fontWeight: 600 }}>Họ và tên công dân</span>}
                      rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                      <Input prefix={<UserOutlined style={{ color: '#b91c1c' }} />} size="large" />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="cccd_number"
                          label={<span style={{ fontWeight: 600 }}>Số CCCD (Định danh cố định)</span>}
                        >
                          <Input
                            prefix={<IdcardOutlined style={{ color: '#64748b' }} />}
                            disabled
                            size="large"
                            style={{ background: '#f8fafc', color: '#1e293b', fontWeight: 600 }}
                          />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={12}>
                        <Form.Item
                          name="phone_number"
                          label={
                            <span style={{ fontWeight: 600 }}>
                              Số điện thoại liên hệ{' '}
                              {citizen?.phone_verified_at ? (
                                <Tag color="success" style={{ marginLeft: 6, fontSize: 10 }}>✓ Đã xác thực</Tag>
                              ) : (
                                <Tag color="warning" style={{ marginLeft: 6, fontSize: 10 }}>Chưa xác thực</Tag>
                              )}
                            </span>
                          }
                          rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                        >
                          <Input prefix={<PhoneOutlined style={{ color: '#b91c1c' }} />} size="large" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} sm={14}>
                        <Form.Item
                          name="email"
                          label={<span style={{ fontWeight: 600 }}>Địa chỉ Email</span>}
                          rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                        >
                          <Input prefix={<MailOutlined style={{ color: '#b91c1c' }} />} size="large" />
                        </Form.Item>
                      </Col>

                      <Col xs={24} sm={10}>
                        <Form.Item name="gender" label={<span style={{ fontWeight: 600 }}>Giới tính</span>}>
                          <Select size="large">
                            <Option value="NAM">Nam</Option>
                            <Option value="NU">Nữ</Option>
                            <Option value="KHAC">Khác</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="address"
                      label={<span style={{ fontWeight: 600 }}>Địa chỉ cư trú hiện tại</span>}
                    >
                      <Input prefix={<HomeOutlined style={{ color: '#b91c1c' }} />} size="large" />
                    </Form.Item>

                    <Alert
                      message="Lưu ý khi đổi số điện thoại"
                      description="Nếu Quý công dân thay đổi số điện thoại, trạng thái xác thực SĐT sẽ được đặt lại. Quý công dân sẽ cần xác minh mã OTP cho số điện thoại mới."
                      type="info"
                      showIcon
                      style={{ marginBottom: 20, borderRadius: 8 }}
                    />

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={updatingProfile}
                      style={{
                        background: '#b91c1c',
                        borderColor: '#7f1d1d',
                        fontWeight: 700,
                        padding: '0 28px',
                      }}
                    >
                      Lưu thông tin cá nhân
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: 'password',
              label: (
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  <LockOutlined /> Đổi mật khẩu
                </span>
              ),
              children: (
                <div style={{ maxWidth: 480, paddingTop: 12 }}>
                  <Form form={passForm} layout="vertical" onFinish={handleChangePassword}>
                    <Form.Item
                      name="old_password"
                      label={<span style={{ fontWeight: 600 }}>Mật khẩu hiện tại</span>}
                      rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
                    >
                      <Input.Password prefix={<LockOutlined style={{ color: '#b91c1c' }} />} size="large" />
                    </Form.Item>

                    <Form.Item
                      name="new_password"
                      label={<span style={{ fontWeight: 600 }}>Mật khẩu mới</span>}
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
                      <Input.Password prefix={<LockOutlined style={{ color: '#b91c1c' }} />} size="large" />
                    </Form.Item>

                    <Form.Item
                      name="confirm_password"
                      label={<span style={{ fontWeight: 600 }}>Xác nhận mật khẩu mới</span>}
                      dependencies={['new_password']}
                      rules={[
                        { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
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
                      <Input.Password prefix={<LockOutlined style={{ color: '#b91c1c' }} />} size="large" />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={changingPass}
                      style={{
                        background: '#b91c1c',
                        borderColor: '#7f1d1d',
                        fontWeight: 700,
                        padding: '0 28px',
                      }}
                    >
                      Cập nhật mật khẩu mới
                    </Button>
                  </Form>
                </div>
              ),
            },
            {
              key: 'verify_phone',
              label: (
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  <PhoneOutlined /> Xác minh Số điện thoại
                </span>
              ),
              children: (
                <div style={{ maxWidth: 540, paddingTop: 12 }}>
                  {citizen?.phone_verified_at ? (
                    <Alert
                      message="Số điện thoại của bạn đã được xác thực an toàn"
                      description={`Số điện thoại ${citizen.phone_number} đã được xác minh thành công vào ${citizen.phone_verified_at}. Mọi phản ánh và hồ sơ có số điện thoại này đều được tự động liên kết.`}
                      type="success"
                      showIcon
                      style={{ borderRadius: 10, marginBottom: 20 }}
                    />
                  ) : (
                    <Alert
                      message="Số điện thoại chưa được xác thực"
                      description={`Số điện thoại hiện tại là ${citizen?.phone_number}. Hãy bấm nút bên dưới để nhận mã OTP xác thực, đảm bảo quyền riêng tư và tự động liên kết mọi dữ liệu liên quan.`}
                      type="warning"
                      showIcon
                      style={{ borderRadius: 10, marginBottom: 20 }}
                    />
                  )}

                  {!otpSent ? (
                    <Button
                      type="primary"
                      size="large"
                      loading={sendingOtp}
                      icon={<KeyOutlined />}
                      onClick={handleSendPhoneOtp}
                      style={{ background: '#b91c1c', borderColor: '#7f1d1d', fontWeight: 700 }}
                    >
                      {citizen?.phone_verified_at ? 'Xác thực lại số điện thoại' : 'Gửi mã OTP xác thực ngay'}
                    </Button>
                  ) : (
                    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                        Nhập mã OTP 6 chữ số đã gửi tới số điện thoại:
                      </div>

                      {demoCode && (
                        <div style={{ marginBottom: 12 }}>
                          <Tag color="warning" style={{ padding: '4px 8px', fontWeight: 700 }}>
                            🔔 [Chế độ thử nghiệm] Mã OTP: {demoCode}
                          </Tag>
                        </div>
                      )}

                      <Form form={otpForm} layout="inline" onFinish={handleVerifyPhone}>
                        <Form.Item
                          name="otp_code"
                          rules={[
                            { required: true, message: 'Nhập mã OTP' },
                            { pattern: /^\d{6}$/, message: 'Gồm 6 số' },
                          ]}
                        >
                          <Input
                            placeholder="123456"
                            maxLength={6}
                            size="large"
                            style={{ letterSpacing: '3px', fontWeight: 700, width: 160, textAlign: 'center' }}
                          />
                        </Form.Item>

                        <Form.Item>
                          <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={verifyingOtp}
                            style={{ background: '#15803d', borderColor: '#166534', fontWeight: 700 }}
                          >
                            Xác nhận OTP
                          </Button>
                        </Form.Item>

                        <Form.Item>
                          <Button type="link" onClick={handleSendPhoneOtp} loading={sendingOtp}>
                            Gửi lại mã
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
