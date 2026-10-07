<?php

class AuditController {
    public function index(Request $request): void {
        Auth::requireRoles($request, ['ADMIN', 'LANH_DAO']);
        $db = Database::getConnection();

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(100, (int)$request->getQuery('pageSize', 20)));
        $offset = ($page - 1) * $pageSize;

        $action = $request->getQuery('action');
        $resourceType = $request->getQuery('resource_type');
        $search = trim($request->getQuery('search', ''));

        $where = ['1=1'];
        $params = [];

        if (!empty($action)) {
            $where[] = 'action = ?';
            $params[] = $action;
        }

        if (!empty($resourceType)) {
            $where[] = 'resource_type = ?';
            $params[] = $resourceType;
        }

        if (!empty($search)) {
            $where[] = '(user_name LIKE ? OR resource_id LIKE ? OR ip_address LIKE ?)';
            $p = "%$search%";
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM audit_logs WHERE $whereSql");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT * FROM audit_logs 
            WHERE $whereSql 
            ORDER BY created_at DESC 
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
        $logs = $stmt->fetchAll();

        foreach ($logs as &$log) {
            $log['old_state'] = json_decode($log['old_state'] ?? 'null', true);
            $log['new_state'] = json_decode($log['new_state'] ?? 'null', true);
        }

        Response::paginated($logs, $total, $page, $pageSize, 'Lấy nhật ký kiểm toán thành công');
    }
}
