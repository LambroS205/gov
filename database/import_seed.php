<?php
// Script nạp dữ liệu mẫu an toàn chuẩn UTF-8 100%
// Chỉ cho phép chạy từ CLI hoặc web có xác nhận bí mật: ?confirm=reset_demo_data_2026
if (php_sapi_name() !== 'cli' && ($_GET['confirm'] ?? '') !== 'reset_demo_data_2026') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    die("Từ chối truy cập: Script nạp lại CSDL chỉ được phép chạy từ dòng lệnh (CLI): php database/import_seed.php hoặc có khóa xác nhận (?confirm=reset_demo_data_2026).\n");
}

require_once dirname(__DIR__) . '/api/core/Database.php';

try {
    $db = Database::getConnection();
    $db->exec('SET NAMES utf8mb4');
    $db->exec('SET CHARACTER SET utf8mb4');

    $sqlFile = __DIR__ . '/seed_data.sql';
    if (!file_exists($sqlFile)) {
        die("Không tìm thấy tệp seed_data.sql\n");
    }

    $sql = file_get_contents($sqlFile);
    // Tách câu lệnh theo dấu chấm phẩy
    $db->exec($sql);

    echo "=== NẠP DỮ LIỆU MẪU THÀNH CÔNG (CHUẨN UTF-8) ===\n";

    // Kiểm tra kiểm tra lại một số bản ghi
    $users = $db->query('SELECT username, full_name, role FROM users LIMIT 5')->fetchAll();
    echo "\nDanh sách cán bộ kiểm tra:\n";
    foreach ($users as $u) {
        echo sprintf(" - [%s] %s (%s)\n", $u['username'], $u['full_name'], $u['role']);
    }

    $procs = $db->query('SELECT proc_code, proc_name FROM administrative_procedures LIMIT 5')->fetchAll();
    echo "\nDanh sách thủ tục TTHC kiểm tra:\n";
    foreach ($procs as $p) {
        echo sprintf(" - [%s] %s\n", $p['proc_code'], $p['proc_name']);
    }

    $apps = $db->query('SELECT dossier_code, citizen_name, status FROM applications LIMIT 5')->fetchAll();
    echo "\nDanh sách hồ sơ kiểm tra:\n";
    foreach ($apps as $a) {
        echo sprintf(" - [%s] %s (%s)\n", $a['dossier_code'], $a['citizen_name'], $a['status']);
    }

} catch (Throwable $e) {
    echo "LỖI KHI NẠP DỮ LIỆU: " . $e->getMessage() . "\n";
    exit(1);
}
