<?php

class CitizenController {
    public function index(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $page = max(1, (int)$request->getQuery('page', 1));
        $pageSize = max(1, min(100, (int)$request->getQuery('pageSize', 10)));
        $offset = ($page - 1) * $pageSize;

        $areaId = $request->getQuery('area_id');
        $residenceType = $request->getQuery('residence_type');
        $search = trim($request->getQuery('search', ''));

        $where = ['1=1'];
        $params = [];

        if (!empty($areaId)) {
            $where[] = 'c.residential_area_id = ?';
            $params[] = $areaId;
        }

        if (!empty($residenceType)) {
            $where[] = 'c.residence_type = ?';
            $params[] = $residenceType;
        }

        if (!empty($search)) {
            $where[] = '(c.cccd_number LIKE ? OR c.full_name LIKE ? OR c.phone_number LIKE ? OR c.household_number LIKE ?)';
            $p = "%$search%";
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
            $params[] = $p;
        }

        $whereSql = implode(' AND ', $where);

        $countStmt = $db->prepare("SELECT COUNT(*) FROM citizens c WHERE $whereSql");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "
            SELECT c.*, a.area_name, a.area_code
            FROM citizens c
            LEFT JOIN residential_areas a ON c.residential_area_id = a.id
            WHERE $whereSql
            ORDER BY c.created_at DESC
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

        // Che mờ CCCD mặc định
        $items = array_map(function ($row) {
            return DataMasking::maskCitizenRecord($row, false);
        }, $items);

        Response::paginated($items, $total, $page, $pageSize, 'Lấy danh sách công dân thành công');
    }

    public function show(Request $request, array $params): void {
        $currentUser = Auth::requireAuth($request);
        $id = $params['id'] ?? '';
        $unmask = $request->getQuery('unmask') === '1';

        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT c.*, a.area_name, a.area_code
            FROM citizens c
            LEFT JOIN residential_areas a ON c.residential_area_id = a.id
            WHERE c.id = ?
        ');
        $stmt->execute([$id]);
        $citizen = $stmt->fetch();

        if (!$citizen) {
            Response::error('Không tìm thấy thông tin công dân', 404);
        }

        if ($unmask) {
            AuditLogger::log('VIEW_UNMASKED_CITIZEN_PROFILE', 'CITIZEN', $id, null, ['cccd' => $citizen['cccd_number']], $currentUser, $request);
        } else {
            $citizen = DataMasking::maskCitizenRecord($citizen, false);
        }

        Response::json($citizen, 200, 'Lấy chi tiết công dân thành công');
    }

    public function searchByCccd(Request $request): void {
        Auth::requireAuth($request);
        $cccd = trim($request->getQuery('cccd', ''));

        if (empty($cccd)) {
            Response::error('Vui lòng nhập số CCCD cần tìm', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            SELECT c.*, a.area_name 
            FROM citizens c 
            LEFT JOIN residential_areas a ON c.residential_area_id = a.id
            WHERE c.cccd_number = ?
        ');
        $stmt->execute([$cccd]);
        $citizen = $stmt->fetch();

        if (!$citizen) {
            Response::error('Chưa có thông tin công dân với số CCCD này trong cơ sở dữ liệu địa phương', 404);
        }

        Response::json($citizen, 200, 'Tìm thấy thông tin công dân');
    }

    public function create(Request $request): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'MOT_CUA', 'CHUYEN_VIEN']);
        $body = $request->getBody();

        $cccd = trim($body['cccd_number'] ?? '');
        $fullName = trim($body['full_name'] ?? '');

        if (empty($cccd) || empty($fullName)) {
            Response::error('Số CCCD và Họ tên công dân là bắt buộc', 400);
        }

        $db = Database::getConnection();
        $check = $db->prepare('SELECT COUNT(*) FROM citizens WHERE cccd_number = ?');
        $check->execute([$cccd]);
        if ((int)$check->fetchColumn() > 0) {
            Response::error('Số CCCD này đã tồn tại trong cơ sở dữ liệu địa phương', 400);
        }

        $stmt = $db->prepare('
            INSERT INTO citizens (
                cccd_number, full_name, date_of_birth, gender, phone_number, email, 
                permanent_address, current_address, residential_area_id, household_number, 
                residence_type, occupation, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $cccd,
            $fullName,
            $body['date_of_birth'] ?? null,
            $body['gender'] ?? 'NAM',
            $body['phone_number'] ?? null,
            $body['email'] ?? null,
            $body['permanent_address'] ?? null,
            $body['current_address'] ?? null,
            $body['residential_area_id'] ?? null,
            $body['household_number'] ?? null,
            $body['residence_type'] ?? 'THUONG_TRU',
            $body['occupation'] ?? null,
            $body['notes'] ?? null
        ]);

        $idStmt = $db->prepare('SELECT id FROM citizens WHERE cccd_number = ?');
        $idStmt->execute([$cccd]);
        $newId = $idStmt->fetchColumn();

        AuditLogger::log('CREATE_CITIZEN', 'CITIZEN', $newId, null, ['cccd' => $cccd, 'name' => $fullName], $currentUser, $request);

        Response::json(['id' => $newId], 201, 'Thêm mới công dân vào quản lý nhân khẩu thành công');
    }

    public function update(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN', 'MOT_CUA', 'CHUYEN_VIEN']);
        $id = $params['id'] ?? '';
        $body = $request->getBody();

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM citizens WHERE id = ?');
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) {
            Response::error('Công dân không tồn tại', 404);
        }

        $update = $db->prepare('
            UPDATE citizens SET
                full_name = ?, date_of_birth = ?, gender = ?, phone_number = ?, email = ?,
                permanent_address = ?, current_address = ?, residential_area_id = ?, 
                household_number = ?, residence_type = ?, occupation = ?, notes = ?
            WHERE id = ?
        ');
        $update->execute([
            $body['full_name'] ?? $old['full_name'],
            $body['date_of_birth'] ?? $old['date_of_birth'],
            $body['gender'] ?? $old['gender'],
            $body['phone_number'] ?? $old['phone_number'],
            $body['email'] ?? $old['email'],
            $body['permanent_address'] ?? $old['permanent_address'],
            $body['current_address'] ?? $old['current_address'],
            $body['residential_area_id'] ?? $old['residential_area_id'],
            $body['household_number'] ?? $old['household_number'],
            $body['residence_type'] ?? $old['residence_type'],
            $body['occupation'] ?? $old['occupation'],
            $body['notes'] ?? $old['notes'],
            $id
        ]);

        AuditLogger::log('UPDATE_CITIZEN', 'CITIZEN', $id, $old, $body, $currentUser, $request);

        Response::json(null, 200, 'Cập nhật thông tin công dân thành công');
    }
}
