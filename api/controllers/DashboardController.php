<?php

class DashboardController {
    public function getStats(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        // 1. Thống kê hồ sơ theo trạng thái
        $statusCounts = $db->query('
            SELECT status, COUNT(*) as count 
            FROM applications 
            GROUP BY status
        ')->fetchAll(PDO::FETCH_KEY_PAIR);

        // 2. Tổng hồ sơ tiếp nhận hôm nay
        $todayReceived = $db->query("
            SELECT COUNT(*) 
            FROM applications 
            WHERE DATE(submit_date) = CURDATE()
        ")->fetchColumn();

        // 3. Tổng hồ sơ hoàn thành trong tháng
        $monthCompleted = $db->query("
            SELECT COUNT(*) 
            FROM applications 
            WHERE status = 'HOAN_THANH' AND MONTH(completed_date) = MONTH(CURDATE()) AND YEAR(completed_date) = YEAR(CURDATE())
        ")->fetchColumn();

        // 4. Tỉ lệ hồ sơ giải quyết đúng hạn (%)
        $onTimeData = $db->query("
            SELECT 
                COUNT(*) as total_finished,
                SUM(CASE WHEN completed_date <= appointment_date THEN 1 ELSE 0 END) as on_time
            FROM applications
            WHERE status = 'HOAN_THANH'
        ")->fetch();

        $onTimeRate = 100.0;
        if (!empty($onTimeData['total_finished']) && (int)$onTimeData['total_finished'] > 0) {
            $onTimeRate = round(($onTimeData['on_time'] / $onTimeData['total_finished']) * 100, 1);
        }

        // 5. Thống kê dân cư & tổ dân phố
        $totalCitizens = $db->query('SELECT COUNT(*) FROM citizens')->fetchColumn();
        $totalHouseholds = $db->query('SELECT SUM(total_households) FROM residential_areas')->fetchColumn() ?: 0;
        $totalAreas = $db->query('SELECT COUNT(*) FROM residential_areas')->fetchColumn();

        // 6. Thống kê phản ánh kiến nghị
        $complaintStats = $db->query('
            SELECT status, COUNT(*) as count 
            FROM complaints 
            GROUP BY status
        ')->fetchAll(PDO::FETCH_KEY_PAIR);

        // 7. Thống kê theo chuẩn Quyết định 766/QĐ-TTg
        // a. Tỷ lệ trực tuyến
        $totalApps = (int)$db->query("SELECT COUNT(*) FROM applications")->fetchColumn();
        $onlineApps = (int)$db->query("SELECT COUNT(*) FROM applications WHERE submit_channel = 'TRUC_TUYEN'")->fetchColumn();
        $onlineRate = $totalApps > 0 ? round(($onlineApps / $totalApps) * 100, 1) : 0;

        // b. Tỷ lệ trước hạn & đúng hạn
        $finishedDetails = $db->query("
            SELECT 
                COUNT(*) as total_done,
                SUM(CASE WHEN completed_date < appointment_date THEN 1 ELSE 0 END) as early_done,
                SUM(CASE WHEN completed_date <= appointment_date THEN 1 ELSE 0 END) as on_time_done
            FROM applications 
            WHERE status = 'HOAN_THANH'
        ")->fetch();
        $totalDone = (int)($finishedDetails['total_done'] ?? 0);
        $earlyRate = $totalDone > 0 ? round(((int)$finishedDetails['early_done'] / $totalDone) * 100, 1) : 0;

        // c. Đánh giá hài lòng CSAT
        $csatStats = $db->query("
            SELECT 
                COUNT(*) as total_ratings,
                AVG(satisfaction_score) as avg_score,
                SUM(CASE WHEN satisfaction_score >= 4 THEN 1 ELSE 0 END) as satisfied_count
            FROM applications 
            WHERE satisfaction_score IS NOT NULL
        ")->fetch();
        $totalRatings = (int)($csatStats['total_ratings'] ?? 0);
        $avgScore = $totalRatings > 0 ? round((float)$csatStats['avg_score'], 1) : 5.0;
        $satisfiedRate = $totalRatings > 0 ? round(((int)$csatStats['satisfied_count'] / $totalRatings) * 100, 1) : 100.0;

        // d. Thu phí & Lệ phí
        $paidCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE payment_status = 'DA_THANH_TOAN'")->fetchColumn();
        $unpaidCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE payment_status = 'CHUA_THANH_TOAN' AND status NOT IN ('HOAN_THANH', 'TU_CHOI')")->fetchColumn();
        $totalFee = $db->query("
            SELECT COALESCE(SUM(p.fee_amount), 0)
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            WHERE a.payment_status = 'DA_THANH_TOAN'
        ")->fetchColumn() ?: 0;

        // e. Cảnh báo hạn xử lý SLA (Traffic Light)
        $overdueCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status NOT IN ('HOAN_THANH', 'TU_CHOI') AND NOW() > appointment_date")->fetchColumn();
        $warningCount = (int)$db->query("SELECT COUNT(*) FROM applications WHERE status NOT IN ('HOAN_THANH', 'TU_CHOI') AND appointment_date >= NOW() AND TIMESTAMPDIFF(HOUR, NOW(), appointment_date) <= 24")->fetchColumn();

        // Top 5 hồ sơ sắp đến hạn hoặc quá hạn cần xử lý gấp
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
                'total_today' => (int)$todayReceived,
                'total_month_completed' => (int)$monthCompleted,
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
                'overdue_count' => $overdueCount,
                'warning_count' => $warningCount,
                'items' => $alertItems
            ],
            'csat' => [
                'average_score' => $avgScore,
                'total_ratings' => $totalRatings,
                'satisfied_rate' => $satisfiedRate
            ],
            'citizens' => [
                'total_citizens' => (int)$totalCitizens,
                'total_households' => (int)$totalHouseholds,
                'total_areas' => (int)$totalAreas
            ],
            'complaints' => [
                'moi' => (int)($complaintStats['MOI'] ?? 0),
                'dang_xu_ly' => (int)($complaintStats['DANG_XU_LY'] ?? 0),
                'da_xu_ly' => (int)($complaintStats['DA_XU_LY'] ?? 0),
                'total' => (int)array_sum($complaintStats)
            ],
            'finance' => [
                'total_fee_collected' => (float)$totalFee,
                'paid_count' => $paidCount,
                'unpaid_count' => $unpaidCount
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

        // 2. Xu hướng tiếp nhận trong 7 ngày gần nhất
        $trends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $displayDate = date('d/m', strtotime("-$i days"));

            $stmt = $db->prepare('SELECT COUNT(*) FROM applications WHERE DATE(submit_date) = ?');
            $stmt->execute([$date]);
            $received = (int)$stmt->fetchColumn();

            $stmt2 = $db->prepare("SELECT COUNT(*) FROM applications WHERE status = 'HOAN_THANH' AND DATE(completed_date) = ?");
            $stmt2->execute([$date]);
            $completed = (int)$stmt2->fetchColumn();

            $trends[] = [
                'date' => $displayDate,
                'full_date' => $date,
                'tiep_nhan' => $received,
                'hoan_thanh' => $completed
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
}
