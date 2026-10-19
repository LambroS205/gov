<?php

class NotificationController {
    /**
     * Danh sách nhật ký thông báo SMS / Zalo OA
     */
    public function index(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(100, (int)$request->getQuery('pageSize', 15)));
        $offset = ($page - 1) * $pageSize;

        $channel = $request->getQuery('channel');
        $search = trim($request->getQuery('search', ''));

        $where = ['1=1'];
        $params = [];

        if (!empty($channel)) {
            $where[] = 'channel = ?';
            $params[] = $channel;
        }

        if (!empty($search)) {
            $where[] = '(recipient_phone LIKE ? OR recipient_name LIKE ? OR message LIKE ? OR subject LIKE ?)';
            $p = "%$search%";
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM notifications WHERE $whereSql");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT *
            FROM notifications
            WHERE $whereSql
            ORDER BY sent_at DESC, created_at DESC
            LIMIT ? OFFSET ?
        ";

        $stmt = $db->prepare($sql);
        $i = 1;
        foreach ($params as $param) {
            $stmt->bindValue($i++, $param);
        }
        $stmt->bindValue($i++, $pageSize, PDO::PARAM_INT);
        $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll();

        Response::paginated($items, $total, $page, $pageSize, 'Lấy danh sách thông báo thành công');
    }

    /**
     * Thống kê gửi tin SMS / Zalo
     */
    public function stats(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $byChannel = $db->query('
            SELECT channel, COUNT(*) as count 
            FROM notifications 
            GROUP BY channel
        ')->fetchAll(PDO::FETCH_KEY_PAIR);

        $totalSent = (int)$db->query('SELECT COUNT(*) FROM notifications WHERE is_sent = 1')->fetchColumn();
        $totalToday = (int)$db->query('SELECT COUNT(*) FROM notifications WHERE DATE(sent_at) = CURDATE()')->fetchColumn();

        Response::json([
            'total_sent' => $totalSent,
            'total_today' => $totalToday,
            'sms_count' => (int)($byChannel['SMS'] ?? 0),
            'zalo_count' => (int)($byChannel['ZALO'] ?? 0),
            'system_count' => (int)($byChannel['SYSTEM'] ?? 0),
            'email_count' => (int)($byChannel['EMAIL'] ?? 0)
        ], 200, 'Lấy thống kê thông báo thành công');
    }
}
