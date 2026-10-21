import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Steps,
  Timeline,
  Alert,
  Typography,
  Row,
  Col,
  Rate,
  Input,
  Modal,
  Spin,
  message,
  Table,
} from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { citizenPortalApi, portalPublicApi, resolveFileUrl } from '../../api/portalClient';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function MyApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);

  // Modal đánh giá
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await citizenPortalApi.applicationDetail(id);
      if (res?.data) {
        setApp(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    setSubmittingFeedback(true);
    try {
      await portalPublicApi.submitFeedback(app.id, {
        satisfaction_score: feedbackScore,
        satisfaction_comment: feedbackComment,
      });
      message.success('Cảm ơn Quý công dân đã gửi đánh giá chất lượng phục vụ!');
      setFeedbackModalVisible(false);
      fetchDetail();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const getStepCurrent = (status) => {
    switch (status) {
      case 'CHO_TIEP_NHAN':
        return 0;
      case 'DANG_XU_LY':
        return 1;
      case 'CHO_KY_DUYET':
        return 2;
      case 'DA_KY_SO':
        return 3;
      case 'HOAN_THANH':
        return 4;
      default:
        return 0;
    }
  };

  const statusConfig = {
    CHO_TIEP_NHAN: { label: 'Chờ tiếp nhận', color: 'orange' },
    DANG_XU_LY: { label: 'Đang thụ lý', color: 'blue' },
    CHO_KY_DUYET: { label: 'Chờ ký duyệt', color: 'purple' },
    DA_KY_SO: { label: 'Đã ký số', color: 'cyan' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'green' },
    TRA_LAI: { label: 'Yêu cầu bổ sung', color: 'volcano' },
    TU_CHOI: { label: 'Từ chối giải quyết', color: 'red' },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <Spin size="large" tip="Đang tải chi tiết hồ sơ..." />
      </div>
    );
  }

  if (!app) {
    return (
      <Card style={{ textAlign: 'center', padding: 40, borderRadius: 16 }}>
        <Title level={4}>Không tìm thấy hồ sơ hoặc bạn không có quyền xem</Title>
        <Button type="primary" onClick={() => navigate('/cong-dan/ho-so')}>
          Quay lại danh sách
        </Button>
      </Card>
    );
  }

  const isCompleted = app.status === 'HOAN_THANH';
  const isRejected = app.status === 'TRA_LAI' || app.status === 'TU_CHOI';

  return (
    <div>
      {/* Nút Quay lại & Tiêu đề */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/cong-dan/ho-so')}
          style={{ padding: 0, fontWeight: 600, color: '#b91c1c', fontSize: 14 }}
        >
          Quay lại danh sách hồ sơ
        </Button>

        <Space>
          {app.receipt_url && (
            <Button
              icon={<PrinterOutlined />}
              onClick={() => window.open(resolveFileUrl(app.receipt_url), '_blank')}
              style={{ borderColor: '#0284c7', color: '#0284c7', fontWeight: 600 }}
            >
              Xem & In Biên lai điện tử
            </Button>
          )}

          {isCompleted && (
            <Button
              type="primary"
              icon={<StarOutlined />}
              onClick={() => {
                setFeedbackScore(app.satisfaction_score || 5);
                setFeedbackComment(app.satisfaction_comment || '');
                setFeedbackModalVisible(true);
              }}
              style={{ background: '#f59e0b', borderColor: '#d97706', color: '#7f1d1d', fontWeight: 700 }}
            >
              {app.satisfaction_score ? 'Cập nhật đánh giá' : 'Đánh giá phục vụ'}
            </Button>
          )}
        </Space>
      </div>

      {/* Header Hồ sơ */}
      <Card
        bordered={false}
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          marginBottom: 20,
          borderLeft: '5px solid #b91c1c',
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={18}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
              MÃ HỒ SƠ QUỐC GIA: <strong style={{ color: '#b91c1c', fontSize: 16 }}>{app.dossier_code}</strong>
            </div>
            <Title level={3} style={{ margin: '4px 0 6px 0', color: '#1e293b', fontWeight: 800 }}>
              {app.proc_name}
            </Title>
            <Space wrap>
              <Tag color={statusConfig[app.status]?.color || 'default'} style={{ fontSize: 13, padding: '4px 10px', fontWeight: 700 }}>
                {statusConfig[app.status]?.label || app.status}
              </Tag>
              <Tag color="volcano" style={{ fontSize: 12, padding: '3px 8px' }}>
                Lĩnh vực: {app.field_type}
              </Tag>
              <Tag color={app.submit_channel === 'TRUC_TUYEN' ? 'blue' : 'default'} style={{ fontSize: 12, padding: '3px 8px' }}>
                Kênh tiếp nhận: {app.submit_channel === 'TRUC_TUYEN' ? 'Trực tuyến' : 'Tại quầy Một cửa'}
              </Tag>
            </Space>
          </Col>

          <Col xs={24} md={6} style={{ textAlign: 'right' }}>
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, display: 'inline-block', textAlign: 'left', minWidth: 200 }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Hạn trả kết quả:</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#b91c1c' }}>
                {app.appointment_date ? dayjs(app.appointment_date).format('DD/MM/YYYY HH:mm') : '—'}
              </div>
              {app.completed_date && (
                <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
                  ✓ Đã xong: {dayjs(app.completed_date).format('DD/MM/YYYY')}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Cảnh báo lý do bổ sung / từ chối nếu có */}
      {isRejected && app.rejection_reason && (
        <Alert
          message="Ý kiến chỉ đạo / Yêu cầu bổ sung từ Cán bộ Một cửa"
          description={app.rejection_reason}
          type="error"
          showIcon
          style={{ marginBottom: 20, borderRadius: 12 }}
        />
      )}

      {/* Steps Tiến trình giải quyết */}
      <Card
        title={<span style={{ fontWeight: 700, color: '#7f1d1d' }}>Quy trình xử lý hồ sơ Một cửa liên thông</span>}
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)', marginBottom: 20 }}
      >
        <Steps
          current={getStepCurrent(app.status)}
          status={isRejected ? 'error' : isCompleted ? 'finish' : 'process'}
          style={{ padding: '12px 8px' }}
          items={[
            {
              title: 'Tiếp nhận hồ sơ',
              description: 'Một cửa tiếp nhận',
              icon: <ClockCircleOutlined />,
            },
            {
              title: 'Thụ lý chuyên môn',
              description: 'Công chức thẩm định',
            },
            {
              title: 'Trình ký điện tử',
              description: 'Lãnh đạo UBND Phường',
            },
            {
              title: 'Ký số & Văn thư',
              description: 'Đóng dấu số phát hành',
              icon: <SafetyCertificateOutlined />,
            },
            {
              title: 'Trả kết quả',
              description: isCompleted ? 'Đã hoàn thành' : 'Chờ nhận kết quả',
              icon: <CheckCircleOutlined />,
            },
          ]}
        />
      </Card>

      <Row gutter={[20, 20]}>
        {/* Cột trái: Thông tin chi tiết */}
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ fontWeight: 700, color: '#7f1d1d' }}>Thông tin người nộp & Thủ tục</span>}
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)', marginBottom: 20 }}
          >
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
              <Descriptions.Item label="Họ tên người nộp">
                <strong>{app.citizen_name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Số CCCD">
                <strong>{app.citizen_id_number}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại liên hệ">
                {app.citizen_phone || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày nộp hồ sơ">
                {app.submit_date ? dayjs(app.submit_date).format('DD/MM/YYYY HH:mm') : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ người nộp" span={2}>
                {app.citizen_address || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Thời hạn giải quyết">
                {app.processing_days || 1} ngày làm việc
              </Descriptions.Item>
              <Descriptions.Item label="Phí, lệ phí quy định">
                <strong style={{ color: '#b91c1c' }}>
                  {parseFloat(app.fee_amount || 0) <= 0
                    ? 'Miễn phí'
                    : `${parseFloat(app.fee_amount).toLocaleString('vi-VN')} VNĐ`}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái nộp phí" span={2}>
                <Space>
                  {app.payment_status === 'DA_THANH_TOAN' ? (
                    <Tag color="success">Đã thanh toán ({app.payment_method === 'CHUYEN_KHOAN_QR' ? 'Chuyển khoản QR' : 'Tiền mặt'})</Tag>
                  ) : (
                    <Tag color="warning">Chưa thanh toán</Tag>
                  )}
                  {app.receipt_number && <span>Số biên lai: <code>{app.receipt_number}</code></span>}
                </Space>
              </Descriptions.Item>
              {app.notes && (
                <Descriptions.Item label="Ghi chú hồ sơ" span={2}>
                  {app.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Tài liệu đính kèm & Kết quả */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#7f1d1d' }}>Tài liệu đính kèm & Kết quả giải quyết</span>}
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}
          >
            {(!app.documents || app.documents.length === 0) ? (
              <Text type="secondary">Chưa có tài liệu đính kèm nào trên hệ thống</Text>
            ) : (
              <Table
                dataSource={app.documents}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'Tên tệp tài liệu',
                    dataIndex: 'document_name',
                    key: 'document_name',
                    render: (name, doc) => (
                      <Space>
                        <FileDoneOutlined style={{ color: doc.is_signed ? '#15803d' : '#0284c7' }} />
                        <span>{name}</span>
                        {doc.is_signed ? (
                          <Tag color="success" style={{ fontSize: 10 }}>✓ Đã ký số</Tag>
                        ) : null}
                      </Space>
                    ),
                  },
                  {
                    title: 'Loại',
                    dataIndex: 'doc_type',
                    key: 'doc_type',
                    render: (t) => (t === 'KET_QUA' ? <Tag color="green">Kết quả</Tag> : <Tag>Hồ sơ nộp</Tag>),
                  },
                  {
                    title: 'Thao tác',
                    key: 'download',
                    render: (_, doc) => (
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        href={resolveFileUrl(doc.file_path)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#b91c1c' }}
                      >
                        Tải về
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </Card>
        </Col>

        {/* Cột phải: Nhật ký lịch sử luân chuyển */}
        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ fontWeight: 700, color: '#7f1d1d' }}>Lịch sử tiến trình xử lý</span>}
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}
          >
            {(!app.workflow || app.workflow.length === 0) ? (
              <Text type="secondary">Chưa có lịch sử luân chuyển</Text>
            ) : (
              <Timeline
                mode="left"
                items={app.workflow.map((wf, idx) => ({
                  color: idx === app.workflow.length - 1 ? 'red' : 'gray',
                  children: (
                    <div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {wf.created_at ? dayjs(wf.created_at).format('DD/MM/YYYY HH:mm') : '—'}
                      </div>
                      <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 2 }}>
                        {wf.action}
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                        {wf.comment}
                      </div>
                    </div>
                  ),
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Modal Đánh giá mức độ hài lòng */}
      <Modal
        title={<span style={{ color: '#7f1d1d', fontWeight: 700 }}>Đánh giá chất lượng phục vụ của UBND Phường</span>}
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        onOk={handleSendFeedback}
        confirmLoading={submittingFeedback}
        okText="Gửi đánh giá"
        cancelText="Đóng"
        okButtonProps={{ style: { background: '#b91c1c', borderColor: '#7f1d1d' } }}
      >
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <Paragraph style={{ color: '#475569' }}>
            Ý kiến đóng góp quý báu của Quý công dân giúp nâng cao chất lượng phục vụ của Bộ phận Tiếp nhận và Trả kết quả Một cửa UBND Phường Yên Bái.
          </Paragraph>

          <div style={{ margin: '16px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              Mức độ hài lòng của Quý công dân:
            </div>
            <Rate
              value={feedbackScore}
              onChange={setFeedbackScore}
              style={{ fontSize: 32, color: '#f59e0b' }}
            />
          </div>

          <div style={{ textAlign: 'left', marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Ý kiến góp ý thêm (Không bắt buộc):
            </div>
            <TextArea
              rows={3}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Cán bộ nhiệt tình, thời gian trả kết quả nhanh chóng..."
              maxLength={500}
              showCount
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
