<?php

class AreaController {
    public function index(Request $request): void {
        Auth::requireAuth($request);
        $db = Database::getConnection();

        $areas = $db->query('
            SELECT a.*, COUNT(c.id) as actual_residents
            FROM residential_areas a
            LEFT JOIN citizens c ON a.id = c.residential_area_id
            GROUP BY a.id
            ORDER BY a.area_code ASC
        ')->fetchAll();

        Response::json($areas, 200, 'Lấy danh sách tổ dân phố thành công');
    }

    public function show(Request $request, array $params): void {
        Auth::requireAuth($request);
        $id = (int)($params['id'] ?? 0);
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM residential_areas WHERE id = ?');
        $stmt->execute([$id]);
        $area = $stmt->fetch();

        if (!$area) {
            Response::error('Tổ dân phố không tồn tại', 404);
        }

        // Lấy danh sách công dân trong tổ
        $citStmt = $db->prepare('SELECT id, cccd_number, full_name, phone_number, permanent_address, household_number, residence_type FROM citizens WHERE residential_area_id = ? ORDER BY full_name ASC');
        $citStmt->execute([$id]);
        $citizens = $citStmt->fetchAll();

        $citizens = array_map(function ($c) {
            return DataMasking::maskCitizenRecord($c, false);
        }, $citizens);

        $area['citizens'] = $citizens;

        Response::json($area, 200, 'Lấy chi tiết tổ dân phố thành công');
    }

    public function create(Request $request): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN']);
        $body = $request->getBody();

        $code = trim($body['area_code'] ?? '');
        $name = trim($body['area_name'] ?? '');

        if (empty($code) || empty($name)) {
            Response::error('Mã và Tên tổ dân phố không được để trống', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO residential_areas (area_code, area_name, area_type, manager_name, manager_phone, total_households, total_residents, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $code,
            $name,
            $body['area_type'] ?? 'TO_DAN_PHO',
            $body['manager_name'] ?? null,
            $body['manager_phone'] ?? null,
            (int)($body['total_households'] ?? 0),
            (int)($body['total_residents'] ?? 0),
            $body['description'] ?? null
        ]);

        $newId = (int)$db->lastInsertId();
        AuditLogger::log('CREATE_RESIDENTIAL_AREA', 'AREA', (string)$newId, null, ['code' => $code, 'name' => $name], $currentUser, $request);

        Response::json(['id' => $newId], 201, 'Tạo tổ dân phố thành công');
    }

    public function update(Request $request, array $params): void {
        $currentUser = Auth::requireRoles($request, ['ADMIN']);
        $id = (int)($params['id'] ?? 0);
        $body = $request->getBody();

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM residential_areas WHERE id = ?');
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) {
            Response::error('Tổ dân phố không tồn tại', 404);
        }

        $update = $db->prepare('
            UPDATE residential_areas SET
                area_code = ?, area_name = ?, area_type = ?, manager_name = ?, manager_phone = ?, 
                total_households = ?, total_residents = ?, description = ?
            WHERE id = ?
        ');
        $update->execute([
            $body['area_code'] ?? $old['area_code'],
            $body['area_name'] ?? $old['area_name'],
            $body['area_type'] ?? $old['area_type'],
            $body['manager_name'] ?? $old['manager_name'],
            $body['manager_phone'] ?? $old['manager_phone'],
            isset($body['total_households']) ? (int)$body['total_households'] : $old['total_households'],
            isset($body['total_residents']) ? (int)$body['total_residents'] : $old['total_residents'],
            $body['description'] ?? $old['description'],
            $id
        ]);

        AuditLogger::log('UPDATE_RESIDENTIAL_AREA', 'AREA', (string)$id, $old, $body, $currentUser, $request);

        Response::json(null, 200, 'Cập nhật tổ dân phố thành công');
    }
}
