<?php

class CitizenAccountController {
    /**
     * Danh sách tài khoản công dân (dành cho Cán bộ Quản trị & Một cửa)
     */
    public function index(Request $request): void {
        Auth::requireRoles($request, ['ADMIN', 'MOT_CUA']);
        $db = Database::getConnection();

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(100, (int)$request->getQuery('pageSize', 10)));
        $offset = ($page - 1) * $pageSize;

        $search = trim($request->getQuery('search', ''));
        $status = $request->getQuery('status'); // '1' hoặc '0'

        $where = ['1=1'];
        $params = [];

        if ($status !== null && $status !== '') {
            $where[] = 'ca.is_active = ?';
            $params[] = (int)$status;
        }

        if (!empty($search)) {
            $where[] = '(ca.full_name LIKE ? OR ca.cccd_number LIKE ? OR ca.phone_number LIKE ? OR ca.email LIKE ?)';
            $p = "%$search%";
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM citizen_accounts ca WHERE $whereSql");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT 
                ca.id, ca.cccd_number, ca.phone_number, ca.full_name, ca.email, 
                ca.date_of_birth, ca.gender, ca.address, ca.phone_verified_at,
                ca.is_active, ca.failed_login_count, ca.locked_until, ca.last_login_at, ca.created_at,
                (SELECT COUNT(*) FROM applications a WHERE a.citizen_account_id = ca.id OR a.citizen_id_number = ca.cccd_number) as total_applications,
                (SELECT COUNT(*) FROM complaints c WHERE c.citizen_account_id = ca.id OR c.citizen_cccd = ca.cccd_number) as total_complaints
            FROM citizen_accounts ca
            WHERE $whereSql
            ORDER BY ca.created_at DESC
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

        // Che bớt CCCD và SĐT theo tiêu chuẩn an toàn bảo mật
        foreach ($items as &$item) {
            $item['cccd_masked'] = CitizenValidator::maskCccd($item['cccd_number']);
            $item['phone_masked'] = CitizenValidator::maskPhone($item['phone_number']);
        }

        Response::paginated($items, $total, $page, $pageSize, 'Lấy danh sách tài khoản công dân thành công');
    }

    /**
     * Chi tiết tài khoản công dân
     */
    public function show(Request $request, array $params): void {
        Auth::requireRoles($request, ['ADMIN', 'MOT_CUA']);
        $id = $params['id'] ?? '';
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT 
                ca.*, 
                c.household_number, c.residence_type, c.permanent_address as official_address,
                (SELECT COUNT(*) FROM applications a WHERE a.citizen_account_id = ca.id OR a.citizen_id_number = ca.cccd_number) as total_applications,
                (SELECT COUNT(*) FROM complaints c WHERE c.citizen_account_id = ca.id OR c.citizen_cccd = ca.cccd_number) as total_complaints
            FROM citizen_accounts ca
            LEFT JOIN citizens c ON ca.citizen_id = c.id
            WHERE ca.id = ?
        ');
        $stmt->execute([$id]);
        $item = $stmt->fetch();

        if (!$item) {
            Response::error('Tài khoản công dân không tồn tại', 404);
        }

        unset($item['password_hash']);
        $item['cccd_masked'] = CitizenValidator::maskCccd($item['cccd_number']);
        $item['phone_masked'] = CitizenValidator::maskPhone($item['phone_number']);

        Response::json($item, 200, 'Lấy chi tiết tài khoản công dân thành công');
    }

    /**
     * Khóa hoặc Mở khóa tài khoản công dân
     */
    public function updateStatus(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'MOT_CUA']);
        $id = $params['id'] ?? '';
        $isActive = (int)$request->get('is_active', 1);

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, full_name, cccd_number, is_active FROM citizen_accounts WHERE id = ?');
        $stmt->execute([$id]);
        $account = $stmt->fetch();

        if (!$account) {
            Response::error('Tài khoản công dân không tồn tại', 404);
        }

        if ($isActive) {
            // Mở khóa: xóa luôn số lần sai và thời gian khóa tạm
            $update = $db->prepare('UPDATE citizen_accounts SET is_active = 1, failed_login_count = 0, locked_until = NULL WHERE id = ?');
            $update->execute([$id]);
            $action = 'UNLOCK_CITIZEN_ACCOUNT';
            $msg = 'Mở khóa tài khoản công dân thành công';
        } else {
            $update = $db->prepare('UPDATE citizen_accounts SET is_active = 0 WHERE id = ?');
            $update->execute([$id]);
            $action = 'LOCK_CITIZEN_ACCOUNT';
            $msg = 'Tạm khóa tài khoản công dân thành công';
        }

        AuditLogger::log($action, 'CITIZEN_ACCOUNT', $id, [
            'is_active' => $account['is_active']
        ], [
            'is_active' => $isActive,
            'full_name' => $account['full_name'],
            'cccd' => CitizenValidator::maskCccd($account['cccd_number'])
        ], $currentUser, $request);

        Response::json(null, 200, $msg);
    }
}
