<?php
// Script nạp dữ liệu mẫu an toàn chuẩn UTF-8 100%
// Chỉ cho phép chạy từ CLI hoặc web có xác nhận bí mật: ?confirm=reset_demo_data_2026
if (php_sapi_name() !== 'cli' && ($_GET['confirm'] ?? '') !== 'reset_demo_data_2026') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    die("Từ chối truy cập: Script nạp lại CSDL chỉ được phép chạy từ dòng lệnh (CLI): php database/import_seed.php hoặc có khóa xác nhận (?confirm=reset_demo_data_2026).\n");
}

require_once __DIR__ . '/demo_refresh.php';

try {
    $res = refresh_demo_data();
    echo "=== NẠP DỮ LIỆU MẪU THÀNH CÔNG (CHUẨN UTF-8) ===\n";
    echo sprintf("Thời gian hệ thống: %s\n", $res['current_date']);
    echo sprintf("Tài khoản cán bộ: %d | Công dân: %d | Tài khoản công dân: %d\n", $res['users_count'], $res['citizens_count'], $res['citizen_accounts_count']);
    echo sprintf("Tổng hồ sơ: %d (Đã giải quyết: %d | Đang xử lý: %d | Cảnh báo SLA: %d | Quá hạn: %d)\n", $res['total_applications'], $res['completed_applications'], $res['pending_applications'], $res['warning_count'], $res['overdue_count']);
    echo sprintf("Tổng phản ánh: %d (Đã xử lý: %d | Chưa xử lý: %d)\n", $res['total_complaints'], $res['resolved_complaints'], $res['pending_complaints']);
    echo sprintf("Vé bốc số hôm nay: %d\n", $res['queue_tickets']);
} catch (Throwable $e) {
    echo "LỖI KHI NẠP DỮ LIỆU: " . $e->getMessage() . "\n";
    exit(1);
}
