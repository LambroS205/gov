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

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Gửi Bearer token nếu có
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gov_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Bắt lỗi 401 tự động chuyển về đăng nhập
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ';

    if (status === 401) {
      localStorage.removeItem('gov_token');
      localStorage.removeItem('gov_user');
      const currentPath = window.location.pathname;
      const isPublicPath = currentPath.endsWith('/login') || currentPath.endsWith('/tra-cuu');
      if (!isPublicPath) {
        message.warning('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại');
        window.location.href = `${APP_BASE}/login`;
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

export const authApi = {
  login: (data) => client.post('/auth/login', data),
  me: () => client.get('/auth/me'),
  changePassword: (data) => client.post('/auth/change-password', data),
  logout: () => client.post('/auth/logout'),
};

export const dashboardApi = {
  getStats: () => client.get('/dashboard/stats'),
  getCharts: () => client.get('/dashboard/charts'),
};

export const applicationsApi = {
  list: (params) => client.get('/applications', { params }),
  get: (id, params) => client.get(`/applications/${id}`, { params }),
  create: (data) => client.post('/applications', data),
  createPublic: (data) => client.post('/public/applications', data),
  assign: (id, data) => client.put(`/applications/${id}/assign`, data),
  process: (id, data) => client.put(`/applications/${id}/process`, data),
  submitApproval: (id, data) => client.put(`/applications/${id}/submit-approval`, data),
  approve: (id, data) => client.put(`/applications/${id}/approve`, data),
  complete: (id, data) => client.put(`/applications/${id}/complete`, data),
  reject: (id, data) => client.put(`/applications/${id}/reject`, data),
  confirmPayment: (id, data) => client.put(`/applications/${id}/payment`, data),
  submitFeedback: (id, data) => client.post(`/applications/${id}/feedback`, data),
  track: (code) => client.get('/applications/track', { params: { code } }),
  uploadDoc: (id, formData) =>
    client.post(`/applications/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const proceduresApi = {
  list: (params) => client.get('/procedures', { params }),
  get: (id) => client.get(`/procedures/${id}`),
  create: (data) => client.post('/procedures', data),
  update: (id, data) => client.put(`/procedures/${id}`, data),
};

export const citizensApi = {
  list: (params) => client.get('/citizens', { params }),
  get: (id, params) => client.get(`/citizens/${id}`, { params }),
  create: (data) => client.post('/citizens', data),
  update: (id, data) => client.put(`/citizens/${id}`, data),
  searchByCccd: (cccd) => client.get('/citizens/search', { params: { cccd } }),
};

export const areasApi = {
  list: () => client.get('/areas'),
  get: (id) => client.get(`/areas/${id}`),
  create: (data) => client.post('/areas', data),
  update: (id, data) => client.put(`/areas/${id}`, data),
};

export const complaintsApi = {
  list: (params) => client.get('/complaints', { params }),
  get: (id) => client.get(`/complaints/${id}`),
  create: (data) => client.post('/complaints', data),
  createPublic: (data) => client.post('/public/complaints', data),
  track: (query) => client.get('/public/complaints/track', { params: { query } }),
  assign: (id, data) => client.put(`/complaints/${id}/assign`, data),
  respond: (id, data) => client.put(`/complaints/${id}/respond`, data),
};

export const publicUploadApi = {
  upload: (formData) =>
    client.post('/public/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const notificationsApi = {
  list: (params) => client.get('/notifications', { params }),
  stats: () => client.get('/notifications/stats'),
};

export const usersApi = {
  list: (params) => client.get('/users', { params }),
  get: (id) => client.get(`/users/${id}`),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  resetPassword: (id, data) => client.post(`/users/${id}/reset-password`, data),
};

export const departmentsApi = {
  list: () => client.get('/departments'),
  get: (id) => client.get(`/departments/${id}`),
};

export const reportsApi = {
  performance: () => client.get('/reports/performance'),
  procedures: () => client.get('/reports/procedures'),
  getExportUrl: () => {
    const token = localStorage.getItem('gov_token') || '';
    return `${APP_BASE}/api/v1/reports/export?token=${encodeURIComponent(token)}`;
  },
};

export const auditApi = {
  list: (params) => client.get('/audit-logs', { params }),
};

export default client;
