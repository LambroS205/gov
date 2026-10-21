import axios from 'axios';
import { message } from 'antd';

const isGovSubfolder = typeof window !== 'undefined' && window.location.pathname.startsWith('/gov');
export const APP_BASE = isGovSubfolder ? '/gov' : '';
const API_BASE_URL = `${APP_BASE}/api/v1`;

export const resolveFileUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${APP_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const portalClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Tự động đính kèm citizen_token nếu có
portalClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('citizen_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Bắt lỗi 401 tự động chuyển về đăng nhập công dân
portalClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ';

    if (status === 401) {
      const currentPath = window.location.pathname;
      const isCitizenAuthPath = currentPath.includes('/cong-dan/dang-nhap') || 
                                currentPath.includes('/cong-dan/dang-ky') || 
                                currentPath.includes('/cong-dan/quen-mat-khau') ||
                                currentPath.includes('/tra-cuu');
      
      localStorage.removeItem('citizen_token');
      localStorage.removeItem('citizen_user');

      if (!isCitizenAuthPath && currentPath.includes('/cong-dan')) {
        message.warning('Phiên đăng nhập công dân đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = `${APP_BASE}/cong-dan/dang-nhap`;
      }
    } else if (status === 403) {
      message.error(msg || 'Bạn không có quyền thực hiện thao tác này');
    } else if (status >= 400 && status < 500) {
      message.error(msg);
    } else if (status >= 500) {
      message.error('Lỗi hệ thống máy chủ: ' + msg);
    }

    return Promise.reject(error.response?.data || error);
  }
);

// 1. Phân hệ Xác thực Công dân
export const citizenAuthApi = {
  register: (data) => portalClient.post('/citizen/auth/register', data),
  login: (data) => portalClient.post('/citizen/auth/login', data),
  me: () => portalClient.get('/citizen/auth/me'),
  logout: () => portalClient.post('/citizen/auth/logout'),
  forgotPassword: (data) => portalClient.post('/citizen/auth/forgot-password', data),
  resetPassword: (data) => portalClient.post('/citizen/auth/reset-password', data),
};

// 2. Phân hệ Cổng Cá nhân Công dân
export const citizenPortalApi = {
  summary: () => portalClient.get('/citizen/summary'),
  applications: (params) => portalClient.get('/citizen/applications', { params }),
  applicationDetail: (id) => portalClient.get(`/citizen/applications/${id}`),
  complaints: (params) => portalClient.get('/citizen/complaints', { params }),
  complaintDetail: (id) => portalClient.get(`/citizen/complaints/${id}`),
  notifications: (params) => portalClient.get('/citizen/notifications', { params }),
  updateProfile: (data) => portalClient.put('/citizen/profile', data),
  changePassword: (data) => portalClient.post('/citizen/change-password', data),
  sendPhoneOtp: () => portalClient.post('/citizen/phone/send-otp'),
  verifyPhone: (data) => portalClient.post('/citizen/phone/verify', data),
};

// 3. Phân hệ DVC & Phản ánh (Có kèm citizen_token nếu đã đăng nhập)
export const portalPublicApi = {
  track: (code) => portalClient.get('/applications/track', { params: { code } }),
  createApplication: (data) => portalClient.post('/public/applications', data),
  createComplaint: (data) => portalClient.post('/public/complaints', data),
  trackComplaint: (query) => portalClient.get('/public/complaints/track', { params: { query } }),
  submitFeedback: (id, data) => portalClient.post(`/applications/${id}/feedback`, data),
  upload: (formData) =>
    portalClient.post('/public/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default portalClient;
