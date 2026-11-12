<?php

require_once dirname(__DIR__, 2) . '/database/demo_refresh.php';

class DemoController {
    /**
     * Lấy trạng thái chế độ Demo
     */
    public function getStatus(Request $request): void {
        $config = require dirname(__DIR__) . '/config/app.php';
        Response::json([
            'demo_mode' => (bool)($config['demo_mode'] ?? true),
            'server_time' => date('Y-m-d H:i:s'),
            'app_version' => $config['version'] ?? '1.0.0'
        ], 200, 'Lấy trạng thái Demo thành công');
    }

    /**
     * Nạp lại toàn bộ dữ liệu mẫu và chuẩn hóa mốc thời gian sát ngày hôm nay
     * Yêu cầu quyền ADMIN hoặc token demo
     */
    public function resetData(Request $request): void {
        $config = require dirname(__DIR__) . '/config/app.php';
        if (empty($config['demo_mode'])) {
            Response::error('Chức năng làm mới dữ liệu demo đã bị vô hiệu hóa trong cấu hình sản phẩm', 403);
        }

        // Bắt buộc xác thực quyền ADMIN hoặc cờ bí mật demo
        $secretConfirm = $request->get('confirm', '');
        if ($secretConfirm !== 'reset_demo_data_2026') {
            $user = Auth::requireRoles($request, ['ADMIN']);
        }

        try {
            $result = refresh_demo_data();
            AuditLogger::log('DEMO_RESET', 'SYSTEM', null, null, $result, null, $request);
            Response::json($result, 200, 'Làm mới và trẻ hóa dữ liệu Demo thành công!');
        } catch (Throwable $e) {
            Response::error('Lỗi khi làm mới dữ liệu demo: ' . $e->getMessage(), 500);
        }
    }
}

