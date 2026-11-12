<?php

class DashboardController {
    public function getStats(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        // 1. Gộp toàn bộ chỉ số tổng hợp trên bảng applications thành 1 câu truy vấn điều kiện duy nhất
        $appAggregates = $db->query("
            SELECT 
                COUNT(*) as total_apps,
                SUM(CASE WHEN DATE(submit_date) = CURDATE() THEN 1 ELSE 0 END) as today_received,
                SUM(CASE WHEN status = 'HOAN_THANH' AND MONTH(completed_date) = MONTH(CURDATE()) AND YEAR(completed_date) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as month_completed,
                SUM(CASE WHEN status = 'HOAN_THANH' THEN 1 ELSE 0 END) as total_done,
                SUM(CASE WHEN status = 'HOAN_THANH' AND completed_date < appointment_date THEN 1 ELSE 0 END) as early_done,
                SUM(CASE WHEN status = 'HOAN_THANH' AND completed_date <= appointment_date THEN 1 ELSE 0 END) as on_time_done,
                SUM(CASE WHEN submit_channel = 'TRUC_TUYEN' THEN 1 ELSE 0 END) as online_apps,
                COUNT(satisfaction_score) as total_ratings,
                COALESCE(AVG(satisfaction_score), 5.0) as avg_score,
                SUM(CASE WHEN satisfaction_score >= 4 THEN 1 ELSE 0 END) as satisfied_count,
                SUM(CASE WHEN payment_status = 'DA_THANH_TOAN' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN payment_status = 'CHUA_THANH_TOAN' AND status NOT IN ('HOAN_THANH', 'TU_CHOI') THEN 1 ELSE 0 END) as unpaid_count,
                SUM(CASE WHEN status NOT IN ('HOAN_THANH', 'TU_CHOI') AND NOW() > appointment_date THEN 1 ELSE 0 END) as overdue_count,
                SUM(CASE WHEN status NOT IN ('HOAN_THANH', 'TU_CHOI') AND appointment_date >= NOW() AND TIMESTAMPDIFF(HOUR, NOW(), appointment_date) <= 24 THEN 1 ELSE 0 END) as warning_count
            FROM applications
        ")->fetch();

        // 2. Thống kê số lượng theo từng trạng thái hồ sơ (1 query GROUP BY)
        $statusCounts = $db->query('
            SELECT status, COUNT(*) as count 
            FROM applications 
            GROUP BY status
        ')->fetchAll(PDO::FETCH_KEY_PAIR);

        $totalDone = (int)($appAggregates['total_done'] ?? 0);
        $onTimeRate = $totalDone > 0 ? round(((int)$appAggregates['on_time_done'] / $totalDone) * 100, 1) : 100.0;
        $earlyRate = $totalDone > 0 ? round(((int)$appAggregates['early_done'] / $totalDone) * 100, 1) : 0;
        $totalApps = (int)($appAggregates['total_apps'] ?? 0);
        $onlineRate = $totalApps > 0 ? round(((int)$appAggregates['online_apps'] / $totalApps) * 100, 1) : 0;
        $totalRatings = (int)($appAggregates['total_ratings'] ?? 0);
        $satisfiedRate = $totalRatings > 0 ? round(((int)$appAggregates['satisfied_count'] / $totalRatings) * 100, 1) : 100.0;

        // 3. Thống kê dân cư & tổ dân phố (1 query tổng hợp)
        $demographics = $db->query('
            SELECT 
                (SELECT COUNT(*) FROM citizens) as total_citizens,
                (SELECT COALESCE(SUM(total_households), 0) FROM residential_areas) as total_households,
                (SELECT COUNT(*) FROM residential_areas) as total_areas
        ')->fetch();

        // 4. Thống kê phản ánh kiến nghị (1 query GROUP BY)
        $complaintStats = $db->query('
            SELECT status, COUNT(*) as count 
            FROM complaints 
            GROUP BY status
        ')->fetchAll(PDO::FETCH_KEY_PAIR);

        // 5. Tổng phí/lệ phí thu được
        $totalFee = (float)$db->query("
            SELECT COALESCE(SUM(p.fee_amount), 0)
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            WHERE a.payment_status = 'DA_THANH_TOAN'
        ")->fetchColumn();

        // 6. Top 5 hồ sơ sắp đến hạn hoặc quá hạn cần xử lý gấp
        $alertItems = $db->query("
            SELECT 
                a.id, a.dossier_code, a.citizen_name, a.appointment_date, a.status,
                p.proc_name, u.full_name as handler_name,
                ROUND(TIMESTAMPDIFF(MINUTE, NOW(), a.appointment_date) / 60, 1) as remaining_hours
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            LEFT JOIN users u ON a.current_handler_id = u.id
            WHERE a.status NOT IN ('HOAN_THANH', 'TU_CHOI') AND TIMESTAMPDIFF(HOUR, NOW(), a.appointment_date) <= 48
            ORDER BY a.appointment_date ASC
            LIMIT 5
        ")->fetchAll();

        Response::json([
            'applications' => [
                'total_today' => (int)($appAggregates['today_received'] ?? 0),
                'total_month_completed' => (int)($appAggregates['month_completed'] ?? 0),
                'on_time_rate' => (float)$onTimeRate,
                'early_rate' => (float)$earlyRate,
                'online_rate' => (float)$onlineRate,
                'cho_tiep_nhan' => (int)($statusCounts['CHO_TIEP_NHAN'] ?? 0),
                'dang_xu_ly' => (int)($statusCounts['DANG_XU_LY'] ?? 0),
                'cho_ky_duyet' => (int)($statusCounts['CHO_KY_DUYET'] ?? 0),
                'da_ky_so' => (int)($statusCounts['DA_KY_SO'] ?? 0),
                'hoan_thanh' => (int)($statusCounts['HOAN_THANH'] ?? 0),
                'tra_lai' => (int)($statusCounts['TRA_LAI'] ?? 0),
                'total_active' => (int)(($statusCounts['CHO_TIEP_NHAN'] ?? 0) + ($statusCounts['DANG_XU_LY'] ?? 0) + ($statusCounts['CHO_KY_DUYET'] ?? 0) + ($statusCounts['DA_KY_SO'] ?? 0))
            ],
            'sla_alerts' => [
                'overdue_count' => (int)($appAggregates['overdue_count'] ?? 0),
                'warning_count' => (int)($appAggregates['warning_count'] ?? 0),
                'items' => $alertItems
            ],
            'csat' => [
                'average_score' => round((float)$appAggregates['avg_score'], 1),
                'total_ratings' => $totalRatings,
                'satisfied_rate' => $satisfiedRate
            ],
            'citizens' => [
                'total_citizens' => (int)($demographics['total_citizens'] ?? 0),
                'total_households' => (int)($demographics['total_households'] ?? 0),
                'total_areas' => (int)($demographics['total_areas'] ?? 0)
            ],
            'complaints' => [
                'moi' => (int)($complaintStats['MOI'] ?? 0),
                'dang_xu_ly' => (int)($complaintStats['DANG_XU_LY'] ?? 0),
                'da_xu_ly' => (int)($complaintStats['DA_XU_LY'] ?? 0),
                'total' => (int)array_sum($complaintStats)
            ],
            'finance' => [
                'total_fee_collected' => $totalFee,
                'paid_count' => (int)($appAggregates['paid_count'] ?? 0),
                'unpaid_count' => (int)($appAggregates['unpaid_count'] ?? 0)
            ]
        ], 200, 'Lấy thống kê tổng quan thành công');
    }

    public function getCharts(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        // 1. Phân bổ hồ sơ theo lĩnh vực TTHC
        $byField = $db->query('
            SELECT p.field_type, COUNT(a.id) as count
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            GROUP BY p.field_type
        ')->fetchAll();

        $fieldNames = [
            'HO_TICH' => 'Hộ tịch',
            'CHUNG_THUC' => 'Chứng thực',
            'DIA_CHINH' => 'Địa chính - Xây dựng',
            'LAO_DONG_TBXH' => 'Lao động - TB&XH',
            'TU_PHAP' => 'Tư pháp khác',
            'KHAC' => 'Khác'
        ];
        $fieldChart = array_map(function ($item) use ($fieldNames) {
            return [
                'field' => $fieldNames[$item['field_type']] ?? $item['field_type'],
                'field_key' => $item['field_type'],
                'count' => (int)$item['count']
            ];
        }, $byField);

        // 2. Xu hướng tiếp nhận trong 7 ngày gần nhất (Tối ưu: 2 truy vấn GROUP BY thay vì 14 truy vấn N+1)
        $startDate = date('Y-m-d 00:00:00', strtotime('-6 days'));

        $stmtReceived = $db->prepare('
            SELECT DATE(submit_date) as dt, COUNT(*) as cnt
            FROM applications
            WHERE submit_date >= ?
            GROUP BY DATE(submit_date)
        ');
        $stmtReceived->execute([$startDate]);
        $receivedMap = $stmtReceived->fetchAll(PDO::FETCH_KEY_PAIR);

        $stmtCompleted = $db->prepare("
            SELECT DATE(completed_date) as dt, COUNT(*) as cnt
            FROM applications
            WHERE status = 'HOAN_THANH' AND completed_date >= ?
            GROUP BY DATE(completed_date)
        ");
        $stmtCompleted->execute([$startDate]);
        $completedMap = $stmtCompleted->fetchAll(PDO::FETCH_KEY_PAIR);

        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $displayDate = date('d/m', strtotime("-$i days"));
            $trends[] = [
                'date' => $displayDate,
                'full_date' => $date,
                'tiep_nhan' => (int)($receivedMap[$date] ?? 0),
                'hoan_thanh' => (int)($completedMap[$date] ?? 0)
            ];
        }

        // 3. Phân bổ phản ánh kiến nghị theo chuyên mục
        $complaintCategories = $db->query('
            SELECT category, COUNT(*) as count 
            FROM complaints 
            GROUP BY category
        ')->fetchAll();

        $catNames = [
            'RAC_THAI' => 'Rác thải sinh hoạt',
            'LAN_CHIEM' => 'Lấn chiếm vỉa hè, lòng đường',
            'AN_NINH' => 'An ninh trật tự',
            'DIEN_NUOC' => 'Điện nước công cộng',
            'GIAO_THONG' => 'An toàn giao thông',
            'MOI_TRUONG' => 'Ô nhiễm môi trường',
            'KHAC' => 'Khác'
        ];
        $complaintChart = array_map(function ($item) use ($catNames) {
            return [
                'category' => $catNames[$item['category']] ?? $item['category'],
                'count' => (int)$item['count']
            ];
        }, $complaintCategories);

        Response::json([
            'field_distribution' => $fieldChart,
            'weekly_trends' => $trends,
            'complaint_categories' => $complaintChart
        ], 200, 'Lấy dữ liệu biểu đồ thành công');
    }

    /**
     * Dữ liệu Bảng điện tử Công khai dành cho Màn hình TV sảnh Một cửa (/cong-khai)
     * Công khai 100%, tuân thủ che mờ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP)
     */
    public function publicBoard(Request $request): void {
        $db = Database::getConnection();

        // 1. Chỉ số tổng hợp (Gộp thành 1 truy vấn duy nhất trên applications)
        $aggregates = $db->query("
            SELECT 
                SUM(CASE WHEN DATE(submit_date) = CURDATE() THEN 1 ELSE 0 END) as today_received,
                SUM(CASE WHEN status = 'HOAN_THANH' AND DATE(completed_date) = CURDATE() THEN 1 ELSE 0 END) as today_completed,
                SUM(CASE WHEN status = 'HOAN_THANH' AND MONTH(completed_date) = MONTH(CURDATE()) AND YEAR(completed_date) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as month_completed,
                SUM(CASE WHEN status NOT IN ('HOAN_THANH', 'TU_CHOI') THEN 1 ELSE 0 END) as active_count,
                SUM(CASE WHEN status = 'HOAN_THANH' THEN 1 ELSE 0 END) as total_done,
                SUM(CASE WHEN status = 'HOAN_THANH' AND completed_date <= appointment_date THEN 1 ELSE 0 END) as on_time_done,
                COALESCE(AVG(satisfaction_score), 5.0) as csat_score
            FROM applications
        ")->fetch();

        $totalDone = (int)($aggregates['total_done'] ?? 0);
        $onTimeRate = $totalDone > 0 ? round(((int)$aggregates['on_time_done'] / $totalDone) * 100, 1) : 100.0;

        // 2. Danh sách 10 hồ sơ vừa hoàn thành hoặc đang xử lý gần nhất (đã che tên)
        $recentApps = $db->query("
            SELECT a.dossier_code, a.citizen_name, a.status, a.submit_date, a.appointment_date, a.completed_date,
                   p.proc_name, p.field_type
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            ORDER BY a.updated_at DESC
            LIMIT 10
        ")->fetchAll();

        $maskedApps = array_map(function ($app) {
            return [
                'dossier_code' => $app['dossier_code'],
                'proc_name' => $app['proc_name'],
                'field_type' => $app['field_type'],
                'citizen_name_masked' => DataMasking::maskName($app['citizen_name']),
                'status' => $app['status'],
                'submit_date' => $app['submit_date'],
                'appointment_date' => $app['appointment_date'],
                'completed_date' => $app['completed_date'],
            ];
        }, $recentApps);

        // 3. Số đang gọi phục vụ tại các quầy
        $activeTickets = $db->query("
            SELECT counter_no, ticket_number, service_name, citizen_name, called_at
            FROM queue_tickets
            WHERE status = 'DANG_GOI' AND DATE(created_at) = CURDATE()
            ORDER BY counter_no ASC
        ")->fetchAll();

        $maskedTickets = array_map(function ($t) {
            return [
                'counter_no' => (int)$t['counter_no'],
                'ticket_number' => $t['ticket_number'],
                'service_name' => $t['service_name'],
                'citizen_name_masked' => DataMasking::maskName($t['citizen_name']),
                'called_at' => $t['called_at']
            ];
        }, $activeTickets);

        // 4. Số lượng chờ theo quầy
        $waitingTotal = (int)$db->query("SELECT COUNT(*) FROM queue_tickets WHERE status = 'CHO' AND DATE(created_at) = CURDATE()")->fetchColumn();

        Response::json([
            'unit_name' => 'ỦY BAN NHÂN DÂN PHƯỜNG YÊN BÁI',
            'board_title' => 'BẢNG ĐIỆN TỬ CÔNG KHAI TIẾN ĐỘ THỦ TỤC HÀNH CHÍNH & KẾT QUẢ GIẢI QUYẾT',
            'server_time' => date('H:i:s'),
            'server_date' => date('d/m/Y'),
            'metrics' => [
                'today_received' => (int)($aggregates['today_received'] ?? 0),
                'today_completed' => (int)($aggregates['today_completed'] ?? 0),
                'month_completed' => (int)($aggregates['month_completed'] ?? 0),
                'active_count' => (int)($aggregates['active_count'] ?? 0),
                'on_time_rate' => $onTimeRate,
                'csat_score' => round((float)($aggregates['csat_score'] ?? 5.0), 1),
                'waiting_queue' => $waitingTotal
            ],
            'recent_dossiers' => $maskedApps,
            'active_counters' => $maskedTickets,
            'announcement' => 'Chào mừng quý công dân đến liên hệ giải quyết TTHC tại UBND Phường Yên Bái. Mọi thắc mắc hoặc phản ánh vui lòng quét mã QR hoặc liên hệ hotline: 0216.3852.xxx'
        ], 200, 'Lấy dữ liệu Bảng công khai thành công');
    }
}
