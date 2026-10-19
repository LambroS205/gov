import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ApplicationList from './pages/mot-cua/ApplicationList';
import ApplicationCreate from './pages/mot-cua/ApplicationCreate';
import ApplicationDetail from './pages/mot-cua/ApplicationDetail';
import TrackingSearch from './pages/mot-cua/TrackingSearch';
import AssignedQueue from './pages/processing/AssignedQueue';
import PendingApproval from './pages/approval/PendingApproval';
import CitizenList from './pages/citizens/CitizenList';
import AreaManagement from './pages/citizens/AreaManagement';
import ComplaintList from './pages/complaints/ComplaintList';
import PerformanceReport from './pages/reports/PerformanceReport';
import ProcedureStats from './pages/reports/ProcedureStats';
import NotificationLog from './pages/notifications/NotificationLog';
import UserManagement from './pages/admin/UserManagement';
import ProcedureManagement from './pages/admin/ProcedureManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import AuditLogViewer from './pages/admin/AuditLogViewer';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  const routerBasename = typeof window !== 'undefined' && window.location.pathname.startsWith('/gov') ? '/gov' : '/';

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#b91c1c',
          colorPrimaryHover: '#dc2626',
          colorSuccess: '#15803d',
          colorWarning: '#d97706',
          colorError: '#b91c1c',
          colorInfo: '#d97706',
          borderRadius: 8,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
        components: {
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: '#b91c1c',
            darkItemColor: '#fecaca',
            darkItemSelectedColor: '#ffffff',
            darkSubMenuItemBg: 'rgba(41, 4, 5, 0.9)',
          },
          Button: {
            primaryShadow: '0 2px 6px rgba(185, 28, 28, 0.35)',
          },
          Table: {
            headerBg: '#fdf2f2',
            headerColor: '#7f1d1d',
          },
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter basename={routerBasename}>
          <Routes>
            {/* Tuyến đường công khai */}
            <Route path="/login" element={<Login />} />
            <Route path="/tra-cuu" element={<TrackingSearch />} />

            {/* Tuyến đường cán bộ nội bộ */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Phân hệ Một cửa & Tiếp nhận */}
              <Route path="applications" element={<ApplicationList />} />
              <Route path="applications/create" element={<ApplicationCreate />} />
              <Route path="applications/:id" element={<ApplicationDetail />} />

              {/* Phân hệ Xử lý chuyên môn & Ký số */}
              <Route path="processing/queue" element={<AssignedQueue />} />
              <Route
                path="approval/pending"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'LANH_DAO']}>
                    <PendingApproval />
                  </ProtectedRoute>
                }
              />

              {/* Phân hệ Quản lý Dân cư */}
              <Route path="citizens" element={<CitizenList />} />
              <Route path="areas" element={<AreaManagement />} />

              {/* Phân hệ Phản ánh - Kiến nghị */}
              <Route path="complaints" element={<ComplaintList />} />

              {/* Phân hệ Báo cáo Thống kê */}
              <Route path="reports/performance" element={<PerformanceReport />} />
              <Route path="reports/procedures" element={<ProcedureStats />} />
              <Route path="notifications" element={<NotificationLog />} />

              {/* Phân hệ Quản trị hệ thống */}
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/procedures"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <ProcedureManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/departments"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN']}>
                    <DepartmentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit-logs"
                element={
                  <ProtectedRoute requiredRoles={['ADMIN', 'LANH_DAO']}>
                    <AuditLogViewer />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}
