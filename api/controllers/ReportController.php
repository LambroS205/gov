<?php

class ReportController {
    public function performance(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        // 1. Thống kê theo cán bộ thụ lý
        $officerStats = $db->query("
            SELECT 
                u.id, u.full_name, u.role, d.dept_name,
                COUNT(a.id) as total_assigned,
                SUM(CASE WHEN a.status = 'HOAN_THANH' THEN 1 ELSE 0 END) as total_completed,
                SUM(CASE WHEN a.status = 'DANG_XU_LY' THEN 1 ELSE 0 END) as currently_processing,
                SUM(CASE WHEN a.status = 'HOAN_THANH' AND a.completed_date <= a.appointment_date THEN 1 ELSE 0 END) as on_time_count,
                SUM(CASE WHEN a.status = 'HOAN_THANH' AND a.completed_date > a.appointment_date THEN 1 ELSE 0 END) as overdue_count
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN applications a ON a.current_handler_id = u.id
            WHERE u.role IN ('CHUYEN_VIEN', 'MOT_CUA', 'LANH_DAO')
            GROUP BY u.id
            ORDER BY total_assigned DESC
        ")->fetchAll();

        foreach ($officerStats as &$stat) {
            $comp = (int)$stat['total_completed'];
            $onTime = (int)$stat['on_time_count'];
            $stat['on_time_rate'] = $comp > 0 ? round(($onTime / $comp) * 100, 1) : 100.0;
        }

        // 2. Thống kê theo phòng ban
        $deptStats = $db->query("
            SELECT 
                d.dept_name,
                COUNT(a.id) as total_dossiers,
                SUM(CASE WHEN a.status = 'HOAN_THANH' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN a.status = 'HOAN_THANH' AND a.completed_date <= a.appointment_date THEN 1 ELSE 0 END) as on_time
            FROM departments d
            LEFT JOIN users u ON d.id = u.department_id
            LEFT JOIN applications a ON a.current_handler_id = u.id
            GROUP BY d.id
        ")->fetchAll();

        Response::json([
            'officers' => $officerStats,
            'departments' => $deptStats
        ], 200, 'Lấy báo cáo hiệu suất thành công');
    }

    public function procedures(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $stats = $db->query('
            SELECT 
                p.id, p.proc_code, p.proc_name, p.field_type, p.fee_amount, p.processing_days,
                COUNT(a.id) as total_applications,
                SUM(CASE WHEN a.status = \'HOAN_THANH\' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN a.status = \'HOAN_THANH\' THEN p.fee_amount ELSE 0 END) as total_revenue
            FROM administrative_procedures p
            LEFT JOIN applications a ON p.id = a.procedure_id
            GROUP BY p.id
            ORDER BY total_applications DESC
        ')->fetchAll();

        Response::json($stats, 200, 'Lấy thống kê theo thủ tục thành công');
    }

    public function exportCsv(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $stmt = $db->query('
            SELECT 
                a.dossier_code, a.citizen_name, a.citizen_id_number, a.citizen_phone,
                p.proc_name, a.status, a.submit_channel, a.submit_date, a.appointment_date,
                a.completed_date, h.full_name as handler_name, p.fee_amount
            FROM applications a
            JOIN administrative_procedures p ON a.procedure_id = p.id
            LEFT JOIN users h ON a.current_handler_id = h.id
            ORDER BY a.submit_date DESC
        ');
        $rows = $stmt->fetchAll();

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="BaoCao_HoSo_' . date('Ymd_His') . '.csv"');

        // Ghi UTF-8 BOM để Excel mở không bị lỗi tiếng Việt
        echo "\xEF\xBB\xBF";

        $output = fopen('php://output', 'w');
        fputcsv($output, [
            'Mã hồ sơ', 'Tên công dân', 'Số CCCD', 'Số điện thoại',
            'Thủ tục hành chính', 'Trạng thái', 'Kênh tiếp nhận',
            'Ngày tiếp nhận', 'Hạn trả', 'Ngày hoàn thành', 'Cán bộ thụ lý', 'Lệ phí (VNĐ)'
        ]);

        foreach ($rows as $row) {
            fputcsv($output, [
                $row['dossier_code'],
                $row['citizen_name'],
                $row['citizen_id_number'],
                $row['citizen_phone'],
                $row['proc_name'],
                $row['status'],
                $row['submit_channel'],
                $row['submit_date'],
                $row['appointment_date'],
                $row['completed_date'],
                $row['handler_name'],
                number_format((float)$row['fee_amount'], 0, ',', '.')
            ]);
        }
        fclose($output);
        exit;
    }
}
