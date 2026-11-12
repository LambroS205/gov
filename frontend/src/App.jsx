import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import viVN from 'antd/locale/vi_VN';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CitizenAuthProvider, useCitizenAuth } from './contexts/CitizenAuthContext';
import MainLayout from './layouts/MainLayout';
import CitizenLayout from './layouts/CitizenLayout';

// Fallback spinner cho code splitting / lazy loading
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <Spin size="large" tip="Đang tải dữ liệu..." />
  </div>
);

// Phân hệ Cán bộ & Quản trị (Lazy loaded)
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ApplicationList = React.lazy(() => import('./pages/mot-cua/ApplicationList'));
const ApplicationCreate = React.lazy(() => import('./pages/mot-cua/ApplicationCreate'));
const ApplicationDetail = React.lazy(() => import('./pages/mot-cua/ApplicationDetail'));
const TrackingSearch = React.lazy(() => import('./pages/mot-cua/TrackingSearch'));
const AssignedQueue = React.lazy(() => import('./pages/processing/AssignedQueue'));
const PendingApproval = React.lazy(() => import('./pages/approval/PendingApproval'));
const CitizenList = React.lazy(() => import('./pages/citizens/CitizenList'));
const AreaManagement = React.lazy(() => import('./pages/citizens/AreaManagement'));
const ComplaintList = React.lazy(() => import('./pages/complaints/ComplaintList'));
const PerformanceReport = React.lazy(() => import('./pages/reports/PerformanceReport'));
const ProcedureStats = React.lazy(() => import('./pages/reports/ProcedureStats'));
const NotificationLog = React.lazy(() => import('./pages/notifications/NotificationLog'));
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement'));
const ProcedureManagement = React.lazy(() => import('./pages/admin/ProcedureManagement'));
const DepartmentManagement = React.lazy(() => import('./pages/admin/DepartmentManagement'));
const AuditLogViewer = React.lazy(() => import('./pages/admin/AuditLogViewer'));
const CitizenAccountManagement = React.lazy(() => import('./pages/admin/CitizenAccountManagement'));

// Cổng Dịch vụ công Công dân (Lazy loaded)
const CitizenLogin = React.lazy(() => import('./pages/citizen/CitizenLogin'));
const CitizenRegister = React.lazy(() => import('./pages/citizen/CitizenRegister'));
const ForgotPassword = React.lazy(() => import('./pages/citizen/ForgotPassword'));
const CitizenHome = React.lazy(() => import('./pages/citizen/CitizenHome'));
const MyApplications = React.lazy(() => import('./pages/citizen/MyApplications'));
const MyApplicationDetail = React.lazy(() => import('./pages/citizen/MyApplicationDetail'));
const MyComplaints = React.lazy(() => import('./pages/citizen/MyComplaints'));
const Notifications = React.lazy(() => import('./pages/citizen/Notifications'));
const Profile = React.lazy(() => import('./pages/citizen/Profile'));

// Màn hình Công cộng, Smart Board & Kiosk (Lazy loaded)
const PublicBoard = React.lazy(() => import('./pages/public/PublicBoard'));
const Kiosk = React.lazy(() => import('./pages/public/Kiosk'));
const QueueDisplay = React.lazy(() => import('./pages/public/QueueDisplay'));

// Protected Route Wrapper for Staff
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

// Protected Route Wrapper for Citizens
const CitizenProtectedRoute = ({ children }) => {
  const { citizen, loading } = useCitizenAuth();

  if (loading) {
    return null;
  }

  if (!citizen) {
    return <Navigate to="/cong-dan/dang-nhap" replace />;
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
        <CitizenAuthProvider>
          <BrowserRouter basename={routerBasename}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Tuyến đường công khai & Tra cứu */}
                <Route path="/login" element={<Login />} />
                <Route path="/tra-cuu" element={<TrackingSearch />} />
                <Route path="/cong-khai" element={<PublicBoard />} />
                <Route path="/kiosk" element={<Kiosk />} />
                <Route path="/goi-so" element={<QueueDisplay />} />

                {/* Tuyến đường Đăng ký / Đăng nhập / Quên MK công dân */}
                <Route path="/cong-dan/dang-nhap" element={<CitizenLogin />} />
                <Route path="/cong-dan/dang-ky" element={<CitizenRegister />} />
                <Route path="/cong-dan/quen-mat-khau" element={<ForgotPassword />} />

                {/* Cổng Dịch vụ công dành cho Công dân */}
                <Route
                  path="/cong-dan"
                  element={
                    <CitizenProtectedRoute>
                      <CitizenLayout />
                    </CitizenProtectedRoute>
                  }
                >
                  <Route index element={<CitizenHome />} />
                  <Route path="ho-so" element={<MyApplications />} />
                  <Route path="ho-so/:id" element={<MyApplicationDetail />} />
                  <Route path="phan-anh" element={<MyComplaints />} />
                  <Route path="thong-bao" element={<Notifications />} />
                  <Route path="tai-khoan" element={<Profile />} />
                </Route>

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
                    path="admin/citizen-accounts"
                    element={
                      <ProtectedRoute requiredRoles={['ADMIN', 'MOT_CUA']}>
                        <CitizenAccountManagement />
                      </ProtectedRoute>
                    }
                  />
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
            </Suspense>
          </BrowserRouter>
        </CitizenAuthProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}
