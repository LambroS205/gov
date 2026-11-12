<?php

class QueueController {
    /**
     * Công dân lấy số thứ tự tại Kiosk
     */
    public function takeTicket(Request $request): void {
        $counterType = $request->get('counter_type', 'HO_TICH');
        $citizenName = trim($request->get('citizen_name', ''));
        $citizenPhone = trim($request->get('citizen_phone', ''));

        $prefixes = [
            'HO_TICH' => ['prefix' => 'A', 'name' => 'Hộ tịch & Khai sinh / Kết hôn'],
            'CHUNG_THUC' => ['prefix' => 'B', 'name' => 'Chứng thực bản sao & Hợp đồng'],
            'DIA_CHINH' => ['prefix' => 'C', 'name' => 'Địa chính, Nhà đất & Xây dựng'],
            'LAO_DONG_TBXH' => ['prefix' => 'D', 'name' => 'Chính sách xã hội & BTXH'],
            'KHAC' => ['prefix' => 'E', 'name' => 'Thủ tục hành chính khác']
        ];

        if (!isset($prefixes[$counterType])) {
            $counterType = 'HO_TICH';
        }

        $info = $prefixes[$counterType];
        $prefix = $info['prefix'];
        $serviceName = $info['name'];

        $db = Database::getConnection();

        // Tìm số thứ tự lớn nhất hôm nay của phân hệ này
        $stmt = $db->prepare('
            SELECT ticket_number 
            FROM queue_tickets 
            WHERE counter_type = ? AND DATE(created_at) = CURDATE() 
            ORDER BY id DESC 
            LIMIT 1
        ');
        $stmt->execute([$counterType]);
        $lastTicket = $stmt->fetchColumn();

        $nextSeq = 1;
        if ($lastTicket && preg_match('/^[A-Z](\d+)$/', $lastTicket, $matches)) {
            $nextSeq = (int)$matches[1] + 1;
        }

        $ticketNumber = sprintf('%s%03d', $prefix, $nextSeq);

        $insert = $db->prepare('
            INSERT INTO queue_tickets (
                ticket_number, counter_type, service_name, citizen_name, citizen_phone, 
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, "CHO", NOW())
        ');
        $insert->execute([
            $ticketNumber,
            $counterType,
            $serviceName,
            !empty($citizenName) ? $citizenName : null,
            !empty($citizenPhone) ? $citizenPhone : null
        ]);

        $ticketId = $db->lastInsertId();

        // Đếm số người đang chờ trước số này
        $aheadStmt = $db->prepare('
            SELECT COUNT(*) 
            FROM queue_tickets 
            WHERE counter_type = ? AND status = "CHO" AND id < ? AND DATE(created_at) = CURDATE()
        ');
        $aheadStmt->execute([$counterType, $ticketId]);
        $waitingAhead = (int)$aheadStmt->fetchColumn();

        Response::json([
            'id' => (int)$ticketId,
            'ticket_number' => $ticketNumber,
            'counter_type' => $counterType,
            'service_name' => $serviceName,
            'citizen_name' => $citizenName,
            'waiting_ahead' => $waitingAhead,
            'created_at' => date('Y-m-d H:i:s'),
            'estimated_wait_minutes' => ($waitingAhead + 1) * 7
        ], 201, 'Lấy số thứ tự thành công');
    }

    /**
     * Dữ liệu hiển thị màn hình LCD gọi số tại sảnh Một cửa
     */
    public function getDisplay(Request $request): void {
        $db = Database::getConnection();

        // 1. Các số đang được gọi phục vụ tại các quầy
        $calling = $db->query('
            SELECT q.id, q.ticket_number, q.counter_type, q.service_name, q.citizen_name,
                   q.counter_no, q.called_at, u.full_name as handler_name
            FROM queue_tickets q
            LEFT JOIN users u ON q.called_by = u.id
            WHERE q.status = "DANG_GOI" AND DATE(q.created_at) = CURDATE()
            ORDER BY q.called_at DESC
        ')->fetchAll();

        // 2. Thống kê số lượng chờ theo từng lĩnh vực
        $waiting = $db->query('
            SELECT counter_type, COUNT(*) as count
            FROM queue_tickets
            WHERE status = "CHO" AND DATE(created_at) = CURDATE()
            GROUP BY counter_type
        ')->fetchAll();

        $waitingMap = [];
        foreach ($waiting as $w) {
            $waitingMap[$w['counter_type']] = (int)$w['count'];
        }

        // 3. Số vừa được gọi gần nhất (dùng để phát âm thanh thông báo)
        $latestCalled = null;
        if (!empty($calling)) {
            $latestCalled = $calling[0];
        }

        $totalServed = (int)$db->query('
            SELECT COUNT(*) 
            FROM queue_tickets 
            WHERE status = "DA_PHUC_VU" AND DATE(created_at) = CURDATE()
        ')->fetchColumn();

        $totalWaiting = (int)array_sum($waitingMap);

        Response::json([
            'calling' => $calling,
            'latest_called' => $latestCalled,
            'waiting_counts' => $waitingMap,
            'total_waiting' => $totalWaiting,
            'total_served' => $totalServed,
            'server_time' => date('H:i:s d/m/Y')
        ], 200, 'Lấy dữ liệu hiển thị màn hình gọi số thành công');
    }

    /**
     * Cán bộ Một cửa bấm "Gọi số tiếp theo"
     */
    public function callNext(Request $request): void {
        $user = Auth::requireRoles($request, ['ADMIN', 'MOT_CUA', 'CHUYEN_VIEN']);
        $counterNo = (int)$request->get('counter_no', 1);
        if ($counterNo < 1) $counterNo = 1;
        $counterType = $request->get('counter_type', null);

        $db = Database::getConnection();

        // 1. Tự động hoàn thành số trước đó của quầy này nếu đang gọi
        $stmtPrev = $db->prepare('
            UPDATE queue_tickets 
            SET status = "DA_PHUC_VU", completed_at = NOW() 
            WHERE counter_no = ? AND status = "DANG_GOI" AND DATE(created_at) = CURDATE()
        ');
        $stmtPrev->execute([$counterNo]);

        // 2. Tìm số tiếp theo đang chờ
        $sql = 'SELECT id, ticket_number, counter_type, service_name, citizen_name 
                FROM queue_tickets 
                WHERE status = "CHO" AND DATE(created_at) = CURDATE()';
        $params = [];
        if (!empty($counterType)) {
            $sql .= ' AND counter_type = ?';
            $params[] = $counterType;
        }
        $sql .= ' ORDER BY id ASC LIMIT 1';

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $nextTicket = $stmt->fetch();

        if (!$nextTicket) {
            Response::json(null, 200, 'Hiện không có công dân nào đang chờ lấy số');
            return;
        }

        // 3. Cập nhật trạng thái đang gọi
        $update = $db->prepare('
            UPDATE queue_tickets 
            SET status = "DANG_GOI", counter_no = ?, called_by = ?, called_at = NOW() 
            WHERE id = ?
        ');
        $update->execute([$counterNo, $user['id'], $nextTicket['id']]);

        $nextTicket['counter_no'] = $counterNo;
        $nextTicket['called_at'] = date('Y-m-d H:i:s');
        $nextTicket['handler_name'] = $user['full_name'];

        Response::json($nextTicket, 200, sprintf('Đang gọi số %s đến Quầy số %d', $nextTicket['ticket_number'], $counterNo));
    }

    /**
     * Hoàn thành phục vụ phiếu số
     */
    public function completeTicket(Request $request, array $params): void {
        Auth::requireRoles($request, ['ADMIN', 'MOT_CUA', 'CHUYEN_VIEN']);
        $id = (int)($params['id'] ?? 0);

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE queue_tickets SET status = "DA_PHUC_VU", completed_at = NOW() WHERE id = ?');
        $stmt->execute([$id]);

        Response::json(null, 200, 'Đã hoàn thành phục vụ công dân');
    }

    /**
     * Bỏ qua phiếu số (Công dân không có mặt khi gọi)
     */
    public function skipTicket(Request $request, array $params): void {
        Auth::requireRoles($request, ['ADMIN', 'MOT_CUA', 'CHUYEN_VIEN']);
        $id = (int)($params['id'] ?? 0);

        $db = Database::getConnection();
        $stmt = $db->prepare('UPDATE queue_tickets SET status = "BO_QUA", completed_at = NOW() WHERE id = ?');
        $stmt->execute([$id]);

        Response::json(null, 200, 'Đã bỏ qua phiếu số');
    }
}

