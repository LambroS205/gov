<?php
// ====================================================================
// Script làm mới & chuẩn hóa dữ liệu Demo (YenBai eWard-Gov)
// Đưa toàn bộ mốc thời gian về sát ngày hiện tại để phục vụ Demo trực quan
// ====================================================================

require_once dirname(__DIR__) . '/api/core/Database.php';

function refresh_demo_data(): array {
    $db = Database::getConnection();
    $db->exec('SET NAMES utf8mb4');
    $db->exec('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Nạp lại seed_data gốc
    $seedFile = __DIR__ . '/seed_data.sql';
    if (!file_exists($seedFile)) {
        throw new RuntimeException("Không tìm thấy tệp seed_data.sql");
    }
    $sql = file_get_contents($seedFile);
    $db->exec($sql);

    // 2. Chạy migration 001 nếu có
    $m1 = __DIR__ . '/migrations/001_citizen_accounts.sql';
    if (file_exists($m1)) {
        $sql1 = file_get_contents($m1);
        $db->exec($sql1);
    }

    // 3. Chạy migration 002 nếu có
    $m2 = __DIR__ . '/migrations/002_queue_and_complaint_coords.sql';
    if (file_exists($m2)) {
        $sql2 = file_get_contents($m2);
        $db->exec($sql2);
    }

    // 4. Tính toán độ lệch ngày giữa CURDATE() và mốc chuẩn 2026-10-21
    $delta = (int)$db->query("SELECT DATEDIFF(CURDATE(), '2026-10-21')")->fetchColumn();

    // Dịch chuyển thời gian toàn bộ các bảng nghiệp vụ
    if ($delta !== 0) {
        $db->exec("UPDATE applications SET 
            submit_date = DATE_ADD(submit_date, INTERVAL $delta DAY),
            appointment_date = DATE_ADD(appointment_date, INTERVAL $delta DAY),
            completed_date = CASE WHEN completed_date IS NOT NULL THEN DATE_ADD(completed_date, INTERVAL $delta DAY) ELSE NULL END,
            paid_at = CASE WHEN paid_at IS NOT NULL THEN DATE_ADD(paid_at, INTERVAL $delta DAY) ELSE NULL END,
            satisfaction_date = CASE WHEN satisfaction_date IS NOT NULL THEN DATE_ADD(satisfaction_date, INTERVAL $delta DAY) ELSE NULL END,
            created_at = DATE_ADD(created_at, INTERVAL $delta DAY),
            updated_at = DATE_ADD(updated_at, INTERVAL $delta DAY)
        ");

        $db->exec("UPDATE application_workflow SET created_at = DATE_ADD(created_at, INTERVAL $delta DAY)");
        $db->exec("UPDATE complaints SET 
            created_at = DATE_ADD(created_at, INTERVAL $delta DAY),
            responded_at = CASE WHEN responded_at IS NOT NULL THEN DATE_ADD(responded_at, INTERVAL $delta DAY) ELSE NULL END,
            updated_at = DATE_ADD(updated_at, INTERVAL $delta DAY)
        ");
        $db->exec("UPDATE notifications SET 
            sent_at = DATE_ADD(sent_at, INTERVAL $delta DAY),
            created_at = DATE_ADD(created_at, INTERVAL $delta DAY)
        ");
        $db->exec("UPDATE audit_logs SET created_at = DATE_ADD(created_at, INTERVAL $delta DAY)");
        $db->exec("UPDATE application_documents SET uploaded_at = DATE_ADD(uploaded_at, INTERVAL $delta DAY)");
    }

    // 5. Chuẩn hóa trạng thái các hồ sơ cũ trong seed_data để tỷ lệ đạt chuẩn ISO / Phường kiểu mẫu:
    // Đa số hồ sơ cũ từ hơn 5 ngày trước chuyển sang HOAN_THANH có đánh giá hài lòng cao
    $db->exec("UPDATE applications 
        SET status = 'HOAN_THANH',
            completed_date = DATE_ADD(submit_date, INTERVAL 1 DAY),
            satisfaction_score = 5,
            satisfaction_comment = 'Thủ tục nhanh gọn, cán bộ phục vụ tận tình, chu đáo',
            satisfaction_date = DATE_ADD(submit_date, INTERVAL 1 DAY)
        WHERE id IN (
            'a0000001-0000-0000-0000-000000000001',
            'a0000002-0000-0000-0000-000000000002',
            'a0000003-0000-0000-0000-000000000003',
            'a0000007-0000-0000-0000-000000000007',
            'a0000008-0000-0000-0000-000000000008',
            'a0000009-0000-0000-0000-000000000009',
            'a0000010-0000-0000-0000-000000000010',
            'a0000012-0000-0000-0000-000000000012'
        )
    ");

    // Giữ lại 1 vài hồ sơ active từ seed cũ với hạn hẹn sát hôm nay/ngày mai:
    // Hồ sơ đã ký số, sẵn sàng trả kết quả
    $db->exec("UPDATE applications 
        SET status = 'DA_KY_SO',
            appointment_date = DATE_ADD(NOW(), INTERVAL 1 DAY)
        WHERE id = 'a0000006-0000-0000-0000-000000000006'
    ");

    // Hồ sơ đang thụ lý còn hạn
    $db->exec("UPDATE applications 
        SET status = 'DANG_XU_LY',
            appointment_date = DATE_ADD(NOW(), INTERVAL 2 DAY)
        WHERE id = 'a0000005-0000-0000-0000-000000000005'
    ");

    // Hồ sơ chờ tiếp nhận mới
    $db->exec("UPDATE applications 
        SET status = 'CHO_TIEP_NHAN',
            appointment_date = DATE_ADD(NOW(), INTERVAL 3 DAY)
        WHERE id = 'a0000004-0000-0000-0000-000000000004'
    ");

    // 6. Bổ sung hồ sơ đa dạng cho 7 ngày gần nhất (Tạo dữ liệu biểu đồ Recharts đẹp và cân đối)
    $todayStr = date('Y-m-d');
    $additionalApps = [
        // --- HÔM NAY ---
        [
            'code' => '000.00.00.H49-' . date('ymd') . '-0001',
            'proc_id' => 1, // Khai sinh
            'name' => 'Nguyễn Thị Minh Hạnh',
            'cccd' => '015195001234',
            'phone' => '0988112233',
            'address' => 'Số 14 phố Đinh Tiên Hoàng, TDP số 1',
            'status' => 'CHO_TIEP_NHAN',
            'sub_time' => "$todayStr 08:15:00",
            'app_time' => date('Y-m-d 16:30:00', strtotime('+2 days')),
            'comp_time' => null,
            'handler' => 'u0000003-0000-0000-0000-000000000003',
            'payment' => 'CHUA_THANH_TOAN',
            'fee' => 0
        ],
        [
            'code' => '000.00.00.H49-' . date('ymd') . '-0002',
            'proc_id' => 3, // Chứng thực
            'name' => 'Vũ Đình Trọng',
            'cccd' => '015090005566',
            'phone' => '0912987654',
            'address' => 'Số 45 phố Hoàng Hoa Thám, TDP số 2',
            'status' => 'DANG_XU_LY',
            'sub_time' => "$todayStr 09:00:00",
            'app_time' => date('Y-m-d 16:30:00', strtotime('+1 day')),
            'comp_time' => null,
            'handler' => 'u0000003-0000-0000-0000-000000000003',
            'payment' => 'DA_THANH_TOAN',
            'fee' => 10000
        ],
        [
            'code' => '000.00.00.H49-' . date('ymd') . '-0003',
            'proc_id' => 4, // Tình trạng hôn nhân
            'name' => 'Hoàng Lan Anh',
            'cccd' => '015198007788',
            'phone' => '0977665544',
            'address' => 'Số 28 phố Trần Hưng Đạo, TDP số 3',
            'status' => 'CHO_KY_DUYET',
            'sub_time' => date('Y-m-d 14:00:00', strtotime('-1 day')),
            'app_time' => date('Y-m-d 16:30:00', strtotime('+1 day')), // Warning SLA (<24h)
            'comp_time' => null,
            'handler' => 'u0000003-0000-0000-0000-000000000003',
            'payment' => 'DA_THANH_TOAN',
            'fee' => 15000
        ],
        [
            'code' => '000.00.00.H49-' . date('ymd') . '-0004',
            'proc_id' => 6, // Đăng ký đất đai
            'name' => 'Phạm Hồng Thái',
            'cccd' => '015075003322',
            'phone' => '0934112299',
            'address' => 'Số 89 đường Điện Biên, TDP số 4',
            'status' => 'DANG_XU_LY',
            'sub_time' => date('Y-m-d 10:30:00', strtotime('-2 days')),
            'app_time' => date('Y-m-d 11:00:00', strtotime('+18 hours')), // Sắp quá hạn SLA (<24h)
            'comp_time' => null,
            'handler' => 'u0000004-0000-0000-0000-000000000004',
            'payment' => 'DA_THANH_TOAN',
            'fee' => 50000
        ],
        // 1 hồ sơ quá hạn có kiểm soát để demo cảnh báo đỏ
        [
            'code' => '000.00.00.H49-' . date('ymd', strtotime('-4 days')) . '-0099',
            'proc_id' => 5, // Bảo trợ xã hội
            'name' => 'Đỗ Văn Mạnh',
            'cccd' => '015082009911',
            'phone' => '0966332211',
            'address' => 'Số 12 phố Quang Trung, TDP số 2',
            'status' => 'DANG_XU_LY',
            'sub_time' => date('Y-m-d 08:30:00', strtotime('-4 days')),
            'app_time' => date('Y-m-d 16:30:00', strtotime('-1 day')), // Đã quá hạn 1 ngày!
            'comp_time' => null,
            'handler' => 'u0000005-0000-0000-0000-000000000005',
            'payment' => 'DA_THANH_TOAN',
            'fee' => 0
        ]
    ];

    // Tạo hồ sơ tiếp nhận và hoàn thành cho từng ngày trong 7 ngày qua
    for ($d = 6; $d >= 1; $d--) {
        $dayDate = date('Y-m-d', strtotime("-$d days"));
        $dayYmd = date('ymd', strtotime("-$d days"));

        // Mỗi ngày tạo 2-3 hồ sơ tiếp nhận và hoàn thành
        $citizenNames = [
            'Lê Hoàng Long', 'Nguyễn Thu Trang', 'Phan Văn Hiệp',
            'Trần Đình Khôi', 'Vũ Mai Phương', 'Đinh Quốc Toàn'
        ];

        for ($k = 0; $k < 2; $k++) {
            $nameIdx = ($d * 2 + $k) % count($citizenNames);
            $procId = (($d + $k) % 6) + 1;
            $fee = [0, 10000, 15000, 20000, 50000, 8000][$procId - 1] ?? 10000;
            $additionalApps[] = [
                'code' => "000.00.00.H49-{$dayYmd}-00" . ($k + 1) . $d,
                'proc_id' => $procId,
                'name' => $citizenNames[$nameIdx],
                'cccd' => '0150' . str_pad((string)($d * 10 + $k + 50), 8, '0', STR_PAD_RIGHT),
                'phone' => '098' . rand(1000000, 9999999),
                'address' => 'Tổ dân phố số ' . (($k + $d) % 4 + 1) . ', Phường Yên Bái',
                'status' => 'HOAN_THANH',
                'sub_time' => "$dayDate 08:30:00",
                'app_time' => date('Y-m-d 16:30:00', strtotime("$dayDate + 2 days")),
                'comp_time' => "$dayDate 16:00:00",
                'handler' => 'u0000003-0000-0000-0000-000000000003',
                'payment' => 'DA_THANH_TOAN',
                'fee' => $fee,
                'score' => 5,
                'comment' => 'Giải quyết rất nhanh và thuận tiện'
            ];
        }
    }

    $insertApp = $db->prepare('
        INSERT INTO applications (
            id, dossier_code, procedure_id, citizen_name, citizen_id_number, citizen_phone,
            citizen_address, status, submit_channel, submit_date, appointment_date, completed_date,
            current_handler_id, received_by_id, payment_status, payment_method, receipt_number, paid_at,
            satisfaction_score, satisfaction_comment, satisfaction_date, notes
        ) VALUES (
            UUID(), :code, :proc, :name, :cccd, :phone,
            :address, :status, "TRUC_TIEP", :sub_date, :app_date, :comp_date,
            :handler, "u0000002-0000-0000-0000-000000000002", :pay_status, "CHUYEN_KHOAN_QR", :receipt, :paid_at,
            :score, :comment, :sat_date, "Dữ liệu phục vụ demo trực quan"
        )
    ');

    foreach ($additionalApps as $app) {
        $receipt = ($app['payment'] ?? '') === 'DA_THANH_TOAN' ? 'BL-YB-' . date('ymd') . '-' . rand(1000, 9999) : null;
        $paidAt = $receipt ? $app['sub_time'] : null;

        $insertApp->execute([
            ':code' => $app['code'],
            ':proc' => $app['proc_id'],
            ':name' => $app['name'],
            ':cccd' => $app['cccd'],
            ':phone' => $app['phone'],
            ':address' => $app['address'],
            ':status' => $app['status'],
            ':sub_date' => $app['sub_time'],
            ':app_date' => $app['app_time'],
            ':comp_date' => $app['comp_time'] ?? null,
            ':handler' => $app['handler'] ?? null,
            ':pay_status' => $app['payment'] ?? 'CHUA_THANH_TOAN',
            ':receipt' => $receipt,
            ':paid_at' => $paidAt,
            ':score' => $app['score'] ?? null,
            ':comment' => $app['comment'] ?? null,
            ':sat_date' => $app['comp_time'] ?? null
        ]);
    }

    // 7. Nạp danh sách hàng đợi bốc số thứ tự hôm nay cho Kiosk & Màn hình gọi số
    $db->exec("TRUNCATE TABLE queue_tickets");
    $queueSeed = [
        ['ticket_number' => 'A001', 'counter_type' => 'HO_TICH', 'service_name' => 'Đăng ký Khai sinh / Kết hôn', 'citizen_name' => 'Nguyễn Văn An', 'citizen_phone' => '0981234567', 'counter_no' => 1, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 07:45:00", 'called_at' => "$todayStr 08:00:00", 'completed_at' => "$todayStr 08:20:00"],
        ['ticket_number' => 'B001', 'counter_type' => 'CHUNG_THUC', 'service_name' => 'Chứng thực bản sao / Chữ ký', 'citizen_name' => 'Trần Thị Bích', 'citizen_phone' => '0912345678', 'counter_no' => 2, 'status' => 'DA_PHUC_VU', 'created_at' => "$todayStr 08:10:00", 'called_at' => "$todayStr 08:25:00", 'completed_at' => "$todayStr 08:35:00"],
        ['ticket_number' => 'A002', 'counter_type' => 'HO_TICH', 'service_name' => 'Xác nhận tình trạng hôn nhân', 'citizen_name' => 'Phạm Hoàng Cường', 'citizen_phone' => '0972345678', 'counter_no' => 1, 'status' => 'DANG_GOI', 'created_at' => "$todayStr 08:30:00", 'called_at' => "$todayStr 08:45:00", 'completed_at' => null],
        ['ticket_number' => 'B002', 'counter_type' => 'CHUNG_THUC', 'service_name' => 'Chứng thực hợp đồng, giao dịch', 'citizen_name' => 'Lê Thị Dung', 'citizen_phone' => '0963456789', 'counter_no' => 2, 'status' => 'CHO', 'created_at' => "$todayStr 08:50:00", 'called_at' => null, 'completed_at' => null],
        ['ticket_number' => 'C001', 'counter_type' => 'DIA_CHINH', 'service_name' => 'Đăng ký đất đai, nhà ở', 'citizen_name' => 'Vũ Quốc Huy', 'citizen_phone' => '0945678901', 'counter_no' => 3, 'status' => 'CHO', 'created_at' => "$todayStr 09:05:00", 'called_at' => null, 'completed_at' => null],
        ['ticket_number' => 'D001', 'counter_type' => 'LAO_DONG_TBXH', 'service_name' => 'Chính sách Người có công & BTXH', 'citizen_name' => 'Đỗ Thị Lan', 'citizen_phone' => '0935678901', 'counter_no' => 4, 'status' => 'CHO', 'created_at' => "$todayStr 09:15:00", 'called_at' => null, 'completed_at' => null],
    ];

    $insertQueue = $db->prepare('
        INSERT INTO queue_tickets (ticket_number, counter_type, service_name, citizen_name, citizen_phone, counter_no, status, created_at, called_at, completed_at)
        VALUES (:tnum, :ctype, :sname, :cname, :cphone, :cno, :status, :created, :called, :completed)
    ');
    foreach ($queueSeed as $q) {
        $insertQueue->execute([
            ':tnum' => $q['ticket_number'],
            ':ctype' => $q['counter_type'],
            ':sname' => $q['service_name'],
            ':cname' => $q['citizen_name'],
            ':cphone' => $q['citizen_phone'],
            ':cno' => $q['counter_no'],
            ':status' => $q['status'],
            ':created' => $q['created_at'],
            ':called' => $q['called_at'],
            ':completed' => $q['completed_at']
        ]);
    }

    $db->exec('SET FOREIGN_KEY_CHECKS = 1');

    // Thống kê kết quả
    $appCount = (int)$db->query("SELECT COUNT(*) FROM applications")->fetchColumn();
    $overdueCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status NOT IN ('HOAN_THANH', 'TU_CHOI') AND NOW() > appointment_date")->fetchColumn();
    $warningCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status NOT IN ('HOAN_THANH', 'TU_CHOI') AND appointment_date >= NOW() AND TIMESTAMPDIFF(HOUR, NOW(), appointment_date) <= 24")->fetchColumn();
    $todayCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE DATE(submit_date) = CURDATE()")->fetchColumn();
    $complaintCount = (int)$db->query("SELECT COUNT(*) FROM complaints")->fetchColumn();

    return [
        'success' => true,
        'delta_days' => $delta,
        'current_date' => date('Y-m-d H:i:s'),
        'total_applications' => $appCount,
        'today_applications' => $todayCount,
        'overdue_count' => $overdueCount,
        'warning_count' => $warningCount,
        'total_complaints' => $complaintCount,
        'message' => 'Làm mới và trẻ hóa dữ liệu Demo thành công!'
    ];
}

// Nếu gọi trực tiếp từ CLI
if (php_sapi_name() === 'cli') {
    try {
        echo "=== BẮT ĐẦU LÀM MỚI DỮ LIỆU DEMO ===\n";
        $res = refresh_demo_data();
        echo sprintf("Độ lệch ngày: +%d ngày | Ngày hệ thống: %s\n", $res['delta_days'], $res['current_date']);
        echo sprintf("Tổng hồ sơ: %d | Hôm nay: %d | Quá hạn: %d | Sắp đến hạn (<24h): %d\n", $res['total_applications'], $res['today_applications'], $res['overdue_count'], $res['warning_count']);
        echo sprintf("Tổng phản ánh: %d\n", $res['total_complaints']);
        echo "=== HOÀN TẤT ===\n";
    } catch (Throwable $e) {
        echo "LỖI: " . $e->getMessage() . "\n" . $e->getTraceAsString();
        exit(1);
    }
}
