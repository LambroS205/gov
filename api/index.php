<?php

// Thiết lập múi giờ Việt Nam
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Bật CORS cho môi trường phát triển
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Autoloader đơn giản cho Core, Helpers, Controllers
spl_autoload_register(function ($class) {
    $directories = [
        __DIR__ . '/core/',
        __DIR__ . '/helpers/',
        __DIR__ . '/controllers/'
    ];

    foreach ($directories as $dir) {
        $file = $dir . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

try {
    $request = new Request();
    $router = new Router();

    // 1. Phân hệ Xác thực (Auth)
    $router->post('/api/v1/auth/login', [AuthController::class, 'login']);
    $router->get('/api/v1/auth/me', [AuthController::class, 'me']);
    $router->post('/api/v1/auth/change-password', [AuthController::class, 'changePassword']);
    $router->post('/api/v1/auth/logout', [AuthController::class, 'logout']);

    // 2. Bảng điều khiển (Dashboard)
    $router->get('/api/v1/dashboard/stats', [DashboardController::class, 'getStats']);
    $router->get('/api/v1/dashboard/charts', [DashboardController::class, 'getCharts']);

    // 3. Phân hệ Một cửa & Xử lý hồ sơ (Applications)
    $router->get('/api/v1/applications', [ApplicationController::class, 'index']);
    $router->post('/api/v1/applications', [ApplicationController::class, 'create']);
    $router->post('/api/v1/public/applications', [ApplicationController::class, 'createPublic']);
    $router->get('/api/v1/applications/track', [ApplicationController::class, 'track']);
    $router->get('/api/v1/applications/{id}', [ApplicationController::class, 'show']);
    $router->put('/api/v1/applications/{id}/assign', [ApplicationController::class, 'assign']);
    $router->put('/api/v1/applications/{id}/process', [ApplicationController::class, 'process']);
    $router->put('/api/v1/applications/{id}/submit-approval', [ApplicationController::class, 'submitApproval']);
    $router->put('/api/v1/applications/{id}/approve', [ApplicationController::class, 'approve']);
    $router->put('/api/v1/applications/{id}/complete', [ApplicationController::class, 'complete']);
    $router->put('/api/v1/applications/{id}/reject', [ApplicationController::class, 'reject']);
    $router->put('/api/v1/applications/{id}/payment', [ApplicationController::class, 'confirmPayment']);
    $router->post('/api/v1/applications/{id}/feedback', [ApplicationController::class, 'submitFeedback']);
    $router->post('/api/v1/applications/{id}/documents', [DocumentController::class, 'upload']);
    $router->post('/api/v1/public/upload', [DocumentController::class, 'uploadPublic']);

    // 4. Danh mục Thủ tục hành chính (Procedures)
    $router->get('/api/v1/procedures', [ProcedureController::class, 'index']);
    $router->post('/api/v1/procedures', [ProcedureController::class, 'create']);
    $router->get('/api/v1/procedures/{id}', [ProcedureController::class, 'show']);
    $router->put('/api/v1/procedures/{id}', [ProcedureController::class, 'update']);

    // 5. Phân hệ Quản lý Dân cư (Citizens)
    $router->get('/api/v1/citizens', [CitizenController::class, 'index']);
    $router->post('/api/v1/citizens', [CitizenController::class, 'create']);
    $router->get('/api/v1/citizens/search', [CitizenController::class, 'searchByCccd']);
    $router->get('/api/v1/citizens/{id}', [CitizenController::class, 'show']);
    $router->put('/api/v1/citizens/{id}', [CitizenController::class, 'update']);

    // 6. Quản lý Tổ dân phố / Địa bàn (Areas)
    $router->get('/api/v1/areas', [AreaController::class, 'index']);
    $router->post('/api/v1/areas', [AreaController::class, 'create']);
    $router->get('/api/v1/areas/{id}', [AreaController::class, 'show']);
    $router->put('/api/v1/areas/{id}', [AreaController::class, 'update']);

    // 7. Phân hệ Phản ánh - Kiến nghị (Complaints)
    $router->get('/api/v1/complaints', [ComplaintController::class, 'index']);
    $router->post('/api/v1/complaints', [ComplaintController::class, 'create']);
    $router->post('/api/v1/public/complaints', [ComplaintController::class, 'create']);
    $router->get('/api/v1/complaints/track', [ComplaintController::class, 'track']);
    $router->get('/api/v1/public/complaints/track', [ComplaintController::class, 'track']);
    $router->get('/api/v1/complaints/{id}', [ComplaintController::class, 'show']);
    $router->put('/api/v1/complaints/{id}/assign', [ComplaintController::class, 'assign']);
    $router->put('/api/v1/complaints/{id}/respond', [ComplaintController::class, 'respond']);

    // 8. Quản trị Người dùng & Phòng ban (Users & Departments)
    $router->get('/api/v1/users', [UserController::class, 'index']);
    $router->post('/api/v1/users', [UserController::class, 'create']);
    $router->get('/api/v1/users/{id}', [UserController::class, 'show']);
    $router->put('/api/v1/users/{id}', [UserController::class, 'update']);
    $router->post('/api/v1/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    $router->get('/api/v1/departments', [DepartmentController::class, 'index']);
    $router->get('/api/v1/departments/{id}', [DepartmentController::class, 'show']);

    // 9. Phân hệ Báo cáo & Thống kê (Reports)
    $router->get('/api/v1/reports/performance', [ReportController::class, 'performance']);
    $router->get('/api/v1/reports/procedures', [ReportController::class, 'procedures']);
    $router->get('/api/v1/reports/export', [ReportController::class, 'exportCsv']);

    // 10. Nhật ký kiểm toán (Audit Trail)
    $router->get('/api/v1/audit-logs', [AuditController::class, 'index']);

    // 11. Nhật ký Thông báo SMS / Zalo OA
    $router->get('/api/v1/notifications', [NotificationController::class, 'index']);
    $router->get('/api/v1/notifications/stats', [NotificationController::class, 'stats']);

    $router->dispatch($request);
} catch (Throwable $e) {
    Response::error('Lỗi máy chủ nội bộ: ' . $e->getMessage(), 500, [
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
